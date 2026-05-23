import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { UserRoleProvider, useUserRole } from './context/UserRoleContext'
import { HelpRequestProvider } from './context/HelpRequestContext'
import { TeamStoreProvider } from './context/TeamStoreContext'
import Home from './pages/Home'
import TaskCenter from './pages/TaskCenter'
import Workspace from './pages/Workspace'
import AiAssistant from './pages/AiAssistant'
import Reports from './pages/Reports'
import MyReports from './pages/MyReports'
import TeamAnalysis from './pages/TeamAnalysis'
import EmployeeManagement from './pages/EmployeeManagement'
import HelpRequestManagement from './pages/HelpRequestManagement'
import FeishuIntegration from './pages/FeishuIntegration'
import FeishuMapping from './pages/FeishuMapping'
import FeishuSync from './pages/FeishuSync'
import Settings from './pages/Settings'
import PerformanceFeedback from './pages/PerformanceFeedback'
import Login from './pages/Login'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useUserRole()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function ThemedToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      position="top-right"
      closeButton
      theme={theme}
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
}

function AppRoutes() {
  const { isEmployee, isAuthenticated } = useUserRole()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/tasks" element={<RequireAuth><TaskCenter /></RequireAuth>} />
      <Route path="/workspace" element={<RequireAuth><Workspace /></RequireAuth>} />
      <Route path="/employees" element={<RequireAuth><EmployeeManagement /></RequireAuth>} />
      <Route path="/help-requests" element={<RequireAuth><HelpRequestManagement /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/my-reports" element={<RequireAuth><MyReports /></RequireAuth>} />
      <Route
        path="/ai-assistant"
        element={<RequireAuth>{isEmployee ? <Navigate to="/workspace" replace /> : <AiAssistant />}</RequireAuth>}
      />
      <Route
        path="/team-analysis"
        element={<RequireAuth>{isEmployee ? <Navigate to="/workspace" replace /> : <TeamAnalysis />}</RequireAuth>}
      />
      <Route path="/feishu" element={<RequireAuth><FeishuIntegration /></RequireAuth>} />
      <Route path="/feishu-mapping" element={<RequireAuth><FeishuMapping /></RequireAuth>} />
      <Route path="/feishu-sync" element={<RequireAuth><FeishuSync /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/performance" element={<RequireAuth><PerformanceFeedback /></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <UserRoleProvider>
          <TeamStoreProvider>
            <HelpRequestProvider>
              <ThemedToaster />
              <AppRoutes />
            </HelpRequestProvider>
          </TeamStoreProvider>
          </UserRoleProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}