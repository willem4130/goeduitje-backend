'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Save,
  BookOpen,
  Video,
  Utensils,
  GraduationCap,
  Globe,
  Eye,
  Target,
  TrendingUp,
  Quote,
  Sparkles,
  MousePointerClick,
  FileText,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type FieldDef = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url'
  placeholder: string
}

type SectionDef = {
  label: string
  description: string
  fields: FieldDef[]
}

type Structure = Record<string, SectionDef>
type Content = Record<string, Record<string, string>>

// Section icons mapping
const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <BookOpen className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  doen: <Utensils className="h-5 w-5" />,
  ervaring: <GraduationCap className="h-5 w-5" />,
  culturen: <Globe className="h-5 w-5" />,
  visie: <Eye className="h-5 w-5" />,
  missie: <Target className="h-5 w-5" />,
  impact: <TrendingUp className="h-5 w-5" />,
  quote: <Quote className="h-5 w-5" />,
  teasers: <Sparkles className="h-5 w-5" />,
  cta: <MousePointerClick className="h-5 w-5" />,
  footnote: <FileText className="h-5 w-5" />,
}

export default function OnsVerhaalContentPage() {
  const [structure, setStructure] = useState<Structure | null>(null)
  const [content, setContent] = useState<Content>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content/ons-verhaal')
      const data = await res.json()
      setStructure(data.structure)
      setContent(data.content || {})
    } catch {
      toast.error('Kon content niet laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  const handleFieldChange = (section: string, key: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/content/ons-verhaal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Content opgeslagen!')
      setHasChanges(false)
    } catch {
      toast.error('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const getValue = (section: string, key: string): string => {
    return content[section]?.[key] ?? ''
  }

  const getCompletionStatus = (section: string): { filled: number; total: number } => {
    if (!structure) return { filled: 0, total: 0 }
    const sectionDef = structure[section]
    const total = sectionDef.fields.length
    const filled = sectionDef.fields.filter((f) => getValue(section, f.key).trim() !== '').length
    return { filled, total }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Kon structure niet laden</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Ons Verhaal</h1>
          </div>
          <p className="text-muted-foreground">
            Beheer de content van de &quot;Ons Verhaal&quot; pagina. Alle wijzigingen worden direct
            zichtbaar op de website.
          </p>
          <Link
            href="https://goeduitje-nl-rebuild.vercel.app/ons-verhaal"
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Bekijk pagina op website <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              Niet-opgeslagen wijzigingen
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <Accordion type="multiple" defaultValue={['hero', 'video']} className="space-y-4">
        {Object.entries(structure).map(([sectionKey, sectionDef]) => {
          const status = getCompletionStatus(sectionKey)
          const isComplete = status.filled === status.total

          return (
            <AccordionItem key={sectionKey} value={sectionKey} className="rounded-lg border bg-card">
              <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      {SECTION_ICONS[sectionKey] || <FileText className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{sectionDef.label}</p>
                      <p className="text-sm text-muted-foreground">{sectionDef.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Compleet
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {status.filled}/{status.total} velden
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-4">
                <div className="grid gap-4">
                  {sectionDef.fields.map((field) => (
                    <div key={field.key} className="grid gap-2">
                      <Label htmlFor={`${sectionKey}-${field.key}`} className="flex items-center gap-2">
                        {field.label}
                        {field.type === 'url' && (
                          <Badge variant="outline" className="text-xs">
                            URL
                          </Badge>
                        )}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={`${sectionKey}-${field.key}`}
                          value={getValue(sectionKey, field.key)}
                          onChange={(e) => handleFieldChange(sectionKey, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="min-h-24 resize-y"
                        />
                      ) : (
                        <Input
                          id={`${sectionKey}-${field.key}`}
                          type={field.type === 'url' ? 'text' : 'text'}
                          value={getValue(sectionKey, field.key)}
                          onChange={(e) => handleFieldChange(sectionKey, field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.type === 'url' && getValue(sectionKey, field.key) && (
                        <p className="text-xs text-muted-foreground">
                          Preview:{' '}
                          <a
                            href={getValue(sectionKey, field.key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {getValue(sectionKey, field.key)}
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Bottom Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <Card className="shadow-lg">
            <CardContent className="flex items-center gap-4 p-4">
              <p className="text-sm text-muted-foreground">Je hebt niet-opgeslagen wijzigingen</p>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Wijzigingen Opslaan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
