'use strict';

const ANNOUNCER_NAME = 'PRChase';

/**@type {ModdedBattleScriptsData}*/
let BattleScripts = {
  inherit: 'gen4',

  announce(phrase) {
    this.add('c', ANNOUNCER_NAME, phrase);
  },

  //add misc events to battle functions so we can handle them in the announcer rule
  /*
  nextTurn() {
    Object.getPrototypeOf(this).nextTurn.call(this);
    this.runEvent('BeginTurn');
  },

  win(side) {
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
  */

  // Temporary fix to properly draw matches
  residualEvent(eventid, relayVar) {
		let statuses = this.getRelevantEffectsInner(this, 'on' + eventid, null, null, false, true, 'duration');
		statuses.sort((a, b) => this.comparePriority(a, b));
		while (statuses.length) {
			let statusObj = statuses[0];
			statuses.shift();
			let status = statusObj.status;
			if (statusObj.thing.fainted) continue;
			if (statusObj.statusData && statusObj.statusData.duration) {
				statusObj.statusData.duration--;
				if (!statusObj.statusData.duration) {
					statusObj.end.call(statusObj.thing, status.id);
					continue;
				}
			}
			this.singleEvent(eventid, status, statusObj.statusData, statusObj.thing, relayVar);

      this.faintMessages();
      if (this.ended) return;
		}
	},

  faintMessages(lastFirst = false) {
    if (this.ended) return;
		if (!this.faintQueue.length) return false;
		if (lastFirst) {
			this.faintQueue.unshift(this.faintQueue.pop());
		}
		let faintData;
    let loser = null;
		while (this.faintQueue.length) {
			faintData = this.faintQueue[0];
			this.faintQueue.shift();
			if (!faintData.target.fainted && this.runEvent('BeforeFaint', faintData.target, faintData.source, faintData.effect)) {
				this.add('faint', faintData.target);
				faintData.target.side.pokemonLeft--;
				this.runEvent('Faint', faintData.target, faintData.source, faintData.effect);
				this.singleEvent('End', this.getAbility(faintData.target.ability), faintData.target.abilityData, faintData.target);
				faintData.target.clearVolatile(false);
				faintData.target.fainted = true;
				faintData.target.isActive = false;
				faintData.target.isStarted = false;
				faintData.target.side.faintedThisTurn = true;

        if (faintData.target === faintData.source && ['explosion', 'selfdestruct'].includes(faintData.effect.id)) {
          const ruleTable = this.getRuleTable(this.getFormat());
          if (ruleTable.has('pbrselfdestructclause')) loser = faintData.target.side;
        }
			}
		}

		if (!this.p1.pokemonLeft && !this.p2.pokemonLeft) {
			this.win(loser ? loser.foe : null);
			return true;
		}
		if (!this.p1.pokemonLeft) {
			this.win(this.p2);
			return true;
		}
		if (!this.p2.pokemonLeft) {
			this.win(this.p1);
			return true;
		}
		return false;
  },

  side: {
    getColor() {
      return this.n ? 'red' : 'blue';
    },
  },
};

exports.BattleScripts = BattleScripts;
