import React, { useState, useEffect } from 'react'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">设置</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            OpenRouter API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-primary"
            placeholder="输入你的 API Key"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            选择模型
          </label>
          {isLoading ? (
            <div className="text-center p-2">加载中...</div>
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:border-primary"
              disabled={!apiKey || models.length === 0}
            >
              <option value="">选择一个模型</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey || !selectedModel}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
