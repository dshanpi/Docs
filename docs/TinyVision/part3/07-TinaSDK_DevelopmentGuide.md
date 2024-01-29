# 使用Tina-SDK编译构建系统

## 简介

* 此套构建系统基于全志单核 Arm Cortex-A7 SoC，搭载了 RISC-V E907 内核的V851se  芯片，适配了Tina 5.0主线版本，是专为智能 IP 摄像机设计的，支持人体检测和穿越报警等功能。

## 获取sdk源码

开始之前我们需要先获取 提前准备好 tina-v851se.tar.gz 压缩包，压缩包分为国内国外两个存放位置，如下所示，大小大概5.2G，下载完成后，拷贝到提前配置好Host开发环境的ubuntu系统内,然后使用 tar -xvf tina-v851se.tar.gz 命令进行解压缩。

- BaiduYun:   链接：https://pan.baidu.com/s/1oIqGjCCtvUe0_k_kgXkusw?pwd=0kdr 提取码：0kdr 

解压缩命令

```bash
tar -xzvf tina-v851se.tar.gz
```

解压完成后，可以看到多出来一个 tina-v851的文件夹

```bash
book@100ask:~$ cd tina-v851/
book@100ask:~/tina-v851$ ls
build      device  external  out       rules.mk  tmp
config     dl      lichee    package   scripts   toolchain
Config.in  docs    Makefile  prebuilt  target    tools
```

由于默认的sdk并未支持此开发板，所以我们需要支持此开发板的配置 单独拷贝增加到tina-v851 sdk内，首先clone此开发板补丁仓库，然后单独覆盖。

```bash
book@100ask:~$ git clone  https://github.com/DongshanPI/TinyVision-v851se_TinaSDK
book@100ask:~$ cp -rfvd  TinyVision-v851se_TinaSDK/* tina-v851/
```

## 安装必要依赖包

### ubuntu-18.04

运行环境配置： 此系统基于ubuntu18.04进行验证，在之前的基础之上还需要安装以下必要依赖

```shell
 sudo apt-get install build-essential subversion git-core libncurses5-dev zlib1g-dev gawk flex quilt libssl-dev xsltproc libxml-parser-perl mercurial bzr ecj cvs unzip lib32z1 lib32z1-dev lib32stdc++6 libstdc++6 u-boot-tools -y
```

安装完成后，执行如下命令进行开始编译操作。

## 最小系统编译烧写
### 编译SD卡最小系统镜像

建立编译环境

```bash
book@100ask:~/tina-v851$ source build/envsetup.sh 
Setup env done! Please run lunch next.
```

选择编译的开发板，输入lunch

```shell
book@100ask:~/tina-v851$ lunch

You're building on Linux

Lunch menu... pick a combo:
     1. v851se_tinyvision-tina

Which would you like?: 1 #此时可以输入1，选择tinyvision开发板
============================================
TINA_BUILD_TOP=/home/book/tina-v851
TINA_TARGET_ARCH=arm
TARGET_PRODUCT=v851se_tinyvision
TARGET_PLATFORM=v851se
TARGET_BOARD=v851se-tinyvision
TARGET_PLAN=tinyvision
TARGET_BUILD_VARIANT=tina
TARGET_BUILD_TYPE=release
TARGET_KERNEL_VERSION=4.9
TARGET_UBOOT=u-boot-2018
TARGET_CHIP=sun8iw21p1
============================================
no buildserver to clean
[1] 3357
```

选择完成后，输入make开始编译

```shell
book@100ask:~/tina-v851$ make
===This's tina environment.===
find: ‘/home/book/tina-v851/lichee/brandy-2.0/spl’: No such file or directory
v851se_tinyvision v851se v851se-tinyvision
build_boot platform:sun8iw21p1 o_option:spl-pub
grep: /home/book/tina-v851/lichee/brandy-2.0/spl/Makefile: No such file or directory
Prepare toolchain ...
--------build for mode:all board:v851se-------------------
platform set to sun8iw21p1
make -C /home/book/tina-v851/lichee/brandy-2.0/spl-pub/fes fes
  CHK     /home/book/tina-v851/lichee/brandy-2.0/spl-pub/include/config.h
  UPD     /home/book/tina-v851/lichee/brandy-2.0/spl-pub/include/config.h
  CHK     /home/book/tina-v851/lichee/brandy-2.0/spl-pub/autoconf.mk
  UPD     /home/book/tina-v851/lichee/brandy-2.0/spl-pub/autoconf.mk
make -C /home/book/tina-v851/lichee/brandy-2.0/spl-pub/arch/arm/cpu/armv7/
make -C /home/book/tina-v851/lichee/brandy-2.0/spl-pub/fes/main/
...
```

等待编译完成，此部分编译时间由电脑CPU等决定，第一次编译系统的时间比较长，请耐心等待。等待输出编译Tina OK即编译成功。



编译完成后，输入pack，可以直接将刚刚编译完成的系统打包生成可烧写到板载SD卡上的镜像

``` shell
book@100ask:~/tina-v851$ pack
...
ragon execute image.cfg SUCCESS !
----------image is for nand/emmc----------
----------image is at----------

/home/ubuntu/Downloads/tina-v851/out/v851se-tinyvision/tina_v851se-tinyvision_uart0.img

pack finish
```

等待打包完成，打包完成后可以根据上面的输出信息提示的目录下找到 tina_v851se-tinyvision_uart0.img镜像，将此镜像文件拷贝到Windows电脑中。

### 烧写SD卡最小系统镜像

编译完成后会在tina-v851/out/v851se-tinyvision/目录下输出 tina_v851se-tinyvision_uart0.img 文件，将文件拷贝到Windows系统下使用 使用 全志官方的  PhoenixCard 进行烧写。
详细烧写步骤请，请参考左侧 **快速启动** 页面。





