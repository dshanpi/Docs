---
title: 人脸检测
sidebar_position: 2
slug: /DshanPi-A1_CM5/AppDev/RetinaFace
---

人脸检测输出边界框、置信度与面部关键点。使用示例人像，先在图片上确认眼睛、鼻尖和嘴角的标记位置。

## 从模型输出还原人脸框和五个关键点

RetinaFace 对同一组先验框给出位置偏移、前景分数和关键点偏移。程序先解码位置，按分数筛掉低置信度候选，再用非极大值抑制（NMS）合并重叠框。若预处理用了等比缩放和补边，绘图前也要把坐标换回原图。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上准备模型与程序

先完成 [RKNN 环境搭建](./RKNNSetup.md)。若已有适用于 RK3576 的 `.rknn` 文件，按第 2 步的文件名放入第 1 步的模型目录，然后直接做第 3 步。首次从 ONNX 转换时，从第 1 步开始。

**1. 在电脑上下载原始模型。** 启用 RKNN 转换环境，再到示例的模型目录运行下载脚本。

```bash
source ~/rknn-env/bin/activate
cd ~/Projects/rknn_model_zoo/examples/RetinaFace/model
bash download_model.sh
```

**2. 转换模型。** 进入转换脚本目录，为 RK3576 生成 `RetinaFace.rknn`。

```bash
cd ../python
python convert.py ../model/RetinaFace_mobile320.onnx rk3576 fp ../model/RetinaFace.rknn
```

**3. 编译并打包。** 回到仓库根目录构建人脸程序，再把模型复制到生成的示例目录。

```bash
cd ~/Projects/rknn_model_zoo
bash build-linux.sh -t rk3576 -a aarch64 -d RetinaFace
cp examples/RetinaFace/model/RetinaFace.rknn install/rk3576_linux_aarch64/rknn_RetinaFace_demo/model/
```

### 在 DshanPI A1 CM5 上运行 {#在-cm5-上运行}

将生成的 `rknn_RetinaFace_demo` 整个目录复制到板上主目录，打开终端。

**进入板上的示例目录。** 第二条命令让当前终端能找到程序配套的运行库。

```bash
cd ~/rknn_RetinaFace_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**运行人脸示例。** 使用示例自带的图片，对照下方的实测结果。

```bash
./rknn_retinaface_demo model/RetinaFace.rknn model/test.jpg
```

本次 DshanPI A1 CM5 检出一张人脸，边界框为 `(304, 76)–(474, 300)`，分数 `0.999023`。

![DshanPI A1 CM5 对示例图片的推理结果](../figures/RetinaFace.jpg)

要测试实时场景，可按 [采集三帧摄像头画面](../Vision/Camera.md#把摄像头画面交给-npu) 保存图像，再将命令中的测试图片换为相应帧。

### 用 Python 标出照片和摄像头中的人脸

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。先按上文准备模型。下面先运行配套图片，再接摄像头运行同一个脚本。

**准备板端 Python 环境。** 进入存放模型和测试图片的示例目录。

```bash
source ~/rknn-lite/bin/activate
cd ~/rknn_RetinaFace_demo
```

**先用测试图片检查人脸结果。**

```bash
CM5_IMAGE=model/test.jpg python ~/cm5-examples/RetinaFace.py --model_path model/RetinaFace.rknn
```

**接好摄像头后再处理实时画面。** 将设备路径换为已确认的采集节点。

```bash
CM5_CAMERA=/dev/video42 python ~/cm5-examples/RetinaFace.py --model_path model/RetinaFace.rknn
```

本例模型的输入为 320 × 320，共生成 4200 个先验框。 本次配套图片的输出节选如下。

```text
faces: 1
processed: (427, 640, 3)
```

**外接硬件**　图片模式无需外设。实时模式已接 OV13850，在本板的 `/dev/video42` 连续处理了三帧。
