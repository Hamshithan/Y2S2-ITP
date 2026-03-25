import { useState, useEffect } from 'react'
import { Plus, Route, Truck, Package, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { tripsAPI, vehiclesAPI, driversAPI, parcelsAPI } from '@/services/api'

export default function Dispatch() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [selectedParcels, setSelectedParcels] = useState([])
  const [formData, setFormData] = useState({
    trip_number: '',
    vehicle_id: '',
    driver_id: '',
    route_description: '',
    total_weight: 0,
    capacity_used: 0,
    status: 'Active'
  })

  // Fetch data from database
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tripsData, vehiclesData, driversData, parcelsData] = await Promise.all([
        tripsAPI.getAll(),
        vehiclesAPI.getAll(),
        driversAPI.getAll(),
        parcelsAPI.getAll()
      ])
      setTrips(tripsData)
      setVehicles(vehiclesData)
      setDrivers(driversData)
      setParcels(parcelsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrip = async () => {
    try {
      // Validation
      if (!formData.vehicle_id || !formData.driver_id) {
        alert('Please select both vehicle and driver')
        return
      }

      const vehicle = vehicles.find(v => v.id.toString() === formData.vehicle_id)
      const selectedParcelData = parcels.filter(p => selectedParcels.includes(p.id.toString()))
      const totalWeight = selectedParcelData.reduce((sum, p) => sum + (p.weight || 500), 0)
      const capacityUsed = vehicle ? (totalWeight / vehicle.capacity) * 100 : 0
      const status = capacityUsed > 95 ? 'Overload Alert' : 'Active'
      
      const data = {
        trip_number: formData.trip_number || `TRIP-${Date.now()}`,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        route_description: formData.route_description,
        total_weight: totalWeight,
        capacity_used: capacityUsed,
        status: status,
        parcel_ids: selectedParcels.map(id => parseInt(id))
      }
      
      await tripsAPI.create(data)
      await fetchData()
      setIsAddDialogOpen(false)
      setSelectedParcels([])
      setFormData({ trip_number: '', vehicle_id: '', driver_id: '', route_description: '', total_weight: 0, capacity_used: 0, status: 'Active' })
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Failed to create trip: ' + error.message)
    }
  }

  const handleEditTrip = async () => {
    try {
      const vehicle = vehicles.find(v => v.id.toString() === formData.vehicle_id)
      const selectedParcelData = parcels.filter(p => selectedParcels.includes(p.id.toString()))
      const totalWeight = selectedParcelData.reduce((sum, p) => sum + (p.weight || 500), 0)
      const capacityUsed = vehicle ? (totalWeight / vehicle.capacity) * 100 : 0
      const status = capacityUsed > 95 ? 'Overload Alert' : 'Active'
      
      const data = {
        trip_number: formData.trip_number,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        route_description: formData.route_description,
        total_weight: totalWeight,
        capacity_used: capacityUsed,
        status: status,
        parcel_ids: selectedParcels.map(id => parseInt(id))
      }
      
      await tripsAPI.update(selectedTrip.id, data)
      await fetchData()
      setIsEditDialogOpen(false)
      setSelectedTrip(null)
      setSelectedParcels([])
      setFormData({ trip_number: '', vehicle_id: '', driver_id: '', route_description: '', total_weight: 0, capacity_used: 0, status: 'Active' })
    } catch (error) {
      console.error('Error updating trip:', error)
      alert('Failed to update trip: ' + error.message)
    }
  }

  const handleDeleteTrip = async () => {
    try {
      await tripsAPI.delete(selectedTrip.id)
      await fetchData()
      setIsDeleteDialogOpen(false)
      setSelectedTrip(null)
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    }
  }

  const openEditDialog = (trip) => {
    setSelectedTrip(trip)
    setFormData({
      trip_number: trip.trip_number,
      vehicle_id: trip.vehicle_id?.toString() || '',
      driver_id: trip.driver_id?.toString() || '',
      route_description: trip.route_description,
      total_weight: trip.total_weight,
      capacity_used: trip.capacity_used,
      status: trip.status
    })
    setSelectedParcels(trip.parcels?.map(p => p.toString()) || [])
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (trip) => {
    setSelectedTrip(trip)
    setIsDeleteDialogOpen(true)
  }

  const getCapacityPercentage = (used, capacity) => Math.round((used / capacity) * 100)
  const isNearCapacity = (used, capacity) => (used / capacity) > 0.95

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dispatch data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dispatch & Capacity Optimization</h1>
          <p className="text-muted-foreground mt-1">Create trips and manage vehicle capacity</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Trip
        </Button>
      </div>

      {/* Vehicle Capacity Overview */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Vehicle Capacity Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {vehicles.filter(v => v.status === 'Active').map((vehicle) => {
              const vehicleTrips = trips.filter(t => t.vehicle_id === vehicle.id)
              const usedWeight = vehicleTrips.reduce((sum, t) => sum + (parseFloat(t.total_weight) || 0), 0)
              const percentage = getCapacityPercentage(usedWeight, vehicle.capacity)
              const nearLimit = isNearCapacity(usedWeight, vehicle.capacity)
              
              return (
                <div key={vehicle.id} className="p-4 bg-muted rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground">{vehicle.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.type}</p>
                    </div>
                    {nearLimit && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className={nearLimit ? 'text-red-500 font-medium' : 'text-foreground'}>
                        {usedWeight.toFixed(0)} / {vehicle.capacity} kg
                      </span>
                    </div>
                    <Progress value={usedWeight} max={vehicle.capacity} />
                    <p className={`text-xs text-right ${nearLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {percentage}% used
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Trips */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <Route className="h-4 w-4" />
            Active Delivery Trips
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Parcels</TableHead>
                <TableHead>Capacity Usage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => {
                const vehicle = vehicles.find(v => v.id === trip.vehicle_id)
                const capacity = vehicle?.capacity || 5000
                const totalWeight = parseFloat(trip.total_weight) || 0
                const percentage = getCapacityPercentage(totalWeight, capacity)
                const nearLimit = isNearCapacity(totalWeight, capacity)
                
                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.trip_number}</TableCell>
                    <TableCell>{trip.vehicle_number}</TableCell>
                    <TableCell>{trip.driver_name}</TableCell>
                    <TableCell>{trip.route_description}</TableCell>
                    <TableCell>{trip.parcels?.length || 0} parcels</TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{totalWeight.toFixed(0)}kg</span>
                          <span className={nearLimit ? 'text-red-500' : 'text-foreground'}>{percentage}%</span>
                        </div>
                        <Progress value={totalWeight} max={capacity} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trip.status === 'Overload Alert' ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Overload
                          </Badge>
                        ) : (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(trip)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(trip)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 95% Capacity Rule Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">95% Capacity Validation Rule</p>
              <p className="text-sm text-red-600 mt-1">
                Vehicle capacity cannot exceed 95% to ensure safe delivery operations. 
                Any trip approaching this limit will trigger an overload alert.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Trip Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>Assign vehicle, driver, and parcels to create a delivery trip</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trip Number</Label>
              <Input 
                placeholder="Auto-generated if empty"
                value={formData.trip_number}
                onChange={(e) => setFormData({...formData, trip_number: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status === 'Active').map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.vehicle_number} - {v.type} ({v.capacity}kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'Active').map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Route Description</Label>
              <Input 
                placeholder="e.g., Colombo → Kandy → Colombo"
                value={formData.route_description}
                onChange={(e) => setFormData({...formData, route_description: e.target.value})}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Select Parcels</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {parcels.filter(p => p.status !== 'Delivered').map((parcel) => (
                  <label 
                    key={parcel.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedParcels.includes(parcel.id.toString()) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-card border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedParcels.includes(parcel.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedParcels([...selectedParcels, parcel.id.toString()])
                        } else {
                          setSelectedParcels(selectedParcels.filter(id => id !== parcel.id.toString()))
                        }
                      }}
                      className="h-4 w-4 rounded border-border bg-background"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{parcel.tracking_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{parcel.origin} → {parcel.destination}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTrip} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>Update trip information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trip Number</Label>
              <Input value={formData.trip_number} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status === 'Active').map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.vehicle_number} - {v.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'Active').map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Route Description</Label>
              <Input 
                value={formData.route_description}
                onChange={(e) => setFormData({...formData, route_description: e.target.value})}
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
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overload Alert">Overload Alert</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTrip} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete trip {selectedTrip?.trip_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteTrip} variant="destructive">
              Delete Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
