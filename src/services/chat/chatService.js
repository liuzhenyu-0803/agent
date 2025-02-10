// 创建一个随机ID的函数
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

class ChatService {
  constructor() {
    // 初始化默认值
    if (!window.electronAPI.store.get('chats')) {
      window.electronAPI.store.set('chats', [])
    }
  }

  // 获取所有会话
  async getAllChats() {
    return window.electronAPI.store.get('chats') || []
  }

  // 创建新会话
  async createChat(title = '新的会话') {
    const chats = await this.getAllChats()
    const newChat = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await window.electronAPI.store.set('chats', [newChat, ...chats])
    return newChat
  }

  // 获取单个会话
  async getChat(chatId) {
    const chats = await this.getAllChats()
    return chats.find(chat => chat.id === chatId)
  }

  // 更新会话
  async updateChat(chatId, updates) {
    const chats = await this.getAllChats()
    const index = chats.findIndex(chat => chat.id === chatId)
    
    if (index !== -1) {
      chats[index] = {
        ...chats[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await window.electronAPI.store.set('chats', chats)
      return chats[index]
    }
    return null
  }

  // 删除会话
  async deleteChat(chatId) {
    const chats = await this.getAllChats()
    const filteredChats = chats.filter(chat => chat.id !== chatId)
    await window.electronAPI.store.set('chats', filteredChats)
  }

  // 清空所有会话
  async clearAllChats() {
    await window.electronAPI.store.set('chats', [])
  }

  // 添加消息到会话
  async addMessage(chatId, message) {
    const chats = await this.getAllChats()
    const index = chats.findIndex(chat => chat.id === chatId)
    
    if (index !== -1) {
      const chat = chats[index]
      const newMessage = {
        id: generateId(),
        ...message,
        timestamp: new Date().toISOString()
      }
      chat.messages.push(newMessage)
      chat.updatedAt = new Date().toISOString()
      await window.electronAPI.store.set('chats', chats)
      return newMessage
    }
    return null
  }

  // 更新消息内容
  async updateMessage(chatId, messageId, updates) {
    const chats = await this.getAllChats()
    const chatIndex = chats.findIndex(chat => chat.id === chatId)
    
    if (chatIndex !== -1) {
      const chat = chats[chatIndex]
      const messageIndex = chat.messages.findIndex(msg => msg.id === messageId)
      
      if (messageIndex !== -1) {
        chat.messages[messageIndex] = {
          ...chat.messages[messageIndex],
          ...updates
        }
        chat.updatedAt = new Date().toISOString()
        await window.electronAPI.store.set('chats', chats)
        return chat.messages[messageIndex]
      }
    }
    return null
  }
}

export const chatService = new ChatService()
