import { useState } from 'react'
import '../styles/Page1Landing.css'

/**
 * Page1Landing — 首页
 * 
 * 功能：
 * - 显示 SkyTrace 标题
 * - 飞机窗户：窗外是污染天空
 * - 底部滑块：拖动飞机图标，天空从污染渐变为晴天
 * - 滑到100%或点击窗户（>80%时）→ 进入 Page2
 * 
 * Props:
 * - goToPage(n): 切换页面的函数
 */
function Page1Landing({ goToPage }) {
  const [sliderValue, setSliderValue] = useState(0)

  // 滑块变化时
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value)
    setSliderValue(value)

    // 滑到100自动跳转
    if (value === 100) {
      setTimeout(() => goToPage(2), 500)
    }
  }

  // 点击窗户（滑块>80时才有效）
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
            {/* 污染天空 — 始终在底层 */}
            <div className="sky-view polluted-sky" />

            {/* 晴天 — opacity 由滑块控制 */}
            <div
              className="sky-view clean-sky"
              style={{ opacity: sliderValue / 100 }}
            />

            {/* "Ready to take off" 提示文字 — 滑块>80时显示 */}
            <div
              className="tap-message"
              style={{ opacity: sliderValue > 80 ? 1 : 0 }}
            >
              Ready to take off?<br />Just tap the window!
            </div>
          </div>
        </div>
      </div>

      {/* 底部滑块 */}
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
