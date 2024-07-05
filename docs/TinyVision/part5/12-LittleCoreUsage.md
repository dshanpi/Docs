---
sidebar_position: 12
---
# 小核使用

### 小核使用 UART 输出 console

首先配置小核的 `PINMUX` 编辑文件 `rtos/rtos/source/projects/v851-e907-lizard/configs/sys_config.fex` 这里使用 `UART3` , 引脚为`PE12`, `PE13` , `mux` 为 7

```
[uart3]
uart_tx         = port:PE12<7><1><default><default>
uart_rx         = port:PE13<7><1><default><default>
```

然后配置使用 `uart3` 作为输出，运行 `make menuconfig` 居进入配置

```
 Kernel Setup  --->
 	Drivers Setup  --->
 		Melis Source Support  --->
 			[*] Support Serial Driver
 		SoC HAL Drivers  --->
 			Common Option  --->
 				[*] enable sysconfig                // 启用读取解析 sys_config.fex 功能
 			UART Devices  --->
 				[*] enable uart driver              // 启用驱动
 				[*]   support uart3 device          // 使用 uart3
 				(3)   cli uart port number          // cli 配置到 uart3
 Subsystem support  --->
 	devicetree support  --->
 		[*] support traditional fex configuration method parser. // 启用 sys_config.fex 解析器
```

到 `linux` 中配置设备树，将设备树配置相应的引脚与 `mux`

![2](assets/post/README/2.png)

如果设备树不做配置引脚和 `mux`，kernel会很贴心的帮你把没使用的 Pin 设置 `io_disable` 。由于使用的是 `iommu` 操作   `UART`  设备，会导致 `io`  不可使用。如下所示。

![4BBXHRX](assets/post/README/4BBXHRX.png)

![222](assets/post/README/222.png)

此外，还需要将 `uart3` 的节点配置 `disable`，否则 `kernel` 会优先占用此设备。

```
&uart3 {
        pinctrl-names = "default", "sleep";
        pinctrl-0 = <&uart3_pins_active>;
        pinctrl-1 = <&uart3_pins_sleep>;
        status = "disabled";
};
```

如果配置 `okay` 会出现以下提示。

```
uart: create mailbox fail
uart: irq for uart3 already enabled
uart: create mailbox fail
```

启动小核固件后就可以看到输出了

![image-20230215131216802](assets/post/README/image-20230215131216802.png)
