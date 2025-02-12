import { OpenRouterProvider } from './openrouter';
import { GuijiProvider } from './guiji';
import { ConfigurationError, ProviderError } from '../errors';

class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    
    // 注册内置的providers
    this.registerProvider(new OpenRouterProvider());
    this.registerProvider(new GuijiProvider());
  }

  /**
   * 注册一个新的Provider
   * @param {BaseProvider} provider 
   */
  registerProvider(provider) {
    if (!provider.id || !provider.name) {
      throw new ConfigurationError('Provider必须实现id和name属性');
    }
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
      throw new ProviderError(`Provider不存在: ${providerId}`);
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
      throw new ProviderError(`Provider不存在: ${providerId}`);
    }

    // 创建新的provider实例并验证配置
    const newProvider = new provider.constructor(config);
    await newProvider.validateConfig();

    // 配置验证成功后，更新Provider
    this.providers.set(providerId, newProvider);

    // 如果这是唯一的Provider或者当前没有活动的Provider，将其设置为活动Provider
    if (!this.activeProvider || this.providers.size === 1) {
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
      throw new ProviderError(`Provider不存在: ${providerId}`);
    }
    this.activeProvider = provider;
  }

  /**
   * 获取当前活动的Provider
   * @returns {BaseProvider}
   */
  getActiveProvider() {
    if (!this.activeProvider) {
      throw new ProviderError('没有活动的Provider');
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
      throw new ProviderError(`Provider不存在: ${providerId}`);
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
      throw new ProviderError('没有活动的Provider');
    }
    return this.activeProvider.sendMessageStream(messages, options, onChunk);
  }
}

// 导出单例实例
export const providerManager = new ProviderManager();
