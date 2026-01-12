'use client'

import { useState, useEffect } from 'react'
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
  HelpCircle,
  Users,
  Quote,
  ChefHat,
  FileEdit,
  Star,
  BarChart3,
  ChevronDown,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

type NavSection = {
  title: string
  id: string
  items: NavItem[]
  collapsible?: boolean
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    id: 'overview',
    collapsible: false,
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Wijzigingen',
        href: '/wijzigingen',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'Workshops',
    id: 'workshops',
    collapsible: true,
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
      },
      {
        title: 'Feedback',
        href: '/feedback',
        icon: MessageSquare,
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
    id: 'quote-settings',
    collapsible: true,
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
    id: 'website-content',
    collapsible: true,
    items: [
      {
        title: 'Ons Verhaal',
        href: '/content/ons-verhaal',
        icon: BookOpen,
      },
      {
        title: 'KPI Cijfers',
        href: '/content/kpi',
        icon: BarChart3,
      },
      {
        title: 'Google Reviews',
        href: '/google-reviews',
        icon: Star,
      },
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
    id: 'settings',
    collapsible: true,
    items: [
      {
        title: 'Quote Templates',
        href: '/templates',
        icon: FileText,
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
]

const STORAGE_KEY = 'nav-collapsed-sections'

export function Navigation() {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCollapsedSections(new Set(JSON.parse(stored)))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedSections]))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [collapsedSections, mounted])

  // Auto-expand section if current page is in it
  useEffect(() => {
    if (mounted) {
      for (const section of navSections) {
        const isInSection = section.items.some(
          item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        )
        if (isInSection && collapsedSections.has(section.id)) {
          setCollapsedSections(prev => {
            const next = new Set(prev)
            next.delete(section.id)
            return next
          })
        }
      }
    }
  }, [pathname, mounted])

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Goeduitje</h2>
        <p className="text-sm text-muted-foreground">Workshop Management</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto pb-4">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id)
          const hasActiveItem = section.items.some(
            item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          )

          return (
            <div key={section.id}>
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors',
                    hasActiveItem ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              ) : (
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}

              <div
                className={cn(
                  'space-y-1 overflow-hidden transition-all duration-200',
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                )}
              >
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
                      <Icon className="h-4 w-4" />
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
