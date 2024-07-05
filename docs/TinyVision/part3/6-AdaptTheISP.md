---
sidebar_position: 6
---
# 适配 ISP 

Tina SDK 内置一个 libAWispApi 的包，支持在用户层对接 ISP，但是很可惜这个包没有适配 V85x 系列，这里就需要自行适配。其实适配很简单，SDK 已经提供了 lib 只是没提供编译支持。我们需要加上这个支持。

前往 `openwrt/package/allwinner/vision/libAWIspApi/machinfo` 文件夹中，新建一个文件夹 `v851se` ，然后新建文件 `build.mk` 写入如下配置：

``` 
ISP_DIR:=isp600
```

![image-20240122161729785](assets/post/README/image-20240122161729785.png)

对于  v851s，v853 也可以这样操作，然后 `m menuconfig` 勾选上这个包

![image-20240122202641560](assets/post/README/image-20240122202641560.png)