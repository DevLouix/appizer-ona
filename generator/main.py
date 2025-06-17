# generator/main.py
import os
import yaml
import sys

# Import functions from your src package
from modifiers.android import inject_into_android_files

def load_config(config_path):
    """Loads configuration from a YAML file."""
    print(f"  [main.py] Inside load_config. Checking if config file exists: {config_path}")
    if not os.path.exists(config_path):
        print(f"  [main.py] Error: Config file NOT found at {config_path} (from os.path.exists).")
        sys.exit(1)
    if not os.path.isfile(config_path):
        print(f"  [main.py] Error: Config path {config_path} is not a file.")
        sys.exit(1)
    if not os.access(config_path, os.R_OK):
        print(f"  [main.py] Error: Config file {config_path} is not readable (Permission denied).")
        sys.exit(1)

    try:
        print(f"  [main.py] Attempting to open config file: {config_path}")
        with open(config_path, "r", encoding="utf-8") as f:
            print(f"  [main.py] File {config_path} opened successfully. Attempting yaml.safe_load...")
            config_data = yaml.safe_load(f)
            print(f"  [main.py] yaml.safe_load completed.")
            return config_data
    except FileNotFoundError: # Should be caught by exists check, but as a fallback
        print(f"  [main.py] Error: Config file not found at {config_path} (during open).")
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"  [main.py] Error parsing config file {config_path}: {e}")
        # Print the YAML content for inspection if it's a parsing error
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                print("\n  [main.py] --- Content of config.yaml (for debugging) ---")
                print(f.read())
                print("  [main.py] ---------------------------------------------\n")
        except Exception as read_e:
            print(f"  [main.py] Could not read config.yaml content for debug: {read_e}")
        sys.exit(1)
    except Exception as e: # Catch any other unexpected errors during loading
        print(f"  [main.py] An unexpected error occurred while loading config {config_path}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print(f"  [main.py] Script started. sys.argv: {sys.argv}") # Early debug print
    if len(sys.argv) < 4:
        print("Usage: python3 main.py <android_project_root> <input_assets_dir> <container_project_root>")
        sys.exit(1)

    android_project_src_main_dir = sys.argv[1] # e.g., /app/app/src/main
    input_assets_dir = sys.argv[2]             # e.g., /input-assets
    container_project_root = sys.argv[3]       # e.g., /app

    generator_dir = os.path.dirname(os.path.abspath(__file__))
    config_file_path = os.path.join(generator_dir, "config.yaml")

    print(f"Loading configuration from: {config_file_path}")
    
    # Add a check here immediately before load_config
    if not os.path.exists(config_file_path):
        print(f"  [main.py] PRE-LOAD CHECK: Config file {config_file_path} does not exist before calling load_config!")
        sys.exit(1)
    elif not os.access(config_file_path, os.R_OK):
        print(f"  [main.py] PRE-LOAD CHECK: Config file {config_file_path} exists but is not readable!")
        sys.exit(1)
    else:
        print(f"  [main.py] PRE-LOAD CHECK: Config file {config_file_path} exists and is readable. Proceeding to load_config.")


    config = load_config(config_file_path)

    if config:
        print("Configuration loaded successfully.")
        print(f"  [main.py] Parsed config content snippet: {list(config.keys()) if config else 'Empty config'}") # Debug snippet
        print(f"Android app src/main directory: {android_project_src_main_dir}")
        print(f"Input assets directory: {input_assets_dir}")
        print(f"Container project root: {container_project_root}")

        try:
            inject_into_android_files(config, android_project_src_main_dir, container_project_root, input_assets_dir)
            print("Python generator finished successfully.")
        except Exception as e:
            print(f"❌ Python generator failed with an unhandled exception: {e}")
            import traceback
            traceback.print_exc() # Print full traceback for deeper debugging
            sys.exit(1)
    else:
        print("Failed to load configuration. Exiting.")
        sys.exit(1)