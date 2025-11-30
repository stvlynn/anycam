import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Navigation } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'

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
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const token = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!token || mapRef.current || !mapContainerRef.current) return
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.2945, 48.8584],
      zoom: 12,
      pitch: 0,
      bearing: 0,
      attributionControl: true
    })
    mapRef.current = map
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
        const { data } = await axios.get(url, {
          params: { access_token: token, types: 'poi,place,locality,neighborhood', limit: 1 }
        })
        const feature = (data?.features || [])[0]
        if (feature) {
          const city = deriveCity(feature)
          const name = feature.text || feature.place_name || `${lng.toFixed(5)}, ${lat.toFixed(5)}`
          const id = feature.id || 'custom'
          setSelectedLocation({ id, name, city, coords: { lat, lng } })
        } else {
          setSelectedLocation({ id: 'custom', name: `${lng.toFixed(5)}, ${lat.toFixed(5)}`, city: '', coords: { lat, lng } })
        }
      } catch (_) {
        setSelectedLocation({ id: 'custom', name: `${lng.toFixed(5)}, ${lat.toFixed(5)}`, city: '', coords: { lat, lng } })
      }
    })
    return () => {
      mapRef.current && mapRef.current.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const h = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
        const { data } = await axios.get(url, {
          params: { access_token: token, autocomplete: true, limit: 5 }
        })
        setSuggestions(data?.features || [])
      } catch (_) {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(h)
  }, [searchQuery, token])

  const deriveCity = (feature) => {
    const c = feature?.context || []
    const item = c.find(x => (x.id || '').startsWith('place')) || c.find(x => (x.id || '').startsWith('locality')) || c.find(x => (x.id || '').startsWith('region'))
    return item?.text || ''
  }

  const handleSelectSuggestion = (feature) => {
    if (!feature?.center) return
    const [lng, lat] = feature.center
    const city = deriveCity(feature)
    const name = feature.text || feature.place_name || 'Selected'
    const loc = { id: feature.id || 'custom', name, city, coords: { lat, lng } }
    setSelectedLocation(loc)
    const m = mapRef.current
    if (m) m.flyTo({ center: [lng, lat], zoom: 12 })
    setSuggestions([])
  }

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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              handleSelectSuggestion(suggestions[0])
            }
          }}
        />
        {token ? (
          suggestions.length > 0 && (
            <div className="absolute z-10 mt-2 left-0 right-0 bg-background border rounded-lg shadow">
              {suggestions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectSuggestion(f)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary"
                >
                  <div className="text-sm font-medium">{f.text}</div>
                  <div className="text-xs text-muted-foreground">{f.place_name}</div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="absolute z-10 mt-2 left-0 right-0 bg-background border rounded-lg shadow p-3 text-xs text-muted-foreground">
            Set VITE_MAPBOX_TOKEN to enable search
          </div>
        )}
      </div>

      <div className="flex-1 bg-muted/30 rounded-xl overflow-hidden relative border">
        {token ? (
          <div ref={mapContainerRef} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/2.2945,48.8584,12,0/600x600?access_token=mock')] bg-cover opacity-50">
            <div className="grid gap-4 p-4 w-full h-full overflow-auto content-start">
               <p className="text-center text-sm text-muted-foreground col-span-full py-4">
                 Configure VITE_MAPBOX_TOKEN to enable interactive map
               </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t rounded-t-xl">
           <p className="text-sm font-medium mb-3">Popular Destinations</p>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             {POPULAR_LOCATIONS.map(loc => (
               <button
                 key={loc.id}
                 onClick={() => {
                   handleSelect(loc)
                   const m = mapRef.current
                   if (m) m.flyTo({ center: [loc.coords.lng, loc.coords.lat], zoom: 12 })
                 }}
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
