import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import '../styles/Page5Optimizer.css'

/**
 * Page5Optimizer — 核心页面：地图 + 路线优化
 *
 * 功能：
 * - 显示 Leaflet 地图，标注起点和终点
 * - Lambda 滑块 (0~2): 控制燃料成本 vs 减少sky-trace的权重
 * - "Optimize Route" 按钮：调用后端API计算最优路线
 * - 地图上画两条线：灰色虚线（直线最短路线） + 黑色实线（优化路线）
 * - 右下角 "More information" → 进入 Page6
 *
 * Props:
 * - goToPage(n)
 * - flightData: 航班信息（含起终点坐标）
 */

// ---- 辅助组件：自动调整地图视野 ----
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

  // 起终点坐标
  const startPos = [flightData.startLat || 31.14, flightData.startLon || 121.81]
  const endPos = [flightData.endLat || 51.47, flightData.endLon || -0.45]

  // 直线路线（灰色虚线）
  const directRoute = [startPos, endPos]

  // ---- 点击 Optimize Route ----
  const handleOptimize = async () => {
    setIsLoading(true)
    setOptimizedCoords(null)

    try {
      // 调用你的 Python 后端 API
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

      // 从返回数据中提取路线坐标
      if (data.route_edges && data.route_edges.length > 0) {
        // 按照项目计划的 route_edges 格式
        const coords = []
        coords.push([data.route_edges[0].from.lat, data.route_edges[0].from.lon])
        data.route_edges.forEach((edge) => {
          coords.push([edge.to.lat, edge.to.lon])
        })
        setOptimizedCoords(coords)
        setRouteStats(data.totals || null)
      } else if (data.route && data.route.length > 0) {
        // 兼容你之前的 API 格式（旧版）
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
        {/* Leaflet 地图 */}
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

          {/* 自动对齐视野到起终点 */}
          <FitBounds bounds={[startPos, endPos]} />

          {/* 起点标记 */}
          <Marker position={startPos}>
            <Popup>{flightData.departure || 'Start'}</Popup>
          </Marker>

          {/* 终点标记 */}
          <Marker position={endPos}>
            <Popup>{flightData.destination || 'End'}</Popup>
          </Marker>

          {/* 灰色虚线 — 直线最短路线 */}
          <Polyline
            positions={directRoute}
            pathOptions={{
              color: 'gray',
              weight: 3,
              dashArray: '10, 10',
              opacity: 0.7,
            }}
          />

          {/* 黑色实线 — 优化路线 */}
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

        {/* Lambda 控制区 */}
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

        {/* 优化按钮 */}
        <button
          className="optimize-button"
          onClick={handleOptimize}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Optimize Route'}
        </button>

        {/* 加载指示器 */}
        {isLoading && (
          <div className="loading">
            <div className="spinner" />
            Calculating optimal route...
          </div>
        )}

        {/* 路线对比表（如果有数据） */}
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

      {/* 右下角 "More information" 按钮 */}
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
