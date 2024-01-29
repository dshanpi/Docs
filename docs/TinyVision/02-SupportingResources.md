---
sidebar_position: 2
---

# 源码工具文档手册

## SDK源码及示例

### Tina-SDK系统

- 此套构建系统基于全志单核 Arm Cortex-A7 SoC，搭载了 RISC-V 内核的V851s 芯片，适配了Tina 5.0主线版本，是专为智能 IP 摄像机设计的，支持人体检测和穿越报警等功能。

![](https://photos.100ask.net/Tina-Sdk/OpenRemoved_Tina_Linux_System_software_development_Guide-3-1.jpg)

* TinaSDK 文件MD5校验值 ac0b5f723207247aae32572d88a48c3c  获取文件后，请通过 md5 工具校验压缩包一致性。

```bash
 md5sum  tina-v851.tar.gz  ac0b5f723207247aae32572d88a48c3c 
 ubuntu@ubuntu1804:~/tina-v851$ tree -L 1
.
├── build
├── config
├── Config.in -> config/top_config.in
├── device
├── dl
├── docs
├── external
├── lichee
├── Makefile -> build/top_main.mk
├── package
├── prebuilt
├── rules.mk -> build/rules.mk
├── scripts
├── target
├── toolchain
└── tools

13 directories, 3 files

```

* SDK 下载解压操作步骤请参考  Tina-SDK开发章节内容。
* TinaSDK开发参考文档站点 https://tina.100ask.net/
  * 第一部分介绍了Tina-SDK源码的使用方式，包含源码目录功能，编译打包等命令。
  * 第二部分介绍了Bootloader相关的内容，主要包含uboot相关的使用说明。
  * 第三部分介绍了Linux所有的设备驱动开发的详细说明。
  * 第四部分介绍了Linux驱动之上的各类组件包库等的开发说明。
  * 第五部分介绍了Linux系统的相关操作，主要包含存储支持 打包 调试 优化等
  * 第六部分支持了一些应用demo示例，如LVGL GST等常用且较为丰富的综合项目

### SyterKit系统

* SyterKit源码位置:   https://github.com/YuzukiHD/SyterKit

SyterKit 是一个纯裸机框架，用于 TinyVision 或者其他 v851se/v851s/v851s3/v853 等芯片的开发板，SyterKit 使用 CMake 作为构建系统构建，支持多种应用与多种外设驱动。同时 SyterKit 也具有启动引导的功能，可以替代 U-Boot 实现快速启动（标准 Linux6.7 主线启动时间 1.02s，相较于传统 U-Boot 启动快 3s）。

目前已经支持如下功能

| 名称            | 功能                                                         | 路径                  |
| --------------- | ------------------------------------------------------------ | --------------------- |
| hello world     | 最小程序示例，打印 Hello World                               | `app/hello_world`     |
| init dram       | 初始化串行端口和 DRAM                                        | `app/init_dram`       |
| read chip efuse | 读取芯片 efuse 信息                                          | `app/read_chip_efuse` |
| read chipsid    | 读取芯片的唯一 ID                                            | `app/read_chipsid`    |
| load e907       | 读取 e907 核心固件，启动 e907 核心，并使用 V851s 作为大型 RISC-V 微控制器（E907 @ 600 MHz，64MB 内存） | `app/load_e907`       |
| syter boot      | 替代 U-Boot 的引导函数，为 Linux 启用快速系统启动            | `app/syter_boot`      |
| syter amp       | 读取 e907 核心固件，启动 e907 核心，加载内核，并在 e907 和 a7 系统上同时运行 Linux，系统是异构集成运行的 | `app/syter_amp`       |
| fdt parser      | 读取设备树二进制文件并解析打印输出                           | `app/fdt_parser`      |
| fdt cli         | 使用支持 uboot fdt 命令的 CLI 读取设备树二进制文件           | `app/fdt_cli`         |
| syter bootargs  | 替代 U-Boot 引导，为 Linux 启用快速系统启动，支持在 CLI 中更改启动参数 | `app/syter_bootargs`  |
| cli test        | 测试基本 CLI 功能                                            | `app/cli_test`        |

### Linux Kernel

基于Linus主线LinuxKernel 支持 tinyvision单板及驱动模块，支持多个内核版本，不同的内核版本支持的功能特性也不同，可以通过下述列表查看。

* 源码所在位置  https://github.com/YuzukiHD/TinyVision/tree/main/kernel/

| Kernel Version     | Target ON                               | Core           | Path                |
| ------------------ | --------------------------------------- | -------------- | ------------------- |
| 4.9.191            | CV, Camera, NPU, MP, Video Encode, RTSP | Cortex-A7 Core | `kernel\linux-4.9`  |
| 5.15.138           | IoT, NPU, Router                        | Cortex-A7 Core | `kernel\linux-5.15` |
| 6.1.62             | IoT                                     | Cortex-A7 Core | `kernel\linux-6.1`  |
| Mainline Linux 6.7 | Mainline                                | Cortex-A7 Core | `kernel\linux-6.7`  |


### RTOS Kernel 
| Kernel Version     | Target ON                               | Core           | Path                |
| ------------------ | --------------------------------------- | -------------- | ------------------- |
| RT-Thread          | Real-Time Control, Fast                 | RISC-V E907    | `kernel\rtos`       |
| SyterKit           | Baremetal ASM Code                      | Cortex-A7 Core | `kernel\SyterKit`   |



### Openwrt系统

TinyVision自带百兆网口接口+摄像头接口支持，支持 Current stable series: OpenWrt 23.05 系统，可以做一个 轻量级的IPC摄像头，里面运行主线系统，选择合适的内核版本  一键 编译生成系统镜像。

* openwrt-23.05源码:   https://github.com/YuzukiHD/OpenWrt/tree/openwrt-23.05
* OpenWrt-23.05目录结构，OpenWrt-23.05.tar.gz 压缩包 md5值 2b10a86405aa4d045bc2134e98d3f6d8 请确保压缩包文件一致性。

``` bash
ubuntu@ubuntu1804:~/$ md5sum OpenWrt-23.05.tar.gz 
ubuntu@ubuntu1804:~/$ tree -L 1
.
├── bin
├── BSDmakefile
├── build_dir
├── config
├── Config.in
├── COPYING
├── dl
├── feeds
├── feeds.conf.default
├── include
├── key-build
├── key-build.pub
├── key-build.ucert
├── key-build.ucert.revoke
├── LICENSES
├── Makefile
├── package
├── README.md
├── rules.mk
├── scripts
├── staging_dir
├── target
├── tmp
├── toolchain
└── tools

14 directories, 11 files

```



### Buildroot系统

buildroot系统是一套基于Makefile管理的构建系统框架

* buildroot-2023.2:  https://github.com/DongshanPI/buildroot-external-tinyvision

``` ba
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ tree -L 1
.
├── arch
├── board
├── boot
├── CHANGES
├── Config.in
├── Config.in.legacy
├── configs
├── COPYING
├── defconfig
├── DEVELOPERS
├── dl
├── docs
├── fs
├── linux
├── Makefile
├── Makefile.legacy
├── output
├── package
├── README
├── support
├── system
├── toolchain
└── utils

15 directories, 9 files
ubuntu@ubuntu1804:~/buildroot-2023.02.8$ 
```

## 手册文档工具
### TinyVision 相关文档手册
- 电路原理图：https://github.com/YuzukiHD/TinyVision/tree/main/docs/hardware/TinyVision/schematic
- 3D 结构：https://github.com/YuzukiHD/TinyVision/tree/main/docs/hardware/TinyVision/3d
- BOM：https://github.com/YuzukiHD/TinyVision/tree/main/docs/hardware/TinyVision/bom
- Gerber：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/gerber/Gerber_PCB1_2023-11-13.zip
- V851 简述：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/V851S_Brief_CN_V1.0.pdf
- V851se 手册：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/V851SX_Datasheet_V1.2.pdf
- V851se 引脚定义：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/V851SE_PINOUT_V1.0.xlsx
- V851 原厂参考设计：https://github.com/YuzukiHD/TinyVision/tree/main/docs/hardware/TinyVision/datasheet/ReferenceDesign
- 主电源芯片：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/MPS-MP2122.pdf
- 3V3 电源芯片：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/Aerosemi-MT3520B.pdf
- CSI 接口电源 LDO：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/JSCJ-CJ6211BxxF.pdf
- SDNAND 存储芯片：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/CS-SEMI-CSNP1GCR01-BOW.pdf
- TF 卡槽：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision/datasheet/MUP-M617-2.pdf

### TinyVision WIFI 相关手册文档

- 电路原理图：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision-WIFI/schematic/SCH_TinyVision-WIFI_2023-11-18.pdf
- 3D 结构：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision-WIFI/3d/3D_PCB4_2023-11-18.zip
- Gerber：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision-WIFI/gerber/Gerber_PCB4_2023-11-18.zip
- XR829 芯片简述：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision-WIFI/datasheet/XR829_Brief.pdf
- XR829 芯片手册：https://github.com/YuzukiHD/TinyVision/blob/main/docs/hardware/TinyVision-WIFI/datasheet/XR829_Datasheet.pdf

### TinyVision开发相关工具

- 线刷工具[Windows/Linux]：https://github.com/YuzukiHD/TinyVision/blob/main/docs/tools/AllwinnertechPhoeniSuitRelease20230905.zip
- ISP 调试工具[Windows]：https://github.com/YuzukiHD/TinyVision/blob/main/docs/tools/TigerISPv4.2.2.7z
- WIFI 性能测试工具[Linux/Android]：https://github.com/YuzukiHD/TinyVision/blob/main/docs/tools/xradio_wlan_rf_test_tools_v2.0.9-p1.zip
- BT 性能测试工具[Linux]：https://github.com/YuzukiHD/TinyVision/blob/main/docs/tools/xradio_bt_rf_test_tools_v1.2.2.zip
- WIFI 晶振频偏发射功率修改工具[Windows]：https://github.com/YuzukiHD/TinyVision/blob/main/docs/tools/xradio_sdd_editor_ex_v2.7.210115a-p1.zip
![TinyVision_Pinout](https://photos.100ask.net/dongshanpi/TinyVision/image-20231118144837348.png)
![TinyVision_Pinout](https://photos.100ask.net/dongshanpi/TinyVision/image-20231118145056447.png)
![TinyVision_Pinout](https://photos.100ask.net/dongshanpi/TinyVision/image-20231118145333944.png)

