import fitz  # PyMuPDF
from PIL import Image
import os

pdf_path = r"d:\WorkFreelancer\TEM\giai-phap-qrcode-tem-bao-hanh-san-pham.pdf"
out_dir = r"d:\WorkFreelancer\TEM\user\public\pdf_assets"
os.makedirs(out_dir, exist_ok=True)

# 1. Render PDF page 0 to high-res PNG
doc = fitz.open(pdf_path)
page = doc[0]
zoom = 3  # 300 DPI high clarity
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat)
full_img_path = os.path.join(out_dir, "full_pdf_page.png")
pix.save(full_img_path)
print(f"Saved full page to {full_img_path}")

# Load PIL Image for precise cropping
img = Image.open(full_img_path)
w, h = img.size
print(f"High-res dimensions: width={w}, height={h}")

# Define crop coordinates as percentages (left, upper, right, lower)
crops = {
    "hero_banner.png": (0.02, 0.10, 0.98, 0.32),
    "transparency_banner.png": (0.02, 0.33, 0.98, 0.41),
    "rice_cooker.png": (0.05, 0.42, 0.35, 0.59),
    "product_specs_section.png": (0.35, 0.42, 0.98, 0.59),
    "related_products_section.png": (0.02, 0.60, 0.98, 0.73),
    "factory_building.png": (0.04, 0.75, 0.40, 0.89),
    "manufacturer_section.png": (0.02, 0.74, 0.98, 0.90),
    "benefits_section.png": (0.02, 0.91, 0.98, 0.99),
    
    # 5 Related product cutouts from PDF
    "rel_air_fryer.png": (0.07, 0.62, 0.22, 0.71),
    "rel_blender.png": (0.24, 0.62, 0.39, 0.71),
    "rel_induction.png": (0.41, 0.62, 0.57, 0.71),
    "rel_hood.png": (0.59, 0.62, 0.75, 0.71),
    "rel_water_heater.png": (0.76, 0.62, 0.92, 0.71),
}

for filename, (p_left, p_top, p_right, p_bottom) in crops.items():
    box = (int(p_left * w), int(p_top * h), int(p_right * w), int(p_bottom * h))
    cropped = img.crop(box)
    save_p = os.path.join(out_dir, filename)
    cropped.save(save_p)
    print(f"Cropped {filename}: {box}")

print("All PDF assets extracted successfully!")
