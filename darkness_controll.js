// Darkness Slider Macro mit korrigierter ApplicationV2 für Live-Updates
class DarknessSliderApp extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "darkness-slider",
        window: {
            title: "Adjust Scene Darkness",
            icon: "fas fa-adjust"
        },
        position: {
            width: 400,
            height: 280
        },
        classes: ["darkness-slider"],
        modal: true
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

    // ERFORDERLICH: renderHTML Methode
    async _renderHTML(context, options) {
        return `
        <form class="flexcol">
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
        <div class="form-group" style="margin-top: 20px;">
        <button type="button" id="save-btn" class="dialog-button" style="width: 100%; margin-bottom: 8px;">
        <i class="fas fa-save"></i> Save & Animate
        </button>
        <button type="button" id="cancel-btn" class="dialog-button" style="width: 100%;">
        <i class="fas fa-times"></i> Cancel
        </button>
        </div>
        </form>
        `;
    }

    // ERFORDERLICH: replaceHTML Methode
    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Get elements
        const slider = this.element.querySelector('#darknessRange');
        const valueDisplay = this.element.querySelector('#darkness-value');
        const saveBtn = this.element.querySelector('#save-btn');
        const cancelBtn = this.element.querySelector('#cancel-btn');

        // Live slider updates
        slider.addEventListener('input', (event) => {
            // Invertiere den Slider-Wert: 0 = hell (0% darkness), 100 = dunkel (100% darkness)
            const brightnessValue = parseInt(event.target.value);
            this.sliderValue = 100 - brightnessValue; // Konvertiere zu darkness
            valueDisplay.textContent = this.sliderValue;

            // Optional: Live preview (uncomment for real-time updates)
            // const previewDarkness = this.sliderValue / 100;
            // canvas.scene.update({"environment.darknessLevel": previewDarkness});
        });

        // Save button
        saveBtn.addEventListener('click', async () => {
            const targetDarkness = this.sliderValue / 100;
            await this.animateDarkness(this.currentDarkness, targetDarkness, 3000);
            this.close();
        });

        // Cancel button
        cancelBtn.addEventListener('click', async () => {
            // Reset to original darkness if changed
            await canvas.scene.update({"environment.darknessLevel": this.currentDarkness});
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

        // Focus slider for immediate use
        slider.focus();
    }

    // Smooth darkness animation
    async animateDarkness(from, to, durationMs) {
        const steps = 60; // More steps for smoother animation
        const delay = durationMs / steps;

        ui.notifications.info(`Animating darkness from ${Math.round(from * 100)}% to ${Math.round(to * 100)}%...`);

        for (let i = 1; i <= steps; i++) {
            // Ease-in-out animation curve
            const progress = this.easeInOutCubic(i / steps);
            const value = from + (to - from) * progress;

            await canvas.scene.update({"environment.darknessLevel": value});
            await new Promise(r => setTimeout(r, delay));
        }

        ui.notifications.info("Darkness animation complete!");
    }

    // Smooth easing function
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}

// Prüfen ob bereits eine Instanz läuft
if (game.darknessSliderApp?.rendered) {
    game.darknessSliderApp.close();
}

// Neue Instanz erstellen und anzeigen
game.darknessSliderApp = new DarknessSliderApp();
game.darknessSliderApp.render(true);
