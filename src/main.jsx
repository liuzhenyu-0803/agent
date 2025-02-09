import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

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
