// Region Behavior Toggle Macro for Foundry VTT v13 - DialogV2 Version
// Collects all regions and their behaviors from active scene
// Allows toggling behavior disabled state via modern DialogV2

async function toggleRegionBehaviorsV2() {
    // Check if there's an active scene
    if (!canvas.scene) {
        ui.notifications.warn("No active scene found.");
        return;
    }
    
    // Get all regions from the active scene
    const regions = canvas.scene.regions;
    
    if (regions.size === 0) {
        ui.notifications.info("No regions found on the active scene.");
        return;
    }
    
    // Collect all behaviors from all regions
    const behaviorOptions = [];
    
    for (const region of regions) {
        const behaviors = region.behaviors;
        
        if (behaviors.size === 0) {
            continue;
        }
        
        for (const behavior of behaviors) {
            behaviorOptions.push({
                regionId: region.id,
                regionName: region.name || `Region ${region.id.slice(-8)}`,
                behaviorId: behavior.id,
                behaviorType: behavior.type,
                behaviorName: behavior.name || behavior.type,
                disabled: behavior.disabled,
                region: region,
                behavior: behavior
            });
        }
    }
    
    if (behaviorOptions.length === 0) {
        ui.notifications.info("No region behaviors found on the active scene.");
        return;
    }
    
    // Create dialog content HTML
    const dialogContent = `
        <form>
            <div style="margin: 0 8px 0 8px; background: var(--color-bg-option); display: flex; align-items: center; flex-flow: column">
                <p><strong>Select a region behavior to toggle its active state:</strong></p>
                <p style="font-size: 0.9em; margin-top: 4px;">
                    <span style="color: #51cf66;">●</span> Enabled behaviors are active
                    <span style="margin-left: 16px; color: #ff6b6b;">●</span> Disabled behaviors are inactive
                </p>
            </div>
            
            <div style="max-height: 350px; overflow-y: auto; border: 1px solid var(--color-border-dark-tertiary); border-radius: 4px; padding: 8px;">
                ${behaviorOptions.map((option, index) => `
                    <div style="margin-bottom: 13px; padding: 8px; border: 1px solid var(--color-border-light-tertiary); border-radius: 4px; background: var(--color-bg-option); border-left: 4px solid ${option.disabled ? '#ff6b6b' : '#51cf66'}; display: grid; grid-template-columns: auto auto 1fr; grid-template-rows: auto auto; gap: 8px; align-items: center; cursor: pointer;">
                        <input type="radio" name="behaviorSelection" value="${index}" style="grid-column: 1; grid-row: 1 / -1; justify-self: center; align-self: center;">
                        <span style="grid-column: 2; grid-row: 1; font-weight: bold; color: ${option.disabled ? '#ff6b6b' : '#51cf66'};">
                            ${option.disabled ? 'Disabled' : 'Enabled'}
                        </span>
                        <span style="grid-column: 3; grid-row: 1;">
                            <strong>${option.regionName}</strong> - ${option.behaviorName}
                        </span>
                        <div style="grid-column: 2 / -1; grid-row: 2; font-size: 0.9em; color: var(--color-text-dark-secondary);">
                            Type: ${option.behaviorType} | Region: ${option.regionName}
                        </div>
                    </div>
                `).join('')}
            </div>
        </form>
    `;
    
    // Create and show DialogV2
    const result = await foundry.applications.api.DialogV2.wait({
        window: {
            title: "Select Region Behavior to Toggle",
            icon: "fas fa-toggle-on"
        },
        position: {
            width: 600,
            height: "auto"
        },
        content: dialogContent,
        buttons: [
            {
                action: "toggle",
                icon: "fas fa-toggle-on",
                label: "Toggle Selected",
                default: true,
                callback: (event, button, dialog) => {
                    const form = dialog.element.querySelector("form");
                    const formData = new FormData(form);
                    const selectedIndex = formData.get("behaviorSelection");
                    
                    if (selectedIndex === null || selectedIndex === "") {
                        ui.notifications.warn("Please select a behavior to toggle.");
                        return false; // Prevent dialog from closing
                    }
                    
                    return { action: "toggle", selectedIndex: parseInt(selectedIndex) };
                }
            },
            {
                action: "cancel",
                icon: "fas fa-times",
                label: "Cancel"
            }
        ],
        close: () => ({ action: "cancel" }),
        render: (event, dialog) => {
            // Auto-select first option
            const firstRadio = dialog.element.querySelector('input[name="behaviorSelection"]');
            if (firstRadio) {
                firstRadio.checked = true;
            }
            
            // Add click handlers for the entire behavior item
            const items = dialog.element.querySelectorAll('div[style*="display: grid"]');
            items.forEach((item, index) => {
                item.addEventListener('click', (e) => {
                    if (e.target.type !== 'radio') {
                        const radio = item.querySelector('input[type="radio"]');
                        if (radio) radio.checked = true;
                    }
                });
            });
        }
    }, {
        classes: ["dialog", "region-behavior-toggle"],
        modal: true
    });
    
    // Handle the result
    if (result?.action === "toggle") {
        const selectedOption = behaviorOptions[result.selectedIndex];
        const behavior = selectedOption.behavior;
        const newState = !behavior.disabled;
        
        try {
            await behavior.update({ disabled: newState });
            
            const statusText = newState ? "disabled" : "enabled";
            const statusIcon = newState ? "🔴" : "🟢";
            
            ui.notifications.info(
                `${statusIcon} ${selectedOption.behaviorName} in ${selectedOption.regionName} has been ${statusText}.`
            );
            
            console.log(`Region Behavior Toggle: ${selectedOption.regionName} - ${selectedOption.behaviorName} is now ${statusText}`);
            
            // Optionally refresh the dialog to show updated states
            // Uncomment the line below if you want the dialog to reopen after toggling
            setTimeout(() => toggleRegionBehaviorsV2(), 50);
            
        } catch (error) {
            console.error("Error toggling region behavior:", error);
            ui.notifications.error(`Failed to toggle region behavior: ${error.message}`);
        }
    }
}

// Execute the function
toggleRegionBehaviorsV2();