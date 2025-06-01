# Foundry VTT Macros Collection

Useful macros for Foundry Virtual Tabletop v13+.

## Installation

1. Copy macro code from any `.js` file
2. Create new macro in Foundry VTT
3. Paste code and save

## Macros

### Region Behavior Toggle
**File:** `region-behavior-toggle.js`
Toggle region behaviors on/off from a clean dialog interface.
- Foundry VTT v13+
- System-agnostic

### Darkness Slider
**File:** `darkness-slider.js`
Interactive dialog for smooth scene darkness adjustment with real-time animation.
- Foundry VTT v13+
- System-agnostic

### Game Time Weraldiz
**File:** `game_time_weraldiz.js`
Interactive game time macro, that lets you advance time. 1 year = 512 days; 1 year = 16 months; 1 month = 32 days; 1 week = 8 days; 1 day = 32 hours; with 3 intercalary leap days every 5 years. Because this world is special. ;)
- Foundry VTT v13+
- System-agnostic

### MCDM_MinionManagment
A collection of four macros, that lets you manage multiple minions groups and see which ones have already moved or attacked.

Mark a selected group of tokens with a custom status effect with a key "group01", "group02" or "group03". You can use [Custom D&D](https://github.com/Larkinabout/fvtt-custom-dnd5e/) for example to create custom effects.

`mark_minion_group.js`: Lets you mark the active group. They get two status effects: Attack & Move: You can remove them individually with the following macros when a token is selected.

`delete_move.js`: Removes the "Move" status effect

`delete_attack.js`: Removes the "Attack" statuts effect.

`remove_minion_group_marker.js`: Removes the animation from the whole group.
- Foundry VTT v13+
- D&D5e 5.x
- J2BA

## License

MIT License
