import { OpenRouterProvider } from './openrouter';
import { GuijiProvider } from './guiji';

class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.providerConfigs = new Map();
    
    // 注册内置的providers
    this.registerProvider(new OpenRouterProvider());
    this.registerProvider(new GuijiProvider());
  }

  /**
   * 注册一个新的Provider
   * @param {BaseProvider} provider 
   */
  registerProvider(provider) {
    this.providers.set(provider.id, provider);
  }

  /**
   * 获取所有已注册的Provider
   * @returns {Array<{id: string, name: string}>}
   */
  getProviders() {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.id,
      name: provider.name
    }));
  }

  /**
   * 获取指定Provider的配置表单
   * @param {string} providerId 
   * @returns {Array<Object>}
   */
  getProviderConfigForm(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider.getConfigForm();
  }

  /**
   * 设置Provider的配置
   * @param {string} providerId 
   * @param {Object} config 
   */
  async setProviderConfig(providerId, config) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // 创建新的provider实例并验证配置
    const newProvider = new provider.constructor(config);
    const isValid = await newProvider.validateConfig();
    if (!isValid) {
      throw new Error(`Invalid configuration for provider ${providerId}`);
    }

    // 保存配置
    this.providerConfigs.set(providerId, config);
    this.providers.set(providerId, newProvider);

    // 如果这是当前活动的provider，更新它
    if (this.activeProvider?.id === providerId) {
      this.activeProvider = newProvider;
    }
  }

  /**
   * 设置活动的Provider
   * @param {string} providerId 
   */
  async setActiveProvider(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const config = this.providerConfigs.get(providerId);
    if (!config) {
      throw new Error(`Provider ${providerId} not configured`);
    }

    this.activeProvider = provider;
  }

  /**
   * 获取当前活动的Provider
   * @returns {BaseProvider}
   */
  getActiveProvider() {
    if (!this.activeProvider) {
      throw new Error('No active provider set');
    }
    return this.activeProvider;
  }

  /**
   * 获取Provider的可用模型
   * @param {string} providerId 
   * @returns {Promise<Array>}
   */
  async getProviderModels(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider.getAvailableModels();
  }

  /**
   * 发送消息（使用当前活动的Provider）
   * @param {Array} messages 
   * @param {Object} options 
   * @param {function} onChunk 
   */
  async sendMessage(messages, options, onChunk) {
    if (!this.activeProvider) {
      throw new Error('No active provider set');
    }
    return this.activeProvider.sendMessageStream(messages, options, onChunk);
  }
}

// 导出单例实例
export const providerManager = new ProviderManager();
