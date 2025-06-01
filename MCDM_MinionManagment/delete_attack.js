// V13 Attack Effect Removal Macro - ONLY REMOVES ATTACK EFFECT
async function deleteAttackEffect() {
    // Get all selected tokens on the canvas
    const selectedTokens = canvas.tokens.controlled;

    // Check if any tokens are selected
    if (selectedTokens.length === 0) {
        ui.notifications.warn("No tokens selected");
        return;
    }

    let effectsRemoved = 0;

    // Iterate over each selected token
    for (const token of selectedTokens) {
        try {
            // Get the actor associated with the token
            const actor = token.actor;

            if (!actor) {
                continue;
            }

            // Find the "Attack" effect on the actor (check both name and label)
            const attackEffect = actor.effects.find(effect => effect.name === "Attack" || effect.label === "Attack");

            // If the "Attack" effect is found, delete it
            if (attackEffect) {
                await actor.deleteEmbeddedDocuments("ActiveEffect", [attackEffect.id]);
                effectsRemoved++;
            }

        } catch (error) {
            console.error(`Error removing Attack effect from ${token.name}:`, error);
        }
    }

    // Simple feedback
    if (effectsRemoved > 0) {
        ui.notifications.info(`Removed Attack effect from ${effectsRemoved} token(s)`);
    } else {
        ui.notifications.warn("No Attack effects found on selected tokens");
    }
}

// Call the function to delete Attack effect from all selected tokens
deleteAttackEffect();
