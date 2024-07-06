---
sidebar_position: 2
---
# Linux 4.9 内核驱动移植

### Linux 4.9 BSP 内核驱动

下载驱动后获得驱动的 `tar.gz` 压缩包

![image-20240115145222134](images/image-20240115145222134.png)

解压后找到如下驱动与文件夹

![image-20240115145406939](images/image-20240115145406939.png)

进入内核，找到 `linux-4.9/drivers/net/wireless` 文件夹中，新建文件夹`aic8800` 并且把上面的驱动与文件夹放入刚刚创建好的 `aic8800` 中。

![image-20240115145530599](images/image-20240115145530599.png)

修改 `linux-4.9/drivers/net/wireless/Kconfig` ，增加一行

```c
source "drivers/net/wireless/aic8800/Kconfig"
```

![image-20240115145601334](images/image-20240115145601334.png)

修改 `linux-4.9/drivers/net/wireless/Makefile` ，增加一行

```c
obj-$(CONFIG_AIC_WLAN_SUPPORT) += aic8800/
```

![image-20240115145650592](images/image-20240115145650592.png)

进入内核配置页，找到并勾选如下选项。

```
Device Drivers  --->
	[*] Network device support  --->
		[*]   Wireless LAN  --->
			[*]   AIC wireless Support
				  Enable Chip Interface (SDIO interface support)  --->
			<M>   AIC8800 wlan Support
			<M>   AIC8800 bluetooth Support (UART)
```

![image-20240115150856511](images/image-20240115150856511.png)

编译后可以找到对应的驱动程序

![image-20240115150831849](images/image-20240115150831849.png)

其加载顺序是

```
insmod aic8800_bsp.ko
insmod aic8800_fdrv.ko
insmod aic8800_btlpm.ko
```

### Linux 4.9 BSP 内核设备树

设备树配置如下，参考电路原理图，REG_ON 为 PE6，HOSTWAKE 为 PE7

```dts
wlan: wlan@0 {
	compatible    = "allwinner,sunxi-wlan";
	pinctrl-names = "default";
	clock-names   = "32k-fanout0";
	clocks        = <&clk_fanout0>;
	wlan_busnum   = <0x1>;
	wlan_regon    = <&pio PE 6 1 0x1 0x2 0>;
	wlan_hostwake = <&pio PE 7 14 0x1 0x2 0>;
	chip_en;
	power_en;
	status        = "okay";
	wakeup-source;
};
```

![image-20240115151211548](images/image-20240115151211548.png)

### Tina SDK 移植

Tina SDK 基于OpenWrt 提供了一些自动化方案，可以参考 OpenWrt 的方法来移植这些驱动。

#### WIFI 固件移植

下载得到 `aic8800-firmware.tar.gz` 这里面包含着 WIFI 使用的固件

!> 注意，如果您的WIFI模块是 AIC8800D80 请下载 AIC8800D80 的固件（2024年4月后 WIFI 模块均升级为 AIC8800D80 模块）

![image-20240115151604351](images/image-20240115151604351.png)

解压后拷贝到 `openwrt/openwrt/package/firmware/linux-firmware/aic8800` 即可（Tina 5.0已经内置，客服给的4.0才需要这样）

![image-20240115151709361](images/image-20240115151709361.png)

然后找到 `target/allwinner/v851se-common/modules.mk` 文件，在末尾添加如下内容

```makefile
define KernelPackage/net-aic8800
  SUBMENU:=$(WIRELESS_MENU)
  TITLE:=aic8800 support (staging)
  DEPENDS:=+@IPV6 +@USES_AICSEMI
  KCONFIG:=\
    CONFIG_AIC8800_BTLPM_SUPPORT=m \
    CONFIG_AIC8800_WLAN_SUPPORT=m \
    CONFIG_AIC_WLAN_SUPPORT=m \
    CONFIG_PM=y \
    CONFIG_RFKILL=y \
    CONFIG_RFKILL_PM=y \
    CONFIG_RFKILL_GPIO=y

  FILES+=$(LINUX_DIR)/drivers/net/wireless/aic8800/aic8800_bsp/aic8800_bsp.ko
  FILES+=$(LINUX_DIR)/drivers/net/wireless/aic8800/aic8800_btlpm/aic8800_btlpm.ko
  FILES+=$(LINUX_DIR)/drivers/net/wireless/aic8800/aic8800_fdrv/aic8800_fdrv.ko
  AUTOLOAD:=$(call AutoProbe,aic8800_bsp aic8800_btlpm aic8800_fdrv)
endef

define KernelPackage/net-aic8800/description
 Kernel modules for aic8800 support
endef

$(eval $(call KernelPackage,net-aic8800))
```

通过这些内容可以使 Tina 自动去内核文件夹将 ko 打包进文件系统。

![image-20240115151917530](images/image-20240115151917530.png)

#### 配置自动装载模块

修改文件：`target/allwinner/v851se-tinyvision/busybox-init-base-files/etc/init.d/rc.modules` 增加如下内容，每次开机的时候就会自动装载模块

```c
#!/bin/sh
insmod /lib/modules/4.9.191/aic8800_bsp.ko
insmod /lib/modules/4.9.191/aic8800_fdrv.ko
insmod /lib/modules/4.9.191/aic8800_btlpm.ko
```

#### 配置网络进程

新建文件 `target/allwinner/v851se-tinyvision/busybox-init-base-files/etc/init.d/S50wifidaemon` 写入如下内容，每次开机装载模块后便初始化WIFI和配置WIFI模式

```
#!/bin/sh
#
# Start wifi_daemon....
#

start() {
      printf "Starting wifi_daemon....: "
	  wifi_daemon
	  sleep 2
	  wifi -o sta
}

stop() {
	printf "Stopping wifi_daemon: "
}

case "$1" in
    start)
	start
	;;
    stop)
	stop
	;;
    restart|reload)
	stop
	start
	;;
  *)
	echo "Usage: $0 {start|stop|restart}"
	exit 1
esac

exit $?
```

#### 配置 WIFI 固件

进入 Tina 配置页面，打开如下功能

```
Allwinner  --->
	Wireless  --->
		<*> wifimanager-v2.0................................... Tina wifimanager-v2.0
		-*- wirelesscommon............................. Allwinner Wi-Fi/BT Public lib

Firmware  ---> 
	<*> aic8800-firmware.................................... AIC aic8800 firmware

Kernel modules  --->
	Wireless Drivers  --->
		<*> kmod-net-aic8800............................... aic8800 support (staging)
```

### 测试

上电启动，可以看到 LOG 正常挂载 WIFI

![image-20240115152521341](images/image-20240115152521341.png)

可以看到正常初始化进程

![image-20240115152554437](images/image-20240115152554437.png)
