import { useState, useEffect } from 'react'
import { Gift, ShoppingBag, Percent, Crown, Star, TrendingUp, User, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { customersAPI } from '@/services/api'

const tierBenefits = [
  { tier: 'Platinum', minPurchases: 40, discount: 20, benefits: ['Free express delivery', 'Priority support', 'Exclusive offers', 'Birthday gift'] },
  { tier: 'Gold', minPurchases: 20, discount: 15, benefits: ['Free standard delivery', 'Priority support', 'Seasonal offers'] },
  { tier: 'Silver', minPurchases: 10, discount: 10, benefits: ['Discounted delivery', 'Monthly offers'] },
  { tier: 'Bronze', minPurchases: 5, discount: 5, benefits: ['Member pricing'] },
  { tier: 'Member', minPurchases: 0, discount: 0, benefits: ['Newsletter access'] },
]

const getTierBadge = (tier) => {
  const colors = {
    'Platinum': 'bg-slate-200 text-slate-900',
    'Gold': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'Silver': 'bg-slate-500/20 text-slate-300 border-slate-500/50',
    'Bronze': 'bg-amber-600/20 text-amber-400 border-amber-600/50',
    'Member': 'bg-muted text-muted-foreground'
  }
  return <Badge className={colors[tier] || ''}>{tier}</Badge>
}

export default function Loyalty() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    email: '',
    phone: '',
    purchases: 0,
    total_spent: 0,
    tier: 'Member',
    eligible_for_offer: false
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await customersAPI.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        purchases: parseInt(formData.purchases) || 0,
        total_spent: parseFloat(formData.total_spent) || 0
      }
      
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, submitData)
      } else {
        await customersAPI.create(submitData)
      }
      setIsDialogOpen(false)
      setEditingCustomer(null)
      setFormData({
        customer_id: '',
        name: '',
        email: '',
        phone: '',
        purchases: 0,
        total_spent: 0,
        tier: 'Member',
        eligible_for_offer: false
      })
      fetchCustomers()
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Failed to save customer')
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      purchases: customer.purchases,
      total_spent: customer.total_spent,
      tier: customer.tier,
      eligible_for_offer: customer.eligible_for_offer
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await customersAPI.delete(id)
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer')
    }
  }

  const handleAddPurchase = async (id, amount = 2000) => {
    try {
      await customersAPI.addPurchase(id, amount)
      fetchCustomers()
    } catch (error) {
      console.error('Error adding purchase:', error)
      alert('Failed to add purchase')
    }
  }

  const calculateProgress = (purchases, tier) => {
    const tiers = ['Member', 'Bronze', 'Silver', 'Gold', 'Platinum']
    const currentIdx = tiers.indexOf(tier)
    if (currentIdx === tiers.length - 1) return 100
    const nextTierMin = tierBenefits.find(t => t.tier === tiers[currentIdx + 1])?.minPurchases || 0
    const prevTierMin = tierBenefits.find(t => t.tier === tier)?.minPurchases || 0
    const range = nextTierMin - prevTierMin
    const progress = purchases - prevTierMin
    return Math.min(100, Math.round((progress / range) * 100))
  }

  const getNextTier = (tier) => {
    const tiers = ['Member', 'Bronze', 'Silver', 'Gold', 'Platinum']
    const currentIdx = tiers.indexOf(tier)
    if (currentIdx === tiers.length - 1) return null
    return tierBenefits.find(t => t.tier === tiers[currentIdx + 1])?.minPurchases
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer Loyalty Management</h1>
          <p className="text-muted-foreground mt-1">Track purchases and manage discount eligibility</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setEditingCustomer(null)
                setFormData({
                  customer_id: '',
                  name: '',
                  email: '',
                  phone: '',
                  purchases: 0,
                  total_spent: 0,
                  tier: 'Member',
                  eligible_for_offer: false
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-muted border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_id">Customer ID</Label>
                  <Input
                    id="customer_id"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="bg-card border-border text-foreground"
                    placeholder="CUST-XXX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-card border-border text-foreground"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchases">Purchases</Label>
                  <Input
                    id="purchases"
                    type="number"
                    value={formData.purchases}
                    onChange={(e) => setFormData({ ...formData, purchases: e.target.value })}
                    className="bg-card border-border text-foreground"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="total_spent">Total Spent (Rs.)</Label>
                  <Input
                    id="total_spent"
                    type="number"
                    value={formData.total_spent}
                    onChange={(e) => setFormData({ ...formData, total_spent: e.target.value })}
                    className="bg-card border-border text-foreground"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select 
                    value={formData.tier} 
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {tierBenefits.map(tier => (
                        <SelectItem key={tier.tier} value={tier.tier}>{tier.tier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={formData.eligible_for_offer}
                    onCheckedChange={(checked) => setFormData({ ...formData, eligible_for_offer: checked })}
                  />
                  <Label>Eligible for Offers</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Loyalty Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{customers.filter(c => ['Gold', 'Platinum'].includes(c.tier)).length}</p>
              <p className="text-xs text-muted-foreground">VIP Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Percent className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.discount_percent, 0) / customers.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Discount</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                Rs. {customers.reduce((sum, c) => sum + Math.round(c.total_spent * c.discount_percent / 100), 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Savings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {customers.reduce((sum, c) => sum + c.purchases, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Purchases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="customers">Loyalty Customers</TabsTrigger>
          <TabsTrigger value="tiers">Tier Benefits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(customer.tier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{customer.purchases}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        Rs. {customer.total_spent?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-green-400 font-medium">{customer.discount_percent}% OFF</span>
                          <span className="text-xs text-muted-foreground">
                            Save Rs. {Math.round(customer.total_spent * customer.discount_percent / 100).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getNextTier(customer.tier) ? (
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Next tier</span>
                              <span className="text-foreground">{customer.purchases}/{getNextTier(customer.tier)}</span>
                            </div>
                            <Progress value={calculateProgress(customer.purchases, customer.tier)} />
                          </div>
                        ) : (
                          <Badge variant="success">Max Tier</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.eligible_for_offer ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <Gift className="h-3 w-3" />
                            Eligible
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAddPurchase(customer.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            +1
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                            className="text-muted-foreground hover:text-red-500"
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

        <TabsContent value="tiers" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tierBenefits.map((tier) => (
              <Card key={tier.tier} className={`border-border ${
                tier.tier === 'Platinum' ? 'bg-slate-200' : 
                tier.tier === 'Gold' ? 'bg-yellow-500/10' : 
                'bg-card'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tier.tier === 'Platinum' && <Crown className="h-5 w-5 text-slate-900" />}
                      {tier.tier === 'Gold' && <Star className="h-5 w-5 text-yellow-400" />}
                      {(tier.tier === 'Silver' || tier.tier === 'Bronze') && <Gift className="h-5 w-5 text-muted-foreground" />}
                      <CardTitle className={`text-base ${tier.tier === 'Platinum' ? 'text-slate-900' : 'text-foreground'}`}>
                        {tier.tier}
                      </CardTitle>
                    </div>
                    <span className={`text-2xl font-bold ${
                      tier.tier === 'Platinum' ? 'text-slate-900' : 'text-foreground'
                    }`}>
                      {tier.discount}%
                    </span>
                  </div>
                  <p className={`text-sm ${tier.tier === 'Platinum' ? 'text-slate-600' : 'text-muted-foreground'}`}>
                    Minimum {tier.minPurchases} purchases
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-xs font-medium uppercase tracking-wider ${
                      tier.tier === 'Platinum' ? 'text-slate-600' : 'text-muted-foreground'
                    }`}>
                      Benefits
                    </p>
                    <ul className="space-y-2">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className={`flex items-center gap-2 text-sm ${
                          tier.tier === 'Platinum' ? 'text-slate-800' : 'text-foreground'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            tier.tier === 'Platinum' ? 'bg-slate-400' : 'bg-muted-foreground'
                          }`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`mt-4 pt-4 border-t ${
                    tier.tier === 'Platinum' ? 'border-slate-300' : 'border-border'
                  }`}>
                    <p className={`text-xs ${tier.tier === 'Platinum' ? 'text-slate-600' : 'text-muted-foreground'}`}>
                      Potential Savings
                    </p>
                    <p className={`text-lg font-semibold ${tier.tier === 'Platinum' ? 'text-slate-900' : 'text-green-400'}`}>
                      Up to {tier.discount}% off every order
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tierBenefits.map((tier) => {
                    const count = customers.filter(c => c.tier === tier.tier).length
                    const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0
                    return (
                      <div key={tier.tier} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-20">{tier.tier}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{count} customers</span>
                            <span className="text-foreground">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-zinc-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Loyalty Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-foreground">Revenue Impact</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Loyalty program members spend 35% more on average than regular customers
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium text-foreground">Redemption Rate</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      78% of eligible customers actively use their discounts at checkout
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-foreground">Retention</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gold and Platinum members have 92% retention rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
