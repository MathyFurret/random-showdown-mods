'use strict';

exports.BattleLauncherItems = {
  'abilityurge': {
    id: 'abilityurge',
    name: "Ability Urge",
    num: 0,
    desc: "Activates the Pokémon's ability for the effect it would have when entering battle.",
    onUse: function(pokemon) {
      //const canUrge = [];
      if (!pokemon.isActive) {
        this.add('-message', "But it's not where this item can be used! (placeholder)");
        return null;
      }
      const ability = pokemon.getAbility();
      //if (!canUrge.includes(ability.id)) return false;
      if (!ability.onStart) return false;
      this.singleEvent('Start', ability, pokemon.abilityData, pokemon);
    },
    cost: 3,
  },
  'antidote': {
    id: 'antidote',
    name: "Antidote",
    num: 0,
    desc: "Cures poison.",
    curesStatus: "psn",
    cost: 4,
  },
  'ether': {
    id: 'ether',
    name: "Ether",
    num: 0,
    desc: "Restores 10 PP to one move.",
    restorePP: 10,
    cost: 12,
  },
  'xattack': {
    id: 'xattack',
    name: "X Attack",
    num: 0,
    desc: "Boosts Attack by 1 stage.",
    boosts: {
      atk: 1,
    },
    cost: 3,
  },
  'xattack2': {
    id: 'xattack2',
    name: "X Attack 2",
    num: 0,
    desc: "Boosts Attack by 2 stages.",
    boosts: {
      atk: 2,
    },
    cost: 5,
  },
  'xattack3': {
    id: 'xattack3',
    name: "X Attack 3",
    num: 0,
    desc: "Boosts Attack by 3 stages.",
    boosts: {
      atk: 3,
    },
    cost: 7,
  },
};
