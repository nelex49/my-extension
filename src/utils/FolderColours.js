// Shared folder palette and colour calculations. No DOM or storage dependency.
// Eight distinct dark muted defaults. Existing saved colours are never rewritten.
const SIDEBAR_FOLDER_PALETTE = [
  "#393052", // purple
  "#663344", // crimson
  "#244563", // navy
  "#245255", // teal
  "#315641", // forest green
  "#80602f", // amber
  "#81503c", // copper
  "#414957"  // slate
];

function isFolderHexColour(value) { return /^#[0-9a-f]{6}$/i.test(value || ""); }
function isMutedFolderColour(value) { return SIDEBAR_FOLDER_PALETTE.includes((value || "").toLowerCase()); }

// Suggest the first unused palette colour, then the least-used colour.
function nextFolderColour() {
  const counts = new Map(SIDEBAR_FOLDER_PALETTE.map(colour => [colour, 0]));
  Object.values(window.folderData || {}).forEach(folder => {
    const colour = (folder.color || "").toLowerCase();
    if (counts.has(colour)) counts.set(colour, counts.get(colour) + 1);
  });
  return SIDEBAR_FOLDER_PALETTE.reduce((best, colour) =>
    counts.get(colour) < counts.get(best) ? colour : best, SIDEBAR_FOLDER_PALETTE[0]);
}

// Saved valid colours are display colours. Only missing/invalid legacy values get a palette fallback.
function sidebarFolderColour(hex, index = 0) {
  return isFolderHexColour(hex) ? hex.toLowerCase() : SIDEBAR_FOLDER_PALETTE[index % SIDEBAR_FOLDER_PALETTE.length];
}

// Muted defaults always use white. Custom colours choose whichever text has stronger WCAG-style contrast.
function folderTextColour(background) {
  const colour = sidebarFolderColour(background, 0);
  if (isMutedFolderColour(colour)) return "#ffffff";
  const rgb = [1, 3, 5].map(offset => parseInt(colour.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
  const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  return (luminance + .05) / (.0056 + .05) >= 1.05 / (luminance + .05) ? "#111111" : "#ffffff";
}

function lightenColor(color, percent) {
  const num = parseInt(sidebarFolderColour(color, 0).replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt, G = ((num >> 8) & 0x00ff) + amt, B = (num & 0x0000ff) + amt;
  return "#" + (0x1000000 + Math.max(0, Math.min(255, R)) * 0x10000 + Math.max(0, Math.min(255, G)) * 0x100 + Math.max(0, Math.min(255, B))).toString(16).slice(1);
}

// Keep the outline in the folder's colour family, contrasting against its fill.
function folderIconColour(background) {
  const colour = sidebarFolderColour(background);
  const rgb = [1, 3, 5].map(offset => parseInt(colour.slice(offset, offset + 2), 16));
  const lightBackground = folderTextColour(colour) === '#111111';
  const outline = rgb.map(value => Math.round(lightBackground ? value * .38 : value + (255 - value) * .58));
  return '#' + outline.map(value => value.toString(16).padStart(2, '0')).join('');
}
