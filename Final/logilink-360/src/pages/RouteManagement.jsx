import { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, AlertTriangle, Package, Route, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { routesAPI, parcelsAPI } from '@/services/api'

export default function RouteManagement() {
  const [routes, setRoutes] = useState([])
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [formData, setFormData] = useState({
    route_number: '',
    name: '',
    start_location: '',
    end_location: '',
    distance: '',
    estimated_time: '',
    priority: 'Normal',
    stops: 0
  })
  const [stopsData, setStopsData] = useState([])

  // Fetch data from database
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [routesData, parcelsData] = await Promise.all([
        routesAPI.getAll(),
        parcelsAPI.getAll()
      ])
      setRoutes(routesData)
      setParcels(parcelsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoute = async () => {
    try {
      const data = {
        ...formData,
        stops: stopsData.length,
        stops_data: stopsData
      }
      await routesAPI.create(data)
      await fetchData()
      setIsAddDialogOpen(false)
      setFormData({ route_number: '', name: '', start_location: '', end_location: '', distance: '', estimated_time: '', priority: 'Normal', stops: 0 })
      setStopsData([])
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Failed to create route')
    }
  }

  const handleEditRoute = async () => {
    try {
      const data = {
        ...formData,
        stops: stopsData.length,
        stops_data: stopsData
      }
      await routesAPI.update(selectedRoute.id, data)
      await fetchData()
      setIsEditDialogOpen(false)
      setSelectedRoute(null)
      setFormData({ route_number: '', name: '', start_location: '', end_location: '', distance: '', estimated_time: '', priority: 'Normal', stops: 0 })
      setStopsData([])
    } catch (error) {
      console.error('Error updating route:', error)
      alert('Failed to update route')
    }
  }

  const handleDeleteRoute = async () => {
    try {
      await routesAPI.delete(selectedRoute.id)
      await fetchData()
      setIsDeleteDialogOpen(false)
      setSelectedRoute(null)
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route')
    }
  }

  const openEditDialog = (route) => {
    setSelectedRoute(route)
    setFormData({
      route_number: route.route_number,
      name: route.name,
      start_location: route.start_location,
      end_location: route.end_location,
      distance: route.distance,
      estimated_time: route.estimated_time,
      priority: route.priority,
      stops: route.stops
    })
    setStopsData(route.stops_data || [])
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (route) => {
    setSelectedRoute(route)
    setIsDeleteDialogOpen(true)
  }

  const addStop = () => {
    setStopsData([...stopsData, { location: '', type: 'Delivery', estimated_time: '', parcels: 0 }])
  }

  const updateStop = (index, field, value) => {
    const updated = [...stopsData]
    updated[index][field] = value
    setStopsData(updated)
  }

  const removeStop = (index) => {
    setStopsData(stopsData.filter((_, i) => i !== index))
  }

  const getPriorityBadge = (priority) => {
    const variants = {
      'Critical': 'destructive',
      'High': 'warning',
      'Medium': 'default',
      'Low': 'secondary',
      'Normal': 'secondary'
    }
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading routes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Geo-Spatial Route Management</h1>
        <p className="text-muted-foreground mt-1">Optimize delivery routes based on urgency and fragility</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{routes.length}</p>
              <p className="text-xs text-muted-foreground">Total Routes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{routes.filter(r => r.priority === 'Critical' || r.priority === 'High').length}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Route className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{routes.filter(r => r.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground">Active Routes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{parcels.filter(p => p.status === 'In Transit').length}</p>
              <p className="text-xs text-muted-foreground">In Transit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="routes" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Deliveries</TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </Tabs>
      </div>
      
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="urgent">Urgent Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Locations Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Map Placeholder */}
              <div className="aspect-video bg-card rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 800 400">
                    {/* Grid lines */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <line key={`h-${i}`} x1="0" y1={i * 20} x2="800" y2={i * 20} stroke="#3f3f46" strokeWidth="0.5" />
                    ))}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="#3f3f46" strokeWidth="0.5" />
                    ))}
                    {/* Route lines */}
                    <path d="M 200 300 Q 300 250 400 200 T 600 150" stroke="#71717a" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                    <path d="M 200 300 Q 250 320 300 350 T 150 280" stroke="#71717a" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Interactive Map Integration</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect to Google Maps or Mapbox API</p>
                </div>
                {/* Location markers */}
                {[
                  { x: '25%', y: '75%', label: 'Colombo' },
                  { x: '50%', y: '50%', label: 'Kandy' },
                  { x: '37.5%', y: '87.5%', label: 'Galle' },
                  { x: '75%', y: '37.5%', label: 'Jaffna' },
                  { x: '18.75%', y: '70%', label: 'Negombo' },
                ].map((loc, idx) => (
                  <div 
                    key={idx}
                    className="absolute flex flex-col items-center"
                    style={{ left: loc.x, top: loc.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="h-3 w-3 rounded-full bg-accent border-2 border-border" />
                    <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{loc.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {parcels.filter(p => p.status === 'In Transit' || p.status === 'Picked Up').slice(0, 5).map((parcel, idx) => (
                  <div key={idx} className="p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground truncate">{parcel.destination}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getPriorityBadge('Normal')}
                      <span className="text-xs text-muted-foreground">{parcel.tracking_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <div className="grid gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Navigation className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">{route.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{route.route_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(route.priority)}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(route)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteDialog(route)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-lg font-medium text-foreground">{route.distance}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground">Est. Time</p>
                      <p className="text-lg font-medium text-foreground">{route.estimated_time}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground">Stops</p>
                      <p className="text-lg font-medium text-foreground">{route.stops}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivery Sequence</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {route.stops_data?.map((stop, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              stop.type === 'Start' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                            }`}>
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-sm text-foreground">{stop.location}</p>
                            <p className="text-xs text-muted-foreground">{stop.estimated_time}</p>
                            {stop.parcels > 0 && <p className="text-xs text-muted-foreground">{stop.parcels} parcels</p>}
                          </div>
                          {idx < (route.stops_data?.length || 0) - 1 && (
                            <div className="h-px w-8 bg-border" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Priority Delivery Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcels.filter(p => p.status === 'In Transit' || p.status === 'Picked Up').map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-medium">{parcel.tracking_id}</TableCell>
                      <TableCell>{parcel.origin}</TableCell>
                      <TableCell>{parcel.destination}</TableCell>
                      <TableCell>
                        <Badge variant={parcel.status === 'In Transit' ? 'default' : 'warning'}>
                          {parcel.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge('High')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Route Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
            <DialogDescription>Create a new delivery route with stops</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Route Number</Label>
              <Input 
                placeholder="e.g., ROUTE-003"
                value={formData.route_number}
                onChange={(e) => setFormData({...formData, route_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input 
                placeholder="e.g., Colombo → Kandy → Jaffna"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input 
                  placeholder="e.g., Colombo Warehouse"
                  value={formData.start_location}
                  onChange={(e) => setFormData({...formData, start_location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input 
                  placeholder="e.g., Jaffna"
                  value={formData.end_location}
                  onChange={(e) => setFormData({...formData, end_location: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance</Label>
                <Input 
                  placeholder="e.g., 450 km"
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <Input 
                  placeholder="e.g., 8 hours"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Route Stops</Label>
                <Button type="button" onClick={addStop} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stop
                </Button>
              </div>
              {stopsData.map((stop, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-card rounded-lg border border-border">
                  <Input 
                    placeholder="Location"
                    value={stop.location}
                    onChange={(e) => updateStop(idx, 'location', e.target.value)}
                  />
                  <Select value={stop.type} onValueChange={(value) => updateStop(idx, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Start">Start</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Time"
                    value={stop.estimated_time}
                    onChange={(e) => updateStop(idx, 'estimated_time', e.target.value)}
                  />
                  <Button type="button" onClick={() => removeStop(idx)} variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleAddRoute} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>Update route information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Route Number</Label>
              <Input value={formData.route_number} disabled />
            </div>
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input 
                  value={formData.start_location}
                  onChange={(e) => setFormData({...formData, start_location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input 
                  value={formData.end_location}
                  onChange={(e) => setFormData({...formData, end_location: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance</Label>
                <Input 
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <Input 
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Route Stops</Label>
                <Button type="button" onClick={addStop} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stop
                </Button>
              </div>
              {stopsData.map((stop, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-card rounded-lg border border-border">
                  <Input 
                    placeholder="Location"
                    value={stop.location}
                    onChange={(e) => updateStop(idx, 'location', e.target.value)}
                  />
                  <Select value={stop.type} onValueChange={(value) => updateStop(idx, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Start">Start</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Time"
                    value={stop.estimated_time}
                    onChange={(e) => updateStop(idx, 'estimated_time', e.target.value)}
                  />
                  <Button type="button" onClick={() => removeStop(idx)} variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleEditRoute} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Route Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete route {selectedRoute?.route_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleDeleteRoute} variant="destructive">
              Delete Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
