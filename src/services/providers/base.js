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
    throw new Error('Provider must implement id getter');
  }

  /**
   * 获取Provider的显示名称
   * @returns {string}
   */
  get name() {
    throw new Error('Provider must implement name getter');
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
    throw new Error('Provider must implement getAvailableModels');
  }

  /**
   * 验证配置是否有效
   * @returns {Promise<boolean>}
   */
  async validateConfig() {
    throw new Error('Provider must implement validateConfig');
  }

  /**
   * 发送消息并获取流式响应
   * @param {Array<{role: string, content: string}>} messages - 消息历史
   * @param {Object} options - 其他选项（如temperature等）
   * @param {function} onChunk - 处理响应数据块的回调函数
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages, options, onChunk) {
    throw new Error('Provider must implement sendMessageStream');
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
    throw new Error('Provider must implement getConfigForm');
  }
}
