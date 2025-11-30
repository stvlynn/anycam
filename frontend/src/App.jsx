import React, { useState } from 'react'
import axios from 'axios'
import LandingPage from './components/LandingPage'
import PhotoUploader from './components/PhotoUploader'
import MapSelector from './components/MapSelector'
import TimeSelector from './components/TimeSelector'
import ProcessingPage from './components/ProcessingPage'
import ResultDisplay from './components/ResultDisplay'

function App() {
  const [step, setStep] = useState('landing') // landing, upload, location, time, processing, result
  const [data, setData] = useState({
    photo: null,
    location: null,
    time: new Date(),
  })
  const [resultImage, setResultImage] = useState(null)

  const handleStart = () => setStep('upload')

  const handlePhotoSelect = (photo) => {
    setData(prev => ({ ...prev, photo }))
    setStep('location')
  }

  const handleLocationSelect = (location) => {
    setData(prev => ({ ...prev, location }))
    setStep('time')
  }

  const handleTimeSelect = (time) => {
    setData(prev => ({ ...prev, time }))
    setStep('processing')
    generateImage({ ...data, time })
  }

  const generateImage = async (requestData) => {
    try {
      const response = await axios.post('/api/generate', requestData)
      const url = response?.data?.imageUrl
      if (url) {
        setResultImage(url)
        setStep('result')
      } else {
        console.error('No imageUrl in response', response?.data)
        setStep('time')
      }
    } catch (error) {
      console.error('Generation failed', error?.response?.data || error.message)
      setStep('time')
    }
  }

  const handleRestart = () => {
    setStep('landing')
    setData({ photo: null, location: null, time: new Date() })
    setResultImage(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <main className="container mx-auto px-4 py-8 max-w-md h-screen flex flex-col">
        {step === 'landing' && <LandingPage onStart={handleStart} />}
        {step === 'upload' && <PhotoUploader onNext={handlePhotoSelect} />}
        {step === 'location' && <MapSelector onNext={handleLocationSelect} />}
        {step === 'time' && <TimeSelector onNext={handleTimeSelect} />}
        {step === 'processing' && <ProcessingPage />}
        {step === 'result' && <ResultDisplay image={resultImage} onRestart={handleRestart} />}
      </main>
    </div>
  )
}

export default App
