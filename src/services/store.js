// 创建一个随机ID的函数
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 初始化默认值
if (!window.electronAPI.store.get('chats')) {
    window.electronAPI.store.set('chats', []);
}
if (!window.electronAPI.store.get('settings')) {
    window.electronAPI.store.set('settings', {
        dataPath: null,
        apiProvider: 'openrouter',
        apiKey: '',
        apiEndpoint: ''
    });
}

// 会话管理
const chatService = {
    // 获取所有会话
    getAllChats() {
        return window.electronAPI.store.get('chats') || [];
    },

    // 创建新会话
    createChat(title = '新的会话') {
        const chats = this.getAllChats();
        const newChat = {
            id: generateId(),
            title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        window.electronAPI.store.set('chats', [newChat, ...chats]);
        return newChat;
    },

    // 获取单个会话
    getChat(chatId) {
        const chats = this.getAllChats();
        return chats.find(chat => chat.id === chatId);
    },

    // 更新会话
    updateChat(chatId, updates) {
        const chats = this.getAllChats();
        const index = chats.findIndex(chat => chat.id === chatId);
        
        if (index !== -1) {
            chats[index] = {
                ...chats[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            window.electronAPI.store.set('chats', chats);
            return chats[index];
        }
        return null;
    },

    // 删除会话
    deleteChat(chatId) {
        const chats = this.getAllChats();
        const filteredChats = chats.filter(chat => chat.id !== chatId);
        window.electronAPI.store.set('chats', filteredChats);
    },

    // 添加消息到会话
    addMessage(chatId, message) {
        const chats = this.getAllChats();
        const index = chats.findIndex(chat => chat.id === chatId);
        
        if (index !== -1) {
            const chat = chats[index];
            chat.messages.push({
                id: generateId(),
                ...message,
                timestamp: new Date().toISOString()
            });
            chat.updatedAt = new Date().toISOString();
            window.electronAPI.store.set('chats', chats);
            return chat.messages[chat.messages.length - 1];
        }
        return null;
    }
};

// 设置管理
const settingsService = {
    // 获取所有设置
    getSettings() {
        return window.electronAPI.store.get('settings');
    },

    // 更新设置
    updateSettings(updates) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updates };
        window.electronAPI.store.set('settings', newSettings);
        return newSettings;
    }
};

export {
    chatService,
    settingsService
};
