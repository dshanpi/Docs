---
title: RKNN 环境搭建
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/RKNNSetup
---

模型转换在 **Ubuntu x86_64 电脑**上完成，WSL Ubuntu 22.04 也可以。程序部署到 **DshanPI A1 CM5** 后，由 RKNN Runtime 调用 RK3576 的 NPU。下面使用 2.3.2 版工具。

## 分清模型转换、编译和推理

原始权重先导出为 ONNX，再用 RKNN-Toolkit2 指定目标芯片、构建并导出 `.rknn`。使用整数量化时，还需要代表实际输入的校准样本。板上的程序加载 `.rknn`，通过运行库和内核驱动把计算提交给 NPU。

<img src={require('../figures/rknn-toolchain.png').default} width="670" alt="模型在电脑端转换为 RKNN，由板端应用通过运行库调用 NPU" />

| 所在位置 | 工具 | 产物或用途 |
| --- | --- | --- |
| x86_64 Ubuntu | RKNN-Toolkit2 | 编译、量化并导出目标芯片的模型 |
| Ubuntu 主机 | AArch64 交叉编译器 | 构建板端 C/C++ 示例 |
| DshanPI A1 CM5 | RKNN-Toolkit-Lite2 或 C/C++ Runtime | 加载模型、准备输入、读取推理输出 |

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在电脑上准备转换与编译工具

在 **Ubuntu 22.04 电脑**上打开终端，按顺序完成下面五步。后续转换模型时，继续使用这里创建的 Python 环境。

**1. 在电脑上安装工具。** Git 用来下载源码，CMake 和交叉编译器用来在电脑上生成开发板能运行的程序。

```bash
sudo apt install git python3-venv cmake gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
```

**2. 下载工具包和示例。** 第一行创建并进入主目录下的 `Projects` 文件夹。两条 `git clone` 分别下载 2.3.2 版转换工具和配套示例。完成后，`~/Projects` 下会有 `rknn-toolkit2` 和 `rknn_model_zoo` 两个目录。

```bash
mkdir -p ~/Projects && cd ~/Projects
git clone --depth 1 -b v2.3.2 https://github.com/airockchip/rknn-toolkit2.git
git clone --depth 1 -b v2.3.2 https://github.com/airockchip/rknn_model_zoo.git
```

**3. 创建并启用 Python 环境。** 第一条在主目录创建 `rknn-env`，第二条让当前终端使用它。后续步骤继续在这个终端执行。

```bash
python3 -m venv ~/rknn-env
source ~/rknn-env/bin/activate
```

**4. 安装 RKNN 转换工具。** 进入工具包的安装目录，用 Python 3.10 安装依赖和对应的 `.whl` 安装包。

```bash
cd ~/Projects/rknn-toolkit2/rknn-toolkit2/packages/x86_64
python -m pip install -r requirements_cp310-2.3.2.txt ./rknn_toolkit2-2.3.2-cp310-*.whl
```

**5. 检查能否加载 RKNN。** 看到 `RKNN ready`，说明电脑端的转换工具可以使用。

```bash
python -c 'from rknn.api import RKNN; print("RKNN ready")'
```

`build-linux.sh -t rk3576 -a aarch64` 编译板端程序，模型章节会给出具体项目名。把 **整个** `install/rk3576_linux_aarch64/rknn_项目名_demo` 文件夹复制到 DshanPI A1 CM5 主目录，保留其中的 `lib`、`model` 和标签文件。 [文件传输指南](../../SystemConfig/03-FileTransfer.md)

### 在 DshanPI A1 CM5 运行一次分类 {#在-cm5-运行一次分类}

将电脑上的 `rknn-toolkit2` 仓库也复制到板上的 `~/Projects`。在 DshanPI A1 CM5 桌面按 **Super**，搜索“终端”。以下命令适用于本次 Ubuntu 24.04、Python 3.12、aarch64 镜像。

**安装板端依赖。** 这里使用开发板自己的 Python 和 OpenCV。

```bash
sudo apt install python3-venv python3-opencv python3-numpy python3-ruamel.yaml python3-psutil
```

**创建板端 Python 环境。** `--system-site-packages` 允许该环境使用刚安装的系统软件包。

```bash
python3 -m venv --system-site-packages ~/rknn-lite
source ~/rknn-lite/bin/activate
```

**安装 Lite2。** 进入从电脑复制过来的工具包目录，安装适用于板端 Python 3.12 的版本。

```bash
cd ~/Projects/rknn-toolkit2
python -m pip install ./rknn-toolkit-lite2/packages/*cp312*aarch64.whl
```

**检查运行库。** 若系统还没有 `librknnrt.so`，这条命令会从工具包复制一份。

```bash
test -e /usr/lib/librknnrt.so || sudo install -m 644 rknpu2/runtime/Linux/librknn_api/aarch64/librknnrt.so /usr/lib/librknnrt.so
```

**运行图片分类。** 进入 ResNet18 示例目录，用自带的图片测试 NPU，再对照下方输出。

```bash
cd rknn-toolkit-lite2/examples/resnet18
python test.py
```

本板日志显示 `librknnrt version: 2.3.2`、驱动 `0.9.8`，示例图的首项为 `space shuttle`，分数 `0.999638`。若提示找不到动态库，先核对 `/usr/lib/librknnrt.so` 的架构与版本。 [Rockchip 工具与模型示例](https://github.com/airockchip/rknn_model_zoo/tree/v2.3.2)

### 用 Lite2 运行 YOLOv8 图片示例

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。在上文建立的板端虚拟环境中，使用 Lite2 运行 Model Zoo 的 YOLOv8 图片示例。先按 [YOLOv8 教程](./YOLOv8.md) 将模型和 `bus.jpg` 放入板端示例目录。

**启用板端环境并安装示例依赖。**

```bash
source ~/rknn-lite/bin/activate
python -m pip install torch==2.5.1
```

**运行图片检测。** 在模型目录运行脚本，结果图保存在下方给出的路径。

```bash
cd ~/rknn_yolov8_demo
python ~/cm5-examples/yolov8_images.py --target rk3576 --model_path model/yolov8.rknn --img_folder model --img_save
```

```text
Detection result save to ./result/bus.jpg
```

打开 `result/bus.jpg` 可核对框的位置。在桌面终端将 `--img_save` 换为 `--img_show` 可打开预览。另一次运行上文的 ResNet18 分类程序，首项为 `[812] score:0.999638 class:"space shuttle"`。模型转换仍在 x86_64 电脑上执行。
