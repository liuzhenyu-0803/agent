import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

const MessageContent = ({ content }) => {
  return (
    <div className="prose prose-sm dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkParse, remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义链接渲染
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
            />
          ),
          // 自定义代码块渲染
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (!inline && language) {
              return (
                <div className="relative group">
                  <div className="absolute right-2 top-2 hidden group-hover:block">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(children)
                      }}
                      className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className={className} {...props}>
                    <code className={language ? `language-${language}` : ''}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MessageContent
