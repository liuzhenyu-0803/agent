import { API_CONFIG } from '../config/api'

class ApiService {
  constructor() {
    this.apiKey = null
    this.selectedModel = null
    this.baseUrl = 'https://openrouter.ai/api/v1'
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  setModel(model) {
    this.selectedModel = model
  }

  // 获取可用模型列表
  async getAvailableModels() {
    if (!this.apiKey) {
      throw new Error('API Key not set')
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching models:', error)
      throw error
    }
  }

  // 发送消息并获取回复（流式）
  async sendMessageStream(messages, onChunk) {
    if (!this.apiKey || !this.selectedModel) {
      console.error('API configuration missing:', { 
        hasApiKey: !!this.apiKey, 
        selectedModel: this.selectedModel 
      })
      throw new Error('API Key or Model not set')
    }

    // 确保消息格式正确
    const formattedMessages = Array.isArray(messages) 
      ? messages 
      : [{ role: 'user', content: messages }]

    try {
      console.log('Sending message to API:', {
        model: this.selectedModel,
        messages: formattedMessages,
        url: `${this.baseUrl}/chat/completions`
      })

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: this.selectedModel,
          messages: formattedMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
        }
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            console.log('Stream complete')
            break
          }

          // 解码新的数据块
          const chunk = decoder.decode(value, { stream: true })
          console.log('Received chunk:', chunk)
          buffer += chunk

          // 处理完整的SSE消息
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一个不完整的行

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

            try {
              // 确保只处理data行
              if (trimmedLine.startsWith('data: ')) {
                const jsonStr = trimmedLine.slice(6) // 移除 'data: ' 前缀
                console.log('Processing JSON:', jsonStr)
                const data = JSON.parse(jsonStr)
                
                // 提取content
                const content = data.choices?.[0]?.delta?.content
                if (content) {
                  console.log('Extracted content:', content)
                  onChunk(content)
                }
              }
            } catch (e) {
              console.warn('Error parsing SSE message:', e, 'Line:', trimmedLine)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // 发送消息并获取回复（非流式，保留向后兼容）
  async sendMessage(messages) {
    if (!this.apiKey || !this.selectedModel) {
      throw new Error('API Key or Model not set')
    }

    // 确保消息格式正确
    const formattedMessages = Array.isArray(messages) 
      ? messages 
      : [{ role: 'user', content: messages }]

    try {
      console.log('Sending message to API:', {
        model: this.selectedModel,
        messages: formattedMessages
      })

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: this.selectedModel,
          messages: formattedMessages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API response:', data)
      return data.choices[0].message.content
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
