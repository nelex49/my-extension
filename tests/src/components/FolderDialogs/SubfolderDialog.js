function showCreateSubfolderModal(parentFolderName, subfolderName = null, anchor = null, onSaved = null, onDeleted = null, placement = 'beside') {
  return showFolderForm({ kind: 'subfolder', mode: subfolderName === null ? 'create' : 'edit', parentName: parentFolderName, originalName: subfolderName, anchor, placement, onSaved, onDeleted });
}
window.showCreateSubfolderModal = showCreateSubfolderModal;
