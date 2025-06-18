# generator/utils/main.py
import os
import shutil
import re

def replace_in_file(file_path, replacements):
    """
    Replaces multiple string occurrences in a file.
    `replacements` can be a dict {old_string: new_string} or list of tuples [(old, new)].
    """
    print(f"  [file_ops] Entering replace_in_file for: {file_path}")
    try:
        if not os.path.exists(file_path):
            print(f"  [file_ops] Warning: File not found for replace_in_file: {file_path}. Skipping.")
            return

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        original_content = content # Keep original to check if changes were made

        if isinstance(replacements, dict):
            for old, new in replacements.items():
                content = content.replace(old, new)
        elif isinstance(replacements, list):
            for old, new in replacements:
                content = content.replace(old, new)
        else:
            raise TypeError("Replacements must be a dictionary or a list of (old, new) tuples.")

        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  [file_ops] Successfully updated: {file_path}")
        else:
            print(f"  [file_ops] No changes needed in: {file_path}")

    except FileNotFoundError: # Should be caught by exists() check, but for safety
        print(f"  [file_ops] Error: File not found at {file_path} during replace_in_file.")
        raise # Re-raise to ensure main script catches it
    except PermissionError:
        print(f"  [file_ops] Permission denied when writing to {file_path} in replace_in_file.")
        raise
    except Exception as e:
        print(f"  [file_ops] Unexpected error updating file {file_path} in replace_in_file: {e}")
        raise

def replace_placeholders(file_path, replacements):
    """
    Replaces {{KEY}} placeholders in a file with values from the replacements dictionary.
    """
    print(f"  [file_ops] Entering replace_placeholders for: {file_path}")
    try:
        if not os.path.exists(file_path):
            print(f"  [file_ops] Warning: File not found for replace_placeholders: {file_path}. Skipping.")
            return

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        original_content = content # Keep original to check if changes were made

        for key, val in replacements.items():
            content = content.replace(f"{{{{{key}}}}}", str(val)) # Ensure value is string

        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  [file_ops] Successfully replaced placeholders in: {file_path}")
        else:
            print(f"  [file_ops] No placeholder changes needed in: {file_path}")

    except FileNotFoundError: # Should be caught by exists() check, but for safety
        print(f"  [file_ops] Error: File not found at {file_path} during replace_placeholders.")
        raise
    except PermissionError:
        print(f"  [file_ops] Permission denied when writing to {file_path} in replace_placeholders.")
        raise
    except Exception as e:
        print(f"  [file_ops] Unexpected error replacing placeholders in {file_path}: {e}")
        raise
