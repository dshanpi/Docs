---
sidebar_position: 2
---

# 获取并编译buildroot
## 获取源码
- BaiduYUN 链接：https://pan.baidu.com/s/19QFDR_ssy6SJeRMzm5lVDw?pwd=b4nh 提取码：b4nh 
- Github仓库： https://github.com/DongshanPI/buildroot-external-tinyvision


## 解压配置

``` shell
ubuntu@ubuntu1804:~$ cd buildroot-2023.02.8/
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ ls
arch   boot     Config.in         configs  DEVELOPERS  docs  linux     Makefile.legacy  package  support  toolchain
board  CHANGES  Config.in.legacy  COPYING  dl          fs    Makefile  output           README   system   utils
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ ls configs/tinyvision_defconfig 
configs/tinyvision_defconfig
ubuntu@ubuntu1804:~/buildroot-2023.02.8$  
```

## 编译

``` shell
ubuntu@ubuntu1804:~/buildroot-2023.02.8$  make tinyvision_defconfig
#
# configuration written to /home/ubuntu/buildroot-2023.02.8/.config
#
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ make
/usr/bin/make -j1  O=/home/ubuntu/buildroot-2023.02.8/output HOSTCC="/usr/bin/gcc" HOSTCXX="/usr/bin/g++" syncconfig

```

注意： 不要使用 make clean命令 清理仓库。

## 烧写

``` shell
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ ls output/images/
boot.vfat    rootfs.ext4  sun8i-v851se-tinyvision.dtb  sunxi.dtb           tinyvision_sdcard.img
rootfs.ext2  rootfs.tar   sun8i-v851s-tinyvision.dtb   syter_boot_bin.bin  zImage
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ 
```

系统编译完成后，镜像输出在 `output/images/` 目录下，名称为 `tinyvision_sdcard.img`  使用 dd if 命令 完整写入sd卡设备，或者 使用 wind32diskimage工具。 或者使用 balenaEtcher 等 进行烧录。