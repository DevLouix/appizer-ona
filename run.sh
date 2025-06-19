#!/bin/bash
set -e

# Define container image name
IMAGE_NAME="webview-builder"

# Define local directories to mount
# Assume 'output' and 'input_assets' are sibling directories to this script
# Assume 'keys' directory for keystores is also a sibling
HOST_OUTPUT_DIR="$(pwd)/output"
HOST_INPUT_ASSETS_DIR="$(pwd)/input_assets"
HOST_CONFIG_DIR="$(pwd)/config" # Assuming your config.yaml is in a 'config' folder
HOST_KEYSTORES_DIR="$(pwd)/keys" # Assuming your my-release-key.keystore is in a 'keys' folder

# Ensure output directory exists on host
mkdir -p "$HOST_OUTPUT_DIR"

# Parse arguments for platform and skip_errors
PLATFORM=""
SKIP_ERRORS=""
BUILD_ARGS=""

while getopts ":p:s" opt; do
  case $opt in
    p)
      PLATFORM="$OPTARG"
      BUILD_ARGS+="-p $PLATFORM "
      ;;
    s)
      SKIP_ERRORS="true"
      BUILD_ARGS+="-s "
      ;;
    \?)
      echo "Error: Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Error: Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))

if [ -z "$PLATFORM" ]; then
    echo "Usage: $0 -p <all|android|ios|linux|windows|macos> [-s]"
    exit 1
fi

echo "--- Running Docker Build Container ---"
echo "Platform: $PLATFORM"
echo "Output Directory: $HOST_OUTPUT_DIR"
echo "Input Assets Directory: $HOST_INPUT_ASSETS_DIR"
echo "Keystores Directory: $HOST_KEYSTORES_DIR"

# Run the Docker container
docker run --rm \
  -v "$HOST_OUTPUT_DIR":/output \
  -v "$HOST_INPUT_ASSETS_DIR":/input-assets \
  -v "$HOST_CONFIG_DIR":/config \
  -v "$HOST_KEYSTORES_DIR":/keystores \
  -v "$HOME/.android":/root/.android \ # Important for Android SDK caches/permissions
  "$IMAGE_NAME" $BUILD_ARGS