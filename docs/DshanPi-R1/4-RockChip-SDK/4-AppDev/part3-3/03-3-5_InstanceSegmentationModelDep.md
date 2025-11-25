---
sidebar_position: 5
---
# 实例分割模型部署

参考资料：

- 模型仓库：[https://github.com/airockchip/ultralytics_yolov8](https://github.com/airockchip/ultralytics_yolov8)
- 模型文档：[ultralytics_yolov8/RKOPT_README.zh-CN.md at main · airockchip/ultralytics_yolov8](https://github.com/airockchip/ultralytics_yolov8/blob/main/RKOPT_README.zh-CN.md)
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

> 如已安装过可忽略！

4.修改`./ultralytics/cfg/default.yaml`配置文件

```
vi ./ultralytics/cfg/default.yaml
```

将原始的`model: yolov8n.pt`为：

```
model: yolov8n-seg.pt
```

5.导出ONNX模型

```
python ultralytics/engine/exporter.py
```

如果无法下载模型可直接访问[yolov8n-seg.pt](https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n-seg.pt)，下载后放在`ultralytics_yolov8`目录下，再次执行。

运行效果如下：

```
(yolov8) baiwen@dshanpi-a1:~/ultralytics_yolov8$ python ultralytics/engine/exporter.py
Ultralytics YOLOv8.2.82 🚀 Python-3.9.23 torch-2.4.1 CPU (Cortex-A53)
YOLOv8n-seg summary (fused): 195 layers, 3,404,320 parameters, 0 gradients, 12.6 GFLOPs

PyTorch: starting from 'yolov8n-seg.pt' with input shape (16, 3, 640, 640) BCHW and output shape(s) ((16, 64, 80, 80), (16, 80, 80, 80), (16, 1, 80, 80), (16, 32, 80, 80), (16, 64, 40, 40), (16, 80, 40, 40), (16, 1, 40, 40), (16, 32, 40, 40), (16, 64, 20, 20), (16, 80, 20, 20), (16, 1, 20, 20), (16, 32, 20, 20), (16, 32, 160, 160)) (6.7 MB)

RKNN: starting export with torch 2.4.1...

RKNN: feed yolov8n-seg.onnx to RKNN-Toolkit or RKNN-Toolkit2 to generate RKNN model.
Refer https://github.com/airockchip/rknn_model_zoo/tree/main/models/CV/object_detection/yolo
RKNN: export success ✅ 3.2s, saved as 'yolov8n-seg.onnx' (13.0 MB)

Export complete (34.3s)
Results saved to /home/baiwen/ultralytics_yolov8
Predict:         yolo predict task=segment model=yolov8n-seg.onnx imgsz=640
Validate:        yolo val task=segment model=yolov8n-seg.onnx imgsz=640 data=coco.yaml
Visualize:       https://netron.app
```

执行完成后可以在当前目录下看到ONNX模型文件`yolov8n-seg.onnx`。

```
(yolov8) baiwen@dshanpi-a1:~/ultralytics_yolov8$ ls
CITATION.cff     docs      mkdocs.yml      README.zh-CN.md        tests                 yolov8n.onnx      yolov8n-seg.pt
CONTRIBUTING.md  examples  pyproject.toml  RKOPT_README.md        ultralytics           yolov8n.pt
docker           LICENSE   README.md       RKOPT_README.zh-CN.md  ultralytics.egg-info  yolov8n-seg.onnx
```

将导出的ONNX模型拷贝至yolov8模型目录。

```
cp yolov8n-seg.onnx ~/Projects/rknn_model_zoo/examples/yolov8_seg/model
```



## 2.模型转换

1.使用Conda激活`rknn-toolkit2`环境

```
conda activate rknn-toolkit2
```

2.进入yolov8模型转换目录

```
cd ~/Projects/rknn_model_zoo/examples/yolov8_seg/python
```

3.执行模型转换

```
python3 convert.py ../model/yolov8n-seg.onnx rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8_seg/python$ python3 convert.py ../model/yolov8n-seg.onnx rk3576
I rknn-toolkit2 version: 2.3.2
--> Config model
done
--> Loading model
I Loading : 100%|███████████████████████████████████████████████| 152/152 [00:00<00:00, 8900.13it/s]
done
--> Building model
I OpFusing 0: 100%|██████████████████████████████████████████████| 100/100 [00:00<00:00, 150.96it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 86.53it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 73.52it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 65.14it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:04<00:00, 22.36it/s]
W build: found outlier value, this may affect quantization accuracy
                        const name                        abs_mean    abs_std     outlier value
                        model.22.cv3.1.1.conv.weight      0.12        0.18        -12.310
I GraphPreparing : 100%|████████████████████████████████████████| 183/183 [00:00<00:00, 1047.63it/s]
I Quantizating : 100%|████████████████████████████████████████████| 183/183 [00:41<00:00,  4.45it/s]
W build: The default input dtype of 'images' is changed from 'float32' to 'int8' in rknn model for performance!
                       Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '375' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_383' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '388' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '354' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '395' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_403' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '407' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '361' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '414' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'onnx::ReduceSum_422' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '426' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '368' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of '347' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
I rknn building ...
I rknn building done.
done
--> Export rknn model
done
```

可以看到转换完成后在model目录下看到端侧的RKNN模型。

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8_seg/python$ ls ../model
bus.jpg  coco_80_labels_list.txt  download_model.sh  yolov8n-seg.onnx  yolov8_seg.rknn
```

## 3.模型推理

由于代码需要安装pytorch，执行如下命令：

```
pip3 install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0
pip install pycocotools
```

执行推理测试代码：

```
python3 yolov8_seg.py --model_path ../model/yolov8_seg.rknn --target rk3576 --img_save
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/yolov8_seg/python$ python3 yolov8_seg.py --model_path ../model/yolov8_seg.rknn --target rk3576 --img_save
I rknn-toolkit2 version: 2.3.2
--> Init runtime environment
I target set by user is: rk3576
done
Model-../model/yolov8_seg.rknn is rknn model, starting val
W inference: The 'data_format' is not set, and its default value is 'nhwc'!


IMG: bus.jpg
person @ (209 241 285 509) 0.860
bus  @ (94 137 557 439) 0.829
person @ (109 235 223 535) 0.829
person @ (475 233 560 521) 0.790
The segmentation results have been saved to ./result/bus.jpg
```

运行完成后可以在`./result/bus.jpg`路径看到结果图像。

![image-20250819161239333](${images}/image-20250819161239333.png)

## 4.视频流推理

> 开始前请注意，请务必接入USB摄像头，并确认/dev/目录下存在video0设备节点！！！



1.新建程序文件`yolov8_seg_video.py.py`,填入一下内容：

```
import os
import cv2
import sys
import argparse
import torch
import numpy as np
import torch
import torchvision
import torch.nn.functional as F
from pathlib import Path
from pycocotools.coco import COCO
from pycocotools.cocoeval import COCOeval

# add path
realpath = os.path.abspath(__file__)
_sep = os.path.sep
realpath = realpath.split(_sep)
sys.path.append(os.path.join(realpath[0]+_sep, *realpath[1:realpath.index('rknn_model_zoo')+1]))

from py_utils.coco_utils import COCO_test_helper


OBJ_THRESH = 0.25
NMS_THRESH = 0.45
MAX_DETECT = 300

# The follew two param is for mAP test
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

class Colors:
    # Ultralytics color palette https://ultralytics.com/
    def __init__(self):
        # hex = matplotlib.colors.TABLEAU_COLORS.values()
        hexs = ('FF3838', 'FF9D97', 'FF701F', 'FFB21D', 'CFD231', '48F90A', '92CC17', '3DDB86', '1A9334', '00D4BB',
                '2C99A8', '00C2FF', '344593', '6473FF', '0018EC', '8438FF', '520085', 'CB38FF', 'FF95C8', 'FF37C7')
        self.palette = [self.hex2rgb(f'#{c}') for c in hexs]
        self.n = len(self.palette)

    def __call__(self, i, bgr=False):
        c = self.palette[int(i) % self.n]
        return (c[2], c[1], c[0]) if bgr else c

    @staticmethod
    def hex2rgb(h):  # rgb order (PIL)
        return tuple(int(h[1 + i:1 + i + 2], 16) for i in (0, 2, 4))

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def filter_boxes(boxes, box_confidences, box_class_probs, seg_part):
    """Filter boxes with object threshold.
    """
    box_confidences = box_confidences.reshape(-1)
    candidate, class_num = box_class_probs.shape

    class_max_score = np.max(box_class_probs, axis=-1)
    classes = np.argmax(box_class_probs, axis=-1)

    _class_pos = np.where(class_max_score * box_confidences >= OBJ_THRESH)
    scores = (class_max_score * box_confidences)[_class_pos]

    boxes = boxes[_class_pos]
    classes = classes[_class_pos]
    seg_part = (seg_part * box_confidences.reshape(-1, 1))[_class_pos]

    return boxes, classes, scores, seg_part

def dfl(position):
    # Distribution Focal Loss (DFL)
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
    stride = np.array([IMG_SIZE[1]//grid_h, IMG_SIZE[0] //grid_w]).reshape(1, 2, 1, 1)

    position = dfl(position)
    box_xy  = grid +0.5 -position[:,0:2,:,:]
    box_xy2 = grid +0.5 +position[:,2:4,:,:]
    xyxy = np.concatenate((box_xy*stride, box_xy2*stride), axis=1)

    return xyxy

def post_process(input_data):
    # input_data[0], input_data[4], and input_data[8] are detection box information
    # input_data[1], input_data[5], and input_data[9] are category score information
    # input_data[2], input_data[6], and input_data[10] are confidence score information
    # input_data[3], input_data[7], and input_data[11] are segmentation information
    # input_data[12] is the proto information
    proto = input_data[-1]
    boxes, scores, classes_conf, seg_part = [], [], [], []
    defualt_branch=3
    pair_per_branch = len(input_data)//defualt_branch

    for i in range(defualt_branch):
        boxes.append(box_process(input_data[pair_per_branch*i]))
        classes_conf.append(input_data[pair_per_branch*i+1])
        scores.append(np.ones_like(input_data[pair_per_branch*i+1][:,:1,:,:], dtype=np.float32))
        seg_part.append(input_data[pair_per_branch*i+3])

    def sp_flatten(_in):
        ch = _in.shape[1]
        _in = _in.transpose(0,2,3,1)
        return _in.reshape(-1, ch)

    boxes = [sp_flatten(_v) for _v in boxes]
    classes_conf = [sp_flatten(_v) for _v in classes_conf]
    scores = [sp_flatten(_v) for _v in scores]
    seg_part = [sp_flatten(_v) for _v in seg_part]

    boxes = np.concatenate(boxes)
    classes_conf = np.concatenate(classes_conf)
    scores = np.concatenate(scores)
    seg_part = np.concatenate(seg_part)

    # filter according to threshold
    boxes, classes, scores, seg_part = filter_boxes(boxes, scores, classes_conf, seg_part)

    zipped = zip(boxes, classes, scores, seg_part)
    sort_zipped = sorted(zipped, key=lambda x: (x[2]), reverse=True)
    result = zip(*sort_zipped)

    max_nms = 30000
    n = boxes.shape[0]  # number of boxes
    if not n:
        return None, None, None, None
    elif n > max_nms:  # excess boxes
        boxes, classes, scores, seg_part = [np.array(x[:max_nms]) for x in result]
    else:
        boxes, classes, scores, seg_part = [np.array(x) for x in result]

    # nms
    nboxes, nclasses, nscores, nseg_part = [], [], [], []
    agnostic = 0
    max_wh = 7680
    c = classes * (0 if agnostic else max_wh)
    ids = torchvision.ops.nms(torch.tensor(boxes, dtype=torch.float32) + torch.tensor(c, dtype=torch.float32).unsqueeze(-1),
                              torch.tensor(scores, dtype=torch.float32), NMS_THRESH)
    real_keeps = ids.tolist()[:MAX_DETECT]
    nboxes.append(boxes[real_keeps])
    nclasses.append(classes[real_keeps])
    nscores.append(scores[real_keeps])
    nseg_part.append(seg_part[real_keeps])

    if not nclasses and not nscores:
        return None, None, None, None

    boxes = np.concatenate(nboxes)
    classes = np.concatenate(nclasses)
    scores = np.concatenate(nscores)
    seg_part = np.concatenate(nseg_part)

    ph, pw = proto.shape[-2:]
    proto = proto.reshape(seg_part.shape[-1], -1)
    seg_img = np.matmul(seg_part, proto)
    seg_img = sigmoid(seg_img)
    seg_img = seg_img.reshape(-1, ph, pw)

    seg_threadhold = 0.5

    # crop seg outside box
    seg_img = F.interpolate(torch.tensor(seg_img)[None], torch.Size([640, 640]), mode='bilinear', align_corners=False)[0]
    seg_img_t = _crop_mask(seg_img,torch.tensor(boxes) )

    seg_img = seg_img_t.numpy()
    seg_img = seg_img > seg_threadhold
    return boxes, classes, scores, seg_img

def draw(image, boxes, scores, classes):
    for box, score, cl in zip(boxes, scores, classes):
        top, left, right, bottom = [int(_b) for _b in box]
        print("%s @ (%d %d %d %d) %.3f" % (CLASSES[cl], top, left, right, bottom, score))
        cv2.rectangle(image, (top, left), (right, bottom), (255, 0, 0), 2)
        cv2.putText(image, '{0} {1:.2f}'.format(CLASSES[cl], score),
                    (top, left - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

def _crop_mask(masks, boxes):
    """
    "Crop" predicted masks by zeroing out everything not in the predicted bbox.
    Vectorized by Chong (thanks Chong).

    Args:
        - masks should be a size [h, w, n] tensor of masks
        - boxes should be a size [n, 4] tensor of bbox coords in relative point form
    """

    n, h, w = masks.shape
    x1, y1, x2, y2 = torch.chunk(boxes[:, :, None], 4, 1)  # x1 shape(1,1,n)
    r = torch.arange(w, device=masks.device, dtype=x1.dtype)[None, None, :]  # rows shape(1,w,1)
    c = torch.arange(h, device=masks.device, dtype=x1.dtype)[None, :, None]  # cols shape(h,1,1)
    
    return masks * ((r >= x1) * (r < x2) * (c >= y1) * (c < y2))

def merge_seg(image, seg_img, classes):
    color = Colors()
    for i in range(len(seg_img)):
        seg = seg_img[i]
        seg = seg.astype(np.uint8)
        seg = cv2.cvtColor(seg, cv2.COLOR_GRAY2BGR)
        seg = seg * color(classes[i])
        seg = seg.astype(np.uint8)
        image = cv2.add(image, seg)
    return image

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

    # ---------- 1. 初始化模型 ----------
    model, platform = setup_model(args)
    print('Model ready.')

    # ---------- 2. 打开摄像头 ----------
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print('Cannot open camera.')
        exit(-1)

    co_helper = COCO_test_helper(enable_letter_box=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # ---------- 3. 预处理 ----------
        img = co_helper.letter_box(frame.copy(), IMG_SIZE, pad_color=(114, 114, 114))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        if platform in ['pytorch', 'onnx']:
            input_data = img.transpose(2, 0, 1).astype(np.float32) / 255.
            input_data = np.expand_dims(input_data, 0)
        else:
            input_data = img

        # ---------- 4. 推理 ----------
        outputs = model.run([input_data])
        boxes, classes, scores, seg_img = post_process(outputs)

        # ---------- 5. 可视化 ----------
        vis = frame.copy()
        if boxes is not None:
            real_boxes = co_helper.get_real_box(boxes)
            real_segs  = co_helper.get_real_seg(seg_img)
            vis = merge_seg(vis, real_segs, classes)
            draw(vis, real_boxes, scores, classes)

        cv2.imshow('YOLOv8-Seg', vis)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # ---------- 6. 清理 ----------
    cap.release()
    cv2.destroyAllWindows()
    model.release()
```

2.运行如下命令执行程序：

```
python3 yolov8_seg_video.py --model_path ../model/yolov8_seg.rknn --target rk3576
```

