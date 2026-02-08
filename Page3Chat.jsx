import { useState, useRef, useEffect } from 'react'
import '../styles/Page3Chat.css'

const AI_MODE = 'backend' // 改成 'anthropic' 如果直接调前端
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_KEY_HERE' // 仅 AI_MODE='anthropic' 时需要
const BACKEND_URL = '/api/chat' // 通过后端代理
// =========================================

function Page3Chat({ goToPage, flightData, setFlightData }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        "Hi!! I'm here to help you plan your flight. Please tell me your departure city, destination, preferred departure time, and aircraft type.",
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const userMessage = inputValue.trim()
    if (!userMessage || isLoading) return

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setInputValue('')
    setIsLoading(true)

    const newHistory = [...conversationHistory, { role: 'user', content: userMessage }]
    setConversationHistory(newHistory)

    try {
      const aiResponse = await callAI(newHistory)

      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: aiResponse },
      ])

      if (
        aiResponse.toLowerCase().includes('confirm') ||
        aiResponse.toLowerCase().includes('yes to confirm')
      ) {
        setAwaitingConfirmation(true)
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: aiResponse, isConfirmation: true },
        ])
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }])
      }
    } catch (error) {
      console.error('AI Error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    }

    setIsLoading(false)
  }

  async function callAI(history) {
    const systemPrompt = `You are a helpful flight booking assistant. Your job is to collect the following information from the user:
1. Departure city/airport
2. Destination city/airport  
3. Departure date and time
4. Aircraft type preference (e.g., A380, B738, A320)
5. Estimated flight duration

Ask for missing information naturally. Once you have ALL information, create a summary in this EXACT format:
"To confirm your request:
Departure Time: [time], Duration: [hours], Route: [origin] to [destination], and Aircraft Type: [type].
Please select Yes to confirm or No to continue the conversation."

Be conversational and helpful.`

    if (AI_MODE === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: history,
        }),
      })
      const data = await response.json()
      return data.content[0].text
    } else {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: history,
        }),
      })
      const data = await response.json()
      return data.response
    }
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      await extractFlightData()
      setTimeout(() => goToPage(4), 500)
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'No problem! What would you like to change?' },
      ])
      setAwaitingConfirmation(false)
    }
  }

  async function extractFlightData() {
    const extractionPrompt = `Based on the conversation, extract flight information in JSON format:
{
  "departure": "city name (AIRPORT_CODE)",
  "destination": "city name (AIRPORT_CODE)",
  "departureTime": "YYYY-MM-DDTHH:mm:ss.000Z",
  "aircraftType": "type",
  "duration": "Xh",
  "startLat": number,
  "startLon": number,
  "endLat": number,
  "endLon": number
}

Use common airport coordinates. For example:
- Shanghai Pudong: 31.1443, 121.8083
- London Heathrow: 51.4700, -0.4543
- New York JFK: 40.6413, -73.7781

Return ONLY the JSON, no other text.`

    try {
      let jsonStr

      if (AI_MODE === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            system: extractionPrompt,
            messages: conversationHistory,
          }),
        })
        const data = await response.json()
        jsonStr = data.content[0].text
      } else {
        const response = await fetch('/api/extract-flight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: extractionPrompt,
            messages: conversationHistory,
          }),
        })
        const data = await response.json()
        jsonStr = data.response
      }

      // 解析JSON
      const extracted = JSON.parse(jsonStr)
      setFlightData((prev) => ({ ...prev, ...extracted }))
    } catch (error) {
      console.error('Extraction error:', error)
      // Fallback 默认数据
      setFlightData({
        departure: 'Shanghai Pudong (PVG)',
        destination: 'London Heathrow (LHR)',
        departureTime: '2026-02-07T08:00:00.000Z',
        aircraftType: 'A380',
        duration: '15h',
        startLat: 31.1443,
        startLon: 121.8083,
        endLat: 51.47,
        endLon: -0.4543,
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="page page3">
      <div className="chat-container">
        {/* 顶部标题 */}
        <div className="chat-header">Tell me about your target flight route.</div>

        {/* 消息列表 */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}-message`}>
              {msg.content}

              {/* 如果是确认消息，显示 Yes/No 按钮 */}
              {msg.isConfirmation && (
                <div className="confirm-buttons">
                  <button
                    className="confirm-btn yes-btn"
                    onClick={() => handleConfirm(true)}
                  >
                    Yes
                  </button>
                  <button
                    className="confirm-btn no-btn"
                    onClick={() => handleConfirm(false)}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 加载指示器 */}
          {isLoading && (
            <div className="message ai-message">
              <span className="typing-indicator">●●●</span>
            </div>
          )}

          {/* 用于自动滚动到底部的锚点 */}
          <div ref={chatEndRef} />
        </div>

        {/* 底部输入框 */}
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="off"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={isLoading}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

export default Page3Chat
