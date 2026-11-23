---
title: MPP 硬件编解码（H.264）
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/MPP
---

Rockchip MPP 调用板上的视频编解码硬件。先生成一段已知尺寸的 H.264 码流，再解码为原始图像，即可检查两端。

## 从码流还原图像，再编码为视频

MPP（Media Process Platform）为应用提供 Rockchip 硬件编解码接口。解码器将 H.264 等压缩码流还原为图像帧，编码器把图像帧压成码流。NV12 由亮度平面和交错 UV 平面组成，紧密排列的一帧占 `宽 × 高 × 1.5` 字节。

| 测试参数 | 含义 |
| --- | --- |
| `-i`、`-o` | 输入与输出文件。解码时输入码流，编码时输入原始帧 |
| `-t 7`、`-n` | 选择 H.264 及处理帧数 |
| `-w`、`-h` | 编码输入帧的宽和高。播放原始 YUV 时也要提供尺寸和格式 |

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 确认工具并编解码八帧

**确认板上有编解码工具。** 输出应包含两个程序的路径。

```bash
command -v mpi_enc_test mpi_dec_test
```

**编码八帧。** 输出文件是 `cm5.h264`。

```bash
mpi_enc_test -w 320 -h 240 -t 7 -n 8 -o cm5.h264
```

**解码并检查文件大小。** 得到原始画面 `cm5.yuv`，用字节数与下方结果对照。

```bash
mpi_dec_test -t 7 -i cm5.h264 -o cm5.yuv
wc -c cm5.h264 cm5.yuv
```

`-t 7` 指定 H.264，`-n 8` 指定八帧。不传输入文件时，编码测试程序生成测试画面。若终端找不到这两个工具，可在板端从 Rockchip MPP 源码构建带测试程序的版本。 [MPP 源码与构建说明](https://github.com/rockchip-linux/mpp)

### 检查解码结果

本板编码和解码各完成 8 帧，`cm5.yuv` 为 **921600 字节**，与 `320 × 240 × 1.5 × 8` 一致。H.264 文件大小取决于编码参数，此次为 5370 字节。

### 解码并重新编码 100 帧视频

在 DshanPI A1 CM5 桌面终端创建一个空目录，调用 MPP 生成 100 帧 H.264 测试画面，再解码并重新编码。

**生成测试视频。** 编码 100 帧 1920 × 1080 画面到 `input.h264`。

```bash
mpi_enc_test -w 1920 -h 1080 -t 7 -n 100 -o input.h264
```

**解码为原始画面。** 输出保存在 `output.yuv`。

```bash
mpi_dec_test -t 7 -i input.h264 -n 100 -o output.yuv
```

**将原始画面重新编码。** 生成 `reEnc.h264`。

```bash
mpi_enc_test -w 1920 -h 1080 -t 7 -i output.yuv -n 100 -o reEnc.h264
```

**核对结果。** 查看视频格式、尺寸、帧数和原始画面的字节数。

```bash
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,nb_read_frames -of default=nw=1 reEnc.h264
wc -c output.yuv
```

```text
codec_name=h264
width=1920
height=1080
nb_read_frames=100
311040000 output.yuv
```

测试图由编码器生成，无需摄像头。原始 YUV 文件约占 311 MB。
