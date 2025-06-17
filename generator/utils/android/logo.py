# android/utils/logo.py
from PIL import Image, ImageOps
import os
import urllib.request
import io
import io
import shutil

# Standard Android densities and their corresponding icon sizes (in dp for base, px for xhdpi)
sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}


def generate_launcher_icons(logo_path, android_res_path, background_color="#FFFFFF"):
    """
    Generates Android launcher icons (legacy and adaptive) from a source logo.

    Args:
        logo_path (str): Path to the source logo image (local or URL).
        android_res_path (str): Path to the Android 'res' directory (e.g., 'android/app/src/main/res').
        background_color (str): Hex color code for the adaptive icon background.
    """
    print("\n--- [Resource Generator] Generating Launcher Icons ---")
    try:
        img = None
        # 1. Load image (URL or local)
        if logo_path.startswith("http"):
            print(f"  [Icons] 🌐 Downloading logo from {logo_path}...")
            try:
                with urllib.request.urlopen(logo_path, timeout=10) as response: # Added timeout
                    img_data = response.read()
                img = Image.open(io.BytesIO(img_data)).convert("RGBA")
                print(f"  [Icons] ✅ Logo downloaded successfully.")
            except urllib.error.URLError as e:
                print(f"  [Icons] ❌ URL Error downloading logo from {logo_path}: {e}")
                return False
            except Exception as e:
                print(f"  [Icons] ❌ General error downloading/opening remote logo {logo_path}: {e}")
                return False
        else:
            if not os.path.exists(logo_path):
                print(f"  [Icons] ❌ Error: Local logo file not found at {logo_path}.")
                return False
            print(f"  [Icons] 📂 Using local logo at {logo_path}")
            try:
                img = Image.open(logo_path).convert("RGBA")
                print(f"  [Icons] ✅ Local logo opened successfully.")
            except Exception as e:
                print(f"  [Icons] ❌ Error opening local logo file {logo_path}: {e}")
                return False

        if img is None:
            print("  [Icons] ❌ No logo image could be loaded. Skipping icon generation.")
            return False

        # 2. Create mipmap folders and save legacy icons (ic_launcher.png)
        for density, size in sizes.items():
            mipmap_dir = os.path.join(android_res_path, f"mipmap-{density}")
            try:
                os.makedirs(mipmap_dir, exist_ok=True)
                resized = img.resize((size, size), Image.LANCZOS)
                icon_path = os.path.join(mipmap_dir, "ic_launcher.png")
                resized.save(icon_path, format="PNG")
                print(f"  [Icons] ✅ Saved legacy icon: {os.path.relpath(icon_path, android_res_path)}")
            except (OSError, IOError, PermissionError) as e:
                print(f"  [Icons] ❌ Error saving legacy icon to {mipmap_dir}: {e}. Check permissions or disk space.")
                return False
            except Exception as e:
                print(f"  [Icons] ❌ Unexpected error during legacy icon generation for {density}: {e}")
                return False

        # 3. Prepare for Adaptive Icons (Android 8.0+)
        adaptive_dir = os.path.join(android_res_path, "mipmap-anydpi-v26")
        try:
            os.makedirs(adaptive_dir, exist_ok=True)
            print(f"  [Icons] Ensured adaptive icon directory: {os.path.relpath(adaptive_dir, android_res_path)}")

            adaptive_canvas_size = 108
            fg_icon = ImageOps.contain(img, (adaptive_canvas_size, adaptive_canvas_size))

            fg_path = os.path.join(adaptive_dir, "ic_launcher_foreground.png")
            fg_icon.save(fg_path, format="PNG")
            print(f"  [Icons] ✅ Saved adaptive foreground: {os.path.relpath(fg_path, android_res_path)}")

            bg_icon = Image.new("RGBA", (adaptive_canvas_size, adaptive_canvas_size), background_color)
            bg_path = os.path.join(adaptive_dir, "ic_launcher_background.png")
            bg_icon.save(bg_path, format="PNG")
            print(f"  [Icons] ✅ Saved adaptive background: {os.path.relpath(bg_path, android_res_path)}")

            # --- Create Adaptive Icon XMLs ---
            # ic_launcher.xml
            ic_launcher_xml_content = f"""<?xml version="1.0" encoding="utf-8"?>
                <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
                    <background android:drawable="@mipmap/ic_launcher_background"/>
                    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
                </adaptive-icon>
                """
            ic_launcher_xml_path = os.path.join(adaptive_dir, "ic_launcher.xml")
            with open(ic_launcher_xml_path, "w") as f:
                f.write(ic_launcher_xml_content)
            print(f"  [Icons] ✅ Created adaptive icon XML: {os.path.relpath(ic_launcher_xml_path, android_res_path)}")

            # ic_launcher_round.xml
            ic_launcher_round_xml_content = f"""<?xml version="1.0" encoding="utf-8"?>
                <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
                    <background android:drawable="@mipmap/ic_launcher_background"/>
                    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
                </adaptive-icon>
                """
            ic_launcher_round_xml_path = os.path.join(adaptive_dir, "ic_launcher_round.xml")
            with open(ic_launcher_round_xml_path, "w") as f:
                f.write(ic_launcher_round_xml_content)
            print(f"  [Icons] ✅ Created adaptive round icon XML: {os.path.relpath(ic_launcher_round_xml_path, android_res_path)}")

        except (OSError, IOError, PermissionError) as e:
            print(f"  [Icons] ❌ Error saving adaptive icons or XMLs to {adaptive_dir}: {e}. Check permissions or disk space.")
            return False
        except Exception as e:
            print(f"  [Icons] ❌ Unexpected error during adaptive icon generation: {e}")
            return False

        print("--- [Resource Generator] Launcher Icon Generation Complete ---")
        return True
    except Exception as e: # Catch any top-level unhandled exceptions
        print(f"--- [Resource Generator] ❌ Critical Error in generate_launcher_icons: {e} ---")
        return False
  