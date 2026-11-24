---
title: 编译 DshanPI A1 CM5 Buildroot 固件
sidebar_label: Buildroot SDK 与固件编译
sidebar_position: 1
slug: /DshanPi-A1_CM5/Development/BuildrootSDK
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/4-Development/01-BuildrootSDK.md
---

# 编译 DshanPI A1 CM5 Buildroot 固件

本教程使用 2026-11-23 发布的源码基线。先[从百度网盘下载 SDK](#download-sdk)，解压后从 GitHub 主分支 `main` 获取板级配置，再编译生成整机镜像 `update.img`。

## 1. 准备编译环境 {#build-firmware}

在 Ubuntu 24.04 LTS x86_64 主机的终端执行以下步骤。本次验证开始时有 105 GiB 可用磁盘空间，可用 `df -h ~` 查看自己的编译分区。

先安装构建工具和打包依赖。

```bash
sudo apt-get update
sudo apt-get install --no-install-recommends \
  build-essential git ca-certificates wget rsync file bc bison flex \
  python3 python-is-python3 libssl-dev libelf-dev libncurses-dev libgmp-dev libmpc-dev \
  device-tree-compiler cpio unzip xz-utils bzip2 patch perl gawk diffstat \
  expect fakeroot lz4 zstd time locales bsdextrautils
```

生成编译工具使用的 UTF-8 区域设置。

```bash
sudo localedef -i en_US -f UTF-8 en_US.UTF-8
```

U-Boot 的构建脚本还会检查 `python2`。运行 `python2 --version`；如果系统找不到该命令，展开下方步骤安装。

<details>
<summary>在 Ubuntu 24.04 上安装 Python 2.7.18</summary>

下载 [Python 2.7.18 源码](https://www.python.org/downloads/release/python-2718/)，校验通过后再解压。

```bash
cd ~/Downloads
wget https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tgz
echo 'da3080e3b488f648a3d7a4560ddee895284c3380b11d6de75edb986526b9a814  Python-2.7.18.tgz' | sha256sum -c -
```

显示 `OK` 后，使用 Ubuntu 24.04 自带的 GCC 编译。

```bash
tar -xzf Python-2.7.18.tgz
cd Python-2.7.18
./configure --prefix=/opt/python-2.7.18 --without-ensurepip
make -j4
```

单独安装 `python2` 命令并检查版本。Ubuntu 的 `python3` 继续使用系统版本。

```bash
sudo make altinstall
sudo ln -s /opt/python-2.7.18/bin/python2.7 /usr/local/bin/python2
python2 --version
```

应显示 `Python 2.7.18`。

</details>

## 2. 下载、校验并解压 SDK {#download-sdk}

1. 打开[百度网盘分享](https://pan.baidu.com/s/1Xo342SQDyKZb5xRiNAD-Dw?pwd=jevb)，提取码为 **`jevb`**。
2. 进入 `115_DshanPI-A1-CM5资料/05_SDK源码/01_Buildroot系统/`，下载基线源码包 `100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz`，保存到 Ubuntu 的 `~/Downloads/`。
3. 将 [SHA-256 校验文件](https://raw.githubusercontent.com/dshanpi/DshanPi-A1_CM5-BuildrootSDK/main/docs/baselines/100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz.sha256) 保存到同一目录，在终端运行以下命令。

```bash
cd ~/Downloads
sha256sum -c 100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz.sha256
```

显示 `OK` 后，解压到主目录。首次解压时，确保目标目录 `~/100ask-rk3576_SDK` 尚不存在。

```bash
tar -xzf 100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz -C ~
```

## 3. 获取并应用板级差分包

首次使用时，克隆仓库即可获取默认分支 `main`。

```bash
git clone --depth 1 https://github.com/dshanpi/DshanPi-A1_CM5-BuildrootSDK.git ~/DshanPi-A1_CM5-BuildrootSDK
```

已使用 `main` 的用户，后续运行 `git -C ~/DshanPi-A1_CM5-BuildrootSDK pull --ff-only` 即可获取更新。如果沿用旧目录名或日期分支，请先按仓库说明迁移。[查看迁移步骤](https://github.com/dshanpi/DshanPi-A1_CM5-BuildrootSDK#1-获取板级配置)

将板级文件应用到 SDK。本次验证的版本执行成功后显示“已应用 45 个板级文件”。

```bash
~/DshanPi-A1_CM5-BuildrootSDK/scripts/apply-cm5-diff.sh ~/100ask-rk3576_SDK
```

## 4. 编译固件

在 Ubuntu 24.04 终端使用普通用户进入 SDK，选择 DshanPI A1 CM5 板级配置。

```bash
cd ~/100ask-rk3576_SDK
./build.sh defconfig:rockchip_rk3576_dshanpi-a1_cm5_defconfig
```

执行完整编译，成功后再生成整机镜像。

```bash
./build.sh && ./build.sh updateimg
```

## 5. 获取 update.img

在 SDK 根目录查看镜像的实际大小。

```bash
ls -lhL output/firmware/update.img
```

生成的整机固件位于 `~/100ask-rk3576_SDK/output/firmware/update.img`。

实测镜像大小为 **1,055,365,763 字节**。本次在 Ubuntu 24.04 LTS 上使用 GCC 13.3 完成全量编译，并解包核对了 U-Boot、内核、recovery、根文件系统和 userdata 分区镜像。
