---
title: 车牌字符识别
sidebar_position: 7
slug: /DshanPi-A1_CM5/AppDev/LPRNet
---

LPRNet 的输入是已裁好的单张车牌图，输出是按顺序排列的字符。使用整张道路照片时，需要先检测并裁出车牌。

## 将模型输出解码为车牌字符串

LPRNet 把车牌图像编码成从左到右的一串字符分数。每个时间步先取分数最高的类别，再合并相邻的重复类别并去掉空白符。空白符可以分隔两个相同字符，所以先合并重复、再去空白。解码字符表的顺序必须与模型训练时一致。

下面用已映射为字符的六个时间步说明解码顺序，`None` 表示空白符。

~~~python
from itertools import groupby

predictions = ["湘", "湘", None, "F", None, "F"]
plate = "".join(char for char, _ in groupby(predictions) if char is not None)
print(plate)  # 湘FF
~~~

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上准备模型与程序

先完成 [RKNN 环境搭建](./RKNNSetup.md)。若已有适用于 RK3576 的 `.rknn` 文件，按第 2 步的文件名放入第 1 步的模型目录，然后直接做第 3 步。首次从 ONNX 转换时，从第 1 步开始。

**1. 在电脑上下载原始模型。** 启用 RKNN 转换环境，再到示例的模型目录运行下载脚本。

```bash
source ~/rknn-env/bin/activate
cd ~/Projects/rknn_model_zoo/examples/LPRNet/model
bash download_model.sh
```

**2. 转换模型。** 进入转换脚本目录，为 RK3576 生成 `lprnet.rknn`。

```bash
cd ../python
python convert.py ../model/lprnet.onnx rk3576 fp ../model/lprnet.rknn
```

**3. 编译并打包。** 回到仓库根目录构建车牌程序，再把模型复制到生成的示例目录。

```bash
cd ~/Projects/rknn_model_zoo
bash build-linux.sh -t rk3576 -a aarch64 -d LPRNet
cp examples/LPRNet/model/lprnet.rknn install/rk3576_linux_aarch64/rknn_LPRNet_demo/model/
```

### 在 DshanPI A1 CM5 上运行 {#在-cm5-上运行}

将生成的 `rknn_LPRNet_demo` 整个目录复制到板上主目录，打开终端。

**进入板上的示例目录。** 第二条命令让当前终端能找到程序配套的运行库。

```bash
cd ~/rknn_LPRNet_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**运行车牌示例。** 使用示例自带的图片，对照下方的实测结果。

```bash
./rknn_lprnet_demo model/lprnet.rknn model/test.jpg
```

本次 DshanPI A1 CM5 输出 `车牌识别结果: 湘F6CL03`。将字符顺序与 `model/test.jpg` 中的车牌逐字核对。

### 对照 CTC 解码与真实车牌识别结果

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。先运行 CTC 字符合并示例，再用 NPU 识别配套车牌图。

**启用板端环境并进入示例目录。**

```bash
source ~/rknn-lite/bin/activate
cd ~/rknn_LPRNet_demo
```

**先检查字符合并规则。**

```bash
python ~/cm5-examples/decode_plate.py
```

**用模型识别车牌图片。**

```bash
python ~/cm5-examples/LPRNet.py --model_path model/lprnet.rknn --image model/test.jpg
```

```text
湘FF
车牌识别结果: 湘F6CL03
```

第一行演示空白符分隔的两个 `F` 会保留。第二行来自模型对 `test.jpg` 的实际推理。
