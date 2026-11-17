---
title: 选择系统与下载镜像
sidebar_label: 选择系统与下载镜像
sidebar_position: 2
slug: /DshanPi-A1_CM5/QuickStart/Resources
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/01-Resources.md
---

# 选择系统与下载镜像

## 1. 选择 Armbian 镜像

DshanPI A1 CM5 的 Armbian Ubuntu 24.04（2026.10.10-1）提供两个版本。下载时确认文件名包含 `Dshanpi-a1-cm5`。

| 使用场景 | 选择版本 | 文件名结尾 |
| --- | --- | --- |
| 连接显示器、键盘和鼠标，使用图形桌面 | GNOME 桌面版 | `6.1.115_gnome_desktop.img.xz` |
| 通过终端或 SSH 操作 | CLI 命令行版 | `6.1.115.img.xz` |

## 2. 下载镜像

- 从 **GitHub** 下载桌面版或 CLI 版时，在发布页的 **Assets** 中下载对应的 `.img.xz` 文件。[CM5 镜像发布页](https://github.com/dshanpi/ArmBianOS/releases/tag/dshanpi-a1-cm5-2026.10.10-1)
- 从 **百度网盘** 下载桌面版时，打开 `03_系统固件 → 01_Armbian发行版系统(基于Ubuntu24.04)`，下载以 `_gnome_desktop.img.xz` 结尾的文件。[网盘地址与提取码](Downloads.md#baidu-download)

## 3. 校验并解压

在 Windows 下载目录打开 PowerShell，执行以下命令。按提示粘贴已下载的 `.img.xz` 完整文件名。

```powershell
$ImageFile = Read-Host '输入镜像压缩包文件名'
(Get-FileHash -Algorithm SHA256 -LiteralPath $ImageFile).Hash
```

将输出与所选版本的 SHA-256 对照，字母大小写不影响校验。

| 版本 | 镜像压缩包的 SHA-256 |
| --- | --- |
| GNOME 桌面版 | `aa56598f3d74f17bac0a10ade39eddb59e178b4d291a4b1b45b9a5a7e7898afb` |
| CLI 命令行版 | `c63e5876219239a4e7b16ed3bcaebf24286678abbe38c3b2c6148e648832c066` |

校验一致后，使用 7-Zip 等支持 xz 的工具解压，得到刷机所需的 **`.img`** 文件。若校验不一致，请重新下载并校验。[向 eMMC 烧录系统](02-FlashEMMC.md)
