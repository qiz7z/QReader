"""Generate Android app icons from QReader source icons."""
from PIL import Image
import os

# Paths
SRC_FULL = 'D:/QReader/public/qreader-icon.png'          # 816x816 RGB (with background)
SRC_TRANSPARENT = 'D:/QReader/public/qreader-icon-transparent.png'  # 816x816 RGBA (transparent)
MIPMAP_BASE = 'D:/QReader/android/app/src/main/res'

# Android mipmap density sizes (launcher icon standard sizes)
DENSITIES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# Adaptive icon foreground sizes (should be 108x108 in a 108x108 viewport with 18dp safe zone)
# Google recommends the foreground artwork be 108x108 dp with 72dp visible zone
# At each density:
FOREGROUND_SIZES = {
    'mdpi': 48,    # 100% scale
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# Load source images
print("Loading source images...")
src_full = Image.open(SRC_FULL).convert('RGBA')
src_transparent = Image.open(SRC_TRANSPARENT).convert('RGBA')

# Pre-crop to square and resize source to a reasonable working size
def crop_center_square(img):
    """Crop image to centered square."""
    w, h = img.size
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    return img.crop((left, top, left + size, top + size))

def resize_with_padding(img, target_size, bg_color=(255, 255, 255, 255)):
    """Resize image to target square, adding padding if needed, with background."""
    w, h = img.size
    max_dim = max(w, h)
    # Scale so the image fits within target_size with 10% padding
    scale = (target_size * 0.80) / max_dim
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    
    # Create canvas with background
    canvas = Image.new('RGBA', (target_size, target_size), bg_color)
    # Paste resized image centered
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

def resize_foreground(img, target_size):
    """Resize transparent foreground to target size, keeping aspect ratio with padding."""
    w, h = img.size
    max_dim = max(w, h)
    # For adaptive icon foreground, Google recommends ~72dp visible in 108dp space
    # So we use ~66% of target_size
    scale = (target_size * 0.66) / max_dim
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    
    # Create transparent canvas
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

# Crop to square
src_full_sq = crop_center_square(src_full)
src_transparent_sq = crop_center_square(src_transparent)

# Background color for launcher (dark blue-gray, matching QReader theme)
BG_COLOR = (41, 45, 62, 255)  # #292d3e

print("Generating launcher icons...")
for density, size in DENSITIES.items():
    dir_path = os.path.join(MIPMAP_BASE, f'mipmap-{density}')
    
    # Generate ic_launcher.png (non-adaptive full icon with background)
    icon = resize_with_padding(src_full_sq, size, BG_COLOR)
    launcher_path = os.path.join(dir_path, 'ic_launcher.png')
    icon.save(launcher_path, 'PNG')
    print(f"  {launcher_path} ({size}x{size})")
    
    # Generate ic_launcher_round.png (same as launcher for round)
    round_path = os.path.join(dir_path, 'ic_launcher_round.png')
    icon.save(round_path, 'PNG')
    print(f"  {round_path} ({size}x{size})")

print("Generating adaptive icon foregrounds...")
for density, size in FOREGROUND_SIZES.items():
    dir_path = os.path.join(MIPMAP_BASE, f'mipmap-{density}')
    
    # Generate ic_launcher_foreground.png (transparent for adaptive icon)
    fg = resize_foreground(src_transparent_sq, size)
    fg_path = os.path.join(dir_path, 'ic_launcher_foreground.png')
    fg.save(fg_path, 'PNG')
    print(f"  {fg_path} ({size}x{size})")

# Update background color XML
color_xml_path = 'D:/QReader/android/app/src/main/res/values/ic_launcher_background.xml'
with open(color_xml_path, 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n')
    f.write('<resources>\n')
    # Convert BG_COLOR to hex
    hex_color = '#{:02x}{:02x}{:02x}'.format(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2])
    f.write(f'    <color name="ic_launcher_background">{hex_color}</color>\n')
    f.write('</resources>\n')
print(f"  Updated background color: {hex_color}")

print("\nDone! All Android icons generated.")
