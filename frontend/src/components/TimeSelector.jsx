import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Sunrise, Sunset, CloudSun, Clock } from 'lucide-react'
import { format } from 'date-fns'

const TIME_OPTIONS = [
  { id: 'sunrise', label: 'Sunrise', icon: Sunrise },
  { id: 'morning', label: 'Morning', icon: CloudSun },
  { id: 'noon', label: 'Noon', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', icon: Sun },
  { id: 'sunset', label: 'Sunset', icon: Sunset },
  { id: 'night', label: 'Night', icon: Moon },
]

export default function TimeSelector({ onNext }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('afternoon')

  const handleConfirm = () => {
    onNext({
      date: selectedDate,
      timeOfDay: selectedTime
    })
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-right duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Select Time</h2>
        <p className="text-muted-foreground">When should this moment happen?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Time of Day</label>
          <div className="grid grid-cols-2 gap-3">
            {TIME_OPTIONS.map(option => {
              const Icon = option.icon
              const isSelected = selectedTime === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedTime(option.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2" 
                      : "bg-background hover:bg-secondary hover:border-primary/50"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <Button 
        onClick={handleConfirm} 
        className="w-full py-6 text-lg"
      >
        Generate Photo
      </Button>
    </div>
  )
}
