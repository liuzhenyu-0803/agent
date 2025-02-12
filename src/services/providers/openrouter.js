import { BaseProvider } from './base';

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
    if (!this.config.apiKey) {
      throw new Error('API Key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return (data.data || []).map(model => ({
        id: model.id,
        name: model.name || model.id,
        contextWindow: model.context_length || 4096,
        price: model.pricing?.prompt || 0
      }));
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async sendMessageStream(messages, options = {}, onChunk) {
    if (!this.config.apiKey || !options.model) {
      throw new Error('API Key or Model not set');
    }

    try {
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
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
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
      console.error('Error sending message:', error);
      throw error;
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
}
