/**
 * FOUNDRY VTT SETTINGS PROFILES MANAGER - ApplicationV2 Version
 * Profile-based settings management with proper scope handling and permissions
 * Based on research: Client settings are localStorage-based, World settings require GM permissions
 */

// Validates if a setting is registered and accessible to current user
function isSettingAccessible(settingKey) {
    try {
        if (!game.settings.settings.has(settingKey)) {
            return false;
        }
        
        const config = game.settings.settings.get(settingKey);
        
        // If it's a world setting and user is not GM, it's not accessible
        if (config.scope === "world" && !game.user.isGM) {
            return false;
        }
        
        // Check if the module/namespace is active
        const namespace = settingKey.split('.')[0];
        if (namespace !== 'core') {
            const module = game.modules.get(namespace);
            if (!module || !module.active) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

// Validates if a value is safe for flag storage (only primitive types and simple objects)
function isSafeForFlagStorage(value, depth = 0, path = '') {
    // Prevent infinite recursion
    if (depth > 10) {
        console.warn(`Settings Profile Manager: Depth limit reached at path: ${path}`);
        return false;
    }
    
    // Null and undefined are safe
    if (value === null || value === undefined) return true;
    
    // Primitive types are safe
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }
    
    // Arrays are safe if all elements are safe
    if (Array.isArray(value)) {
        return value.every((item, index) => 
            isSafeForFlagStorage(item, depth + 1, `${path}[${index}]`)
        );
    }
    
    // Objects are safe if they're plain objects with safe values
    if (typeof value === 'object') {
        // Check if it's a plain object (not a class instance, function, etc.)
        if (value.constructor !== Object) {
            console.warn(`Settings Profile Manager: Non-plain object at path: ${path}, constructor: ${value.constructor?.name}`);
            return false;
        }
        
        // Check if all keys are strings and values are safe
        for (const [key, val] of Object.entries(value)) {
            if (typeof key !== 'string') {
                console.warn(`Settings Profile Manager: Non-string key at path: ${path}, key type: ${typeof key}`);
                return false;
            }
            if (!isSafeForFlagStorage(val, depth + 1, `${path}.${key}`)) {
                return false;
            }
        }
        return true;
    }
    
    // Functions, symbols, and other complex types are not safe
    console.warn(`Settings Profile Manager: Unsafe type at path: ${path}, type: ${typeof value}`);
    return false;
}

// Gets all accessible settings for the current user
function getAccessibleSettings() {
    const settings = {
        client: {},
        world: {},
        settingsInfo: {}
    };
    
    const totalRegistered = game.settings.settings.size;
    let processedCount = 0;
    let skippedCount = 0;
    
    console.log(`Settings Profile Manager: Processing ${totalRegistered} registered settings...`);
    
    // Iterate through all registered settings
    for (const [key, config] of game.settings.settings.entries()) {
        if (!isSettingAccessible(key)) {
            skippedCount++;
            continue;
        }
        
        try {
            // Double-check the setting is still registered before accessing
            if (!game.settings.settings.has(key)) {
                console.warn(`Setting ${key} no longer registered, skipping`);
                skippedCount++;
                continue;
            }
            
            const parts = key.split('.');
            if (parts.length < 2) {
                console.warn(`Invalid setting key format: ${key}`);
                skippedCount++;
                continue;
            }
            
            const namespace = parts[0];
            const settingKey = parts.slice(1).join('.');
            
            // Try to get the setting value safely
            let currentValue;
            try {
                currentValue = game.settings.get(namespace, settingKey);
            } catch (getError) {
                console.warn(`Failed to get setting ${key}: ${getError.message}`);
                skippedCount++;
                continue;
            }
            
            // Validate that the value is safe for flag storage
            if (!isSafeForFlagStorage(currentValue)) {
                console.warn(`Setting ${key} contains complex data structure, skipping`);
                skippedCount++;
                continue;
            }
            
            // Double-check with JSON.stringify as a final validation
            try {
                JSON.stringify(currentValue);
            } catch (serializeError) {
                console.warn(`Setting ${key} contains non-serializable data, skipping`);
                skippedCount++;
                continue;
            }
            
            if (config.scope === "client") {
                settings.client[key] = currentValue;
            } else if (config.scope === "world") {
                settings.world[key] = currentValue;
            }
            
            // Store setting metadata for display
            settings.settingsInfo[key] = {
                name: config.name || key,
                scope: config.scope,
                namespace: namespace,
                hint: config.hint || ""
            };
            
            processedCount++;
        } catch (error) {
            console.warn(`Failed to process setting ${key}:`, error);
            skippedCount++;
        }
    }
    
    const clientCount = Object.keys(settings.client).length;
    const worldCount = Object.keys(settings.world).length;
    console.log(`Settings Profile Manager: Successfully loaded ${processedCount} settings (${clientCount} client, ${worldCount} world), skipped ${skippedCount}`);
    
    return settings;
}

// Determines what scopes are available to the current user
function getAvailableScopes() {
    const scopes = [
        { value: "client", label: "Client Settings (Per-User)", available: true }
    ];
    
    if (game.user.isGM) {
        scopes.push(
            { value: "world", label: "World Settings (Global)", available: true },
            { value: "both", label: "Both Client & World Settings", available: true }
        );
    } else {
        scopes.push(
            { value: "world", label: "World Settings (GM Only)", available: false },
            { value: "both", label: "Both Client & World Settings (GM Only)", available: false }
        );
    }
    
    return scopes;
}

class SettingsProfilesManagerApp extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "settings-profiles-manager",
        window: {
            title: "Settings Profiles Manager",
            icon: "fas fa-cogs",
            resizable: true
        },
        position: {
            width: 700,
            height: 900
        },
        classes: ["settings-profiles-manager"],
        modal: false
    };

    static FLAG_SCOPE = game.system.id;
    static FLAG_KEY = "settings-profiles-data";

    constructor() {
        super();
        this.profiles = {};
        this.selectedProfile = null;
        this.macroDocument = null;
        this.currentSettings = null;
        this.loadProfiles();
        this.refreshCurrentSettings();
    }

    async _prepareContext(options) {
        const availableScopes = getAvailableScopes();
        const accessibleScopes = availableScopes.filter(s => s.available);
        
        return {
            profiles: this.profiles,
            profileNames: Object.keys(this.profiles).sort(),
            selectedProfile: this.selectedProfile,
            availableScopes: availableScopes,
            accessibleScopes: accessibleScopes,
            isGM: game.user.isGM,
            hasPersistence: !!this.macroDocument,
            currentSettings: this.currentSettings
        };
    }

    async _renderHTML(context, options) {
        const profileOptions = context.profileNames.map(name => {
            const profile = this.profiles[name];
            const scopeLabel = this.getScopeLabel(profile.scope);
            const isAccessible = this.isProfileAccessible(profile);
            
            return `<option value="${name}" ${context.selectedProfile === name ? 'selected' : ''}
                        ${isAccessible ? '' : 'disabled'} data-scope="${profile.scope}">
                        ${name} ${scopeLabel}
                    </option>`;
        }).join('');

        const scopeOptions = context.availableScopes.map(scope => 
            `<option value="${scope.value}" ${scope.available ? '' : 'disabled'}>
                ${scope.label}
            </option>`
        ).join('');

        return `
            <form class="settings-profiles-form">
                <div class="header-section">
                    <h2>Settings Profiles Manager</h2>
                    <p class="subtitle">Save, manage, and switch between settings configurations</p>
                    <div class="stats">
                        <span class="stat-item">
                            <i class="fas fa-cogs"></i>
                            ${Object.keys(context.currentSettings?.client || {}).length} Client Settings
                        </span>
                        ${context.isGM ? `
                        <span class="stat-item">
                            <i class="fas fa-globe"></i>
                            ${Object.keys(context.currentSettings?.world || {}).length} World Settings
                        </span>` : ''}
                        <span class="stat-item">
                            <i class="fas fa-layer-group"></i>
                            ${context.profileNames.length} Saved Profiles
                        </span>
                        <span class="stat-item ${context.hasPersistence ? 'persistence-ok' : 'persistence-warning'}">
                            <i class="fas fa-${context.hasPersistence ? 'save' : 'exclamation-triangle'}"></i>
                            ${context.hasPersistence ? 'Persistent Storage' : 'Temporary Only'}
                        </span>
                    </div>
                </div>

                <div class="profiles-section">
                    <h3 class="section-title">Saved Profiles</h3>
                    
                    <div class="profile-controls">
                        <div class="profile-selector-group">
                            <select id="profile-selector" class="form-select">
                                <option value="">Select a profile...</option>
                                ${profileOptions}
                            </select>
                            <button type="button" id="load-profile-btn" class="btn btn-secondary" disabled>
                                <i class="fas fa-play"></i> Apply
                            </button>
                            <button type="button" id="delete-profile-btn" class="btn btn-danger" disabled>
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>

                    <div id="profile-details" class="profile-details hidden">
                        <div id="profile-info"></div>
                        <div id="profile-changes" class="changes-preview"></div>
                    </div>
                </div>

                <div class="save-section">
                    <h3 class="section-title">Save Current Configuration</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Settings Scope:</label>
                        <select id="settings-scope" class="form-select">
                            ${scopeOptions}
                        </select>
                        <div class="help-text">
                            <strong>Client:</strong> Settings each player can adjust individually (localStorage)<br>
                            <strong>World:</strong> Global settings shared across all users (requires GM)<br>
                            ${!context.isGM ? '<em style="color: #ff6b6b;">World settings require GM permissions</em>' : ''}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Profile Name:</label>
                        <input type="text" id="new-profile-name" class="form-input" placeholder="My Settings Configuration" />
                        <div class="help-text">
                            Choose a descriptive name for your current settings configuration.
                        </div>
                    </div>

                    <div class="current-settings-preview">
                        <h4>Current Settings Preview:</h4>
                        <div id="current-settings-list" class="settings-list"></div>
                    </div>

                    <button type="button" id="save-profile-btn" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Current Configuration as Profile
                    </button>
                </div>

                <div class="import-export-section">
                    <h3 class="section-title">Import/Export</h3>
                    
                    <div class="import-export-controls">
                        <button type="button" id="export-profiles-btn" class="btn btn-info">
                            <i class="fas fa-download"></i> Export All Profiles
                        </button>
                        <button type="button" id="import-profiles-btn" class="btn btn-warning">
                            <i class="fas fa-upload"></i> Import Profiles
                        </button>
                    </div>
                    
                    <div id="import-area" class="import-area hidden">
                        <div class="form-group">
                            <label class="form-label">Import Method:</label>
                            <select id="import-method" class="form-select">
                                <option value="file">Upload JSON File</option>
                                <option value="paste">Paste JSON Text</option>
                            </select>
                        </div>

                        <div id="file-upload" class="form-group">
                            <input type="file" id="import-file" accept=".json" class="file-input">
                        </div>

                        <div id="paste-area" class="form-group hidden">
                            <textarea id="import-json" class="json-input" placeholder="Paste exported profiles JSON here..."></textarea>
                        </div>

                        <div class="import-actions">
                            <button type="button" id="process-import-btn" class="btn btn-success">
                                <i class="fas fa-check"></i> Import Profiles
                            </button>
                            <button type="button" id="cancel-import-btn" class="btn btn-secondary">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                </div>

                <div class="warning-box">
                    <strong>⚠️ Important:</strong> Settings changes may require a page refresh to take full effect.
                    <br><strong>Persistence:</strong> Profiles are saved as flags on the macro document. Delete macro = lose profiles.
                    <br><strong>Permissions:</strong> World settings require GM permissions. Non-GMs can only manage client settings.
                </div>
            </form>

            <style>
                .settings-profiles-manager {
                    font-family: var(--font-primary);
                }

                .settings-profiles-form {
                    height: 100%;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    background: var(--color-bg);
                    color: var(--color-text-primary);
                    overflow-y: auto;
                }

                .header-section {
                    text-align: center;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 12px;
                    margin-bottom: 8px;
                    flex-shrink: 0;
                }

                .header-section h2 {
                    margin: 0 0 6px 0;
                    color: var(--color-text-primary);
                    font-size: 20px;
                }

                .subtitle {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    color: var(--color-text-dark-secondary);
                }

                .stats {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 8px;
                    flex-wrap: wrap;
                }

                .stat-item {
                    font-size: 12px;
                    color: var(--color-text-dark-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .stat-item.persistence-ok {
                    color: #51cf66;
                }

                .stat-item.persistence-warning {
                    color: #ff6b6b;
                }

                .profiles-section, .save-section, .import-export-section {
                    border: 1px solid var(--color-border);
                    border-radius: 6px;
                    padding: 16px;
                    background: var(--color-bg-option);
                    flex-shrink: 0;
                }

                .section-title {
                    margin: 0 0 16px 0;
                    color: var(--color-text-primary);
                    font-size: 16px;
                    font-weight: bold;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .form-label {
                    font-weight: bold;
                    color: var(--color-text-primary);
                    font-size: 14px;
                }

                .form-input, .form-select {
                    padding: 8px;
                    border: 1px solid var(--color-text-secondary);
                    border-radius: 4px;
                    color: var(--color-text-primary);
                    font-size: 14px;
                    min-height: 36px;
                }

                .file-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--color-text-secondary);
                    border-radius: 4px;
                    color: var(--color-text-primary);
                    font-size: 14px;
                    min-height: 36px;
                }

                .json-input {
                    height: 120px;
                    font-family: "Consolas", "Monaco", "Courier New", monospace;
                    font-size: 11px;
                    padding: 10px;
                    border: 1px solid var(--color-text-secondary);
                    border-radius: 4px;
                    background: var(--color-bg-primary);
                    color: var(--color-text-primary);
                    resize: vertical;
                    line-height: 1.4;
                }

                .form-input:focus, .form-select:focus, .file-input:focus, .json-input:focus {
                    border-color: var(--color-border-highlight);
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(73, 144, 226, 0.2);
                }

                .help-text {
                    font-size: 12px;
                    color: var(--color-text-dark-secondary);
                    background: var(--color-bg);
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid var(--color-border);
                    line-height: 1.4;
                }

                .btn {
                    padding: 8px 12px;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 13px;
                    background: var(--color-bg);
                    color: var(--color-text-primary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    min-height: 36px;
                    white-space: nowrap;
                }

                .btn:hover:not(:disabled) {
                    background: var(--color-bg-option);
                    border-color: var(--color-border-highlight);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: #4CAF50;
                    color: white;
                    border-color: #45a049;
                }

                .btn-secondary {
                    background: #2196F3;
                    color: white;
                    border-color: #1976D2;
                }

                .btn-warning {
                    background: #FF9800;
                    color: white;
                    border-color: #F57C00;
                }

                .btn-info {
                    background: #9C27B0;
                    color: white;
                    border-color: #7B1FA2;
                }

                .btn-danger {
                    background: #F44336;
                    color: white;
                    border-color: #D32F2F;
                }

                .btn-success {
                    background: #4CAF50;
                    color: white;
                    border-color: #45a049;
                }

                .profile-controls {
                    margin-bottom: 16px;
                }

                .profile-selector-group {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 8px;
                    align-items: center;
                }

                select option:disabled {
                    color: #999;
                    font-style: italic;
                }

                .profile-details {
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-top: 12px;
                }

                .current-settings-preview {
                    margin: 16px 0;
                    padding: 12px;
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                }

                .current-settings-preview h4 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: var(--color-text-primary);
                }

                .settings-list {
                    max-height: 150px;
                    overflow-y: auto;
                }

                .setting-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 6px 8px;
                    margin: 2px 0;
                    background: var(--color-bg-option);
                    border-radius: 3px;
                    font-size: 11px;
                }

                .setting-scope {
                    flex-shrink: 0;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .setting-scope.client {
                    background: #e3f2fd;
                    color: #1976d2;
                }

                .setting-scope.world {
                    background: #f3e5f5;
                    color: #7b1fa2;
                }

                .setting-info {
                    flex: 1;
                    min-width: 0;
                }

                .setting-name {
                    font-weight: bold;
                    color: var(--color-text-primary);
                    margin-bottom: 2px;
                }

                .setting-key {
                    color: var(--color-text-dark-secondary);
                    font-family: "Consolas", "Monaco", "Courier New", monospace;
                    font-size: 9px;
                }

                .changes-preview {
                    max-height: 150px;
                    overflow-y: auto;
                    margin-top: 12px;
                }

                .change-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                    margin: 2px 0;
                    font-size: 11px;
                    border-radius: 3px;
                }

                .change-item.modify {
                    background: rgba(255, 152, 0, 0.1);
                    color: #f57c00;
                }

                .import-export-controls {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .import-area {
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    padding: 16px;
                    margin-top: 12px;
                }

                .import-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-top: 12px;
                }

                .hidden {
                    display: none !important;
                }

                .warning-box {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    padding: 10px;
                    font-size: 12px;
                    color: #856404;
                    margin-top: auto;
                    flex-shrink: 0;
                    line-height: 1.4;
                }
            </style>
        `;
    }

    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.setupEventHandlers();
        this.updateCurrentSettingsList();
        this.updateProfileDetails();
    }

    setupEventHandlers() {
        this.element.querySelector('#profile-selector')?.addEventListener('change', (e) => {
            this.selectedProfile = e.target.value || null;
            this.updateProfileButtons();
            this.updateProfileDetails();
        });

        this.element.querySelector('#settings-scope')?.addEventListener('change', () => {
            this.updateCurrentSettingsList();
        });

        this.element.querySelector('#load-profile-btn')?.addEventListener('click', () => this.applyProfile());
        this.element.querySelector('#delete-profile-btn')?.addEventListener('click', () => this.deleteProfile());
        this.element.querySelector('#save-profile-btn')?.addEventListener('click', () => this.saveProfile());

        this.element.querySelector('#export-profiles-btn')?.addEventListener('click', () => this.exportProfiles());
        this.element.querySelector('#import-profiles-btn')?.addEventListener('click', () => this.showImportArea());
        this.element.querySelector('#import-method')?.addEventListener('change', () => this.toggleImportMethod());
        this.element.querySelector('#process-import-btn')?.addEventListener('click', () => this.importProfiles());
        this.element.querySelector('#cancel-import-btn')?.addEventListener('click', () => this.hideImportArea());

        this.updateProfileButtons();
    }

    loadProfiles() {
        try {
            this.macroDocument = game.macros.find(m => 
                m.command?.includes("SettingsProfilesManagerApp") || 
                m.command?.includes("showSettingsProfilesManager")
            );
            
            if (!this.macroDocument) {
                this.profiles = {};
                return;
            }

            // Try to load from primary storage
            let savedData = this.macroDocument.getFlag(SettingsProfilesManagerApp.FLAG_SCOPE, SettingsProfilesManagerApp.FLAG_KEY);
            
            // If primary storage fails, try fallback JSON storage
            if (!savedData) {
                const jsonString = this.macroDocument.getFlag(SettingsProfilesManagerApp.FLAG_SCOPE, SettingsProfilesManagerApp.FLAG_KEY + "-json");
                if (jsonString) {
                    console.log("Settings Profile Manager: Loading profiles from fallback JSON storage");
                    this.profiles = JSON.parse(jsonString);
                    return;
                }
            }
            
            if (savedData && savedData.profiles) {
                // Process loaded profiles and restore original setting keys
                this.profiles = {};
                for (const [profileName, profile] of Object.entries(savedData.profiles)) {
                    this.profiles[profileName] = {
                        ...profile,
                        clientSettings: {},
                        worldSettings: {}
                    };
                    
                    // Restore original keys (convert _DOT_ back to .)
                    for (const [safeKey, value] of Object.entries(profile.clientSettings || {})) {
                        const originalKey = safeKey.replace(/_DOT_/g, '.');
                        this.profiles[profileName].clientSettings[originalKey] = value;
                    }
                    
                    for (const [safeKey, value] of Object.entries(profile.worldSettings || {})) {
                        const originalKey = safeKey.replace(/_DOT_/g, '.');
                        this.profiles[profileName].worldSettings[originalKey] = value;
                    }
                }
                
                console.log(`Settings Profile Manager: Loaded ${Object.keys(this.profiles).length} profiles from flags`);
            } else {
                this.profiles = {};
            }
        } catch (error) {
            console.error("Error loading profiles:", error);
            this.profiles = {};
        }
    }

    async saveProfiles() {
        try {
            if (!this.macroDocument) {
                ui.notifications.warn("No macro document found - profiles will be lost when page refreshes. Run this from a saved macro for persistence.");
                return;
            }

            // Prepare data for saving - ensure it's properly serializable
            const profilesForSaving = {};
            for (const [profileName, profile] of Object.entries(this.profiles)) {
                try {
                    // Create a completely clean copy of the profile data
                    const cleanProfile = {
                        name: String(profile.name || ""),
                        scope: String(profile.scope || "client"),
                        timestamp: String(profile.timestamp || new Date().toISOString()),
                        user: String(profile.user || "Unknown"),
                        foundryVersion: String(profile.foundryVersion || "Unknown"),
                        clientSettings: {},
                        worldSettings: {}
                    };
                    
                    // Safely copy settings with aggressive filtering
                    for (const [key, value] of Object.entries(profile.clientSettings || {})) {
                        if (isSafeForFlagStorage(value)) {
                            // Ensure the key is safe (no dots that could confuse expandObject)
                            const safeKey = String(key).replace(/\./g, '_DOT_');
                            cleanProfile.clientSettings[safeKey] = value;
                        } else {
                            console.warn(`Skipping unsafe client setting ${key} in profile ${profileName}`);
                        }
                    }
                    
                    for (const [key, value] of Object.entries(profile.worldSettings || {})) {
                        if (isSafeForFlagStorage(value)) {
                            // Ensure the key is safe (no dots that could confuse expandObject)
                            const safeKey = String(key).replace(/\./g, '_DOT_');
                            cleanProfile.worldSettings[safeKey] = value;
                        } else {
                            console.warn(`Skipping unsafe world setting ${key} in profile ${profileName}`);
                        }
                    }
                    
                    profilesForSaving[String(profileName)] = cleanProfile;
                } catch (error) {
                    console.warn(`Failed to process profile ${profileName} for saving:`, error);
                }
            }

            const data = {
                version: String("1.0"),
                timestamp: String(new Date().toISOString()),
                profiles: profilesForSaving
            };
            
            // Final safety check - ensure the entire data structure is safe
            if (!isSafeForFlagStorage(data)) {
                throw new Error("Profile data contains unsafe structures that cannot be saved as flags");
            }
            
            // Additional debugging - log the structure before saving
            console.log("Settings Profile Manager: Attempting to save data structure:", data);
            console.log("Settings Profile Manager: Data size:", JSON.stringify(data).length, "characters");
            
            // Try to save the flag
            await this.macroDocument.setFlag(SettingsProfilesManagerApp.FLAG_SCOPE, SettingsProfilesManagerApp.FLAG_KEY, data);
            
            console.log("Settings Profile Manager: Successfully saved profiles to flags");
            
        } catch (error) {
            console.error("Error saving profiles:", error);
            console.error("Error stack:", error.stack);
            
            // Try alternative storage approach if flag saving fails
            console.log("Settings Profile Manager: Attempting alternative storage method...");
            try {
                // Store as a simple JSON string instead of complex object
                const jsonString = JSON.stringify(this.profiles);
                await this.macroDocument.setFlag(SettingsProfilesManagerApp.FLAG_SCOPE, SettingsProfilesManagerApp.FLAG_KEY + "-json", jsonString);
                ui.notifications.warn("Profiles saved using fallback method - some features may be limited");
                console.log("Settings Profile Manager: Fallback storage successful");
            } catch (fallbackError) {
                console.error("Fallback storage also failed:", fallbackError);
                ui.notifications.error("Failed to save profiles - check console for details");
                throw error;
            }
        }
    }

    refreshCurrentSettings() {
        this.currentSettings = getAccessibleSettings();
    }

    getScopeLabel(scope) {
        switch(scope) {
            case 'client': return '(Client)';
            case 'world': return '(World)';
            case 'both': return '(Both)';
            default: return '';
        }
    }

    isProfileAccessible(profile) {
        if (profile.scope === 'client') return true;
        if (profile.scope === 'world' || profile.scope === 'both') {
            return game.user.isGM;
        }
        return true;
    }

    updateCurrentSettingsList() {
        const settingsList = this.element.querySelector('#current-settings-list');
        if (!settingsList || !this.currentSettings) return;

        const scope = this.element.querySelector('#settings-scope')?.value || 'client';
        let settings = {};
        
        if (scope === 'client') {
            settings = this.currentSettings.client;
        } else if (scope === 'world') {
            settings = this.currentSettings.world;
        } else if (scope === 'both') {
            settings = { ...this.currentSettings.client, ...this.currentSettings.world };
        }

        const settingsList_html = Object.entries(settings)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => {
                const info = this.currentSettings.settingsInfo[key];
                if (!info) return '';
                
                return `
                    <div class="setting-item">
                        <div class="setting-scope ${info.scope}">${info.scope.toUpperCase()}</div>
                        <div class="setting-info">
                            <div class="setting-name">${info.name}</div>
                            <div class="setting-key">${key}</div>
                        </div>
                    </div>
                `;
            }).join('');

        settingsList.innerHTML = settingsList_html || '<p style="font-style: italic; color: var(--color-text-dark-secondary); padding: 8px;">No accessible settings found</p>';
    }

    updateProfileButtons() {
        const loadBtn = this.element.querySelector('#load-profile-btn');
        const deleteBtn = this.element.querySelector('#delete-profile-btn');
        
        const hasSelection = this.selectedProfile && this.profiles[this.selectedProfile];
        const isAccessible = hasSelection ? this.isProfileAccessible(this.profiles[this.selectedProfile]) : false;
        
        if (loadBtn) loadBtn.disabled = !hasSelection || !isAccessible;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
    }

    updateProfileDetails() {
        const detailsElement = this.element.querySelector('#profile-details');
        if (!detailsElement) return;

        if (!this.selectedProfile || !this.profiles[this.selectedProfile]) {
            detailsElement.classList.add('hidden');
            return;
        }

        const profile = this.profiles[this.selectedProfile];
        const infoElement = this.element.querySelector('#profile-info');
        const changesElement = this.element.querySelector('#profile-changes');

        const clientCount = Object.keys(profile.clientSettings || {}).length;
        const worldCount = Object.keys(profile.worldSettings || {}).length;
        const totalCount = clientCount + worldCount;

        infoElement.innerHTML = `
            <strong>Profile:</strong> ${profile.name}<br>
            <strong>Created:</strong> ${new Date(profile.timestamp).toLocaleString()}<br>
            <strong>Scope:</strong> ${profile.scope} ${this.getScopeLabel(profile.scope)}<br>
            <strong>Settings:</strong> ${totalCount} total (${clientCount} client, ${worldCount} world)<br>
            <strong>User:</strong> ${profile.user || 'Unknown'}<br>
            ${!this.isProfileAccessible(profile) ? '<em style="color: #ff6b6b;">⚠️ This profile requires GM permissions</em>' : ''}
        `;

        // Show what would change if this profile is applied
        const changes = [];
        const allCurrentSettings = { ...this.currentSettings.client, ...this.currentSettings.world };
        const allProfileSettings = { ...profile.clientSettings, ...profile.worldSettings };

        for (const [key, profileValue] of Object.entries(allProfileSettings)) {
            // Make sure we're comparing with the original key format
            const originalKey = key.replace(/_DOT_/g, '.');
            if (!isSettingAccessible(originalKey)) continue;
            
            const currentValue = allCurrentSettings[originalKey];
            if (JSON.stringify(currentValue) !== JSON.stringify(profileValue)) {
                const info = this.currentSettings.settingsInfo[originalKey];
                changes.push({
                    key: originalKey,
                    name: info?.name || originalKey,
                    scope: info?.scope || 'unknown',
                    currentValue,
                    profileValue
                });
            }
        }

        if (changes.length === 0) {
            changesElement.innerHTML = '<p style="color: #51cf66; font-style: italic;">✓ No changes needed - profile matches current state!</p>';
        } else {
            const changesList = changes.slice(0, 10).map(change => 
                `<div class="change-item modify">
                    <i class="fas fa-edit"></i>
                    <div class="setting-scope ${change.scope}">${change.scope.toUpperCase()}</div>
                    <strong>${change.name}</strong>
                    <span>→ MODIFY</span>
                </div>`
            ).join('');
            
            changesElement.innerHTML = `
                <h5 style="margin: 0 0 8px 0; font-size: 12px;">Changes Required (${changes.length}):</h5>
                ${changesList}
                ${changes.length > 10 ? `<p style="font-size: 10px; color: var(--color-text-dark-secondary); margin: 4px 0;">...and ${changes.length - 10} more changes</p>` : ''}
            `;
        }

        detailsElement.classList.remove('hidden');
    }

    async saveProfile() {
        try {
            const nameInput = this.element.querySelector('#new-profile-name');
            const scopeSelect = this.element.querySelector('#settings-scope');
            const profileName = nameInput.value.trim();
            const scope = scopeSelect.value;

            if (!profileName) {
                ui.notifications.warn("Please enter a profile name");
                nameInput.focus();
                return;
            }

            if (!scope) {
                ui.notifications.warn("Please select a settings scope");
                return;
            }

            // Check if scope is accessible
            const availableScopes = getAvailableScopes();
            const scopeInfo = availableScopes.find(s => s.value === scope);
            if (!scopeInfo || !scopeInfo.available) {
                ui.notifications.error(`You don't have access to ${scope} settings`);
                return;
            }

            if (this.profiles[profileName]) {
                const overwrite = await foundry.applications.api.DialogV2.confirm({
                    window: { title: "Profile Exists" },
                    content: `<p>A profile named "<strong>${profileName}</strong>" already exists. Do you want to overwrite it?</p>`,
                    rejectClose: false,
                    modal: true
                });
                
                if (!overwrite) return;
            }

            this.refreshCurrentSettings();
            
            const profileData = {
                name: profileName,
                scope: scope,
                timestamp: new Date().toISOString(),
                user: game.user.name,
                foundryVersion: game.version,
                clientSettings: {},
                worldSettings: {}
            };

            if (scope === 'client' || scope === 'both') {
                profileData.clientSettings = { ...this.currentSettings.client };
            }
            if (scope === 'world' || scope === 'both') {
                profileData.worldSettings = { ...this.currentSettings.world };
            }

            this.profiles[profileName] = profileData;
            await this.saveProfiles();
            
            nameInput.value = '';
            this.selectedProfile = profileName;
            await this.render();
            
            const settingsCount = Object.keys(profileData.clientSettings).length + Object.keys(profileData.worldSettings).length;
            ui.notifications.info(`Profile "${profileName}" saved with ${settingsCount} settings!`);
            
            console.log(`Settings Profile Manager: Saved profile "${profileName}" with ${settingsCount} settings (${Object.keys(profileData.clientSettings).length} client, ${Object.keys(profileData.worldSettings).length} world)`);

        } catch (error) {
            console.error("Error saving profile:", error);
            ui.notifications.error("Failed to save profile - check console for details");
        }
    }

    async deleteProfile() {
        if (!this.selectedProfile || !this.profiles[this.selectedProfile]) return;

        try {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: { title: "Delete Profile" },
                content: `<p>Are you sure you want to delete the profile "<strong>${this.selectedProfile}</strong>"?</p><p>This action cannot be undone.</p>`,
                rejectClose: false,
                modal: true
            });

            if (!confirmed) return;

            delete this.profiles[this.selectedProfile];
            
            if (this.macroDocument) {
                await this.saveProfiles();
            }
            
            this.selectedProfile = null;
            await this.render();
            
            ui.notifications.info("Profile deleted successfully");
            
        } catch (error) {
            console.error("Error deleting profile:", error);
            ui.notifications.error("Failed to delete profile - check console for details");
        }
    }

    async applyProfile() {
        if (!this.selectedProfile || !this.profiles[this.selectedProfile]) return;

        const profile = this.profiles[this.selectedProfile];
        
        if (!this.isProfileAccessible(profile)) {
            ui.notifications.error("You don't have permission to apply this profile");
            return;
        }

        try {
            const allProfileSettings = { ...profile.clientSettings, ...profile.worldSettings };
            const changes = [];

            this.refreshCurrentSettings();
            const allCurrentSettings = { ...this.currentSettings.client, ...this.currentSettings.world };

            // Analyze changes
            for (const [key, profileValue] of Object.entries(allProfileSettings)) {
                // Convert back to original key format for comparison and application
                const originalKey = key.replace(/_DOT_/g, '.');
                if (!isSettingAccessible(originalKey)) continue;
                
                const currentValue = allCurrentSettings[originalKey];
                if (JSON.stringify(currentValue) !== JSON.stringify(profileValue)) {
                    const info = this.currentSettings.settingsInfo[originalKey];
                    changes.push({
                        key: originalKey,
                        name: info?.name || originalKey,
                        scope: info?.scope || 'unknown',
                        currentValue,
                        profileValue
                    });
                }
            }

            if (changes.length === 0) {
                ui.notifications.info("No changes needed - profile already matches current state!");
                return;
            }

            const changesList = changes.slice(0, 10).map(c => 
                `<li><strong>${c.name}</strong> (${c.scope}): ${JSON.stringify(c.currentValue)} → ${JSON.stringify(c.profileValue)}</li>`
            ).join('');

            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: { title: `Apply Profile: ${profile.name}` },
                content: `
                    <p>This will change the following ${changes.length} settings:</p>
                    <ul style="margin: 10px 0; padding-left: 20px; max-height: 200px; overflow-y: auto; font-size: 12px;">
                        ${changesList}
                        ${changes.length > 10 ? `<li><em>...and ${changes.length - 10} more changes</em></li>` : ''}
                    </ul>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; color: #856404; border: 1px solid #ffeaa7;">
                        <strong>⚠️ Note:</strong> Some settings changes may require a page refresh to take full effect.
                    </div>
                `,
                rejectClose: false,
                modal: true
            });

            if (!confirmed) return;

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Apply settings changes
            for (const change of changes) {
                try {
                    const parts = change.key.split('.');
                    const namespace = parts[0];
                    const settingKey = parts.slice(1).join('.');
                    
                    // Double-check the setting is still registered and accessible
                    if (!isSettingAccessible(change.key)) {
                        console.warn(`Setting ${change.key} is no longer accessible, skipping`);
                        errorCount++;
                        errors.push(`${change.name}: Setting no longer accessible`);
                        continue;
                    }
                    
                    await game.settings.set(namespace, settingKey, change.profileValue);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to apply setting ${change.key}:`, error);
                    errors.push(`${change.name}: ${error.message}`);
                    errorCount++;
                }
            }

            ui.notifications.info(`Profile applied: ${successCount} settings changed, ${errorCount} failed`);
            
            if (errorCount > 0) {
                console.warn("Settings application errors:", errors);
            }

            // Refresh current settings and UI
            this.refreshCurrentSettings();
            this.updateProfileDetails();
            
            if (successCount > 0) {
                setTimeout(async () => {
                    const shouldRefresh = await foundry.applications.api.DialogV2.confirm({
                        window: { title: "Refresh Page?" },
                        content: "<p>Settings have been applied. Some changes may require a page refresh to take effect. Refresh now?</p>",
                        rejectClose: false,
                        modal: true
                    });
                    
                    if (shouldRefresh) {
                        window.location.reload();
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.error("Error applying profile:", error);
            ui.notifications.error(`Failed to apply profile: ${error.message}`);
        }
    }

    async exportProfiles() {
        try {
            const exportData = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                foundryVersion: game.version,
                user: game.user.name,
                profileCount: Object.keys(this.profiles).length,
                profiles: this.profiles
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const filename = `settings-profiles-${game.user.name}-${new Date().toISOString().split('T')[0]}.json`;
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            setTimeout(() => {
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }, 10);
            
            ui.notifications.info(`Exported ${Object.keys(this.profiles).length} profiles!`);

        } catch (error) {
            console.error("Error exporting profiles:", error);
            ui.notifications.error("Failed to export profiles - check console for details");
        }
    }

    showImportArea() {
        this.element.querySelector('#import-area').classList.remove('hidden');
    }

    hideImportArea() {
        this.element.querySelector('#import-area').classList.add('hidden');
    }

    toggleImportMethod() {
        const method = this.element.querySelector('#import-method').value;
        const fileUpload = this.element.querySelector('#file-upload');
        const pasteArea = this.element.querySelector('#paste-area');
        
        if (method === 'file') {
            fileUpload.classList.remove('hidden');
            pasteArea.classList.add('hidden');
        } else {
            fileUpload.classList.add('hidden');
            pasteArea.classList.remove('hidden');
        }
    }

    async importProfiles() {
        try {
            const method = this.element.querySelector('#import-method').value;
            let importData = null;

            if (method === 'file') {
                const fileInput = this.element.querySelector('#import-file');
                if (!fileInput.files.length) {
                    ui.notifications.warn("Please select a file to import");
                    return;
                }
                
                const file = fileInput.files[0];
                const text = await file.text();
                importData = JSON.parse(text);
            } else {
                const textInput = this.element.querySelector('#import-json').value.trim();
                if (!textInput) {
                    ui.notifications.warn("Please paste JSON data to import");
                    return;
                }
                importData = JSON.parse(textInput);
            }

            if (!importData.profiles || typeof importData.profiles !== 'object') {
                throw new Error("Invalid format - missing 'profiles' object");
            }

            const profileNames = Object.keys(importData.profiles);
            const conflicts = profileNames.filter(name => this.profiles[name]);
            
            // Check for permission issues
            const restrictedProfiles = profileNames.filter(name => {
                const profile = importData.profiles[name];
                return !this.isProfileAccessible(profile);
            });

            if (restrictedProfiles.length > 0) {
                ui.notifications.warn(`Skipping ${restrictedProfiles.length} profiles that require GM permissions: ${restrictedProfiles.join(', ')}`);
            }

            let proceed = true;
            if (conflicts.length > 0) {
                proceed = await foundry.applications.api.DialogV2.confirm({
                    window: { title: "Import Conflicts" },
                    content: `
                        <p>The following profiles already exist and will be overwritten:</p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${conflicts.map(name => `<li><strong>${name}</strong></li>`).join('')}
                        </ul>
                        <p>Continue with import?</p>
                    `,
                    rejectClose: false,
                    modal: true
                });
            }

            if (!proceed) return;

            let importedCount = 0;
            for (const [name, profile] of Object.entries(importData.profiles)) {
                if (this.isProfileAccessible(profile)) {
                    try {
                        // Validate and clean the profile data before importing
                        const cleanProfile = {
                            name: profile.name || name,
                            scope: profile.scope || 'client',
                            timestamp: profile.timestamp || new Date().toISOString(),
                            user: profile.user || 'Unknown',
                            foundryVersion: profile.foundryVersion || 'Unknown',
                            clientSettings: {},
                            worldSettings: {}
                        };
                        
                        // Clean and validate client settings
                        for (const [key, value] of Object.entries(profile.clientSettings || {})) {
                            if (isSafeForFlagStorage(value) && isSettingAccessible(key)) {
                                cleanProfile.clientSettings[key] = value;
                            } else {
                                console.warn(`Skipping problematic client setting ${key} in imported profile ${name}`);
                            }
                        }
                        
                        // Clean and validate world settings
                        for (const [key, value] of Object.entries(profile.worldSettings || {})) {
                            if (isSafeForFlagStorage(value) && isSettingAccessible(key)) {
                                cleanProfile.worldSettings[key] = value;
                            } else {
                                console.warn(`Skipping problematic world setting ${key} in imported profile ${name}`);
                            }
                        }
                        
                        this.profiles[name] = cleanProfile;
                        importedCount++;
                    } catch (error) {
                        console.warn(`Failed to import profile ${name}:`, error);
                    }
                }
            }

            await this.saveProfiles();
            
            this.hideImportArea();
            await this.render();
            
            ui.notifications.info(`Successfully imported ${importedCount} profiles!`);

        } catch (error) {
            console.error("Error importing profiles:", error);
            ui.notifications.error(`Import failed: ${error.message}`);
        }
    }
}

async function showSettingsProfilesManager() {
    try {
        if (game.settingsProfilesManagerApp?.rendered) {
            game.settingsProfilesManagerApp.close();
        }

        game.settingsProfilesManagerApp = new SettingsProfilesManagerApp();
        game.settingsProfilesManagerApp.render(true);

    } catch (error) {
        console.error("Error creating Settings Profiles Manager:", error);
        ui.notifications.error("Failed to open Settings Profiles Manager. Check console for details.");
    }
}

showSettingsProfilesManager();