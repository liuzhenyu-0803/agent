import React from 'react'

/**
 * 响应等待指示器组件
 * 显示三个动画点，表示正在等待AI响应
 */
export const ResponseIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
    </div>
  )
}
