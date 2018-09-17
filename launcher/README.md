# Mathfreak231's Wonder Launcher mod

Version 0.0 alpha.

This mod implements the Wonder Launcher into the Pokémon Showdown simulator.

**THIS MOD IS EXPERIMENTAL.** Use this mod at your own risk; if it is bugged or crashes your battle, please report it to me!

The Wonder Launcher was a feature from Generation V that could be toggled in link battles.
Sides get points each turn and use them on items like Potions, Antidotes, X Attacks, and Revives.
It has been the only way items from the Bag could be used in multiplayer battles since the beginning of time.

## Client specification

Players will choose to use the Wonder Launcher on any Pokémon's turn with the following choice string:

```
launch SWITCHSPEC ITEMSPEC
```

or, when the item requires a move target (such as Ether):

```
launch SWITCHSPEC ITEMSPEC MOVESLOTSPEC
```

`SWITCHSPEC` and `MOVESLOTSPEC` are the same as they are when switching and using a move, respectively,
except that `SWITCHSPEC` cannot contain a space (therefore, using numbers instead of nicknames to choose is preferred).
`ITEMSPEC` is an item name, such as `X Attack`; if `MOVESLOTSPEC` is required, `ITEMSPEC` must not contain a space.

Examples of valid launch choice strings are:
- `launch 1 hyperpotion` uses a Hyper Potion on the Pokémon currently in slot 1.
- `launch Sparky Max Revive` uses a Max Revive on a Pokémon named Sparky.
- `launch 1 ether 2` uses an Ether on the 2nd move of the Pokémon currently in slot 1.
- `launch 2 Ether Hydro Pump` uses an Ether on the move Hydro Pump of the Pokémon currently in slot 2.

## Server specification

As far as battle mechanics go, the Wonder Launcher will be implemented as if the items were used in Gen VII.
Thus, for instance, the Hyper Potion restores only 120 HP.

## Credits

Thanks to (https://www.twitch.tv/certainlysomeonehere)[CertainlySomeoneHere] for helping out with a bit of Gen VII research.

Minor thanks to Lycanium Z for helping me get started with the Revive code.
