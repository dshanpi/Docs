---
sidebar_position: 1
---

# 获取并编译openwrt


* 源码存放在百度网盘： https://pan.baidu.com/s/1a0uS7kqXiEdKFFgIJ3HF5g?pwd=qm83  提取码：qm83 
* git仓库位置  https://github.com/YuzukiHD/OpenWrt/

## 编译

获取镜像后，进行解压缩，建议使用百度网盘版本，因为网络问题，可能导致某些软件包无法正常下载，编译报错。

解压压缩包后，执行 make menuconfig 进入到配置界面，
```shell
ubuntu@ubuntu1804:~/OpenWrt$ make menuconfig 

```
参考下图红框所示，三个选项选中 为 TinyVision开发板，保证一模一样。
![image-20231216174136154](https://photos.100ask.net/dongshanpi/TinyVision/Openwrt-config.jpg)
选中完成后，保存退出，继续执行make 命令即可开始编译。

```shell
ubuntu@ubuntu1804:~/OpenWrt$ make  

```
如果你不想使用压缩包，而是从头获取源码，需要在 make menuconfig选中开发板之前 执行  ` ./scripts/feeds update -a ` 命令检查远端仓库和本地仓库的差异进行更新，之后执行 `./scripts/feeds install -a` 来安装远端更新。

```shell
ubuntu@ubuntu1804:~/OpenWrt$ ./scripts/feeds update -a
Updating feed 'packages' from 'https://github.com/openwrt/packages.git;openwrt-23.05' ...
remote: Enumerating objects: 101, done.
remote: Counting objects: 100% (101/101), done.
remote: Compressing objects: 100% (44/44), done.
remote: Total 68 (delta 44), reused 45 (delta 21), pack-reused 0
Unpacking objects: 100% (68/68), done.
From https://github.com/openwrt/packages
   421e2c75a..d26bbd792  openwrt-23.05 -> origin/openwrt-23.05
Updating 421e2c75a..d26bbd792
Fast-forward
 admin/btop/Makefile                                       |  7 ++++---
 lang/rust/Makefile                                        |  4 ++--
 lang/rust/patches/0001-Update-xz2-and-use-it-static.patch | 14 +++++++-------
 lang/rust/patches/0002-rustc-bootstrap-cache.patch        | 10 +++++-----
 lang/rust/patches/0003-bump-libc-deps-to-0.2.146.patch    | 28 ----------------------------
 lang/rust/rust-values.mk                                  |  6 ++++++
 net/adblock-fast/Makefile                                 |  2 +-
 net/adblock-fast/files/etc/init.d/adblock-fast            |  2 +-
 net/dnsproxy/Makefile                                     |  4 ++--
 net/sing-box/Makefile                                     |  9 ++-------
 net/travelmate/Makefile                                   |  2 +-
 net/travelmate/files/travelmate.sh                        | 12 +++++++++++-
 net/uspot/Makefile                                        | 10 ++++++----
 net/v2ray-geodata/Makefile                                | 12 ++++++------
 net/v2raya/Makefile                                       |  6 +++---
 15 files changed, 57 insertions(+), 71 deletions(-)
Updating feed 'luci' from 'https://github.com/openwrt/luci.git;openwrt-23.05' ...
remote: Enumerating objects: 49, done.
remote: Counting objects: 100% (49/49), done.
remote: Compressing objects: 100% (18/18), done.
remote: Total 31 (delta 12), reused 25 (delta 6), pack-reused 0
Unpacking objects: 100% (31/31), done.
From https://github.com/openwrt/luci
   11a1a43..fa4b280  openwrt-23.05 -> origin/openwrt-23.05
Updating 11a1a43..fa4b280
Fast-forward
 applications/luci-app-firewall/htdocs/luci-static/resources/view/firewall/rules.js                  |  3 +++
 applications/luci-app-https-dns-proxy/Makefile                                                      |  2 +-
 applications/luci-app-https-dns-proxy/htdocs/luci-static/resources/view/https-dns-proxy/overview.js |  8 ++++----
 themes/luci-theme-openwrt-2020/htdocs/luci-static/openwrt2020/cascade.css                           | 13 +++++++++++++
 4 files changed, 21 insertions(+), 5 deletions(-)
Updating feed 'routing' from 'https://github.com/openwrt/routing.git;openwrt-23.05' ...
Already up to date.
Updating feed 'telephony' from 'https://github.com/openwrt/telephony.git;openwrt-23.05' ...
Already up to date.
Create index file './feeds/packages.index' 
Collecting package info: done
Create index file './feeds/luci.index' 
Collecting package info: done
Create index file './feeds/routing.index' 
Create index file './feeds/telephony.index' 
ubuntu@ubuntu1804:~/Downloads/TinyVision/OpenWrt$ ./scripts/feeds install -a
Installing all packages from feed packages.
Installing all packages from feed luci.
Installing all packages from feed routing.
Installing all packages from feed telephony.
ubuntu@ubuntu1804:~/OpenWrt$ 

```



## 烧写镜像

系统编译完成后，镜像输出在 build_dir/target-arm_cortex-a7+neon-vfpv4_musl_eabi/linux-yuzukihd_v851se/tmp/ 目录下，名称为 `openwrt-yuzukihd-v851se-yuzuki_tinyvision-squashfs-sysupgrade.img.gz` 需要先使用 tar -xvf 进行解压缩，之后 使用 dd if 命令 完整写入sd卡设备，或者 使用 wind32diskimage工具。 或者使用 balenaEtcher 等 进行烧录。