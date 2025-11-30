import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Camera, X, Loader2, Video, Hand } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useGestureDetection } from '@/hooks/useGestureDetection'
import CountdownOverlay from './CountdownOverlay'

export default function PhotoUploader({ onNext }) {
  const [preview, setPreview] = useState(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [gestureEnabled, setGestureEnabled] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [detectedGestureType, setDetectedGestureType] = useState(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraReady(true)
        setCameraError('')
      } catch (error) {
        setCameraError('无法访问摄像头，请检查浏览器权限。')
        console.error('Camera error:', error)
      }
    }

    initCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    await processFile(file)
  }

  const handleCapture = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreview(dataUrl)
  }

  const processFile = async (file) => {
    setIsCompressing(true)
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      
      const compressedFile = await imageCompression(file, options)
      const reader = new FileReader()
      reader.readAsDataURL(compressedFile)
      reader.onloadend = () => {
        setPreview(reader.result)
        setIsCompressing(false)
      }
    } catch (error) {
      console.error("Error compressing image:", error)
      setIsCompressing(false)
    }
  }

  const handleConfirm = () => {
    if (preview) {
      onNext(preview)
    }
  }

  const clearImage = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGestureDetected = (gesture) => {
    if (isCountingDown || preview) return // 避免重复触发
    
    setDetectedGestureType(gesture)
    setIsCountingDown(true)
  }

  const handleCountdownComplete = () => {
    handleCapture()
    setIsCountingDown(false)
    setDetectedGestureType(null)
  }

  // 手势识别 Hook
  useGestureDetection(videoRef, handleGestureDetected, gestureEnabled && cameraReady && !preview)

  return (
    <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Take a Selfie</h2>
        <p className="text-muted-foreground">Upload a clear photo of yourself</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4] bg-muted flex items-center justify-center">
          {/* 倒计时覆盖层 */}
          <CountdownOverlay isActive={isCountingDown} onComplete={handleCountdownComplete} />
          
          {/* 手势识别指示器 */}
          {gestureEnabled && cameraReady && !preview && (
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-full text-sm">
              <Hand className="w-4 h-4" />
              <span>手势识别已开启</span>
            </div>
          )}
          
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 rounded-full"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Video className="w-8 h-8" />
                  <p>{cameraError || '正在连接摄像头...'}</p>
                </div>
              )}
            </>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4" />
            <span className="text-sm font-medium">手势识别拍照</span>
          </div>
          <button
            onClick={() => setGestureEnabled(!gestureEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              gestureEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                gestureEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCapture} disabled={!cameraReady || isCountingDown} className="w-full py-6 text-lg">
            <Camera className="w-4 h-4 mr-2" />
            拍照
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full py-6 text-lg">
            <Upload className="w-4 h-4 mr-2" />
            上传
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleConfirm} 
        disabled={!preview || isCompressing} 
        className="w-full py-6 text-lg"
      >
        {isCompressing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Next Step"
        )}
      </Button>
    </div>
  )
}
