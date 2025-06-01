// V13 Move Effect Removal Macro - ONLY REMOVES MOVE EFFECT
async function deleteMoveEffect() {
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

            // Find the "Move" effect on the actor (check both name and label)
            const moveEffect = actor.effects.find(effect => effect.name === "Move" || effect.label === "Move");

            // If the "Move" effect is found, delete it
            if (moveEffect) {
                await actor.deleteEmbeddedDocuments("ActiveEffect", [moveEffect.id]);
                effectsRemoved++;
            }

        } catch (error) {
            console.error(`Error removing Move effect from ${token.name}:`, error);
        }
    }

    // Simple feedback
    if (effectsRemoved > 0) {
        ui.notifications.info(`Removed Move effect from ${effectsRemoved} token(s)`);
    } else {
        ui.notifications.warn("No Move effects found on selected tokens");
    }
}

// Call the function to delete Move effect from all selected tokens
deleteMoveEffect();
