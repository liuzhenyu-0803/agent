import React from 'react'
import { MessageContent } from '../shared/MessageContent'

export const ChatMessage = ({ message }) => {
  return (
    <div
      className={`mb-4 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-zinc-700/90 text-gray-100'
            : 'bg-zinc-800/50 text-gray-200'
        }`}
      >
        <MessageContent content={message.content} />
      </div>
    </div>
  )
}
