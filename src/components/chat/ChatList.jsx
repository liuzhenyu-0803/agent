import React from 'react'

export const ChatList = ({ 
  chats, 
  selectedChat, 
  onSelectChat, 
  onDeleteChat, 
  onNewChat, 
  onClearAllChats 
}) => {
  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedChat?.id === chat.id
                ? 'bg-zinc-700/90 text-gray-100'
                : 'text-gray-300 hover:bg-zinc-800/50'
            }`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-400 truncate">
                  {chat.messages[0]?.content || '新的对话'}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="text-xs text-gray-500 tabular-nums">
                  {new Date(chat.messages[0]?.timestamp || Date.now()).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })}
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('确定要删除这个会话吗？')) {
                        onDeleteChat(chat.id)
                      }
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-zinc-700/80"
                    title="删除会话"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 底部按钮 */}
      <div className="p-4 border-t border-zinc-800 space-y-2.5">
        <button
          onClick={onNewChat}
          className="w-full bg-gradient-to-br from-blue-600/90 to-blue-700/90 hover:from-blue-500 hover:to-blue-600 text-gray-100 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新建会话
        </button>
        <button
          onClick={() => {
            if (window.confirm('确定要清空所有会话吗？')) {
              onClearAllChats()
            }
          }}
          className="w-full bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-500/90 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          清空会话
        </button>
      </div>
    </div>
  )
}
