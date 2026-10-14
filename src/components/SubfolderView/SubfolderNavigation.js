// Selected parent heading, totals and subfolder filter/list.
function createSubfolderNavigation({ modal, state }) {
  function render() {
    const data = window.folderData || {}, names = Object.keys(data);
    const folderHeading = modal.querySelector(".ysm-nav-heading h3");
    folderHeading.textContent = state.parent === null ? "Your folders" : `${state.parent} folders`;
    folderHeading.title = folderHeading.textContent;
    const headingCount = modal.querySelector('.ysm-heading-count');
    headingCount.hidden = state.parent === null;
    headingCount.textContent = state.parent === null ? '' : `${manageParentCount(data[state.parent])} Subs`;
    const addSubfolder = modal.querySelector('.ysm-add');
    addSubfolder.hidden = state.parent === null;
    addSubfolder.title = state.parent === null ? '' : `Create a subfolder in ${state.parent}`;
    const folderList = modal.querySelector('.ysm-subfolders');
    const parentColour = state.parent === null ? '#354454' : sidebarFolderColour(data[state.parent].color, names.indexOf(state.parent));
    folderList.style.setProperty('--subfolder-fill', lightenColor(parentColour, 8));
    folderList.style.setProperty('--subfolder-active-fill', lightenColor(parentColour, 12));
    folderList.style.setProperty('--subfolder-border', lightenColor(parentColour, 30));
    modal.querySelector('.ysm-heading-icon').style.color = lightenColor(parentColour, 30);
    addSubfolder.style.setProperty('--add-fill', parentColour);
    addSubfolder.style.setProperty('--add-border', lightenColor(parentColour, 30));
    modal.querySelector('.ysm-folder-search-field').hidden = state.parent === null;
    modal.querySelector('.ysm-folder-search-clear').hidden = !state.folderQuery;
    const entries = state.parent === null ? [] : Object.entries(data[state.parent].subfolders || {});
    modal.querySelector(".ysm-subfolders").innerHTML = state.parent === null ?
      `<div class="ysm-uncategorised-help"><strong>Uncategorised channels</strong><p>These channels have no folder assignment. Use Move beside a channel to organise them.</p></div>` :
      ((data[state.parent].subscriptions?.length ? `<button type="button" class="ysm-subfolder ${state.child === null ? 'is-active' : ''}" data-action="direct"><span>Parent channels</span><small>${data[state.parent].subscriptions.length}</small></button>` : "") +
      entries.filter(([name]) => name.toLowerCase().includes(state.folderQuery.trim().toLowerCase())).map(([name, info], index) => {
        const colour = sidebarFolderColour(info.color, index), text = folderTextColour(colour);
        return `<div class="ysm-subfolder-item"><button type="button" class="ysm-subfolder ${state.child === name ? 'is-active' : ''}" data-child="${manageEscape(name)}" aria-pressed="${state.child === name}" title="${manageEscape(name)}" style="--subfolder-fill:${colour};--subfolder-border:${lightenColor(colour,30)};--subfolder-text:${text}">${manageFolderIcon("ysm-folder-icon")}<span>${manageEscape(name)}</span><small>${info.subscriptions?.length || 0}</small></button><button type="button" class="ysm-folder-more" data-action="edit-subfolder" data-edit-child="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`;
      }).join("") ||
      `<p class="ysm-empty">${entries.length ? 'No matching folders.' : 'No subfolders yet. Use + Subfolder to create one.'}</p>`);
  }
  return { render };
}
