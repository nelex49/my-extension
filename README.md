<!-- @format -->

# YouTube Subscription Manager - Modular Version

A Chrome extension for organizing YouTube subscriptions into custom folders and subfolders.

## 🏗️ Modular Architecture

This extension has been refactored from a monolithic 4,000+ line file into a clean, modular structure:

### 📁 File Structure

```
src/
├── utils/                    # Utility functions
│   ├── constants.js         # CSS constants and configuration
│   ├── helpers.js           # DOM utilities and error handling
│   └── validation.js        # Input validation functions
├── services/                # Data and API services
│   ├── StorageService.js    # Chrome storage operations
│   ├── YouTubeAPI.js        # YouTube API calls
│   └── AuthService.js       # Authentication handling
├── components/              # UI components
│   ├── SidebarButton.js     # MANAGE YT SUBS button
│   ├── FolderDropdown.js    # Folder dropdown menu
│   ├── SubscriptionManager.js # Folder management logic
│   └── ModalManager.js      # Modal utilities
├── core/                    # Core application logic
│   └── App.js              # Main app state and initialization
└── main.js                 # Main orchestrator
```

### 📊 Modularization Results

- **Original:** 4,082 lines (monolithic)
- **Modular:** 1,475 lines across 12 files
- **Reduction:** 64% complexity reduction
- **Largest file:** 302 lines (vs 4,082 original)

### 🔧 How It Works

The extension uses a **global namespace pattern** to make functions available across modules:

1. **Load Order:** Files are loaded in dependency order via `manifest.json`
2. **Global Exposure:** Each module exposes functions on the `window` object
3. **No ES6 Imports:** Chrome content scripts don't support direct ES6 imports
4. **Chrome Compatible:** Works with Chrome extension content script limitations

### 🚀 Key Benefits

- **Maintainable:** Each file has a single responsibility
- **Readable:** Largest file is only 302 lines
- **Testable:** Each module can be tested independently
- **Scalable:** Easy to add new features
- **Chrome Compatible:** Works with extension limitations

### 📝 Usage

1. Load the extension in Chrome
2. Navigate to YouTube
3. Click the "MANAGE YT SUBS" button in the sidebar
4. Create folders and organize your subscriptions

### 🔄 Migration from Monolithic

The modular version preserves **100% of the original functionality**:

- Same UI design and behavior
- Same folder management features
- Same subscription organization
- Same Chrome extension compatibility

### 📋 Files

- `content_backup.js` - Original monolithic version (backup)
- `background.js` - Chrome extension background script
- `popup.js` - Extension popup interface
- `manifest.json` - Extension configuration

## 🎯 Development

The modular structure makes it easy to:

- Add new features by creating new modules
- Fix bugs by focusing on specific components
- Test functionality by testing individual modules
- Maintain code by keeping related functions together

