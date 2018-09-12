'use strict';

const ANNOUNCER_NAME = 'PRChase';

/**@type {ModdedBattleScriptsData}*/
let BattleScripts = {
	inherit: 'gen4',

	announce: function(phrase) {
		this.add('c', ANNOUNCER_NAME, phrase);
	},

	//add misc events to battle functions so we can handle them in the announcer rule
	nextTurn() {
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

		this.runEvent('BeginTurn');

		this.makeRequest('move');
	},

	win: function(side) {
		if (this.ended) {
			return false;
		}
		if (side === 'p1' || side === 'p2') {
			side = this[side];
		} else if (side !== this.p1 && side !== this.p2) {
			side = null;
		}

		this.runEvent('BattleEnded', null, null, null, side);

		this.winner = side ? side.name : '';

		this.add('');
		if (side) {
			this.add('win', side.name);
		} else {
			this.add('tie');
		}

		this.ended = true;
		this.active = false;
		this.currentRequest = '';
		for (const side of this.sides) {
			side.currentRequest = '';
		}
		return true;
	},

	side: {
		getColor: function() {
			return this.n ? 'red' : 'blue';
		}
	}
};

exports.BattleScripts = BattleScripts;
