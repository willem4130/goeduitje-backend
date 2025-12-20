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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'

type PricingTier = {
  id: number
  activityId: number
  minParticipants: number
  maxParticipants: number | null
  pricePerPerson: string | null
  totalPrice: string | null
  activityName: string | null
  activityCategory: string | null
}

type Activity = {
  id: number
  activityName: string
  category: string
}

type FormData = {
  activityId: string
  minParticipants: string
  maxParticipants: string
  pricePerPerson: string
  totalPrice: string
}

export default function PricingPage() {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PricingTier | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    activityId: '',
    minParticipants: '',
    maxParticipants: '',
    pricePerPerson: '',
    totalPrice: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tiersRes, activitiesRes] = await Promise.all([
        fetch('/api/pricing'),
        fetch('/api/activities'),
      ])
      const tiersData = await tiersRes.json()
      const activitiesData = await activitiesRes.json()

      setPricingTiers(tiersData.pricingTiers || [])
      setActivities(activitiesData.activities || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTier(null)
    setFormData({
      activityId: '',
      minParticipants: '',
      maxParticipants: '',
      pricePerPerson: '',
      totalPrice: '',
    })
    setSheetOpen(true)
  }

  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier)
    setFormData({
      activityId: tier.activityId.toString(),
      minParticipants: tier.minParticipants.toString(),
      maxParticipants: tier.maxParticipants?.toString() || '',
      pricePerPerson: tier.pricePerPerson || '',
      totalPrice: tier.totalPrice || '',
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        activityId: parseInt(formData.activityId),
        minParticipants: parseInt(formData.minParticipants),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        pricePerPerson: formData.pricePerPerson || null,
        totalPrice: formData.totalPrice || null,
      }

      if (editingTier) {
        await fetch(`/api/pricing/${editingTier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setSheetOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save pricing tier:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await fetch(`/api/pricing/${deleteConfirm.id}`, {
        method: 'DELETE',
      })
      setDeleteConfirm(null)
      fetchData()
    } catch (error) {
      console.error('Failed to delete pricing tier:', error)
    }
  }

  // Group tiers by activity
  const groupedTiers = pricingTiers.reduce((acc, tier) => {
    const key = tier.activityName || 'Unknown Activity'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(tier)
    return acc
  }, {} as Record<string, PricingTier[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading pricing tiers...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pricing Tiers</h1>
          <p className="text-gray-600">Manage tiered pricing by participant count</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Tier
        </Button>
      </div>

      {/* Grouped Tables by Activity */}
      <div className="space-y-6">
        {Object.keys(groupedTiers).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No pricing tiers found
          </div>
        ) : (
          Object.entries(groupedTiers).map(([activityName, tiers]) => (
            <div key={activityName} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold text-lg">{activityName}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant Range</TableHead>
                    <TableHead>Price per Person</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">
                        {tier.minParticipants} - {tier.maxParticipants || '∞'}
                      </TableCell>
                      <TableCell>
                        {tier.pricePerPerson ? `€${tier.pricePerPerson}` : '-'}
                      </TableCell>
                      <TableCell>
                        {tier.totalPrice ? `€${tier.totalPrice}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(tier)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingTier ? 'Edit Pricing Tier' : 'Add New Pricing Tier'}
            </SheetTitle>
            <SheetDescription>
              {editingTier
                ? 'Update the pricing tier details below'
                : 'Create a new pricing tier'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="activityId">Activity</Label>
              <Select
                value={formData.activityId}
                onValueChange={(value) => setFormData({ ...formData, activityId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      {activity.activityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minParticipants">Min Participants</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Leave empty for open-ended"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pricePerPerson">Price per Person (€)</Label>
              <Input
                id="pricePerPerson"
                type="number"
                step="0.01"
                value={formData.pricePerPerson}
                onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                placeholder="Optional if total price is set"
              />
            </div>

            <div>
              <Label htmlFor="totalPrice">Total Price (€)</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                placeholder="Optional if price per person is set"
              />
            </div>

            <p className="text-sm text-gray-500">
              Note: Set either price per person OR total price (or both)
            </p>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingTier ? 'Update Tier' : 'Create Tier'}
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
            <DialogTitle>Delete Pricing Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pricing tier for{' '}
              {deleteConfirm?.minParticipants} - {deleteConfirm?.maxParticipants || '∞'} participants?
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
