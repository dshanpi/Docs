---
sidebar_position: 4
---

# 构建选项开关

:::tip
本章详细列出 Armbian 构建系统支持的所有参数开关（Build Switches），包括开发板选择、内核分支、用户空间配置等。
:::

以下参数用于 `./compile.sh` 命令。它们**全部**都是可选的，也可以添加到你的[构建配置文件](./2_BuildPreparation.md)中以节省时间。默认值（如有）以**粗体**标记。

## 1. 用户空间

### 1.1 BOARD（`string`）

手动设置开发板名称以跳过对话框提示。开发板名称是[不带扩展名的文件名](https://github.com/armbian/build/tree/main/config/boards)。

### 1.2 BRANCH（`string`）

手动设置内核和 U-Boot 分支以跳过对话框提示。

可选值：

- `vendor`（厂商版）
- `legacy`（遗留版）
- `current`（当前版，推荐）
- `edge`（前沿版）

:::info
并非所有设备都支持所有分支。
:::

### 1.3 RELEASE（`string`）

手动设置软件包发行版基准以跳过对话框提示。点击此处查看[当前可用的发行版](https://github.com/armbian/build/tree/main/config/distributions)。

可选值：

- `bookworm`
- `trixie`
- `sid`
- `jammy`
- `noble`

:::info
官方仅支持稳定版和/或 LTS 上游 Debian 或 Ubuntu 发行版。其他版本可能可用，也可能不可用。
:::

### 1.4 BUILD_MINIMAL（`string`）

构建适用于应用部署的纯 CLI 镜像。此选项与 `BUILD_DESKTOP="yes"` **不兼容**。

可选值：

- `yes`
- `no`（默认）

### 1.5 BSPFREEZE（`string`）

构建镜像时冻结（禁止升级）Armbian 固件包（U-Boot、内核、DTB、BSP）。

可选值：

- `yes`
- `no`（默认）

### 1.6 INSTALL_HEADERS（`string`）

预装内核头文件。

可选值：

- `yes`
- `no`（默认）

---

## 2. 网络

### 2.1 NETWORKING_STACK（`string`）

安装所需的网络协议栈。如果未定义该参数，则最小化镜像（MINIMAL=yes）使用 `systemd-networkd`，其他镜像使用 `network-manager`。时间同步也会相应变化：使用 network-manager 时安装 chrony，使用 systemd-networkd 时使用 systemd-timesyncd。两种情况下，都通过 **Netplan** 控制网络设置。

可选值：

- `network-manager`
- `systemd-networkd`
- `none`（不添加任何网络扩展）

:::tip 构建开关示例
```bash
./compile.sh NETWORKING_STACK="network-manager"
```
:::

---

## 3. 宿主机环境

### 3.1 EXPERT

在交互模式下显示开发功能和开发板，无论其支持状态如何。

可选值：

- `yes`

### 3.2 CLEAN_LEVEL（逗号分隔列表）

定义应清理的内容。在重建镜像或构建多个镜像时，更改此选项会很有用。

可选值：

- `make-atf` — 如果构建了 ATF，则执行 make clean
- `make-uboot` — 如果构建了 U-Boot，则执行 make clean
- `make-kernel` — 如果构建了内核，则执行 make clean。速度非常慢。
- `debs`、`alldebs` — 删除 `./output/debs` 中的所有软件包
- `images` — 删除 `./output/images`
- `cache` — 删除 `./output/cache`
- `sources` — 删除 `cache/sources`（所有已下载的源码）
- `oldcache` — 移除旧的缓存根文件系统，仅保留最新的 8 个文件
- `extras` — 删除 `output/debs/extra` 中当前发行版的附加软件包

### 3.3 CARD_DEVICE（`string`）

设置你的闪存介质 / SD 卡的设备路径。镜像将被烧录并校验。

可选值：

- `/dev/sdX`

### 3.4 PREFER_DOCKER（`string`）

默认启用 Docker 辅助编译。如果你偏好原生运行编译，请设置为 `no`。

可选值：

- `yes`（默认）
- `no`

### 3.5 DOCKER_ARMBIAN_BASE_IMAGE（`string`）

定义使用 Docker 容器时的构建宿主机（默认）。[此处](https://github.com/armbian/docker-armbian-build/pkgs/container/docker-armbian-build)可查看其他可用选项。

可选值：

- `ubuntu:jammy`（默认）
- `ubuntu:noble`
- `debian:bookworm`

### 3.6 CI（`string`）

如果启用（`true`），Docker 构建容器将从宿主机接收 Docker 凭据（`${HOME}/.docker/config.json`）和 `OCI_TARGET_BASE` 环境变量。

可选值：

- `true`
- `false`（默认）

### 3.7 OCI_TARGET_BASE（`string`）

选择拉取/推送 OCI 缓存镜像的目标位置。如果未设置，则使用默认值。

可选值：

- `url/to/container_registry/path`
- `${GHCR_SOURCE}/armbian/*`（默认，GHCR_SOURCE 在 `lib/functions/configuration/main-config.sh` 中定义）

### 3.8 GHCR_MIRROR_ADDRESS（`string`）

ghcr.io 的默认镜像地址由 `GHCR_MIRROR=dockerproxy` 设置，为 ghcr.dockerproxy.com。当该地址不可用时，可通过 `GHCR_MIRROR_ADDRESS` 设置替代地址。

示例：

```bash
./compile.sh GHCR_MIRROR=dockerproxy GHCR_MIRROR_ADDRESS=ghcr.libcuda.so
```

### 3.9 KERNEL_COMPILER（`string`）

用于编译内核的编译器。通常此选项由开发板配置设置，但可设置为 `clang` 以使用 LLVM 编译内核。

示例：

```bash
./compile.sh KERNEL_COMPILER=clang
```

### 3.10 OPENSSHD_REGENERATE_HOST_KEYS（`boolean`）

管理 armbian-firstrun 服务中的 OpenSSH 主机密钥重新生成。

可选值：

- `false` — 跳过 armbian-firstrun 的 OpenSSH 主机密钥删除和重新生成（例如：让 cloud-init 设置 SSH 主机密钥）
- `true`（默认）— 执行 armbian-firstrun 的 OpenSSH 主机密钥删除 + 重新生成

示例：

```bash
./compile.sh OPENSSHD_REGENERATE_HOST_KEYS=false
```

---

## 4. 文件系统

### 4.1 ROOTFS_TYPE（`string`）

使用不同的根文件系统创建镜像，而非默认的 `ext4`。对于 `F2FS`，需要将 `FIXED_IMAGE_SIZE` 设置为小于 SD 卡容量的值。

可选值：

- `ext4`（默认）
- `f2fs`
- `btrfs`
- `nilfs2`
- `xfs`
- `nfs`

### 4.2 BTRFS_COMPRESSION（`string`）

当选择 `ROOTFS_TYPE=btrfs` 时，选择 btrfs 文件系统的压缩方法和压缩级别。默认压缩方式为 `zlib`。

可选值：

- `lzo`
- `none`
- `zlib`（默认）
- `zstd`

:::info
脚本不会检查输入变量（压缩比）的合法性。类似 `zlib:1234` 这样的输入对脚本来说是合法的，但对内核来说是非法的。请注意，此选项仅影响镜像创建（减小磁盘大小），不会调整 `/etc/fstab`，因此如果希望在日常运行中也启用压缩，需要用户自行编辑 `/etc/fstab`（注意：在随机 IO 模式和重度压缩算法下可能会严重降低性能！）。
:::

### 4.3 CRYPTROOT_ENABLE（`string`）

LUKS（Linux Unified Key Setup，Linux 统一密钥设置）是块设备加密的规范。它定义了数据的磁盘格式以及口令/密钥管理策略。LUKS 通过 dm-crypt 模块使用内核设备映射子系统。

可选值：

- `yes`
- `no`

启用后，你需要提供额外信息：

```bash
CRYPTROOT_PASSPHRASE="MYSECRECTPASS"             # 必需
CRYPTROOT_SSH_UNLOCK="yes"                       # 默认：yes
CRYPTROOT_SSH_UNLOCK_PORT="2222"                 # 默认：2022
CRYPTROOT_MAPPER=armbian-root                    # 默认：armbian-root
CRYPTROOT_PARAMETERS="custom cryptsetup options" # 默认：--pbkdf pbkdf2
```

:::tip 提示与警告
- 私钥可放置在 `$USERPATCHES_PATH/dropbear_authorized_keys` 中，否则将在 `output/images/*.key` 文件中生成
- 如果你想从头开始进行加密，请参阅此[论坛帖子](https://forum.armbian.com/topic/15618-full-root-filesystem%C2%A0encryption%C2%A0on-an-armbian-system-new-replaces-2017-tutorial-on-this-topic/)
- 此功能可能并非在所有发行版上都能正常工作
- CRYPTROOT_MAPPER 名称可能会影响并行镜像构建
- CRYPTROOT_PARAMETERS 中不能包含 `=`；请用空格分隔开关选项
:::

---

## 5. 高级选项

### 5.1 INCLUDE_HOME_DIR（`string`）

在最终镜像中包含 /home 目录下创建的目录。

可选值：

- `yes`
- `no`（默认）

### 5.2 ENABLE_EXTENSIONS（逗号分隔列表）

[扩展](./6_ExtensionsHooks.md)允许在不使核心功能过载的情况下扩展 Armbian 构建系统。存储在 `extensions` 文件夹中的扩展会被调用。

:::tip 构建开关示例
```bash
./compile.sh \
build \
BOARD=uefi-x86 \
BRANCH=current \
BUILD_DESKTOP=no \
BUILD_MINIMAL=no \
KERNEL_CONFIGURE=no \
RELEASE=noble \
ENABLE_EXTENSIONS=mesa-vpu,nvidia
```
:::

### 5.3 CONSOLE_AUTOLOGIN

首次运行时自动以 root 身份登录本地控制台。如果你的安全威胁模型有要求，请禁用此功能。

可选值：

- `yes`（默认）
- `no`

### 5.4 USE_CCACHE

使用 C 编译器缓存。由于使用了 git-worktree，通常不需要此功能。在干净构建时可能会降低性能。

可选值：

- `yes`
- `no`（默认）

### 5.5 PRIVATE_CCACHE

使用 `$DEST/ccache` 作为 ccache 主目录。设置为 yes 也会同时启用 CCACHE。

可选值：

- `yes`
- `no`（默认）

### 5.6 KERNEL_BTF

默认根据构建宿主机可用内存自动检测。如果内存不足，使用 `=no` 接受不带 BTF 调试信息的构建，或使用 `=yes` 强制构建 BTF（即使内存较低）。系列代码可设置此项以选择退出 BTF。有关 BTF 的更多信息，请参阅 [https://docs.kernel.org/bpf/btf.html](https://docs.kernel.org/bpf/btf.html)

可选值：

- `yes`
- `no`

### 5.7 ARTIFACT_IGNORE_CACHE（`string`）

强制从源码构建，而非使用预构建的构件。

可选值：

- `yes`
- `no`（默认）

### 5.8 SKIP_ARMBIAN_REPO（`string`）

强制构建时不使用 Armbian 软件仓库。适用于开发新发行版或制作不需要 Armbian 仓库的自定义镜像。

可选值：

- `yes`
- `no`（默认）

---

## 6. 待确认选项

:::danger 警告
以下构建选项需要重新测试并添加到上方章节，可能已弃用。请勿在生产环境中使用！
:::

### 6.1 KERNEL_KEEP_CONFIG（`yes` | `no`）

使用先前针对相同分支、设备系列和版本编译的内核配置文件。

可选值：

- `yes` — 使用先前编译的内核配置文件
- `no` — 使用默认或用户提供的配置文件

### 6.2 BUILD_DESKTOP（`yes` | `no`）

构建带有最小化桌面环境的镜像。

可选值：

- `yes` — 构建带有最小化桌面环境的镜像
- `no` — 仅构建控制台界面的镜像

### 6.3 CREATE_PATCHES（`yes` | `no`）

:::danger 警告：此选项已弃用，可能会在未来版本中移除
请改用新的 `kernel-patch` / `uboot-patch` / `atf-patch` CLI 命令。
:::

在编译开始前提示对 U-Boot 和内核的源码进行修改。根据这些修改，将创建补丁文件并放置在 `output` 目录中。如果你希望这些补丁在正常运行时（不使用 CREATE_PATCHES）也能生效，必须将这些文件复制到相应的目录。另请参阅[用户提供的补丁](./5_UserConfigurations.md)。

可选值：

- `yes`
- `no`（默认）

### 6.4 EXT=rkdevflash

在镜像构建期间或通过 flash CLI 命令单独将 Rockchip 镜像烧录到 eMMC（[仅适用于原生 Linux，不适用于 Docker](https://github.com/armbian/build/pull/5058)）。

---

## 7. 隐藏选项

### 7.1 用于最小化构建自动化用户输入的隐藏选项

- **ARMBIAN_CACHE_ROOTFS_PATH**（`string`）：将 `cache/rootfs` 绑定挂载到指定文件夹
- **ARMBIAN_CACHE_TOOLCHAIN_PATH**（`string`）：将 `cache/toolchain` 路径绑定挂载到指定文件夹

### 7.2 面向高级用户的隐藏选项

默认值以**粗体**标记。

- **USERPATCHES_PATH**（**userpatches/**）：为 `userpatches` 文件夹设置备用路径
- **SKIP_EXTERNAL_TOOLCHAINS**（`yes` | **no**）：不下载和使用 Linaro 工具链，默认放置在 `cache/toolchain` 中（可通过 **ARMBIAN_CACHE_TOOLCHAIN_PATH** 配置）
- **PROGRESS_DISPLAY**（`none` | **plain** | `dialog`）：显示冗长过程输出的方式 —— 编译、打包、debootstrap
- **PROGRESS_LOG_TO_FILE**（`yes` | **no**）：将受上一选项影响的输出复制到日志文件 `output/debug/*.log`
- **NO_APT_CACHER**（**yes** | `no`）：禁用 APT 缓存的使用。容器中默认为 `yes`，但可被覆盖
- **DISABLE_IPV6**（**true** | `false`）：设置为 false 以允许 Aria2c 使用现代 IP 协议
- **NO_HOST_RELEASE_CHECK**（`yes` | **no**）：跳过对受支持宿主机系统的检查
- **USE_MAINLINE_GOOGLE_MIRROR**（`yes` | **no**）：使用 `googlesource.com` 镜像下载主线内核源码，根据你的位置可能比 `git.kernel.org` 更快
- **USE_GITHUB_UBOOT_MIRROR**（`yes` | **no**）：使用非官方的 GitHub 镜像下载主线 U-Boot 源码，根据你的位置可能比 `git.denx.de` 更快
- **SYNC_CLOCK**（**yes** | `no`）：在开始镜像创建过程之前同步构建器的系统时钟
- **OFFLINE_WORK**（`yes` | `no`）：跳过下载和更新源码以及时间和宿主机检查。设置为 `yes`，你可以在不访问互联网的情况下收集软件包
- **FORCE_USE_RAMDISK**（`yes` | `no`）：覆盖在新的 debootstrap 和镜像创建过程中使用 tmpfs 的自动检测
- **FIXED_IMAGE_SIZE**（`integer`）：创建此大小（以兆字节为单位）的镜像文件，而非最小化大小
- **BOOTSIZE**（`integer`，默认 **96**）：设置独立 /boot 文件系统的大小（以兆字节为单位）。当 **ROOTFS_TYPE** 设置为非 ext4 时使用
- **COMPRESS_OUTPUTIMAGE**（逗号分隔列表）：创建包含镜像文件和 GPG 签名的压缩归档以用于重新分发
  - `sha`：为镜像生成 SHA256 哈希
  - `gpg`：使用 gpg 对镜像签名
  - `xz`：仅使用 xz 格式压缩镜像
- **IMAGE_XZ_COMPRESSION_RATIO**（**1** - 9）：使用 xz 压缩器时的镜像压缩级别。请注意，级别越高内存消耗越大
- **SEVENZIP**（`yes` | **no**）：创建具有极高压缩比的 .7z 归档，而非 .zip
- **BUILD_KSRC**（**yes** | `no`）：在构建时创建内核源码包
- **INSTALL_KSRC**（`yes` | **no**）：并在镜像上预装这些内核源码
- **FORCE_BOOTSCRIPT_UPDATE**（`yes` | `no`）：在 BSP 软件包升级期间强制更新 bootscript
- **NAMESERVER**（`IPv4 address`）：构建 chroot 内部使用的 DNS 解析器。不影响最终镜像。默认值：`1.0.0.1`
- **DOWNLOAD_MIRROR**（`china` | `bfsu`）：选择 `toolchain` 和 `debian/ubuntu packages` 的下载镜像
  - `china`：使用 `mirrors.tuna.tsinghua.edu.cn`；清华大学镜像，速度很快
  - `bfsu`：使用 `mirrors.bfsu.edu.cn`，北京外国语大学镜像
  - 留空以使用官方源
- **ARMBIAN_MIRROR**（`auto`）：覆盖自动镜像选择，例如 `ARMBIAN_MIRROR="https://yourlocalmirror.com"`
- **MAINLINE_MIRROR**（`google` | `tuna` | `bfsu`）：选择 `linux-stable.git` 的主线镜像
  - `google`：使用 Google 提供的镜像，与 `USE_MAINLINE_GOOGLE_MIRROR=yes` 相同
  - `tuna`：使用清华大学提供的镜像
  - `bfsu`：使用北京外国语大学提供的镜像，与 `tuna` 类似
  - 留空以使用官方的 `git.kernel.org`，对中国大陆用户来说可能非常慢
- **UBOOT_MIRROR**（`github` | `gitee`）：选择 `u-boot.git` 的主线镜像
  - `github`：使用 GitHub 提供的镜像，与 `USE_GITHUB_UBOOT_MIRROR=yes` 相同
  - `gitee`：使用 Gitee 提供的镜像，一家中国 Git 服务提供商
  - 留空以使用官方的 `source.denx.de`，对中国大陆用户来说可能非常慢
- **GITHUB_MIRROR**（`fastgit` | `gitclone` | `cnpmjs`）：选择 GitHub 托管仓库的下载镜像
  - `fastgit`：使用 fastgit.org 提供的镜像
  - `gitclone`：使用 gitclone.com 提供的镜像
  - `cnpmjs`：使用 cnpmjs.org 提供的镜像
  - 留空以直接连接 GitHub，对中国大陆用户来说可能非常慢
- **REGIONAL_MIRROR**（`china`）：根据区域设置选择镜像，不会覆盖明确指定的镜像选项
  - `china`：MAINLINE_MIRROR=`tuna`、UBOOT_MIRROR=`gitee`、GITHUB_MIRROR=`fastgit`、DOWNLOAD_MIRROR=`china`
  - 留空以使用默认设置
- **ROOT_FS_CREATE_ONLY**（`yes` | **no**）：设置为 yes 以强制创建本地缓存
- **EXTRAWIFI**（**yes** | `no`）：包含多个 [WiFi 适配器](https://github.com/armbian/build/blob/1914066729b7d0f4ae4463bba2491e3ec37fac84/lib/compilation-prepare.sh#L179-L507)的驱动程序
