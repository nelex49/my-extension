// Folder mutations and persistence. UI code asks this service to mutate records; it does not edit storage directly.
function cloneFolderData(data = window.folderData || {}) { return JSON.parse(JSON.stringify(data)); }
function replaceFolderData(data) { folderData = data; window.folderData = data; }
function prepareManageFolderRename(rename, reverse = false) {
  if (!rename) return;
  const oldName = reverse ? rename.newName : rename.oldName;
  const newName = reverse ? rename.oldName : rename.newName;
  if (rename.parentName !== undefined) window.prepareManageSubfolderRename?.(rename.parentName, oldName, newName);
  else window.prepareManageParentRename?.(oldName, newName);
}
let folderSavePending = false;
function persistFolderMutation(nextData, previousData, done, rename = null) {
  if (typeof window.accountIsReady === 'function' && !window.accountIsReady()) {
    showUserNotification('Verify the linked account through the extension popup before saving.', 'error');
    done?.(false); return false;
  }
  if (folderSavePending) {
    showUserNotification("A folder change is still saving. Please try again when it finishes.", "warn");
    done?.(false); return false;
  }
  folderSavePending = true;
  // Selection must follow renamed keys before Chrome emits storage notifications.
  prepareManageFolderRename(rename);
  let completed = false;
  function finish(success) {
    if (completed) return;
    completed = true; folderSavePending = false;
    if (success) replaceFolderData(nextData);
    else {
      replaceFolderData(previousData); prepareManageFolderRename(rename, true);
      showUserNotification("Could not save folder changes. Your existing data was kept.", "error");
    }
    if (typeof window.refreshFolderDropdown === "function") window.refreshFolderDropdown();
    if (typeof window.refreshManageView === "function") window.refreshManageView();
    done?.(success);
  }
  try {
    chrome.storage.local.set({ folderData: nextData }, () => finish(!chrome.runtime.lastError));
  } catch (error) { finish(false); }
  return true;
}
function createParentFolderRecord(name, color, textColor, done) {
  const current = window.folderData || {};
  if (Object.hasOwn(current, name)) { showUserNotification("A folder with this name already exists", "error"); done?.(false); return; }
  if (!requireFolderCreation('parent')) { done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current);
  next[name] = { subscriptions: [], color, textColor, subfolders: {}, expanded: false };
  persistFolderMutation(next, previous, done);
}
function updateParentFolderRecord(oldName, newName, color, textColor, done) {
  const current = window.folderData || {};
  if (!current[oldName]) { showUserNotification("That folder no longer exists", "error"); done?.(false); return; }
  if (newName !== oldName && Object.hasOwn(current, newName)) { showUserNotification("A folder with this name already exists", "error"); done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current);
  const record = next[oldName]; record.color = color; record.textColor = textColor;
  if (newName !== oldName) {
    // Replace the key in place; assigning a new key at the end reorders the tabs.
    const ordered = {};
    for (const key of Object.keys(next)) ordered[key === oldName ? newName : key] = key === oldName ? record : next[key];
    persistFolderMutation(ordered, previous, done, { oldName, newName });
    return;
  }
  persistFolderMutation(next, previous, done);
}
function createSubfolderRecord(parentName, name, color, textColor, done) {
  const current = window.folderData || {}, parent = current[parentName];
  if (!parent) { showUserNotification("That parent folder no longer exists", "error"); done?.(false); return; }
  if (Object.hasOwn(parent.subfolders || {}, name)) { showUserNotification("A subfolder with this name already exists", "error"); done?.(false); return; }
  if (!requireFolderCreation('subfolder', parentName)) { done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current);
  next[parentName].subfolders ||= {};
  next[parentName].subfolders[name] = { subscriptions: [], color, textColor };
  persistFolderMutation(next, previous, done);
}
function updateSubfolderRecord(parentName, oldName, newName, color, textColor, done) {
  const current = window.folderData || {}, children = current[parentName]?.subfolders || {};
  if (!children[oldName]) { showUserNotification("That subfolder no longer exists", "error"); done?.(false); return; }
  if (newName !== oldName && Object.hasOwn(children, newName)) { showUserNotification("A subfolder with this name already exists", "error"); done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current), nextChildren = next[parentName].subfolders;
  const record = nextChildren[oldName]; record.color = color; record.textColor = textColor;
  if (newName !== oldName) { nextChildren[newName] = record; delete nextChildren[oldName]; }
  persistFolderMutation(next, previous, done, oldName === newName ? null : { parentName, oldName, newName });
}
function deleteParentFolderRecord(name, done) {
  const current = window.folderData || {};
  if (!current[name]) { done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current); delete next[name];
  persistFolderMutation(next, previous, done);
}
function deleteSubfolderRecord(parentName, name, done) {
  const current = window.folderData || {};
  if (!current[parentName]?.subfolders?.[name]) { done?.(false); return; }
  const previous = cloneFolderData(current), next = cloneFolderData(current); delete next[parentName].subfolders[name];
  persistFolderMutation(next, previous, done);
}

// Compatibility entry points retained for older callers while the UI refactor settles.
function createSubfolder(parentName, name, icon, color, textColor = "#ffffff") { createSubfolderRecord(parentName, name, color, textColor); }
function updateFolderName(oldName, newName, color, textColor) { updateParentFolderRecord(oldName, newName, color, textColor); }
function updateFolderProperties(name, color, textColor) { updateParentFolderRecord(name, name, color, textColor); }
function deleteParentFolder(name) { deleteParentFolderRecord(name); }
function deleteSubfolder(parentName, name) { deleteSubfolderRecord(parentName, name); }
Object.assign(window, { createParentFolderRecord, updateParentFolderRecord, createSubfolderRecord, updateSubfolderRecord,
  deleteParentFolderRecord, deleteSubfolderRecord, createSubfolder, updateFolderName, updateFolderProperties, deleteParentFolder, deleteSubfolder });
