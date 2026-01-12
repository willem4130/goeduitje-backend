'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'

type Recipe = {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  prepTime: number | null
  cookTime: number | null
  servings: number | null
  difficulty: string | null
  category: string | null
  ingredients: string[]
  steps: string[]
  tips: string | null
  isPublished: boolean
}

const CATEGORIES = ['Voorgerecht', 'Hoofdgerecht', 'Bijgerecht', 'Dessert']
const DIFFICULTIES = ['Makkelijk', 'Gemiddeld', 'Moeilijk']

export default function RecipesPage() {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', imageUrl: '', prepTime: '', cookTime: '', servings: '',
    difficulty: '', category: '', ingredients: '', steps: '', tips: '', isPublished: true
  })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/recipes')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = {
        ...(editing ? { id: editing.id } : {}),
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        cookTime: formData.cookTime ? parseInt(formData.cookTime) : null,
        servings: formData.servings ? parseInt(formData.servings) : null,
        difficulty: formData.difficulty || null,
        category: formData.category || null,
        ingredients: formData.ingredients.split('\n').filter(s => s.trim()),
        steps: formData.steps.split('\n').filter(s => s.trim()),
        tips: formData.tips || null,
        isPublished: formData.isPublished,
      }
      const res = await fetch('/api/content/recipes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editing ? 'Recipe updated' : 'Recipe created')
      setSheetOpen(false)
      setEditing(null)
      setFormData({ title: '', slug: '', description: '', imageUrl: '', prepTime: '', cookTime: '', servings: '', difficulty: '', category: '', ingredients: '', steps: '', tips: '', isPublished: true })
      fetchItems()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    try {
      await fetch(`/api/content/recipes?id=${id}`, { method: 'DELETE' })
      toast.success('Recipe deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openEdit = (item: Recipe) => {
    setEditing(item)
    setFormData({
      title: item.title, slug: item.slug, description: item.description || '',
      imageUrl: item.imageUrl || '',
      prepTime: item.prepTime?.toString() || '', cookTime: item.cookTime?.toString() || '',
      servings: item.servings?.toString() || '', difficulty: item.difficulty || '',
      category: item.category || '', ingredients: (item.ingredients || []).join('\n'),
      steps: (item.steps || []).join('\n'), tips: item.tips || '', isPublished: item.isPublished
    })
    setSheetOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setFormData({ title: '', slug: '', description: '', imageUrl: '', prepTime: '', cookTime: '', servings: '', difficulty: '', category: '', ingredients: '', steps: '', tips: '', isPublished: true })
    setSheetOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">Manage recipes for the website</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Recipe</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.category || '—'}</TableCell>
                <TableCell>{item.difficulty || '—'}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Clock className="h-3 w-3" />{(item.prepTime || 0) + (item.cookTime || 0)} min</div></TableCell>
                <TableCell>{item.isPublished ? '✓' : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No recipes yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Recipe' : 'New Recipe'}</SheetTitle>
            <SheetDescription>Fill in the recipe details</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div><Label>Slug</Label><Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="auto-generated" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div><Label>Image URL</Label><Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." /></div>
            {formData.imageUrl && (
              <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <div><Label>Prep (min)</Label><Input type="number" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: e.target.value})} /></div>
              <div><Label>Cook (min)</Label><Input type="number" value={formData.cookTime} onChange={e => setFormData({...formData, cookTime: e.target.value})} /></div>
              <div><Label>Servings</Label><Input type="number" value={formData.servings} onChange={e => setFormData({...formData, servings: e.target.value})} /></div>
              <div>
                <Label>Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={v => setFormData({...formData, difficulty: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Ingredients (one per line)</Label><Textarea value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} className="min-h-24" /></div>
            <div><Label>Steps (one per line)</Label><Textarea value={formData.steps} onChange={e => setFormData({...formData, steps: e.target.value})} className="min-h-24" /></div>
            <div><Label>Tips</Label><Textarea value={formData.tips} onChange={e => setFormData({...formData, tips: e.target.value})} placeholder="Cooking tips..." /></div>
            <div className="flex items-center gap-2"><Switch checked={formData.isPublished} onCheckedChange={(v: boolean) => setFormData({...formData, isPublished: v})} /><Label>Published</Label></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Save Changes' : 'Create Recipe'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
