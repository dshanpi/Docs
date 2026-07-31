---
sidebar_position: 8
---

# 使用 Docker 构建

:::tip
本章介绍如何使用 Docker 容器进行 Armbian 构建，无需在本地安装依赖，保持系统环境干净。
:::

## 1. 官方支持并经过测试的 Docker 构建方法

该方法可用于构建 U-Boot 和内核软件包，以及构建完整的操作系统镜像。

:::danger 注意
要将新构建的镜像直接写入 SD 卡或其他块设备，你必须启用 Docker 的 `privileged`（特权）模式运行。

在 `userpatches/config-docker.conf` 文件或你自己的 Docker 配置文件中，取消注释 `DOCKER_FLAGS+=(--privileged)` 这一行。
:::

不支持构建额外的软件包（`EXTERNAL_NEW`）。

## 2. 系统要求

- 支持运行最新 Docker 守护进程的 x86/x64/aarch64/armhf Linux 主机。详情请参考 [Docker 官方文档](https://docs.docker.com/)。
- Docker 版本 17.06 CE 或更高。
- 用于 Docker 容器和命名卷的存储空间要有足够的可用磁盘空间。命名卷的路径可以使用标准 Docker 工具更改，详情请参考 Docker 文档。

安装说明：[Docker Engine 安装指南](https://docs.docker.com/engine/install/)

## 3. 详细说明

启动构建过程有 3 种方式：

**方式 1：** 通过传递存储在 `userpatches` 目录中的配置文件名（`config-<conf_name>.conf`）作为参数：

```bash
./compile.sh docker <conf_name>
```

**方式 2：** 通过在 `docker` 之后向 `compile.sh` 传递额外的命令行参数：

```bash
./compile.sh docker KERNEL_ONLY=yes BOARD=cubietruck BRANCH=current KERNEL_CONFIGURE=yes
```

**方式 3：** 在 Docker 容器内以交互方式运行：

```bash
./compile.sh docker-shell BOARD=rockpi-4a BRANCH=edge RELEASE=jammy
```

该过程会创建并运行一个名为 `armbian` 的 Docker 容器，该容器带有两个命名卷 `armbian-cache` 和 `armbian-ccache`，并挂载本地目录 `output` 和 `userpatches`。

方式 1 和 2 的编译效果与不使用 Docker 时相同，但在独立的环境中进行，以防止对基础系统造成更改。

所创建容器的 Dockerfile 位于 `userpatches` 目录中，所有与容器相关的选项都可以在 `userpatches/config-docker.conf` 文件中进行修改。这两个文件的模板位于 `config/templates` 目录中。

## 4. docker-shell 交互模式

当你需要做的不仅仅是"制作一个镜像"时，docker-shell 交互模式非常有用。该模式允许你在应用补丁前后编辑 U-Boot 和内核源代码，调查编译错误等等。

该模式还允许你手动运行构建过程的各个步骤。

首先，在宿主机构建系统上启动 docker-shell：

```bash
./compile.sh docker-shell RELEASE=bullseye BOARD=rockpi-4a BRANCH=edge
```

在这里，`RELEASE=bullseye BOARD=rockpi-4a BRANCH=edge` 会被传递到 shell 中，并设置为环境变量。

接下来，即可开始构建镜像：

```bash
./compile.sh
```

或者，你可以运行 `compile.sh` 脚本中定义的任何函数。

例如，要编译 U-Boot，先使用以下命令准备环境：

```bash
./compile.sh default prepare_host compile_sunxi_tools install_rkbin_tools
```

然后，构建 U-Boot：

```bash
./compile.sh default compile_uboot
```

要在不打补丁或不做修改的情况下仅编译源代码，请运行：

```bash
./compile.sh default COMPILE_ONLY=yes compile_uboot
```

:::info
你必须在 Docker 构建完成后再进入 docker-shell，因为你必须事先下载所有必需的工具链和源代码。
:::
