import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2, RotateCcw } from 'lucide-react'

export default function ResultDisplay({ image, onRestart }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image
    link.download = 'anycam-photo.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Your Photo is Ready!</h2>
        <p className="text-muted-foreground">Looks amazing!</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative rounded-xl overflow-hidden shadow-2xl border aspect-[3/4] group">
          <img src={image} alt="Generated" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
        <Button variant="ghost" onClick={onRestart} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Take Another Photo
        </Button>
      </div>
    </div>
  )
}
