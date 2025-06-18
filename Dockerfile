# Dockerfile
# Base image: OpenJDK for Java/Gradle builds (Android requires Java)
FROM openjdk:17-slim

# LABEL for clarity
LABEL maintainer="Your Name/Org"
LABEL description="Multi-Platform WebView App Builder with pre-installed Android, NodeJS, and Rust tools."

# --- GLOBAL SYSTEM DEPENDENCIES ---
# Install essential tools required by various SDKs or Python scripts
# build-essential, pkg-config, libssl-dev are common for Node.js/Rust native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    git \
    wget \
    zip \
    python3 \
    python3-pip \
    libgl1 \
    libjpeg-dev \
    libfreetype6-dev \
    build-essential \
    pkg-config \
    libssl-dev \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Python packages (pyyaml is crucial for config parsing, Pillow for image processing, requests for http reqs)
RUN pip3 install --no-cache-dir Pillow pyyaml requests

# --- ANDROID BUILD TOOLS INSTALLATION ---
# All Android SDK components are installed here.
# Set ANDROID_HOME globally for the image for convenience
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools"

RUN echo "--- Installing Android SDK Command-Line Tools ---" && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd ${ANDROID_HOME}/cmdline-tools && \
    curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools.zip && \
    rm commandlinetools.zip && \
    mv cmdline-tools latest && \
    echo "✅ Android Command-Line Tools installed."

# Accept SDK licenses and install necessary platforms/build-tools/platform-tools
# These are the versions that will be PRE-INSTALLED in the image.
# Align these with your default_config.yaml Android build settings.
ENV ANDROID_COMPILE_SDK_VERSION=34
ENV ANDROID_BUILD_TOOLS_VERSION="34.0.0"

RUN echo "--- Accepting Android SDK Licenses and Installing Components ---" && \
    yes | sdkmanager --licenses && \
    sdkmanager "platforms;android-${ANDROID_COMPILE_SDK_VERSION}" \
               "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
               "platform-tools" && \
    echo "✅ Android SDK components installed."

# --- NODE.JS (FOR ELECTRON, REACT NATIVE, ETC. DESKTOP/WEB-BASED APPS) ---
# Install Node.js LTS version using NodeSource repository
RUN echo "--- Installing Node.js LTS ---" && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    echo "✅ Node.js installed."

# --- RUST (FOR TAURI, NATIVE DESKTOP APPS) ---
# Install Rust using rustup
RUN echo "--- Installing Rust and Cargo ---" && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    echo "✅ Rust and Cargo installed."

# Add Cargo's bin directory to PATH for subsequent layers
ENV PATH="/root/.cargo/bin:${PATH}"

# Ensure the Rust toolchain is up-to-date (still good practice for core Tauri compilation)
RUN echo "--- Updating Rust Toolchain ---" && \
    rustup update stable --no-self-update && \
    echo "✅ Rust Toolchain updated."

# --- Tauri CLI Installation using NPM ---
# This is preferred when you want to avoid direct Rust compilation issues for the CLI itself,
# as npm might download pre-built binaries.
# We will install it globally so the 'tauri' command is available directly.
# Use version 1.5.0 to align with Cargo.toml, or 1.6.0 if 1.5.0 causes issues.
RUN echo "--- Installing Tauri CLI (npm) ---" && \
    cargo install tauri-cli --version "^2.0.0" --locked && \
    echo "✅ Tauri CLI installed globally via npm."

# --- iOS / MACOS BUILD TOOLS (IMPORTANT LIMITATION) ---
# iOS and macOS applications require Xcode and a macOS environment to build.
# These tools CANNOT be installed or run directly on a Linux-based Docker image.
# If you need to build for iOS/macOS, you will require a macOS build agent or a cloud CI/CD service
# that provides macOS runners (e.g., Apple Silicon Macs for native builds).
RUN echo "--- iOS/macOS Build Tools: Cannot be installed on Linux Docker ---" && \
    echo "🚨 Building for iOS/macOS requires Xcode on a macOS environment. This Docker image is Linux-based." && \
    echo "Consider using a macOS-specific build agent or cloud CI/CD service for these platforms." && \
    echo "--- End iOS/macOS Build Tools Note ---"


# --- APPLICATION TEMPLATE & CONFIGURATION ---
# Create output directories (input-assets & config directories are handled by mounts at runtime)
RUN mkdir -p /output

# Copy the entire multi-platform template-app structure to /app
COPY template-app /app

#-----------------------Android
# Adjust paths for Android-specific items within the new structure
# Ensure gradlew is executable (it's part of template-app/android)
RUN chmod +x /app/android/gradlew

# Copy debug.keystore from its new location (template-app/android) to its new destination (/app/android)
# This is needed for Android debug builds.
COPY template-app/android/debug.keystore /app/android/debug.keystore
RUN chmod 600 /app/android/debug.keystore # Set restrictive permissions

# Copy the Python generator scripts and the default_config.yaml
COPY generator /generator

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Set working directory to the overall multi-platform project root
WORKDIR /app
# Make entrypoint executable and define it
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]