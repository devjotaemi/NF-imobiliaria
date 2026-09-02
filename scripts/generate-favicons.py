import os
import argparse
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description="Generate favicons from a source image.")
parser.add_argument("source", nargs="?", type=Path, default=root / "public" / "icon.png")
src_path = parser.parse_args().source
public_dir = root / "public"
app_dir = root / "app"

if not os.path.exists(src_path):
    print("Source image not found at:", src_path)
    exit(1)

img = Image.open(src_path).convert("RGBA")

# Ensure target directories exist
os.makedirs(public_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)

# 1. Save ICO files (multi-resolution ico)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
img.save(os.path.join(app_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)

# 2. Save icon.png (512x512 and 192x192)
icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save(os.path.join(app_dir, "icon.png"), "PNG")
icon_512.save(os.path.join(public_dir, "icon.png"), "PNG")
icon_512.save(os.path.join(public_dir, "web-app-manifest-512x512.png"), "PNG")

icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
icon_192.save(os.path.join(public_dir, "web-app-manifest-192x192.png"), "PNG")

# 3. Save apple-icon (180x180)
apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon.save(os.path.join(app_dir, "apple-icon.png"), "PNG")
apple_icon.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

# 4. Save favicon-96x96.png
icon_96 = img.resize((96, 96), Image.Resampling.LANCZOS)
icon_96.save(os.path.join(public_dir, "favicon-96x96.png"), "PNG")

print("Favicons generated successfully!")
