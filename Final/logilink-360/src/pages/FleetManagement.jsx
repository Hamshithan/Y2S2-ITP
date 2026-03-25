import { useState, useEffect } from 'react'
import { Plus, Truck, Fuel, Wrench, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { vehiclesAPI } from '@/services/api'

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: '',
    status: 'Active',
    capacity: ''
  })

  // Fetch vehicles from database
  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehiclesAPI.getAll()
      setVehicles(data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      alert('Failed to load vehicles from database')
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async () => {
    try {
      await vehiclesAPI.create(formData)
      await fetchVehicles()
      setIsAddDialogOpen(false)
      setFormData({ vehicle_number: '', type: '', status: 'Active', capacity: '' })
    } catch (error) {
      console.error('Error adding vehicle:', error)
      alert('Failed to add vehicle')
    }
  }

  const handleEditVehicle = async () => {
    try {
      await vehiclesAPI.update(selectedVehicle.id, formData)
      await fetchVehicles()
      setIsEditDialogOpen(false)
      setSelectedVehicle(null)
      setFormData({ vehicle_number: '', type: '', status: 'Active', capacity: '' })
    } catch (error) {
      console.error('Error updating vehicle:', error)
      alert('Failed to update vehicle')
    }
  }

  const handleDeleteVehicle = async () => {
    try {
      await vehiclesAPI.delete(selectedVehicle.id)
      await fetchVehicles()
      setIsDeleteDialogOpen(false)
      setSelectedVehicle(null)
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Failed to delete vehicle')
    }
  }

  const openEditDialog = (vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      type: vehicle.type,
      status: vehicle.status,
      capacity: vehicle.capacity || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'success',
      Maintenance: 'warning',
      Inactive: 'secondary'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading vehicles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Fleet & Asset Intelligence</h1>
          <p className="text-muted-foreground mt-1">Manage vehicle lifecycle and maintenance</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">Total Vehicles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <Truck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vehicles.filter(v => v.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vehicles.filter(v => v.status === 'Maintenance').length}</p>
              <p className="text-xs text-muted-foreground">In Maintenance</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="all">All Vehicles</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Capacity (kg)</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.vehicle_number}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>{vehicle.capacity?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(vehicle)}
                            className="h-8 w-8 text-muted-foreground hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(vehicle)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.filter(v => v.status === 'Active').map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.vehicle_number}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.capacity?.toLocaleString() || '-'} kg</TableCell>
                      <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Maintenance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicles.filter(v => v.status === 'Maintenance').map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{vehicle.vehicle_number}</p>
                        <p className="text-sm text-muted-foreground">In maintenance</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-border text-foreground">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Vehicle Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{vehicle.vehicle_number}</span>
                        <span className="text-xs text-muted-foreground">{vehicle.type}</span>
                      </div>
                      <span className={`text-sm font-medium ${vehicle.status === 'Active' ? 'text-green-400' : vehicle.status === 'Maintenance' ? 'text-yellow-400' : 'text-foreground'}`}>
                        {vehicle.status}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          vehicle.status === 'Active' ? 'bg-green-500' : 
                          vehicle.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-zinc-400'
                        }`}
                        style={{ width: vehicle.status === 'Active' ? '100%' : vehicle.status === 'Maintenance' ? '50%' : '25%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent onClose={() => setIsAddDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Register a new vehicle to the fleet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input 
                placeholder="e.g., Lorry-001"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lorry">Lorry</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity (kg)</Label>
              <Input 
                type="number"
                placeholder="e.g., 5000"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input 
                value={formData.vehicle_number}
                onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lorry">Lorry</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity (kg)</Label>
              <Input 
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleEditVehicle} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVehicle?.vehicle_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleDeleteVehicle} variant="destructive">
              Delete Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
