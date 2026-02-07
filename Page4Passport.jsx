import { useState } from 'react'
import '../styles/Page4Passport.css'

/**
 * Page4Passport — 航班护照页
 *
 * 功能：
 * - 上半部分：显示收集到的 Flight Information
 * - 下半部分：世界地图背景，点击任何地方 → "TIME TO TRAVEL" 印章落下
 * - 印章动画完成后 → 进入 Page5
 *
 * Props:
 * - goToPage(n)
 * - flightData: 航班信息
 */
function Page4Passport({ goToPage, flightData }) {
  const [stampVisible, setStampVisible] = useState(false)

  // 点击护照下半部分
  const handleFooterClick = () => {
    setStampVisible(true)
    // 印章动画后跳转
    setTimeout(() => goToPage(5), 1000)
  }

  // 格式化时间显示
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A'
    try {
      return new Date(isoString).toLocaleString()
    } catch {
      return isoString
    }
  }

  return (
    <div className="page page4">
      <div className="passport-container">
        {/* 护照标题 */}
        <h1 className="passport-header">Your Flight Passport</h1>

        <div className="passport-subheader">
          <div className="logo-placeholder" />
          <span>SkyTrace - A Climate-aware Flight Routing</span>
        </div>

        {/* 航班信息 */}
        <div className="flight-info">
          <h2>Flight Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Start time: </span>
              <span>{formatTime(flightData.departureTime)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">From: </span>
              <span>{flightData.departure || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">To: </span>
              <span>{flightData.destination || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Aircraft Type: </span>
              <span>{flightData.aircraftType || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estimated duration hours: </span>
              <span>{flightData.duration || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* MRZ 风格的编码行 */}
        <div className="passport-mrz">
          EMMA&lt;&lt;&lt;&lt;&lt;&lt;ETH&lt;OXFORD&lt;&lt;SKY&lt;TRACE2026&lt;&lt;&lt;&lt;&lt;&lt;FLIGHT&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;ROUTING&lt;&lt;&lt;0207&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;CLIMATE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </div>

        <hr className="passport-divider" />

        {/* 下半部分：世界地图 + 印章 */}
        <div className="passport-footer" onClick={handleFooterClick}>
          {/* 简化的世界地图SVG */}
          <svg className="world-map" viewBox="0 0 1000 600">
            <path
              d="M 100 300 Q 300 100, 500 300 T 900 300"
              stroke="#ccc"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="200" cy="300" r="5" fill="#666" />
            <circle cx="800" cy="300" r="5" fill="#666" />
          </svg>

          {/* "TIME TO TRAVEL" 印章 */}
          <div className={`stamp ${stampVisible ? 'visible' : ''}`}>
            <div className="stamp-text">★ TIME TO ★</div>
            <div className="stamp-icon">✈</div>
            <div className="stamp-text">★ TRAVEL ★</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page4Passport
