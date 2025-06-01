// V13 Updated Minion Group Macro
new foundry.applications.api.DialogV2({
    window: {
        title: "Mark Minion Group"
    },
    content: `
    <div style="text-align: center; padding: 10px;">
    <p>Select which minion group to activate:</p>
    </div>
    `,
    buttons: [
        {
            action: "group01",
            label: "Gruppe 1",
            callback: () => applyEffects("group01")
        },
        {
            action: "group02",
            label: "Gruppe 2",
            callback: () => applyEffects("group02")
        },
        {
            action: "group03",
            label: "Gruppe 3",
            callback: () => applyEffects("group03")
        }
    ]
}).render(true);

async function applyEffects(effectName) {
    // Get all tokens on the canvas
    const tokens = canvas.tokens.placeables;

    // Filter tokens to find those with the specified active effect
    const affectedTokens = tokens.filter(token => {
        return token.actor && token.actor.effects.some(effect => {
            const effectStatuses = Array.from(effect.statuses || []);
            return effectStatuses.includes(effectName);
        });
    });

    if (affectedTokens.length === 0) {
        ui.notifications.warn(`No tokens found with ${effectName} effect`);
        return;
    }

    // Define the "attack" effect data (V13 format)
    const attackEffectData = {
        name: "Attack",  // Required in V13
        label: "Attack",
        icon: "icons/svg/sword.svg",
        duration: {
            rounds: 1,
            startRound: game.combat?.round || 0,
            startTurn: game.combat?.turn || 0
        },
        disabled: false,
        transfer: false
    };

    // Define the "move" effect data (V13 format)
    const moveEffectData = {
        name: "Move",    // Required in V13
        label: "Move",
        icon: "icons/svg/wingfoot.svg",
        duration: {
            rounds: 1,
            startRound: game.combat?.round || 0,
            startTurn: game.combat?.turn || 0
        },
        disabled: false,
        transfer: false
    };

    // Apply the "attack" and "move" effects to each affected token
    for (const token of affectedTokens) {
        try {
            const actor = token.actor;

            // Create the effects
            await actor.createEmbeddedDocuments("ActiveEffect", [attackEffectData, moveEffectData]);

            // Add the Sequence effect to the token (if Sequencer module is available)
            if (typeof Sequence !== "undefined") {
                new Sequence()
                .effect()
                .file("jb2a.ui.indicator.redyellow.03.01")
                .name("groupMarker")
                .attachTo(token)
                .persist()
                .fadeIn(500)
                .fadeOut(500)
                .play();
            } else {
                console.log("Sequencer module not found - visual effects skipped");
            }

        } catch (error) {
            console.error(`Error applying effects to ${token.name}:`, error);
            ui.notifications.error(`Failed to apply effects to ${token.name}`);
        }
    }

    // Notification of success
    ui.notifications.info(`Applied effects to ${affectedTokens.length} token(s) in ${effectName}`);
}
