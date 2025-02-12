import { providerManager } from './providers/manager'

class ApiService {
  constructor() {
    this.selectedModel = null;
  }

  async setApiKey(apiKey) {
    // 为了保持向后兼容，默认使用OpenRouter
    try {
      await providerManager.setProviderConfig('openrouter', { apiKey });
      await providerManager.setActiveProvider('openrouter');
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  }

  setModel(model) {
    this.selectedModel = model;
  }

  async getAvailableModels() {
    try {
      // 尝试获取当前活动的provider
      const provider = providerManager.getActiveProvider();
      return await provider.getAvailableModels();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async sendMessageStream(messages, onChunk) {
    if (!this.selectedModel) {
      throw new Error('Model not set');
    }

    try {
      // 确保消息格式正确
      const formattedMessages = Array.isArray(messages) 
        ? messages 
        : [{ role: 'user', content: messages }];

      await providerManager.sendMessage(formattedMessages, {
        model: this.selectedModel,
        temperature: 0.7,
        maxTokens: 2000
      }, onChunk);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // 新增方法：获取所有可用的Providers
  getAvailableProviders() {
    return providerManager.getProviders();
  }

  // 新增方法：获取Provider的配置表单
  getProviderConfigForm(providerId) {
    return providerManager.getProviderConfigForm(providerId);
  }

  // 新增方法：设置Provider配置
  async setProviderConfig(providerId, config) {
    await providerManager.setProviderConfig(providerId, config);
    await providerManager.setActiveProvider(providerId);
  }

  // 新增方法：切换Provider
  async switchProvider(providerId) {
    await providerManager.setActiveProvider(providerId);
  }
}

export const apiService = new ApiService();
