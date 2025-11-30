# 创建图片编辑

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/images/edits:
    post:
      summary: 创建图片编辑
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
        - 图片生成/nano-banana/image/generations 格式(dalle 格式)
      parameters:
        - name: Authorization
          in: header
          description: ''
          required: false
          example: Bearer {{YOUR_API_KEY}}
          schema:
            type: string
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                model:
                  example: gemini-3-pro-image-preview
                  type: string
                prompt:
                  description: 所需图像的文本描述。最大长度为 1000 个字符。
                  example: merge two images
                  type: string
                image:
                  description: 要编辑的图像。必须是有效的 PNG 文件，小于 4MB，并且是方形的。如果未提供遮罩，图像必须具有透明度，将用作遮罩。
                  example:
                    - >-
                      file:///Users/xiangsx/Downloads/assets_task_01jqx6n1rde45tkxn5g99eq3b2_src_0
                      (1).png
                    - >-
                      file:///Users/xiangsx/Downloads/assets_task_01jqgab5ghejwazz6vjk89q27c_src_0.png
                  type: string
                  format: binary
                'n':
                  description: 要生成的图像数。必须介于 1 和 10 之间。
                  example: '1'
                  type: string
                response_format:
                  description: 生成的图像返回的格式。必须是`url`或`b64_json`。
                  example: url
                  type: string
                mask:
                  description: >-
                    附加图像，其完全透明区域（例如，alpha 为零的区域）指示image应编辑的位置。必须是有效的 PNG 文件，小于
                    4MB，并且尺寸与原始image相同。
                  example: file:///Users/xiangsx/Downloads/下载.png
                  type: string
                  format: binary
                user:
                  description: >-
                    代表您的最终用户的唯一标识符，可以帮助 OpenAI
                    监控和检测滥用行为。[了解更多](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids)。
                  example: ''
                  type: string
                quality:
                  type: string
                  enum:
                    - 1k
                    - 2k
                    - 4k
                  x-apifox-enum:
                    - value: 1k
                      name: ''
                      description: ''
                    - value: 2k
                      name: ''
                      description: ''
                    - value: 4k
                      name: ''
                      description: ''
                  description: 选择图像生成质量（仅对香蕉 2 有效）
                  example: ''
                size:
                  description: 格式{w}x{h}
                  example: ''
                  type: string
              required:
                - model
                - prompt
                - image
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  created:
                    type: integer
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                      required:
                        - url
                      x-apifox-orders:
                        - url
                required:
                  - created
                  - data
                x-apifox-orders:
                  - created
                  - data
              example:
                created: 1589478378
                data:
                  - url: https://...
                  - url: https://...
          headers: {}
          x-apifox-name: 成功
      security:
        - bearer: []
      x-apifox-folder: 图片生成/nano-banana/image/generations 格式(dalle 格式)
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/7040782/apis/api-343646957-run
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