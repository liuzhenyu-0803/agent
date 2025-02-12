import React from 'react'

export const DialogList = ({ 
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
                      if (window.confirm('确定要删除这个对话吗？')) {
                        onDeleteChat(chat.id)
                      }
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-zinc-700/80"
                    title="删除对话"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
