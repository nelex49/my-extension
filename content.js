/** @format */

// Content script loaded

// Global variables
let folderPanel = null;
let isLoggedIn = false;
let sidebarButtonCreated = false;
let folderDropdown = null;
let userSubscriptions = [];

// CSS Constants to reduce duplication
const CSS_CONSTANTS = {
  MODAL_STYLES: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10000,
    background: "white",
    borderRadius: "12px",
    padding: "0",
    maxWidth: "700px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  MODAL_SMALL_STYLES: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10000,
    background: "white",
    borderRadius: "12px",
    padding: "0",
    maxWidth: "500px",
    width: "95%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  MODAL_COMPACT_STYLES: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10000,
    background: "white",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "500px",
    maxHeight: "400px",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  HEADER_STYLES: {
    background: "linear-gradient(135deg, #007bff, #0056b3)",
    color: "white",
    padding: "20px",
    borderRadius: "12px 12px 0 0",
    position: "relative",
  },
  BUTTON_STYLES: {
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    border: "none",
    transition: "all 0.2s",
  },
  BORDER_RADIUS: {
    SMALL: "4px",
    MEDIUM: "8px",
    LARGE: "12px",
    ROUND: "50%",
  },
  POSITIONING: {
    FIXED: "fixed",
    ABSOLUTE: "absolute",
    RELATIVE: "relative",
  },
  Z_INDEX: {
    MODAL: 10000,
    DROPDOWN: 10001,
    OVERLAY: 20000,
  },
  GRADIENTS: {
    BLUE: "linear-gradient(135deg, #007bff, #0056b3)",
    GREEN: "linear-gradient(135deg, #28a745, #20c997)",
    PURPLE: "linear-gradient(135deg, #6f42c1, #5a32a3)",
    RED: "linear-gradient(135deg, #dc3545, #c82333)",
  },
  COLORS: {
    PRIMARY: "#007bff",
    SUCCESS: "#28a745",
    DANGER: "#dc3545",
    WARNING: "#ffc107",
    INFO: "#17a2b8",
    LIGHT: "#f8f9fa",
    DARK: "#343a40",
  },
};

// Configuration object for environment settings
const CONFIG = {
  OAUTH_CLIENT_ID:
    "763119874945-ad7le2f2eldhslfppaflmuspedj1o4hi.apps.googleusercontent.com",
  API_BASE_URL: "https://www.googleapis.com/youtube/v3",
  DEBUG: true, // Set to false for production
  VERSION: "1.0.0",
  MAX_FOLDER_NAME_LENGTH: 50,
  MAX_SUBFOLDER_NAME_LENGTH: 30,
  MAX_SUBSCRIPTIONS_PER_SUBFOLDER: 15,
  STORAGE_KEYS: {
    FOLDER_DATA: "folderData",
    ACCESS_TOKEN: "accessToken",
    USER_SUBSCRIPTIONS: "userSubscriptions",
  },
};

// Input validation functions
function validateChannelId(id) {
  if (!id || typeof id !== "string") {
    throw new Error("Channel ID must be a non-empty string");
  }
  if (!/^UC[a-zA-Z0-9_-]{22}$/.test(id)) {
    throw new Error("Invalid channel ID format");
  }
  return true;
}

function validateFolderName(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Folder name must be a non-empty string");
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Folder name cannot be empty");
  }
  if (trimmedName.length > CONFIG.MAX_FOLDER_NAME_LENGTH) {
    throw new Error(
      `Folder name too long (max ${CONFIG.MAX_FOLDER_NAME_LENGTH} characters)`
    );
  }
  return true;
}

function validateSubfolderName(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Subfolder name must be a non-empty string");
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Subfolder name cannot be empty");
  }
  if (trimmedName.length > CONFIG.MAX_SUBFOLDER_NAME_LENGTH) {
    throw new Error(
      `Subfolder name too long (max ${CONFIG.MAX_SUBFOLDER_NAME_LENGTH} characters)`
    );
  }
  return true;
}

function validateFolderData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid folder data: must be an object");
  }
  return true;
}

// Safe HTML rendering functions
function createSafeElement(tag, content, className = "", attributes = {}) {
  const element = document.createElement(tag);
  element.textContent = content; // Prevents XSS
  if (className) element.className = className;

  // Add attributes safely
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  return element;
}

function createSafeHTML(tag, innerHTML, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.innerHTML = innerHTML; // Only use when you trust the content
  return element;
}

// Error handling utilities
function handleError(error, context = "Unknown") {
  const errorMessage = `Error in ${context}: ${error.message}`;

  if (CONFIG.DEBUG) {
    console.error(errorMessage, error);
  }

  // Show user-friendly error message
  showUserNotification("Something went wrong. Please try again.", "error");

  return error;
}

function showUserNotification(message, type = "info") {
  // Create a simple notification system
  const notification = createSafeElement("div", message, "user-notification", {
    style: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "99999",
      maxWidth: "300px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      background:
        type === "error"
          ? "#dc3545"
          : type === "success"
          ? "#28a745"
          : "#007bff",
    },
  });

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Safe API call wrapper
async function safeApiCall(apiFunction, errorMessage, context = "API Call") {
  try {
    return await apiFunction();
  } catch (error) {
    handleError(error, context);
    throw error;
  }
}

// Safe storage operations
function safeSaveFolderData(data) {
  try {
    validateFolderData(data);
    chrome.storage.local.set(
      { [CONFIG.STORAGE_KEYS.FOLDER_DATA]: data },
      () => {
        if (CONFIG.DEBUG) {
          console.log("Folder data saved successfully");
        }
      }
    );
  } catch (error) {
    handleError(error, "Save Folder Data");
  }
}

function safeLoadFolderData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.FOLDER_DATA], (result) => {
      try {
        if (result[CONFIG.STORAGE_KEYS.FOLDER_DATA]) {
          validateFolderData(result[CONFIG.STORAGE_KEYS.FOLDER_DATA]);
          resolve(result[CONFIG.STORAGE_KEYS.FOLDER_DATA]);
        } else {
          resolve({});
        }
      } catch (error) {
        handleError(error, "Load Folder Data");
        reject(error);
      }
    });
  });
}

let folderData = {}; // Will be loaded from Chrome storage or start empty
let folderLimit = 3; // Free users can create 3 folders
let isPremium = false; // Will be determined later

// Status logging function for development (console only)
function logStatus(message, type = "info") {
  if (type === "error") {
    console.error(`[YT Extension] ${message}`);
  } else if (type === "warn") {
    console.warn(`[YT Extension] ${message}`);
  } else {
    console.log(`[YT Extension] ${message}`);
  }
}

// Utility function to apply CSS styles from constants
function applyStyles(element, styleObject) {
  Object.assign(element.style, styleObject);
}

// Utility function to create modal with consistent styling
function createModal(innerHTML, size = "large") {
  const modal = document.createElement("div");
  const styleKey =
    size === "small"
      ? "MODAL_SMALL_STYLES"
      : size === "compact"
      ? "MODAL_COMPACT_STYLES"
      : "MODAL_STYLES";

  modal.style.cssText = Object.entries(CSS_CONSTANTS[styleKey])
    .map(
      ([key, value]) =>
        `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
    )
    .join("; ");
  modal.innerHTML = innerHTML;
  return modal;
}

// Utility function to create consistent button styles
function createButton(text, className = "", additionalStyles = {}) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  applyStyles(button, { ...CSS_CONSTANTS.BUTTON_STYLES, ...additionalStyles });
  return button;
}

// Utility function to create consistent modal header
function createModalHeader(title, closeButtonId = "close-modal") {
  return `
    <div style="${Object.entries(CSS_CONSTANTS.HEADER_STYLES)
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
      )
      .join("; ")}">
      <button id="${closeButtonId}" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
      <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${title}</h2>
    </div>
  `;
}

// Utility function to get CSS value from constants
function getCSSValue(category, key) {
  return CSS_CONSTANTS[category]?.[key] || "";
}

// Create sidebar button
function createSidebarButton() {
  console.log("Creating sidebar button...");

  // Set flag immediately to prevent duplicate calls
  if (sidebarButtonCreated) {
    console.log("Sidebar button creation already in progress");
    return (
      document.querySelector("#yt-manage-guide-entry") ||
      document.querySelector("#yt-manage-link")
    );
  }

  // Check if button already exists to prevent duplicates
  if (
    document.querySelector("#yt-manage-guide-entry") ||
    document.querySelector("#yt-manage-link")
  ) {
    console.log("Sidebar button already exists in DOM");
    sidebarButtonCreated = true;
    return (
      document.querySelector("#yt-manage-guide-entry") ||
      document.querySelector("#yt-manage-link")
    );
  }

  // Mark as creating to prevent duplicate calls
  sidebarButtonCreated = true;

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    // Look for the Home navigation item
    const homeLink = document.querySelector('a[href*="/feed/"]');

    if (homeLink) {
      // Find the parent guide entry renderer
      let guideEntry = homeLink.closest("ytd-guide-entry-renderer");

      if (guideEntry) {
        // Find the parent container
        let container = guideEntry.parentElement;

        // Create our button as a proper guide entry
        const newGuideEntry = document.createElement(
          "ytd-guide-entry-renderer"
        );
        newGuideEntry.id = "yt-manage-guide-entry";

        // Create blue background button with white text and star icon
        newGuideEntry.innerHTML = `
          <a id="yt-manage-link" href="#" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" aria-label="Manage YT">
            <div style="margin-right: 12px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; fill: white;">
                <g>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </g>
              </svg>
            </div>
            <span class="title style-scope ytd-guide-entry-renderer">MANAGE YT SUBS</span>
          </a>
        `;

        // Apply aggressive styling after creation
        const link = newGuideEntry.querySelector("#yt-manage-link");
        if (link) {
          // Force all the styles
          link.style.cssText = `
            background-color: #1976d2 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 16px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          `;

          // Force text color and ensure it fits
          const title = link.querySelector(".title");
          if (title) {
            title.style.cssText = `
              color: white !important;
              font-weight: 500 !important;
              font-size: 14px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 250px !important;
            `;
          }
        }

        // Add hover effect for blue background button
        if (link) {
          link.addEventListener("mouseenter", () => {
            link.style.backgroundColor = "#1565c0 !important"; // Darker blue on hover
            link.style.transform = "scale(1.02)";
            link.style.transition = "all 0.2s ease";
          });

          link.addEventListener("mouseleave", () => {
            link.style.backgroundColor = "#1976d2 !important"; // Back to original blue
            link.style.transform = "scale(1)";
          });
        }

        // Insert after the home button
        container.insertBefore(newGuideEntry, guideEntry.nextSibling);

        // Inject CSS to override YouTube's styles
        const style = document.createElement("style");
        style.textContent = `
          #yt-manage-guide-entry #yt-manage-link {
            background-color: #1976d2 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 24px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          #yt-manage-guide-entry #yt-manage-link .title {
            color: white !important;
            font-weight: 500 !important;
            font-size: 14px !important;
          }
          #yt-manage-guide-entry #yt-manage-link svg {
            fill: white !important;
            width: 24px !important;
            height: 24px !important;
          }
        `;
        document.head.appendChild(style);

        // Button created successfully

        // Add click handler
        const manageLink = newGuideEntry.querySelector("#yt-manage-link");
        if (manageLink) {
          manageLink.addEventListener("click", (e) => {
            e.preventDefault();

            // Temporary visual feedback
            manageLink.style.backgroundColor = "#ff9800";
            setTimeout(() => {
              manageLink.style.backgroundColor = "#1976d2";
            }, 200);

            toggleFolderDropdown();
          });
        } else {
        }

        return newGuideEntry;
      }
    } else {
    }

    return null;
  }, 2000);

  return null;
}

// Toggle folder dropdown
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
  console.log("Creating folder dropdown...");
  const manageButton = document.querySelector("#yt-manage-guide-entry");
  if (!manageButton) {
    console.log("Manage button not found, cannot create dropdown");
    return;
  }
  console.log("Manage button found, creating dropdown");

  // Remove existing dropdown if any
  const existingDropdown = document.querySelector("#yt-folder-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Create dropdown container
  folderDropdown = document.createElement("div");
  folderDropdown.id = "yt-folder-dropdown";
  folderDropdown.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    margin-top: 5px;
    padding: 10px;
    font-family: 'Roboto', sans-serif;
    font-size: 14px;
    display: block;
  `;

  // Create folder content based on current state
  const folderCount = Object.keys(folderData).length;
  const canCreateMore = isPremium || folderCount < folderLimit;

  // Remove temporary override - enforce actual limit
  // const alwaysShowCreate = true;

  console.log(
    "🎯 Button will be:",
    canCreateMore
      ? folderCount === 0
        ? "✨ Create Your First Folder"
        : "➕ Create Another Folder"
      : "⭐ Premium"
  );

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
          : Object.entries(folderData)
              .map(([folderName, folderInfo]) => {
                const totalSubs =
                  folderInfo.subscriptions.length +
                  Object.values(folderInfo.subfolders || {}).reduce(
                    (sum, sub) => sum + sub.subscriptions.length,
                    0
                  );
                const expandIcon = folderInfo.expanded ? "▼" : "▶";

                console.log(
                  `🎨 Creating parent folder "${folderName}" with textColor:`,
                  folderInfo.textColor
                );
                return `
                    <div class="parent-folder-container">
                      <div class="folder-item parent-folder" data-folder="${folderName}" style="background-color: ${
                  folderInfo.color || "#1976d2"
                }; border-radius: 4px; margin: 2px 0; position: relative; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; min-height: 40px;">
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
                              console.log(
                                `🎨 Creating subfolder "${subName}" with textColor:`,
                                subInfo.textColor
                              );
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
                                  <button class="quick-view-subfolder-btn" data-folder="${folderName}" data-subfolder="${subName}" style="background: rgba(255,255,255,0.2); border: none; border-radius: 3px; padding: 3px 6px; color: #ffffff; cursor: pointer; font-size: 11px; margin-right: 4px; transition: all 0.2s;" title="Quick view subscriptions">▶️</button>
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
        <button id="view-all-subs" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px; margin: 0 auto; box-shadow: 0 2px 4px rgba(108,117,125,0.3);">
          <span style="font-size: 16px;">▶️</span>
          <span>All Subs</span>
        </button>
    </div>
  `;

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
    #yt-folder-dropdown .folder-name {
      color: white;
      font-weight: 500;
    }
    #yt-folder-dropdown .count {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      font-weight: 500;
    }
    /* Delete button styles removed - folders are now parent containers */
    
    /* Subfolder styles */
    #yt-folder-dropdown .subfolder {
      opacity: 0.9;
      transition: all 0.2s;
    }
    #yt-folder-dropdown .subfolder:hover {
      opacity: 1;
      transform: translateX(2px);
    }
    #yt-folder-dropdown .expand-icon {
      transition: all 0.2s;
    }
    #yt-folder-dropdown .expand-icon:hover {
      background: rgba(255,255,255,0.4) !important;
      transform: scale(1.1);
    }
    #yt-folder-dropdown .parent-folder-container {
      margin-bottom: 4px;
    }
    #yt-folder-dropdown .quick-view-btn:hover,
    #yt-folder-dropdown .quick-view-subfolder-btn:hover {
      background: rgba(255,255,255,0.4) !important;
      transform: scale(1.1);
    }
    #yt-folder-dropdown #create-folder-item:hover {
      background-color: #e9ecef !important;
      border-color: #adb5bd !important;
    }
    #yt-folder-dropdown #upgrade-premium-item:hover {
      background-color: #fff8e1 !important;
      border-color: #ffcc02 !important;
    }
    #yt-folder-dropdown #view-all-subs:hover {
      background-color: #5a6268 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(108,117,125,0.4) !important;
    }
  `;
  document.head.appendChild(style);

  // Insert dropdown after the manage button
  manageButton.style.position = "relative";
  manageButton.appendChild(folderDropdown);

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

    // Click on folder content (not expand icon) shows management panel
    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("expand-icon")) {
        showFolderManagementPanel(folderName);
      }
    });

    // Right-click context menu for parent folders
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
      showSubfolderSubscriptions(folderName, subfolderName);
    });

    // Right-click context menu for subfolders
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFolderContextMenu(e, folderName, "subfolder", subfolderName);
    });
  });

  // Quick view buttons removed from parent folders - they now open management panel instead

  const quickViewSubfolderBtns = folderDropdown.querySelectorAll(
    ".quick-view-subfolder-btn"
  );
  quickViewSubfolderBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folderName = btn.dataset.folder;
      const subfolderName = btn.dataset.subfolder;
      showSubfolderSubscriptions(folderName, subfolderName);
    });
  });

  // Add click handler for create folder item
  const createFolderItem = folderDropdown.querySelector("#create-folder-item");
  if (createFolderItem) {
    createFolderItem.addEventListener("click", () => {
      showUnifiedFolderManager();
    });
  } else {
  }

  // Add click handler for upgrade premium item
  const upgradeItem = folderDropdown.querySelector("#upgrade-premium-item");
  if (upgradeItem) {
    upgradeItem.addEventListener("click", () => {
      showPremiumUpgradeModal();
    });
  }

  // Delete button handlers removed - folders are now parent containers

  // Add click handler for view all button
  const viewAllBtn = folderDropdown.querySelector("#view-all-subs");
  console.log("View all button found:", !!viewAllBtn);
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", (e) => {
      console.log("All Subs button clicked!");
      e.preventDefault();
      e.stopPropagation();
      showAllSubscriptions();
    });
  } else {
    console.log("All Subs button NOT found in dropdown!");
  }
}

// Show folder management panel
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
    <div style="background: linear-gradient(135deg, ${
      folderInfo.color
    }, ${lightenColor(
    folderInfo.color,
    20
  )}); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
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
      showEditSubfolderModal(folder, subfolder);
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

// Delete parent folder
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

// Delete subfolder
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

// Show unified folder management interface
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
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-unified-manager" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
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
              ? "Modify your folder settings and manage subfolders"
              : "Set up your new folder with custom name, icon, and color"
          }
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 20px;">
        <!-- Folder Settings -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📁</span>
            <span>Folder Settings</span>
          </h3>
          
          <!-- Folder Name Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Folder Name:</label>
              <input type="text" id="unified-folder-name" value="${
                isEditMode ? folderName : ""
              }" maxlength="20" placeholder="e.g., Gaming, Tech, Music..."
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
              <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
                <span id="unified-char-count">${
                  isEditMode ? folderName.length : 0
                }</span>/20 characters
              </div>
            </div>
            
            <!-- Parent folder info -->
            <div style="background: #e3f2fd; border-radius: 8px; padding: 15px; border-left: 4px solid #2196f3;">
              <h4 style="margin: 0 0 8px 0; color: #1976d2; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                <span>ℹ️</span>
                <span>Parent Folder</span>
              </h4>
              <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.4;">
                Parent folders display with a dropdown arrow (▶) to expand/collapse subfolders. 
                Icons are only used for subfolders to help organize content within each category.
              </p>
            </div>
          </div>

          <!-- Color Selection Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Background Color:</label>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${[
              "#ff6b6b",
              "#4ecdc4",
              "#9b59b6",
              "#e74c3c",
              "#f39c12",
              "#27ae60",
              "#3498db",
              "#34495e",
            ]
              .map(
                (color) => `
              <button class="unified-color-option" data-color="${color}" style="padding: 12px; border: 2px solid ${
                  isEditMode && color === folderInfo.color ? "#007bff" : "#ddd"
                }; border-radius: 4px; background: ${color}; cursor: pointer; transition: all 0.2s;"></button>
            `
              )
              .join("")}
          </div>
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Text Color:</label>
              <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
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
                    }; font-weight: 500; font-size: 12px;" title="${
                      textColor.name
                    }">Aa</button>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Preview and Tips Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; border: 1px solid #dee2e6;">
              <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Preview:</h4>
              <div id="folder-preview" style="background: ${
                isEditMode ? folderInfo.color : "#007bff"
              }; color: ${
    isEditMode ? folderInfo.textColor || "#ffffff" : "#ffffff"
  }; border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <span id="preview-expand-icon" style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">▶</span>
                <span id="preview-name">${
                  isEditMode ? folderName : "New Folder"
                }</span>
              </div>
            </div>
            
            <!-- Tips Section -->
            <div style="background: #fff3cd; border-radius: 8px; padding: 15px; border-left: 4px solid #ffc107;">
              <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                <span>💡</span>
                <span>Tips</span>
              </h4>
              <ul style="margin: 0; padding-left: 16px; color: #856404; font-size: 12px; line-height: 1.4;">
                <li>Choose colors that are easy to read</li>
                <li>Keep folder names short and descriptive</li>
                <li>Create subfolders for better organization</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Subfolders Management -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📂</span>
            <span>Subfolders ${
              isEditMode
                ? `(${Object.keys(folderInfo.subfolders || {}).length}/2)`
                : "(Optional)"
            }</span>
            <button id="add-subfolder-btn" style="background: #28a745; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; margin-left: auto;">+ Add</button>
          </h3>
          
          <div id="subfolders-list" style="display: grid; gap: 8px;">
            ${
              isEditMode
                ? Object.keys(folderInfo.subfolders || {}).length === 0
                  ? '<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;"><p style="margin: 0;">No subfolders yet</p><p style="margin: 5px 0 0 0; font-size: 12px;">Click "Add" to create your first subfolder</p></div>'
                  : Object.entries(folderInfo.subfolders || {})
                      .map(
                        ([subName, subInfo]) => `
                      <div class="subfolder-manager-item" data-subfolder="${subName}" style="background: ${
                          subInfo.color
                        }; color: ${
                          subInfo.textColor || "#ffffff"
                        }; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
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
                          <button class="edit-subfolder-btn" data-subfolder="${subName}" style="background: rgba(255,255,255,0.2); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">✏️ Edit</button>
                          <button class="delete-subfolder-btn" data-subfolder="${subName}" style="background: rgba(220,53,69,0.8); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
                        </div>
                      </div>
                    `
                      )
                      .join("")
                : '<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;"><p style="margin: 0;">No subfolders yet</p><p style="margin: 5px 0 0 0; font-size: 12px;">Click "Add" to create subfolders for better organization</p></div>'
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <button id="cancel-unified" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">Cancel</button>
          <button id="save-unified" style="padding: 10px 20px; border: none; border-radius: 6px; background: #007bff; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">
            ${isEditMode ? "Save Changes" : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

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

  // Icon selection removed - parent folders only show dropdown arrow

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
    addSubfolderBtn.textContent = "Limit Reached";
  }

  addSubfolderBtn.addEventListener("click", () => {
    if (isEditMode) {
      // Check limit before showing modal
      if (Object.keys(folderInfo.subfolders || {}).length >= 2) {
        alert(
          "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!"
        );
        return;
      }
      modal.remove();
      showCreateSubfolderModal(folderName);
    } else {
      // In create mode, we'll handle subfolder creation inline
      showInlineSubfolderCreator(
        modal,
        tempSubfolders,
        selectedColor,
        updateSubfoldersList
      );
    }
  });

  // Subfolder management buttons (only for edit mode)
  if (isEditMode) {
    modal.querySelectorAll(".edit-subfolder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const subfolderName = btn.dataset.subfolder;
        modal.remove();
        showEditSubfolderModal(folderName, subfolderName);
      });
    });

    modal.querySelectorAll(".delete-subfolder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const subfolderName = btn.dataset.subfolder;
        if (confirm(`Delete subfolder "${subfolderName}"?`)) {
          delete folderData[folderName].subfolders[subfolderName];
          modal.remove();
          refreshFolderDropdown();
        }
      });
    });
  }

  // Save/Create
  modal.querySelector("#save-unified").addEventListener("click", () => {
    const newFolderName = nameInput.value.trim();
    if (!newFolderName) {
      alert("Please enter a folder name");
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
        console.log(
          "🔄 Updating parent folder properties with textColor:",
          selectedTextColor
        );
        updateFolderProperties(folderName, selectedColor, selectedTextColor);
        console.log(
          "🔄 Starting complete dropdown recreation for parent folder text color update"
        );

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
            console.log(
              "✅ New dropdown created and shown with updated parent folder data"
            );
          } else {
          }
        }, 50);
      }
    } else {
      if (folderData[newFolderName]) {
        alert("A folder with this name already exists");
        return;
      }
      // Create folder with subfolders
      folderData[newFolderName] = {
        subscriptions: [],
        color: selectedColor,
        textColor: selectedTextColor,
        subfolders: tempSubfolders,
        expanded: false,
      };

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

  // Update subfolders list function
  function updateSubfoldersList() {
    const subfoldersList = modal.querySelector("#subfolders-list");
    if (Object.keys(tempSubfolders).length === 0) {
      subfoldersList.innerHTML =
        '<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;"><p style="margin: 0;">No subfolders yet</p><p style="margin: 5px 0 0 0; font-size: 12px;">Click "Add" to create subfolders for better organization</p></div>';
    } else {
      subfoldersList.innerHTML = Object.entries(tempSubfolders)
        .map(
          ([subName, subInfo]) => `
          <div class="subfolder-manager-item" data-subfolder="${subName}" style="background: ${
            subInfo.color
          }; color: ${
            subInfo.textColor || "#ffffff"
          }; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
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
              <button class="delete-temp-subfolder-btn" data-subfolder="${subName}" style="background: rgba(220,53,69,0.8); border: none; border-radius: 4px; padding: 6px 10px; color: white; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
          </div>
        `
        )
        .join("");

      // Add delete listeners for temp subfolders
      subfoldersList
        .querySelectorAll(".delete-temp-subfolder-btn")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const subfolderName = btn.dataset.subfolder;
            delete tempSubfolders[subfolderName];
            updateSubfoldersList();
          });
        });
    }
  }

  // Initialize preview and subfolders list
  updatePreview();
  if (!isEditMode) {
    updateSubfoldersList();
  }
}

// Show inline subfolder creator for create mode
function showInlineSubfolderCreator(
  modal,
  tempSubfolders,
  parentColor,
  updateCallback
) {
  const subfolderModal = document.createElement("div");
  subfolderModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
  `;

  subfolderModal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 500px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-inline-subfolder" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Add Subfolder</h3>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Create a subfolder with automatic color variation</p>
      </div>

      <!-- Content -->
      <div style="padding: 20px;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Subfolder Name:</label>
          <input type="text" id="inline-subfolder-name" maxlength="15" placeholder="e.g., FPS, Racing, Strategy..."
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Icon:</label>
          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px;">
            ${[
              "🔫",
              "🏎️",
              "🎲",
              "⚔️",
              "🏹",
              "🎯",
              "🎪",
              "🎨",
              "🎵",
              "📚",
              "🔬",
              "🏃",
              "🍔",
              "✈️",
              "🏠",
              "💡",
            ]
              .map(
                (icon) => `
              <button class="inline-icon-option" data-icon="${icon}" style="padding: 8px; border: 2px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">${icon}</button>
            `
              )
              .join("")}
          </div>
        </div>

        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; border: 1px solid #dee2e6; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Preview:</h4>
          <div id="subfolder-preview" style="background: ${lightenColor(
            parentColor,
            30
          )}; color: white; border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <span id="preview-subfolder-icon">📂</span>
            <span id="preview-subfolder-name">New Subfolder</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancel-inline-subfolder" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">Cancel</button>
          <button id="save-inline-subfolder" style="padding: 10px 20px; border: none; border-radius: 6px; background: #28a745; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">Add Subfolder</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(subfolderModal);

  let selectedSubIcon = "📂";
  let selectedSubColor = lightenColor(parentColor, 30);

  // Update preview
  function updateSubPreview() {
    const preview = subfolderModal.querySelector("#subfolder-preview");
    const previewIcon = subfolderModal.querySelector("#preview-subfolder-icon");
    const previewName = subfolderModal.querySelector("#preview-subfolder-name");

    preview.style.background = selectedSubColor;
    previewIcon.textContent = selectedSubIcon;
    previewName.textContent =
      subfolderModal.querySelector("#inline-subfolder-name").value ||
      "New Subfolder";
  }

  // Icon selection
  subfolderModal.querySelectorAll(".inline-icon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      subfolderModal
        .querySelectorAll(".inline-icon-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#28a745";
      selectedSubIcon = btn.dataset.icon;
      updateSubPreview();
    });
  });

  // Name input
  subfolderModal
    .querySelector("#inline-subfolder-name")
    .addEventListener("input", updateSubPreview);

  // Save
  subfolderModal
    .querySelector("#save-inline-subfolder")
    .addEventListener("click", () => {
      const subfolderName = subfolderModal
        .querySelector("#inline-subfolder-name")
        .value.trim();
      if (!subfolderName) {
        alert("Please enter a subfolder name");
        return;
      }
      if (tempSubfolders[subfolderName]) {
        alert("A subfolder with this name already exists");
        return;
      }

      // Check subfolder limit (2 per parent folder)
      if (Object.keys(tempSubfolders).length >= 2) {
        alert(
          "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!"
        );
        return;
      }

      tempSubfolders[subfolderName] = {
        subscriptions: [],
        color: selectedSubColor,
        icon: selectedSubIcon,
        textColor: "#ffffff",
      };

      subfolderModal.remove();
      updateCallback();
    });

  // Cancel
  subfolderModal
    .querySelector("#cancel-inline-subfolder")
    .addEventListener("click", () => {
      subfolderModal.remove();
    });

  // Close button
  subfolderModal
    .querySelector("#close-inline-subfolder")
    .addEventListener("click", () => {
      subfolderModal.remove();
    });

  // Close on outside click
  subfolderModal.addEventListener("click", (e) => {
    if (e.target === subfolderModal) {
      subfolderModal.remove();
    }
  });

  // Initialize preview
  updateSubPreview();
}

// Show modal to edit subfolder
function showEditSubfolderModal(parentFolderName, subfolderName) {
  const parentFolder = folderData[parentFolderName];
  if (!parentFolder || !parentFolder.subfolders[subfolderName]) return;

  const subfolderInfo = parentFolder.subfolders[subfolderName];

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
    <div style="background: white; border-radius: 12px; padding: 0; max-width: 500px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="close-edit-subfolder" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Edit Subfolder</h3>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Modify "${subfolderName}" in "${parentFolderName}"</p>
      </div>

      <!-- Content -->
      <div style="padding: 20px;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Subfolder Name:</label>
          <input type="text" id="edit-subfolder-name" value="${subfolderName}" maxlength="15" placeholder="e.g., FPS, Racing, Strategy..."
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Icon:</label>
          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px;">
            ${[
              "🔫",
              "🏎️",
              "🎲",
              "⚔️",
              "🏹",
              "🎯",
              "🎪",
              "🎨",
              "🎵",
              "📚",
              "🔬",
              "🏃",
              "🍔",
              "✈️",
              "🏠",
              "💡",
            ]
              .map(
                (icon) => `
              <button class="edit-subfolder-icon-option" data-icon="${icon}" style="padding: 8px; border: 2px solid ${
                  icon === subfolderInfo.icon ? "#28a745" : "#ddd"
                }; border-radius: 4px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">${icon}</button>
            `
              )
              .join("")}
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Background Color Variation:</label>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${[
              { name: "Light", percent: 30 },
              { name: "Medium", percent: 20 },
              { name: "Pastel", percent: 40 },
              { name: "Muted", percent: 15 },
            ]
              .map((variation, index) => {
                const color = lightenColor(
                  parentFolder.color,
                  variation.percent
                );
                return `
                <button class="edit-subfolder-color-option" data-percent="${
                  variation.percent
                }" style="padding: 12px; border: 2px solid ${
                  color === subfolderInfo.color ? "#28a745" : "#ddd"
                }; border-radius: 4px; background: ${color}; cursor: pointer; transition: all 0.2s;" title="${
                  variation.name
                } variation"></button>
              `;
              })
              .join("")}
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Text Color:</label>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
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
              <button class="edit-subfolder-text-color-option" data-color="${
                textColor.color
              }" style="padding: 8px; border: 2px solid ${
                  textColor.color === (subfolderInfo.textColor || "#ffffff")
                    ? "#28a745"
                    : "#ddd"
                }; border-radius: 4px; background: ${
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

        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; border: 1px solid #dee2e6; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Preview:</h4>
          <div id="edit-subfolder-preview" style="background: ${
            subfolderInfo.color
          }; color: ${
    subfolderInfo.textColor || "#ffffff"
  }; border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <span id="preview-edit-subfolder-icon">${subfolderInfo.icon}</span>
            <span id="preview-edit-subfolder-name">${subfolderName}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancel-edit-subfolder" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">Cancel</button>
          <button id="save-edit-subfolder" style="padding: 10px 20px; border: none; border-radius: 6px; background: #28a745; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize with current selections
  let selectedIcon = subfolderInfo.icon;
  let selectedColor = subfolderInfo.color;
  let selectedTextColor = subfolderInfo.textColor || "#ffffff";

  // Update preview
  function updateEditPreview() {
    const preview = modal.querySelector("#edit-subfolder-preview");
    const previewIcon = modal.querySelector("#preview-edit-subfolder-icon");
    const previewName = modal.querySelector("#preview-edit-subfolder-name");

    preview.style.background = selectedColor;
    preview.style.color = selectedTextColor;
    previewIcon.textContent = selectedIcon;
    previewName.textContent =
      modal.querySelector("#edit-subfolder-name").value || subfolderName;
  }

  // Icon selection
  modal.querySelectorAll(".edit-subfolder-icon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".edit-subfolder-icon-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#28a745";
      selectedIcon = btn.dataset.icon;
      updateEditPreview();
    });
  });

  // Color selection
  modal.querySelectorAll(".edit-subfolder-color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".edit-subfolder-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#28a745";
      const percent = parseInt(btn.dataset.percent);
      selectedColor = lightenColor(parentFolder.color, percent);
      updateEditPreview();
    });
  });

  // Text color selection
  modal.querySelectorAll(".edit-subfolder-text-color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".edit-subfolder-text-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#28a745";
      selectedTextColor = btn.dataset.color;
      updateEditPreview();
    });
  });

  // Name input
  modal
    .querySelector("#edit-subfolder-name")
    .addEventListener("input", updateEditPreview);

  // Save
  modal.querySelector("#save-edit-subfolder").addEventListener("click", () => {
    const newSubfolderName = modal
      .querySelector("#edit-subfolder-name")
      .value.trim();
    if (!newSubfolderName) {
      alert("Please enter a subfolder name");
      return;
    }

    // Check if name changed and if new name already exists
    if (
      newSubfolderName !== subfolderName &&
      parentFolder.subfolders[newSubfolderName]
    ) {
      alert("A subfolder with this name already exists");
      return;
    }

    // Update subfolder
    if (newSubfolderName !== subfolderName) {
      // Rename subfolder
      const subfolderData = parentFolder.subfolders[subfolderName];
      delete parentFolder.subfolders[subfolderName];
      parentFolder.subfolders[newSubfolderName] = {
        ...subfolderData,
        color: selectedColor,
        icon: selectedIcon,
        textColor: selectedTextColor,
      };
    } else {
      // Just update properties
      parentFolder.subfolders[subfolderName].color = selectedColor;
      parentFolder.subfolders[subfolderName].icon = selectedIcon;
      parentFolder.subfolders[subfolderName].textColor = selectedTextColor;
    }

    // Save to storage
    chrome.storage.local.set({ folderData: folderData }, () => {});

    modal.remove();

    // Force complete recreation of the dropdown
    console.log(
      "🔄 Starting complete dropdown recreation for subfolder text color update"
    );

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
        console.log(
          "✅ New dropdown created and shown with updated subfolder data"
        );
      } else {
      }
    }, 50);
  });

  // Cancel
  modal
    .querySelector("#cancel-edit-subfolder")
    .addEventListener("click", () => {
      modal.remove();
    });

  // Close button
  modal.querySelector("#close-edit-subfolder").addEventListener("click", () => {
    modal.remove();
  });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Initialize preview
  updateEditPreview();
}

// Show modal to edit parent folder
function showEditFolderModal(folderName) {
  const folderInfo = folderData[folderName];
  if (!folderInfo) return;

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
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 15px 0; color: #333;">Edit Folder "${folderName}"</h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Folder Name:</label>
        <input type="text" id="edit-folder-name-input" value="${folderName}" maxlength="20"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
          <span id="edit-folder-char-count">${
            folderName.length
          }</span>/20 characters
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Icon:</label>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
          ${[
            "🎮",
            "💻",
            "🎵",
            "📚",
            "🎨",
            "🏃",
            "🍔",
            "✈️",
            "🏠",
            "💡",
            "🔧",
            "⭐",
          ]
            .map(
              (icon) => `
            <button class="edit-icon-option" data-icon="${icon}" style="padding: 8px; border: 2px solid ${
                icon === folderInfo.icon ? "#007bff" : "#ddd"
              }; border-radius: 4px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">${icon}</button>
          `
            )
            .join("")}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Color:</label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${[
            "#ff6b6b",
            "#4ecdc4",
            "#9b59b6",
            "#e74c3c",
            "#f39c12",
            "#27ae60",
            "#3498db",
            "#34495e",
          ]
            .map(
              (color) => `
            <button class="edit-color-option" data-color="${color}" style="padding: 12px; border: 2px solid ${
                color === folderInfo.color ? "#007bff" : "#ddd"
              }; border-radius: 4px; background: ${color}; cursor: pointer; transition: all 0.2s;"></button>
          `
            )
            .join("")}
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-edit-folder" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
        <button id="save-edit-folder" style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize with current selections
  let selectedIcon = folderInfo.icon;
  let selectedColor = folderInfo.color;

  // Character counter
  const nameInput = modal.querySelector("#edit-folder-name-input");
  const charCount = modal.querySelector("#edit-folder-char-count");

  nameInput.addEventListener("input", () => {
    const count = nameInput.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 15 ? "#dc3545" : "#666";
  });

  // Icon selection
  modal.querySelectorAll(".edit-icon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".edit-icon-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedIcon = btn.dataset.icon;
    });
  });

  // Color selection
  modal.querySelectorAll(".edit-color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".edit-color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedColor = btn.dataset.color;
    });
  });

  // Save changes
  modal.querySelector("#save-edit-folder").addEventListener("click", () => {
    const newFolderName = nameInput.value.trim();
    if (newFolderName && newFolderName !== folderName) {
      // If name changed, we need to update the folder key
      updateFolderName(folderName, newFolderName, selectedIcon, selectedColor);
    } else if (newFolderName === folderName) {
      // Just update icon and color
      updateFolderProperties(folderName, selectedIcon, selectedColor);
    } else {
      alert("Please enter a valid folder name");
      return;
    }
    modal.remove();
  });

  // Cancel
  modal.querySelector("#cancel-edit-folder").addEventListener("click", () => {
    modal.remove();
  });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Update folder name (requires creating new key and deleting old one)
function updateFolderName(oldName, newName, color, textColor) {
  if (folderData[newName]) {
    alert("A folder with this name already exists");
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

// Update folder properties (icon and color only)
function updateFolderProperties(folderName, color, textColor) {
  if (folderData[folderName]) {
    folderData[folderName].color = color;
    folderData[folderName].textColor = textColor;
    console.log(
      "✅ Updated folderData for",
      folderName,
      ":",
      folderData[folderName]
    );

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

// Show modal to create subfolder
function showCreateSubfolderModal(parentFolderName) {
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
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 15px 0; color: #333;">Create Subfolder in "${parentFolderName}"</h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Subfolder Name:</label>
        <input type="text" id="subfolder-name-input" placeholder="e.g., FPS, Racing, Strategy..." maxlength="20"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
          <span id="subfolder-char-count">0</span>/20 characters
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Icon:</label>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
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
            <button class="icon-option" data-icon="${icon}" style="padding: 8px; border: 2px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">${icon}</button>
          `
            )
            .join("")}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Color Variation:</label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${[
            {
              name: "Light",
              value: lightenColor(folderData[parentFolderName].color, 30),
            },
            {
              name: "Medium",
              value: lightenColor(folderData[parentFolderName].color, 15),
            },
            {
              name: "Pastel",
              value: lightenColor(folderData[parentFolderName].color, 40),
            },
            {
              name: "Muted",
              value: lightenColor(folderData[parentFolderName].color, -10),
            },
          ]
            .map(
              (colorOption) => `
            <button class="color-option" data-color="${colorOption.value}" style="padding: 12px; border: 2px solid #ddd; border-radius: 4px; background: ${colorOption.value}; cursor: pointer; transition: all 0.2s; position: relative;" title="${colorOption.name}">
              <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); font-size: 10px; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.5);">${colorOption.name}</span>
            </button>
          `
            )
            .join("")}
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666; text-align: center;">Choose a variation of the parent folder color</p>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-subfolder" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
        <button id="create-subfolder" style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">Create Subfolder</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize with default selections
  let selectedIcon = "📂";
  let selectedColor = lightenColor(folderData[parentFolderName].color, 30); // Default to light variation

  // Character counter
  const nameInput = modal.querySelector("#subfolder-name-input");
  const charCount = modal.querySelector("#subfolder-char-count");

  nameInput.addEventListener("input", () => {
    const count = nameInput.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 15 ? "#dc3545" : "#666";
  });

  // Icon selection
  modal.querySelectorAll(".icon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".icon-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedIcon = btn.dataset.icon;
    });
  });

  // Color selection
  modal.querySelectorAll(".color-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal
        .querySelectorAll(".color-option")
        .forEach((b) => (b.style.borderColor = "#ddd"));
      btn.style.borderColor = "#007bff";
      selectedColor = btn.dataset.color;
    });
  });

  // Create subfolder
  modal.querySelector("#create-subfolder").addEventListener("click", () => {
    const subfolderName = nameInput.value.trim();
    if (subfolderName) {
      createSubfolder(
        parentFolderName,
        subfolderName,
        selectedIcon,
        selectedColor
      );
      modal.remove();
    } else {
      alert("Please enter a subfolder name");
    }
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

// Create subfolder
function createSubfolder(parentFolderName, subfolderName, icon, color) {
  // Check subfolder limit (2 per parent folder)
  const currentSubfolderCount = Object.keys(
    folderData[parentFolderName].subfolders || {}
  ).length;
  if (currentSubfolderCount >= 2) {
    alert(
      "Maximum of 2 subfolders per parent folder reached. Upgrade to Premium for unlimited subfolders!"
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
    textColor: "#ffffff",
  };

  refreshFolderDropdown();
}

// Toggle folder expansion (show/hide subfolders)
function toggleFolderExpansion(folderName) {
  if (folderData[folderName]) {
    folderData[folderName].expanded = !folderData[folderName].expanded;
    console.log(
      `📁 Folder ${folderName} expanded: ${folderData[folderName].expanded}`
    );

    // Refresh the dropdown to show/hide subfolders
    refreshFolderDropdown();
  }
}

// Button text is set during creation and stays simple

// Refresh the folder dropdown (recreate it with current state)
function refreshFolderDropdown() {
  if (folderDropdown) {
    // Remove the old dropdown
    folderDropdown.remove();
    folderDropdown = null;

    // Create a new one with current state
    createFolderDropdown();
  } else {
  }
}

// Show subscriptions in a specific subfolder
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
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; position: relative;">
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

  // Close modal functionality
  const closeBtn = modal.querySelector("#close-subfolder-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Add subscriptions button functionality
  const addSubscriptionsBtn = modal.querySelector(
    "#add-subscriptions-to-folder"
  );
  if (addSubscriptionsBtn) {
    addSubscriptionsBtn.addEventListener("click", () => {
      modal.remove();
      showAllSubscriptions();
    });
  }

  // Add click listeners for channel names and buttons
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("channel-name")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      if (subscriptionItem) {
        const channelId = subscriptionItem.dataset.channelId;
        if (channelId) {
          window.open(`https://www.youtube.com/channel/${channelId}`, "_blank");
        }
      }
    } else if (e.target.classList.contains("toggle-description")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const description = subscriptionItem.querySelector(
        ".channel-description"
      );
      const button = e.target;

      if (description.style.display === "none") {
        description.style.display = "block";
        button.textContent = "Hide Description";
        button.style.background = "#bbdefb";
      } else {
        description.style.display = "none";
        button.textContent = "Show Description";
        button.style.background = "#e3f2fd";
      }
    } else if (e.target.classList.contains("remove-from-subfolder")) {
      const subscriptionItem = e.target.closest(".subscription-item");
      const channelId = subscriptionItem.dataset.channelId;
      const channelName =
        subscriptionItem.querySelector(".channel-name").textContent;

      if (
        confirm(
          `Remove "${channelName}" from "${folderName} > ${subfolderName}"?\n\nThis will:\n• Remove them from this folder only\n• Keep your YouTube subscription active\n• They can be moved to other folders later`
        )
      ) {
        // Find and remove the subscription from the subfolder
        const subfolderInfo =
          folderData[folderName]?.subfolders?.[subfolderName];
        if (subfolderInfo && subfolderInfo.subscriptions) {
          subfolderInfo.subscriptions = subfolderInfo.subscriptions.filter(
            (sub) => sub.snippet?.resourceId?.channelId !== channelId
          );

          // Save the updated data safely
          safeSaveFolderData(folderData);

          // Update folder counters in real-time
          updateFolderCounts();

          // Refresh the modal
          modal.remove();
          showSubfolderSubscriptions(folderName, subfolderName);
        }
      }
    } else if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show subscriptions in a specific folder
function showFolderSubscriptions(folderName) {
  const folderInfo = folderData[folderName];
  // Parent folders don't hold subscriptions directly - collect from all subfolders
  const subscriptions = [];
  if (folderInfo && folderInfo.subfolders) {
    Object.values(folderInfo.subfolders).forEach((subfolder) => {
      if (subfolder.subscriptions) {
        subscriptions.push(...subfolder.subscriptions);
      }
    });
  }

  // Create a simple modal to show folder contents
  const modal = document.createElement("div");
  modal.id = "folder-modal";
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
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 500px; max-height: 400px; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #1976d2;">📁 ${folderName} (${
    subscriptions.length
  })</h3>
        <button id="close-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div id="folder-subscriptions">
        ${
          subscriptions.length === 0
            ? '<p style="color: #666; text-align: center; padding: 20px;">No subscriptions in this folder yet.<br>Drag subscriptions here to organize them!</p>'
            : subscriptions
                .map(
                  (sub) => `
            <div class="subscription-item" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
              <img src="${
                sub.thumbnails?.default?.url || ""
              }" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
              <span style="flex: 1;">${
                sub.snippet?.title || "Unknown Channel"
              }</span>
              <button class="remove-from-folder" data-channel-id="${
                sub.snippet?.resourceId?.channelId
              }" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>
            </div>
          `
                )
                .join("")
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add close handler
  const closeBtn = modal.querySelector("#close-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Add remove handlers
  const removeBtns = modal.querySelectorAll(".remove-from-folder");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const channelId = btn.dataset.channelId;
      removeFromFolder(channelId, folderName);
      modal.remove();
      showFolderSubscriptions(folderName); // Refresh
    });
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show all subscriptions
function showAllSubscriptions() {
  console.log(
    "showAllSubscriptions called with",
    userSubscriptions.length,
    "subscriptions"
  );

  // Check if user has subscriptions
  if (userSubscriptions.length === 0) {
    showLoginPrompt();
    return;
  }

  console.log("=== SUBSCRIPTION DATA DEBUG ===");
  console.log("Total subscriptions:", userSubscriptions.length);
  console.log(
    "First subscription RAW DATA:",
    JSON.stringify(userSubscriptions[0], null, 2)
  );
  console.log("=== END DEBUG ===");

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
          .map(
            (sub) => `
        <div class="subscription-item" data-channel-id="${
          sub.snippet?.resourceId?.channelId
        }" style="display: flex; align-items: center; padding: 16px; background: #fafafa; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e0e0e0; gap: 12px;">
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
              <span class="folder-location" style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;">
                📁 Not organized
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <button class="remove-subscription" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 8px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 80px; position: relative;" onmouseover="this.style.background='#ffcdd2'" onmouseout="this.style.background='#ffebee'" title="Remove from current folder only (keeps subscription)">
              🗑️ Remove
            </button>
            <select class="folder-select" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; background: white; font-size: 11px; min-width: 160px; max-width: 160px; font-weight: 500;">
              <option value="">📂 Move to folder...</option>
              ${
                Object.keys(folderData).length > 0
                  ? Object.entries(folderData)
                      .map(([folderName, folderInfo]) => {
                        let options = "";

                        // Only add subfolders (parent folders are just categories)
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
          </div>
        </div>
        `
          )
          .join("")}
      </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Make panel draggable
  const panel = modal.querySelector("#subscription-manager-panel");
  const header = modal.querySelector("#panel-header");
  let isDragging = false;
  let startX;
  let startY;

  // Initialize panel position
  const rect = panel.getBoundingClientRect();
  let initialX = rect.left;
  let initialY = rect.top;

  // Mouse down event
  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return; // Don't drag when clicking buttons

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    header.style.cursor = "grabbing";

    // Prevent text selection while dragging
    e.preventDefault();
  });

  // Mouse move event
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      // Update panel position
      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.transform = "none";
    }
  });

  // Mouse up event
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = "move";

      // Update initial position for next drag
      const rect = panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
    }
  });

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

    // Handle remove button clicks
    if (e.target.classList.contains("remove-subscription")) {
      const channelId = subscriptionItem.dataset.channelId;
      const channelName =
        subscriptionItem.querySelector(".channel-name").textContent;

      if (channelId) {
        // Show confirmation dialog
        const confirmed = confirm(
          `Remove "${channelName}" from current folder?\n\nThis will:\n• Remove them from the current folder only\n• Keep your YouTube subscription active\n• They can be moved to other folders later`
        );

        if (confirmed) {
          // Remove from all folders (but keep YouTube subscription)
          removeSubscriptionFromAllFolders(channelId);

          // Update the folder location display
          const folderLocation =
            subscriptionItem.querySelector(".folder-location");
          if (folderLocation) {
            folderLocation.textContent = "📁 Not organized";
            folderLocation.style.background = "#e3f2fd";
            folderLocation.style.color = "#1976d2";
          }

          // Reset the folder select dropdown
          const folderSelect = subscriptionItem.querySelector(".folder-select");
          if (folderSelect) {
            folderSelect.value = "";
          }

          // Update folder counters in real-time
          updateFolderCounts();
        }
      }
    }
  });

  // Update folder locations for existing subscriptions
  updateFolderLocations(modal);

  // Add folder selection handlers
  const folderSelects = modal.querySelectorAll(".folder-select");
  folderSelects.forEach((select) => {
    select.addEventListener("change", (e) => {
      if (e.target.value) {
        const subscriptionItem = e.target.closest(".subscription-item");
        const channelId = subscriptionItem.dataset.channelId;

        // Parse the selection value
        const [type, folderName, subfolderName] = e.target.value.split(":");

        if (type === "subfolder") {
          // First remove from all folders, then add to new subfolder
          removeSubscriptionFromAllFolders(channelId);
          addToSubfolder(channelId, folderName, subfolderName);
          // Update counts once after both operations
          updateFolderCounts();

          // Update folder location display
          const subscriptionItem = e.target.closest(".subscription-item");
          const folderLocation =
            subscriptionItem.querySelector(".folder-location");
          folderLocation.textContent = `📁 ${folderName} > ${subfolderName}`;
          folderLocation.style.background = "#e8f5e8";
          folderLocation.style.color = "#2e7d32";

          // Update placeholder to show selected folder
          e.target.querySelector(
            'option[value=""]'
          ).textContent = `Moved to: ${folderName} > ${subfolderName}`;
        }

        // Reset selection after a short delay to show the update
        setTimeout(() => {
          e.target.value = "";
        }, 1000);
      }
    });
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Add subscription to folder
function addToFolder(channelId, folderName) {
  const subscription = userSubscriptions.find(
    (sub) => sub.snippet?.resourceId?.channelId === channelId
  );
  if (
    subscription &&
    folderData[folderName] &&
    !folderData[folderName].subscriptions.find(
      (sub) => sub.snippet?.resourceId?.channelId === channelId
    )
  ) {
    folderData[folderName].subscriptions.push(subscription);
    updateFolderCounts();
    chrome.storage.local.set({ folderData: folderData });
  }
}

// Update folder locations for subscriptions in the modal
function updateFolderLocations(modal) {
  const subscriptionItems = modal.querySelectorAll(".subscription-item");

  subscriptionItems.forEach((item) => {
    const channelId = item.dataset.channelId;
    const folderLocation = item.querySelector(".folder-location");

    // Find which folder this subscription is in
    let foundLocation = null;

    // Check subfolders only (parent folders don't hold subscriptions directly)
    Object.keys(folderData).forEach((folderName) => {
      if (folderData[folderName].subfolders) {
        Object.keys(folderData[folderName].subfolders).forEach(
          (subfolderName) => {
            if (
              folderData[folderName].subfolders[subfolderName].subscriptions
            ) {
              const found = folderData[folderName].subfolders[
                subfolderName
              ].subscriptions.find(
                (sub) => sub.snippet?.resourceId?.channelId === channelId
              );
              if (found) {
                foundLocation = `📁 ${folderName} > ${subfolderName}`;
              }
            }
          }
        );
      }
    });

    if (foundLocation) {
      folderLocation.textContent = foundLocation;
      folderLocation.style.background = "#e8f5e8";
      folderLocation.style.color = "#2e7d32";
    } else {
      folderLocation.textContent = "📁 Not organized";
      folderLocation.style.background = "#e3f2fd";
      folderLocation.style.color = "#1976d2";
    }
  });
}

// Unsubscribe from a YouTube channel
async function unsubscribeFromChannel(channelId, subscriptionItem, modal) {
  try {
    // Get the subscription ID from the subscription data
    const subscription = userSubscriptions.find(
      (sub) => sub.snippet?.resourceId?.channelId === channelId
    );

    if (!subscription || !subscription.id) {
      alert("Error: Could not find subscription ID");
      return;
    }

    // Get access token
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["accessToken"], resolve);
    });

    if (!result.accessToken) {
      alert("Error: Not logged in to YouTube");
      return;
    }

    // Call YouTube API to unsubscribe
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?id=${subscription.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${result.accessToken}`,
        },
      }
    );

    if (response.ok) {
      // Remove from all folders
      removeSubscriptionFromAllFolders(channelId);

      // Remove from userSubscriptions array
      const index = userSubscriptions.findIndex(
        (sub) => sub.snippet?.resourceId?.channelId === channelId
      );
      if (index !== -1) {
        userSubscriptions.splice(index, 1);
      }

      // Update storage
      chrome.storage.local.set({ userSubscriptions: userSubscriptions });

      // Remove the subscription item from the UI
      subscriptionItem.remove();

      // Update the count in the header
      const remainingCount =
        modal.querySelectorAll(".subscription-item").length;
      const headerTitle = modal.querySelector("#panel-header h3");
      const headerSubtitle = modal.querySelector("#panel-header p");
      if (headerTitle) {
        headerTitle.textContent = "Subscription Manager";
      }
      if (headerSubtitle) {
        headerSubtitle.textContent = `${remainingCount} channels organized`;
      }

      // Show success message
      console.log(`Successfully unsubscribed from channel: ${channelId}`);
    } else {
      const errorText = await response.text();
      alert(`Failed to unsubscribe: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error unsubscribing:", error);
    alert("Error unsubscribing from channel. Please try again.");
  }
}

// Remove subscription from all folders
function removeSubscriptionFromAllFolders(channelId) {
  let removed = false;

  // Remove from all subfolders only (parent folders don't hold subscriptions directly)
  Object.keys(folderData).forEach((folderName) => {
    if (folderData[folderName].subfolders) {
      Object.keys(folderData[folderName].subfolders).forEach(
        (subfolderName) => {
          if (folderData[folderName].subfolders[subfolderName].subscriptions) {
            const index = folderData[folderName].subfolders[
              subfolderName
            ].subscriptions.findIndex(
              (sub) => sub.snippet?.resourceId?.channelId === channelId
            );
            if (index !== -1) {
              folderData[folderName].subfolders[
                subfolderName
              ].subscriptions.splice(index, 1);
              removed = true;
            }
          }
        }
      );
    }
  });

  // Save if something was removed
  if (removed) {
    chrome.storage.local.set({ folderData: folderData });
  }
}

// Add subscription to subfolder
function addToSubfolder(channelId, folderName, subfolderName) {
  const subscription = userSubscriptions.find(
    (sub) => sub.snippet?.resourceId?.channelId === channelId
  );

  if (
    subscription &&
    folderData[folderName] &&
    folderData[folderName].subfolders &&
    folderData[folderName].subfolders[subfolderName]
  ) {
    // Check subscription limit (15 per subfolder)
    const currentSubscriptionCount =
      folderData[folderName].subfolders[subfolderName].subscriptions.length;
    if (currentSubscriptionCount >= 15) {
      alert(
        "Maximum of 15 subscriptions per subfolder reached. Upgrade to Premium for unlimited subscriptions!"
      );
      return;
    }

    folderData[folderName].subfolders[subfolderName].subscriptions.push(
      subscription
    );
    chrome.storage.local.set({ folderData: folderData });
  }
}

// Remove subscription from folder
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

// Update folder counts in dropdown
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
        // Count only subfolder subscriptions (parent folders don't hold subscriptions directly)
        const subfolderSubscriptions = Object.values(
          folderData[folderName].subfolders || {}
        ).reduce(
          (sum, subfolder) => sum + (subfolder.subscriptions?.length || 0),
          0
        );

        count.textContent = `(${subfolderSubscriptions})`;
      } else {
        count.textContent = `(0)`;
      }
    });

    // Update subfolder counts
    const subfolderCounts =
      folderDropdown.querySelectorAll(".subfolder .count");
    subfolderCounts.forEach((count) => {
      const folderItem = count.closest(".subfolder");
      const folderName = folderItem.dataset.folder;
      const subfolderName = folderItem.dataset.subfolder;

      if (folderData[folderName]?.subfolders?.[subfolderName]) {
        const subfolderSubscriptions =
          folderData[folderName].subfolders[subfolderName].subscriptions
            ?.length || 0;
        count.textContent = `(${subfolderSubscriptions})`;
      } else {
        count.textContent = `(0)`;
      }
    });
  }
}

// Show create folder modal
function showCreateFolderModal() {
  const modal = document.createElement("div");
  modal.id = "create-folder-modal";
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
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 450px; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1976d2;">✨ Create New Folder</h3>
        <button id="close-create-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Folder Name:</label>
        <input type="text" id="folder-name-input" placeholder="e.g., Tech, Gaming, Music..." maxlength="20"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        <div style="text-align: right; font-size: 11px; color: #666; margin-top: 2px;">
          <span id="char-count">0</span>/20 characters (10 for display)
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Choose an Icon:</label>
        <div id="icon-selector" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 10px;">
          <div class="icon-option" data-icon="💻" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">💻</div>
          <div class="icon-option" data-icon="🎮" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🎮</div>
          <div class="icon-option" data-icon="🎵" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🎵</div>
          <div class="icon-option" data-icon="📰" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">📰</div>
          <div class="icon-option" data-icon="🎬" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🎬</div>
          <div class="icon-option" data-icon="📚" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">📚</div>
          <div class="icon-option" data-icon="🏃" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🏃</div>
          <div class="icon-option" data-icon="🍳" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🍳</div>
          <div class="icon-option" data-icon="🎨" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🎨</div>
          <div class="icon-option" data-icon="🚀" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">🚀</div>
          <div class="icon-option" data-icon="💡" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">💡</div>
          <div class="icon-option" data-icon="📁" style="padding: 8px; text-align: center; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 18px; transition: all 0.2s;">📁</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Choose a Color:</label>
        <div id="color-selector" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px;">
          <div class="color-option" data-color="#1976d2" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #1976d2;"></div>
          <div class="color-option" data-color="#4caf50" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #4caf50;"></div>
          <div class="color-option" data-color="#ff9800" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #ff9800;"></div>
          <div class="color-option" data-color="#f44336" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #f44336;"></div>
          <div class="color-option" data-color="#9c27b0" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #9c27b0;"></div>
          <div class="color-option" data-color="#00bcd4" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #00bcd4;"></div>
          <div class="color-option" data-color="#795548" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #795548;"></div>
          <div class="color-option" data-color="#607d8b" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #ddd; transition: all 0.2s; background-color: #607d8b;"></div>
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-create" style="background: #f5f5f5; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
        <button id="confirm-create" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
          Create Folder
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus on input
  const input = modal.querySelector("#folder-name-input");
  const charCount = modal.querySelector("#char-count");
  input.focus();

  // Add character counter
  input.addEventListener("input", () => {
    const length = input.value.length;
    charCount.textContent = length;
    if (length > 10) {
      charCount.style.color = "#dc3545";
    } else {
      charCount.style.color = "#666";
    }
  });

  // Initialize selections
  let selectedIcon = "📁";
  let selectedColor = "#1976d2";

  // Add event handlers for icon selection
  const iconOptions = modal.querySelectorAll(".icon-option");
  iconOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Remove selection from all icons
      iconOptions.forEach((opt) => {
        opt.style.border = "2px solid #ddd";
        opt.style.backgroundColor = "transparent";
      });
      // Select this icon
      option.style.border = "2px solid #1976d2";
      option.style.backgroundColor = "#e3f2fd";
      selectedIcon = option.dataset.icon;
    });
  });

  // Add event handlers for color selection
  const colorOptions = modal.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Remove selection from all colors
      colorOptions.forEach((opt) => {
        opt.style.border = "2px solid #ddd";
        opt.style.transform = "scale(1)";
      });
      // Select this color
      option.style.border = "2px solid #333";
      option.style.transform = "scale(1.1)";
      selectedColor = option.dataset.color;
    });
  });

  // Set default selections
  iconOptions[11].click(); // Select default folder icon
  colorOptions[0].click(); // Select default blue color

  // Add event handlers
  const closeBtn = modal.querySelector("#close-create-modal");
  const cancelBtn = modal.querySelector("#cancel-create");
  const confirmBtn = modal.querySelector("#confirm-create");

  const closeModal = () => modal.remove();

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  confirmBtn.addEventListener("click", () => {
    const folderName = input.value.trim();
    if (folderName && !folderData[folderName]) {
      // Limit folder name to 10 characters to account for subscription count
      const truncatedName =
        folderName.length > 10
          ? folderName.substring(0, 10) + "..."
          : folderName;
      createFolder(truncatedName, selectedIcon, selectedColor);
      closeModal();
    } else if (folderData[folderName]) {
      alert("A folder with this name already exists!");
    } else {
      alert("Please enter a folder name!");
    }
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      confirmBtn.click();
    }
  });
}

// Create a new folder
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
  console.log(
    `✅ Created folder: ${folderName} with icon ${icon} and color ${color}`
  );

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

// Show premium upgrade modal
function showPremiumUpgradeModal() {
  const modal = document.createElement("div");
  modal.id = "premium-upgrade-modal";
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
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 400px; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #666; font-size: 18px;">📁 Folder Limit Reached</h3>
        <button id="close-premium-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="color: #666; margin-bottom: 15px; font-size: 14px;">
          You've used your free folder. Premium users get unlimited folders and more features.
        </p>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            💡 <strong>Coming Soon:</strong> Premium features are in development.
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="close-premium" style="background: #f5f5f5; color: #666; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Close
        </button>
        <button id="notify-premium" style="background: #1976d2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Notify Me
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event handlers
  const closeBtn = modal.querySelector("#close-premium-modal");
  const laterBtn = modal.querySelector("#close-premium");
  const notifyBtn = modal.querySelector("#notify-premium");

  const closeModal = () => modal.remove();

  closeBtn.addEventListener("click", closeModal);
  laterBtn.addEventListener("click", closeModal);

  notifyBtn.addEventListener("click", () => {
    alert("Thanks! We'll notify you when Premium features are ready! 🎉");
    closeModal();
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// Removed unused floating button function

// Create the folder panel
function createFolderPanel() {
  logStatus("Creating panel...", "info");

  const sidebar = document.querySelector("#secondary");

  if (!sidebar) {
    logStatus(
      "No sidebar found - YouTube layout may not be loaded yet",
      "warn"
    );
    return null;
  }

  // Avoid duplicates
  if (document.querySelector("#yt-folder-panel")) {
    logStatus("Panel already exists, returning existing panel", "info");
    return document.querySelector("#yt-folder-panel");
  }

  const panel = document.createElement("div");
  panel.id = "yt-folder-panel";
  panel.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 300px;
    background: #e3f2fd;
    border: 2px solid #2196f3;
    padding: 15px;
    border-radius: 8px;
    font-family: 'Roboto', sans-serif;
    font-size: 14px;
    font-weight: bold;
    color: #1976d2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
  `;
  panel.innerText = "🎯 YT Extension Panel - Loading...";

  // Add panel as a floating element on the page
  document.body.appendChild(panel);

  logStatus("Panel created successfully", "info");
  return panel;
}

// Update panel content
function updatePanel(message, isLoading = false) {
  const panel = document.querySelector("#yt-folder-panel");
  if (!panel) {
    return;
  }

  panel.innerText = isLoading
    ? "🔄 Loading..."
    : `🎯 YT Extension Panel - ${message}`;
  panel.style.background = isLoading ? "#fff3e0" : "#e8f5e8";
  panel.style.borderColor = isLoading ? "#ff9800" : "#4caf50";
  panel.style.color = isLoading ? "#f57c00" : "#2e7d32";
}

// Load user data when logged in (now gets data from background.js)
async function loadUserData(token) {
  try {
    // Get subscriptions from storage (set by background.js)
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
        userSubscriptions = result.userSubscriptions;
        console.log(
          `✅ Logged in! Found ${userSubscriptions.length} subscriptions.`
        );
      } else {
        console.log("❌ No subscriptions found. Please try logging in again.");
      }
    });
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Handle login state changes
function handleLoginState(token) {
  console.log(
    "🔄 handleLoginState called with token:",
    token ? "exists" : "none"
  );
  isLoggedIn = !!token;

  if (isLoggedIn) {
    loadUserData(token);
  } else {
    // User logged out - remove the panel and sidebar button
    if (folderPanel && folderPanel.parentNode) {
      folderPanel.parentNode.removeChild(folderPanel);
      folderPanel = null;
    }

    const sidebarButton = document.querySelector("#yt-manage-button");
    if (sidebarButton && sidebarButton.parentNode) {
      sidebarButton.parentNode.removeChild(sidebarButton);
    }

    // Remove new guide entry button
    const guideEntryButton = document.querySelector("#yt-manage-guide-entry");
    if (guideEntryButton && guideEntryButton.parentNode) {
      guideEntryButton.parentNode.removeChild(guideEntryButton);
    }

    // Reset the button creation flag
    sidebarButtonCreated = false;

    // Removed cleanup for unused button types
  }
}

// Initialize panel and check login status
function initialize() {
  console.log("=== INITIALIZE FUNCTION CALLED ===");
  logStatus("Initializing extension", "info");

  // Load saved folder data from storage first
  safeLoadFolderData()
    .then((data) => {
      folderData = data;

      // Button text is set during creation

      // Check login status first, only create panel if logged in
      chrome.storage.local.get("accessToken", ({ accessToken }) => {
        console.log(
          "🔍 Checking access token:",
          accessToken ? "Found" : "Not found"
        );
        if (accessToken) {
          // User is logged in, create sidebar button (no panel needed)

          // Delay sidebar button creation to give YouTube time to load
          setTimeout(() => {
            let sidebarButton = createSidebarButton();

            if (sidebarButton) {
            } else {
              console.error("❌ Button creation failed");
              logStatus("Failed to create button", "error");
            }
          }, 1000);

          if (folderPanel) {
            logStatus("Panel created successfully", "info");
            handleLoginState(accessToken);
          } else {
            console.error("❌ Failed to create panel");
            logStatus("Failed to create panel", "error");
          }
        } else {
          // User not logged in, create panel with login prompt
          logStatus(
            "User not logged in, creating panel with login prompt",
            "info"
          );

          // No panel needed when not logged in

          // Delay sidebar button creation to give YouTube time to load
          setTimeout(() => {
            let sidebarButton = createSidebarButton();
            if (sidebarButton) {
              logStatus("Sidebar button created", "info");
            } else {
              console.error("❌ Button creation failed");
              logStatus("Failed to create button", "error");
            }
          }, 1000);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load folder data:", error);
      folderData = {}; // Start with empty data if loading fails

      // Folder data loading failed, but main initialization will handle button creation
    });
}

// Listen for storage changes (when user logs in/out)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.accessToken) {
    logStatus("Token updated, handling login state", "info");

    const newToken = changes.accessToken.newValue;
    if (newToken) {
      // User logged in, button will be created by main initialization
    }

    handleLoginState(newToken);
  }
});

// Listen for subscription updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  if (message.type === "subscriptionsUpdated") {
    console.log(
      "Received subscription update via message:",
      message.subscriptions
    );
    userSubscriptions = message.subscriptions || [];

    // Debug: Log first subscription to check data structure
    if (userSubscriptions.length > 0) {
      console.log("First subscription data:", userSubscriptions[0]);
      console.log(
        "Channel ID:",
        userSubscriptions[0].snippet?.resourceId?.channelId
      );
      console.log("Title:", userSubscriptions[0].snippet?.title);
      console.log(
        "Thumbnail:",
        userSubscriptions[0].snippet?.thumbnails?.default?.url
      );
      console.log("Full snippet:", userSubscriptions[0].snippet);
      console.log("Resource ID:", userSubscriptions[0].snippet?.resourceId);
      console.log("Thumbnails:", userSubscriptions[0].snippet?.thumbnails);
    }

    // Log subscription count
    console.log(
      `✅ Logged in! Found ${userSubscriptions.length} subscriptions.`
    );

    // Refresh dropdown if it exists
    if (folderDropdown) {
      refreshFolderDropdown();
    }
  }
});

// MutationObserver removed - was causing YouTube to freeze

// Add a test element to verify extension is loading
console.log("🎯 CONTENT SCRIPT LOADED - YouTube Extension");

// Load subscriptions from storage on startup
chrome.storage.local.get(["userSubscriptions"], (result) => {
  if (result.userSubscriptions && result.userSubscriptions.length > 0) {
    console.log(
      "Loading subscriptions from storage on startup:",
      result.userSubscriptions.length
    );
    userSubscriptions = result.userSubscriptions;

    // Debug: Log first subscription to check data structure
    if (userSubscriptions.length > 0) {
      console.log("First subscription data:", userSubscriptions[0]);
      console.log(
        "Channel ID:",
        userSubscriptions[0].snippet?.resourceId?.channelId
      );
      console.log("Title:", userSubscriptions[0].snippet?.title);
      console.log(
        "Thumbnail:",
        userSubscriptions[0].snippet?.thumbnails?.default?.url
      );
      console.log("Full snippet:", userSubscriptions[0].snippet);
      console.log("Resource ID:", userSubscriptions[0].snippet?.resourceId);
      console.log("Thumbnails:", userSubscriptions[0].snippet?.thumbnails);
    }
  } else {
    console.log("No subscriptions found in storage on startup");
  }
});

const testElement = document.createElement("div");
testElement.id = "yt-extension-test";
testElement.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 9999;
  display: none;
`;
testElement.textContent = "YT Extension Loaded";
document.body.appendChild(testElement);

// Show test element briefly
setTimeout(() => {
  testElement.style.display = "block";
  setTimeout(() => {
    testElement.style.display = "none";
  }, 3000);
}, 1000);

// Simple and reliable initialization

// Try to initialize immediately
if (document.querySelector("#secondary")) {
  try {
    initialize();
  } catch (error) {
    console.error("❌ Error during initialization:", error);
  }
} else {
  // Wait for sidebar to appear
  setTimeout(() => {
    if (document.querySelector("#secondary") && !folderPanel) {
      try {
        initialize();
      } catch (error) {
        console.error("❌ Error during retry initialization:", error);
      }
    }
  }, 2000);
}
