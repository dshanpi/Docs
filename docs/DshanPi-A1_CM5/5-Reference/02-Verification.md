---
title: 教程验证状态
sidebar_label: 教程验证状态
sidebar_position: 2
slug: /DshanPi-A1_CM5/Reference/Verification
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/5-Reference/02-Verification.md
---

# 教程验证状态

本页记录 DshanPI A1 CM5 官方底板上的实测结果。Armbian 测试环境为 Ubuntu 24.04 Noble、GNOME 桌面，运行内核为 `6.1.115-vendor-rk3576-dshanpi-a1-cm5`。

## 应用开发实测

2026 年 11 月 21 日完成以下板端测试。模型转换和交叉编译在 Ubuntu 22.04 主机上完成。各示例的命令和输出见[应用开发目录](/docs/DshanPi-A1_CM5/category/app-dev)

| 项目 | 实机结果 |
| --- | --- |
| GPIO、I²C、UART | 识别 5 组 SoC GPIO，在虚拟引脚读回 1、0。I²C4 上读到 ES8388 与绑定驱动 ES8323。串口应用完成伪终端收发；排针电平与串口电气回环需另接线测量。 |
| 摄像头与视频 | OV13850 的 ISP 通道采到 2112 × 1568 NV12 图像，并通过 RTSP 接收实时帧。MPP 完成 8 帧 H.264 编解码。OpenCV 完成几何检测并从 GStreamer 读取 5 帧。 |
| RKNN | ResNet-18 分类及九个应用示例均运行板端推理，包含姿态、分割、旋转框、车牌、OCR、中英文语音和 YOLOv13。结果图或输出见各篇。 |
| 生成式 AI | DeepSeek 1.5B、7B 与 Qwen3 的 0.6B、1.7B、4B 均已在板上生成文本。Qwen2.5-VL-3B 使用配套视觉模型，描述了示例图中的宇航员。 |
| Qt 5 | 使用 Qt Widgets 构建窗口，保存了 320 × 120 的界面图，并在 GNOME 会话确认窗口已打开。 |
| ROS 2 Jazzy | C++ talker 发布 `Hello World: 2`，Python listener 收到相同编号的消息。 |

## 系统配置与应用实测

| 指南 | 实板结果 |
| --- | --- |
| [网络连接](../SystemConfig/01-NetworkConnectionGuide.md) | 有线接口 `end0` 通过 DHCP 获得地址，`wlan0` 能扫描热点。本轮命令行测试仅扫描热点，首次启动向导的无线连接另有截图。 |
| [远程登录](../SystemConfig/02-RemoteConfig.md) | 核对主机指纹后，普通账号登录成功，账号与主机名均符合预期。 |
| [文件传输](../SystemConfig/03-FileTransfer.md) | 文件上传、下载和整目录上传后，内容比对一致。另已验证 SFTP 读取，图形客户端拖放待现场确认。 |
| [音频](../SystemConfig/04-AudioConfig.md) | 左右声道测试运行完成，ES8388 成功录制并回放 5 秒单声道 WAV。实际音量、声道方向和麦克风音质需现场试听。 |
| [浏览器](../SystemConfig/05-Browser.md) | GNOME Web 46.5 打开 DshanPI A1 CM5 指南，按 Ctrl + D 后，书签中已保存该页地址。 |
| [社交应用](../SystemConfig/06-Social.md) | 微信 ARM64 4.1.13.29 已打开登录窗口，未进行个人账号登录。QQ 官网的 ARM64 DEB 下载返回 HTTP 403，未验证安装及启动。 |
| [视频播放](../SystemConfig/07-VideoPlayer.md) | GStreamer 1.24.2 播完本地 H.264/AAC MP4、HTTP 视频和板上 H.264 RTSP 测试流。VP8 RTSP 流指定软件解码后也能播完。外部摄像机和显示器画质待现场确认。 |
| [中文输入](../SystemConfig/08-InputMethod.md) | 安装拼音方案后，在板上独立图形会话中打开 Fcitx 5 配置窗口，在 GTK 文本框按 Ctrl + 空格，输入 `nihao` 并选出“你好”。当前用户桌面注销重登流程待现场确认。 |

## 应用编程基础实测

2026 年 11 月 21 日，在开发板上用 GCC 13.3.0 和 GNU Make 4.3 执行了[应用编程基础](/docs/DshanPi-A1_CM5/category/app-basic)中的示例。

| 教程 | 实板结果 |
| --- | --- |
| HelloWorld、GCC | 带参数运行输出 `Hello, CM5!`，目标文件架构为 AArch64。多文件、静态库和动态库三个示例均输出 `5`。 |
| Makefile | 首次构建成功。再次执行提示目标已是最新。更新 `add.c` 的时间戳后，仅重新编译 `add.o` 并链接。 |
| 文件基础操作 | 写入后读回 `Hello from CM5`，含换行符共 15 字节。 |
| 输入系统 | C 程序打开了 USB 键盘事件设备并读出名称 `OSRBOT KVM Controller`。F6 的按下和松开需在板旁按键确认。 |
| 网络通信 | 本机回环接口上，TCP 客户端收到 `T`，UDP 客户端收到 `U`，回包端口为 35760。 |
| 多线程 | 两个线程执行完毕后输出 `count = 20000`。 |
| [I²C](../AppBasic/08-I2C.md) | 板载 ES8388 位于 I²C4 的 `0x11`，绑定 `ES8323` 驱动。该地址显示 `UU`，声卡列表显示 `rockchip-es8388`。40 针排针的 I²C0 在当前设备树中为 `disabled`，外接模块收发待验证。 |

## 刷机与启动的验证范围

| 步骤 | 已有记录 | 验证范围与待补项 |
| --- | --- | --- |
| 接线与进入下载模式 | 已按 V1.2 底板图纸核对 12V 电源口 DC1、下载口 USB1 和按键 SW5，并标注实物照片。[刷机接线](../1-QuickStart/02-FlashEMMC.md#driver-setup) | 记录测试核心板规格、适配器型号和松键时机。 |
| 核对镜像与 Loader | 已核对发行校验文件、构建记录及 Loader 文件名、大小和 SHA-256。 | 完整镜像哈希及 Loader 在目标内存规格上的下载记录。 |
| 写入 eMMC | 已列出 Armbian 与 Buildroot 各自的 RKDevTool 操作。 | 两种镜像从写入到校验完成的完整日志，以及断电后冷启动记录。 |
| 首次启动与登录 | Armbian 有创建账号、设置语言和进入桌面的实机截图。根分区为 `/dev/mmcblk0p1`，其父设备类型为 `MMC`，确认根文件系统位于 eMMC。[首次启动与登录](../1-QuickStart/03-FirstBoot.md) | 以上结果对应图示板卡和镜像。 |

## 系统构建与更新

- **Buildroot 固件。** 已在构建主机核对板级配置、设备树引用和已有 `update.img` 的输出位置。完整重新构建和新产物烧录仍待验证。[Buildroot SDK 与固件编译](../4-Development/01-BuildrootSDK.md)
- **Armbian 更新。** 已对照镜像锁定的工具源码和公开包索引核对更新入口。板上安装与回滚仍需匹配的发行包和执行记录。[系统更新与恢复](../3-Maintenance/01-UpdateRecovery.md)

更换板卡、镜像或外设后，请记录硬件版本、镜像哈希和对应测试结果。涉及输入电平、实际音质、触摸或外部设备互通时，应在对应实物上复测。
