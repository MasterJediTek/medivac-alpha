/**
 * MediVac One Cloud Infrastructure Service
 * Cloud computing configuration and deployment management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cloud Provider Types
export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'heroku';

export interface CloudConfig {
  provider: CloudProvider;
  region: string;
  environment: 'development' | 'staging' | 'production';
  autoScaling: AutoScalingConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
  cdn: CDNConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mongodb';
  host: string;
  port: number;
  name: string;
  replication: boolean;
  readReplicas: number;
  backupEnabled: boolean;
  backupRetentionDays: number;
  encryptionAtRest: boolean;
}

export interface StorageConfig {
  type: 's3' | 'azure-blob' | 'gcs';
  bucket: string;
  region: string;
  publicAccess: boolean;
  versioning: boolean;
  lifecycle: StorageLifecycleRule[];
}

export interface StorageLifecycleRule {
  name: string;
  prefix: string;
  expirationDays: number;
  transitionToIA?: number;
  transitionToGlacier?: number;
}

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudfront' | 'cloudflare' | 'fastly';
  domains: string[];
  sslCertificate: string;
  cachePolicy: CachePolicy;
}

export interface CachePolicy {
  defaultTTL: number;
  maxTTL: number;
  minTTL: number;
  queryStringCaching: boolean;
  compressionEnabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  provider: 'cloudwatch' | 'datadog' | 'newrelic' | 'prometheus';
  alerting: AlertConfig[];
  logging: LoggingConfig;
  tracing: TracingConfig;
}

export interface AlertConfig {
  name: string;
  metric: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  period: number;
  evaluationPeriods: number;
  actions: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: number;
  format: 'json' | 'text';
  destination: string;
}

export interface TracingConfig {
  enabled: boolean;
  sampleRate: number;
  serviceName: string;
}

export interface SecurityConfig {
  waf: WAFConfig;
  ddosProtection: boolean;
  encryption: EncryptionConfig;
  secrets: SecretsConfig;
  network: NetworkConfig;
}

export interface WAFConfig {
  enabled: boolean;
  rules: WAFRule[];
}

export interface WAFRule {
  name: string;
  type: 'rate-limit' | 'ip-block' | 'geo-block' | 'sql-injection' | 'xss';
  action: 'allow' | 'block' | 'count';
  priority: number;
  conditions: Record<string, unknown>;
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  keyManagement: 'aws-kms' | 'azure-keyvault' | 'gcp-kms' | 'vault';
  keyRotation: boolean;
  keyRotationDays: number;
}

export interface SecretsConfig {
  provider: 'aws-secrets' | 'azure-keyvault' | 'gcp-secrets' | 'vault';
  autoRotation: boolean;
  rotationDays: number;
}

export interface NetworkConfig {
  vpcEnabled: boolean;
  privateSubnets: boolean;
  natGateway: boolean;
  bastionHost: boolean;
  vpnEnabled: boolean;
}

// Deployment Types
export interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: DeploymentStatus;
  startedAt: string;
  completedAt?: string;
  deployedBy: string;
  changes: DeploymentChange[];
  rollbackAvailable: boolean;
}

export type DeploymentStatus = 
  | 'pending'
  | 'in-progress'
  | 'success'
  | 'failed'
  | 'rolled-back'
  | 'cancelled';

export interface DeploymentChange {
  type: 'feature' | 'bugfix' | 'security' | 'performance' | 'config';
  description: string;
  commitHash?: string;
}

// Container Types
export interface ContainerConfig {
  image: string;
  tag: string;
  registry: string;
  resources: ContainerResources;
  environment: Record<string, string>;
  healthCheck: HealthCheckConfig;
  ports: PortMapping[];
}

export interface ContainerResources {
  cpu: string;
  memory: string;
  cpuLimit: string;
  memoryLimit: string;
}

export interface HealthCheckConfig {
  path: string;
  port: number;
  initialDelay: number;
  period: number;
  timeout: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol: 'tcp' | 'udp';
}

// Kubernetes Types
export interface KubernetesConfig {
  cluster: string;
  namespace: string;
  replicas: number;
  strategy: DeploymentStrategy;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  ingress: IngressConfig;
  hpa: HPAConfig;
  pdb: PDBConfig;
}

export interface DeploymentStrategy {
  type: 'RollingUpdate' | 'Recreate';
  maxSurge?: string;
  maxUnavailable?: string;
}

export interface IngressConfig {
  enabled: boolean;
  className: string;
  annotations: Record<string, string>;
  hosts: IngressHost[];
  tls: IngressTLS[];
}

export interface IngressHost {
  host: string;
  paths: IngressPath[];
}

export interface IngressPath {
  path: string;
  pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
  backend: {
    service: string;
    port: number;
  };
}

export interface IngressTLS {
  hosts: string[];
  secretName: string;
}

export interface HPAConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory?: number;
}

export interface PDBConfig {
  enabled: boolean;
  minAvailable?: number;
  maxUnavailable?: number;
}

// CI/CD Types
export interface CICDConfig {
  provider: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'azure-devops';
  triggers: CICDTrigger[];
  stages: CICDStage[];
  notifications: CICDNotification[];
}

export interface CICDTrigger {
  type: 'push' | 'pull_request' | 'tag' | 'schedule' | 'manual';
  branches?: string[];
  tags?: string[];
  schedule?: string;
}

export interface CICDStage {
  name: string;
  jobs: CICDJob[];
  dependsOn?: string[];
  condition?: string;
}

export interface CICDJob {
  name: string;
  runner: string;
  steps: CICDStep[];
  environment?: Record<string, string>;
  secrets?: string[];
}

export interface CICDStep {
  name: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
}

export interface CICDNotification {
  type: 'slack' | 'email' | 'teams' | 'webhook';
  events: ('success' | 'failure' | 'started')[];
  target: string;
}

// Default Configurations
const DEFAULT_AWS_CONFIG: CloudConfig = {
  provider: 'aws',
  region: 'ap-southeast-2',
  environment: 'production',
  autoScaling: {
    enabled: true,
    minInstances: 2,
    maxInstances: 10,
    targetCPU: 70,
    targetMemory: 80,
    scaleUpCooldown: 300,
    scaleDownCooldown: 600,
  },
  database: {
    type: 'mysql',
    host: 'medivac-db.cluster.ap-southeast-2.rds.amazonaws.com',
    port: 3306,
    name: 'medivac_production',
    replication: true,
    readReplicas: 2,
    backupEnabled: true,
    backupRetentionDays: 30,
    encryptionAtRest: true,
  },
  storage: {
    type: 's3',
    bucket: 'medivac-one-production',
    region: 'ap-southeast-2',
    publicAccess: false,
    versioning: true,
    lifecycle: [
      {
        name: 'archive-old-files',
        prefix: 'archives/',
        expirationDays: 365,
        transitionToIA: 30,
        transitionToGlacier: 90,
      },
    ],
  },
  cdn: {
    enabled: true,
    provider: 'cloudfront',
    domains: ['cdn.medivac.one', 'assets.medivac.one'],
    sslCertificate: 'arn:aws:acm:us-east-1:xxx:certificate/xxx',
    cachePolicy: {
      defaultTTL: 86400,
      maxTTL: 31536000,
      minTTL: 0,
      queryStringCaching: true,
      compressionEnabled: true,
    },
  },
  monitoring: {
    enabled: true,
    provider: 'cloudwatch',
    alerting: [
      {
        name: 'high-cpu',
        metric: 'CPUUtilization',
        threshold: 80,
        comparison: 'gt',
        period: 300,
        evaluationPeriods: 2,
        actions: ['arn:aws:sns:ap-southeast-2:xxx:medivac-alerts'],
      },
      {
        name: 'high-memory',
        metric: 'MemoryUtilization',
        threshold: 85,
        comparison: 'gt',
        period: 300,
        evaluationPeriods: 2,
        actions: ['arn:aws:sns:ap-southeast-2:xxx:medivac-alerts'],
      },
      {
        name: 'error-rate',
        metric: '5XXError',
        threshold: 5,
        comparison: 'gt',
        period: 60,
        evaluationPeriods: 3,
        actions: ['arn:aws:sns:ap-southeast-2:xxx:medivac-alerts'],
      },
    ],
    logging: {
      level: 'info',
      retention: 90,
      format: 'json',
      destination: '/aws/ecs/medivac-one',
    },
    tracing: {
      enabled: true,
      sampleRate: 0.1,
      serviceName: 'medivac-one',
    },
  },
  security: {
    waf: {
      enabled: true,
      rules: [
        {
          name: 'rate-limit',
          type: 'rate-limit',
          action: 'block',
          priority: 1,
          conditions: { limit: 2000, period: 300 },
        },
        {
          name: 'sql-injection',
          type: 'sql-injection',
          action: 'block',
          priority: 2,
          conditions: {},
        },
        {
          name: 'xss-protection',
          type: 'xss',
          action: 'block',
          priority: 3,
          conditions: {},
        },
      ],
    },
    ddosProtection: true,
    encryption: {
      atRest: true,
      inTransit: true,
      keyManagement: 'aws-kms',
      keyRotation: true,
      keyRotationDays: 90,
    },
    secrets: {
      provider: 'aws-secrets',
      autoRotation: true,
      rotationDays: 30,
    },
    network: {
      vpcEnabled: true,
      privateSubnets: true,
      natGateway: true,
      bastionHost: true,
      vpnEnabled: true,
    },
  },
};

const DEFAULT_KUBERNETES_CONFIG: KubernetesConfig = {
  cluster: 'medivac-production',
  namespace: 'medivac',
  replicas: 3,
  strategy: {
    type: 'RollingUpdate',
    maxSurge: '25%',
    maxUnavailable: '25%',
  },
  serviceType: 'LoadBalancer',
  ingress: {
    enabled: true,
    className: 'nginx',
    annotations: {
      'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
      'nginx.ingress.kubernetes.io/proxy-body-size': '50m',
      'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
    },
    hosts: [
      {
        host: 'api.medivac.one',
        paths: [
          {
            path: '/',
            pathType: 'Prefix',
            backend: { service: 'medivac-api', port: 3000 },
          },
        ],
      },
    ],
    tls: [
      {
        hosts: ['api.medivac.one'],
        secretName: 'medivac-tls',
      },
    ],
  },
  hpa: {
    enabled: true,
    minReplicas: 2,
    maxReplicas: 10,
    targetCPU: 70,
    targetMemory: 80,
  },
  pdb: {
    enabled: true,
    minAvailable: 1,
  },
};

const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  image: 'medivac-one',
  tag: 'latest',
  registry: 'ghcr.io/medivac-one',
  resources: {
    cpu: '500m',
    memory: '512Mi',
    cpuLimit: '2000m',
    memoryLimit: '2Gi',
  },
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
    LOG_LEVEL: 'info',
  },
  healthCheck: {
    path: '/health',
    port: 3000,
    initialDelay: 30,
    period: 10,
    timeout: 5,
    successThreshold: 1,
    failureThreshold: 3,
  },
  ports: [
    { containerPort: 3000, hostPort: 3000, protocol: 'tcp' },
  ],
};

const DEFAULT_CICD_CONFIG: CICDConfig = {
  provider: 'github-actions',
  triggers: [
    { type: 'push', branches: ['main'] },
    { type: 'pull_request', branches: ['main', 'develop'] },
    { type: 'tag', tags: ['v*'] },
  ],
  stages: [
    {
      name: 'test',
      jobs: [
        {
          name: 'unit-tests',
          runner: 'ubuntu-latest',
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
            { name: 'Setup Node', uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
            { name: 'Install', run: 'pnpm install' },
            { name: 'Test', run: 'pnpm test' },
          ],
        },
        {
          name: 'lint',
          runner: 'ubuntu-latest',
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
            { name: 'Setup Node', uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
            { name: 'Install', run: 'pnpm install' },
            { name: 'Lint', run: 'pnpm lint' },
          ],
        },
      ],
    },
    {
      name: 'build',
      dependsOn: ['test'],
      jobs: [
        {
          name: 'build-image',
          runner: 'ubuntu-latest',
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
            { name: 'Build', uses: 'docker/build-push-action@v5', with: { push: 'true' } },
          ],
          secrets: ['DOCKER_USERNAME', 'DOCKER_PASSWORD'],
        },
      ],
    },
    {
      name: 'deploy',
      dependsOn: ['build'],
      condition: "github.ref == 'refs/heads/main'",
      jobs: [
        {
          name: 'deploy-production',
          runner: 'ubuntu-latest',
          steps: [
            { name: 'Deploy', run: 'kubectl apply -f k8s/' },
          ],
          secrets: ['KUBE_CONFIG'],
        },
      ],
    },
  ],
  notifications: [
    { type: 'slack', events: ['success', 'failure'], target: '#deployments' },
    { type: 'email', events: ['failure'], target: 'devops@medivac.one' },
  ],
};

class CloudInfrastructureService {
  private cloudConfig: CloudConfig;
  private kubernetesConfig: KubernetesConfig;
  private containerConfig: ContainerConfig;
  private cicdConfig: CICDConfig;
  private deployments: Deployment[] = [];

  constructor() {
    this.cloudConfig = DEFAULT_AWS_CONFIG;
    this.kubernetesConfig = DEFAULT_KUBERNETES_CONFIG;
    this.containerConfig = DEFAULT_CONTAINER_CONFIG;
    this.cicdConfig = DEFAULT_CICD_CONFIG;
    this.loadConfigs();
  }

  // ==========================================
  // Configuration Management
  // ==========================================

  async loadConfigs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medivac_cloud_config');
      if (stored) {
        const configs = JSON.parse(stored);
        this.cloudConfig = configs.cloud || this.cloudConfig;
        this.kubernetesConfig = configs.kubernetes || this.kubernetesConfig;
        this.containerConfig = configs.container || this.containerConfig;
        this.cicdConfig = configs.cicd || this.cicdConfig;
      }
    } catch (error) {
      console.error('Failed to load cloud configs:', error);
    }
  }

  async saveConfigs(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_cloud_config', JSON.stringify({
        cloud: this.cloudConfig,
        kubernetes: this.kubernetesConfig,
        container: this.containerConfig,
        cicd: this.cicdConfig,
      }));
    } catch (error) {
      console.error('Failed to save cloud configs:', error);
    }
  }

  getCloudConfig(): CloudConfig {
    return { ...this.cloudConfig };
  }

  updateCloudConfig(config: Partial<CloudConfig>): void {
    this.cloudConfig = { ...this.cloudConfig, ...config };
    this.saveConfigs();
  }

  getKubernetesConfig(): KubernetesConfig {
    return { ...this.kubernetesConfig };
  }

  updateKubernetesConfig(config: Partial<KubernetesConfig>): void {
    this.kubernetesConfig = { ...this.kubernetesConfig, ...config };
    this.saveConfigs();
  }

  getContainerConfig(): ContainerConfig {
    return { ...this.containerConfig };
  }

  updateContainerConfig(config: Partial<ContainerConfig>): void {
    this.containerConfig = { ...this.containerConfig, ...config };
    this.saveConfigs();
  }

  getCICDConfig(): CICDConfig {
    return { ...this.cicdConfig };
  }

  updateCICDConfig(config: Partial<CICDConfig>): void {
    this.cicdConfig = { ...this.cicdConfig, ...config };
    this.saveConfigs();
  }

  // ==========================================
  // Deployment Management
  // ==========================================

  async createDeployment(version: string, changes: DeploymentChange[]): Promise<Deployment> {
    const deployment: Deployment = {
      id: `deploy_${Date.now()}`,
      version,
      environment: this.cloudConfig.environment,
      status: 'pending',
      startedAt: new Date().toISOString(),
      deployedBy: 'system',
      changes,
      rollbackAvailable: false,
    };

    this.deployments.unshift(deployment);
    await this.saveDeployments();

    return deployment;
  }

  async updateDeploymentStatus(id: string, status: DeploymentStatus): Promise<void> {
    const deployment = this.deployments.find(d => d.id === id);
    if (deployment) {
      deployment.status = status;
      if (status === 'success' || status === 'failed') {
        deployment.completedAt = new Date().toISOString();
        deployment.rollbackAvailable = status === 'success';
      }
      await this.saveDeployments();
    }
  }

  getDeployments(): Deployment[] {
    return [...this.deployments];
  }

  getLatestDeployment(): Deployment | undefined {
    return this.deployments[0];
  }

  async rollbackDeployment(id: string): Promise<boolean> {
    const deployment = this.deployments.find(d => d.id === id);
    if (deployment && deployment.rollbackAvailable) {
      await this.updateDeploymentStatus(id, 'rolled-back');
      return true;
    }
    return false;
  }

  private async saveDeployments(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_deployments', JSON.stringify(this.deployments.slice(0, 50)));
    } catch (error) {
      console.error('Failed to save deployments:', error);
    }
  }

  // ==========================================
  // Docker Configuration Generation
  // ==========================================

  generateDockerfile(): string {
    return `# MediVac One Production Dockerfile
# Auto-generated by Cloud Infrastructure Service

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build application
COPY . .
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=${this.containerConfig.healthCheck.port}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medivac

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER medivac

EXPOSE ${this.containerConfig.healthCheck.port}

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${this.containerConfig.healthCheck.port}${this.containerConfig.healthCheck.path} || exit 1

CMD ["node", "dist/index.js"]
`;
  }

  generateDockerCompose(): string {
    return `# MediVac One Docker Compose
# Auto-generated by Cloud Infrastructure Service

version: '3.8'

services:
  api:
    build: .
    image: ${this.containerConfig.registry}/${this.containerConfig.image}:${this.containerConfig.tag}
    ports:
      - "${this.containerConfig.ports[0]?.hostPort || 3000}:${this.containerConfig.ports[0]?.containerPort || 3000}"
    environment:
      - NODE_ENV=${this.containerConfig.environment.NODE_ENV}
      - PORT=${this.containerConfig.environment.PORT}
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    deploy:
      resources:
        limits:
          cpus: '${this.containerConfig.resources.cpuLimit}'
          memory: ${this.containerConfig.resources.memoryLimit}
        reservations:
          cpus: '${this.containerConfig.resources.cpu}'
          memory: ${this.containerConfig.resources.memory}
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:${this.containerConfig.healthCheck.port}${this.containerConfig.healthCheck.path}"]
      interval: ${this.containerConfig.healthCheck.period}s
      timeout: ${this.containerConfig.healthCheck.timeout}s
      retries: ${this.containerConfig.healthCheck.failureThreshold}
      start_period: ${this.containerConfig.healthCheck.initialDelay}s
    depends_on:
      - db
      - redis
    networks:
      - medivac-network

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=\${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=${this.cloudConfig.database.name}
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - medivac-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - medivac-network

volumes:
  db-data:
  redis-data:

networks:
  medivac-network:
    driver: bridge
`;
  }

  // ==========================================
  // Kubernetes Manifest Generation
  // ==========================================

  generateKubernetesDeployment(): string {
    return `# MediVac One Kubernetes Deployment
# Auto-generated by Cloud Infrastructure Service

apiVersion: apps/v1
kind: Deployment
metadata:
  name: medivac-api
  namespace: ${this.kubernetesConfig.namespace}
  labels:
    app: medivac-api
spec:
  replicas: ${this.kubernetesConfig.replicas}
  selector:
    matchLabels:
      app: medivac-api
  strategy:
    type: ${this.kubernetesConfig.strategy.type}
    ${this.kubernetesConfig.strategy.type === 'RollingUpdate' ? `rollingUpdate:
      maxSurge: ${this.kubernetesConfig.strategy.maxSurge}
      maxUnavailable: ${this.kubernetesConfig.strategy.maxUnavailable}` : ''}
  template:
    metadata:
      labels:
        app: medivac-api
    spec:
      containers:
        - name: api
          image: ${this.containerConfig.registry}/${this.containerConfig.image}:${this.containerConfig.tag}
          ports:
            - containerPort: ${this.containerConfig.healthCheck.port}
          resources:
            requests:
              cpu: ${this.containerConfig.resources.cpu}
              memory: ${this.containerConfig.resources.memory}
            limits:
              cpu: ${this.containerConfig.resources.cpuLimit}
              memory: ${this.containerConfig.resources.memoryLimit}
          livenessProbe:
            httpGet:
              path: ${this.containerConfig.healthCheck.path}
              port: ${this.containerConfig.healthCheck.port}
            initialDelaySeconds: ${this.containerConfig.healthCheck.initialDelay}
            periodSeconds: ${this.containerConfig.healthCheck.period}
            timeoutSeconds: ${this.containerConfig.healthCheck.timeout}
            failureThreshold: ${this.containerConfig.healthCheck.failureThreshold}
          readinessProbe:
            httpGet:
              path: ${this.containerConfig.healthCheck.path}
              port: ${this.containerConfig.healthCheck.port}
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - configMapRef:
                name: medivac-config
            - secretRef:
                name: medivac-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: medivac-api
  namespace: ${this.kubernetesConfig.namespace}
spec:
  type: ${this.kubernetesConfig.serviceType}
  ports:
    - port: 80
      targetPort: ${this.containerConfig.healthCheck.port}
  selector:
    app: medivac-api
`;
  }

  generateKubernetesHPA(): string {
    if (!this.kubernetesConfig.hpa.enabled) return '';

    return `# MediVac One Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: medivac-api-hpa
  namespace: ${this.kubernetesConfig.namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: medivac-api
  minReplicas: ${this.kubernetesConfig.hpa.minReplicas}
  maxReplicas: ${this.kubernetesConfig.hpa.maxReplicas}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${this.kubernetesConfig.hpa.targetCPU}
    ${this.kubernetesConfig.hpa.targetMemory ? `- type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: ${this.kubernetesConfig.hpa.targetMemory}` : ''}
`;
  }

  generateKubernetesIngress(): string {
    if (!this.kubernetesConfig.ingress.enabled) return '';

    const annotations = Object.entries(this.kubernetesConfig.ingress.annotations)
      .map(([key, value]) => `    ${key}: "${value}"`)
      .join('\n');

    return `# MediVac One Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: medivac-ingress
  namespace: ${this.kubernetesConfig.namespace}
  annotations:
${annotations}
spec:
  ingressClassName: ${this.kubernetesConfig.ingress.className}
  tls:
${this.kubernetesConfig.ingress.tls.map(tls => `    - hosts:
${tls.hosts.map(h => `        - ${h}`).join('\n')}
      secretName: ${tls.secretName}`).join('\n')}
  rules:
${this.kubernetesConfig.ingress.hosts.map(host => `    - host: ${host.host}
      http:
        paths:
${host.paths.map(path => `          - path: ${path.path}
            pathType: ${path.pathType}
            backend:
              service:
                name: ${path.backend.service}
                port:
                  number: ${path.backend.port}`).join('\n')}`).join('\n')}
`;
  }

  // ==========================================
  // GitHub Actions Workflow Generation
  // ==========================================

  generateGitHubActionsWorkflow(): string {
    return `# MediVac One CI/CD Pipeline
# Auto-generated by Cloud Infrastructure Service

name: MediVac One CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run type check
        run: pnpm check
      
      - name: Run tests
        run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: \${{ secrets.KUBE_CONFIG_STAGING }}
      
      - name: Deploy to staging
        run: |
          kubectl set image deployment/medivac-api api=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} -n medivac-staging
          kubectl rollout status deployment/medivac-api -n medivac-staging

  deploy-production:
    needs: build
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: \${{ secrets.KUBE_CONFIG_PRODUCTION }}
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/medivac-api api=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.ref_name }} -n medivac
          kubectl rollout status deployment/medivac-api -n medivac
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "MediVac One \${{ github.ref_name }} deployed to production"
            }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}
`;
  }

  // ==========================================
  // Terraform Configuration Generation
  // ==========================================

  generateTerraformMain(): string {
    return `# MediVac One Terraform Configuration
# Auto-generated by Cloud Infrastructure Service

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "medivac-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "${this.cloudConfig.region}"
    encrypt        = true
    dynamodb_table = "medivac-terraform-locks"
  }
}

provider "aws" {
  region = "${this.cloudConfig.region}"
  
  default_tags {
    tags = {
      Project     = "MediVac-One"
      Environment = "${this.cloudConfig.environment}"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "medivac-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${this.cloudConfig.region}a", "${this.cloudConfig.region}b", "${this.cloudConfig.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = ${this.cloudConfig.security.network.natGateway}
  single_nat_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "medivac-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS Database
module "rds" {
  source = "terraform-aws-modules/rds/aws"
  
  identifier = "medivac-db"
  
  engine               = "${this.cloudConfig.database.type}"
  engine_version       = "8.0"
  family               = "mysql8.0"
  major_engine_version = "8.0"
  instance_class       = "db.r6g.large"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  
  db_name  = "${this.cloudConfig.database.name}"
  username = "admin"
  port     = ${this.cloudConfig.database.port}
  
  multi_az               = ${this.cloudConfig.database.replication}
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = ${this.cloudConfig.database.backupRetentionDays}
  backup_window           = "03:00-06:00"
  maintenance_window      = "Mon:00:00-Mon:03:00"
  
  storage_encrypted = ${this.cloudConfig.database.encryptionAtRest}
  
  deletion_protection = true
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${this.cloudConfig.storage.bucket}"
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "${this.cloudConfig.storage.versioning ? 'Enabled' : 'Disabled'}"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = ${this.cloudConfig.cdn.enabled}
  
  origin {
    domain_name = aws_s3_bucket.main.bucket_regional_domain_name
    origin_id   = "S3-medivac"
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-medivac"
    
    forwarded_values {
      query_string = ${this.cloudConfig.cdn.cachePolicy.queryStringCaching}
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = ${this.cloudConfig.cdn.cachePolicy.minTTL}
    default_ttl            = ${this.cloudConfig.cdn.cachePolicy.defaultTTL}
    max_ttl                = ${this.cloudConfig.cdn.cachePolicy.maxTTL}
    compress               = ${this.cloudConfig.cdn.cachePolicy.compressionEnabled}
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = "${this.cloudConfig.cdn.sslCertificate}"
    ssl_support_method  = "sni-only"
  }
}

# Outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "ecs_cluster_arn" {
  value = aws_ecs_cluster.main.arn
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}
`;
  }
}

// Export singleton instance
export const cloudInfrastructure = new CloudInfrastructureService();

// Export class for custom instances
export { CloudInfrastructureService };
