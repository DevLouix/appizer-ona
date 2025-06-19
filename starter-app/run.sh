#!/bin/bash
set -e

# Define container image name
IMAGE_NAME="webview-builder"

# Define local directories to mount
# Assume 'output' and 'webapp' are sibling directories to this script
# Assume 'keys' directory for keystores is also a sibling
HOST_OUTPUT_DIR="$(pwd)/output"
HOST_WEBAPP_ASSETS_DIR="$(pwd)/app/src/webapp"
HOST_CONFIG_FILE="$(pwd)/config.yaml" # the config file
HOST_BUILD_DIR="$(pwd)/app/build" # adding the build dir folder as it contains all platfrom specific build opts

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
echo "Input Assets Directory: $HOST_WEBAPP_ASSETS_DIR"
echo "Keystores Directory: $HOST_BUILD_DIR"

# Run the Docker container
docker run --rm \
  -v "${HOST_OUTPUT_DIR}":/output \
  -v "${HOST_WEBAPP_ASSETS_DIR}":/webapp \
  -v "${HOST_CONFIG_FILE}":/config.yaml \
  -v "${HOST_BUILD_DIR}":/build \
  "$IMAGE_NAME" $BUILD_ARGS