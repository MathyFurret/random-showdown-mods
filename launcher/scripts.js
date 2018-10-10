'use strict';

const BattleLauncherItems = require('./launcher-items').BattleLauncherItems;

const Battle = require('../../sim/battle');

const Data = require('../../sim/dex-data');

class LauncherItem extends Data.Effect {
  constructor(data) {
    super(data);

    this.effectType = 'LauncherItem';
  }
}

/**
 * Like string.split(delimiter), but only recognizes the first `limit`
 * delimiters (default 1).
 *
 * `"1 2 3 4".split(" ", 2) => ["1", "2"]`
 *
 * `Chat.splitFirst("1 2 3 4", " ", 1) => ["1", "2 3 4"]`
 *
 * Returns an array of length exactly limit + 1.
 *
 * @param {string} str
 * @param {string} delimiter
 * @param {number} [limit]
 */
function splitFirst(str, delimiter, limit = 1) {
  let splitStr = /** @type {string[]} */ ([]);
  while (splitStr.length < limit) {
    let delimiterIndex = str.indexOf(delimiter);
    if (delimiterIndex >= 0) {
      splitStr.push(str.slice(0, delimiterIndex));
      str = str.slice(delimiterIndex + delimiter.length);
    } else {
      splitStr.push(str);
      str = '';
    }
  }
  splitStr.push(str);
  return splitStr;
}

exports.BattleScripts = {
  getLauncherItem: function(name) {
    if (typeof name !== 'string') return name;

    let id = toId(name);

    if (!this.launcherItemCache) {
      this.launcherItemCache = new Map();
    }
    if (!this.data.LauncherItems) {
      this.data.LauncherItems = BattleLauncherItems;
    }

    let item = this.launcherItemCache.get(id);
    if (item) return item;

    if (id && this.data.LauncherItems.hasOwnProperty(id)) {
      item = new LauncherItem(this.data.LauncherItems[id]);
    } else {
      item = new LauncherItem({name, exists: false});
    }

    if (item.exists) this.launcherItemCache.set(id, item);
    return item;
  },

  runAction: function(action) {
    if (action.choice === 'launch') {
      if (this.gen === 5) {
        // In gen 5, item actions were slot-based
        this.runLaunch(action.item, action.side.pokemon[action.targetPos], action.move ? action.side.pokemon[action.targetPos].moves[action.moveIndex] : null);
      } else {
        this.runLaunch(action.item, action.target, action.move);
      }
      if (!action.target.isActive && action.target.position < action.side.active.length) {
        // A fainted Pokemon in an active slot was revived, so it gets sent out immediately
        action.side.active[action.target.position] = null;
        this.switchIn(action.target, action.target.position);
      }
    }
    return Object.getPrototypeOf(this).runAction.call(this, action);
  },

  runLaunch: function(item, pokemon, move) {
    // This should look similar to moveHit
    // in that it checks various properties of the effect and keeps track of
    // whether or not any worked.

    item = this.getLauncherItem(item);
    if (move) move = this.getMove(move);

    this.add('');
    this.add('message', `${pokemon.side.name} launched the ${item.name} toward ${pokemon.name}! (placeholder)`);
    pokemon.side.launcherPoints -= item.cost;

    let didSomething = false;
    let hitResult;

    if (item.curesStatus) {
      if (item.curesStatus === 'all') {
        hitResult = pokemon.cureStatus();
        didSomething = didSomething || hitResult;
        hitResult = pokemon.removeVolatile('confusion');
        didSomething = didSomething || hitResult;
      } else {
        let status = pokemon.status;
        if (status === 'tox') status = 'psn';
        if (status === item.curesStatus) {
          hitResult = pokemon.cureStatus();
          didSomething = didSomething || hitResult;
        }
      }
    }

    if (item.heal) {
      let healBy = item.heal;
      if (item.heal === 'max') {
        healBy = pokemon.maxhp;
      }
      healBy = pokemon.heal(healBy);
      if (healBy) {
        this.add('-heal', pokemon, pokemon.getHealth);
        didSomething = true;
      }
    }

    if (item.boosts) {
      hitResult = this.boost(item.boosts, pokemon, pokemon, item);
      // TODO: Find out what message displays if its stat is too high
      didSomething = didSomething || (hitResult === null ? false : null);
    }

    if (item.restorePP) {
      let moveSlot = pokemon.getMoveData(move);
      let restorePP = item.restorePP === 'max' ? moveSlot.maxpp : item.restorePP;
      moveSlot.pp += restorePP;
      if (moveSlot.pp > moveSlot.maxpp) {
        restorePP -= moveSlot.pp - moveSlot.maxpp;
        moveSlot.pp = moveSlot.maxpp;
      }
      if (restorePP) {
        this.add('-message', `${pokemon.name} restored PP to its ${move.name}! (placeholder)`);
        didSomething = true;
      }
    }

    if (item.restoreAllPP) {
      // doesn't actually happen because the Elixers are not launcher items
      // but I decided to support it anyways.
      let restorePP;
      let hitResult = false;
      for (const moveSlot of this.moveSlots) {
        restorePP = item.restoreAllPP === 'max' ? moveSlot.maxpp : item.restorePP;
        moveSlot.pp += restorePP;
        if (moveSlot.pp > moveSlot.maxpp) {
          restorePP -= moveSlot.pp - moveSlot.maxpp;
          moveSlot.pp = moveSlot.maxpp;
        }
        if (restorePP) hitResult = true;
      }
      if (hitResult) {
        this.add('-message', `${pokemon.name} had its PP restored. (placeholder)`);
        didSomething = true;
      }
    }

    if (item.revive) {
      if (pokemon.fainted) {
        pokemon.fainted = false;
        pokemon.faintQueued = false;
        pokemon.status = '';
        pokemon.hp = item.revive === 'max' ? pokemon.maxhp : Math.floor(pokemon.maxhp / 2);
        pokemon.side.pokemonLeft++;
        this.add('-message', `${pokemon.name} regained health! (placeholder)`);
        didSomething = true;
      }
    }

    if (item.onUse) {
      hitResult = this.singleEvent('Use', item, null, pokemon);
      didSomething = didSomething || hitResult;
    }

    if (didSomething === null) {
      this.add('-message', "But the item doesn't do anything there! (placeholder)");
    }
    if (didSomething === false) {
      this.add('-message', 'But it had no effect! (placeholder)');
    }

    return !!didSomething;

    // TODO: Does an item failing power up Stomping Tantrum?
  },

  start: function() {
    if (this.active) return;

    if (!this.p1 || !this.p2) {
      // need two players to start
      return;
    }

    if (this.started) {
      return;
    }
    this.activeTurns = 0;
    this.started = true;
    this.p2.foe = this.p1;
    this.p1.foe = this.p2;

    this.p1.launcherPoints = 0;
    this.p2.launcherPoints = 0;

    for (const side of this.sides) {
      this.add('teamsize', side.id, side.pokemon.length);
    }

    this.add('gametype', this.gameType);
    this.add('gen', this.gen);

    let format = this.getFormat();

    this.add('tier', format.name);
    if (this.rated) {
      if (this.rated === 'Rated battle') this.rated = true;
      this.add('rated', typeof this.rated === 'string' ? this.rated : '');
    }
    this.add('seed', /**@param {Side} side */side => Battle.logReplay(this.prngSeed.join(','), side));

    if (format.onBegin) {
      format.onBegin.call(this);
    }
    this.getRuleTable(format).forEach((v, rule) => {
      if (rule.startsWith('+') || rule.startsWith('-') || rule.startsWith('!')) return;
      if (this.getFormat(rule).exists) this.addPseudoWeather(rule);
    });

    this.add('-message', `REMINDER: Wonder Launcher mod is active for this battle! Because the client currently doesn't directly support it, you must use the /choose command to use it.`);
    this.add('-message', `To use an item, type /choose launch (slot) (item), where slot is the position of the Pokémon in your party starting at 1, and item is the name of the item.`);
    this.add('-message', `If the item requires a move target, type instead /choose launch (slot) (item) (move), where move is the number of the slot or name of the move, and item doesn't have any spaces.`);

    if (!this.p1.pokemon[0] || !this.p2.pokemon[0]) {
      throw new Error('Battle not started: A player has an empty team.');
    }

    this.residualEvent('TeamPreview');

    this.addToQueue({choice: 'start'});
    this.midTurn = true;
    if (!this.currentRequest) this.go();
  },

  nextTurn: function() {
    for (const side of this.sides) {
      if (side.launcherPoints < 14) side.launcherPoints++;
    }

    Object.getPrototypeOf(this).nextTurn.call(this);
  },

  side: {
    choose: function(input) {
      if (!this.currentRequest) {
        return this.emitChoiceError(this.battle.ended ? `Can't do anything: The game is over` : `Can't do anything: It's not your turn`);
      }

      if (this.choice.cantUndo) {
        return this.emitChoiceError(`Can't undo: A trapping/disabling effect would cause undo to leak information`);
      }

      this.clearChoice();

      const choiceStrings = (input.startsWith('team ') ? [input] : input.split(','));

      for (let choiceString of choiceStrings) {
        let choiceType = '';
        let data = '';
        choiceString = choiceString.trim();
        let firstSpaceIndex = choiceString.indexOf(' ');
        if (firstSpaceIndex >= 0) {
          data = choiceString.slice(firstSpaceIndex + 1).trim();
          choiceType = choiceString.slice(0, firstSpaceIndex);
        } else {
          choiceType = choiceString;
        }

        switch (choiceType) {
        case 'move':
          let targetLoc = 0;
          if (/\s-?[1-3]$/.test(data)) {
            targetLoc = parseInt(data.slice(-2));
            data = data.slice(0, data.lastIndexOf(' '));
          }
          const willMega = data.endsWith(' mega') ? 'mega' : '';
          if (willMega) data = data.slice(0, -5);
          const willUltra = data.endsWith(' ultra') ? 'ultra' : '';
          if (willUltra) data = data.slice(0, -6);
          const willZ = data.endsWith(' zmove') ? 'zmove' : '';
          if (willZ) data = data.slice(0, -6);
          this.chooseMove(data, targetLoc, willMega || willUltra || willZ);
          break;
        case 'switch':
          this.chooseSwitch(data);
          break;
        case 'shift':
          if (data) return this.emitChoiceError(`Unrecognized data after "shift": ${data}`);
          this.chooseShift();
          break;
        case 'team':
          if (this.chooseTeam(data)) this.chooseTeam();
          break;
        case 'pass':
        case 'skip':
          if (data) return this.emitChoiceError(`Unrecognized data after "pass": ${data}`);
          this.choosePass();
          break;
        case 'default':
          this.autoChoose();
          break;
        case 'launch':
          this.chooseLaunch(data);
          break;
        default:
          this.emitChoiceError(`Unrecognized choice: ${choiceString}`);
          break;
        }
      }

      if (this.choice.error) return false;

      return true;
    },
    chooseLaunch: function(data) {
      // In Gen 5, if you switch out a Pokemon you were going to use an item on,
      // the item will target the selected party slot, not the actual Pokemon.
      // In Gen 6 and on, the item will target the Pokémon, not the party slot.
      // Also in Gen 5, Ether targets a move slot, not a move name,
      // so if you use an Ether on a Pokemon's 3rd move and switch out your target,
      // the Ether will be used on the 3rd move of the switched in target.

      if (this.currentRequest !== 'move') {
        return this.emitChoiceError(`Can't launch: You need a ${this.currentRequest} response`);
      }

      const index = this.getChoiceIndex();
      if (index > this.active.length) {
        return this.emitChoiceError(`Can't launch: You don't have a Pokémon in slot ${index + 1} that can make an action`);
      }

      const pokemon = this.active[index];
      if (pokemon.getLockedMove()) {
        // TODO: handle this better.
        return this.emitChoiceError(`Can't launch: ${pokemon.name} has a locked move and must use it this turn`);
      }


      this.choice.launcherPointsUsed = this.choice.launcherPointsUsed || 0;
      // Step 1: Determine which Pokémon we launched to.
      // Use the same specification as switching

      let slotText;
      let itemData;

      let firstSpaceIndex = data.indexOf(' ');

      if (firstSpaceIndex < 0) {
        return this.emitChoiceError(`Can't launch: You must specify a Pokémon slot and an item, separated by a space`);
      }

      itemData = data.slice(firstSpaceIndex + 1).trim();
      slotText = data.slice(0, firstSpaceIndex);

      let slot = parseInt(slotText) - 1;
      if (isNaN(slot) || slot < 0) {
        // not a number, maybe it's a nickname!
        slot = -1;
        for (const [i, pokemon] of this.pokemon.entries()) {
          if (slotText === pokemon.name) {
            slot = i;
            break;
          }
        }
        if (slot < 0) {
          return this.emitChoiceError(`Can't launch: You do not have a Pokémon named "${slotText}" to launch to`);
        }
      }
      if (slot >= this.pokemon.length) {
        return this.emitChoiceError(`Can't launch: You do not have a Pokémon in slot ${slot + 1} to launch to`);
      }
      const targetPokemon = this.pokemon[slot];
      // We have a target. Exit out if the pokemon is embargoed
      if (targetPokemon.volatiles['embargo']) {
        return this.emitChoiceError(`Can't launch: ${targetPokemon.name} can't use items`)
      }

      // Step 2: Find the item we're using, and if it's an item like Ether, on which move we are using it.
      // FIXME: This code might be utter shit, I tried to write it on one sitting
      firstSpaceIndex = itemData.indexOf(' ');

      let move = null;
      let moveIndex;
      let moveGiven = false;
      let moveIsNumber = false;
      let item, itemText, moveText;

      if (firstSpaceIndex >= 0) {
        // Choice string has another space, which means we may be parsing a move
        itemText = itemData.slice(0, firstSpaceIndex);
        moveText = itemData.slice(firstSpaceIndex + 1).trim();

        item = this.battle.getLauncherItem(itemText);
        // See if the text before the space is a valid item that requires a move target.
        if (item.exists && item.restorePP) {
          // At this point we're almost definitely parsing a move
          // But if not, we still fall back to checking if the entire string is also a valid item
          // (even though this never happens in practice)
          moveGiven = true;

          // Find out the move. Same specification as using the move
          moveIndex = parseInt(moveText) - 1;
          moveIsNumber = !isNaN(moveIndex);

          if (moveIsNumber) {
            if (moveIndex >= 0 && moveIndex < targetPokemon.moveSlots.length) {
              move = targetPokemon.moveSlots[moveIndex].id;
            }
          } else {
            let moveid = toId(moveText);
            if (moveid.startsWith('hiddenpower')) {
              moveid = 'hiddenpower';
            }
            for (const moveSlot of targetPokemon.moveSlots) {
              if (moveSlot.id === moveid) {
                move = moveSlot.id;
                break;
              }
            }
          }
        }
      }
      // If we have both a move and an item that takes it, we're done. Otherwise...
      if (!move) {
        // Try parsing the entire text after the Pokemon instead.
        item = this.battle.getLauncherItem(itemData);
        if (!item.exists) {
          // If we had a valid item before and we don't now, the problem is with the move.
          if (moveGiven) {
            if (moveIsNumber) {
              return this.emitChoiceError(`Can't launch: ${itemText} was recognized as a valid item with a move target, but ${targetPokemon.name} doesn't have a move in slot ${moveText}`);
            } else {
              return this.emitChoiceError(`Can't launch: ${itemText} was recognized as a valid item with a move target, but ${targetPokemon.name} doesn't have a move matching ${moveText}`);
            }
          } else {
            return this.emitChoiceError(`Can't launch: ${itemData} is not a recognized item. `);
          }
        }

        if (item.restorePP) {
          // We recognized the full string as an item, but we didn't get a move
          // Note that a choice string like "launch 1 Eth er Hydro Pump" is invalid on purpose
          // i mean why the fuck would anyone lol
          return this.emitChoiceError(`Can't launch: ${item.name} requires a move target`);
        }
      }

      if (item.cost + this.choice.launcherPointsUsed > this.launcherPoints) {
        return this.emitChoiceError(`Can't launch: Not enough points to use ${item.name} on ${targetPokemon.name}: it costs ${item.cost}, you have ${this.launcherPoints - this.choice.launcherPointsUsed}`);
      }

      if (item.notImplemented) {
        return this.emitChoiceError(`Can't launch: ${item.name} exists, but is not fully implemented yet, please do not use it`);
      }

      this.choice.actions.push({
        choice: 'launch',
        pokemon,
        target: targetPokemon,
        targetPos: slot,
        item,
        move,
        moveIndex: move ? targetPokemon.moves.indexOf(move) : null,
        priority: 6.95, //TODO: check actual priority
      });

      this.choice.launcherPointsUsed += item.cost;

      return true;
    },

    getChoice: function() {
      if (this.choice.actions.length > 1 && this.choice.actions.every(action => action.choice === 'team')) {
        return `team ` + this.choice.actions.map(action => action.pokemon.position + 1).join(', ');
      }
      return this.choice.actions.map(action => {
        let details;
        switch (action.choice) {
        case 'move':
          details = ``;
          if (action.targetLoc && this.active.length > 1) details += ` ${action.targetLoc}`;
          if (action.mega) details += ` mega`;
          if (action.zmove) details += ` zmove`;
          return `move ${action.moveid}${details}`;
        case 'switch':
        case 'instaswitch':
          return `switch ${action.target.position + 1}`;
        case 'team':
          return `team ${action.pokemon.position + 1}`;
        case 'launch':
          details = `launch ${action.pokemon.position + 1} ${action.item.id}`;
          if (action.move) details += ` ${action.move}`;
          return details;
        default:
          return action.choice;
        }
      }).join(', ');
    },

    getRequestData: function() {
      let data = Object.getPrototypeOf(this).getRequestData.call(this);
      data.launcherPoints = this.launcherPoints;
      return data;
    },

    emitRequest: function(update) {
      Object.getPrototypeOf(this).emitRequest.call(this, update);
      if (this.currentRequest === 'move') this.send('-message', `You currently have ${this.launcherPoints} Wonder Launcher points. (placeholder)`);
    },
  },
}
