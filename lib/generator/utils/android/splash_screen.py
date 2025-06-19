# android/utils/splashscreen.py
from PIL import Image, ImageOps
import os
import urllib.request
import io
import shutil
import sys # For error logging/exit

def handle_splash_image(splash_config, android_res_path, webapp_assets_dir):
    """
    Handles copying or downloading the splash screen image to the Android drawable folder.

    Args:
        splash_config (dict): The 'splash' section from the config.
        android_res_path (str): Path to the Android 'res' directory (e.g., 'android/app/src/main/res').
        webapp_assets_dir (str): The path where user's input assets are mounted (e.g., '/app/src/webapp').
    """
    print("\n--- [Resource Generator] Handling Splash Screen Image ---")
    splash_type = splash_config.get("type")
    splash_content = splash_config.get("content")

    if splash_type != "image" or not splash_content:
        print("  [Splash] ℹ️  Splash screen is not configured as an image or content is missing. Skipping image handling.")
        return False

    input_path = None
    try:
        if splash_content.startswith("http"):
            # Temporary path for downloaded image
            input_path = os.path.join("/tmp", "downloaded_splash_image.png")
            try:
                print(f"  [Splash] 🌐 Downloading splash image from {splash_content}...")
                urllib.request.urlretrieve(splash_content, input_path)
                print(f"  [Splash] ✅ Downloaded splash image to {input_path}")
            except urllib.error.URLError as e:
                print(f"  [Splash] ❌ URL Error downloading splash image from {splash_content}: {e}")
                return False
            except Exception as e:
                print(f"  [Splash] ❌ General error downloading remote splash image {splash_content}: {e}")
                return False
        else:
            # Assuming local path is relative to the mounted webapp_assets_dir
            input_path = os.path.join(webapp_assets_dir, splash_content)
            if not os.path.exists(input_path):
                print(f"  [Splash] ❌ Local splash image not found at: {input_path}. Please check the path in config.yaml or your mounted assets.")
                return False
            print(f"  [Splash] 📂 Using local splash image from {input_path}")

        # Copy to Android res/drawable folder
        drawable_dir = os.path.join(android_res_path, "drawable")
        os.makedirs(drawable_dir, exist_ok=True)
        
        # Use the filename from content, or default if it's an external URL that might be complex
        # For local files, base is enough. For URLs, base of URL might not be desired.
        # Let's ensure a simple valid drawable name.
        if splash_content.startswith("http"):
             # Use a generic name for downloaded images, or extract if URL has clean filename
            output_filename = "downloaded_splash.png"
            if '/' in splash_content:
                potential_name = splash_content.split('/')[-1]
                if '.' in potential_name: # Ensure it has an extension
                    output_filename = potential_name
        else:
            output_filename = os.path.basename(input_path) # For local files

        output_path = os.path.join(drawable_dir, output_filename)

        shutil.copyfile(input_path, output_path)
        print(f"  [Splash] ✅ Splash screen image copied to: {os.path.relpath(output_path, android_res_path)}")
        return True
    except (OSError, IOError, PermissionError) as e:
        print(f"  [Splash] ❌ Error copying splash image from {input_path} to {output_path}: {e}. Check permissions or disk space.")
        return False
    except Exception as e:
        print(f"--- [Resource Generator] ❌ Critical Error in handle_splash_image: {e} ---")
        return False
    finally:
        # Clean up downloaded file if it was remote
        if splash_content.startswith("http") and input_path and os.path.exists(input_path):
            os.remove(input_path)
            print(f"  [Splash] 🗑️ Cleaned up temporary downloaded splash image: {input_path}")