import { useMemo } from 'react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area,
} from 'recharts'
import {
    FileText, AlertTriangle, Clock, CheckCircle, TrendingUp,
    Shield, BarChart3, Activity,
} from 'lucide-react'
import type { Complaint } from '../types'
import { StatCard, StatusPill, PriorityPill, timeAgo } from '../components'

const STATUS_COLORS: Record<string, string> = {
    New: '#fbbf24',
    'In Progress': '#3b82f6',
    Resolved: '#22c55e',
    Escalated: '#ef4444',
    Closed: '#94a3b8',
}

const PRIORITY_COLORS: Record<string, string> = {
    High: '#ef4444',
    Medium: '#f97316',
    Low: '#94a3b8',
}

export default function DashboardPage({ complaints }: { complaints: Complaint[] }) {
    const total = complaints.length
    const newCount = complaints.filter((c) => c.status === 'New').length
    const inProgress = complaints.filter((c) => c.status === 'In Progress').length
    const resolved = complaints.filter((c) => c.status === 'Resolved').length
    const escalated = complaints.filter((c) => c.status === 'Escalated').length
    const highPriority = complaints.filter((c) => c.priority === 'High').length

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            counts[c.status] = (counts[c.status] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const priorityData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            counts[c.priority] = (counts[c.priority] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            counts[c.category] = (counts[c.category] || 0) + 1
        })
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }))
    }, [complaints])

    const districtData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            if (c.district) counts[c.district] = (counts[c.district] || 0) + 1
        })
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }))
    }, [complaints])

    // Weekly trend (mock with creation dates)
    const weeklyTrend = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return days.map((day, i) => ({
            name: day,
            complaints: complaints.filter((c) => {
                try { return new Date(c.submittedAt).getDay() === (i + 1) % 7 } catch { return false }
            }).length,
        }))
    }, [complaints])

    const recentComplaints = useMemo(() => {
        return [...complaints]
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 5)
    }, [complaints])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{label || payload[0].name}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{payload[0].value} complaints</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={22} style={{ color: 'var(--accent-orange)' }} />
                    Dashboard Overview
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    Real-time snapshot of registered grievances across the state
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
            }}>
                <StatCard label="Total Complaints" value={total} tone="default"
                    icon={<FileText size={20} color="var(--text-secondary)" />} subtitle="All registered" />
                <StatCard label="New" value={newCount} tone="warning"
                    icon={<AlertTriangle size={20} color="#fbbf24" />} subtitle="Pending review" />
                <StatCard label="In Progress" value={inProgress} tone="info"
                    icon={<Clock size={20} color="#60a5fa" />} subtitle="Being processed" />
                <StatCard label="Resolved" value={resolved} tone="success"
                    icon={<CheckCircle size={20} color="#4ade80" />} subtitle={`${resolutionRate}% resolution`} />
                <StatCard label="Escalated" value={escalated} tone="danger"
                    icon={<Shield size={20} color="#f87171" />} subtitle="Needs attention" />
                <StatCard label="High Priority" value={highPriority} tone="danger"
                    icon={<TrendingUp size={20} color="#f87171" />} subtitle="Urgent cases" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Status Distribution */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BarChart3 size={16} color="var(--accent-blue)" /> Status Distribution
                    </h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                    outerRadius={70} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                                    {statusData.map((entry) => (
                                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No data yet
                        </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {statusData.map((s) => (
                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.name] || '#64748b' }} />
                                {s.name} ({s.value})
                            </div>
                        ))}
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TrendingUp size={16} color="var(--accent-orange)" /> Priority Breakdown
                    </h3>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={priorityData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {priorityData.map((entry) => (
                                        <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No data yet
                        </div>
                    )}
                </div>

                {/* Weekly Trend */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Activity size={16} color="var(--accent-green)" /> Weekly Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={weeklyTrend}>
                            <defs>
                                <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2}
                                fill="url(#colorComplaints)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row: Categories + Districts + Recent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1rem' }}>
                {/* Category Wise */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Top Categories
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {categoryData.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data yet</p>
                        )}
                        {categoryData.map((cat, i) => {
                            const pct = total > 0 ? (cat.value / total) * 100 : 0
                            const colors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#64748b']
                            return (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{cat.value}</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: colors[i % colors.length],
                                            borderRadius: 2,
                                            transition: 'width 1s ease-out',
                                        }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* District Wise */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Top Districts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {districtData.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data yet</p>
                        )}
                        {districtData.map((d, i) => {
                            const pct = total > 0 ? (d.value / total) * 100 : 0
                            const colors = ['#06b6d4', '#a855f7', '#f97316', '#22c55e', '#3b82f6', '#eab308']
                            return (
                                <div key={d.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{d.value}</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: colors[i % colors.length],
                                            borderRadius: 2,
                                            transition: 'width 1s ease-out',
                                        }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Complaints */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Recent Complaints
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {recentComplaints.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No complaints yet</p>
                        )}
                        {recentComplaints.map((c) => (
                            <div key={c.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-subtle)',
                                transition: 'background 0.2s',
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.category}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {c.village}, {c.district} · {timeAgo(c.submittedAt)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                                    <PriorityPill priority={c.priority} />
                                    <StatusPill status={c.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
