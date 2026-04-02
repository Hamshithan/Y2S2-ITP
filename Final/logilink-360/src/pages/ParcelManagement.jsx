import { useState, useEffect } from 'react'
import { Plus, Package, Search, MapPin, Clock, CheckCircle, Truck, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { parcelsAPI, driversAPI, vehiclesAPI } from '@/services/api'

const generateTrackingId = () => {
  const prefix = 'PKG'
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${random}`
}

export default function ParcelManagement() {
  const [parcels, setParcels] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [formData, setFormData] = useState({
    tracking_id: '',
    origin: '',
    destination: '',
    status: 'Picked Up',
    driver_id: '',
    vehicle_id: ''
  })

  // Fetch data from database
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [parcelsData, driversData, vehiclesData] = await Promise.all([
        parcelsAPI.getAll(),
        driversAPI.getAll(),
        vehiclesAPI.getAll()
      ])
      setParcels(parcelsData)
      setDrivers(driversData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const handleAddParcel = async () => {
    try {
      const data = {
        ...formData,
        tracking_id: formData.tracking_id || generateTrackingId()
      }
      await parcelsAPI.create(data)
      await fetchData()
      setIsAddDialogOpen(false)
      setFormData({ tracking_id: '', origin: '', destination: '', status: 'Picked Up', driver_id: '', vehicle_id: '' })
    } catch (error) {
      console.error('Error adding parcel:', error)
      alert('Failed to add parcel')
    }
  }

  const handleEditParcel = async () => {
    try {
      await parcelsAPI.update(selectedParcel.id, formData)
      await fetchData()
      setIsEditDialogOpen(false)
      setSelectedParcel(null)
      setFormData({ tracking_id: '', origin: '', destination: '', status: 'Picked Up', driver_id: '', vehicle_id: '' })
    } catch (error) {
      console.error('Error updating parcel:', error)
      alert('Failed to update parcel')
    }
  }

  const handleDeleteParcel = async () => {
    try {
      await parcelsAPI.delete(selectedParcel.id)
      await fetchData()
      setIsDeleteDialogOpen(false)
      setSelectedParcel(null)
    } catch (error) {
      console.error('Error deleting parcel:', error)
      alert('Failed to delete parcel')
    }
  }

  const openEditDialog = (parcel) => {
    setSelectedParcel(parcel)
    setFormData({
      tracking_id: parcel.tracking_id,
      origin: parcel.origin,
      destination: parcel.destination,
      status: parcel.status,
      driver_id: parcel.driver_id || '',
      vehicle_id: parcel.vehicle_id || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (parcel) => {
    setSelectedParcel(parcel)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      'Picked Up': 'warning',
      'In Transit': 'default',
      'Delivered': 'success',
      'Cancelled': 'destructive'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading parcels...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Parcel Lifecycle & Customer Experience</h1>
          <p className="text-muted-foreground mt-1">Manage orders, customers, and track parcels</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{parcels.length}</p>
              <p className="text-xs text-muted-foreground">Total Parcels</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{parcels.filter(p => p.status === 'Pending').length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{parcels.filter(p => p.status === 'In Transit').length}</p>
              <p className="text-xs text-muted-foreground">In Transit</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{parcels.filter(p => p.status === 'Delivered').length}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="parcels" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="parcels">Parcels</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="parcels" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcels.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-medium font-mono">{parcel.tracking_id}</TableCell>
                      <TableCell>{parcel.origin}</TableCell>
                      <TableCell>{parcel.destination}</TableCell>
                      <TableCell>{getStatusBadge(parcel.status)}</TableCell>
                      <TableCell>{parcel.driver_name || 'Unassigned'}</TableCell>
                      <TableCell>{parcel.vehicle_number || 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(parcel)}
                            className="h-8 w-8 text-muted-foreground hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(parcel)}
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

        <TabsContent value="tracking" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {parcels.map((parcel) => (
              <Card key={parcel.id} className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-mono">{parcel.tracking_id}</CardTitle>
                      <p className="text-sm text-muted-foreground">Driver: {parcel.driver_name || 'Unassigned'}</p>
                    </div>
                    {getStatusBadge(parcel.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <MapPin className="h-4 w-4 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">{parcel.origin}</p>
                    </div>
                    <div className="flex-1 h-px bg-muted" />
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 h-px bg-muted" />
                    <div className="text-center">
                      <MapPin className="h-4 w-4 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">{parcel.destination}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Log</p>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <p className="text-sm text-foreground">{parcel.status}</p>
                        <p className="text-xs text-muted-foreground">{new Date(parcel.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Available Drivers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.id}</TableCell>
                      <TableCell>{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        <Badge variant={driver.status === 'Active' ? 'success' : 'secondary'}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Enter parcel details to create a new order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tracking ID</Label>
              <Input 
                placeholder="Auto-generated if empty"
                value={formData.tracking_id}
                onChange={(e) => setFormData({...formData, tracking_id: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin</Label>
                <Input 
                  placeholder="Origin city"
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input 
                  placeholder="Destination city"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Picked Up">Picked Up</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Driver</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {drivers.filter(d => d.status === 'Active').map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Vehicle</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {vehicles.filter(v => v.status === 'Active').map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>{vehicle.vehicle_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleAddParcel} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parcel Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parcel</DialogTitle>
            <DialogDescription>Update parcel information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tracking ID</Label>
              <Input value={formData.tracking_id} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin</Label>
                <Input 
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input 
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Picked Up">Picked Up</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Driver</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {drivers.filter(d => d.status === 'Active').map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Vehicle</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {vehicles.filter(v => v.status === 'Active').map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>{vehicle.vehicle_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleEditParcel} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Parcel Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Parcel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete parcel {selectedParcel?.tracking_id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleDeleteParcel} variant="destructive">
              Delete Parcel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
