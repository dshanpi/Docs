---
title: 硬件连接
sidebar_label: 硬件连接
sidebar_position: 2
slug: /DshanPi-A1_CM5/QuickStart/HardwareConnections
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/HardwareConnections.md
---

import styles from './wiring/dsi.module.css';
import CM5PortPhoto from '@site/src/components/CM5PortPhoto';

# 硬件连接

以下实拍图均按 DshanPI A1 CM5 V1.2 底板正面展示：40 针排针朝上，双网口朝下。按所用外设选择接线，屏幕排线和串口排针请在开发板断电时连接。

## 1. 用 FPC 排线连接 DSI 屏幕

以下接法适用于图中的**同面 FPC 排线**。接线前断电，将两块板都放成排线座朝上。

1. **接屏幕端（图 1）**。打开屏幕背面转接板的 FPC 座锁扣。将排线的**金属触点面朝上、蓝色补强面朝下**，平直插到底，再合上锁扣。
2. **接底板端（图 2）**。打开 DshanPI A1 CM5 底板上标有 **DSI** 的排线座锁扣。将排线另一端的**蓝色补强面朝上、金属触点面朝下**，平直插到底，再合上锁扣。

<div className={styles.pair}>
<figure>
<div className={styles.annotated}>
<img src={require('./wiring/01-display-ribbon.webp').default} alt="图 1：箭头指向屏幕背面转接板上的白色 FPC 座，排线金属触点面朝上，蓝色补强面朝下" loading="lazy" />
<svg viewBox="0 0 625 500" aria-hidden="true">
  <path className={styles.pointer} d="M198 169 L342 109 M325 109 L342 109 L333 124" />
  <rect x="48" y="145" width="159" height="64" rx="7" />
  <text x="63" y="171">金属面朝上</text>
  <text x="63" y="197">蓝色面朝下</text>
</svg>
</div>
<figcaption>图 1　屏幕端的 FPC 排线</figcaption>
</figure>
<figure>
<div className={styles.annotated}>
<img src={require('./wiring/02-dsi-connected.webp').default} alt="图 2：箭头指向 DshanPI A1 CM5 底板上沿的 DSI 座，插入座中的排线蓝色补强面朝上，金属触点面朝下" loading="lazy" />
<svg viewBox="0 0 625 500" aria-hidden="true">
  <path className={styles.pointer} d="M449 165 L373 228 M379 211 L373 228 L391 225" />
  <rect x="435" y="125" width="159" height="64" rx="7" />
  <text x="450" y="151">蓝色面朝上</text>
  <text x="450" y="177">金属面朝下</text>
</svg>
</div>
<figcaption>图 2　排线接入底板 DSI 座</figcaption>
</figure>
</div>

## 2. 连接 12V 直流电源

正常开机时，将配套 **12V 直流电源**插入标有 **DC12V** 的圆形电源口。图 3 中，电源插头位于底板右下角。

**准备刷机时**，先用 Type-C 数据线连接电脑，再接入 12V 电源。按住 **MASKROM**，短按并松开 **RST（RESET）**，再松开 MASKROM。[查看烧录步骤](02-FlashEMMC.md)

<CM5PortPhoto src={require('./wiring/03-dc12v-level.webp').default} label="DC12V 电源" box={[470, 305, 145]} tip={[456, 405]} alt="图 3：箭头指向底板右下角已连接 12V 电源的 DC12V 圆形插座" />

## 3. 连接 Type-C：烧录或 DP 显示

- **烧录系统**：用 USB Type-C 数据线连接 Windows 电脑和底板标有 **TypeC** 的接口。烧录期间由 **DC12V** 供电。
- **DP 显示**：使用支持 DP 视频输出的 Type-C 线或 Type-C 转 DP 线，将同一接口连接到兼容显示器，选择对应的输入源。

<CM5PortPhoto src={require('./wiring/04-type-c.webp').default} label="Type-C" box={[60, 325, 110]} tip={[224, 404]} alt="图 4：箭头指向底板左下角的 Type-C 接口，用于烧录或 DP 显示" />

## 4. 连接 HDMI 显示器

用 HDMI 线连接底板的 **HDMI** 接口和显示器，在显示器上选择对应的 HDMI 输入源。图 5 中，HDMI 插头位于 Type-C 与网口之间。

<CM5PortPhoto src={require('./wiring/05-hdmi.webp').default} label="HDMI" box={[326, 449, 94]} tip={[264, 409]} alt="图 5：箭头指向 Type-C 与双网口之间已接线的 HDMI 接口" />

## 5. 连接有线网络

将网线一端插入底板 **ETH0** 或 **ETH1**，另一端接到路由器的 LAN 口或已联网的交换机。图 6 中，蓝色网线接的是 **ETH0**。

<CM5PortPhoto src={require('./wiring/06-ethernet-level.webp').default} label="ETH0 网口" box={[366, 449, 134]} tip={[305, 409]} alt="图 6：箭头指向插有蓝色网线的 ETH0 网口" />

## 6. 连接 USB 鼠标和键盘

将鼠标、键盘或无线接收器插入标有 **USB2.0** 的 Type-A 接口。**启用 PCIe1 后，这两个 USB 2.0 接口均无法传输数据。**

<CM5PortPhoto src={require('./wiring/07-usb.webp').default} label="USB 2.0" box={[260, 451, 108]} tip={[386, 412]} alt="图 7：箭头指向接有白色线缆的 USB 2.0 Type-A 接口" />

## 7. 通过 40 针排针访问调试串口

**1. 找到串口针脚。** 断开底板电源。将 40 针排针朝上、双网口朝下，在靠近板边的一排从左往右数，第 3、4、5 根分别是物理针脚 **6（GND）、8（TX）、10（RX）**。

<figure className={styles.uartFigure}>
<svg viewBox="0 0 710 282" role="img" aria-label="底板排针局部：靠近板边的一排，从左数第 3、4、5 根依次为 6 GND、8 TX、10 RX">
  <rect width="710" height="282" fill="#eef1f5" />
  <svg x="0" y="112" width="710" height="170" viewBox="0 132 710 170"><image href={require('./wiring/uart-header.png').default} width="1167" height="1086" /></svg>
  <g fill="none" stroke="#5b21b6" strokeWidth="3"><path d="M90 65 L162 109 M193 65 V109 M300 65 L224 109" /></g>
  <g fill="#5b21b6"><path d="M154 109 L164 113 L161 103 Z M188 104 L193 113 L198 104 Z M224 103 L221 113 L232 109 Z" /><rect x="32" y="30" width="98" height="36" rx="6"/><rect x="148" y="30" width="90" height="36" rx="6"/><rect x="260" y="30" width="99" height="36" rx="6"/></g>
  <g fill="white" textAnchor="middle" fontSize="21" fontWeight="600"><text x="81" y="55">6 · GND</text><text x="193" y="55">8 · TX</text><text x="310" y="55">10 · RX</text></g>
</svg>
<figcaption>图 8　底板 40 针排针上的调试串口（底板端信号）</figcaption>
</figure>

**2. 连接 USB 转 TTL 适配器。** 两端共地，收发交叉连接。使用与底板串口电平匹配的适配器，**适配器的电源引脚留空**。

| 底板物理针脚 | 串口适配器 |
| --- | --- |
| 6 · GND | GND |
| 8 · TX（发送） | RXD（接收） |
| 10 · RX（接收） | TXD（发送） |

<figure className={styles.uartFigure}>
<svg viewBox="0 0 808 221" role="img" aria-label="底板与 USB 转 TTL 适配器接线：6 接 GND，8 接 RXD，10 接 TXD">
  <rect width="808" height="221" fill="white" />
  <svg x="5" y="24" width="151" height="189" viewBox="705 82 151 189"><image href={require('./wiring/uart-adapter.png').default} width="1522" height="1082" /></svg>
  <svg x="414" y="24" width="390" height="184" viewBox="1002 0 390 184"><image href={require('./wiring/uart-adapter.png').default} width="1522" height="1082" /></svg>
  <g fill="#31205e" fontSize="17" fontWeight="600"><text x="7" y="18">底板排针</text><text x="416" y="18">USB 转 TTL 适配器</text></g>
  <g fill="none" strokeLinejoin="round" strokeLinecap="round">
    <path stroke="#5b21b6" strokeWidth="4" d="M144 120 H264 L365 188 H414" />
    <path stroke="white" strokeWidth="9" d="M144 148 H265 L365 162 H414" /><path stroke="#5b21b6" strokeWidth="4" d="M144 148 H265 L365 162 H414" />
    <path stroke="white" strokeWidth="9" d="M144 176 H265 L365 134 H414" /><path stroke="#5b21b6" strokeWidth="4" d="M144 176 H265 L365 134 H414" />
  </g>
  <g fill="#5b21b6"><circle cx="144" cy="120" r="4"/><circle cx="144" cy="148" r="4"/><circle cx="144" cy="176" r="4"/></g>
  <g fill="#31205e" fontSize="16" fontWeight="600"><text x="162" y="115">6 · GND</text><text x="162" y="143">8 · TX</text><text x="162" y="171">10 · RX</text></g>
</svg>
<figcaption>图 9　底板与串口适配器的三线接法（左图排针竖放）</figcaption>
</figure>

<figure className={styles.uartFigure}>
<img src={require('./wiring/08-uart.webp').default} width="540" loading="lazy" alt="三根杜邦线连接底板排针与 USB 转 TTL 适配器的实物照片" />
<figcaption>图 10　三根信号线接好后的实物</figcaption>
</figure>

**3. 查看启动日志。** 将适配器插入电脑，在串口终端选择对应的 COM 口，波特率设为 **1500000**。打开串口，再给底板接入 **12V** 电源。终端应开始输出启动日志。

<details>
<summary>核对原理图：8 脚发送，10 脚接收</summary>

<figure className={styles.uartFigure}>
<img src={require('./wiring/uart-schematic.png').default} width="720" loading="lazy" alt="底板原理图 U35 局部：8 脚接 UART0_TX_M0_DEBUG，10 脚经 D3 接 UART0_RX_M0_DEBUG" />
<figcaption>图 11　U35 调试串口信号，见[底板原理图第 5 页](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/SCH_DshanPI-A1-CM5-Base.pdf#page=5)。</figcaption>
</figure>

</details>

下一步：[选择系统与下载镜像](01-Resources.md)。
