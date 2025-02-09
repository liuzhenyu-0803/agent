import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'highlight.js/styles/github-dark.css'

console.log('React starting...')
console.log('Root element:', document.getElementById('root'))

const root = ReactDOM.createRoot(document.getElementById('root'))
console.log('Root created:', root)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('React render called')
