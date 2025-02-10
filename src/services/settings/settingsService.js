class SettingsService {
  constructor() {
    // 初始化默认值
    if (!window.electronAPI.store.get('settings')) {
      window.electronAPI.store.set('settings', {
        dataPath: null,
        apiProvider: 'openrouter',
        apiKey: '',
        apiEndpoint: '',
        selectedModel: null
      })
    }
  }

  // 获取所有设置
  async getSettings() {
    return window.electronAPI.store.get('settings')
  }

  // 更新设置
  async updateSettings(updates) {
    const currentSettings = await this.getSettings()
    const newSettings = { ...currentSettings, ...updates }
    await window.electronAPI.store.set('settings', newSettings)
    return newSettings
  }
}

export const settingsService = new SettingsService()
