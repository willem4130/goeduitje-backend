'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsCard } from '@/components/StatsCard'
import {
  Calendar,
  Target,
  MessageSquare,
  Image as ImageIcon,
  Plus,
  TrendingUp,
  Music,
  Guitar,
} from 'lucide-react'

type DashboardStats = {
  stats: {
    upcomingShows: number
    activeCampaigns: number
    scheduledPosts: number
    mediaItems: number
  }
  recentShows: Array<{
    id: number
    bandId: string
    title: string
    date: string
    time: string
    venueName: string
    venueCity: string
  }>
  campaignsByStatus: Record<string, number>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [bandFilter, setBandFilter] = useState<'all' | 'full-band' | 'unplugged'>('all')

  const fetchStats = (bandId: string) => {
    setLoading(true)
    const url = bandId === 'all'
      ? '/api/dashboard/stats'
      : `/api/dashboard/stats?bandId=${bandId}`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchStats(bandFilter)
  }, [bandFilter])

  const formatDutchDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-')
    return `${day}-${month}-${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to The Dutch Queen Admin
          </p>
        </div>
        <Tabs value={bandFilter} onValueChange={(value) => setBandFilter(value as typeof bandFilter)} className="w-full sm:w-auto">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              All Bands
            </TabsTrigger>
            <TabsTrigger value="full-band" className="flex items-center gap-2">
              <Guitar className="h-4 w-4" />
              Full Band
            </TabsTrigger>
            <TabsTrigger value="unplugged" className="flex items-center gap-2">
              <Guitar className="h-4 w-4" />
              Unplugged
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/shows/new" className="block">
          <Button className="w-full h-20 text-lg" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Show
          </Button>
        </Link>
        <Link href="/media" className="block">
          <Button className="w-full h-20 text-lg" variant="outline" size="lg">
            <ImageIcon className="mr-2 h-5 w-5" />
            Upload Media
          </Button>
        </Link>
        <Button className="w-full h-20 text-lg" variant="outline" size="lg" disabled>
          <Target className="mr-2 h-5 w-5" />
          New Campaign
        </Button>
        <Button className="w-full h-20 text-lg" variant="outline" size="lg" disabled>
          <MessageSquare className="mr-2 h-5 w-5" />
          Schedule Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Upcoming Shows"
          value={stats?.stats.upcomingShows || 0}
          icon={Calendar}
          description="Scheduled performances"
        />
        <StatsCard
          title="Active Campaigns"
          value={stats?.stats.activeCampaigns || 0}
          icon={Target}
          description="Leads & bookings"
        />
        <StatsCard
          title="Scheduled Posts"
          value={stats?.stats.scheduledPosts || 0}
          icon={MessageSquare}
          description="Social media queue"
        />
        <StatsCard
          title="Media Items"
          value={stats?.stats.mediaItems || 0}
          icon={ImageIcon}
          description="Photos & videos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shows Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Shows</h2>
            <Link href="/shows">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {stats?.recentShows && stats.recentShows.length > 0 ? (
            <div className="space-y-3">
              {stats.recentShows.map((show) => (
                <div
                  key={show.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{show.venueName}</p>
                    <p className="text-sm text-muted-foreground">
                      {show.venueCity} • {formatDutchDate(show.date)} {show.time}
                    </p>
                  </div>
                  <Badge variant={show.bandId === 'full-band' ? 'default' : 'secondary'}>
                    {show.bandId === 'full-band' ? 'Full Band' : 'Unplugged'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No upcoming shows</p>
              <Link href="/shows/new">
                <Button variant="link" className="mt-2">Add your first show</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Campaigns Pipeline Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sales Pipeline</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          {stats?.campaignsByStatus && Object.keys(stats.campaignsByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.campaignsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium capitalize">
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No active campaigns</p>
              <Button variant="link" className="mt-2">Start your first campaign</Button>
            </div>
          )}
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Dashboard statistics updated</p>
              <p className="text-muted-foreground">Just now</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground py-4">
            More activity coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
