'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, BarChart3, Users, TrendingUp, Award, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type SiteStats = {
  companiesCount: string
  activitiesCount: string
  teamsCount: string
  rebookRate: string
  heroActivitiesCount: string
  heroParticipantsCount: string
  uspBadges: string
}

const DEFAULT_STATS: SiteStats = {
  companiesCount: '80+',
  activitiesCount: '200+',
  teamsCount: '150+',
  rebookRate: '95%',
  heroActivitiesCount: '41',
  heroParticipantsCount: '516',
  uspBadges: 'Maak sociale impact,Op locatie naar keuze,Op maat'
}

export default function KPIPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<SiteStats>(DEFAULT_STATS)
  const [originalStats, setOriginalStats] = useState<SiteStats>(DEFAULT_STATS)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(stats) !== JSON.stringify(originalStats)
    setHasChanges(changed)
  }, [stats, originalStats])

  // Warn on page leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/site-stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setOriginalStats(data.stats)
      }
    } catch {
      // Use defaults if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/site-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      })
      if (!res.ok) throw new Error('Failed to save')
      setOriginalStats(stats)
      setHasChanges(false)
      toast.success('KPI cijfers opgeslagen')
    } catch {
      toast.error('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = useCallback(() => {
    setStats(originalStats)
    setHasChanges(false)
    toast.info('Wijzigingen ongedaan gemaakt')
  }, [originalStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            <div>
              <h1 className="text-2xl font-bold">KPI Cijfers</h1>
              <p className="text-sm text-muted-foreground">
                Beheer de statistieken op de website
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300 bg-amber-50">
                  <AlertCircle className="h-3 w-3" />
                  Niet-opgeslagen wijzigingen
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleDiscard}>
                  Annuleren
                </Button>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={hasChanges ? 'bg-primary' : ''}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Opslaan
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Jullie Ervaringen page stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Jullie Ervaringen Pagina</CardTitle>
              </div>
              <CardDescription>
                Statistieken getoond op de /jullie-ervaringen pagina
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aantal Bedrijven</Label>
                  <Input
                    value={stats.companiesCount}
                    onChange={e => setStats({...stats, companiesCount: e.target.value})}
                    placeholder="80+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Bijv. &quot;80+&quot; of &quot;100+&quot;</p>
                </div>
                <div>
                  <Label>Aantal Uitjes</Label>
                  <Input
                    value={stats.activitiesCount}
                    onChange={e => setStats({...stats, activitiesCount: e.target.value})}
                    placeholder="200+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Bijv. &quot;200+&quot; of &quot;250+&quot;</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Homepage social proof stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Homepage - Social Proof</CardTitle>
              </div>
              <CardDescription>
                Statistieken getoond naast de configurator op de homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aantal Teams</Label>
                  <Input
                    value={stats.teamsCount}
                    onChange={e => setStats({...stats, teamsCount: e.target.value})}
                    placeholder="150+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Getoond als &quot;150+ Teams&quot;</p>
                </div>
                <div>
                  <Label>Rebook Percentage</Label>
                  <Input
                    value={stats.rebookRate}
                    onChange={e => setStats({...stats, rebookRate: e.target.value})}
                    placeholder="95%"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Getoond als &quot;95% Rebook&quot;</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero video KPI stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Homepage - Hero Video KPIs</CardTitle>
              </div>
              <CardDescription>
                Geanimeerde cijfers in de hero sectie van de homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aantal Uitjes</Label>
                  <Input
                    value={stats.heroActivitiesCount}
                    onChange={e => setStats({...stats, heroActivitiesCount: e.target.value})}
                    placeholder="41"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Geanimeerd KPI nummer</p>
                </div>
                <div>
                  <Label>Aantal Deelnemers</Label>
                  <Input
                    value={stats.heroParticipantsCount}
                    onChange={e => setStats({...stats, heroParticipantsCount: e.target.value})}
                    placeholder="516"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Geanimeerd KPI nummer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USP badges */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Homepage - USP Badges</CardTitle>
              </div>
              <CardDescription>
                De drie badges onder de hero video op de homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>USP Badges (komma-gescheiden)</Label>
                <Input
                  value={stats.uspBadges}
                  onChange={e => setStats({...stats, uspBadges: e.target.value})}
                  placeholder="Maak sociale impact,Op locatie naar keuze,Op maat"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Drie badges gescheiden door komma&apos;s
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stats.uspBadges.split(',').map((badge, i) => (
                    <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {badge.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
