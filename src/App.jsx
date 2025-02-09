import React, { useState, useEffect } from 'react'
import Split from 'react-split'
import MessageContent from './components/MessageContent'
import Settings from './components/Settings'
import { apiService } from './services/api'
import './split.css'

function App() {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sizes, setSizes] = useState(() => {
    const savedSizes = localStorage.getItem('split-sizes')
    return savedSizes ? JSON.parse(savedSizes) : [25, 75]
  })

  // 加载设置和会话
  useEffect(() => {
    const initialize = async () => {
      try {
        // 加载设置
        const settings = await window.electronAPI.store.get('settings')
        console.log('Loaded settings:', settings)
        
        if (settings?.apiKey) {
          apiService.setApiKey(settings.apiKey)
        }
        if (settings?.selectedModel) {
          apiService.setModel(settings.selectedModel)
        }

        // 如果没有设置 API Key 或 Model，显示设置对话框
        if (!settings?.apiKey || !settings?.selectedModel) {
          setShowSettings(true)
        }

        // 加载会话
        const allChats = await window.electronAPI.store.get('chats')
        console.log('Loaded chats:', allChats)
        setChats(allChats || [])
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing:', error)
        setError('初始化失败: ' + error.message)
      }
    }
    initialize()
  }, [])

  // 创建新会话
  const handleNewChat = async () => {
    try {
      // 检查是否已设置 API
      const settings = await window.electronAPI.store.get('settings')
      if (!settings?.apiKey || !settings?.selectedModel) {
        setError('请先在设置中配置 API Key 和模型')
        setShowSettings(true)
        return
      }

      const newChat = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        title: '新的会话',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedChats = [newChat, ...chats]
      await window.electronAPI.store.set('chats', updatedChats)
      setChats(updatedChats)
      setSelectedChat(newChat)
      setError(null)
    } catch (error) {
      console.error('Error creating new chat:', error)
      setError('创建新会话失败: ' + error.message)
    }
  }

  // 删除会话
  const handleDeleteChat = async (chatId, e) => {
    try {
      e.stopPropagation()
      const updatedChats = chats.filter(chat => chat.id !== chatId)
      await window.electronAPI.store.set('chats', updatedChats)
      setChats(updatedChats)
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
      }
      setError(null)
    } catch (error) {
      console.error('Error deleting chat:', error)
      setError('删除会话失败: ' + error.message)
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return

    try {
      // 检查是否已设置 API
      const settings = await window.electronAPI.store.get('settings')
      if (!settings?.apiKey || !settings?.selectedModel) {
        setError('请先在设置中配置 API Key 和模型')
        setShowSettings(true)
        return
      }

      setIsLoading(true)
      setError(null)

      // 添加用户消息
      const userMessage = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        role: 'user',
        content: inputMessage,
        timestamp: new Date().toISOString()
      }

      // 更新聊天记录
      const updatedChat = {
        ...selectedChat,
        messages: [...selectedChat.messages, userMessage]
      }

      const updatedChats = chats.map(chat =>
        chat.id === selectedChat.id ? updatedChat : chat
      )

      await window.electronAPI.store.set('chats', updatedChats)
      setChats(updatedChats)
      setSelectedChat(updatedChat)
      setInputMessage('')

      // 获取最近的消息记录（最多10条）用于上下文
      const recentMessages = updatedChat.messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))

      // 获取 AI 响应
      const aiResponse = await apiService.sendMessage(recentMessages)

      // 添加 AI 响应
      const aiMessage = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage]
      }

      const finalChats = chats.map(chat =>
        chat.id === selectedChat.id ? finalChat : chat
      )

      await window.electronAPI.store.set('chats', finalChats)
      setChats(finalChats)
      setSelectedChat(finalChat)
    } catch (error) {
      console.error('Error sending message:', error)
      setError('发送消息失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理设置关闭
  const handleSettingsClose = () => {
    // 如果是首次设置，检查是否已配置
    if (!isInitialized) {
      const checkSettings = async () => {
        const settings = await window.electronAPI.store.get('settings')
        if (!settings?.apiKey || !settings?.selectedModel) {
          setError('请先配置 API Key 和模型')
          return
        }
        setIsInitialized(true)
      }
      checkSettings()
    }
    setShowSettings(false)
  }

  // 保存分割区域大小
  const handleDragEnd = (newSizes) => {
    localStorage.setItem('split-sizes', JSON.stringify(newSizes))
    setSizes(newSizes)
  }

  return (
    <div className="h-screen flex flex-col">
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
        </div>
      )}
      
      <Split
        sizes={sizes}
        minSize={200}
        maxSize={800}
        expandToMin={false}
        gutterSize={4}
        onDragEnd={handleDragEnd}
        className="flex h-full"
      >
        {/* 侧边栏 */}
        <div className="bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          {/* 新建聊天按钮 */}
          <button
            onClick={handleNewChat}
            className="m-4 p-2 bg-primary text-white rounded hover:bg-blue-600 transition-colors"
          >
            新建聊天
          </button>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto">
            {Array.isArray(chats) && chats.map(chat => {
              const lastMessage = chat.messages[chat.messages.length - 1]
              const lastMessageTime = lastMessage?.timestamp
                ? new Date(lastMessage.timestamp).toLocaleString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                  })
                : new Date(chat.createdAt).toLocaleString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                  })

              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="truncate flex-1 text-sm">
                    {lastMessage ? lastMessage.content : '新的会话'}
                  </span>
                  <div className="flex items-center ml-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap mr-2">
                      {lastMessageTime}
                    </span>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(true)}
            className="m-4 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
          >
            设置
          </button>
        </div>

        {/* 主聊天区域 */}
        <div className="bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedChat.messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-center p-4">
                    <span className="inline-block animate-spin mr-2">⌛</span>
                    正在思考...
                  </div>
                )}
              </div>

              {/* 输入框 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:border-primary dark:bg-gray-800 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-r hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                  >
                    发送
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              选择或创建一个会话开始聊天
            </div>
          )}
        </div>
      </Split>

      {/* 设置对话框 */}
      {showSettings && (
        <Settings onClose={handleSettingsClose} />
      )}
    </div>
  )
}

export default App
