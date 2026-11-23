---
title: RKLLM 环境搭建
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/RKLLM
---

首次部署可直接使用已为 RK3576 转换的 `.rkllm` 文件。需要自己量化权重时，在 x86_64 Ubuntu 主机运行 RKLLM-Toolkit，再将导出文件复制到 DshanPI A1 CM5。板端的 RKLLM Runtime 负责加载模型、接收问题并逐步返回文字。

## 理解模型文件、运行库和驱动的分工

在主机上，RKLLM-Toolkit 读取原始模型，按目标芯片和量化参数导出 `.rkllm`。板端程序使用 `rkllm.h` 中的接口，运行时由 `librkllmrt.so` 加载权重、维护上下文，并通过内核驱动访问 NPU。模型文件、运行库版本和应用编译时使用的头文件都要对应。

<img src={require('../figures/rkllm-toolchain.jpg').default} width="690" alt="电脑端转换语言模型与板端运行库、NPU 驱动的关系" />

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 选择与模型匹配的版本

| 本教程的模型 | 板端程序与运行库 | 实测模型格式 |
| --- | --- | --- |
| DeepSeek-R1-Distill-Qwen-1.5B | RKLLM Runtime 1.2.2，使用同版头文件编译 | W8A8 |
| DeepSeek-R1-Distill-Qwen-7B | RKLLM Runtime 1.2.1，使用同版头文件编译 | W4A16 |
| Qwen3-0.6B、1.7B、4B 与 Qwen2.5-VL-3B | `release-v1.2.1` 的 Qwen 示例与配套库 | W4A16，视觉编码器另用 `.rknn` |

在本板上，1.2.1 运行库拒绝加载由 1.2.2 导出的 DeepSeek 权重。应用的头文件与动态库应取自同一版本。将各例程的库保存在各自目录中即可并存。

### 准备主机与板端

在 Ubuntu 电脑安装 `cmake`、`gcc-aarch64-linux-gnu` 和 `g++-aarch64-linux-gnu`，用于交叉编译 Qwen。若要自行转换模型，按相应发行版说明安装 `rkllm-toolkit` 的 x86_64 wheel，选择与当前 Python 相符的版本。 [Rockchip RKLLM 发行版](https://github.com/airockchip/rknn-llm/releases)

在 DshanPI A1 CM5 桌面终端检查架构与可用内存。

```bash
uname -m
free -h
```

本次使用 `aarch64`、约 7.7 GiB 内存的 DshanPI A1 CM5。接下来选择 [DeepSeek 文本问答](./DeepSeek.md) 或 [Qwen 图文问答](./Qwen.md)。成功加载时，日志会给出 runtime、驱动、模型版本和 `target_platform: RK3576`。

### 核对板端 NPU 驱动

在 DshanPI A1 CM5 终端读取驱动版本，再运行后两篇中的任一板端文本示例，可以分别检查驱动和模型加载。

```bash
sudo cat /sys/kernel/debug/rknpu/version
```

```text
RKNPU driver: v0.9.8
```

本次 RK3576 加载模型后打印 `rkllm init success` 并开始生成文字。
