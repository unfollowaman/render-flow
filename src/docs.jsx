import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import './styles/print.css'
import DocsApp from './DocsApp'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DocsApp />
  </StrictMode>
)
