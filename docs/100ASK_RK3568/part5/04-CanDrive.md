---
sidebar_position: 4
---
# Can开发指南

### 1. CAN 驱动

#### 1.1 驱动文件

驱动文件所在位置:
`drivers/net/can/rockchip/rockchip_can.c`

#### 1.2 DTS 节点配置

主要参数:

- `interrupts = <GIC_SPI 100 IRQ_TYPE_LEVEL_HIGH>`;
  转换完成，产生中断信号。

- `clock`

  ```bash
  assigned-clocks = <&cru CLK_CAN>;
  assigned-clock-rates = <200000000>;
  clocks = <&cru CLK_CAN>, <&cru PCLK_CAN>;
  clock-names = "baudclk", "apb_pclk";
  ```

  时钟频率可以修改，如果 CAN 的比特率 1M 建议修改 CAN 时钟到 300M，信号更稳定。低于 1M 比特率的，时钟设置 200M 就可以。

- `pinctrl`

```bash
&can {
    pinctrl - names = "default";
    pinctrl - 0 = <&canm0_pins>;
    status = "okay";
};
```

配置 can_h 和 can_l 的 iomux 作为 can 功能使用。

#### 1.3 内核配置

~~~bash
Symbol: CAN_ROCKCHIP [=y]
| Type : tristate
| Prompt: Rockchip CAN controller	
| 	Location:		
| 		-> Networking support (NET [=y])
| 			-> CAN bus subsystem support (CAN [=y])
| 				-> CAN Device Drivers
| 					-> Platform CAN drivers with Netlink support (CAN_DEV [=y])	
| Defined at drivers/net/can/rockchip/Kconfig:1
| Depends on: NET [=y] && CAN [=y] && CAN_DEV [=y] && ARCH_ROCKCHIP [=y]
~~~

#### 1.4 CAN 通信测试工具

canutils 是常用的 CAN 通信测试工具包，内含 5 个独立的程序:canconfig、candump、canecho、cansend、cansequence。这几个程序的功能简述如下:

- `canconfig`
  用于配置 CAN 总线接口的参数，主要是波特率和模式。

- `candump`
  从 CAN 总线接口接收数据并以十六进制形式打印到标准输出，也可以输出到指定文件。

- `canecho`
  把从 CAN 总线接口接收到的所有数据重新发送到 CAN 总线接口。

- `cansend`
  往指定的 CAN 总线接口发送指定的数据。

- `cansequence`
  往指定的 CAN 总线接口自动重复递增数字，也可以指定接收模式并校验检查接收的递增数字。

- `ip`
  CAN 波特率、功能等配置。
  注意:busybox 里也有集成了 ip 工具，但 busybox 里的是阉割版本。不支持 CAN 的操作。故使用前请先确定 ip 命令的版本 (iproute2)
  上面工具包，网络上都有详细的编译说明。如果是自己编译 buildroot，直接开启宏就可以支持上述工具包:

  ```bash
  BR2_PACKAGE_CAN_UTILS = Y 
  BR2_PACKAGE_IPROUTE2 = y
  ```


#### 1.5 CAN 常用命令接口

1. 查询当前网络设备:
   `ifconfig -a`

2. CAN 启动:

   关闭 CAN:
   `ip link set can0 down`

   设置比特率 500KHz:
   `ip link set can0 type can bitrate 500000`

   打印 can0 信息:
   `ip -details link show can0`

   启动 CAN:
   `ip link set can0 up`

3. CAN 发送:

   发送 (标准帧，数据帧，ID:123，date:DEADBEEF):
   `cansend can0 123#DEADBEEF`

   发送 (标准帧，远程帧，ID:123):
   `cansend can0 123#R`

   发送 (扩展帧，数据帧，ID:00000123，date:DEADBEEF):
   `cansend can0 00000123#12345678`

   发送 (扩展帧，远程帧，ID:00000123):
   `cansend can0 00000123#R`

4. CAN 接收:
   开启打印，等待接收:
   `candump can0`