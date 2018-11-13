'use strict';


/**@type {{[k: string]: ModdedEffectData}} */
let BattleStatuses = {
  fog: {
    id: 'fog',
    name: 'Fog',
    effectType: 'Weather',
    duration: 0,
    onStart: function() {
      this.add('-message', 'The fog is deep... (placeholder)');
      // this.add('-weather', 'Fog');
    },
    onModifyAccuracy: function (accuracy) {
      if (typeof accuracy !== 'number') return;
      this.debug('Fog modify accuracy');
      return accuracy * (3/5);
    },
    onHit: function(target, source, move) {
      if (move.id === 'defog') {
        this.clearWeather();
        this.add('-message', `${source.name} blew away the deep fog with Defog! (placeholder)`);
        // this.add('-weather', 'none', '[from] move: Defog', '[of] ' + source);
      }
    },
    onResidualOrder: 1,
    onResidual: function() {
      this.add('-message', 'The fog is deep... (placeholder)');
      // this.add('-weather', 'Fog', '[upkeep]');
    },
  },
};

exports.BattleStatuses = BattleStatuses;
