'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Loader2, FileText, Save, RotateCcw, Info } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type Template = {
  id: string
  name: string
  filename: string
  content: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: editing.filename, content: editedContent })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Template saved')
      setSheetOpen(false)
      setEditing(null)
      fetchTemplates()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (template: Template) => {
    setEditing(template)
    setEditedContent(template.content)
    setSheetOpen(true)
  }

  const resetContent = () => {
    if (editing) {
      setEditedContent(editing.content)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quote Templates</h1>
          <p className="text-muted-foreground">AI prompt templates for generating quote emails</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">How templates work</p>
          <p className="mt-1">The template file is used as the base prompt for AI-generated quote emails. Dynamic data (pricing, locations) is pulled from the database and appended automatically.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.filename}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Last updated: {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true, locale: nl })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {template.content.length} characters, {template.content.split('\n').length} lines
              </p>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No templates found in /src/prompts/</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[800px] sm:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>Edit Template</SheetTitle>
            <SheetDescription>{editing?.filename}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6 h-full">
            <div className="flex justify-between items-center">
              <Label>Template Content</Label>
              <Button variant="ghost" size="sm" onClick={resetContent}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <Textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              className="font-mono text-sm min-h-[500px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
