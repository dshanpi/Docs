---
title: DeepSeek-R1 文本问答
sidebar_position: 2
slug: /DshanPi-A1_CM5/AppDev/DeepSeek
---

以 **DeepSeek-R1-Distill-Qwen-1.5B W8A8** 为例，使用 RK3576 的预转换权重。将 `DeepSeek-R1-Distill-Qwen-1.5B_W8A8_RK3576.rkllm` 放在板上的 `~/deepseek` 目录。 [配套模型下载（提取码 rkll）](https://pan.baidu.com/s/14BtJdoOSUiOsdeL_tqtVDg?pwd=rkll)

## 从原始权重准备 RK3576 模型

`1.5B` 和 `7B` 表示参数规模，`W8A8` 和 `W4A16` 分别表示权重与激活的位宽。模型大小、上下文长度以及运行时缓冲区都会影响板端内存占用。已有与运行库匹配的 `.rkllm` 文件，可直接进入后面的 DshanPI A1 CM5 实验。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在 DshanPI A1 CM5 上编译推理程序 {#在-cm5-上编译推理程序}

下面使用 1.2.1 示例源码和与该模型匹配的 **1.2.2** 头文件、运行库。在开发板的同一个终端依次操作。

**在板上准备目录和工具。** `g++` 用来编译程序，`curl` 用来下载文件。

```bash
mkdir -p ~/deepseek && cd ~/deepseek
sudo apt install g++ curl
```

**下载 1.5B 示例源码。** 两条命令在同一个终端运行，下载后当前目录会有 `llm_demo.cpp`。

```bash
base=https://raw.githubusercontent.com/airockchip/rknn-llm
curl -fLO "$base/release-v1.2.1/examples/DeepSeek-R1-Distill-Qwen-1.5B_Demo/deploy/src/llm_demo.cpp"
```

**下载匹配的头文件和运行库。** 这个模型使用 1.2.2 版本。

```bash
api="$base/release-v1.2.2/rkllm-runtime/Linux/librkllm_api"
curl -fLO "$api/include/rkllm.h"
curl -fLO "$api/aarch64/librkllmrt.so"
```

**编译并核对模型。** 生成 `llm_demo` 后，用 `ls` 确认当前目录有已下载的 `.rkllm` 文件。

```bash
g++ -O2 llm_demo.cpp -I. -L. -Wl,-rpath,'$ORIGIN' -lrkllmrt -o llm_demo
ls -lh *.rkllm
```

### 输入问题并查看回答

```bash
./llm_demo DeepSeek-R1-Distill-Qwen-1.5B_W8A8_RK3576.rkllm 64 512
```

看到 `rkllm init success` 和 `user:` 后，输入 `What is 2+2?` 并回车。本次 DshanPI A1 CM5 的回答包含 “2 plus 2 equals 4”。`64` 限制新生成的 token 数，`512` 设置上下文长度。回答被截断时可提高第一个值。输入 `exit` 退出。

自行量化时，先生成校准数据，再在导出脚本中选择 `rk3576` 并设置量化格式。

### 切换到 7B 模型

下载 `DeepSeek-R1-Distill-Qwen-7B_W4A16_RK3576.rkllm`。这份权重使用 W4A16，下面将其与 1.2.1 示例运行库单独存放。先退出其他推理程序，再把权重放到板上 `~/deepseek7`。 [7B 模型文件](https://huggingface.co/JiahaoLi/DeepSeek-R1-Distill-Qwen-RK3576/tree/main)

**准备 7B 的独立目录。** 复用刚才的示例源码。

```bash
mkdir -p ~/deepseek7 && cd ~/deepseek7
cp ~/deepseek/llm_demo.cpp .
```

**下载 7B 配套运行库。** 这里使用 1.2.1 版本的头文件和动态库。

```bash
api=https://raw.githubusercontent.com/airockchip/rknn-llm/release-v1.2.1/rkllm-runtime/Linux/librkllm_api
curl -fLO "$api/include/rkllm.h"
curl -fLO "$api/aarch64/librkllmrt.so"
```

**编译程序。**

```bash
g++ -O2 llm_demo.cpp -I. -L. -Wl,-rpath,'$ORIGIN' -lrkllmrt -o llm_demo
```

**启动 7B 模型。** 加载完成后，在 `user:` 提示处输入问题。

```bash
./llm_demo DeepSeek-R1-Distill-Qwen-7B_W4A16_RK3576.rkllm 96 512
```

在本次 8 GB DshanPI A1 CM5 上，日志依次显示 `model_dtype: W4A16`、`npu_core_num: 2` 和 `rkllm init success`。在 `user:` 后输入问题，`robot:` 后可看到逐步生成的回答。

### 对照 1.5B 与 7B 的板端回答

完成上文编译后，在各自的目录运行以下命令。两个程序均发送同一个问题，并在生成结束后退出。

**先询问 1.5B 模型。** 命令会发送问题，再发送 `exit` 退出。

```bash
cd ~/deepseek
printf '%s\n' 'What is 2+2? Answer with just the number.' exit | ./llm_demo DeepSeek-R1-Distill-Qwen-1.5B_W8A8_RK3576.rkllm 128 512
```

**换用 7B 模型。** 用相同的问题比较两份输出。

```bash
cd ~/deepseek7
printf '%s\n' 'What is 2+2? Answer with just the number.' exit | ./llm_demo DeepSeek-R1-Distill-Qwen-7B_W4A16_RK3576.rkllm 128 512
```

两种模型均打印 `rkllm init success`。本次 1.5B 的回答包含下行；7B 已开始生成推理文本，在 128 个新 token 内尚未给出最终答案。

```text
2 + 2 = 4
```

在 `~/deepseek7` 中把生成上限增至 384 个 token、上下文增至 1024，重新提问。

```bash
printf '%s\n' '2+2=? Reply with only the number.' exit | ./llm_demo DeepSeek-R1-Distill-Qwen-7B_W4A16_RK3576.rkllm 384 1024
```

这次 7B 输出中出现了以下完整句子。

```text
So, adding 2 plus 2 gives me a total of 4.
```
