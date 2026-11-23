---
title: 人体关键点检测
sidebar_position: 3
slug: /DshanPi-A1_CM5/AppDev/Pose
---

姿态模型为每个人输出检测框和关节坐标。结果图将肩、肘、膝等关键点连成骨架，可检查不同人物是否被正确区分。

## 从检测框还原人体骨架

姿态模型同时输出人的位置和关键点。视频程序按尺度解码候选框，经 NMS 留下每个人的框，再把关键点的 `x`、`y` 坐标从模型输入换回原图。按骨架连接表绘制点与线时，同一组关键点要始终对应同一个人框。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上准备模型与程序

先完成 [RKNN 环境搭建](./RKNNSetup.md)。若已有适用于 RK3576 的 `.rknn` 文件，按第 2 步的文件名放入第 1 步的模型目录，然后直接做第 3 步。首次从 ONNX 转换时，从第 1 步开始。

**1. 在电脑上下载原始模型。** 启用 RKNN 转换环境，再到示例的模型目录运行下载脚本。

```bash
source ~/rknn-env/bin/activate
cd ~/Projects/rknn_model_zoo/examples/yolov8_pose/model
bash download_model.sh
```

**2. 转换模型。** 进入转换脚本目录，为 RK3576 生成 `yolov8n-pose.rknn`。

```bash
cd ../python
python convert.py ../model/yolov8n-pose.onnx rk3576 fp ../model/yolov8_pose.rknn
```

**3. 编译并打包。** 回到仓库根目录构建姿态程序，再把模型复制到生成的示例目录。

```bash
cd ~/Projects/rknn_model_zoo
bash build-linux.sh -t rk3576 -a aarch64 -d yolov8_pose
cp examples/yolov8_pose/model/yolov8_pose.rknn install/rk3576_linux_aarch64/rknn_yolov8_pose_demo/model/
```

### 在 DshanPI A1 CM5 上运行 {#在-cm5-上运行}

将生成的 `rknn_yolov8_pose_demo` 整个目录复制到板上主目录，打开终端。

**进入板上的示例目录。** 第二条命令让当前终端能找到程序配套的运行库。

```bash
cd ~/rknn_yolov8_pose_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**运行姿态示例。** 使用示例自带的图片，对照下方的实测结果。

```bash
./rknn_yolov8_pose_demo model/yolov8_pose.rknn model/bus.jpg
```

本次 DshanPI A1 CM5 检出三个人，其中一个框为 `(108, 235)–(223, 536)`，分数 `0.888`。

![DshanPI A1 CM5 对示例图片的推理结果](../figures/yolov8_pose.png)

要测试实时场景，可按 [采集三帧摄像头画面](../Vision/Camera.md#把摄像头画面交给-npu) 保存图像，再将命令中的测试图片换为相应帧。

### 用 Python 绘制人体关键点

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。先按上文准备模型。下面先运行配套图片，再接摄像头运行同一个脚本。

**准备板端 Python 环境。** 进入存放模型和测试图片的示例目录。

```bash
source ~/rknn-lite/bin/activate
cd ~/rknn_yolov8_pose_demo
```

**先用测试图片检查姿态结果。**

```bash
CM5_IMAGE=model/bus.jpg python ~/cm5-examples/Pose.py --model_path model/yolov8_pose.rknn
```

**接好摄像头后再处理实时画面。** 将设备路径换为已确认的采集节点。

```bash
CM5_CAMERA=/dev/video42 python ~/cm5-examples/Pose.py --model_path model/yolov8_pose.rknn
```

在公交车示例图上检出 3 人，并逐人绘制关键点。 本次配套图片的输出节选如下。

```text
people: 3
processed: (640, 640, 3)
```

**外接硬件**　图片模式无需外设。实时模式已接 OV13850，在本板的 `/dev/video42` 连续处理了三帧。
