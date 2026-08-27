from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
source_path = Path(r"C:\Users\youho\Downloads\ChatGPT Image 2026年8月27日 下午03_30_53.png")
implementation_path = root / "implementation-desktop-final.png"
output_path = root / "qa-comparison.png"

source = Image.open(source_path).convert("RGB")
implementation = Image.open(implementation_path).convert("RGB")
target_height = 700

def fit(image: Image.Image) -> Image.Image:
    width = round(image.width * target_height / image.height)
    return image.resize((width, target_height), Image.Resampling.LANCZOS)

source_fit = fit(source)
implementation_fit = fit(implementation)
canvas = Image.new("RGB", (source_fit.width + implementation_fit.width + 36, target_height + 56), "#ece8df")
canvas.paste(source_fit, (12, 44))
canvas.paste(implementation_fit, (source_fit.width + 24, 44))
draw = ImageDraw.Draw(canvas)
draw.text((12, 14), "SOURCE ASSET BOARD", fill="#132236")
draw.text((source_fit.width + 24, 14), "IMPLEMENTATION — 1280 x 800", fill="#132236")
canvas.save(output_path, optimize=True)
print(f"source={source.size}; implementation={implementation.size}; comparison={canvas.size}")
