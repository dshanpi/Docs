---
sidebar_position: 3
title: "DshanPI-A1 RK3576 GStreamer Playing 16-Channel Video with Hardware Acceleration"
description: "Playing 16-channel video with hardware decoding on RK3576 using GStreamer, fully utilizing MPP hardware acceleration."
tags: [RK3576, GStreamer, Hardware Acceleration, MPP]
authors: yuxuan
date: 2025-11-12
slug: gstreamer-16ch-hw-acceleration
---

## Demo Video

[https://www.bilibili.com/video/BV1m34VziE2s](https://www.bilibili.com/video/BV1m34VziE2s)

## 1. Experiment Environment
| Category     | Configuration             |
| ------------ | ------------------------ |
| Board        | DshanPI-A1               |
| SoC          | RK3576                   |
| Operating System | Armbian              |
| Desktop      | GNOME                    |
| Window System | Wayland                 |
| GPU Driver   | Panfrost                 |
### Core Hardware Acceleration Units

The RK3576 chip integrates three key hardware acceleration units, each responsible for different stages of video processing:



* **VPU (Video Processing Unit)**: Responsible for video decoding (e.g., H.264 hardware decoding); the core element `mppvideodec` invokes this unit.

* **RGA (Image Acceleration Unit)**: Responsible for image scaling and format conversion (e.g., NV12→RGBA); can be enabled via `mppvideodec` parameters.

* **GPU (Graphics Processing Unit)**: Responsible for video rendering and multi-frame compositing (e.g., `glvideomixer` compositing); managed by the Panfrost driver.

<!-- truncate -->

## 2. Installing GStreamer Tools and Plugins

Run the following commands to install the full set of GStreamer tools and RK3576 hardware acceleration plugins:



```
# Basic tools (gst-launch-1.0, etc.)
sudo apt install -y gstreamer1.0-tools

# Base plugin set (audio/video base functionality)
sudo apt install -y gstreamer1.0-plugins-base
sudo apt install -y gstreamer1.0-plugins-good
sudo apt install -y gstreamer1.0-plugins-bad

# FFmpeg integration plugin (software decoding fallback)
sudo apt install -y gstreamer1.0-libav

# RK3576 hardware acceleration plugin (VPU/RGA support)
sudo apt install -y gstreamer1.0-rockchip1

# GPU rendering dependency (glvideomixer, etc.)
sudo apt install -y libgstreamer-gl1.0-0
```

## 3. Basic Hardware Decoding Playback Practice

### 1. Minimal Hardware Decoding Command



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec ! waylandsink
```

#### Pipeline Breakdown



| Element       | Function                                                            |
| ------------- | ------------------------------------------------------------------ |
| `filesrc`     | Reads a local video file (replace with the actual path, e.g., `/root/bad_apple.mp4`) |
| `qtdemux`     | Demuxes the MP4 file, separating video and audio streams (MP4 is a QuickTime container format) |
| `h264parse`   | Parses the H.264 stream, converting AVCC format in MP4 to the Annex B raw stream supported by the decoder |
| `mppvideodec` | Invokes RK3576 VPU hardware decoding, outputting NV12 format images (the default hardware decoding format) |
| `waylandsink` | Invokes GPU rendering to display the video in a Wayland window (automatically converts NV12 to RGB format) |

### 2. Additional Notes on Key Stages

#### (1) Demuxing and Stream Parsing



* An MP4 file is a "container"; you need `qtdemux` to separate the internal video stream (H.264) and audio stream.

* H.264 streams come in two formats: MP4 uses **AVCC format** by default, while the hardware decoder only supports **Annex B raw stream**, so `h264parse` must perform the conversion.

#### (2) Decoding
* H.264 decoding produces NV12 images.
In systems without hardware decoding, the `avdec_h264` element can be used instead.
`avdec_h264` invokes the FFmpeg software decoder.
It can also be used to compare the performance gap between hardware and software decoding.

#### (3) Rendering (Wayland vs X11)
* In the Wayland window system, NV12 images can be passed in directly, and the GPU is automatically invoked to convert them to RGB for rendering display.
In the X11 window system, an additional element is needed to convert NV12 images to RGB before rendering.
Since the Wayland window system is used here, the rendering element is `waylandsink`.
For X11, you would use `xvimagesink` or `glimagesink`.


| Window System | Rendering Element | Supported Input Formats       | Additional Notes                              |
| ------------- | ----------------- | ----------------------------- | --------------------------------------------- |
| Wayland       | `waylandsink`     | NV12, RGBA/BGRA               | Automatically uses GPU to convert NV12→RGB for rendering |
| X11           | `xvimagesink`     | RGB/RGBA (NV12 not supported) | Requires RGA/GPU to convert the format in advance |
| X11           | `glimagesink`     | RGB/RGBA (NV12 not supported) | Depends on GPU for format conversion, performance better than XV |

### 3. Hardware Load Monitoring Commands

Use the following commands to monitor VPU/RGA/GPU usage in real time (it is recommended to use `tmux` to split panes for simultaneous viewing):

#### (1) View RGA Usage



```
watch -n 1 cat /sys/kernel/debug/rkrga/load
```

#### (2) View GPU Usage (Panfrost Driver)



```
watch -n 1 cat /sys/class/devfreq/27800000.gpu/load
```

#### (3) View GPU Usage (Official Mali Driver, Optional)



```
watch -n 1 cat /sys/devices/platform/fb000000.gpu/utilisation
```

## 4. Application Scenarios for RGA Hardware Acceleration

RGA is mainly used for **image scaling** and **format conversion**; it can reduce GPU load and is especially suited for multi-video playback scenarios.

### 1. RGA for Video Scaling (Full-Screen Playback)

If the video resolution is 720P and it needs to fit a 1080P screen in full screen, use the `width`/`height` parameters of `mppvideodec` to invoke RGA scaling:



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec width=1920 height=1080 ! waylandsink
```

#### Comparison: GPU Scaling Approach

If RGA is not enabled and only `waylandsink`'s `fullscreen=true` is used to let the GPU scale, you can compare the load difference between the two:



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec ! waylandsink fullscreen=true
```

### 2. RGA for Image Format Conversion

In Wayland, `waylandsink` does not support RGB/BGR formats, only **RGBA/BGRA** (with alpha); in X11, `xvimagesink` does not support NV12 and needs RGB format. Use the `format` parameter of `mppvideodec` to invoke RGA for format conversion:



```
# Wayland scenario: NV12→RGBA (reduces GPU format conversion load)
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec format=RGBA ! waylandsink

# X11 scenario: NV12→RGB (adapts to xvimagesink)
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec format=RGB ! xvimagesink
```

### 3. Principles for Choosing Between RGA and GPU



| Dimension           | RGA                                         | GPU                                  |
| ------------------- | ------------------------------------------- | ------------------------------------ |
| Load                | Low usage, small fluctuation, multi-core support | High usage, large fluctuation, easily exceeds 50% |
| Functional Focus    | Image scaling, format conversion (dedicated) | Rendering, multi-frame compositing (general-purpose) |
| Applicable Scenarios | Single video scaling, format conversion     | Multi-video compositing, 3D rendering |
| Selection Advice    | Prefer RGA when possible to balance the load | Scenarios RGA does not support (e.g., compositing) |

## 5. Multi-Frame Compositing Practice

Multi-frame compositing relies on `glvideomixer` (GPU implemented); pay attention to **multi-stream conflict handling** and **queue buffer optimization**.
In fact, RGA can also composite, but it is not implemented in the GStreamer element; compositing is possible by programming RGA directly.

### 1. 2-Frame Compositing (Basic Version)

For multi-stream video, you need to name the `qtdemux` (to avoid conflicts) and define frame positions via `xpos`/`ypos`:



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! \
qtdemux name=demux_left ! h264parse ! \
mppvideodec format=RGBA width=960 height=1080 ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! \
qtdemux name=demux_right ! h264parse ! \
mppvideodec format=RGBA width=960 height=1080 ! \
glvideomixer.sink_1 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 \ 
sink_1::xpos=960 sink_1::ypos=0 ! \
waylandsink
```

### 2. 2-Frame Compositing (Optimized Version, with Queues)

Multi-stream video processing takes more time; add `queue` buffers to prevent stuttering (queues should be added at key nodes of each stream):



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! queue ! \
qtdemux name=demux_left ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=960 height=1080 ! queue ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! queue ! \
qtdemux name=demux_right ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=960 height=1080 ! queue ! \
glvideomixer.sink_1 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 \
sink_1::xpos=960 sink_1::ypos=0 ! queue ! \
waylandsink
```

### 3. 4-Frame Compositing (2×2 Grid)



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux1 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux2 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_1 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux3 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_2 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux4 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_3 \
glvideomixer name=glvideomixer \
sink_0::xpos=0    sink_0::ypos=0    sink_0::width=960 sink_0::height=540 \
sink_1::xpos=960  sink_1::ypos=0    sink_1::width=960 sink_1::height=540 \
sink_2::xpos=0    sink_2::ypos=540  sink_2::width=960 sink_2::height=540 \
sink_3::xpos=960  sink_3::ypos=540  sink_3::width=960 sink_3::height=540 ! queue ! \
waylandsink
```

### 4. 16-Frame Compositing (4×4 Grid, High-Load Scenario)

#### (1) Solving the File Descriptor Limit Issue

16-channel video creates a large number of DMA buffers (consuming Linux file descriptors FD); you need to raise the FD limit first:



```
ulimit -n 4096  # Temporary; needs to be re-set after reboot
```

#### (2) 16-Frame Compositing Command



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux1 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux2 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_1 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux3 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_2 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux4 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_3 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux5 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_4 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux6 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_5 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux7 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_6 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux8 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_7 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux9 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_8 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux10 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_9 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux11 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_10 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux12 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_11 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux13 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_12 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux14 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_13 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux15 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_14 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux16 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_15 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 sink_0::width=480 sink_0::height=270 \
sink_1::xpos=480 sink_1::ypos=0 sink_1::width=480 sink_1::height=270 \
sink_2::xpos=960 sink_2::ypos=0 sink_2::width=480 sink_2::height=270 \
sink_3::xpos=1440 sink_3::ypos=0 sink_3::width=480 sink_3::height=270 \
sink_4::xpos=0 sink_4::ypos=270 sink_4::width=480 sink_4::height=270 \
sink_5::xpos=480 sink_5::ypos=270 sink_5::width=480 sink_5::height=270 \
sink_6::xpos=960 sink_6::ypos=270 sink_6::width=480 sink_6::height=270 \
sink_7::xpos=1440 sink_7::ypos=270 sink_7::width=480 sink_7::height=270 \
sink_8::xpos=0 sink_8::ypos=540 sink_8::width=480 sink_8::height=270 \
sink_9::xpos=480 sink_9::ypos=540 sink_9::width=480 sink_9::height=270 \
sink_10::xpos=960 sink_10::ypos=540 sink_10::width=480 sink_10::height=270 \
sink_11::xpos=1440 sink_11::ypos=540 sink_11::width=480 sink_11::height=270 \
sink_12::xpos=0 sink_12::ypos=810 sink_12::width=480 sink_12::height=270 \
sink_13::xpos=480 sink_13::ypos=810 sink_13::width=480 sink_13::height=270 \
sink_14::xpos=960 sink_14::ypos=810 sink_14::width=480 sink_14::height=270 \
sink_15::xpos=1440 sink_15::ypos=810 sink_15::width=480 sink_15::height=270 ! queue ! \
waylandsink
```
