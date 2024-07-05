---
sidebar_position: 7
---
# 加载固件

驱动位于 `kernel/linux-4.9/drivers/remoteproc/sunxi_rproc_firmware.c`

首先调用 `sunxi_request_firmware` 函数

```c
int sunxi_request_firmware(const struct firmware **fw, const char *name, struct device *dev)
{
	int ret, index;
	struct firmware *fw_p = NULL;
	u32 img_addr, img_len;

	ret = sunxi_find_firmware_storage();
	if (ret < 0) {
		dev_warn(dev, "Can't finded boot_package head\n");
		return -ENODEV;
	}

	index = ret;

	ret = sunxi_firmware_get_info(dev, index, name, &img_addr, &img_len);
	if (ret < 0) {
		dev_warn(dev, "failed to read boot_package item\n");
		ret = -EFAULT;
		goto out;
	}

	ret = sunxi_firmware_get_data(dev, index, img_addr, img_len, &fw_p);
	if (ret < 0) {
		dev_err(dev, "failed to read Firmware\n");
		ret = -ENOMEM;
		goto out;
	}

	*fw = fw_p;
out:
	return ret;
}
```

驱动会从固件的特定位置读取，使用函数 `sunxi_find_firmware_storage`，这里会去固定的位置查找固件，位置包括 `lib/firmware`，`/dev/mtd0`. `/dev/mtd1`, `/dev/mmcblk0` 等位置。对于Linux启动我们只需要放置于 `lib/firmware ` 即可。

```c
static int sunxi_find_firmware_storage(void)
{
	struct firmware_head_info *head;
	int i, len, ret;
	loff_t pos;
	const char *path;
	u32 flag;

	len = sizeof(*head);
	head = kmalloc(len, GFP_KERNEL);
	if (!head)
		return -ENOMEM;

	ret = sunxi_get_storage_type();

	for (i = 0; i < ARRAY_SIZE(firmware_storages); i++) {
		path = firmware_storages[i].path;
		pos = firmware_storages[i].head_off;
		flag = firmware_storages[i].flag;

		if (flag != ret)
			continue;

		pr_debug("try to open %s\n", path);

		ret = sunxi_firmware_read(path, head, len, &pos, flag);
		if (ret < 0)
			pr_err("open %s failed,ret=%d\n", path, ret);

		if (ret != len)
			continue;

		if (head->magic == FIRMWARE_MAGIC) {
			kfree(head);
			return i;
		}
	}

	kfree(head);

	return -ENODEV;
}
```
