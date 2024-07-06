---
sidebar_position: 4
---
# 显示 Linux 终端

前往驱动勾选如下选项

```
Device Drivers  --->
	Graphics support  --->
		Frame buffer Devices  --->
			<*> Support for frame buffer devices
		Console display driver support  --->
			[*] Framebuffer Console support
			[*]   Map the console to the primary display device
```

![image-20240117101158050](images/image-20240117101158050.png)

然后在 `bootargs` 添加一行 `console=tty0` 即可显示。