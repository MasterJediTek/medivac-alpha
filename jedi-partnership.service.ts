/**
 * JEDI Partnership Service
 * Manages JEDI Systems access, plugins, portals, and integrations
 * Grants automatic access based on subscription tier
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type JEDITier = 'free' | 'pro' | 'enterprise';

export interface JEDISystem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'app' | 'plugin' | 'portal' | 'integration';
  requiredTier: JEDITier;
  url: string;
  apiKey?: string;
  webhookUrl?: string;
  isActive: boolean;
}

export interface JEDIPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  requiredTier: JEDITier;
  installUrl: string;
  configUrl?: string;
  isInstalled: boolean;
  isEnabled: boolean;
}

export interface JEDIPortal {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredTier: JEDITier;
  portalUrl: string;
  accessToken?: string;
  isActive: boolean;
}

export interface JEDIAccess {
  userId: string;
  tier: JEDITier;
  systems: JEDISystem[];
  plugins: JEDIPlugin[];
  portals: JEDIPortal[];
  grantedAt: number;
  expiresAt?: number;
}

const JEDI_SYSTEMS: Record<JEDITier, JEDISystem[]> = {
  free: [
    {
      id: 'jedi-hub',
      name: 'JEDI Hub',
      description: 'Central JEDI systems dashboard',
      icon: 'network',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/hub',
      isActive: true,
    },
    {
      id: 'jedi-docs',
      name: 'JEDI Documentation',
      description: 'JEDI systems documentation and guides',
      icon: 'doc.fill',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/docs',
      isActive: true,
    },
  ],
  pro: [
    {
      id: 'jedi-hub',
      name: 'JEDI Hub',
      description: 'Central JEDI systems dashboard',
      icon: 'network',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/hub',
      isActive: true,
    },
    {
      id: 'jedi-docs',
      name: 'JEDI Documentation',
      description: 'JEDI systems documentation and guides',
      icon: 'doc.fill',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/docs',
      isActive: true,
    },
    {
      id: 'jedi-agent',
      name: 'JEDI Agent',
      description: 'AI automation and control system',
      icon: 'cpu',
      category: 'app',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/agent',
      isActive: true,
    },
    {
      id: 'jedi-integrations',
      name: 'JEDI Integrations',
      description: 'Connect external systems and services',
      icon: 'network',
      category: 'portal',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/integrations',
      isActive: true,
    },
    {
      id: 'jedi-webhooks',
      name: 'JEDI Webhooks',
      description: 'Webhook management and automation',
      icon: 'network',
      category: 'app',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/webhooks',
      isActive: true,
    },
    {
      id: 'jedi-api',
      name: 'JEDI API',
      description: 'RESTful API for JEDI systems',
      icon: 'code',
      category: 'integration',
      requiredTier: 'pro',
      url: 'https://api.jedi.manus.space',
      isActive: true,
    },
  ],
  enterprise: [
    {
      id: 'jedi-hub',
      name: 'JEDI Hub',
      description: 'Central JEDI systems dashboard',
      icon: 'network',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/hub',
      isActive: true,
    },
    {
      id: 'jedi-docs',
      name: 'JEDI Documentation',
      description: 'JEDI systems documentation and guides',
      icon: 'doc.fill',
      category: 'portal',
      requiredTier: 'free',
      url: 'https://jedi.manus.space/docs',
      isActive: true,
    },
    {
      id: 'jedi-agent',
      name: 'JEDI Agent',
      description: 'AI automation and control system',
      icon: 'cpu',
      category: 'app',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/agent',
      isActive: true,
    },
    {
      id: 'jedi-integrations',
      name: 'JEDI Integrations',
      description: 'Connect external systems and services',
      icon: 'network',
      category: 'portal',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/integrations',
      isActive: true,
    },
    {
      id: 'jedi-webhooks',
      name: 'JEDI Webhooks',
      description: 'Webhook management and automation',
      icon: 'network',
      category: 'app',
      requiredTier: 'pro',
      url: 'https://jedi.manus.space/webhooks',
      isActive: true,
    },
    {
      id: 'jedi-api',
      name: 'JEDI API',
      description: 'RESTful API for JEDI systems',
      icon: 'code',
      category: 'integration',
      requiredTier: 'pro',
      url: 'https://api.jedi.manus.space',
      isActive: true,
    },
    {
      id: 'jedi-console',
      name: 'JEDI Console',
      description: 'Advanced control console for enterprise',
      icon: 'terminal.fill',
      category: 'app',
      requiredTier: 'enterprise',
      url: 'https://jedi.manus.space/console',
      isActive: true,
    },
    {
      id: 'jedi-analytics',
      name: 'JEDI Analytics',
      description: 'Advanced analytics and reporting',
      icon: 'chart.bar.fill',
      category: 'portal',
      requiredTier: 'enterprise',
      url: 'https://jedi.manus.space/analytics',
      isActive: true,
    },
    {
      id: 'jedi-security',
      name: 'JEDI Security',
      description: 'Advanced security and compliance',
      icon: 'shield.fill',
      category: 'app',
      requiredTier: 'enterprise',
      url: 'https://jedi.manus.space/security',
      isActive: true,
    },
    {
      id: 'jedi-support',
      name: 'JEDI Enterprise Support',
      description: 'Dedicated enterprise support portal',
      icon: 'person.2.fill',
      category: 'portal',
      requiredTier: 'enterprise',
      url: 'https://jedi.manus.space/support',
      isActive: true,
    },
  ],
};

const JEDI_PLUGINS: Record<JEDITier, JEDIPlugin[]> = {
  free: [],
  pro: [
    {
      id: 'jedi-slack-plugin',
      name: 'Slack Integration',
      version: '1.0.0',
      description: 'Connect JEDI to Slack for notifications',
      icon: 'message.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/slack/install',
      configUrl: 'https://jedi.manus.space/plugins/slack/config',
      isInstalled: false,
      isEnabled: false,
    },
    {
      id: 'jedi-teams-plugin',
      name: 'Microsoft Teams Integration',
      version: '1.0.0',
      description: 'Connect JEDI to Microsoft Teams',
      icon: 'person.2.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/teams/install',
      configUrl: 'https://jedi.manus.space/plugins/teams/config',
      isInstalled: false,
      isEnabled: false,
    },
    {
      id: 'jedi-email-plugin',
      name: 'Email Notifications',
      version: '1.0.0',
      description: 'Send JEDI alerts via email',
      icon: 'envelope.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/email/install',
      configUrl: 'https://jedi.manus.space/plugins/email/config',
      isInstalled: false,
      isEnabled: false,
    },
  ],
  enterprise: [
    {
      id: 'jedi-slack-plugin',
      name: 'Slack Integration',
      version: '1.0.0',
      description: 'Connect JEDI to Slack for notifications',
      icon: 'message.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/slack/install',
      configUrl: 'https://jedi.manus.space/plugins/slack/config',
      isInstalled: false,
      isEnabled: false,
    },
    {
      id: 'jedi-teams-plugin',
      name: 'Microsoft Teams Integration',
      version: '1.0.0',
      description: 'Connect JEDI to Microsoft Teams',
      icon: 'person.2.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/teams/install',
      configUrl: 'https://jedi.manus.space/plugins/teams/config',
      isInstalled: false,
      isEnabled: false,
    },
    {
      id: 'jedi-email-plugin',
      name: 'Email Notifications',
      version: '1.0.0',
      description: 'Send JEDI alerts via email',
      icon: 'envelope.fill',
      requiredTier: 'pro',
      installUrl: 'https://jedi.manus.space/plugins/email/install',
      configUrl: 'https://jedi.manus.space/plugins/email/config',
      isInstalled: false,
      isEnabled: false,
    },
    {
      id: 'jedi-custom-plugin',
      name: 'Custom Plugin Builder',
      version: '1.0.0',
      description: 'Build custom JEDI plugins',
      icon: 'cube.fill',
      requiredTier: 'enterprise',
      installUrl: 'https://jedi.manus.space/plugins/custom/install',
      configUrl: 'https://jedi.manus.space/plugins/custom/config',
      isInstalled: false,
      isEnabled: false,
    },
  ],
};

class JEDIPartnershipService {
  private userAccess: JEDIAccess | null = null;
  private currentTier: JEDITier = 'free';

  async initialize(userId: string, tier: JEDITier): Promise<void> {
    this.currentTier = tier;
    await this.grantAccess(userId, tier);
  }

  /**
   * Grant JEDI access based on subscription tier
   */
  async grantAccess(userId: string, tier: JEDITier): Promise<JEDIAccess> {
    const systems = JEDI_SYSTEMS[tier] || [];
    const plugins = JEDI_PLUGINS[tier] || [];

    this.userAccess = {
      userId,
      tier,
      systems,
      plugins,
      portals: systems.filter(s => s.category === 'portal'),
      grantedAt: Date.now(),
    };

    await this.saveAccess();
    return this.userAccess;
  }

  /**
   * Get accessible JEDI systems
   */
  getSystems(): JEDISystem[] {
    return this.userAccess?.systems || [];
  }

  /**
   * Get accessible JEDI plugins
   */
  getPlugins(): JEDIPlugin[] {
    return this.userAccess?.plugins || [];
  }

  /**
   * Get accessible JEDI portals
   */
  getPortals(): JEDIPortal[] {
    return this.userAccess?.portals || [];
  }

  /**
   * Check if system is accessible
   */
  hasSystemAccess(systemId: string): boolean {
    return this.userAccess?.systems.some(s => s.id === systemId) || false;
  }

  /**
   * Check if plugin is accessible
   */
  hasPluginAccess(pluginId: string): boolean {
    return this.userAccess?.plugins.some(p => p.id === pluginId) || false;
  }

  /**
   * Check if portal is accessible
   */
  hasPortalAccess(portalId: string): boolean {
    return this.userAccess?.portals.some(p => p.id === portalId) || false;
  }

  /**
   * Install plugin
   */
  async installPlugin(pluginId: string): Promise<JEDIPlugin | null> {
    const plugin = this.userAccess?.plugins.find(p => p.id === pluginId);
    if (!plugin) return null;

    plugin.isInstalled = true;
    await this.saveAccess();
    return plugin;
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.userAccess?.plugins.find(p => p.id === pluginId);
    if (plugin) {
      plugin.isInstalled = false;
      plugin.isEnabled = false;
      await this.saveAccess();
    }
  }

  /**
   * Enable plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.userAccess?.plugins.find(p => p.id === pluginId);
    if (plugin && plugin.isInstalled) {
      plugin.isEnabled = true;
      await this.saveAccess();
    }
  }

  /**
   * Disable plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.userAccess?.plugins.find(p => p.id === pluginId);
    if (plugin) {
      plugin.isEnabled = false;
      await this.saveAccess();
    }
  }

  /**
   * Get access stats
   */
  getAccessStats() {
    return {
      tier: this.currentTier,
      systemsCount: this.userAccess?.systems.length || 0,
      pluginsCount: this.userAccess?.plugins.length || 0,
      portalsCount: this.userAccess?.portals.length || 0,
      installedPlugins: this.userAccess?.plugins.filter(p => p.isInstalled).length || 0,
      enabledPlugins: this.userAccess?.plugins.filter(p => p.isEnabled).length || 0,
    };
  }

  /**
   * Get JEDI system by ID
   */
  getSystem(systemId: string): JEDISystem | undefined {
    return this.userAccess?.systems.find(s => s.id === systemId);
  }

  /**
   * Get JEDI plugin by ID
   */
  getPlugin(pluginId: string): JEDIPlugin | undefined {
    return this.userAccess?.plugins.find(p => p.id === pluginId);
  }

  /**
   * Get JEDI portal by ID
   */
  getPortal(portalId: string): JEDIPortal | undefined {
    return this.userAccess?.portals.find(p => p.id === portalId);
  }

  // Private methods

  private async saveAccess(): Promise<void> {
    try {
      if (this.userAccess) {
        await AsyncStorage.setItem('jedi_access', JSON.stringify(this.userAccess));
      }
    } catch (error) {
      console.error('[JEDI Partnership] Error saving access:', error);
    }
  }

  private async loadAccess(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('jedi_access');
      if (stored) {
        this.userAccess = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[JEDI Partnership] Error loading access:', error);
    }
  }
}

export const jediPartnershipService = new JEDIPartnershipService();
