'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Settings,
  LogOut,
  Database,
  MapPin,
  DollarSign,
  Globe,
  HelpCircle,
  Users,
  Quote,
  ChefHat,
  FileEdit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navSections = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Workshops',
    items: [
      {
        title: 'Workshop Requests',
        href: '/workshops',
        icon: Calendar,
      },
      {
        title: 'Confirmed Workshops',
        href: '/workshops/confirmed',
        icon: ClipboardCheck,
        badge: 'Soon',
      },
      {
        title: 'Feedback',
        href: '/feedback',
        icon: MessageSquare,
        badge: 'Soon',
      },
      {
        title: 'Media Gallery',
        href: '/media',
        icon: ImageIcon,
      },
    ],
  },
  {
    title: 'Quote Settings',
    items: [
      {
        title: 'Workshop Activities',
        href: '/activities',
        icon: Database,
      },
      {
        title: 'Locations & Pricing',
        href: '/locations',
        icon: MapPin,
      },
      {
        title: 'Pricing Tiers',
        href: '/pricing',
        icon: DollarSign,
      },
    ],
  },
  {
    title: 'Website Content',
    items: [
      {
        title: 'FAQ',
        href: '/content/faq',
        icon: HelpCircle,
      },
      {
        title: 'Team Members',
        href: '/content/team',
        icon: Users,
      },
      {
        title: 'Testimonials',
        href: '/content/testimonials',
        icon: Quote,
      },
      {
        title: 'Recipes',
        href: '/content/recipes',
        icon: ChefHat,
      },
      {
        title: 'Page Content',
        href: '/content/pages',
        icon: FileEdit,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Quote Templates',
        href: '/templates',
        icon: FileText,
        badge: 'Soon',
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        badge: 'Soon',
      },
    ],
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Goeduitje</h2>
        <p className="text-sm text-muted-foreground">Workshop Management</p>
      </div>

      <nav className="flex-1 space-y-4 px-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
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
            </div>
          </div>
        ))}
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
