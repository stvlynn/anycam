import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Camera, X, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export default function PhotoUploader({ onNext }) {
  const [preview, setPreview] = useState(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    await processFile(file)
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

  return (
    <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Take a Selfie</h2>
        <p className="text-muted-foreground">Upload a clear photo of yourself</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {preview ? (
          <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4] bg-muted">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center p-8 h-full max-h-[400px] bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer gap-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-4 bg-secondary rounded-full">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-muted-foreground/60">
              JPG or PNG, max 5MB
            </p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
        />
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
