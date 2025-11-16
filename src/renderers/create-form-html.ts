import { EditDatumFormCreator, NewRelFormCreator, SelectField } from '../types/form'
import * as icons from './icons'


export function getHtmlNew(form_creator: NewRelFormCreator) {
  return (` 
    <form id="familyForm" class="f3-form">
      ${closeBtn()}
      <h3 class="f3-form-title">${form_creator.title}</h3>
      ${genderRadio(form_creator)}

      ${fields(form_creator)}
      
      <div class="f3-form-buttons">
        <button type="button" class="f3-cancel-btn">Cancel</button>
        <button type="submit">Save</button>
      </div>

      ${form_creator.linkExistingRelative ? addLinkExistingRelative(form_creator) : ''}
      
      ${avatarUploadScript()}
    </form>
  `)
}

export function getHtmlEdit(form_creator: EditDatumFormCreator) {
  return (` 
    <form id="familyForm" class="f3-form ${form_creator.editable ? '' : 'non-editable'}">
      ${closeBtn()}
      <div style="text-align: right; display: 'block'">
        ${!form_creator.no_edit ? addRelativeBtn(form_creator) : ''}
        ${form_creator.no_edit ? spaceDiv() : editBtn(form_creator)}
      </div>

      ${genderRadio(form_creator)}

      ${fields(form_creator)}
      
      <div class="f3-form-buttons">
        <button type="button" class="f3-cancel-btn">Cancel</button>
        <button type="button" class="f3-delete-btn" ${form_creator.can_delete ? '' : 'disabled'}>
          Delete
        </button>
        <button type="submit">Save</button>
      </div>

      ${form_creator.linkExistingRelative ? addLinkExistingRelative(form_creator) : ''}

      <hr>

      ${removeRelativeBtn(form_creator)}
      
      ${avatarUploadScript()}
    </form>
  `)

  
}

function removeRelativeBtn(form_creator: EditDatumFormCreator) {
  return (`
    <div>
      <button type="button" class="f3-remove-relative-btn${form_creator.removeRelativeActive ? ' active' : ''}">
        ${form_creator.removeRelativeActive ? 'Cancel Remove Relation' : 'Remove Relation'}
      </button>
    </div>
  `)
}

function addRelativeBtn(form_creator: EditDatumFormCreator) {
  return (`
    <span class="f3-add-relative-btn">
      ${form_creator.addRelativeActive ? icons.userPlusCloseSvgIcon() : icons.userPlusSvgIcon()}
    </span>
  `)
}

function editBtn(form_creator: EditDatumFormCreator) {
  return (`
    <span class="f3-edit-btn">
      ${form_creator.editable ? icons.pencilOffSvgIcon() : icons.pencilSvgIcon()}
    </span>
  `)
}

function genderRadio(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  if (!form_creator.editable) return ''
  return (`
    <div class="f3-form-field">
      <label>${form_creator.gender_field.label}</label>
      <div class="f3-radio-group">
        ${form_creator.gender_field.options.map(option => (`
          <label>
            <input type="radio" name="${form_creator.gender_field.id}" 
              value="${option.value}" 
              ${option.value === form_creator.gender_field.initial_value ? 'checked' : ''}
              ${form_creator.gender_field.disabled ? 'disabled' : ''}
            >
            ${option.label}
          </label>
        `)).join('')}
      </div>
    </div>
  `)
}

function fields(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  if (!form_creator.editable) return infoField()
  let fields_html = ''
  form_creator.fields.forEach(field => {
    if (field.type === 'text' && field.id === 'avatar') {
      // Special handling for avatar field
      fields_html += `
      <div class="f3-form-field">
        <label>${field.label}</label>
        <div class="avatar-upload-container">
          ${field.initial_value ? `
            <div class="avatar-preview">
              <img src="${field.initial_value}" alt="Avatar preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 8px;">
            </div>` : ''}
          <input type="file" 
            id="avatar-file-input" 
            accept="image/*" 
            style="display: none;">
          <button type="button" class="avatar-upload-btn" onclick="document.getElementById('avatar-file-input').click()">
            ${field.initial_value ? 'Change Avatar' : 'Upload Avatar'}
          </button>
          <input type="text" 
            name="${field.id}" 
            id="avatar-url-input"
            value="${field.initial_value || ''}"
            placeholder="Or paste image URL"
            style="margin-top: 8px;">
        </div>
      </div>`
    } else if (field.type === 'text') {
      fields_html += `
      <div class="f3-form-field">
        <label>${field.label}</label>
        <input type="${field.type}" 
          name="${field.id}" 
          value="${field.initial_value || ''}"
          placeholder="${field.label}">
      </div>`
    } else if (field.type === 'textarea') {
      fields_html += `
      <div class="f3-form-field">
        <label>${field.label}</label>
        <textarea name="${field.id}" 
          placeholder="${field.label}">${field.initial_value || ''}</textarea>
      </div>`
    } else if (field.type === 'select') {
      const select_field = field as SelectField
      fields_html += `
      <div class="f3-form-field">
        <label>${select_field.label}</label>
        <select name="${select_field.id}" value="${select_field.initial_value || ''}">
          <option value="">${select_field.placeholder || `Select ${select_field.label}`}</option>
          ${select_field.options.map((option) => `<option ${option.value === select_field.initial_value ? 'selected' : ''} value="${option.value}">${option.label}</option>`).join('')}
        </select>
      </div>`
    } else if (field.type === 'rel_reference') {
      fields_html += `
      <div class="f3-form-field">
        <label>${field.label} - <i>${field.rel_label}</i></label>
        <input type="text" 
          name="${field.id}" 
          value="${field.initial_value || ''}"
          placeholder="${field.label}">
      </div>`
    }
  })
  return fields_html

  function infoField() {
    let fields_html = ''
    form_creator.fields.forEach(field => {
      if (field.type === 'rel_reference') {
        if (!field.initial_value) return
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${field.label} - <i>${field.rel_label}</i></span>
          <span class="f3-info-field-value">${field.initial_value || ''}</span>
        </div>`
      } else if (field.type === 'select') {
        const select_field = field as SelectField
        if (!field.initial_value) return
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${select_field.label}</span>
          <span class="f3-info-field-value">${select_field.options.find(option => option.value === select_field.initial_value)?.label || ''}</span>
        </div>`
      } else {
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${field.label}</span>
          <span class="f3-info-field-value">${field.initial_value || ''}</span>
        </div>`
      }
    })
    return fields_html
  }
}

function addLinkExistingRelative(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  const title = form_creator.linkExistingRelative.hasOwnProperty('title') ? form_creator.linkExistingRelative.title : 'Profile already exists?'
  const select_placeholder = form_creator.linkExistingRelative.hasOwnProperty('select_placeholder') ? form_creator.linkExistingRelative.select_placeholder : 'Select profile'
  const options = form_creator.linkExistingRelative.options as SelectField['options']
  return (`
    <div>
      <hr>
      <div class="f3-link-existing-relative">
        <label>${title}</label>
        <select>
          <option value="">${select_placeholder}</option>
          ${options.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
        </select>
      </div>
    </div>
  `)
}


function closeBtn() {
  return (`
    <span class="f3-close-btn">
      ×
    </span>
  `)
}

function spaceDiv() {
  return `<div style="height: 24px;"></div>`
}

function avatarUploadScript() {
  return `
    <script>
      // Avatar upload utility function attached to window for global access
      window.setupAvatarUpload = function(container) {
        console.log('🔧 Setting up avatar upload functionality...');
        
        const fileInput = container.querySelector('#avatar-file-input');
        const urlInput = container.querySelector('#avatar-url-input');
        
        if (!fileInput) {
          console.log('❌ Avatar file input not found in container');
          return false;
        }
        
        console.log('✅ Found avatar elements, setting up handlers');
        
        // Remove any existing listeners to prevent duplicates
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        // Set up file upload handler
        newFileInput.addEventListener('change', async function(e) {
          console.log('📁 File selected for avatar upload');
          const file = e.target.files[0];
          if (!file) {
            console.log('❌ No file selected');
            return;
          }
          
          console.log('📋 File details:', { name: file.name, size: file.size, type: file.type });
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            console.log('❌ Invalid file type');
            return;
          }
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            console.log('❌ File too large');
            return;
          }
          
          try {
            console.log('🖼️ Processing file...');
            
            // Create immediate preview
            const reader = new FileReader();
            reader.onload = function(e) {
              console.log('✅ File read, creating preview');
              window.updateAvatarPreview(container, e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Try server upload if available
            if (window.familyTreeManager && typeof window.familyTreeManager.uploadAvatar === 'function') {
              console.log('� Attempting server upload...');
              try {
                const uploadedUrl = await window.familyTreeManager.uploadAvatar(file);
                const currentUrlInput = container.querySelector('#avatar-url-input');
                if (currentUrlInput) {
                  currentUrlInput.value = uploadedUrl;
                }
                window.updateAvatarPreview(container, uploadedUrl);
                console.log('✅ Server upload successful');
              } catch (uploadError) {
                console.log('⚠️ Server upload failed, using local preview:', uploadError);
                const localUrl = URL.createObjectURL(file);
                const currentUrlInput = container.querySelector('#avatar-url-input');
                if (currentUrlInput) {
                  currentUrlInput.value = localUrl;
                }
                window.updateAvatarPreview(container, localUrl);
              }
            } else {
              console.log('📷 No server available, using local preview');
              const localUrl = URL.createObjectURL(file);
              const currentUrlInput = container.querySelector('#avatar-url-input');
              if (currentUrlInput) {
                currentUrlInput.value = localUrl;
              }
              window.updateAvatarPreview(container, localUrl);
            }
          } catch (error) {
            console.error('❌ Avatar upload failed:', error);
            alert('Failed to upload avatar: ' + error.message);
          }
        });
        
        // Set up URL input handler
        if (urlInput) {
          urlInput.addEventListener('input', function(e) {
            const url = e.target.value;
            console.log('🔗 URL input changed:', url);
            if (url) {
              window.updateAvatarPreview(container, url);
            }
          });
        }
        
        console.log('✅ Avatar upload handlers set up successfully!');
        return true;
      };
      
      window.updateAvatarPreview = function(container, src) {
        console.log('🖼️ Updating avatar preview with:', src);
        const avatarContainer = container.querySelector('.avatar-upload-container');
        if (!avatarContainer) {
          console.log('❌ Avatar upload container not found');
          return;
        }
        
        let preview = avatarContainer.querySelector('.avatar-preview');
        if (!preview) {
          console.log('➕ Creating new preview element');
          preview = document.createElement('div');
          preview.className = 'avatar-preview';
          avatarContainer.insertBefore(preview, avatarContainer.firstChild);
        }
        
        preview.innerHTML = '<img src="' + src + '" alt="Avatar preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 8px; border: 2px solid #3498db;">';
        
        // Update button text
        const btn = avatarContainer.querySelector('.avatar-upload-btn');
        if (btn) {
          btn.textContent = 'Change Avatar';
          console.log('✅ Updated button text to "Change Avatar"');
        }
        
        console.log('✅ Avatar preview updated successfully');
      };
      
      console.log('📝 Avatar upload utilities attached to window object');
    </script>`;
}

// Avatar upload utility function that can be called from onFormCreation
export function setupAvatarUpload(container: HTMLElement) {
  console.log('🔧 Setting up avatar upload functionality...');
  
  const fileInput = container.querySelector('#avatar-file-input') as HTMLInputElement;
  const urlInput = container.querySelector('#avatar-url-input') as HTMLInputElement;
  
  if (!fileInput) {
    console.log('❌ Avatar file input not found in container');
    return false;
  }
  
  console.log('✅ Found avatar elements, setting up handlers');
  
  // Set up file upload handler
  fileInput.addEventListener('change', async function(e) {
    console.log('📁 File selected for avatar upload');
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📋 File details:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      console.log('❌ Invalid file type');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      console.log('❌ File too large');
      return;
    }
    
    try {
      console.log('🖼️ Processing file...');
      
      // Create immediate preview
      const reader = new FileReader();
      reader.onload = function(e) {
        console.log('✅ File read, creating preview');
        updateAvatarPreview(container, e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Try server upload if available
      if ((window as any).familyTreeManager && typeof (window as any).familyTreeManager.uploadAvatar === 'function') {
        console.log('🚀 Attempting server upload...');
        try {
          const uploadedUrl = await (window as any).familyTreeManager.uploadAvatar(file);
          if (urlInput) {
            urlInput.value = uploadedUrl;
          }
          updateAvatarPreview(container, uploadedUrl);
          console.log('✅ Server upload successful');
        } catch (uploadError) {
          console.log('⚠️ Server upload failed, using local preview:', uploadError);
          const localUrl = URL.createObjectURL(file);
          if (urlInput) {
            urlInput.value = localUrl;
          }
          updateAvatarPreview(container, localUrl);
        }
      } else {
        console.log('📷 No server available, using local preview');
        const localUrl = URL.createObjectURL(file);
        if (urlInput) {
          urlInput.value = localUrl;
        }
        updateAvatarPreview(container, localUrl);
      }
    } catch (error) {
      console.error('❌ Avatar upload failed:', error);
      alert('Failed to upload avatar: ' + (error as Error).message);
    }
  });
  
  // Set up URL input handler
  if (urlInput) {
    urlInput.addEventListener('input', function(e) {
      const url = (e.target as HTMLInputElement).value;
      console.log('🔗 URL input changed:', url);
      if (url) {
        updateAvatarPreview(container, url);
      }
    });
  }
  
  console.log('✅ Avatar upload handlers set up successfully!');
  return true;
}

function updateAvatarPreview(container: HTMLElement, src: string) {
  console.log('🖼️ Updating avatar preview with:', src);
  const avatarContainer = container.querySelector('.avatar-upload-container');
  if (!avatarContainer) {
    console.log('❌ Avatar upload container not found');
    return;
  }
  
  let preview = avatarContainer.querySelector('.avatar-preview') as HTMLElement;
  if (!preview) {
    console.log('➕ Creating new preview element');
    preview = document.createElement('div');
    preview.className = 'avatar-preview';
    avatarContainer.insertBefore(preview, avatarContainer.firstChild);
  }
  
  preview.innerHTML = `<img src="${src}" alt="Avatar preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 8px; border: 2px solid #3498db;">`;
  
  // Update button text
  const btn = avatarContainer.querySelector('.avatar-upload-btn') as HTMLElement;
  if (btn) {
    btn.textContent = 'Change Avatar';
    console.log('✅ Updated button text to "Change Avatar"');
  }
  
  console.log('✅ Avatar preview updated successfully');
}
