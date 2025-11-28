import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Navigation } from 'lucide-react'

const POPULAR_LOCATIONS = [
  { id: 1, name: "Eiffel Tower", city: "Paris", coords: { lat: 48.8584, lng: 2.2945 } },
  { id: 2, name: "Times Square", city: "New York", coords: { lat: 40.7580, lng: -73.9855 } },
  { id: 3, name: "Santorini", city: "Greece", coords: { lat: 36.3932, lng: 25.4615 } },
  { id: 4, name: "Kyoto", city: "Japan", coords: { lat: 35.0116, lng: 135.7681 } },
  { id: 5, name: "Pyramids of Giza", city: "Egypt", coords: { lat: 29.9792, lng: 31.1342 } },
]

export default function MapSelector({ onNext }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelect = (location) => {
    setSelectedLocation(location)
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onNext(selectedLocation)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Choose Location</h2>
        <p className="text-muted-foreground">Where do you want to go?</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search destination..." 
          className="w-full pl-9 pr-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 bg-muted/30 rounded-xl overflow-hidden relative border">
        {/* Mock Map View */}
        <div className="absolute inset-0 flex items-center justify-center bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/2.2945,48.8584,12,0/600x600?access_token=mock')] bg-cover opacity-50">
          {/* If we had a real map, it would go here. For now, just a pattern or static image */}
          <div className="grid gap-4 p-4 w-full h-full overflow-auto content-start">
             <p className="text-center text-sm text-muted-foreground col-span-full py-4">
               Map Visualization
             </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t rounded-t-xl">
           <p className="text-sm font-medium mb-3">Popular Destinations</p>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             {POPULAR_LOCATIONS.map(loc => (
               <button
                 key={loc.id}
                 onClick={() => handleSelect(loc)}
                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                   selectedLocation?.id === loc.id 
                     ? "bg-primary text-primary-foreground border-primary" 
                     : "bg-background hover:bg-secondary border-input"
                 }`}
               >
                 {loc.name}
               </button>
             ))}
           </div>
        </div>
      </div>

      {selectedLocation && (
        <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
           <div className="p-2 bg-primary/10 rounded-full text-primary">
             <MapPin className="w-5 h-5" />
           </div>
           <div>
             <p className="font-semibold">{selectedLocation.name}</p>
             <p className="text-xs text-muted-foreground">{selectedLocation.city}</p>
           </div>
        </div>
      )}

      <Button 
        onClick={handleConfirm} 
        disabled={!selectedLocation} 
        className="w-full py-6 text-lg"
      >
        Confirm Location
      </Button>
    </div>
  )
}
