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
    openjdk-17-jdk-headless \
    build-essential \
    pkg-config \
    git \
    curl \
    wget \
    zip \
    unzip \
    xz-utils \
    python3 \
    python3-pip \
    libayatana-appindicator3-dev \
    libgirepository1.0-dev \
    librsvg2-dev \
    liblzma-dev \
    libudev-dev \
    ca-certificates \
    xz-utils \
    clang \
    libicu-dev \
    g++-mingw-w64-x86-64 \
    webkit2gtk-4.0 \
    gcc-multilib \
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

# ---   GO INSTALLATION ---
ENV GO_VERSION=1.22.4
RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz
# Add Go to PATH
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:$PATH
# Install Wails CLI
RUN go install github.com/wailsapp/wails/v2/cmd/wails@latest

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