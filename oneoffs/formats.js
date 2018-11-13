'use strict';

// formats list begins here
let Formats = [
  {
    /**
      * Battle Arena format by mathfreak231
      * Version 0.0 alpha. Not all functionality is present.
      *
      * This is a format based on the Battle Arena from the Gen 3 Battle Frontier.
      * It is exclusively a single battle format. Do not try to run this in
      * doubles because it will not work as expected.
      *
      * Summary: Pokemon are pitted against each other for up to 3 turns. If
      * neither faints in these 3 turns, one is chosen to faint based on
      * performance in 3 categories.
      * Mind: Offensive style (choosing attacking moves)
      * Skill: Accuracy (using moves successfully)
      * Body: Not losing HP
      * The pokemon that won the most categories survives, and the other faints.
      * If it's a tie, both faint.
      *
      * Trainers cannot switch on their normal turns, and they must send out Pokemon
      * in the order designated before the battle (in Team Preview or Teambuilder).
      *
      * Mind is scored in the following manner: Each turn, look at the Pokemon's
      * move choice.
      * It gets -1 if it's any stalling move such as Protect, or Fake Out.
      * It gets +0 if it's any other status move, Counter, Mirror Coat, Bide, or Metal Burst.
      * It gets +1 if it's any other attacking move.
      * Most points at the end of 3 turns wins the category.
      *
      * Skill is scored in the following manner: Each turn, look at whether or not
      * the Pokemon's move succeeded. "Succeeded" is defined mostly in the same way
      * as it is for Stomping Tantrum's damage.
      * +1 if the move executed succesfully.
      * +0 if the move was blocked by a Protect-like move, or if the Pokemon flinched
      * from Fake Out.
      * -2 if the move otherwise failed.
      * TODO: The type effectiveness of a move definitely comes into play here, but
      * we don't yet know how.
      * See https://bulbapedia.bulbagarden.net/wiki/Talk:Battle_Frontier_(Generation_III)#Battle_Arena_Skill_judgement
      * Most points at the end of 3 turns wins the category.
      *
      * Body is scored based on
      * (HP remaining at end of 3rd turn) / (HP remaining at beginning of 1st turn)
      * Pokemon with the highest ratio wins the category.
      */
    name: "[Gen 7] Battle Arena",
    desc: `A format based on Emerald's Battle Arena.`,
    threads: [],
    mod: 'gen7',
    // You may modify the ruleset
    ruleset: ['Pokemon', 'Cancel Mod', 'Team Preview'],
    // debug: true, // Uncomment for exact HP and other debugging features
    // TODO: Let players order all their pokes in team preview
    onTeamPreviewPriority: 999,
    onTeamPreview: function() {
      this.effectData.activeTurns = 0;
      this.effectData.pokemonData = {};
      this.effectData.p1pokemon = 0;
      this.effectData.p2pokemon = 0;
    },
    onBeforeTurnPriority: 999,
    onBeforeTurn: function(pokemon) {
      if (this.effectData.activeTurns === 0) {
        // initialize scores
        this.effectData.pokemonData[pokemon.side.id] = {
          mind: 0,
          skill: 0,
          startingHp: pokemon.hp,
          /**
            * Move this turn result for the purposes of the Battle Arena.
            * true: move succeeded, +1
            * false: move failed, -2
            * null: move failed, 0
            * undefined: use pokemon.moveThisTurnResult
            */
          moveThisTurnResult: undefined,
        };
      }

      //increment the Mind counter
      const action = this.willMove(pokemon);
      if (action) {
        if (action.move.stallingMove || action.move.id === 'fakeout') {
          this.effectData.pokemonData[pokemon.side.id].mind--;
        } else if (action.move.category !== 'Status'
            && !['counter', 'mirrorcoat', 'bide', 'metalburst'].includes(action.move.id)) {
          this.effectData.pokemonData[pokemon.side.id].mind++;
        }
      }
    },

    // Prevent switching
    onTrapPokemonPriority: -999,
    onTrapPokemon: function(pokemon) {
      pokemon.trapped = true;
    },
    onDragOutPriority: 999,
    onDragOut: false,
    onAfterMove: function(pokemon) {
      pokemon.switchFlag = false;
    },
    // TODO: What actually happens with phazing moves?
    // TODO: How should U-Turn work?

    // Fake Out detector
    onFlinchPriority: -999,
    onFlinch: function(pokemon) {
      if (pokemon.volatiles.flinch.sourceEffect.id === 'fakeout') {
        this.effectData.pokemonData[pokemon.side.id].moveThisTurnResult = null;
      }
    },

    // TODO: Detect the move was blocked by Protect

    onResidualOrder: 999,
    onResidual: function() {
      if (this.sides.some(side => side.active[0].fainted)) {
        // someone fainted, reset
        this.effectData.activeTurns = 0;
      } else {
        for (const side of this.sides) {
          const pokemon = side.active[0];
          const pokemonData = this.effectData.pokemonData[pokemon.side.id];

          // skill counter
          switch (pokemonData.moveThisTurnResult === undefined ? pokemon.moveThisTurnResult : pokemonData.moveThisTurnResult) {
            case true:
              pokemonData.skill++;
              break;
            case false:
              pokemonData.skill -= 2;
              break;
            default:
              // do nothing
          }
        }

        if (++this.effectData.activeTurns === 3) {
          this.add('');
          this.add('message', "Time's up! Time for the judging! (placeholder)");
          const p1data = this.effectData.pokemonData.p1;
          const p2data = this.effectData.pokemonData.p2;
          let p1score = 0;
          let p2score = 0;

          let mindWinner = p1data.mind - p2data.mind;
          if (mindWinner > 0) {
            this.add('-message', `${this.p1.active[0].name} won in Mind! (placeholder)`);
            p1score++;
          } else if (mindWinner < 0) {
            this.add('-message', `${this.p2.active[0].name} won in Mind! (placeholder)`);
            p2score++;
          } else {
            this.add('-message', "In Mind, it's a tie! (placeholder)");
          }

          let skillWinner = p1data.skill - p2data.skill;
          if (skillWinner > 0) {
            this.add('-message', `${this.p1.active[0].name} won in Skill! (placeholder)`);
            p1score++;
          } else if (skillWinner < 0) {
            this.add('-message', `${this.p2.active[0].name} won in Skill! (placeholder)`);
            p2score++;
          } else {
            this.add('-message', "In Skill, it's a tie! (placeholder)");
          }

          // TODO To what precision are these measured?
          let p1hpRatio = this.p1.active[0].hp / p1data.startingHp;
          let p2hpRatio = this.p2.active[0].hp / p2data.startingHp;
          if (p1hpRatio > p2hpRatio) {
            this.add('-message', `${this.p1.active[0].name} won in Body! (placeholder)`);
            p1score++;
          } else if (p2hpRatio > p1hpRatio) {
            this.add('-message', `${this.p2.active[0].name} won in Body! (placeholder)`);
            p2score++;
          } else {
            this.add('-message', "In Body, it's a tie! (placeholder)");
          }

          if (p1score <= p2score) {
            this.add('message', `${this.p1.active[0].name} was taken out in a judge's decision! (placeholder)`);
            this.faint(this.p1.active[0]);
          }
          if (p2score <= p1score) {
            this.add('message', `${this.p2.active[0].name} was taken out in a judge's decision! (placeholder)`);
            this.faint(this.p2.active[0]);
          }

          this.effectData.activeTurns = 0;
        }
      }

      // Hack to enforce switching Pokemon in order; faint them now
      // TODO: What happens if the last matchup results in a draw from judging?
      this.faintMessages();
      if (this.ended) return;

      this.checkFainted();
      if (this.p1.active[0].switchFlag) {
        this.insertQueue({
          choice: 'instaswitch',
          pokemon: this.p1.active[0],
          target: this.p1.pokemon[++this.effectData.p1pokemon],
        });
      }
      if (this.p2.active[0].switchFlag) {
        this.insertQueue({
          choice: 'instaswitch',
          pokemon: this.p2.active[0],
          target: this.p2.pokemon[++this.effectData.p2pokemon],
        });
      }
    },
  },

  {
    /**
      * Battle Palace format by mathfreak231.
      * Version 0.0 beta. Most functionality is present.
      *
      * This is a format based on the Battle Palace from the Gen 3 Battle Frontier.
      *
      * Each turn, if the Trainer selects a move for a Pokemon, it gets replaced
      * with a move of its own choosing. The Pokemon first chooses one of Attack,
      * Defense, or Support, and then chooses a move at random of that descriptor.
      * If it chooses a category of which it has no moves, it won't move at all.
      * The chances of selecting each category are determined based on the Pokemon's
      * Nature, and whether or not it is below 50% of its HP. These chances are listed
      * as percents in the code.
      *
      * Move categories:
      * Defense: Any move that targets the user, an ally, the user's side, or the
      * entire battlefield.
      * Support: Any status move that is not Defense, plus Counter, Mirror Coat, Metal Burst.
      * Attack: Any other move (all are damaging moves).
      */
    name: "[Gen 7] Battle Palace",
    desc: `A format based on Emerald's Battle Palace.`,
    threads: [],
    mod: 'gen7',
    // You may modify the ruleset
    ruleset: ['Pokemon', 'Cancel Mod', 'Team Preview'],
    // debug: true, // Uncomment for debug features such as exact HP reporting
    onBeforeTurnPriority: 999,
    onBeforeTurn: function(pokemon) {
      function randomDiscreteDistribution(arr, prng) {
        // example: arr = [1, 1, 3, 1]
        // 0, 1, 3 have a 1/6 chance to be chosen
        // 2 has a 3/6 chance
        const cumSum = [];
        let sum = 0;
        for (let n of arr) {
          cumSum.push(sum += n);
        }

        let rand;
        if (prng) {
          rand = prng.next() * sum;
        } else {
          rand = Math.random() * sum;
        }
        for (let i = 0; i < cumSum.length; i++) {
          if (rand < cumSum[i]) return i;
        }
      }

      const action = this.willMove(pokemon);
      if (!action) return;

      const sortedMoves = {
        'Attack': [],
        'Defense': [],
        'Support': [],
      };

      for (let move of pokemon.getMoves()) {
        if (move.disabled) continue;
        // TODO: How do disabled moves actually work here?
        move = this.getMove(move.id);
        let category;
        // TODO: moves that call other moves are support in gen 3, should this carry to later gens?
        if (['self', 'adjacentAllyOrSelf', 'adjacentAlly', 'allySide', 'all'].includes(move.target)) {
          category = 'Defense';
        } else if (move.category === 'Status' || ['counter', 'mirrorcoat', 'metalburst'].includes(move.id)) {
          category = 'Support';
        } else {
          category = 'Attack';
        }
        sortedMoves[category].push(move.id);
      }

      // move chances source: Bulbapedia
      let moveChances;
      if (pokemon.hp < pokemon.maxhp / 2) {
        moveChances = {
          Hardy: [61, 7, 32],
          Lonely: [84, 8, 8],
          Brave: [32, 60, 8],
          Adamant: [70, 15, 15],
          Naughty: [70, 22, 8],
          Bold: [32, 58, 10],
          Docile: [56, 22, 22],
          Relaxed: [75, 15, 10],
          Impish: [28, 55, 17],
          Lax: [29, 6, 65],
          Timid: [30, 20, 50],
          Hasty: [88, 6, 6],
          Serious: [29, 11, 60],
          Jolly: [35, 60, 5],
          Naive: [56, 22, 22],
          Modest: [34, 60, 6],
          Mild: [34, 6, 60],
          Quiet: [56, 22, 22],
          Bashful: [30, 58, 12],
          Rash: [27, 6, 67],
          Calm: [25, 62, 13],
          Sassy: [22, 20, 58],
          Careful: [42, 5, 53],
          Quirky: [56, 22, 22],
        }[pokemon.getNature().name];
      } else {
        moveChances = {
          Hardy: [61, 7, 32],
          Lonely: [20, 25, 55],
          Brave: [70, 15, 15],
          Adamant: [38, 31, 31],
          Naughty: [20, 70, 10],
          Bold: [30, 20, 50],
          Docile: [56, 22, 22],
          Relaxed: [25, 15, 60],
          Impish: [69, 6, 25],
          Lax: [35, 10, 55],
          Timid: [62, 10, 28],
          Hasty: [58, 37, 5],
          Serious: [34, 11, 55],
          Jolly: [35, 5, 60],
          Naive: [56, 22, 22],
          Modest: [35, 45, 20],
          Mild: [44, 50, 6],
          Quiet: [56, 22, 22],
          Bashful: [30, 58, 12],
          Rash: [30, 58, 12],
          Calm: [40, 50, 10],
          Sassy: [18, 70, 12],
          Careful: [42, 50, 8],
          Quirky: [56, 22, 22],
        }[pokemon.getNature().name];
      }
      let categoryChoice = ['Attack', 'Defense', 'Support'][randomDiscreteDistribution(moveChances, this.prng)];
      let choicePool = sortedMoves[categoryChoice];
      if (!choicePool.length) {
        action.move.incapable = true; // used in the BeforeMove handler
        return;
      }
      let moveChoice = this.sample(choicePool);
      this.changeAction(pokemon, {
        choice: 'move',
        moveid: moveChoice,
        targetLoc: 69, // force random target
      });
    },
    onBeforeMovePriority: 999,
    onBeforeMove: function(pokemon, target, move) {
      if (move.incapable) {
        this.add('');
        this.add('message', `${pokemon.name} appears incapable of using its power!`);
        return false;
      }
    },
    // TODO: message that a Pokemon has gone below half health
  },

  {
    /**
      * Hot Potato
      *
      * Meta by TDA on Smogon
      * Thread: https://www.smogon.com/forums/threads/hot-potato.3643676/
      * Code by mathfreak231
      */
    name: "[Gen 7] Hot Potato",
    desc: `All attacking moves transfer stat drops, entry hazards, statuses, and certain volatiles to the target.`,
    threads: [
      `&bullet; <a href="https://www.smogon.com/forums/threads/hot-potato.3643676/">Hot Potato</a>`,
    ],

    mod: 'gen7',
    ruleset: ['[Gen 7] OU'],
    onValidateSet: function(set) {
      let problems = [];
      for (const moveid in set.moves) {
        const move = this.getMove(moveid);
        if (move.self && move.self.volatileStatus === "mustrecharge") problems.push(`${set.name || set.species}'s move ${move.name} is banned.`);
      }
      return problems;
    },
    onAfterMoveSecondaryPriority: 10,
    onAfterMoveSecondary: function(target, source, move) {
      if (move.category === 'Status' || !target.hp) return;

      // stat drops
      let negativeBoosts = {};
      let boosted = false;
      for (let stat in source.boosts) {
        if (source.boosts[stat] < 0) {
          boosted = true;
          negativeBoosts[stat] = source.boosts[stat];
          source.boosts[stat] = 0;
        }
      }
      if (boosted) {
        this.add('-clearnegativeboost', source);
        this.boost(negativeBoosts);
      }

      // Data from volatiles, etc. that makes no sense to copy; everything else should be copied
      const noCopy = ['id', 'target', 'source', 'sourceEffect', 'sourcePosition', 'linkedStatus', 'linkedPokemon', 'move'];

      // side conditions
      for (const sideCondition of ['stealthrock', 'spikes', 'toxicspikes', 'stickyweb']) {
        if (source.side.sideConditions[sideCondition]) {
          let oldData = source.side.sideConditions[sideCondition];
          source.side.removeSideCondition(sideCondition);
          this.add('-sideend', source.side, this.getEffect(sideCondition).name);
          let result = target.side.addSideCondition(sideCondition);
          if (result) {
            for (let i in oldData) {
              if (!noCopy.includes(i)) {
                if (i === 'layers' && oldData[i] > 1) {
                  // Tox/spikes layers, pass all of them
                  for (let l = 1; l < oldData[i]; l++) {
                    target.side.addSideCondition(sideCondition);
                  }
                } else {
                  target.side.sideConditions[sideCondition][i] = oldData[i];
                }
              }
            }
          }
        }
      }

      // status
      if (source.status) {
        let oldData = source.statusData;
        source.cureStatus();
        let result = target.trySetStatus(oldData.id);
        if (result) {
          for (let i in oldData) {
            if (!noCopy.includes(i)) {
              target.statusData[i] = oldData[i];
            }
          }
        }
      }

      // volatiles
      for (const volatile of ['confusion', 'trapped', 'partiallytrapped', 'taunt', 'encore', 'leechseed', 'torment', 'disable', 'attract', 'perishsong', 'telekinesis', 'nightmare', 'curse', 'healblock', 'embargo', 'miracleeye', 'foresight']) {
        if (source.volatiles[volatile]) {
          let oldData = source.volatiles[volatile];
          source.removeVolatile(volatile);
          let result;
          if (oldData.linkedStatus) {
            result = target.addVolatile(volatile, source, null, oldData.linkedStatus);
          } else {
            result = target.addVolatile(volatile);
          }
          if (result) {
            for (let i in oldData) {
              if (!noCopy.includes(i)) {
                target.volatiles[volatile][i] = oldData[i];
              }
            }
          }
        }
      }
    },
  },
];

//exports.Formats = Formats;
