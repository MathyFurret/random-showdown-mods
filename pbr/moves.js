'use strict';

/**@type {{[k: string]: ModdedMoveData}} */
let BattleMovedex = {
  camouflage: {
    inherit: true,
    onHit: function (target) {
      let newType;
      switch (this.colosseum) {
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
  chatter: {
    inherit: true,
    secondary: {
      chance: 1,
      volatileStatus: 'confusion',
    },
  },
  furycutter: {
    inherit: true,
    effect: {
      duration: 2,
      onStart: function () {
        this.effectData.multiplier = 1;
      },
      onRestart: function () {
        if (this.effectData.multiplier < 16) this.effectData.multiplier *= 2;
      },
      onAfterMoveSecondarySelf: function() {
        this.effectData.duration = 2;
      },
    }
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
    onHit: function (pokemon) {
      let move;
      switch (this.colosseum) {
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
      this.useMove(move, pokemon);
    },
  },
  secretpower: {
    inherit: true,
    secondary: {
      chance: 30,
      onHit: function(target, source, move) {
        switch (this.colosseum) {
          case 'gateway':
            this.boost({atk: -1}, target, source, null, true);
            break;
          case 'waterfall': case 'sunnypark':
            target.trySetStatus('slp');
            break;
          case 'crystal': case 'magma': case 'stargazer':
            target.addVolatile('flinch');
            break;
          case 'sunset':
            this.boost({accuracy: -1}, target, source, null, true);
            break;
          default:
            target.trySetStatus('par');
            break;
        }
      },
    },
  },
  solarbeam: {
    inherit: true,
    onBasePower: function (basePower) {
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
