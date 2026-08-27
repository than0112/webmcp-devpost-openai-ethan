from pathlib import Path
from PIL import Image, ImageDraw

SOURCE = Path(r"C:\Users\youho\Downloads\ChatGPT Image 2026年8月27日 下午03_30_53.png")
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "items"

image = Image.open(SOURCE).convert("RGB")
cell_width = image.width / 6
cell_height = image.height / 5
OUTPUT.mkdir(parents=True, exist_ok=True)

for index in range(30):
    column = index % 6
    row = index // 6
    left = round(column * cell_width)
    top = round(row * cell_height)
    right = round((column + 1) * cell_width)
    bottom = min(round(top + cell_height * 0.76), image.height)
    asset = image.crop((left, top, right, bottom))

    # Remove the catalog's number badge while preserving the supplied artwork.
    draw = ImageDraw.Draw(asset)
    background = asset.getpixel((min(70, asset.width - 1), min(18, asset.height - 1)))
    draw.ellipse((13, 20, 66, 72), fill=background)

    asset.save(OUTPUT / f"LF-{index + 1:03}.png", optimize=True)

print(f"Created 30 item assets in {OUTPUT}")
