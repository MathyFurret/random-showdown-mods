'use strict';

const ANNOUNCER_NAME = 'PRChase';

/**@type {ModdedBattleScriptsData}*/
let BattleScripts = {
	inherit: 'gen4',
	
	announce: function(phrase) {
		this.add('c', ANNOUNCER_NAME, phrase);
	},
};

exports.BattleScripts = BattleScripts;