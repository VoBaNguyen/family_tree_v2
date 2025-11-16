/**
 * Family Tree Persistence API Client
 * Handles all communication with the backend API for saving/loading tree data
 */

class FamilyTreeAPI {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.autoSaveInterval = null;
    this.autoSaveDelay = 2000; // 2 seconds delay for auto-save
    this.isOnline = true;
    this.pendingChanges = false;
    
    // Check API connection on initialization
    this.checkConnection();
  }

  // Utility method for making API calls
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      this.isOnline = false;
      throw error;
    }
  }

  // Check if backend is available
  async checkConnection() {
    try {
      await this.apiCall('/health');
      this.isOnline = true;
      console.log('✓ Connected to Family Tree API');
      return true;
    } catch (error) {
      this.isOnline = false;
      console.warn('⚠ Family Tree API not available:', error.message);
      return false;
    }
  }

  // Get all available trees
  async getTrees() {
    return await this.apiCall('/trees');
  }

  // Load tree data
  async loadTree(treeId) {
    return await this.apiCall(`/trees/${treeId}`);
  }

  // Save tree data with backup
  async saveTree(treeId, data, metadata = {}) {
    return await this.apiCall(`/trees/${treeId}`, {
      method: 'POST',
      body: JSON.stringify({ data, metadata }),
    });
  }

  // Auto-save without backup (for frequent updates)
  async autoSaveTree(treeId, data) {
    return await this.apiCall(`/trees/${treeId}/autosave`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  // Get tree backups
  async getBackups(treeId) {
    return await this.apiCall(`/trees/${treeId}/backups`);
  }

  // Restore from backup
  async restoreFromBackup(treeId, backupFilename) {
    return await this.apiCall(`/trees/${treeId}/restore/${backupFilename}`, {
      method: 'POST',
    });
  }

  // Delete tree
  async deleteTree(treeId) {
    return await this.apiCall(`/trees/${treeId}`, {
      method: 'DELETE',
    });
  }

  // Enable auto-save for a tree
  enableAutoSave(treeId, f3EditTree, options = {}) {
    const { interval = this.autoSaveDelay, onSave, onError } = options;

    // Clear any existing auto-save
    this.disableAutoSave();

    let saveTimeout;

    // Set up auto-save on data changes
    const handleChange = () => {
      if (!this.isOnline) {
        console.warn('⚠ Auto-save disabled: API not available');
        return;
      }

      this.pendingChanges = true;

      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      saveTimeout = setTimeout(async () => {
        try {
          const treeData = f3EditTree.exportData();
          const result = await this.autoSaveTree(treeId, treeData);
          
          this.pendingChanges = false;
          console.log(`💾 Auto-saved ${treeId}:`, result);

          if (onSave) {
            onSave(result);
          }

          // Update UI to show save status
          this.showSaveStatus('Auto-saved', 'success');

        } catch (error) {
          console.error('❌ Auto-save failed:', error);
          
          if (onError) {
            onError(error);
          }

          this.showSaveStatus('Auto-save failed', 'error');
        }
      }, interval);
    };

    // Set up the onChange handler
    f3EditTree.setOnChange(handleChange);

    // Store reference for cleanup
    this.autoSaveHandler = handleChange;
    this.autoSaveTreeId = treeId;

    console.log(`🔄 Auto-save enabled for ${treeId}`);
  }

  // Disable auto-save
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.autoSaveHandler = null;
    this.autoSaveTreeId = null;
    console.log('🔄 Auto-save disabled');
  }

  // Manual save with backup
  async manualSave(treeId, f3EditTree, metadata = {}) {
    if (!this.isOnline) {
      throw new Error('Cannot save: API not available');
    }

    try {
      const treeData = f3EditTree.exportData();
      const result = await this.saveTree(treeId, treeData, metadata);
      
      this.pendingChanges = false;
      console.log(`💾 Manually saved ${treeId}:`, result);
      
      this.showSaveStatus('Saved successfully', 'success');
      return result;

    } catch (error) {
      console.error('❌ Manual save failed:', error);
      this.showSaveStatus('Save failed', 'error');
      throw error;
    }
  }

  // Load tree and initialize family chart
  async loadAndInitialize(treeId, f3Chart, options = {}) {
    try {
      const response = await this.loadTree(treeId);
      
      if (response.data && response.data.length > 0) {
        // Load existing data
        console.log(`📖 Loaded ${treeId} with ${response.data.length} people`);
        
        // Update the chart data
        f3Chart.setData(response.data);
        f3Chart.updateTree({ initial: true });
        
        this.showSaveStatus('Tree loaded', 'success');
      } else {
        console.log(`📄 ${treeId} is empty or new`);
        this.showSaveStatus('New tree created', 'info');
      }

      return response;

    } catch (error) {
      console.error(`❌ Failed to load ${treeId}:`, error);
      this.showSaveStatus('Load failed', 'error');
      throw error;
    }
  }

  // Show save status in UI
  showSaveStatus(message, type = 'info') {
    // Create or update status element
    let statusEl = document.getElementById('tree-save-status');
    
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'tree-save-status';
      statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(statusEl);
    }

    // Set message and styling
    statusEl.textContent = message;
    
    const styles = {
      success: { background: '#10b981', color: 'white' },
      error: { background: '#ef4444', color: 'white' },
      info: { background: '#3b82f6', color: 'white' },
      warning: { background: '#f59e0b', color: 'white' }
    };

    const style = styles[type] || styles.info;
    statusEl.style.backgroundColor = style.background;
    statusEl.style.color = style.color;

    // Show and auto-hide
    statusEl.style.opacity = '1';
    
    setTimeout(() => {
      statusEl.style.opacity = '0';
    }, 3000);
  }

  // Get connection status
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingChanges: this.pendingChanges,
      autoSaveEnabled: !!this.autoSaveHandler,
      baseURL: this.baseURL
    };
  }
}

// Export for use in modules
export default FamilyTreeAPI;

// Also make available globally for non-module usage
window.FamilyTreeAPI = FamilyTreeAPI;
