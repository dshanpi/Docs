---
sidebar_position: 1
---
# TinyVision套件简述

:::tip
* TinyVision开发交流QQ群：821628986
:::

- TinyVision是适用于 Linux主板、IPC、服务器、路由器等的终极一体化解决方案。 TinyVision 采用先进的 Allwinner V851se 或 V851s3 处理器，以紧凑的外形提供卓越的性能和多功能性。
- TinyVision 的 Cortex-A7 内核运行频率高达 1200MHz，RISC-V E907GC@600MHz，可在保持能源效率的同时提供强大的处理能力。 集成的0.5Tops@int8 NPU可为各种应用提供高效的AI推理。
- TinyVision 配备 64M DDR2 (V851se) 或 128M DDR3L (V851s3) 内置内存选项，确保流畅、无缝的操作。 TF 卡插槽支持 UHS-SDR104，为您的数据需求提供可扩展的存储空间。 此外，板载 SD NAND 和 USB&UART Combo 接口提供便捷的连接选项。
- 通过 TinyVision 对 2 通道 MIPI CSI 输入的支持，增强您基于视觉的应用程序，从而实现高级相机功能的无缝集成。 独立的 ISP 可实现高分辨率图像处理，支持高达 2560 x 1440 的分辨率。
- 借助 TinyVision 的 H.264/H.265 解码功能（分辨率高达 4096x4096）享受身临其境的视频体验。 使用 H.264/H.265 编码器捕捉和编码令人惊叹的时刻，支持高达 3840x2160@20fps 的分辨率。 借助在线视频编码支持，您可以轻松共享和流式传输您的内容。
- 为了提供可靠的实时操作系统支持，TinyVision 利用基于 RT-Thread + RTOS-HAL 的 RISC-V E907 RTOS 的强大功能，确保最佳性能和稳定性。
- 无论您喜欢 Linux 环境还是实时控制，TinyVision 都能满足您的需求。 它支持 OpenWrt 23.05、Buildroot 和 Mainline Linux 6.7 等 GNU/Linux 版本，满足不同的软件需求。 
- 对于实时控制爱好者来说，基于 RT-Thread + RTOS-HAL 的 RISC-V E907 RTOS 支持可提供快速可靠的性能。
- TinyVision 是一款紧凑而强大的解决方案，适用于您的 Linux 主板、IPC、服务器、路由器等，释放无限可能。 体验无与伦比的性能、增强的功能和无缝集成。 选择 TinyVision 并改变您的创新方式。


![TinyVision_Pinout](https://photos.100ask.net/dongshanpi/TinyVision/TinyVision-Pinout.jpg)

## V851芯片介绍
### 功能特性

- Based on Allwinner V851se / V851s3
- Cortex-A7 Core up to 1200MHz
- RISC-V E907GC@600MHz
- 0.5Tops@int8 NPU
- Built in 64M DDR2 (V851se) / 128M DDR3L (V851s3) memory
- One TF Card Slot, Support UHS-SDR104
- On board SD NAND
- On board USB&UART Combo
- Supports one 2-lane MIPI CSI inputs
- Supports 1 individual ISP, with maximum resolution of 2560 x 1440
- H.264/H.265 decoding at 4096x4096
- H.264/H.265 encoder supports 3840x2160@20fps
- Online Video encode
- RISC-V E907 RTOS Support, Based on RT-Thread + RTOS-HAL

### 芯片框图
![TinyVision_Pinout](https://photos.100ask.net/dongshanpi/TinyVision/image-20231118143708175.png)

### 不同型号芯片的区别

| 芯片型号 | 内存       | 内置网络PHY | 显示接口                                        |
| -------- | ---------- | ----------- | ----------------------------------------------- |
| V851s    | 64M DDR2   | 无          | 2-lane MIPI + RGB + MIPI DBI TypeC, 1280x720@60 |
| V851se   | 64M DDR2   | 10/100M     | MIPI DBI TypeC, 320x240@30                      |
| V851s3   | 128M DDR3L | 无          | 2-lane MIPI + RGB + MIPI DBI TypeC, 1280x720@60 |
| V851s4   | 256M DDR3L | 无          | 2-lane MIPI + RGB + MIPI DBI TypeC, 1280x720@60 |


## 配套模块

### TypeC-SBUUart

待上架，以及下周上架


### SPI显示屏
待上架 预计下周上架

### WIFI模块

待上架，预计春节年后

### GC2053摄像头

* GC2053摄像头: https://item.taobao.com/item.htm?&id=736796459015


### 百兆RJ45头

* RJ45 百兆线（选择4P转水晶头 50CM）: https://item.taobao.com/item.htm?&id=626832235333