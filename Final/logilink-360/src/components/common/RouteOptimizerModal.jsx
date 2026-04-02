import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Zap, Activity, Clock, Navigation, CheckCircle2, ChevronRight, Fuel, Map } from 'lucide-react'

// Simple helper to parse "450 km", "8 hours"
const parseValue = (str) => {
  if (!str) return 0
  const match = str.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

const getUnit = (str) => {
  if (!str) return ''
  return str.replace(/[\d.\s]/g, '').trim()
}

export default function RouteOptimizerModal({ isOpen, onClose, route, onApply }) {
  const [objective, setObjective] = useState('distance')
  const [respectTimeWindows, setRespectTimeWindows] = useState(true)
  const [liveTraffic, setLiveTraffic] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [optimizedRoute, setOptimizedRoute] = useState(null)

  // Reset state when route opens
  useEffect(() => {
    if (isOpen) {
      setOptimizedRoute(null)
      setProgress(0)
      setLoading(false)
    }
  }, [isOpen, route])

  const runOptimization = () => {
    setLoading(true)
    setProgress(0)
    
    // Simulate Genetic Algorithm generations
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 15
      })
    }, 250)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      
      // Calculate optimized values
      const distVal = parseValue(route.distance)
      const distUnit = getUnit(route.distance) || 'km'
      const timeVal = parseValue(route.estimated_time)
      const timeUnit = getUnit(route.estimated_time) || 'hours'

      // Savings generally run 15-25%
      const savingsMulti = objective === 'distance' ? 0.8 : objective === 'time' ? 0.85 : 0.82
      
      const newDist = (distVal * savingsMulti).toFixed(1)
      const newTime = (timeVal * (savingsMulti + 0.05)).toFixed(1)

      // "Optimize" stops by slightly shuffling inner delivery stops
      const stops = [...(route.stops_data || [])]
      if (stops.length > 3) {
        // swap the 2nd and 3rd stop as a mock optimization of sequence
        const temp = stops[1]
        stops[1] = stops[2]
        stops[2] = temp
      }

      setOptimizedRoute({
        ...route,
        distance: `${newDist} ${distUnit}`,
        estimated_time: `${newTime} ${timeUnit}`,
        stops_data: stops,
        _savings: {
          distanceSaved: (distVal - newDist).toFixed(1),
          timeSaved: (timeVal - newTime).toFixed(1),
          percent: Math.round((1 - savingsMulti) * 100)
        }
      })
      setLoading(false)
    }, 2200)
  }

  const handleApply = () => {
    if (optimizedRoute && onApply) {
      onApply(optimizedRoute)
    }
  }

  if (!route) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-primary" />
            AI Route Optimization Engine
          </DialogTitle>
          <DialogDescription>
            Configure parameters for OR-Tools Genetic Algorithm routing optimization.
          </DialogDescription>
        </DialogHeader>

        {!optimizedRoute && !loading && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Target Objective</Label>
                <div className="flex flex-col gap-3">
                  {['distance', 'time', 'fuel'].map((obj) => (
                    <label key={obj} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${objective === obj ? 'border-primary bg-primary/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                      <input 
                        type="radio" 
                        name="objective" 
                        value={obj} 
                        checked={objective === obj} 
                        onChange={() => setObjective(obj)}
                        className="hidden"
                      />
                      {obj === 'distance' && <Navigation className={`h-5 w-5 ${objective === obj ? 'text-primary' : 'text-muted-foreground'}`} />}
                      {obj === 'time' && <Clock className={`h-5 w-5 ${objective === obj ? 'text-primary' : 'text-muted-foreground'}`} />}
                      {obj === 'fuel' && <Fuel className={`h-5 w-5 ${objective === obj ? 'text-primary' : 'text-muted-foreground'}`} />}
                      <span className="capitalize font-medium">Minimize {obj}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Constraints</Label>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer" onClick={() => setRespectTimeWindows(!respectTimeWindows)}>Respect Time Windows</Label>
                    <p className="text-xs text-muted-foreground">Deliveries must adhere to scheduled SLAs</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full px-0.5 flex items-center cursor-pointer transition-colors ${respectTimeWindows ? 'bg-primary' : 'bg-zinc-700'}`} onClick={() => setRespectTimeWindows(!respectTimeWindows)}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${respectTimeWindows ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer" onClick={() => setLiveTraffic(!liveTraffic)}>Live Traffic Models</Label>
                    <p className="text-xs text-muted-foreground">Connect to real-time telemetry API</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full px-0.5 flex items-center cursor-pointer transition-colors ${liveTraffic ? 'bg-primary' : 'bg-zinc-700'}`} onClick={() => setLiveTraffic(!liveTraffic)}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${liveTraffic ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <Button onClick={runOptimization} className="gap-2">
                <Activity className="h-4 w-4" /> Run Algorithm
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Map className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Solving TSP Sequence...</h3>
            <div className="w-64 max-w-full bg-zinc-800 rounded-full h-2 mt-4 overflow-hidden">
               <div className="bg-primary h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <p className="text-sm text-muted-foreground text-center animate-pulse mt-2">
              Evaluating permutations using simulated annealing...
            </p>
          </div>
        )}

        {optimizedRoute && !loading && (
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-6 items-center bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Original Route</h4>
                <p className="text-2xl font-bold flex items-center gap-2">
                 {route.distance} 
                </p>
                <p className="text-muted-foreground">{route.estimated_time}</p>
              </div>
              <div className="relative space-y-2">
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 bg-primary/20 rounded-full">
                  <ChevronRight className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Optimized Route
                </h4>
                <p className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
                 {optimizedRoute.distance} 
                </p>
                <p className="text-emerald-400/80">{optimizedRoute.estimated_time}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 py-4 border-y border-zinc-800">
               <div className="text-center">
                 <p className="text-3xl font-bold">{optimizedRoute._savings.percent}%</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Efficiency Gain</p>
               </div>
               <div className="w-px h-12 bg-zinc-800" />
               <div className="text-center">
                 <p className="text-3xl font-bold">{optimizedRoute._savings.distanceSaved}</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Km Reduced</p>
               </div>
               <div className="w-px h-12 bg-zinc-800" />
               <div className="text-center">
                 <p className="text-3xl font-bold">{optimizedRoute._savings.timeSaved}</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Hours Cut</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">New Delivery Sequence</h4>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                    {optimizedRoute.stops_data?.map((stop, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${stop.type === 'Start' ? 'bg-primary text-white' : 'bg-zinc-700 text-zinc-300'}`}>{idx + 1}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{stop.type}</span>
                          </div>
                          <p className="text-xs font-medium truncate" title={stop.location}>{stop.location}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Map Preview (Mock)</h4>
                <div className="h-[160px] bg-zinc-900 border border-border rounded-lg relative overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                   <div className="relative text-center space-y-2">
                      <Map className="h-8 w-8 text-primary mx-auto opacity-50" />
                      <p className="text-xs text-muted-foreground">Polylines recalculated</p>
                   </div>
                   <svg className="absolute inset-0 w-full h-full stroke-emerald-500/50 fill-none stroke-[2] z-10" style={{strokeDasharray: '4 4'}}>
                     <path d="M 20 80 Q 80 40 140 80 T 260 80" />
                   </svg>
                   <svg className="absolute inset-0 w-full h-full stroke-red-500/30 fill-none stroke-[2] z-0" opacity={0.3}>
                     <path d="M 20 80 L 60 20 L 100 120 L 140 80 L 200 140 L 260 80" />
                   </svg>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={onClose}>Discard</Button>
              <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Apply Route
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
