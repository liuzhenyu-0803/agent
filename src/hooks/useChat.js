import { useState, useCallback } from 'react'
import { chatService } from '../services/chat/chatService'

export const useChat = () => {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadChats = useCallback(async () => {
    try {
      const allChats = await chatService.getAllChats()
      setChats(allChats || [])
      setError(null)
    } catch (err) {
      setError('加载会话失败: ' + err.message)
    }
  }, [])

  const createNewChat = useCallback(async () => {
    try {
      const newChat = await chatService.createChat()
      setChats(prevChats => [newChat, ...prevChats])
      setSelectedChat(newChat)
      setError(null)
      return newChat
    } catch (err) {
      setError('创建新会话失败: ' + err.message)
      return null
    }
  }, [])

  const deleteChat = useCallback(async (chatId) => {
    try {
      await chatService.deleteChat(chatId)
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
      }
      setError(null)
    } catch (err) {
      setError('删除会话失败: ' + err.message)
    }
  }, [selectedChat])

  const clearAllChats = useCallback(async () => {
    try {
      await chatService.clearAllChats()
      setChats([])
      setSelectedChat(null)
      setError(null)
    } catch (err) {
      setError('清空会话失败: ' + err.message)
    }
  }, [])

  const addMessage = useCallback(async (chatId, message) => {
    try {
      const newMessage = await chatService.addMessage(chatId, message)
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, newMessage]
              }
            : chat
        )
      )
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage]
        }))
      }
      setError(null)
      return newMessage
    } catch (err) {
      setError('发送消息失败: ' + err.message)
      return null
    }
  }, [selectedChat])

  return {
    chats,
    selectedChat,
    isLoading,
    error,
    setSelectedChat,
    setIsLoading,
    setError,
    loadChats,
    createNewChat,
    deleteChat,
    clearAllChats,
    addMessage
  }
}
