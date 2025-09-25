/** @format */

// SubscriptionDisplay component for YouTube Subscription Manager

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

// Show subfolder subscriptions
function showSubfolderSubscriptions(folderName, subfolderName) {
  // Reload the latest data from storage to ensure accuracy
  chrome.storage.local.get(["folderData"], (result) => {
    const currentFolderData = result.folderData || {};
    const folderInfo = currentFolderData[folderName];
    const subfolderInfo = folderInfo?.subfolders?.[subfolderName];
    const subscriptions = subfolderInfo ? subfolderInfo.subscriptions : [];

    createSubfolderModal(
      folderName,
      subfolderName,
      folderInfo,
      subfolderInfo,
      subscriptions
    );
  });
}

function createSubfolderModal(
  folderName,
  subfolderName,
  folderInfo,
  subfolderInfo,
  subscriptions
) {
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
    <div id="subfolder-panel" style="background: white; border-radius: 12px; padding: 0; max-width: 600px; width: 400px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: width 0.3s ease;">
      <!-- Header -->
      <div id="modal-header" style="background: ${
        subfolderInfo?.color || "#6c757d"
      }; color: ${
    subfolderInfo?.textColor || "#ffffff"
  }; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-subfolder-modal" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">${
            subfolderInfo?.icon || "📂"
          }</span>
          <span>${subfolderName} (${subscriptions.length} subs)</span>
        </h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Subscriptions in this subfolder</p>
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
              }" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; margin-bottom: 8px; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <img src="${
                    sub.snippet?.thumbnails?.default?.url || ""
                  }" alt="Channel Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0;">
                    <div class="channel-name" style="font-weight: 600; font-size: 14px; color: #333; cursor: pointer; margin-bottom: 8px;" title="Click to visit channel">${
                      sub.snippet?.title || "Unknown Channel"
                    }</div>
                    <div class="channel-description" style="font-size: 11px; color: #666; line-height: 1.4; display: none; margin-top: 8px; padding: 10px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; white-space: normal; word-wrap: break-word; max-height: 80px; overflow-y: auto; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); text-align: justify; hyphens: auto;">
                      ${(sub.snippet?.description || "No description available")
                        .replace(/\n/g, "<br>")
                        .replace(/\s+/g, " ")
                        .trim()}
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <button class="visit-channel" style="background: #f0f8ff; color: #5a7ba7; border: 1px solid #d1e7ff; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; flex: 1;" onmouseover="this.style.background='#e6f3ff'" onmouseout="this.style.background='#f0f8ff'" title="Visit this channel on YouTube">
                        ▶️ Visit
                      </button>
                      <button class="toggle-description" style="background: #f8f9fa; color: #6c757d; border: 1px solid #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; flex: 1;" onmouseover="this.style.background='#e9ecef'; this.style.border='1px solid #dee2e6'" onmouseout="this.style.background='#f8f9fa'; this.style.border='1px solid #e9ecef'">
                        📝 Description
                      </button>
                      <button class="remove-from-subfolder" style="background: #fff0f5; color: #a75b7b; border: 1px solid #ffd7e6; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; flex: 1;" onmouseover="this.style.background='#ffe6f0'" onmouseout="this.style.background='#fff0f5'" title="Remove from this folder only (keeps subscription)">
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
                )
                .join("")
        }
      </div>
      
      <!-- Footer with add link (only show if there are subscriptions) -->
      ${
        subscriptions.length > 0
          ? `
      <div style="padding: 16px 20px; border-top: 1px solid #e9ecef; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 0 0 12px 12px; text-align: center;">
        <button id="organize-this-folder" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2); display: inline-flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px rgba(102, 126, 234, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(102, 126, 234, 0.2)'" title="Add new subscriptions to this folder">
          <span style="font-size: 12px; filter: brightness(0) invert(1);">➕</span>
          <span>Add to this folder</span>
        </button>
      </div>
      `
          : ""
      }
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

    // Visit channel button click
    if (e.target.classList.contains("visit-channel")) {
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
        button.textContent = "📝 Description";
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

    // Organize this folder button
    if (
      e.target.id === "organize-this-folder" ||
      e.target.closest("#organize-this-folder")
    ) {
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

// Show all subscriptions for organization
function showAllSubscriptions() {
  // Try to load subscriptions from storage if they're not loaded
  if (userSubscriptions.length === 0) {
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
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
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div id="subscription-manager-panel" style="background: white; border-radius: 12px; padding: 0; max-width: 380px; width: 95%; max-height: 80vh; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: relative; display: flex; flex-direction: column;">
      <!-- Header -->
      <div id="panel-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-all-modal" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: white; transition: all 0.2s; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; padding-right: 50px;">
          <span style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">📺</span>
          <span>Organize Subscriptions (${userSubscriptions.length})</span>
        </h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Move your subscriptions to organized folders</p>
      </div>
      
      <!-- Content Area -->
      <div style="padding: 15px; flex: 1; overflow-y: auto; position: relative;">
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
            const locationBg = isOrganized ? "#e8f5e8" : "#f5f5f5";
            const locationColor = isOrganized ? "#2e7d32" : "#666";

            return `
        <div class="subscription-item" data-channel-id="${channelId}" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 10px; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 10px; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
          <img src="${
            sub.snippet?.thumbnails?.default?.url || ""
          }" alt="Channel Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
          <div style="flex: 1; min-width: 0;">
            <div class="channel-name" style="font-weight: 600; font-size: 14px; color: #333; cursor: pointer; margin-bottom: 8px;" title="Click to visit channel">${
              sub.snippet?.title || "Unknown Channel"
            }</div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <span class="folder-location" style="background: ${locationBg}; color: ${locationColor}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                📁 ${location}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <select class="folder-select" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; background: white; font-size: 11px; min-width: 140px; max-width: 140px; font-weight: 500;">
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
              <button class="remove-subscription" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 6px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 70px; position: relative;" onmouseover="this.style.background='#ffcdd2'" onmouseout="this.style.background='#ffebee'" title="Remove from current folder only (keeps subscription)">
                🗑️ Remove
              </button>
            </div>
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

  // Make panel draggable with custom implementation
  const panel = modal.querySelector("#subscription-manager-panel");
  const header = modal.querySelector("#panel-header");

  setTimeout(() => {
    if (header && panel) {
      // Custom dragging implementation for organize subscriptions panel
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

      logStatus("Organize subscriptions panel made draggable", "info");
    } else {
      logStatus(
        "Could not find organize subscriptions header or panel for dragging",
        "warn"
      );
    }
  }, 10);

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

        // Refresh the dropdown to show updated counters
        setTimeout(() => {
          if (typeof window.refreshFolderDropdown === "function") {
            window.refreshFolderDropdown();
          }
        }, 100);

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
        // Don't refresh the modal immediately - let the counter update work
        // The counter should update automatically via the addToSubfolder function
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

// Make them globally available
window.findSubscriptionLocation = findSubscriptionLocation;
window.showSubfolderSubscriptions = showSubfolderSubscriptions;
window.showAllSubscriptions = showAllSubscriptions;
