/**
 * MediVac One JEDI Forum Crash Report Service
 * Posts crash reports with screenshots and annotations to JEDI Masters Forum and High JEDI Council
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Forum Types
export type ForumType = 'jedi_masters' | 'high_council' | 'engineering' | 'clinical' | 'security';

// Crash Severity for Forum Routing
export type CrashSeverity = 'critical' | 'high' | 'medium' | 'low';

// Post Status
export type PostStatus = 'pending' | 'posted' | 'acknowledged' | 'investigating' | 'resolved' | 'failed';

// Screenshot Annotation
export interface ScreenshotAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'highlight' | 'blur';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  text?: string;
  endX?: number;
  endY?: number;
}

// Crash Screenshot
export interface CrashScreenshot {
  id: string;
  crashId: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  screenName: string;
  annotations: ScreenshotAnnotation[];
  capturedAt: string;
  deviceInfo: {
    model: string;
    os: string;
    screenSize: string;
    orientation: 'portrait' | 'landscape';
  };
}

// Crash Report for Forum
export interface ForumCrashReport {
  id: string;
  crashId: string;
  title: string;
  description: string;
  severity: CrashSeverity;
  platform: 'ios' | 'android' | 'web';
  buildVersion: string;
  buildNumber: number;
  stackTrace: string;
  deviceModel: string;
  osVersion: string;
  occurredAt: string;
  occurrences: number;
  affectedUsers: number;
  screenshots: CrashScreenshot[];
  logs: string[];
  steps: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  workaround?: string;
  relatedCrashes: string[];
  tags: string[];
}

// Forum Post
export interface ForumPost {
  id: string;
  forumType: ForumType;
  crashReportId: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  status: PostStatus;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  screenshots: string[];
  attachments: { name: string; url: string; type: string }[];
  postedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  comments: ForumComment[];
  threadUrl?: string;
  views: number;
  reactions: { type: string; count: number }[];
  createdAt: string;
  updatedAt: string;
}

// Forum Comment
export interface ForumComment {
  id: string;
  postId: string;
  author: string;
  authorRole: string;
  content: string;
  attachments: { name: string; url: string }[];
  createdAt: string;
  isResolution: boolean;
}

// Forum Configuration
export interface ForumConfig {
  forumType: ForumType;
  name: string;
  description: string;
  apiEndpoint: string;
  webhookUrl: string;
  autoPost: boolean;
  severityThreshold: CrashSeverity;
  notifyOnPost: boolean;
  notifyOnAcknowledge: boolean;
  notifyOnResolve: boolean;
  moderators: string[];
  isActive: boolean;
}

// Posting Rules
export interface PostingRule {
  id: string;
  name: string;
  condition: {
    severity?: CrashSeverity[];
    platform?: string[];
    occurrencesMin?: number;
    affectedUsersMin?: number;
    tags?: string[];
  };
  targetForums: ForumType[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
  autoPost: boolean;
  requireScreenshot: boolean;
  notifyUsers: string[];
}

// Analytics
export interface ForumAnalytics {
  totalPosts: number;
  pendingPosts: number;
  acknowledgedPosts: number;
  resolvedPosts: number;
  averageResolutionTime: number; // in hours
  byForum: Record<ForumType, { posts: number; resolved: number; avgTime: number }>;
  bySeverity: Record<CrashSeverity, { posts: number; resolved: number }>;
  recentActivity: { date: string; posts: number; resolved: number }[];
}

const STORAGE_KEYS = {
  CRASH_REPORTS: 'jedi_forum_crash_reports',
  POSTS: 'jedi_forum_posts',
  CONFIGS: 'jedi_forum_configs',
  RULES: 'jedi_forum_rules',
  SCREENSHOTS: 'jedi_forum_screenshots',
};

// JEDI Forum Endpoints
const JEDI_FORUM_ENDPOINTS = {
  MASTERS_FORUM: 'https://jedi.click/api/forum/masters',
  HIGH_COUNCIL: 'https://jedi.click/api/forum/council',
  ENGINEERING: 'https://jedi.click/api/forum/engineering',
  CLINICAL: 'https://jedi.click/api/forum/clinical',
  SECURITY: 'https://jedi.click/api/forum/security',
  POST: 'https://jedi.click/api/forum/post',
  COMMENT: 'https://jedi.click/api/forum/comment',
  UPLOAD: 'https://jedi.click/api/forum/upload',
  WEBHOOK: 'https://jedi.click/api/forum/webhook',
};

class JEDIForumCrashService {
  private crashReports: ForumCrashReport[] = [];
  private posts: ForumPost[] = [];
  private configs: ForumConfig[] = [];
  private rules: PostingRule[] = [];
  private screenshots: CrashScreenshot[] = [];
  private initialized = false;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [reportsData, postsData, configsData, rulesData, screenshotsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CRASH_REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.POSTS),
        AsyncStorage.getItem(STORAGE_KEYS.CONFIGS),
        AsyncStorage.getItem(STORAGE_KEYS.RULES),
        AsyncStorage.getItem(STORAGE_KEYS.SCREENSHOTS),
      ]);

      this.crashReports = reportsData ? JSON.parse(reportsData) : [];
      this.posts = postsData ? JSON.parse(postsData) : [];
      this.configs = configsData ? JSON.parse(configsData) : this.getDefaultConfigs();
      this.rules = rulesData ? JSON.parse(rulesData) : this.getDefaultRules();
      this.screenshots = screenshotsData ? JSON.parse(screenshotsData) : [];

      this.initialized = true;
      console.log('[JEDI Forum] Service initialized');
    } catch (error) {
      console.error('[JEDI Forum] Failed to initialize:', error);
      this.configs = this.getDefaultConfigs();
      this.rules = this.getDefaultRules();
      this.initialized = true;
    }
  }

  private getDefaultConfigs(): ForumConfig[] {
    return [
      {
        forumType: 'jedi_masters',
        name: 'JEDI Masters Forum',
        description: 'Senior technical leadership forum for critical issues',
        apiEndpoint: JEDI_FORUM_ENDPOINTS.MASTERS_FORUM,
        webhookUrl: `${JEDI_FORUM_ENDPOINTS.WEBHOOK}/masters`,
        autoPost: true,
        severityThreshold: 'high',
        notifyOnPost: true,
        notifyOnAcknowledge: true,
        notifyOnResolve: true,
        moderators: ['master.yoda@jedi.council', 'master.windu@jedi.council'],
        isActive: true,
      },
      {
        forumType: 'high_council',
        name: 'High JEDI Council',
        description: 'Executive council for critical system-wide issues',
        apiEndpoint: JEDI_FORUM_ENDPOINTS.HIGH_COUNCIL,
        webhookUrl: `${JEDI_FORUM_ENDPOINTS.WEBHOOK}/council`,
        autoPost: true,
        severityThreshold: 'critical',
        notifyOnPost: true,
        notifyOnAcknowledge: true,
        notifyOnResolve: true,
        moderators: ['supreme.chancellor@jedi.council', 'grand.master@jedi.council'],
        isActive: true,
      },
      {
        forumType: 'engineering',
        name: 'Engineering Forum',
        description: 'Technical engineering team forum',
        apiEndpoint: JEDI_FORUM_ENDPOINTS.ENGINEERING,
        webhookUrl: `${JEDI_FORUM_ENDPOINTS.WEBHOOK}/engineering`,
        autoPost: true,
        severityThreshold: 'medium',
        notifyOnPost: true,
        notifyOnAcknowledge: false,
        notifyOnResolve: true,
        moderators: ['chief.engineer@medivac.one'],
        isActive: true,
      },
      {
        forumType: 'clinical',
        name: 'Clinical Systems Forum',
        description: 'Clinical staff and patient safety issues',
        apiEndpoint: JEDI_FORUM_ENDPOINTS.CLINICAL,
        webhookUrl: `${JEDI_FORUM_ENDPOINTS.WEBHOOK}/clinical`,
        autoPost: true,
        severityThreshold: 'high',
        notifyOnPost: true,
        notifyOnAcknowledge: true,
        notifyOnResolve: true,
        moderators: ['chief.medical@medivac.one', 'patient.safety@medivac.one'],
        isActive: true,
      },
      {
        forumType: 'security',
        name: 'Security Forum',
        description: 'Security incidents and vulnerabilities',
        apiEndpoint: JEDI_FORUM_ENDPOINTS.SECURITY,
        webhookUrl: `${JEDI_FORUM_ENDPOINTS.WEBHOOK}/security`,
        autoPost: true,
        severityThreshold: 'high',
        notifyOnPost: true,
        notifyOnAcknowledge: true,
        notifyOnResolve: true,
        moderators: ['security.chief@medivac.one'],
        isActive: true,
      },
    ];
  }

  private getDefaultRules(): PostingRule[] {
    return [
      {
        id: 'rule_critical_all',
        name: 'Critical Issues - All Forums',
        condition: {
          severity: ['critical'],
        },
        targetForums: ['high_council', 'jedi_masters'],
        priority: 'urgent',
        autoPost: true,
        requireScreenshot: true,
        notifyUsers: ['emergency@medivac.one', 'oncall@medivac.one'],
      },
      {
        id: 'rule_high_masters',
        name: 'High Severity - Masters Forum',
        condition: {
          severity: ['high'],
          occurrencesMin: 5,
        },
        targetForums: ['jedi_masters', 'engineering'],
        priority: 'high',
        autoPost: true,
        requireScreenshot: true,
        notifyUsers: ['dev-lead@medivac.one'],
      },
      {
        id: 'rule_clinical_safety',
        name: 'Clinical Safety Issues',
        condition: {
          tags: ['patient-safety', 'clinical', 'medical-error'],
        },
        targetForums: ['high_council', 'clinical'],
        priority: 'urgent',
        autoPost: true,
        requireScreenshot: true,
        notifyUsers: ['patient.safety@medivac.one', 'chief.medical@medivac.one'],
      },
      {
        id: 'rule_security_breach',
        name: 'Security Incidents',
        condition: {
          tags: ['security', 'breach', 'vulnerability', 'unauthorized'],
        },
        targetForums: ['high_council', 'security'],
        priority: 'urgent',
        autoPost: true,
        requireScreenshot: true,
        notifyUsers: ['security.chief@medivac.one', 'incident.response@medivac.one'],
      },
      {
        id: 'rule_mass_impact',
        name: 'Mass User Impact',
        condition: {
          affectedUsersMin: 100,
        },
        targetForums: ['high_council', 'jedi_masters'],
        priority: 'urgent',
        autoPost: true,
        requireScreenshot: true,
        notifyUsers: ['executive@medivac.one'],
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CRASH_REPORTS, JSON.stringify(this.crashReports.slice(-200))),
        AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.posts.slice(-500))),
        AsyncStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(this.configs)),
        AsyncStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(this.rules)),
        AsyncStorage.setItem(STORAGE_KEYS.SCREENSHOTS, JSON.stringify(this.screenshots.slice(-500))),
      ]);
    } catch (error) {
      console.error('[JEDI Forum] Failed to save:', error);
    }
  }

  // Screenshot Management
  async captureScreenshot(
    crashId: string,
    screenName: string,
    imageData: string, // base64 or URL
    deviceInfo: CrashScreenshot['deviceInfo']
  ): Promise<CrashScreenshot> {
    await this.initialize();

    const screenshot: CrashScreenshot = {
      id: `screenshot_${Date.now()}`,
      crashId,
      imageUrl: imageData.startsWith('http') ? imageData : `data:image/png;base64,${imageData}`,
      thumbnailUrl: imageData.startsWith('http') ? imageData : `data:image/png;base64,${imageData}`,
      timestamp: new Date().toISOString(),
      screenName,
      annotations: [],
      capturedAt: new Date().toISOString(),
      deviceInfo,
    };

    this.screenshots.push(screenshot);
    await this.save();
    console.log(`[JEDI Forum] Screenshot captured: ${screenshot.id}`);
    return screenshot;
  }

  async addAnnotation(
    screenshotId: string,
    annotation: Omit<ScreenshotAnnotation, 'id'>
  ): Promise<ScreenshotAnnotation | null> {
    await this.initialize();

    const screenshot = this.screenshots.find(s => s.id === screenshotId);
    if (!screenshot) return null;

    const newAnnotation: ScreenshotAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}`,
    };

    screenshot.annotations.push(newAnnotation);
    await this.save();
    console.log(`[JEDI Forum] Annotation added to screenshot ${screenshotId}`);
    return newAnnotation;
  }

  async removeAnnotation(screenshotId: string, annotationId: string): Promise<boolean> {
    await this.initialize();

    const screenshot = this.screenshots.find(s => s.id === screenshotId);
    if (!screenshot) return false;

    const index = screenshot.annotations.findIndex(a => a.id === annotationId);
    if (index === -1) return false;

    screenshot.annotations.splice(index, 1);
    await this.save();
    return true;
  }

  async getScreenshots(crashId: string): Promise<CrashScreenshot[]> {
    await this.initialize();
    return this.screenshots.filter(s => s.crashId === crashId);
  }

  // Crash Report Management
  async createCrashReport(report: Omit<ForumCrashReport, 'id' | 'screenshots'>): Promise<ForumCrashReport> {
    await this.initialize();

    const crashReport: ForumCrashReport = {
      ...report,
      id: `crash_report_${Date.now()}`,
      screenshots: this.screenshots.filter(s => s.crashId === report.crashId),
    };

    this.crashReports.push(crashReport);
    await this.save();

    // Auto-post based on rules
    await this.processAutoPosting(crashReport);

    this.emit('crash_report_created', crashReport);
    return crashReport;
  }

  async getCrashReports(filter?: { severity?: CrashSeverity; platform?: string }): Promise<ForumCrashReport[]> {
    await this.initialize();
    let filtered = [...this.crashReports];

    if (filter?.severity) {
      filtered = filtered.filter(r => r.severity === filter.severity);
    }
    if (filter?.platform) {
      filtered = filtered.filter(r => r.platform === filter.platform);
    }

    return filtered;
  }

  // Auto-Posting Logic
  private async processAutoPosting(report: ForumCrashReport): Promise<void> {
    const matchingRules = this.rules.filter(rule => {
      if (!rule.autoPost) return false;

      const { condition } = rule;

      if (condition.severity && !condition.severity.includes(report.severity)) {
        return false;
      }
      if (condition.platform && !condition.platform.includes(report.platform)) {
        return false;
      }
      if (condition.occurrencesMin && report.occurrences < condition.occurrencesMin) {
        return false;
      }
      if (condition.affectedUsersMin && report.affectedUsers < condition.affectedUsersMin) {
        return false;
      }
      if (condition.tags && !condition.tags.some(tag => report.tags.includes(tag))) {
        return false;
      }

      return true;
    });

    for (const rule of matchingRules) {
      for (const forumType of rule.targetForums) {
        const config = this.configs.find(c => c.forumType === forumType && c.isActive);
        if (config) {
          await this.postToForum(report, forumType, rule.priority, 'MediVac One System', 'Automated Crash Reporter');
        }
      }
    }
  }

  // Forum Posting
  async postToForum(
    report: ForumCrashReport,
    forumType: ForumType,
    priority: ForumPost['priority'],
    author: string,
    authorRole: string
  ): Promise<ForumPost> {
    await this.initialize();

    const config = this.configs.find(c => c.forumType === forumType);
    if (!config || !config.isActive) {
      throw new Error(`Forum ${forumType} is not configured or active`);
    }

    // Generate post content with screenshots and annotations
    const content = this.generatePostContent(report);

    const post: ForumPost = {
      id: `post_${Date.now()}`,
      forumType,
      crashReportId: report.id,
      title: `[${report.severity.toUpperCase()}] ${report.title}`,
      content,
      author,
      authorRole,
      status: 'pending',
      priority,
      screenshots: report.screenshots.map(s => s.imageUrl),
      attachments: [
        { name: 'stack_trace.txt', url: '#', type: 'text/plain' },
        { name: 'device_logs.txt', url: '#', type: 'text/plain' },
      ],
      comments: [],
      views: 0,
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate posting to forum
    try {
      console.log(`[JEDI Forum] Posting to ${forumType}: ${post.title}`);
      await this.simulateForumPost(post, config);
      
      post.status = 'posted';
      post.postedAt = new Date().toISOString();
      post.threadUrl = `${config.apiEndpoint}/thread/${post.id}`;
      
      console.log(`[JEDI Forum] Posted successfully: ${post.threadUrl}`);
    } catch (error) {
      post.status = 'failed';
      console.error(`[JEDI Forum] Failed to post:`, error);
    }

    this.posts.push(post);
    await this.save();

    if (post.status === 'posted' && config.notifyOnPost) {
      this.emit('post_created', { post, config });
    }

    return post;
  }

  private generatePostContent(report: ForumCrashReport): string {
    let content = `## Crash Report: ${report.title}\n\n`;
    content += `**Severity:** ${report.severity.toUpperCase()}\n`;
    content += `**Platform:** ${report.platform}\n`;
    content += `**Build:** v${report.buildVersion} (${report.buildNumber})\n`;
    content += `**Device:** ${report.deviceModel} - ${report.osVersion}\n`;
    content += `**Occurrences:** ${report.occurrences}\n`;
    content += `**Affected Users:** ${report.affectedUsers}\n`;
    content += `**First Occurred:** ${new Date(report.occurredAt).toLocaleString()}\n\n`;

    content += `### Description\n${report.description}\n\n`;

    if (report.steps.length > 0) {
      content += `### Steps to Reproduce\n`;
      report.steps.forEach((step, i) => {
        content += `${i + 1}. ${step}\n`;
      });
      content += '\n';
    }

    if (report.expectedBehavior) {
      content += `### Expected Behavior\n${report.expectedBehavior}\n\n`;
    }

    if (report.actualBehavior) {
      content += `### Actual Behavior\n${report.actualBehavior}\n\n`;
    }

    content += `### Stack Trace\n\`\`\`\n${report.stackTrace}\n\`\`\`\n\n`;

    if (report.screenshots.length > 0) {
      content += `### Screenshots (${report.screenshots.length})\n`;
      report.screenshots.forEach((screenshot, i) => {
        content += `#### Screenshot ${i + 1}: ${screenshot.screenName}\n`;
        content += `- Captured: ${new Date(screenshot.capturedAt).toLocaleString()}\n`;
        content += `- Device: ${screenshot.deviceInfo.model} (${screenshot.deviceInfo.orientation})\n`;
        if (screenshot.annotations.length > 0) {
          content += `- Annotations: ${screenshot.annotations.length}\n`;
          screenshot.annotations.forEach(ann => {
            if (ann.text) {
              content += `  - ${ann.type}: "${ann.text}"\n`;
            }
          });
        }
        content += '\n';
      });
    }

    if (report.workaround) {
      content += `### Workaround\n${report.workaround}\n\n`;
    }

    if (report.tags.length > 0) {
      content += `### Tags\n${report.tags.map(t => `\`${t}\``).join(' ')}\n`;
    }

    return content;
  }

  private async simulateForumPost(post: ForumPost, config: ForumConfig): Promise<void> {
    // Simulate API call to forum
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // Simulate webhook notification
    console.log(`[JEDI Forum] Sending webhook to ${config.webhookUrl}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Post Management
  async getPosts(filter?: { forumType?: ForumType; status?: PostStatus }): Promise<ForumPost[]> {
    await this.initialize();
    let filtered = [...this.posts];

    if (filter?.forumType) {
      filtered = filtered.filter(p => p.forumType === filter.forumType);
    }
    if (filter?.status) {
      filtered = filtered.filter(p => p.status === filter.status);
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPost(postId: string): Promise<ForumPost | null> {
    await this.initialize();
    return this.posts.find(p => p.id === postId) || null;
  }

  async acknowledgePost(postId: string, acknowledgedBy: string): Promise<ForumPost | null> {
    await this.initialize();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;

    post.status = 'acknowledged';
    post.acknowledgedAt = new Date().toISOString();
    post.acknowledgedBy = acknowledgedBy;
    post.updatedAt = new Date().toISOString();

    await this.save();

    const config = this.configs.find(c => c.forumType === post.forumType);
    if (config?.notifyOnAcknowledge) {
      this.emit('post_acknowledged', { post, acknowledgedBy });
    }

    return post;
  }

  async updatePostStatus(postId: string, status: PostStatus): Promise<ForumPost | null> {
    await this.initialize();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;

    post.status = status;
    post.updatedAt = new Date().toISOString();
    await this.save();

    this.emit('post_status_updated', { post, status });
    return post;
  }

  async resolvePost(postId: string, resolvedBy: string, resolution: string): Promise<ForumPost | null> {
    await this.initialize();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;

    post.status = 'resolved';
    post.resolvedAt = new Date().toISOString();
    post.resolvedBy = resolvedBy;
    post.resolution = resolution;
    post.updatedAt = new Date().toISOString();

    await this.save();

    const config = this.configs.find(c => c.forumType === post.forumType);
    if (config?.notifyOnResolve) {
      this.emit('post_resolved', { post, resolvedBy, resolution });
    }

    return post;
  }

  // Comments
  async addComment(
    postId: string,
    author: string,
    authorRole: string,
    content: string,
    isResolution: boolean = false,
    attachments: { name: string; url: string }[] = []
  ): Promise<ForumComment | null> {
    await this.initialize();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;

    const comment: ForumComment = {
      id: `comment_${Date.now()}`,
      postId,
      author,
      authorRole,
      content,
      attachments,
      createdAt: new Date().toISOString(),
      isResolution,
    };

    post.comments.push(comment);
    post.updatedAt = new Date().toISOString();

    if (isResolution) {
      post.status = 'resolved';
      post.resolvedAt = new Date().toISOString();
      post.resolvedBy = author;
      post.resolution = content;
    }

    await this.save();
    this.emit('comment_added', { post, comment });
    return comment;
  }

  // Configuration
  async getConfigs(): Promise<ForumConfig[]> {
    await this.initialize();
    return this.configs;
  }

  async updateConfig(forumType: ForumType, updates: Partial<ForumConfig>): Promise<ForumConfig | null> {
    await this.initialize();
    const config = this.configs.find(c => c.forumType === forumType);
    if (!config) return null;

    Object.assign(config, updates);
    await this.save();
    return config;
  }

  // Rules
  async getRules(): Promise<PostingRule[]> {
    await this.initialize();
    return this.rules;
  }

  async createRule(rule: Omit<PostingRule, 'id'>): Promise<PostingRule> {
    await this.initialize();
    const newRule: PostingRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    this.rules.push(newRule);
    await this.save();
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<PostingRule>): Promise<PostingRule | null> {
    await this.initialize();
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return null;

    Object.assign(rule, updates);
    await this.save();
    return rule;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    await this.initialize();
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    await this.save();
    return true;
  }

  // Analytics
  async getAnalytics(): Promise<ForumAnalytics> {
    await this.initialize();

    const byForum: ForumAnalytics['byForum'] = {} as ForumAnalytics['byForum'];
    const bySeverity: ForumAnalytics['bySeverity'] = {} as ForumAnalytics['bySeverity'];

    for (const forumType of ['jedi_masters', 'high_council', 'engineering', 'clinical', 'security'] as ForumType[]) {
      const forumPosts = this.posts.filter(p => p.forumType === forumType);
      const resolved = forumPosts.filter(p => p.status === 'resolved');
      const avgTime = resolved.length > 0
        ? resolved.reduce((sum, p) => {
            if (p.postedAt && p.resolvedAt) {
              return sum + (new Date(p.resolvedAt).getTime() - new Date(p.postedAt).getTime());
            }
            return sum;
          }, 0) / resolved.length / 3600000
        : 0;

      byForum[forumType] = {
        posts: forumPosts.length,
        resolved: resolved.length,
        avgTime,
      };
    }

    for (const severity of ['critical', 'high', 'medium', 'low'] as CrashSeverity[]) {
      const severityReports = this.crashReports.filter(r => r.severity === severity);
      const severityPosts = this.posts.filter(p => {
        const report = this.crashReports.find(r => r.id === p.crashReportId);
        return report?.severity === severity;
      });

      bySeverity[severity] = {
        posts: severityPosts.length,
        resolved: severityPosts.filter(p => p.status === 'resolved').length,
      };
    }

    // Recent activity (last 7 days)
    const recentActivity: ForumAnalytics['recentActivity'] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayPosts = this.posts.filter(p => p.createdAt.startsWith(dateStr));
      const dayResolved = this.posts.filter(p => p.resolvedAt?.startsWith(dateStr));

      recentActivity.push({
        date: dateStr,
        posts: dayPosts.length,
        resolved: dayResolved.length,
      });
    }

    const resolvedPosts = this.posts.filter(p => p.status === 'resolved');
    const avgResolutionTime = resolvedPosts.length > 0
      ? resolvedPosts.reduce((sum, p) => {
          if (p.postedAt && p.resolvedAt) {
            return sum + (new Date(p.resolvedAt).getTime() - new Date(p.postedAt).getTime());
          }
          return sum;
        }, 0) / resolvedPosts.length / 3600000
      : 0;

    return {
      totalPosts: this.posts.length,
      pendingPosts: this.posts.filter(p => p.status === 'pending' || p.status === 'posted').length,
      acknowledgedPosts: this.posts.filter(p => p.status === 'acknowledged' || p.status === 'investigating').length,
      resolvedPosts: resolvedPosts.length,
      averageResolutionTime: avgResolutionTime,
      byForum,
      bySeverity,
      recentActivity,
    };
  }

  // Event System
  on(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
    console.log(`[JEDI Forum] Event: ${event}`);
  }
}

export const jediForumCrashService = new JEDIForumCrashService();
export default jediForumCrashService;
