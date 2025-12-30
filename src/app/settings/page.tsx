'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Brain, Database, Bell, Shield, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    fromName: 'Guus van den Elzen',
    fromEmail: 'guus@goeduitje.nl',
    replyTo: 'guus@goeduitje.nl',
    ccAdmin: true,
    adminEmail: 'info@goeduitje.nl'
  })

  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    model: 'claude-3-sonnet',
    autoSendQuotes: false
  })

  const [notificationSettings, setNotificationSettings] = useState({
    newRequestEmail: true,
    statusChangeEmail: false,
    dailyDigest: false
  })

  const handleSave = () => {
    // In a full implementation, this would save to database
    toast.success('Settings saved (demo only - not persisted)')
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Demo Mode</p>
          <p className="mt-1">Settings are not persisted in this demo. In production, these would be stored in the database.</p>
        </div>
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
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
