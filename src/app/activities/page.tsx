'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'

type Activity = {
  id: number
  activityName: string
  basePrice: string
  category: string
  description: string | null
  minParticipants: number | null
  maxParticipants: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type FormData = {
  activityName: string
  basePrice: string
  category: string
  description: string
  minParticipants: string
  maxParticipants: string
  isActive: boolean
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    activityName: '',
    basePrice: '',
    category: '',
    description: '',
    minParticipants: '1',
    maxParticipants: '',
    isActive: true,
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/activities')
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingActivity(null)
    setFormData({
      activityName: '',
      basePrice: '',
      category: '',
      description: '',
      minParticipants: '1',
      maxParticipants: '',
      isActive: true,
    })
    setSheetOpen(true)
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      activityName: activity.activityName,
      basePrice: activity.basePrice,
      category: activity.category,
      description: activity.description || '',
      minParticipants: activity.minParticipants?.toString() || '1',
      maxParticipants: activity.maxParticipants?.toString() || '',
      isActive: activity.isActive,
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        activityName: formData.activityName,
        basePrice: formData.basePrice,
        category: formData.category,
        description: formData.description || null,
        minParticipants: formData.minParticipants ? parseInt(formData.minParticipants) : 1,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        isActive: formData.isActive,
      }

      if (editingActivity) {
        // Update existing activity
        await fetch(`/api/activities/${editingActivity.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new activity
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setSheetOpen(false)
      fetchActivities()
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await fetch(`/api/activities/${deleteConfirm.id}`, {
        method: 'DELETE',
      })
      setDeleteConfirm(null)
      fetchActivities()
    } catch (error) {
      console.error('Failed to delete activity:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workshop Activities</h1>
          <p className="text-gray-600">Manage workshop activity types and descriptions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Participants Range</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No activities found
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.activityName}</TableCell>
                  <TableCell>{activity.category}</TableCell>
                  <TableCell>€{activity.basePrice}</TableCell>
                  <TableCell>
                    {activity.minParticipants || 1} - {activity.maxParticipants || '∞'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {activity.description || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {activity.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(activity)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingActivity ? 'Edit Activity' : 'Add New Activity'}
            </SheetTitle>
            <SheetDescription>
              {editingActivity
                ? 'Update the activity details below'
                : 'Create a new workshop activity'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="activityName">Activity Name</Label>
              <Input
                id="activityName"
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., kookworkshop, stadsspel"
                required
              />
            </div>

            <div>
              <Label htmlFor="basePrice">Base Price (€)</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minParticipants">Min Participants</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Full description for AI prompt generation"
              />
            </div>

            <div>
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingActivity ? 'Update Activity' : 'Create Activity'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.activityName}&quot;?
              This will also affect any associated pricing tiers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
