# generator/src/utils/config_loader.py
import yaml
import os
import sys

def merge_configs(base, new):
    """Recursively merges dictionary 'new' into 'base'."""
    for k, v in new.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            base[k] = merge_configs(base[k], v)
        else:
            base[k] = v
    return base

def load_yaml_file(file_path, file_description="config file"):
    """Loads configuration from a YAML file with error handling."""
    print(f"  [config_loader.py] Inside load_yaml_file for {file_description}: {file_path}")
    if not os.path.exists(file_path):
        print(f"  [config_loader.py] Error: {file_description} NOT found at {file_path}.")
        return None
    if not os.path.isfile(file_path):
        print(f"  [config_loader.py] Error: {file_description} path {file_path} is not a file.")
        return None
    if not os.access(file_path, os.R_OK):
        print(f"  [config_loader.py] Error: {file_description} {file_path} is not readable (Permission denied).")
        return None

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data if data is not None else {} # Ensure it's a dict even if file is empty
    except yaml.YAMLError as e:
        print(f"  [config_loader.py] Error parsing {file_description} {file_path}: {e}")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                print(f"\n  [config_loader.py] --- Content of {file_description} (for debugging) ---")
                print(f.read())
                print("  [config_loader.py] ---------------------------------------------\n")
        except Exception as read_e:
            print(f"  [config_loader.py] Could not read {file_description} content for debug: {read_e}")
        return None
    except Exception as e:
        print(f"  [config_loader.py] An unexpected error occurred while loading {file_description} {file_path}: {e}")
        return None