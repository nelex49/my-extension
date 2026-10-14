// One compact form component is reused for parent/subfolder creation and editing.
function folderDialogEscape(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function folderColourButtons() {
  return SIDEBAR_FOLDER_PALETTE.map((colour, index) => `<button type="button" class="ytsm-swatch" data-color="${colour}" aria-label="Muted colour ${index + 1}" title="Muted colour ${index + 1}" style="--swatch-colour:${colour}"></button>`).join('');
}
function showFolderForm(options) {
  const { kind, mode, parentName = null, originalName = null, anchor = null, onSaved = null, onDeleted = null } = options;
  const editing = mode === 'edit';
  const record = kind === 'parent' ? (editing ? window.folderData?.[originalName] : null) : (editing ? window.folderData?.[parentName]?.subfolders?.[originalName] : null);
  if (editing && !record) return;
  let selectedColor = editing ? record.color : nextFolderColour();
  let selectedTextColor = editing ? (record.textColor || folderTextColour(selectedColor)) : folderTextColour(selectedColor);
  let colourChanged = false, confirmingDelete = false;
  const noun = kind === 'parent' ? 'Folder' : 'Subfolder';
  const title = editing ? `Edit ${noun}` : `Create ${noun}`;
  const parentLine = kind === 'subfolder' ? `<p class="ytsm-parent-context">Parent: <strong>${folderDialogEscape(parentName)}</strong></p>` : '';
  const { modal, close } = openFolderDialog(kind, `<div class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><svg class="ytsm-dialog-folder-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg><div><h2 id="ytsm-folder-dialog-title">${title}</h2>${parentLine}</div></header>
    <div class="ytsm-folder-form"><label for="ytsm-folder-name">${noun} name</label><div class="ytsm-name-line"><input type="text" id="ytsm-folder-name" maxlength="20" value="${folderDialogEscape(editing ? originalName : '')}" autocomplete="off"><span class="ytsm-character-count"><span>${editing ? originalName.length : 0}</span>/20</span></div>
    <label>Colour</label><div class="ytsm-colour-controls"><div class="ytsm-colour-row">${folderColourButtons()}</div><button type="button" class="ytsm-custom-colour"><span class="ytsm-palette-icon" aria-hidden="true">◉</span> Custom colour</button><input class="ytsm-colour-input" type="color" value="${sidebarFolderColour(selectedColor)}" aria-label="Choose custom colour"></div>
    <p class="ytsm-form-error" role="alert" hidden></p>
    <div class="ytsm-delete-confirm" hidden><span>Delete this ${noun.toLowerCase()}${kind === 'parent' ? ' and its subfolders' : ''}?</span><button type="button" data-action="confirm-delete" class="is-danger">Delete</button><button type="button" data-action="cancel-delete">Keep</button></div>
    <footer class="ytsm-dialog-actions">${editing ? '<button type="button" data-action="delete" class="ytsm-delete">Delete</button>' : ''}<span></span><button type="button" data-dialog-close>Cancel</button><button type="button" data-action="save" class="ytsm-primary">${editing ? 'Save changes' : 'Create'}</button></footer></div></div>`, anchor);
  const input = modal.querySelector('#ytsm-folder-name'), count = modal.querySelector('.ytsm-character-count span'), error = modal.querySelector('.ytsm-form-error');
  const save = modal.querySelector('[data-action="save"]'), picker = modal.querySelector('.ytsm-colour-input');
  function showError(message) { error.textContent = message; error.hidden = !message; }
  function syncSwatches() { modal.querySelectorAll('.ytsm-swatch').forEach(button => { const active = button.dataset.color === selectedColor?.toLowerCase(); button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active)); }); }
  input.addEventListener('input', () => { count.textContent = input.value.length; showError(''); });
  modal.querySelectorAll('.ytsm-swatch').forEach(button => button.addEventListener('click', () => { selectedColor = button.dataset.color; selectedTextColor = '#ffffff'; colourChanged = true; picker.value = selectedColor; syncSwatches(); }));
  modal.querySelector('.ytsm-custom-colour').addEventListener('click', () => picker.click());
  picker.addEventListener('input', () => { selectedColor = picker.value.toLowerCase(); selectedTextColor = folderTextColour(selectedColor); colourChanged = true; syncSwatches(); });
  function validate(name) {
    if (!name) return `${noun} name cannot be empty.`;
    if (kind === 'parent' && name !== originalName && Object.hasOwn(window.folderData || {}, name)) return 'A folder with this name already exists.';
    const children = window.folderData?.[parentName]?.subfolders || {};
    if (kind === 'subfolder' && name !== originalName && Object.hasOwn(children, name)) return 'A subfolder with this name already exists in this parent.';
    return '';
  }
  save.addEventListener('click', () => {
    const name = input.value.trim(), problem = validate(name); if (problem) { showError(problem); return; }
    save.disabled = true; showError('');
    const textColor = editing && !colourChanged ? (record.textColor || selectedTextColor) : selectedTextColor;
    const done = success => { if (!success) { save.disabled = false; showError('Could not save changes. Existing data was kept.'); return; } close(); onSaved?.(name); };
    if (kind === 'parent') editing ? updateParentFolderRecord(originalName, name, selectedColor, textColor, done) : createParentFolderRecord(name, selectedColor, textColor, done);
    else editing ? updateSubfolderRecord(parentName, originalName, name, selectedColor, textColor, done) : createSubfolderRecord(parentName, name, selectedColor, textColor, done);
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
