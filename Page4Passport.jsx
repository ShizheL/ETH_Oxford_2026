import { useState } from 'react'
import '../styles/Page4Passport.css'


function Page4Passport({ goToPage, flightData }) {
  const [stampVisible, setStampVisible] = useState(false)

  const handleFooterClick = () => {
    setStampVisible(true)
    setTimeout(() => goToPage(5), 1000)
  }

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

        <h1 className="passport-header">Your Flight Passport</h1>

        <div className="passport-subheader">
          <div className="logo-placeholder" />
          <span>SkyTrace - A Climate-aware Flight Routing</span>
        </div>

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

        <div className="passport-mrz">
          EMMA&lt;&lt;&lt;&lt;&lt;&lt;ETH&lt;OXFORD&lt;&lt;SKY&lt;TRACE2026&lt;&lt;&lt;&lt;&lt;&lt;FLIGHT&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;ROUTING&lt;&lt;&lt;0207&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;CLIMATE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </div>

        <hr className="passport-divider" />

        <div className="passport-footer" onClick={handleFooterClick}>

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
