---
sidebar_position: 9
---

# 扩展列表

:::tip
本章列出 Armbian 构建系统所有官方扩展的简要说明和关键参数，方便快速查找和使用。
:::

Armbian 构建框架所有官方扩展的按字母顺序参考列表。
扩展位于构建仓库的 `extensions/` 目录中。

要启用一个或多个扩展：

```bash
./compile.sh BOARD=... BRANCH=... ENABLE_EXTENSIONS="ext-name,another-ext"
```

拥有专属文档页面的扩展在下方附有链接。
其余扩展通过简短描述和关键参数进行说明。

:::tip 提示
关于扩展框架的工作原理和钩子机制，请参阅 [扩展与钩子](./6_ExtensionsHooks.md)。
:::

---

## 1. allwinner-kernel-bump

提升全志（Allwinner）系列开发板的内核版本。

## 2. amlogic-fip-blobs

获取 Amlogic FIP（固件镜像包）二进制文件，用于在 Amlogic 片上系统上组装引导加载程序。

## 3. apa

默认在目标镜像中启用 Armbian 软件包归档（APA）。

## 4. arm64-compat-vdso

使用 `CONFIG_COMPAT`、`CONFIG_COMPAT_VDSO` 和 `CONFIG_ARM64_32BIT_EL0` 构建 arm64 内核，使运行此内核的主机能够全速原生执行 armhf（32 位 ARM）用户空间程序。一个具体的好处是可以加快 Armbian 构建速度：在此类主机上，armhf rootfs / chroot / 软件包安装后步骤可以原生运行，而无需通过 `qemu-user-static`（约快 10 倍）。构建框架会自动检测此能力——请参阅 `PREFER_NATIVE_ARMHF`。

GCC 构建需要 32 位 ARM 交叉编译器（`gcc-arm-linux-gnueabi` 或自定义的 `CROSS_COMPILE_COMPAT`）。Clang 构建使用内置的 LLVM 后端。

限制：在 EL0 级别不支持 32 位 ARM 用户空间的 aarch64 芯片（尤其是 Apple M 系列），即使启用此内核选项也无法运行 armhf。

## 5. armbian-config

从 Armbian GitHub 仓库将 `armbian-config` 安装到镜像中。

## 6. armbian-live-patch

将 Armbian Live Patch systemd 服务安装到 BSP 软件包中。

## 7. bcmdhd

将 Broadcom BCM WiFi（`bcmdhd`）驱动程序构建为 DKMS 内核模块。需要可用的内核头文件。

## 8. bcmdhd-spacemit

为 SpacemiT 平台构建 Broadcom BCM WiFi 驱动程序，作为 DKMS 内核模块。

## 9. bluetooth-hciattach

为需要串口连接的开发板通过 `hciattach` 设置蓝牙。

## 10. brostrend-aic8800-dkms

为 BroStrend USB 适配器安装 AIC8800 WiFi/BT DKMS 驱动程序。从 `Shadowrom2020/aic8800-dkms` GitHub 仓库获取最新的 `aic8800-dkms` 版本，并在 chroot 中构建内核模块。强制启用 `INSTALL_HEADERS=yes`——需要带有可用头文件软件包的内核。

## 11. c-plus-plus-compiler

向主机构建依赖项添加 C++ 编译器。C++ 编译器不再默认包含；当构建需要时启用此扩展。

## 12. ccache-remote

启用带有远程存储后端（Redis 或 HTTP/WebDAV）的 ccache，用于在多台构建主机之间共享编译缓存。需要 ccache 4.4 及以上版本。

参见：[ccache-remote 扩展](./11_CcacheRemoteExtension.md)

## 13. cleanup-space-final-image

在最终镜像中运行 `zerofree` 并清理 APT 缓存，以减少磁盘占用。

## 14. cloud-init

在目标镜像中安装并配置 cloud-init。

## 15. detect-unused-extensions

开发者/测试扩展：一个钩子蜜罐，用于验证扩展框架是否正常工作。

## 16. fake-vcgencmd

为非树莓派开发板安装一个虚假的 `vcgencmd` 存根，以兼容树莓派软件。

## 17. fs-btrfs-support

添加 Btrfs 文件系统支持：主机构建工具和镜像软件包。当 `ROOTFS_TYPE=btrfs` 时自动启用。

## 18. fs-cryptroot-support

添加 LUKS/cryptroot 支持。当 `CRYPTROOT_ENABLE=yes` 时自动启用。

## 19. fs-f2fs-support

添加 F2FS 文件系统支持。当 `ROOTFS_TYPE=f2fs` 时自动启用。

## 20. fs-nilfs2-support

添加 NILFS2 文件系统支持。当 `ROOTFS_TYPE=nilfs2` 时自动启用。

## 21. fs-xfs-support

添加 XFS 文件系统支持。当 `ROOTFS_TYPE=xfs` 时自动启用。

## 22. gateway-dk-ask

面向 Mono Gateway 开发套件（LS1046A）的 NXP ASK（应用解决方案套件）集成。在内核树中构建 ASK 内核模块（CDX、FCI、auto-bridge、sfp-led、lp5812），并将用户空间工具（`fmlib`、`fmc`、`libfci`、`libcli`、`dpa-app`、`cmm`）以及打过补丁的系统库和配置打包到单个 `.deb` 文件中。运行时需要 iptables。

## 23. gen-sample-extension-docs

生成扩展钩子文档和示例扩展文件。对扩展开发者很有用。

## 24. grub

为支持 UEFI 的开发板设置标准 GRUB 引导加载程序。支持 `DISTRO_GENERIC_KERNEL` 模式（使用发行版内核而非 Armbian 内核）。设置 `GRUB_GFXPAYLOAD_LINUX=text` 以保持帧缓冲控制台绑定到 `fbcon`（防止在 CLI 安装中 Plymouth 退出后本地控制台黑屏），传递 `splash plymouth.ignore-serial-consoles` 以便在 Plymouth 在帧缓冲上绘制启动画面时，内核启动消息仍然可见。特意省略了 `quiet` 和 `loglevel=3`，并禁用了 Ubuntu 的 `vt.handoff=7` 注入。

## 25. grub-riscv64

为 RISC-V 64 位开发板设置 GRUB 引导加载程序。遵循 `grub` 扩展的控制台/启动画面命令行约定。

## 26. grub-with-dtb

支持设备树二进制（DTB）嵌入的 GRUB。

## 27. gxlimg

构建用于创建 Amlogic 可引导镜像的 `gxlimg` 工具。

## 28. image-output-abl

使用 `mkbootimg` 将输出镜像转换为 ABL（Android 引导加载程序）格式。

## 29. image-output-arduino

将 Armbian 镜像转换为 QDL 可刷写的归档文件，适用于 Arduino UNO Q（Qualcomm QRB2210）。在镜像创建过程中获取 Qualcomm 刷写二进制文件。

## 30. image-output-oowow

创建与 Khadas 开发板的 OOWOW 恢复系统兼容的镜像。

## 31. image-output-ovf

生成 OVF（开放虚拟化格式）归档文件，用于 VMware 和其他虚拟机监控程序。依赖于 `image-output-qcow2`。

## 32. image-output-qcow2

生成适用于 QEMU/KVM 虚拟化的 qcow2 镜像。

## 33. image-output-utm

生成兼容 UTM 的镜像，用于 macOS 虚拟化。依赖于 `image-output-qcow2`。

## 34. image-output-vhd-azure

生成用于 Microsoft Azure 的 VHD 镜像。

## 35. image-output-vhdx

生成 VHDX 镜像。依赖于 `image-output-qcow2`。

## 36. initramfs-usb-gadget-ums

向 initramfs 添加 USB 大容量存储（UMS）gadget 支持，使开发板能够通过 USB 暴露其存储设备。

## 37. jethub-burn

在主构建完成后自动将 Armbian `.img` 转换为 JetHub 烧录镜像。

## 38. kernel-rust

在 Linux 内核中启用 Rust 语言支持（`CONFIG_RUST`）。将 rustup 管理的工具链安装到 `${SRC}/cache/tools/rustup/` 中，并配置所有必需的 make 参数。

参见：[kernel-rust 扩展](./10_KernelRustExtension.md)

## 39. kernel-version-toolchain

将编译器名称和版本（例如 `gcc13.3`、`clang20.1`）添加到内核构件版本字符串中，确保工具链变更时缓存失效。

**变量：** 无（自动从 `KERNEL_COMPILER` 检测）。

## 40. lowmem

为低内存开发板应用 Armbian 优化（减少并行度、交换配置等）。

## 41. lsmod

基于 lsmod 输出文件应用 `localmodconfig` 以构建最小化内核。将 lsmod 文件放置在 `userpatches/lsmod/<board>.lsmod`。

**变量：** `LSMOD`（默认为 `$BOARD`）。

## 42. lvm

向镜像添加 LVM（逻辑卷管理器）支持。

## 43. marvell-tools

获取 Marvell Armada A3700 构建工具、DDR 库以及引导加载程序组装所需的二进制 blob。

## 44. mesa-vpu

安装 Mesa 3D 和 VPU/Chromium 加速软件包。在 Ubuntu 上：完整 3D + 4K VPU。在 Debian 上：仅 3D。

## 45. mtkflash

向构建添加联发科设备刷写工具支持。

## 46. net-chrony

安装 `chrony` NTP 守护进程用于网络时间同步。

## 47. net-network-manager

安装 NetworkManager 和 Netplan 用于网络接口管理。

## 48. net-systemd-networkd

安装 systemd-networkd 和 Netplan 用于网络接口管理。

## 49. net-systemd-timesyncd

安装 `systemd-timesyncd` 用于网络时间同步。

## 50. nicod-armbian-gaming

面向游戏的 Armbian 镜像配置。

## 51. nomod

在禁用所有模块的情况下构建内核（使用空 lsmod 的 `localmodconfig`）。生成的内核无法正常工作——仅用于快速内核构建/打包测试。

## 52. nvidia

通过 DKMS 构建 Nvidia 专有内核模块。在精简镜像中不可用。

## 53. odin2-preset-firstrun

应用 Odin2 游戏设备特有的预设首次运行配置。

## 54. photonicat-pm

为 Ariaboard Photonicat 路由器安装 `photonicat-pm` DKMS 电源管理驱动程序。从 `HackingGate/photonicat-pm` GitHub 仓库获取最新版本，并在 chroot 中构建内核模块。在内核 >= 6.20 时跳过。需要可用的内核头文件。

## 55. preset-firstrun

向镜像应用预设的网络和首次运行配置（写入 `.not_logged_in_yet`）。

## 56. radxa-aic8800

将 Radxa AIC8800 WiFi 驱动程序构建为 DKMS 内核模块。需要可用的内核头文件。

## 57. rkbin-tools

从配置的 Git 仓库获取 Rockchip 二进制工具（`rkbin`）。

**变量：** `RKBIN_GIT_URL`、`RKBIN_GIT_BRANCH`。

## 58. rkdevflash

向构建添加 Rockchip 设备刷写工具支持。

## 59. sunxi-tools

向全志（sunxi）构建的主机依赖项添加 32 位 ARM 交叉编译器。仅在 Docker 外部需要。

## 60. syterkit-allwinner

将 SyterKit 引导加载程序镜像写入全志输出镜像中的适当偏移位置。

## 61. ti-debpkgs

从官方 TI Debian 软件包仓库安装德州仪器软件包。

## 62. u-boot-menu

为支持的开发板配置 U-Boot 引导菜单。

## 63. uboot-binman-fix-pkg-resources

修补 U-Boot 的 `binman` 工具，使其使用 `importlib.resources` 而非 `pkg_resources`，以恢复在 `setuptools >= 82`（已移除 `pkg_resources`）的主机上的构建兼容性。涵盖 U-Boot v2024.x 至 v2025.04。

## 64. uboot-btrfs

在 U-Boot 中启用 Btrfs 文件系统支持（`CONFIG_CMD_BTRFS`）。

## 65. uefi-edk2-rk3588

为 Rockchip RK3588 开发板集成 UEFI EDK2 固件。

## 66. ufs

创建 UFS 扇区对齐的镜像。需要 Debian Trixie（13）或更高版本作为构建主机。在 Docker 中构建时设置 `DOCKER_ARMBIAN_BASE_IMAGE=debian:trixie`。

## 67. uwe5622-allwinner

为基于全志的开发板构建 UWE5622 WiFi 驱动程序。

## 68. v4l2loopback-dkms

通过 DKMS 构建 `v4l2loopback` 虚拟摄像头内核模块。在精简镜像中不可用。

## 69. vmware-vm

创建兼容 VMware 的镜像（VMDK + OVF），并安装 VMware 工具。依赖于 `image-output-ovf`。

## 70. wayland-sessions-mask

为 Wayland 支持有限或不稳定的开发板屏蔽 Wayland 桌面会话条目。

## 71. watchdog

安装 `watchdog` 守护进程，并在内核中启用 `CONFIG_WATCHDOG` / 硬件看门狗设备支持。

## 72. xorg-lima-serverflags

为 Lima 开源 GPU 驱动程序配置 X.Org 服务器标志。

## 73. yt6801

将 Motorcomm YT6801 以太网控制器驱动程序构建为 DKMS 内核模块。需要可用的内核头文件。

## 74. zfs

通过 DKMS 构建 ZFS 内核模块和用户空间工具。需要可用的内核头文件。
