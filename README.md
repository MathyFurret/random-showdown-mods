# Mathfreak231's Random Showdown Mods

Here you can find some random mods I have created for Pokemon Showdown's battle engine. 
A *mod* is a collection of battle data (Pokemon, moves, items, etc.) and/or new methods to the simulator's classes that override those in a parent mod (usually `gen7`).

## How to install/use

If someone suggest a better way to do this, feel free to tell me! I might just be an idiot.
Click on the green "Clone or download" button in the top right corner of the repository page, choose how you would like to download it, and you'll then have the `random-showdown-mods` repository.
From then just copy the folders to the `/mods` directory of your Pokemon Showdown installation.
I am actively updating these, so you may need to re-download from time to time for updates.

To use a mod in a format, simply change the `mod` property to the name of the mod's directory. You can also add rules that are defined in the mod's `rulesets.js`. Example:

```javascript
	{
		name: "[Gen 4] PBR",
		desc: `A Gen 4 format with PBR mechanics.`,
		mod: 'pbr',
		ruleset: ['PBR Sleep/Freeze Clause'],
	},
```

**DISCLAIMER:** Although I will try to TypeScript where I can, I make no guarantee that my code is compliant with PS's TypeScript standards.
If your tests are failing, you may need to go into `tsconfig.json` and add `./mods/{MODNAME}/*` to the `exclude` list.