'use strict';


/*
notImplemented: true to make the item unuseable because it hasn't been adequately researched.

curesStatus: the name of the status or 'all'
heal: an integer value or 'max'
boosts: a SparseBoostsTable
restorePP: an integer value or 'max'
restoreAllPP: an integer value or 'max'
revive: true or 'max'
onUse: an event handler

cost: number of points it uses
*/
exports.BattleLauncherItems = {
  'itemurge': {
    id: 'itemurge',
    name: "Item Urge",
    desc: "Makes the Pokémon consume its held item, if able.",
    notImplemented: true,
    cost: 1,
  },
  'potion': {
    id: 'potion',
    name: "Potion",
    desc: "Restores 20 HP.",
    heal: 20,
    cost: 2,
  },
  'abilityurge': {
    id: 'abilityurge',
    name: "Ability Urge",
    desc: "Activates the Pokémon's ability for the effect it would have when entering battle.",
    onUse: function(pokemon) {
      //const canUrge = [];
      if (!pokemon.isActive) return null;
      const ability = pokemon.getAbility();
      //if (!canUrge.includes(ability.id)) return false;
      if (!ability.onStart) return false;
      this.singleEvent('Start', ability, pokemon.abilityData, pokemon);
    },
    cost: 3,
  },
  'xattack': {
    id: 'xattack',
    name: "X Attack",
    desc: "Boosts Attack by 1 stage.",
    boosts: {
      atk: 1,
    },
    cost: 3,
  },
  'xdefend': {
    id: 'xdefend',
    name: "X Defend",
    desc: "Boosts Defense by 1 stage.",
    boosts: {
      def: 1,
    },
    cost: 3,
  },
  'xspecial': {
    id: 'xspecial',
    name: "X Special",
    desc: "Boosts Special Attack by 1 stage.",
    boosts: {
      spa: 1,
    },
    cost: 3,
  },
  'xspdef': {
    id: 'xspdef',
    name: "X Sp. Def",
    desc: "Boosts Special Defense by 1 stage.",
    boosts: {
      spd: 1,
    },
    cost: 3,
  },
  'xspeed': {
    id: 'xspeed',
    name: "X Speed",
    desc: "Boosts Speed by 1 stage.",
    boosts: {
      spe: 1,
    },
    cost: 3,
  },
  'xaccuracy': {
    id: 'xaccuracy',
    name: "X Accuracy",
    desc: "Boosts accuracy by 1 stage.",
    boosts: {
      accuracy: 1,
    },
    cost: 3,
  },
  'direhit': {
    id: 'direhit',
    name: "Dire Hit",
    desc: "Raises the target's chance for a critical hit by 2 stages. Fails if it already has the effect.",
    onUse: function(pokemon) {
      return pokemon.addVolatile('focusenergy');
    },
    cost: 3,
  },
  'guardspec': {
    // TODO: Does Guard Spec. actually target a Pokémon?
    id: 'guardspec',
    name: "Guard Spec.",
    notImplemented: true,
    desc: "For 5 turns, the target and its party members are protected from having their stat stages lowered by other Pokemon. Fails if the effect is already active on the user's side.",
    onUse: function(pokemon) {
      return pokemon.side.addSideCondition('mist');
    },
    cost: 3,
  },
  'superpotion': {
    id: 'superpotion',
    name: "Super Potion",
    desc: "Restores 60 HP.",
    heal: 60,
    cost: 4,
  },
  'antidote': {
    id: 'antidote',
    name: "Antidote",
    desc: "Cures poison.",
    curesStatus: "psn",
    cost: 4,
  },
  'paralyzeheal': {
    id: 'paralyzeheal',
    name: "Paralyze Heal",
    desc: "Cures paralysis.",
    curesStatus: "par",
    cost: 4,
  },
  'awakening': {
    id: 'awakening',
    name: "Awakening",
    desc: "Cures sleep.",
    curesStatus: "slp",
    cost: 4,
  },
  'burnheal': {
    id: 'burnheal',
    name: "Burn Heal",
    desc: "Cures burn.",
    curesStatus: "brn",
    cost: 4,
  },
  'iceheal': {
    id: 'iceheal',
    name: "Ice Heal",
    desc: "Cures freezing.",
    curesStatus: "frz",
    cost: 4,
  },
  'itemdrop': {
    id: 'itemdrop',
    name: "Item Drop",
    desc: "Causes the target to lose its held item.",
    notImplemented: true,
    onUse: function(pokemon) {
      let item = pokemon.takeItem();
      if (!item) return false;
      this.add('-enditem', pokemon, item.name);
      // TODO: What actual message is shown? Can the item be dropped even w/ Sticky Hold, etc?
    },
    cost: 5,
  },
  'xattack2': {
    id: 'xattack2',
    name: "X Attack 2",
    desc: "Boosts Attack by 2 stages.",
    boosts: {
      atk: 2,
    },
    cost: 5,
  },
  'xdefend2': {
    id: 'xdefend2',
    name: "X Defend 2",
    desc: "Boosts Defense by 2 stages.",
    boosts: {
      def: 2,
    },
    cost: 5,
  },
  'xspecial2': {
    id: 'xspecial2',
    name: "X Special 2",
    desc: "Boosts Attack by 2 stages.",
    boosts: {
      spa: 2,
    },
    cost: 5,
  },
  'xspdef2': {
    id: 'xspdef2',
    name: "X Sp. Def 2",
    desc: "Boosts Special Defense by 2 stages.",
    boosts: {
      spd: 2,
    },
    cost: 5,
  },
  'xspeed2': {
    id: 'xspeed2',
    name: "X Speed 2",
    desc: "Boosts Speed by 2 stages.",
    boosts: {
      spe: 2,
    },
    cost: 5,
  },
  'xaccuracy2': {
    id: 'xaccuracy2',
    name: "X Accuracy 2",
    desc: "Boosts accuracy by 2 stages.",
    boosts: {
      accuracy: 2,
    },
    cost: 5,
  },
  'direhit2': {
    id: 'direhit2',
    name: "Dire Hit 2",
    desc: "Raises the target's chance for a critical hit by 2 stages.",
    notImplemented: true,
    cost: 5,
  },
  'fullheal': {
    id: 'fullheal',
    name: "Full Heal",
    desc: "Cures all major status conditions and confusion.",
    curesStatus: 'all',
    cost: 6,
  },
  'xattack3': {
    id: 'xattack3',
    name: "X Attack 3",
    desc: "Boosts Attack by 3 stages.",
    boosts: {
      atk: 3,
    },
    cost: 7,
  },
  'xdefend3': {
    id: 'xdefend3',
    name: "X Defend 3",
    desc: "Boosts Defense by 3 stages.",
    boosts: {
      def: 3,
    },
    cost: 7,
  },
  'xspecial3': {
    id: 'xspecial3',
    name: "X Special 3",
    desc: "Boosts Special Attack by 3 stages.",
    boosts: {
      spa: 3,
    },
    cost: 7,
  },
  'xspdef3': {
    id: 'xspdef3',
    name: "X Sp. Def 3",
    desc: "Boosts Special Defense by 3 stages.",
    boosts: {
      spd: 3,
    },
    cost: 7,
  },
  'xspeed3': {
    id: 'xspeed3',
    name: "X Speed 3",
    desc: "Boosts Speed by 3 stages.",
    boosts: {
      spe: 3,
    },
    cost: 7,
  },
  'xaccuracy3': {
    id: 'xaccuracy3',
    name: "X Accuracy 3",
    desc: "Boosts accuracy by 3 stages.",
    boosts: {
      accuracy: 3,
    },
    cost: 7,
  },
  'direhit3': {
    id: 'direhit3',
    name: "Dire Hit 3",
    desc: "Raises the target's chance for a critical hit by 3 stages.",
    notImplemented: true,
    cost: 7,
  },
  'hyperpotion': {
    id: 'hyperpotion',
    name: "Hyper Potion",
    desc: "Restores 120 HP.",
    heal: 120,
    cost: 8,
  },
  'reseturge': {
    id: 'reseturge',
    name: "Reset Urge",
    desc: "Resets the Pokémon's stat changes.",
    onUse: function(pokemon) {
      if (!pokemon.isActive) return null;
      pokemon.clearBoosts();
      this.add('-clearboost', pokemon);
    },
    cost: 9,
  },
  'maxpotion': {
    id: 'maxpotion',
    name: "Max Potion",
    desc: "Completely restores HP.",
    heal: 'max',
    cost: 10,
  },
  'revive': {
    id: 'revive',
    name: "Revive",
    desc: "Revives a fainted Pokémon, restoring 1/2 its max HP.",
    revive: true,
    cost: 11,
  },
  'ether': {
    id: 'ether',
    name: "Ether",
    desc: "Restores 10 PP to one move.",
    restorePP: 10,
    cost: 12,
  },
  'xattack6': {
    id: 'xattack6',
    name: "X Attack 6",
    desc: "Boosts Attack by 6 stages.",
    boosts: {
      atk: 6,
    },
    cost: 12,
  },
  'xdefend6': {
    id: 'xdefend6',
    name: "X Defend 6",
    desc: "Boosts Defense by 6 stages.",
    boosts: {
      def: 6,
    },
    cost: 12,
  },
  'xspecial6': {
    id: 'xspecial6',
    name: "X Special 6",
    desc: "Boosts Special Attack by 6 stages.",
    boosts: {
      spa: 6,
    },
    cost: 12,
  },
  'xspdef6': {
    id: 'xspdef6',
    name: "X Sp. Def 6",
    desc: "Boosts Special Defense by 6 stages.",
    boosts: {
      spd: 6,
    },
    cost: 12,
  },
  'xspeed6': {
    id: 'xspeed6',
    name: "X Speed 6",
    desc: "Boosts Speed by 6 stages.",
    boosts: {
      spe: 6,
    },
    cost: 12,
  },
  'xaccuracy6': {
    id: 'xaccuracy6',
    name: "X Accuracy 6",
    desc: "Boosts accuracy by 6 stages.",
    boosts: {
      accuracy: 6,
    },
    cost: 12,
  },
  'fullrestore': {
    id: 'fullrestore',
    name: "Full Restore",
    desc: "Completely restores HP and cures any major status condition along with confusion.",
    heal: 'max',
    curesStatus: 'all',
    cost: 13,
  },
  'maxrevive': {
    id: 'maxrevive',
    name: "Max Revive",
    desc: "Revives a fainted Pokémon, completely restoring its HP.",
    revive: 'max',
    cost: 14,
  },
};
