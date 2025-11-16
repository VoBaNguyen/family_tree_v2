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
      (function() {
        const fileInput = document.getElementById('avatar-file-input');
        const urlInput = document.getElementById('avatar-url-input');
        
        if (fileInput) {
          fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
              alert('Please select a valid image file');
              return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              alert('File size must be less than 5MB');
              return;
            }
            
            try {
              // Create a preview
              const reader = new FileReader();
              reader.onload = function(e) {
                updateAvatarPreview(e.target.result);
              };
              reader.readAsDataURL(file);
              
              // Upload to server if backend is available
              if (window.familyTreeManager && typeof window.familyTreeManager.uploadAvatar === 'function') {
                const uploadedUrl = await window.familyTreeManager.uploadAvatar(file);
                urlInput.value = uploadedUrl;
                updateAvatarPreview(uploadedUrl);
              } else {
                // Use local file URL as fallback
                const localUrl = URL.createObjectURL(file);
                urlInput.value = localUrl;
                updateAvatarPreview(localUrl);
              }
            } catch (error) {
              console.error('Avatar upload failed:', error);
              alert('Failed to upload avatar. Please try again.');
            }
          });
        }
        
        if (urlInput) {
          urlInput.addEventListener('input', function(e) {
            const url = e.target.value;
            if (url) {
              updateAvatarPreview(url);
            }
          });
        }
        
        function updateAvatarPreview(src) {
          const container = document.querySelector('.avatar-upload-container');
          let preview = container.querySelector('.avatar-preview');
          
          if (!preview) {
            preview = document.createElement('div');
            preview.className = 'avatar-preview';
            container.insertBefore(preview, container.firstChild);
          }
          
          preview.innerHTML = '<img src="' + src + '" alt="Avatar preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 8px;">';
          
          // Update button text
          const btn = container.querySelector('.avatar-upload-btn');
          if (btn) {
            btn.textContent = 'Change Avatar';
          }
        }
      })();
    </script>`;
}
