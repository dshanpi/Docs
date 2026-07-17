---
sidebar_position: 2
title: "DshanPI-A1 RK3576 gmrender-resurrect Bilibili Screen Cast"
description: "Using gmrender-resurrect to implement DLNA screen casting on RK3576, casting content such as Bilibili to the development board for playback."
tags: [RK3576, gmrender, Screen Cast, DLNA]
authors: yuxuan
date: 2025-11-10
slug: gmrender-bilibili-cast
---

## Demo Effect

[https://www.bilibili.com/video/BV1Z646zhEBP](https://www.bilibili.com/video/BV1Z646zhEBP)

## 1. Environment Information



| Category     | Configuration       |
| ------ | ---------- |
| Board     | DshanPI-A1 |
| Main SoC   | RK3576     |
| Operating System   | Armbian    |
| Desktop Environment   | GNOME      |
| Window System   | Wayland    |
| GPU Driver | Panfrost   |

## 2. Implementation Principle



1. **Core component**: `gmrender-resurrect` is a tool that receives DLNA service content and plays it via GStreamer, and can be directly configured as a DLNA client.

2. **Hardware acceleration basis**: GStreamer hardware-accelerated video playback has been implemented in advance, meeting the needs of HD stream decoding.

3. **Bilibili screen cast adaptation**: When Bilibili casts via DLNA, it sends an **H264 stream packaged in FLV** (similar to a live stream), which can be played directly with hardware acceleration via `gmrender-resurrect`.

<!-- truncate -->

## 3. Environment Setup (Install Dependencies)

### 1. Install basic build tools



```
sudo apt-get install build-essential \
            autoconf \
            automake \
            libtool \
            pkg-config
```

### 2. Install DLNA and GStreamer core dependencies



```
# Update package sources

sudo apt-get update

# Install DLNA dependencies and GStreamer components (including codec and output plugins)
sudo apt-get install libupnp-dev libgstreamer1.0-dev \
            gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
            gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly \
			gstreamer1.0-rockchip1 sudo apt install -y libgstreamer-gl1.0-0 \
            gstreamer1.0-libav

# Install audio output plugins (PulseAudio + ALSA)
sudo apt install -y gstreamer1.0-pulseaudio
sudo apt-get install gstreamer1.0-alsa

# Install Git (for pulling source code)
sudo apt-get install git
```

## 4. Build gmrender-resurrect

### 1. Pull the source code



```
git clone https://github.com/hzeller/gmrender-resurrect.git
```

### 2. Build and compile



```
# Enter the source directory
cd gmrender-resurrect

# Generate configuration files
./autogen.sh

# Configure build parameters
./configure

make
```

### 3. Copy the logo files (to avoid startup errors)



```
# Copy icons to the system default directory
cp data/grender-128x128.png /usr/local/share/gmediarender/
cp data/grender-64x64.png /usr/local/share/gmediarender/
```

## 5. Start the DLNA Screen Cast Service



```
# -f "DshanPI-A1": set the display name of the device in the DLNA list
# --gstout-videopipe: custom video output pipeline, force Wayland fullscreen
./src/gmediarender  -f "DshanPI-A1" --gstout-videopipe "waylandsink fullscreen=true"
```

## 6. Troubleshooting and Resolution (audio causing video stutter)

### 1. Problem phenomenon



* When playing video only, it works normally; after adding audio, the video freezes directly.

### 2. Troubleshooting steps

#### Step 1: Check sound card status (found suspended)



```
# View the status of all audio output devices
pactl list sinks short
```



* The output shows all sound cards are in the **SUSPENDED** state, and they cannot be activated after running `suspend-sink`, indicating an abnormal connection between PulseAudio and the hardware.

#### Step 2: Check audio service usage (found conflict)



```
# View processes using audio devices
fuser -v /dev/snd/*
```



* The output shows that **PulseAudio, WirePlumber, and PipeWire** three audio services occupy the device simultaneously, indicating a service conflict (PipeWire and PulseAudio have overlapping functionality, competing for sound card control).

### 3. Solution (mask the conflicting PulseAudio service)

#### Step 1: Mask PulseAudio autostart (user level)



```
# Mask the service to prevent autostart
systemctl --user mask pulseaudio
systemctl --user mask pulseaudio.socket
```

> Note: This operation will temporarily make the system unable to recognize PulseAudio devices. To restore, run the unmask command.

#### Step 2: Force kill residual PulseAudio processes



```
pkill -9 pulseaudio
```

### 4. Functional verification (ensure audio/video works)

#### Verification 1: Audio output test



```
# Play a 1000Hz test tone to check whether the speaker outputs sound
gst-launch-1.0 audiotestsrc freq=1000 ! audioconvert ! pulsesink
```
* After masking PulseAudio, gst will use alsa to play audio
* Volume can be controlled via alsamixer


* Normal sound output indicates the audio link is restored.

#### Verification 2: Local video playback test



```
# Play a local video to check audio-video sync
gst-launch-1.0 playbin uri=file:///root/bad_apple.mp4
```



* Normal playback with sound indicates audio-video collaboration is working normally.

### 5. Restart the DLNA service



```
./src/gmediarender  -f "DshanPI-A1" --gstout-videopipe "waylandsink fullscreen=true"
```

## 7. Supplement: Restore PulseAudio service (if needed)

If you need to use PulseAudio later, run the following commands to unmask:



```
systemctl --user unmask pulseaudio
systemctl --user unmask pulseaudio.socket
```
