---
title: 认识 Buildroot 与 SDK
sidebar_label: 认识 Buildroot 与 SDK
sidebar_position: 1
slug: /DshanPi-A1_CM5/Development/BuildrootSDK
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/4-Development/01-BuildrootSDK.md
---

# 认识 Buildroot 与 SDK

普通用户使用 Armbian 镜像即可开始；需要定制固件、修改驱动或制作固定功能设备时，再进入 SDK 开发。这里介绍资源之间的关系，完整编译与实板调试另设进阶教程。

## 三个仓库各负责什么

| 资源 | 本次检查到的角色 |
| --- | --- |
| [DshanPi-A1_CM5-BuildrootSDK](https://github.com/dshanpi/DshanPi-A1_CM5-BuildrootSDK) | 部分 Buildroot 和内核适配文件；当前仓库不包含完整 SDK 构建入口 |
| [ArmBianOS](https://github.com/dshanpi/ArmBianOS) | 基于 Armbian 的系统构建框架，包含 CM5 板级配置、内核/DTB/BSP 和桌面/CLI 镜像输入 |
| [dshanpi-build](https://github.com/dshanpi/dshanpi-build) | 固定源码版本，构建或复用配套 DEB，编排镜像及签名 APT 发行 |

另有 [dspi-config](https://github.com/dshanpi/dspi-config) 提供板端菜单和配置命令。普通用户运行这个工具，无需在板端执行发行服务器的构建脚本。

## 完整 SDK 的主要目录

本次核对的完整 SDK 为 `rk3576_linux6.1_release_v1.0.0_20240620`。它保存在 Ubuntu x86_64 构建主机上，目标设备则是 ARM64 CM5。

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

当前配置选择 `RK_ROOTFS_SYSTEM="buildroot"`，设备树入口仍名为 `rk3576-100ask-dshanpi-a1-linux.dts`，但本地实际包含 CM5 底板和三摄 DTSI。文件名保留 A1 不能单独证明板型不匹配，必须继续检查包含关系。

## 固件之间的关系

完整 SDK 的打包过程把 Loader、U-Boot、内核/启动镜像、rootfs 和其他分区按参数组合为 Rockchip `update.img`。`output/firmware/update.img` 是当前打包结果的链接，后续构建可以改变它的指向内容。

用于教程和发给用户的固件应使用固定文件名，记录 SHA-256、板型、适配底板及验证结果。调试目录中存在镜像或写着 validation 的日志，不自动代表可作为正式推荐版。

## 编译步骤放在哪里

本地 CM5 差分包的说明列出以下分步构建入口：

```bash
./build.sh uboot
./build.sh kernel
./build.sh buildroot
./build.sh updateimg
```

它们在完整 SDK 根目录执行，属于会产生构建输出的开发操作。完整教程还需要明确依赖、基线版本、补丁来源、配置选择、输出和刷机验收；这里只说明入口，不将未执行过的命令列为已验证构建记录。

当前构建服务器 SDK 存在本地修改与多个试验固件，不能用重新覆盖差分包或清理工作区作为入门步骤。本次调研仅读取其内容，没有应用补丁或启动构建。

## 为什么两套系统的文档要分开

Armbian 采用 Debian/Ubuntu 软件包、独立板级 BSP 和发行元包，常用配置在 `/boot` 与 APT 中。Buildroot 使用 SDK 生成的固定根文件系统和 Rockchip 打包固件；其软件安装方式、服务管理、账号和升级路径需要单独编写。

从 Armbian 换到 Buildroot 或反向切换，应按各自固件格式重新规划刷写及数据迁移。不能复制某一套系统的 DTB、rootfs 或升级命令到另一套中，假定它们已经配套。
