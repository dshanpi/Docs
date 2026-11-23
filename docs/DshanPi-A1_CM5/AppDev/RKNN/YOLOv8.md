---
title: YOLOv8 目标检测
sidebar_position: 4
slug: /DshanPi-A1_CM5/AppDev/YOLOv8
---

目标检测给出类别、置信度和边界框。以公交车图片为例，观察模型是否能同时定位车辆和行人。

## 解码候选框并筛选目标

YOLOv8 在多个分辨率的特征图上预测物体的位置和类别。示例先解码每个位置到框边界的距离，按分数筛出候选框，再对同类框做 NMS。输出包括类别、分数和边界坐标，绘图时要还原输入缩放与补边。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上准备模型与程序

先完成 [RKNN 环境搭建](./RKNNSetup.md)。若已有适用于 RK3576 的 `.rknn` 文件，按第 2 步的文件名放入第 1 步的模型目录，然后直接做第 3 步。首次从 ONNX 转换时，从第 1 步开始。

**1. 在电脑上下载原始模型。** 启用 RKNN 转换环境，再到示例的模型目录运行下载脚本。

```bash
source ~/rknn-env/bin/activate
cd ~/Projects/rknn_model_zoo/examples/yolov8/model
bash download_model.sh
```

**2. 转换模型。** 进入转换脚本目录，为 RK3576 生成 `yolov8.rknn`。

```bash
cd ../python
python convert.py ../model/yolov8n.onnx rk3576 fp ../model/yolov8.rknn
```

**3. 编译并打包。** 回到仓库根目录构建目标检测程序，再把模型复制到生成的示例目录。

```bash
cd ~/Projects/rknn_model_zoo
bash build-linux.sh -t rk3576 -a aarch64 -d yolov8
cp examples/yolov8/model/yolov8.rknn install/rk3576_linux_aarch64/rknn_yolov8_demo/model/
```

### 在 DshanPI A1 CM5 上运行 {#在-cm5-上运行}

将生成的 `rknn_yolov8_demo` 整个目录复制到板上主目录，打开终端。

**进入板上的示例目录。** 第二条命令让当前终端能找到程序配套的运行库。

```bash
cd ~/rknn_yolov8_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**运行目标检测示例。** 使用示例自带的图片，对照下方的实测结果。

```bash
./rknn_yolov8_demo model/yolov8.rknn model/bus.jpg
```

本次 DshanPI A1 CM5 输出 `bus @ (99 135 550 456) 0.850`。结果图中还能看到行人的检测框。

![DshanPI A1 CM5 对示例图片的推理结果](../figures/yolov8.png)

要测试实时场景，可按 [采集三帧摄像头画面](../Vision/Camera.md#把摄像头画面交给-npu) 保存图像，再将命令中的测试图片换为相应帧。

### 用 Python 核对公交车检测框

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。先按上文准备模型。下面先运行配套图片，再接摄像头运行同一个脚本。

**准备板端 Python 环境。** 进入存放模型和测试图片的示例目录。

```bash
source ~/rknn-lite/bin/activate
python -m pip install torch==2.5.1
cd ~/rknn_yolov8_demo
```

**先用测试图片检查目标检测结果。**

```bash
CM5_IMAGE=model/bus.jpg python ~/cm5-examples/YOLOv8.py --model_path model/yolov8.rknn
```

**接好摄像头后再处理实时画面。** 将设备路径换为已确认的采集节点。

```bash
CM5_CAMERA=/dev/video42 python ~/cm5-examples/YOLOv8.py --model_path model/yolov8.rknn
```

`objects` 是经过阈值筛选和非极大值抑制后保留的目标数。 本次配套图片的输出节选如下。

```text
bus  @ (99 135 550 456) 0.850
objects: 5
processed: (640, 640, 3)
```

**外接硬件**　图片模式无需外设。实时模式已接 OV13850，在本板的 `/dev/video42` 连续处理了三帧。
