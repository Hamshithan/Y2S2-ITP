import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Route,
  MapPin,
  Star,
  Gift,
  ChevronLeft,
  ChevronRight,
  Box
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/fleet', label: 'Fleet Management', icon: Truck },
  { path: '/drivers', label: 'Driver Management', icon: Users },
  { path: '/parcels', label: 'Parcel Management', icon: Package },
  { path: '/dispatch', label: 'Dispatch', icon: Route },
  { path: '/routes', label: 'Route Management', icon: MapPin },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/loyalty', label: 'Loyalty', icon: Gift },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border shadow-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Box className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-foreground tracking-tight">
                LogiLink 360
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          {!collapsed && (
            <div className="text-xs text-muted-foreground">
              <p>LogiLink 360 v1.0</p>
              <p className="mt-1">Fleet & Parcel Ecosystem</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
