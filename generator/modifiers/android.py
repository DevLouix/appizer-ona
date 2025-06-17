# generator/src/android_modifier.py
import os
import shutil
from utils.android.file_actions import replace_placeholders, replace_in_file, move_java_sources
from utils.android.logo import generate_launcher_icons
from utils.android.splash_screen import handle_splash_image

def inject_into_android_files(config, android_project_root, container_project_root, input_assets_dir):
    """
    Injects configuration values into Android project files and handles file movements and asset copying.

    Args:
        config (dict): The loaded configuration dictionary.
        android_project_root (str): The root path of the Android project's 'src/main' (e.g., '/app/app/src/main').
        container_project_root (str): The root directory of the copied template-app inside the container (e.g., '/app').
        input_assets_dir (str): The path where user's static assets are mounted (e.g., '/input-assets').
    """
    app_name = config["app_name"]
    package_name = config["package_name"]
    old_package_name_template = "com.example.app" # The default package in your template

    # Extract all configurations
    build_config = config.get("build", {})
    webapp_config = config.get("webapp", {})
    splash_config = config.get("splash", {})

    # --- NEW: Process custom Gradle build configurations ---
    custom_gradle_configs = build_config.get("gradle_custom_configs", {})
    gradle_config_lines = []
    for key, value in custom_gradle_configs.items():
        # Handle different types for correct Groovy syntax
        if isinstance(value, bool):
            gradle_config_lines.append(f"        {key} = {str(value).lower()}") # true/false in Groovy
        elif isinstance(value, (int, float)):
            gradle_config_lines.append(f"        {key} = {value}")
        else:
            # Assume string. Enclose in quotes if it's not already
            # This is a basic attempt; more complex strings might need escaping.
            # If the value is meant to be a Groovy string literal (e.g., "my_value"),
            # the user should provide it as '"my_value"' in YAML.
            if isinstance(value, str) and not (value.startswith('"') and value.endswith('"')):
                 gradle_config_lines.append(f"        {key} = \"{value}\"")
            else:
                 gradle_config_lines.append(f"        {key} = {value}")

    # Join the lines with a newline and indentation
    custom_gradle_configs_string = "\n".join(gradle_config_lines)
    if custom_gradle_configs_string: # Add extra newline only if content exists
        custom_gradle_configs_string += "\n"


    # --- Step 1: Prepare replacements for placeholders ---
    replacements = {
        "APP_NAME": app_name,
        "PACKAGE_NAME": package_name,
        "URL": config.get("url", "file:///android_asset/index.html"),

        # Webapp properties
        "ENABLE_JS": str(webapp_config.get("enable_javascript", True)).lower(),
        "ALLOW_FILE_ACCESS": str(webapp_config.get("allow_file_access", False)).lower(),
        "FULLSCREEN": str(webapp_config.get("fullscreen", True)).lower(),
        "THEME_COLOR": webapp_config.get("theme_color", "#ffffff"),
        "ORIENTATION": webapp_config.get("orientation", "portrait"),
        "USER_AGENT": webapp_config.get("user_agent", ""),
        "DOM_STORAGE_ENABLED": str(webapp_config.get("dom_storage_enabled", True)).lower(),
        "DATABASE_ENABLED": str(webapp_config.get("database_enabled", True)).lower(),
        "APP_CACHE_ENABLED": str(webapp_config.get("app_cache_enabled", True)).lower(),
        "BUILT_IN_ZOOM_CONTROLS": str(webapp_config.get("built_in_zoom_controls", False)).lower(),
        "SUPPORT_ZOOM": str(webapp_config.get("support_zoom", False)).lower(),

        # Build-related properties
        "MIN_SDK_VERSION": str(build_config.get("min_sdk_version", 21)),
        "COMPILE_SDK_VERSION": str(build_config.get("compile_sdk_version", 34)),
        "TARGET_SDK_VERSION": str(build_config.get("target_sdk_version", 34)),
        "BUILD_TOOLS_VERSION": build_config.get("build_tools_version", "34.0.0"),
        "VERSION_CODE": str(build_config.get("version_code", 1)),
        "VERSION_NAME": build_config.get("version_name", "1.0.0"),

        # Splash properties
        "SPLASH_DURATION": str(splash_config.get("duration", 3000)),
        "SPLASH_TYPE": splash_config.get("type", "image"),
        "SPLASH_CONTENT": splash_config.get("content", "splash.png"),
        "SPLASH_BACKGROUND_COLOR": splash_config.get("background_color", "#ffffff"),
        "SPLASH_TEXT_COLOR": splash_config.get("text_color", "#000000"),

        # NEW CUSTOM GRADLE CONFIGS INJECTION
        "CUSTOM_GRADLE_BUILD_CONFIGS": custom_gradle_configs_string,
    }

    print("\n--- [Android Modifier] Starting Android File Modification ---")

    # --- Step 2: Move Java source files and update their package declarations ---
    print("  [Modifier] Attempting to move Java sources...")
    try:
        move_java_sources(android_project_root, old_package_name_template, package_name)
    except Exception as e:
        print(f"  [Modifier] ❌ Error during Java source movement: {e}. This might affect subsequent steps.")

    # --- Step 3: Dynamically determine paths for files to update after potential moves ---
    pkg_path_in_dirs = package_name.replace(".", "/")
    java_files_dir = os.path.join(android_project_root, "java", pkg_path_in_dirs)
    app_level_gradle_path = os.path.join(container_project_root, "app", "build.gradle")
    android_res_path = os.path.join(android_project_root, "res")

    files_to_update = [
        os.path.join(java_files_dir, "MainActivity.java"),
        os.path.join(java_files_dir, "SplashActivity.java"),
        os.path.join(android_res_path, "values", "strings.xml"),
        os.path.join(android_project_root, "AndroidManifest.xml"),
        os.path.join(android_res_path, "values", "colors.xml"),
        app_level_gradle_path,
        os.path.join(container_project_root, "settings.gradle"),
        os.path.join(container_project_root, "build.gradle")
    ]

    # --- Step 4: Replace placeholders in relevant files ---
    print("\n  [Modifier] Replacing placeholders in Android project files...")
    for path in files_to_update:
        try:
            print(f"  [Modifier] Processing: {os.path.relpath(path, container_project_root)}")
            replace_placeholders(path, replacements)
        except Exception as e:
            print(f"  [Modifier] ❌ Error applying placeholders to {os.path.relpath(path, container_project_root)}: {e}")

    # --- Step 5: Handle app_name string resource (as a safeguard) ---
    print("\n  [Modifier] Ensuring app_name string resource is correct...")
    strings_xml_path = os.path.join(android_res_path, "values", "strings.xml")
    try:
        if os.path.exists(strings_xml_path):
            replace_in_file(strings_xml_path, {
                f"<string name=\"app_name\">{{{{APP_NAME}}}}</string>": f"<string name=\"app_name\">{app_name}</string>"
            })
            print(f"  [Modifier] Ensured app_name in {os.path.relpath(strings_xml_path, container_project_root)} is correct.")
        else:
            print(f"  [Modifier] Warning: strings.xml not found at {os.path.relpath(strings_xml_path, container_project_root)}. Skipping app_name update.")
    except Exception as e:
        print(f"  [Modifier] ❌ Error updating app_name in strings.xml: {e}")

    # --- Step 6: Generate/Handle Resources (Icons, Splash Images) ---
    print("\n  [Modifier] Handling resource generation (Icons, Splash Images)...")
    
    logo_path_config = config.get("logo")
    if logo_path_config:
        resolved_logo_path = logo_path_config
        if not logo_path_config.startswith("http") and not os.path.isabs(logo_path_config):
            resolved_logo_path = os.path.join(input_assets_dir, logo_path_config)
            print(f"  [Modifier] Resolved logo path: {resolved_logo_path}")
        
        generate_launcher_icons(resolved_logo_path, android_res_path, webapp_config.get("theme_color", "#FFFFFF"))
    else:
        print("  [Modifier] ℹ️ No 'logo' specified in config. Skipping launcher icon generation.")

    splash_config = config.get("splash", {})
    if splash_config:
        handle_splash_image(splash_config, android_res_path, input_assets_dir)
    else:
        print("  [Modifier] ℹ️ No 'splash' configuration found. Skipping splash screen image handling.")

    print("\n--- [Android Modifier] Android File Modification Complete ---")