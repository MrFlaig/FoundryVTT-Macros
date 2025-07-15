/**
 * FOUNDRY VTT SETTINGS MANAGER - ApplicationV2 Version
 * Modern single window solution for exporting and importing all client settings
 * Uses ApplicationV2 with Foundry's built-in CSS variables for consistent theming
 */

// Missing function fix - validates if a setting is registered
function isSettingValid(settingKey) {
    try {
        const parts = settingKey.split('.');
        if (parts.length < 2) return false;
        
        const namespace = parts[0];
        const key = parts.slice(1).join('.');
        
        // Check if the setting is registered in the game.settings.settings Map
        const registeredKey = `${namespace}.${key}`;
        return game.settings.settings.has(registeredKey);
    } catch (error) {
        return false;
    }
}

class SettingsManagerApp extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "settings-manager",
        window: {
            title: "Settings Manager",
            icon: "fas fa-cogs",
            resizable: true
        },
        position: {
            width: 600,
            height: 750
        },
        classes: ["settings-manager"],
        modal: false
    };

    constructor() {
        super();
        this.selectedTokens = [];
        this.currentState = {
            activeSection: null,
            selectedModules: new Set(),
            exportData: null
        };
    }

    async _prepareContext(options) {
        return {
            currentState: this.currentState,
            scopes: [
                { value: "client", label: "Client Settings (Per-User)" },
                { value: "world", label: "World Settings (Global)" },
                { value: "both", label: "Both Client & World Settings" }
            ],
            exportTypes: [
                { value: "all", label: "All Settings" },
                { value: "selective", label: "Select by Module" }
            ],
            importMethods: [
                { value: "file", label: "Upload JSON File" },
                { value: "paste", label: "Paste JSON Text" }
            ]
        };
    }

    async _renderHTML(context, options) {
        return `
            <form class="settings-manager-form">
                <!-- Header -->
                <div class="header-section">
                    <h2>Foundry VTT Settings Manager</h2>
                    <p class="subtitle">Export and Import your client settings</p>
                </div>

                <!-- Settings Scope Selection -->
                <div class="form-group">
                    <label class="form-label">Settings Scope:</label>
                    <select id="settings-scope" class="form-select">
                        ${context.scopes.map(scope => 
                            `<option value="${scope.value}">${scope.label}</option>`
                        ).join('')}
                    </select>
                    <div class="help-text">
                        <strong>Client:</strong> Settings each player can adjust individually<br>
                        <strong>World:</strong> Global settings (usually GM-only)
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button type="button" id="export-btn" class="btn btn-primary">
                        <i class="fas fa-upload"></i> Export Settings
                    </button>
                    <button type="button" id="import-btn" class="btn btn-secondary">
                        <i class="fas fa-download"></i> Import Settings
                    </button>
                </div>

                <!-- Export Section -->
                <div id="export-section" class="section hidden">
                    <h3 class="section-title">Export Options</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Export Type:</label>
                        <select id="export-type" class="form-select">
                            ${context.exportTypes.map(type => 
                                `<option value="${type.value}">${type.label}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div id="module-selector" class="module-selector hidden">
                        <label class="form-label">Select Modules:</label>
                        <div class="legend">
                            <span class="legend-item">
                                <span class="status-indicator active"></span> ACTIVE
                            </span>
                            <span class="legend-item">
                                <span class="status-indicator inactive"></span> INACTIVE
                            </span>
                            <span class="legend-item">
                                <span class="status-indicator core"></span> CORE
                            </span>
                            <p class="legend-help">Active modules are pre-selected. Use "Select Active Only" for common exports.</p>
                        </div>
                        <div class="module-list" id="module-checkboxes"></div>
                        <div class="module-actions">
                            <button type="button" id="select-active-modules" class="btn btn-small btn-success">Select Active Only</button>
                            <button type="button" id="select-all-modules" class="btn btn-small">Select All</button>
                            <button type="button" id="deselect-all-modules" class="btn btn-small">Deselect All</button>
                        </div>
                    </div>

                    <div class="export-actions">
                        <button type="button" id="download-json" class="btn btn-warning">
                            <i class="fas fa-save"></i> Download as File
                        </button>
                        <button type="button" id="copy-clipboard" class="btn btn-info">
                            <i class="fas fa-copy"></i> Copy to Clipboard
                        </button>
                    </div>

                    <div id="export-results" class="results-area hidden">
                        <label class="form-label">Exported JSON:</label>
                        <textarea id="export-json" class="json-output" readonly></textarea>
                    </div>
                </div>

                <!-- Import Section -->
                <div id="import-section" class="section hidden">
                    <h3 class="section-title">Import Settings</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Import Method:</label>
                        <select id="import-method" class="form-select">
                            ${context.importMethods.map(method => 
                                `<option value="${method.value}">${method.label}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div id="file-upload" class="form-group">
                        <label class="form-label">Select File:</label>
                        <input type="file" id="import-file" accept=".json" class="file-input">
                    </div>

                    <div id="paste-area" class="form-group hidden">
                        <label class="form-label">Paste JSON:</label>
                        <textarea id="import-json" class="json-input" placeholder="Paste your exported JSON here..."></textarea>
                    </div>

                    <button type="button" id="process-import" class="btn btn-danger">
                        <i class="fas fa-exclamation-triangle"></i> Import Settings (This will overwrite current settings!)
                    </button>

                    <div id="import-results" class="results-area hidden"></div>
                </div>

                <!-- Warning -->
                <div class="warning-box">
                    <strong>⚠️ Important:</strong> Always backup your current settings before importing new ones. 
                    Settings changes may require a page refresh to take full effect.
                    <br><strong>Note:</strong> World settings require GM permissions to export/import.
                    <br><strong>Filtering:</strong> Only settings from active modules and registered settings are shown to prevent errors.
                </div>
            </form>

            <style>
                .settings-manager {
                    font-family: var(--font-primary);
                }

                .settings-manager-form {
                    height: 100%;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    background: var(--color-bg);
                    color: var(--color-text-primary);
                }

                .header-section {
                    text-align: center;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 12px;
                    margin-bottom: 8px;
                }

                .header-section h2 {
                    margin: 0 0 6px 0;
                    color: var(--color-text-primary);
                    font-size: 20px;
                }

                .subtitle {
                    margin: 0;
                    font-size: 13px;
                    color: var(--color-text-dark-secondary);
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .form-label {
                    font-weight: bold;
                    color: var(--color-text-primary);
                    font-size: 14px;
                    margin-bottom: 4px;
                }

                /* Form elements - working dropdown styles */
                .form-select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--color-text-secondary);
                    border-radius: 4px;
                    color: var(--color-text-primary);
                    font-size: 1.1em;
                    height: auto;
                    min-height: 36px;
                    /* No background property - let browser handle naturally */
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

                .json-output, .json-input {
                    width: 100%;
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

                .form-select:focus, .file-input:focus, .json-output:focus, .json-input:focus {
                    border-color: var(--color-border-highlight);
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(73, 144, 226, 0.2);
                }

                .help-text {
                    font-size: 12px;
                    color: var(--color-text-dark-secondary);
                    background: var(--color-bg-option);
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid var(--color-border);
                    margin-top: 4px;
                    line-height: 1.4;
                }

                .action-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 16px 0;
                }

                .btn {
                    padding: 10px 16px;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    background: var(--color-bg);
                    color: var(--color-text-primary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    min-height: 40px;
                }

                .btn:hover {
                    background: var(--color-bg-option);
                    border-color: var(--color-border-highlight);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

                .btn-small {
                    padding: 6px 10px;
                    font-size: 11px;
                    min-height: 32px;
                }

                .section {
                    border: 1px solid var(--color-border);
                    border-radius: 6px;
                    padding: 16px;
                    background: var(--color-bg-option);
                    margin: 12px 0;
                }

                .section-title {
                    margin: 0 0 16px 0;
                    color: var(--color-text-primary);
                    font-size: 18px;
                    font-weight: bold;
                }

                .hidden {
                    display: none !important;
                }

                .legend {
                    margin-bottom: 15px;
                    font-size: 11px;
                    color: var(--color-text-dark-secondary);
                }

                .legend-item {
                    display: inline-flex;
                    align-items: center;
                    margin-right: 16px;
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 4px;
                }

                .status-indicator.active {
                    background: #51cf66;
                }

                .status-indicator.inactive {
                    background: #ff6b6b;
                }

                .status-indicator.core {
                    background: #339af0;
                }

                .legend-help {
                    margin: 4px 0 0 0;
                    font-style: italic;
                }

                .module-list {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid var(--color-border);
                    padding: 10px;
                    background: var(--color-bg);
                    border-radius: 4px;
                    margin-bottom: 10px;
                }

                .module-item {
                    display: flex;
                    align-items: center;
                    padding: 6px;
                    margin: 3px 0;
                    border-radius: 3px;
                    cursor: pointer;
                }

                .module-item:hover {
                    background: var(--color-bg-option);
                }

                .module-checkbox {
                    margin-right: 8px;
                }

                .module-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .module-name {
                    font-weight: bold;
                    color: var(--color-text-primary);
                }

                .module-details {
                    font-size: 10px;
                    color: var(--color-text-dark-secondary);
                }

                .module-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                    flex-wrap: wrap;
                }

                .export-actions {
                    display: flex;
                    gap: 12px;
                    margin: 16px 0;
                }

                .export-actions .btn {
                    flex: 1;
                }

                .results-area {
                    margin-top: 16px;
                }



                .warning-box {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    padding: 10px;
                    font-size: 12px;
                    color: #856404;
                    margin-top: auto;
                }
            </style>
        `;
    }

    // CRITICAL: This method was missing in previous attempts!
    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        const exportBtn = this.element.querySelector('#export-btn');
        const importBtn = this.element.querySelector('#import-btn');
        const exportSection = this.element.querySelector('#export-section');
        const importSection = this.element.querySelector('#import-section');
        const exportType = this.element.querySelector('#export-type');
        const moduleSelector = this.element.querySelector('#module-selector');
        const importMethod = this.element.querySelector('#import-method');
        const fileUpload = this.element.querySelector('#file-upload');
        const pasteArea = this.element.querySelector('#paste-area');
        const settingsScope = this.element.querySelector('#settings-scope');

        // Toggle sections
        exportBtn.addEventListener('click', () => {
            this.toggleSection(exportSection, importSection);
            if (!exportSection.classList.contains('hidden')) {
                this.populateModuleSelector();
            }
        });

        importBtn.addEventListener('click', () => {
            this.toggleSection(importSection, exportSection);
        });

        // Export type change
        exportType.addEventListener('change', () => {
            if (exportType.value === 'selective') {
                moduleSelector.classList.remove('hidden');
                this.populateModuleSelector();
            } else {
                moduleSelector.classList.add('hidden');
            }
        });

        // Import method change
        importMethod.addEventListener('change', () => {
            if (importMethod.value === 'file') {
                fileUpload.classList.remove('hidden');
                pasteArea.classList.add('hidden');
            } else {
                fileUpload.classList.add('hidden');
                pasteArea.classList.remove('hidden');
            }
        });

        // Settings scope change
        settingsScope.addEventListener('change', () => {
            if (!moduleSelector.classList.contains('hidden')) {
                this.populateModuleSelector();
            }
        });

        // Export actions
        this.element.querySelector('#download-json')?.addEventListener('click', () => this.downloadSettings());
        this.element.querySelector('#copy-clipboard')?.addEventListener('click', () => this.copySettingsToClipboard());

        // Import action
        this.element.querySelector('#process-import')?.addEventListener('click', () => this.processImport());

        // Module selector actions
        this.element.querySelector('#select-active-modules')?.addEventListener('click', () => this.selectActiveModules());
        this.element.querySelector('#select-all-modules')?.addEventListener('click', () => this.selectAllModules());
        this.element.querySelector('#deselect-all-modules')?.addEventListener('click', () => this.deselectAllModules());
    }

    toggleSection(showSection, hideSection) {
        showSection.classList.toggle('hidden');
        hideSection.classList.add('hidden');
    }

    getAllSettings(scope = "client") {
        try {
            // Check permissions for world settings
            if ((scope === "world" || scope === "both") && !game.user.isGM) {
                if (scope === "world") {
                    throw new Error("Only GMs can access world settings");
                }
                // For "both" scope, fall back to client only if not GM
                scope = "client";
                ui.notifications.warn("World settings require GM permissions. Showing client settings only.");
            }
            
            const allSettings = {};
            const scopes = scope === "both" ? ["client", "world"] : [scope];
            
            for (const currentScope of scopes) {
                const storage = game.settings.storage.get(currentScope);
                const scopeSettings = {};
                
                if (currentScope === "client") {
                    // Client storage uses localStorage API
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        const value = storage.getItem(key);
                        
                        // Try to parse the value as JSON (settings are usually stored as JSON strings)
                        try {
                            scopeSettings[key] = JSON.parse(value);
                        } catch (e) {
                            // If it's not JSON, store as is
                            scopeSettings[key] = value;
                        }
                    }
                } else if (currentScope === "world") {
                    // World storage is a Collection of Setting documents
                    for (const setting of storage.contents) {
                        const key = `${setting.namespace}.${setting.key}`;
                        scopeSettings[key] = setting.value;
                    }
                }
                
                // Add scope prefix to avoid conflicts when scope is "both"
                if (scope === "both") {
                    for (const [key, value] of Object.entries(scopeSettings)) {
                        allSettings[`${currentScope}:${key}`] = value;
                    }
                } else {
                    Object.assign(allSettings, scopeSettings);
                }
            }
            
            return allSettings;
        } catch (error) {
            console.error("Error getting all settings:", error);
            throw error;
        }
    }

    populateModuleSelector() {
        try {
            const scope = this.element.querySelector('#settings-scope').value;
            const allSettings = this.getAllSettings(scope);
            const moduleCheckboxes = this.element.querySelector('#module-checkboxes');
            
            // Group settings by namespace (module)
            const settingsByModule = {};
            for (const [key, value] of Object.entries(allSettings)) {
                // Handle scope prefixes when scope is "both"
                let actualKey = key;
                let scopePrefix = "";
                
                if (scope === "both" && (key.startsWith("client:") || key.startsWith("world:"))) {
                    const parts = key.split(":", 2);
                    scopePrefix = parts[0];
                    actualKey = parts[1];
                }
                
                const namespace = actualKey.split('.')[0];
                const moduleKey = scope === "both" ? `${scopePrefix}:${namespace}` : namespace;
                
                if (!settingsByModule[moduleKey]) {
                    settingsByModule[moduleKey] = {};
                }
                settingsByModule[moduleKey][key] = value;
            }
            
            // Create module items
            const moduleItems = Object.keys(settingsByModule).sort().map(moduleKey => {
                const count = Object.keys(settingsByModule[moduleKey]).length;
                
                let displayName = moduleKey;
                let scopeInfo = "";
                let moduleStatus = "";
                let statusClass = "";
                
                // Handle scope prefixes
                if (scope === "both") {
                    if (moduleKey.startsWith("client:")) {
                        displayName = moduleKey.substring(7);
                        scopeInfo = ' (Client)';
                    } else if (moduleKey.startsWith("world:")) {
                        displayName = moduleKey.substring(6);
                        scopeInfo = ' (World)';
                    }
                }
                
                // Check module status
                if (displayName !== 'core') {
                    const module = game.modules.get(displayName);
                    if (!module) {
                        moduleStatus = ' - Not Found';
                        statusClass = 'inactive';
                    } else if (!module.active) {
                        moduleStatus = ' - Inactive';
                        statusClass = 'inactive';
                    } else {
                        moduleStatus = ' - Active';
                        statusClass = 'active';
                    }
                } else {
                    moduleStatus = ' - Core';
                    statusClass = 'core';
                }
                
                // Determine if pre-selected
                const isChecked = displayName === 'core' || (game.modules.get(displayName)?.active);
                
                return `
                    <div class="module-item">
                        <input type="checkbox" class="module-checkbox" name="modules" value="${moduleKey}" ${isChecked ? 'checked' : ''}>
                        <div class="module-info">
                            <div class="module-name">
                                <span class="status-indicator ${statusClass}"></span>
                                ${displayName}${scopeInfo}
                            </div>
                            <div class="module-details">${count} settings${moduleStatus}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            moduleCheckboxes.innerHTML = moduleItems;
            
            // Add click handlers for module items
            moduleCheckboxes.querySelectorAll('.module-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        const checkbox = item.querySelector('.module-checkbox');
                        checkbox.checked = !checkbox.checked;
                    }
                });
            });
            
        } catch (error) {
            console.error("Error populating module selector:", error);
            this.element.querySelector('#module-checkboxes').innerHTML = '<p style="color: #F44336;">Error loading modules</p>';
        }
    }

    selectActiveModules() {
        this.element.querySelectorAll('.module-checkbox').forEach(checkbox => {
            const moduleKey = checkbox.value;
            let moduleName = moduleKey;
            
            // Handle scope prefixes
            if (moduleKey.includes(':')) {
                moduleName = moduleKey.split(':')[1];
            }
            
            // Check if it's core or an active module
            if (moduleName === 'core') {
                checkbox.checked = true;
            } else {
                const module = game.modules.get(moduleName);
                checkbox.checked = module && module.active;
            }
        });
    }

    selectAllModules() {
        this.element.querySelectorAll('.module-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    deselectAllModules() {
        this.element.querySelectorAll('.module-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    async generateExportData() {
        const scope = this.element.querySelector('#settings-scope').value;
        const allSettings = this.getAllSettings(scope);
        const exportType = this.element.querySelector('#export-type').value;
        
        let settingsToExport = allSettings;
        let selectedModules = [];
        
        if (exportType === 'selective') {
            const checkedModules = Array.from(this.element.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
            selectedModules = checkedModules;
            
            settingsToExport = {};
            for (const [key, value] of Object.entries(allSettings)) {
                // Handle scope prefixes when scope is "both"
                let actualKey = key;
                let scopePrefix = "";
                
                if (scope === "both" && (key.startsWith("client:") || key.startsWith("world:"))) {
                    const parts = key.split(":", 2);
                    scopePrefix = parts[0];
                    actualKey = parts[1];
                }
                
                const namespace = actualKey.split('.')[0];
                const moduleKey = scope === "both" ? `${scopePrefix}:${namespace}` : namespace;
                
                if (checkedModules.includes(moduleKey)) {
                    settingsToExport[key] = value;
                }
            }
        }
        
        return {
            version: "2.1",
            timestamp: new Date().toISOString(),
            foundryVersion: game.version,
            user: game.user.name,
            scope: scope,
            exportType: exportType,
            selectedModules: selectedModules,
            settingsCount: Object.keys(settingsToExport).length,
            settings: settingsToExport
        };
    }

    async downloadSettings() {
        try {
            const exportData = await this.generateExportData();
            
            // Create and download file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const scope = this.element.querySelector('#settings-scope').value;
            const scopeSuffix = scope === "both" ? "all" : scope;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `foundry-${scopeSuffix}-settings-${game.user.name}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show in results area
            const resultsArea = this.element.querySelector('#export-results');
            const jsonOutput = this.element.querySelector('#export-json');
            resultsArea.classList.remove('hidden');
            jsonOutput.value = jsonString;
            
            ui.notifications.info(`Downloaded ${exportData.settingsCount} ${scopeSuffix} settings!`);
            
        } catch (error) {
            console.error("Error downloading settings:", error);
            ui.notifications.error("Failed to download settings.");
        }
    }

    async copySettingsToClipboard() {
        try {
            const exportData = await this.generateExportData();
            const jsonString = JSON.stringify(exportData, null, 2);
            
            await navigator.clipboard.writeText(jsonString);
            
            // Show in results area
            const resultsArea = this.element.querySelector('#export-results');
            const jsonOutput = this.element.querySelector('#export-json');
            resultsArea.classList.remove('hidden');
            jsonOutput.value = jsonString;
            
            const scope = this.element.querySelector('#settings-scope').value;
            const scopeSuffix = scope === "both" ? "all" : scope;
            
            ui.notifications.info(`Copied ${exportData.settingsCount} ${scopeSuffix} settings to clipboard!`);
            
        } catch (error) {
            console.error("Error copying to clipboard:", error);
            ui.notifications.error("Failed to copy to clipboard.");
        }
    }

    async processImport() {
        try {
            const importMethod = this.element.querySelector('#import-method').value;
            let jsonData = null;
            
            if (importMethod === 'file') {
                const fileInput = this.element.querySelector('#import-file');
                if (!fileInput.files.length) {
                    throw new Error("Please select a file to import.");
                }
                
                const file = fileInput.files[0];
                const text = await file.text();
                jsonData = JSON.parse(text);
            } else {
                const textInput = this.element.querySelector('#import-json').value.trim();
                if (!textInput) {
                    throw new Error("Please paste JSON data to import.");
                }
                jsonData = JSON.parse(textInput);
            }
            
            // Validate JSON structure
            if (!jsonData.settings || typeof jsonData.settings !== 'object') {
                throw new Error("Invalid JSON format - missing 'settings' object");
            }
            
            // Analyze the import data
            const importScope = jsonData.scope || "client";
            const settingsCount = Object.keys(jsonData.settings).length;
            
            let scopeAnalysis = "";
            if (importScope === "both") {
                const clientCount = Object.keys(jsonData.settings).filter(k => k.startsWith("client:")).length;
                const worldCount = Object.keys(jsonData.settings).filter(k => k.startsWith("world:")).length;
                scopeAnalysis = `<br>📱 Client Settings: ${clientCount}<br>🌍 World Settings: ${worldCount}`;
            } else {
                scopeAnalysis = `<br>📍 Scope: ${importScope.charAt(0).toUpperCase() + importScope.slice(1)} Settings`;
            }
            
            // Show confirmation
            const proceed = await Dialog.confirm({
                title: "Confirm Import",
                content: `
                    <div style="margin-bottom: 15px;">
                        <strong>Ready to import ${settingsCount} settings</strong>${scopeAnalysis}
                    </div>
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 3px; margin: 10px 0; font-size: 12px;">
                        <strong>Import Info:</strong><br>
                        Version: ${jsonData.version || 'Unknown'}<br>
                        Date: ${jsonData.timestamp ? new Date(jsonData.timestamp).toLocaleString() : 'Unknown'}<br>
                        User: ${jsonData.user || 'Unknown'}<br>
                        Foundry: ${jsonData.foundryVersion || 'Unknown'}
                    </div>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 3px; font-size: 12px;">
                        <strong>⚠️ Warning:</strong> This will overwrite ${settingsCount} of your current settings!
                        ${importScope === "world" || importScope === "both" ? "<br><strong>Note:</strong> World settings require GM permissions." : ""}
                    </div>
                    <p>Continue with import?</p>
                `,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });
            
            if (!proceed) return;
            
            // Apply settings
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const errors = [];
            
            for (const [key, value] of Object.entries(jsonData.settings)) {
                try {
                    let actualKey = key;
                    let targetScope = importScope;
                    
                    // Handle scope prefixes when import scope is "both"
                    if (importScope === "both" && (key.startsWith("client:") || key.startsWith("world:"))) {
                        const parts = key.split(":", 2);
                        targetScope = parts[0];
                        actualKey = parts[1];
                    } else if (importScope === "both") {
                        // If no scope prefix and import scope is "both", default to client
                        targetScope = "client";
                    }
                    
                    // Check if setting is valid before attempting to import
                    if (!isSettingValid(actualKey)) {
                        const namespace = actualKey.split('.')[0];
                        const module = game.modules.get(namespace);
                        
                        if (namespace !== 'core' && (!module || !module.active)) {
                            console.warn(`Skipping setting from inactive module: ${actualKey}`);
                        } else {
                            console.warn(`Skipping unregistered setting: ${actualKey}`);
                        }
                        skippedCount++;
                        continue;
                    }
                    
                    const parts = actualKey.split('.');
                    if (parts.length >= 2) {
                        const namespace = parts[0];
                        const settingKey = parts.slice(1).join('.');
                        
                        // Use the appropriate API based on target scope
                        if (targetScope === "world") {
                            // For world settings, we need to check if the user has permission
                            if (!game.user.isGM) {
                                throw new Error("Only GMs can import world settings");
                            }
                        }
                        
                        // Use the standard settings API which will route to correct storage
                        await game.settings.set(namespace, settingKey, value);
                        successCount++;
                    } else {
                        console.warn(`Skipping invalid setting key: ${key}`);
                        skippedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to import setting ${key}:`, error);
                    errors.push(`${key}: ${error.message}`);
                    errorCount++;
                }
            }
            
            // Show results
            const resultsHtml = `
                <div style="color: #155724; background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 3px;">
                    <strong>Import completed!</strong><br>
                    ✅ Successfully imported: ${successCount} settings<br>
                    ${skippedCount > 0 ? `⏭️ Skipped (inactive/unregistered): ${skippedCount} settings<br>` : ''}
                    ${errorCount > 0 ? `❌ Failed to import: ${errorCount} settings<br>` : ''}
                    ${errors.length > 0 ? `<details style="margin-top: 5px;"><summary>View errors (${errors.length})</summary><pre style="font-size: 10px; max-height: 100px; overflow-y: auto; margin: 5px 0;">${errors.join('\n')}</pre></details>` : ''}
                </div>
            `;
            
            const resultsArea = this.element.querySelector('#import-results');
            resultsArea.innerHTML = resultsHtml;
            resultsArea.classList.remove('hidden');
            
            ui.notifications.info(`Import completed: ${successCount} imported, ${skippedCount} skipped, ${errorCount} failed`);
            
            // Offer to reload
            if (successCount > 0) {
                setTimeout(async () => {
                    const shouldReload = await Dialog.confirm({
                        title: "Reload Page?",
                        content: "<p>Settings have been imported. Some changes may require a page reload to take effect. Reload now?</p>",
                        yes: () => true,
                        no: () => false,
                        defaultYes: false
                    });
                    
                    if (shouldReload) {
                        window.location.reload();
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.error("Error importing settings:", error);
            const errorHtml = `
                <div style="color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 3px;">
                    <strong>Import failed:</strong> ${error.message}
                </div>
            `;
            const resultsArea = this.element.querySelector('#import-results');
            resultsArea.innerHTML = errorHtml;
            resultsArea.classList.remove('hidden');
            ui.notifications.error(`Import failed: ${error.message}`);
        }
    }
}

// Execute the macro
async function showSettingsManagerV2() {
    try {
        // Check if already running and close
        if (game.settingsManagerApp?.rendered) {
            game.settingsManagerApp.close();
        }

        // Create and render the ApplicationV2
        game.settingsManagerApp = new SettingsManagerApp();
        game.settingsManagerApp.render(true);

    } catch (error) {
        console.error("Error creating Settings Manager:", error);
        ui.notifications.error("Failed to open Settings Manager. Check console for details.");
    }
}

// Show the Settings Manager
showSettingsManagerV2();