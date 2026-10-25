// One compact form component is reused for parent/subfolder creation and editing.
function folderDialogEscape(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function folderColourButtons() {
  return SIDEBAR_FOLDER_PALETTE.map((colour, index) => `<button type="button" class="ytsm-swatch" data-color="${colour}" aria-label="Muted colour ${index + 1}" title="Muted colour ${index + 1}" style="--swatch-colour:${colour}"></button>`).join('');
}
function showFolderForm(options) {
  const { kind, mode, parentName = null, originalName = null, anchor = null, onSaved = null, onDeleted = null, placement = 'beside' } = options;
  const editing = mode === 'edit';
  if (!editing && !requireFolderCreation(kind, parentName)) return;
  const record = kind === 'parent' ? (editing ? window.folderData?.[originalName] : null) : (editing ? window.folderData?.[parentName]?.subfolders?.[originalName] : null);
  if (editing && !record) return;
  let selectedColor = editing ? record.color : nextFolderColour();
  let selectedTextColor = editing ? (record.textColor || folderTextColour(selectedColor)) : folderTextColour(selectedColor);
  let colourChanged = false, confirmingDelete = false;
  const noun = kind === 'parent' ? 'Folder' : 'Subfolder';
  const title = editing ? `Edit ${noun}` : `Create ${noun}`;
  const parentLine = kind === 'subfolder' ? `<p class="ytsm-parent-context">Parent: <strong>${folderDialogEscape(parentName)}</strong></p>` : '';
  const { modal, close, position } = openFolderDialog(kind, `<div class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header">${FolderIcons.svg(record?.iconId, 'ytsm-dialog-folder-icon')}<div><h2 id="ytsm-folder-dialog-title">${title}</h2>${parentLine}</div></header>
    <div class="ytsm-folder-form"><label for="ytsm-folder-name">${noun} name</label><div class="ytsm-name-line"><input type="text" id="ytsm-folder-name" maxlength="20" value="${folderDialogEscape(editing ? originalName : '')}" autocomplete="off"><span class="ytsm-character-count"><span>${editing ? originalName.length : 0}</span>/20</span></div>
    <label>Colour</label><div class="ytsm-colour-controls"><div class="ytsm-colour-row">${folderColourButtons()}</div><button type="button" class="ytsm-custom-colour"><span class="ytsm-palette-icon" aria-hidden="true">◉</span> Custom colour</button><div class="ytsm-custom-panel" hidden><input class="ytsm-colour-input" type="color" value="${sidebarFolderColour(selectedColor)}" aria-label="Choose custom colour"><input class="ytsm-colour-hex" type="text" value="${sidebarFolderColour(selectedColor)}" maxlength="7" aria-label="Custom colour hex value" spellcheck="false"><button type="button" class="ytsm-colour-done">Done</button></div></div>
    <section class="ytsm-icon-controls" aria-label="Folder icon"><label>Icon</label><div class="ytsm-icon-summary"><span class="ytsm-icon-preview" aria-hidden="true"></span><span class="ytsm-icon-name"></span><button type="button" class="ytsm-change-icon" aria-expanded="false" aria-controls="ytsm-icon-grid">Change icon</button></div><button type="button" class="ytsm-reset-icon" hidden>Use default folder</button><div id="ytsm-icon-grid" class="ytsm-icon-grid" role="group" aria-label="Choose a folder icon" hidden></div><p class="ytsm-icon-hint" hidden>Choose an icon. Create or Save changes applies your choice.</p></section>
    <p class="ytsm-form-error" role="alert" hidden></p>
    <div class="ytsm-delete-confirm" hidden><span>Delete this ${noun.toLowerCase()}${kind === 'parent' ? ' and its subfolders' : ''}?</span><button type="button" data-action="confirm-delete" class="is-danger">Delete</button><button type="button" data-action="cancel-delete">Keep</button></div>
    <footer class="ytsm-dialog-actions">${editing ? '<button type="button" data-action="delete" class="ytsm-delete">Delete</button>' : ''}<span></span><button type="button" data-dialog-close>Cancel</button><button type="button" data-action="save" class="ytsm-primary">${editing ? 'Save changes' : 'Create'}</button></footer></div></div>`, anchor, placement);
  const input = modal.querySelector('#ytsm-folder-name'), count = modal.querySelector('.ytsm-character-count span'), error = modal.querySelector('.ytsm-form-error');
  const save = modal.querySelector('[data-action="save"]'), picker = modal.querySelector('.ytsm-colour-input');
  function showError(message) { error.textContent = message; error.hidden = !message; }
  const iconPicker = createFolderIconPicker({ modal, initialIcon: record?.iconId, getColour: () => selectedColor, onLayout: position });
  function syncSwatches() { iconPicker.sync(); modal.querySelector('.ytsm-palette-icon').style.color = sidebarFolderColour(selectedColor); modal.querySelector('.ytsm-custom-colour').title = `Selected colour: ${sidebarFolderColour(selectedColor)}`; modal.querySelectorAll('.ytsm-swatch').forEach(button => { const active = button.dataset.color === selectedColor?.toLowerCase(); button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active)); }); }
  input.addEventListener('input', () => { count.textContent = input.value.length; showError(''); });
  modal.querySelectorAll('.ytsm-swatch').forEach(button => button.addEventListener('click', () => { selectedColor = button.dataset.color; selectedTextColor = '#ffffff'; colourChanged = true; picker.value = selectedColor; hexInput.value = selectedColor; hexInput.setAttribute('aria-invalid', 'false'); syncSwatches(); }));
  const customButton = modal.querySelector('.ytsm-custom-colour');
  const customPanel = modal.querySelector('.ytsm-custom-panel');
  const hexInput = modal.querySelector('.ytsm-colour-hex');
  customButton.setAttribute('aria-expanded', 'false');
  function toggleCustom(open) {
    customPanel.hidden = !open;
    customButton.setAttribute('aria-expanded', String(open));
    if (!open) { hexInput.value = sidebarFolderColour(selectedColor); hexInput.setAttribute('aria-invalid', 'false'); customButton.focus(); }
  }
  customButton.addEventListener('click', () => toggleCustom(customPanel.hidden));
  modal.querySelector('.ytsm-colour-done').addEventListener('click', () => toggleCustom(false));
  function chooseCustom(value) {
    selectedColor = value.toLowerCase(); selectedTextColor = folderTextColour(selectedColor);
    colourChanged = true; picker.value = selectedColor; hexInput.value = selectedColor;
    hexInput.setAttribute('aria-invalid', 'false'); syncSwatches();
  }
  picker.addEventListener('input', () => chooseCustom(picker.value));
  hexInput.addEventListener('input', () => {
    if (isFolderHexColour(hexInput.value)) chooseCustom(hexInput.value);
    else hexInput.setAttribute('aria-invalid', 'true');
  });
  hexInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); if (isFolderHexColour(hexInput.value)) toggleCustom(false); }
  });
  function validate(name) {
    if (!name) return `${noun} name cannot be empty.`;
    if (kind === 'parent' && name !== originalName && Object.hasOwn(window.folderData || {}, name)) return 'A folder with this name already exists.';
    const children = window.folderData?.[parentName]?.subfolders || {};
    if (kind === 'subfolder' && name !== originalName && Object.hasOwn(children, name)) return 'A subfolder with this name already exists in this parent.';
    return '';
  }
  save.addEventListener('click', () => {
    const name = input.value.trim(), problem = validate(name); if (problem) { showError(problem); return; }
    if (!editing && !requireFolderCreation(kind, parentName)) return;
    if (iconPicker.changed && iconPicker.value !== 'folder' && window.FolderPlan?.state !== 'pro' && iconPicker.value !== FolderIcons.normalise(record?.iconId)) { showFolderIconsProDialog(); return; }
    save.disabled = true; showError('');
    const textColor = editing && !colourChanged ? (record.textColor || selectedTextColor) : selectedTextColor;
    const done = success => { if (!success) { save.disabled = false; showError('Could not save changes. Existing data was kept.'); return; } close(); onSaved?.(name); };
    if (kind === 'parent') editing ? updateParentFolderRecord(originalName, name, selectedColor, textColor, done, iconPicker.changed ? iconPicker.value : undefined) : createParentFolderRecord(name, selectedColor, textColor, done, iconPicker.changed ? iconPicker.value : undefined);
    else editing ? updateSubfolderRecord(parentName, originalName, name, selectedColor, textColor, done, iconPicker.changed ? iconPicker.value : undefined) : createSubfolderRecord(parentName, name, selectedColor, textColor, done, iconPicker.changed ? iconPicker.value : undefined);
  });
  const deleteTrigger = modal.querySelector('[data-action="delete"]');
  deleteTrigger?.addEventListener('click', () => { confirmingDelete = true; modal.querySelector('.ytsm-delete-confirm').hidden = false; deleteTrigger.hidden = true; });
  modal.querySelector('[data-action="cancel-delete"]')?.addEventListener('click', () => { confirmingDelete = false; modal.querySelector('.ytsm-delete-confirm').hidden = true; if (deleteTrigger) deleteTrigger.hidden = false; });
  modal.querySelector('[data-action="confirm-delete"]')?.addEventListener('click', event => {
    if (!confirmingDelete) return; event.currentTarget.disabled = true;
    const done = success => { if (!success) { event.currentTarget.disabled = false; showError('Could not delete the folder. Existing data was kept.'); return; } close(); onDeleted?.(); };
    kind === 'parent' ? deleteParentFolderRecord(originalName, done) : deleteSubfolderRecord(parentName, originalName, done);
  });
  syncSwatches(); return { modal, close };
}
window.showFolderForm = showFolderForm;
