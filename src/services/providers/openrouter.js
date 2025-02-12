import { BaseProvider } from './base';
import { APIError, ConfigurationError } from '../errors';

export class OpenRouterProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  get id() {
    return 'openrouter';
  }

  get name() {
    return 'OpenRouter';
  }

  async validateConfig() {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const models = await this.getAvailableModels();
      return models.length > 0;
    } catch (error) {
      console.error('Failed to validate OpenRouter config:', error);
      return false;
    }
  }

  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw this.handleError(response);
      }

      const data = await response.json();
      return (data.data || []).map(model => ({
        id: model.id,
        name: model.name || model.id,
        contextWindow: model.context_length || 4096,
        price: model.pricing?.prompt || 0
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessageStream(messages, options = {}, onChunk) {
    try {
      this.validateMessages(messages);
      this.validateOptions(options);

      if (!this.config.apiKey || !options.model) {
        throw new ConfigurationError('API Key or Model not set');
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

            if (trimmedLine.startsWith('data: ')) {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
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
        description: '从 OpenRouter 获取的 API Key'
      }
    ];
  }

  handleError(error) {
    if (error instanceof Response) {
      const errorText = error.statusText || `HTTP error! status: ${error.status}`;
      return new APIError(errorText);
    } else {
      return error;
    }
  }

  validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new ConfigurationError('Messages must be an array');
    }
  }

  validateOptions(options) {
    if (!options.model) {
      throw new ConfigurationError('Model is required');
    }
  }
}
