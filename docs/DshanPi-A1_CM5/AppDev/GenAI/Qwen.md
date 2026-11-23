---
title: Qwen 文本与图像问答
sidebar_position: 3
slug: /DshanPi-A1_CM5/AppDev/Qwen
---

本例包含两个入口。`llm` 用 Qwen3 回答文字问题。`demo` 用 Qwen2.5-VL 的视觉编码器读取图片，再由语言模型生成描述。

## 选择文本或图文推理程序

| 任务 | 输入 | 程序如何处理 |
| --- | --- | --- |
| 文本问答 | 问题和 `.rkllm` 权重 | `llm` 将问题分词，逐个生成回答的 token |
| 图像描述 | 图片、视觉 `.rknn`、语言 `.rkllm` | `demo` 先提取图像特征，再把特征和提示词一起交给语言模型 |

`max_new_tokens` 限制本次回答长度，`max_context_len` 决定上下文容量。图文示例还需要匹配视觉编码器的输出宽度。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在 Ubuntu 电脑编译程序

在 Ubuntu 电脑上使用 `release-v1.2.1` 的示例。以下步骤在同一终端执行。

**在 Ubuntu 电脑上安装编译工具。** 启用 Git LFS，以便下载仓库中的大文件。

```bash
sudo apt install git git-lfs cmake gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
git lfs install
```

**下载示例源码。** 进入 Qwen 示例的构建目录。

```bash
git clone --depth 1 -b release-v1.2.1 https://github.com/airockchip/rknn-llm.git
cd rknn-llm/examples/Qwen2-VL_Demo/deploy
```

**修改视觉特征宽度。** 把源码中的 1536 调为这个 3B 模型需要的 2048。

```bash
sed -i 's/^#define EMBED_SIZE 1536/#define EMBED_SIZE 2048/' src/main.cpp
```

**交叉编译板端程序。** CMake 先配置构建目录，再编译并收集部署文件。

```bash
cmake -S . -B build-cm5 -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=aarch64 -DCMAKE_C_COMPILER=aarch64-linux-gnu-gcc -DCMAKE_CXX_COMPILER=aarch64-linux-gnu-g++
cmake --build build-cm5 -j4 && cmake --install build-cm5
```

复制整个 `install/demo_Linux_aarch64` 到开发板主目录。将以下三个模型文件放进同一个目录，保留 `lib` 和示例图片 `demo.jpg`。 [Qwen3 模型](https://huggingface.co/JiahaoLi/Qwen3-RK3576/tree/main) · [Qwen2.5-VL 视觉与语言模型](https://huggingface.co/JiahaoLi/Qwen2.5-VL-RK3576/tree/main)

### 在 DshanPI A1 CM5 上测试文本问答 {#在-cm5-上测试文本问答}

**在板上进入程序目录。** 设置当前终端的库路径，让程序能加载配套运行库。

```bash
cd ~/demo_Linux_aarch64
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**运行 0.6B 模型。** 看到输入提示后即可提问。

```bash
./llm Qwen3-0.6B-rk3576-w4a16.rkllm 120 512
```

在 `user:` 后输入 `What is 2+2?`。本板用 0.6B 模型输出 `2 + 2 = **4**`。输入 `exit` 释放模型，再继续下一步。

要比较模型大小，可在同一模型下载页选择 1.7B 或 4B。将相应文件复制到程序目录，每次运行一个模型，输入 `What is 2+2? /no_think`。本次 1.7B 和 4B 均返回了 4。

```bash
./llm Qwen3-1.7B-rk3576-w4a16.rkllm 64 512
# 输入 exit 退出后，再启动另一个模型
./llm Qwen3-4B-rk3576-w4a16.rkllm 64 512
```

### 让模型描述图片

```bash
./demo demo.jpg Qwen2.5_VL_3B_VISION_RK3576.rknn Qwen2.5-VL-3B-W4A16_LEVEL1_RK3576.rkllm 128 512 2
```

最后一个参数 `2` 对应 RK3576 的两个 NPU 核。看到 `input tensors` 的 `392 × 392` 和 `output tensors` 的 `196 × 2048` 后，输入 `0` 并回车。实机回答中描述了月面上的宇航员、瓶子和背景中的地球。输入 `exit` 退出。

### 在纯文本和图文入口核对回答

将上文编译的 `llm`、配套运行库和权重放在同一工作目录，再运行 Qwen2.5-VL-3B 的纯文本入口。

```bash
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
printf '%s\n' 'What is 2+2? Answer with just the number.' exit | ./llm Qwen2.5-VL-3B-W4A16_LEVEL1_RK3576.rkllm 128 512
```

```text
rkllm init success
user: robot: 4
```

在同一目录下切换到三个 Qwen3 模型，用相同提示词比较回答。

```bash
for size in 0.6 1.7 4; do
    printf '%s\n' 'What is 2+2? Answer with just the number. /no_think' exit | ./llm "Qwen3-${size}B-rk3576-w4a16.rkllm" 128 512
done
```

| 模型 | 本次回答的最后一行 |
| --- | --- |
| Qwen3-0.6B | `2`（回答错误） |
| Qwen3-1.7B | `4` |
| Qwen3-4B | `4` |

三个模型均成功生成文本。图文入口使用配套 `demo.jpg`，回答中出现了 `an astronaut on the moon`。这两种输入均无需摄像头。
