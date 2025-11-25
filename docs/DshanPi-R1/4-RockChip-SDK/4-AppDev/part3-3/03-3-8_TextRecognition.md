---
sidebar_position: 8
---
# 文字识别模型部署

参考资料：

- 文字识别模型说明文档：[PaddleOCR/deploy/paddle2onnx/readme.md at release/2.7 · PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR/blob/release/2.7/deploy/paddle2onnx/readme.md)

## 1.获取原始模型

### 1.1  获取文字检测模型

1.进入文字检测模型目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/model
```

2.获取模型

```
chmod +x ./download_model.sh
./download_model.sh
```

运行效果：

```
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/model$ chmod +x ./download_model.sh
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/model$ ./download_model.sh
--2025-08-20 18:07:27--  https://ftrg.zbox.filez.com/v2/delivery/data/95f00b0fc900458ba134f8b180b3f7a1/examples/PPOCR/ppocrv4_det.onnx
Resolving ftrg.zbox.filez.com (ftrg.zbox.filez.com)... 180.184.171.46
Connecting to ftrg.zbox.filez.com (ftrg.zbox.filez.com)|180.184.171.46|:443... connected.
HTTP request sent, awaiting response... 200
Length: 4771801 (4.5M) [application/octet-stream]
Saving to: ‘./ppocrv4_det.onnx’

./ppocrv4_det.onnx                    100%[======================================================================>]   4.55M  1.56MB/s    in 2.9s

2025-08-20 18:07:31 (1.56 MB/s) - ‘./ppocrv4_det.onnx’ saved [4771801/4771801]
```

### 1.2 获取文字检测模型

1.进入文字识别模型目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/model
```

2.获取模型

```
chmod +x ./download_model.sh
./download_model.sh
```

运行效果如下：

```
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/model$ chmod +x ./download_model.sh
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/model$ ./download_model.sh
--2025-08-20 18:15:33--  https://ftrg.zbox.filez.com/v2/delivery/data/95f00b0fc900458ba134f8b180b3f7a1/examples/PPOCR/ppocrv4_rec.onnx
Resolving ftrg.zbox.filez.com (ftrg.zbox.filez.com)... 180.184.171.46
Connecting to ftrg.zbox.filez.com (ftrg.zbox.filez.com)|180.184.171.46|:443... connected.
HTTP request sent, awaiting response... 200
Length: 10862445 (10M) [application/octet-stream]
Saving to: ‘ppocrv4_rec.onnx’

ppocrv4_rec.onnx                      100%[======================================================================>]  10.36M  3.64MB/s    in 2.8s

2025-08-20 18:15:37 (3.64 MB/s) - ‘ppocrv4_rec.onnx’ saved [10862445/10862445]
```

## 2.模型转换

### 2.1 文字检测模型

1.使用Conda激活`rknn-toolkit2`环境

```
conda activate rknn-toolkit2
```

2.进入文字检测模型转换目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/python
```

3.执行模型转换

```
python3 convert.py ../model/ppocrv4_det.onnx rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/python$ python3 convert.py ../model/ppocrv4_det.onnx rk3576
I rknn-toolkit2 version: 2.3.2
--> Config model
done
--> Loading model
done
--> Building model
I Loading : 100%|██████████████████████████████████████████████| 342/342 [00:00<00:00, 19398.12it/s]
I OpFusing 0: 100%|███████████████████████████████████████████████| 100/100 [00:01<00:00, 57.09it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:02<00:00, 38.25it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:03<00:00, 28.92it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:03<00:00, 27.23it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:05<00:00, 19.81it/s]
W build: found outlier value, this may affect quantization accuracy
                        const name          abs_mean    abs_std     outlier value
                        conv2d_398.w_0      6.53        8.93        58.173
                        conv2d_402.w_0      2.41        3.73        34.766
                        conv2d_403.w_0      0.14        0.16        9.510
                        conv2d_406.w_0      0.44        0.87        13.446
                        conv2d_412.w_0      0.29        0.86        -44.813
                        conv2d_416.w_0      0.37        0.94        29.860
                        conv2d_418.w_0      0.37        0.62        41.572
                        conv2d_420.w_0      0.33        0.69        -25.894
                        conv2d_421.w_0      0.08        0.09        11.623
I GraphPreparing : 100%|█████████████████████████████████████████| 214/214 [00:00<00:00, 952.23it/s]
I Quantizating : 100%|████████████████████████████████████████████| 214/214 [00:13<00:00, 15.40it/s]
W build: The default input dtype of 'x' is changed from 'float32' to 'int8' in rknn model for performance!
                       Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'sigmoid_0.tmp_0' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
I rknn building ...
I rknn building done.
done
--> Export rknn model
done
```

执行完成后可以在`../model/`目录下看到端侧推理的RKNN模型

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/python$ ls ../model/
download_model.sh  ppocrv4_det.onnx  ppocrv4_det.rknn  test.jpg
```



### 2.2 文字识别模型

1.使用Conda激活`rknn-toolkit2`环境

```
conda activate rknn-toolkit2
```

2.进入文字检测模型转换目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python
```

3.执行模型转换

```
python3 convert.py ../model/ppocrv4_rec.onnx rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python$ python3 convert.py ../model/ppocrv4_rec.onnx rk3576
I rknn-toolkit2 version: 2.3.2
--> Config model
done
--> Loading model
W load_onnx: The config.mean_values is None, zeros will be set for input 0!
W load_onnx: The config.std_values is None, ones will be set for input 0!
done
--> Building model
I Loading : 100%|██████████████████████████████████████████████| 440/440 [00:00<00:00, 17181.13it/s]
I OpFusing 0: 100%|███████████████████████████████████████████████| 100/100 [00:05<00:00, 18.77it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:07<00:00, 14.06it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:10<00:00,  9.67it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:10<00:00,  9.53it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:10<00:00,  9.35it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:10<00:00,  9.13it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:11<00:00,  8.99it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:12<00:00,  8.11it/s]
I rknn building ...
I rknn building done.
done
--> Export rknn model
done
```

执行完成后可以在`../model/`目录下看到端侧推理的RKNN模型

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python$ ls ../model/
download_model.sh  ppocr_keys_v1.txt  ppocrv4_rec.onnx  ppocrv4_rec.rknn  test.png
```



## 3.模型推理

### 3.1 文字检测模型

1.进入文字检测程序目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Det/python
```



2.安装pyclipper库

```
pip install pyclipper
```



3.执行推理测试代码

```text
python3 ppocr_det.py --model_path ../model/ppocrv4_det.rknn --target rk3576
```

运行效果如下：

![image-20250820183540215](${images}/image-20250820183540215.png)

### 3.2 文字识别模型

1.进入文字检测程序目录

```
cd ~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python
```

2.执行推理测试代码

```text
python3 ppocr_rec.py --model_path ../model/ppocrv4_rec.rknn --target rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python$ python3 ppocr_rec.py --model_path ../model/ppocrv4_rec.rknn --target rk3576
I rknn-toolkit2 version: 2.3.2
--> Init runtime environment
I target set by user is: rk3576
done
Model-../model/ppocrv4_rec.rknn is rknn model, starting val
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
[('JOINT', 0.7110351324081421)]
```

程序会检测`../model/test.png`图像文件，可以看到上面的打印信息检测出了`JOINT`

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-Rec/python$ ls ../model/test.png
```

![image-20250820184835390](${images}/image-20250820184835390.png)

### 3.3 文字检测与识别

执行推理测试代码：

```
python3 ppocr_system.py --det_model_path ../../PPOCR-Det/model/ppocrv4_det.rknn --rec_model_path ../../PPOCR-Rec/model/ppocrv4_rec.rknn --target rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/PPOCR/PPOCR-System/python$ python3 ppocr_system.py --det_model_path ../../PPOCR-Det/model/ppocrv4_det.rknn --rec_model_path ../../PPOCR-Rec/model/ppocrv4_rec.rknn --target rk3576
I rknn-toolkit2 version: 2.3.2
--> Init runtime environment
I target set by user is: rk3576
done
Model-../../PPOCR-Det/model/ppocrv4_det.rknn is rknn model, starting val
I rknn-toolkit2 version: 2.3.2
--> Init runtime environment
I target set by user is: rk3576
done
Model-../../PPOCR-Rec/model/ppocrv4_rec.rknn is rknn model, starting val
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
[[('纯臻营养护发素', 0.7113560438156128)], [('产品信息/参数', 0.70751953125)], [('（45元/每公斤，100公斤起订）', 0.6903291344642639)], [('每瓶22元，1000瓶起订）', 0.7074149250984192)], [('【品牌】：代加工方式/OEMODM', 0.7088407874107361)], [('【品名】：纯臻营养护发素', 0.7105305790901184)], [('【产品编号】：YM-X-3011', 0.707122802734375)], [('ODM OEM', 0.6842215657234192)], [('【净含量】：220ml', 0.7087180614471436)], [('【适用人群】：适合所有肤质', 0.7098482847213745)], [('【主要成分】：鲸蜡硬脂醇、燕麦β-葡聚', 0.6930252909660339)], [('糖、椰油酰胺丙基甜菜碱、泛酸', 0.6709246039390564)], [('（成品包材）', 0.7081705927848816)], [('【主要功能】：可紧致头发磷层，从而达到', 0.7100637555122375)], [('即时持久改善头发光泽的效果，给干燥的头', 0.7112202048301697)], [('发足够的滋养', 0.7110188603401184)]]
```



## 4.视频流推理

> 开始前请注意，请务必接入USB摄像头，并确认/dev/目录下存在video0设备节点！！！

​	

1.新建程序文件`ppocr_system_video.py`,填入一下内容：

```
import os
import sys
import cv2
import copy
import numpy as np
import argparse
import ppocr_rec as predict_rec
import ppocr_det as predict_det

os.environ["FLAGS_allocator_strategy"] = 'auto_growth'

DET_INPUT_SHAPE = [480, 480]  # h,w


class TextSystem(object):
    def __init__(self, args):
        self.text_detector = predict_det.TextDetector(args)
        self.text_recognizer = predict_rec.TextRecognizer(args)
        self.drop_score = 0.5

    def run(self, img):
        ori_im = img.copy()
        dt_boxes = self.text_detector.run(img)
        if dt_boxes is None or len(dt_boxes) == 0:
            return [], []

        img_crop_list = []
        dt_boxes = sorted_boxes(dt_boxes)
        for box in dt_boxes:
            img_crop = get_rotate_crop_image(ori_im, box)
            img_crop_list.append(img_crop)

        rec_res = self.text_recognizer.run(img_crop_list)
        rec_res = [(txt, 1.0) for txt in rec_res]

        filter_boxes, filter_rec_res = [], []
        for box, (text, score) in zip(dt_boxes, rec_res):
            if score >= self.drop_score:
                filter_boxes.append(box)
                filter_rec_res.append((text, score))
        return filter_boxes, filter_rec_res

def get_rotate_crop_image(img, points):
    assert len(points) == 4, "shape of points must be 4*2"
    img_crop_width = int(
        max(np.linalg.norm(points[0] - points[1]),
            np.linalg.norm(points[2] - points[3])))
    img_crop_height = int(
        max(np.linalg.norm(points[0] - points[3]),
            np.linalg.norm(points[1] - points[2])))
    pts_std = np.float32([[0, 0], [img_crop_width, 0],
                          [img_crop_width, img_crop_height],
                          [0, img_crop_height]])
    M = cv2.getPerspectiveTransform(points, pts_std)
    dst_img = cv2.warpPerspective(
        img, M, (img_crop_width, img_crop_height),
        borderMode=cv2.BORDER_REPLICATE, flags=cv2.INTER_CUBIC)
    if dst_img.shape[0] / dst_img.shape[1] >= 1.5:
        dst_img = np.rot90(dst_img)
    return dst_img


def sorted_boxes(dt_boxes):
    num_boxes = dt_boxes.shape[0]
    sorted_boxes = sorted(dt_boxes, key=lambda x: (x[0][1], x[0][0]))
    _boxes = list(sorted_boxes)
    for i in range(num_boxes - 1):
        for j in range(i, -1, -1):
            if abs(_boxes[j + 1][0][1] - _boxes[j][0][1]) < 10 and \
                    (_boxes[j + 1][0][0] < _boxes[j][0][0]):
                _boxes[j], _boxes[j + 1] = _boxes[j + 1], _boxes[j]
            else:
                break
    return _boxes


def init_args():
    parser = argparse.ArgumentParser(description='PPOCR-System Camera Demo')
    parser.add_argument('--det_model_path', type=str, required=True)
    parser.add_argument('--rec_model_path', type=str, required=True)
    parser.add_argument('--target', type=str, default='rk3566')
    parser.add_argument('--device_id', type=str, default=None)
    return parser


def draw_ocr_box_txt(img, boxes, rec_res):
    for (box, (txt, score)) in zip(boxes, rec_res):
        box = np.array(box).astype(np.int32)
        cv2.polylines(img, [box], True, (0, 255, 0), 2)
        label = f"{txt}"
        left, top = box[0]
        cv2.putText(img, label, (left, top - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    return img


if __name__ == '__main__':
    parser = init_args()
    args = parser.parse_args()
    system_model = TextSystem(args)

    cap = cv2.VideoCapture(0)                  # 打开摄像头
    if not cap.isOpened():
        sys.exit("Cannot open camera 0")

    print("Press 'q' to quit")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        img = cv2.resize(frame, (DET_INPUT_SHAPE[1], DET_INPUT_SHAPE[0]))
        boxes, rec_res = system_model.run(img)

        vis = draw_ocr_box_txt(img, boxes, rec_res)
        cv2.imshow("PPOCR-System", vis)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
```

2.执行推理程序：

```
python3 ppocr_system_video.py --det_model_path ../../PPOCR-Det/model/ppocrv4_det.rknn --rec_model_path ../../PPOCR-Rec/model/ppocrv4_rec.rknn --target rk3576
```

