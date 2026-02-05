"use client"

import type React from "react"
import { Suspense, lazy } from "react"

import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { SidebarProvider } from "@/contexts/SidebarContext"
import MainLayout from "@/components/layout/MainLayout"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

// Lazy load all heavy pages
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Leads = lazy(() => import("./pages/Leads"))
const Pipeline = lazy(() => import("./pages/Pipeline"))
const Customers = lazy(() => import("./pages/Customers"))
const Reports = lazy(() => import("./pages/Reports"))
const Callers = lazy(() => import("./pages/Callers"))
const Brokers = lazy(() => import("./pages/Brokers"))
const Settings = lazy(() => import("./pages/Settings"))
const Meetings = lazy(() => import("./pages/Meetings"))
const FollowUps = lazy(() => import("./pages/FollowUps"))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin-only route wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/leads" element={<Suspense fallback={<PageLoader />}><Leads /></Suspense>} />
        <Route path="/pipeline" element={<Suspense fallback={<PageLoader />}><Pipeline /></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
        <Route path="/meetings" element={<Suspense fallback={<PageLoader />}><Meetings /></Suspense>} />
        <Route path="/follow-ups" element={<Suspense fallback={<PageLoader />}><FollowUps /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route
          path="/callers"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Callers />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/brokers"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Brokers />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <AppRoutes />
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
