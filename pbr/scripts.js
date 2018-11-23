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

  side: {
    getColor() {
      return this.n ? 'red' : 'blue';
    },
  },
};

exports.BattleScripts = BattleScripts;
