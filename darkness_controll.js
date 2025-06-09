// Advanced Darkness Controller - Simple Timekeeping Style
class AdvancedDarknessApp extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "advanced-darkness",
        window: {
            title: "Scene Darkness with Presets",
            icon: "fas fa-adjust",
            resizable: true
        },
        position: {
            width: 450,
            height: 450
        },
        classes: ["advanced-darkness"],
        modal: false  // Changed to false so it's less intrusive and resizable
    };

    constructor() {
        super();
        this.currentDarkness = canvas.scene.environment.darknessLevel;
        this.sliderValue = Math.round(this.currentDarkness * 100);
    }

    async _prepareContext(options) {
        return {
            currentDarkness: this.currentDarkness,
            sliderValue: this.sliderValue
        };
    }

    async _renderHTML(context, options) {
        return `
        <form class="flexcol" style="height: 100%; padding: 15px;">
        <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 1.4em; font-weight: bold; margin-bottom: 15px; color: var(--color-text-primary);">
        Darkness Level: <span id="darkness-value">${context.sliderValue}</span>%
        </div>
        <div style="margin: 0 20px;">
        <input
        type="range"
        id="darknessRange"
        name="darknessRange"
        min="0"
        max="100"
        value="${100 - context.sliderValue}"
        step="1"
        style="width: 100%; height: 30px;"
        />
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 0 20px; font-size: 0.9em; color: var(--color-text-dark-secondary);">
        <span><i class="fas fa-moon" style="margin-right: 4px;"></i>Dark</span>
        <span><i class="fas fa-sun" style="margin-right: 4px;"></i>Bright</span>
        </div>
        </div>

        <!-- Time of Day Presets -->
        <div style="margin: 15px 20px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">Quick Time Presets:</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button type="button" class="time-preset" data-darkness="0" style="padding: 8px; font-size: 0.85em;">
        <i class="fas fa-sun"></i> Midday (0%)
        </button>
        <button type="button" class="time-preset" data-darkness="20" style="padding: 8px; font-size: 0.85em;">
        <i class="fas fa-cloud-sun"></i> Dawn (20%)
        </button>
        <button type="button" class="time-preset" data-darkness="80" style="padding: 8px; font-size: 0.85em;">
        <i class="fas fa-cloud-moon"></i> Dusk (80%)
        </button>
        <button type="button" class="time-preset" data-darkness="100" style="padding: 8px; font-size: 0.85em;">
        <i class="fas fa-moon"></i> Midnight (100%)
        </button>
        </div>
        </div>

        <!-- Action Buttons - Fixed at bottom with flex-grow spacer -->
        <div style="flex-grow: 1;"></div>
        <div class="form-group" style="margin-top: 20px;">
        <button type="button" id="save-btn" class="dialog-button" style="width: 100%; margin-bottom: 8px; padding: 10px;">
        <i class="fas fa-save"></i> Apply Darkness
        </button>
        <button type="button" id="cancel-btn" class="dialog-button" style="width: 100%; padding: 10px;">
        <i class="fas fa-times"></i> Cancel
        </button>
        </div>
        </form>
        `;
    }

    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const slider = this.element.querySelector('#darknessRange');
        const valueDisplay = this.element.querySelector('#darkness-value');
        const saveBtn = this.element.querySelector('#save-btn');
        const cancelBtn = this.element.querySelector('#cancel-btn');
        const timePresets = this.element.querySelectorAll('.time-preset');

        // Live slider updates
        slider.addEventListener('input', (event) => {
            const brightnessValue = parseInt(event.target.value);
            this.sliderValue = 100 - brightnessValue;
            valueDisplay.textContent = this.sliderValue;
        });

        // Time preset buttons
        timePresets.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const darkness = parseInt(event.currentTarget.dataset.darkness);

                this.sliderValue = darkness;
                slider.value = 100 - darkness;
                valueDisplay.textContent = darkness;

                // Apply immediately for preview
                this.applyEnvironment(darkness / 100, true);
            });
        });

        // Save button - Apply full environment like Simple Timekeeping
        saveBtn.addEventListener('click', async () => {
            const targetDarkness = this.sliderValue / 100;
            await this.applyEnvironment(targetDarkness, this.getCurrentColor(targetDarkness), false);
            this.close();
        });

        // Cancel button
        cancelBtn.addEventListener('click', async () => {
            await canvas.scene.update({
                "environment.darknessLevel": this.currentDarkness
            }, { animateDarkness: true });
            this.close();
        });

        // Keyboard shortcuts
        slider.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveBtn.click();
            } else if (event.key === 'Escape') {
                cancelBtn.click();
            }
        });

        slider.focus();
    }

    // Apply environment changes - focused on darkness only
    async applyEnvironment(darknessLevel, isPreview = false) {
        if (!isPreview) {
            ui.notifications.info(`Applying darkness: ${Math.round(darknessLevel * 100)}%...`);
        }

        // Use Foundry's native animation - much simpler than custom loops!
        await canvas.scene.update({
            "environment.darknessLevel": darknessLevel
        }, { animateDarkness: true });

        if (!isPreview) {
            ui.notifications.info("Darkness update complete!");
        }
    }
}

// Check if already running
if (game.darknessPresetsApp?.rendered) {
    game.darknessPresetsApp.close();
}

// Create and show new instance
game.darknessPresetsApp = new AdvancedDarknessApp();
game.darknessPresetsApp.render(true);
