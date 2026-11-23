---
title: 认识 SDK 并编译 DshanPI A1 CM5 Buildroot 固件
sidebar_label: Buildroot SDK 与固件编译
sidebar_position: 1
slug: /DshanPi-A1_CM5/Development/BuildrootSDK
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/4-Development/01-BuildrootSDK.md
---

# 认识 SDK 并编译 DshanPI A1 CM5 Buildroot 固件

## 认识 Buildroot 与 SDK

Buildroot 用于构建 DshanPI A1 CM5 的根文件系统。完整的 Rockchip SDK 还包含板级配置、U-Boot、Linux 内核和打包工具，能把 Loader、启动镜像、根文件系统等组件打包成可烧录到 eMMC 的 `update.img`。

需要修改驱动、设备树或预装应用时，请使用已适配 DshanPI A1 CM5 的完整 SDK。公开的 [DshanPI A1 CM5 Buildroot 适配仓库](https://github.com/dshanpi/DshanPi-A1_CM5-BuildrootSDK) 提供部分适配文件。已准备好完整 SDK，可直接[开始编译](#build-firmware)。

<details>
<summary>查看 SDK 主要目录</summary>

| 目录或文件 | 作用 |
| --- | --- |
| `build.sh` | SDK 构建入口，实际指向 `device/rockchip/common/scripts/build.sh` |
| `device/rockchip` | 芯片和板级配置、构建脚本、分区参数 |
| `kernel` | 当前指向 `kernel-6.1`，包含内核与设备树 |
| `u-boot`、`rkbin` | 启动代码和 Rockchip 引导二进制 |
| `buildroot` | 根文件系统配置、包与构建输出 |
| `output/.config` | 当前 SDK 选择的构建配置 |
| `output/firmware` | 固件组件汇总，多个条目为符号链接 |
| `rockdev` | 当前指向 `output/firmware` |
| `output/sessions` | 构建过程日志 |

这份 SDK 使用 `rk3576-100ask-dshanpi-a1-linux.dts` 作为设备树入口，其中包含 DshanPI A1 CM5 底板和三摄适配文件。

</details>

<details>
<summary>了解 Armbian 相关仓库</summary>

Armbian 使用 Debian/Ubuntu 软件包与 APT 更新应用。切换到 Buildroot 时，需使用对应的系统固件，并提前备份数据。

| 资源 | 用途 |
| --- | --- |
| [ArmBianOS](https://github.com/dshanpi/ArmBianOS) | 提供 DshanPI A1 CM5 板级配置，构建 Armbian 桌面版和命令行版镜像 |
| [dshanpi-build](https://github.com/dshanpi/dshanpi-build) | 固定源码版本、构建或复用 DEB 包，生成镜像和签名 APT 软件源 |
| [dspi-config](https://github.com/dshanpi/dspi-config) | 在开发板上配置 Overlay、软件源和更新 |

</details>

## 编译 DshanPI A1 CM5 Buildroot 固件 {#build-firmware}

在 Ubuntu 24.04 x86_64 编译主机上打开终端，依次执行以下四步。

### 1. 进入 SDK 目录

```bash
cd ~/RK3576-SDK/rk3576_linux6.1_release_v1.0.0_20240620
```

### 2. 选择板级配置

这份 SDK 已适配 DshanPI A1 CM5，板级配置沿用 `dshanpi-a1` 名称。

```bash
./build.sh rockchip_rk3576_dshanpi-a1_defconfig
```

### 3. 编译固件

确认编译分区有足够的剩余空间后，运行全量编译。脚本会自动打包固件。

```bash
./build.sh
```

### 4. 获取 update.img

编译成功后，在 SDK 根目录查看生成的固件及其大小。

```bash
ls -lh output/update/Image/update.img
```

将该 `update.img` 复制到刷机电脑，在 RKDevTool 的**升级固件**页选择它。[查看 Buildroot 烧录步骤](../1-QuickStart/02-FlashEMMC.md#flash-buildroot)
