---
sidebar_position: 3
---
# Linux 5.15 内核驱动移植

### Linux 5.15 内核驱动

下载驱动后获得驱动的 `tar.gz` 压缩包

![image-20240115145222134](images/image-20240115145222134-172024602066714.png)

解压后找到如下驱动与文件夹

![image-20240115145406939](images/image-20240115145406939-172024602488416.png)

由于 Linux 5.15 需要保证内核的主线化，不可将非主线的第三方驱动放置于内核文件夹中，所以将驱动放置于 `bsp` 文件夹中。

进入`bsp`，找到 `bsp/drivers/net/wireless` 文件夹中，新建文件夹`aic8800` 并且把上面的驱动与文件夹放入刚刚创建好的 `aic8800` 中。

![image-20240115161401833](images/image-20240115161401833.png)

修改 `bsp/drivers/net/wireless/Kconfig` ，增加一行

```c
source "bsp/drivers/net/wireless/aic8800/Kconfig"
```

![image-20240115163522102](images/image-20240115163522102.png)

修改 `bsp/drivers/net/wireless/Makefile` ，增加一行

```c
obj-$(CONFIG_AIC_WLAN_SUPPORT) += aic8800/
```

![image-20240115145650592](images/image-20240115145650592-172024603467020.png)

 修改 `bsp/drivers/net/wireless/aic8800/Kconfig`，修改为 `bsp` 的索引

![image-20240115163428151](images/image-20240115163428151.png)

```
if AIC_WLAN_SUPPORT
source "bsp/drivers/net/wireless/aic8800/aic8800_fdrv/Kconfig"
source "bsp/drivers/net/wireless/aic8800/aic8800_btlpm/Kconfig"
endif

if AIC_INTF_USB
source "bsp/drivers/net/wireless/aic8800/aic8800_btusb/Kconfig"
endif
```

进入内核配置页，找到并勾选如下选项。

```
[*] Networking support  --->
	<*>   Bluetooth subsystem support  --->
		[*]   Bluetooth Classic (BR/EDR) features (NEW)
		<*>     RFCOMM protocol support
		[*]       RFCOMM TTY support
		[*]   Bluetooth Low Energy (LE) features
		[*]   Export Bluetooth internals in debugfs
			  Bluetooth device drivers  --->
				  <*> HCI UART driver
				  [*]   UART (H4) protocol support
	-*-   Wireless  --->
		<*>   cfg80211 - wireless configuration API
		[ ]     nl80211 testmode command
		[ ]     enable developer warnings
		[ ]     cfg80211 certification onus
		[*]     enable powersave by default
		[ ]     cfg80211 DebugFS entries
		[*]     support CRDA
		[*]     cfg80211 wireless extensions compatibility 
		<*>   Generic IEEE 802.11 Networking Stack (mac80211)
	<*>   RF switch subsystem support  --->
		[*]   RF switch input support
		<*>   GPIO RFKILL driver

Device Drivers  --->
	Network device support  --->
		[*]   Wireless LAN  --->
			[*]   AIC wireless Support
				  Enable Chip Interface (SDIO interface support)  --->
			<M>   AIC8800 wlan Support
			<M>   AIC8800 bluetooth Support (UART)
	Misc Devices Drivers  --->
		<*> Allwinner rfkill driver
		<*> Allwinner Network MAC Addess Manager
```

### Linux 5.15 内核设备树

```
&rfkill {
	compatible = "allwinner,sunxi-rfkill";
	chip_en;
	power_en;
	pinctrl-0;
	pinctrl-names;
	status = "okay";

	/* wlan session */
	wlan {
		compatible    = "allwinner,sunxi-wlan";
		wlan_busnum   = <0x1>;
		wlan_regon    = <&pio PE 6 GPIO_ACTIVE_HIGH>;
		wlan_hostwake = <&pio PE 7 GPIO_ACTIVE_HIGH>;
		wakeup-source;
	};

	/* bt session */
	bt {
		compatible    = "allwinner,sunxi-bt";
		bt_rst_n      = <&pio PE 8 GPIO_ACTIVE_LOW>;
	};
};

&addr_mgt {
	compatible     = "allwinner,sunxi-addr_mgt";
	type_addr_wifi = <0x0>;
	type_addr_bt   = <0x0>;
	type_addr_eth  = <0x0>;
	status         = "okay";
};

&btlpm {
	compatible  = "allwinner,sunxi-btlpm";
	uart_index  = <0x2>;
	bt_wake     = <&pio PE 9 GPIO_ACTIVE_HIGH>;
	bt_hostwake = <&pio PE 10 GPIO_ACTIVE_HIGH>; /* unused */
	wakeup-source;
	status      = "okay";
};
```

编译时可以看到生成的对应的 ko 模块

![image-20240115164630796](images/image-20240115164630796.png)

### 测试

由于 Linux 5.15 不绑定 Tina，所以这里直接使用现成的 `debian rootfs` 来做测试。

使用上面编译出来的内核与ko驱动，并且将固件放置于 rootfs 对应的 `/lib/firmware/` 文件夹中