---
sidebar_position: 13
---
# 核心通讯

### 建立通讯节点

启动小核后，使用 `eptdev_bind test 2` 建立两个通讯节点的监听，可以用 `rpmsg_list_listen` 命令查看监听节点。

![image-20230215135619996](assets/post/README/image-20230215135619996.png)

然后在 `Linux` 内创建通讯节点，由于我们上面启用了两个监听所以这里也开两个节点

```
echo test > /sys/class/rpmsg/rpmsg_ctrl0/open
echo test > /sys/class/rpmsg/rpmsg_ctrl0/open
```

![image-20230215135802471](assets/post/README/image-20230215135802471.png)

然后就可以在 `/dev/` 下看到通讯节点 `/dev/rpmsg0`，`/dev/rpmsg1`

![image-20230215135907700](assets/post/README/image-20230215135907700.png)

也可以在小核控制台看到节点的建立

![image-20230215140011440](assets/post/README/image-20230215140011440.png)

### 核心通讯

#### Linux -> e907

可以直接操作 Linux 端的节点，使用 `echo` 写入数据

```
echo "Linux Message 0" > /dev/rpmsg0
echo "Linux Message 0" > /dev/rpmsg1
```

![image-20230215140146824](assets/post/README/image-20230215140146824.png)

小核即可收到数据

![image-20230215140239518](assets/post/README/image-20230215140239518.png)

#### e907 -> Linux

使用命令 `eptdev_send` 用法 `eptdev_send <id> <data>`

```
eptdev_send 0 "E907 Message"
eptdev_send 1 "E907 Message"
```

![image-20230215140457024](assets/post/README/image-20230215140457024.png)

在 Linux 侧直接可以读取出来

```
cat /dev/rpmsg0
cat /dev/rpmsg1
```

![image-20230215140548983](assets/post/README/image-20230215140548983.png)

可以一直监听，例如多次发送数据

![image-20230215140641612](assets/post/README/image-20230215140641612.png)

Linux 侧获得的数据也会增加

![image-20230215140704356](assets/post/README/image-20230215140704356.png)

### 关闭通讯

Linux 侧关闭，操作控制节点，`echo <id>`  给节点即可 

```
echo 0 > /sys/class/rpmsg/rpmsg_ctrl0/close
echo 1 > /sys/class/rpmsg/rpmsg_ctrl0/close
```

![image-20230215140946705](assets/post/README/image-20230215140946705.png)

同时 E907 也会打印链接关闭

![image-20230215140935523](assets/post/README/image-20230215140935523.png)
