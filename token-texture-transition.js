// ===================================================================
// TOKEN TEXTURE TRANSITION MACRO
// ===================================================================

// ===================================================================
// CONFIGURATION - CUSTOMIZE THESE VALUES
// ===================================================================
const textureA = "foundryassets/graphics/SI_Tokens/CR4p2%20Shop%20Keeper%20Splattered%20Ink/incubus_medium_fiend_05.png";
const textureB = "foundryassets/graphics/JL_Tokens/65%20-%20Basic%20Humanoids/Png/Bandit%20Female%201.png";
const scaleA = 1.25;
const scaleB = 1.0;
const transitionType = "hologram";
const duration = 1000;

// ===================================================================
// AVAILABLE TRANSITION TYPES
// ===================================================================
/*
Official Foundry VTT Transitions:
fade, swirl, crosshatch, dots, hole, glitch, holeSwirl, 
hologram, morph, waterDrop, waves, whiteNoise
*/

// ===================================================================
// MAIN FUNCTION
// ===================================================================
if (!token) {
    ui.notifications.warn("Please select a token first!");
} else {
    const isCurrentlyA = token.document.texture.src === textureA;
    const targetTexture = isCurrentlyA ? textureB : textureA;
    const targetScale = isCurrentlyA ? scaleB : scaleA;
    
    token.document.update(
        { 
            "texture.src": targetTexture,
            "texture.scaleX": targetScale,
            "texture.scaleY": targetScale
        },
        { 
            animation: { 
                transition: transitionType, 
                duration: duration
            } 
        }
    );
}