import '../styles/Page2Transition.css'

/**
 * Page2Transition — 过渡页
 * 
 * 功能：
 * - 晴天窗户 + "Ready to take off? Just tap the window!"
 * - 用户点击窗户 → 进入 Page3（AI聊天）
 */
function Page2Transition({ goToPage }) {
  return (
    <div className="page page2">
      <div className="window-container">
        <div
          className="airplane-window"
          onClick={() => goToPage(3)}
          style={{ cursor: 'pointer' }}
        >
          <div className="window-view">
            {/* 晴天（直接显示，opacity=1） */}
            <div className="sky-view clean-sky" style={{ opacity: 1 }} />
            {/* 提示文字（直接显示） */}
            <div className="tap-message" style={{ opacity: 1 }}>
              Ready to take off?<br />Just tap the window!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page2Transition
