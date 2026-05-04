import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.92)',
            color: '#111c2d',
            border: '1px solid rgba(199, 196, 215, 0.5)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
