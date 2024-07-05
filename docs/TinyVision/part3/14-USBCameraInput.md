---
sidebar_position: 14
---
# USB 摄像头输入

有些场景需要使用 USB 摄像头输入，配置如下

开启 USB UVC 支持 `m kernel_menuconfig`

```
-> Device Drivers
	-> Multimedia support (MEDIA_SUPPORT [=y])
		-> Media USB Adapters (MEDIA_USB_SUPPORT [=y])
			-> USB Video Class (UVC) (USB_VIDEO_CLASS [=y]) 
```

之后编译系统，启动，将 USB 切换为 HOST 模式（默认是 Device）

```
cat /sys/devices/platform/soc/usbc0/usb_host
```

这里测试使用的是采集卡，输出如下，可以看到 Video0 已经出来了

![image-20240613193430159](assets/post/README/image-20240613193430159.png)

测试摄像头，运行 `camerademo` 拍照，拍摄的照片位于 `/tmp` 文件夹下

![image-20240613200649722](assets/post/README/image-20240613200649722.png)
