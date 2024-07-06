---
sidebar_position: 3
---
# Linux 5.15 以上内核

切换到 Device 模式
```
cat /sys/devices/platform/soc@3000000/soc@3000000:usbc0@0/usb_device
```
切换到 Host 模式
```
cat /sys/devices/platform/soc@3000000/soc@3000000:usbc0@0/usb_host
```
