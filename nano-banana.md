# Gemini（Nanobanana）创建图像（传图）

模型：gemini-3-pro-image-preview, gemini-3-pro-image-preview-hd
密钥：需要在环境变量中配置 API_KEY
base url：https://api.tu-zi.com

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/chat/completions:
    post:
      summary: 创建图像（传图）
      deprecated: false
      description: >-
        更新: 

        - 新上线 gemini-3-pro-image-preview-hd 香蕉2  4k 分辨率

        - 图片清晰度高，单张图片体积约 **3 MB**

        #### 最强绘图模型 nano banana 2 （相较于 1 代）

        - 中文显示效果非常出色，适合中文海报、文案类图片

        - 图片清晰度高，单张图片体积约 **1.5 MB**

        - 使用建议：** default 分组推荐走「 chat/ generations / edit 接口」**，稳定性与效果更佳
                              ** 原价 分组**  返回 base64 格式
        ---

        [小白开箱即用教程（一步一步教你用）](https://wiki.tu-zi.com/s/8c61a536-7a59-4410-a5e2-8dab3d041958/doc/gemini-3-pro-image-preview-api-wCmFtI3Tm5)
      tags:
        - 图片生成/nano-banana/chat 格式
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  type: string
                  description: 模型名称
                  examples:
                    - gemini-3-pro-image-preview
                    - gemini-3-pro-image-preview-hd
                stream:
                  type: boolean
                  description: 是否开启流式
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      content:
                        type: array
                        items:
                          type: object
                          properties:
                            text:
                              type: string
                              description: 文本内容
                            type:
                              type: string
                              description: 类型
                            image_url:
                              type: object
                              properties:
                                url:
                                  type: string
                                  description: 'url链接 或 base64 '
                              required:
                                - url
                              x-apifox-orders:
                                - url
                          required:
                            - type
                          x-apifox-orders:
                            - text
                            - type
                            - image_url
                    x-apifox-orders:
                      - role
                      - content
              required:
                - model
                - stream
                - messages
              x-apifox-orders:
                - model
                - stream
                - messages
            example:
              model: gemini-3-pro-image-preview
              stream: false
              messages:
                - role: user
                  content:
                    - text: draw a picture sililarity
                      type: text
                    - image_url:
                        url: >-
                          https://tuziai.oss-cn-shenzhen.aliyuncs.com/wiki/code/mdjourney/cat_3.png
                      type: image_url
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apifox-orders: []
          headers: {}
          x-apifox-name: 成功
      security:
        - bearer: []
      x-apifox-folder: 图片生成/nano-banana/chat 格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/7040782/apis/api-343646954-run
components:
  schemas: {}
  securitySchemes:
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://api.tu-zi.com
    description: api.tu-zi.com
security:
  - bearer: []

```
解释