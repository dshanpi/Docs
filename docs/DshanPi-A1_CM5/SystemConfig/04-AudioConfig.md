---
title: 音频功能测试
sidebar_position: 4
slug: /DshanPi-A1_CM5/SystemConfig/AudioConfig
description: 选择实际连接的声音设备，分别验证播放与录音。
---

准备带扬声器的 HDMI 显示器，或接入 USB 声卡、USB 耳麦。录音需要麦克风输入。以下操作适用于 DshanPI A1 CM5 Armbian。

## 测试声音输出

1. 在 GNOME 打开 **设置 → 声音 → 输出**，选择实际接有扬声器或耳机的设备，将音量调低并取消静音。

   图中以 ES8388 为例。使用 HDMI 或 USB 声卡时，在同一栏选择实际连接的设备。

   <img src={require('./figures/gnome-sound-devices.png').default} width="550" alt="声音设置中 Output Device 和 Input Device 的位置" />

2. 点击 **测试**，分别播放左、右声道。能从对应一侧听到声音，即可确认输出设备和声道。
3. 在 DshanPI A1 CM5 桌面按 **Super**，搜索 `terminal` 并打开终端。依次查看声卡、列出播放设备，再用默认设备播放一轮测试音。CLI 版登录后可直接输入。

   **找到播放设备。** 第一条显示声卡名称，第二条列出可用的播放设备。

   ```bash
   cat /proc/asound/cards
   aplay -l
   ```

   **播放测试音。** 听左右声道是否依次发声。

   ```bash
   speaker-test -c 2 -t wav -l 1
   ```

已有 WAV 文件时，可用 `aplay "文件名.wav"` 播放；也可用[浏览器](./05-Browser.md)播放一段熟悉的音频，检查日常应用是否从同一设备出声。

若提示找不到命令，先运行 `sudo apt update` 和 `sudo apt install alsa-utils`。若默认输出无声，可给 `speaker-test` 加上 `-D plughw:CARD,DEV`，将 `CARD` 和 `DEV` 分别换成 `aplay -l` 中目标设备的卡号和设备号。

## 录音并回放

在 GNOME 的 **设置 → 声音 → 输入** 中选择麦克风，对着麦克风说话，观察输入电平是否变化。在板端终端录制 5 秒并回放：

**确认录音设备。** 查看列表中是否有要使用的输入设备。

```bash
arecord -l
```

**录制五秒。** 对着麦克风说话，等待命令返回。

```bash
arecord -d 5 -B 200000 -f S16_LE -r 48000 -c 1 ~/cm5-mic-test.wav
```

**回放录音。** 检查是否能听到刚才说的话。

```bash
aplay ~/cm5-mic-test.wav
```

这里将录音缓冲设为 200 毫秒。本次 DshanPI A1 CM5 实测录得 5 秒单声道 WAV，文件大小为 480044 字节。听到刚才的说话声，可确认实际麦克风和扬声器通路。

若默认输入没有声音，在 `arecord -l` 中找到目标设备。本机的板载音频为 `rockchipes8388`，设备号为 `0`，可以在录音命令中加上 `-D plughw:CARD=rockchipes8388,DEV=0` 选择它。

要在录音时观察输入电平，可在上述 `arecord` 命令中加入 `-V mono`。对着麦克风说话时，终端电平条应随声音变化；再用 `aplay` 回放，确认录进的是自己的声音。切换到 USB 耳麦时，在**声音 → 输入**中重新选择设备并重复测试。
