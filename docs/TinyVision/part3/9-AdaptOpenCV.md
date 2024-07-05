---
sidebar_position: 9
---
# 适配 OpenCV 

### 勾选 OpenCV 包

`m menuconfig` 进入软件包配置，勾选 

```
OpenCV  --->
	<*> opencv....................................................... opencv libs
	[*]   Enabel sunxi vin isp support
```

### OpenCV 适配过程

**本部分的操作已经包含在 tina-bsp-tinyvision.tar.gz 中了，已经适配好了，如果不想了解如何适配 OpenCV 可以直接跳过这部分**

#### OpenCV 的多平面视频捕获支持

一般来说，如果不适配 OpenCV 直接开摄像头，会得到一个报错：

```
[  702.464977] [VIN_ERR]video0 has already stream off
[  702.473357] [VIN_ERR]gc2053_mipi is not used, video0 cannot be close!
VIDEOIO ERROR: V4L2: Unable to capture video memory.VIDEOIO ERROR: V4L: can't open camera by index 0
/dev/video0 does not support memory mapping
Could not open video device.
```

这是由于 OpenCV 的 V4L2 实现是使用的 `V4L2_CAP_VIDEO_CAPTURE` 标准，而 `sunxi-vin` 驱动的 RAW Sensor 平台使用的是 `V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE` ，导致了默认 OpenCV 的配置错误。

`V4L2_CAP_VIDEO_CAPTURE_MPLANE`和`V4L2_BUF_TYPE_VIDEO_CAPTURE`是 Video4Linux2（V4L2）框架中用于视频捕获的不同类型和能力标志。

1. `V4L2_CAP_VIDEO_CAPTURE_MPLANE`： 这个标志指示设备支持多平面（multi-plane）视频捕获。在多平面捕获中，图像数据可以分解成多个平面（planes），每个平面包含不同的颜色分量或者图像数据的不同部分。这种方式可以提高效率和灵活性，尤其适用于处理涉及多个颜色分量或者多个图像通道的视频流。
2. `V4L2_BUF_TYPE_VIDEO_CAPTURE`： 这个类型表示普通的单平面（single-plane）视频捕获。在单平面捕获中，图像数据以单个平面的形式存储，即所有的颜色分量或者图像数据都保存在一个平面中。

因此，区别在于支持的数据格式和存储方式。`V4L2_CAP_VIDEO_CAPTURE_MPLANE`表示设备支持多平面视频捕获，而`V4L2_BUF_TYPE_VIDEO_CAPTURE`表示普通的单平面视频捕获。

这里就需要通过检查`capability.capabilities`中是否包含`V4L2_CAP_VIDEO_CAPTURE`标志来确定是否支持普通的视频捕获类型。如果支持，那么将`type`设置为`V4L2_BUF_TYPE_VIDEO_CAPTURE`。

如果不支持普通的视频捕获类型，那么通过检查`capability.capabilities`中是否包含`V4L2_CAP_VIDEO_CAPTURE_MPLANE`标志来确定是否支持多平面视频捕获类型。如果支持，那么将`type`设置为`V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE`。

例如如下修改：

```diff
-    form.type                = V4L2_BUF_TYPE_VIDEO_CAPTURE;
-    form.fmt.pix.pixelformat = palette;
-    form.fmt.pix.field       = V4L2_FIELD_ANY;
-    form.fmt.pix.width       = width;
-    form.fmt.pix.height      = height;
+    if (capability.capabilities & V4L2_CAP_VIDEO_CAPTURE) {
+		form.type                = V4L2_BUF_TYPE_VIDEO_CAPTURE;
+		form.fmt.pix.pixelformat = palette;
+		form.fmt.pix.field       = V4L2_FIELD_NONE;
+		form.fmt.pix.width       = width;
+		form.fmt.pix.height      = height;
+	} else if (capability.capabilities & V4L2_CAP_VIDEO_CAPTURE_MPLANE) {
+        form.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
+        form.fmt.pix_mp.width = width;
+        form.fmt.pix_mp.height = height;
+        form.fmt.pix_mp.pixelformat = palette;
+        form.fmt.pix_mp.field = V4L2_FIELD_NONE;
+	}
```

这段代码是在设置视频捕获的格式和参数时进行了修改。

原来的代码中，直接设置了`form.type`为`V4L2_BUF_TYPE_VIDEO_CAPTURE`，表示使用普通的视频捕获类型。然后设置了其他参数，如像素格式(`pixelformat`)、帧字段(`field`)、宽度(`width`)和高度(`height`)等。

修改后的代码进行了条件判断，根据设备的能力选择合适的视频捕获类型。如果设备支持普通的视频捕获类型（`V4L2_CAP_VIDEO_CAPTURE`标志被设置），则使用普通的视频捕获类型并设置相应的参数。如果设备支持多平面视频捕获类型（`V4L2_CAP_VIDEO_CAPTURE_MPLANE`标志被设置），则使用多平面视频捕获类型并设置相应的参数。

对于普通的视频捕获类型，设置的参数与原来的代码一致，只是将帧字段(`field`)从`V4L2_FIELD_ANY`改为`V4L2_FIELD_NONE`，表示不指定特定的帧字段。

对于多平面视频捕获类型，设置了新的参数，如多平面的宽度(`pix_mp.width`)、高度(`pix_mp.height`)、像素格式(`pix_mp.pixelformat`)和帧字段(`pix_mp.field`)等。

通过这个修改，可以根据设备的能力选择适当的视频捕获类型，并设置相应的参数，以满足不同设备的要求。

#### OpenCV 的 ISP 支持

OpenCV 默认不支持开启 RAW Sensor，不过现在需要配置为 OpenCV 开启 RAW Sensor 抓图，然后通过 OpenCV 送图到之前适配的 libAWispApi 库进行 ISP 处理。在这里增加一个函数作为 RAW Sensor 抓图的处理。

```c++
#ifdef __USE_VIN_ISP__
bool CvCaptureCAM_V4L::RAWSensor()
{
    struct v4l2_control ctrl;
    struct v4l2_queryctrl qc_ctrl;

    memset(&ctrl, 0, sizeof(struct v4l2_control));
    memset(&qc_ctrl, 0, sizeof(struct v4l2_queryctrl));
    ctrl.id = V4L2_CID_SENSOR_TYPE;
    qc_ctrl.id = V4L2_CID_SENSOR_TYPE;

    if (-1 == ioctl (deviceHandle, VIDIOC_QUERYCTRL, &qc_ctrl)){
        fprintf(stderr, "V4L2: %s QUERY V4L2_CID_SENSOR_TYPE failed\n", deviceName.c_str());
        return false;
    }

    if (-1 == ioctl(deviceHandle, VIDIOC_G_CTRL, &ctrl)) {
        fprintf(stderr, "V4L2: %s G_CTRL V4L2_CID_SENSOR_TYPE failed\n", deviceName.c_str());
        return false;
    }

    return ctrl.value == V4L2_SENSOR_TYPE_RAW;
}
#endif
```

这段代码的功能是检查V4L2摄像头设备的传感器类型是否为RAW格式。它使用了V4L2的ioctl函数来查询和获取传感器类型信息。具体步骤如下：

1. 定义了两个v4l2_control结构体变量`ctrl`和`qc_ctrl`，并初始化为零
2. 将`ctrl.id`和`qc_ctrl.id`分别设置为`V4L2_CID_SENSOR_TYPE`，表示要查询的控制和查询ID
3. 使用`ioctl`函数的VIDIOC_QUERYCTRL命令来查询传感器类型的控制信息，并将结果保存在`qc_ctrl`中
4. 如果查询失败（`ioctl`返回-1），则输出错误信息并返回false
5. 使用`ioctl`函数的VIDIOC_G_CTRL命令来获取传感器类型的当前值，并将结果保存在`ctrl`中
6. 如果获取失败（`ioctl`返回-1），则输出错误信息并返回false
7. 检查`ctrl.value`是否等于`V4L2_SENSOR_TYPE_RAW`，如果相等，则返回true，表示传感器类型为RAW格式；否则返回false

并且使用了`#ifdef __USE_VIN_ISP__`指令。这表示只有在定义了`__USE_VIN_ISP__`宏时，才会编译和执行这段代码

然后在 OpenCV 的 ` bool CvCaptureCAM_V4L::streaming(bool startStream)` 捕获流函数中添加 ISP 处理

```c++
#ifdef __USE_VIN_ISP__
	RawSensor = RAWSensor();

	if (startStream && RawSensor) {
		int VideoIndex = -1;

		sscanf(deviceName.c_str(), "/dev/video%d", &VideoIndex);

		IspPort = CreateAWIspApi();
		IspId = -1;
		IspId = IspPort->ispGetIspId(VideoIndex);
		if (IspId >= 0)
			IspPort->ispStart(IspId);
	} else if (RawSensor && IspId >= 0 && IspPort) {
		IspPort->ispStop(IspId);
		DestroyAWIspApi(IspPort);
		IspPort = NULL;
		IspId = -1;
	}
#endif
```

这段代码是在条件编译`__USE_VIN_ISP__`的情况下进行了修改。

- 首先，它创建了一个`RawSensor`对象，并检查`startStream`和`RawSensor`是否为真。如果满足条件，接下来会解析设备名称字符串，提取出视频索引号。

- 然后，它调用`CreateAWIspApi()`函数创建了一个AWIspApi对象，并初始化变量`IspId`为-1。接着，通过调用`ispGetIspId()`函数获取指定视频索引号对应的ISP ID，并将其赋值给`IspId`。如果`IspId`大于等于0，表示获取到有效的ISP ID，就调用`ispStart()`函数启动ISP流处理。

- 如果不满足第一个条件，即`startStream`为假或者没有`RawSensor`对象，那么会检查`IspId`是否大于等于0并且`IspPort`对象是否存在。如果满足这些条件，说明之前已经启动了ISP流处理，此时会调用`ispStop()`函数停止ISP流处理，并销毁`IspPort`对象。最后，将`IspPort`置为空指针，将`IspId`重置为-1。

这段代码主要用于控制图像信号处理（ISP）的启动和停止。根据条件的不同，可以选择在开始视频流捕获时启动ISP流处理，或者在停止视频流捕获时停止ISP流处理，以便对视频数据进行处理和增强。

至于其他包括编译脚本的修改，全局变量定义等操作，可以参考补丁文件 `openwrt/package/thirdparty/vision/opencv/patches/0004-support-sunxi-vin-camera.patch` 