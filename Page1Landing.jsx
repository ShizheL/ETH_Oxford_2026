import { useState } from 'react'
import '../styles/Page1Landing.css'

function Page1Landing({ goToPage }) {
  const [sliderValue, setSliderValue] = useState(0)

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value)
    setSliderValue(value)

    if (value === 100) {
      setTimeout(() => goToPage(2), 500)
    }
  }

  const handleWindowClick = () => {
    if (sliderValue > 80) {
      goToPage(2)
    }
  }

  return (
    <div className="page page1">
      <h1 className="title">SkyTrace</h1>

      <div className="window-container">
        <div className="airplane-window" onClick={handleWindowClick}>
          <div className="window-view">
            <div className="sky-view polluted-sky" />

            <div
              className="sky-view clean-sky"
              style={{ opacity: sliderValue / 100 }}
            />

            <div
              className="tap-message"
              style={{ opacity: sliderValue > 80 ? 1 : 0 }}
            >
              Ready to take off?<br />Just tap the window!
            </div>
          </div>
        </div>
      </div>

      <div className="slider-container">
        <span className="plane-icon">✈️</span>
        <input
          type="range"
          className="sky-slider"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
        />
      </div>
      <p className="swipe-text">Swipe to see our impact</p>
    </div>
  )
}

export default Page1Landing
