import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Home from './pages/Home.tsx'
import CreateQuiz from './pages/CreateQuiz.tsx'
import Quiz from './pages/Quiz.tsx'



const router = createBrowserRouter([
  {
  path: '/',
  element: <Home />,
}, {
  path: '/create-quiz',
  element: <CreateQuiz />
},
{
  path: '/take-quiz/:roomCode',
  element: <Quiz />
},])


createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <RouterProvider router={router} />
  </StrictMode>,
)
