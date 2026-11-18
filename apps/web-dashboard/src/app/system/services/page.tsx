"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  Cpu, 
  Database, 
  Activity, 
  Zap, 
  ShieldCheck, 
  RefreshCcw,
  BarChart3,
  Layers
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"

const services = [
  { name: 'Facial Extraction Engine', status: 'Operational', uptime: '99.99%', latency: '42ms', load: '12%', icon: Cpu },
  { name: 'Biometric Matcher (V4)', status: 'Operational', uptime: '99.95%', latency: '156ms', load: '65%', icon: Layers },
  { name: 'Motion Analytics API', status: 'Operational', uptime: '98.42%', latency: '12ms', load: '8%', icon: Activity },
  { name: 'Geospatial Coordinator', status: 'Operational', uptime: '100%', latency: '5ms', load: '2%', icon: ShieldCheck },
  { name: 'Missing Persons DB', status: 'Operational', uptime: '99.99%', latency: '24ms', load: '42%', icon: Database },
  { name: 'Neural Network Cluster A', status: 'Operational', uptime: '99.12%', latency: '85ms', load: '38%', icon: Zap },
]

export default function ServicesPage() {
  const { toast } = useToast()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Intelligence & System Services</h1>
          <p className="text-sm text-muted-foreground">Live telemetry and operational performance monitoring of backend AI modules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => toast('Re-synchronizing AI clusters with GPU host', 'info')} className="text-xs active:scale-[0.98]">
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            Sync Clusters
          </Button>
          <Button size="sm" onClick={() => toast('Telemetry performance report generated', 'success')} className="text-xs active:scale-[0.98]">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Telemetry Metrics
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => (
          <Card key={service.name} className="relative overflow-hidden shadow-sm hover:border-border/80 transition-all">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-secondary rounded-lg">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={service.status === 'Operational' ? 'default' : 'destructive'} className="text-[11px]">
                  {service.status}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3 text-foreground">{service.name}</CardTitle>
              <CardDescription className="text-xs font-mono">Module Status: Active</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-0.5">
                     <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Uptime</p>
                     <p className="text-sm font-semibold text-foreground font-mono">{service.uptime}</p>
                   </div>
                   <div className="space-y-0.5">
                     <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Latency</p>
                     <p className="text-sm font-semibold text-foreground font-mono">{service.latency}</p>
                   </div>
                 </div>
                 
                 <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Load / Traffic</span>
                      <span className="text-[11px] font-mono text-foreground">{service.load}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary transition-all duration-300"
                         style={{ width: service.load }}
                       />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Infrastructure Telemetry Terminal */}
      <Card className="bg-card">
         <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-base text-foreground">Infrastructure Event Stream</CardTitle>
            <CardDescription className="text-xs">Live socket event loop heartbeats</CardDescription>
         </CardHeader>
         <CardContent className="pt-3">
            <div className="font-mono text-xs text-muted-foreground space-y-1.5">
               <p>[18:15:01] Service &apos;Facial Extraction&apos; processing video frames at nominal throughput.</p>
               <p>[18:14:55] Biometric Matcher vector index synced with PostgreSQL pgvector (128-dim).</p>
               <p>[18:14:30] Telemetry beacon loop running across active patrol units on port 8000.</p>
               <p className="text-primary font-semibold">[18:15:15] Listening for incoming surveillance CCTV stream packets...</p>
            </div>
         </CardContent>
      </Card>
    </div>
  )
}
