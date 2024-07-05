---
sidebar_position: 4
---
# 适配 TinyVision 板子

刚才下载到的 SDK 只支持一个板子，售价 1999 的 `V853-Vision`  开发板，这里要添加自己的板子的适配。

下载支持包：

| 版本 | 下载地址                                                     |
| ---- | ------------------------------------------------------------ |
| 1.0  | https://github.com/YuzukiTsuru/YuzukiTsuru.GitHub.io/releases/download/2024-01-21-20240121/tina-bsp-tinyvision.tar.gz |
| 1.1  | https://github.com/YuzukiHD/TinyVision/releases/download/tina.0.0.1/tina-bsp-tinyvision.tar.gz |
| 1.2  | https://github.com/YuzukiHD/TinyVision/releases/download/tina.0.0.2/tina-bsp-tinyvision.tar.gz |

或者可以在：https://github.com/YuzukiHD/TinyVision/tree/main/tina 下载到文件，不过这部分没预先下载软件包到 dl 文件夹所以编译的时候需要手动下载。

放到 SDK 的主目录下

![image-20240122151606422](assets/post/README/image-20240122151606422.png)

运行解压指令

``` bash
tar xvf tina-bsp-tinyvision.tar.gz
```

即可使 Tina SDK 支持 TinyVision 板子

![image-20240122151823777](assets/post/README/image-20240122151823777.png)
