'use strict';

/**@type {{[k: string]: ModdedAbilityData}} */
let BattleAbilities = {};

/*
Quick Slash (Primal Kabutops ability), source unknown
"All STAB moves gain +1 priority"
*/
BattleAbilities['quickslash'] = {
	shortDesc: "All moves this Pokemon uses of its own type gain +1 priority.",
	onModifyPriority: function(priority, pokemon, target, move) {
		if (pokemon.hasType(move.type) && move.type !== '???') {
			return priority + 1;
		}
	},
	id: 'quickslash',
	name: "Quick Slash",
	rating: 4,
}

/*
Illuminate, Honey Gather buffs, suggested by woenx

[21:32:54] woenx: buff to illuminate, prevents evasion from getting gained by enemy
[21:34:04] woenx: anyway, if anything honey gather will just lower evasion of enemy once you enter a battle IF youre holding honey.
*/
BattleAbilities['illuminate'] = {
	// POOR CLIENT SUPPORT (Ability activation does not show, there is only a "But it failed!" message)
	inherit: true,
	shortDesc: "Prevents foes' evasiveness from rising.",
	onFoeBoost: function(boost, target, source, effect) {
		if (boost.evasion && boost.evasion > 0) {
			delete boost.evasion;
			this.add("-fail", target, "boost", "evasiveness", "[from] ability: Illuminate", "[of] " + this.effectData.target);
		}
	},
	rating: 1.5,
};

BattleAbilities['honeygather'] = {
	// DOES NOT WORK ON ITS OWN because I'm too lazy to add another useless item to the itemdex. As long as Honey is an item in the itemdex, this will work
	// POOR CLIENT SUPPORT (Ability activation shows on the foe, as well)
	inherit: true,
	desc: "When this Pokemon is sent out, if it is holding Honey, the evasiveness of all adjacent foes drops by 1 stage.",
	shortDesc: "If holding Honey, lowers evasiveness of foes by 1.",
	onStart: function(pokemon) {
		if (!pokemon.hasItem('honey')) return;
		let activated = false;
		for (const target of pokemon.side.foe.active) {
			if (!target || !this.isAdjacent(target, pokemon)) continue;
			if (!activated) {
				this.add('-ability', pokemon, 'Honey Gather', 'boost');
				activated = true;
			}
			if (target.volatiles['substitute']) {
				this.add('-immune', target, '[msg]');
			} else {
				this.boost({evasion: -1}, target, pokemon);
			}
		}
	},
	rating: 1.5,
}

//exports.BattleAbilities = BattleAbilities;
