---
sidebar_position: 12
---
# 编译系统

初始化 SDK 环境。

```
source build/envsetup.sh
```

然后就是编译 SDK 输出固件

```
mp -j32
```

如果出现错误，请再次运行 

```
mp -j1 V=s 
```

以单线程编译解决依赖关系，并且输出全部编译 LOG 方便排查错误。
