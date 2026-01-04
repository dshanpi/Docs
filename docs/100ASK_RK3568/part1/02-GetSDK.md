---
sidebar_position: 2
---
# 获取SDK

> 操作系统：Ubuntu20.04 （默认虚拟机的源，网络等已配置好）
>
> 内存：8GB

本章节将讲解如何搭建开发环境，编译 rk3568 Linux SDK资源包。SDK包含了开发rk3568平台所需的各种软件组件、源代码、工具、库、文档以及示例代码等。这些资源旨在帮助开发人员基于rk3568芯片进行高效的软件开发、系统定制以及应用程序开发。下面将进行的操作皆在 Ubuntu 上执行。（默认使用内核版本为5.10的SDK。内核版本为4.19SDK在同仓库的rockchip-4.19-sdk分支上，不建议使用该版本）

## 安装依赖

编译 rk3568 Linux SDK包需要一些依赖，下面将进行安装依赖操作。

安装依赖之前，最好执行以下指令更新软件包：

~~~bash
sudo apt update
~~~

安装依赖：

~~~bash
sudo apt-get install curl python2 git ssh make gcc libssl-dev liblz4-tool expect \
g++ patchelf chrpath gawk texinfo chrpath diffstat binfmt-support qemu-user-static live-build bison \
flex fakeroot cmake gcc-multilib g++-multilib unzip device-tree-compiler python3-pip \
libncurses-dev python3-pyelftools vim mtd-utils
~~~

确保所有依赖安装完成。

编译sdk需要用到python3版本，执行以下指令切换python版本，

~~~bash
#将python链接到python3
sudo ln -sf /usr/bin/python3 /usr/bin/python
#查看默认Python版本
python -V
~~~

## 获取SDK资源包

**1.获取SDK包**

> 路径自行选择。

我们把SDK放在了远程仓库上，执行以下指令获取SDK：

~~~bash
git clone https://e.coding.net/weidongshan/dshanpi-r1/rockchip-sdk.git
cd rockchip-sdk/
git clone https://e.coding.net/weidongshan/dshanpi-r1/external.git
git clone https://e.coding.net/weidongshan/dshanpi-r1/kernel.git
git clone https://e.coding.net/weidongshan/dshanpi-r1/u-boot.git
git clone https://e.coding.net/weidongshan/dshanpi-r1/buildroot.git
~~~

SDK稍微有点大，需要等待一会时间。

## SDK工程目录介绍

拉取后，可以在当前路径下查看，目录结构如下：

~~~bash
.
├── app         #存放上层应用 app，包括 Qt 应用程序，以及其它的 C/C++应用程序。													
├── buildroot   #基于 Buildroot（2021）开发的根⽂件系统
├── build.sh -> device/rockchip/common/scripts/build.sh
├── device
├── envsetup.sh -> buildroot/build/envsetup.sh
├── external    #存放所需的第三方库，包括音频、视频、网络、recovery 等。
├── kernel      #Linux 5.10 版本内核源码。
├── Makefile -> device/rockchip/common/Makefile
├── output      #存放编译输出固件
├── prebuilts   #存放交叉编译工具链。
├── rkbin       #存放 Rockchip 相关的 Binary 和工具。
├── rkflash.sh -> device/rockchip/common/scripts/rkflash.sh
├── rockdev -> output/firmware  #编译SDK后才会出现		
├── tools       #存放常用的工具，包括镜像烧录工具、SD 卡升级启动制作工具、批量烧录工具等
└── u-boot      #基于 v2017.09 版本进行开发的 uboot 源码。
~~~

## 获取补丁包

基于 100ask-rk3568 开发板，我们提供了一个扩展补丁包，执行以下指令，获取扩展支持仓库，然后加以应用。

~~~bash
cd ~/
git clone https://e.coding.net/weidongshan/dshanpi-r1/RK3568-DshanPI-R1_SDK.git
cd RK3568-DshanPI-R1_SDK
cp ./* -rfvd ~/rockchip-sdk/
~~~

复制的时候，这里需要注意 rockchip-sdk 路径的位置。