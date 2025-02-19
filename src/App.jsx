// React 核心库
// useState: 用于在函数组件中添加状态管理
// useEffect: 用于处理组件生命周期和副作用操作
import React, { useState, useEffect } from 'react'

// 可拖动分屏组件，用于创建灵活的布局
// 允许用户通过拖动调整左右两侧面板的宽度比例
import Split from 'react-split'

// 消息展示组件，负责渲染聊天消息列表
// 处理消息的展示、格式化和交互
import MessageContent from './components/MessageContent'

// 响应等待指示器组件
// 显示等待AI响应的动画效果
import { ResponseIndicator } from './components/shared/ResponseIndicator'

// 设置弹窗组件，用于配置应用程序设置
// 包括 API Key、模型选择等关键配置
import Settings from './components/Settings'

// API 服务模块，封装了与 AI 服务交互的核心逻辑
// 提供消息发送、流式响应等功能
import { apiService } from './services/api'

// 错误处理模块
import { errorHandler } from './services/errorHandler'

// 分屏组件的样式文件
// 定义分屏组件的基础样式和交互效果
import './split.css'

// 主应用组件：AI 聊天应用的核心功能实现
function App() {
  // 状态管理：定义组件所需的各种状态
  // 聊天列表：所有消息记录
  const [chats, setChats] = useState([])
  
  // 当前选中的聊天
  const [selectedChat, setSelectedChat] = useState(null)
  
  // 用户输入消息
  const [inputMessage, setInputMessage] = useState('')
  
  // 表示是否正在等待AI的首次响应
  const [isResponsePending, setIsResponsePending] = useState(false)
  
  // 控制设置弹窗的显示
  const [showSettings, setShowSettings] = useState(false)
  
  // 错误信息管理
  const [error, setError] = useState(null)
  
  // 应用初始化状态
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 可拖动分屏的尺寸（持久化保存）
  const [sizes, setSizes] = useState(() => {
    // 从本地存储读取上次保存的分屏尺寸
    const savedSizes = localStorage.getItem('split-sizes')
    return savedSizes ? JSON.parse(savedSizes) : [25, 75]
  })
  
  // 控制聊天列表的显示/隐藏
  const [showChatList, setShowChatList] = useState(true)

  // 应用初始化：加载设置和历史聊天
  useEffect(() => {
    const initialize = async () => {
      try {
        // 加载应用设置
        const settings = await window.electronAPI.store.get('settings')
        console.log('Loaded settings:', settings)
        
        // 设置 API Key 和模型
        if (settings?.apiKey) {
          apiService.setApiKey(settings.apiKey)
        }
        if (settings?.selectedModel) {
          apiService.setModel(settings.selectedModel)
        }

        // 如果没有配置 API Key 或模型，显示设置弹窗
        if (!settings?.apiKey || !settings?.selectedModel) {
          setShowSettings(true)
        }

        // 加载历史聊天记录
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

  // 创建新的聊天
  const handleNewChat = async () => {
    try {
      // 检查是否已设置 API
      const settings = await window.electronAPI.store.get('settings')
      if (!settings?.apiKey || !settings?.selectedModel) {
        setError('请先在设置中配置 API Key 和模型')
        setShowSettings(true)
        return
      }

      // 创建新聊天的数据结构
      const newChat = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        title: '新的聊天',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 更新聊天列表并保存
      const updatedChats = [newChat, ...chats]
      await window.electronAPI.store.set('chats', updatedChats)
      setChats(updatedChats)
      setSelectedChat(newChat)
      setError(null)
    } catch (error) {
      console.error('Error creating new chat:', error)
      setError('创建新聊天失败: ' + error.message)
    }
  }

  // 删除指定的聊天
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
      setError('删除聊天失败: ' + error.message)
    }
  }

  /**
   * 处理消息发送的核心函数
   * 1. 验证并处理用户输入
   * 2. 创建新的消息对象并更新聊天记录
   * 3. 发送消息到AI服务并等待响应
   * 4. 处理AI的流式响应数据
   * 5. 更新UI状态和持久化存储
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsResponsePending(true);
      setError(null);

      // 添加用户消息到聊天列表
      const userMessage = {
        role: 'user',
        content: inputMessage,
        timestamp: new Date()
      };

      const updatedChats = [...chats, userMessage];
      setChats(updatedChats);
      setInputMessage('');

      // 发送消息并获取响应
      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setChats([...updatedChats, assistantMessage]);

      await apiService.sendMessageStream(updatedChats, (chunk) => {
        assistantMessage.content += chunk;
        setChats([...updatedChats, { ...assistantMessage }]);
      });

      setIsResponsePending(false);
    } catch (error) {
      setError(errorHandler.getUserFriendlyMessage(error));
      setIsResponsePending(false);
    }
  };

  // 错误提示组件
  const ErrorMessage = ({ message }) => (
    <div className="error-message bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
      <p className="text-red-500">{message}</p>
    </div>
  );

  // 处理按键事件，按下 Enter 键发送消息
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理设置面板关闭
  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  // 渲染组件的 JSX
  return (
    <div className="h-screen flex bg-zinc-900">
      {/* 导航栏 */}
      <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={() => setShowChatList(!showChatList)}
          className={`p-2.5 rounded-xl mb-2 text-gray-300 transition-all duration-200 ease-in-out transform hover:scale-105 ${
            showChatList 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20' 
              : 'hover:bg-gradient-to-br hover:from-blue-600/90 hover:to-blue-700/90'
          }`}
          title="聊天列表"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
          </svg>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl text-gray-300 transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-zinc-700/80"
          title="系统设置"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076-.124a6.57 6.57 0 01-.22-.127c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076.124.072.044.146.087.22.128.332.183.582.495.644.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 主界面布局 */}
      <div className="flex-1 flex">
        {/* 聊天列表 */}
        {showChatList && (
          <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedChat?.id === chat.id
                      ? 'bg-zinc-700/90 text-gray-100'
                      : 'text-gray-300 hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-400 truncate">
                        {chat.messages[0]?.content || '新的聊天'}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="text-xs text-gray-500 tabular-nums">
                        {new Date(chat.messages[0]?.timestamp || Date.now()).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('确定要删除这个聊天吗？')) {
                              const newChats = chats.filter(c => c.id !== chat.id);
                              setChats(newChats);
                              if (selectedChat?.id === chat.id) {
                                setSelectedChat(null);
                              }
                              window.electronAPI.store.set('chats', newChats);
                            }
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-zinc-700/80"
                          title="删除聊天"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 底部按钮 */}
            <div className="p-4 border-t border-zinc-800 space-y-2.5">
              <button
                onClick={handleNewChat}
                className="w-full bg-gradient-to-br from-blue-600/90 to-blue-700/90 hover:from-blue-500 hover:to-blue-600 text-gray-100 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                新建聊天
              </button>
              <button
                onClick={() => {
                  if (window.confirm('确定要清空所有聊天吗？')) {
                    setChats([]);
                    setSelectedChat(null);
                    window.electronAPI.store.set('chats', []);
                  }
                }}
                className="w-full bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-500/90 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                清空聊天
              </button>
            </div>
          </div>
        )}

        {/* 消息区 */}
        <div className="flex-1 flex flex-col bg-zinc-900">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedChat && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                  <h2 className="text-xl font-semibold text-gray-200">欢迎使用 AI 助手</h2>
                  <p className="text-gray-400">开始一个新的聊天，探索 AI 的无限可能</p>
                </div>
              </div>
            )}
            {selectedChat?.messages.map((message, index) => (
              <div
                key={message.id}
                className={`mb-4 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-zinc-700/90 text-gray-100'
                      : 'bg-zinc-800/50 text-gray-200'
                  }`}
                >
                  <MessageContent content={message.content} />
                </div>
              </div>
            ))}
            {isResponsePending && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] rounded-xl px-4 py-3 bg-zinc-800/50 text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M16.5 7.5h-9v9h9v-9z" />
                        <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <ResponseIndicator />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="border-t border-zinc-800 p-4">
            {error && (
              <ErrorMessage message={error} />
            )}
            <div className="flex gap-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="flex-1 bg-zinc-800/50 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isResponsePending}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <Settings onClose={handleSettingsClose} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
