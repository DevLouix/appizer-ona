# android/utils/logo.py
import os
from PIL import Image, ImageDraw, ImageFont # Pillow for image generation
import requests
from io import BytesIO
import math

# Define Android mipmap densities and their corresponding sizes for a 48dp icon
ANDROID_ICON_DENSITIES = {
    "mdpi": 48,   # 1x
    "hdpi": 72,   # 1.5x
    "xhdpi": 96,  # 2x
    "xxhdpi": 144, # 3x
    "xxxhdpi": 192 # 4x
}

def generate_launcher_icons(image_path, android_res_path, theme_color="#FFFFFF"):
    """
    Generates Android launcher icons from a source image or creates defaults.

    Args:
        image_path (str): Path to the source image (local file or URL), or empty string to generate default.
        android_res_path (str): Path to the Android project's 'res' directory.
        theme_color (str): The theme color for adaptive icons background (if applicable).
    """
    print(f"  [Resource Gen] Generating launcher icons from: '{image_path}'...")

    base_image = None
    if image_path:
        try:
            if image_path.startswith("http"):
                response = requests.get(image_path)
                response.raise_for_status()
                base_image = Image.open(BytesIO(response.content)).convert("RGBA")
                print(f"  [Resource Gen] Downloaded image from URL: {image_path}")
            else:
                base_image = Image.open(image_path).convert("RGBA")
                print(f"  [Resource Gen] Loaded local image: {image_path}")
        except Exception as e:
            print(f"  [Resource Gen] ⚠️ Warning: Could not load image from '{image_path}': {e}. Generating default icons instead.")
            base_image = None # Fallback to default generation

    if base_image is None:
        print("  [Resource Gen] Creating default square launcher icons.")
        # Create a simple default square image if no valid image_path
        # Use a consistent base size, e.g., 512x512, for scaling
        default_size = 512
        base_image = Image.new("RGBA", (default_size, default_size), (0, 0, 0, 0)) # Transparent background
        draw = ImageDraw.Draw(base_image)
        # Draw a simple shape or text
        # Dark grey background with white text
        draw.rectangle([0, 0, default_size, default_size], fill="#607D8B") # Material Grey 500
        try:
            # Try to load a default font, fall back if not found
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" # Common Linux path
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, int(default_size * 0.4))
            else:
                font = ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()

        text = "APP"
        text_bbox = draw.textbbox((0,0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = (default_size - text_width) / 2
        text_y = (default_size - text_height) / 2
        draw.text((text_x, text_y), text, fill=(255, 255, 255), font=font) # White text

    # Generate icons for each density
    for density, size_dp in ANDROID_ICON_DENSITIES.items():
        mipmap_dir = os.path.join(android_res_path, f"mipmap-{density}")
        os.makedirs(mipmap_dir, exist_ok=True)

        # Scale for square icon (ic_launcher.png)
        square_icon = base_image.resize((size_dp, size_dp), Image.Resampling.LANCZOS)
        square_icon.save(os.path.join(mipmap_dir, "ic_launcher.png"))
        print(f"  [Resource Gen] Created {density}/ic_launcher.png ({size_dp}x{size_dp}).")

        # Scale for round icon (ic_launcher_round.png)
        # Create a circle mask
        round_icon = Image.new("RGBA", (size_dp, size_dp), (0, 0, 0, 0))
        mask = Image.new("L", (size_dp, size_dp), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, size_dp, size_dp), fill=255)
        
        # Apply the mask
        round_icon.paste(square_icon, (0, 0), mask)
        round_icon.save(os.path.join(mipmap_dir, "ic_launcher_round.png"))
        print(f"  [Resource Gen] Created {density}/ic_launcher_round.png ({size_dp}x{size_dp}, round).")

    print("  [Resource Gen] Launcher icon generation complete.")

