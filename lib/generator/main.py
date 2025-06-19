# generator/main.py
import os
import yaml
import sys

# Import functions from your src package
from modifiers.android import inject_into_android_files
from utils.config_loader import load_yaml_file, merge_configs
# from modifiers.ios import inject_into_ios_files # Future: Uncomment and implement
# from modifiers.linux import inject_into_linux_files # Future: Uncomment and implement
from modifiers.windows import inject_into_windows_files # Future: Uncomment and implement
# from modifiers.macos import inject_into_macos_files # Future: Uncomment and implement


if __name__ == "__main__":
    print(f"  [main.py] Script started. sys.argv: {sys.argv}")

    # Expected arguments:
    # 1. android_project_root_in_container (e.g., /app/android)
    # 2. ios_project_root_in_container (e.g., /app/ios_project)
    # 3. linux_project_root_in_container (e.g., /app/linux_project)
    # 4. windows_project_root_in_container (e.g., /app/windows_project)
    # 5. macos_project_root_in_container (e.g., /app/macos_project)
    # 6. webapp_assets_dir (e.g., /app/src/webapp)
    # 7. container_multi_platform_root (e.g., /app)
    # 8. platform (e.g., "android")
    if len(sys.argv) < 9: # Script name + 8 args
        print("Usage: python3 main.py <android_proj_root> <ios_proj_root> <linux_proj_root> <windows_proj_root> <macos_proj_root> <webapp_assets_dir> <container_multi_platform_root> <platform>")
        sys.exit(1)

    # Assign received arguments to descriptive variables
    android_project_root_in_container = sys.argv[1]
    ios_project_root_in_container = sys.argv[2]
    linux_project_root_in_container = sys.argv[3]
    windows_project_root_in_container = sys.argv[4]
    macos_project_root_in_container = sys.argv[5]
    webapp_assets_dir = sys.argv[6]
    container_multi_platform_root = sys.argv[7]
    platform = sys.argv[8]

    generator_dir = os.path.dirname(os.path.abspath(__file__))
    active_config_path = os.path.join(generator_dir, "config.yaml") # This is what entrypoint.sh copied/merged

    full_config = load_yaml_file(active_config_path, "active config file")
    if full_config is None:
        sys.exit(1)

    print("✅ Configuration (from active_config_path) loaded successfully in main.py.")
    print(f"  [main.py] Target platform(s) for Python modification: {platform}")

    # Extract common and platform-specific configs
    common_app_name = full_config.get("app_name", "")
    common_package_name = full_config.get("package_name", "") # Base package/bundle ID
    common_url = full_config.get("url", "") # Base URL

    platform_specific_configs = full_config.get("platform_config", {})

    try:
        # --- Android Modifier Call ---
        if platform == "all" or platform == "android":
            print("--- [main.py] Invoking Android file modification ---")
            android_config_data = platform_specific_configs.get("android", {})
            merged_android_config = {
                "app_name": android_config_data.get("app_name", common_app_name),
                "package_name": android_config_data.get("package_name", common_package_name),
                "url": android_config_data.get("url", common_url),
                **android_config_data
            }
            inject_into_android_files(merged_android_config, android_project_root_in_container, container_multi_platform_root, webapp_assets_dir)
        else:
            print(f"--- [main.py] Skipping Android file modification for platform: {platform} ---")

        # --- iOS Modifier Call (Placeholder) ---
        if platform == "all" or platform == "ios":
            print("--- [main.py] Invoking iOS file modification (Placeholder) ---")
            ios_config_data = platform_specific_configs.get("ios", {})
            merged_ios_config = {
                "app_name": ios_config_data.get("app_name", common_app_name),
                "package_name": ios_config_data.get("package_name", common_package_name), # Can be overridden by ios_config_data['build']['bundle_identifier']
                "url": ios_config_data.get("url", common_url),
                **ios_config_data
            }
            # inject_into_ios_files(merged_ios_config, ios_project_root_in_container, container_multi_platform_root, webapp_assets_dir)
            pass
        else:
            print(f"--- [main.py] Skipping iOS file modification for platform: {platform} ---")

        # --- Linux Modifier Call (Placeholder) ---
        if platform == "all" or platform == "linux":
            print("--- [main.py] Invoking Linux file modification (Placeholder) ---")
            linux_config_data = platform_specific_configs.get("linux", {})
            merged_linux_config = {
                "app_name": linux_config_data.get("app_name", common_app_name),
                "package_name": linux_config_data.get("package_name", common_package_name),
                "url": linux_config_data.get("url", common_url),
                **linux_config_data
            }
            # inject_into_linux_files(merged_linux_config, linux_project_root_in_container, container_multi_platform_root, webapp_assets_dir)
            pass
        else:
            print(f"--- [main.py] Skipping Linux file modification for platform: {platform} ---")

        # --- Windows Modifier Call ---
        if platform == "all" or platform == "windows":
            print("--- [main.py] Invoking Windows file modification ---")
            windows_config_data = platform_specific_configs.get("windows", {})
            merged_windows_config = {
                "app_name": windows_config_data.get("app_name", common_app_name),
                "package_name": windows_config_data.get("package_name", common_package_name), # Base package/bundle ID
                "url": windows_config_data.get("url", common_url), # Base URL
                **windows_config_data # Platform-specific overrides
            }
            # Pass windows_project_root_in_container and webapp_assets_dir
            inject_into_windows_files(merged_windows_config, windows_project_root_in_container, container_multi_platform_root, webapp_assets_dir)
        else:
            print(f"--- [main.py] Skipping Windows file modification for platform: {platform} ---")

        # --- macOS Modifier Call (Placeholder) ---
        if platform == "all" or platform == "macos":
            print("--- [main.py] Invoking macOS file modification (Placeholder) ---")
            macos_config_data = platform_specific_configs.get("macos", {})
            merged_macos_config = {
                "app_name": macos_config_data.get("app_name", common_app_name),
                "package_name": macos_config_data.get("package_name", common_package_name),
                "url": macos_config_data.get("url", common_url),
                **macos_config_data
            }
            # inject_into_macos_files(merged_macos_config, macos_project_root_in_container, container_multi_platform_root, webapp_assets_dir)
            pass
        else:
            print(f"--- [main.py] Skipping macOS file modification for platform: {platform} ---")


        print("Python generator finished successfully.")
    except Exception as e:
        print(f"❌ Python generator failed with an unhandled exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)