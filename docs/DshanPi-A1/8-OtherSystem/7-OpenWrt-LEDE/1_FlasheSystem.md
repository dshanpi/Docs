---
sidebar_position: 2
---
# 烧录系统

本章节将讲解如何把我们提供的 OpenWrt 系统镜像烧录至 EMMC/TF卡启动。

## 烧录系统至EMMC

烧录系统镜像，除了dshanpi-a1板子，还需要准备 **TypeC-3.2 10Gbps速率USB线 、30W PD电源适配器** （建议韦东山店铺购买，其他的没测试）。安装后如下所示：

| TypeC-3.2 10Gbps速率USB线：                                  | 30W PD电源适配器：                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image-20251013102017500](1_FlasheMMC.assets\image-20251013102017500.png) | ![image-20251013102118065](1_FlasheMMC.assets\image-20251013102118065.png) |

### 1. 软件下载

软件上，我们需要在 PC 端下载 **系统镜像、烧录工具和驱动安装工具包** 。下载链接如下：

> 按住 `ctrl` 键，鼠标 `左键` 点击链接，即可一键下载

- **OpenWrt 系统镜像：** [DshanPi-A1_OpenWrt_Image](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/openwrt-rockchip-armv8-100ask_dshanpia1-squashfs-sysupgrade.7z)
- **烧录工具 RKDevTool：**  [RKDevTool_Release_v3.32.zip](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip)
- **驱动安装工具包 DriverAssitant：** [DriverAssitant_v5.1.1.zip](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip)
- **DshanPi-A1 引导固件：** [rk3576_spl_loader_v1.09.107.bin](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin)

### 2. 烧录驱动安装

在烧录之前，我们需要先安装烧录驱动，在前面下载的资料里找到驱动安装工具包 **`DriverAssitant_vxxx`** ，打开启动下载程序 **`DriverInstall.exe`** ，点击驱动安装即，如下：

> 如果之前安装过了，这里可以选择跳过。

![image-20250815172019920](images/image-20250815172019920.png)

### 4. 系统镜像烧录

准备工作完成后，

① 接上 **usb3.0 otg** 线（数据线另一端接电脑的 USB3.0 蓝色接口），

② 按住 **`MASKROM`** 按键，**先不松开** ，

③ 再接上电源，dshanpi-a1 就会进入 **`MASKROM`** 烧录模式。参照下图操作：

![image-20250815154004776](images/image-20250815154004776.png)

### 5. 运行烧录工具

打开烧录工具 ，参考下图配置烧录工具：

![image-20250821092501879](images/image-20250821092501879.png)

- ① 勾上前两个选项；
- ② 第二个选项设置为 **`EMMC`** ；
- ③ 地址默认都设置为 **`0x00000000`** ；
- ④ 名字照着上图设置；
- ⑤ Loader的路径设置为前面我们下载的引导固件 **`rk3576_spl_loader_v1.09.107.bin`** ；
- ⑥ Systerm的路径设置为前面我们下载的系统镜像 **`openWrt_xxx.img`** ；
- ⑦ 勾上强制按地址写；
- ⑧ 点击执行（一定要显示为 **MASKROM** 模型才可以烧录）。

开始烧录后，需要给点耐心，等待烧录工具右下角出现 **下载完成** ，即表明烧录完成。

![image-20250908180142142](images/image-20250908180142142.png)

### 6. 启动logs

烧录完成后，会自行启动系统，串口终端如下，按下回车后自动进入系统：

注意：串口波特率是 1.5M 

![image-20250908180559252](images/image-20250908180559252.png)

## 烧录系统至TF卡

进行烧录操作前，请准备以下硬件设备：

1. **DshanPi-A1 主板**：主板支持TF卡启动系统 EMMC启动系统，如果板载EMMC，同时接入了TF卡，上电后，会优先从TF卡启动系统。

2. **至少8GB Class10卡**：推荐使用闪迪的 红卡 至少8GB以上，建议32GB存储为最佳。不影响后续其他实验开发。

   

   ![image-20251225160750874](./images/image-20251225160750874-1b8ddc1eb8b85298db3dd13e55d372a4.png)

3. **TF卡读卡器**：烧写固件使用。![image-20251225160722092](./images/image-20251225160722092-21024699139e7df503feb6152fb1c94c.png)

4. **电源适配器**：推荐使用 30W PD 电源适配器，确保供电稳定。



### 系统选择

访问 [/docs/DshanPi-A1/QuickStart/ResourceAcquisition](https://wiki.dshanpi.org/docs/DshanPi-A1/QuickStart/ResourceAcquisition) 页面选择对应的系统镜像，请提前下载下来，并解压。

| 系统名称    | 版本 | 默认账户 (用户/密码) | 镜像下载                                                     | 引导固件                                                     |
| :---------- | :--- | :------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| **OpenWrt** | V1.0 | `root` / `password`  | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/openwrt-lede/openwrt-rockchip-armv8-100ask_dshanpia1-squashfs-sysupgrade.img.gz) | [下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |

###  烧写工具下载

访问 https://etcher.balena.io/ 下载镜像烧写工具。

![image-20251225154517963](./images/image-20251225154517963-a4cd2bf8437dae336a5899dcf3fa7c7e.png)

下载后需要安装，安装完成后找到 balenaEtcher 图标，windows下以右键管理员运行。

![image-20251225154802283](./images/image-20251225154802283-7717fa92b2e336bc4c492cf7cbaa585c.png)

打开软件后，界面如下。

![image-20251225155456589](./images/image-20251225155456589-b9a3431363de2ef9706f2787a983c64f.png)

### 烧写系统

选择解压后的系统镜像，将TF卡插入读卡器后，接到电脑USB接口。

![image-20251225154834665](./images/image-20251225154834665-f092f5fe05665eb1f8e2ae18534d2d30.png)

![image-20251225160959307](./images/image-20251225160959307-0f5dc18d7983a63772567f6d228db6ce.png)

![image-20251225163929116](./images/image-20251225163929116-fb84db6f12ea2a6e40e530d4c109f944.png)

![image-20251225163944506](./images/image-20251225163944506-2f01c097cc2829d6d42b6cc509584f06.png)

![image-20251225164016672](./images/image-20251225164016672-1b23df6d08defe55e32794db3318904a.png)

![image-20251225170929577](./images/image-20251225170929577-33d8e5eef6e1efa2fae6da36512668c1.png)

### 插卡启动
烧写完成后，将TF卡取下，参考下图红框位置，将卡插入A1板背面TF卡槽，然后通电启动，会自动从TF卡启动系统。

![image-20251225171011233](./images/image-20251225171011233-ac606dc1b5ca833b30037a6369148ef4.png)

### 系统启动

烧录完成后，会自行启动系统，串口终端如下，按下回车后自动进入系统：

注意：串口波特率是 1.5M 

![image-20250908180559252](images/image-20250908180559252.png)

## 初次启动设置

### 访问路由后台

1. 参考下图所示，不同的网口对应不同的功能，刷写系统完成后，请先将网线连接至 红色①所示 LAN口，此时通过电脑浏览器访问http://192.168.1.1/ 即可打开此系统的默认登录界面

![image-20251013102606227](1_FlasheMMC.assets\image-20251013102606227.png)

浏览器有如下页面： 默认用户名 root 默认密码password 

![image-20251013103555937](1_FlasheMMC.assets\image-20251013103555937.png)

如果你的默认上层光猫/路由的IP地址范围是192.168.1.x 那么openwrt系统会自动跳转到192.168.100.1 用于区分不同的路由网关登录地址。

![image-20251013103854924](1_FlasheMMC.assets\image-20251013103854924.png)



登录路由器后，可以看到如下首页，根据自己需要设置对应的连接方式。

![image-20251013101929334](1_FlasheMMC.assets\image-20251013101929334.png)

对于常规家庭网络环境，上层都是运营商送的 光猫路由器 设备，我们只需要设置为 连接现有路由器即可。如下所示已经正常获取到IP地址等。

![image-20251013104813806](1_FlasheMMC.assets\image-20251013104813806.png)



### 开启WiFi 热点

如果需要使用配套的WiFi模组作为WIFI热点使用，则需要参考如下步骤，配置无线，点击 网络--> 无线，找到右侧识别出来的 设备，红色② 的编辑按钮，配置WiFi热点信息。

![image-20251015112028863](1_FlasheMMC.assets\image-20251015112028863.png)

如下所示，一定要把WiFi设备的 工作频率设置为如下红框一致的模式 带宽 信道 通道宽度，如果配置不一致会导致WiFi无法作为AP热点使用。

![image-20251015111947435](1_FlasheMMC.assets\image-20251015111947435.png)

设置完成后，可以保存，自动会复位，等待约30秒，手机WiFi就可以扫到对应的无线设备，连接即可。

## 常见问题与解决方案

- **问题：执行烧录操作后烧录工具没有显示MASKROM设备？**
  - **解决方案：** 检查设备管理器是否出现以下设备，烧录驱动是否安装，如果安装了，插拔一下 usb3.0 otg 接口的数据线或者重启电脑。

![image-20250815174333674](images/image-20250815174333674.png)
