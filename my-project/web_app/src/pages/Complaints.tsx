import { useMemo, useState } from 'react'
import {
    Search, Filter, Download, X, Trash2,
    ChevronDown, MapPin, User, Phone, Calendar,
    Send, FileText, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type {
    Complaint, ComplaintStatus, ComplaintPriority,
} from '../types'
import {
    VIBHAG_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS,
} from '../types'
import { patchComplaint, deleteComplaint, exportToCSV } from '../api'
import { StatusPill, PriorityPill, formatDate, formatDateTime } from '../components'

export default function ComplaintsPage({
    complaints,
    setComplaints,
}: {
    complaints: Complaint[]
    setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>
}) {
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('All')
    const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'All'>('All')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Complaint | null>(null)
    const [editingStatus, setEditingStatus] = useState(false)
    const [editingPriority, setEditingPriority] = useState(false)

    const filteredComplaints = useMemo(() => {
        return complaints.filter((c) => {
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter
            const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter
            const needle = search.trim().toLowerCase()
            const matchesSearch =
                needle.length === 0 ||
                c.id.toLowerCase().includes(needle) ||
                c.village.toLowerCase().includes(needle) ||
                c.category.toLowerCase().includes(needle) ||
                c.district.toLowerCase().includes(needle) ||
                (c.block && c.block.toLowerCase().includes(needle))
            return matchesStatus && matchesSearch && matchesPriority
        })
    }, [complaints, statusFilter, search, priorityFilter])

    async function handleStatusChange(complaint: Complaint, newStatus: ComplaintStatus) {
        try {
            const updated = await patchComplaint(complaint.id, { status: newStatus })
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            if (selected?.id === updated.id) setSelected(updated)
            toast.success(`Status updated to "${newStatus}"`)
        } catch {
            toast.error('Failed to update status')
        }
        setEditingStatus(false)
    }

    async function handlePriorityChange(complaint: Complaint, newPriority: ComplaintPriority) {
        try {
            const updated = await patchComplaint(complaint.id, { priority: newPriority })
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            if (selected?.id === updated.id) setSelected(updated)
            toast.success(`Priority updated to "${newPriority}"`)
        } catch {
            toast.error('Failed to update priority')
        }
        setEditingPriority(false)
    }

    async function handleForwardChange(complaint: Complaint, dept: string | null) {
        try {
            const updated = await patchComplaint(complaint.id, { forwardedTo: dept } as any)
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            if (selected?.id === updated.id) setSelected(updated)
            toast.success(dept ? `Forwarded to ${dept}` : 'Forward removed')
        } catch {
            toast.error('Failed to forward complaint')
        }
    }

    async function handleDelete(complaint: Complaint) {
        if (!window.confirm(`Delete complaint ${complaint.id} permanently?`)) return
        try {
            await deleteComplaint(complaint.id)
            setComplaints((prev) => prev.filter((c) => c.id !== complaint.id))
            if (selected?.id === complaint.id) setSelected(null)
            toast.success('Complaint deleted')
        } catch {
            toast.error('Failed to delete complaint')
        }
    }

    async function handleResolutionNotes(complaint: Complaint) {
        const notes = window.prompt('Enter resolution notes:', complaint.resolutionNotes || '')
        if (notes === null) return
        try {
            const updated = await patchComplaint(complaint.id, { resolutionNotes: notes })
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            if (selected?.id === updated.id) setSelected(updated)
            toast.success('Resolution notes saved')
        } catch {
            toast.error('Failed to save notes')
        }
    }

    async function handleAssign(complaint: Complaint) {
        const assignee = window.prompt('Assign to officer:', complaint.assignedTo || '')
        if (assignee === null) return
        try {
            const updated = await patchComplaint(complaint.id, { assignedTo: assignee || null })
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            if (selected?.id === updated.id) setSelected(updated)
            toast.success(assignee ? `Assigned to ${assignee}` : 'Assignment removed')
        } catch {
            toast.error('Failed to assign')
        }
    }

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        outline: 'none',
        minWidth: 130,
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={22} style={{ color: 'var(--accent-orange)' }} />
                        Complaints Management
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                        View, manage, and track all registered grievances
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => exportToCSV(filteredComplaints)} style={btnOutlineStyle}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem',
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Filter size={14} color="var(--text-muted)" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={inputStyle}>
                        <option value="All">All Status</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)} style={inputStyle}>
                        <option value="All">All Priority</option>
                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div style={{
                        position: 'relative', display: 'flex', alignItems: 'center',
                    }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search ID, village, category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: 30, minWidth: 240, borderRadius: 'var(--radius-full)' }}
                        />
                    </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredComplaints.length}</strong> of {complaints.length}
                </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 230px)' }}>
                {/* Table */}
                <div style={{
                    flex: selected ? '1 1 60%' : '1 1 100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'auto',
                    backdropFilter: 'blur(10px)',
                    transition: 'flex 0.3s ease',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0, zIndex: 5 }}>
                                {['ID', 'Category', 'Village', 'District', 'Forwarded To', 'Channel', 'Priority', 'Status', 'Date'].map((h) => (
                                    <th key={h} style={{
                                        padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 600,
                                        color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase',
                                        letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)',
                                        background: 'var(--bg-secondary)',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{
                                        textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)',
                                    }}>
                                        No complaints match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => { setSelected(c); setEditingStatus(false); setEditingPriority(false) }}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            background: selected?.id === c.id ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selected?.id !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        <td style={tdStyle}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-blue)' }}>
                                                {c.id.length > 12 ? c.id.slice(-10) : c.id}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{c.category}</td>
                                        <td style={tdStyle}>{c.village}</td>
                                        <td style={tdStyle}>{c.district}</td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.75rem', color: c.forwardedTo ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                                                {c.forwardedTo || '—'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)',
                                                fontSize: '0.7rem', color: 'var(--text-secondary)',
                                            }}>
                                                {c.channel}
                                            </span>
                                        </td>
                                        <td style={tdStyle}><PriorityPill priority={c.priority} /></td>
                                        <td style={tdStyle}><StatusPill status={c.status} /></td>
                                        <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {formatDate(c.submittedAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div style={{
                        flex: '0 0 380px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        overflow: 'auto',
                        backdropFilter: 'blur(10px)',
                        animation: 'slideInRight 0.3s ease-out',
                    }}>
                        {/* Detail Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Eye size={16} color="var(--accent-orange)" /> Complaint Detail
                            </h2>
                            <button onClick={() => setSelected(null)} style={iconBtnStyle}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* ID */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>ID</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent-blue)' }}>{selected.id}</span>
                        </div>

                        {/* Category */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Category</span>
                            <span style={{ fontWeight: 500 }}>{selected.category}</span>
                        </div>

                        {/* Description */}
                        {selected.description && (
                            <div style={{ ...detailRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
                                <span style={detailLabelStyle}>Description</span>
                                <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: '0.25rem 0 0', background: 'var(--bg-tertiary)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                                    {selected.description}
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}><MapPin size={12} /> Location</span>
                            <span style={{ fontSize: '0.82rem' }}>
                                {selected.village}, {selected.block}, {selected.district}
                            </span>
                        </div>

                        {/* Reporter */}
                        {(selected.reporterName || selected.reporterPhone) && (
                            <>
                                {selected.reporterName && (
                                    <div style={detailRowStyle}>
                                        <span style={detailLabelStyle}><User size={12} /> Reporter</span>
                                        <span>{selected.reporterName}</span>
                                    </div>
                                )}
                                {selected.reporterPhone && (
                                    <div style={detailRowStyle}>
                                        <span style={detailLabelStyle}><Phone size={12} /> Phone</span>
                                        <span>{selected.reporterPhone}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Channel */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Channel</span>
                            <span style={{
                                padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)',
                                fontSize: '0.75rem',
                            }}>
                                {selected.channel}
                            </span>
                        </div>

                        {/* Submitted */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}><Calendar size={12} /> Submitted</span>
                            <span style={{ fontSize: '0.82rem' }}>{formatDateTime(selected.submittedAt)}</span>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.75rem 0' }} />

                        {/* Status (editable) */}
                        <div style={{ ...detailRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
                            <span style={detailLabelStyle}>Status</span>
                            {editingStatus ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                                    {STATUS_OPTIONS.map((s) => (
                                        <button key={s} onClick={() => handleStatusChange(selected, s)}
                                            style={{
                                                ...btnSmallStyle,
                                                background: selected.status === s ? 'var(--accent-orange)' : 'var(--bg-tertiary)',
                                                color: selected.status === s ? '#fff' : 'var(--text-secondary)',
                                                border: selected.status === s ? '1px solid var(--accent-orange)' : '1px solid var(--border-default)',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                    <StatusPill status={selected.status} />
                                    <button onClick={() => setEditingStatus(true)} style={editBtnStyle}>
                                        Change <ChevronDown size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Priority (editable) */}
                        <div style={{ ...detailRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
                            <span style={detailLabelStyle}>Priority</span>
                            {editingPriority ? (
                                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem' }}>
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <button key={p} onClick={() => handlePriorityChange(selected, p)}
                                            style={{
                                                ...btnSmallStyle,
                                                background: selected.priority === p ? 'var(--accent-orange)' : 'var(--bg-tertiary)',
                                                color: selected.priority === p ? '#fff' : 'var(--text-secondary)',
                                                border: selected.priority === p ? '1px solid var(--accent-orange)' : '1px solid var(--border-default)',
                                            }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                    <PriorityPill priority={selected.priority} />
                                    <button onClick={() => setEditingPriority(true)} style={editBtnStyle}>
                                        Change <ChevronDown size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Assigned To */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Assigned To</span>
                            <button onClick={() => handleAssign(selected)} style={editBtnStyle}>
                                {selected.assignedTo || 'Unassigned'} <ChevronDown size={12} />
                            </button>
                        </div>

                        {/* Forward To */}
                        <div style={{ ...detailRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
                            <span style={detailLabelStyle}><Send size={12} /> Forward to Department</span>
                            <select
                                value={selected.forwardedTo || ''}
                                onChange={(e) => handleForwardChange(selected, e.target.value || null)}
                                style={{ ...inputStyle, marginTop: '0.3rem', width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '0.82rem', color: 'var(--text-primary)' }}
                            >
                                <option value="">Not forwarded</option>
                                {VIBHAG_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        {/* Resolution Notes */}
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Resolution Notes</span>
                            <button onClick={() => handleResolutionNotes(selected)} style={editBtnStyle}>
                                {selected.resolutionNotes ? 'Edit Notes' : 'Add Notes'}
                            </button>
                        </div>
                        {selected.resolutionNotes && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>
                                {selected.resolutionNotes}
                            </p>
                        )}

                        {/* Actions */}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.75rem 0', paddingTop: '0.75rem' }}>
                            <button onClick={() => handleDelete(selected)} style={{
                                ...btnOutlineStyle,
                                color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)',
                                width: '100%', justifyContent: 'center',
                            }}>
                                <Trash2 size={14} /> Delete Complaint
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const tdStyle: React.CSSProperties = {
    padding: '0.55rem 0.75rem',
    borderBottom: '1px solid var(--border-subtle)',
}

const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.45rem 0',
    fontSize: '0.85rem',
}

const detailLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
}

const iconBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
}

const editBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-blue)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: 0,
}

const btnSmallStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.72rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid var(--border-default)',
    transition: 'all 0.15s',
}

const btnOutlineStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.4rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
}
