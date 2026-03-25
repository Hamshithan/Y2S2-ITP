import { useState, useEffect } from 'react'
import { Truck, Users, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/common/StatCard'
import { dashboardAPI } from '@/services/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    parcelsInTransit: 0,
    completedDeliveries: 0
  })
  const [recentDeliveries, setRecentDeliveries] = useState([])
  const [fleetStatus, setFleetStatus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, deliveriesData, fleetData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentDeliveries(),
          dashboardAPI.getFleetStatus()
        ])
        setStats(statsData)
        setRecentDeliveries(deliveriesData)
        setFleetStatus(fleetData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to LogiLink 360 Fleet Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles.toString()}
          description="Fleet size"
          icon={Truck}
          trend={5}
        />
        <StatCard
          title="Active Drivers"
          value={stats.activeDrivers.toString()}
          description="Currently on duty"
          icon={Users}
          trend={8}
        />
        <StatCard
          title="Parcels In Transit"
          value={stats.parcelsInTransit.toLocaleString()}
          description="Active deliveries"
          icon={Package}
          trend={12}
        />
        <StatCard
          title="Completed Deliveries"
          value={stats.completedDeliveries.toLocaleString()}
          description="This month"
          icon={CheckCircle}
          trend={15}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Avg Delivery Time"
          value="2.4 hrs"
          description="Per parcel"
          icon={Clock}
        />
        <StatCard
          title="Fleet Utilization"
          value={`${Math.round((stats.activeDrivers / (stats.totalVehicles || 1)) * 100)}%`}
          description="Capacity usage"
          icon={TrendingUp}
        />
        <StatCard
          title="On-Time Rate"
          value="94.2%"
         description="Delivery performance"
          icon={CheckCircle}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeliveries.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.id}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                      item.status === 'In Transit' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {item.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fleetStatus.slice(0, 4).map((item) => (
                <div key={item.vehicle} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.vehicle}</p>
                      <p className="text-xs text-muted-foreground">{item.driver}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  {item.status === 'Active' && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
