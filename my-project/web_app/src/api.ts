import type { Complaint } from './types'

export const API_BASE_URL = 'http://localhost:4000'

export async function fetchComplaints(): Promise<Complaint[]> {
    const res = await fetch(`${API_BASE_URL}/api/complaints`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
    const res = await fetch(`${API_BASE_URL}/api/complaints/${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function patchComplaint(
    id: string,
    updates: Partial<Complaint>,
): Promise<Complaint> {
    const res = await fetch(
        `${API_BASE_URL}/api/complaints/${encodeURIComponent(id)}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function deleteComplaint(id: string): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/api/complaints/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function createComplaint(
    data: Partial<Complaint>,
): Promise<Complaint> {
    const res = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
}

export async function fetchStats() {
    const res = await fetch(`${API_BASE_URL}/api/stats/summary`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export function exportToCSV(complaints: Complaint[]) {
    const headers = [
        'ID', 'Category', 'Description', 'Village', 'Block', 'District',
        'Channel', 'Priority', 'Status', 'Forwarded To', 'Reporter', 'Submitted At',
    ]
    const rows = complaints.map((c) => [
        c.id,
        c.category,
        (c.description || '').replace(/"/g, '""'),
        c.village,
        c.block,
        c.district,
        c.channel,
        c.priority,
        c.status,
        c.forwardedTo || '',
        c.reporterName || 'Anonymous',
        c.submittedAt,
    ])

    const csv = [
        headers.join(','),
        ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grievances_export_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
}
