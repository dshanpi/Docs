---
sidebar_position: 1
---

# 启动开发板

## 制作系统启动镜像

### 硬件要求

当您购买了一套全新的TinyVision异构视觉AI开发套件，包装盒内会有：

1.TinyVision开发板

您还需要额外的：

1.microSD卡(建议最低8GB） x1

2.TypeC-SUB调试器 x1  https://item.taobao.com/item.htm?id=761016078439&

3.40Gbps数据线 x1 https://item.taobao.com/item.htm?id=761016078439&

4.type-C数据线 x2 https://item.taobao.com/item.htm?id=761016078439&

5.USB读卡器 x1

> 注意：使用时还需要一台正常工作且能连接互联网的PC电脑。

### 系统选择

TinyVision V851se支持多种不同的系统，有主线，有原厂BSP，有RTOS等等，在首次启动，您需要选择一个合适的系统，这里我们以兼容性最好，功能最全的Tina-SDK系统镜像为例， 首先通过百度网盘获取 链接：https://pan.baidu.com/s/1Mp504XnUsTz5Mnf15pexNg?pwd=mof1  或者进入QQ群 821628986  看群文件，获取到 文件 `tina_v851se-tinyvision_uart0.img` 保存至电脑。之后进行烧写操作。

更多的系统选择可以访问： https://dongshanpi.100ask.net/docs/TinyVision/part2/03-1_FlashSystem  页面.

### 烧写系统

- 硬件：TinyVision主板 x1
- 硬件：TypeC-SUB x1
- 硬件：TF卡读卡器 x1
- 硬件：8GB以上的 Micro TF卡 x1
- 软件：Tina系统TF卡烧录工具: [PhoenixCard-V2.8](https://gitlab.com/dongshanpi/tools/-/raw/main/PhoenixCard-V2.8.zip)
- 软件：TinaTF卡最小系统镜像：`tina_v851se-tinyvision_uart0.img` 

烧录过程请参考下述步骤：

1. 打开 已经下载好的 凤凰卡 烧录工具 PhoenixCard-V2.8 运行起来，点击 **固件**
2. 在弹出的对话框内，找到我们已经下载好的Tina系统镜像，按照 序号  2 、3 依次选择。
3. 选择好固件后，点击 序号 4 选择为 启动卡，之后 点击 序号 5   烧卡进行烧录。
4. 烧录完成后，如下蓝框 序号6 log提示，会提示 烧写完成，此时 拔下 TF卡即可进行后续启动步骤。

![image-20231221122848948](https://photos.100ask.net/dongshanpi/TinyVision/TinaSDKFlash.jpg)

### 插卡启动

在开发板启动前需要先将SD卡接入开发板，如下图所示：

![image-20240110120118215](https://photos.100ask.net/dongshanpi/TinyVision/image-20240110120118215.png)


​使用40Gbps数据线连接TinyVision开发板和TypeC-SUB调试器，如下图所示：

![image-20240110141348166](https://photos.100ask.net/dongshanpi/TinyVision/image-20240110141348166.png)

​	使用两条Type-C连接TypeC UART调试器和电脑端，连接完成后即可启动系统.

## 使用串口登录系统
### 1. 连接串口线
将配套的TypeC线一段连接至开发板的串口/供电接口，另一端连接至电脑USB接口，连接成功后板载的红色电源灯会亮起。
默认情况下系统会自动安装串口设备驱动，如果没有自动安装，可以使用驱动精灵来自动安装。
* 对于Windows系统
此时Windows设备管理器 在 端口(COM和LPT) 处会多出一个串口设备，一般是以 `USB-Enhanced-SERIAL CH9102`开头，您需要留意一下后面的具体COM编号，用于后续连接使用。

![QuickStart-01](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/QuickStart-01.png)

如上图，COM号是96，我们接下来连接所使用的串口号就是96。

* 对于Linux系统
可以查看是否多出一个/dev/tty 设备,一般情况设备节点为 /dev/ttyACM0  。

![QuickStart-02](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/QuickStart-02.png)

### 2. 打开串口控制台
#### 2.1 获取串口工具
使用Putty或者MobaXterm等串口工具来开发板设备。

* 其中putty工具可以访问页面  https://www.chiark.greenend.org.uk/~sgtatham/putty/  来获取。
* MobaXterm可以通过访问页面 https://mobaxterm.mobatek.net/ 获取 (推荐使用)。

#### 2.2 使用putty登录串口

![QuickStart-04](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/QuickStart-04.png)

#### 2.3 使用Mobaxterm登录串口
打开MobaXterm，点击左上角的“Session”，在弹出的界面选中“Serial”，如下图所示选择端口号（前面设备管理器显示的端口号COM21）、波特率（Speed 115200）、流控（Flow Control: none）,最后点击“OK”即可。步骤如下图所示。
**注意：流控（Flow Control）一定要选择none，否则你将无法在MobaXterm中向串口输入数据**

![Mobaxterm_serial_set_001](https://photos.100ask.net/dongshanpi-docs/DongshanNezhaSTU/Mobaxterm_serial_set_001.png)


### 3. 进入系统shell
使用串口工具成功打开串口后，可以直接按下 Enter 键 进入shell，当然您也可以按下板子上的 `Reset`复位键，来查看完整的系统信息。

``` bash
[34]HELLO! BOOT0 is starting!
[37]BOOT0 commit : 88480af
[40]set pll start
[42]periph0 has been enabled
[44]set pll end
[46][pmu]: bus read error
[48]board init ok
[50]ZQ value = 0x2f
[52]get_pmu_exist() = -1
[54]DRAM BOOT DRIVE INFO: V0.33
[57]DRAM CLK = 528 MHz
[59]DRAM Type = 2 (2:DDR2,3:DDR3)
[62]DRAMC read ODT  off.
[65]DRAM ODT off.
[67]ddr_efuse_type: 0xa
[69]DRAM SIZE =64 M
[71]dram_tpr4:0x0
[73]PLL_DDR_CTRL_REG:0xf8002b00
[76]DRAM_CLK_REG:0xc0000000
[78][TIMING DEBUG] MR2= 0x0
[83]DRAM simple test OK.
[85]dram size =64
[87]spinor id is: ef 40 18, read cmd: 6b
[90]Succeed in reading toc file head.
[94]The size of toc is 100000.
[139]Entry_name        = opensbi
[142]Entry_name        = u-boot
[146]Entry_name        = dtb
▒149]Jump to second Boot.

U-Boot 2018.05-g24521d6 (Feb 11 2022 - 08:52:39 +0000) Allwinner Technology

[00.158]DRAM:  64 MiB
[00.160]Relocation Offset is: 01ee7000
[00.165]secure enable bit: 0
[00.167]CPU=1008 MHz,PLL6=600 Mhz,AHB=200 Mhz, APB1=100Mhz  MBus=300Mhz
[00.174]flash init start
[00.176]workmode = 0,storage type = 3
individual lock is enable
[00.185]spi sunxi_slave->max_hz:100000000
SF: Detected w25q128 with page size 256 Bytes, erase size 64 KiB, total 16 MiB
[00.195]sunxi flash init ok
[00.198]line:703 init_clocks
[00.201]drv_disp_init
request pwm success, pwm7:pwm7:0x2000c00.
[00.218]drv_disp_init finish
[00.220]boot_gui_init:start
[00.223]set disp.dev2_output_type fail. using defval=0
[00.250]boot_gui_init:finish
partno erro : can't find partition bootloader
54 bytes read in 0 ms
[00.259]bmp_name=bootlogo.bmp size 38454
38454 bytes read in 1 ms (36.7 MiB/s)
[00.434]Loading Environment from SUNXI_FLASH... OK
[00.448]out of usb burn from boot: not need burn key
[00.453]get secure storage map err
partno erro : can't find partition private
root_partition is rootfs
set root to /dev/mtdblock5
[00.464]update part info
[00.467]update bootcmd
[00.469]change working_fdt 0x42aa6da0 to 0x42a86da0
No reserved memory region found in source FDT
FDT ERROR:fdt_get_all_pin:get property handle pinctrl-0 error:FDT_ERR_INTERNAL
sunxi_pwm_pin_set_state, fdt_set_all_pin, ret=-1
[00.494]LCD open finish
[00.510]update dts
```
**系统默认会自己登录 没有用户名 没有密码。**
**系统默认会自己登录 没有用户名 没有密码。**
**系统默认会自己登录 没有用户名 没有密码。**



## windows下使用 ADB登录系统

### 1.连接OTG线

将开发板配套的两根typec线，一根 直接连接至 开发板 `黑色字体序号 3.OTG烧录接口` 另一头连接至电脑的USB接口，开发板默认有系统，接通otg电源线就会通电并直接启动。

### 2. 安装windows板ADB

点击链接下载Windows版ADB工具 [adb-tools](https://gitlab.com/dongshanpi/tools/-/raw/main/ADB.7z)
下载完成后解压，可以看到如下目录，

![adb-tools-dir](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-dir.png)

然后 我们单独 拷贝 上一层的 **platform-tools** 文件夹到任意 目录，拷贝完成后，记住这个 目录位置，我们接下来要把这个 路径添加至 Windows系统环境变量里。

![adb-tools-dir](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-dir-001.png)

我这里是把它单独拷贝到了 D盘，我的目录是 `D:\platform-tools` 接下来 我需要把它单独添加到Windows系统环境变量里面才可以在任意位置使用adb命令。

![adb-tools-windows_config_001](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-windows_config_001.png)

添加到 Windows系统环境变量里面
![adb-tools-windows_config_001](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-windows_config_002.png)

### 3.打开cmd连接开发板

打开CMD Windows 命令提示符方式有两种
方式1：直接在Windows10/11搜索对话框中输入  cmd 在弹出的软件中点击  `命令提示符`
方式2：同时按下 wind + r 键，输入 cmd 命令，按下确认 就可以自动打开 `命令提示符`

![adb-tools-windows_config_003](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-windows_config_003.png)

打开命令提示符，输出 adb命令可以直接看到我们的adb已经配置成功

![adb-tools-windows_config_004](https://photos.100ask.net/dongshanpi-docs/d1s/adb-tools-windows_config_004.png)

连接好开发板的 OTG 并将其连接至电脑上，然后 输入 adb shell就可以自动登录系统

``` shell
C:\System> adb shell
* daemon not running. starting it now on port 5037 *
* daemon started successfully *

 _____  _              __     _
|_   _||_| ___  _ _   |  |   |_| ___  _ _  _ _
  | |   _ |   ||   |  |  |__ | ||   || | ||_'_|
  | |  | || | || _ |  |_____||_||_|_||___||_,_|
  |_|  |_||_|_||_|_|  Tina is Based on OpenWrt!
 ----------------------------------------------
 Tina Linux
 ----------------------------------------------
root@TinaLinux:/#

```

ADB 也可以作为文件传输使用，例如：

``` shell
C:\System> adb push badapple.mp4 /mnt/UDISK   # 将 badapple.mp4 上传到开发板 /mnt/UDISK 目录内
```

``` shell
C:\System> adb pull /mnt/UDISK/badapple.mp4   # 将 /mnt/UDISK/badapple.mp4 下拉到当前目录内
```

**注意： 此方法目前只适用于 使用全志Tina-SDK 构建出来的系统。**