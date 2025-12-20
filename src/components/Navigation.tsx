'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Target,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Shows',
    href: '/shows',
    icon: Calendar,
  },
  {
    title: 'Media Gallery',
    href: '/media',
    icon: ImageIcon,
  },
  {
    title: 'Campaigns',
    href: '/campaigns',
    icon: Target,
    badge: 'Soon',
  },
  {
    title: 'Social Posts',
    href: '/social',
    icon: MessageSquare,
    badge: 'Soon',
  },
  {
    title: 'Venues',
    href: '/venues',
    icon: MapPin,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    badge: 'Soon',
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-2xl font-bold">The Dutch Queen</h2>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
                item.badge && 'opacity-50 pointer-events-none'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
              {item.badge && (
                <span className="ml-auto text-xs bg-muted-foreground/20 px-2 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
