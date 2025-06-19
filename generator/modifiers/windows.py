# generator/src/modifiers/windows.py
import os
import shutil
import json
import re
from utils.main import replace_placeholders # Re-using generic utility

def inject_into_windows_files(config, windows_project_root, container_multi_platform_root, input_assets_dir):
    """
    Injects configuration values into Windows (Tauri) project files.

    Args:
        config (dict): The Windows-specific configuration dictionary, merged with common settings.
                       Expected to contain 'app_name', 'package_name', 'url', 'build', 'webapp', 'icon'.
        windows_project_root (str): The root path of the Windows project (e.g., '/app/windows_project').
        container_multi_platform_root (str): The overall root of the copied template-app (e.g., '/app').
        input_assets_dir (str): The path where user's static assets are mounted.
    """
    print("\n--- [Windows Modifier] Starting Windows (Tauri) File Modification ---")

    app_name = config.get("app_name", "Default Windows App")
    # For Tauri, 'app_id' is preferred over 'package_name' for bundle identifier
    bundle_identifier = config.get("build", {}).get("app_id", config.get("package_name", "com.default.windowsapp"))
    base_url = config.get("url", "https://www.google.com") # Get the base URL

    build_config = config.get("build", {})
    webapp_config = config.get("webapp", {})
    icon_path_config = config.get("icon", "") # Windows icon path from config
    author = config.get("author","Devlouix")

    # Derive Tauri-specific paths
    tauri_src_dir = os.path.join(windows_project_root, "src-tauri")
    tauri_conf_path = os.path.join(tauri_src_dir, "tauri.conf.json")
    cargo_toml_path = os.path.join(tauri_src_dir, "Cargo.toml")
    tauri_icons_dir = os.path.join(tauri_src_dir, "icons")
    tauri_dist_dir = os.path.join(windows_project_root, "dist") # Tauri's default web content output/input

    # --- 1. Handle Web Content (Local Assets vs. External URL) ---
    # Determine the URL Tauri will use and if local assets need copying.
    url_for_tauri_conf = base_url
    if base_url.startswith("file:///"):
        print(f"  [Windows] Local URL detected: {base_url}. Copying web assets from {input_assets_dir} to {tauri_dist_dir}...")

        os.makedirs(tauri_dist_dir, exist_ok=True)

        # Clear existing dist content before copying new assets
        print(f"  [Windows] Cleaning existing content in {tauri_dist_dir}...")
        if os.path.exists(tauri_dist_dir):
            for item in os.listdir(tauri_dist_dir):
                item_path = os.path.join(tauri_dist_dir, item)
                if os.path.isfile(item_path):
                    os.remove(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
        print(f"  [Windows] Cleaned {tauri_dist_dir}.")

        if os.path.exists(input_assets_dir) and os.path.isdir(input_assets_dir) and os.listdir(input_assets_dir):
            # Copy all contents of input_assets_dir into tauri_dist_dir
            shutil.copytree(input_assets_dir, tauri_dist_dir, dirs_exist_ok=True)
            print(f"  [Windows] ✅ Web assets copied from {input_assets_dir} to {tauri_dist_dir}.")
            
            # For local files, Tauri's `url` property expects a path relative to its `distDir`.
            # If the base_url was "file:///some_path/index.html", we need "some_path/index.html".
            # If it was "file:///some_path/", we'd typically default to "some_path/index.html".
            # If it was just "file:///", default to "index.html".
            
            # Strip common file prefixes to get the intended relative path
            relative_path_from_url = base_url.replace("file:///", "")
            # Assume it might contain '/android_asset/' from previous cross-platform thinking
            relative_path_from_url = relative_path_from_url.replace("android_asset/", "")

            if not relative_path_from_url:
                url_for_tauri_conf = "index.html" # Default to index.html if only base URL provided
            else:
                url_for_tauri_conf = relative_path_from_url
            print(f"  [Windows] Tauri URL set to local asset: '{url_for_tauri_conf}' (relative to distDir).")
        else:
            print(f"  [Windows] ⚠️ No local web assets found in {input_assets_dir}. Tauri might show a blank page.")
            url_for_tauri_conf = "" # Set to empty, Tauri will likely show an error or blank page.
    else:
        # External URL, Tauri will load it directly. No local asset copying needed.
        url_for_tauri_conf = base_url
        print(f"  [Windows] External URL detected: '{url_for_tauri_conf}'. Skipping local asset copying.")


    # --- 2. Configure tauri.conf.json ---
    print(f"  [Windows] Configuring {tauri_conf_path}...")
    try:
        # The values to be relaced  in the tauri.conf.json
        replacements = {
            "APP_NAME": app_name,
            "APP_VERSION": build_config.get("version", "0.1.0"),
            "BUNDLE_IDENTIFIER": bundle_identifier,
            "APP_TITLE": app_name, # Assuming APP_TITLE should be same as app_name
            "WEBAPP_WIDTH": str(webapp_config.get("width", 800)), # Convert int to string "800"
            "WEBAPP_HEIGHT": str(webapp_config.get("height", 600)), # Convert int to string "600"
            "WEBAPP_RESIZABLE": str(webapp_config.get("resizable", True)).lower(), # Convert bool to "true"/"false"
            "WEBAPP_DECORATIONS": str(not webapp_config.get("frameless", False)).lower(), # Convert bool to "true"/"false"
            "WEBAPP_URL": url_for_tauri_conf
        }
        # Call the replaceplaceholder func to modify the template
        replace_placeholders(tauri_conf_path,replacements)
        
        # --- DEBUGGING LINE START ---
        print(f"\n  [Windows] DEBUG: Content of {tauri_conf_path} BEFORE json.load(f):")
        with open(tauri_conf_path, "r", encoding="utf-8") as f_debug:
            lines = f_debug.read().splitlines()
            for i, line in enumerate(lines):
                print(f"    {i+1}: {line}")
        print("  [Windows] DEBUG: End of content.\n")
        # --- DEBUGGING LINE END ---

        with open(tauri_conf_path, "r", encoding="utf-8") as f:
            tauri_config = json.load(f)
            
        # Update package info
        tauri_config["productName"] = app_name
        tauri_config["version"] = build_config.get("version", "0.1.0")

        # Update bundle identifier
        tauri_config["identifier"] = bundle_identifier
        
        # Update bundle targets for Windows
        tauri_target = build_config.get("output_format", "msi")
        if tauri_target in ["msi", "exe", "portable"]:
             tauri_config["bundle"]["targets"] = [tauri_target]
        else:
            print(f"  [Windows] Warning: Unknown Tauri output_format '{tauri_target}'. Defaulting to 'msi'.")
            tauri_config["bundle"]["targets"] = ["msi"]

        # Handle icon path and copying
        # Tauri prefers PNG/SVG and generates other formats from it
        if icon_path_config:
            source_icon_path = os.path.join(input_assets_dir, icon_path_config)
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

    # --- 3. Configure Cargo.toml (Rust project metadata) ---
    print(f"  [Windows] Configuring {cargo_toml_path}...")
    try:
        replacements={
            "PACKAGE_NAME" : app_name.strip().replace(" ", "_"), #using the appname for the rust package name
            "AUTHOR": author
        }
        # Calling the replacement func
        replace_placeholders(cargo_toml_path, replacements)
            
        print(f"  [Windows] ✅ Updated {cargo_toml_path}.")

    except FileNotFoundError:
        print(f"  [Windows] ❌ Error: Cargo.toml not found at {cargo_toml_path}.")
    except Exception as e:
        print(f"  [Windows] ❌ Unexpected error configuring Cargo.toml: {e}")

    print("--- [Windows Modifier] Windows (Tauri) File Modification Complete ---")