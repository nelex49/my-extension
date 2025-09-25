/** @format */

// Constants and configuration for YouTube Subscription Manager

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
  DEBUG: false, // Set to false for production
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

// Make them globally available
window.CSS_CONSTANTS = CSS_CONSTANTS;
window.CONFIG = CONFIG;
