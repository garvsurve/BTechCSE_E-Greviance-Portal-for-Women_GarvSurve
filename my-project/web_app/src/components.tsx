import type { ComplaintStatus, ComplaintPriority } from './types'

/* ====== Status Pill ====== */
const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    new: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' },
    'in-progress': { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    resolved: { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
    escalated: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    closed: { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
}

export function StatusPill({ status }: { status: ComplaintStatus }) {
    const key = status.toLowerCase().replace(/\s+/g, '-')
    const s = statusColors[key] || statusColors['new']
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
                letterSpacing: '0.02em',
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: s.color,
                    flexShrink: 0,
                }}
            />
            {status}
        </span>
    )
}

/* ====== Priority Pill ====== */
const priorityColors: Record<string, { bg: string; color: string; border: string }> = {
    high: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    medium: { bg: 'rgba(249, 115, 22, 0.12)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
    low: { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
}

export function PriorityPill({ priority }: { priority: ComplaintPriority }) {
    const s = priorityColors[priority.toLowerCase()] || priorityColors['medium']
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
                letterSpacing: '0.02em',
            }}
        >
            {priority}
        </span>
    )
}

/* ====== Stat Card ====== */
type StatTone = 'default' | 'success' | 'warning' | 'info' | 'danger'

const toneConfig: Record<StatTone, { gradient: string; iconBg: string; glow: string }> = {
    default: {
        gradient: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))',
        iconBg: 'rgba(148, 163, 184, 0.15)',
        glow: 'rgba(148, 163, 184, 0.1)',
    },
    warning: {
        gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.03))',
        iconBg: 'rgba(251, 191, 36, 0.15)',
        glow: 'rgba(251, 191, 36, 0.1)',
    },
    info: {
        gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.03))',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        glow: 'rgba(59, 130, 246, 0.1)',
    },
    success: {
        gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.03))',
        iconBg: 'rgba(34, 197, 94, 0.15)',
        glow: 'rgba(34, 197, 94, 0.1)',
    },
    danger: {
        gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.03))',
        iconBg: 'rgba(239, 68, 68, 0.15)',
        glow: 'rgba(239, 68, 68, 0.1)',
    },
}

export function StatCard({
    label,
    value,
    tone = 'default',
    icon,
    subtitle,
}: {
    label: string
    value: number
    tone?: StatTone
    icon?: React.ReactNode
    subtitle?: string
}) {
    const t = toneConfig[tone]
    return (
        <div
            className="stat-card"
            style={{
                background: t.gradient,
                border: `1px solid var(--border-subtle)`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.1rem 1.25rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'default',
                backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${t.glow}`
                e.currentTarget.style.borderColor = 'var(--border-strong)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, animation: 'countUp 0.6s ease-out' }}>
                        {value}
                    </div>
                    {subtitle && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            {subtitle}
                        </div>
                    )}
                </div>
                {icon && (
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            background: t.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ====== Empty State ====== */
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem',
            color: 'var(--text-muted)',
            gap: '0.75rem',
        }}>
            {icon && <div style={{ opacity: 0.4, fontSize: '2rem' }}>{icon}</div>}
            <p style={{ fontSize: '0.9rem' }}>{message}</p>
        </div>
    )
}

/* ====== Time formatter ====== */
export function formatDate(dateStr: string) {
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return dateStr
    }
}

export function formatDateTime(dateStr: string) {
    try {
        const d = new Date(dateStr)
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return dateStr
    }
}

export function timeAgo(dateStr: string) {
    try {
        const now = Date.now()
        const then = new Date(dateStr).getTime()
        const diff = now - then
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d ago`
        return formatDate(dateStr)
    } catch {
        return dateStr
    }
}
