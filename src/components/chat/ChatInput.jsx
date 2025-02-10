import React from 'react'

export const ChatInput = ({ 
  inputMessage, 
  onInputChange, 
  onSendMessage, 
  isLoading,
  error 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim()) {
        onSendMessage()
      }
    }
  }

  return (
    <div className="border-t border-zinc-800 p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <textarea
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1 bg-zinc-800/50 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
          rows="1"
        />
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
