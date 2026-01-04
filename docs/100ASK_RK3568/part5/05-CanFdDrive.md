---
sidebar_position: 5
---
# Can FD开发指南

## 1.Can FD 驱动

### 1.1 驱动文件

驱动文件所在位置:
`drivers/net/can/rockchip/rockchip_canfd.c`

### 1.2 DTS 节点配置

主要参数:

- `interrupts = <GIC_SPI 1 IRQ_TYPE_LEVEL_HIGH>;`
  转换完成，产生中断信号｡
- `clock`

```bash
clocks = <&cru CLK_CAN1>, <&cru PCLK_CAN1>;
clock-names = "baudclk", "apb_pclk";
resets = <&cru SRST_CAN1>, <&cru SRST_P_CAN1>;
reset-names = "can", "can-apb";
```

时钟属性，用于驱动开关 clk;reset 属性，用于每次复位总线｡

- `pinctrl`

```bash
&can1 {
    assigned-clocks = <&cru CLK_CAN1>;
    assigned-clock-rates = <200000000>;
    pinctrl-names = "default";
    pinctrl-0 = <&can1m1_pins>;
    status = "okay";
};
```

时钟频率可以修改，如果 CAN 的比特率低于等于 3M 建议修改 CAN 时钟到 100M, 信号更稳定｡高于 3M 比特率的，时钟设置 200M 就可以｡

配置`can_h`和`can_l`的`iomux`作为`can`功能使用｡

### 1.3 内核配置

```bash
Symbol: CANFD_ROCKCHIP [=y]						
| Type : tristate					
| Prompt: Rockchip CANFD controller			
| Location:
| -> Networking support (NET [=y])				
| -> CAN bus subsystem support (CAN [=y])	
| -> CAN Device Drivers		
| -> Platform CAN drivers with Netlink support (CAN_DEV [=y])	
| Defined at drivers/net/can/rockchip/Kconfig:10			
| Depends on: NET [=y] && CAN [=y] && CAN_DEV [=y] && ARCH_ROCKCHIP [=y]
```

### 1.4 CAN FD 通信测试工具

`canutils`是常用的 CAN 通信测试工具包，内含 5 个独立的程序:`canconfig`、`candump`、`canecho`、`cansend`、`canscqucnce`。这几个程序的功能简述如下:

- `canconfig`
  用于配置 CAN 总线接口的参数，主要是波特率和模式｡
- `candump`
  从 CAN 总线接口接收数据并以十六进制形式打印到标准输出，也可以输出到指定文件｡
- `canecho`
  把从 CAN 总线接口接收到的所有数据重新发送到 CAN 总线接口｡
- `cansend`
  往指定的 CAN 总线接口发送指定的数据｡
- `cansequence`
  往指定的 CAN 总线接口自动重复递增数字，也可以指定接收模式并校验检查接收的递增数字｡
- `ip`
  CAN 波特率、功能等配置｡

注意:busybox 里也有集成了`ip`工具，但 busybox 里的是阉割版本｡不支持 CAN 的操作｡故使用前请先确定`ip`命令的版本 (`iproute2`)

上面工具包，网络上都有详细的编译说明｡如果是自己编译`buildroot`, 直接开启宏就可以支持上述工具包:

```bash
BR2_PACKAGE_CAN_UTILS=y
BR2_PACKAGE_IPROUTE2=y
```

### 1.5 CAN FD 常用命令接口

1. 查询当前网络设备:
   `ifconfig -a`

2. CAN FD 启动:

   关闭 CAN:
   `ip link set can0 down`

   设置仲裁段 1M 波特率，数据段 3M 波特率:
   `ip link set can0 type can bitrate 1000000 dbitrate 3000000 fd on`

   打印`can0`信息:
   `ip -details link show can0`

   启动 CAN:
   `ip link set can0 up`

3. CAN FD 发送:

   发送 (标准帧，数据帧，ID:123,date:DEADBEEF):
   `cansend can0 123##1DEADBEEF`

   发送 (扩展帧，数据帧，ID:00000123,date:DEADBEEF):
   `cansend can0 00000123##1DEADBEEF`

4. CAN FD 接收:
   开启打印，等待接收:
   `candump can0`