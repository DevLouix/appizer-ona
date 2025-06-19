# generator/utils/file_actions.py
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

def move_java_sources(base_android_src_path, old_package_name, new_package_name):
    """
    Moves Java source files from old package path to new package path
    and updates their package declarations.
    `base_android_src_path` should be the path to the 'src/main' directory.
    """
    print(f"  [file_ops] Entering move_java_sources. Old pkg: {old_package_name}, New pkg: {new_package_name}")
    old_pkg_path = old_package_name.replace(".", "/")
    new_pkg_path = new_package_name.replace(".", "/")

    # Corrected path: 'java' is directly under 'base_android_src_path' (which is src/main)
    old_java_dir = os.path.join(base_android_src_path, "java", old_pkg_path)
    new_java_dir = os.path.join(base_android_src_path, "java", new_pkg_path)

    # --- Check if the source directory exists before proceeding ---
    if not os.path.exists(old_java_dir):
        print(f"  [file_ops] ⚠️ Source Java package directory not found: {old_java_dir}. Skipping Java file moves and package updates.")
        # Ensure the new target directory exists for subsequent operations if the old one didn't
        try:
            os.makedirs(new_java_dir, exist_ok=True)
            print(f"  [file_ops] Ensured new target Java directory exists: {new_java_dir}")
        except OSError as e:
            print(f"  [file_ops] Error creating new Java package directory {new_java_dir}: {e}")
            raise
        return # Exit the function early if source doesn't exist

    try:
        os.makedirs(new_java_dir, exist_ok=True)
        print(f"  [file_ops] Ensured target Java directory exists: {new_java_dir}")
    except OSError as e:
        print(f"  [file_ops] Error creating target Java directory {new_java_dir}: {e}")
        raise # Re-raise if target cannot be created

    java_files_to_move = [
        "MainActivity.java",
        "SplashActivity.java",
    ]

    moved_any_file = False
    for file_name in java_files_to_move:
        src_file_path = os.path.join(old_java_dir, file_name)
        dst_file_path = os.path.join(new_java_dir, file_name)

        if os.path.exists(src_file_path):
            try:
                shutil.move(src_file_path, dst_file_path)
                print(f"  [file_ops] Moved: {file_name} from {os.path.relpath(src_file_path, base_android_src_path)} to {os.path.relpath(dst_file_path, base_android_src_path)}")

                # Update package name within the moved file
                replace_in_file(dst_file_path, {
                    f"package {old_package_name};": f"package {new_package_name};"
                })
                print(f"  [file_ops] Updated package declaration in: {file_name}")
                moved_any_file = True
            except (shutil.Error, OSError, PermissionError) as e:
                print(f"  [file_ops] Error moving/updating {file_name}: {e}")
                raise
            except Exception as e:
                print(f"  [file_ops] Unexpected error during file move/update for {file_name}: {e}")
                raise
        else:
            print(f"  [file_ops] Warning: Java file not found for moving: {src_file_path}")

    # --- NEW: More robust cleanup loop ---
    if moved_any_file:
        current_dir = old_java_dir
        java_base_dir_to_stop_at = os.path.join(base_android_src_path, "java")
        print(f"  [file_ops] Starting cleanup from {current_dir} up to {java_base_dir_to_stop_at}")
        
        while True:
            # Break if we've gone past the desired stop point
            if not current_dir.startswith(java_base_dir_to_stop_at) or current_dir == java_base_dir_to_stop_at:
                break
            
            # Check if current_dir still exists and is a directory before trying to list it
            if os.path.exists(current_dir) and os.path.isdir(current_dir):
                try:
                    if not os.listdir(current_dir): # If empty
                        os.rmdir(current_dir)
                        print(f"  [file_ops] Removed empty directory: {current_dir}")
                except OSError as e:
                    print(f"  [file_ops] Error removing empty directory {current_dir}: {e}")
                    break # Stop cleanup if an error occurs
            else:
                print(f"  [file_ops] Directory {current_dir} no longer exists or is not a directory. Stopping cleanup.")
                break # Directory already gone or not a dir, stop traversal

            parent_dir = os.path.dirname(current_dir)
            if parent_dir == current_dir: # Reached root or stuck
                break
            current_dir = parent_dir

def copy_resource_file(src_file_path, dest_dir):
    """Copies a file to the destination directory."""
    print(f"  [file_ops] Entering copy_resource_file. Src: {src_file_path}, Dest: {dest_dir}")
    try:
        os.makedirs(dest_dir, exist_ok=True)
        shutil.copy2(src_file_path, dest_dir)
        print(f"  [file_ops] Successfully copied '{os.path.basename(src_file_path)}' to '{dest_dir}'")
        return True
    except FileNotFoundError:
        print(f"  [file_ops] Error: Resource file not found at {src_file_path} during copy_resource_file.")
        raise
    except PermissionError:
        print(f"  [file_ops] Permission denied when writing to {dest_dir} in copy_resource_file.")
        raise
    except Exception as e:
        print(f"  [file_ops] Unexpected error copying resource file {src_file_path}: {e}")
        raise