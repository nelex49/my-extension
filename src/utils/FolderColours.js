// Shared folder palette and colour calculations. No DOM or storage dependency.
const SIDEBAR_FOLDER_PALETTE = [
  "#44345d", "#53303d", "#243f59", "#24494e", "#3b414c", "#354454", "#51303f"
];

// Suggest the first unused palette colour, then the least-used colour.
function nextFolderColour() {
  const counts = new Map(SIDEBAR_FOLDER_PALETTE.map(colour => [colour, 0]));
  Object.values(window.folderData || {}).forEach((folder, index) => {
    const colour = sidebarFolderColour(folder.color, index);
    if (counts.has(colour)) counts.set(colour, counts.get(colour) + 1);
  });
  return SIDEBAR_FOLDER_PALETTE.reduce((best, colour) =>
    counts.get(colour) < counts.get(best) ? colour : best, SIDEBAR_FOLDER_PALETTE[0]);
}

// Translate saved colours into a restrained display palette; never change storage.
function sidebarFolderColour(hex, index) {
  const palette = SIDEBAR_FOLDER_PALETTE;
  const saved = (hex || "").toLowerCase();
  if (palette.includes(saved)) return saved;
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return palette[index % palette.length];
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
  if (delta < .08) return "#3b414c";
  let hue = max === rgb[0] ? ((rgb[1] - rgb[2]) / delta) % 6 :
    max === rgb[1] ? (rgb[2] - rgb[0]) / delta + 2 : (rgb[0] - rgb[1]) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 35 || hue >= 330) return "#53303d";
  if (hue < 80) return "#51462e";
  if (hue < 165) return "#304a3b";
  if (hue < 200) return "#24494e";
  if (hue < 255) return "#243f59";
  return "#44345d";
}

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


