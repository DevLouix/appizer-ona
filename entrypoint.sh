#!/bin/bash
# Removed: set -e globally, as we want to conditionally skip errors for build steps.

echo "--- Multi-Platform WebView App Builder ---"

# --- Define Paths ---
CONFIG_FILE="/config/config.yaml"          # User's mounted config.yaml
DEFAULT_CONFIG_FILE="/generator/default_config.yaml" # Default config baked into image
ACTIVE_CONFIG_FILE="/generator/config.yaml"    # The config file that main.py will read

INPUT_ASSETS_DIR="/input-assets"
OUTPUT_DIR="/output"

# Define the root directory for each platform's project within the container
CONTAINER_MULTI_PLATFORM_ROOT="/app" # This is the /app where template-app was copied

ANDROID_PROJECT_ROOT="${CONTAINER_MULTI_PLATFORM_ROOT}/android" # NEW
ANDROID_APP_SRC_MAIN_DIR="${ANDROID_PROJECT_ROOT}/app/src/main" # NEW (derived)

IOS_PROJECT_ROOT="${CONTAINER_MULTI_PLATFORM_ROOT}/ios" # Placeholder (changed to ios_project for consistency with windows_project)
LINUX_PROJECT_ROOT="${CONTAINER_MULTI_PLATFORM_ROOT}/linux" # Placeholder (changed to linux_project)
WINDOWS_PROJECT_ROOT="${CONTAINER_MULTI_PLATFORM_ROOT}/windows" # Placeholder (changed to windows_project)
MACOS_PROJECT_ROOT="${CONTAINER_MULTI_PLATFORM_ROOT}/macos" # Placeholder (changed to macos_project)

GENERATOR_DIR="/generator"


# --- Parse Command-Line Arguments ---
PLATFORM=""
SKIP_ERRORS="false" # Default to false: script exits on first build failure

while getopts ":p:s" opt; do # Added 's' for -s (skip errors)
  case $opt in
    p)
      PLATFORM="$OPTARG"
      ;;
    s) # New argument for skipping errors
      SKIP_ERRORS="true"
      echo "⚠️  Skip errors mode enabled. Build failures for individual platforms will be logged, but the process will continue."
      ;;
    \?)
      echo "❌ Error: Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "❌ Error: Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))


# --- Validate PLATFORM Argument ---
if [ -z "$PLATFORM" ]; then
    echo "❌ Error: -p <platform> argument is required."
    echo "Usage: docker run <your-image-name> -p <all|android|ios|linux|windows|macos> [-s]" # Updated usage
    exit 1
fi

case "$PLATFORM" in
    "all"|"android"|"ios"|"linux"|"windows"|"macos")
        echo "✅ Building for platform(s): $PLATFORM"
        ;;
    *)
        echo "❌ Error: Invalid platform '$PLATFORM'. Must be 'all', 'android', 'ios', 'linux', 'windows', or 'macos'."
        exit 1
        ;;
esac


# --- Configure the ACTIVE config.yaml for the generator ---
echo "⚙️  Preparing active configuration file..."
# This step is critical and *must* succeed, so we use '|| exit 1'
python3 -c "
import yaml
import sys
import os

def merge_configs(base, new):
    for k, v in new.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            base[k] = merge_configs(base[k], v)
        else:
            base[k] = v
    return base

try:
    default_config_file = os.environ.get('DEFAULT_CONFIG_FILE', '${DEFAULT_CONFIG_FILE}')
    config_file = os.environ.get('CONFIG_FILE', '${CONFIG_FILE}')
    active_config_file = os.environ.get('ACTIVE_CONFIG_FILE', '${ACTIVE_CONFIG_FILE}')

    with open(default_config_file, 'r', encoding='utf-8') as f:
        default_conf = yaml.safe_load(f) or {}

    user_conf = {}
    # Only try to open config_file if it actually exists to prevent FileNotFoundError
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            user_conf = yaml.safe_load(f) or {}

    final_conf = merge_configs(default_conf, user_conf)
    with open(active_config_file, 'w', encoding='utf-8') as f:
        yaml.dump(final_conf, f, default_flow_style=False)
    print('Merged config written to ' + active_config_file)
except Exception as e:
    print(f'Error during config merge: {e}', file=sys.stderr)
    sys.exit(1)
" DEFAULT_CONFIG_FILE="$DEFAULT_CONFIG_FILE" CONFIG_FILE="$CONFIG_FILE" ACTIVE_CONFIG_FILE="$ACTIVE_CONFIG_FILE" || { echo "❌ Failed to merge configurations."; exit 1; }


# --- Conditional Static Asset Copy (if any platform uses local assets) ---
# This still uses the top-level `url` to decide if /input-assets should be copied.
# If different platforms use different asset sources, this logic will need to be refined.
APP_URL_FROM_CONFIG=$(python3 -c "import sys, yaml; config=yaml.safe_load(sys.stdin); print(config.get('url'))" < "$ACTIVE_CONFIG_FILE")

# This is placed here as a general asset copy step if *any* platform needs it.
# The destination here is primarily Android-centric for now.
# Future: This needs to be smarter based on platform, or assets are copied by platform modifiers.
if [[ "$APP_URL_FROM_CONFIG" == file:///android_asset/* ]] && [[ "$PLATFORM" == "all" || "$PLATFORM" == "android" ]]; then
    echo "📂 App URL indicates local assets. Copying static files from ${INPUT_ASSETS_DIR} to ${ANDROID_APP_SRC_MAIN_DIR}/assets..."
    mkdir -p "${ANDROID_APP_SRC_MAIN_DIR}/assets" || { echo "❌ Failed to create Android assets directory."; exit 1; }
    if [ -d "$INPUT_ASSETS_DIR" ] && [ "$(ls -A $INPUT_ASSETS_DIR)" ]; then
        cp -r "${INPUT_ASSETS_DIR}/." "${ANDROID_APP_SRC_MAIN_DIR}/assets" || { echo "❌ Failed to copy Android static assets."; exit 1; }
        echo "✅ Static assets copied for local WebView use (to Android assets)."
    else
        echo "⚠️ No static assets found in ${INPUT_ASSETS_DIR}. WebView might show a blank page."
    fi
else
    echo "🌐 App URL is external or not an Android build. Skipping general static asset copy to Android assets."
fi


# --- Run Python Generator (Pass platform and project roots) ---
echo "🔧 Running Python generator to configure app for platform(s): $PLATFORM..."
# This step is critical and *must* succeed, so we use '|| exit 1'
python3 "${GENERATOR_DIR}/main.py" \
    "${ANDROID_PROJECT_ROOT}" \
    "${IOS_PROJECT_ROOT}" \
    "${LINUX_PROJECT_ROOT}" \
    "${WINDOWS_PROJECT_ROOT}" \
    "${MACOS_PROJECT_ROOT}" \
    "${INPUT_ASSETS_DIR}" \
    "${CONTAINER_MULTI_PLATFORM_ROOT}" \
    "$PLATFORM" \
    || { echo "❌ Python generator failed. Check Python logs above."; exit 1; }


# --- Conditional Build Steps ---

# Android Build
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "android" ]]; then
    echo "📦 Building Android APK..."
    # Change to the Android project root
    cd "${ANDROID_PROJECT_ROOT}" || { echo "❌ Failed to change directory to ${ANDROID_PROJECT_ROOT}. Current WD: $(pwd)"; exit 1; }

    echo "🔍 Verifying gradlew existence and permissions at $(pwd)/gradlew..."
    # These checks are critical and *must* succeed, so we use '|| exit 1'
    if [ ! -f "./gradlew" ]; then
        echo "❌ gradlew file NOT FOUND at $(pwd)/gradlew. Please ensure template-app/android contains gradlew."
        ls -l . # List current directory contents
        exit 1
    fi
    if [ ! -x "./gradlew" ]; then
        echo "❌ gradlew is NOT EXECUTABLE at $(pwd)/gradlew. Trying to set permissions again."
        chmod +x "./gradlew" || { echo "❌ Failed to make gradlew executable."; exit 1; }
    fi
    echo "✅ gradlew found and is executable."

    echo "🚀 Starting actual Gradle build..."
    ./gradlew assembleRelease
    BUILD_STATUS=$? # Capture exit code of the last command (gradlew)

    if [ $BUILD_STATUS -ne 0 ]; then # If build failed
        echo "❌ Gradle build FAILED for Android."
        if [ "$SKIP_ERRORS" = "true" ]; then
            echo "⚠️  Skipping Android build errors as requested. Continuing with other platforms if applicable."
        else
            echo "🛑 Exiting due to Android build failure. Run with '-s' to skip errors."
            exit 1 # Exit if not skipping errors
        fi
    else
        echo "✅ Android Gradle build successful."
        # --- Export APK ---
        echo "✅ Exporting Android APK..."
        mkdir -p "$OUTPUT_DIR" || { echo "❌ Failed to create output directory."; exit 1; }
        RELEASE_APK=$(find "${ANDROID_PROJECT_ROOT}/app/build/outputs/apk/release" -name "*.apk" -print -quit)

        if [ -f "$RELEASE_APK" ]; then
            cp -fv "$RELEASE_APK" "$OUTPUT_DIR/app-release-android.apk" || { echo "❌ Failed to copy Android APK to output."; exit 1; }
            echo "🎉 Done! Android APK available at /output/app-release-android.apk"
        else
            echo "❌ Failed to find Android release APK. Check Gradle build logs for errors."
            ls -lR "${ANDROID_PROJECT_ROOT}/app/build/outputs/apk/release" # Debugging output
            # This is a post-build artifact finding error, still exit if not skipping.
            if [ "$SKIP_ERRORS" = "true" ]; then
                echo "⚠️  Skipping artifact export error for Android."
            else
                exit 1
            fi
        fi
    fi
else
    echo "ℹ️ Skipping Android build as platform is not 'all' or 'android'."
fi

# iOS Build (Placeholder)
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "ios" ]]; then
    echo "--- iOS Build (Placeholder) ---"
    echo "💡 As noted in the Dockerfile, iOS builds require Xcode on a macOS environment."
    echo "   This Linux Docker image cannot build for iOS."
    # Add conditional error handling here if you implement iOS build later
    # false # Uncomment to simulate failure
    # BUILD_STATUS=$?
    # if [ $BUILD_STATUS -ne 0 ]; then
    #     echo "❌ iOS build FAILED (placeholder)."
    #     if [ "$SKIP_ERRORS" = "true" ]; then echo "⚠️  Skipping iOS errors."; else exit 1; fi
    # fi
    echo "--- iOS Build Placeholder Complete ---"
fi

# Linux Desktop Build (Placeholder)
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "linux" ]]; then
    echo "--- Linux Desktop Build (Placeholder) ---"
    echo "💡 Node.js and Rust are installed. You can add build commands here for frameworks like Electron or Tauri."
    # Add conditional error handling here if you implement Linux build later
    # false # Uncomment to simulate failure
    # BUILD_STATUS=$?
    # if [ $BUILD_STATUS -ne 0 ]; then
    #     echo "❌ Linux build FAILED (placeholder)."
    #     if [ "$SKIP_ERRORS" = "true" ]; then echo "⚠️  Skipping Linux errors."; else exit 1; fi
    # fi
    echo "--- Linux Desktop Build Placeholder Complete ---"
fi

# Windows Desktop Build
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "windows" ]]; then
    echo "--- Windows Desktop Build (Tauri) ---"
    cd "${WINDOWS_PROJECT_ROOT}/src-tauri" || { echo "❌ Failed to change directory to ${WINDOWS_PROJECT_ROOT}/src-tauri."; exit 1; }

    echo "🚀 Starting Tauri build for Windows..."
    cargo tauri build
    BUILD_STATUS=$?

    if [ $BUILD_STATUS -ne 0 ]; then
        echo "❌ Tauri build FAILED for Windows."
        if [ "$SKIP_ERRORS" = "true" ]; then
            echo "⚠️  Skipping Windows build errors as requested. Continuing with other platforms if applicable."
        else
            echo "🛑 Exiting due to Windows build failure. Run with '-s' to skip errors."
            exit 1
        fi
    else
        echo "✅ Windows Tauri build successful."
        echo "✅ Exporting Windows App..."
        mkdir -p "$OUTPUT_DIR" || { echo "❌ Failed to create output directory."; exit 1; }

        # Find the generated installer/executable
        # Use a more robust find to get any MSI or EXE
        WINDOWS_APP_PATH=$(find "${WINDOWS_PROJECT_ROOT}/src-tauri/target/release/bundle" -maxdepth 3 -type f -regex ".*\\.\\(msi\\|exe\\)" -print -quit)

        if [ -f "$WINDOWS_APP_PATH" ]; then
            # Extract just the filename for copying
            APP_FILENAME=$(basename "$WINDOWS_APP_PATH")
            cp -fv "$WINDOWS_APP_PATH" "$OUTPUT_DIR/$APP_FILENAME" || { echo "❌ Failed to copy Windows App to output."; exit 1; }
            echo "🎉 Done! Windows App available at /output/$APP_FILENAME"
        else
            echo "❌ Failed to find Windows App. Check Tauri build logs for errors."
            ls -lR "${WINDOWS_PROJECT_ROOT}/src-tauri/target/release/bundle"
            # This is a post-build artifact finding error, still exit if not skipping.
            if [ "$SKIP_ERRORS" = "true" ]; then
                echo "⚠️  Skipping artifact export error for Windows."
            else
                exit 1
            fi
        fi
    fi
    echo "--- Windows Desktop Build Complete ---"
else
    echo "ℹ️ Skipping Windows build as platform is not 'all' or 'windows'."
fi

# macOS Desktop Build (Placeholder)
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "macos" ]]; then
    echo "--- macOS Desktop Build (Placeholder) ---"
    echo "💡 As noted in the Dockerfile, macOS builds require Xcode on a macOS environment."
    echo "   This Linux Docker image cannot build for macOS."
    # Add conditional error handling here if you implement macOS build later
    # false # Uncomment to simulate failure
    # BUILD_STATUS=$?
    # if [ $BUILD_STATUS -ne 0 ]; then
    #     echo "❌ macOS build FAILED (placeholder)."
    #     if [ "$SKIP_ERRORS" = "true" ]; then echo "⚠️  Skipping macOS errors."; else exit 1; fi
    # fi
    echo "--- macOS Desktop Build Placeholder Complete ---"
fi

echo "--- Build Process Complete ---"