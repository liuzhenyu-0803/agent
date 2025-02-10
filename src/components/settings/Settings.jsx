import React, { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { apiService } from '../../services/api/apiService'
import { Loading } from '../shared/Loading'

export const Settings = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCurrentSettings = async () => {
      try {
        const settings = await window.electronAPI.store.get('settings')
        if (settings) {
          setApiKey(settings.apiKey || '')
          setSelectedModel(settings.selectedModel || '')
        }
      } catch (err) {
        setError('加载设置失败: ' + err.message)
      }
    }
    loadCurrentSettings()
  }, [])

  const handleSave = async () => {
    try {
      await window.electronAPI.store.set('settings', {
        apiKey,
        selectedModel
      })
      apiService.setApiKey(apiKey)
      apiService.setModel(selectedModel)
      onClose()
    } catch (err) {
      setError('保存设置失败: ' + err.message)
    }
  }

  const loadAvailableModels = async () => {
    try {
      setLoadingModels(true)
      setError(null)
      apiService.setApiKey(apiKey)
      const models = await apiService.getAvailableModels()
      setAvailableModels(models)
    } catch (err) {
      setError('加载模型列表失败: ' + err.message)
    } finally {
      setLoadingModels(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200 mb-6">系统设置</h2>
      
      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-zinc-800/50 text-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          placeholder="输入你的 API Key"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          选择模型
        </label>
        <div className="flex gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 bg-zinc-800/50 text-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <option value="">选择模型</option>
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadAvailableModels}
            disabled={!apiKey || loadingModels}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingModels ? <Loading /> : '获取模型列表'}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!apiKey || !selectedModel}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  )
}
