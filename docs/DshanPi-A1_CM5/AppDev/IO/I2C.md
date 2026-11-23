---
title: I²C 设备识别（ES8388）
sidebar_position: 2
slug: /DshanPi-A1_CM5/AppDev/I2C
---

DshanPI A1 CM5 V1.2 底板的 ES8388 音频编解码芯片接在 RK3576 的 **I²C4** 上，7 位地址为 **`0x11`**。Linux 将它记为 `4-0011`。本实验直接读取内核登记的信息，无需接线。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 1. 确认设备名称

在开发板桌面打开终端，输入以下命令。

```bash
cat /sys/bus/i2c/devices/4-0011/name
```

本板输出 `es8388`，说明内核已在 I²C4 的 `0x11` 地址登记这颗芯片。

### 2. 查看绑定的驱动

```bash
basename "$(readlink /sys/bus/i2c/devices/4-0011/driver)"
```

本板输出 `ES8323`。这是该镜像为 ES8388 绑定的驱动名。要继续验证播放或录音，请打开[音频功能测试](../../SystemConfig/04-AudioConfig.md)。

### 3. 查询总线能力（可选）

```bash
sudo apt install i2c-tools
sudo i2cdetect -F 4
```

在输出中找到 `I2C` 一行，本板显示 `yes`。该命令查询控制器支持的传输方式，可在声卡驱动使用 ES8388 时执行。

### 用 C 查询总线能力

应用打开 `/dev/i2c-4` 后，可通过 `I2C_FUNCS` 查询适配器支持的事务。这个调用无需指定从设备地址，适合在音频驱动使用 ES8388 时练习。

**保存总线查询程序。** 从第一行复制到最后单独一行的 `EOF`，终端会写出 `i2c-cap.c`。

```bash
cat > i2c-cap.c <<'EOF'
#include <fcntl.h>
#include <linux/i2c-dev.h>
#include <linux/i2c.h>
#include <stdio.h>
#include <sys/ioctl.h>
#include <unistd.h>

int main(void) {
    int fd = open("/dev/i2c-4", O_RDONLY);
    if (fd < 0) { perror("open"); return 1; }
    unsigned long funcs = 0;
    if (ioctl(fd, I2C_FUNCS, &funcs) < 0) {
        perror("I2C_FUNCS");
        close(fd);
        return 1;
    }
    printf("I2C_FUNC_I2C = %s\n", funcs & I2C_FUNC_I2C ? "yes" : "no");
    close(fd);
    return 0;
}
EOF
```

**编译并运行。** 程序访问 I²C4，打印它是否支持原生 I²C 传输。

```bash
cc -Wall i2c-cap.c -o i2c-cap
sudo ./i2c-cap
```

DshanPI A1 CM5 输出 `I2C_FUNC_I2C = yes`，表示该适配器支持原生 I²C 事务。这个标志描述总线能力；上一节的设备节点与驱动名称用于确认芯片身份。

板载 ES8388 使用 I²C4。V1.2 底板 U35 的 31、32 脚分别引出 I²C0 的 SDA、SCL，本次镜像未提供 `/dev/i2c-0`。可在[I²C 基础](../../AppBasic/08-I2C.md#es8388)对照设备节点、声卡与排针接线。
