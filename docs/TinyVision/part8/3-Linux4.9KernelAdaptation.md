---
sidebar_position: 3
---
# Linux 4.9 内核适配

### 驱动勾选

由于使用的是 SPI0，所以 TinyVision 的 LCD 模块并不支持使用MIPI-DBI进行驱动，这里我们使用普通的SPI模拟时序。

### 勾选 SPI 驱动

这里我们使用 SPI-NG 驱动，勾选 `Device Drivers  ---> [*] SPI support  ---><*>   SUNXI SPI Controller`

![image-20240320180743441](images/image-20240320180743441.png)

### 勾选 Linux FrameBuffer 驱动

前往如下地址，勾选驱动

```
Device Drivers  --->
	Graphics support  --->
		Frame buffer Devices  --->
			<*> Support for frame buffer devices
		Console display driver support  --->
			[*] Framebuffer Console support
			[*]   Map the console to the primary display device
	[*] Staging drivers  --->
		<*>   Support for small TFT LCD display modules  --->
		<*>   FB driver for the ST7789V LCD Controller
```

###  适配 FBTFT 的设备树接口

进入内核文件夹，找到 `lichee/linux-4.9/drivers/staging/fbtft/fbtft-core.c`

添加头文件

```
#include <linux/sunxi-gpio.h>
```

修改驱动注册接口

```c
static int fbtft_request_one_gpio(struct fbtft_par *par,
				  const char *name, int index, int *gpiop)
{
	struct device *dev = par->info->device;
	struct device_node *node = dev->of_node;
	int gpio, flags, ret = 0;
	struct gpio_config gpio_of_flags;

	if (of_find_property(node, name, NULL)) {
		gpio = of_get_named_gpio_flags(node, name, index, (enum of_gpio_flags *)&gpio_of_flags);
		if (gpio == -ENOENT)
			return 0;
		if (gpio == -EPROBE_DEFER)
			return gpio;
		if (gpio < 0) {
			dev_err(dev,
				"failed to get '%s' from DT\n", name);
			return gpio;
		}

		/* active low translates to initially low */
		flags = (gpio_of_flags.data & OF_GPIO_ACTIVE_LOW) ? GPIOF_OUT_INIT_LOW :
							GPIOF_OUT_INIT_HIGH;
		ret = devm_gpio_request_one(dev, gpio, flags,
						dev->driver->name);
		if (ret) {
			dev_err(dev,
				"gpio_request_one('%s'=%d) failed with %d\n",
				name, gpio, ret);
			return ret;
		}
		if (gpiop)
			*gpiop = gpio;
		fbtft_par_dbg(DEBUG_REQUEST_GPIOS, par, "%s: '%s' = GPIO%d\n",
							__func__, name, gpio);
	}
	return ret;
}

static int fbtft_request_gpios_dt(struct fbtft_par *par)
{
	int i;
	int ret;

	if (!par->info->device->of_node)
		return -EINVAL;

	ret = fbtft_request_one_gpio(par, "reset", 0, &par->gpio.reset);
	if (ret)
		return ret;
	ret = fbtft_request_one_gpio(par, "dc", 0, &par->gpio.dc);
	if (ret)
		return ret;
	ret = fbtft_request_one_gpio(par, "rd", 0, &par->gpio.rd);
	if (ret)
		return ret;
	ret = fbtft_request_one_gpio(par, "wr", 0, &par->gpio.wr);
	if (ret)
		return ret;
	ret = fbtft_request_one_gpio(par, "cs", 0, &par->gpio.cs);
	if (ret)
		return ret;
	ret = fbtft_request_one_gpio(par, "latch", 0, &par->gpio.latch);
	if (ret)
		return ret;
	for (i = 0; i < 16; i++) {
		ret = fbtft_request_one_gpio(par, "db", i,
						&par->gpio.db[i]);
		if (ret)
			return ret;
		ret = fbtft_request_one_gpio(par, "led", i,
						&par->gpio.led[i]);
		if (ret)
			return ret;
		ret = fbtft_request_one_gpio(par, "aux", i,
						&par->gpio.aux[i]);
		if (ret)
			return ret;
	}

	return 0;
}
```

### 编写配套屏幕 ST7789v 驱动

```c
/*
 * FB driver for the ST7789V LCD Controller
 *
 * Copyright (C) 2015 Dennis Menschel
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

#include <linux/bitops.h>
#include <linux/delay.h>
#include <linux/init.h>
#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/gpio.h>
#include <video/mipi_display.h>

#include "fbtft.h"

#define DRVNAME "fb_st7789v"

#define DEFAULT_GAMMA \
	"70 2C 2E 15 10 09 48 33 53 0B 19 18 20 25\n" \
	"70 2C 2E 15 10 09 48 33 53 0B 19 18 20 25"

#define HSD20_IPS_GAMMA \
	"D0 05 0A 09 08 05 2E 44 45 0F 17 16 2B 33\n" \
	"D0 05 0A 09 08 05 2E 43 45 0F 16 16 2B 33"

/**
 * enum st7789v_command - ST7789V display controller commands
 *
 * @PORCTRL: porch setting
 * @GCTRL: gate control
 * @VCOMS: VCOM setting
 * @VDVVRHEN: VDV and VRH command enable
 * @VRHS: VRH set
 * @VDVS: VDV set
 * @VCMOFSET: VCOM offset set
 * @PWCTRL1: power control 1
 * @PVGAMCTRL: positive voltage gamma control
 * @NVGAMCTRL: negative voltage gamma control
 *
 * The command names are the same as those found in the datasheet to ease
 * looking up their semantics and usage.
 *
 * Note that the ST7789V display controller offers quite a few more commands
 * which have been omitted from this list as they are not used at the moment.
 * Furthermore, commands that are compliant with the MIPI DCS have been left
 * out as well to avoid duplicate entries.
 */
enum st7789v_command {
	PORCTRL = 0xB2,
	GCTRL = 0xB7,
	VCOMS = 0xBB,
	VDVVRHEN = 0xC2,
	VRHS = 0xC3,
	VDVS = 0xC4,
	VCMOFSET = 0xC5,
	PWCTRL1 = 0xD0,
	PVGAMCTRL = 0xE0,
	NVGAMCTRL = 0xE1,
};

#define MADCTL_BGR BIT(3) /* bitmask for RGB/BGR order */
#define MADCTL_MV BIT(5) /* bitmask for page/column order */
#define MADCTL_MX BIT(6) /* bitmask for column address order */
#define MADCTL_MY BIT(7) /* bitmask for page address order */

/**
 * init_display() - initialize the display controller
 *
 * @par: FBTFT parameter object
 *
 * Most of the commands in this init function set their parameters to the
 * same default values which are already in place after the display has been
 * powered up. (The main exception to this rule is the pixel format which
 * would default to 18 instead of 16 bit per pixel.)
 * Nonetheless, this sequence can be used as a template for concrete
 * displays which usually need some adjustments.
 *
 * Return: 0 on success, < 0 if error occurred.
 */
static int init_display(struct fbtft_par *par)
{
    par->fbtftops.reset(par);
    mdelay(50);
    write_reg(par,0x36,0x00);
    write_reg(par,0x3A,0x05);
    write_reg(par,0xB2,0x1F,0x1F,0x00,0x33,0x33);
    write_reg(par,0xB7,0x35);
    write_reg(par,0xBB,0x20);
    write_reg(par,0xC0,0x2C);
    write_reg(par,0xC2,0x01);
    write_reg(par,0xC3,0x01);
    write_reg(par,0xC4,0x18);
    write_reg(par,0xC6,0x13);
    write_reg(par,0xD0,0xA4,0xA1);
    write_reg(par,0xE0,0xF0,0x04,0x07,0x04,0x04,0x04,0x25,0x33,0x3C,0x36,0x14,0x12,0x29,0x30);
    write_reg(par,0xE1,0xF0,0x02,0x04,0x05,0x05,0x21,0x25,0x32,0x3B,0x38,0x12,0x14,0x27,0x31);
    write_reg(par,0xE4,0x1D,0x00,0x00);
	write_reg(par,0x21);
    write_reg(par,0x11);
    mdelay(50);
    write_reg(par,0x29);
    mdelay(200);
    return 0;
	return 0;
}

/**
 * set_var() - apply LCD properties like rotation and BGR mode
 *
 * @par: FBTFT parameter object
 *
 * Return: 0 on success, < 0 if error occurred.
 */
static int set_var(struct fbtft_par *par)
{
	u8 madctl_par = 0;

	if (par->bgr)
		madctl_par |= MADCTL_BGR;
	switch (par->info->var.rotate) {
	case 0:
		break;
	case 90:
		madctl_par |= (MADCTL_MV | MADCTL_MY);
		break;
	case 180:
		madctl_par |= (MADCTL_MX | MADCTL_MY);
		break;
	case 270:
		madctl_par |= (MADCTL_MV | MADCTL_MX);
		break;
	default:
		return -EINVAL;
	}
	write_reg(par, MIPI_DCS_SET_ADDRESS_MODE, madctl_par);
	return 0;
}

/**
 * set_gamma() - set gamma curves
 *
 * @par: FBTFT parameter object
 * @curves: gamma curves
 *
 * Before the gamma curves are applied, they are preprocessed with a bitmask
 * to ensure syntactically correct input for the display controller.
 * This implies that the curves input parameter might be changed by this
 * function and that illegal gamma values are auto-corrected and not
 * reported as errors.
 *
 * Return: 0 on success, < 0 if error occurred.
 */
static int set_gamma(struct fbtft_par *par, unsigned long *curves)
{
	int i;
	int j;
	int c; /* curve index offset */

	/*
	 * Bitmasks for gamma curve command parameters.
	 * The masks are the same for both positive and negative voltage
	 * gamma curves.
	 */
	const u8 gamma_par_mask[] = {
		0xFF, /* V63[3:0], V0[3:0]*/
		0x3F, /* V1[5:0] */
		0x3F, /* V2[5:0] */
		0x1F, /* V4[4:0] */
		0x1F, /* V6[4:0] */
		0x3F, /* J0[1:0], V13[3:0] */
		0x7F, /* V20[6:0] */
		0x77, /* V36[2:0], V27[2:0] */
		0x7F, /* V43[6:0] */
		0x3F, /* J1[1:0], V50[3:0] */
		0x1F, /* V57[4:0] */
		0x1F, /* V59[4:0] */
		0x3F, /* V61[5:0] */
		0x3F, /* V62[5:0] */
	};

	for (i = 0; i < par->gamma.num_curves; i++) {
		c = i * par->gamma.num_values;
		for (j = 0; j < par->gamma.num_values; j++)
			curves[c + j] &= gamma_par_mask[j];
		write_reg(
			par, PVGAMCTRL + i,
			curves[c + 0], curves[c + 1], curves[c + 2],
			curves[c + 3], curves[c + 4], curves[c + 5],
			curves[c + 6], curves[c + 7], curves[c + 8],
			curves[c + 9], curves[c + 10], curves[c + 11],
			curves[c + 12], curves[c + 13]);
	}
	return 0;
}

/**
 * blank() - blank the display
 *
 * @par: FBTFT parameter object
 * @on: whether to enable or disable blanking the display
 *
 * Return: 0 on success, < 0 if error occurred.
 */
static int blank(struct fbtft_par *par, bool on)
{
	if (on)
		write_reg(par, MIPI_DCS_SET_DISPLAY_OFF);
	else
		write_reg(par, MIPI_DCS_SET_DISPLAY_ON);
	return 0;
}

static void set_addr_win(struct fbtft_par *par, int xs, int ys, int xe, int ye)
{
	switch(par->info->var.rotate)
	{
		case   0: 
			break;
 		case  90: 
			xs+=80;xe+=80;
			break;
	 	case 180:
	 		break;
	 	case 270: 
			xs+=80;xe+=80;
	 		break;
	 	default :
			break;
	}
	write_reg(par, MIPI_DCS_SET_COLUMN_ADDRESS,
		  (xs >> 8) & 0xFF, xs & 0xFF, (xe >> 8) & 0xFF, xe & 0xFF);

	write_reg(par, MIPI_DCS_SET_PAGE_ADDRESS,
		  (ys >> 8) & 0xFF, ys & 0xFF, (ye >> 8) & 0xFF, ye & 0xFF);

	write_reg(par, MIPI_DCS_WRITE_MEMORY_START);
}

static void reset(struct fbtft_par *par)
{
	if (par->gpio.reset == -1)
		return;
	fbtft_par_dbg(DEBUG_RESET, par, "%s()\n", __func__);
	gpio_set_value(par->gpio.reset, 1);
	mdelay(20);
	gpio_set_value(par->gpio.reset, 0);
	mdelay(20);
	gpio_set_value(par->gpio.reset, 1);
	mdelay(120);
}

static struct fbtft_display display = {
	.regwidth = 8,
	.width = 240,
	.height = 240,
	.gamma_num = 2,
	.gamma_len = 14,
	.gamma = HSD20_IPS_GAMMA,
	.fbtftops = {
		.init_display = init_display,
		.set_addr_win = set_addr_win,
		.set_var = set_var,
		.set_gamma = set_gamma,
		.blank = blank,
		.reset = reset,
	},
};

FBTFT_REGISTER_DRIVER(DRVNAME, "sitronix,st7789v", &display);

MODULE_ALIAS("spi:" DRVNAME);
MODULE_ALIAS("platform:" DRVNAME);
MODULE_ALIAS("spi:st7789v");
MODULE_ALIAS("platform:st7789v");

MODULE_DESCRIPTION("FB driver for the ST7789V LCD Controller");
MODULE_AUTHOR("Dennis Menschel");
MODULE_LICENSE("GPL");
```

### 编写设备树

```
&pio {
	spi0_pins_a: spi0@0 {
		allwinner,pins = "PC0", "PC2", "PC3";
		allwinner,pname = "spi0_sclk", "spi0_mosi", "spi0_miso";
		allwinner,function = "spi0";
		allwinner,muxsel = <4>;
		allwinner,drive = <1>;
		allwinner,pull = <0>;
	};

	spi0_pins_b: spi0@1 {
		allwinner,pins = "PC1", "PC5", "PC4";
		allwinner,pname = "spi0_cs0", "spi0_hold", "spi0_wp";
		allwinner,function = "spi0";
		allwinner,muxsel = <4>;
		allwinner,drive = <1>;
		allwinner,pull = <1>;   // only CS should be pulled up
	};

	spi0_pins_c: spi0@2 {
		allwinner,pins = "PC0", "PC1", "PC2", "PC3", "PC4", "PC5";
		allwinner,function = "io_disabled";
		allwinner,muxsel = <7>;
		allwinner,drive = <1>;
		allwinner,pull = <0>;
	};

	spi0_pins_lcd: spi0@3 {
		allwinner,pins = "PC0", "PC2"; /* clk, mosi */
		allwinner,function = "spi0";
		allwinner,muxsel = <4>;
		allwinner,drive = <1>;
		allwinner,pull = <0>;
	};

	spi0_pins_lcd_cs: spi0@4 {
		allwinner,pins = "PC1"; /* cs */
		allwinner,function = "spi0";
		allwinner,muxsel = <4>;
		allwinner,pull = <1>;
		allwinner,drive = <1>;
	};
};

&spi0 {
	clock-frequency = <100000000>;
	pinctrl-0 = <&spi0_pins_lcd &spi0_pins_lcd_cs>;
	pinctrl-1 = <&spi0_pins_c>;
	pinctrl-names = "default", "sleep";
	spi_slave_mode = <0>;
	spi_dbi_enable = <0>;
	spi0_cs_number = <1>;
	status = "okay";

	st7789v@0 {
    	status = "okay";
    	compatible = "sitronix,st7789v";
		reg = <0>;
		spi-max-frequency = <30000000>;
		rotate = <0>;
		bgr;
		fps = <30>;
		buswidth = <8>;
		reset = <&pio PC 5 1 1 2 1>;
		dc = <&pio PC 4 1 1 2 0>;
		debug = <1>;
	};
};
```
