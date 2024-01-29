---
sidebar_position: 2
---
# 选择合适系统

## 原厂SDK系统
- 硬件兼容性 ⭐⭐⭐⭐⭐
- 软件功能完善度 ⭐⭐⭐⭐⭐
- 开发使用难度 ⭐⭐⭐⭐⭐
- 烧写工具 全志自家烧录器。
### TinaSDK-4.0

#### TF卡系统镜像

- tina_v851se-tinyvision_uart0.img

  - 默认TinaSDK编译出来

  - 支持ADB

  - 和默认SDK兼容性最好

  

- tina-4.0_cameratest_tina_v851se-tinyvision_uart0.zip

  - 支持GC2053摄像头

    

- tina-4.0_test_tina_v851se-tinyvision_uart0.zip

  - 默认SDK镜像

  
## 主线Linux系统

- TF卡读卡器 x1
- 8GB以上的 micro TF卡 x1
- win32diskimage工具 : https://gitlab.com/dongshanpi/tools/-/raw/main/win32diskimager-1.0.0-install.exe
- SDcard专用格式化工具：https://gitlab.com/dongshanpi/tools/-/raw/main/SDCardFormatter5.0.1Setup.exe
- Etcher烧写工具下载：https://etcher.balena.io/#download-etcher


* 使用Win32Diskimage烧录
需要下载 **win32diskimage SDcard专用格式化** 这两个烧写TF卡的工具。

- 使用SD CatFormat格式化TF卡，注意备份卡内数据。参考下图所示，点击刷新找到TF卡，然后点击 Format 在弹出的 对话框 点击 **是(Yes)**等待格式完成即可。

![](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/SDCardFormat_001.png)

- 格式化完成后，使用**Win32diskimage**工具来烧录镜像，参考下属步骤，找到自己的TF卡盘符，然后点击2 箭头 文件夹的符号 找到 刚才解压的 TF卡镜像文件 **dongshannezhastu-sdcard.img** 最后 点击 写入，等待写入完成即可。

![](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/wind32diskimage_001.png)

完成以后，就可以弹出TF卡，并将其插到 东山哪吒STU 最小板背面的TF卡槽位置处，此时连接 串口线 并使用 串口工具打开串口设备，按下开发板的 **RESET**复位按键就可以重启进入TF卡系统内了。



* 使用 etcher https://etcher.balena.io/ 工具直接烧写系统镜像。

1.以管理员身份运行 etcher 烧写工具

2.选择需要烧写的系统镜像文件

3.选择 目标磁盘，找到TF卡设备

4. 点击烧录，等待烧录成功

![](https://photos.100ask.net/dongshanpi/TinyVision/Etcher_Flash.jpg)


### Debian12

- tinyvision_debian12_sdcard.img
  - 支持 debian 12发行版系统

### Buildroot-2023

- tinyvision_sdcard.img
  - 使用Linux kernel 5.15构建
  - 配套 buildroot 2023版本
  - 使用 syster启动

### OpenWrt-23.5

- openwrt-yuzukihd-v851se-yuzuki_tinyvision-ext4-sysupgrade.img
  - 使用Linux kernel 6.x构建
  - 支持WOL
  - 支持LUCI配置
  - 支持百兆网卡等

## SysterKit裸系统

### SysterBoot

### SysterSPILCD

## 其他OS
### RT-Thread

### Freertos
