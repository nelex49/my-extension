// Parent dialog presentation. Folder mutations are delegated to FolderService.
function showUnifiedFolderManager(folderName = null, mode = 'create', onCreated = null) {
  const isEditMode = mode === 'edit' && folderName;
  const folderInfo = isEditMode ? folderData[folderName] : null;
  if (isEditMode && !folderInfo) return;
  let selectedColor = isEditMode ? folderInfo.color : nextFolderColour();
  let selectedTextColor = isEditMode ? folderInfo.textColor || '#ffffff' : '#ffffff';
  const escape = folderDialogEscape;
  const { modal, close } = openFolderDialog('parent', `
    <div class="ytsm-dialog-panel">
      <div class="ytsm-dialog-header unified-header">
        <button type="button" id="close-unified-manager" class="ytsm-dialog-close" data-dialog-close aria-label="Close folder dialog">✕</button>
        <h2 id="ytsm-folder-dialog-title">${isEditMode ? `Edit "${escape(folderName)}"` : 'Create New Folder'}</h2>
        <p>${isEditMode ? 'Modify your folder settings' : 'Set up your new folder with custom name, icon, and color'}</p>
      </div>
      <div class="ytsm-parent-content"><div class="ytsm-parent-form">
        <div class="ytsm-parent-settings">
          <h3>📁 Folder Settings</h3>
          <div class="ytsm-form-row">
            <div class="ytsm-name-column">
              <label for="unified-folder-name">Folder Name:</label>
              <input type="text" id="unified-folder-name" value="${escape(isEditMode ? folderName : '')}" maxlength="20" placeholder="e.g., Gaming, Tech, Music...">
              <div class="ytsm-character-count"><span id="unified-char-count">${isEditMode ? folderName.length : 0}</span>/20 characters</div>
            </div>
            <div class="ytsm-text-column"><label>Text Color:</label>
              <div class="ytsm-parent-swatches">${folderColourButtons(FOLDER_TEXT_COLOURS, 'unified-text-color-option', true)}</div>
            </div>
          </div>
          <div class="ytsm-form-row">
            <div class="ytsm-name-column"><div class="ytsm-parent-preview-box"><h4>Preview:</h4>
              <div id="folder-preview" class="ytsm-folder-preview"><span class="ytsm-preview-arrow">▶</span><span id="preview-name"></span></div>
            </div></div>
            <div class="ytsm-background-column"><label>Background Color:</label>
              <div class="ytsm-parent-swatches">${folderColourButtons(SIDEBAR_FOLDER_PALETTE.map(colour => [colour, colour]), 'unified-color-option')}</div>
              <button type="button" class="ytsm-custom-colour" title="Custom Color Picker (Coming Soon)">🎨 Custom Color</button>
            </div>
          </div>
        </div>
        <div class="ytsm-parent-actions">
          <button type="button" id="cancel-unified" data-dialog-close>Cancel</button>
          <button type="button" id="save-unified" class="ytsm-save-parent">${isEditMode ? 'Save Changes' : 'Create Folder'}</button>
        </div>
      </div></div>
    </div>`);
  const header = modal.querySelector('.ytsm-dialog-header');
  if (isEditMode) {
    header.style.setProperty('--dialog-header', folderInfo.color || '#007bff');
    header.style.setProperty('--dialog-header-text', folderInfo.textColor || '#ffffff');
  }
  const nameInput = modal.querySelector('#unified-folder-name');
  const save = modal.querySelector('#save-unified');
  function updatePreview() {
    const preview = modal.querySelector('#folder-preview');
    preview.style.setProperty('--preview-colour', selectedColor);
    preview.style.setProperty('--preview-text', selectedTextColor);
    modal.querySelector('#preview-name').textContent = nameInput.value || (isEditMode ? folderName : 'New Folder');
  }
  bindFolderName(nameInput, modal.querySelector('#unified-char-count'), updatePreview);
  bindFolderOptions(modal, '.unified-color-option', 'color', selectedColor, colour => { selectedColor = colour; updatePreview(); });
  bindFolderOptions(modal, '.unified-text-color-option', 'color', selectedTextColor, colour => { selectedTextColor = colour; updatePreview(); });
  save.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { showUserNotification('Please enter a folder name', 'warn'); return; }
    if (name !== folderName && Object.hasOwn(folderData, name)) {
      showUserNotification('A folder with this name already exists', 'error'); return;
    }
    if (save.disabled) return;
    if (isEditMode) {
      if (name !== folderName) updateFolderName(folderName, name, selectedColor, selectedTextColor);
      else updateFolderProperties(folderName, selectedColor, selectedTextColor);
      close();
    } else {
      save.disabled = true;
      createParentFolderRecord(name, selectedColor, selectedTextColor, success => {
        if (!success) { save.disabled = false; return; }
        close();
        if (typeof onCreated === 'function') onCreated(name);
      });
    }
  });
  updatePreview();
}
window.showUnifiedFolderManager = showUnifiedFolderManager;
