// Enhanced Character Portrait Display Macro with Three Positions
// Shows actor portraits at Left, Center, or Right positions using Sequencer

// ApplicationV2 Dialog Class
class CharacterPortraitDialog extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "character-portrait-dialog",
        tag: "form",
        window: {
            title: "Display Character Portrait",
            icon: "fas fa-user",
            minimizable: false,
            resizable: true
        },
        position: {
            width: 500,
            height: "auto"
        },
        form: {
            handler: CharacterPortraitDialog.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        classes: ["character-portrait-dialog"]
    };

    constructor(options = {}) {
        super(options);
        this.actors = this._getAvailableActors();
    }

    _getAvailableActors() {
        return game.actors.contents
        .filter(actor => actor.img && actor.img !== "icons/svg/mystery-man.svg")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(actor => ({
            value: actor.name,
            label: actor.name,
            group: actor.type === "character" ? "Characters" : "NPCs"
        }));
    }

    async _prepareContext(options) {
        const hasPortraits = this.actors.length > 0;

        return {
            hasPortraits,
            actors: this.actors,
            actorOptions: this._renderActorOptions(),
            instructions: hasPortraits
            ? "Choose an actor and position to display their portrait as an overlay."
            : "Add custom portraits to actors to use this feature."
        };
    }

    static async formHandler(event, form, formData) {
        // This handler is not used anymore since we use individual event listeners
        // for all buttons in _onRender method
    }

    async _renderHTML(context, options) {
        return `
        <form style="display: flex; flex-direction: column;">
        <div style="margin-bottom: 1rem;">
        <label for="actorName">Character Name:</label>
        <div style="position: relative;">
        <input
        type="text"
        name="actorName"
        id="actorName"
        placeholder="Type actor name..."
        autocomplete="off"
        style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid var(--color-border-light-primary); border-radius: 3px;"
        />
        <div class="suggestions-list" style="
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--color-bg);
        border: 1px solid var(--color-border-light-primary);
        border-top: none;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        "></div>
        </div>
        </div>

        <div style="margin-bottom: 1rem;">
        <label for="actorSelect">Or select from list:</label>
        ${context.hasPortraits ? `
            <select id="actorSelect" style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid var(--color-border-light-primary); border-radius: 3px;">
            <option value="">-- Select Character --</option>
            ${context.actorOptions}
            </select>
            ` : `
            <p style="padding: 0.5rem; border-radius: 3px; background: var(--color-warning-bg); border: 1px solid var(--color-warning-border);">
            <i class="fas fa-exclamation-triangle"></i>
            No actors found with custom portraits.
            </p>
            `}
            </div>

            <p style="font-size: 0.9em; color: var(--color-text-dark-secondary); margin-top: 0.5rem; margin-bottom: 1rem;">
            <i class="fas fa-info-circle"></i>
            Type a character name above (use Tab to autocomplete) or select from the dropdown.
            </p>

            <div style="
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 0.5rem;
            margin-top: 1rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--color-border-light-tertiary);
            ">
            <button type="button" data-action="show-left" style="
            background: var(--color-button-bg);
            color: var(--color-button-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-button-hover-bg)'" onmouseout="this.style.background='var(--color-button-bg)'">
            <i class="fas fa-arrow-left"></i> Show Left
            </button>
            <button type="button" data-action="show-center" style="
            background: var(--color-button-bg);
            color: var(--color-button-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-button-hover-bg)'" onmouseout="this.style.background='var(--color-button-bg)'">
            <i class="fas fa-user"></i> Show Center
            </button>
            <button type="button" data-action="show-right" style="
            background: var(--color-button-bg);
            color: var(--color-button-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-button-hover-bg)'" onmouseout="this.style.background='var(--color-button-bg)'">
            <i class="fas fa-arrow-right"></i> Show Right
            </button>

            <button type="button" data-action="remove-left" style="
            background: var(--color-warning-bg);
            color: var(--color-warning-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-warning-hover-bg)'" onmouseout="this.style.background='var(--color-warning-bg)'">
            <i class="fas fa-times"></i> Remove Left
            </button>
            <button type="button" data-action="remove-center" style="
            background: var(--color-warning-bg);
            color: var(--color-warning-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-warning-hover-bg)'" onmouseout="this.style.background='var(--color-warning-bg)'">
            <i class="fas fa-times"></i> Remove Center
            </button>
            <button type="button" data-action="remove-right" style="
            background: var(--color-warning-bg);
            color: var(--color-warning-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-warning-hover-bg)'" onmouseout="this.style.background='var(--color-warning-bg)'">
            <i class="fas fa-times"></i> Remove Right
            </button>

            <button type="button" data-action="remove-all" style="
            grid-column: 1 / -1;
            background: var(--color-danger-bg);
            color: var(--color-danger-text);
            border: 1px solid var(--color-border-light-primary);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
            " onmouseover="this.style.background='var(--color-danger-hover-bg)'" onmouseout="this.style.background='var(--color-danger-bg)'">
            <i class="fas fa-trash"></i> Remove All
            </button>
            </div>
            </form>
            `;
    }

    // REQUIRED: replaceHTML method
    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
    }

    _onRender(context, options) {
        // Get elements
        const textInput = this.element.querySelector("#actorName");
        const dropdown = this.element.querySelector("#actorSelect");
        const suggestionsList = this.element.querySelector(".suggestions-list");

        // Get all action buttons
        const showLeftBtn = this.element.querySelector("[data-action='show-left']");
        const showCenterBtn = this.element.querySelector("[data-action='show-center']");
        const showRightBtn = this.element.querySelector("[data-action='show-right']");
        const removeLeftBtn = this.element.querySelector("[data-action='remove-left']");
        const removeCenterBtn = this.element.querySelector("[data-action='remove-center']");
        const removeRightBtn = this.element.querySelector("[data-action='remove-right']");
        const removeAllBtn = this.element.querySelector("[data-action='remove-all']");

        // State for autocomplete
        let currentSuggestionIndex = -1;
        let filteredActors = [];

        // Helper function to get current actor name
        const getCurrentActorName = () => {
            return textInput.value.trim();
        };

        // Add event listeners for all buttons
        if (showLeftBtn) {
            showLeftBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                const actorName = getCurrentActorName();
                if (actorName) {
                    await displaySelectedActor(actorName, "left");
                } else {
                    ui.notifications.warn("Please select an actor first!");
                }
            });
        }

        if (showCenterBtn) {
            showCenterBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                const actorName = getCurrentActorName();
                if (actorName) {
                    await displaySelectedActor(actorName, "center");
                } else {
                    ui.notifications.warn("Please select an actor first!");
                }
            });
        }

        if (showRightBtn) {
            showRightBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                const actorName = getCurrentActorName();
                if (actorName) {
                    await displaySelectedActor(actorName, "right");
                } else {
                    ui.notifications.warn("Please select an actor first!");
                }
            });
        }

        if (removeLeftBtn) {
            removeLeftBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                await removePortrait("left");
            });
        }

        if (removeCenterBtn) {
            removeCenterBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                await removePortrait("center");
            });
        }

        if (removeRightBtn) {
            removeRightBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                await removePortrait("right");
            });
        }

        if (removeAllBtn) {
            removeAllBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                await removeAllPortraits();
            });
        }

        // Sync dropdown selection to text input
        if (dropdown) {
            dropdown.addEventListener("change", (event) => {
                if (event.target.value) {
                    textInput.value = event.target.value;
                    this._hideSuggestions(suggestionsList);
                }
            });
        }

        // Autocomplete functionality for text input
        if (textInput) {
            textInput.addEventListener("input", (event) => {
                this._handleTextInput(event, suggestionsList);
            });

            textInput.addEventListener("keydown", (event) => {
                this._handleKeyDown(event, suggestionsList, textInput);
            });

            textInput.addEventListener("blur", (event) => {
                // Delay hiding to allow click on suggestions
                setTimeout(() => this._hideSuggestions(suggestionsList), 150);
            });

            // Focus the text input
            textInput.focus();
        }

        // Handle Enter key submission
        this.element.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
                event.preventDefault();
                // Don't submit, just clear suggestions if showing
                if (suggestionsList.style.display === "block") {
                    this._hideSuggestions(suggestionsList);
                }
            }
        });
    }

    _handleTextInput(event, suggestionsList) {
        const query = event.target.value.toLowerCase().trim();

        if (query.length === 0) {
            this._hideSuggestions(suggestionsList);
            return;
        }

        // Filter actors based on input
        const filteredActors = this.actors.filter(actor =>
        actor.label.toLowerCase().includes(query)
        );

        if (filteredActors.length > 0) {
            this._showSuggestions(suggestionsList, filteredActors, query);
        } else {
            this._hideSuggestions(suggestionsList);
        }
    }

    _handleKeyDown(event, suggestionsList, textInput) {
        const suggestions = suggestionsList.querySelectorAll(".suggestion-item");

        if (event.key === "ArrowDown") {
            event.preventDefault();
            this._navigateSuggestions(suggestions, 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this._navigateSuggestions(suggestions, -1);
        } else if (event.key === "Tab") {
            event.preventDefault();
            this._autoComplete(suggestionsList, textInput);
        } else if (event.key === "Enter") {
            event.preventDefault();
            const highlighted = suggestionsList.querySelector(".suggestion-item.highlighted");
            if (highlighted) {
                const actorName = highlighted.querySelector("span").textContent.replace(/<[^>]*>/g, '');
                textInput.value = actorName;
                this._hideSuggestions(suggestionsList);
            }
        } else if (event.key === "Escape") {
            this._hideSuggestions(suggestionsList);
        }
    }

    _navigateSuggestions(suggestions, direction) {
        const current = Array.from(suggestions).findIndex(s => s.classList.contains("highlighted"));

        // Remove current highlight
        suggestions.forEach(s => s.classList.remove("highlighted"));

        // Calculate new index
        let newIndex = current + direction;
        if (newIndex >= suggestions.length) newIndex = 0;
        if (newIndex < 0) newIndex = suggestions.length - 1;

        // Highlight new suggestion
        if (suggestions[newIndex]) {
            suggestions[newIndex].classList.add("highlighted");
            suggestions[newIndex].scrollIntoView({ block: "nearest" });
        }
    }

    _autoComplete(suggestionsList, textInput) {
        const highlighted = suggestionsList.querySelector(".suggestion-item.highlighted");
        const firstSuggestion = suggestionsList.querySelector(".suggestion-item");

        if (highlighted) {
            const actorName = highlighted.querySelector("span").textContent.replace(/<[^>]*>/g, '');
            textInput.value = actorName;
        } else if (firstSuggestion) {
            const actorName = firstSuggestion.querySelector("span").textContent.replace(/<[^>]*>/g, '');
            textInput.value = actorName;
        }

        this._hideSuggestions(suggestionsList);
    }

    _showSuggestions(suggestionsList, actors, query) {
        suggestionsList.innerHTML = "";

        actors.slice(0, 8).forEach((actor, index) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            if (index === 0) item.classList.add("highlighted");

            // Apply inline styles to suggestion items
            item.style.cssText = `
            padding: 0.5rem;
            cursor: pointer;
            border-bottom: 1px solid var(--color-border-light-tertiary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            `;

            item.addEventListener("mouseenter", () => {
                item.style.background = "var(--color-bg-option)";
            });

            item.addEventListener("mouseleave", () => {
                if (!item.classList.contains("highlighted")) {
                    item.style.background = "";
                }
            });

            const regex = new RegExp(`(${query})`, "gi");
            const highlightedName = actor.label.replace(regex, "<strong>$1</strong>");

            item.innerHTML = `
            <span>${highlightedName}</span>
            <span style="font-size: 0.8em; color: var(--color-text-dark-secondary); text-transform: uppercase;">${actor.group}</span>
            `;

            item.addEventListener("click", () => {
                const textInput = this.element.querySelector("#actorName");
                const actorName = actor.label;
                textInput.value = actorName;
                this._hideSuggestions(suggestionsList);
                textInput.focus();
            });

            suggestionsList.appendChild(item);
        });

        suggestionsList.style.display = "block";
    }

    _hideSuggestions(suggestionsList) {
        suggestionsList.style.display = "none";
        suggestionsList.innerHTML = "";
    }

    _renderActorOptions() {
        let currentGroup = null;
        let html = "";

        const sortedActors = [...this.actors].sort((a, b) => {
            if (a.group !== b.group) {
                return a.group.localeCompare(b.group);
            }
            return a.label.localeCompare(b.label);
        });

        for (const actor of sortedActors) {
            if (actor.group !== currentGroup) {
                if (currentGroup !== null) html += "</optgroup>";
                html += `<optgroup label="${actor.group}">`;
                currentGroup = actor.group;
            }
            html += `<option value="${actor.value}">${actor.label}</option>`;
        }

        if (currentGroup !== null) html += "</optgroup>";
        return html;
    }
}

// Position configurations
const POSITIONS = {
    left: {
        screenSpaceAnchor: {x: 0, y: 1}, // Bottom-left of screen
        screenSpacePosition: {x: 50, y: -50}, // 50px right, 50px up from bottom
        anchor: {x: 0, y: 1}, // Effect anchor: bottom-left
        textPosition: {x: 60, y: -25}, // Text position relative to portrait
        textAnchor: {x: 0, y: 1}, // Text anchor: left-aligned, bottom-anchored
        portraitName: "actor-portrait-left",
        textName: "actor-name-text-left"
    },
    center: {
        screenSpaceAnchor: {x: 0.5, y: 1}, // Bottom-center of screen
        screenSpacePosition: {x: 0, y: -50}, // No horizontal offset, 50px up from bottom
        anchor: {x: 0.5, y: 1}, // Effect anchor: bottom-center
        textPosition: {x: 0, y: -25}, // Text centered above portrait
        textAnchor: {x: 0.5, y: 1}, // Text anchor: center-aligned, bottom-anchored
        portraitName: "actor-portrait-center",
        textName: "actor-name-text-center"
    },
    right: {
        screenSpaceAnchor: {x: 1, y: 1}, // Bottom-right of screen
        screenSpacePosition: {x: -50, y: -50}, // 50px left, 50px up from bottom
        anchor: {x: 1, y: 1}, // Effect anchor: bottom-right
        textPosition: {x: -60, y: -25}, // Text position left of portrait
        textAnchor: {x: 1, y: 1}, // Text anchor: right-aligned, bottom-anchored
        portraitName: "actor-portrait-right",
        textName: "actor-name-text-right"
    }
};

// Main function to display the dialog
async function displayCharacterPortrait() {
    // Check if Sequencer is available
    if (!game.modules.get("sequencer")?.active) {
        ui.notifications.error("Sequencer module is required for this macro!");
        return;
    }

    // Show the ApplicationV2 dialog
    new CharacterPortraitDialog().render(true);
}

// Handle selected actor display
async function displaySelectedActor(actorName, position) {
    if (!actorName) {
        ui.notifications.warn("Please select an actor first!");
        return;
    }

    if (!POSITIONS[position]) {
        ui.notifications.warn("Invalid position specified!");
        return;
    }

    // Find the actor
    const actor = game.actors.getName(actorName);
    if (!actor) {
        ui.notifications.warn(`Actor "${actorName}" not found!`);
        return;
    }

    // Get actor portrait
    const portraitPath = actor.img;
    if (!portraitPath || portraitPath === "icons/svg/mystery-man.svg") {
        ui.notifications.warn(`Actor "${actorName}" has no custom portrait!`);
        return;
    }

    // Remove existing portrait at this position first
    await removePortrait(position);

    // Display the portrait and name at the specified position
    await showPortraitAndName(portraitPath, actor.name, position);
}

async function removePortrait(position) {
    if (!POSITIONS[position]) return;

    const config = POSITIONS[position];

    const portraitEffects = Sequencer.EffectManager.getEffects({
        name: config.portraitName
    });

    const textEffects = Sequencer.EffectManager.getEffects({
        name: config.textName
    });

    if (portraitEffects.length > 0 || textEffects.length > 0) {
        Sequencer.EffectManager.endEffects({name: config.portraitName});
        Sequencer.EffectManager.endEffects({name: config.textName});

        await new Promise(resolve => setTimeout(resolve, 100));
        ui.notifications.info(`${position.charAt(0).toUpperCase() + position.slice(1)} portrait removed.`);
    }
}

async function removeAllPortraits() {
    const promises = Object.keys(POSITIONS).map(position => removePortrait(position));
    await Promise.all(promises);
    ui.notifications.info("All portraits removed.");
}

async function showPortraitAndName(portraitPath, actorName, position) {
    try {
        const config = POSITIONS[position];

        // Portrait image - using the working pattern from the original
        new Sequence()
        .effect()
        .file(portraitPath)
        .atLocation({x: 0, y: 0}) // Provide location reference like working example
        .screenSpaceAboveUI() // Only use screenSpaceAboveUI (not both)
        .screenSpaceAnchor(config.screenSpaceAnchor)
        .screenSpacePosition(config.screenSpacePosition)
        .anchor(config.anchor)
        .size({height: window.innerHeight * 0.5}) // 50vh equivalent
        .persist()
        .name(config.portraitName)
        .fadeIn(800)
        .fadeOut(800) // Will play when effect is ended
        .play();

        // Character name text (slight delay) - positioned relative to portrait
        await new Promise(resolve => setTimeout(resolve, 200));

        new Sequence()
        .effect()
        .atLocation({x: 0, y: 0}) // Provide location reference like working example
        .screenSpaceAboveUI() // Only use screenSpaceAboveUI (not both)
        .screenSpaceAnchor(config.screenSpaceAnchor)
        .screenSpacePosition({
            x: config.screenSpacePosition.x + config.textPosition.x,
            y: config.screenSpacePosition.y + config.textPosition.y
        })
        .anchor(config.textAnchor) // Anchor text at appropriate position
        .text(actorName, {
            fill: "#d5be74",
            fontSize: 36,
            fontFamily: "PlayfairDisplay",
            fontWeight: "bold",
            strokeThickness: 4,
            stroke: "#1a1a1a",
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 8,
            dropShadowDistance: 4,
            anchor: config.textAnchor // Text's internal anchor - position-appropriate alignment
        })
        .persist()
        .name(config.textName)
        .fadeIn(600)
        .fadeOut(600) // Will play when effect is ended
        .play();

        ui.notifications.info(`${actorName}'s portrait is now displayed at ${position} position.`);

    } catch (error) {
        console.error("Error displaying portrait:", error);
        ui.notifications.error("Failed to display portrait. Check console for details.");
    }
}

// Global cleanup functions for easy access
globalThis.removeCharacterPortrait = function(position = "all") {
    if (position === "all") {
        removeAllPortraits();
    } else {
        removePortrait(position);
    }
};

globalThis.removeAllCharacterPortraits = function() {
    removeAllPortraits();
};

// Execute the main function
displayCharacterPortrait();
