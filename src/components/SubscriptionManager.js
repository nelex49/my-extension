/** @format */

// SubscriptionManager component for YouTube Subscription Manager

function createFolder(
  folderName,
  icon = "📁",
  color = "#1976d2",
  textColor = "#ffffff"
) {
  folderData[folderName] = {
    subscriptions: [],
    icon: icon,
    color: color,
    textColor: textColor,
    subfolders: {},
    expanded: false,
  };

  // Save to Chrome storage
  chrome.storage.local.set({ folderData: folderData }, () => {});

  // Button text stays simple

  // Refresh the dropdown
  if (folderDropdown) {
    createFolderDropdown(); // Recreate to show new folder
  } else {
  }
}

// Delete a folder
function deleteFolder(folderName) {
  if (
    confirm(
      `Are you sure you want to delete the "${folderName}" folder? This will remove all subscriptions from this folder.`
    )
  ) {
    delete folderData[folderName];

    // Refresh the dropdown
    if (folderDropdown) {
      createFolderDropdown(); // Recreate to show updated folders
    }
  }
}

// showCreateFolderModal function removed - now using showUnifiedFolderManager from FolderModals.js

function removeSubscriptionFromAllFolders(channelId) {
  let removed = false;

  // Remove from all subfolders only (parent folders don't hold subscriptions directly)
  Object.keys(folderData).forEach((folderName) => {
    if (folderData[folderName].subfolders) {
      Object.keys(folderData[folderName].subfolders).forEach(
        (subfolderName) => {
          const subfolder = folderData[folderName].subfolders[subfolderName];
          if (subfolder && subfolder.subscriptions) {
            const index = subfolder.subscriptions.findIndex(
              (sub) => sub.snippet?.resourceId?.channelId === channelId
            );
            if (index !== -1) {
              subfolder.subscriptions.splice(index, 1);
              removed = true;
              logStatus(
                `Removed subscription from ${folderName}/${subfolderName}`,
                "info"
              );
            }
          }
        }
      );
    }
  });

  if (removed) {
    // Save updated data
    chrome.storage.local.set({ folderData: folderData });
  }

  return removed;
}

// Additional functions needed for subscription management
function removeFromFolder(channelId, folderName) {
  if (folderData[folderName]) {
    folderData[folderName].subscriptions = folderData[
      folderName
    ].subscriptions.filter(
      (sub) => sub.snippet?.resourceId?.channelId !== channelId
    );
    updateFolderCounts();
  }
}

function removeFromSubfolder(channelId, folderName, subfolderName) {
  if (folderData[folderName]?.subfolders?.[subfolderName]) {
    folderData[folderName].subfolders[subfolderName].subscriptions = folderData[
      folderName
    ].subfolders[subfolderName].subscriptions.filter(
      (sub) => sub.snippet?.resourceId?.channelId !== channelId
    );

    // Save to storage
    safeSaveFolderData(folderData);

    // Update folder counts and refresh UI
    updateFolderCounts();
    refreshFolderDropdown();
  }
}

function addToSubfolder(channelId, folderName, subfolderName) {
  const subscription = userSubscriptions.find(
    (sub) => sub.snippet?.resourceId?.channelId === channelId
  );

  if (subscription && folderData[folderName]?.subfolders?.[subfolderName]) {
    // Remove from all other folders first
    removeSubscriptionFromAllFolders(channelId);

    // Add to the specified subfolder
    folderData[folderName].subfolders[subfolderName].subscriptions.push(
      subscription
    );

    // Save to storage
    safeSaveFolderData(folderData);

    // Update folder counts and refresh UI
    updateFolderCounts();
    refreshFolderDropdown();
  }
}

function showLoginPrompt() {
  // Create a login prompt modal
  const modal = document.createElement("div");
  modal.id = "login-prompt-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 30px; max-width: 400px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
      <h3 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Login Required</h3>
      <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.5;">
        Please log in to YouTube to manage your subscriptions.
      </p>
      <button id="close-login-modal" style="background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 500;">
        Got it
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Add close handler
  const closeBtn = modal.querySelector("#close-login-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function updateFolderCounts() {
  if (folderDropdown) {
    // Update parent folder counts
    const parentCounts = folderDropdown.querySelectorAll(
      ".parent-folder .count"
    );
    parentCounts.forEach((count) => {
      const folderItem = count.closest(".folder-item");
      const folderName = folderItem.dataset.folder;
      if (folderData[folderName]) {
        const totalSubs =
          folderData[folderName].subscriptions.length +
          Object.values(folderData[folderName].subfolders || {}).reduce(
            (sum, sub) => sum + sub.subscriptions.length,
            0
          );
        count.textContent = `(${totalSubs})`;
      }
    });

    // Update subfolder counts
    const subfolderCounts =
      folderDropdown.querySelectorAll(".subfolder .count");
    subfolderCounts.forEach((count) => {
      const folderItem = count.closest(".folder-item");
      const folderName = folderItem.dataset.folder;
      const subfolderName = folderItem.dataset.subfolder;
      if (folderData[folderName]?.subfolders?.[subfolderName]) {
        const subCount =
          folderData[folderName].subfolders[subfolderName].subscriptions.length;
        count.textContent = `(${subCount})`;
      }
    });
  }
}

// Additional functions needed for the management panel

function deleteParentFolder(folderName) {
  if (
    confirm(
      `Are you sure you want to delete the folder "${folderName}" and all its subfolders?`
    )
  ) {
    delete folderData[folderName];

    // Save updated data to storage
    chrome.storage.local.set({ folderData: folderData }, () => {});

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
      chrome.storage.local.set({ folderData: folderData }, () => {});

      refreshFolderDropdown();
    }
  }
}

// showEditSubfolderModal function removed - now using showCreateSubfolderModal from FolderModals.js

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

    refreshFolderDropdown();
  }
}

function createSubfolder(
  parentFolderName,
  subfolderName,
  icon,
  color,
  textColor = "#ffffff"
) {
  // Check subfolder limit (2 per parent folder)
  const currentSubfolderCount = Object.keys(
    folderData[parentFolderName].subfolders || {}
  ).length;
  if (currentSubfolderCount >= 2) {
    showUserNotification(
      "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!",
      "warn"
    );
    return;
  }

  if (!folderData[parentFolderName].subfolders) {
    folderData[parentFolderName].subfolders = {};
  }

  folderData[parentFolderName].subfolders[subfolderName] = {
    subscriptions: [],
    color: color,
    icon: icon,
    textColor: textColor,
  };

  refreshFolderDropdown();
}

// Helper functions for color manipulation
function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;
  return (
    "#" +
    (
      0x1000000 +
      (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)
  );
}

function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

function generateRandomColor() {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Make them globally available
window.createFolder = createFolder;
window.deleteFolder = deleteFolder;
window.removeSubscriptionFromAllFolders = removeSubscriptionFromAllFolders;
window.removeFromFolder = removeFromFolder;
window.removeFromSubfolder = removeFromSubfolder;
window.addToSubfolder = addToSubfolder;
window.showLoginPrompt = showLoginPrompt;
window.updateFolderCounts = updateFolderCounts;
window.deleteParentFolder = deleteParentFolder;
window.deleteSubfolder = deleteSubfolder;
// showEditSubfolderModal removed - now using showCreateSubfolderModal from FolderModals.js
window.updateFolderName = updateFolderName;
window.updateFolderProperties = updateFolderProperties;
window.createSubfolder = createSubfolder;
window.darkenColor = darkenColor;
window.getContrastColor = getContrastColor;
window.generateRandomColor = generateRandomColor;
