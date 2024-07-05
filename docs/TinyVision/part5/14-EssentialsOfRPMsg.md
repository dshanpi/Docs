---
sidebar_position: 14
---
# rpmsg 需知

1. 端点是 `rpmsg` 通信的基础；每个端点都有自己的 `src` 和 `dst` 地址，范围（1 - 1023，除了
   `0x35`）
2. `rpmsg` 每次发送数据最大为512 -16 字节；（数据块大小为 512，头部占用 16 字节）
3. `rpmsg` 使用 `name server` 机制，当 `E907` 创建的端点名，和 `linux` 注册的 `rpmsg` 驱动名一
   样的时候，`rpmsg bus` 总线会调用其 `probe` 接口。所以如果需要 `Linux `端主动发起创建端
   点并通知 `e907`，则需要借助上面提到的 `rpmsg_ctrl` 驱动。
4. `rpmsg`  是串行调用回调的，故建议  `rpmsg_driver`  的回调中不要调用耗时长的函数，避免影
   响其他 `rpmsg` 驱动的运行
