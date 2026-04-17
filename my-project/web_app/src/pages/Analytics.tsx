import { useMemo } from 'react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { BarChart3, TrendingUp, Users, Globe } from 'lucide-react'
import type { Complaint } from '../types'
import { StatCard } from '../components'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#64748b', '#f43f5e', '#84cc16']

const STATUS_COLORS: Record<string, string> = {
    New: '#fbbf24',
    'In Progress': '#3b82f6',
    Resolved: '#22c55e',
    Escalated: '#ef4444',
    Closed: '#94a3b8',
}

export default function AnalyticsPage({ complaints }: { complaints: Complaint[] }) {
    const total = complaints.length
    const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    const avgPerDistrict = useMemo(() => {
        const districts = new Set(complaints.map(c => c.district).filter(Boolean))
        return districts.size > 0 ? Math.round(total / districts.size) : 0
    }, [complaints, total])

    const forwarded = complaints.filter((c) => c.forwardedTo).length

    const channelData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => { counts[c.channel] = (counts[c.channel] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => { counts[c.category] = (counts[c.category] || 0) + 1 })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const districtData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            if (c.district) counts[c.district] = (counts[c.district] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const blockData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            if (c.block) counts[c.block] = (counts[c.block] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }))
    }, [complaints])

    const departmentData = useMemo(() => {
        const counts: Record<string, number> = {}
        complaints.forEach((c) => {
            if (c.forwardedTo) counts[c.forwardedTo] = (counts[c.forwardedTo] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
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

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        backdropFilter: 'blur(10px)',
    }

    const chartTitle: React.CSSProperties = {
        fontSize: '0.88rem',
        fontWeight: 600,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={22} style={{ color: 'var(--accent-orange)' }} />
                    Analytics & Reports
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    In-depth analysis of grievance data across the state
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <StatCard label="Resolution Rate" value={resolutionRate} tone="success" subtitle="% resolved + closed" icon={<TrendingUp size={20} color="#22c55e" />} />
                <StatCard label="Avg / District" value={avgPerDistrict} tone="info" subtitle="complaints per district" icon={<Globe size={20} color="#60a5fa" />} />
                <StatCard label="Forwarded" value={forwarded} tone="warning" subtitle="to departments" icon={<Users size={20} color="#fbbf24" />} />
                <StatCard label="Total Districts" value={new Set(complaints.map(c => c.district).filter(Boolean)).size} tone="default" subtitle="with active cases" icon={<Globe size={20} color="var(--text-secondary)" />} />
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Status Distribution */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <BarChart3 size={16} color="var(--accent-blue)" /> Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                                {statusData.map((entry) => (
                                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '0.72rem' }}
                                formatter={(value: string) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Channel Breakdown */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <BarChart3 size={16} color="var(--accent-purple)" /> Channel Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                                {channelData.map((_entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '0.72rem' }}
                                formatter={(value: string) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Bar Chart */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <BarChart3 size={16} color="var(--accent-orange)" /> Top Categories
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={categoryData.slice(0, 8)} layout="vertical" barSize={18}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {categoryData.slice(0, 8).map((_entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* District Bar Chart */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <Globe size={16} color="var(--accent-cyan)" /> District-wise Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={districtData} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Block wise */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <BarChart3 size={16} color="var(--accent-green)" /> Block-wise Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={blockData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={45} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Department forwarding */}
                <div style={cardStyle}>
                    <h3 style={chartTitle}>
                        <Users size={16} color="var(--accent-amber)" /> Department Forwarding
                    </h3>
                    {departmentData.length === 0 ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No complaints forwarded yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={departmentData} layout="vertical" barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#fbbf24" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
