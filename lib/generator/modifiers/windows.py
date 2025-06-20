# generator/src/modifiers/windows.py
import os
import shutil
import json
import re
from utils.main import replace_placeholders # Re-using generic utility

def inject_into_windows_files(config, windows_project_root, container_multi_platform_root, webapp_assets_dir):
    """
    Injects configuration values into Windows (Tauri) project files.

    Args:
        config (dict): The Windows-specific configuration dictionary, merged with common settings.
                       Expected to contain 'app_name', 'package_name', 'url', 'build', 'webapp', 'icon'.
        windows_project_root (str): The root path of the Windows project (e.g., '/app/windows_project').
        container_multi_platform_root (str): The overall root of the copied template-app (e.g., '/app').
        webapp_assets_dir (str): The path where user's static assets are mounted.
    """
    print("\n--- [Windows Modifier] Starting Windows (Tauri) File Modification ---")

    app_name = config.get("app_name", "Default Windows App")
    # For Tauri, 'app_id' is preferred over 'package_name' for bundle identifier
    bundle_identifier = config.get("build", {}).get("app_id", config.get("package_name", "com.default.windowsapp"))
    base_url = config.get("url") # Get the base URL

    build_config = config.get("build", {})
    webapp_config = config.get("webapp", {})
    icon_path_config = config.get("icon", "") # Windows icon path from config
    author = config.get("author","Devlouix")

    # Derive Tauri-specific paths
    wails_src_dir = os.path.join(windows_project_root, "wails_app")
    wail_json_file = os.path.join(wails_src_dir, "wails.json")
    wails_main_go_file = os.path.join(wails_src_dir, "main.go")
    tauri_icons_dir = os.path.join(wails_src_dir, "icons")
    wails_frontend_dir = os.path.join(windows_project_root, "frontend") # Tauri's default web content output/input

    # --- 1. Handle Web Content (Local Assets vs. External URL) ---
    if webapp_assets_dir:
        print(f"  [Windows] Local web assets detected. Copying web assets from {webapp_assets_dir} to {wails_frontend_dir}...")

        # Create the dist dir thi is the production webapp dir
        os.makedirs(wails_frontend_dir, exist_ok=True)

        # Clear existing dist content before copying new assets
        print(f"  [Windows] Cleaning existing content in {wails_frontend_dir}...")
        if os.path.exists(wails_frontend_dir):
            for item in os.listdir(wails_frontend_dir):
                item_path = os.path.join(wails_frontend_dir, item)
                if os.path.isfile(item_path):
                    os.remove(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
        print(f"  [Windows] Cleaned {wails_frontend_dir}.")

        if os.path.exists(webapp_assets_dir) and os.path.isdir(webapp_assets_dir) and os.listdir(webapp_assets_dir):
            # Copy all contents of webapp_assets_dir into wails_frontend_dir
            shutil.copytree(webapp_assets_dir, wails_frontend_dir, dirs_exist_ok=True)
            print(f"  [Windows] ✅ Web assets copied from {webapp_assets_dir} to {wails_frontend_dir}.")
        else:
            print(f"  [Windows] ⚠️ No local web assets found in {webapp_assets_dir}. Tauri might show a blank page.")
            url_for_tauri_conf = "" # Set to empty, Tauri will likely show an error or blank page.
    else:
        # External URL, Tauri will load it directly. No local asset copying needed.
        print(f"  [Windows] External URL detected: '{base_url}'. Skipping local asset copying.")


    # --- 2. Configure wails.json and Main.go ---
    print(f"  [Windows] Configuring Wails Project File For Build...")
    try:
        # The values to be relaced  in the tauri.conf.json
        replacements = {
            "APP_NAME": app_name,
            "URL": base_url
        }
        # Call the replaceplaceholder func to modify the neededfiles template
        replace_placeholders(wail_json_file,replacements)
        replace_placeholders(wails_main_go_file,replacements)
        
        # Opening the file initially as a text doc for modifications
        with open(tauri_conf_path, "r", encoding="utf-8") as f:
            tauri_config = json.load(f)
            
        # Handle icon path and copying
        # Tauri prefers PNG/SVG and generates other formats from it
        if icon_path_config:
            source_icon_path = os.path.join(webapp_assets_dir, icon_path_config)
            if os.path.exists(source_icon_path):
                os.makedirs(tauri_icons_dir, exist_ok=True)
                dest_icon_base = os.path.basename(source_icon_path)
                final_icon_path_in_tauri = os.path.join(tauri_icons_dir, "icon.png") # Standardize to 'icon.png'
                shutil.copyfile(source_icon_path, final_icon_path_in_tauri)
                print(f"  [Windows] ✅ Copied icon from {source_icon_path} to {final_icon_path_in_tauri}")

                tauri_config["bundle"]["icon"] = [
                    "icons/icon.png" # Path relative to src-tauri
                ]
            else:
                print(f"  [Windows] ⚠️ Icon file not found at {source_icon_path}. Using default Tauri placeholder icon.")
                tauri_config["bundle"]["icon"] = ["icons/placeholder.png"] # Fallback to template's placeholder
        else:
             print("  [Windows] ℹ️ No icon specified in config. Using default Tauri placeholder icon.")
             tauri_config["bundle"]["icon"] = ["icons/placeholder.png"]


        # Update window properties (first window in the array)
        if tauri_config["app"]["windows"]:
            window_config = tauri_config["app"]["windows"][0]
            window_config["title"] = app_name
            window_config["width"] = webapp_config.get("width", 800)
            window_config["height"] = webapp_config.get("height", 600)
            window_config["resizable"] = webapp_config.get("resizable", True)
            
            # decorations: true = standard window decorations (not frameless)
            # decorations: false = frameless window
            window_config["decorations"] = not webapp_config.get("frameless", False)
            
            window_config["url"] = url_for_tauri_conf # The processed URL

            # Background color for the window (if frameless, usually applied via webview CSS)
            # Tauri's window config doesn't have a direct 'background_color' property.
            # Transparency can be set for frameless windows.
            window_config["transparent"] = webapp_config.get("transparent", False) # New option if you add it to config.yaml
            if window_config["transparent"] and not window_config["decorations"]:
                print("  [Windows] Note: Window transparency enabled for frameless window.")
            elif window_config["transparent"] and window_config["decorations"]:
                print("  [Windows] Warning: Window transparency might not work as expected with decorations.")


        # Write updated tauri.conf.json
        with open(tauri_conf_path, "w", encoding="utf-8") as f:
            json.dump(tauri_config, f, indent=2)
        print(f"  [Windows] ✅ Updated {tauri_conf_path}.")

    except FileNotFoundError:
        print(f"  [Windows] ❌ Error: tauri.conf.json not found at {tauri_conf_path}.")
    except json.JSONDecodeError as e:
        print(f"  [Windows] ❌ Error parsing tauri.conf.json: {e}.")
    except Exception as e:
        print(f"  [Windows] ❌ Unexpected error configuring tauri.conf.json: {e}")

    
    print("--- [Windows Modifier] Windows (Tauri) File Modification Complete ---")