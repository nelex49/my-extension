/** @format */

// FolderDropdown component for YouTube Subscription Manager

function toggleFolderDropdown() {
  if (folderDropdown) {
    // Toggle existing dropdown
    const currentDisplay = folderDropdown.style.display;
    folderDropdown.style.display =
      folderDropdown.style.display === "none" ? "block" : "none";
  } else {
    // Create new dropdown
    createFolderDropdown();
  }
}

// Create the simple folder dropdown
function createFolderDropdown() {
  // Only migrate old data that doesn't have expanded property
  let needsSave = false;
  Object.keys(folderData).forEach((folderName) => {
    if (
      folderData[folderName] &&
      folderData[folderName].expanded === undefined
    ) {
      folderData[folderName].expanded = false;
      needsSave = true;
    }
  });

  // Save migration changes if any
  if (needsSave) {
    chrome.storage.local.set({ folderData: folderData }, () => {});
  }

  const manageButton = document.querySelector("#yt-manage-guide-entry");
  if (!manageButton) {
    return;
  }

  // Remove existing dropdown if any
  const existingDropdowns = document.querySelectorAll(
    "[id^='yt-folder-dropdown']"
  );
  existingDropdowns.forEach((dropdown) => dropdown.remove());

  // Create dropdown container
  folderDropdown = document.createElement("div");
  folderDropdown.id = "yt-folder-dropdown-" + Date.now();
  folderDropdown.style.cssText = `
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    background: white !important;
    border: 1px solid #ddd !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 10000 !important;
    margin-top: 5px !important;
    padding: 10px !important;
    font-family: 'Roboto', sans-serif !important;
    font-size: 14px !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;

  // Create folder content based on current state
  // Use global folderData to ensure we have the latest data
  const currentFolderData = window.folderData || folderData;
  const folderCount = Object.keys(currentFolderData).length;
  const canCreateMore = isPremium || folderCount < folderLimit;

  folderDropdown.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #1976d2; border-bottom: 1px solid #eee; padding-bottom: 5px;">
      📁 Your Folders ${
        !isPremium ? `(${folderCount}/${folderLimit} free)` : "(Premium)"
      }
    </div>
    <div id="folder-list">
      ${
        folderCount === 0
          ? '<div style="text-align: center; padding: 20px; color: #666;"><p>No folders yet!</p><p style="font-size: 12px;">Create your first folder to organize your subscriptions</p></div>'
          : Object.entries(currentFolderData)
              .map(([folderName, folderInfo]) => {
                const totalSubs =
                  folderInfo.subscriptions.length +
                  Object.values(folderInfo.subfolders || {}).reduce(
                    (sum, sub) => sum + sub.subscriptions.length,
                    0
                  );
                const expandIcon = folderInfo.expanded ? "▼" : "▶";

                return `
                    <div class="parent-folder-container">
                      <div class="folder-item parent-folder" data-folder="${folderName}" style="background-color: ${
                  folderInfo.color || "#1976d2"
                } !important; border-radius: 4px; margin: 2px 0; position: relative; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; min-height: 40px; cursor: pointer;">
                        <span class="folder-content" style="display: flex; align-items: center; flex: 1; min-width: 0;">
                          <span class="expand-icon" style="margin-right: 8px; font-size: 14px; cursor: pointer; background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; color: #ffffff;" title="Click to expand/collapse">${expandIcon}</span>
                          <span class="folder-name" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; color: ${
                            folderInfo.textColor || "#ffffff"
                          };" title="${folderName}">${folderName}</span>
                        </span>
                        <span class="folder-actions" style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
                          <span style="font-size: 9px; color: ${
                            folderInfo.textColor || "#ffffff"
                          }; opacity: 0.8; margin-bottom: 1px; font-weight: bold;">subs</span>
                          <span class="count" style="font-size: 11px; color: ${
                            folderInfo.textColor || "#ffffff"
                          };">(${totalSubs})</span>
                        </span>
                      </div>
                      ${
                        folderInfo.expanded
                          ? `
                        <div class="subfolders-container" style="margin-left: 16px; margin-top: 2px;">
                          ${Object.entries(folderInfo.subfolders || {})
                            .map(([subName, subInfo]) => {
                              return `
                              <div class="folder-item subfolder" data-folder="${folderName}" data-subfolder="${subName}" style="background-color: ${
                                subInfo.color || "#6c757d"
                              }; border-radius: 4px; margin: 2px 0; padding: 8px 12px; font-size: 14px; display: flex; align-items: center; justify-content: space-between; min-height: 40px;">
                                <span class="folder-content" style="display: flex; align-items: center; flex: 1; min-width: 0;">
                                  <span class="folder-icon" style="background-color: rgba(255,255,255,0.2); border-radius: 50%; padding: 3px 5px; margin-right: 8px; display: inline-block; font-size: 12px; flex-shrink: 0; color: #ffffff;">${
                                    subInfo.icon || "📂"
                                  }</span>
                                  <span class="folder-name" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; color: ${
                                    subInfo.textColor || "#ffffff"
                                  };" title="${subName}">${subName}</span>
                                </span>
                                <span class="folder-actions" style="display: flex; align-items: center; flex-shrink: 0;">
                                  <button class="quick-view-subfolder-btn" data-folder="${folderName}" data-subfolder="${subName}" style="background: rgba(255,255,255,0.2); border: none; border-radius: 3px; padding: 3px 6px; color: #ffffff; cursor: pointer; font-size: 11px; margin-right: 4px; transition: all 0.2s;" title="Quick view subscriptions" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)'">▶️</button>
                                  <span style="display: flex; flex-direction: column; align-items: center;">
                                    <span style="font-size: 8px; color: ${
                                      subInfo.textColor || "#ffffff"
                                    }; opacity: 0.8; margin-bottom: 1px; font-weight: bold;">subs</span>
                                    <span class="count" style="font-size: 11px; color: ${
                                      subInfo.textColor || "#ffffff"
                                    };">(${subInfo.subscriptions.length})</span>
                                  </span>
                                </span>
                              </div>
                            `;
                            })
                            .join("")}
                        </div>
                      `
                          : ""
                      }
                    </div>
                  `;
              })
              .join("")
      }
      
      <!-- Create New Folder Button (styled like a folder item) -->
      ${
        canCreateMore
          ? `<div id="create-folder-item" style="background-color: #f8f9fa; color: #495057; border: 1px solid #dee2e6; border-radius: 4px; margin: 2px 0; cursor: pointer; transition: all 0.2s;">
               <span class="folder-content" style="display: flex; align-items: center; padding: 6px 10px;">
                 <span class="folder-icon" style="background-color: #e9ecef; border-radius: 50%; padding: 3px 5px; margin-right: 6px; display: inline-block; color: #6c757d;">➕</span>
                 <span class="folder-name" style="flex: 1; color: #495057;">${
                   folderCount === 0
                     ? "Create Your First Folder"
                     : "Create New Folder"
                 }</span>
               </span>
             </div>`
          : `<div id="upgrade-premium-item" style="background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; border-radius: 4px; margin: 2px 0; cursor: pointer; transition: all 0.2s;">
               <span class="folder-content" style="display: flex; align-items: center; padding: 6px 10px;">
                 <span class="folder-icon" style="background-color: #ffeaa7; border-radius: 50%; padding: 3px 5px; margin-right: 6px; display: inline-block;">⭐</span>
                 <span class="folder-name" style="flex: 1; color: #856404;">Upgrade to Premium (${folderCount}/${folderLimit})</span>
               </span>
             </div>`
      }
    </div>
    
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; text-align: center;">
        <button id="view-all-subs" style="background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 6px; margin: 0 auto; box-shadow: 0 2px 4px rgba(108,117,125,0.3);">
          <span style="font-size: 14px;">▶️</span>
          <span>Organize Subs</span>
        </button>
    </div>
  `;

  // Position the dropdown
  manageButton.style.position = "relative";
  manageButton.appendChild(folderDropdown);

  // Add styles for folder items
  const style = document.createElement("style");
  style.textContent = `
    #yt-folder-dropdown .folder-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      margin: 2px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    #yt-folder-dropdown .folder-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    #yt-folder-dropdown .folder-content {
      display: flex;
      align-items: center;
    }
    #yt-folder-dropdown .folder-actions {
      display: flex;
      align-items: center;
    }
    #yt-folder-dropdown .folder-icon {
      background-color: rgba(255,255,255,0.2) !important;
      border-radius: 50%;
      padding: 4px 6px;
      margin-right: 8px;
      display: inline-block;
      font-size: 14px;
    }
    #yt-folder-dropdown .parent-folder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 500;
    }
    #yt-folder-dropdown .subfolder {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%) !important;
      color: white !important;
    }
    #yt-folder-dropdown .quick-view-subfolder-btn:hover {
      background: rgba(255,255,255,0.3) !important;
      transform: scale(1.05);
    }
    #yt-folder-dropdown #view-all-subs:hover {
      background: #5a6268 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(108,117,125,0.4) !important;
    }
  `;
  document.head.appendChild(style);

  // Add click listeners for parent folder items (expand/collapse)
  const parentFolders = folderDropdown.querySelectorAll(".parent-folder");
  parentFolders.forEach((item) => {
    const folderName = item.dataset.folder;
    const expandIcon = item.querySelector(".expand-icon");

    // Expand/collapse functionality
    expandIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFolderExpansion(folderName);
    });

    // Click on folder to show subscriptions
    item.addEventListener("click", (e) => {
      if (e.target !== expandIcon) {
        showFolderSubscriptions(folderName);
      }
    });

    // Right-click on parent folder to show context menu
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFolderContextMenu(e, folderName, "parent");
    });
  });

  // Add click listeners for subfolder items
  const subfolders = folderDropdown.querySelectorAll(".subfolder");
  subfolders.forEach((item) => {
    const folderName = item.dataset.folder;
    const subfolderName = item.dataset.subfolder;

    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("quick-view-subfolder-btn")) {
        showSubfolderSubscriptions(folderName, subfolderName);
      }
    });

    // Quick view button
    const quickViewBtn = item.querySelector(".quick-view-subfolder-btn");
    if (quickViewBtn) {
      quickViewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSubfolderSubscriptions(folderName, subfolderName);
      });
    }

    // Right-click on subfolder to show context menu
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFolderContextMenu(e, folderName, "subfolder", subfolderName);
    });
  });

  // Add click listener for create folder button
  const createFolderItem = folderDropdown.querySelector("#create-folder-item");
  if (createFolderItem) {
    createFolderItem.addEventListener("click", () => {
      showUnifiedFolderManager();
    });
  }

  // Add click listener for upgrade premium button
  const upgradePremiumItem = folderDropdown.querySelector(
    "#upgrade-premium-item"
  );
  if (upgradePremiumItem) {
    upgradePremiumItem.addEventListener("click", () => {
      // Premium features coming soon
    });
  }

  // Add click listener for "All Subs" button
  const allSubsBtn = folderDropdown.querySelector("#view-all-subs");
  if (allSubsBtn) {
    allSubsBtn.addEventListener("click", () => {
      showAllSubscriptions();
    });
  }
}

function toggleFolderExpansion(folderName) {
  if (folderData[folderName]) {
    folderData[folderName].expanded = !folderData[folderName].expanded;

    // Refresh the dropdown to show/hide subfolders
    refreshFolderDropdown();
  }
}

function refreshFolderDropdown() {
  if (folderDropdown) {
    // Remove the old dropdown
    folderDropdown.remove();
    folderDropdown = null;
  }

  // Create a new one with current state
  createFolderDropdown();

  // Show the new dropdown
  if (folderDropdown) {
    folderDropdown.style.display = "block";
  }
}

function showFolderSubscriptions(folderName) {
  showFolderManagementPanel(folderName);
}

function showFolderManagementPanel(folderName) {
  const folderInfo = folderData[folderName];
  if (!folderInfo) return;

  // Remove any existing management panel
  const existingPanel = document.querySelector("#folder-management-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement("div");
  panel.id = "folder-management-panel";
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 10001;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  `;

  const totalSubs =
    folderInfo.subscriptions.length +
    Object.values(folderInfo.subfolders || {}).reduce(
      (sum, sub) => sum + sub.subscriptions.length,
      0
    );

  panel.innerHTML = `
    <div id="panel-header" style="background: linear-gradient(135deg, ${
      folderInfo.color
    }, ${lightenColor(
    folderInfo.color,
    20
  )}); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative; cursor: move;">
      <button id="close-management-panel" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
        <span style="font-size: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; display: inline-block;">📁</span>
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${folderName}</h2>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">${totalSubs} total subscriptions</p>
        </div>
      </div>
    </div>

    <div style="padding: 20px;">
      <!-- Action Buttons -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 25px;">
        <button id="edit-folder" style="background: #6f42c1; color: white; border: none; border-radius: 8px; padding: 12px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span>✏️</span>
          <span>Edit Folder</span>
        </button>
        <button id="view-subscriptions" style="background: #007bff; color: white; border: none; border-radius: 8px; padding: 12px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span>📺</span>
          <span>View Subscriptions</span>
        </button>
        <button id="add-subfolder" style="background: #28a745; color: white; border: none; border-radius: 8px; padding: 12px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span style="color: white !important; font-size: 16px; font-weight: bold;">+</span>
          <span>Add Subfolder</span>
        </button>
        <button id="delete-folder" style="background: #dc3545; color: white; border: none; border-radius: 8px; padding: 12px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span>🗑️</span>
          <span>Delete Folder</span>
        </button>
      </div>

      <!-- Subfolders Section -->
      <div>
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          <span>📁</span>
          <span>Subfolders (${
            Object.keys(folderInfo.subfolders || {}).length
          })</span>
        </h3>
        
        ${
          Object.keys(folderInfo.subfolders || {}).length === 0
            ? '<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;"><p style="margin: 0;">No subfolders yet</p><p style="margin: 5px 0 0 0; font-size: 12px;">Click "Add Subfolder" to create one</p></div>'
            : `<div style="display: grid; gap: 8px;">
               ${Object.entries(folderInfo.subfolders || {})
                 .map(
                   ([subName, subInfo]) => `
                 <div class="subfolder-item" data-folder="${folderName}" data-subfolder="${subName}" style="background: ${
                     subInfo.color
                   }; color: ${
                     subInfo.textColor || "#ffffff"
                   }; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;">
                   <div style="display: flex; align-items: center; gap: 10px;">
                     <span style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 6px; font-size: 14px;">${
                       subInfo.icon
                     }</span>
                     <div>
                       <div style="font-weight: 500; font-size: 14px;">${subName}</div>
                       <div style="font-size: 12px; opacity: 0.9;">${
                         subInfo.subscriptions.length
                       } subscriptions</div>
                     </div>
                   </div>
                   <div style="display: flex; gap: 8px;">
                     <button class="view-subfolder" data-folder="${folderName}" data-subfolder="${subName}" style="background: rgba(255,255,255,0.2); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">View</button>
                     <button class="edit-subfolder" data-folder="${folderName}" data-subfolder="${subName}" style="background: rgba(0,123,255,0.8); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">Edit</button>
                     <button class="delete-subfolder" data-folder="${folderName}" data-subfolder="${subName}" style="background: rgba(220,53,69,0.8); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">Delete</button>
                   </div>
                 </div>
               `
                 )
                 .join("")}
             </div>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Make panel draggable
  makePanelDraggable(panel, "#panel-header");

  // Add event listeners
  panel
    .querySelector("#close-management-panel")
    .addEventListener("click", () => {
      panel.remove();
    });

  panel.querySelector("#edit-folder").addEventListener("click", () => {
    panel.remove();
    showUnifiedFolderManager(folderName, "edit");
  });

  panel.querySelector("#view-subscriptions").addEventListener("click", () => {
    panel.remove();
    showAllSubscriptions();
  });

  panel.querySelector("#add-subfolder").addEventListener("click", () => {
    panel.remove();
    showCreateSubfolderModal(folderName);
  });

  panel.querySelector("#delete-folder").addEventListener("click", () => {
    panel.remove();
    deleteParentFolder(folderName);
  });

  // Subfolder event listeners
  panel.querySelectorAll(".view-subfolder").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folder = btn.dataset.folder;
      const subfolder = btn.dataset.subfolder;
      panel.remove();
      showSubfolderSubscriptions(folder, subfolder);
    });
  });

  panel.querySelectorAll(".edit-subfolder").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folder = btn.dataset.folder;
      const subfolder = btn.dataset.subfolder;
      panel.remove();
      showCreateSubfolderModal(folder, subfolder);
    });
  });

  panel.querySelectorAll(".delete-subfolder").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folder = btn.dataset.folder;
      const subfolder = btn.dataset.subfolder;
      panel.remove();
      deleteSubfolder(folder, subfolder);
    });
  });

  // Close on outside click
  panel.addEventListener("click", (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
}

// Helper function to find where a subscription is currently located
function findSubscriptionLocation(channelId) {
  for (const [folderName, folderInfo] of Object.entries(folderData)) {
    if (folderInfo.subfolders) {
      for (const [subfolderName, subfolderInfo] of Object.entries(
        folderInfo.subfolders
      )) {
        if (subfolderInfo.subscriptions) {
          const found = subfolderInfo.subscriptions.find(
            (sub) => sub.snippet?.resourceId?.channelId === channelId
          );
          if (found) {
            return `${folderName} > ${subfolderName}`;
          }
        }
      }
    }
  }
  return "Not organized";
}

// Helper function to lighten colors for subfolders
function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function showSubfolderSubscriptions(folderName, subfolderName) {
  const folderInfo = folderData[folderName];
  const subfolderInfo = folderInfo?.subfolders?.[subfolderName];
  const subscriptions = subfolderInfo ? subfolderInfo.subscriptions : [];

  // Create a modal to show subfolder contents
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 500px; max-height: 400px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <!-- Modern Header -->
      <div id="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative; cursor: move;">
        <button id="close-subfolder-modal" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <div style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 18px;">📁</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">${folderName} > ${subfolderName}</h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 400;">${
              subscriptions.length
            } subscriptions in this folder</p>
          </div>
        </div>
        <!-- Drag indicator -->
        <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;">
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
        </div>
      </div>
      
      <!-- Content Area -->
      <div style="padding: 20px; max-height: 300px; overflow-y: auto;">
        ${
          subscriptions.length === 0
            ? `<div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📁</div>
                <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 16px; font-weight: 600;">No subscriptions yet</h4>
                <p style="margin: 0 0 20px 0; color: #6c757d; font-size: 14px;">This subfolder is empty. Add subscriptions to organize them!</p>
                <button id="add-subscriptions-to-folder" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                  <span style="margin-right: 8px;">📺</span>
                  Add Subscriptions
                </button>
              </div>`
            : subscriptions
                .map(
                  (sub) => `
              <div class="subscription-item" data-channel-id="${
                sub.snippet?.resourceId?.channelId || ""
              }" style="padding: 12px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: flex-start; gap: 12px; background: #fafafa; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <img src="${
                  sub.snippet?.thumbnails?.default?.url || ""
                }" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e0e0e0; flex-shrink: 0;" onerror="this.style.display='none'">
                <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                  <div style="font-weight: 600; color: #333; font-size: 14px; cursor: pointer; margin-bottom: 4px;" class="channel-name">
                    ${sub.snippet?.title || "Unknown Channel"}
                  </div>
                  <div class="channel-description" style="font-size: 12px; color: #666; line-height: 1.4; display: none; margin-bottom: 8px;">
                    ${sub.snippet?.description || "No description available"}
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <button class="toggle-description" style="background: #e3f2fd; color: #1976d2; border: 1px solid #bbdefb; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#bbdefb'" onmouseout="this.style.background='#e3f2fd'">
                      Show Description
                    </button>
                    <button class="remove-from-subfolder" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#ffcdd2'" onmouseout="this.style.background='#ffebee'" title="Remove from this folder only (keeps subscription)">
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            `
                )
                .join("")
        }
      </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Make modal draggable
  setTimeout(() => {
    const header = modal.querySelector("#modal-header");
    const panel = modal.querySelector("div > div"); // Target the inner panel div
    if (header && panel) {
      // Custom dragging implementation for subfolder subscriptions panel
      let isDragging = false;
      let startX, startY, initialX, initialY;

      // Initialize position
      const rect = panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      // Set cursor
      header.style.cursor = "move";

      // Mouse down
      header.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "BUTTON") return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        header.style.cursor = "grabbing";

        // Change panel to absolute positioning for dragging
        panel.style.position = "absolute";
        panel.style.left = `${initialX}px`;
        panel.style.top = `${initialY}px`;
        panel.style.transform = "none";

        e.preventDefault();
      });

      // Mouse move
      const handleMouseMove = (e) => {
        if (isDragging) {
          e.preventDefault();
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const newX = initialX + deltaX;
          const newY = initialY + deltaY;

          panel.style.left = `${newX}px`;
          panel.style.top = `${newY}px`;
        }
      };

      // Mouse up
      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          header.style.cursor = "move";

          // Update initial position
          const rect = panel.getBoundingClientRect();
          initialX = rect.left;
          initialY = rect.top;
        }
      };

      // Add event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      logStatus("Subfolder subscriptions panel made draggable", "info");
    } else {
      logStatus(
        "Could not find subfolder header or panel for dragging",
        "warn"
      );
    }
  }, 10);

  // Close modal functionality
  const closeBtn = modal.querySelector("#close-subfolder-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Channel name click to go to channel
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("channel-name")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const channelId = subscriptionItem.dataset.channelId;
      if (channelId) {
        window.open(`https://www.youtube.com/channel/${channelId}`, "_blank");
      }
    }

    // Toggle description functionality
    if (e.target.classList.contains("toggle-description")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const description = subscriptionItem.querySelector(
        ".channel-description"
      );
      const button = e.target;

      if (description.style.display === "none" || !description.style.display) {
        description.style.display = "block";
        button.textContent = "Hide Description";
      } else {
        description.style.display = "none";
        button.textContent = "Show Description";
      }
    }

    // Remove functionality
    if (e.target.classList.contains("remove-from-subfolder")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const channelId = subscriptionItem.dataset.channelId;

      if (channelId) {
        // Remove from subfolder
        removeFromSubfolder(channelId, folderName, subfolderName);
        // Refresh the modal
        modal.remove();
        showSubfolderSubscriptions(folderName, subfolderName);
      }
    }

    // Add subscriptions button
    if (e.target.id === "add-subscriptions-to-folder") {
      modal.remove();
      showAllSubscriptions();
    }
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showAllSubscriptions() {
  // Try to load subscriptions from storage if they're not loaded
  if (userSubscriptions.length === 0) {
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
        // Check if this is test data and clear it
        const firstSub = result.userSubscriptions[0];
        if (
          firstSub.snippet?.title === "Test Channel 1" ||
          firstSub.snippet?.resourceId?.channelId === "UC123"
        ) {
          // Clear test data from storage
          chrome.storage.local.remove(["userSubscriptions"], () => {
            showLoginPrompt();
          });
          return;
        }

        userSubscriptions = result.userSubscriptions;
        // Recursively call this function now that we have data
        showAllSubscriptions();
        return;
      } else {
        showLoginPrompt();
        return;
      }
    });
    return;
  }

  // Remove any existing modals first
  const existingModal = document.querySelector("#all-subs-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "all-subs-modal";
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
    <div id="subscription-manager-panel" style="background: white; border-radius: 12px; padding: 0; max-width: 600px; max-height: 500px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
      <!-- Draggable Header -->
      <div id="panel-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; cursor: move; user-select: none; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 22px;">▶️</span>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Subscription Manager</h3>
              <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 400;">${
                userSubscriptions.length
              } channels organized</p>
            </div>
          </div>
          <button id="close-all-modal" style="background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: white; transition: all 0.2s; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
        </div>
        <!-- Drag indicator -->
        <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;">
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
          <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 50%;"></div>
        </div>
      </div>
      
      <!-- Content Area -->
      <div style="padding: 20px; max-height: 400px; overflow-y: auto; position: relative;">
        <!-- Sticky instruction text -->
        <div style="position: sticky; top: 0; background: white; padding: 15px 0; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; z-index: 10;">
          <p style="color: #666; font-size: 14px; margin: 0; font-weight: 500;">Organize your subscriptions by moving them to folders!</p>
        </div>
        <div id="all-subscriptions">
        ${userSubscriptions
          .map((sub) => {
            const channelId = sub.snippet?.resourceId?.channelId;
            const location = findSubscriptionLocation(channelId);
            const isOrganized = location !== "Not organized";
            const locationBg = isOrganized ? "#e8f5e8" : "#e3f2fd";
            const locationColor = isOrganized ? "#2e7d32" : "#1976d2";

            return `
        <div class="subscription-item" data-channel-id="${channelId}" style="display: flex; align-items: center; padding: 16px; background: #fafafa; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e0e0e0; gap: 12px;">
          <img src="${
            sub.snippet?.thumbnails?.default?.url || ""
          }" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e0e0; flex-shrink: 0;" onerror="this.style.display='none'">
          <div style="flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden;">
            <div style="font-weight: 600; color: #333; margin-bottom: 8px; cursor: pointer; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" class="channel-name" title="${
              sub.snippet?.title || "Unknown Channel"
            }">
              ${sub.snippet?.title || "Unknown Channel"}
            </div>
            <div style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 8px;">
              <span class="folder-location" style="background: ${locationBg}; color: ${locationColor}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                📁 ${location}
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <select class="folder-select" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; background: white; font-size: 11px; min-width: 160px; max-width: 160px; font-weight: 500;">
              <option value="">📂 Move to folder...</option>
              ${
                Object.keys(folderData).length > 0
                  ? Object.entries(folderData)
                      .map(([folderName, folderInfo]) => {
                        let options = "";
                        if (folderInfo.subfolders) {
                          Object.keys(folderInfo.subfolders).forEach(
                            (subfolderName) => {
                              options += `<option value="subfolder:${folderName}:${subfolderName}">📂 ${folderName} > ${subfolderName}</option>`;
                            }
                          );
                        }
                        return options;
                      })
                      .join("")
                  : '<option value="" disabled>No folders available - Create folders first</option>'
              }
            </select>
            <button class="remove-subscription" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 8px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 80px; position: relative;" onmouseover="this.style.background='#ffcdd2'" onmouseout="this.style.background='#ffebee'" title="Remove from current folder only (keeps subscription)">
              🗑️ Remove
            </button>
          </div>
        </div>
        `;
          })
          .join("")}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Show modal immediately with loading state
  modal.style.display = "flex";

  // Make panel draggable
  const panel = modal.querySelector("#subscription-manager-panel");
  makePanelDraggable(panel, "#panel-header");

  // Add close handler
  const closeBtn = modal.querySelector("#close-all-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Add click handlers for subscription items
  modal.addEventListener("click", (e) => {
    const subscriptionItem = e.target.closest(".subscription-item");

    // Handle channel name clicks
    if (e.target.classList.contains("channel-name")) {
      const channelId = subscriptionItem.dataset.channelId;
      if (channelId) {
        window.open(`https://www.youtube.com/channel/${channelId}`, "_blank");
      }
    }

    // Handle remove subscription clicks
    if (e.target.classList.contains("remove-subscription")) {
      const channelId = subscriptionItem.dataset.channelId;
      if (channelId) {
        // Remove from all folders (but keep the subscription)
        removeSubscriptionFromAllFolders(channelId);

        // Update the location display to show "Not organized"
        const locationSpan = subscriptionItem.querySelector(".folder-location");
        if (locationSpan) {
          locationSpan.textContent = "📁 Not organized";
          locationSpan.style.background = "#f5f5f5";
          locationSpan.style.color = "#666";
        }

        // Save updated data
        safeSaveFolderData(folderData);

        // Refresh folder dropdown to update counters
        refreshFolderDropdown();

        // Refresh the modal to show updated locations
        setTimeout(() => {
          modal.remove();
          showAllSubscriptions();
        }, 300);
      }
    }
  });

  // Add change handlers for folder selects
  modal.addEventListener("change", (e) => {
    if (e.target.classList.contains("folder-select")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const channelId = subscriptionItem.dataset.channelId;
      const selectedValue = e.target.value;

      if (channelId && selectedValue) {
        if (selectedValue.startsWith("subfolder:")) {
          const [, folderName, subfolderName] = selectedValue.split(":");
          addToSubfolder(channelId, folderName, subfolderName);

          // Update the location display immediately
          const locationSpan =
            subscriptionItem.querySelector(".folder-location");
          if (locationSpan) {
            locationSpan.textContent = `📁 ${folderName} > ${subfolderName}`;
            locationSpan.style.background = "#e8f5e8";
            locationSpan.style.color = "#2e7d32";
          }
        }
        // Reset selection
        e.target.value = "";
        // Refresh the modal to show updated folder locations after a longer delay
        setTimeout(() => {
          modal.remove();
          showAllSubscriptions();
        }, 500);
      }
    }
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show context menu for folder management
function showFolderContextMenu(event, folderName, type, subfolderName = null) {
  // Remove any existing context menu
  const existingMenu = document.querySelector("#folder-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement("div");
  menu.id = "folder-context-menu";
  menu.style.cssText = `
    position: fixed;
    top: ${event.clientY}px;
    left: ${event.clientX}px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    min-width: 150px;
    padding: 4px 0;
  `;

  const isParent = type === "parent";
  const displayName = isParent
    ? folderName
    : `${folderName} > ${subfolderName}`;

  menu.innerHTML = `
    <div style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; color: #666; font-weight: 500;">
      ${displayName}
    </div>
    ${
      isParent
        ? `
      <div class="context-menu-item" data-action="add-subfolder" style="padding: 8px 12px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <span>➕</span>
        <span>Add Subfolder ${
          Object.keys(folderData[folderName]?.subfolders || {}).length >= 2
            ? "(Limit Reached)"
            : `(${
                Object.keys(folderData[folderName]?.subfolders || {}).length
              }/2)`
        }</span>
      </div>
    `
        : ""
    }
    <div class="context-menu-item" data-action="delete" style="padding: 8px 12px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; color: #dc3545;">
      <span>🗑️</span>
      <span>Delete ${isParent ? "Folder" : "Subfolder"}</span>
    </div>
  `;

  // Add hover effects
  const style = document.createElement("style");
  style.textContent = `
    .context-menu-item:hover {
      background-color: #f8f9fa !important;
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(menu);

  // Add click handlers
  menu.addEventListener("click", (e) => {
    const action = e.target.closest(".context-menu-item")?.dataset.action;
    if (action === "delete") {
      if (isParent) {
        deleteParentFolder(folderName);
      } else {
        deleteSubfolder(folderName, subfolderName);
      }
    } else if (action === "add-subfolder") {
      // Check limit before showing modal
      if (Object.keys(folderData[folderName]?.subfolders || {}).length >= 2) {
        alert(
          "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!"
        );
        return;
      }
      showCreateSubfolderModal(folderName);
    }
    menu.remove();
    style.remove();
  });

  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      style.remove();
      document.removeEventListener("click", closeMenu);
    }
  };
  setTimeout(() => document.addEventListener("click", closeMenu), 100);
}

// Make them globally available
window.toggleFolderDropdown = toggleFolderDropdown;
window.createFolderDropdown = createFolderDropdown;
window.toggleFolderExpansion = toggleFolderExpansion;
window.refreshFolderDropdown = refreshFolderDropdown;
window.showFolderSubscriptions = showFolderSubscriptions;
window.showFolderManagementPanel = showFolderManagementPanel;
window.lightenColor = lightenColor;
window.showSubfolderSubscriptions = showSubfolderSubscriptions;
window.showAllSubscriptions = showAllSubscriptions;
window.showFolderContextMenu = showFolderContextMenu;
