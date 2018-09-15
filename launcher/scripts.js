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

  resolveAction: function(action, midTurn = false) {
		if (!action) throw new Error(`Action not passed to resolveAction`);

		if (!action.side && action.pokemon) action.side = action.pokemon.side;
		if (!action.move && action.moveid) action.move = this.getMoveCopy(action.moveid);
		if (!action.choice && action.move) action.choice = 'move';
		if (!action.priority && action.priority !== 0) {
			let priorities = {
				'beforeTurn': 100,
				'beforeTurnMove': 99,
				'switch': 7,
				'runUnnerve': 7.3,
				'runSwitch': 7.2,
				'runPrimal': 7.1,
				'instaswitch': 101,
				'megaEvo': 6.9,
				'residual': -100,
				'team': 102,
				'start': 101,
        'launch': 6.95, //TODO confirm prio
			};
			if (action.choice in priorities) {
				action.priority = priorities[action.choice];
			}
		}
		if (!midTurn) {
			if (action.choice === 'move') {
				if (!action.zmove && action.move.beforeTurnCallback) {
					this.addToQueue({choice: 'beforeTurnMove', pokemon: action.pokemon, move: action.move, targetLoc: action.targetLoc});
				}
				if (action.mega) {
					// TODO: Check that the Pokémon is not affected by Sky Drop.
					// (This is currently being done in `runMegaEvo`).
					this.addToQueue({
						choice: 'megaEvo',
						pokemon: action.pokemon,
					});
				}
			} else if (action.choice === 'switch' || action.choice === 'instaswitch') {
				if (typeof action.pokemon.switchFlag === 'string') {
					action.sourceEffect = this.getEffect(action.pokemon.switchFlag);
				}
				action.pokemon.switchFlag = false;
				if (!action.speed) action.speed = action.pokemon.getActionSpeed();
			}
		}

		let deferPriority = this.gen >= 7 && action.mega && action.mega !== 'done';
		if (action.move) {
			let target = null;
			action.move = this.getMoveCopy(action.move);

			if (!action.targetLoc) {
				target = this.resolveTarget(action.pokemon, action.move);
				action.targetLoc = this.getTargetLoc(target, action.pokemon);
			}

			if (!action.priority && !deferPriority) {
				let move = action.move;
				if (action.zmove) {
					let zMoveName = this.getZMove(action.move, action.pokemon, true);
					let zMove = this.getMove(zMoveName);
					if (zMove.exists && zMove.isZ) {
						move = zMove;
					}
				}
				let priority = this.runEvent('ModifyPriority', action.pokemon, target, move, move.priority);
				action.priority = priority;
				// In Gen 6, Quick Guard blocks moves with artificially enhanced priority.
				if (this.gen > 5) action.move.priority = priority;
			}
		}
		if (!action.speed) {
			if ((action.choice === 'switch' || action.choice === 'instaswitch') && action.target) {
				action.speed = action.target.getActionSpeed();
			} else if (!action.pokemon) {
				action.speed = 1;
			} else if (!deferPriority) {
				action.speed = action.pokemon.getActionSpeed();
			}
		}
		return /** @type {any} */ (action);
	},

  runAction: function(action) {
		// returns whether or not we ended in a callback
		switch (action.choice) {
		case 'start': {
			// I GIVE UP, WILL WRESTLE WITH EVENT SYSTEM LATER
			let format = this.getFormat();

			// Remove Pokémon duplicates remaining after `team` decisions.
			this.p1.pokemon = this.p1.pokemon.slice(0, this.p1.pokemonLeft);
			this.p2.pokemon = this.p2.pokemon.slice(0, this.p2.pokemonLeft);

			if (format.teamLength && format.teamLength.battle) {
				// Trim the team: not all of the Pokémon brought to Preview will battle.
				this.p1.pokemon = this.p1.pokemon.slice(0, format.teamLength.battle);
				this.p1.pokemonLeft = this.p1.pokemon.length;
				this.p2.pokemon = this.p2.pokemon.slice(0, format.teamLength.battle);
				this.p2.pokemonLeft = this.p2.pokemon.length;
			}

			this.add('start');
			for (let pos = 0; pos < this.p1.active.length; pos++) {
				this.switchIn(this.p1.pokemon[pos], pos);
			}
			for (let pos = 0; pos < this.p2.active.length; pos++) {
				this.switchIn(this.p2.pokemon[pos], pos);
			}
			for (const pokemon of this.p1.pokemon) {
				this.singleEvent('Start', this.getEffect(pokemon.species), pokemon.speciesData, pokemon);
			}
			for (const pokemon of this.p2.pokemon) {
				this.singleEvent('Start', this.getEffect(pokemon.species), pokemon.speciesData, pokemon);
			}
			this.midTurn = true;
			break;
		}

		case 'move':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.runMove(action.move, action.pokemon, action.targetLoc, action.sourceEffect, action.zmove);
			break;
		case 'megaEvo':
			this.runMegaEvo(action.pokemon);
			break;
		case 'beforeTurnMove': {
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.debug('before turn callback: ' + action.move.id);
			let target = this.getTarget(action.pokemon, action.move, action.targetLoc);
			if (!target) return false;
			if (!action.move.beforeTurnCallback) throw new Error(`beforeTurnMove has no beforeTurnCallback`);
			action.move.beforeTurnCallback.call(this, action.pokemon, target);
			break;
		}

		case 'event':
			// @ts-ignore Easier than defining a custom event attribute tbh
			this.runEvent(action.event, action.pokemon);
			break;
		case 'team': {
			action.pokemon.side.pokemon.splice(action.index, 0, action.pokemon);
			action.pokemon.position = action.index;
			// we return here because the update event would crash since there are no active pokemon yet
			return;
		}

		case 'pass':
			return;
		case 'instaswitch':
		case 'switch':
			if (action.choice === 'switch' && action.pokemon.status && this.data.Abilities.naturalcure) {
				this.singleEvent('CheckShow', this.getAbility('naturalcure'), null, action.pokemon);
			}
			if (action.pokemon.hp) {
				action.pokemon.beingCalledBack = true;
				const sourceEffect = action.sourceEffect;
				// @ts-ignore
				if (sourceEffect && sourceEffect.selfSwitch === 'copyvolatile') {
					action.pokemon.switchCopyFlag = true;
				}
				if (!action.pokemon.switchCopyFlag) {
					this.runEvent('BeforeSwitchOut', action.pokemon);
					if (this.gen >= 5) {
						this.eachEvent('Update');
					}
				}
				if (!this.runEvent('SwitchOut', action.pokemon)) {
					// Warning: DO NOT interrupt a switch-out
					// if you just want to trap a pokemon.
					// To trap a pokemon and prevent it from switching out,
					// (e.g. Mean Look, Magnet Pull) use the 'trapped' flag
					// instead.

					// Note: Nothing in BW or earlier interrupts
					// a switch-out.
					break;
				}
			}
			action.pokemon.illusion = null;
			this.singleEvent('End', this.getAbility(action.pokemon.ability), action.pokemon.abilityData, action.pokemon);
			if (!action.pokemon.hp && !action.pokemon.fainted) {
				// a pokemon fainted from Pursuit before it could switch
				if (this.gen <= 4) {
					// in gen 2-4, the switch still happens
					action.priority = -101;
					this.queue.unshift(action);
					this.add('-hint', 'Pursuit target fainted, switch continues in gen 2-4');
					break;
				}
				// in gen 5+, the switch is cancelled
				this.debug('A Pokemon can\'t switch between when it runs out of HP and when it faints');
				break;
			}
			if (action.target.isActive) {
				this.add('-hint', 'Switch failed; switch target is already active');
				break;
			}
			if (action.choice === 'switch' && action.pokemon.activeTurns === 1) {
				for (const foeActive of action.pokemon.side.foe.active) {
					if (foeActive.isStale >= 2) {
						action.pokemon.isStaleCon++;
						action.pokemon.isStaleSource = 'switch';
						break;
					}
				}
			}

			this.switchIn(action.target, action.pokemon.position, action.sourceEffect);
			break;
		case 'runUnnerve':
			this.singleEvent('PreStart', action.pokemon.getAbility(), action.pokemon.abilityData, action.pokemon);
			break;
		case 'runSwitch':
			this.runEvent('SwitchIn', action.pokemon);
			if (this.gen <= 2 && !action.pokemon.side.faintedThisTurn && action.pokemon.draggedIn !== this.turn) this.runEvent('AfterSwitchInSelf', action.pokemon);
			if (!action.pokemon.hp) break;
			action.pokemon.isStarted = true;
			if (!action.pokemon.fainted) {
				this.singleEvent('Start', action.pokemon.getAbility(), action.pokemon.abilityData, action.pokemon);
				action.pokemon.abilityOrder = this.abilityOrder++;
				this.singleEvent('Start', action.pokemon.getItem(), action.pokemon.itemData, action.pokemon);
			}
			delete action.pokemon.draggedIn;
			break;
		case 'runPrimal':
			if (!action.pokemon.transformed) this.singleEvent('Primal', action.pokemon.getItem(), action.pokemon.itemData, action.pokemon);
			break;
		case 'shift': {
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			action.pokemon.activeTurns--;
			this.swapPosition(action.pokemon, 1);
			for (const foeActive of action.pokemon.side.foe.active) {
				if (foeActive.isStale >= 2) {
					action.pokemon.isStaleCon++;
					action.pokemon.isStaleSource = 'switch';
					break;
				}
			}
			break;
		}

    case 'launch':
      this.runLaunch(action.item, action.target, action.move);
      //TODO: If a pokemon is revived and its position is < the # of active slots, instantly send that Pokemon out
      break;

		case 'beforeTurn':
			this.eachEvent('BeforeTurn');
			break;
		case 'residual':
			this.add('');
			this.clearActiveMove(true);
			this.updateSpeed();
			this.residualEvent('Residual');
			this.add('upkeep');
			break;
		}

		// phazing (Roar, etc)
		for (const pokemon of this.p1.active) {
			if (pokemon.forceSwitchFlag) {
				if (pokemon.hp) this.dragIn(pokemon.side, pokemon.position);
				pokemon.forceSwitchFlag = false;
			}
		}
		for (const pokemon of this.p2.active) {
			if (pokemon.forceSwitchFlag) {
				if (pokemon.hp) this.dragIn(pokemon.side, pokemon.position);
				pokemon.forceSwitchFlag = false;
			}
		}

		this.clearActiveMove();

		// fainting

		this.faintMessages();
		if (this.ended) return true;

		// switching (fainted pokemon, U-turn, Baton Pass, etc)

		if (!this.queue.length || (this.gen <= 3 && ['move', 'residual'].includes(this.queue[0].choice))) {
			// in gen 3 or earlier, switching in fainted pokemon is done after
			// every move, rather than only at the end of the turn.
			this.checkFainted();
		} else if (action.choice === 'megaEvo' && this.gen >= 7) {
			this.eachEvent('Update');
			// In Gen 7, the action order is recalculated for a Pokémon that mega evolves.
			const moveIndex = this.queue.findIndex(queuedAction => queuedAction.pokemon === action.pokemon && queuedAction.choice === 'move');
			if (moveIndex >= 0) {
				const moveAction = /** @type {Actions["MoveAction"]} */ (this.queue.splice(moveIndex, 1)[0]);
				moveAction.mega = 'done';
				this.insertQueue(moveAction, true);
			}
			return false;
		} else if (this.queue.length && this.queue[0].choice === 'instaswitch') {
			return false;
		}

		let p1switch = this.p1.active.some(mon => mon && !!mon.switchFlag);
		let p2switch = this.p2.active.some(mon => mon && !!mon.switchFlag);

		if (p1switch && !this.canSwitch(this.p1)) {
			for (const pokemon of this.p1.active) {
				pokemon.switchFlag = false;
			}
			p1switch = false;
		}
		if (p2switch && !this.canSwitch(this.p2)) {
			for (const pokemon of this.p2.active) {
				pokemon.switchFlag = false;
			}
			p2switch = false;
		}

		if (p1switch || p2switch) {
			if (this.gen >= 5) {
				this.eachEvent('Update');
			}
			this.makeRequest('switch');
			return true;
		}

		this.eachEvent('Update');

		return false;
	},

  runLaunch: function(item, pokemon, move) {
    // This should look similar to moveHit
    // in that it checks various properties of the effect and keeps track of
    // whether or not any worked.

    item = this.getLauncherItem(item);
    if (move) move = this.battle.getMove(move);

    this.add('-message', `${pokemon.side.name} launched the ${item.name} toward ${pokemon.name}! (placeholder)`);
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
      didSomething = didSomething || hitResult;
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
        // FIXME: there's something i'm forgetting here, i just know it
        pokemon.fainted = false;
        pokemon.status = '';
        pokemon.hp = item.revive === 'max' ? pokemon.maxhp : Math.floor(pokemon.maxhp / 2);
        pokemon.side.pokemonLeft++;
        this.add('-message', `${pokemon.name} regained health! (placeholder)`);
        this.add('-hint', `If you can't click on the Pokémon after reviving it, you may need to type "/choose switch (num)" to switch it in`);
      }
    }

    if (item.onUse) {
      hitResult = this.singleEvent('Use', item, null, pokemon);
      didSomething = didSomething || hitResult;
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
		this.turn++;
		let allStale = true;
		/** @type {?Pokemon} */
		let oneStale = null;
		for (const side of this.sides) {
			for (const pokemon of side.active) {
				if (!pokemon) continue;
				pokemon.moveThisTurn = '';
				pokemon.usedItemThisTurn = false;
				pokemon.newlySwitched = false;
				pokemon.moveLastTurnResult = pokemon.moveThisTurnResult;
				pokemon.moveThisTurnResult = undefined;

				pokemon.maybeDisabled = false;
				for (const moveSlot of pokemon.moveSlots) {
					moveSlot.disabled = false;
					moveSlot.disabledSource = '';
				}
				this.runEvent('DisableMove', pokemon);
				if (!pokemon.ateBerry) pokemon.disableMove('belch');

				if (pokemon.lastAttackedBy) {
					if (pokemon.lastAttackedBy.pokemon.isActive) {
						pokemon.lastAttackedBy.thisTurn = false;
					} else {
						pokemon.lastAttackedBy = null;
					}
					if (this.gen >= 7) pokemon.knownType = true; // If it was an illusion, it's not any more
				}

				if (this.gen >= 7) {
					// In Gen 7, the real type of every Pokemon is visible to all players via the bottom screen while making choices
					const seenPokemon = pokemon.illusion || pokemon;
					const realTypeString = seenPokemon.getTypes(true).join('/');
					if (realTypeString !== seenPokemon.apparentType) {
						this.add('-start', pokemon, 'typechange', realTypeString, '[silent]');
						seenPokemon.apparentType = realTypeString;
						if (pokemon.addedType) {
							// The typechange message removes the added type, so put it back
							this.add('-start', pokemon, 'typeadd', pokemon.addedType, '[silent]');
						}
					}
				}

				pokemon.trapped = pokemon.maybeTrapped = false;
				this.runEvent('TrapPokemon', pokemon);
				if (!pokemon.knownType || this.getImmunity('trapped', pokemon)) {
					this.runEvent('MaybeTrapPokemon', pokemon);
				}
				// canceling switches would leak information
				// if a foe might have a trapping ability
				if (this.gen > 2) {
					for (const source of pokemon.side.foe.active) {
						if (!source || source.fainted) continue;
						let template = (source.illusion || source).template;
						if (!template.abilities) continue;
						for (let abilitySlot in template.abilities) {
							// @ts-ignore
							let abilityName = template.abilities[abilitySlot];
							if (abilityName === source.ability) {
								// pokemon event was already run above so we don't need
								// to run it again.
								continue;
							}
							const ruleTable = this.getRuleTable(this.getFormat());
							if (!ruleTable.has('-illegal') && !this.getFormat().team) {
								// hackmons format
								continue;
							} else if (abilitySlot === 'H' && template.unreleasedHidden) {
								// unreleased hidden ability
								continue;
							}
							let ability = this.getAbility(abilityName);
							if (ruleTable.has('-ability:' + ability.id)) continue;
							if (pokemon.knownType && !this.getImmunity('trapped', pokemon)) continue;
							this.singleEvent('FoeMaybeTrapPokemon', ability, {}, pokemon, source);
						}
					}
				}

				if (pokemon.fainted) continue;
				if (pokemon.isStale < 2) {
					if (pokemon.isStaleCon >= 2) {
						if (pokemon.hp >= pokemon.isStaleHP - pokemon.maxhp / 100) {
							pokemon.isStale++;
							if (this.firstStaleWarned && pokemon.isStale < 2) {
								switch (pokemon.isStaleSource) {
								case 'struggle':
									this.add('bigerror', `${pokemon.name} isn't losing HP from Struggle. If this continues, it will be classified as being in an endless loop`);
									break;
								case 'drag':
									this.add('bigerror', `${pokemon.name} isn't losing PP or HP from being forced to switch. If this continues, it will be classified as being in an endless loop`);
									break;
								case 'switch':
									this.add('bigerror', `${pokemon.name} isn't losing PP or HP from repeatedly switching. If this continues, it will be classified as being in an endless loop`);
									break;
								}
							}
						}
						pokemon.isStaleCon = 0;
						pokemon.isStalePPTurns = 0;
						pokemon.isStaleHP = pokemon.hp;
					}
					if (pokemon.isStalePPTurns >= 5) {
						if (pokemon.hp >= pokemon.isStaleHP - pokemon.maxhp / 100) {
							pokemon.isStale++;
							pokemon.isStaleSource = 'ppstall';
							if (this.firstStaleWarned && pokemon.isStale < 2) {
								this.add('bigerror', `${pokemon.name} isn't losing PP or HP. If it keeps on not losing PP or HP, it will be classified as being in an endless loop.`);
							}
						}
						pokemon.isStaleCon = 0;
						pokemon.isStalePPTurns = 0;
						pokemon.isStaleHP = pokemon.hp;
					}
				}
				if (pokemon.getMoves().length === 0) {
					pokemon.isStaleCon++;
					pokemon.isStaleSource = 'struggle';
				}
				if (pokemon.isStale < 2) {
					allStale = false;
				} else if (pokemon.isStale && !pokemon.staleWarned) {
					oneStale = pokemon;
				}
				if (!pokemon.isStalePPTurns) {
					pokemon.isStaleHP = pokemon.hp;
					if (pokemon.activeTurns) pokemon.isStaleCon = 0;
				}
				if (pokemon.activeTurns) {
					pokemon.isStalePPTurns++;
				}
				pokemon.activeTurns++;
			}
			side.faintedLastTurn = side.faintedThisTurn;
			side.faintedThisTurn = false;
      if (side.launcherPoints < 14) side.launcherPoints++;
		}
		const ruleTable = this.getRuleTable(this.getFormat());
		if (ruleTable.has('endlessbattleclause')) {
			if (oneStale) {
				let activationWarning = ` - If all active Pok\u00e9mon go in an endless loop, Endless Battle Clause will activate.`;
				if (allStale) activationWarning = ``;
				let loopReason = ``;
				switch (oneStale.isStaleSource) {
				case 'struggle':
					loopReason = `: it isn't losing HP from Struggle`;
					break;
				case 'drag':
					loopReason = `: it isn't losing PP or HP from being forced to switch`;
					break;
				case 'switch':
					loopReason = `: it isn't losing PP or HP from repeatedly switching`;
					break;
				case 'getleppa':
					loopReason = `: it got a Leppa Berry it didn't start with`;
					break;
				case 'useleppa':
					loopReason = `: it used a Leppa Berry it didn't start with`;
					break;
				case 'ppstall':
					loopReason = `: it isn't losing PP or HP`;
					break;
				case 'ppoverflow':
					loopReason = `: its PP overflowed`;
					break;
				}
				this.add('bigerror', `${oneStale.name} is in an endless loop${loopReason}.${activationWarning}`);
				oneStale.staleWarned = true;
				this.firstStaleWarned = true;
			}
			if (allStale) {
				this.add('message', `All active Pok\u00e9mon are in an endless loop. Endless Battle Clause activated!`);
				let leppaPokemon = null;
				for (const side of this.sides) {
					for (const pokemon of side.pokemon) {
						if (toId(pokemon.set.item) === 'leppaberry') {
							if (leppaPokemon) {
								leppaPokemon = null; // both sides have Leppa
								this.add('-message', `Both sides started with a Leppa Berry.`);
							} else {
								leppaPokemon = pokemon;
							}
							break;
						}
					}
				}
				if (leppaPokemon) {
					this.add('-message', `${leppaPokemon.side.name}'s ${leppaPokemon.name} started with a Leppa Berry and loses.`);
					this.win(leppaPokemon.side.foe);
					return;
				}
				this.win();
				return;
			}
			if ((this.turn >= 500 && this.turn % 100 === 0) ||
				(this.turn >= 900 && this.turn % 10 === 0) ||
				(this.turn >= 990)) {
				const turnsLeft = 1000 - this.turn;
				if (turnsLeft < 0) {
					this.add('message', `It is turn 1000. Endless Battle Clause activated!`);
					this.tie();
					return;
				}
				const turnsLeftText = (turnsLeft === 1 ? `1 turn` : `${turnsLeft} turns`);
				this.add('bigerror', `You will auto-tie if the battle doesn't end in ${turnsLeftText} (on turn 1000).`);
			}
		} else {
			if (allStale && !this.staleWarned) {
				this.staleWarned = true;
				this.add('bigerror', `If this format had Endless Battle Clause, it would have activated.`);
			} else if (oneStale) {
				this.add('bigerror', `${oneStale.name} is in an endless loop.`);
				oneStale.staleWarned = true;
			}
		}

		if (this.gameType === 'triples' && !this.sides.filter(side => side.pokemonLeft > 1).length) {
			// If both sides have one Pokemon left in triples and they are not adjacent, they are both moved to the center.
			let actives = [];
			for (const side of this.sides) {
				for (const pokemon of side.active) {
					if (!pokemon || pokemon.fainted) continue;
					actives.push(pokemon);
				}
			}
			if (actives.length > 1 && !this.isAdjacent(actives[0], actives[1])) {
				this.swapPosition(actives[0], 1, '[silent]');
				this.swapPosition(actives[1], 1, '[silent]');
				this.add('-center');
			}
		}

		this.add('turn', this.turn);

		this.makeRequest('move');
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
      // TODO: In at least Gen 5, if you switch out a Pokemon you were going to use an item on,
      // the item still targets the same party slot as the original target.

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
          // (even though this is impossible in practice)
          moveGiven = true;

          // Find out the move. Same specification as using the move
          let moveIndex = parseInt(moveText) - 1;
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

      this.choice.actions.push({
        choice: 'launch',
        pokemon,
        target: targetPokemon,
        item,
        move,
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
  		let data = {
  			name: this.name,
  			id: this.id,
        launcherPoints: this.launcherPoints,
  			/**@type {AnyObject[]} */
  			pokemon: [],
  		};
  		for (const pokemon of this.pokemon) {
  			let entry = {
  				ident: pokemon.fullname,
  				details: pokemon.details,
  				condition: pokemon.getHealth(pokemon.side),
  				active: (pokemon.position < pokemon.side.active.length),
  				stats: {
  					atk: pokemon.baseStats['atk'],
  					def: pokemon.baseStats['def'],
  					spa: pokemon.baseStats['spa'],
  					spd: pokemon.baseStats['spd'],
  					spe: pokemon.baseStats['spe'],
  				},
  				moves: pokemon.moves.map(move => {
  					if (move === 'hiddenpower') {
  						return move + toId(pokemon.hpType) + (pokemon.hpPower === 70 ? '' : pokemon.hpPower);
  					}
  					return move;
  				}),
  				baseAbility: pokemon.baseAbility,
  				item: pokemon.item,
  				pokeball: pokemon.pokeball,
  			};
  			if (this.battle.gen > 6) entry.ability = pokemon.ability;
  			data.pokemon.push(entry);
  		}
  		return data;
  	},

    emitRequest: function(update) {
  		this.battle.send('sideupdate', `${this.id}\n|request|${JSON.stringify(update)}`);
      if (this.currentRequest === 'move') this.send('-message', `You currently have ${this.launcherPoints} Wonder Launcher points. (placeholder)`);
  	},
  },
}
