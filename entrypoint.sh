#!/bin/bash
set -e

echo "--- Android WebView App Builder ---"

# --- Define Paths ---
CONFIG_FILE="/config/config.yaml"
INPUT_ASSETS_DIR="/input-assets"
OUTPUT_DIR="/output"
# CRITICAL: Define the exact path to the Android 'src/main' directory
# The template-app is copied to /app, so the actual Android project structure is /app/app/src/main
ANDROID_PROJECT_SRC_MAIN_DIR="/app/app/src/main"
GENERATOR_DIR="/generator"

# Define the overall project root inside the container for generator to resolve paths correctly
# Since template-app is copied to /app, the project root for assets is /app
CONTAINER_PROJECT_ROOT="/app"

# --- Default Configuration (if no config.yaml is provided) ---
# ... (rest of your default config variables - unchanged from previous entrypoint.sh) ...
DEFAULT_APP_NAME="My Docker WebView App"
DEFAULT_PACKAGE_NAME="com.docker.webview"
DEFAULT_URL="https://google.com" # A safe default external URL
DEFAULT_MIN_SDK=21
DEFAULT_COMPILE_SDK=34
DEFAULT_TARGET_SDK=34
DEFAULT_BUILD_TOOLS="34.0.0"
DEFAULT_VERSION_CODE=1
DEFAULT_VERSION_NAME="1.0.0"
DEFAULT_ENABLE_JS="true"
DEFAULT_ALLOW_FILE_ACCESS="false"
DEFAULT_ORIENTATION="portrait"
DEFAULT_FULLSCREEN="true"
DEFAULT_THEME_COLOR="#ffffff"
DEFAULT_LOGO_PATH="https://media.licdn.com/dms/image/v2/D4E0BAQFrFRPlzMb8xA/company-logo_200_200/company-logo_200_200/0/1687214639118/devologyx_logo?e=2147483647&v=beta&t=BMa3LxR4WKMBldoJPUnL5u8oL-L9HSNB0AmN6Kvc_Dw" # Empty means no logo will be generated
DEFAULT_SPLASH_TYPE="image"
DEFAULT_SPLASH_CONTENT="" # Empty means no splash image handling
DEFAULT_SPLASH_DURATION=3000
DEFAULT_SPLASH_BG_COLOR="#ffffff"
DEFAULT_SPLASH_TEXT_COLOR="#000000"

# --- Generate/Load Config.yaml ---
if [ -f "$CONFIG_FILE" ]; then
    echo "📥 Found custom config.yaml at ${CONFIG_FILE}. Loading..."
    cp "$CONFIG_FILE" "${GENERATOR_DIR}/config.yaml" || { echo "❌ Failed to copy custom config.yaml."; exit 1; }
else
    echo "⚠️  config.yaml not found at ${CONFIG_FILE}. Generating a default config.yaml."
    cat > "${GENERATOR_DIR}/config.yaml" <<EOF
app_name: "${APP_NAME:-$DEFAULT_APP_NAME}"
package_name: "${PACKAGE_NAME:-$DEFAULT_PACKAGE_NAME}"
url: "${APP_URL:-$DEFAULT_URL}"

build:
  min_sdk_version: ${MIN_SDK:-$DEFAULT_MIN_SDK}
  compile_sdk_version: ${COMPILE_SDK:-$DEFAULT_COMPILE_SDK}
  target_sdk_version: ${TARGET_SDK:-$DEFAULT_TARGET_SDK}
  build_tools_version: "${BUILD_TOOLS:-$DEFAULT_BUILD_TOOLS}"
  version_code: ${VERSION_CODE:-$DEFAULT_VERSION_CODE}
  version_name: "${VERSION_NAME:-$DEFAULT_VERSION_NAME}"

webapp:
  enable_javascript: ${ENABLE_JS:-$DEFAULT_ENABLE_JS}
  allow_file_access: ${ALLOW_FILE_ACCESS:-$DEFAULT_ALLOW_FILE_ACCESS}
  orientation: "${ORIENTATION:-$DEFAULT_ORIENTATION}"
  fullscreen: ${FULLSCREEN:-$DEFAULT_FULLSCREEN}
  theme_color: "${THEME_COLOR:-$DEFAULT_THEME_COLOR}"

logo: "${LOGO_PATH:-$DEFAULT_LOGO_PATH}"

splash:
  type: "${SPLASH_TYPE:-$DEFAULT_SPLASH_TYPE}"
  content: "${SPLASH_CONTENT_OVERRIDE:-$DEFAULT_SPLASH_CONTENT}"
  duration: ${SPLASH_DURATION:-$DEFAULT_SPLASH_DURATION}
  background_color: "${SPLASH_BG_COLOR:-$DEFAULT_SPLASH_BG_COLOR}"
  text_color: "${SPLASH_TEXT_COLOR:-$DEFAULT_SPLASH_TEXT_COLOR}"
EOF
fi

# --- Install Android SDK Components based on config ---
echo "🔍 Reading SDK versions from config.yaml..."
MIN_SDK=$(python3 -c "import sys, yaml; print(yaml.safe_load(sys.stdin)['build']['min_sdk_version'])" < "${GENERATOR_DIR}/config.yaml") || { echo "❌ Failed to read MIN_SDK from config."; exit 1; }
COMPILE_SDK=$(python3 -c "import sys, yaml; print(yaml.safe_load(sys.stdin)['build']['compile_sdk_version'])" < "${GENERATOR_DIR}/config.yaml") || { echo "❌ Failed to read COMPILE_SDK from config."; exit 1; }
TARGET_SDK=$(python3 -c "import sys, yaml; print(yaml.safe_load(sys.stdin)['build']['target_sdk_version'])" < "${GENERATOR_DIR}/config.yaml") || { echo "❌ Failed to read TARGET_SDK from config."; exit 1; }
BUILD_TOOLS_VERSION=$(python3 -c "import sys, yaml; print(yaml.safe_load(sys.stdin)['build']['build_tools_version'])" < "${GENERATOR_DIR}/config.yaml") || { echo "❌ Failed to read BUILD_TOOLS_VERSION from config."; exit 1; }
APP_URL_FROM_CONFIG=$(python3 -c "import sys, yaml; print(yaml.safe_load(sys.stdin)['url'])" < "${GENERATOR_DIR}/config.yaml") || { echo "❌ Failed to read APP_URL from config."; exit 1; }


echo "⚙️  Installing Android SDK components: platform;android-${COMPILE_SDK}, build-tools;${BUILD_TOOLS_VERSION}"
yes | sdkmanager "platforms;android-${COMPILE_SDK}" "build-tools;${BUILD_TOOLS_VERSION}" || { echo "❌ SDK Manager failed to install components."; exit 1; }

# --- Handle Static Assets (if URL points to local files) ---
if [[ "$APP_URL_FROM_CONFIG" == file:///android_asset/* ]]; then
    echo "📂 App URL indicates local assets. Copying static files from ${INPUT_ASSETS_DIR} to ${ANDROID_PROJECT_SRC_MAIN_DIR}/assets..."
    mkdir -p "${ANDROID_PROJECT_SRC_MAIN_DIR}/assets" || { echo "❌ Failed to create assets directory."; exit 1; }
    if [ -d "$INPUT_ASSETS_DIR" ] && [ "$(ls -A $INPUT_ASSETS_DIR)" ]; then
        cp -r "${INPUT_ASSETS_DIR}/." "${ANDROID_PROJECT_SRC_MAIN_DIR}/assets" || { echo "❌ Failed to copy static assets."; exit 1; }
        echo "✅ Static assets copied."
    else
        echo "⚠️ No static assets found in ${INPUT_ASSETS_DIR}. WebView might show a blank page."
    fi
else
    echo "🌐 App URL is external. Skipping static asset copy."
fi

# --- Run Python Generator ---
echo "🔧 Running Python generator to configure app..."
# Pass the correct paths to main.py
# THE FIX IS HERE: Added "${CONTAINER_PROJECT_ROOT}" as the third argument
python3 "${GENERATOR_DIR}/main.py" "${ANDROID_PROJECT_SRC_MAIN_DIR}" "${INPUT_ASSETS_DIR}" "${CONTAINER_PROJECT_ROOT}" || { echo "❌ Python generator failed. Check Python logs above."; exit 1; }

# --- Build APK ---
echo "📦 Building APK..."
# Change to the /app directory where the Android project root (template-app) is located
cd /app || { echo "❌ Failed to change directory to /app. Current WD: $(pwd)"; exit 1; }

echo "🚀 Starting actual Gradle build..."

# --- NEW DEBUGGING STEP ---
echo "🔍 Listing contents of /app/gradle/wrapper for debugging..."
ls -lR /app/gradle/wrapper || true # Use || true to prevent script from exiting if dir is empty/missing
# --- END NEW DEBUGGING STEP ---

./gradlew assembleRelease || { echo "❌ Gradle build failed. Check Gradle logs above for details."; exit 1; }

# Debugging: Verify gradlew exists and is executable
echo "🔍 Verifying gradlew existence and permissions at $(pwd)/gradlew..."
if [ ! -f "./gradlew" ]; then
    echo "❌ gradlew file NOT FOUND at $(pwd)/gradlew. Please ensure template-app contains gradlew."
    ls -l . # List current directory contents
    exit 1
fi
if [ ! -x "./gradlew" ]; then
    echo "❌ gradlew is NOT EXECUTABLE at $(pwd)/gradlew. Trying to set permissions again."
    chmod +x "./gradlew" || { echo "❌ Failed to make gradlew executable."; exit 1; }
fi
echo "✅ gradlew found and is executable."

echo "🚀 Starting actual Gradle build..."
./gradlew assembleRelease --info || { echo "❌ Gradle build failed. Check Gradle logs above for details."; exit 1; }

# --- Export APK ---
echo "✅ Exporting APK..."
mkdir -p "$OUTPUT_DIR" || { echo "❌ Failed to create output directory."; exit 1; }
RELEASE_APK=$(find /app/app/build/outputs/apk/release -name "*.apk" -print -quit)

if [ -f "$RELEASE_APK" ]; then
    cp "$RELEASE_APK" "$OUTPUT_DIR/app-release.apk" || { echo "❌ Failed to copy APK to output."; exit 1; }
    echo "🎉 Done! APK available at /output/app-release.apk"
else
    echo "❌ Failed to find release APK. Check Gradle build logs for errors."
    ls -l /app/app/build/outputs/apk/release # List contents of APK output dir
    exit 1
fi

echo "--- Build Process Complete ---"