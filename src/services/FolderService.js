// Folder mutations and persistence. UI code asks this service to mutate records; it does not edit storage directly.
function cloneFolderData(data = window.folderData || {}) { return JSON.parse(JSON.stringify(data)); }
function replaceFolderData(data) { folderData = data; window.folderData = data; }
function persistFolderMutation(nextData, previousData, done, rename = null) {
  // Keep the Manage selection pointed at the new key before storage notifications render.
  if (rename) window.prepareManageParentRename?.(rename.oldName, rename.newName);
  replaceFolderData(nextData);
  chrome.storage.local.set({ folderData: nextData }, () => {
    if (chrome.runtime.lastError) {
      replaceFolderData(previousData);
      if (rename) window.prepareManageParentRename?.(rename.newName, rename.oldName);
      showUserNotification("Could not save folder changes. Your existing data was kept.", "error");
      done?.(false); return;
    }
    if (typeof window.refreshFolderDropdown === "function") window.refreshFolderDropdown();
    if (typeof window.refreshManageView === "function") window.refreshManageView();
    done?.(true);
  });
}
function createParentFolderRecord(name, color, textColor, done) {
  const current = window.folderData || {};
  if (Object.hasOwn(current, name)) { showUserNotification("A folder with this name already exists", "error"); done?.(false); return; }
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
  persistFolderMutation(next, previous, done);
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
