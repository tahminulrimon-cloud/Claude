import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './WorldMap.css'

export default function WorldMap({ countries, onCountryClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
        center: [20, 15],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        minZoom: 2,
        maxZoom: 10,
      })

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map).setPrefix('© CartoDB')

      countries.forEach(country => {
        if (!country.latitude || !country.longitude) return

        const hasPhotos = (country.photo_count || 0) > 0
        const color = hasPhotos ? '#F4A261' : '#2A9D8F'
        const size  = hasPhotos ? 12 : 9

        const marker = L.circleMarker([country.latitude, country.longitude], {
          radius: size,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.75,
          className: 'map-marker',
        })

        const popupHtml = `
          <div class="map-popup">
            <div class="map-popup-name">${country.name}</div>
            <div class="map-popup-meta">${country.from_date} – ${country.to_date || '...'}</div>
            ${hasPhotos ? `<div class="map-popup-photos">${country.photo_count} photo${country.photo_count !== 1 ? 's' : ''}</div>` : ''}
          </div>`

        marker.bindPopup(popupHtml, {
          className: 'leaflet-custom-popup',
          maxWidth: 200,
          closeButton: false,
        })
        marker.on('click', () => onCountryClick(country))
        marker.on('mouseover', function() { this.openPopup() })
        marker.on('mouseout',  function() { this.closePopup() })
        marker.addTo(map)
      })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !countries.length) return
  }, [countries])

  return (
    <section className="world-map-section">
      <div className="world-map-header">
        <div>
          <h2 className="section-title">My World Map</h2>
          <p className="section-sub">Click any marker to explore that country</p>
        </div>
        <div className="map-legend">
          <span className="legend-dot legend-dot-gold" />
          <span className="legend-label">Has photos</span>
          <span className="legend-dot legend-dot-teal" />
          <span className="legend-label">Visited</span>
        </div>
      </div>
      <div className="world-map-container">
        <div ref={mapRef} className="leaflet-map" />
      </div>
    </section>
  )
}
