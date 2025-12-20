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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, X } from 'lucide-react'

type DrinkItem = {
  id?: number
  itemType: string
  itemName: string
  priceExclVat: string
  priceInclVat: string
  unit: string
  notes: string
}

type Location = {
  id: number
  locationName: string
  city: string
  address: string | null
  minCapacity: number | null
  maxCapacity: number | null
  basePriceExclVat: string
  basePriceInclVat: string
  vatStatus: string
  drinksPolicy: string
  goeduitjeDrinksAvailable: boolean
  contactPerson: string | null
  contactPhone: string | null
  contactEmail: string | null
  notes: string | null
  isActive: boolean
  drinks: DrinkItem[]
}

type FormData = {
  locationName: string
  city: string
  address: string
  minCapacity: string
  maxCapacity: string
  basePriceExclVat: string
  basePriceInclVat: string
  vatStatus: string
  drinksPolicy: string
  goeduitjeDrinksAvailable: boolean
  contactPerson: string
  contactPhone: string
  contactEmail: string
  notes: string
  isActive: boolean
  drinks: DrinkItem[]
}

const drinksPolicyLabels: Record<string, string> = {
  flexible: 'Flexible',
  via_location: 'Via Location',
  mandatory_via_location: 'Mandatory Via Location',
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Location | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    locationName: '',
    city: '',
    address: '',
    minCapacity: '',
    maxCapacity: '',
    basePriceExclVat: '',
    basePriceInclVat: '',
    vatStatus: 'regular',
    drinksPolicy: 'flexible',
    goeduitjeDrinksAvailable: false,
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    isActive: true,
    drinks: [],
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingLocation(null)
    setFormData({
      locationName: '',
      city: '',
      address: '',
      minCapacity: '',
      maxCapacity: '',
      basePriceExclVat: '',
      basePriceInclVat: '',
      vatStatus: 'regular',
      drinksPolicy: 'flexible',
      goeduitjeDrinksAvailable: false,
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      isActive: true,
      drinks: [],
    })
    setSheetOpen(true)
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      locationName: location.locationName,
      city: location.city,
      address: location.address || '',
      minCapacity: location.minCapacity?.toString() || '',
      maxCapacity: location.maxCapacity?.toString() || '',
      basePriceExclVat: location.basePriceExclVat,
      basePriceInclVat: location.basePriceInclVat,
      vatStatus: location.vatStatus,
      drinksPolicy: location.drinksPolicy,
      goeduitjeDrinksAvailable: location.goeduitjeDrinksAvailable,
      contactPerson: location.contactPerson || '',
      contactPhone: location.contactPhone || '',
      contactEmail: location.contactEmail || '',
      notes: location.notes || '',
      isActive: location.isActive,
      drinks: location.drinks.map(d => ({
        id: d.id,
        itemType: d.itemType,
        itemName: d.itemName,
        priceExclVat: d.priceExclVat,
        priceInclVat: d.priceInclVat,
        unit: d.unit,
        notes: d.notes || '',
      })),
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        locationName: formData.locationName,
        city: formData.city,
        address: formData.address || null,
        minCapacity: formData.minCapacity ? parseInt(formData.minCapacity) : null,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
        basePriceExclVat: formData.basePriceExclVat,
        basePriceInclVat: formData.basePriceInclVat,
        vatStatus: formData.vatStatus,
        drinksPolicy: formData.drinksPolicy,
        goeduitjeDrinksAvailable: formData.goeduitjeDrinksAvailable,
        contactPerson: formData.contactPerson || null,
        contactPhone: formData.contactPhone || null,
        contactEmail: formData.contactEmail || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
        drinks: formData.drinks,
      }

      if (editingLocation) {
        await fetch(`/api/locations/${editingLocation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setSheetOpen(false)
      fetchLocations()
    } catch (error) {
      console.error('Failed to save location:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await fetch(`/api/locations/${deleteConfirm.id}`, {
        method: 'DELETE',
      })
      setDeleteConfirm(null)
      fetchLocations()
    } catch (error) {
      console.error('Failed to delete location:', error)
    }
  }

  const addDrinkItem = () => {
    setFormData({
      ...formData,
      drinks: [
        ...formData.drinks,
        {
          itemType: 'beverage',
          itemName: '',
          priceExclVat: '',
          priceInclVat: '',
          unit: 'per_item',
          notes: '',
        },
      ],
    })
  }

  const removeDrinkItem = (index: number) => {
    setFormData({
      ...formData,
      drinks: formData.drinks.filter((_, i) => i !== index),
    })
  }

  const updateDrinkItem = (index: number, field: keyof DrinkItem, value: string) => {
    const updatedDrinks = [...formData.drinks]
    updatedDrinks[index] = { ...updatedDrinks[index], [field]: value }
    setFormData({ ...formData, drinks: updatedDrinks })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading locations...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workshop Locations</h1>
          <p className="text-gray-600">Manage workshop locations and pricing</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price (excl/incl)</TableHead>
              <TableHead>Drinks Policy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.locationName}</TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>
                    {location.minCapacity || 0} - {location.maxCapacity || '∞'}
                  </TableCell>
                  <TableCell>
                    €{location.basePriceExclVat} / €{location.basePriceInclVat}
                  </TableCell>
                  <TableCell>{drinksPolicyLabels[location.drinksPolicy] || location.drinksPolicy}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        location.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(location)}
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
        <SheetContent className="overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </SheetTitle>
            <SheetDescription>
              {editingLocation
                ? 'Update the location details below'
                : 'Create a new workshop location'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locationName">Location Name</Label>
                <Input
                  id="locationName"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minCapacity">Min Capacity</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  value={formData.minCapacity}
                  onChange={(e) => setFormData({ ...formData, minCapacity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maxCapacity">Max Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePriceExclVat">Base Price (excl VAT)</Label>
                <Input
                  id="basePriceExclVat"
                  type="number"
                  step="0.01"
                  value={formData.basePriceExclVat}
                  onChange={(e) => setFormData({ ...formData, basePriceExclVat: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="basePriceInclVat">Base Price (incl VAT)</Label>
                <Input
                  id="basePriceInclVat"
                  type="number"
                  step="0.01"
                  value={formData.basePriceInclVat}
                  onChange={(e) => setFormData({ ...formData, basePriceInclVat: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vatStatus">VAT Status</Label>
                <Select
                  value={formData.vatStatus}
                  onValueChange={(value) => setFormData({ ...formData, vatStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="drinksPolicy">Drinks Policy</Label>
                <Select
                  value={formData.drinksPolicy}
                  onValueChange={(value) => setFormData({ ...formData, drinksPolicy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="via_location">Via Location</SelectItem>
                    <SelectItem value="mandatory_via_location">Mandatory Via Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="goeduitjeDrinksAvailable">Goeduitje Drinks Available</Label>
              <Select
                value={formData.goeduitjeDrinksAvailable ? 'yes' : 'no'}
                onValueChange={(value) => setFormData({ ...formData, goeduitjeDrinksAvailable: value === 'yes' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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

            {/* Drinks Pricing Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label>Drinks Pricing</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDrinkItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Drink
                </Button>
              </div>

              {formData.drinks.map((drink, index) => (
                <div key={index} className="border rounded-lg p-4 mb-3 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeDrinkItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Item Type</Label>
                      <Input
                        value={drink.itemType}
                        onChange={(e) => updateDrinkItem(index, 'itemType', e.target.value)}
                        placeholder="e.g., beverage"
                      />
                    </div>
                    <div>
                      <Label>Item Name</Label>
                      <Input
                        value={drink.itemName}
                        onChange={(e) => updateDrinkItem(index, 'itemName', e.target.value)}
                        placeholder="e.g., Coffee"
                      />
                    </div>
                    <div>
                      <Label>Price (excl VAT)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={drink.priceExclVat}
                        onChange={(e) => updateDrinkItem(index, 'priceExclVat', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Price (incl VAT)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={drink.priceInclVat}
                        onChange={(e) => updateDrinkItem(index, 'priceInclVat', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={drink.unit}
                        onChange={(e) => updateDrinkItem(index, 'unit', e.target.value)}
                        placeholder="e.g., per_item"
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={drink.notes}
                        onChange={(e) => updateDrinkItem(index, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.drinks.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No drinks pricing added yet
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingLocation ? 'Update Location' : 'Create Location'}
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
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.locationName}&quot;?
              This will also delete all associated drinks pricing records.
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
