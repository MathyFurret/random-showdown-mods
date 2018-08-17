'use strict';

/**@type {{[k: string]: ModdedFormatsData}} */
let BattleFormats = {
	pbrannouncer: {
		// ok this is just me playing around with the events system Kappa
		effectType: 'Rule',
		name: "PBR Announcer",
		desc: "Puts an announcer in your battle! PRChase 7",
		onFaintPriority: 999,
		onFaint: function(target, source, effect) {
			if (effect && effect.effectType === 'Move' && source && target !== source) {
				if (effect.id === 'focuspunch') return; // Focus Punch is broken
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
					switch(this.random(3)) {
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
				switch(effect && effect.id) {
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
					case 'psn':
						this.announce(this.random(2) ? "The damage from poison finished it." : "It's down due do damage from poison.");
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
				}
			}
		}
	},
};

exports.BattleFormats = BattleFormats;