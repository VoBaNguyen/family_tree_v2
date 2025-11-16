/**
 * Family Tree Shared Module
 * Contains common functionality for family tree pages
 */

export class FamilyTreeManager {
  constructor(treeId, familyData, treeAPI) {
    this.treeId = treeId;
    this.familyData = familyData;
    this.treeAPI = treeAPI;
    this.f3Chart = null;
    this.f3EditTree = null;
  }

  // Update connection status indicator
  updateConnectionStatus(isConnected) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      if (isConnected) {
        statusEl.textContent = '🟢 Connected';
        statusEl.className = 'status-indicator status-online';
      } else {
        statusEl.textContent = '🔴 Offline';
        statusEl.className = 'status-indicator status-offline';
      }
    }
  }

  // Show backup modal
  showBackupModal(backups) {
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      color: #333;
    `;

    let backupHTML = '<h3>Available Backups</h3>';
    
    if (backups.length === 0) {
      backupHTML += '<p>No backups available.</p>';
    } else {
      backupHTML += '<div style="margin-bottom: 16px;">';
      backups.forEach(backup => {
        backupHTML += `
          <div style="padding: 8px; border: 1px solid #ddd; margin: 4px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span>${backup.humanDate}</span>
            <button onclick="window.familyTreeManager.restoreBackup('${backup.filename}')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Restore</button>
          </div>
        `;
      });
      backupHTML += '</div>';
    }

    backupHTML += '<button onclick="window.familyTreeManager.closeModal()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>';

    modalContent.innerHTML = backupHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    this.currentModal = modal;

    // Add close handler for clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  // Close modal
  closeModal() {
    if (this.currentModal) {
      document.body.removeChild(this.currentModal);
      this.currentModal = null;
    }
  }

  // Restore backup
  async restoreBackup(filename) {
    try {
      const result = await this.treeAPI.restoreFromBackup(this.treeId, filename);
      console.log('Backup restored:', result);
      
      // Reload the page to show restored data
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('Failed to restore backup: ' + error.message);
    }
  }

  // Setup event handlers
  setupEventHandlers(treeType) {
    // Set up manual save button
    const saveBtn = document.getElementById('manual-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          const result = await this.treeAPI.manualSave(this.treeId, this.f3EditTree, {
            treeType: treeType,
            lastEdit: new Date().toISOString()
          });
          console.log('Manual save successful:', result);
        } catch (error) {
          console.error('Manual save failed:', error);
          alert('Save failed: ' + error.message);
        }
      });
    }

    // Set up backup management
    const backupBtn = document.getElementById('load-backup-btn');
    if (backupBtn) {
      backupBtn.addEventListener('click', async () => {
        try {
          const backups = await this.treeAPI.getBackups(this.treeId);
          this.showBackupModal(backups.backups);
        } catch (error) {
          console.error('Failed to load backups:', error);
          alert('Failed to load backups: ' + error.message);
        }
      });
    }
  }

  // Initialize the family tree
  async initializeTree(f3, mainPersonId = "1") {
    try {
      // Update connection status initially
      this.updateConnectionStatus(await this.treeAPI.checkConnection());
      
      // If familyData is empty, try to load initial data from backend
      if (!this.familyData || this.familyData.length === 0) {
        try {
          const response = await fetch(`http://localhost:3001/api/initial/${this.treeId}`);
          if (response.ok) {
            this.familyData = await response.json();
            console.log(`📥 Loaded initial ${this.treeId} data with ${this.familyData.length} people`);
          }
        } catch (error) {
          console.warn('Failed to load initial data from server:', error);
        }
      }
      
      // Create the family chart
      this.f3Chart = f3.createChart('#FamilyChart', this.familyData)
        .setTransitionTime(500)
        .setCardXSpacing(180)
        .setCardYSpacing(100);

      // Configure the cards
      const f3Card = this.f3Chart.setCardHtml()
        .setCardDisplay([["first name", "last name"]]);

      // Enable editing
      this.f3EditTree = this.f3Chart.editTree()
        .setFields(["first name", "last name", "avatar", "birthday", "note"])
        .setEditFirst(true)
        .setCardClickOpen(f3Card);

      // Try to load data from server
      try {
        await this.treeAPI.loadAndInitialize(this.treeId, this.f3Chart);
      } catch (error) {
        console.warn('Failed to load from server, using local data:', error);
        this.f3Chart.setData(this.familyData);
        this.f3Chart.updateTree({ initial: true, main_id: mainPersonId });
      }

      // Enable auto-save
      this.treeAPI.enableAutoSave(this.treeId, this.f3EditTree, {
        onSave: (result) => {
          console.log('✓ Tree auto-saved:', result);
          this.updateConnectionStatus(true);
        },
        onError: (error) => {
          console.error('❌ Auto-save failed:', error);
          this.updateConnectionStatus(false);
        }
      });

      // Store references globally for debugging
      window.f3Chart = this.f3Chart;
      window.f3EditTree = this.f3EditTree;
      window.familyTreeManager = this;
      
      console.log('✓ Family tree with persistence enabled!');
      
      return { chart: this.f3Chart, editTree: this.f3EditTree };
      
    } catch (error) {
      console.error('Failed to initialize tree:', error);
      throw error;
    }
  }
}

// CSS styles for tree pages
export const TREE_STYLES = `
  body { 
    font-family: 'Arial', sans-serif; 
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
  }
  h1 {
    text-align: center;
    color: #333;
  }
  .nav-container {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
  }
  .back-button {
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }
  .back-button:hover {
    transform: translateY(-2px);
  }
  .save-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    margin: 0 5px;
    transition: all 0.3s ease;
  }
  .save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  .status-indicator {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    margin-left: 10px;
  }
  .status-online {
    background: #10b981;
    color: white;
  }
  .status-offline {
    background: #ef4444;
    color: white;
  }
`;

// Theme-specific styles
export const THEME_STYLES = {
  bana: `
    .back-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .back-button:hover {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }
  `,
  mena: `
    .back-button {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
    }
    .back-button:hover {
      box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
      background: linear-gradient(135deg, #ee82f0 0%, #f3455a 100%);
    }
  `
};

// Utility function to create a complete tree page
export function createTreePageHTML(config) {
  const { treeId, title, theme, familyData } = config;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://unpkg.com/d3@7"></script>
  <script src="../js/family-tree-api.js"></script>
  <link rel="stylesheet" href="../src/styles/family-chart.css">
  <style>
    ${TREE_STYLES}
    ${THEME_STYLES[theme] || ''}
  </style>
</head>
<body>
  <div class="nav-container">
    <a href="../index.html" class="back-button">
      ← Trở về trang chính
    </a>
  </div>
  <h1>${title}</h1>
  <div class="save-controls" style="text-align: center; margin-bottom: 10px;">
    <button id="manual-save-btn" class="save-btn">💾 Save</button>
    <button id="load-backup-btn" class="save-btn">📄 Backups</button>
    <span id="connection-status" class="status-indicator"></span>
  </div>
  <div id="FamilyChart" class="f3" style="width:100%;height:800px;margin:auto;background-color:rgb(33,33,33);color:#fff;border-radius:8px;"></div>

<script type="module">
import f3 from '../src/index.js'
import FamilyTreeAPI from '../js/persistence-api.js'
import { FamilyTreeManager } from '../js/family-tree-shared.js'

const TREE_ID = '${treeId}';
const treeAPI = new FamilyTreeAPI();

// Family tree data
let familyData = ${JSON.stringify(familyData, null, 2)};

// Initialize tree manager
const manager = new FamilyTreeManager(TREE_ID, familyData, treeAPI);

// Setup event handlers
manager.setupEventHandlers('${title}');

// Initialize the tree
manager.initializeTree(f3);

</script>
</body>
</html>
  `;
}

export default FamilyTreeManager;
