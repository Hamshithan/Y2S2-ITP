import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons broken by vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER = [7.8731, 80.7718] // Center of Sri Lanka
const DEFAULT_ZOOM = 8

const driverIcon = (label) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:#2563eb;color:#fff;border:2px solid #fff;border-radius:50%;
      width:32px;height:32px;display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

const stopIcon = (num, isStart) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${isStart ? '#16a34a' : '#6366f1'};color:#fff;border:2px solid #fff;border-radius:50%;
      width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

// Hardcoded paths for the mock simulation for the main routes.
const ROUTE_PATHS = {
  'ROUTE-001': [ // Colombo -> Kandy -> Jaffna
    [6.9271, 79.8612], [7.05, 80.00], [7.2541, 80.5186], [7.2906, 80.6337], 
    [7.4675, 80.6234], [7.8731, 80.6511], [8.3114, 80.4037], [8.7514, 80.4971], 
    [9.3803, 80.3770], [9.6615, 80.0255]
  ],
  'ROUTE-002': [ // Colombo -> Galle -> Negombo
    [6.9271, 79.8612], [6.8406, 79.9576], [6.6713, 80.0886], [6.3353, 80.1251], 
    [6.0535, 80.2210], [6.3353, 80.1251], [6.8406, 79.9576], [6.9271, 79.8612], 
    [7.1706, 79.8860], [7.2008, 79.8737]
  ]
}

async function geocode(location) {
  const query = encodeURIComponent(location + ', Sri Lanka')
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch { /* ignore */ }
  return null
}

export default function DeliveryTrackingMap({ trips = [], routes = [], selectedRouteId = null }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef([])
  const animationRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Determine which routes to display
  const displayRoutes = useMemo(() => {
    if (!routes || routes.length === 0) return []
    if (selectedRouteId) return routes.filter(r => r.id === selectedRouteId)
    return routes
  }, [routes, selectedRouteId])

  // Init map
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current || !mapRef.current) return

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      setTimeout(() => {
        map.invalidateSize()
        setMapReady(true)
      }, 300)
    }, 200)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear previous layers
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []
    if (animationRef.current) {
      clearInterval(animationRef.current)
    }

    const bounds = L.latLngBounds([])
    const activeRouteMarkers = [] // For animating simulated drivers

    ;(async () => {
      // 1. Draw Routes and Stops
      for (const route of displayRoutes) {
        const routeNumber = route.route_number
        let pathCoords = []
        
        // Use Mock path if available, else geocode
        if (ROUTE_PATHS[routeNumber]) {
          pathCoords = ROUTE_PATHS[routeNumber]
        } else {
          // Geocode fallback based on original implementation
          const stops = route.stops_data || []
          let addresses = stops.map((s) => (s.location || '').trim()).filter(Boolean)
          if (addresses.length < 2 && route.start_location && route.end_location) {
            addresses = [route.start_location, route.end_location]
          }
          for (let i = 0; i < addresses.length; i++) {
            const latlng = await geocode(addresses[i])
            if (latlng) pathCoords.push(latlng)
          }
        }

        if (pathCoords.length >= 2) {
          // Polylines
          const lineList = pathCoords.map(c => L.latLng(c[0], c[1]))
          const line = L.polyline(lineList, { 
              color: routeNumber === 'ROUTE-001' ? '#ef4444' : '#3b82f6', 
              weight: 5, 
              opacity: 0.8, 
              dashArray: '10, 5' 
          }).addTo(map)
          
          line.bindPopup(`<b>${route.route_number}</b><br/>${route.name}<br/>Est: ${route.estimated_time}`)
          layersRef.current.push(line)
          lineList.forEach(ll => bounds.extend(ll))

          // Draw stops at first and last point
          const startMarker = L.marker(lineList[0], { icon: stopIcon('S', true) })
            .addTo(map).bindPopup(`<b>Start</b><br/>${route.start_location}`)
          layersRef.current.push(startMarker)
          
          const endMarker = L.marker(lineList[lineList.length - 1], { icon: stopIcon('E', false) })
            .addTo(map).bindPopup(`<b>End</b><br/>${route.end_location}`)
          layersRef.current.push(endMarker)

          // 2. Add an animated Driver Marker for this Route
          const driverId = routeNumber.split('-')[1] || route.id
          const marker = L.marker(lineList[0], { icon: driverIcon(driverId) })
            .addTo(map)
            .bindPopup(`<b>Driver Active</b><br/>Route: ${route.name}<br/>ETA: ${route.estimated_time}`)
          layersRef.current.push(marker)
          
          activeRouteMarkers.push({
            marker,
            path: lineList,
            stepIndex: 0,
            progress: 0
          })
        }
      }

      // 3. Fallback for trips (if we had actual API trips not mapped to routes)
      trips.filter(t => t.status === 'Active' && !displayRoutes.some(r => r.route_number.includes(t.trip_number?.split('-')[1] || 'xxx'))).forEach(trip => {
        if (trip.driver_lat && trip.driver_lng) {
            const lat = Number(trip.driver_lat)
            const lng = Number(trip.driver_lng)
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                const label = trip.trip_number?.replace('TRIP-', '') || String(trip.id)
                const marker = L.marker([lat, lng], { icon: driverIcon(label) })
                .addTo(map)
                .bindPopup(`<b>${trip.trip_number || 'Trip'}</b><br/>Driver: ${trip.driver_name || '—'}<br/>GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                layersRef.current.push(marker)
                bounds.extend([lat, lng])
            }
        }
      })

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] })
      }

      // 4. Animate the markers along the mocked routes
      if (activeRouteMarkers.length > 0) {
        animationRef.current = setInterval(() => {
          activeRouteMarkers.forEach(driver => {
            const path = driver.path
            if (path.length < 2) return

            // Simple Linear interpolation animation
            driver.progress += 0.05 // speed
            if (driver.progress >= 1) {
                driver.progress = 0
                driver.stepIndex = (driver.stepIndex + 1)
                // When reaching the end, reverse direction to simulate continuous moving
                if (driver.stepIndex >= path.length - 1) {
                   driver.path.reverse() // ping-pong
                   driver.stepIndex = 0
                }
            }

            const current = path[driver.stepIndex]
            const next = path[driver.stepIndex + 1]
            
            const newLat = current.lat + (next.lat - current.lat) * driver.progress
            const newLng = current.lng + (next.lng - current.lng) * driver.progress
            
            driver.marker.setLatLng([newLat, newLng])
          })
        }, 100)
      }

    })()

  }, [trips, displayRoutes, mapReady])

  return (
    <div className="w-full h-full flex flex-col items-stretch space-y-0 relative min-h-[500px]">
      <div
        ref={mapRef}
        className="w-full h-full absolute inset-0 rounded-b-lg border-t border-border bg-[#1a1a2e]"
      />
      <div className="absolute bottom-4 left-4 z-[400] flex flex-wrap gap-2 text-xs bg-background/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-lg max-w-[90%]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
          <span className="text-foreground font-medium">Van/Lorry</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 rounded-full bg-green-600 border border-white" />
          <span className="text-foreground font-medium">Start</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white" />
          <span className="text-foreground font-medium">Delivery</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-6 h-1 bg-red-500" />
          <span className="text-foreground font-medium">Critical/High</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-6 h-1 bg-blue-500" />
          <span className="text-foreground font-medium">Medium/Low</span>
        </div>
      </div>
    </div>
  )
}
