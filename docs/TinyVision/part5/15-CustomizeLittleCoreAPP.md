---
sidebar_position: 15
---
# 自定义小核 APP

小核的程序入口位于 `e907_rtos/rtos/source/projects/v851-e907-lizard/src/main.c`

```
#include <stdio.h>
#include <openamp/sunxi_helper/openamp.h>

int app_entry(void *param)
{
    return 0;
}
```

可以自定义小核所运行的程序。
