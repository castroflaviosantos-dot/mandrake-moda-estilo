import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

function Root() {
  try {
    return <App />
  } catch (error) {
    console.error(error)
    return null
  }
}

const container = document.getElementById('root')

if (!container) {
  document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Não foi possível iniciar a loja.</p>'
} else {
  createRoot(container).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
}

window.addEventListener('error', (event) => {
  console.error('[mandrake] erro na aplicação', event.error ?? event.message)
})
