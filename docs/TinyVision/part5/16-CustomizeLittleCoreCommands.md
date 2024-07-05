---
sidebar_position: 16
---
# 自定义小核命令

SDK 提供了 `FINSH_FUNCTION_EXPORT_ALIAS` 绑定方法，具体为

```
FINSH_FUNCTION_EXPORT_ALIAS(<函数名称>, <命令>, <命令的描述>)
```

例如编写一个 hello 命令，功能是输出 `Hello World`，描述为 `Show Hello World`

```c
int hello_cmd(int argc, const char **argv)
{
    printf("Hello World\n");
}
FINSH_FUNCTION_EXPORT_ALIAS(hello_cmd, hello, Show Hello World)
```

即可在小核找到命令与输出。

![image-20230215142007978](assets/post/README/image-20230215142007978.png)
