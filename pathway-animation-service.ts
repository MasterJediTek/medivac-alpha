/**
 * Pathway Flow Animations Service
 * MediVac WACHS v8.3
 * 
 * Provides animated data flow visualization through L1→L2→L3 cache pathways,
 * real-time throughput indicators, and bottleneck highlighting.
 */

// Animation Types
export type PathwayType = "l1_cache" | "l2_storage" | "l3_cloud" | "websocket" | "api" | "jedi_sync" | "offline_queue";
export type AnimationState = "idle" | "active" | "busy" | "error" | "blocked";
export type FlowDirection = "inbound" | "outbound" | "bidirectional";

export interface DataPacket {
  id: string;
  type: "read" | "write" | "sync" | "cache" | "invalidate";
  size: number; // bytes
  priority: "low" | "normal" | "high" | "critical";
  sourcePathway: PathwayType;
  targetPathway: PathwayType;
  progress: number; // 0-100
  startedAt: Date;
  estimatedCompletion: Date;
  metadata: Record<string, unknown>;
}

export interface PathwayNode {
  id: string;
  type: PathwayType;
  name: string;
  color: string;
  position: { x: number; y: number };
  state: AnimationState;
  throughput: number; // bytes per second
  latency: number; // milliseconds
  errorRate: number; // percentage
  activePackets: number;
  totalProcessed: number;
}

export interface PathwayConnection {
  id: string;
  sourceId: string;
  targetId: string;
  direction: FlowDirection;
  bandwidth: number; // bytes per second
  utilization: number; // percentage
  isActive: boolean;
  packets: DataPacket[];
}

export interface FlowAnimation {
  id: string;
  packet: DataPacket;
  currentPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  speed: number; // pixels per frame
  trail: { x: number; y: number }[];
  isComplete: boolean;
}

export interface PathwayMetrics {
  pathwayId: string;
  timestamp: Date;
  throughput: number;
  latency: number;
  errorCount: number;
  packetCount: number;
  bytesTransferred: number;
}

export interface BottleneckAlert {
  id: string;
  pathwayId: string;
  connectionId: string | null;
  severity: "warning" | "critical";
  type: "high_latency" | "low_throughput" | "high_error_rate" | "queue_overflow";
  message: string;
  detectedAt: Date;
  resolvedAt: Date | null;
}

export interface AnimationConfig {
  frameRate: number; // fps
  packetSize: number; // visual size in pixels
  trailLength: number; // number of trail segments
  pulseInterval: number; // milliseconds
  speedMultiplier: number;
  showLabels: boolean;
  showMetrics: boolean;
  enableGlow: boolean;
  enablePulse: boolean;
}

// Pathway Colors (matching color chart)
export const PATHWAY_COLORS: Record<PathwayType, string> = {
  l1_cache: "#22C55E",      // Green - fast local
  l2_storage: "#3B82F6",    // Blue - persistent local
  l3_cloud: "#8B5CF6",      // Purple - cloud sync
  websocket: "#F97316",     // Orange - live data
  api: "#06B6D4",           // Cyan - external calls
  jedi_sync: "#FFD700",     // Gold - JEDI systems
  offline_queue: "#6B7280", // Gray - pending sync
};

// Pathway Animation Service
class PathwayAnimationService {
  private nodes: Map<string, PathwayNode> = new Map();
  private connections: Map<string, PathwayConnection> = new Map();
  private activeAnimations: Map<string, FlowAnimation> = new Map();
  private metricsHistory: Map<string, PathwayMetrics[]> = new Map();
  private bottleneckAlerts: Map<string, BottleneckAlert> = new Map();
  private animationFrame: number | null = null;
  private listeners: Set<(state: AnimationState) => void> = new Set();
  private config: AnimationConfig = {
    frameRate: 60,
    packetSize: 12,
    trailLength: 10,
    pulseInterval: 1000,
    speedMultiplier: 1.0,
    showLabels: true,
    showMetrics: true,
    enableGlow: true,
    enablePulse: true,
  };

  constructor() {
    this.initializeDefaultTopology();
  }

  private initializeDefaultTopology(): void {
    // Create default pathway nodes
    const defaultNodes: PathwayNode[] = [
      {
        id: "l1",
        type: "l1_cache",
        name: "L1 Memory Cache",
        color: PATHWAY_COLORS.l1_cache,
        position: { x: 100, y: 200 },
        state: "idle",
        throughput: 0,
        latency: 1,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "l2",
        type: "l2_storage",
        name: "L2 AsyncStorage",
        color: PATHWAY_COLORS.l2_storage,
        position: { x: 250, y: 200 },
        state: "idle",
        throughput: 0,
        latency: 10,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "l3",
        type: "l3_cloud",
        name: "L3 S3 Cloud",
        color: PATHWAY_COLORS.l3_cloud,
        position: { x: 400, y: 200 },
        state: "idle",
        throughput: 0,
        latency: 100,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "ws",
        type: "websocket",
        name: "WebSocket",
        color: PATHWAY_COLORS.websocket,
        position: { x: 175, y: 100 },
        state: "idle",
        throughput: 0,
        latency: 5,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "api",
        type: "api",
        name: "REST API",
        color: PATHWAY_COLORS.api,
        position: { x: 325, y: 100 },
        state: "idle",
        throughput: 0,
        latency: 50,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "jedi",
        type: "jedi_sync",
        name: "JEDI Sync",
        color: PATHWAY_COLORS.jedi_sync,
        position: { x: 400, y: 100 },
        state: "idle",
        throughput: 0,
        latency: 75,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
      {
        id: "offline",
        type: "offline_queue",
        name: "Offline Queue",
        color: PATHWAY_COLORS.offline_queue,
        position: { x: 175, y: 300 },
        state: "idle",
        throughput: 0,
        latency: 0,
        errorRate: 0,
        activePackets: 0,
        totalProcessed: 0,
      },
    ];

    defaultNodes.forEach((node) => {
      this.nodes.set(node.id, node);
      this.metricsHistory.set(node.id, []);
    });

    // Create default connections
    const defaultConnections: PathwayConnection[] = [
      { id: "l1-l2", sourceId: "l1", targetId: "l2", direction: "bidirectional", bandwidth: 100000000, utilization: 0, isActive: false, packets: [] },
      { id: "l2-l3", sourceId: "l2", targetId: "l3", direction: "bidirectional", bandwidth: 10000000, utilization: 0, isActive: false, packets: [] },
      { id: "ws-l1", sourceId: "ws", targetId: "l1", direction: "inbound", bandwidth: 1000000, utilization: 0, isActive: false, packets: [] },
      { id: "api-l2", sourceId: "api", targetId: "l2", direction: "bidirectional", bandwidth: 5000000, utilization: 0, isActive: false, packets: [] },
      { id: "jedi-l3", sourceId: "jedi", targetId: "l3", direction: "bidirectional", bandwidth: 5000000, utilization: 0, isActive: false, packets: [] },
      { id: "offline-l2", sourceId: "offline", targetId: "l2", direction: "outbound", bandwidth: 1000000, utilization: 0, isActive: false, packets: [] },
    ];

    defaultConnections.forEach((conn) => {
      this.connections.set(conn.id, conn);
    });
  }

  // Get all pathway nodes
  getNodes(): PathwayNode[] {
    return Array.from(this.nodes.values());
  }

  // Get node by ID
  getNode(nodeId: string): PathwayNode | null {
    return this.nodes.get(nodeId) || null;
  }

  // Get all connections
  getConnections(): PathwayConnection[] {
    return Array.from(this.connections.values());
  }

  // Get connection by ID
  getConnection(connectionId: string): PathwayConnection | null {
    return this.connections.get(connectionId) || null;
  }

  // Create a data packet animation
  createPacket(
    sourcePathway: PathwayType,
    targetPathway: PathwayType,
    options: Partial<DataPacket> = {}
  ): DataPacket {
    const packet: DataPacket = {
      id: `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || "sync",
      size: options.size || 1024,
      priority: options.priority || "normal",
      sourcePathway,
      targetPathway,
      progress: 0,
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 1000),
      metadata: options.metadata || {},
    };

    return packet;
  }

  // Start packet animation
  startPacketAnimation(packet: DataPacket): FlowAnimation {
    const sourceNode = Array.from(this.nodes.values()).find(
      (n) => n.type === packet.sourcePathway
    );
    const targetNode = Array.from(this.nodes.values()).find(
      (n) => n.type === packet.targetPathway
    );

    if (!sourceNode || !targetNode) {
      throw new Error("Invalid source or target pathway");
    }

    const animation: FlowAnimation = {
      id: `anim_${packet.id}`,
      packet,
      currentPosition: { ...sourceNode.position },
      targetPosition: { ...targetNode.position },
      speed: this.calculateSpeed(packet.priority),
      trail: [],
      isComplete: false,
    };

    this.activeAnimations.set(animation.id, animation);
    this.updateNodeState(sourceNode.id, "active");

    return animation;
  }

  // Calculate animation speed based on priority
  private calculateSpeed(priority: DataPacket["priority"]): number {
    const baseSpeed = 2 * this.config.speedMultiplier;
    switch (priority) {
      case "critical":
        return baseSpeed * 3;
      case "high":
        return baseSpeed * 2;
      case "normal":
        return baseSpeed;
      case "low":
        return baseSpeed * 0.5;
    }
  }

  // Update animation frame
  updateAnimations(): void {
    this.activeAnimations.forEach((animation, id) => {
      if (animation.isComplete) return;

      // Update trail
      animation.trail.unshift({ ...animation.currentPosition });
      if (animation.trail.length > this.config.trailLength) {
        animation.trail.pop();
      }

      // Calculate movement
      const dx = animation.targetPosition.x - animation.currentPosition.x;
      const dy = animation.targetPosition.y - animation.currentPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < animation.speed) {
        // Animation complete
        animation.currentPosition = { ...animation.targetPosition };
        animation.isComplete = true;
        animation.packet.progress = 100;

        // Update target node
        const targetNode = Array.from(this.nodes.values()).find(
          (n) => n.type === animation.packet.targetPathway
        );
        if (targetNode) {
          targetNode.totalProcessed++;
          this.updateNodeState(targetNode.id, "active");
          setTimeout(() => this.updateNodeState(targetNode.id, "idle"), 500);
        }
      } else {
        // Move towards target
        const ratio = animation.speed / distance;
        animation.currentPosition.x += dx * ratio;
        animation.currentPosition.y += dy * ratio;
        animation.packet.progress = Math.round(
          ((1 - distance / this.getInitialDistance(animation)) * 100)
        );
      }
    });

    // Clean up completed animations
    this.activeAnimations.forEach((animation, id) => {
      if (animation.isComplete) {
        setTimeout(() => this.activeAnimations.delete(id), 1000);
      }
    });
  }

  private getInitialDistance(animation: FlowAnimation): number {
    const sourceNode = Array.from(this.nodes.values()).find(
      (n) => n.type === animation.packet.sourcePathway
    );
    if (!sourceNode) return 100;

    const dx = animation.targetPosition.x - sourceNode.position.x;
    const dy = animation.targetPosition.y - sourceNode.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Update node state
  updateNodeState(nodeId: string, state: AnimationState): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.state = state;
      this.nodes.set(nodeId, node);
    }
  }

  // Update node metrics
  updateNodeMetrics(
    nodeId: string,
    metrics: Partial<Pick<PathwayNode, "throughput" | "latency" | "errorRate">>
  ): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, metrics);
      this.nodes.set(nodeId, node);

      // Record metrics history
      const history = this.metricsHistory.get(nodeId) || [];
      history.push({
        pathwayId: nodeId,
        timestamp: new Date(),
        throughput: node.throughput,
        latency: node.latency,
        errorCount: Math.round(node.errorRate * node.totalProcessed / 100),
        packetCount: node.activePackets,
        bytesTransferred: node.throughput,
      });

      // Keep only last 100 entries
      if (history.length > 100) {
        history.shift();
      }
      this.metricsHistory.set(nodeId, history);

      // Check for bottlenecks
      this.checkBottleneck(node);
    }
  }

  // Check for bottlenecks
  private checkBottleneck(node: PathwayNode): void {
    const alerts: BottleneckAlert[] = [];

    if (node.latency > 500) {
      alerts.push({
        id: `alert_${node.id}_latency_${Date.now()}`,
        pathwayId: node.id,
        connectionId: null,
        severity: node.latency > 1000 ? "critical" : "warning",
        type: "high_latency",
        message: `High latency detected on ${node.name}: ${node.latency}ms`,
        detectedAt: new Date(),
        resolvedAt: null,
      });
    }

    if (node.errorRate > 5) {
      alerts.push({
        id: `alert_${node.id}_error_${Date.now()}`,
        pathwayId: node.id,
        connectionId: null,
        severity: node.errorRate > 10 ? "critical" : "warning",
        type: "high_error_rate",
        message: `High error rate on ${node.name}: ${node.errorRate}%`,
        detectedAt: new Date(),
        resolvedAt: null,
      });
    }

    alerts.forEach((alert) => {
      this.bottleneckAlerts.set(alert.id, alert);
    });
  }

  // Get active bottleneck alerts
  getBottleneckAlerts(): BottleneckAlert[] {
    return Array.from(this.bottleneckAlerts.values()).filter(
      (alert) => !alert.resolvedAt
    );
  }

  // Resolve bottleneck alert
  resolveAlert(alertId: string): void {
    const alert = this.bottleneckAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.bottleneckAlerts.set(alertId, alert);
    }
  }

  // Get active animations
  getActiveAnimations(): FlowAnimation[] {
    return Array.from(this.activeAnimations.values());
  }

  // Get metrics history for a pathway
  getMetricsHistory(pathwayId: string): PathwayMetrics[] {
    return this.metricsHistory.get(pathwayId) || [];
  }

  // Set animation configuration
  setConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get animation configuration
  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  // Start animation loop
  startAnimationLoop(): void {
    if (this.animationFrame !== null) return;

    const loop = () => {
      this.updateAnimations();
      this.animationFrame = requestAnimationFrame(loop);
    };

    this.animationFrame = requestAnimationFrame(loop);
  }

  // Stop animation loop
  stopAnimationLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Simulate data flow (for demo/testing)
  simulateDataFlow(): void {
    const pathways: PathwayType[] = [
      "l1_cache",
      "l2_storage",
      "l3_cloud",
      "websocket",
      "api",
      "jedi_sync",
    ];

    // Create random packet flow
    const sourceIdx = Math.floor(Math.random() * pathways.length);
    let targetIdx = Math.floor(Math.random() * pathways.length);
    while (targetIdx === sourceIdx) {
      targetIdx = Math.floor(Math.random() * pathways.length);
    }

    const packet = this.createPacket(pathways[sourceIdx], pathways[targetIdx], {
      type: ["read", "write", "sync", "cache"][Math.floor(Math.random() * 4)] as DataPacket["type"],
      size: Math.floor(Math.random() * 10000) + 100,
      priority: ["low", "normal", "high", "critical"][Math.floor(Math.random() * 4)] as DataPacket["priority"],
    });

    this.startPacketAnimation(packet);
  }

  // Get pathway analytics
  getAnalytics(): {
    totalNodes: number;
    activeNodes: number;
    totalConnections: number;
    activeAnimations: number;
    totalPacketsProcessed: number;
    averageLatency: number;
    bottleneckCount: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const activeAlerts = this.getBottleneckAlerts();

    return {
      totalNodes: nodes.length,
      activeNodes: nodes.filter((n) => n.state === "active").length,
      totalConnections: this.connections.size,
      activeAnimations: this.activeAnimations.size,
      totalPacketsProcessed: nodes.reduce((sum, n) => sum + n.totalProcessed, 0),
      averageLatency:
        nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length,
      bottleneckCount: activeAlerts.length,
    };
  }

  // Subscribe to state changes
  subscribe(listener: (state: AnimationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Generate SVG path for connection
  generateConnectionPath(connectionId: string): string {
    const connection = this.connections.get(connectionId);
    if (!connection) return "";

    const source = this.nodes.get(connection.sourceId);
    const target = this.nodes.get(connection.targetId);
    if (!source || !target) return "";

    // Create curved path
    const midX = (source.position.x + target.position.x) / 2;
    const midY = (source.position.y + target.position.y) / 2;
    const controlOffset = 30;

    return `M ${source.position.x} ${source.position.y} Q ${midX} ${midY - controlOffset} ${target.position.x} ${target.position.y}`;
  }
}

// Export singleton instance
export const pathwayAnimationService = new PathwayAnimationService();
