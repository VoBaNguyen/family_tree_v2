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
    avatarInput.style.marginBottom = '8px';

    // Create container for upload controls
    const uploadContainer = document.createElement('div');
    uploadContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    `;

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // Create upload button
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '📸 Upload Photo';
    uploadBtn.type = 'button';
    uploadBtn.style.cssText = `
      padding: 6px 12px;
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
    `;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Create preview image
    const preview = document.createElement('img');
    preview.style.cssText = `
      display: none;
      width: 50px;
      height: 50px;
      border-radius: 6px;
      border: 2px solid #dee2e6;
      object-fit: cover;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️';
    removeBtn.type = 'button';
    removeBtn.title = 'Remove photo';
    removeBtn.style.cssText = `
      display: none;
      padding: 4px 6px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;

    // Create status indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.style.cssText = `
      font-size: 11px;
      color: #6c757d;
      font-style: italic;
    `;

    // Assemble the upload container
    previewContainer.appendChild(preview);
    previewContainer.appendChild(removeBtn);
    uploadContainer.appendChild(fileInput);
    uploadContainer.appendChild(uploadBtn);
    uploadContainer.appendChild(previewContainer);
    uploadContainer.appendChild(statusIndicator);

    // Insert after the avatar input
    avatarInput.parentNode.insertBefore(uploadContainer, avatarInput.nextSibling);

    // Function to show current avatar if exists
    const showCurrentAvatar = () => {
      if (avatarInput.value && avatarInput.value.trim()) {
        preview.src = avatarInput.value;
        preview.style.display = 'block';
        removeBtn.style.display = 'inline-block';
        statusIndicator.textContent = 'Current photo';
      } else {
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
        statusIndicator.textContent = 'No photo selected';
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
      uploadBtn.style.transform = 'translateY(-1px)';
      uploadBtn.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
    });

    uploadBtn.addEventListener('mouseleave', () => {
      uploadBtn.style.transform = 'translateY(0)';
      uploadBtn.style.boxShadow = 'none';
    });

    // Handle remove button click
    removeBtn.addEventListener('click', () => {
      avatarInput.value = '';
      showCurrentAvatar();
      avatarInput.dispatchEvent(new Event('change'));
    });

    // Handle avatar input changes (manual URL input)
    avatarInput.addEventListener('input', showCurrentAvatar);

    // Handle file selection
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      try {
        uploadBtn.textContent = '⏳ Uploading...';
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.7';
        statusIndicator.textContent = 'Uploading...';
        statusIndicator.style.color = '#ffc107';

        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`http://localhost:3001/api/images/${this.treeId}/upload`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          const fullImageUrl = `http://localhost:3001${result.imageUrl}`;
          avatarInput.value = fullImageUrl;
          showCurrentAvatar();
          
          // Trigger change event on the input
          avatarInput.dispatchEvent(new Event('change'));
          
          statusIndicator.textContent = 'Photo uploaded successfully!';
          statusIndicator.style.color = '#28a745';
          
          console.log('✓ Avatar uploaded successfully:', result.imageUrl);

          // Reset status after 3 seconds
          setTimeout(() => {
            statusIndicator.textContent = 'Current photo';
            statusIndicator.style.color = '#6c757d';
          }, 3000);
        } else {
          throw new Error(result.error || 'Upload failed');
        }

      } catch (error) {
        console.error('❌ Avatar upload failed:', error);
        statusIndicator.textContent = 'Upload failed';
        statusIndicator.style.color = '#dc3545';
        alert('Failed to upload avatar: ' + error.message);
      } finally {
        uploadBtn.textContent = '📸 Upload Photo';
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        fileInput.value = ''; // Reset file input
      }
    });
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

      .f3 .card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
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
