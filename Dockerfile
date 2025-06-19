# Stage 1: Base Image and System Dependencies
# Using Ubuntu 22.04 LTS for its modern and stable package repositories.
FROM ubuntu:22.04

# Set non-interactive frontend to avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# LABEL for clarity and maintenance
LABEL maintainer="Your Name/Org"
LABEL description="Multi-Platform App Builder based on Ubuntu 22.04 with Java, Android, NodeJS, and Rust."

# --- GLOBAL SYSTEM DEPENDENCIES & JAVA ---
# Install all essential tools, including OpenJDK 17, from the official Ubuntu repos.
# This single layer is more efficient and ensures all dependencies are met.
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Java Development Kit
    openjdk-17-jdk-headless \
    # Essential build tools
    build-essential \
    pkg-config \
    # Source control and networking
    git \
    curl \
    wget \
    # Archive tools
    zip \
    unzip \
    xz-utils \
    # Python
    python3 \
    python3-pip \
    # Tauri (GTK/WebKit) dependencies for Linux builds/cross-compilation
    libssl-dev \
    libglib2.0-dev \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    # Other native module dependencies
    libgl1 \
    libjpeg-dev \
    libfreetype6-dev \
    liblzma-dev \
    libudev-dev \
    ca-certificates \
    clang \
    libicu-dev \
    # Clean up APT cache to reduce final image size
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# --- ENVIRONMENT VARIABLES ---
# Set up all necessary environment variables for the build tools.
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_COMPILE_SDK_VERSION=34
ENV ANDROID_BUILD_TOOLS_VERSION="34.0.0"
ENV PATH="${JAVA_HOME}/bin:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:/root/.cargo/bin:${PATH}"
ENV PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig"

# Install essential Python packages for helper scripts
RUN pip3 install --no-cache-dir Pillow pyyaml requests

# --- ANDROID BUILD TOOLS INSTALLATION ---
RUN echo "--- Installing Android SDK Command-Line Tools ---" && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd ${ANDROID_HOME}/cmdline-tools && \
    curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools.zip && \
    rm commandlinetools.zip && \
    mv cmdline-tools latest && \
    echo "✅ Android Command-Line Tools installed."

# Accept SDK licenses and install necessary platforms/build-tools
RUN echo "--- Accepting Android SDK Licenses and Installing Components ---" && \
    yes | sdkmanager --licenses && \
    sdkmanager "platforms;android-${ANDROID_COMPILE_SDK_VERSION}" \
               "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
               "platform-tools" && \
    echo "✅ Android SDK components installed."

# --- NODE.JS INSTALLATION ---
# Install Node.js LTS version using the official NodeSource repository script.
RUN echo "--- Installing Node.js LTS ---" && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    echo "✅ Node.js installed!."

# --- RUST (FOR TAURI) INSTALLATION ---
RUN echo "--- Installing Rust and Cargo ---" && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    echo "✅ Rust and Cargo installed."

# Ensure the Rust toolchain is up-to-date
RUN echo "--- Updating Rust Toolchain ---" && \
    rustup update stable --no-self-update && \
    echo "✅ Rust Toolchain updated."

# --- TAURI CLI INSTALLATION ---
RUN echo "--- Installing Tauri CLI ---" && \
    cargo install tauri-cli --version "^2.0.0" --locked && \
    echo "✅ Tauri CLI installed globally via Cargo."

# --- iOS / MACOS BUILD TOOLS (INFORMATIONAL) ---
RUN echo "--- iOS/macOS Build Tools: Cannot be installed on Linux Docker ---" && \
    echo "🚨 Building for iOS/macOS requires Xcode on a macOS environment." && \
    echo "--- End iOS/macOS Build Tools Note ---"

# --- APPLICATION SETUP ---
# Create the output directory for build artifacts
RUN mkdir -p /output

# Copy the entire multi-platform template-app structure to /app
COPY template-app /app

# Copy helper scripts and configuration
COPY generator /generator
COPY entrypoint.sh /entrypoint.sh

# --- FINAL CONFIGURATION ---
# Set permissions for executable scripts and files
RUN chmod +x /app/android/gradlew \
    && chmod +x /entrypoint.sh \
    && chmod 600 /app/android/debug.keystore

# Set the final working directory
WORKDIR /app

# Define the container's entrypoint
ENTRYPOINT ["/entrypoint.sh"]