class ModuleProfilesManagerApp extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "module-profiles-manager",
        window: {
            title: "Module Profiles Manager",
            icon: "fas fa-layer-group",
            resizable: true
        },
        position: {
            width: 750,
            height: 1000
        },
        classes: ["module-profiles-manager"],
        modal: false
    };

    static FLAG_SCOPE = game.system.id;
    static FLAG_KEY = "module-profiles-data";

    constructor() {
        super();
        this.profiles = {};
        this.selectedProfile = null;
        this.macroDocument = null;
        this.loadProfiles();
    }

    async _prepareContext(options) {
        return {
            profiles: this.profiles,
            profileNames: Object.keys(this.profiles).sort(),
            moduleCount: game.modules.size,
            activeModuleCount: Array.from(game.modules.values()).filter(m => m.active).length,
            selectedProfile: this.selectedProfile,
            hasPersistence: !!this.macroDocument
        };
    }

    async _renderHTML(context, options) {
        const profileOptions = context.profileNames.map(name => 
            `<option value="${name}" ${context.selectedProfile === name ? 'selected' : ''}>${name}</option>`
        ).join('');

        return `
            <form class="module-profiles-form">
                <div class="header-section">
                    <h2>Module Profiles Manager</h2>
                    <p class="subtitle">Save, manage, and switch between module configurations</p>
                    <div class="stats">
                        <span class="stat-item">
                            <i class="fas fa-puzzle-piece"></i>
                            ${context.moduleCount} Total Modules
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-check-circle"></i>
                            ${context.activeModuleCount} Active
                        </span>
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
                        <label class="form-label">Profile Name:</label>
                        <input type="text" id="new-profile-name" class="form-input" placeholder="My Gaming Setup" />
                        <div class="help-text">
                            Choose a descriptive name for your current module configuration.
                        </div>
                    </div>

                    <div class="current-modules-preview">
                        <h4>Current Active Modules (${context.activeModuleCount} of ${context.moduleCount}):</h4>
                        <div id="current-modules-list" class="modules-list"></div>
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
                    <strong>⚠️ Important:</strong> Module configuration changes require a world reload to take effect.
                    <br><strong>Persistence:</strong> Profiles are saved as flags on the macro document. If you delete the macro profiles are gone.
                </div>
            </form>

            <style>
                .module-profiles-manager {
                    font-family: var(--font-primary);
                }

                .module-profiles-form {
                    height: 100%;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    background: var(--color-bg);
                    color: var(--color-text-primary);
                    overflow-y: auto;
                    overflow-x: hidden;
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
                    gap: 20px;
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
                    font-size: 1.1em;
                    height: auto;
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

                .profile-details {
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-top: 12px;
                }

                .current-modules-preview {
                    margin: 16px 0;
                    padding: 12px;
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                }

                .current-modules-preview h4 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: var(--color-text-primary);
                }

                .modules-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 6px;
                    max-height: 150px;
                    overflow-y: auto;
                }

                .module-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    background: var(--color-bg-option);
                    border-radius: 3px;
                    font-size: 11px;
                }

                .module-status {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .module-status.active {
                    background: #51cf66;
                }

                .module-status.inactive {
                    background: #ff6b6b;
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

                .change-item.enable {
                    background: rgba(81, 207, 102, 0.1);
                    color: #2b8a3e;
                }

                .change-item.disable {
                    background: rgba(255, 107, 107, 0.1);
                    color: #c92a2a;
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
        this.updateCurrentModulesList();
        this.updateProfileDetails();
    }

    setupEventHandlers() {
        this.element.querySelector('#profile-selector')?.addEventListener('change', (e) => {
            this.selectedProfile = e.target.value || null;
            this.updateProfileButtons();
            this.updateProfileDetails();
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
                m.command?.includes("ModuleProfilesManagerApp") || 
                m.command?.includes("showModuleProfilesManager")
            );
            
            if (!this.macroDocument) {
                console.log("No macro document found for profile persistence");
                this.profiles = {};
                return;
            }

            console.log(`Found macro document: ${this.macroDocument.name} (${this.macroDocument.id})`);

            const savedData = this.macroDocument.getFlag(ModuleProfilesManagerApp.FLAG_SCOPE, ModuleProfilesManagerApp.FLAG_KEY);
            if (savedData && savedData.profiles) {
                this.profiles = savedData.profiles;
                console.log(`Loaded ${Object.keys(this.profiles).length} profiles:`, Object.keys(this.profiles));
            } else {
                console.log("No saved profile data found in macro flags (flag may have been unset)");
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
                const error = "No macro document found - profiles will be lost when page refreshes. Run this from a saved macro for persistence.";
                ui.notifications.warn(error);
                throw new Error(error);
            }

            console.log(`Saving profiles to macro ${this.macroDocument.name}:`, Object.keys(this.profiles));

            // Check if we should unset the flag (when no profiles exist) or set it
            if (Object.keys(this.profiles).length === 0) {
                console.log("No profiles remaining, unsetting flag...");
                await this.macroDocument.unsetFlag(ModuleProfilesManagerApp.FLAG_SCOPE, ModuleProfilesManagerApp.FLAG_KEY);
                console.log("Flag unset successfully");
            } else {
                const data = {
                    version: "1.0",
                    timestamp: new Date().toISOString(),
                    profiles: this.profiles
                };
                
                console.log("Setting flag with data:", data);
                const result = await this.macroDocument.setFlag(ModuleProfilesManagerApp.FLAG_SCOPE, ModuleProfilesManagerApp.FLAG_KEY, data);
                console.log("setFlag result:", result);
                
                // Verify the save worked immediately
                const verification = this.macroDocument.getFlag(ModuleProfilesManagerApp.FLAG_SCOPE, ModuleProfilesManagerApp.FLAG_KEY);
                console.log("Immediate verification:", verification);
                
                if (!verification || verification.timestamp !== data.timestamp) {
                    throw new Error("Flag was not properly saved - verification failed");
                }
            }
            
            console.log("Profiles saved successfully");
            
        } catch (error) {
            console.error("Save profiles error:", error);
            ui.notifications.error(`Failed to save profiles: ${error.message}`);
            throw error;
        }
    }

    getCurrentModuleConfig() {
        const config = {};
        for (const [id, module] of game.modules.entries()) {
            config[id] = module.active;
        }
        return config;
    }

    updateCurrentModulesList() {
        const modulesList = this.element.querySelector('#current-modules-list');
        if (!modulesList) return;

        const config = this.getCurrentModuleConfig();
        
        const allModules = Object.entries(config)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, active]) => {
                const module = game.modules.get(id);
                const title = module?.title || id;
                return `
                    <div class="module-item">
                        <div class="module-status ${active ? 'active' : 'inactive'}"></div>
                        <span title="${id}">${title}</span>
                    </div>
                `;
            }).join('');

        modulesList.innerHTML = allModules || '<p style="font-style: italic; color: var(--color-text-dark-secondary);">No modules found</p>';
    }

    updateProfileButtons() {
        const loadBtn = this.element.querySelector('#load-profile-btn');
        const deleteBtn = this.element.querySelector('#delete-profile-btn');
        
        const hasSelection = this.selectedProfile && this.profiles[this.selectedProfile];
        
        if (loadBtn) loadBtn.disabled = !hasSelection;
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

        infoElement.innerHTML = `
            <strong>Profile:</strong> ${profile.name}<br>
            <strong>Created:</strong> ${new Date(profile.timestamp).toLocaleString()}<br>
            <strong>Modules:</strong> ${Object.keys(profile.modules).length} total, ${Object.values(profile.modules).filter(a => a).length} active
        `;

        const currentConfig = this.getCurrentModuleConfig();
        const changes = [];

        for (const [moduleId, shouldBeActive] of Object.entries(profile.modules)) {
            const currentlyActive = currentConfig[moduleId] || false;
            if (currentlyActive !== shouldBeActive) {
                const module = game.modules.get(moduleId);
                const moduleName = module?.title || moduleId;
                
                changes.push({
                    id: moduleId,
                    name: moduleName,
                    action: shouldBeActive ? 'enable' : 'disable'
                });
            }
        }

        if (changes.length === 0) {
            changesElement.innerHTML = '<p style="color: #51cf66; font-style: italic;">✓ No changes needed - profile matches current state!</p>';
        } else {
            const changesList = changes.map(change => 
                `<div class="change-item ${change.action}">
                    <i class="fas fa-${change.action === 'enable' ? 'plus-circle' : 'minus-circle'}"></i>
                    <strong>${change.name}</strong>
                    <span>→ ${change.action.toUpperCase()}</span>
                </div>`
            ).join('');
            
            changesElement.innerHTML = `
                <h5 style="margin: 0 0 8px 0; font-size: 12px;">Changes Required (${changes.length}):</h5>
                ${changesList}
            `;
        }

        detailsElement.classList.remove('hidden');
    }

    async saveProfile() {
        try {
            const nameInput = this.element.querySelector('#new-profile-name');
            const profileName = nameInput.value.trim();

            if (!profileName) {
                ui.notifications.warn("Please enter a profile name");
                nameInput.focus();
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

            const config = this.getCurrentModuleConfig();
            
            this.profiles[profileName] = {
                name: profileName,
                timestamp: new Date().toISOString(),
                user: game.user.name,
                modules: config
            };

            await this.saveProfiles();
            
            nameInput.value = '';
            this.selectedProfile = profileName;
            await this.render();
            
            ui.notifications.info(`Profile "${profileName}" saved successfully!`);

        } catch (error) {
            console.error("Save profile error:", error);
            ui.notifications.error("Failed to save profile");
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

            const profileToDelete = this.selectedProfile;

            // Verify macro document exists
            if (!this.macroDocument) {
                ui.notifications.error("No macro document found - cannot persist deletion");
                return;
            }

            console.log(`Deleting profile: ${profileToDelete}`);
            console.log(`Profiles before deletion:`, Object.keys(this.profiles));

            // Delete from local object
            delete this.profiles[profileToDelete];
            
            console.log(`Profiles after deletion:`, Object.keys(this.profiles));

            // Save to flags and wait for completion
            try {
                await this.saveProfiles();
                
                // Verify the save worked by checking the flags
                const savedData = this.macroDocument.getFlag(ModuleProfilesManagerApp.FLAG_SCOPE, ModuleProfilesManagerApp.FLAG_KEY);
                if (savedData && savedData.profiles && savedData.profiles[profileToDelete]) {
                    throw new Error("Profile still exists in saved flags after deletion");
                }
                
                console.log(`Profile ${profileToDelete} successfully deleted and saved`);
                
            } catch (saveError) {
                console.error("Save failed:", saveError);
                // Restore the profile since save failed
                this.loadProfiles();
                ui.notifications.error(`Failed to save deletion: ${saveError.message}`);
                return;
            }
            
            this.selectedProfile = null;
            
            // Clear the dropdown selection immediately
            const selector = this.element.querySelector('#profile-selector');
            if (selector) selector.value = '';
            
            await this.render();
            
            ui.notifications.info(`Profile "${profileToDelete}" deleted successfully`);
            
        } catch (error) {
            console.error("Delete profile error:", error);
            ui.notifications.error(`Failed to delete profile: ${error.message}`);
        }
    }

    async applyProfile() {
        if (!this.selectedProfile || !this.profiles[this.selectedProfile]) return;

        if (!game.user.isGM) {
            ui.notifications.error("Only Game Masters can apply module configurations");
            return;
        }

        const profile = this.profiles[this.selectedProfile];
        const currentConfig = this.getCurrentModuleConfig();
        const changes = [];

        for (const [moduleId, shouldBeActive] of Object.entries(profile.modules)) {
            const currentlyActive = currentConfig[moduleId] || false;
            if (currentlyActive !== shouldBeActive) {
                const module = game.modules.get(moduleId);
                changes.push({
                    id: moduleId,
                    name: module?.title || moduleId,
                    from: currentlyActive,
                    to: shouldBeActive
                });
            }
        }

        if (changes.length === 0) {
            ui.notifications.info("No changes needed - profile already matches current state!");
            return;
        }

        const changesList = changes.map(c => 
            `<li><strong>${c.name}</strong>: ${c.from ? 'Enabled' : 'Disabled'} → ${c.to ? 'Enabled' : 'Disabled'}</li>`
        ).join('');

        try {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: { title: `Apply Profile: ${profile.name}` },
                content: `
                    <p>This will change the following ${changes.length} modules:</p>
                    <ul style="margin: 10px 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
                        ${changesList}
                    </ul>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; color: #856404; border: 1px solid #ffeaa7;">
                        <strong>⚠️ Warning:</strong> This will automatically reload the world to apply changes.
                    </div>
                `,
                rejectClose: false,
                modal: true
            });

            if (!confirmed) return;

            ui.notifications.info(`Applying profile "${profile.name}"... World will reload automatically.`);
            
            await game.settings.set("core", "moduleConfiguration", profile.modules);
            
            this.close();
            
            setTimeout(() => {
                ui.notifications.info("Reloading world to apply module changes...");
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error("Apply profile error:", error);
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
            const filename = `module-profiles-${game.user.name}-${new Date().toISOString().split('T')[0]}.json`;
            
            // Create blob and download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            
            // Ensure the link is added to DOM and clicked with proper timing
            document.body.appendChild(downloadLink);
            downloadLink.style.display = 'none';
            
            // Small delay to ensure DOM insertion, then click
            setTimeout(() => {
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }, 10);
            
            ui.notifications.info(`Exported ${Object.keys(this.profiles).length} profiles!`);

        } catch (error) {
            console.error("Export profiles error:", error);
            ui.notifications.error("Failed to export profiles");
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

            Object.assign(this.profiles, importData.profiles);
            await this.saveProfiles();
            
            this.hideImportArea();
            await this.render();
            
            ui.notifications.info(`Successfully imported ${profileNames.length} profiles!`);

        } catch (error) {
            console.error("Import profiles error:", error);
            ui.notifications.error(`Import failed: ${error.message}`);
        }
    }
}

async function showModuleProfilesManager() {
    try {
        if (game.moduleProfilesManagerApp?.rendered) {
            game.moduleProfilesManagerApp.close();
        }

        game.moduleProfilesManagerApp = new ModuleProfilesManagerApp();
        game.moduleProfilesManagerApp.render(true);

    } catch (error) {
        console.error("Failed to open Module Profiles Manager:", error);
        ui.notifications.error("Failed to open Module Profiles Manager. Check console for details.");
    }
}

showModuleProfilesManager();