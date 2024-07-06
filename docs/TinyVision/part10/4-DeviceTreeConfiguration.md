---
sidebar_position: 4
---
# 设备树配置

```
&usbc0 {
	device_type = "usbc0";
	usb_port_type = <0x0>;
	usb_detect_type = <0x0>;
	usb_detect_mode = <0x0>;
	usb_id_gpio;
	usb_det_vbus_gpio;
	/* det_vbus_supply = <&usb_power_supply>; */
	usb_regulator_io = "nocare";
	usb_wakeup_suspend = <0>;
	usb_serial_unique = <0>;
	usb_serial_number = "20080411";
	status = "okay";
};
```

- `usb_port_type` 配置为0是Device模式，1是Host模式 2是OTG模式。
- `usb_id_gpio` 配置对应的USB ID引脚（TinyVision 无ID引脚）。
- `usb_det_vbus_gpio`,（TinyVision 无检测引脚） 需要根据实际情况进行配置: