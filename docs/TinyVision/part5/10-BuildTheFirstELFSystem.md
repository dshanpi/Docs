---
sidebar_position: 10
---
# 编译第一个 elf 系统

进入 `rtos/source` 文件夹

```
cd rtos/source/
```

![image-20230215133820910](assets/post/README/image-20230215133820910.png)

应用环境变量并加载方案

```
source melis-env.sh;lunch
```

![image-20230215133922058](assets/post/README/image-20230215133922058.png)

然后直接编译即可，他会自动解压配置工具链。编译完成后可以在 `ekernel/melis30.elf` 找到固件。

```
make -j
```

![image-20230215134015333](assets/post/README/image-20230215134015333.png)
