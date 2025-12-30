'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Brain, Database, Bell, Shield, Loader2, Save, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

type Settings = {
  email: {
    fromName: string
    fromEmail: string
    replyTo: string
    ccAdmin: boolean
    adminEmail: string
  }
  ai: {
    enabled: boolean
    model: string
    autoSendQuotes: boolean
  }
  notifications: {
    newRequestEmail: boolean
    statusChangeEmail: boolean
    dailyDigest: boolean
  }
}

type SiteStats = {
  // Jullie Ervaringen page
  companiesCount: string
  activitiesCount: string
  // Homepage social proof
  teamsCount: string
  rebookRate: string
  // Hero video KPIs
  heroActivitiesCount: string
  heroParticipantsCount: string
  // USP badges (comma-separated)
  uspBadges: string
}

const DEFAULT_SETTINGS: Settings = {
  email: {
    fromName: 'Guus van den Elzen',
    fromEmail: 'guus@goeduitje.nl',
    replyTo: 'guus@goeduitje.nl',
    ccAdmin: true,
    adminEmail: 'info@goeduitje.nl'
  },
  ai: {
    enabled: true,
    model: 'claude-3-sonnet',
    autoSendQuotes: false
  },
  notifications: {
    newRequestEmail: true,
    statusChangeEmail: false,
    dailyDigest: false
  }
}

const DEFAULT_SITE_STATS: SiteStats = {
  companiesCount: '80+',
  activitiesCount: '200+',
  teamsCount: '150+',
  rebookRate: '95%',
  heroActivitiesCount: '41',
  heroParticipantsCount: '516',
  uspBadges: 'Maak sociale impact,Op locatie naar keuze,Op maat'
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailSettings, setEmailSettings] = useState(DEFAULT_SETTINGS.email)
  const [aiSettings, setAiSettings] = useState(DEFAULT_SETTINGS.ai)
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_SETTINGS.notifications)
  const [siteStats, setSiteStats] = useState<SiteStats>(DEFAULT_SITE_STATS)

  useEffect(() => {
    fetchSettings()
    fetchSiteStats()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.settings) {
        setEmailSettings(data.settings.email)
        setAiSettings(data.settings.ai)
        setNotificationSettings(data.settings.notifications)
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchSiteStats = async () => {
    try {
      const res = await fetch('/api/site-stats')
      const data = await res.json()
      if (data.stats) {
        setSiteStats(data.stats)
      }
    } catch {
      // Site stats not configured yet, use defaults
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save settings
      const settingsRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            email: emailSettings,
            ai: aiSettings,
            notifications: notificationSettings
          }
        })
      })
      if (!settingsRes.ok) throw new Error('Failed to save settings')

      // Save site stats
      const statsRes = await fetch('/api/site-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: siteStats })
      })
      if (!statsRes.ok) throw new Error('Failed to save site stats')

      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Settings</CardTitle>
            </div>
            <CardDescription>Configure outgoing email settings for quotes and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Name</Label>
                <Input value={emailSettings.fromName} onChange={e => setEmailSettings({...emailSettings, fromName: e.target.value})} />
              </div>
              <div>
                <Label>From Email</Label>
                <Input type="email" value={emailSettings.fromEmail} onChange={e => setEmailSettings({...emailSettings, fromEmail: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Reply-To Email</Label>
              <Input type="email" value={emailSettings.replyTo} onChange={e => setEmailSettings({...emailSettings, replyTo: e.target.value})} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">CC Admin on Quotes</p>
                <p className="text-sm text-muted-foreground">Send a copy of all quote emails to admin</p>
              </div>
              <Switch checked={emailSettings.ccAdmin} onCheckedChange={v => setEmailSettings({...emailSettings, ccAdmin: v})} />
            </div>
            {emailSettings.ccAdmin && (
              <div>
                <Label>Admin Email</Label>
                <Input type="email" value={emailSettings.adminEmail} onChange={e => setEmailSettings({...emailSettings, adminEmail: e.target.value})} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle>AI Settings</CardTitle>
            </div>
            <CardDescription>Configure AI-powered quote generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable AI Quotes</p>
                <p className="text-sm text-muted-foreground">Use Claude AI to generate quote emails</p>
              </div>
              <Switch checked={aiSettings.enabled} onCheckedChange={v => setAiSettings({...aiSettings, enabled: v})} />
            </div>
            <div>
              <Label>AI Model</Label>
              <Input value={aiSettings.model} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Model is configured via environment variables</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-send Quotes</p>
                <p className="text-sm text-muted-foreground">Automatically send quotes without review</p>
              </div>
              <Switch checked={aiSettings.autoSendQuotes} onCheckedChange={v => setAiSettings({...aiSettings, autoSendQuotes: v})} />
            </div>
            {aiSettings.autoSendQuotes && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                Warning: Auto-send will send AI-generated emails without human review. Use with caution.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure admin notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Request Notifications</p>
                <p className="text-sm text-muted-foreground">Email when a new workshop request comes in</p>
              </div>
              <Switch checked={notificationSettings.newRequestEmail} onCheckedChange={v => setNotificationSettings({...notificationSettings, newRequestEmail: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status Change Notifications</p>
                <p className="text-sm text-muted-foreground">Email when request status changes</p>
              </div>
              <Switch checked={notificationSettings.statusChangeEmail} onCheckedChange={v => setNotificationSettings({...notificationSettings, statusChangeEmail: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Digest</p>
                <p className="text-sm text-muted-foreground">Daily summary of all activity</p>
              </div>
              <Switch checked={notificationSettings.dailyDigest} onCheckedChange={v => setNotificationSettings({...notificationSettings, dailyDigest: v})} />
            </div>
          </CardContent>
        </Card>

        {/* Site Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Site Stats</CardTitle>
            </div>
            <CardDescription>Public statistics shown on the website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jullie Ervaringen page stats */}
            <div>
              <h4 className="font-medium mb-3">Jullie Ervaringen Page</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Companies Count</Label>
                  <Input
                    value={siteStats.companiesCount}
                    onChange={e => setSiteStats({...siteStats, companiesCount: e.target.value})}
                    placeholder="80+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Displayed as &quot;Bedrijven&quot;</p>
                </div>
                <div>
                  <Label>Activities Count</Label>
                  <Input
                    value={siteStats.activitiesCount}
                    onChange={e => setSiteStats({...siteStats, activitiesCount: e.target.value})}
                    placeholder="200+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Displayed as &quot;Uitjes&quot;</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Homepage social proof stats */}
            <div>
              <h4 className="font-medium mb-3">Homepage - Social Proof Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teams Count</Label>
                  <Input
                    value={siteStats.teamsCount}
                    onChange={e => setSiteStats({...siteStats, teamsCount: e.target.value})}
                    placeholder="150+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Next to configurator (e.g., &quot;150+ Teams&quot;)</p>
                </div>
                <div>
                  <Label>Rebook Rate</Label>
                  <Input
                    value={siteStats.rebookRate}
                    onChange={e => setSiteStats({...siteStats, rebookRate: e.target.value})}
                    placeholder="95%"
                  />
                  <p className="text-xs text-muted-foreground mt-1">e.g., &quot;95% Rebook&quot;</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Hero video KPI stats */}
            <div>
              <h4 className="font-medium mb-3">Homepage - Hero Video KPIs</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aantal Uitjes</Label>
                  <Input
                    value={siteStats.heroActivitiesCount}
                    onChange={e => setSiteStats({...siteStats, heroActivitiesCount: e.target.value})}
                    placeholder="41"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Animated KPI in hero section</p>
                </div>
                <div>
                  <Label>Aantal Deelnemers</Label>
                  <Input
                    value={siteStats.heroParticipantsCount}
                    onChange={e => setSiteStats({...siteStats, heroParticipantsCount: e.target.value})}
                    placeholder="516"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Animated KPI in hero section</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* USP badges */}
            <div>
              <h4 className="font-medium mb-3">Homepage - USP Badges</h4>
              <div>
                <Label>USP Badges (comma-separated)</Label>
                <Input
                  value={siteStats.uspBadges}
                  onChange={e => setSiteStats({...siteStats, uspBadges: e.target.value})}
                  placeholder="Maak sociale impact,Op locatie naar keuze,Op maat"
                />
                <p className="text-xs text-muted-foreground mt-1">Three badges shown in hero section, separated by commas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database</CardTitle>
            </div>
            <CardDescription>Database connection information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <p><span className="text-muted-foreground">Provider:</span> Neon PostgreSQL</p>
              <p><span className="text-muted-foreground">ORM:</span> Drizzle (read/write only)</p>
              <p><span className="text-muted-foreground">Migrations:</span> Managed by frontend (Prisma)</p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Authentication and access control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <p><span className="text-muted-foreground">Auth:</span> NextAuth.js</p>
              <p><span className="text-muted-foreground">Session:</span> JWT</p>
              <p><span className="text-muted-foreground">Allowed Emails:</span> Configured in .env</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
