/** @format */

// Complex folder management modals for YouTube Subscription Manager

// Show unified folder manager (for both create and edit modes)
function showUnifiedFolderManager(folderName = null, mode = "create") {
  const isEditMode = mode === "edit" && folderName;
  const folderInfo = isEditMode ? folderData[folderName] : null;

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
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 480px; width: 95%; max-height: 85vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div class="unified-header" style="background: ${
        isEditMode
          ? folderInfo?.color || "#007bff"
          : "linear-gradient(135deg, #007bff, #0056b3)"
      }; color: ${
    isEditMode ? folderInfo?.textColor || "#ffffff" : "white"
  }; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-unified-manager" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        ${
          isEditMode && Object.keys(folderInfo.subfolders || {}).length >= 2
            ? `
        <button id="limit-reached-indicator" style="position: absolute; top: 15px; right: 55px; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; padding: 6px 12px; color: white; cursor: default; font-size: 12px; display: flex; align-items: center; gap: 4px;" title="Maximum subfolders reached">
          <span>⚠️</span>
          <span>Limit Reached</span>
        </button>
        `
            : ""
        }
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
          ${
            isEditMode
              ? `Edit "${folderName || "Folder"}"`
              : "Create New Folder"
          }
        </h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
          ${
            isEditMode
              ? "Modify your folder settings"
              : "Set up your new folder with custom name, icon, and color"
          }
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 15px; display: flex; justify-content: center;">
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 400px;">
          <!-- Folder Settings -->
          <div style="margin-bottom: 20px; width: 100%;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📁</span>
            <span>Folder Settings</span>
          </h3>
          
          <!-- Folder Name and Text Colors Row -->
          <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start;">
            <!-- Folder Name (40% width) -->
            <div style="flex: 0 0 40%; min-width: 180px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Folder Name:</label>
              <input type="text" id="unified-folder-name" value="${
                isEditMode ? folderName : ""
              }" maxlength="20" placeholder="e.g., Gaming, Tech, Music..."
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
              <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
                <span id="unified-char-count">${
                  isEditMode ? folderName.length : 0
                }</span>/20 characters
              </div>
            </div>
            
            <!-- Text Colors (exact width) -->
            <div style="flex: 0 0 auto;">
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">Text Color:</label>
              <div style="display: grid; grid-template-columns: repeat(6, 32px); gap: 4px; width: fit-content;"> <!-- Updated spacing -->
                ${[
                  { name: "White", color: "#ffffff" },
                  { name: "Black", color: "#000000" },
                  { name: "Dark Gray", color: "#333333" },
                  { name: "Light Gray", color: "#666666" },
                  { name: "Blue", color: "#1976d2" },
                  { name: "Red", color: "#d32f2f" },
                  { name: "Green", color: "#388e3c" },
                  { name: "Orange", color: "#f57c00" },
                  { name: "Purple", color: "#7b1fa2" },
                  { name: "Pink", color: "#c2185b" },
                  { name: "Teal", color: "#00796b" },
                  { name: "Brown", color: "#5d4037" },
                ]
                  .map(
                    (textColor) => `
                  <button class="unified-text-color-option" data-color="${
                    textColor.color
                  }" style="padding: 8px; border: 2px solid ${
                      textColor.color ===
                      (isEditMode
                        ? folderInfo.textColor || "#ffffff"
                        : "#ffffff")
                        ? "#007bff"
                        : "#ddd"
                    }; border-radius: 4px; background: ${
                      textColor.color
                    }; cursor: pointer; transition: all 0.2s; color: ${
                      textColor.color === "#ffffff" ||
                      textColor.color === "#f5f5f5"
                        ? "#333"
                        : "#fff"
                    }; font-weight: 500; font-size: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;" title="${
                      textColor.name
                    }">Aa</button>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Preview and Background Colors Row -->
          <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start;">
            <!-- Preview (40% width) -->
            <div style="flex: 0 0 40%; min-width: 180px;">
              <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; border: 1px solid #dee2e6; margin-top: 18px;">
                <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 12px;">Preview:</h4>
                <div id="folder-preview" style="background: ${
                  isEditMode ? folderInfo.color : "#007bff"
                }; color: ${
    isEditMode ? folderInfo.textColor || "#ffffff" : "#ffffff"
  }; border-radius: 4px; padding: 6px 10px; display: flex; align-items: center; gap: 6px; font-size: 13px;">
                  <span id="preview-expand-icon" style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px;">▶</span>
                  <span id="preview-name">${
                    isEditMode ? folderName : "New Folder"
                  }</span>
                </div>
              </div>
            </div>
            
            <!-- Background Colors (60% width, 2 rows) -->
            <div style="flex: 0 0 60%; min-width: 200px; padding-right: 0px;">
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">Background Color:</label>
              <div style="display: grid; grid-template-columns: repeat(6, 32px); gap: 4px; margin-bottom: 8px;"> <!-- Updated spacing -->
                ${[
                  "#ff6b6b",
                  "#4ecdc4",
                  "#9b59b6",
                  "#e74c3c",
                  "#f39c12",
                  "#27ae60",
                  "#3498db",
                  "#34495e",
                  "#e67e22",
                  "#1abc9c",
                  "#f1c40f",
                  "#e91e63",
                ]
                  .map(
                    (color) => `
                  <button class="unified-color-option" data-color="${color}" style="padding: 10px; border: 2px solid ${
                      isEditMode && color === folderInfo.color
                        ? "#007bff"
                        : "#ddd"
                    }; border-radius: 4px; background: ${color}; cursor: pointer; transition: all 0.2s; width: 32px; height: 32px; padding: 0;"></button>
                `
                  )
                  .join("")}
              </div>
              <button style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; color: #666; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'" title="Custom Color Picker (Coming Soon)">
                🎨 Custom Color
              </button>
            </div>
          </div>

        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: -15px; padding-top: 10px; border-top: 1px solid #dee2e6;">
          <button id="cancel-unified" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; transition: all 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">Cancel</button>
          <button id="save-unified" style="padding: 8px 16px; border: none; border-radius: 6px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; cursor: pointer; font-size: 13px; font-weight: 500; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3); transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, #0056b3, #004085)'; this.style.boxShadow='0 3px 6px rgba(0, 91, 179, 0.4)'" onmouseout="this.style.background='linear-gradient(135deg, #007bff, #0056b3)'; this.style.boxShadow='0 2px 4px rgba(0, 123, 255, 0.3)'">
            ${isEditMode ? "Save Changes" : "Create Folder"}
          </button>
        </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add proper event listeners
  const saveBtn = modal.querySelector("#save-unified");
  const cancelBtn = modal.querySelector("#cancel-unified");
  const closeBtn = modal.querySelector("#close-unified-manager");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newFolderName = nameInput.value.trim();
      if (!newFolderName) {
        showUserNotification("Please enter a folder name", "warn");
        return;
      }

      if (isEditMode) {
        if (newFolderName !== folderName) {
          updateFolderName(
            folderName,
            newFolderName,
            selectedColor,
            selectedTextColor
          );
        } else {
          updateFolderProperties(folderName, selectedColor, selectedTextColor);

          // Remove existing dropdown completely
          if (folderDropdown) {
            folderDropdown.remove();
            folderDropdown = null;
          }

          // Create new dropdown with updated data
          createFolderDropdown();
        }
      } else {
        // Create new folder
        const newFolder = {
          name: newFolderName,
          color: selectedColor,
          textColor: selectedTextColor,
          subfolders: {},
        };

        // Add to folderData
        folderData[newFolderName] = newFolder;

        // Save to Chrome storage
        chrome.storage.local.set({ folderData: folderData }, () => {});

        refreshFolderDropdown();
      }
      modal.remove();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.remove();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
  }

  // Make panel draggable
  setTimeout(() => {
    const header = modal.querySelector(".unified-header");
    const panel = modal.querySelector("div > div"); // Target the inner panel div
    if (header && panel) {
      // Custom dragging implementation for unified folder manager
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

      logStatus("Unified folder manager panel made draggable", "info");
    } else {
      logStatus("Could not find unified header or panel for dragging", "warn");
    }
  }, 10);

  // Initialize with current selections
  let selectedColor = isEditMode ? folderInfo.color : "#007bff";
  let selectedTextColor = isEditMode
    ? folderInfo.textColor || "#ffffff"
    : "#ffffff";
  let tempSubfolders = isEditMode ? { ...folderInfo.subfolders } : {};

  // Character counter
  const nameInput = modal.querySelector("#unified-folder-name");
  const charCount = modal.querySelector("#unified-char-count");

  nameInput.addEventListener("input", () => {
    const count = nameInput.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 15 ? "#dc3545" : "#666";
    updatePreview();
  });

  // Color selection
  modal.querySelectorAll(".unified-color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".unified-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedColor = btn.dataset.color;
      updatePreview();
    });
  });

  // Text color selection
  modal.querySelectorAll(".unified-text-color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".unified-text-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedTextColor = btn.dataset.color;
      updatePreview();
    });
  });

  // Update preview
  function updatePreview() {
    const preview = modal.querySelector("#folder-preview");
    const previewName = modal.querySelector("#preview-name");

    preview.style.background = selectedColor;
    preview.style.color = selectedTextColor;
    previewName.textContent =
      nameInput.value || (isEditMode ? folderName : "New Folder");
  }

  // Add subfolder functionality (for both create and edit modes)
  const addSubfolderBtn = modal.querySelector("#add-subfolder-btn");

  // Disable button if limit reached (for edit mode)
  if (isEditMode && Object.keys(folderInfo.subfolders || {}).length >= 2) {
    addSubfolderBtn.style.background = "#6c757d";
    addSubfolderBtn.style.cursor = "not-allowed";
    addSubfolderBtn.innerHTML =
      '<span style="font-size: 14px;">⚠️</span><span>Limit Reached</span>';
    addSubfolderBtn.onmouseover = null;
    addSubfolderBtn.onmouseout = null;
  }

  addSubfolderBtn.addEventListener("click", () => {
    if (isEditMode) {
      // Check limit before showing modal
      if (Object.keys(folderInfo.subfolders || {}).length >= 2) {
        showUserNotification(
          "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!",
          "warn"
        );
        return;
      }
      modal.remove();
      showCreateSubfolderModal(folderName);
    } else {
      // In create mode, we need to create the folder first, then add subfolders
      const newFolderName = nameInput.value.trim();
      if (!newFolderName) {
        showUserNotification("Please enter a folder name first", "warn");
        return;
      }

      // Create the folder temporarily
      if (!folderData[newFolderName]) {
        folderData[newFolderName] = {
          subscriptions: [],
          color: selectedColor,
          textColor: selectedTextColor,
          subfolders: {},
          expanded: false,
        };
      }

      modal.remove();
      showCreateSubfolderModal(newFolderName);
    }
  });

  // Save/Create
  modal.querySelector("#save-unified").addEventListener("click", () => {
    const newFolderName = nameInput.value.trim();
    if (!newFolderName) {
      showUserNotification("Please enter a folder name", "warn");
      return;
    }

    if (isEditMode) {
      if (newFolderName !== folderName) {
        updateFolderName(
          folderName,
          newFolderName,
          selectedColor,
          selectedTextColor
        );
      } else {
        updateFolderProperties(folderName, selectedColor, selectedTextColor);

        // Remove existing dropdown completely
        if (folderDropdown) {
          folderDropdown.remove();
          folderDropdown = null;
        }

        // Create new dropdown with updated data
        createFolderDropdown();

        // Show the new dropdown
        setTimeout(() => {
          if (folderDropdown) {
            folderDropdown.style.display = "block";
          } else {
          }
        }, 50);
      }
    } else {
      if (folderData[newFolderName] && !folderData[newFolderName].subfolders) {
        showUserNotification("A folder with this name already exists", "error");
        return;
      }

      // Update folder properties if it was created temporarily for subfolder creation
      if (folderData[newFolderName]) {
        folderData[newFolderName].color = selectedColor;
        folderData[newFolderName].textColor = selectedTextColor;
      } else {
        // Create folder with subfolders
        folderData[newFolderName] = {
          subscriptions: [],
          color: selectedColor,
          textColor: selectedTextColor,
          subfolders: tempSubfolders,
          expanded: false,
        };
      }

      // Save to Chrome storage
      chrome.storage.local.set({ folderData: folderData }, () => {});

      refreshFolderDropdown();
    }
    modal.remove();
  });

  // Cancel
  modal.querySelector("#cancel-unified").addEventListener("click", () => {
    modal.remove();
  });

  // Close button
  modal
    .querySelector("#close-unified-manager")
    .addEventListener("click", () => {
      modal.remove();
    });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Initialize preview
  updatePreview();
}

// Show modal to create or edit subfolder
function showCreateSubfolderModal(parentFolderName, subfolderName = null) {
  const isEditMode = subfolderName !== null;
  const subfolderInfo = isEditMode
    ? folderData[parentFolderName]?.subfolders?.[subfolderName]
    : null;
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
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 500px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: relative;">
      <!-- Header -->
      <div class="subfolder-header" style="background: ${
        isEditMode
          ? subfolderInfo?.color ||
            lightenColor(folderData[parentFolderName]?.color || "#1976d2", 30)
          : lightenColor(folderData[parentFolderName]?.color || "#1976d2", 30)
      }; color: ${
    isEditMode ? subfolderInfo?.textColor || "#333333" : "#333333"
  }; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-subfolder-modal" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">📁</span>
          <span>${
            isEditMode
              ? `Edit Subfolder "${subfolderName}"`
              : `Create Subfolder in "${parentFolderName}"`
          }</span>
        </h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; text-align: center;">
          ${
            isEditMode
              ? "Modify your subfolder settings"
              : "Set up your new subfolder with custom name, icon, and color"
          }
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 15px;">
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Subfolder Name:</label>
        <input type="text" id="subfolder-name-input" value="${
          isEditMode ? subfolderName : ""
        }" placeholder="e.g., FPS, Racing, Strategy..." maxlength="20"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
          <span id="subfolder-char-count">${
            isEditMode ? subfolderName.length : 0
          }</span>/20 characters
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Icon:</label>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
          ${[
            "🔫",
            "🏎️",
            "🎲",
            "📱",
            "💻",
            "🖥️",
            "🎸",
            "🎹",
            "🎤",
            "🎨",
            "📚",
            "🏃",
          ]
            .map(
              (icon) => `
            <button class="icon-option" data-icon="${icon}" style="padding: 6px; border: 2px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 14px; transition: all 0.2s;">${icon}</button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Background Color Selection (Horizontal Layout) -->
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Background Color:</label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          ${[
            {
              name: "Light",
              value: lightenColor(
                folderData[parentFolderName]?.color || "#1976d2",
                30
              ),
            },
            {
              name: "Medium",
              value: lightenColor(
                folderData[parentFolderName]?.color || "#1976d2",
                15
              ),
            },
            {
              name: "Pastel",
              value: lightenColor(
                folderData[parentFolderName]?.color || "#1976d2",
                40
              ),
            },
            {
              name: "Muted",
              value: lightenColor(
                folderData[parentFolderName]?.color || "#1976d2",
                -10
              ),
            },
          ]
            .map(
              (colorOption) => `
            <button class="color-option" data-color="${colorOption.value}" style="padding: 10px; border: 2px solid #ddd; border-radius: 4px; background: ${colorOption.value}; cursor: pointer; transition: all 0.2s; position: relative;" title="${colorOption.name}">
              <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); font-size: 9px; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.5);">${colorOption.name}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
      
      <!-- Text Color Selection (6-column grid) -->
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Text Color:</label>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
          ${[
            { name: "White", color: "#ffffff" },
            { name: "Black", color: "#000000" },
            { name: "Dark Gray", color: "#333333" },
            { name: "Navy", color: "#1a237e" },
            { name: "Dark Blue", color: "#0d47a1" },
            { name: "Dark Green", color: "#1b5e20" },
            { name: "Dark Red", color: "#b71c1c" },
            { name: "Dark Purple", color: "#4a148c" },
            { name: "Dark Orange", color: "#e65100" },
            { name: "Dark Teal", color: "#004d40" },
            { name: "Dark Brown", color: "#3e2723" },
            { name: "Dark Pink", color: "#880e4f" },
          ]
            .map(
              (textColor) => `
            <button class="text-color-option" data-color="${
              textColor.color
            }" style="padding: 6px; border: 2px solid #ddd; border-radius: 4px; background: ${
                textColor.color
              }; cursor: pointer; transition: all 0.2s; color: ${
                textColor.color === "#ffffff" || textColor.color === "#f5f5f5"
                  ? "#333"
                  : "#fff"
              }; font-weight: 500; font-size: 12px;" title="${
                textColor.name
              }">Aa</button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Preview Box (Compact) -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; border: 1px solid #dee2e6; margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 14px;">Preview:</h4>
        <div id="subfolder-preview" style="background: ${
          isEditMode
            ? subfolderInfo?.color ||
              lightenColor(folderData[parentFolderName]?.color || "#1976d2", 30)
            : lightenColor(folderData[parentFolderName]?.color || "#1976d2", 30)
        }; color: ${
    isEditMode ? subfolderInfo?.textColor || "#333333" : "#333333"
  }; border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
          <span id="preview-icon" style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">${
            isEditMode ? subfolderInfo?.icon || "📂" : "📂"
          }</span>
          <span id="preview-name">${
            isEditMode ? subfolderName : "New Subfolder"
          }</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-subfolder" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
          <button id="create-subfolder" style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">${
            isEditMode ? "Save Changes" : "Create Subfolder"
          }</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Make panel draggable after a short delay to ensure DOM is ready
  setTimeout(() => {
    const header = modal.querySelector(".subfolder-header");
    const panel = modal.querySelector("div > div"); // Target the inner panel div, not the overlay
    if (header && panel) {
      // Custom dragging implementation for subfolder panel
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

      logStatus("Subfolder panel made draggable", "info");
    } else {
      logStatus(
        "Could not find subfolder header or panel for dragging",
        "warn"
      );
    }
  }, 10);

  // Close button
  modal
    .querySelector("#close-subfolder-modal")
    .addEventListener("click", () => {
      modal.remove();
    });

  // Initialize with default selections
  let selectedIcon = isEditMode ? subfolderInfo.icon : "📂";
  let selectedColor = isEditMode
    ? subfolderInfo.color
    : lightenColor(folderData[parentFolderName]?.color || "#1976d2", 30);
  let selectedTextColor = isEditMode ? subfolderInfo.textColor : "#333333";

  // Character counter
  const nameInput = modal.querySelector("#subfolder-name-input");
  const charCount = modal.querySelector("#subfolder-char-count");

  // Update preview function
  function updatePreview() {
    const preview = modal.querySelector("#subfolder-preview");
    const previewName = modal.querySelector("#preview-name");
    const previewIcon = modal.querySelector("#preview-icon");

    preview.style.background = selectedColor;
    preview.style.color = selectedTextColor;
    previewName.textContent =
      nameInput.value || (isEditMode ? subfolderName : "New Subfolder");
    previewIcon.textContent = selectedIcon;
  }

  // Color selection
  modal.querySelectorAll(".color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedColor = btn.dataset.color;
      updatePreview();
    });
  });

  // Text color selection
  modal.querySelectorAll(".text-color-option").forEach((btn) => {
    // Set initial selection
    if (btn.dataset.color === selectedTextColor) {
      btn.style.borderColor = "#007bff";
    }

    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".text-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedTextColor = btn.dataset.color;
      updatePreview();
    });
  });

  // Icon selection
  modal.querySelectorAll(".icon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".icon-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedIcon = btn.dataset.icon;
      updatePreview();
    });
  });

  // Name input change
  nameInput.addEventListener("input", () => {
    const count = nameInput.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 15 ? "#dc3545" : "#666";
    updatePreview();
  });

  // Initialize preview
  updatePreview();

  // Create or edit subfolder
  modal.querySelector("#create-subfolder").addEventListener("click", () => {
    const newSubfolderName = nameInput.value.trim();
    if (!newSubfolderName) {
      showUserNotification("Please enter a subfolder name", "warn");
      return;
    }

    if (isEditMode) {
      // Edit existing subfolder
      const subfolderData =
        folderData[parentFolderName].subfolders[subfolderName];
      subfolderData.icon = selectedIcon;
      subfolderData.color = selectedColor;
      subfolderData.textColor = selectedTextColor;

      // If name changed, update the key
      if (newSubfolderName !== subfolderName) {
        folderData[parentFolderName].subfolders[newSubfolderName] =
          subfolderData;
        delete folderData[parentFolderName].subfolders[subfolderName];
      }

      // Save to storage
      safeSaveFolderData(folderData);

      // Refresh UI
      refreshFolderDropdown();
    } else {
      // Create new subfolder
      createSubfolder(
        parentFolderName,
        newSubfolderName,
        selectedIcon,
        selectedColor,
        selectedTextColor
      );
    }

    modal.remove();
  });

  // Cancel
  modal.querySelector("#cancel-subfolder").addEventListener("click", () => {
    modal.remove();
  });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Make them globally available
window.showUnifiedFolderManager = showUnifiedFolderManager;
window.showCreateSubfolderModal = showCreateSubfolderModal;
