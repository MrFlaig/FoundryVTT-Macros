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
---
### Darkness Slider
**File:** `darkness-slider.js`
Interactive dialog for smooth scene darkness adjustment with real-time animation.
- Foundry VTT v13+
- System-agnostic
---
### Game Time Weraldiz
**File:** `game_time_weraldiz.js`
Interactive game time macro, that lets you advance time. 1 year = 512 days; 1 year = 16 months; 1 month = 32 days; 1 week = 8 days; 1 day = 32 hours; with 3 intercalary leap days every 5 years. Because this world is special. ;)
- Foundry VTT v13+
- System-agnostic
---
### MCDM Minion Management
MinionManagment
A collection of four macros, that lets you manage multiple minions groups and see which ones have already moved or attacked.

Mark a selected group of tokens with a custom status effect with a key "group01", "group02" or "group03". You can use [Custom D&D](https://github.com/Larkinabout/fvtt-custom-dnd5e/) for example to create custom effects.

**File:** `mark_minion_group.js`: Lets you mark the active group. They get two status effects: Attack & Move: You can remove them individually with the following macros when a token is selected.

**File:** `delete_move.js`: Removes the "Move" status effect

**File:** `delete_attack.js`: Removes the "Attack" statuts effect.

**File:** `remove_minion_group_marker.js`: Removes the animation from the whole group.
- Foundry VTT v13+
- D&D5e 5.x
- J2BA
---
### Theatre Actors
A temporary solution to make up for Theatre Inserts until it hopefully gets updated to V13

**File:** `theatre.js`: Lets you create a dialog to display actor images on top of the ui.

<img src="https://raw.githubusercontent.com/MrFlaig/FoundryVTT-Macros/refs/heads/master/images/theatre.png" alt="Screenshot of the macro" width="500"/>

- Foundry VTT v13+
- System-agnostic
- Sequencer
---
# Module Profiles Manager

**File:** `module-profiles.js`

Interactive application for saving, managing, and switching between different module configurations. Create named profiles of your current module setup and quickly apply them later with automatic world reload.

**Features:**
- Save current module configuration as named profiles
- Apply saved profiles with change preview
- Import/export profiles for sharing
- Persistent storage via macro document flags
- Clean, modern interface with real-time module statistics

**Requirements:**
- Foundry VTT v13+
- GM permissions (for applying profiles)
- Must be run from a saved macro for data persistence

## Flag Scope Configuration

The macro automatically stores profile data using your current system's ID as the flag scope, ensuring proper data organization and universal compatibility across all Foundry systems.

### Current Configuration
```javascript
static FLAG_SCOPE = game.system.id;  // Auto-detects current system
static FLAG_KEY = "module-profiles-data";
```

### Alternative: Cross-System Storage

If you want profiles to be shared between different systems in the same world:
```javascript
static FLAG_SCOPE = "world";  // System-agnostic storage
```

**Note:** Using `"world"` scope means all systems will see the same profiles, which may not be ideal since different systems typically require different module configurations.

### Usage Notes

- **Data Persistence:** Profiles are saved as flags on the macro document. Deleting the macro removes all profiles.
- **System-Specific:** Profiles are automatically scoped to the current system. Each system maintains separate profile data for optimal organization.
- **GM Only:** Only Game Masters can apply module configuration changes due to Foundry security restrictions.
- **Auto-Reload:** Applying a profile automatically reloads the world to activate module changes.
---
# Settings Manager

**File:** `settings-manager.js`

Modern interface for exporting and importing Foundry VTT settings. Manage client settings (per-user) and world settings (global) with selective module filtering and comprehensive validation.

**Features:**
- Export settings by scope (Client, World, or Both)
- Selective export by module with active/inactive indicators
- Import from JSON files or pasted text
- Validates settings before import to prevent errors
- Skips inactive/unregistered modules automatically
- Clean, filterable interface with module status display

**Requirements:**
- Foundry VTT v13+
- GM permissions (for world settings only)
- No persistent storage needed (works with live settings)

## Settings Scopes

### Client Settings
- **Storage**: Browser localStorage (per-user)
- **Access**: Any user can export/import their own client settings
- **Examples**: UI preferences, personal module configurations, display options

### World Settings  
- **Storage**: World database (global)
- **Access**: GM only (both export and import)
- **Examples**: System configurations, world-wide module settings, GM tools

### Both Scopes
- **Combined export/import** of client and world settings
- Automatically prefixes settings with scope identifiers
- Requires GM permissions for world portion

## Export Options

### All Settings
Exports every setting from the selected scope(s), regardless of module status.

### Select by Module
- **Active modules**: Pre-selected (recommended for sharing)
- **Inactive modules**: Available but not pre-selected
- **Core settings**: Always available
- **Module status indicators**:
  - 🟢 Active modules
  - 🔴 Inactive modules  
  - 🔵 Core Foundry settings

## Import Validation

The macro includes robust validation:
- **Registered settings only**: Skips unregistered settings to prevent errors
- **Active module check**: Warns about settings from inactive modules
- **Permission validation**: Ensures GM access for world settings
- **JSON structure validation**: Verifies proper export format
- **Error reporting**: Shows detailed success/failure statistics

## Usage Notes

- **No Data Persistence**: This macro works directly with Foundry's settings - no flags or external storage
- **Backup Recommended**: Always backup current settings before importing
- **Page Reload**: Some setting changes may require refresh to take effect
- **Cross-World Compatible**: Exported settings can be imported to different worlds
- **Module Dependencies**: Settings from inactive modules are skipped during import

## Export Format

```json
{
  "version": "2.1",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "foundryVersion": "13.331",
  "user": "GameMaster",
  "scope": "client",
  "exportType": "selective",
  "selectedModules": ["core", "dnd5e", "sequencer"],
  "settingsCount": 45,
  "settings": {
    "core.rollMode": "publicroll",
    "dnd5e.gridUnits": "ft",
    "world:mymodule.setting": "value"
  }
}
```
---
# Token Texture Transition

**File:** `token-texture-transition.js`

Smoothly toggle between two token textures with animated transitions. Perfect for transformation effects, disguises, or state changes.

**Features:**
- Toggle between two predefined token images
- Individual scale settings for each texture
- 12 built-in Foundry transition effects
- Configurable animation duration
- Automatic state detection

**Requirements:**
- Foundry VTT v13+
- Selected token
- System-agnostic

## Configuration

Edit these values at the top of the macro:

```javascript
const textureA = "path/to/first/image.png";    // First token image
const textureB = "path/to/second/image.png";   // Second token image
const scaleA = 1.25;                           // Scale for texture A
const scaleB = 1.0;                            // Scale for texture B
const transitionType = "hologram";             // Animation effect
const duration = 1000;                         // Duration in milliseconds
```

## Available Transitions

**Official Foundry Effects:**
`fade`, `swirl`, `crosshatch`, `dots`, `hole`, `glitch`, `holeSwirl`, `hologram`, `morph`, `waterDrop`, `waves`, `whiteNoise`

## Usage

1. Select a token
2. Run the macro
3. Token switches to alternate texture with animation
4. Run again to switch back

**Use Cases:** Polymorph effects, disguises, injury states, spell transformations, day/night variations
---
## License

MIT License
