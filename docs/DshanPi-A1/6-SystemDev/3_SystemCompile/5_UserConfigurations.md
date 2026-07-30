---
sidebar_position: 5
---

# 用户配置

:::tip
本章介绍如何通过 userpatches 目录和配置文件来自定义 Armbian 构建过程，满足个性化的构建需求。
:::

Armbian 构建系统支持通过 `userpatches` 目录进行深度定制，包括补丁、内核配置、源码覆盖和镜像定制等。所有用户自定义内容都放置在 `userpatches/` 目录下，不会影响核心构建代码，方便升级和维护。

## 1. 用户提供的补丁

你可以在构建脚本之外添加自己的补丁。将补丁文件放置在相应的目录中，分别用于内核或 u-boot。除了所有补丁文件必须以 `.patch` 为扩展名之外，没有其他限制。

用户补丁目录的结构与 `patch` 目录的结构完全对应。在打补丁过程开始时，请注意查看提示信息以确定正确的补丁目录。例如：

```text
[ o.k. ] Started patching process for [ kernel sunxi-edge 4.4.0-rc6 ]
[ o.k. ] Looking for user patches in [ userpatches/kernel/sunxi-edge ]
```

`userpatches` 目录树中与 `patch` 中同名的补丁文件会替换原有的补丁。

- **替换**补丁：将补丁从 `patch` 目录复制到 `userpatches` 中对应的目录，然后根据需要进行修改。
- **禁用**补丁：在 `userpatches` 中对应的目录下创建一个同名的空文件即可。

## 2. 用户提供的配置

如果存在 `userpatches/lib.config` 文件，构建过程会调用它，可以用来覆盖特定的内核和 u-boot 版本，还可以通过向 `PACKAGE_LIST_ADDITIONAL` 追加内容来添加需要安装的额外软件包。

有关可用变量的完整列表，请查阅 `lib/configuration.sh`。以下是一些你可以修改的示例：

```bash
# 额外的软件包
PACKAGE_LIST_ADDITIONAL="$PACKAGE_LIST_ADDITIONAL python-serial python"

# 有条件地更改 u-boot 的 git 分支/标签
[[ $LINUXFAMILY == sunxi64 && $BRANCH == edge ]] && BOOTBRANCH='tag:v2017.09'

# 始终更改为该内核标签
KERNELBRANCH="tag:v5.4.28"
```

## 3. 用户提供的内核配置

如果存在 `userpatches/linux-$LINUXFAMILY-$BRANCH.config` 文件，将使用该文件替代 `config` 目录中的默认内核配置。

在内核编译过程开始时，请注意查看提示信息以确定正确的配置文件名。例如：

```text
[ o.k. ] Compiling current kernel [ 5.10.47 ]
[ o.k. ] Using kernel config provided by user [ userpatches/linux-rockchip64-current.config ]
```

## 4. 用户提供的源码配置覆盖

如果存在 `userpatches/sources/$LINUXFAMILY.conf` 文件，它将在 `config/sources` 中的默认配置之外额外加载使用。

在编译过程开始时，请注意查看提示信息以确定正确的配置文件名。

:::info
某些 `LINUXFAMILY` 名称存在例外情况，例如 `sunxi`（32 位主线 sunxi）和 `sunxi64`（64 位主线 sunxi）。
:::

示例：

```text
[ o.k. ] Adding user provided sunxi64 overrides
```

## 5. 用户提供的镜像定制脚本

你可以运行额外的命令来定制生成的镜像。编辑以下文件：

```bash
userpatches/customize-image.sh
```

并将你的代码放在其中。你可以根据文件中注明的变量值进行判断，为不同的配置使用不同的命令。这些命令将在 chroot 环境中执行，执行时机就在镜像封装完成之前。

要方便地向镜像中添加文件，只需将文件放入 `userpatches/overlay` 目录，然后在 `customize-image.sh` 中通过 `/tmp/overlay` 路径访问它们即可。

:::tip 提示
即使你是在 amd64 机器上编译镜像，你在 `customize-image.sh` 中配置的任何额外 apt 软件包或运行的命令，都会自动针对目标单板机（SBC）的架构进行安装、执行或虚拟化处理。
:::

## 6. SD 卡分区

如果你在构建时定义了 `$FIXED_IMAGE_SIZE`，包含 rootfs 的分区将被设置为该大小。

未定义此变量时的默认行为是：在构建时将分区缩小到最小尺寸，然后在首次启动时将其扩展到存储卡的最大容量。当存储卡容量为 4GB 或更小时，会留出约 5% 的未分区空余空间，以帮助老旧/慢速存储卡的控制器进行磨损均衡和垃圾回收。

你可以在 `customize-image.sh` 中通过以下方式控制分区扩展行为：

- 阻止分区自动扩展：
  ```bash
  touch /root/.no_rootfs_resize
  ```
- 配置扩展操作（通过 `/root/.rootfs_resize` 文件），可以使用百分比或扇区数：
  - `50%` — 仅使用存储卡一半的大小（前提是镜像大小不超过该值）
  - `3887103s` — 将第 3887103 个扇区作为分区结束位置

:::info
既不带 `%` 也不带 `s` 的值将被忽略。
:::
