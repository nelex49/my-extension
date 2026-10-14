// Subfolder form controller; shared controls and lifecycle own repeated UI behaviour.
function showCreateSubfolderModal(parentFolderName, subfolderName = null) {
  const parentInfo = folderData[parentFolderName];
  const isEditMode = subfolderName !== null;
  const subfolderInfo = isEditMode ? parentInfo?.subfolders?.[subfolderName] : null;
  if (!parentInfo || (isEditMode && !subfolderInfo)) return;
  const parentColour = parentInfo.color || '#1976d2';
  let selectedIcon = isEditMode ? subfolderInfo.icon || '📂' : '📂';
  let selectedColor = isEditMode ? subfolderInfo.color || lightenColor(parentColour, 30) : lightenColor(parentColour, 30);
  let selectedTextColor = isEditMode ? subfolderInfo.textColor || '#333333' : '#333333';
  const colours = [['Light', 30], ['Medium', 15], ['Pastel', 40], ['Muted', -10]];
  const escape = folderDialogEscape;
  const { modal, close } = openFolderDialog('subfolder', `
    <div class="ytsm-dialog-panel">
      <div class="ytsm-dialog-header subfolder-header">
        <button type="button" id="close-subfolder-modal" class="ytsm-dialog-close" data-dialog-close aria-label="Close subfolder dialog">✕</button>
        <h2 id="ytsm-folder-dialog-title"><span class="ytsm-header-folder">📁</span><span>${isEditMode ? `Edit Subfolder "${escape(subfolderName)}"` : `Create Subfolder in "${escape(parentFolderName)}"`}</span></h2>
        <p>${isEditMode ? 'Modify your subfolder settings' : 'Set up your new subfolder with custom name, icon, and color'}</p>
      </div>
      <div class="ytsm-subfolder-content">
        <div class="ytsm-form-group"><label for="subfolder-name-input">Subfolder Name:</label>
          <input type="text" id="subfolder-name-input" value="${escape(isEditMode ? subfolderName : '')}" placeholder="e.g., FPS, Racing, Strategy..." maxlength="20">
          <div class="ytsm-character-count"><span id="subfolder-char-count">${isEditMode ? subfolderName.length : 0}</span>/20 characters</div>
        </div>
        <div class="ytsm-form-group"><label>Icon:</label><div class="ytsm-icon-grid">${['🔫','🏎️','🎲','📱','💻','🖥️','🎸','🎹','🎤','🎨','📚','🏃'].map(icon => `<button type="button" class="ytsm-icon-option icon-option" data-icon="${icon}">${icon}</button>`).join('')}</div></div>
        <div class="ytsm-form-group"><label>Background Color:</label><div class="ytsm-background-grid">${colours.map(([name, amount]) => `<button type="button" class="ytsm-swatch color-option" data-color="${lightenColor(parentColour, amount)}" title="${name}" aria-label="${name}"><span>${name}</span></button>`).join('')}</div></div>
        <div class="ytsm-form-group"><label>Text Color:</label><div class="ytsm-text-grid">${folderColourButtons(SUBFOLDER_TEXT_COLOURS, 'text-color-option', true)}</div></div>
        <div class="ytsm-subfolder-preview-box"><h4>Preview:</h4>
          <div id="subfolder-preview" class="ytsm-folder-preview"><span id="preview-icon"></span><span id="preview-name"></span></div>
        </div>
        <div class="ytsm-subfolder-actions"><button type="button" id="cancel-subfolder" data-dialog-close>Cancel</button><button type="button" id="create-subfolder" class="ytsm-save-subfolder">${isEditMode ? 'Save Changes' : 'Create Subfolder'}</button></div>
      </div>
    </div>`);
  const header = modal.querySelector('.ytsm-dialog-header');
  header.style.setProperty('--dialog-header', selectedColor);
  header.style.setProperty('--dialog-header-text', selectedTextColor);
  const nameInput = modal.querySelector('#subfolder-name-input');
  function updatePreview() {
    const preview = modal.querySelector('#subfolder-preview');
    preview.style.setProperty('--preview-colour', selectedColor);
    preview.style.setProperty('--preview-text', selectedTextColor);
    modal.querySelector('#preview-name').textContent = nameInput.value || (isEditMode ? subfolderName : 'New Subfolder');
    modal.querySelector('#preview-icon').textContent = selectedIcon;
  }
  bindFolderName(nameInput, modal.querySelector('#subfolder-char-count'), updatePreview);
  bindFolderOptions(modal, '.color-option', 'color', selectedColor, colour => { selectedColor = colour; updatePreview(); });
  bindFolderOptions(modal, '.text-color-option', 'color', selectedTextColor, colour => { selectedTextColor = colour; updatePreview(); });
  bindFolderOptions(modal, '.icon-option', 'icon', selectedIcon, icon => { selectedIcon = icon; updatePreview(); });
  modal.querySelector('#create-subfolder').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { showUserNotification('Please enter a subfolder name', 'warn'); return; }
    const children = folderData[parentFolderName]?.subfolders || {};
    if (name !== subfolderName && Object.hasOwn(children, name)) {
      showUserNotification('A subfolder with this name already exists', 'error'); return;
    }
    if (isEditMode) {
      updateSubfolderRecord(parentFolderName, subfolderName, name, selectedIcon, selectedColor, selectedTextColor);
    } else createSubfolder(parentFolderName, name, selectedIcon, selectedColor, selectedTextColor);
    close();
  });
  updatePreview();
}
window.showCreateSubfolderModal = showCreateSubfolderModal;
