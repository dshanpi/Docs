---
sidebar_position: 2
---
# UART开发指南

## 1.功能特点

Rockchip UART (Universal Asynchronous Receiver/Transmitter) 基于 16550A 串口标准，完整模块支持以下功能:

- 支持 5､6､7､8 bits 数据位｡
- 支持 1､1.5､2 bits 停止位｡
- 支持奇校验和偶校验，不支持 mark 校验和 space 校验｡
- 支持接收 FIFO 和发送 FIFO, 一般为 32 字节或者 64 字节｡
- 支持最高 4M 波特率，实际支持波特率需要芯片时钟分频策略配合｡
- 支持中断传输模式和 DMA 传输模式｡
- 支持硬件自动流控，RTS+CTS｡

注意，实际芯片中的 UART 支持的功能请以芯片手册中 UART 章节的描述为准，部分 UART 功能会进行适当裁剪｡

## 2.作为普通串口

### 2.1 驱动路径

在 Linux kernel 3.10 中，使用以下驱动文件:

```
drivers/tty/serial/rk_serial.c
```

在 Linux kernel 4.4 和 Linux kernel 4.19 中，使用 8250 串口通用驱动，以下为主要驱动文件:

```
drivers/tty/serial/8250/8250_core.c # 8250 串口驱动核心
drivers/tty/serial/8250/8250_dw.c # Synopsis DesignWare 8250 串口驱动
drivers/tty/serial/8250/8250_dma.c # 8250 串口 DMA 驱动
drivers/tty/serial/8250/8250_port.c # 8250 串口端口操作
drivers/tty/serial/8250/8250_early.c # 8250 串口 early console 驱动
```

### 2.2 menuconfig 配置

在不同版本的 Linux kernel 中，UART 相关的 menuconfig 配置均在以下路径选项，选项说明十分详细，这里不再展开:

```
Device Drivers --->
	Character devices
		Serial drivers --->
```

建议使用 Rockchip SDK 中提供的 UART 默认配置｡

### 2.3 dts 配置

在不同版本的 Linux kernel 中，UART 的 dts 配置均与以下典型配置类似｡以下典型配置以 Linux kernel 4.19 RK3568 芯片为例，在 rk3568.dtsi 中:

```plaintext
uart1: serial@fe650000 {
    compatible = "rockchip,rk3568-uart", "snps,dw-apb-uart";
    reg = <0x0 0xfe650000 0x0 0x100>;
    interrupts = <GIC_SPI 117 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru SCLK_UART1>, <&cru PCLK_UART1>;
    clock-names = "baudclk", "apb_pclk";
    reg-shift = <2>;
    reg-io-width = <4>;
    dmas = <&dmac0 2>, <&dmac0 3>;
    dma-names = "tx", "rx";
    pinctrl-names = "default";
    pinctrl-0 = <&uart1m0_xfer>;
    status = "disabled";
};
```

UART 的板级 dts 配置只有以下参数允许修改:

- dma-names:  
  - "tx" 打开 tx dma 
  - "rx" 打开 rx dma 
  - "!tx" 关闭 tx dma 
  - "!rx" 关闭 rx dma

- pinctrl-0: 
  - &uart1m0_xfer 配置 tx 和 rx 引脚为 iomux group 0 
  - &uart1m1_xfer 配置 tx 和 rx 引脚为 iomux group 1 
  - &uart1m0_ctsn 和 & uart1m0_rtsn 配置硬件自动流控 cts 和 rts 引脚为 iomux group 0 
  - &uart1m1_ctsn 和 & uart1m1_rtsn 配置硬件自动流控 cts 和 rts 引脚为 iomux group 1

- status: 
  - "okay" 打开 
  - "disabled" 关闭


例如，打开 RK3568 UART1, 打开 dma, 配置打开了硬件自动流控的 UART1 的 tx、rx、cts、rts 的 iomux 为 group0, 在板级 dts 里的配置如下:

```plaintext
&uart1 {
    dma-names = "tx", "rx";
    pinctrl-names = "default";
    pinctrl-0 = <&uart1m0_xfer &uart1m0_ctsn &uart1m0_rtsn>;
    status = "okay";
};
```

需要注意，参数 pinctrl - 0 中对于硬件自动流控的操作仅仅是配置引脚 iomux, 实际使能硬件自动流控的操作在 UART 驱动中，如果不需要使用硬件自动流控，cts 和 rts 引脚的 iomux 配置可以去掉｡

### 2.4 波特率配置

UART 波特率 = 工作时钟源 / 内部分频系数 / 16｡当工作时钟源由 24M 晶振直接提供时，UART 将使用内部分频系数得到需要的波特率｡当工作时钟源由 CRU 模块通过 PLL 分频提供时，UART 波特率一般为工作时钟源的 1/16｡UART 实际允许配置的波特率和此波特率下数据传输的稳定性在软件上主要由 UART 工作时钟分频策略决定｡

目前，UART 驱动会根据配置的波特率大小自动去获取需要的工作时钟频率，可以通过以下命令查询到 UART 工作时钟频率:

```
cat /sys/kernel/debug/clk/clk_summary | grep uart
```

Rockchip UART 对常用的波特率，如 115200､460800､921600､1500000､3000000､4000000 等确保稳定支持｡对于一些特殊的波特率，可能需要修改工作时钟分频策略才能支持｡

### 2.5 使用 DMA

UART 使用 DMA 传输模式只有在数据量很大时才会产生较为明显的减轻 CPU 负载的效果｡一般情况下，和使用中断传输模式相比，UART 使用 DMA 传输模式并不一定能提高数据传输速度｡一方面，现在 CPU 性能都很高，传输瓶颈在外设｡另一方面，启动 DMA 需要消耗额外的资源，并且由于 UART 数据存在长度不确定的特性，会使 DMA 传输效率下降｡

因此，建议一般情况下使用默认中断传输模式，会有以下打印:

```
failed to request DMA, use interrupt mode
```

在 DMA 通道资源紧张的使用场景下，可以考虑关掉 TX 的 DMA 传输，会有以下打印:

```
got rx dma channels only
```

### 2.6 使用硬件自动流控

UART 使用硬件自动流控时，需要确保 UART 驱动使能硬件自动流控功能，且在 dts 中已经切换 cts 和 rts 流控引脚的 iomux｡建议在高波特率 (1.5M 波特率及以上)､大数据量的场景下都使用硬件自动流控，即使用四线 UART｡

### 2.7 使用串口唤醒系统

串口唤醒系统功能是在系统待机时串口保持打开，并且把串口中断设置为唤醒源｡使用时需要在 dts 中增加以下参数:

```plaintext
&uart1 {
    wakeup-source;
};
```

注意，串口唤醒系统需要同时修改 trust 固件，请联系 Rockchip 以获取支持｡

### 2.8 设备注册

在 dts 中使能 UART 后，能在系统启动的 log 中看到以下对应的打印，表示设备正常注册:

```
fe650000.serial: ttyS1 at MMIO 0xfe650000 (irq = 67, base_baud = 1500000) is a 16550A
```

普通串口设备将会根据 dts 中的 aliase 来对串口进行编号，对应注册成 ttySx 设备｡dts 中的 aliases 如下:

```plaintext
aliases {
    serial0 = &uart0;
    serial1 = &uart1;
    serial2 = &uart2;
    serial3 = &uart3;
    ......
}
```

如果需要把 uart3 注册成 ttyS1, 可以进行以下修改:

```plaintext
aliases {
    serial0 = &uart0;
    serial1 = &uart3;
    serial2 = &uart2;
    serial3 = &uart1;
    ......
}
```

## 3.作为控制台

### 3.1 驱动路径

Rockchip UART 作为控制台，使用 fiq_debugger 流程｡Rockchip SDK 一般会将 uart2 配置为 ttyFIQ0 设备｡使用以下驱动文件:

```
drivers/staging/android/fiq_debugger/fiq_debugger.c # 驱动文件
drivers/soc/rockchip/rk_fiq_debugger.c 				# kernel 4.4 及之后的平台实现
arch/arm/mach-rockchip/rk_fiq_debugger.c 			# kernel 3.10 平台实现
```

### 3.2 menuconfig 配置

在不同版本的 Linux kernel 中，fiq_debugger 相关的 menuconfig 配置均在以下路径选项:

```
Device Drivers --->
	[*] Staging drivers --->
		Android --->
```

建议使用 Rockchip SDK 默认配置｡

### 3.3 dts 配置

以 Linux kernel 4.19 RK3568 为例，在 dts 中 fiq_debugger 节点配置如下｡由于 fiq_debugger 和普通串口互斥，在使能 fiq_debugger 节点后必须禁用对应的普通串口 uart 节点｡

```plaintext
chosen: chosen {
    bootargs = "earlycon=uart8250,mmio32,0xfe660000 console=ttyFIQ0";
};
fiq-debugger {
    compatible = "rockchip,fiq-debugger";
    rockchip,serial-id = <2>;
    rockchip,wake-irq = <0>;
    /* If enable uart uses irq instead of fiq */
    rockchip,irq-mode-enable = <1>;
    rockchip,baudrate = <1500000>; /* Only 115200 and 1500000 */
    interrupts = <GIC_SPI 252 IRQ_TYPE_LEVEL_LOW>;
    pinctrl-names = "default";
    pinctrl-0 = <&uart2m0_xfer>;
    status = "okay";
};
&uart2 {
    status = "disabled";
};
```

以下对几个参数进行说明:

- rockchip,serial - id: 使用的 UART 编号｡修改 serial-id 到不同 UART,fiq_debugger 设备也会注册成 ttyFIQ0 设备｡
- rockchip,irq-mode-enable: 配置为 1 使用 irq 中断，配置为 0 使用 fiq 中断｡
- interrupts: 配置的辅助中断，保持默认即可｡

### 3.4 parameter.txt 配置

如果使用 Linux kernel 3.10 和 Linux kernel 4.4, 需要确保在 parameter.txt 文件中有以下对于控制台的指定命令:

```
CMDLINE: console=ttyFIQ0 androidboot.console=ttyFIQ0
```

## 4.驱动调试

Rockchip UART 调试提供一个测试程序 ts_uart.uart､两个测试用文件 send_0x55 和 send_00_ff, 该程序可以向 Rockchip FAE 获取｡

通过 adb 工具将测试程序放在开发板上一个可执行的路径下，以下放在 data 路径:

```plaintext
adb root
adb remount
adb push ts_uart.uart /data
adb push send_0x55 /data
adb push send_00_ff /data
```

在开发板上修改测试程序权限:

```plaintext
su
chmod +x /data/ts_uart.uart
```

使用以下命令可以获取程序帮助:

```plaintext
console:/ #./data/ts_uart.uart
Use the following format to run the HS-UART TEST PROGRAM
ts_uart v1.1
For sending data:
./ts_uart <tx_rx(s/r)> <file_name> <baudrate> <flow_control(0/1)> <max_delay(0-100)> <random_size(0/1)>
tx_rx : send data from file (s) or receive data (r) to put in file
file_name : file name to send data from or place data in
baudrate : baud rate used for TX/RX
flow_control : enables (1) or disables (0) Hardware flow control using RTS/CTS lines
max_delay : defines delay in seconds between each data burst when sending. 
Choose 0 for continuous stream.
random_size : enables (1) or disables (0) random size data bursts when sending. 
Choose 0 for max size.
max_delay and random_size are useful for sleep/wakeup over UART testing. ONLY meaningful when sending data
Examples:
Sending data (no delays)
ts_uart s init.rc 1500000 0 0 0 /dev/ttyS0
loop back mode:
ts_uart m init.rc 1500000 0 0 0 /dev/ttyS0
receive, data must be 0x55
ts_uart r init.rc 1500000 0 0 0 /dev/ttyS0
```

### 4.1 测试发送

测试发送的命令如下，send_0x55 和 send_00_ff 为发送的文件:

```plaintext
./data/ts_uart.uart s ./data/send_0x55 1500000 0 0 0 /dev/ttyS1
./data/ts_uart.uart s ./data/send_00_ff 1500000 0 0 0 /dev/ttyS1
```

发送成功可以通过 USB 转 UART 小板连接 PC 端，使用 PC 端串口调试工具验证｡

### 4.2 测试接收

测试接收的命令如下，receive_0x55 为接收的文件:

```plaintext
./data/ts_uart.uart r ./data/receive_0x55 1500000 0 0 0 /dev/ttyS1
```

可以使用 PC 端串口调试工具发送数据，测试程序将自动检测，检测到 U（0x55）接收正确，检测到其它字符将打印 16 进制 ASCII 码值，可以对照查询接收是否正确｡

### 4.3 测试内部自发自收

测试内部自发自收的命令如下:

```plaintext
./data/ts_uart.uart m ./data/send_00_ff 1500000 0 0 0 /dev/ttyS1
```

按下 Ctrl+C 停止测试，可以观察到结束 log 如下｡比较发送和接收的数据是否一致:

```plaintext
Sending data from file to port...
send:1172, receive:1172 total:1172 # 收发数据一致,测试成功
send:3441, receive:3537 total:3441 # 收发数据不一致,测试失败
```

如果测试失败，说明当前串口存在问题或者有其他程序也在使用同一个串口｡可以使用以下命令查看哪些程序打开了这个串口:

```plaintext
lsof | grep ttyS1
```

### 4.4 测试流控

**验证 CTS**：先手动拉高 CTS 引脚电平，再使用以下命令发送数据:

```plaintext
./data/ts_uart.uart s ./data/send_0x55 1500000 1 0 0 /dev/ttyS1
```

当 CTS 电平被拉高时，发送数据阻塞｡当释放 CTS 电平为低电平时，被阻塞的数据完成发送｡

**验证 RTS**：通过测量 RTS 引脚电平是否能够正常拉高和拉低来确认｡