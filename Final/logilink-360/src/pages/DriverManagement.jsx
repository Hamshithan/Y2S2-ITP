import { useState, useEffect } from 'react'
import { Plus, Users, Clock, AlertCircle, FileCheck, Calendar, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { driversAPI } from '@/services/api'

const shiftSchedule = [
  { driver: 'Kamal Perera', day: 'Mon', start: '06:00', end: '14:00', status: 'Scheduled' },
  { driver: 'Sunil Silva', day: 'Mon', start: '14:00', end: '22:00', status: 'Scheduled' },
  { driver: 'Nimal Fernando', day: 'Mon', start: '22:00', end: '06:00', status: 'Rest Period' },
  { driver: 'Priyantha Raj', day: 'Mon', start: '08:00', end: '16:00', status: 'Scheduled' },
]

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [formData, setFormData] = useState({ name: '', license_number: '', phone: '', status: 'Active' })

  // Fetch drivers from database
  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const data = await driversAPI.getAll()
      setDrivers(data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      alert('Failed to load drivers from database')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDriver = async () => {
    try {
      await driversAPI.create(formData)
      await fetchDrivers()
      setIsAddDialogOpen(false)
      setFormData({ name: '', license_number: '', phone: '', status: 'Active' })
    } catch (error) {
      console.error('Error adding driver:', error)
      alert('Failed to add driver')
    }
  }

  const handleEditDriver = async () => {
    try {
      await driversAPI.update(selectedDriver.id, formData)
      await fetchDrivers()
      setIsEditDialogOpen(false)
      setSelectedDriver(null)
      setFormData({ name: '', license_number: '', phone: '', status: 'Active' })
    } catch (error) {
      console.error('Error updating driver:', error)
      alert('Failed to update driver')
    }
  }

  const handleDeleteDriver = async () => {
    try {
      await driversAPI.delete(selectedDriver.id)
      await fetchDrivers()
      setIsDeleteDialogOpen(false)
      setSelectedDriver(null)
    } catch (error) {
      console.error('Error deleting driver:', error)
      alert('Failed to delete driver')
    }
  }

  const openEditDialog = (driver) => {
    setSelectedDriver(driver)
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      phone: driver.phone,
      status: driver.status
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (driver) => {
    setSelectedDriver(driver)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'success',
      'Inactive': 'secondary',
      'On Leave': 'warning'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading drivers...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Human Capital & Driver Analytics</h1>
          <p className="text-muted-foreground mt-1">Manage drivers, shifts, and fatigue prevention</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drivers.length}</p>
              <p className="text-xs text-muted-foreground">Total Drivers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drivers.filter(d => d.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drivers.filter(d => d.status === 'On Leave').length}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drivers.filter(d => d.status === 'Inactive').length}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="schedule">Shift Schedule</TabsTrigger>
          <TabsTrigger value="validation">Rest Validation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.id}</TableCell>
                      <TableCell>{driver.name}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>{new Date(driver.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(driver)}
                            className="h-8 w-8 text-muted-foreground hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(driver)}
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

        <TabsContent value="schedule" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Shift Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Card key={day} className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-foreground">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {shiftSchedule.filter(s => s.day === 'Mon').map((shift, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-foreground">{shift.driver}</p>
                          <p className="text-xs text-muted-foreground">{shift.start} - {shift.end}</p>
                          <Badge variant="outline" className="mt-1 text-xs border-border">
                            {shift.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Driver Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                    driver.status === 'Active'
                      ? 'bg-card border-border' 
                      : 'bg-yellow-950/20 border-yellow-900/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        driver.status === 'Active' ? 'bg-green-900/30' : 'bg-yellow-900/30'
                      }`}>
                        <Clock className={`h-5 w-5 ${
                          driver.status === 'Active' ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">License: {driver.license_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        driver.status === 'Active' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {driver.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {driver.status === 'Active' ? 'Ready for duty' : 'Not available'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Driver Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        <Badge variant={driver.status === 'Active' ? 'success' : driver.status === 'On Leave' ? 'warning' : 'secondary'}>
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

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent onClose={() => setIsAddDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Register a new driver to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="e.g., Kamal Perera"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input 
                placeholder="e.g., B1234567"
                value={formData.license_number}
                onChange={(e) => setFormData({...formData, license_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g., 077-123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleAddDriver} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input 
                value={formData.license_number}
                onChange={(e) => setFormData({...formData, license_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleEditDriver} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedDriver?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleDeleteDriver} variant="destructive">
              Delete Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
