// 基础错误类
export class AgentError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// 配置相关错误
export class ConfigurationError extends AgentError {
  constructor(message, details = null) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

// API相关错误
export class APIError extends AgentError {
  constructor(message, details = null) {
    super(message, 'API_ERROR', details);
  }
}

// 网络相关错误
export class NetworkError extends AgentError {
  constructor(message, details = null) {
    super(message, 'NETWORK_ERROR', details);
  }
}

// 认证相关错误
export class AuthenticationError extends AgentError {
  constructor(message, details = null) {
    super(message, 'AUTHENTICATION_ERROR', details);
  }
}

// 模型相关错误
export class ModelError extends AgentError {
  constructor(message, details = null) {
    super(message, 'MODEL_ERROR', details);
  }
}

// Provider相关错误
export class ProviderError extends AgentError {
  constructor(message, details = null) {
    super(message, 'PROVIDER_ERROR', details);
  }
}

// 错误处理工具函数
export const errorHandler = {
  // 处理API请求错误
  handleAPIError(error, providerName = '') {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('网络连接失败，请检查网络连接');
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return new AuthenticationError(
          `${providerName}认证失败，请检查API密钥是否正确`
        );
      }
      if (status === 429) {
        return new APIError('请求过于频繁，请稍后再试');
      }
      return new APIError(
        `API请求失败 (${status}): ${error.response.statusText}`
      );
    }

    return new AgentError('未知错误', 'UNKNOWN_ERROR', error);
  },

  // 处理Provider配置错误
  handleConfigError(error, providerName = '') {
    if (error.message.includes('API Key')) {
      return new ConfigurationError(
        `${providerName}的API密钥无效或未设置`
      );
    }
    if (error.message.includes('model')) {
      return new ModelError('未选择模型或模型配置无效');
    }
    return new ConfigurationError(
      `${providerName}配置错误: ${error.message}`
    );
  },

  // 处理消息发送错误
  handleMessageError(error) {
    if (error.message.includes('context length')) {
      return new ModelError('消息长度超出模型上下文窗口限制');
    }
    if (error.message.includes('rate limit')) {
      return new APIError('已达到速率限制，请稍后再试');
    }
    return new AgentError('消息处理错误', 'MESSAGE_ERROR', error);
  },

  // 获取用户友好的错误信息
  getUserFriendlyMessage(error) {
    const baseMessage = error.message;
    const details = error.details ? `\n详细信息：${error.details}` : '';
    const suggestion = this.getSuggestion(error);
    return `${baseMessage}${details}${suggestion}`;
  },

  // 根据错误类型提供建议
  getSuggestion(error) {
    const suggestions = {
      NETWORK_ERROR: '\n建议：请检查网络连接是否正常',
      AUTHENTICATION_ERROR: '\n建议：请检查API密钥是否正确',
      CONFIGURATION_ERROR: '\n建议：请检查配置信息是否完整且正确',
      API_ERROR: '\n建议：如果问题持续，请联系服务提供商支持',
      MODEL_ERROR: '\n建议：请尝试选择其他模型或减少消息长度',
      PROVIDER_ERROR: '\n建议：请尝试切换其他服务提供商'
    };
    return suggestions[error.code] || '';
  }
};
