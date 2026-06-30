import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RequireAuth } from '@/components/RequireAuth'
import Login from './pages/Login'
import Index from './pages/Index'
import MyDemands from './pages/MyDemands'
import TeamDemands from './pages/TeamDemands'
import ChatPage from './pages/Chat'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
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
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
