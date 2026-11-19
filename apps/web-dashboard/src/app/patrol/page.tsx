"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ShieldAlert, Crosshair, Map as MapIcon, Battery, Navigation, Radio, Zap, MoreVertical, Smartphone, Cpu, Wifi, X, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useWebSocket } from '@/lib/websocket'

import dynamic from 'next/dynamic'

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  os_version: string;
  model: string;
  brand: string;
  app_version: string;
  is_emulator: boolean;
}

export interface PatrolUnit {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  battery: number;
  charging: boolean;
  status: string;
  lastUpdate: Date;
  device_info?: DeviceInfo;
}

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-border rounded-xl">
      <MapIcon className="w-12 h-12 text-muted-foreground/50 animate-pulse" />
    </div>
  )
})

export default function PatrolBoard() {
  const { lastMessage, isConnected } = useWebSocket()
  const [selectedDeviceUnit, setSelectedDeviceUnit] = useState<PatrolUnit | null>(null)
  const [units, setUnits] = useState<Record<string, PatrolUnit>>({
    'unit-101': {
      id: 'unit-101',
      name: 'Patrol Alpha (Officer Arjun)',
      lat: 12.9716,
      lng: 77.5946,
      battery: 88,
      charging: false,
      status: 'Active Patrol',
      lastUpdate: new Date()
    },
    'unit-102': {
      id: 'unit-102',
      name: 'Patrol Bravo (Inspector Priya)',
      lat: 12.9784,
      lng: 77.6012,
      battery: 64,
      charging: false,
      status: 'Active Patrol',
      lastUpdate: new Date()
    },
    'unit-103': {
      id: 'unit-103',
      name: 'Rapid Response (Inspector Vikram)',
      lat: 12.9650,
      lng: 77.5890,
      battery: 92,
      charging: true,
      status: 'Responding',
      lastUpdate: new Date()
    }
  })
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'telemetry') {
      const data = lastMessage.data

      if (data.event_type === 'DUTY_OFF' || data.status === 'OFF DUTY') {
        setUnits(prev => {
          const updated = { ...prev }
          delete updated[lastMessage.unit_id]
          return updated
        })
      } else {
        const lat = data.lat ?? data.gps?.lat ?? null
        const lng = data.lng ?? data.gps?.lng ?? null

        setUnits(prev => {
          // If previous only contained the 3 static demo units, clear them on first real field telemetry
          const isInitialMockOnly = Object.keys(prev).every(k => ['unit-101', 'unit-102', 'unit-103'].includes(k))
          const base = isInitialMockOnly ? {} : { ...prev }
          const devInfo = data.device_info || (data.platform ? {
            platform: data.platform,
            os_version: data.os_version || `${data.platform.toUpperCase()} Device`,
            model: data.model || 'Field Terminal',
            brand: data.brand || 'Mobile',
            app_version: '2.1.0-alpha',
            is_emulator: false
          } : undefined)

          return {
            ...base,
            [lastMessage.unit_id]: {
              id: lastMessage.unit_id,
              name: data.officer_name || `Unit ${lastMessage.unit_id.substring(0, 8).toUpperCase()}`,
              lat,
              lng,
              battery: data.battery ?? 0,
              charging: data.charging ?? false,
              status: data.status === 'on_duty' ? 'Active Patrol' : data.status || 'Active Patrol',
              lastUpdate: new Date(),
              device_info: devInfo
            }
          }
        })

        // Auto-focus incoming real unit on the map if not already focused
        if (lat != null && lng != null) {
          setFocusedLocation(prev => prev ?? [lat, lng])
        }
      }
    }
  }, [lastMessage])

  // Simple cleanup of old units
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      setUnits(prev => {
        const updated = { ...prev }
        let changed = false
        for (const [id, unit] of Object.entries(updated)) {
          if (now - unit.lastUpdate.getTime() > 60000) { // older than 60s
            delete updated[id]
            changed = true
          }
        }
        return changed ? updated : prev
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const unitList = Object.values(units)

  const handleUnitClick = (unit: PatrolUnit) => {
    if (unit.lat != null && unit.lng != null) {
      setFocusedLocation([unit.lat, unit.lng])
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patrol & Response Fleet</h1>
          <div className="text-muted-foreground flex items-center gap-2 mt-2">
            Live tactical deployment tracking.
            <Badge variant={isConnected ? "success" : "destructive"}>
              {isConnected ? "Telemetry Active" : "Telemetry Offline"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-border">
          <LiveMap units={unitList} focusedLocation={focusedLocation} />
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <h3 className="font-semibold uppercase tracking-wider text-sm text-muted-foreground mb-4">Deployed Units ({unitList.length})</h3>
          
          {unitList.length === 0 ? (
            <Card className="bg-secondary/20 border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No telemetry signals received.
              </CardContent>
            </Card>
          ) : (
            unitList.map(unit => (
              <Card 
                key={unit.id} 
                onClick={() => handleUnitClick(unit)}
                className={cn(
                  "transition-all cursor-pointer hover:border-primary/60",
                  unit.status === 'Offline' ? "opacity-50" : "border-primary/30 bg-primary/5"
                )}
              >
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{unit.name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={unit.status === 'Offline' ? 'secondary' : 'success'}>{unit.status}</Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDeviceUnit(unit)
                        }}
                        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="View Device Specifications"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> Location
                      </span>
                      <span className="font-mono">
                        {unit.lat != null ? unit.lat.toFixed(4) : 'N/A'}, {unit.lng != null ? unit.lng.toFixed(4) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Battery className="w-3 h-3" /> Power
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full",
                            unit.charging ? "bg-green-400 animate-pulse" : unit.battery > 50 ? "bg-green-500" : unit.battery > 20 ? "bg-yellow-500" : "bg-red-500"
                          )} style={{ width: `${unit.battery}%` }}></div>
                        </div>
                        <span className="font-mono flex items-center gap-1">
                          {unit.battery}%
                          {unit.charging && <Zap className="w-3 h-3 text-green-400 fill-green-400" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Device Specifications Modal */}
      {selectedDeviceUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-foreground">{selectedDeviceUnit.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">ID: {selectedDeviceUnit.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeviceUnit(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-primary" /> Platform
                  </div>
                  <div className="font-semibold text-xs text-foreground capitalize flex items-center gap-1.5">
                    <Badge variant={selectedDeviceUnit.device_info?.platform === 'ios' ? 'default' : 'secondary'} className="text-[10px] py-0">
                      {selectedDeviceUnit.device_info?.platform?.toUpperCase() || 'MOBILE'}
                    </Badge>
                    {selectedDeviceUnit.device_info?.is_emulator && (
                      <span className="text-[10px] text-amber-400 font-mono">[EMU]</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-primary" /> Hardware Model
                  </div>
                  <div className="font-semibold text-xs text-foreground truncate" title={selectedDeviceUnit.device_info?.model || 'Mobile Terminal'}>
                    {selectedDeviceUnit.device_info?.model || 'Field Device'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-primary" /> OS Version
                  </div>
                  <div className="font-semibold text-xs font-mono text-foreground">
                    {selectedDeviceUnit.device_info?.os_version || 'Android / iOS'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-primary" /> App Version
                  </div>
                  <div className="font-semibold text-xs font-mono text-foreground">
                    v{selectedDeviceUnit.device_info?.app_version || '2.1.0-alpha'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" /> GPS Coordinates
                  </span>
                  <span className="font-mono text-foreground font-semibold">
                    {selectedDeviceUnit.lat != null ? selectedDeviceUnit.lat.toFixed(5) : 'N/A'}, {selectedDeviceUnit.lng != null ? selectedDeviceUnit.lng.toFixed(5) : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Battery className="w-3.5 h-3.5" /> Power Status
                  </span>
                  <span className="font-mono text-foreground flex items-center gap-1.5 font-semibold">
                    {selectedDeviceUnit.battery}%
                    {selectedDeviceUnit.charging ? ' (Charging)' : ' (Discharging)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Last Telemetry Beat
                  </span>
                  <span className="font-mono text-foreground">
                    {new Date(selectedDeviceUnit.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setSelectedDeviceUnit(null)}
              >
                Close Specifications
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
