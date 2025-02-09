import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'

function Settings({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // 加载已保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.store.get('settings')
        if (settings?.apiKey) {
          setApiKey(settings.apiKey)
          apiService.setApiKey(settings.apiKey)
          // 加载模型列表
          await loadModels(settings.apiKey)
          if (settings?.selectedModel) {
            setSelectedModel(settings.selectedModel)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        setError('加载设置时出错')
      }
    }
    loadSettings()
  }, [])

  // 加载模型列表
  const loadModels = async (key) => {
    setIsLoading(true)
    setError(null)
    try {
      const availableModels = await apiService.getAvailableModels()
      console.log('Available models:', availableModels)
      setModels(availableModels)
    } catch (error) {
      console.error('Error loading models:', error)
      setError('加载模型列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理 API Key 变化
  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value
    setApiKey(newApiKey)
    if (newApiKey.length > 0) {
      apiService.setApiKey(newApiKey)
      loadModels(newApiKey)
    } else {
      setModels([])
      setSelectedModel('')
    }
  }

  // 保存设置
  const handleSave = async () => {
    try {
      const settings = {
        apiKey,
        selectedModel
      }
      console.log('Saving settings:', settings)
      await window.electronAPI.store.set('settings', settings)
      apiService.setApiKey(apiKey)
      apiService.setModel(selectedModel)
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('保存设置时出错')
    }
  }

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="settings-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-200">设置</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-zinc-700/80 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* API Key 输入框 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200"
            placeholder="输入你的 API Key"
          />
        </div>

        {/* 模型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            选择模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
          >
            <option value="">选择模型</option>
            {models.map(model => (
              <option 
                key={model.id} 
                value={model.id}
              >
                {model.id}
              </option>
            ))}
          </select>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-gray-300 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
