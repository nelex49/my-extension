// Shared form rendering and bindings. Saved names are always escaped in markup.
function folderDialogEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
const FOLDER_TEXT_COLOURS = [
  ['White', '#ffffff'], ['Black', '#000000'], ['Dark Gray', '#333333'],
  ['Light Gray', '#666666'], ['Blue', '#1976d2'], ['Red', '#d32f2f'],
  ['Green', '#388e3c'], ['Orange', '#f57c00'], ['Purple', '#7b1fa2'],
  ['Pink', '#c2185b'], ['Teal', '#00796b'], ['Brown', '#5d4037']
];
const SUBFOLDER_TEXT_COLOURS = [
  ['White', '#ffffff'], ['Black', '#000000'], ['Dark Gray', '#333333'],
  ['Navy', '#1a237e'], ['Dark Blue', '#0d47a1'], ['Dark Green', '#1b5e20'],
  ['Dark Red', '#b71c1c'], ['Dark Purple', '#4a148c'], ['Dark Orange', '#e65100'],
  ['Dark Teal', '#004d40'], ['Dark Brown', '#3e2723'], ['Dark Pink', '#880e4f']
];
function folderColourButtons(options, className, text = false) {
  return options.map(([name, colour]) => `<button type="button" class="ytsm-swatch ${className}" data-color="${colour}" title="${name}" aria-label="${name}">${text ? 'Aa' : ''}</button>`).join('');
}
function bindFolderOptions(modal, selector, key, selected, onChange) {
  const buttons = Array.from(modal.querySelectorAll(selector));
  function update(value) {
    buttons.forEach(button => {
      const active = button.dataset[key] === value;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  buttons.forEach(button => {
    if (key === 'color') {
      button.style.setProperty('--swatch-colour', button.dataset.color);
      button.style.setProperty('--swatch-text', button.dataset.color === '#ffffff' ? '#333' : '#fff');
    }
    button.addEventListener('click', () => { update(button.dataset[key]); onChange(button.dataset[key]); });
  });
  update(selected);
}
function bindFolderName(input, counter, updatePreview) {
  input.addEventListener('input', () => {
    counter.textContent = input.value.length;
    counter.classList.toggle('is-near-limit', input.value.length > 15);
    updatePreview();
  });
}
