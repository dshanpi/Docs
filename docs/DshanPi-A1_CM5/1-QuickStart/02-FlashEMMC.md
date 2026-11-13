---
title: 向 eMMC 烧录系统
sidebar_label: 向 eMMC 烧录系统
sidebar_position: 2
slug: /DshanPi-A1_CM5/QuickStart/FlashEMMC
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/02-FlashEMMC.md
---

# 向 eMMC 烧录系统

目标是使用 Windows 电脑，将 CM5 专用 Armbian 原始磁盘镜像写入官方底板上 CM5 模组的 eMMC。

**本章为待实板验证的流程初稿。** 现有厂商逐步刷机页面针对 A1；CM5 的下载口位置、MASKROM 按键操作、供电规格与配套 Loader 尚需按实际底板确认。补齐这些信息后才能将本章作为直接照做的刷机教程。

## 刷机前准备

准备 CM5 核心板与官方底板、符合该底板规格的电源、能够传输数据的 USB 线、Windows 电脑，以及上一章校验过的镜像。首次启动还需显示器与有线键鼠，或者已确认接线和电平的调试串口。

刷写整盘会覆盖目标 eMMC 的分区和数据。先导出需要保留的文件、配置及应用数据；断电后取下 TF 卡和无关 USB 存储，以便烧录后确认系统确实从 eMMC 启动。核心板与底板的装配、拆卸均在断电状态下进行。

不要凭 Type-C 外形判断功能。电源输入、USB OTG 下载、DP 输出需要在 CM5 底板实物图中分别标注。电源规格以 CM5 底板标识或对应原理图为准。

## 分清两种 img

| 文件类别 | 示例 | RKDevTool 中的操作路线 |
| --- | --- | --- |
| Armbian 原始磁盘镜像 | 从 CM5 `.img.xz` 解压的 `.img` | 下载镜像，使用匹配 Loader，向 eMMC 起始地址写入整盘镜像 |
| Rockchip 打包固件 | Buildroot SDK 生成的 `update.img` | 升级固件，读取固件内部的分区与镜像信息 |

两者的扩展名都可能是 `.img`，选择工具页面时必须看镜像来源和格式。不能仅凭文件名把 Armbian 镜像放入“升级固件”，也不能把打包 `update.img` 当作普通整盘镜像写到地址零。

## 安装驱动并识别设备

在 Windows 电脑上解压驱动包，以管理员身份运行 `DriverInstall.exe` 并安装驱动。解压 RKDevTool，运行 `RKDevTool.exe`。

待补齐 CM5 实物图后，连接顺序应明确说明：使用哪个下载接口、按住哪个按键、何时上电以及何时松开。现有 A1 文档的参考顺序是“连接 OTG 数据线 → 按住 MASKROM → 接入电源 → 松开按键”，CM5 需实板复核，不直接沿用 A1 按键位置照片。

通过条件是 RKDevTool 底部显示发现 MASKROM 设备，并且 Windows 设备管理器中 Rockusb 设备无驱动异常。界面无设备时，先处理数据线、接口、供电和驱动，不能继续写入。

## Armbian 原始镜像的配置

以下为完成 CM5 配套验证后使用的配置表。参考依据是厂商 A1 的 [eMMC 刷写页面](https://github.com/dshanpi/Docs/blob/master/docs/DshanPi-A1/6-SystemDev/5_Flash2eMMC.md)，表中的 CM5 Loader 必须由本板验证结果补齐。

| 设置项 | 应填写的内容 | 核对方式 |
| --- | --- | --- |
| 工具页面 | 下载镜像 | 与“升级固件”区分 |
| Loader | 经验证的 CM5 USB 下载 Loader | 固定文件名、来源与 SHA-256 |
| System | 已校验并解压的 CM5 Armbian `.img` | 文件名含 `Dshanpi-a1-cm5` |
| 存储类型 | `EMMC` | 与实际安装目标一致 |
| 原始镜像写入地址 | `0x00000000` | 对应整盘镜像起点 |
| 写入选项 | 厂商参考流程使用“强制按地址写” | 以 CM5 实测截图最终确认 |

当前 CM5 Release 没有独立 Loader 资产。现有构建服务器包含 `rk3576_spl_loader_v1.09.108.bin`，但“服务器上存在”不能证明它与本版 Armbian、所有内存规格的 CM5 组合均匹配。暂不把该文件或 A1 文档中的 `v1.09.107` 写成默认推荐。

## 写入和首次启动的验收

配套信息齐全后，核对目标存储、镜像与 Loader，执行写入。等待下载和校验阶段全部结束，保存完整日志；写入过程中保持供电与数据连接稳定。

烧录完成和能够正常开机是两个验收步骤。工具报告完成后，让设备按正常启动方式重启，记录 U-Boot、内核启动和登录界面。若返回 MASKROM 或出现引导错误，保留日志，按 [常见问题排查](../3-Maintenance/02-Troubleshooting.md) 定位。

首次进入系统后执行 [首次启动与登录](03-FirstBoot.md) 中的检查，确认实际板型、发行版本和根文件系统所在介质，再保存一次正常关机后冷启动的结果。

## Buildroot 固件的独立路线

拿到针对同一 CM5 底板确认过的 Rockchip 打包固件时，在 RKDevTool 的“升级固件”页加载 `update.img`，核对工具识别的信息后执行升级。其参考流程见 [厂商 Buildroot eMMC 文档](https://wiki.dshanpi.org/docs/DshanPi-A1/OtherSystem/RockChip-SDK/05-2_Flash2eMMC/)。该来源的板型仍是 A1，CM5 固件与接线需独立验证。

本教程的 Ubuntu 首次登录、APT 和 dspi-config 章节不适用于 Buildroot。它的源码与固件位置见 [认识 Buildroot 与 SDK](../4-Development/01-BuildrootSDK.md)。
