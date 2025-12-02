---
sidebar_position: 6
---
# 录音播放功能

本章节将讲解在 DShanPi-R1 上如何测试录音播放功能。

## 准备工作

| 项目 | 名称 | 数量 | 说明 |
| :--- | :--- | :--- | :--- |
| **硬件** | DShanPi-R1 开发板 | 1 | - |
| | Type-C 数据线 | 1 | - |
| | TTL 转串口模块 | 1 | - |
| | 电源适配器 | 1 | - |
| | 插孔式耳机 | 1 | 3.5mm 接口 |
| | 扬声器 | 1 | - |
| **软件** | MobaXterm | - | 串口终端工具 |

## 开启串口终端

:::tip 提示
执行后续操作前，请确保已连接好串口终端。如果不清楚如何连接，请先阅读 **《连接串口终端》** 章节。
:::

连接串口终端后，请连接耳机和扬声器，如下图所示：

![音频设备连接示意图](images/image-20251126105933355.png)

## 音频基础知识

:::info 音频处理流程
一个音频文件（如 `xxx.wav`）首先以数字化的音频数据存储在板卡上。
1.  **解码**：当系统使用播放器程序（例如 `aplay`）播放时，如果是 MP3/AAC 等格式，需先解码为 PCM 数据；如果是 `.wav` 则通常无需解码。
2.  **传输**：PCM 数据通过系统音频框架（ALSA/PulseAudio）传递给音频驱动，再经由 I²S/PCM 接口传输到外部音频 Codec（声卡芯片）。
3.  **转换与输出**：Codec 使用 DAC（数模转换器）将数字信号转换为模拟信号，经放大后驱动耳机或扬声器发声。
:::

## 1. 查看声卡设备

### 播放通道

执行以下指令，列出所有 ALSA 识别到的声卡与播放通道：

```bash
aplay -l
```

**输出示例：**

![aplay输出示例](images/image-20241113172318619.png)

**参数说明：**

*   **card X**: 声卡编号（从 0 开始）
*   **device Y**: 该声卡上的播放设备编号

设备节点通常表示为 `hw:<card>,<device>`（例如 `hw:0,0`），在使用 `aplay` 时可通过 `-D` 参数指定：

```bash
aplay -D plughw:0,0 output.wav
```

### 录音通道

执行以下指令，列出 ALSA 识别到的所有声卡及其录音通道：

```bash
arecord -l
```

**输出示例：**

```text
**** List of CAPTURE Hardware Devices ****
card 0: rockchiprk809, device 0: fe410000.i2s-rk817-hifi
```

同样，录音设备节点也表示为 `hw:<card>,<device>`，使用 `arecord` 时指定：

```bash
arecord -D plughw:0,0 output.wav -vvv
```

## 2. 配置声卡设备

### 列出控制器

使用 `amixer` 工具列出声卡 0 的控制器：

```bash
# "-c 0" 指定 card0
amixer controls -c 0
```

**输出示例：**

```text
numid=1,iface=CARD,name='Headphones Jack'
numid=3,iface=MIXER,name='Capture MIC Path'
numid=2,iface=MIXER,name='Playback Path'
```

**控制器说明：**

| 编号 (numid) | 名称 | 功能描述 |
| :---: | :--- | :--- |
| **1** | `Headphones Jack` | 控制耳机插孔的启用/禁用 |
| **3** | `Capture MIC Path` | 配置录音/麦克风输入路径 |
| **2** | `Playback Path` | 配置音频回放/输出路径（如耳机、扬声器） |

### 查看控制器详情

查看声卡 0 所有控制器的详细信息（类型、可选项、当前值）：

```bash
amixer contents -c 0
```

<details>
<summary>点击展开查看详细输出</summary>

```text
numid=1,iface=CARD,name='Headphones Jack'
  ; type=BOOLEAN,access=r-------,values=1
  : values=off
numid=3,iface=MIXER,name='Capture MIC Path'
  ; type=ENUMERATED,access=rw------,values=1,items=4
  ; Item #0 'MIC OFF'
  ; Item #1 'Main Mic'
  ; Item #2 'Hands Free Mic'
  ; Item #3 'BT Sco Mic'
  : values=2
numid=2,iface=MIXER,name='Playback Path'
  ; type=ENUMERATED,access=rw------,values=1,items=11
  ; Item #0 'OFF'
  ; Item #1 'RCV'
  ; Item #2 'SPK'
  ; Item #3 'HP'
  ; Item #4 'HP_NO_MIC'
  ; Item #5 'BT'
  ; Item #6 'SPK_HP'
  ; Item #7 'RING_SPK'
  ; Item #8 'RING_HP'
  ; Item #9 'RING_HP_NO_MIC'
  ; Item #10 'RING_SPK_HP'
  : values=2
```
</details>

**关键配置项解析：**

*   **Capture MIC Path (numid=3)**:
    *   当前值 `values=2` (`Hands Free Mic`)，表示使用免提麦克风。
*   **Playback Path (numid=2)**:
    *   当前值 `values=2` (`SPK`)，表示当前输出为扬声器。
    *   可选值包括 `HP` (耳机)、`SPK_HP` (扬声器+耳机) 等。

### 查询与设置控制器

**查询特定控制器 (例如 numid=2):**

```bash
amixer -c 0 cget numid=2
```

**设置控制器 (例如设置 numid=2 为耳机输出 'HP'):**

```bash
amixer -c 0 cset numid=2 'HP'
```

执行后可以看到 `values` 变为 `3` (对应 `HP`)。

## 3. 测试录音与播放

配置完成后，执行以下指令进行测试。

### 录音测试

```bash
# -f cd: CD 音质, -r 48000: 采样率 48kHz, -vvv: 显示详细信息
arecord -D "plughw:0,0" -f cd -r 48000 output.wav -vvv
```

### 播放测试

```bash
aplay -D "plughw:0,0" -f cd -r 48000 output.wav
```
