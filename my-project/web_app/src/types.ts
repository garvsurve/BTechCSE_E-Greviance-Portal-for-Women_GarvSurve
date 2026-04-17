export type ComplaintStatus =
    | 'New'
    | 'In Progress'
    | 'Resolved'
    | 'Escalated'
    | 'Closed'

export type ComplaintPriority = 'Low' | 'Medium' | 'High'

export type Complaint = {
    id: string
    category: string
    description?: string
    village: string
    block: string
    district: string
    state?: string
    channel: string
    status: ComplaintStatus
    submittedAt: string
    createdAt?: string
    updatedAt?: string
    priority: ComplaintPriority
    forwardedTo?: string | null
    reporterName?: string | null
    reporterPhone?: string | null
    assignedTo?: string | null
    resolutionNotes?: string | null
    anonymous?: boolean
    latitude?: number | null
    longitude?: number | null
    forwardHistory?: Array<{
        from: string | null
        to: string | null
        at: string
        byUserId: string | null
        byName: string | null
    }>
}

export type StatSummary = {
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
}

export const VIBHAG_OPTIONS = [
    'Women & Child Development',
    'Police',
    'Health',
    'Education',
    'Social Welfare',
    'Revenue',
    'Legal Aid',
    'Panchayati Raj',
]

export const CATEGORY_OPTIONS = [
    'Domestic Violence',
    'Harassment',
    'Property Rights',
    'Child Marriage',
    'Dowry Related',
    'Employment Issue',
    'Health Access',
    'Education Access',
    'Social Discrimination',
    'Financial Fraud',
    'Government Scheme',
    'Other',
]

export const STATUS_OPTIONS: ComplaintStatus[] = [
    'New',
    'In Progress',
    'Resolved',
    'Escalated',
    'Closed',
]

export const PRIORITY_OPTIONS: ComplaintPriority[] = ['Low', 'Medium', 'High']

export const CHANNEL_OPTIONS = ['MobileApp', 'Web', 'Phone', 'Walk-in', 'SMS', 'WhatsApp']
