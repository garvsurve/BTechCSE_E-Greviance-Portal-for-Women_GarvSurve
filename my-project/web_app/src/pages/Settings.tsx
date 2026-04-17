import { useState } from 'react'
import { Settings, Bell, Shield, Database, Globe, Smartphone, Monitor, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true)
    const [emailAlerts, setEmailAlerts] = useState(false)
    const [autoEscalate, setAutoEscalate] = useState(true)
    const [escalationDays, setEscalationDays] = useState(7)
    const [language, setLanguage] = useState('en')
    const [, setSaved] = useState(false)

    function handleSave() {
        setSaved(true)
        toast.success('Settings saved successfully')
        setTimeout(() => setSaved(false), 2000)
    }

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '0.85rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    }

    const descStyle: React.CSSProperties = {
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginTop: '0.15rem',
    }

    const toggleStyle = (on: boolean): React.CSSProperties => ({
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? 'var(--accent-orange)' : 'var(--bg-tertiary)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
    })

    const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    })

    const selectStyle: React.CSSProperties = {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        outline: 'none',
        minWidth: 160,
    }

    const inputStyle: React.CSSProperties = {
        ...selectStyle,
        minWidth: 80,
        width: 80,
        textAlign: 'center' as const,
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={22} style={{ color: 'var(--accent-orange)' }} />
                    System Configuration
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    Configure system preferences and administrative settings
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 900 }}>
                {/* Notifications */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={18} color="var(--accent-blue)" /> Notifications
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={labelStyle}>Real-time Alerts</div>
                                <div style={descStyle}>Show notifications for new complaints</div>
                            </div>
                            <button style={toggleStyle(notifications)} onClick={() => setNotifications(!notifications)}>
                                <span style={toggleKnobStyle(notifications)} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={labelStyle}>Email Notifications</div>
                                <div style={descStyle}>Send daily digest to admin email</div>
                            </div>
                            <button style={toggleStyle(emailAlerts)} onClick={() => setEmailAlerts(!emailAlerts)}>
                                <span style={toggleKnobStyle(emailAlerts)} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Escalation */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={18} color="var(--accent-red)" /> Escalation Rules
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={labelStyle}>Auto Escalation</div>
                                <div style={descStyle}>Automatically escalate unresolved complaints</div>
                            </div>
                            <button style={toggleStyle(autoEscalate)} onClick={() => setAutoEscalate(!autoEscalate)}>
                                <span style={toggleKnobStyle(autoEscalate)} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={labelStyle}>Escalation Period</div>
                                <div style={descStyle}>Days before auto-escalation</div>
                            </div>
                            <input
                                type="number"
                                value={escalationDays}
                                onChange={(e) => setEscalationDays(Number(e.target.value))}
                                min={1}
                                max={90}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Language & Localization */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} color="var(--accent-green)" /> Localization
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={labelStyle}>Dashboard Language</div>
                                <div style={descStyle}>Interface language for the admin panel</div>
                            </div>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
                                <option value="en">English</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                                <option value="mr">मराठी (Marathi)</option>
                                <option value="bn">বাংলা (Bengali)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={18} color="var(--accent-purple)" /> System Information
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {[
                            ['Backend API', 'http://localhost:4000', true],
                            ['WebSocket', 'Connected', true],
                            ['Database', 'JSON File Store', true],
                            ['Version', 'v1.0.0', true],
                            ['Environment', 'Development', true],
                        ].map(([label, value, status]) => (
                            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label as string}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {status && <CheckCircle size={12} color="var(--accent-green)" />}
                                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                                        {value as string}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Channels */}
                <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Smartphone size={18} color="var(--accent-cyan)" /> Integration Channels
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        {[
                            { name: 'Mobile App (Flutter)', icon: <Smartphone size={16} />, status: 'Active', color: '#22c55e' },
                            { name: 'Web Dashboard', icon: <Monitor size={16} />, status: 'Active', color: '#22c55e' },
                            { name: 'SMS Gateway', icon: <Smartphone size={16} />, status: 'Planned', color: '#fbbf24' },
                            { name: 'WhatsApp Bot', icon: <Smartphone size={16} />, status: 'Planned', color: '#fbbf24' },
                            { name: 'IVR System', icon: <Smartphone size={16} />, status: 'Planned', color: '#fbbf24' },
                        ].map((ch) => (
                            <div key={ch.name} style={{
                                padding: '0.75rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {ch.icon} {ch.name}
                                </div>
                                <span style={{
                                    fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                    background: `${ch.color}15`, color: ch.color, border: `1px solid ${ch.color}30`,
                                }}>
                                    {ch.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '1.25rem', maxWidth: 900 }}>
                <button onClick={handleSave} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.55rem 1.5rem', borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--accent-orange), #ea580c)',
                    border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.88rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                }}>
                    <CheckCircle size={16} /> Save Configuration
                </button>
            </div>
        </div>
    )
}
