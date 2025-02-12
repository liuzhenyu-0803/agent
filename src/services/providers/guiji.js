import { BaseProvider } from './base';
import { APIError, ConfigurationError } from '../errors';

export class GuijiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://api.guiji.ai/v1'; // 假设的API地址，需要根据实际情况修改
  }

  get id() {
    return 'guiji';
  }

  get name() {
    return '硅基流动';
  }

  async validateConfig() {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const models = await this.getAvailableModels();
      return models.length > 0;
    } catch (error) {
      console.error('Failed to validate Guiji config:', error);
      return false;
    }
  }

  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const data = await response.json();
      return data.models.map(model => ({
        id: model.id,
        name: model.name || model.id,
        contextWindow: model.context_length || 4096,
        price: model.price || 0
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessageStream(messages, options = {}, onChunk) {
    try {
      this.validateMessages(messages);
      this.validateOptions(options);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: options.model,
          messages: messages,
          stream: true,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        })
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      if (!response.body) {
        throw new APIError('返回的响应流无效');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || line.trim() === 'data: [DONE]') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (error) {
            console.warn('解析响应数据出错:', error);
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getConfigForm() {
    return [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: '从硅基流动获取的 API Key'
      },
      {
        key: 'region',
        label: '区域',
        type: 'select',
        required: false,
        options: [
          { value: 'cn', label: '中国' },
          { value: 'global', label: '全球' }
        ],
        description: '选择服务区域'
      }
    ];
  }

  handleError(error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      return new APIError('网络请求失败');
    }

    if (error instanceof Error && error.message.includes('Invalid API Key')) {
      return new ConfigurationError('无效的API密钥');
    }

    return error;
  }

  validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new Error('消息必须是一个数组');
    }

    if (messages.length === 0) {
      throw new Error('消息不能为空');
    }
  }

  validateOptions(options) {
    if (!options.model) {
      throw new Error('模型不能为空');
    }

    if (options.temperature < 0 || options.temperature > 1) {
      throw new Error('温度必须在0到1之间');
    }

    if (options.maxTokens <= 0) {
      throw new Error('最大令牌数必须大于0');
    }
  }
}
