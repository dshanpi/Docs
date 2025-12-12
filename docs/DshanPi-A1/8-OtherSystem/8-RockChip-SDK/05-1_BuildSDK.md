---
sidebar_position: 1
---

# Buildroot 系统构建

:::tip 提示
本章节将讲解如何基于 DshanPi-A1 Buildroot SDK 快速构建系统镜像。
**注意：Buildroot 开发涉及较多底层知识，本章节主要面向有一定嵌入式 Linux 开发基础的用户。**
:::

## 1. 环境准备

### 1.1 获取开发环境 (虚拟机)

为了简化环境搭建过程，我们提供了配置好 Buildroot SDK 的 Ubuntu 虚拟机镜像。

*   **虚拟机系统**：Ubuntu 22.04 (预装 SDK)
*   **用户名/密码**：`ubuntu` / `ubuntu`

:::danger 重要提示
虚拟机环境已配置完善，**请勿执行 `do-release-upgrade` 或随意升级系统版本**，否则可能导致编译环境损坏。
:::

| 资源名称 | 说明 | 下载链接 | 提取码 |
| :--- | :--- | :--- | :--- |
| **SDK 虚拟机镜像** | 包含完整 Buildroot SDK | [点击下载 (百度网盘)](https://pan.baidu.com/s/15M8zuHOwl_SITl6cSk_7Vg?pwd=eaax) | `eaax` |

### 1.2 SDK 目录结构

启动虚拟机并登录后，SDK 位于 `~/100ask-rk3576_SDK/` 目录下。打开终端进入该目录：

```bash
cd ~/100ask-rk3576_SDK/
ls -F
```

核心目录结构说明：

*   `build.sh`: 核心构建脚本 (软链接)
*   `device/`: 板级配置文件
*   `kernel-6.1/`: Linux 内核源码
*   `buildroot/`: Buildroot 构建系统源码
*   `u-boot/`: U-Boot 源码
*   `output/`: 编译输出目录

## 2. 编译 SDK

编译完整系统镜像仅需两步：**选择配置** 和 **执行编译**。

### 2.1 选择板级配置

在 SDK 根目录下执行 `lunch` 命令，选择 DshanPi-A1 的配置文件：

```bash
./build.sh lunch
```

在弹出的菜单中，选择 **`rockchip_rk3576_dshanpi-a1_defconfig`** (通常输入对应数字并回车)。

<img src={require('./images/image-20250910105918600.png').default} alt="选择板级配置" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 2.2 执行全量编译

配置完成后，执行以下命令开始编译：

```bash
./build.sh
```

:::info 编译时间
首次编译耗时较长（取决于电脑性能），请耐心等待。
:::

编译成功后，终端会显示 "Build success" 相关提示。

<img src={require('./images/image-20250910140841974.png').default} alt="编译成功" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 2.3 获取镜像文件

编译产物将生成在 `output/update/Image/` 目录下：

```bash
cd ~/100ask-rk3576_SDK/output/update/Image/
ls -l
```

关键文件说明：

| 文件名 | 说明 |
| :--- | :--- |
| **`update.img`** | **统一固件**，用于直接烧录到 eMMC (推荐)。 |
| `boot.img` | 内核镜像 |
| `uboot.img` | U-Boot 镜像 |
| `rootfs.img` | 根文件系统镜像 |
| `MiniLoaderAll.bin` | 引导加载程序 (Loader) |

## 3. SDK 常用命令

`build.sh` 是 Rockchip SDK 的核心脚本，支持多种参数。执行 `./build.sh help` 可查看完整帮助。

以下是常用构建命令速查：

| 命令 | 作用 |
| :--- | :--- |
| `./build.sh` | 全量编译 (u-boot, kernel, rootfs, recovery 等) |
| `./build.sh uboot` | 单独编译 U-Boot |
| `./build.sh kernel` | 单独编译 Kernel |
| `./build.sh rootfs` | 单独编译 Rootfs (Buildroot) |
| `./build.sh updateimg` | 打包生成 `update.img` |
| `./build.sh cleanall` | 清理所有编译产物 |

<details>
<summary>点击查看完整 build.sh help 输出</summary>

```bash
Usage: build.sh [OPTIONS]
Available options:
chip[:<chip>[:<config>]]          	choose chip
defconfig[:<config>]              	choose defconfig
 *_defconfig                      	switch to specified defconfig
...
kernel[:dry-run]                 	build kernel
...
buildroot                         	build buildroot rootfs
...
all                               	build images
cleanall                          	cleanup
...
```

</details>
