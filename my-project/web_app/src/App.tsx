import { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import {
  LayoutDashboard, FileText, BarChart3, Settings,
  Wifi, WifiOff, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { Complaint } from './types'
import { API_BASE_URL, fetchComplaints } from './api'
import DashboardPage from './pages/Dashboard'
import ComplaintsPage from './pages/Complaints'
import AnalyticsPage from './pages/Analytics'
import SettingsPage from './pages/Settings'
import './App.css'

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load complaints
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await fetchComplaints()
        if (!cancelled) {
          setComplaints(data)
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // WebSocket
  useEffect(() => {
    const socket: Socket = io(API_BASE_URL)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('complaint:created', (complaint: Complaint) => {
      setComplaints((prev) => [complaint, ...prev])
    })
    socket.on('complaint:updated', (complaint: Complaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? complaint : c)),
      )
    })
    socket.on('complaint:deleted', (payload: any) => {
      const deletedId = typeof payload === 'string' ? payload : payload?.id
      if (!deletedId) return
      setComplaints((prev) => prev.filter((c) => c.id !== deletedId))
    })
    socket.on('complaint:cleared', () => {
      setComplaints([])
    })

    return () => { socket.disconnect() }
  }, [])

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/complaints', icon: <FileText size={18} />, label: 'Complaints' },
    { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Configuration' },
  ]

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-text">RW</span>
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-brand">
              <div className="brand-name">Rural Women</div>
              <div className="brand-sub">Grievance Portal</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-footer">
          {/* Connection Status */}
          <div className="connection-status">
            {connected ? (
              <>
                <Wifi size={14} color="#22c55e" />
                {!sidebarCollapsed && <span className="status-text status-online">Live</span>}
              </>
            ) : (
              <>
                <WifiOff size={14} color="#ef4444" />
                {!sidebarCollapsed && <span className="status-text status-offline">Offline</span>}
              </>
            )}
          </div>

          {/* Collapse button */}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'main-expanded' : ''}`}>
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Loading grievance data...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage complaints={complaints} />} />
            <Route path="/complaints" element={<ComplaintsPage complaints={complaints} setComplaints={setComplaints} />} />
            <Route path="/analytics" element={<AnalyticsPage complaints={complaints} />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
