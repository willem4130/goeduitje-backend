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
    pendingRequests: number
    quotesSent: number
    confirmedWorkshops: number
    mediaItems: number
  }
  recentRequests: Array<{
    id: number
    contactName: string | null
    email: string | null
    organization: string | null
    activityType: string | null
    preferredDate: string | null
    status: string
    createdAt: string
  }>
  requestsByStatus: Record<string, number>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    setLoading(true)
    fetch('/api/dashboard/stats')
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
    fetchStats()
  }, [])

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
            Goeduitje Workshop Management
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/workshops" className="block">
          <Button className="w-full h-20 text-lg" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            View Requests
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
          Confirmed Workshops
        </Button>
        <Button className="w-full h-20 text-lg" variant="outline" size="lg" disabled>
          <MessageSquare className="mr-2 h-5 w-5" />
          Feedback
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pending Requests"
          value={stats?.stats.pendingRequests || 0}
          icon={Calendar}
          description="Awaiting response"
        />
        <StatsCard
          title="Quotes Sent"
          value={stats?.stats.quotesSent || 0}
          icon={Target}
          description="Awaiting confirmation"
        />
        <StatsCard
          title="Confirmed Workshops"
          value={stats?.stats.confirmedWorkshops || 0}
          icon={MessageSquare}
          description="Booked events"
        />
        <StatsCard
          title="Media Items"
          value={stats?.stats.mediaItems || 0}
          icon={ImageIcon}
          description="Photos & videos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Workshop Requests</h2>
            <Link href="/workshops">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {stats?.recentRequests && stats.recentRequests.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{request.contactName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.organization || request.email || 'No organization'} • {request.activityType || 'Not specified'}
                    </p>
                  </div>
                  <Badge variant={request.status === 'bevestigde opdracht' ? 'default' : 'secondary'}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No workshop requests yet</p>
              <p className="text-sm text-muted-foreground mt-2">Requests will appear here when submitted via the frontend</p>
            </div>
          )}
        </Card>

        {/* Request Status Pipeline Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Request Pipeline</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          {stats?.requestsByStatus && Object.keys(stats.requestsByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.requestsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium capitalize">
                      {status}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No requests yet</p>
              <p className="text-sm text-muted-foreground mt-2">Request statuses will appear here</p>
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
