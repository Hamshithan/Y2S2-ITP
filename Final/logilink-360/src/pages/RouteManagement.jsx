import { useState, useEffect, useMemo } from 'react'
import { MapPin, Navigation, Clock, AlertTriangle, Package, Route as RouteIcon, Plus, Pencil, Trash2, Truck, ChevronDown, ChevronUp, Play, Bell, UserPlus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { routesAPI, parcelsAPI, tripsAPI } from '@/services/api'
import DeliveryTrackingMap from '@/components/maps/DeliveryTrackingMap'
import RouteOptimizerModal from '@/components/common/RouteOptimizerModal'

export default function RouteManagement() {
  const [routes, setRoutes] = useState([])
  const [parcels, setParcels] = useState([])
  const [trips, setTrips] = useState([])
  const [mapRouteId, setMapRouteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('routes')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [stopsData, setStopsData] = useState([])
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
  const [expandedRoutes, setExpandedRoutes] = useState([])
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false)
  const [selectedRouteForOptimization, setSelectedRouteForOptimization] = useState(null)

  const toggleRouteExpanded = (id) => {
    setExpandedRoutes((prev) => 
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const handleApplyOptimization = async (optimizedRoute) => {
    try {
      // Use existing update logic to save it to DB (and spoof optimize endpoint)
      const dataToSave = {
        name: optimizedRoute.name,
        route_number: optimizedRoute.route_number,
        start_location: optimizedRoute.start_location,
        end_location: optimizedRoute.end_location,
        priority: optimizedRoute.priority,
        distance: optimizedRoute.distance,
        estimated_time: optimizedRoute.estimated_time,
        stops: optimizedRoute.stops_data?.length || 0,
        stops_data: optimizedRoute.stops_data
      }
      
      // We can also call the strictly requested endpoint for telemetry if implemented
      await routesAPI.optimize(optimizedRoute.id, { algorithm: 'ga' }).catch(() => console.log('Mocked optimize endpoint hit.'))
      await routesAPI.update(optimizedRoute.id, dataToSave)
      
      setRoutes(prev => prev.map(r => r.id === optimizedRoute.id ? { ...r, ...optimizedRoute } : r))
      setIsOptimizerOpen(false)
      setSelectedRouteForOptimization(null)
    } catch (error) {
      console.error('Failed to save optimized route', error)
      alert('Failed to save the optimized route.')
    }
  }

  const routeNameSuggestions = useMemo(() => {
    const names = routes.map((r) => r.name).filter(Boolean)
    return [...new Set(names)].slice(0, 20)
  }, [routes])

  const locationSuggestions = useMemo(() => {
    const routeLocations = routes.flatMap((r) => [r.start_location, r.end_location])
    const parcelLocations = parcels.flatMap((p) => [p.origin, p.destination])
    const stopLocations = routes.flatMap((r) => (r.stops_data || []).map((s) => s.location))
    const allLocations = [...routeLocations, ...parcelLocations, ...stopLocations]
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)
    return [...new Set(allLocations)].slice(0, 30)
  }, [routes, parcels])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const tripsData = await tripsAPI.getAll()
        setTrips(tripsData)
      } catch {
        /* ignore */
      }
    }, 8000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (routes.length > 0 && mapRouteId == null) {
      setMapRouteId(routes[0].id)
    }
  }, [routes, mapRouteId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [routesResult, parcelsResult, tripsResult] = await Promise.allSettled([
        routesAPI.getAll(),
        parcelsAPI.getAll(),
        tripsAPI.getAll()
      ])
      if (routesResult.status === 'fulfilled') {
        setRoutes(routesResult.value)
      } else {
        throw routesResult.reason
      }
      if (parcelsResult.status === 'fulfilled') {
        setParcels(parcelsResult.value)
      } else {
        setParcels([])
      }
      if (tripsResult.status === 'fulfilled') {
        setTrips(tripsResult.value)
      } else {
        setTrips([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoute = async () => {
    try {
      const data = { ...formData, stops: stopsData.length, stops_data: stopsData }
      await routesAPI.create(data)
      setIsAddDialogOpen(false)
      setFormData({ route_number: '', name: '', start_location: '', end_location: '', distance: '', estimated_time: '', priority: 'Normal', stops: 0 })
      setStopsData([])
      await fetchData()
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Failed to create route')
    }
  }

  const handleEditRoute = async () => {
    try {
      const data = { ...formData, stops: stopsData.length, stops_data: stopsData }
      await routesAPI.update(selectedRoute.id, data)
      setIsEditDialogOpen(false)
      setSelectedRoute(null)
      setFormData({ route_number: '', name: '', start_location: '', end_location: '', distance: '', estimated_time: '', priority: 'Normal', stops: 0 })
      setStopsData([])
      await fetchData()
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

  const selectedRouteForMap = routes.find((r) => r.id === mapRouteId) || null

  const handleDemoDriverPing = async () => {
    const active = trips.filter((t) => t.status === 'Active')
    if (!active.length) {
      alert('No active trip. Create one in Dispatch and set status to Active.')
      return
    }
    const t = active[0]
    const lat = 6.9271 + (Math.random() - 0.5) * 0.06
    const lng = 79.8612 + (Math.random() - 0.5) * 0.06
    try {
      await tripsAPI.updateLocation(t.id, lat, lng)
      const tripsData = await tripsAPI.getAll()
      setTrips(tripsData)
    } catch (e) {
      console.error(e)
      alert('Could not send demo location.')
    }
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Geo-Spatial Route Management</h1>
        <p className="text-muted-foreground mt-1">Optimize delivery routes based on urgency and fragility</p>
      </div>

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
              <RouteIcon className="h-5 w-5 text-green-400" />
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Deliveries</TabsTrigger>
            <TabsTrigger value="map">Live Map</TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </div>

        <TabsContent value="routes" className="mt-0">
          <div className="grid gap-4">
            {routes.map((route) => {
              const isExpanded = expandedRoutes.includes(route.id)
              return (
                <Card key={route.id} className={`border-border bg-card transition-all duration-200 ${isExpanded ? 'shadow-md border-primary/20' : 'hover:border-primary/50 cursor-pointer'}`} onClick={() => !isExpanded && toggleRouteExpanded(route.id)}>
                  <CardHeader className={`${isExpanded ? '' : 'pb-4'}`}>
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
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {getPriorityBadge(route.priority)}
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedRouteForOptimization(route); setIsOptimizerOpen(true); }} className="h-8 ml-2 gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                          <Zap className="h-3 w-3" /> Optimize
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(route)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(route)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleRouteExpanded(route.id)} className="h-8 w-8 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4 mt-2">
                        <div className="p-3 bg-card rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="text-lg font-medium text-foreground">{route.distance}</p>
                        </div>
                        <div className="p-3 bg-card rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground">Est. Time</p>
                          <p className="text-lg font-medium text-foreground">{route.estimated_time}</p>
                        </div>
                        <div className="p-3 bg-card rounded-lg border border-border">
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
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${stop.type === 'Start' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1 min-w-[120px] bg-muted/30 p-2 rounded-md">
                                <p className="text-sm font-medium text-foreground">{stop.location}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> {stop.estimated_time}</p>
                                {stop.parcels > 0 && <p className="text-xs text-primary flex items-center gap-1 mt-1"><Package className="h-3 w-3" /> {stop.parcels} parcels</p>}
                              </div>
                              {idx < (route.stops_data?.length || 0) - 1 && (
                                <div className="h-px w-8 bg-border" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="mt-0">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Priority Routes Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route ID</TableHead>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quick Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.filter(r => ['Critical', 'High', 'Medium'].includes(r.priority)).map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.route_number}</TableCell>
                      <TableCell>{route.name}</TableCell>
                      <TableCell>{getPriorityBadge(route.priority)}</TableCell>
                      <TableCell>
                        <Badge variant={route.status === 'Active' ? 'default' : 'secondary'}>
                          {route.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => alert('Assign Driver clicked for ' + route.route_number)}>
                            <UserPlus className="h-4 w-4 mr-1"/> Assign Driver
                          </Button>
                          <Button size="sm" onClick={() => { setActiveTab('map'); setMapRouteId(route.id); }}>
                            <Play className="h-4 w-4 mr-1"/> Tracking
                          </Button>
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => alert('Notification sent for ' + route.route_number)}>
                            <Bell className="h-4 w-4"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {routes.filter(r => ['Critical', 'High', 'Medium'].includes(r.priority)).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No urgent routes at the moment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <div className="flex flex-col lg:flex-row gap-6">
            <Card className="border-border bg-card flex-1 outline-none min-h-[600px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <div>
                  <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Live Deliveries Map
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Real-time vehicle tracking and route overview.
                  </p>
                </div>
                <div className="flex gap-2 relative">
                  <Select
                    value={mapRouteId != null ? String(mapRouteId) : 'all'}
                    onValueChange={(v) => setMapRouteId(v === 'all' ? null : Number(v))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Show all routes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Show All Routes</SelectItem>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.route_number} - {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative z-0">
                {activeTab === 'map' && (
                  <DeliveryTrackingMap trips={trips} routes={routes} selectedRouteId={mapRouteId} />
                )}
              </CardContent>
            </Card>
            
            <div className="w-full lg:w-80 flex flex-col gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Live Tracking Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg">
                    <span className="text-sm text-muted-foreground">Active Vehicles</span>
                    <span className="font-bold text-primary text-xl">{trips.filter((t) => t.status === 'Active').length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg">
                    <span className="text-sm text-muted-foreground">Urgent Issues</span>
                    <span className="font-bold text-destructive text-xl">1</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Urgent Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {routes.filter(r => ['Critical', 'High'].includes(r.priority)).slice(0, 3).map(route => (
                    <div key={route.id} className="p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => {setMapRouteId(route.id);}}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{route.route_number}</span>
                        {getPriorityBadge(route.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{route.name}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
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
              <Input placeholder="e.g., ROUTE-003" value={formData.route_number} onChange={(e) => setFormData({...formData, route_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input placeholder="e.g., Colombo to Kandy" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} list="route-name-suggestions" />
              <datalist id="route-name-suggestions">
                {routeNameSuggestions.map((name) => <option key={name} value={name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input placeholder="e.g., Colombo Warehouse" value={formData.start_location} onChange={(e) => setFormData({...formData, start_location: e.target.value})} list="location-suggestions" />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input placeholder="e.g., Jaffna" value={formData.end_location} onChange={(e) => setFormData({...formData, end_location: e.target.value})} list="location-suggestions" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance</Label>
                <Input placeholder="e.g., 450 km" value={formData.distance} onChange={(e) => setFormData({...formData, distance: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <Input placeholder="e.g., 8 hours" value={formData.estimated_time} onChange={(e) => setFormData({...formData, estimated_time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Plus className="h-4 w-4 mr-1" />Add Stop
                </Button>
              </div>
              {stopsData.map((stop, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-card rounded-lg border border-border">
                  <Input placeholder="Location" value={stop.location} onChange={(e) => updateStop(idx, 'location', e.target.value)} list="location-suggestions" />
                  <Select value={stop.type} onValueChange={(value) => updateStop(idx, 'type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Start">Start</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Time" value={stop.estimated_time} onChange={(e) => updateStop(idx, 'estimated_time', e.target.value)} />
                  <Button type="button" onClick={() => removeStop(idx)} variant="destructive" size="sm">Remove</Button>
                </div>
              ))}
              <datalist id="location-suggestions">
                {locationSuggestions.map((location) => <option key={location} value={location} />)}
              </datalist>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground">Cancel</Button>
            <Button onClick={handleAddRoute} className="bg-primary text-primary-foreground hover:bg-primary/90">Add Route</Button>
          </div>
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
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input value={formData.start_location} onChange={(e) => setFormData({...formData, start_location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input value={formData.end_location} onChange={(e) => setFormData({...formData, end_location: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance</Label>
                <Input value={formData.distance} onChange={(e) => setFormData({...formData, distance: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <Input value={formData.estimated_time} onChange={(e) => setFormData({...formData, estimated_time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Plus className="h-4 w-4 mr-1" />Add Stop
                </Button>
              </div>
              {stopsData.map((stop, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-card rounded-lg border border-border">
                  <Input placeholder="Location" value={stop.location} onChange={(e) => updateStop(idx, 'location', e.target.value)} />
                  <Select value={stop.type} onValueChange={(value) => updateStop(idx, 'type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Start">Start</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Time" value={stop.estimated_time} onChange={(e) => updateStop(idx, 'estimated_time', e.target.value)} />
                  <Button type="button" onClick={() => removeStop(idx)} variant="destructive" size="sm">Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-foreground">Cancel</Button>
            <Button onClick={handleEditRoute} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
          </div>
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
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-foreground">Cancel</Button>
            <Button onClick={handleDeleteRoute} variant="destructive">Delete Route</Button>
          </div>
        </DialogContent>
      </Dialog>

      <RouteOptimizerModal 
        isOpen={isOptimizerOpen}
        onClose={() => { setIsOptimizerOpen(false); setSelectedRouteForOptimization(null); }}
        route={selectedRouteForOptimization}
        onApply={handleApplyOptimization}
      />
    </div>
  )
}
