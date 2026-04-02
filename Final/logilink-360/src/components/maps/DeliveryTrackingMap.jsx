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

export default function DeliveryTrackingMap({ trips = [], selectedRoute = null }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)

  // Init map with delay so the tab is fully visible first
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current || !mapRef.current) return

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

  const activeTrips = useMemo(
    () => (trips || []).filter(
      (t) => t.status === 'Active' &&
        t.driver_lat != null && t.driver_lng != null &&
        !Number.isNaN(Number(t.driver_lat)) && !Number.isNaN(Number(t.driver_lng))
    ),
    [trips]
  )

  useEffect(() => {
    if (!mapReady) return
    const map = mapInstanceRef.current
    if (!map) return

    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    const bounds = L.latLngBounds([])

    activeTrips.forEach((trip) => {
      const lat = Number(trip.driver_lat)
      const lng = Number(trip.driver_lng)
      const label = trip.trip_number?.replace('TRIP-', '') || String(trip.id)
      const marker = L.marker([lat, lng], { icon: driverIcon(label) })
        .addTo(map)
        .bindPopup(`<b>${trip.trip_number || 'Trip'}</b><br/>Driver: ${trip.driver_name || '—'}<br/>GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      layersRef.current.push(marker)
      bounds.extend([lat, lng])
    })

    if (selectedRoute) {
      const stops = selectedRoute.stops_data || []
      let addresses = stops.map((s) => (s.location || '').trim()).filter(Boolean)
      if (addresses.length < 2 && selectedRoute.start_location && selectedRoute.end_location) {
        addresses = [selectedRoute.start_location, selectedRoute.end_location]
      }

      if (addresses.length >= 2) {
        ;(async () => {
          const coords = []
          for (let i = 0; i < addresses.length; i++) {
            const latlng = await geocode(addresses[i])
            if (latlng) coords.push({ latlng, label: addresses[i], idx: i })
          }

          if (!mapInstanceRef.current) return

          coords.forEach(({ latlng, label, idx }) => {
            const marker = L.marker(latlng, { icon: stopIcon(idx + 1, idx === 0) })
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>Stop ${idx + 1}</b><br/>${label}`)
            layersRef.current.push(marker)
            bounds.extend(latlng)
          })

          if (coords.length >= 2) {
            const line = L.polyline(
              coords.map((c) => c.latlng),
              { color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '8,4' }
            ).addTo(mapInstanceRef.current)
            layersRef.current.push(line)
          }

          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] })
          }
        })()
        return
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] })
    }
  }, [activeTrips, selectedRoute, mapReady])

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: '#1a1a2e',
        }}
      />
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '2px solid white' }} />
          Active trip (last GPS ping)
        </span>
        <span className="flex items-center gap-2">
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#16a34a', border: '2px solid white' }} />
          Start stop
        </span>
        <span className="flex items-center gap-2">
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#6366f1', border: '2px solid white' }} />
          Delivery stop
        </span>
        {selectedRoute && (
          <span className="flex items-center gap-2">
            <span style={{ display: 'inline-block', width: 24, height: 2, background: '#6366f1' }} />
            Planned route: {selectedRoute.name}
          </span>
        )}
      </div>
    </div>
  )
}
