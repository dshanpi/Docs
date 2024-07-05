---
sidebar_position: 6
---
# 配置启动小核

配置启动小核的流程如下，这里只讨论使用 linux 启动小核的情况，不讨论快启相关。

![img](assets/post/README/2022-07-19-15-33-28-image.png)

1. 加载固件
   1. 调用 `firmware` 接口获取文件系统中的固件
   2. 解析固件的 `resource_table` 段，该段有如下内容
      1. 声明需要的内存（`Linux` 为其分配，设备树配置）
      2. 声明使用的 `vdev`（固定为一个）
      3. 声明使用的 `vring`（固定为两个）
   3. 将固件加载到指定地址
2. 注册 `rpmsg virtio` 设备
   1. 提供 `vdev->ops`（基于 `virtio` 接口实现的）
   2. 与 `rpmsg_bus` 驱动匹配，完成 `rpmsg` 初始化
3. 启动小核
   1. 调用 `rproc->ops->start`

