---
sidebar_position: 2
---

# 准备开发环境

首先准备一台 Ubuntu 20.04 / Ubuntu 18.04 / Ubuntu 16.04 / Ubuntu 14.04 的虚拟机或实体机，其他系统没有测试过出 BUG 不管。

更新系统，安装基础软件包

```
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install build-essential subversion git libncurses5-dev zlib1g-dev gawk flex bison quilt libssl-dev xsltproc libxml-parser-perl mercurial bzr ecj cvs unzip lsof python3 python2 python3-dev android-tools-mkbootimg python2 libpython3-dev
```

安装完成后还需要安装 i386 支持，SDK 有几个打包固件使用的程序是 32 位的，如果不安装就等着 `Segment fault` 吧。

```
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt install gcc-multilib 
sudo apt install libc6:i386 libstdc++6:i386 lib32z1
```