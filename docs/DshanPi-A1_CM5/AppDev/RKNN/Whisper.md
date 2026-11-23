---
title: 语音识别
sidebar_position: 9
slug: /DshanPi-A1_CM5/AppDev/Whisper
---

Whisper 的编码器提取声音特征，解码器逐步输出文字。本例使用同一版 base 20s 编码器和解码器，分别验证英文和中文录音。

## 从录音得到转写文本

先把录音转换为 16 kHz 单声道，按模型的输入时长补齐或裁剪，再计算 log-Mel 频谱。编码器提取音频特征，解码器结合已生成的 token 逐步预测文字。英语和中文使用各自的任务参数及词表。实时率等于推理用时除以录音时长，低于 1 表示处理这段录音所用时间短于录音时长。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上转换并编译

**在电脑上下载语音模型。** 先启用转换环境，再进入 Whisper 模型目录。

```bash
source ~/rknn-env/bin/activate
cd ~/Projects/rknn_model_zoo/examples/whisper/model
bash download_model.sh
```

**分别转换编码器和解码器。** 将这段命令一起复制，两个模型都生成后再继续。

```bash
cd ../python
for part in encoder decoder; do
    name="whisper_${part}_base_20s"
    python convert.py "../model/$name.onnx" rk3576 fp "../model/$name.rknn" || break
done
```

**构建板端程序。** 回到仓库根目录编译，再把转换好的模型复制到程序的 `model` 目录。

```bash
cd ~/Projects/rknn_model_zoo
LDFLAGS=-no-pie bash build-linux.sh -t rk3576 -a aarch64 -d whisper
cp examples/whisper/model/*.rknn install/rk3576_linux_aarch64/rknn_whisper_demo/model/
```

本例使用 Ubuntu 22.04 交叉编译器。若已有构建缓存且 FFTW 静态库报 `relocation` 链接错误，重新配置该示例。

**重新配置链接选项。** 变量 `b` 保存这个示例的构建目录。

```bash
b=build/build_rknn_whisper_demo_rk3576_linux_aarch64_Release
cmake -S examples/whisper/cpp -B "$b" -DCMAKE_EXE_LINKER_FLAGS=-no-pie
```

**重新编译并安装。** 继续使用同一终端中的 `b`。

```bash
cmake --build "$b" -j4 && cmake --install "$b"
```

### 在板上对照转写结果

将完整示例目录复制到板上主目录，在终端运行。

**在板上加载示例运行库。**

```bash
cd ~/rknn_whisper_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**先转写英文录音。**

```bash
./rknn_whisper_demo model/whisper_encoder_base_20s.rknn model/whisper_decoder_base_20s.rknn en model/test_en.wav
```

**再转写中文录音。** 对照下方的实测文字。

```bash
./rknn_whisper_demo model/whisper_encoder_base_20s.rknn model/whisper_decoder_base_20s.rknn zh model/test_zh.wav
```

查看 `Whisper output` 行。DshanPI A1 CM5 英文输出以 “Mr. Quilter is the apostle of the middle classes” 开头，中文输出为「对我做了介绍,我想说的是大家如果对我的研究感兴趣」。两段录音的实测实时率分别为 0.254 和 0.274。

### 用 Python 转写录音并验证实时输入

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。在板端虚拟环境中加载本文的词表、滤波器和两个 RKNN 模型。先用已知录音核对识别结果。

**安装音频处理依赖。** 在板端启用 Lite2 环境后执行。

```bash
source ~/rknn-lite/bin/activate
sudo apt install python3-scipy python3-soundfile libportaudio2
python -m pip install torch==2.5.1 onnxruntime sounddevice
```

**指定数据和模型路径。** 保持这个终端打开，后面会用到 `models` 中的两个文件名。

```bash
cd ~/rknn_whisper_demo
export WHISPER_DATA="$PWD/model"
models=(--encoder_model_path model/whisper_encoder_base_20s.rknn --decoder_model_path model/whisper_decoder_base_20s.rknn)
```

**逐个转写英文和中文录音。** 将循环整段复制，等待两段录音处理完成。

```bash
for lang in en zh; do
    python ~/cm5-examples/whisper_file.py "${models[@]}" --task "$lang" --audio_path "model/test_$lang.wav"
done
```

```text
Whisper output:  Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel.
Whisper output: 对我做了介绍,我想说的是,如果对我的研究感兴趣
```

在同一个终端运行实时示例。看到 `Listening...` 后开始输入声音，程序累积 20 秒后识别，按 `Ctrl+C` 退出。

```bash
python ~/cm5-examples/whisper_mic.py "${models[@]}" --task en
```

本次把 `test_en.wav` 送入板上的虚拟音频输入，实际回调输出如下。

```text
Whisper:  Mr. Quilter is the apostle of the middle classes, and we are glad to welcome his gospel.
```

**外接硬件**　文件识别无需外设。验证现场拾音还需接入可用的麦克风并在桌面选择对应输入设备。
