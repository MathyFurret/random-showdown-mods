'use strict';

// After-damage move lines.
// All of these except Focus Punch play when a move deals fatal damage.
const MOVE_LINES = {
  'aerialace': "Aerial Ace hits.",
  'aeroblast': "Blown away by Aeroblast!",
  'aurasphere': "Hit by Aura Sphere.",
  'blastburn': "Immolated by Blast Burn.",
  'blizzard': "A frigid shot from Blizzard!",
  'bodyslam': "A hard hit from Body Slam.",
  'bravebird': "Nailed by Brave Bird.",
  'brickbreak': "Hit by Brick Break.",
  'closecombat': "Beaten down by Close Combat!",
  'counter': "Counter hits back.",
  'crushgrip': "Smashed by Crush Grip!",
  'darkpulse': "Dark Pulse hits.",
  'discharge': "Discharge hits.",
  'doubleedge': "Sliced apart by Double-Edge!",
  'dracometeor': "Pounded by Draco Meteor.",
  'dragonclaw': "Ripped by Dragon Claw.",
  'dragonpulse': "Hit by Dragon Pulse.",
  'drillpeck': "Nailed by Drill Peck.",
  'dynamicpunch': "Beaten down by Dynamic Punch!",
  'earthquake': "Earthquake tears open the ground!",
  'energyball': "Energy Ball hits.",
  'eruption': "Nailed by Eruption.",
  'explosion': "Annihilated by Explosion!",
  'fireblast': "Torched by Fire Blast.",
  'fissure': "Fissure opens an abyss of destruction!",
  'flamethrower': "Singed by Flamethrower.",
  'flareblitz': "Torched by Flare Blitz.",
  'flashcannon': "Hit by Flash Cannon.",
  'focusblast': "Busted by Focus Blast!",
  'focuspunch': "Slammed by Focus Punch.",
  'frenzyplant': "Shredded by Frenzy Plant!",
  'frustration': "Hit by Frustration.",
  'gigaimpact': "Crushed by Giga Impact.",
  'guillotine': "Guillotine does massive damage!",
  'gunkshot': "Hit by Gunk Shot.",
  'headsmash': "Slammed by Head Smash.",
  'heatwave': "Burned by Heat Wave.",
  'horndrill': "Horn Drill impales its target!",
  'hydrocannon': "Deluged by Hydro Cannon!",
  'hydropump': "Swamped by Hydro Pump.",
  'hyperbeam': "Blasted by Hyper Beam!",
  'hypervoice': "Hyper Voice hits.",
  'icebeam': "Ice Beam hits.",
  'judgment': "Judgment has been dealt!",
  'lastresort': "Last Resort hits.",
  'lavaplume': "Hit by Lava Plume.",
  'leafstorm': "Torn up by Leaf Storm.",
  'magmastorm': "Incinerated by Magma Storm!",
  'magnitude': "Magnitude shakes the ground.",
  'megakick': "Mega Kick hits hard.",
  'megahorn': "Pierced by Megahorn!",
  'mirrorcoat': "Mirror Coat echoes back.",
  'muddywater': "Splashed by Muddy Water.",
  'outrage': "Smacked down by Outrage.",
  'overheat': "Cooked by Overheat.",
  'powerwhip': "Lashed by Power Whip.",
  'psychic': "Hit by Psychic.",
  'psychoboost': "Torn apart by Psycho Boost!",
  'return': "Hit by Return.",
  'roaroftime': "Ripped by Roar of Time!",
  'rockslide': "Rock slide tumbles down.",
  'rockwrecker': "Demolished by Rock Wrecker.",
  'sacredfire': "Set aflame by Sacred Fire!",
  'seedflare': "Ripped in two by Seed Flare!",
  'seismictoss': "Hurled by Seismic Toss!",
  'selfdestruct': "Self-Destruct detonates.",
  'shadowball': "Shadow Ball hits.",
  'shadowclaw': "Shadow Claw hits.",
  'shadowforce': "Complete destruction by Shadow Force!",
  'sheercold': "Sheer Cold delivers chilling misery!",
  'silverwind': "Hit by Silver Wind.",
  'skyattack': "Sky Attack rains down havoc!",
  'sludgebomb': "Slimed by Sludge Bomb.",
  'solarbeam': "Seared by Solar Beam!",
  'spacialrend': "Torn apart by Spacial Rend!",
  'stoneedge': "Sliced by Stone Edge.",
  'superpower': "Devastated by Superpower.",
  'surf': "Soaked by Surf.",
  'thunder': "Thunder detonates with a boom!",
  'thunderbolt': "Zapped by Thunderbolt.",
  'volttackle': "Slammed by Volt Tackle.",
  'waterspout': "Drenched by Water Spout.",
  'woodhammer': "Pounded by Wood Hammer.",
  'zapcannon': "Shocked by Zap Cannon.",
};

// The following moves will also play the move line when the move does NVE damage.
// Source: https://docs.google.com/spreadsheets/d/1sVJyneesNW9k5h9o2fQz1uRtTExYUg_sLY2d4wxxbO8/edit#gid=1225109986
// TODO: Confirm that this list is correct
const CAN_NVE_LINE = [
  'aeroblast', 'blastburn', 'blizzard', 'bravebird', 'closecombat',
  'crushgrip', 'dynamicpunch', 'eruption', 'fireblast', 'flareblitz',
  'focusblast', 'focuspunch', 'hydrocannon', 'hydropump', 'hyperbeam',
  'lastresort', 'leafstorm', 'magmastorm', 'megakick', 'megahorn',
  'overheat', 'powerwhip', 'psychoboost', 'roaroftime', 'sacredfire',
  'seedflare', 'shadowforce', 'silverwind', 'skyattack', 'solarbeam',
  'spacialrend', 'stoneedge', 'superpower', 'thunder', 'waterspout',
  'woodhammer', 'zapcannon',
];

// The following moves will also play the move line when they are weakened by weather.
// TODO: Confirm that this list is correct (same source as above)
const CAN_WEATHER_WEAK_LINE = [
  'fireblast', 'flareblitz',
  'hydropump', 'hydrocannon',
];

/**@type {{[k: string]: ModdedFormatsData}} */
let BattleFormats = {
  pbrannouncer: {
    // ok this is just me playing around with the events system Kappa
    // My goal is to accurately emulate PRChase whenever possible,
    // so I don't plan to add lines without a decent certainty of when they trigger.
    effectType: 'Rule',
    name: "PBR Announcer",
    desc: "Puts an announcer in your battle! PRChase 7",
    onStart: function() {
      let data = this.effectData.lineData = {};

      // Whether the weather has already shown up. For the rare "again" weather lines.
      data.weatherHasRun = {};
    },
    onBeginTurn: function() {
      //placeholder
    },
    onAfterDamagePriority: 999,
    onAfterDamage: function(damage, target, source, effect) {
      let line = [];
      if (effect && effect.effectType === 'Move' && source && target !== source) {
        if (effect.isFutureMove) {
          if (target.hp) {
            if (effect.id === 'futuresight') {
              line.push("Attacked by Future Sight! Didn't see that coming!");
            } else {
              line.push(target.template.baseSpecies);
              line.push("is losing its health!");
            }
          }
        } else if (!target.hp) {
          if (effect.id in MOVE_LINES) {
            if (effect.id === 'focuspunch') return; // Focus Punch is silent glitch
            line.push(MOVE_LINES[effect.id]);
          } else if (this.turn === 1 && !target.willMove()) {
            // TODO this line is more complex I think...
            line.push("Aaagh!");
          } else {
            switch (this.random(4)) {
              case 0:
                line.push("Big hit!");
                break;
              case 1:
                line.push("Slammed 'em!");
                break;
              case 2:
                line.push("Crushing blow!");
                break;
              case 3:
                line.push("Bam!");
                break;
            }
          }
          // TODO fix this line as well, make sure the source is the first to move in the battle.
          if (this.turn === 1 && target.willMove()) line.push("A brilliant attack, right from the start!");
        }
      }
      if (line) this.announce(line.join(' '));
    },
    onFaintPriority: 999,
    onFaint: function(target, source, effect) {
      if (effect && effect.effectType === 'Move' && source && target !== source) {
        if (effect.id === 'focuspunch') return; // Focus Punch is silent glitch
        if (effect.isFutureMove) {
          switch (effect.id) {
            case 'futuresight':
              this.announce("It's down. Future Sight arrives after everyone had forgotten.");
              break;
            case 'doomdesire':
              this.announce("The Doom Desire has been granted. It's down.");
              break;
          }
        } else if (this.turn === 1) {
          this.announce(this.random(2) ? "Taken out already." : "It's down already.");
        } else if (source.lastDamage >= target.maxhp / 2) {
          this.announce(this.random(2) ? "A huge amount of damage! It's down!" : "Taken down by an intense blow.");
        } else {
          switch (this.random(3)) {
            case 0:
              this.announce("It went down!");
              break;
            case 1:
              this.announce("It's down and out.");
              break;
            case 2:
              this.announce("It couldn't take it! It's down!");
              break;
          }
        }
      } else {
        switch (effect && effect.id) {
          case 'confused':
            this.announce("Ouch. That was rather self-destructive.");
            break;
          case 'memento':
            this.announce(target.template.baseSpecies + " went down, but it left a parting gift.");
            break;
          case 'healingwish':
            this.announce("Taken down by Healing Wish.");
            break;
          case 'lunardance':
            this.announce("Taken down by Lunar Dance.");
            break;
          case 'perishsong':
            this.announce("The count of Perish Song reached zero.");
            break;
          case 'sandstorm':
            this.announce("Oh, it just couldn't take the damage from the sandstorm!");
            break;
          case 'hail':
            this.announce("Taken out by the avalanche of falling hail.");
            break;
          case 'dryskin':
            this.announce("Its dry skin couldn't withstand the strong sunlight! Now, it's all dried out!");
            break;
          case 'solarpower':
            this.announce("Solar Power worked against it? It's gotta be because of the strong sunlight!");
            break;
          case 'psn': case 'tox':
            this.announce(this.random(2) ? "The damage from poison finished it." : "It's down due to damage from poison.");
            break;
          case 'brn':
            this.announce(this.random(2) ? "It's all burned up now. The damage from its burn was just too much!" : "It's down due to damage from its burn!");
            break;
          case 'nightmare':
            this.announce("Oh no! It went down before it could wake from its nightmare!");
            break;
          case 'curse':
            this.announce("Oh no! It couldn't escape the curse!");
            break;
          case 'baddreams':
            this.announce("The suffering caused by its bad dream was too much! It's down.");
            break;
          case 'partiallytrapped':
            switch (target.volatiles.partiallytrapped.sourceEffect.id) {
              case 'bind':
                this.announce("It's down. It couldn't get out of the bind.");
                break;
              case 'wrap':
                this.announce("Wrapped up and taken down!");
                break;
              case 'firespin':
                this.announce(this.random(2) ? "It's down. Burned by the Fire Spin." : "It burned up in the Fire Spin.");
                break;
              case 'clamp':
                this.announce("Clamped up and taken down!");
                break;
              case 'whirlpool':
                this.announce("Whirlpool takes it for a spin.");
                break;
              case 'sandtomb':
                this.announce("It's getting buried in a Sand Tomb.");
                break;
              case 'magmastorm':
                this.announce("Magma Storm brings it down!");
                break;
            }
            break;
          case 'leechseed':
            this.announce("It was sapped by Leech Seed and taken down.");
            break;
          case 'spikes': case 'stealthrock':
            this.announce("It went down as soon as it came out!");
            break;
        }
      }
    },
    onBattleEnded: function(winner) {
      // TODO: study how the lines can be combined
      let line = [];
      if (winner) {
        switch (this.random(4)) {
          case 0:
            line.push("The game is now over.");
            break;
          case 1:
            line.push("Game, set, and match.");
            break;
          case 2:
            line.push("The battle has ended.");
            break;
          case 3:
            line.push("The results are in.");
            break;
        }
        let color = winner.getColor();
        if (winner.pokemon.length === winner.pokemonLeft && winner.pokemon.length > 1) {
          line.push(`It's a total victory for the ${color} corner.`);
        } else if (winner.pokemonLeft === 1 && winner.pokemon.length > 1) {
          line.push(`The ${color} corner narrowly escaped defeat.`);
        } else {
          line.push(this.random(2) ? `The ${color} corner has won the game.` : `The ${color} corner pulled off an impressive victory.`);
        }
      } else {
        line.push(this.random(2) ? "The game is now over." : "The battle has ended.");
        line.push("The result is a draw.");
      }
      this.announce(line.join(' '));
    },
  },
  pbrsleepclause: {
    // TODO: Does the source actually matter?
    effectType: "Rule",
    name: "PBR Sleep Clause",
    desc: `Prevents players from putting more than one of their opponent's Pok&eacute;mon to sleep at a time.`,
    onSetStatus: function (status, target, source) {
      if (source && source.side === target.side) {
        return;
      }
      if (status.id === 'slp') {
        for (const pokemon of target.side.pokemon) {
          if (pokemon.hp && pokemon.status === 'slp') {
            if (!pokemon.statusData.source || pokemon.statusData.source.side !== pokemon.side) {
              return false;
            }
          }
        }
      }
    },
  },
  pbrfreezeclause: {
    // TODO: Does the source actually matter?
    effectType: "Rule",
    name: "PBR Freeze Clause",
    desc: "Prevents players from freezing more than one of their opponent's Pok&eacute;mon at a time.",
    onSetStatus: function (status, target, source) {
      if (source && source.side === target.side) {
        return;
      }
      if (status.id === 'frz') {
        for (const pokemon of target.side.pokemon) {
          if (pokemon.status === 'frz') {
            return false;
          }
        }
      }
    },
  },
  pbrselfdestructclause: {
    effectType: "Rule",
    name: "PBR Self-Destruct Clause",
    desc: "Causes Self-Destruct and Explosion to lose the battle for the user if all remaining Pok&eacute;mon faint from such a move.",
    // Should be implemented in scripts.js
    // TODO: actually implement
  },
  pbrdestinybondclause: {
    effectType: "Rule",
    name: "PBR Destiny Bond Clause",
    desc: "Causes Destiny Bond and Perish Song to fail when used by a team's final Pok&eacute;mon.",
    onTryMove: function(pokemon, target, move) {
      const bannedMoves = ['perishsong', 'destinybond'];
      if (bannedMoves.includes(move.id) && !this.canSwitch(pokemon.side)) {
        this.add('-fail', target);
        return false;
      }
    },
  },
};

exports.BattleFormats = BattleFormats;
