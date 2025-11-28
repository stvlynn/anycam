import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export default function ProcessingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <div className="relative bg-background p-6 rounded-full border shadow-xl">
           <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Creating Magic</h2>
        <p className="text-muted-foreground">
          AI is generating your photo...
        </p>
      </div>

      <div className="w-full max-w-[200px] space-y-2">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
        </div>
        <p className="text-xs text-muted-foreground">Estimated time: 15-30s</p>
      </div>
    </div>
  )
}
