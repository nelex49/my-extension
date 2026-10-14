function showCreateSubfolderModal(parentFolderName, subfolderName = null, anchor = null, onSaved = null, onDeleted = null) {
  return showFolderForm({ kind: 'subfolder', mode: subfolderName === null ? 'create' : 'edit', parentName: parentFolderName, originalName: subfolderName, anchor, onSaved, onDeleted });
}
window.showCreateSubfolderModal = showCreateSubfolderModal;
