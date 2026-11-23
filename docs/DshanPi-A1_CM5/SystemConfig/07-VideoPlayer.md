---
title: 视频播放指南
sidebar_position: 7
slug: /DshanPi-A1_CM5/SystemConfig/VideoPlayer
description: 用 GStreamer 在 GNOME 桌面播放本地文件和网络视频。
---

在 **DshanPI A1 CM5 GNOME 桌面**上打开终端。准备一个有画面和声音的 MP4 文件，或从电脑[传到 DshanPI A1 CM5](./03-FileTransfer.md)。

## 安装播放器

运行 `gst-play-1.0 --version` 查看版本。若命令不存在，或缺少常用解码插件，执行：

```bash
sudo apt update
sudo apt install gstreamer1.0-plugins-base-apps gstreamer1.0-plugins-good gstreamer1.0-libav gstreamer1.0-x gstreamer1.0-pulseaudio
```

## 播放视频

1. 打开视频所在的文件夹，右键选择**在终端中打开**。将 `demo.mp4` 替换为实际文件名。

   ```bash
   gst-play-1.0 "demo.mp4"
   ```

2. 确认显示器上出现连续画面，并能听到声音。按 **空格**暂停或继续，按 **Q** 退出。有画面但无声时，先检查[音频输出设备](./04-AudioConfig.md)。
3. 播放网络视频时，把文件名换成可访问的媒体地址。使用能直接返回媒体数据的 HTTP 地址，或摄像机提供的 RTSP 流地址。例如：

   ```bash
   gst-play-1.0 "rtsp://摄像机地址:端口/流路径"
   ```

<details>
<summary>VP8 视频提示解码失败</summary>

如果日志出现 `unable to create dec vp8`，可在本次播放中优先使用软件解码器。将文件名换成自己的文件或媒体地址：

```bash
GST_PLUGIN_FEATURE_RANK=vp8dec:MAX gst-play-1.0 "demo.webm"
```

</details>

## 查看播放帧率（可选）

在 DshanPI A1 CM5 桌面终端安装帧率显示插件和检查工具，再查看 `fpsdisplaysink` 是否可用：

```bash
sudo apt install gstreamer1.0-plugins-bad gstreamer1.0-tools gstreamer1.0-x
gst-inspect-1.0 fpsdisplaysink
```

看到插件信息后，进入视频所在目录，将 `demo.mp4` 换成实际文件名：

```bash
gst-play-1.0 --videosink="fpsdisplaysink text-overlay=true sync=true" "demo.mp4"
```

看画面上的 `current`（当前帧率）、`average`（平均帧率）和 `dropped`（丢帧数）。[GStreamer 帧率显示插件说明](https://gstreamer.freedesktop.org/documentation/debugutilsbad/fpsdisplaysink.html)

图中演示读数的位置，测试时以当前视频的读数为准。

<img src={require('./figures/gstreamer-fps-overlay.png').default} width="600" alt="视频底部叠加的丢帧数、当前帧率和平均帧率" />

<details>
<summary>指定显示和声音输出</summary>

在 Wayland 桌面，可在上述 `fpsdisplaysink` 引号内追加 `video-sink=waylandsink`。需要直接测试 ALSA 设备时，先用 `aplay -l` 确认声卡和设备，再给 `gst-play-1.0` 加上 `--audiosink="alsasink device=plughw:CARD,DEV"`，替换其中的 `CARD,DEV`。常规播放使用桌面当前的音频输出。

</details>

**DshanPI A1 CM5 实测结果**　GStreamer 1.24.2 已播完本地 H.264/AAC 文件、HTTP 视频和板上 RTSP 测试流。帧率叠加和外接显示器的实际画质可按上面的步骤现场核对。
