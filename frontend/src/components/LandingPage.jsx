import React from 'react'
import { Button } from '@/components/ui/button'
import { Camera, MapPin, Clock } from 'lucide-react'

export default function LandingPage({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 text-center animate-in fade-in duration-500">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AnyCam
        </h1>
        <p className="text-muted-foreground text-lg max-w-xs mx-auto">
          Travel anywhere, anytime. 
          <br/>
          Your personal AI photographer.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8 text-muted-foreground/80">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-secondary rounded-full">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Selfie</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-secondary rounded-full">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Place</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-secondary rounded-full">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Time</span>
        </div>
      </div>

      <Button onClick={onStart} size="lg" className="w-full max-w-[200px] text-lg h-12 rounded-full shadow-lg hover:shadow-xl transition-all">
        Start Now
      </Button>
    </div>
  )
}
