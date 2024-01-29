# 使用Tina-SDK编译构建rootfs

Tina默认情况是编译打包完成在tina-v851/out/v851se-tinyvision/会生成对应的 tina_v851se-tinyvision_uart0.img

## 单独编译配置BusyBox 

tina默认是BusyBox 

``` shell
book@100ask:~/tina-v851$ make
book@100ask:~/tina-v851$ pack
```



### 清理无效缓存 重新打包

``` shell
make clean
```

