// Folder mutations and persistence. UI entry points remain compatible during the refactor.
function deleteParentFolder(folderName) {
  if (
    confirm(
      `Are you sure you want to delete the folder "${folderName}" and all its subfolders?`
    )
  ) {
    const currentFolderData = window.folderData || {};
    delete currentFolderData[folderName];

    // Update global variable
    window.folderData = currentFolderData;

    // Save updated data to storage
    chrome.storage.local.set({ folderData: currentFolderData }, () => {});

    // Refresh dropdown only when deleting folders (this is necessary)
    refreshFolderDropdown();
  }
}

function deleteSubfolder(folderName, subfolderName) {
  if (
    confirm(
      `Are you sure you want to delete the subfolder "${subfolderName}" from "${folderName}"?`
    )
  ) {
    if (folderData[folderName]?.subfolders?.[subfolderName]) {
      delete folderData[folderName].subfolders[subfolderName];

      // Save updated data to storage
      safeSaveFolderData(folderData);

      // Update the global variable to keep it in sync
      window.folderData = folderData;

      // Refresh the dropdown to show updated counters
      setTimeout(() => {
        if (typeof window.refreshFolderDropdown === "function") {
          window.refreshFolderDropdown();
        }
      }, 100);

      // Show success message
      if (typeof showUserNotification === "function") {
        showUserNotification(
          `Subfolder "${subfolderName}" deleted successfully`,
          "success"
        );
      }
    }
  }
}

// Helper functions needed for the unified folder manager
function updateFolderName(oldName, newName, color, textColor) {
  if (folderData[newName]) {
    showUserNotification("A folder with this name already exists", "error");
    return;
  }

  // Create new folder with new name
  folderData[newName] = {
    ...folderData[oldName],
    color: color,
    textColor: textColor,
  };

  // Delete old folder
  delete folderData[oldName];

  // Save to storage
  chrome.storage.local.set({ folderData: folderData }, () => {});

  // Refresh dropdown when renaming folders (this is necessary)
  refreshFolderDropdown();
}

function updateFolderProperties(folderName, color, textColor) {
  if (folderData[folderName]) {
    folderData[folderName].color = color;
    folderData[folderName].textColor = textColor;

    // Save to storage
    chrome.storage.local.set({ folderData: folderData }, () => {});

    // Update all subfolder colors to match new parent color
    if (folderData[folderName].subfolders) {
      const subfolderEntries = Object.entries(
        folderData[folderName].subfolders
      );
      subfolderEntries.forEach(([subName, subInfo], index) => {
        // Create different variations for each subfolder
        const variations = [30, 15, 40, -10]; // Light, Medium, Pastel, Muted
        const variation = variations[index % variations.length];
        subInfo.color = lightenColor(color, variation);
      });
    }

    // Refresh dropdown to show updated colors
    if (typeof window.refreshFolderDropdown === "function") {
      window.refreshFolderDropdown();
    }
  }
}

function createSubfolder(
  parentFolderName,
  subfolderName,
  icon,
  color,
  textColor = "#ffffff"
) {
  if (!folderData[parentFolderName].subfolders) {
    folderData[parentFolderName].subfolders = {};
  }

  folderData[parentFolderName].subfolders[subfolderName] = {
    subscriptions: [],
    color: color,
    icon: icon,
    textColor: textColor,
  };

  // Save to storage
  safeSaveFolderData(folderData);

  // Update the global variable to keep it in sync
  window.folderData = folderData;

  // Refresh the dropdown to show the new subfolder
  setTimeout(() => {
    if (typeof window.refreshFolderDropdown === "function") {
      window.refreshFolderDropdown();
    }
  }, 100);
}


Object.assign(window, { deleteParentFolder, deleteSubfolder, updateFolderName, updateFolderProperties, createSubfolder });

// The parent create dialog retains its existing save callback and rollback behaviour.
function createParentFolderRecord(name, color, textColor, done) {
  if (Object.hasOwn(folderData, name)) {
    showUserNotification('A folder with this name already exists', 'error');
    done(false); return;
  }
  folderData[name] = { subscriptions: [], color, textColor, subfolders: {}, expanded: false };
  window.folderData = folderData;
  chrome.storage.local.set({ folderData }, () => {
    if (chrome.runtime.lastError) {
      delete folderData[name];
      showUserNotification('Could not save the folder. Please try again.', 'error');
      done(false); return;
    }
    refreshFolderDropdown();
    done(true);
  });
}

function updateSubfolderRecord(parentName, oldName, newName, icon, color, textColor) {
  const children = folderData[parentName].subfolders;
  const record = children[oldName];
  Object.assign(record, { icon, color, textColor });
  if (newName !== oldName) { children[newName] = record; delete children[oldName]; }
  safeSaveFolderData(folderData);
  refreshFolderDropdown();
}
