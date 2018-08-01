'use strict';

/**@type {{[k: string]: ModdedMoveData}} */
let BattleMovedex = {
    moonlight: {
        inherit: true,
        onHit: function (pokemon) {
            if (this.isWeather(['sunnyday', 'desolateland'])) {
                this.heal(pokemon.maxhp * 2 / 3);
            } else if (this.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail', 'fog'])) {
                this.heal(pokemon.maxhp / 4);
            } else {
                this.heal(pokemon.maxhp / 2);
            }
        },
    },
    morningsun: {
        inherit: true,
        onHit: function (pokemon) {
            if (this.isWeather(['sunnyday', 'desolateland'])) {
                this.heal(pokemon.maxhp * 2 / 3);
            } else if (this.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail', 'fog'])) {
                this.heal(pokemon.maxhp / 4);
            } else {
                this.heal(pokemon.maxhp / 2);
            }
        },
    },
    solarbeam: {
        inherit: true,
        onBasePower: function (basePower, pokemon, target) {
            if (this.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail', 'fog'])) {
                this.debug('weakened by weather');
                return this.chainModify(0.5);
            }
        },
    },
    synthesis: {
        inherit: true,
        onHit: function (pokemon) {
            if (this.isWeather(['sunnyday', 'desolateland'])) {
                this.heal(pokemon.maxhp * 2 / 3);
            } else if (this.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail', 'fog'])) {
                this.heal(pokemon.maxhp / 4);
            } else {
                this.heal(pokemon.maxhp / 2);
            }
        },
    },
};

exports.BattleMovedex = BattleMovedex;