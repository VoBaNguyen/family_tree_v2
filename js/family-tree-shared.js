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
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    modalContent.innerHTML = `
      <h2 style="margin: 0 0 16px 0; color: #333;">Tree Backups</h2>
      <div style="margin-bottom: 16px;">
        ${backups.map((backup, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
            <span style="font-size: 14px;">
              ${backup.filename} 
              <small style="color: #666;">(${backup.date})</small>
            </span>
            <button onclick="window.restoreBackup('${backup.filename}')" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
              Restore
            </button>
          </div>
        `).join('')}
      </div>
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Setup restore function
    window.restoreBackup = async (filename) => {
      try {
        const result = await this.treeAPI.restoreFromBackup(this.treeId, filename);
        if (result.success) {
          alert('Backup restored successfully! Refreshing page...');
          location.reload();
        } else {
          alert('Failed to restore backup: ' + result.error);
        }
      } catch (error) {
        alert('Error restoring backup: ' + error.message);
      }
      modal.remove();
    };

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Setup event handlers
  setupEventHandlers(familyName) {
    // Manual save button
    const manualSaveBtn = document.getElementById('manual-save-btn');
    if (manualSaveBtn) {
      manualSaveBtn.addEventListener('click', async () => {
        try {
          const data = this.f3EditTree.getData();
          const result = await this.treeAPI.saveTree(this.treeId, data, {
            familyName: familyName,
            savedAt: new Date().toISOString(),
            source: 'manual_save'
          });
          
          if (result.success) {
            console.log('✓ Manual save successful:', result);
            this.updateConnectionStatus(true);
            
            // Show success feedback
            manualSaveBtn.textContent = '✓ Saved';
            manualSaveBtn.style.background = '#28a745';
            setTimeout(() => {
              manualSaveBtn.textContent = '💾 Save';
              manualSaveBtn.style.background = '';
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Manual save failed:', error);
          this.updateConnectionStatus(false);
          
          // Show error feedback
          manualSaveBtn.textContent = '❌ Error';
          manualSaveBtn.style.background = '#dc3545';
          setTimeout(() => {
            manualSaveBtn.textContent = '💾 Save';
            manualSaveBtn.style.background = '';
          }, 3000);
        }
      });
    }

    // Load backup button
    const loadBackupBtn = document.getElementById('load-backup-btn');
    if (loadBackupBtn) {
      loadBackupBtn.addEventListener('click', async () => {
        try {
          const backups = await this.treeAPI.getBackups(this.treeId);
          if (backups.success && backups.backups.length > 0) {
            this.showBackupModal(backups.backups);
          } else {
            alert('No backups found for this tree.');
          }
        } catch (error) {
          console.error('❌ Failed to load backups:', error);
          alert('Failed to load backups: ' + error.message);
        }
      });
    }
  }

  async initializeTree(f3, mainPersonId = "1") {
    try {
      // Update connection status initially
      this.updateConnectionStatus(await this.treeAPI.checkConnection());
      
      // If familyData is empty, try to load initial data from backend
      if (!this.familyData || this.familyData.length === 0) {
        console.log(`🔍 familyData is empty for ${this.treeId}, attempting to load initial data...`);
        try {
          const response = await fetch(`http://localhost:3001/api/initial/${this.treeId}`);
          console.log(`📡 Initial data response status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            this.familyData = await response.json();
            console.log(`📥 Loaded initial ${this.treeId} data with ${this.familyData.length} people`);
            
            if (this.familyData.length === 0) {
              console.warn(`⚠️ Initial data loaded but array is empty for ${this.treeId}`);
            }
          } else {
            console.error(`❌ Initial data request failed: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.warn('Failed to load initial data from server:', error);
        }
      } else {
        console.log(`📋 ${this.treeId} already has ${this.familyData.length} people in familyData`);
      }
      
      // Create the family chart
      console.log('🔧 Creating f3Chart with:', { f3, familyDataLength: this.familyData?.length });
      
      try {
        this.f3Chart = f3.createChart('#FamilyChart', this.familyData)
          .setTransitionTime(500)
          .setCardXSpacing(180)
          .setCardYSpacing(100);
          
        console.log('✅ f3Chart created successfully:', this.f3Chart);
        console.log('📊 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.f3Chart)));
      } catch (chartError) {
        console.error('❌ Failed to create f3Chart:', chartError);
        throw new Error(`Failed to create family chart: ${chartError.message}`);
      }

      // Configure the cards
      const f3Card = this.f3Chart.setCardHtml()
        .setCardDisplay([["first name", "last name"]]);

      // Enable editing
      this.f3EditTree = this.f3Chart.editTree()
        .setFields(["first name", "last name", "avatar", "birthday", "note"])
        .setEditFirst(true)
        .setCardClickOpen(f3Card);

      // Try to load saved data from server (this might override initial data)
      try {
        console.log(`🔍 Attempting to load saved data for ${this.treeId}...`);
        const loadResult = await this.treeAPI.loadAndInitialize(this.treeId, this.f3Chart);
        console.log(`📊 Load result:`, loadResult);
        
        // If no saved data was found, use the initial data we loaded earlier
        if (!loadResult.data || loadResult.data.length === 0) {
          console.log(`📋 No saved data found for ${this.treeId}, checking initial data...`);
          if (this.familyData && this.familyData.length > 0) {
            console.log(`📊 Using initial data for ${this.treeId} (${this.familyData.length} people)`);
            
            // Use updateData instead of setData (correct API method)
            if (typeof this.f3Chart.updateData === 'function') {
              this.f3Chart.updateData(this.familyData);
              this.f3Chart.updateTree({ initial: true, main_id: mainPersonId });
            } else {
              console.error('❌ f3Chart.updateData is not a function. Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.f3Chart)));
              throw new Error('f3Chart does not have updateData method');
            }
          } else {
            console.error(`❌ No data available for ${this.treeId} - both saved and initial data are empty`);
          }
        } else {
          console.log(`✅ Using saved data for ${this.treeId} (${loadResult.data.length} people)`);
        }
      } catch (error) {
        console.warn('Failed to load from server, using initial data:', error);
        if (this.familyData && this.familyData.length > 0) {
          console.log(`📊 Fallback: using initial data for ${this.treeId} (${this.familyData.length} people)`);
          
          // Use updateData instead of setData (correct API method)
          if (typeof this.f3Chart.updateData === 'function') {
            this.f3Chart.updateData(this.familyData);
            this.f3Chart.updateTree({ initial: true, main_id: mainPersonId });
          } else {
            console.error('❌ f3Chart.updateData is not a function in fallback. Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.f3Chart)));
            throw new Error('f3Chart does not have updateData method in fallback');
          }
        } else {
          console.error(`❌ No fallback data available for ${this.treeId}`);
        }
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
      
      // Show user-friendly error message
      const chartElement = document.getElementById('FamilyChart');
      if (chartElement) {
        chartElement.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #fff; text-align: center;">
            <div>
              <h2>Loading failed</h2>
              <p>Failed to initialize family tree</p>
              <p style="font-size: 12px; opacity: 0.8;">Error: ${error.message}</p>
              <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Try Again
              </button>
            </div>
          </div>
        `;
      }
      
      throw error;
    }
  }
}
