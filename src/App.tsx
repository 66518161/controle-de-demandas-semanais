import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from '@/hooks/use-theme'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RequireAuth } from '@/components/RequireAuth'
import { useAppStore } from '@/stores/use-app-store'
import Login from './pages/Login'
import Index from './pages/Index'
import MyDemands from './pages/MyDemands'
import TeamDemands from './pages/TeamDemands'
import ChatPage from './pages/Chat'

import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => {
  useTheme()
  const fetchData = useAppStore((state) => state.fetchData)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/demands" element={<MyDemands />} />
            <Route path="/team" element={<TeamDemands />} />
            <Route path="/chat" element={<ChatPage />} />

            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
