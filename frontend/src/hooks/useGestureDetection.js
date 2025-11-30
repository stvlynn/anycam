import { useState, useEffect, useRef, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

/**
 * 检测手势类型
 * @param {Array} landmarks - MediaPipe 手部关键点数组 (21个点)
 * @returns {'peace' | 'thumbsup' | null}
 */
function detectGesture(landmarks) {
  if (!landmarks || landmarks.length !== 21) return null

  // 获取关键点
  const thumb_tip = landmarks[4]
  const thumb_ip = landmarks[3]
  const index_tip = landmarks[8]
  const index_pip = landmarks[6]
  const middle_tip = landmarks[12]
  const middle_pip = landmarks[10]
  const ring_tip = landmarks[16]
  const ring_pip = landmarks[14]
  const pinky_tip = landmarks[20]
  const pinky_pip = landmarks[18]
  const wrist = landmarks[0]

  // 比耶手势 (✌️): 食指和中指伸直，其他手指弯曲
  const indexExtended = index_tip.y < index_pip.y
  const middleExtended = middle_tip.y < middle_pip.y
  const ringCurled = ring_tip.y > ring_pip.y
  const pinkyCurled = pinky_tip.y > pinky_pip.y
  const thumbCurled = thumb_tip.x < thumb_ip.x || thumb_tip.x > thumb_ip.x + 0.05

  if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
    return 'peace'
  }

  // 点赞手势 (👍): 大拇指向上，其他手指弯曲
  const thumbUp = thumb_tip.y < wrist.y
  const indexCurled = index_tip.y > index_pip.y
  const middleCurled = middle_tip.y > middle_pip.y
  
  if (thumbUp && indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return 'thumbsup'
  }

  return null
}

/**
 * 手势识别 Hook
 * @param {React.RefObject} videoRef - video 元素引用
 * @param {Function} onGestureDetected - 手势检测回调
 * @param {boolean} enabled - 是否启用手势识别
 */
export function useGestureDetection(videoRef, onGestureDetected, enabled = true) {
  const [detectedGesture, setDetectedGesture] = useState(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const gestureCountRef = useRef({ gesture: null, count: 0 })
  const REQUIRED_FRAMES = 3 // 连续检测3帧才触发

  const onResults = useCallback((results) => {
    if (!enabled) return

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const gesture = detectGesture(results.multiHandLandmarks[0])
      
      if (gesture) {
        // 防抖：连续检测到相同手势才触发
        if (gestureCountRef.current.gesture === gesture) {
          gestureCountRef.current.count++
          
          if (gestureCountRef.current.count >= REQUIRED_FRAMES) {
            setDetectedGesture(gesture)
            onGestureDetected?.(gesture)
            // 重置计数，避免重复触发
            gestureCountRef.current = { gesture: null, count: 0 }
          }
        } else {
          gestureCountRef.current = { gesture, count: 1 }
        }
      } else {
        gestureCountRef.current = { gesture: null, count: 0 }
      }
    } else {
      gestureCountRef.current = { gesture: null, count: 0 }
    }
  }, [enabled, onGestureDetected])

  useEffect(() => {
    if (!enabled || !videoRef.current) return

    // 初始化 MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    hands.onResults(onResults)
    handsRef.current = hands

    // 初始化相机
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480
      })
      
      camera.start()
      cameraRef.current = camera
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (handsRef.current) {
        handsRef.current.close()
      }
    }
  }, [enabled, videoRef, onResults])

  return { detectedGesture }
}
