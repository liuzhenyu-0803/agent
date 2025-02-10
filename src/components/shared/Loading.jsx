import React from 'react'

export const Loading = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
    </div>
  )
}
