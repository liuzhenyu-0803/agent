import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { errorHandler } from '../services/errors';

function Settings({ onClose }) {
  // 状态管理
  const [selectedProvider, setSelectedProvider] = useState('')
  const [providerConfig, setProviderConfig] = useState({})
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState([])
  const [configForm, setConfigForm] = useState([])

  // 加载Provider列表
  useEffect(() => {
    try {
      const availableProviders = apiService.getAvailableProviders()
      setProviders(availableProviders)
      if (availableProviders.length > 0) {
        setSelectedProvider(availableProviders[0].id)
      }
    } catch (error) {
      setError(errorHandler.getUserFriendlyMessage(error))
    }
  }, [])

  // 加载已保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.store.get('settings')
        if (settings?.provider) {
          setSelectedProvider(settings.provider)
          setProviderConfig(settings.providerConfig || {})
          
          // 加载Provider的配置表单
          const form = apiService.getProviderConfigForm(settings.provider)
          setConfigForm(form)

          // 设置Provider配置
          await apiService.setProviderConfig(settings.provider, settings.providerConfig)
          
          // 加载模型列表
          await loadModels()
          
          if (settings?.selectedModel) {
            setSelectedModel(settings.selectedModel)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        setError('加载设置时出错: ' + error.message)
      }
    }
    loadSettings()
  }, [])

  // 加载Provider配置表单
  useEffect(() => {
    if (!selectedProvider) return;

    try {
      const form = apiService.getProviderConfigForm(selectedProvider)
      setConfigForm(form)
      // 重置配置值
      setProviderConfig({})
      setModels([])
      setSelectedModel('')
    } catch (error) {
      setError(errorHandler.getUserFriendlyMessage(error))
    }
  }, [selectedProvider])

  // 加载模型列表
  const loadModels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const availableModels = await apiService.getAvailableModels()
      console.log('Available models:', availableModels)
      setModels(availableModels)
    } catch (error) {
      console.error('Error loading models:', error)
      setError('加载模型列表失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理配置值变更
  const handleConfigChange = (key, value) => {
    setProviderConfig(prev => ({
      ...prev,
      [key]: value
    }))
    setError('')
  };

  // 处理Provider切换
  const handleProviderChange = (event) => {
    setSelectedProvider(event.target.value)
    setError('')
  };

  // 处理模型选择
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value)
    setError('')
  };

  // 验证配置并加载模型列表
  const handleValidateConfig = async () => {
    setIsLoading(true)
    setError('')
    try {
      await apiService.setProviderConfig(selectedProvider, providerConfig)
      await loadModels()
    } catch (error) {
      setError(errorHandler.getUserFriendlyMessage(error))
    } finally {
      setIsLoading(false)
    }
  };

  // 保存设置
  const handleSave = async () => {
    if (!selectedModel) {
      setError('请选择一个模型')
      return
    }

    try {
      const settings = {
        provider: selectedProvider,
        providerConfig,
        selectedModel
      }
      console.log('Saving settings:', settings)
      await window.electronAPI.store.set('settings', settings)
      
      // 设置Provider配置
      await apiService.setProviderConfig(selectedProvider, providerConfig)
      apiService.setModel(selectedModel)
      
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('保存设置时出错: ' + error.message)
    }
  }

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
        {/* Provider 选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            选择服务提供商
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
          >
            <option value="">选择服务提供商</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {/* Provider 配置表单 */}
        {selectedProvider && configForm.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={providerConfig[field.key] || ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
              >
                <option value="">请选择</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={providerConfig[field.key] || ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200"
                placeholder={field.description}
              />
            )}
            {field.description && (
              <p className="mt-1 text-sm text-gray-400">{field.description}</p>
            )}
          </div>
        ))}

        {/* 验证配置按钮 */}
        {selectedProvider && (
          <div>
            <button
              onClick={handleValidateConfig}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  验证中...
                </>
              ) : (
                '验证配置'
              )}
            </button>
          </div>
        )}

        {/* 模型选择 */}
        {models.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              选择模型
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-zinc-800/50 text-gray-200 border border-zinc-700 rounded-xl px-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
            >
              <option value="">选择模型</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            disabled={isLoading || !selectedProvider || !selectedModel}
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
