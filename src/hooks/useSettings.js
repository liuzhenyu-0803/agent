import { useState, useCallback } from 'react'
import { settingsService } from '../services/settings/settingsService'

export const useSettings = () => {
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const currentSettings = await settingsService.getSettings()
      setSettings(currentSettings)
      setError(null)
    } catch (err) {
      setError('加载设置失败: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (updates) => {
    try {
      setIsLoading(true)
      const newSettings = await settingsService.updateSettings(updates)
      setSettings(newSettings)
      setError(null)
      return true
    } catch (err) {
      setError('更新设置失败: ' + err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    updateSettings
  }
}
