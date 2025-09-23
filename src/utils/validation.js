/** @format */

// Input validation functions for YouTube Subscription Manager

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

// Make them globally available
window.validateChannelId = validateChannelId;
window.validateFolderName = validateFolderName;
window.validateSubfolderName = validateSubfolderName;
window.validateFolderData = validateFolderData;

