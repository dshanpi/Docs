---
sidebar_position: 5
---

# HDMI 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_HDMI_CN.pdf`（V1.2.0, 2024-03-28）整理，介绍 Rockchip 平台基于 DRM 框架的 HDMI 驱动使用与调试方法。

:::info 适用范围
- **芯片平台**：RK322X / RK3288 / RK3328 / RK3368 / RK3399 / RK3528 / RK356X / RK3588 / RK3576
- **内核版本**：Linux kernel 4.4 / 4.19 / 5.10 / 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、Rockchip 平台 HDMI 简介

### 1.1 各平台 HDMI 功能对比

| 功能 | RK3288 | RK3368 | RK322X | RK3328 | RK3399 | RK3528 | RK356X | RK3588 | RK3576 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **最大分辨率** | 3840x2160p60 | 4096x2160p60 | 4096x2160p60 | 4096x2160p60 | 4096x2160p60 | 4096x2160p60 | 4096x2160p60 | 7680x4320p60 | 4096x2160p120 |
| **隔行模式** | N | N | Y | Y | Y | Y | Y | Y | Y |
| **4K-60/50Hz 颜色** | RGB/YUV444/YUV422/YUV420 | YUV420 | YUV420 | YUV420 | RGB/YUV444/YUV422/YUV420 | RGB/YUV444/YUV422/YUV420 | RGB/YUV444/YUV422/YUV420 | RGB/YUV444/YUV420 | RGB/YUV444/YUV422/YUV420 |
| **10bit 色深** | Y | N | Y | Y | Y | Y | Y | Y | Y |
| **协议版本** | HDMI 2.0 | HDMI 2.0 | HDMI 2.0 | HDMI 2.0 | HDMI 2.0 | HDMI 2.0 | HDMI 2.0 | HDMI 2.1 | HDMI 2.1 |

### 1.2 驱动路径

```
kernel/drivers/gpu/drm/rockchip/dw_hdmi-rockchip.c
kernel/drivers/gpu/drm/rockchip/inno_hdmi.c
kernel/drivers/gpu/drm/bridge/synopsys/
```

---

## 二、软件功能配置

### 2.1 使能 HDMI

```dts
&hdmi {
    status = "okay";
};
```

### 2.2 绑定 VOP/VP

#### 双 VOP 平台（RK3288 / RK3399）

VOPB 支持 4K，VOPL 只支持 2K。HDMI 绑定到 VOPB：

```dts
&hdmi_in_vopl {
    status = "disabled";
};
```

绑定到 VOPL：
```dts
&hdmi_in_vopb {
    status = "disabled";
};
```

#### VOP2 平台

**RK356X**（HDMI 可绑定 VP0 或 VP1，建议 VP0 支持 4K）：
```dts
&hdmi_in_vp0 { status = "okay"; };
&hdmi_in_vp1 { status = "disabled"; };
```

**RK3588**（两个 HDMITX，可绑定 VP0/1/2）：
```dts
// 4K 场景：HDMI0 → VP0，HDMI1 → VP1
&hdmi0_in_vp0 { status = "okay"; };
&hdmi0_in_vp1 { status = "disabled"; };
&hdmi0_in_vp2 { status = "disabled"; };
&hdmi1_in_vp1 { status = "okay"; };
&hdmi1_in_vp0 { status = "disabled"; };
&hdmi1_in_vp2 { status = "disabled"; };
```

**RK3588 8K 输出**（必须占用 VP0+VP1，HDMI 绑定在 VP0 上）：
```dts
&hdmi0_in_vp0 { status = "okay"; };
```
8K 输出还需设置 VOP ACLK 为 800MHz（见 2.4 节）。

#### HDMI 与 eDP 共用 PHY（RK3588）

使用 HDMI 时必须关闭对应的 eDP 和 eDP PHY：
```dts
&hdmi0 { status = "okay"; };
&hdptxphy_hdmi0 { status = "okay"; };
&edp0 { status = "disabled"; };
&hdptxphy0 { status = "disabled"; };
```

### 2.3 开机 Logo

```dts
&route_hdmi {
    status = "okay";
};
```

:::note 注意
双 VOP 平台上，`route_hdmi` 的 `connect` 属性指定的 VOP 必须与 HDMI 实际绑定的 VOP 一致，否则可能花屏。
:::

### 2.4 VOP DCLK 绑定 PLL

#### RK3288

VOPB/VOPL dclk 可挂载到 GPLL/CPLL（整数分频，只能输出 594M 整数分频的标准分辨率）：
```dts
&vopb {
    assigned-clocks = <&cru DCLK_VOP0>;
    assigned-clock-parents = <&cru PLL_GPLL>;
};
&vopl {
    assigned-clocks = <&cru DCLK_VOP1>;
    assigned-clock-parents = <&cru PLL_CPLL>;
};
```

#### RK3399

HDMI 绑定的 VOP dclk 需挂载到 VPLL（可任意分频），双显时另一个 VOP 挂 CPLL：
```dts
// HDMI 绑定 VOPB 时
&vopb {
    assigned-clocks = <&cru DCLK_VOP0_DIV>;
    assigned-clock-parents = <&cru PLL_VPLL>;
};
&vopl {
    assigned-clocks = <&cru DCLK_VOP1_DIV>;
    assigned-clock-parents = <&cru PLL_CPLL>;
};
```

#### RK356X

VP dclk 必须挂载到 HPLL：
```dts
&vop {
    status = "okay";
    assigned-clocks = <&cru DCLK_VOP0>;
    assigned-clock-parents = <&pmucru PLL_HPLL>;
};
```

#### RK3588 / RK3576

**超过 4K60 分辨率需将 VOP ACLK 设为 800MHz：**
```dts
&vop {
    assigned-clocks = <&cru ACLK_VOP>;
    assigned-clock-rates = <800000000>;
    status = "okay";
};
```

**非标准分辨率需指定 PHY PLL 作为 dclk 时钟源：**

RK3588 DTS 配置：
```dts
&display_subsystem {
    clocks = <&hdptxphy_hdmi_clk0>, <&hdptxphy_hdmi_clk1>;
    clock-names = "hdmi0_phy_pll", "hdmi1_phy_pll";
};
&hdptxphy_hdmi_clk0 { status = "okay"; };
&hdptxphy_hdmi_clk1 { status = "okay"; };
```

RK3576 DTS 配置：
```dts
&display_subsystem {
    clocks = <&hdptxphy_hdmi>;
    clock-names = "hdmi0_phy_pll";
};
```

**确认时钟分配生效：**
```bash
cat /sys/kernel/debug/clk/clk_summary | grep -A1 hdmiphy
```

### 2.5 HDCP 使能

#### RK3288 / RK3399 / RK3528 / RK356X

**HDCP 1.4：**
```dts
&hdmi {
    hdcp1x-enable = <1>;
};
```

运行时控制：
```bash
echo 1 > /sys/class/misc/hdmi_hdcp1x/enable     # 开启
echo 0 > /sys/class/misc/hdmi_hdcp1x/enable     # 关闭
cat /sys/class/misc/hdmi_hdcp1x/status          # 查看状态
```

状态值：`hdcp disable` / `hdcp_auth_start` / `hdcp_auth_success` / `hdcp_auth_fail`

**HDCP 2.2：**
```bash
echo 1 > /sys/class/misc/hdcp2_node/enable      # 开启
cat /sys/class/misc/hdcp2_node/status           # 查看状态
```

:::note 前提
使用 HDCP 2.2 需确保 HDCP 1.4 工作正常，并需向 FAE 申请 Key 打包工具和补丁。
:::

#### RK3588 / RK3576

支持 HDCP 1.4/2.3，通过 DRM PROPERTY 配置，可用 modetest 测试：

```bash
# 查询 connector id
modetest -c

# 开启 HDCP（优先 2.3，失败自动降级 1.4）
modetest -w 423:"Content Protection":1

# 关闭 HDCP
modetest -w 423:"Content Protection":0
```

**HDCP 相关属性：**
- `Content Protection`：`Undesired=0`（关闭）/ `Desired=1`（开启）/ `Enabled=2`（已认证成功）
- `hdcp_encrypted`：`0`（未认证）/ `1`（HDCP 1.4）/ `2`（HDCP 2.3）

### 2.6 DDC I2C 速率配置

EDID 读取失败时（出现 `i2c read time out`），可降低 DDC I2C 速率：

```dts
&hdmi {
    ddc-i2c-scl-high-time-ns = <9625>;   // 50kHz
    ddc-i2c-scl-low-time-ns  = <10000>;
};
```

调整为 100kHz：
```dts
&hdmi {
    ddc-i2c-scl-high-time-ns = <4812>;   // 100kHz
    ddc-i2c-scl-low-time-ns  = <5000>;
};
```

### 2.7 HDMI 信号强度配置

硬件走线差异可能导致电视兼容性问题，可通过 `rockchip,phy-table` 调整信号。

#### RK3288 / RK3368 / RK3399 / RK356X

格式：`&lt;PIXELCLOCK PHY_CKSYMTXCTRL PHY_TXTERM PHY_VLEVCTRL&gt;`

```dts
&hdmi {
    rockchip,phy-table =
        <74250000   0x8009 0x0004 0x0272>,
        <165000000  0x802b 0x0004 0x0209>,
        <297000000  0x8039 0x0005 0x028d>,
        <594000000  0x8039 0x0000 0x019d>,
        <000000000  0x0000 0x0000 0x0000>;
};
```

**寄存器说明：**
- `PHY_CKSYMTXCTRL` (0x09)：Bit[3:1] 数据预加重，Bit[4:5] 斜率提升
- `PHY_TXTERM` (0x19)：Bit[0:2] 端接电阻（值越大电阻越大）
- `PHY_VLEVCTRL` (0x0e)：Bit[0:4] 时钟幅度，Bit[5:9] 数据幅度（值越低幅度越大）

**查看 PHY 寄存器：**
```bash
cat /sys/kernel/debug/dw-hdmi/phy
```

#### RK322X / RK3328 / RK3528 / RK356X INNO PHY

各平台格式不同，具体参考官方文档。可调节参数包括：
- Slew rate（上升/下降沿时间）
- Pre-emphasis（预加重）
- Swing（幅值）
- Current bias（电流偏置）

### 2.8 新增特殊分辨率

#### 新增时序

在 `kernel/drivers/gpu/drm/drm_edid.c` 的 `drm_dmt_modes` 中添加：

```c
{ DRM_MODE("4096x2160", DRM_MODE_TYPE_DRIVER, 556188,
    4096, 4104, 4136, 4176, 0,
    2160, 2208, 2216, 2222, 0,
    DRM_MODE_FLAG_PHSYNC | DRM_MODE_FLAG_NVSYNC) },
```

#### 新增 PLL 配置

- **RK322X/RK3328/RK3528**：在 `phy-rockchip-inno-hdmi-phy.c` 的 `pre_pll_cfg_table` / `post_pll_cfg_table` 中添加
- **RK3288/RK3368/RK3399/RK356X**：在 `dw_hdmi-rockchip.c` 的 `rockchip_mpll_cfg` / `rockchip_mpll_cfg_420` 中添加
- **RK3588/RK3576**：驱动自动计算 PLL 频率，无需手动配置

### 2.9 打开音频

```dts
// RK3288/RK3368：HDMI 声卡与 Codec 公用
&hdmi_analog_sound { status = "okay"; };

// RK3399：HDMI 声卡与 DP 公用
&hdmi_dp_sound { status = "okay"; };
```

---

## 三、Android 显示框架配置

### 3.1 主副显示接口

**Android 7.x / 8.x：**
```
sys.hwc.device.primary=HDMI-A
sys.hwc.device.extend=DP
```

**Android 9.0+：**
```
vendor.hwc.device.primary=HDMI-A
vendor.hwc.device.extend=DP
```

查询当前主副显：
```
vendor.hwc.device.main
vendor.hwc.device.aux
```

### 3.2 Framebuffer 分辨率

```
persist.vendor.framebuffer.main=1920x1080
```

:::note FB 与输出分辨率
Framebuffer 分辨率是 UI 绘制分辨率，与 HDMI 输出分辨率不同。两者不一致时会自动缩放。
:::

### 3.3 分辨率过滤白名单

文件：`device/rockchip/common/resolution_white.xml`

HWC 根据该 XML 过滤分辨率后传递给上层应用。

### 3.4 HDMI 设置选项

Android 8.x 及以上需配置：
```
BOARD_SHOW_HDMI_SETTING := true
```

---

## 四、常用调试方法

### 4.1 查看 VOP 状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

**常用 bus_format 值：**

| 宏定义 | 值 | 说明 |
| :--- | :---: | :--- |
| `MEDIA_BUS_FMT_RGB888_1X24` | 0x100a | RGB888 |
| `MEDIA_BUS_FMT_RGB101010_1X30` | 0x1018 | RGB101010 |
| `MEDIA_BUS_FMT_YUV8_1X24` | 0x2025 | YUV444 8bit |
| `MEDIA_BUS_FMT_YUV10_1X30` | 0x2016 | YUV444 10bit |
| `MEDIA_BUS_FMT_UYYVYY8_0_5X24` | 0x2026 | YUV420 8bit |
| `MEDIA_BUS_FMT_UYYVYY10_0_5X30` | 0x2027 | YUV420 10bit |

### 4.2 查看 Connector 状态

```bash
ls /sys/class/drm/
# 示例输出：card0-HDMI-A-1  card0-DP-1

# 查看 EDID
cat /sys/class/drm/card0-HDMI-A-1/edid > /data/edid.bin

# 查看支持的分辨率
cat /sys/class/drm/card0-HDMI-A-1/modes
```

### 4.3 查看 HDMI 工作状态

```bash
cat /sys/kernel/debug/dw-hdmi/status
```

输出包括：
- HDMI Output Status（PHY 状态）
- Pixel Clk / TMDS Clk
- Color Format（RGB / YUV444 / YUV422 / YUV420）
- Color Depth（8bit / 10bit / 12bit / 16bit）
- Colorimetry（BT.601 / BT.709 / BT.2020）
- EOTF（SDR / ST2084 / HLG）
- 静态 HDR 描述子信息

**查看/修改控制器寄存器：**
```bash
cat /sys/kernel/debug/dw-hdmi/ctrl
echo 1000 f8 > /sys/kernel/debug/dw-hdmi/ctrl   # 写寄存器
```

### 4.4 查看 HDMI CEC 状态

```bash
cat /sys/kernel/debug/cec/cec0/status
```

关键字段：
- `configured`：是否配置完成
- `phys_addr`：物理地址（未获取为 `f.f.f.f`）
- `LA mask`：逻辑地址掩码

### 4.5 强制使能/禁用 HDMI

```bash
echo on > /sys/class/drm/card0-HDMI-A-1/status     # 强制使能
echo off > /sys/class/drm/card0-HDMI-A-1/status    # 强制禁用
echo detect > /sys/class/drm/card0-HDMI-A-1/status # 恢复热插拔检测
```

### 4.6 命令行设置分辨率

**Android 9.0+ 新版（按接口名）：**
```bash
setprop persist.vendor.resolution.HDMIA-0 "1920x1080@60-1920-2008-2052-2200-1080-1084-1089-1125-5"
setprop vendor.display.timeline 1
```

**Android 9.0+ 旧版（按主副屏）：**
```bash
setprop persist.vendor.resolution.main "1920x1080@60-1920-2008-2052-2200-1080-1084-1089-1125-5"
setprop vendor.display.timeline 1
```

格式：`WxH@fps-hdisp-hss-hse-htot-vdisp-vss-vse-vtot-flags`

分辨率设置优先级：
1. `persist.vendor.resolution.<Connector-type>-<ID>`
2. `persist.vendor.resolution.main(aux)`
3. baseparameter（如果存在）
4. Auto

### 4.7 命令行设置颜色

```bash
setprop persist.vendor.color.main "RGB-8bit"
setprop vendor.display.timeline 1
```

支持的颜色格式：`RGB` / `YCBCR444` / `YCBCR422` / `YCBCR420`
支持的色深：`8bit` / `10bit`

### 4.8 设置过扫描

```bash
setprop persist.vendor.overscan.main "overscan 70,70,70,70"
```

格式：`overscan left,top,right,bottom`（范围 1~100，或由 `overscan.max` 指定）

### 4.9 设置亮度/对比度/饱和度/色度

```bash
setprop persist.vendor.brightness.main 70
setprop persist.vendor.contrast.main 60
setprop persist.vendor.saturation.main 55
setprop persist.vendor.hue.main 50
setprop vendor.display.timeline 1
```

取值范围：0~100，默认 50。

---

## 五、常见问题排查

### 5.1 插入/切换分辨率，电视无信号或花屏

1. 确认当前 HDMI 分辨率
2. 降低分辨率测试
3. 更换 HDMI 线材
4. 检查硬件信号完整性
5. 调整 HDMI PHY 信号配置（slew rate / pre-emphasis / swing）

### 5.2 播放视频时电视无信号

检查是否有 DDR 变频导致的问题，关闭自动变频：
```dts
&dmc {
    auto-freq-en = <0>;
};
```

### 5.3 部分电视无信号/黑屏/花屏

1. 降低分辨率测试
2. 更换线材
3. 调整 PHY 信号强度
4. 尝试增大 `HDMI_FC_CTRLDUR` 寄存器值（最大 223）

### 5.4 读取 EDID 失败时设置默认分辨率

修改 `dw_hdmi.c` 中 `def_modes[]` 数组的 VIC 值，如 `4` 对应 720P60。

### 5.5 强制输出指定分辨率

在 DTS 中配置（需内核支持对应 commit）：

```dts
&hdmi {
    status = "okay";
    force-output;
    force-bus-format = <MEDIA_BUS_FMT_RGB888_1X24>;
    force_timing {
        clock-frequency = <594000000>;
        hactive = <3840>;
        vactive = <2160>;
        hback-porch = <296>;
        hfront-porch = <176>;
        vback-porch = <72>;
        vfront-porch = <8>;
        hsync-len = <88>;
        vsync-len = <10>;
        hsync-active = <1>;
        vsync-active = <1>;
    };
};
```

:::caution 注意
强制输出 HDMI 2.0 分辨率（4K30 以上）需确认 SINK 端是否需要 SCDC 通信。强制输出不支持热插拔。
:::

### 5.6 Recovery HDMI 无显示

Recovery 不支持双显和热插拔，需插着 HDMI 开机。

### 5.7 Settings 中无法设置 HDMI 分辨率

1. 确认主副屏配置正确
2. 确认属性配置正确
3. Android 9.0+ 需启用 RkOutputManager 服务

### 5.8 DDR 带宽不足导致闪屏/绿线

内核 log 出现 `POST_BUF_EMPTY` 错误时，说明 DDR 带宽不足：
- 固定 DDR 到最高频率
- 加长消隐期
- 降低分辨率

### 5.9 Setting 中无 4K 分辨率

1. 确认电视支持 4K
2. 查看内核分辨率列表：`cat /sys/class/drm/card0-HDMI-A-1/modes`
3. 双 VOP 平台确认绑定的是 VOPB
4. 确认分辨率白名单包含该分辨率

### 5.10 RK3588 Setting 中无 8K 分辨率

1. 确认电视设置为 HDMI 2.1 模式或游戏模式
2. 确认 VOP ACLK 设置为 800MHz

### 5.11 RK3588/RK3576 HDMI 8K/4K120 闪屏

1. 确认使用 HDMI 2.1 线缆
2. 提供原理图/PCB 供硬件审核
3. 进行 SI 信号完整性测试

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_HDMI_CN.pdf` V1.2.0
- 《Rockchip_Developer_Guide_DRM_Display_Driver_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
