# AnyCam

## 产品简介
这是一个在线的AI相机，Any表示Anywhere，Cam表示Camera。

## 产品定位与价值主张

### 目标用户
- 旅行爱好者：想要记录世界各地的风景，但无法亲自到达
- 社交媒体用户：需要创意内容，展示"虚拟旅行"体验
- 摄影爱好者：探索不同时间、地点的光影效果
- 怀旧用户：想要看到过去某个时间点的地点景象

### 核心价值
- **突破时空限制**：无需真实到达，即可生成任意地点、任意时间的AI照片
- **个性化体验**：基于用户自拍照，生成符合用户风格的场景照片
- **创意表达**：为社交媒体提供独特的内容创作工具
- **即时生成**：无需专业摄影技能，一键生成高质量AI图片

### 差异化优势
- 结合地理位置和时间维度，而非简单的AI绘图
- 融合用户自拍照，生成个性化场景
- 简单直观的交互流程，降低使用门槛

### 典型使用场景
1. "我想看看自己在巴黎埃菲尔铁塔日落时的样子"
2. "生成我在东京樱花季的照片"
3. "看看纽约时代广场跨年夜的景象"
4. "想象自己在北极光下的场景"

## 功能流程

### 主流程
1. **进入落地页**
   - 展示产品介绍和示例图片
   - 引导用户开始创作

2. **上传自拍照**
   - 支持本地上传（JPG/PNG，最大5MB）
   - 支持调用Webcam实时拍照
   - **手势识别自动拍照**（可选功能）：
     - 使用计算机视觉（MediaPipe Hands / TensorFlow.js）实时检测手势
     - 支持识别手势：比耶（✌️）、点赞（👍）
     - 检测到目标手势后触发3秒倒计时
     - 倒计时期间在屏幕上显示数字动画（3、2、1）
     - 倒计时结束自动拍照并生成预览
     - 用户可在设置中开启/关闭手势识别功能
   - 图片预览和重新选择功能
   - 前端压缩至合适尺寸（最大1024x1024）

3. **选择地点**
   - 使用地图组件（Google Maps API）
   - 支持搜索地点名称（如"埃菲尔铁塔"）
   - 支持点击地图选择坐标
   - 显示选中地点的名称和坐标
   - 提供热门地点推荐列表

4. **选择时间**
   - 时间选择器（日期 + 时段）
   - 时段选项：日出、上午、中午、下午、日落、夜晚
   - 时间范围：过去100年至当前时间
   - 默认值：当前日期和时段

5. **生成图片**
   - 点击"立即拍照"按钮
   - 显示加载动画和进度提示（"AI正在为您生成照片..."）
   - 预计生成时间：15-30秒

6. **展示结果**
   - 显示生成的AI图片
   - 提供操作按钮：
     - 下载图片（PNG格式，高清）
     - 重新生成（使用相同参数）
     - 修改参数（返回编辑）
     - 分享到社交媒体

### 错误处理流程
- **上传失败**：提示文件格式或大小错误，允许重新上传
- **地点选择失败**：提示网络错误，提供重试按钮
- **生成失败**：
  - API调用失败：提示服务暂时不可用，提供重试
  - 内容违规：提示生成内容不符合规范，建议修改参数
  - 超时：提示生成时间过长，询问是否继续等待
- **网络异常**：全局错误提示，保存用户输入状态

### 边界情况
- 用户未上传照片直接点击生成：提示必须上传照片
- 用户未选择地点：提示必须选择地点
- 连续快速点击生成：防抖处理，避免重复请求
- 生成过程中离开页面：弹窗确认，避免丢失进度

## 技术实现细节

### 技术栈
1. **前端**：React + Vite + TailwindCSS + shadcn/ui
2. **后端**：Node.js + Express
3. **AI模型**：nano banana (gemini-3-pro-image-preview)
4. **地图服务**：Google Maps JavaScript API
5. **图片处理**：Sharp (Node.js) / browser-image-compression (前端)
6. **部署**：Vercel (前端) + Vercel Serverless Functions (后端)
7. **图标**：npm install remixicon --save
8. **手势识别**：@mediapipe/hands 或 @tensorflow/tfjs + @tensorflow-models/handpose

### AI模型集成

#### API配置
- **API端点**：`https://api.tu-zi.com/v1/chat/completions`
- **模型名称**：`gemini-3-pro-image-preview` (标准版) 或 `gemini-3-pro-image-preview-hd` (高清版)
- **认证方式**：Bearer Token (需在环境变量中配置)
- **调用限制**：根据API服务商限制，建议实现请求队列
- **费用预算**：单次调用成本约 ¥0.5-1.0，需监控每日调用量

#### Prompt构建策略
将用户输入转换为AI生成提示词的核心逻辑：

```javascript
function buildPrompt(userPhoto, location, time) {
  const timeDescription = getTimeDescription(time); // "日落时分" / "夜晚" 等
  const locationName = location.name; // "埃菲尔铁塔"
  const coordinates = location.coordinates; // {lat, lng}
  
  const prompt = `
    Create a photorealistic image of a person at ${locationName} during ${timeDescription}.
    The person should match the style and appearance from the reference photo.
    The scene should capture the authentic atmosphere of ${locationName} at this time,
    including accurate lighting, weather conditions, and architectural details.
    Blend the person naturally into the environment.
  `;
  
  return prompt;
}
```

#### API调用流程
1. 用户上传的自拍照转换为base64或上传至临时存储获取URL
2. 构建符合nano banana API格式的请求体：
```json
{
  "model": "gemini-3-pro-image-preview",
  "stream": false,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "[构建的prompt]"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "[用户自拍照的URL或base64]"
          }
        }
      ]
    }
  ]
}
```
3. 发送POST请求到API端点
4. 解析返回的图片数据（base64格式）
5. 转换为可展示的图片URL

### 前端架构

#### 核心组件
- `LandingPage.jsx` - 落地页
- `PhotoUploader.jsx` - 照片上传组件
- `MapSelector.jsx` - 地图选择组件
- `TimeSelector.jsx` - 时间选择组件
- `GenerateButton.jsx` - 生成按钮和加载状态
- `ResultDisplay.jsx` - 结果展示和操作

#### 状态管理
使用React Context或Zustand管理全局状态：
- 用户上传的照片（base64）
- 选择的地点（名称、坐标）
- 选择的时间（日期、时段）
- 生成的图片URL
- 加载状态和错误信息

#### 图片处理
- **前端压缩**：使用`browser-image-compression`将上传图片压缩至1MB以下
- **格式转换**：统一转换为JPEG格式
- **尺寸限制**：最大1024x1024，保持宽高比

### 后端架构

#### API端点设计
- `POST /api/upload` - 上传用户照片，返回临时URL
- `POST /api/generate` - 生成AI图片
  - 请求体：`{ photoUrl, location, time }`
  - 返回：`{ imageUrl, generationTime }`
- `GET /api/image/:id` - 获取生成的图片

#### 数据流
1. 前端上传照片 → 后端存储至临时目录 → 返回URL
2. 前端提交生成请求 → 后端构建prompt → 调用nano banana API
3. 接收AI生成的图片 → 存储至云存储 → 返回图片URL给前端

#### 环境变量配置
```env
NANO_BANANA_API_KEY=your_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=5242880  # 5MB
```

### 图片存储方案
- **临时存储**：用户上传的照片存储在服务器临时目录，24小时后自动清理
- **生成图片**：存储至云存储服务（如AWS S3、阿里云OSS），保留7天
- **CDN加速**：使用CDN加速图片访问

### 性能指标
- **图片生成时间**：15-30秒（取决于API响应速度）
- **并发支持**：初期支持10个并发请求，后期根据需求扩展
- **图片质量**：标准版约1.5MB，高清版约3MB
- **响应时间**：
  - 照片上传：< 2秒
  - 地图加载：< 1秒
  - API调用：15-30秒

### 安全性措施
- **照片隐私**：用户照片仅临时存储，不永久保存
- **API密钥保护**：所有密钥存储在环境变量，不暴露给前端
- **内容审核**：对生成的图片进行基本的内容审核
- **请求限制**：单个IP每小时最多10次生成请求，防止滥用
- **HTTPS**：全站使用HTTPS加密传输

### 手势识别实现方案

#### 技术选型
- **推荐方案**：MediaPipe Hands (@mediapipe/hands)
  - 优势：轻量级、实时性好、准确率高、支持21个关键点检测
  - 缺点：需要加载模型文件（~2MB）
- **备选方案**：TensorFlow.js + HandPose
  - 优势：生态完善、可自定义训练
  - 缺点：模型较大、性能开销更高

#### 实现步骤
1. **初始化手势检测**
   - 在 PhotoUploader 组件加载时初始化 MediaPipe Hands
   - 配置参数：maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7
   - 创建独立的 Canvas 用于手势检测（不影响视频显示）

2. **实时手势识别**
   - 每帧从 video 元素提取图像数据
   - 调用 MediaPipe Hands 检测手部关键点
   - 根据关键点位置判断手势类型：
     - **比耶手势（✌️）**：检测食指和中指伸直，其他手指弯曲
     - **点赞手势（👍）**：检测大拇指向上，其他手指弯曲
   - 使用防抖机制：连续检测到相同手势3帧以上才触发

3. **倒计时与拍照**
   - 检测到目标手势后：
     - 停止继续检测（避免重复触发）
     - 在屏幕中央显示倒计时动画（3 → 2 → 1）
     - 每个数字显示1秒，带缩放动画效果
     - 倒计时结束后自动调用 handleCapture()
     - 拍照完成后恢复手势检测

4. **UI反馈**
   - 在视频画面上叠加手势识别状态指示器
   - 检测到手势时显示绿色边框提示
   - 倒计时期间显示大号数字动画
   - 提供开关按钮控制手势识别功能

5. **性能优化**
   - 降低检测帧率（15-20 FPS 足够）
   - 在拍照预览时暂停手势检测
   - 组件卸载时释放 MediaPipe 资源

#### 代码结构
```javascript
// useGestureDetection.js - 自定义 Hook
export function useGestureDetection(videoRef, onGestureDetected) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState(null)
  
  useEffect(() => {
    if (!isEnabled) return
    
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })
    
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })
    
    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const gesture = detectGesture(results.multiHandLandmarks[0])
        if (gesture) {
          onGestureDetected(gesture)
        }
      }
    })
    
    // 启动检测循环
    const detectLoop = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        await hands.send({ image: videoRef.current })
      }
      requestAnimationFrame(detectLoop)
    }
    detectLoop()
    
    return () => hands.close()
  }, [isEnabled, videoRef, onGestureDetected])
  
  return { isEnabled, setIsEnabled, detectedGesture }
}

function detectGesture(landmarks) {
  // 实现手势识别逻辑
  // 返回 'peace' | 'thumbsup' | null
}
```

#### 依赖安装
```bash
npm install @mediapipe/hands @mediapipe/camera_utils
```

### 监控与日志
- **错误追踪**：使用Sentry记录前后端错误
- **API调用监控**：记录每次API调用的耗时、成功率
- **用户行为分析**：记录用户选择的地点、时间分布
- **成本监控**：实时监控API调用费用，设置预算告警

### MVP范围（第一版）
**必须实现**：
- 照片上传（本地上传）
- 地图选择（搜索 + 点击）
- 时间选择（简化为6个时段）
- AI图片生成
- 结果展示和下载

**延后实现**：
- Webcam实时拍照
- **手势识别自动拍照**（增强功能）
- 社交媒体分享
- 用户账号系统
- 历史记录保存
- 高级编辑功能