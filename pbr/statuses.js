'use strict';


/**@type {{[k: string]: ModdedEffectData}} */
let BattleStatuses = {
    fog: {
		id: 'fog',
		name: 'Fog',
        effectType: 'Weather',
        duration: 0,
        onStart: function() {
			this.add('-message','The fog is deep...');
            this.add('-weather','Fog');
        },
        onModifyAccuracy: function (accuracy) {
			if (typeof accuracy !== 'number') return;
            this.debug('Fog modify accuracy');
            return accuracy * (3/5);
        },
        onResidualOrder: 1,
        onResidual: function() {
            this.add('-message','The fog is deep...');
            this.add('-weather','Fog','[upkeep]');
        },
    },
};

exports.BattleStatuses = BattleStatuses;