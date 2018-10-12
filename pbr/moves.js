'use strict';

/**@type {{[k: string]: ModdedMoveData}} */
let BattleMovedex = {
  camouflage: {
    inherit: true,
    onHit: function (target) {
      let newType;
      switch(this.colosseum) {
        case 'gateway':
          newType = 'Water';
          break;
        case 'waterfall': case 'sunnypark':
          newType = 'Grass';
          break;
        case 'crystal': case 'magma': case 'stargazer':
          newType = 'Rock';
          break;
        case 'sunset':
          newType = 'Ground';
          break;
        default:
          newType = 'Normal';
      }

      if (!target.setType(newType)) return false;
      this.add('-start', target, 'typechange', newType);
    },
  },
  hypnosis: {
    inherit: true,
    accuracy: 70,
  },
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
  naturepower: {
    inherit: true,
    onTryHit: function (target, pokemon) {
      let move;
      switch(this.colosseum) {
        case 'gateway':
          move = 'hydropump';
          break;
        case 'waterfall': case 'sunnypark':
          move = 'seedbomb';
          break;
        case 'crystal': case 'magma': case 'stargazer':
          move = 'rockslide';
          break;
        case 'sunset':
          move = 'earthquake';
          break;
        default:
          move = 'triattack';
      }
      this.useMove(move, pokemon, target);
      return null;
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
