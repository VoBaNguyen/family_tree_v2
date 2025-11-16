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
        statusEl.textContent = '🟢 Backend Connected';
        statusEl.className = 'status-indicator status-online';
        statusEl.title = 'Connected to family tree backend server';
      } else {
        statusEl.textContent = '🔴 Backend Offline';
        statusEl.className = 'status-indicator status-offline';
        statusEl.title = 'Cannot connect to backend server - changes will not be saved';
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
      background: linear-gradient(135deg, var(--modal-bg, #1e1e1e) 0%, var(--card-bg, #2d2d2d) 100%);
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      border: 1px solid var(--card-border, #404040);
      color: var(--text-color, #e0e0e0);
    `;

    modalContent.innerHTML = `
      <h2 style="margin: 0 0 16px 0; color: var(--text-color, #e0e0e0); border-bottom: 2px solid var(--card-border, #404040); padding-bottom: 12px;">Tree Backups</h2>
      <div style="margin-bottom: 16px;">
        ${backups.map((backup, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--card-border, #404040); background: var(--input-bg, #2d2d2d); margin-bottom: 8px; border-radius: 6px;">
            <span style="font-size: 14px; color: var(--text-color, #e0e0e0);">
              ${backup.filename} 
              <small style="color: var(--text-color-secondary, #b0b0b0);">(${backup.date})</small>
            </span>
            <button onclick="window.restoreBackup('${backup.filename}')" style="background: linear-gradient(135deg, var(--primary-color, #4fc3f7) 0%, #29b6f6 100%); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.3s ease;">
              Restore
            </button>
          </div>
        `).join('')}
      </div>
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s ease;">
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
          // Check if f3EditTree is initialized
          if (!this.f3EditTree) {
            throw new Error('Edit tree not initialized yet');
          }

          // Try getData first, fallback to exportData
          let data;
          if (typeof this.f3EditTree.getData === 'function') {
            data = this.f3EditTree.getData();
          } else if (typeof this.f3EditTree.exportData === 'function') {
            data = this.f3EditTree.exportData();
          } else {
            throw new Error('No data export method available on f3EditTree');
          }

          console.log('📊 Manual save data:', data);
          
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
            const loadedData = await response.json();
            
            // Ensure loaded data is an array
            if (Array.isArray(loadedData)) {
              this.familyData = loadedData;
            } else if (loadedData && typeof loadedData === 'object' && Array.isArray(loadedData.data)) {
              this.familyData = loadedData.data;
            } else {
              console.error('❌ Loaded data is not in expected format:', typeof loadedData, loadedData);
              this.familyData = [];
            }
            
            console.log(`📥 Loaded initial ${this.treeId} data with ${this.familyData.length} people`);
            
            if (this.familyData.length === 0) {
              console.warn(`⚠️ Initial data loaded but array is empty for ${this.treeId}`);
            }
          } else {
            console.error(`❌ Initial data request failed: ${response.status} ${response.statusText}`);
            this.familyData = []; // Ensure it's an empty array
          }
        } catch (error) {
          console.warn('Failed to load initial data from server:', error);
          this.familyData = []; // Ensure it's an empty array
        }
      } else {
        console.log(`📋 ${this.treeId} already has ${this.familyData.length} people in familyData`);
        
        // Double-check that existing familyData is an array
        if (!Array.isArray(this.familyData)) {
          console.error('❌ Existing familyData is not an array:', typeof this.familyData, this.familyData);
          this.familyData = [];
        }
      }
      
      // Create the family chart
      console.log('🔧 Creating f3Chart with:', { f3, familyDataLength: this.familyData?.length });
      console.log('🔍 familyData content:', this.familyData);
      
      // Validate familyData before creating chart
      if (!Array.isArray(this.familyData)) {
        console.error('❌ familyData is not an array:', typeof this.familyData, this.familyData);
        throw new Error(`familyData must be an array, got ${typeof this.familyData}`);
      }
      
      try {
        this.f3Chart = f3.createChart('#FamilyChart', this.familyData)
          .setTransitionTime(500)
          .setCardXSpacing(180)
          .setCardYSpacing(100);
          
        console.log('✅ f3Chart created successfully:', this.f3Chart);
        console.log('📊 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.f3Chart)));
      } catch (chartError) {
        console.error('❌ Failed to create f3Chart:', chartError);
        console.error('📊 familyData at error:', this.familyData);
        throw new Error(`Failed to create family chart: ${chartError.message}`);
      }

      // Configure the cards with enhanced display
      const f3Card = this.f3Chart.setCardHtml()
        .setCardDisplay([
          ["first name", "last name"], 
          ["title"], 
          ["birthday"]
        ]);

      // Add custom CSS for enhanced card styling
      this.addCardStyling();

      // Enable editing with enhanced fields including title
      this.f3EditTree = this.f3Chart.editTree()
        .setFields(["first name", "last name", "sex", "title", "avatar", "birthday", "note"])
        .setEditFirst(true)
        .setCardClickOpen(f3Card);

      // Add avatar upload functionality to the edit form
      this.setupAvatarUpload();
      this.setupFormEnhancements();

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

  // Setup avatar upload functionality
  setupAvatarUpload() {
    // We'll monitor for when the edit form is created and modify it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for avatar input field in edit forms
            const avatarInput = node.querySelector && node.querySelector('input[data-field="avatar"]');
            if (avatarInput) {
              this.enhanceAvatarField(avatarInput);
            }
            
            // Also check if this node itself is an avatar input
            if (node.dataset && node.dataset.field === 'avatar') {
              this.enhanceAvatarField(node);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Enhance avatar input field with upload functionality
  enhanceAvatarField(avatarInput) {
    if (avatarInput.dataset.enhanced) {
      return; // Already enhanced
    }
    avatarInput.dataset.enhanced = 'true';

    // Style the original input
    avatarInput.placeholder = 'Image URL or upload new photo...';
    avatarInput.style.cssText += `
      background: var(--dark-surface, #2d2d2d) !important;
      border: 2px solid var(--dark-border, #404040) !important;
      color: var(--dark-text, #e0e0e0) !important;
      margin-bottom: 12px !important;
    `;

    // Create main container for upload interface
    const uploadSection = document.createElement('div');
    uploadSection.style.cssText = `
      background: var(--dark-surface-variant, #3d3d3d);
      border: 1px solid var(--dark-border, #404040);
      border-radius: 8px;
      padding: 16px;
      margin-top: 8px;
    `;

    // Create section title
    const title = document.createElement('div');
    title.textContent = '📸 Avatar Photo';
    title.style.cssText = `
      font-weight: 600;
      color: var(--dark-text, #e0e0e0);
      margin-bottom: 12px;
      font-size: 14px;
      border-bottom: 1px solid var(--dark-border, #404040);
      padding-bottom: 8px;
    `;

    // Create upload controls container
    const uploadContainer = document.createElement('div');
    uploadContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    `;

    // Create file input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // Create main upload button
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = 'Upload Avatar';
    uploadBtn.type = 'button';
    uploadBtn.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(135deg, var(--primary-color, #4fc3f7) 0%, #29b6f6 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(79, 195, 247, 0.3);
    `;

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️ Remove';
    removeBtn.type = 'button';
    removeBtn.style.cssText = `
      display: none;
      padding: 6px 12px;
      background: var(--error-color, #ef5350);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
    `;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // Create preview image
    const preview = document.createElement('img');
    preview.style.cssText = `
      display: none;
      width: 60px;
      height: 60px;
      border-radius: 8px;
      border: 2px solid var(--dark-border, #404040);
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Create status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
      font-size: 12px;
      color: var(--dark-text-secondary, #b0b0b0);
      font-style: italic;
    `;

    // Assemble the upload section
    uploadSection.appendChild(title);
    uploadContainer.appendChild(fileInput);
    uploadContainer.appendChild(uploadBtn);
    uploadContainer.appendChild(removeBtn);
    uploadSection.appendChild(uploadContainer);
    previewContainer.appendChild(preview);
    previewContainer.appendChild(statusIndicator);
    uploadSection.appendChild(previewContainer);

    // Insert after the avatar input
    avatarInput.parentNode.insertBefore(uploadSection, avatarInput.nextSibling);

    // Function to show current avatar if exists
    const showCurrentAvatar = () => {
      if (avatarInput.value && avatarInput.value.trim()) {
        preview.src = avatarInput.value;
        preview.style.display = 'block';
        removeBtn.style.display = 'inline-block';
        statusIndicator.textContent = 'Current photo loaded';
        statusIndicator.style.color = 'var(--success-color, #66bb6a)';
      } else {
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
        statusIndicator.textContent = 'No photo selected';
        statusIndicator.style.color = 'var(--dark-text-secondary, #b0b0b0)';
      }
    };

    // Show current avatar if exists
    showCurrentAvatar();

    // Handle upload button click
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle upload button hover
    uploadBtn.addEventListener('mouseenter', () => {
      uploadBtn.style.transform = 'translateY(-2px)';
      uploadBtn.style.boxShadow = '0 4px 12px rgba(79, 195, 247, 0.4)';
    });

    uploadBtn.addEventListener('mouseleave', () => {
      uploadBtn.style.transform = 'translateY(0)';
      uploadBtn.style.boxShadow = '0 2px 8px rgba(79, 195, 247, 0.3)';
    });

    // Handle remove button click
    removeBtn.addEventListener('click', () => {
      avatarInput.value = '';
      showCurrentAvatar();
      avatarInput.dispatchEvent(new Event('change'));
    });

    // Handle avatar input changes (manual URL input)
    avatarInput.addEventListener('input', showCurrentAvatar);

    // Handle file selection and upload
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        statusIndicator.textContent = 'File too large (max 5MB)';
        statusIndicator.style.color = 'var(--error-color, #ef5350)';
        return;
      }

      try {
        uploadBtn.textContent = '⏳ Uploading...';
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.7';
        statusIndicator.textContent = 'Uploading image...';
        statusIndicator.style.color = 'var(--warning-color, #ffc107)';

        // Upload the image to the server
        const imageUrl = await this.uploadAvatarToServer(file);
        
        if (imageUrl) {
          avatarInput.value = imageUrl;
          showCurrentAvatar();
          
          // Trigger change event on the input
          avatarInput.dispatchEvent(new Event('change'));
          
          statusIndicator.textContent = 'Photo uploaded successfully!';
          statusIndicator.style.color = 'var(--success-color, #66bb6a)';
          
          console.log('✓ Avatar uploaded successfully:', imageUrl);

          // Reset status after 3 seconds
          setTimeout(() => {
            statusIndicator.textContent = 'Current photo loaded';
            statusIndicator.style.color = 'var(--success-color, #66bb6a)';
          }, 3000);
        } else {
          throw new Error('Upload failed - no URL returned');
        }

      } catch (error) {
        console.error('❌ Avatar upload failed:', error);
        statusIndicator.textContent = `Upload failed: ${error.message}`;
        statusIndicator.style.color = 'var(--error-color, #ef5350)';
      } finally {
        uploadBtn.textContent = 'Upload Avatar';
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        fileInput.value = ''; // Reset file input
      }
    });
  }

  // Upload avatar to server and return the URL
  async uploadAvatarToServer(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`http://localhost:3001/api/images/${this.treeId}/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      return `http://localhost:3001${result.imageUrl}`;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  }

  // Helper function to ensure avatar is on server before saving
  async ensureAvatarUploaded(personData) {
    // Validate input
    if (!personData || typeof personData !== 'object') {
      console.warn('⚠️ ensureAvatarUploaded: invalid personData:', typeof personData, personData);
      return personData;
    }

    // Check if person has data property and avatar field
    const data = personData.data || personData;
    if (!data.avatar || !data.avatar.trim()) {
      return personData; // No avatar to check
    }

    // Check if avatar is a local file (data URL or blob URL)
    const avatarUrl = data.avatar.trim();
    if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
      console.log('🔄 Detected local avatar image, uploading to server...');
      
      try {
        // Convert data URL to blob if needed
        let blob;
        if (avatarUrl.startsWith('data:')) {
          const response = await fetch(avatarUrl);
          blob = await response.blob();
        } else {
          const response = await fetch(avatarUrl);
          blob = await response.blob();
        }
        
        // Create a file from the blob
        const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
        
        // Upload to server
        const serverUrl = await this.uploadAvatarToServer(file);
        
        // Update the person data with the server URL
        if (personData.data) {
          personData.data.avatar = serverUrl;
        } else {
          personData.avatar = serverUrl;
        }
        console.log('✅ Avatar uploaded to server:', serverUrl);
        
        // Update the input field if it exists
        const avatarInput = document.querySelector('input[data-field="avatar"]');
        if (avatarInput) {
          avatarInput.value = serverUrl;
          avatarInput.dispatchEvent(new Event('change'));
        }
        
      } catch (error) {
        console.error('❌ Failed to upload avatar to server:', error);
        // Continue with save anyway - user can fix later
      }
    }
    
    return personData;
  }

  // Add enhanced card styling via CSS
  addCardStyling() {
    // Remove any existing custom styles
    const existingStyle = document.getElementById('f3-custom-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject custom CSS for basic card enhancements
    const style = document.createElement('style');
    style.id = 'f3-custom-styles';
    style.textContent = `
      /* Enhanced F3 Card Styling */
      .f3 .card {
        border-radius: 12px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        transition: all 0.3s ease !important;
        border: 2px solid #dee2e6 !important;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
      }

      .f3 .card .card-text {
        color: #333 !important;
        font-family: 'Arial', sans-serif !important;
      }

      .f3 .card .card-text div:first-child {
        font-weight: 600 !important;
        font-size: 14px !important;
        margin-bottom: 4px !important;
      }

      .f3 .card .card-text div:nth-child(2) {
        font-size: 11px !important;
        color: #666 !important;
        font-style: italic !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 2px 6px !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin-bottom: 4px !important;
      }

      .f3 .card .card-text div:nth-child(3) {
        font-size: 11px !important;
        color: #888 !important;
      }

      /* Gender-based styling will be added dynamically */
      .f3 .card.male-card {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
        border-color: #2196f3 !important;
      }

      .f3 .card.female-card {
        background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%) !important;
        border-color: #e91e63 !important;
      }
    `;

    document.head.appendChild(style);
  }

  // Setup form enhancements
  setupFormEnhancements() {
    // Monitor for when edit forms are created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for edit form modals
            const forms = node.querySelectorAll && node.querySelectorAll('[data-f3="edit-form"], .f3-edit-form') || [];
            if (node.dataset && (node.dataset.f3 === 'edit-form' || node.classList.contains('f3-edit-form'))) {
              forms.push(node);
            }
            
            forms.forEach(form => this.enhanceForm(form));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Enhance form appearance and functionality  
  enhanceForm(form) {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = 'true';

    // Apply enhanced styling
    form.style.cssText += `
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      border: 1px solid #e9ecef;
    `;

    // Style all form inputs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (!input.dataset.styled) {
        input.dataset.styled = 'true';
        input.style.cssText += `
          border: 2px solid #e9ecef;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: #ffffff;
        `;

        // Add focus styles
        input.addEventListener('focus', () => {
          input.style.borderColor = '#007bff';
          input.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
        });

        input.addEventListener('blur', () => {
          input.style.borderColor = '#e9ecef';
          input.style.boxShadow = 'none';
        });
      }
    });

    // Style labels
    const labels = form.querySelectorAll('label');
    labels.forEach(label => {
      if (!label.dataset.styled) {
        label.dataset.styled = 'true';
        label.style.cssText += `
          font-weight: 600;
          color: #495057;
          margin-bottom: 6px;
          display: block;
          font-size: 13px;
        `;
      }
    });
  }
}
