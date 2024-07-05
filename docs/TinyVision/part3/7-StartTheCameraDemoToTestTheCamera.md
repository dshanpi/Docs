---
sidebar_position: 7
---
# 开启 camerademo 测试摄像头

进入 `m menuconfig` 进入如下页面进行配置。

```
Allwinner  --->
	Vision  --->
		<*> camerademo........................................ camerademo test sensor  --->
			[*]   Enabel vin isp support
```

编译系统然后烧录系统，运行命令 `camerademo` ，可以看到是正常拍摄照片的

![image-20240122162014027](assets/post/README/image-20240122162014027.png)
