---
sidebar_position: 1
---
# Hello 快速入门

本章节将讲解如何在 DShanPi-R1 Buildroot 系统上编译并运行第一个程序：Hello World。

## 1. 交叉编译简介

在 PC (Ubuntu) 上直接编译的程序无法在 ARM 开发板上运行，因为两者的指令集架构不同。

:::info 为什么需要交叉编译？
*   **PC (Ubuntu)**: 通常使用 x86/x64 架构。
*   **开发板 (DShanPi-R1)**: 使用 ARM64 (aarch64) 架构。

因此，我们需要使用 **交叉编译工具链**，在 PC 上生成适用于 ARM 开发板的可执行文件。
:::

DShanPi-R1 Buildroot SDK 提供的交叉编译器路径通常如下（请根据实际 SDK 路径调整）：

```bash
/home/ubuntu/100ask-rk3568_linux5.1_sdk/prebuilts/gcc/linux-x86/aarch64/gcc-arm-10.3-2021.07-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-gcc
```

为方便使用，建议将编译器路径添加到环境变量，或设置别名。

## 2. 编写代码

在 Ubuntu 主机上创建一个名为 `helloworld.c` 的文件，内容如下：

```c title="helloworld.c"
#include <stdio.h>

int main()
{
    printf("RK3568, Hello World!\n");
    return 0;
}
```

## 3. 编译代码

使用交叉编译器进行编译。

**命令示例：**

```bash
# 请将路径替换为您实际的 SDK 路径
/home/ubuntu/100ask-rk3568_linux5.1_sdk/prebuilts/gcc/linux-x86/aarch64/gcc-arm-10.3-2021.07-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-gcc helloworld.c -o helloworld
```

**验证文件类型：**

编译完成后，使用 `file` 命令检查生成的文件是否为 ARM64 格式：

```bash
file helloworld
```

**输出示例：**

```text
helloworld: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-aarch64.so.1, for GNU/Linux 3.7.0, with debug_info, not stripped
```

:::tip 提示
看到 `ARM aarch64` 字样说明编译成功，该文件可以在开发板上运行。
:::

## 4. 上传与运行

### 准备工作

*   确保开发板已启动。
*   确保已通过 ADB 连接开发板（参考 **ADB 功能使用指南**）。
*   确保已连接串口终端（用于查看运行结果，参考 **连接串口终端**）。

### 上传程序

在 Ubuntu 主机上，使用 `adb push` 命令将编译好的程序上传到开发板的 `/mnt/udisk/` 目录。

```bash
adb push helloworld /mnt/udisk/
```

**输出示例：**
```text
helloworld: 1 file pushed. 3.8 MB/s (15416 bytes in 0.004s)
```

### 运行程序

在开发板的串口终端中，执行以下操作：

1.  **进入目录**：

    ```bash
    cd /mnt/udisk/
    ```

2.  **查看文件**：

    ```bash
    ls
    # 应能看到 helloworld 文件
    ```

3.  **运行程序**：

    ```bash
    ./helloworld
    ```

    **运行结果：**
    ```text
    RK3568, Hello World!
    ```

:::success 成功
如果终端打印出 `RK3568, Hello World!`，恭喜您，您已成功在 DShanPi-R1 上运行了第一个应用程序！
:::
