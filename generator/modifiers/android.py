# generator/src/android_modifier.py
import os
import shutil
from utils.android.file_actions import move_java_sources
from utils.main import replace_placeholders, replace_in_file
from utils.android.logo import generate_launcher_icons
from utils.android.splash_screen import handle_splash_image

def inject_into_android_files(config, android_project_root, container_multi_platform_root, input_assets_dir):
    """
    Injects configuration values into Android project files and handles file movements and asset copying.
    The 'config' argument contains the Android-specific configuration, potentially merged
    with common top-level settings like app_name, package_name, and url.

    Args:
        config (dict): The Android-specific configuration dictionary.
        android_project_root (str): The root path of the Android project (e.g., '/app/android').
        container_multi_platform_root (str): The overall root of the copied template-app (e.g., '/app').
        input_assets_dir (str): The path where user's static assets are mounted.
    """
    app_name = config.get("app_name", "Default App") # Safe access
    package_name = config.get("package_name", "com.default.app") # Safe access
    url = config.get("url", "https://google.com") # Safe access
    old_package_name_template = "com.example.app" # The default package in your template

    # Extract configurations from the provided (Android-specific) config object
    build_config = config.get("build", {})
    webapp_config = config.get("webapp", {})
    logo_path_config = config.get("logo", "")
    splash_config = config.get("splash", {})
    signing_config = config.get("signing", {}) # NEW: Get signing config

    # --- Process custom Gradle build configurations ---
    custom_gradle_configs = build_config.get("gradle_custom_configs", {})
    gradle_config_lines = []
    for key, value in custom_gradle_configs.items():
        if isinstance(value, bool):
            gradle_config_lines.append(f"        {str(key)} = {str(value).lower()}")
        elif isinstance(value, (int, float)):
            gradle_config_lines.append(f"        {str(key)} = {value}")
        else:
            if isinstance(value, str) and not (value.startswith('"') and value.endswith('"')):
                 gradle_config_lines.append(f"        {str(key)} = \"{value}\"")
            else:
                 gradle_config_lines.append(f"        {str(key)} = {value}")

    custom_gradle_configs_string = "\n".join(gradle_config_lines)
    if custom_gradle_configs_string:
        custom_gradle_configs_string += "\n"


    # --- Generate Android Signing Configs (Groovy code) ---
    android_signing_config_block = ""
    android_release_signing_config_ref = ""

    keystore_path = signing_config.get("keystore_file_in_container")
    keystore_pass = signing_config.get("keystore_password")
    key_alias = signing_config.get("key_alias")
    key_pass = signing_config.get("key_password")

    # Only generate release signing config if all necessary details are provided
    if all([keystore_path, keystore_pass, key_alias, key_pass]):
        print("  [Modifier] Generating production Android signing configuration...")
        android_signing_config_block = f"""
        release {{
            storeFile file(\"/{keystore_path}\")
            storePassword \"{keystore_pass}\"
            keyAlias \"{key_alias}\"
            keyPassword \"{key_pass}\"
        }}
        """
        android_release_signing_config_ref = "signingConfig signingConfigs.release"
    else:
        print("  [Modifier] ⚠️ Skipping production Android signing configuration: Incomplete details in config.yaml.")
        print("  [Modifier]    Defaulting release builds to debug signing or no signing.")



    # --- Step 1: Prepare replacements for placeholders ---
    replacements = {
        "APP_NAME": app_name,
        "PACKAGE_NAME": package_name,
        "URL": url,

        # Webapp properties
        "ENABLE_JS": str(webapp_config.get("enable_javascript", True)).lower(),
        "ALLOW_FILE_ACCESS": str(webapp_config.get("allow_file_access", False)).lower(),
        "FULLSCREEN": str(webapp_config.get("fullscreen", True)).lower(),
        "THEME_COLOR": webapp_config.get("theme_color", "#ffffff"),
        "ORIENTATION": webapp_config.get("orientation", "portrait"),
        "USER_AGENT": webapp_config.get("user_agent", ""),
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
        "SPLASH_CONTENT": splash_config.get("content", ""), # Default to empty if no content
        "SPLASH_BACKGROUND_COLOR": splash_config.get("background_color", "#ffffff"),
        "SPLASH_TEXT_COLOR": splash_config.get("text_color", "#000000"),

        # CUSTOM GRADLE CONFIGS INJECTION
        "CUSTOM_GRADLE_BUILD_CONFIGS": custom_gradle_configs_string,
        "INJECT_ANDROID_SIGNING_CONFIGS": android_signing_config_block, # NEW
        "INJECT_RELEASE_SIGNING_CONFIG": android_release_signing_config_ref, # NEW
    }

    print("\n--- [Android Modifier] Starting Android File Modification ---")

    # --- Step 2: Determine Android paths within the new structure ---
    # The 'android_project_root' is now '/app/android'
    android_app_module_root = os.path.join(android_project_root, "app")
    android_app_src_main_dir = os.path.join(android_app_module_root, "src", "main")

    # Move Java source files and update their package declarations
    print("  [Modifier] Attempting to move Java sources...")
    try:
        # move_java_sources expects the 'src/main' path
        move_java_sources(android_app_src_main_dir, old_package_name_template, package_name)
    except Exception as e:
        print(f"  [Modifier] ❌ Error during Java source movement: {e}. This might affect subsequent steps.")

    # --- Step 3: Dynamically determine paths for files to update after potential moves ---
    pkg_path_in_dirs = package_name.replace(".", "/")
    java_files_dir = os.path.join(android_app_src_main_dir, "java", pkg_path_in_dirs)
    android_res_path = os.path.join(android_app_src_main_dir, "res")

    # Paths to Gradle files (relative to android_project_root)
    project_level_gradle_path = os.path.join(android_project_root, "build.gradle")
    app_level_gradle_path = os.path.join(android_app_module_root, "build.gradle")
    settings_gradle_path = os.path.join(android_project_root, "settings.gradle")
    gradle_properties_path = os.path.join(android_project_root, "gradle.properties")

    files_to_update = [
        os.path.join(java_files_dir, "MainActivity.java"),
        os.path.join(java_files_dir, "SplashActivity.java"),
        os.path.join(android_res_path, "values", "strings.xml"),
        os.path.join(android_app_src_main_dir, "AndroidManifest.xml"), # Manifest is directly under src/main
        os.path.join(android_res_path, "values", "colors.xml"),
        app_level_gradle_path,
        project_level_gradle_path,
        settings_gradle_path,
        gradle_properties_path # Added gradle.properties for potential modifications if needed, though now static
    ]

    # --- Step 4: Replace placeholders in relevant files ---
    print("\n  [Modifier] Replacing placeholders in Android project files...")
    for path in files_to_update:
        try:
            # Use android_project_root for relative path for better logging context
            print(f"  [Modifier] Processing: {os.path.relpath(path, android_project_root)}")
            replace_placeholders(path, replacements)
        except Exception as e:
            print(f"  [Modifier] ❌ Error applying placeholders to {os.path.relpath(path, android_project_root)}: {e}")

    # --- Step 5: Handle app_name string resource (as a safeguard) ---
    print("\n  [Modifier] Ensuring app_name string resource is correct...")
    strings_xml_path = os.path.join(android_res_path, "values", "strings.xml")
    try:
        if os.path.exists(strings_xml_path):
            replace_in_file(strings_xml_path, {
                f"<string name=\"app_name\">{{{{APP_NAME}}}}</string>": f"<string name=\"app_name\">{app_name}</string>"
            })
            print(f"  [Modifier] Ensured app_name in {os.path.relpath(strings_xml_path, android_project_root)} is correct.")
        else:
            print(f"  [Modifier] Warning: strings.xml not found at {os.path.relpath(strings_xml_path, android_project_root)}. Skipping app_name update.")
    except Exception as e:
        print(f"  [Modifier] ❌ Error updating app_name in strings.xml: {e}")

    # --- Step 6: Generate/Handle Resources (Icons, Splash Images) ---
    print("\n  [Modifier] Handling resource generation (Icons, Splash Images)...")
    
    # ALWAYS attempt to generate launcher icons, even if no custom logo is provided.
    # If logo_path_config is empty, generate_launcher_icons will create a default set.
    # Pass the actual theme color for adaptive icons if needed (though not fully implemented yet)
    generate_launcher_icons(logo_path_config, android_res_path, webapp_config.get("theme_color", "#FFFFFF"))
    
    if splash_config:
        handle_splash_image(splash_config, android_res_path, input_assets_dir)
    else:
        print("  [Modifier] ℹ️ No 'splash' configuration found in Android config. Skipping splash screen image handling.")

    print("\n--- [Android Modifier] Android File Modification Complete ---")