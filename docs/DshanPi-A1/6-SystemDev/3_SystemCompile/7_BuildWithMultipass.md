---
sidebar_position: 7
---

# 使用 Multipass 构建

:::tip
本章介绍如何使用 Multipass 在 Ubuntu 虚拟机中搭建 Armbian 构建环境，适合 macOS、Windows 和 Linux 用户。
:::

要从零开始构建 Armbian 镜像（无论是出于开发目的，还是在基础镜像之上[应用用户自定义配置](./5_UserConfigurations.md)），都需要一个构建环境。根据 Armbian 文档，Ubuntu 24.04 是[官方支持](./2_BuildPreparation.md)的构建平台。

[Multipass](https://multipass.run/) 是一款专为快速、便捷地部署 Ubuntu 虚拟机而设计的工具。

## 1. 创建虚拟机并准备构建

Multipass 可在 macOS、Windows 和 Linux 平台上[安装使用](https://multipass.run/install)。

安装 Multipass 后，只需一条命令即可创建一个配置为 4 核 CPU、4 GB 内存和 25 GB 磁盘空间的 Jammy（22.04）实例：

```bash
multipass launch --cpus 4 --disk 25G --mem 4G --name jammy
```

## 2. 克隆构建仓库

你可以直接在实例中运行命令来克隆构建仓库：

```bash
multipass exec jammy -- bash -c "git clone --depth 1 https://github.com/armbian/build"
```

## 3. 使用实例

进入实例的 shell 后，即可按需运行构建：

```bash
C:\> multipass shell armbian
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.4.0-48-generic x86_64)
Last login: Tue Jan 30 12:23:08 2024 from 172.22.111.1
# Let's get building!
ubuntu@armbian:~$ cd build
ubuntu@armbian:~/build$ ./compile.sh BOARD=orangepizero ... etc
```

## 4. 与实例共享数据

在主机与 Multipass 实例之间共享数据的推荐方式是使用 `mount` 命令：

```bash
multipass mount /my/dir jammy
multipass info jammy
```

输出示例：

```text
Mounts:         /my/dir => /my/dir
```

从此时起，`/my/dir` 目录将在实例内部可用。
