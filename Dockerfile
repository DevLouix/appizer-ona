# Dockerfile
FROM openjdk:17-slim

# Set environment variables for Android SDK
ENV ANDROID_HOME=/sdk

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unzip git wget zip python3 python3-pip libgl1 libjpeg-dev libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Python packages
RUN pip3 install --no-cache-dir Pillow pyyaml

# --- Android CLI tools installation ---
# 1. Create the base directory for command-line tools
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools

# Install Android command line tools
RUN mkdir -p /sdk/cmdline-tools && \
    cd /sdk/cmdline-tools && \
    curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools.zip && \
    rm commandlinetools.zip && \
    mv cmdline-tools latest

# Set environment variables for Android SDK
ENV ANDROID_HOME=/sdk
ENV PATH=$PATH:/sdk/cmdline-tools/latest/bin:/sdk/platform-tools

# Accept licenses and install platform-tools
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools"

# Create directories for input and output
RUN mkdir -p /input-assets /config /output

# Copy the Android project template root
COPY template-app /app

# Ensure gradlew is executable immediately after copying
RUN chmod +x /app/gradlew

# --- Explicitly copy gradle-wrapper.jar and set permissions ---
# This ensures the JAR is definitely there and readable for gradlew to use.
# It means you MUST ensure 'gradle-wrapper.jar' exists in your host's template-app/gradle/wrapper/
# before building the Docker image.
RUN mkdir -p /app/gradle/wrapper
COPY template-app/gradle/wrapper/gradle-wrapper.jar /app/gradle/wrapper/gradle-wrapper.jar
RUN chmod 644 /app/gradle/wrapper/gradle-wrapper.jar # Ensure readable by all

# --- NEW: Copy debug.keystore to the project root in the container ---
COPY template-app/debug.keystore /app/debug.keystore
RUN chmod 600 /app/debug.keystore # Set restrictive permissions


# Copy the Python generator scripts
COPY generator /generator

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Set working directory and make entrypoint executable
WORKDIR /app
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]