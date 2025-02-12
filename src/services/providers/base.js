import { 
  ConfigurationError, 
  APIError, 
  ModelError, 
  errorHandler 
} from '../errors';

/**
 * API Provider的基础接口类
 * 所有的Provider实现都需要继承这个类
 */
export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * 获取Provider的唯一标识
   * @returns {string}
   */
  get id() {
    throw new ConfigurationError('Provider must implement id getter');
  }

  /**
   * 获取Provider的显示名称
   * @returns {string}
   */
  get name() {
    throw new ConfigurationError('Provider must implement name getter');
  }

  /**
   * 初始化Provider
   * @returns {Promise<void>}
   */
  async initialize() {
    // 默认实现为空
  }

  /**
   * 获取可用的模型列表
   * @returns {Promise<Array<{id: string, name: string, contextWindow: number, price: number}>>}
   */
  async getAvailableModels() {
    throw new ConfigurationError('Provider must implement getAvailableModels');
  }

  /**
   * 验证配置是否有效
   * @returns {Promise<boolean>}
   */
  async validateConfig() {
    try {
      if (!this.config) {
        throw new ConfigurationError('配置信息不能为空');
      }

      // 验证必需的配置字段
      const form = this.getConfigForm();
      for (const field of form) {
        if (field.required && !this.config[field.key]) {
          throw new ConfigurationError(
            `缺少必需的配置项: ${field.label}`,
            { field: field.key }
          );
        }
      }

      // 尝试获取模型列表来验证配置
      const models = await this.getAvailableModels();
      if (!Array.isArray(models) || models.length === 0) {
        throw new APIError('无法获取可用模型列表');
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new ConfigurationError('配置验证失败', error);
    }
  }

  /**
   * 发送消息并获取流式响应
   * @param {Array<{role: string, content: string}>} messages - 消息历史
   * @param {Object} options - 其他选项（如temperature等）
   * @param {function} onChunk - 处理响应数据块的回调函数
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages, options, onChunk) {
    throw new ConfigurationError('Provider must implement sendMessageStream');
  }

  /**
   * 获取默认配置表单定义
   * @returns {Array<{
   *   key: string,
   *   label: string,
   *   type: 'text'|'password'|'select',
   *   required: boolean,
   *   options?: Array<{value: string, label: string}>,
   *   description?: string
   * }>}
   */
  getConfigForm() {
    throw new ConfigurationError('Provider must implement getConfigForm');
  }

  /**
   * 处理API错误
   * @protected
   * @param {Error} error - 原始错误
   * @returns {Error} - 处理后的错误
   */
  protected handleError(error) {
    return errorHandler.handleAPIError(error, this.name);
  }

  /**
   * 验证消息格式
   * @protected
   * @param {Array<{role: string, content: string}>} messages 
   */
  protected validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new ModelError('消息必须是数组格式');
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new ModelError('消息格式无效，必须包含 role 和 content');
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new ModelError(`无效的消息角色: ${msg.role}`);
      }
    }
  }

  /**
   * 验证选项
   * @protected
   * @param {Object} options 
   */
  protected validateOptions(options) {
    if (!options.model) {
      throw new ModelError('未指定模型');
    }

    if (options.temperature && (
      options.temperature < 0 || 
      options.temperature > 2
    )) {
      throw new ModelError('temperature 必须在 0-2 之间');
    }

    if (options.maxTokens && (
      options.maxTokens < 1 || 
      options.maxTokens > 32000
    )) {
      throw new ModelError('maxTokens 必须在 1-32000 之间');
    }
  }
}
