import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import '../styles/Page5Optimizer.css'


function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [bounds, map])
  return null
}

function Page5Optimizer({ goToPage, flightData }) {
  const [lambda, setLambda] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [optimizedCoords, setOptimizedCoords] = useState(null)
  const [routeStats, setRouteStats] = useState(null)

  const startPos = [flightData.startLat || 31.14, flightData.startLon || 121.81]
  const endPos = [flightData.endLat || 51.47, flightData.endLon || -0.45]

  const directRoute = [startPos, endPos]

  const handleOptimize = async () => {
    setIsLoading(true)
    setOptimizedCoords(null)

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { lat: flightData.startLat, lon: flightData.startLon },
          end: { lat: flightData.endLat, lon: flightData.endLon },
          departure_time: flightData.departureTime,
          aircraft_type: flightData.aircraftType || 'B738',
          lambda: lambda,
          grid_config: {
            lat_step_deg: 0.5,
            lon_step_deg: 0.5,
            altitudes_ft: [30000, 34000, 38000],
            max_expansions: 8000,
          },
        }),
      })

      const data = await response.json()
      console.log('Optimize response:', data)

      if (data.route_edges && data.route_edges.length > 0) {
        const coords = []
        coords.push([data.route_edges[0].from.lat, data.route_edges[0].from.lon])
        data.route_edges.forEach((edge) => {
          coords.push([edge.to.lat, edge.to.lon])
        })
        setOptimizedCoords(coords)
        setRouteStats(data.totals || null)
      } else if (data.route && data.route.length > 0) {
        const coords = data.route.map((point) => [point.lat, point.lon])
        setOptimizedCoords(coords)
      }
    } catch (error) {
      console.error('Optimize error:', error)
      alert('Failed to optimize route. Check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page page5">
      <div className="optimizer-container">

        <MapContainer
          center={[45, 20]}
          zoom={3}
          className="leaflet-map"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds bounds={[startPos, endPos]} />

          <Marker position={startPos}>
            <Popup>{flightData.departure || 'Start'}</Popup>
          </Marker>

          <Marker position={endPos}>
            <Popup>{flightData.destination || 'End'}</Popup>
          </Marker>

          <Polyline
            positions={directRoute}
            pathOptions={{
              color: 'gray',
              weight: 3,
              dashArray: '10, 10',
              opacity: 0.7,
            }}
          />

          {optimizedCoords && (
            <Polyline
              positions={optimizedCoords}
              pathOptions={{
                color: 'black',
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}
        </MapContainer>

        <div className="lambda-control">
          <div className="lambda-header">
            Click <strong>Optimize Route</strong> to see results.
          </div>

          <div className="lambda-slider-container">
            <div className="lambda-label">
              λ=0<br />
              Extremely concerned<br />
              about fuel cost
            </div>
            <input
              type="range"
              className="lambda-slider"
              min="0"
              max="2"
              step="0.1"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
            />
            <div className="lambda-label">
              λ=2<br />
              Extremely concerned<br />
              about reduce sky-trace
            </div>
          </div>

          <div className="lambda-info">
            Note: Adjust the Lambda value to calculate a flight route that balances
            fuel costs and contrail climate impact. Click the Information button at
            the bottom right for more information.
          </div>
        </div>

        <button
          className="optimize-button"
          onClick={handleOptimize}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Optimize Route'}
        </button>

        {isLoading && (
          <div className="loading">
            <div className="spinner" />
            Calculating optimal route...
          </div>
        )}

        {routeStats && (
          <div className="route-stats">
            <h3>Route Comparison</h3>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Total Fuel (kg)</th>
                  <th>Fuel Cost (USD)</th>
                  <th>Total EF (J)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Optimized</td>
                  <td>{routeStats.total_fuel_kg?.toFixed(1)}</td>
                  <td>${routeStats.total_fuel_cost_usd?.toFixed(2)}</td>
                  <td>{routeStats.total_ef_joules?.toExponential(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="info-button" onClick={() => goToPage(6)}>
        <div style={{ textAlign: 'center' }}>
          <div className="info-icon">ℹ</div>
          <div className="info-btn-text">More information</div>
        </div>
      </div>
    </div>
  )
}

export default Page5Optimizer
