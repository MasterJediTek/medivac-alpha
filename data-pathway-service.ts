/**
 * MediVac WACHS Data Pathway Color Coding Service
 * Visualizes data flow through all system pathways with color coding
 */

import { DATA_PATHWAY_COLORS } from "./color-chart-service";

// ============================================================================
// TYPES
// ============================================================================
export type PathwayType = keyof typeof DATA_PATHWAY_COLORS;

export interface DataFlowEvent {
  id: string;
  timestamp: Date;
  pathway: PathwayType;
  source: string;
  destination: string;
  dataType: string;
  size: number; // bytes
  duration: number; // ms
  status: "pending" | "in_progress" | "completed" | "failed";
  direction: "inbound" | "outbound" | "bidirectional";
  metadata?: Record<string, unknown>;
}

export interface PathwayHealth {
  pathway: PathwayType;
  status: "healthy" | "degraded" | "offline" | "unknown";
  latency: number; // ms
  throughput: number; // bytes/sec
  errorRate: number; // percentage
  lastChecked: Date;
  uptime: number; // percentage
}

export interface PathwayNode {
  id: string;
  name: string;
  type: "source" | "cache" | "storage" | "api" | "sync" | "destination";
  pathway: PathwayType;
  position: { x: number; y: number };
  connections: string[];
}

export interface PathwayConnection {
  id: string;
  from: string;
  to: string;
  pathway: PathwayType;
  animated: boolean;
  bidirectional: boolean;
  bandwidth: number; // bytes/sec
}

export interface PathwayAnalytics {
  pathway: PathwayType;
  totalEvents: number;
  totalDataTransferred: number; // bytes
  averageLatency: number; // ms
  successRate: number; // percentage
  peakThroughput: number; // bytes/sec
  lastActivity: Date | null;
}

// ============================================================================
// DEFAULT PATHWAY TOPOLOGY
// ============================================================================
export const DEFAULT_PATHWAY_NODES: PathwayNode[] = [
  // User Interface Layer
  { id: "ui", name: "User Interface", type: "source", pathway: "l1_cache", position: { x: 50, y: 50 }, connections: ["l1_cache"] },
  
  // Cache Layers
  { id: "l1_cache", name: "L1 Memory Cache", type: "cache", pathway: "l1_cache", position: { x: 200, y: 50 }, connections: ["l2_async", "ui"] },
  { id: "l2_async", name: "L2 AsyncStorage", type: "storage", pathway: "l2_async", position: { x: 350, y: 50 }, connections: ["l1_cache", "l3_s3"] },
  { id: "l3_s3", name: "L3 S3 Cloud", type: "storage", pathway: "l3_s3", position: { x: 500, y: 50 }, connections: ["l2_async", "jedi_hub"] },
  
  // Real-time Layer
  { id: "websocket", name: "WebSocket Server", type: "api", pathway: "websocket", position: { x: 200, y: 150 }, connections: ["ui", "jedi_hub"] },
  
  // API Layer
  { id: "rest_api", name: "REST API", type: "api", pathway: "api_rest", position: { x: 350, y: 150 }, connections: ["l2_async", "external"] },
  
  // JEDI Systems
  { id: "jedi_hub", name: "JEDI Hub", type: "sync", pathway: "jedi_sync", position: { x: 500, y: 150 }, connections: ["l3_s3", "websocket", "smpo"] },
  
  // External Systems
  { id: "external", name: "External APIs", type: "destination", pathway: "api_rest", position: { x: 350, y: 250 }, connections: ["rest_api"] },
  { id: "smpo", name: "SMPO.ink Protocol", type: "sync", pathway: "smpo_protocol", position: { x: 500, y: 250 }, connections: ["jedi_hub"] },
  
  // Offline Queue
  { id: "offline_queue", name: "Offline Queue", type: "storage", pathway: "offline_queue", position: { x: 200, y: 250 }, connections: ["l2_async", "tentacle"] },
  
  // Tentacle Sync
  { id: "tentacle", name: "Tentacle Sync", type: "sync", pathway: "tentacle_sync", position: { x: 350, y: 350 }, connections: ["offline_queue", "jedi_hub"] },
];

export const DEFAULT_PATHWAY_CONNECTIONS: PathwayConnection[] = [
  { id: "ui-l1", from: "ui", to: "l1_cache", pathway: "l1_cache", animated: true, bidirectional: true, bandwidth: 1000000000 },
  { id: "l1-l2", from: "l1_cache", to: "l2_async", pathway: "l2_async", animated: true, bidirectional: true, bandwidth: 100000000 },
  { id: "l2-l3", from: "l2_async", to: "l3_s3", pathway: "l3_s3", animated: true, bidirectional: true, bandwidth: 10000000 },
  { id: "ui-ws", from: "ui", to: "websocket", pathway: "websocket", animated: true, bidirectional: true, bandwidth: 50000000 },
  { id: "ws-jedi", from: "websocket", to: "jedi_hub", pathway: "jedi_sync", animated: true, bidirectional: true, bandwidth: 50000000 },
  { id: "l3-jedi", from: "l3_s3", to: "jedi_hub", pathway: "jedi_sync", animated: true, bidirectional: true, bandwidth: 10000000 },
  { id: "l2-api", from: "l2_async", to: "rest_api", pathway: "api_rest", animated: false, bidirectional: true, bandwidth: 10000000 },
  { id: "api-ext", from: "rest_api", to: "external", pathway: "api_rest", animated: false, bidirectional: true, bandwidth: 5000000 },
  { id: "jedi-smpo", from: "jedi_hub", to: "smpo", pathway: "smpo_protocol", animated: true, bidirectional: true, bandwidth: 10000000 },
  { id: "l2-offline", from: "l2_async", to: "offline_queue", pathway: "offline_queue", animated: false, bidirectional: true, bandwidth: 100000000 },
  { id: "offline-tentacle", from: "offline_queue", to: "tentacle", pathway: "tentacle_sync", animated: true, bidirectional: true, bandwidth: 10000000 },
  { id: "tentacle-jedi", from: "tentacle", to: "jedi_hub", pathway: "tentacle_sync", animated: true, bidirectional: true, bandwidth: 10000000 },
];

// ============================================================================
// DATA PATHWAY SERVICE
// ============================================================================
class DataPathwayService {
  private flowEvents: DataFlowEvent[] = [];
  private pathwayHealth: Map<PathwayType, PathwayHealth> = new Map();
  private listeners: Set<() => void> = new Set();
  private nodes: PathwayNode[] = [...DEFAULT_PATHWAY_NODES];
  private connections: PathwayConnection[] = [...DEFAULT_PATHWAY_CONNECTIONS];

  constructor() {
    this.initializeHealth();
  }

  private initializeHealth(): void {
    const pathways: PathwayType[] = [
      "l1_cache", "l2_async", "l3_s3", "websocket", "api_rest",
      "jedi_sync", "offline_queue", "tentacle_sync", "smpo_protocol"
    ];

    pathways.forEach(pathway => {
      this.pathwayHealth.set(pathway, {
        pathway,
        status: "healthy",
        latency: Math.random() * 50 + 5,
        throughput: Math.random() * 10000000 + 1000000,
        errorRate: Math.random() * 2,
        lastChecked: new Date(),
        uptime: 99 + Math.random(),
      });
    });
  }

  // Get pathway color
  getPathwayColor(pathway: PathwayType): string {
    return DATA_PATHWAY_COLORS[pathway]?.hex || "#6B7280";
  }

  // Get pathway info
  getPathwayInfo(pathway: PathwayType): typeof DATA_PATHWAY_COLORS[PathwayType] | null {
    return DATA_PATHWAY_COLORS[pathway] || null;
  }

  // Get all pathways
  getAllPathways(): Array<{ key: PathwayType; info: typeof DATA_PATHWAY_COLORS[PathwayType] }> {
    return Object.entries(DATA_PATHWAY_COLORS).map(([key, info]) => ({
      key: key as PathwayType,
      info,
    }));
  }

  // Record data flow event
  recordFlowEvent(event: Omit<DataFlowEvent, "id" | "timestamp">): DataFlowEvent {
    const newEvent: DataFlowEvent = {
      ...event,
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    this.flowEvents.push(newEvent);
    this.notify();
    return newEvent;
  }

  // Get recent flow events
  getRecentFlowEvents(limit: number = 100): DataFlowEvent[] {
    return this.flowEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get flow events by pathway
  getFlowEventsByPathway(pathway: PathwayType): DataFlowEvent[] {
    return this.flowEvents.filter(e => e.pathway === pathway);
  }

  // Get pathway health
  getPathwayHealth(pathway: PathwayType): PathwayHealth | null {
    return this.pathwayHealth.get(pathway) || null;
  }

  // Get all pathway health
  getAllPathwayHealth(): PathwayHealth[] {
    return Array.from(this.pathwayHealth.values());
  }

  // Update pathway health
  updatePathwayHealth(pathway: PathwayType, health: Partial<PathwayHealth>): void {
    const existing = this.pathwayHealth.get(pathway);
    if (existing) {
      this.pathwayHealth.set(pathway, {
        ...existing,
        ...health,
        lastChecked: new Date(),
      });
      this.notify();
    }
  }

  // Get pathway nodes
  getNodes(): PathwayNode[] {
    return this.nodes;
  }

  // Get pathway connections
  getConnections(): PathwayConnection[] {
    return this.connections;
  }

  // Get pathway analytics
  getPathwayAnalytics(pathway: PathwayType): PathwayAnalytics {
    const events = this.getFlowEventsByPathway(pathway);
    const completedEvents = events.filter(e => e.status === "completed");
    
    return {
      pathway,
      totalEvents: events.length,
      totalDataTransferred: events.reduce((sum, e) => sum + e.size, 0),
      averageLatency: completedEvents.length > 0
        ? completedEvents.reduce((sum, e) => sum + e.duration, 0) / completedEvents.length
        : 0,
      successRate: events.length > 0
        ? (completedEvents.length / events.length) * 100
        : 100,
      peakThroughput: Math.max(...events.map(e => e.size / (e.duration / 1000)), 0),
      lastActivity: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  }

  // Get all pathway analytics
  getAllPathwayAnalytics(): PathwayAnalytics[] {
    const pathways: PathwayType[] = [
      "l1_cache", "l2_async", "l3_s3", "websocket", "api_rest",
      "jedi_sync", "offline_queue", "tentacle_sync", "smpo_protocol"
    ];
    return pathways.map(p => this.getPathwayAnalytics(p));
  }

  // Get overall system health
  getSystemHealth(): {
    overallStatus: "healthy" | "degraded" | "critical";
    healthyPathways: number;
    degradedPathways: number;
    offlinePathways: number;
    averageLatency: number;
    totalThroughput: number;
  } {
    const healthArray = Array.from(this.pathwayHealth.values());
    const healthy = healthArray.filter(h => h.status === "healthy").length;
    const degraded = healthArray.filter(h => h.status === "degraded").length;
    const offline = healthArray.filter(h => h.status === "offline").length;

    let overallStatus: "healthy" | "degraded" | "critical" = "healthy";
    if (offline > 0 || degraded > healthArray.length / 2) {
      overallStatus = "critical";
    } else if (degraded > 0) {
      overallStatus = "degraded";
    }

    return {
      overallStatus,
      healthyPathways: healthy,
      degradedPathways: degraded,
      offlinePathways: offline,
      averageLatency: healthArray.reduce((sum, h) => sum + h.latency, 0) / healthArray.length,
      totalThroughput: healthArray.reduce((sum, h) => sum + h.throughput, 0),
    };
  }

  // Generate flow visualization data
  generateFlowVisualization(): {
    nodes: PathwayNode[];
    connections: PathwayConnection[];
    activeFlows: DataFlowEvent[];
  } {
    const recentEvents = this.getRecentFlowEvents(20).filter(e => e.status === "in_progress");
    
    return {
      nodes: this.nodes,
      connections: this.connections,
      activeFlows: recentEvents,
    };
  }

  // Simulate data flow (for demo/testing)
  simulateDataFlow(pathway: PathwayType, size: number = 1024): DataFlowEvent {
    const pathwayInfo = DATA_PATHWAY_COLORS[pathway];
    const event = this.recordFlowEvent({
      pathway,
      source: "ui",
      destination: pathway,
      dataType: "simulation",
      size,
      duration: 0,
      status: "in_progress",
      direction: "outbound",
    });

    // Simulate completion
    setTimeout(() => {
      const index = this.flowEvents.findIndex(e => e.id === event.id);
      if (index !== -1) {
        this.flowEvents[index] = {
          ...this.flowEvents[index],
          status: "completed",
          duration: Math.random() * 100 + 10,
        };
        this.notify();
      }
    }, Math.random() * 500 + 100);

    return event;
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach(callback => callback());
  }

  // Get summary statistics
  getSummaryStats(): {
    totalFlowEvents: number;
    totalDataTransferred: string;
    averageLatency: string;
    systemUptime: string;
  } {
    const totalData = this.flowEvents.reduce((sum, e) => sum + e.size, 0);
    const completedEvents = this.flowEvents.filter(e => e.status === "completed");
    const avgLatency = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + e.duration, 0) / completedEvents.length
      : 0;
    const healthArray = Array.from(this.pathwayHealth.values());
    const avgUptime = healthArray.reduce((sum, h) => sum + h.uptime, 0) / healthArray.length;

    return {
      totalFlowEvents: this.flowEvents.length,
      totalDataTransferred: this.formatBytes(totalData),
      averageLatency: `${avgLatency.toFixed(2)}ms`,
      systemUptime: `${avgUptime.toFixed(2)}%`,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export const dataPathwayService = new DataPathwayService();
