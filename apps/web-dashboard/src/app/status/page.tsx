"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  Clock, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Radio,
  Plus,
  Navigation,
  UserCheck
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { useWebSocket } from '@/lib/websocket'

type Unit = {
  id: string
  officer: string
  location: string
  time: string
  type: 'Interceptor' | 'Rapid Patrol' | 'Surveillance' | 'K9 Unit'
  target?: string
  task?: string
}

type Column = {
  id: 'standby' | 'enroute' | 'onsite'
  title: string
  description: string
  units: Unit[]
}

const initialColumns: Column[] = [
  {
    id: 'standby',
    title: 'Standby / Ready',
    description: 'Units available for immediate vector dispatch',
    units: [
      { id: 'UNIT-042', officer: 'Surya Pratap (Inspector)', location: 'Sector Alpha Command Post', time: 'Since 17:15', type: 'Rapid Patrol' },
      { id: 'UNIT-075', officer: 'Rohit Deshmukh (Constable)', location: 'Marine Lines Staging Bay', time: 'Since 16:40', type: 'Interceptor' },
      { id: 'UNIT-019', officer: 'Kavita Nair (Sub-Inspector)', location: 'Bandra West Mobile HQ', time: 'Since 17:30', type: 'Surveillance' },
    ]
  },
  {
    id: 'enroute',
    title: 'En Route',
    description: 'Units converging on flagged sighting coordinates',
    units: [
      { id: 'UNIT-108', officer: 'Arjun Mehta (Officer)', location: 'CST Platform 4 Approach', target: 'Vikram Singh (WP-11202)', time: 'ETA 4 mins', type: 'Rapid Patrol' },
      { id: 'UNIT-033', officer: 'Sanjay Rawat (Patrol)', location: 'Colaba Causeway Junction', target: 'Ravi Verma (Lead #884)', time: 'ETA 7 mins', type: 'Surveillance' },
    ]
  },
  {
    id: 'onsite',
    title: 'On Site / Active',
    description: 'Units actively conducting field perimeter search',
    units: [
      { id: 'UNIT-061', officer: 'Vikram Jadhav (Senior SI)', location: 'Marine Drive Promenade', task: 'Ground search for Aarav Mehta (MP-23854)', time: 'Active 28 mins', type: 'Interceptor' },
      { id: 'UNIT-088', officer: 'Deepak Patil (Officer)', location: 'Andheri Concourse Entry', task: 'CCTV physical point-of-interest lockdown', time: 'Active 42 mins', type: 'Surveillance' },
    ]
  }
]

export default function StatusPage() {
  const { toast } = useToast()
  const { lastMessage } = useWebSocket()
  const [columns, setColumns] = useState<Column[]>(initialColumns)

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'telemetry') return
    const data = lastMessage.data || {}
    const unitId = lastMessage.unit_id || data.officer_id || 'UNIT-042'
    const officerName = data.officer_name || `Inspector ${unitId}`
    const location = (data.lat != null && data.lng != null)
      ? `${Number(data.lat).toFixed(4)}° N, ${Number(data.lng).toFixed(4)}° E`
      : 'Active GPS Field Vector'

    setColumns((prev) => {
      const exists = prev.some((col) => col.units.some((u) => u.id === unitId))
      if (exists) {
        return prev.map((col) => ({
          ...col,
          units: col.units.map((u) => u.id === unitId ? { ...u, location, time: 'Live Stream' } : u)
        }))
      }
      return prev.map((col) => {
        if (col.id === 'onsite') {
          return {
            ...col,
            units: [
              {
                id: unitId,
                officer: officerName,
                location,
                time: 'Live Stream',
                type: 'Rapid Patrol',
                task: 'Live GPS Field Telemetry Stream Active'
              },
              ...col.units
            ]
          }
        }
        return col
      })
    })
  }, [lastMessage])

  const handleMoveUnit = (unitId: string, fromColId: string, toColId: 'standby' | 'enroute' | 'onsite') => {
    setColumns((prev) => {
      let unitToMove: Unit | undefined
      const next = prev.map((col) => {
        if (col.id === fromColId) {
          unitToMove = col.units.find((u) => u.id === unitId)
          return { ...col, units: col.units.filter((u) => u.id !== unitId) }
        }
        return col
      })

      if (!unitToMove) return prev

      return next.map((col) => {
        if (col.id === toColId) {
          return { ...col, units: [...col.units, unitToMove!] }
        }
        return col
      })
    })

    toast(`Unit ${unitId} redeployed to ${toColId.toUpperCase()}`, 'success')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tactical Response Board</h1>
          <p className="text-sm text-muted-foreground">Live operational Kanban of patrol unit deployments, dispatch states, and on-site missions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => toast('Broadcasting ping to all active patrol beacons', 'info')} className="text-xs active:scale-[0.98]">
            <Radio className="w-3.5 h-3.5 mr-1.5 text-secondary" />
            Beacon All Units
          </Button>
          <Button size="sm" onClick={() => toast('New incident dispatch wizard opened', 'info')} className="text-xs active:scale-[0.98]">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Incident
          </Button>
        </div>
      </div>

      {/* 3-Column Kanban Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-3 bg-secondary/20 rounded-xl p-4 border border-border">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">{column.title}</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
                    {column.units.length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{column.description}</p>
              </div>
            </div>

            {/* Units Stack */}
            <div className="flex-1 space-y-3 min-h-[300px]">
              {column.units.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg bg-card/20">
                  No units in {column.title}
                </div>
              ) : (
                column.units.map((unit) => (
                  <Card key={unit.id} className="hover:border-primary/50 transition-all shadow-sm">
                    <CardContent className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs text-foreground bg-secondary/50">
                            {unit.id}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {unit.type}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            column.id === 'onsite'
                              ? 'bg-status-active'
                              : column.id === 'enroute'
                              ? 'bg-status-warning'
                              : 'bg-secondary'
                          )}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-primary" />
                          {unit.officer}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">{unit.location}</span>
                        </p>
                      </div>

                      {unit.target && (
                        <div className="p-2 bg-secondary/40 rounded border border-border text-xs text-foreground flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">Target: {unit.target}</span>
                        </div>
                      )}

                      {unit.task && (
                        <div className="p-2 bg-secondary/40 rounded border border-border text-xs text-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-status-active shrink-0" />
                          <span className="truncate">{unit.task}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {unit.time}
                        </span>

                        {/* Quick State Shifter */}
                        <div className="flex items-center gap-1">
                          {column.id !== 'enroute' && (
                            <button
                              onClick={() => handleMoveUnit(unit.id, column.id, 'enroute')}
                              className="px-2 py-0.5 text-[10px] rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-all active:scale-95"
                              title="Set En Route"
                            >
                              Dispatch
                            </button>
                          )}
                          {column.id !== 'onsite' && (
                            <button
                              onClick={() => handleMoveUnit(unit.id, column.id, 'onsite')}
                              className="px-2 py-0.5 text-[10px] rounded bg-status-active/20 hover:bg-status-active/30 text-status-active border border-status-active/30 cursor-pointer transition-all active:scale-95"
                              title="Mark On Site"
                            >
                              On Site
                            </button>
                          )}
                          {column.id !== 'standby' && (
                            <button
                              onClick={() => handleMoveUnit(unit.id, column.id, 'standby')}
                              className="px-2 py-0.5 text-[10px] rounded bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border cursor-pointer transition-all active:scale-95"
                              title="Recall to Standby"
                            >
                              Standby
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
