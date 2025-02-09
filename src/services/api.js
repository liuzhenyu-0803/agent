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

  // 发送消息并获取回复
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
