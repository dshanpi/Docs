---
sidebar_position: 4
---
# 目标检测模型部署

参考资料：

- 模型仓库：[https://github.com/airockchip/ultralytics_yolov8](https://github.com/airockchip/ultralytics_yolov8)
- 模型源码资料包（国内用户推荐）：[https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/utils/ultralytics_yolov8.zip](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/utils/ultralytics_yolov8.zip)

## 1.获取原始模型

1.进入目标检测模型仓库：

```
git clone https://github.com/airockchip/ultralytics_yolov8
cd ultralytics_yolov8
```

2.使用conda创建环境

```
conda create -name yolov8 python=3.9
conda activate yolov8
```

3.安装yolov8相关依赖

```
pip3 install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 ultralytics==8.3.31 onnx==1.17.0 onnxruntime==1.8.0 onnxsim==0.4.36
```

4.导出ONNX模型

```
python ultralytics/engine/exporter.py
```

如果无法下载模型可直接访问[yolov8n.pt](https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt)，下载后放在`ultralytics_yolov8`目录下，再次执行。

运行效果如下：

```
(yolov8) baiwen@dshanpi-a1:~/ultralytics_yolov8$ python ultralytics/engine/exporter.py
Ultralytics YOLOv8.2.82 🚀 Python-3.9.23 torch-2.4.1 CPU (Cortex-A53)
YOLOv8n summary (fused): 168 layers, 3,151,904 parameters, 0 gradients, 8.7 GFLOPs

PyTorch: starting from 'yolov8n.pt' with input shape (16, 3, 640, 640) BCHW and output shape(s) ((16, 64, 80, 80), (16, 80, 80, 80), (16, 1, 80, 80), (16, 64, 40, 40), (16, 80, 40, 40), (16, 1, 40, 40), (16, 64, 20, 20), (16, 80, 20, 20), (16, 1, 20, 20)) (6.2 MB)

RKNN: starting export with torch 2.4.1...

RKNN: feed yolov8n.onnx to RKNN-Toolkit or RKNN-Toolkit2 to generate RKNN model.
Refer https://github.com/airockchip/rknn_model_zoo/tree/main/models/CV/object_detection/yolo
RKNN: export success ✅ 2.8s, saved as 'yolov8n.onnx' (12.1 MB)

Export complete (24.8s)
Results saved to /home/baiwen/ultralytics_yolov8
Predict:         yolo predict task=detect model=yolov8n.onnx imgsz=640
Validate:        yolo val task=detect model=yolov8n.onnx imgsz=640 data=coco.yaml
Visualize:       https://netron.app
```

执行完成后可以在当前目录下看到ONNX模型文件`yolov8n.onnx`。

```
(yolov8) baiwen@dshanpi-a1:~/ultralytics_yolov8$ ls
CITATION.cff     docker  examples  mkdocs.yml      README.md        RKOPT_README.md        tests        ultralytics.egg-info  yolov8n.pt
CONTRIBUTING.md  docs    LICENSE   pyproject.toml  README.zh-CN.md  RKOPT_README.zh-CN.md  ultralytics  yolov8n.onnx
```

将导出的ONNX模型拷贝至yolov8模型目录。

```
cp yolov8n.onnx ~/Projects/rknn_model_zoo/examples/yolov8/model
```



## 2.模型转换

1.使用Conda激活`rknn-toolkit2`环境

```
conda activate rknn-toolkit2
```

2.进入yolov8模型转换目录

```
cd ~/Projects/rknn_model_zoo/examples/yolov8/python
```

3.执行模型转换

```
python3 convert.py ../model/yolov8n.onnx rk3576
```

运行效果如下：

```

(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8/python$ python3 convert.py ../model/yolov8n.onnx rk3576
I rknn-toolkit2 version: 2.3.2
--> Config model
done
--> Loading model
I Loading : 100%|███████████████████████████████████████████████| 126/126 [00:00<00:00, 9216.48it/s]
done
--> Building model
I OpFusing 0: 100%|██████████████████████████████████████████████| 100/100 [00:00<00:00, 173.69it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 99.72it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 84.03it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 74.45it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:03<00:00, 26.99it/s]
W build: found outlier value, this may affect quantization accuracy
                        const name                        abs_mean    abs_std     outlier value
                        model.0.conv.weight               2.44        2.47        -17.494
                        model.22.cv3.2.1.conv.weight      0.09        0.14        -10.215
                        model.22.cv3.1.1.conv.weight      0.12        0.19        13.361, 13.317
                        model.22.cv3.0.1.conv.weight      0.18        0.20        -11.216
I GraphPreparing : 100%|█████████████████████████████████████████| 161/161 [00:00<00:00, 854.69it/s]
I Quantizating : 100%|████████████████████████████████████████████| 161/161 [00:32<00:00,  4.91it/s]
W build: The default input dtype of 'images' is changed from 'float32' to 'int8' in rknn model for performance!
                       Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '318' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_326' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '331' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '338' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_346' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '350' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '357' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_365' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '369' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
I rknn building ...
I rknn building done.
done
--> Export rknn model
done
```

可以看到转换完成后在model目录下看到端侧的RKNN模型。

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8/python$ ls ../model
bus.jpg  coco_80_labels_list.txt  dataset.txt  download_model.sh  yolov8n.onnx  yolov8.rknn
```

## 3.模型推理

执行推理测试代码：

```
python3 yolov8.py --model_path ../model/yolov8.rknn --target rk3576 --img_show
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8/python$ python3 yolov8.py --model_path ../model/yolov8.rknn --target rk3576
I rknn-toolkit2 version: 2.3.2
--> Init runtime environment
I target set by user is: rk3576
done
Model-../model/yolov8.rknn is rknn model, starting val
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
```

运行后会弹出下图所示的检测结果图：

![image-20250819151219428](${images}/image-20250819151219428.png)

## 4.视频流推理

> 开始前请注意，请务必接入USB摄像头，并确认/dev/目录下存在video0设备节点！！！



1.新建程序文件`yolov8_video.py.py`,填入一下内容：

```
import os
import cv2
import sys
import argparse

# add path
realpath = os.path.abspath(__file__)
_sep = os.path.sep
realpath = realpath.split(_sep)
sys.path.append(os.path.join(realpath[0]+_sep, *realpath[1:realpath.index('rknn_model_zoo')+1]))

from py_utils.coco_utils import COCO_test_helper
import numpy as np


OBJ_THRESH = 0.25
NMS_THRESH = 0.45

# The follew two param is for map test
# OBJ_THRESH = 0.001
# NMS_THRESH = 0.65

IMG_SIZE = (640, 640)  # (width, height), such as (1280, 736)

CLASSES = ("person", "bicycle", "car","motorbike ","aeroplane ","bus ","train","truck ","boat","traffic light",
           "fire hydrant","stop sign ","parking meter","bench","bird","cat","dog ","horse ","sheep","cow","elephant",
           "bear","zebra ","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee","skis","snowboard","sports ball","kite",
           "baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle","wine glass","cup","fork","knife ",
           "spoon","bowl","banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza ","donut","cake","chair","sofa",
           "pottedplant","bed","diningtable","toilet ","tvmonitor","laptop	","mouse	","remote ","keyboard ","cell phone","microwave ",
           "oven ","toaster","sink","refrigerator ","book","clock","vase","scissors ","teddy bear ","hair drier", "toothbrush ")

coco_id_list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 31, 32, 33, 34,
         35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
         64, 65, 67, 70, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 84, 85, 86, 87, 88, 89, 90]


def filter_boxes(boxes, box_confidences, box_class_probs):
    """Filter boxes with object threshold.
    """
    box_confidences = box_confidences.reshape(-1)
    candidate, class_num = box_class_probs.shape

    class_max_score = np.max(box_class_probs, axis=-1)
    classes = np.argmax(box_class_probs, axis=-1)

    _class_pos = np.where(class_max_score* box_confidences >= OBJ_THRESH)
    scores = (class_max_score* box_confidences)[_class_pos]

    boxes = boxes[_class_pos]
    classes = classes[_class_pos]

    return boxes, classes, scores

def nms_boxes(boxes, scores):
    """Suppress non-maximal boxes.
    # Returns
        keep: ndarray, index of effective boxes.
    """
    x = boxes[:, 0]
    y = boxes[:, 1]
    w = boxes[:, 2] - boxes[:, 0]
    h = boxes[:, 3] - boxes[:, 1]

    areas = w * h
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)

        xx1 = np.maximum(x[i], x[order[1:]])
        yy1 = np.maximum(y[i], y[order[1:]])
        xx2 = np.minimum(x[i] + w[i], x[order[1:]] + w[order[1:]])
        yy2 = np.minimum(y[i] + h[i], y[order[1:]] + h[order[1:]])

        w1 = np.maximum(0.0, xx2 - xx1 + 0.00001)
        h1 = np.maximum(0.0, yy2 - yy1 + 0.00001)
        inter = w1 * h1

        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= NMS_THRESH)[0]
        order = order[inds + 1]
    keep = np.array(keep)
    return keep

def dfl(position):
    # Distribution Focal Loss (DFL)
    import torch
    x = torch.tensor(position)
    n,c,h,w = x.shape
    p_num = 4
    mc = c//p_num
    y = x.reshape(n,p_num,mc,h,w)
    y = y.softmax(2)
    acc_metrix = torch.tensor(range(mc)).float().reshape(1,1,mc,1,1)
    y = (y*acc_metrix).sum(2)
    return y.numpy()


def box_process(position):
    grid_h, grid_w = position.shape[2:4]
    col, row = np.meshgrid(np.arange(0, grid_w), np.arange(0, grid_h))
    col = col.reshape(1, 1, grid_h, grid_w)
    row = row.reshape(1, 1, grid_h, grid_w)
    grid = np.concatenate((col, row), axis=1)
    stride = np.array([IMG_SIZE[1]//grid_h, IMG_SIZE[0]//grid_w]).reshape(1,2,1,1)

    position = dfl(position)
    box_xy  = grid +0.5 -position[:,0:2,:,:]
    box_xy2 = grid +0.5 +position[:,2:4,:,:]
    xyxy = np.concatenate((box_xy*stride, box_xy2*stride), axis=1)

    return xyxy

def post_process(input_data):
    boxes, scores, classes_conf = [], [], []
    defualt_branch=3
    pair_per_branch = len(input_data)//defualt_branch
    # Python 忽略 score_sum 输出
    for i in range(defualt_branch):
        boxes.append(box_process(input_data[pair_per_branch*i]))
        classes_conf.append(input_data[pair_per_branch*i+1])
        scores.append(np.ones_like(input_data[pair_per_branch*i+1][:,:1,:,:], dtype=np.float32))

    def sp_flatten(_in):
        ch = _in.shape[1]
        _in = _in.transpose(0,2,3,1)
        return _in.reshape(-1, ch)

    boxes = [sp_flatten(_v) for _v in boxes]
    classes_conf = [sp_flatten(_v) for _v in classes_conf]
    scores = [sp_flatten(_v) for _v in scores]

    boxes = np.concatenate(boxes)
    classes_conf = np.concatenate(classes_conf)
    scores = np.concatenate(scores)

    # filter according to threshold
    boxes, classes, scores = filter_boxes(boxes, scores, classes_conf)

    # nms
    nboxes, nclasses, nscores = [], [], []
    for c in set(classes):
        inds = np.where(classes == c)
        b = boxes[inds]
        c = classes[inds]
        s = scores[inds]
        keep = nms_boxes(b, s)

        if len(keep) != 0:
            nboxes.append(b[keep])
            nclasses.append(c[keep])
            nscores.append(s[keep])

    if not nclasses and not nscores:
        return None, None, None

    boxes = np.concatenate(nboxes)
    classes = np.concatenate(nclasses)
    scores = np.concatenate(nscores)

    return boxes, classes, scores


def draw(image, boxes, scores, classes):
    for box, score, cl in zip(boxes, scores, classes):
        top, left, right, bottom = [int(_b) for _b in box]
        print("%s @ (%d %d %d %d) %.3f" % (CLASSES[cl], top, left, right, bottom, score))
        cv2.rectangle(image, (top, left), (right, bottom), (255, 0, 0), 2)
        cv2.putText(image, '{0} {1:.2f}'.format(CLASSES[cl], score),
                    (top, left - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

def setup_model(args):
    model_path = args.model_path
    if model_path.endswith('.pt') or model_path.endswith('.torchscript'):
        platform = 'pytorch'
        from py_utils.pytorch_executor import Torch_model_container
        model = Torch_model_container(args.model_path)
    elif model_path.endswith('.rknn'):
        platform = 'rknn'
        from py_utils.rknn_executor import RKNN_model_container 
        model = RKNN_model_container(args.model_path, args.target, args.device_id)
    elif model_path.endswith('onnx'):
        platform = 'onnx'
        from py_utils.onnx_executor import ONNX_model_container
        model = ONNX_model_container(args.model_path)
    else:
        assert False, "{} is not rknn/pytorch/onnx model".format(model_path)
    print('Model-{} is {} model, starting val'.format(model_path, platform))
    return model, platform

def img_check(path):
    img_type = ['.jpg', '.jpeg', '.png', '.bmp']
    for _type in img_type:
        if path.endswith(_type) or path.endswith(_type.upper()):
            return True
    return False

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='YOLOv8-Seg Real-time Demo')
    parser.add_argument('--model_path', type=str, required=True,
                        help='model path, could be .pt or .rknn file')
    parser.add_argument('--target', type=str, default='rk3566',
                        help='target RKNPU platform')
    parser.add_argument('--device_id', type=str, default=None,
                        help='device id')
    args = parser.parse_args()

    # 1. 初始化模型
    model, platform = setup_model(args)
    print('Model ready.')

    # 2. 打开摄像头
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print('Cannot open camera.')
        exit(-1)

    # 3. 实时循环
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        h0, w0 = frame.shape[:2]

        # 3-1 LetterBox 预处理
        co_helper = COCO_test_helper(enable_letter_box=True)
        img = co_helper.letter_box(frame.copy(), IMG_SIZE, pad_color=(0, 0, 0))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 3-2 构造输入
        if platform in ['pytorch', 'onnx']:
            input_data = img.transpose(2, 0, 1).astype(np.float32) / 255.
            input_data = np.expand_dims(input_data, 0)
        else:
            input_data = img

        # 3-3 推理
        outputs = model.run([input_data])
        boxes, classes, scores = post_process(outputs)

        # 3-4 画框
        vis = frame.copy()
        if boxes is not None:
            boxes_real = co_helper.get_real_box(boxes)
            draw(vis, boxes_real, scores, classes)

        # 3-5 实时显示
        cv2.imshow('YOLOv8', vis)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    model.release()
```

运行如下命令推理：

```
python3 yolov8_video.py --model_path ../model/yolov8.rknn --target rk3576
```

