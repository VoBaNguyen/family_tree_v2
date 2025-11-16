/**
 * Family Tree API Client
 * Handles all communication with the backend API
 */
class FamilyTreeAPI {
  constructor(baseURL = ' https://family-tree-v2.onrender.com/api') {
    this.baseURL = baseURL;
    this.isOnline = true;
    this.setupOfflineDetection();
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 API: Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 API: Offline mode');
    });
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Get all trees
  async getTrees() {
    return this.request('/trees');
  }

  // Get specific tree
  async getTree(treeId) {
    return this.request(`/trees/${treeId}`);
  }

  // Save tree (create or update)
  async saveTree(treeId, familyData, metadata = {}) {
    return this.request(`/trees/${treeId}`, {
      method: 'POST',
      body: JSON.stringify({
        familyData,
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });
  }

  // Delete tree
  async deleteTree(treeId) {
    return this.request(`/trees/${treeId}`, {
      method: 'DELETE'
    });
  }

  // Get backups
  async getBackups(treeId) {
    return this.request(`/trees/${treeId}/backups`);
  }

  // Restore from backup
  async restoreBackup(treeId, backupFilename) {
    return this.request(`/trees/${treeId}/restore/${backupFilename}`, {
      method: 'POST'
    });
  }

  // Health check
  async health() {
    return this.request('/health');
  }
}

/**
 * Auto-save manager for Family Tree
 * Handles automatic saving with debouncing and error recovery
 */
class AutoSaveManager {
  constructor(api, treeId, options = {}) {
    this.api = api;
    this.treeId = treeId;
    this.saveDelay = options.saveDelay || 2000; // 2 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000; // 5 seconds
    
    this.saveTimeout = null;
    this.isSaving = false;
    this.pendingData = null;
    this.lastSaveTime = null;
    this.saveCount = 0;
    
    this.setupUI();
  }

  setupUI() {
    // Create save status indicator
    const indicator = document.createElement('div');
    indicator.id = 'save-status';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      transition: all 0.3s ease;
      opacity: 0;
      pointer-events: none;
    `;
    document.body.appendChild(indicator);
    this.statusIndicator = indicator;
  }

  showStatus(message, type = 'info') {
    const colors = {
      saving: { bg: '#3498db', color: '#fff' },
      saved: { bg: '#2ecc71', color: '#fff' },
      error: { bg: '#e74c3c', color: '#fff' },
      info: { bg: '#95a5a6', color: '#fff' }
    };

    const style = colors[type] || colors.info;
    
    this.statusIndicator.textContent = message;
    this.statusIndicator.style.backgroundColor = style.bg;
    this.statusIndicator.style.color = style.color;
    this.statusIndicator.style.opacity = '1';

    if (type === 'saved') {
      setTimeout(() => {
        this.statusIndicator.style.opacity = '0';
      }, 2000);
    }
  }

  // Queue data for saving with debouncing
  queueSave(familyData, metadata = {}) {
    this.pendingData = { familyData, metadata };
    
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout
    this.saveTimeout = setTimeout(() => {
      this.executeSave();
    }, this.saveDelay);

    this.showStatus('Changes detected...', 'info');
  }

  // Execute the actual save operation
  async executeSave(retryCount = 0) {
    if (this.isSaving || !this.pendingData) {
      return;
    }

    this.isSaving = true;
    this.showStatus('Saving...', 'saving');

    try {
      const { familyData, metadata } = this.pendingData;
      
      await this.api.saveTree(this.treeId, familyData, {
        ...metadata,
        saveCount: ++this.saveCount,
        autoSave: true
      });

      this.lastSaveTime = new Date();
      this.pendingData = null;
      this.showStatus('Saved successfully', 'saved');
      
      console.log(`✓ Auto-saved ${this.treeId} at ${this.lastSaveTime.toLocaleTimeString()}`);

    } catch (error) {
      console.error('Save failed:', error);
      
      if (retryCount < this.maxRetries) {
        this.showStatus(`Save failed, retrying... (${retryCount + 1}/${this.maxRetries})`, 'error');
        
        setTimeout(() => {
          this.executeSave(retryCount + 1);
        }, this.retryDelay);
        
        return;
      } else {
        this.showStatus('Save failed - check connection', 'error');
      }
    } finally {
      this.isSaving = false;
    }
  }

  // Force immediate save
  async forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.pendingData) {
      await this.executeSave();
    }
  }

  // Get save status info
  getStatus() {
    return {
      isSaving: this.isSaving,
      hasPendingChanges: !!this.pendingData,
      lastSaveTime: this.lastSaveTime,
      saveCount: this.saveCount
    };
  }
}

// Export for use in other files
window.FamilyTreeAPI = FamilyTreeAPI;
window.AutoSaveManager = AutoSaveManager;
