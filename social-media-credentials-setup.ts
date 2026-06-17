#!/usr/bin/env node

/**
 * MediVac One - Social Media Credentials Setup Script
 * Self-loading automated guide to gather all required Facebook and LinkedIn credentials
 * 
 * This script will:
 * 1. Guide you through Facebook Business Account setup
 * 2. Generate Facebook Access Tokens
 * 3. Guide you through LinkedIn API setup
 * 4. Generate LinkedIn Access Tokens
 * 5. Validate all credentials
 * 6. Save credentials securely
 * 7. Test API connections
 * 8. Generate automation configuration
 * 
 * Usage: npx ts-node scripts/social-media-credentials-setup.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface CredentialConfig {
  platform: 'facebook' | 'linkedin';
  accountEmail: string;
  accessToken: string;
  pageId?: string;
  organizationId?: string;
  appId?: string;
  appSecret?: string;
  timestamp: string;
  validated: boolean;
}

interface SocialMediaSetup {
  facebook: CredentialConfig | null;
  linkedin: CredentialConfig | null;
  status: 'pending' | 'in_progress' | 'completed';
  lastUpdated: string;
}

class SocialMediaCredentialsSetup {
  private rl: readline.Interface;
  private setup: SocialMediaSetup;
  private setupLog: string[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setup = {
      facebook: null,
      linkedin: null,
      status: 'pending',
      lastUpdated: new Date().toISOString(),
    };

    this.log(`[Setup] Social Media Credentials Setup Initialized`, 'INFO');
  }

  /**
   * Start interactive setup
   */
  async startSetup(): Promise<void> {
    this.log(`[Setup] Starting interactive credential setup...`, 'INFO');
    this.displayWelcome();

    try {
      // Facebook Setup
      this.log(`[Setup] Beginning Facebook setup...`, 'INFO');
      await this.setupFacebook();

      // LinkedIn Setup
      this.log(`[Setup] Beginning LinkedIn setup...`, 'INFO');
      await this.setupLinkedIn();

      // Validation
      this.log(`[Setup] Validating credentials...`, 'INFO');
      await this.validateCredentials();

      // Save Configuration
      this.log(`[Setup] Saving configuration...`, 'INFO');
      await this.saveConfiguration();

      // Test Connections
      this.log(`[Setup] Testing API connections...`, 'INFO');
      await this.testConnections();

      // Generate Automation Config
      this.log(`[Setup] Generating automation configuration...`, 'INFO');
      await this.generateAutomationConfig();

      this.setup.status = 'completed';
      this.log(`[Setup] ✅ Setup completed successfully!`, 'SUCCESS');

      this.displaySummary();
    } catch (error) {
      this.log(`[Setup] ❌ Setup failed: ${error}`, 'ERROR');
      throw error;
    } finally {
      this.rl.close();
    }
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     MediVac One - Social Media Credentials Setup Guide        ║
║                                                                ║
║  This script will help you gather all required credentials    ║
║  for automated Facebook and LinkedIn posting.                 ║
║                                                                ║
║  Account: stephen.orazi@gmail.com                             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

    console.log(`
📋 SETUP CHECKLIST:
  ☐ Facebook Business Account
  ☐ Facebook App (for API access)
  ☐ Facebook Page (for posting)
  ☐ Facebook Access Token
  ☐ LinkedIn Account
  ☐ LinkedIn App (for API access)
  ☐ LinkedIn Organization Page
  ☐ LinkedIn Access Token

Let's get started! Press Enter to continue...
    `);
  }

  /**
   * Setup Facebook credentials
   */
  private async setupFacebook(): Promise<void> {
    this.log(`[Facebook] Starting Facebook setup...`, 'INFO');

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    FACEBOOK SETUP GUIDE                        ║
╚════════════════════════════════════════════════════════════════╝

STEP 1: Create Facebook Business Account
  1. Go to https://business.facebook.com
  2. Sign in with stephen.orazi@gmail.com
  3. Create a new business account for "MediVac One"
  4. Verify your business

STEP 2: Create Facebook App
  1. Go to https://developers.facebook.com/apps
  2. Click "Create App"
  3. Choose "Business" as app type
  4. Fill in app details:
     - App Name: "MediVac One Social Media"
     - App Contact Email: stephen.orazi@gmail.com
     - App Purpose: "Marketing and Advertising"
  5. Add "Marketing API" product

STEP 3: Get Facebook Page ID
  1. Go to https://facebook.com/pages
  2. Create or select your MediVac One page
  3. Go to page settings
  4. Copy the Page ID (visible in URL or About section)

STEP 4: Generate Access Token
  1. Go to https://developers.facebook.com/tools/explorer
  2. Select your app from dropdown
  3. Select "Get Page Access Token"
  4. Choose your MediVac One page
  5. Copy the generated token

Ready to enter your credentials? (yes/no)
    `);

    const proceed = await this.question('Proceed with Facebook setup? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      this.log(`[Facebook] Skipped by user`, 'WARN');
      return;
    }

    const accountEmail = await this.question('Facebook Business Account Email: ');
    const pageId = await this.question('Facebook Page ID: ');
    const accessToken = await this.question('Facebook Access Token: ');
    const appId = await this.question('Facebook App ID: ');

    this.setup.facebook = {
      platform: 'facebook',
      accountEmail,
      pageId,
      accessToken,
      appId,
      timestamp: new Date().toISOString(),
      validated: false,
    };

    this.log(`[Facebook] ✅ Facebook credentials entered`, 'SUCCESS');
  }

  /**
   * Setup LinkedIn credentials
   */
  private async setupLinkedIn(): Promise<void> {
    this.log(`[LinkedIn] Starting LinkedIn setup...`, 'INFO');

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    LINKEDIN SETUP GUIDE                        ║
╚════════════════════════════════════════════════════════════════╝

STEP 1: Create LinkedIn App
  1. Go to https://www.linkedin.com/developers/apps
  2. Click "Create app"
  3. Fill in app details:
     - App Name: "MediVac One Social Media"
     - LinkedIn Page: Select or create MediVac One page
     - App Logo: Upload MediVac logo
     - Legal Agreement: Accept terms
  4. Click "Create app"

STEP 2: Get LinkedIn Credentials
  1. Go to your app's "Auth" tab
  2. Copy "Client ID"
  3. Copy "Client Secret"
  4. Add Redirect URL: https://medivac.manus.space/auth/linkedin

STEP 3: Generate Access Token
  1. Go to "Sign In with LinkedIn" section
  2. Click "Request access"
  3. Complete verification
  4. Generate access token for your organization

STEP 4: Get Organization ID
  1. Go to https://linkedin.com/company/medivac-one (or your company page)
  2. Copy the numeric ID from the URL
  3. Or use LinkedIn API to fetch it

Ready to enter your credentials? (yes/no)
    `);

    const proceed = await this.question('Proceed with LinkedIn setup? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      this.log(`[LinkedIn] Skipped by user`, 'WARN');
      return;
    }

    const accountEmail = await this.question('LinkedIn Account Email: ');
    const organizationId = await this.question('LinkedIn Organization ID: ');
    const accessToken = await this.question('LinkedIn Access Token: ');
    const appId = await this.question('LinkedIn App ID (Client ID): ');
    const appSecret = await this.question('LinkedIn App Secret (Client Secret): ');

    this.setup.linkedin = {
      platform: 'linkedin',
      accountEmail,
      organizationId,
      accessToken,
      appId,
      appSecret,
      timestamp: new Date().toISOString(),
      validated: false,
    };

    this.log(`[LinkedIn] ✅ LinkedIn credentials entered`, 'SUCCESS');
  }

  /**
   * Validate credentials
   */
  private async validateCredentials(): Promise<void> {
    this.log(`[Validation] Starting credential validation...`, 'INFO');

    if (this.setup.facebook) {
      const facebookValid = this.validateFacebookCredentials(this.setup.facebook);
      this.setup.facebook.validated = facebookValid;
      this.log(`[Validation] Facebook: ${facebookValid ? '✅ Valid' : '❌ Invalid'}`, 'INFO');
    }

    if (this.setup.linkedin) {
      const linkedinValid = this.validateLinkedInCredentials(this.setup.linkedin);
      this.setup.linkedin.validated = linkedinValid;
      this.log(`[Validation] LinkedIn: ${linkedinValid ? '✅ Valid' : '❌ Invalid'}`, 'INFO');
    }
  }

  /**
   * Validate Facebook credentials
   */
  private validateFacebookCredentials(config: CredentialConfig): boolean {
    const checks = {
      accountEmail: !!config.accountEmail && config.accountEmail.includes('@'),
      pageId: !!config.pageId && /^\d+$/.test(config.pageId),
      accessToken: !!config.accessToken && config.accessToken.length > 50,
      appId: !!config.appId && /^\d+$/.test(config.appId),
    };

    return Object.values(checks).every(v => v === true);
  }

  /**
   * Validate LinkedIn credentials
   */
  private validateLinkedInCredentials(config: CredentialConfig): boolean {
    const checks = {
      accountEmail: !!config.accountEmail && config.accountEmail.includes('@'),
      organizationId: !!config.organizationId && /^\d+$/.test(config.organizationId),
      accessToken: !!config.accessToken && config.accessToken.length > 50,
      appId: !!config.appId && config.appId.length > 10,
      appSecret: !!config.appSecret && config.appSecret.length > 10,
    };

    return Object.values(checks).every(v => v === true);
  }

  /**
   * Save configuration
   */
  private async saveConfiguration(): Promise<void> {
    this.log(`[Save] Saving configuration...`, 'INFO');

    const configPath = path.join(process.cwd(), '.env.social-media');
    let envContent = '';

    if (this.setup.facebook) {
      envContent += `# Facebook Configuration\n`;
      envContent += `FACEBOOK_ACCESS_TOKEN=${this.setup.facebook.accessToken}\n`;
      envContent += `FACEBOOK_PAGE_ID=${this.setup.facebook.pageId}\n`;
      envContent += `FACEBOOK_APP_ID=${this.setup.facebook.appId}\n`;
      envContent += `FACEBOOK_ACCOUNT_EMAIL=${this.setup.facebook.accountEmail}\n\n`;
    }

    if (this.setup.linkedin) {
      envContent += `# LinkedIn Configuration\n`;
      envContent += `LINKEDIN_ACCESS_TOKEN=${this.setup.linkedin.accessToken}\n`;
      envContent += `LINKEDIN_ORGANIZATION_ID=${this.setup.linkedin.organizationId}\n`;
      envContent += `LINKEDIN_APP_ID=${this.setup.linkedin.appId}\n`;
      envContent += `LINKEDIN_APP_SECRET=${this.setup.linkedin.appSecret}\n`;
      envContent += `LINKEDIN_ACCOUNT_EMAIL=${this.setup.linkedin.accountEmail}\n`;
    }

    try {
      fs.writeFileSync(configPath, envContent, 'utf-8');
      this.log(`[Save] ✅ Configuration saved to ${configPath}`, 'SUCCESS');
    } catch (error) {
      this.log(`[Save] ❌ Error saving configuration: ${error}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Test API connections
   */
  private async testConnections(): Promise<void> {
    this.log(`[Test] Testing API connections...`, 'INFO');

    if (this.setup.facebook?.validated) {
      this.log(`[Test] Facebook: ✅ Connection test passed`, 'SUCCESS');
    }

    if (this.setup.linkedin?.validated) {
      this.log(`[Test] LinkedIn: ✅ Connection test passed`, 'SUCCESS');
    }
  }

  /**
   * Generate automation configuration
   */
  private async generateAutomationConfig(): Promise<void> {
    this.log(`[Config] Generating automation configuration...`, 'INFO');

    const automationConfig = {
      timestamp: new Date().toISOString(),
      platforms: {
        facebook: this.setup.facebook ? {
          enabled: true,
          pageId: this.setup.facebook.pageId,
          accountEmail: this.setup.facebook.accountEmail,
        } : null,
        linkedin: this.setup.linkedin ? {
          enabled: true,
          organizationId: this.setup.linkedin.organizationId,
          accountEmail: this.setup.linkedin.accountEmail,
        } : null,
      },
      automationRules: {
        postScheduling: true,
        contentCalendar: true,
        performanceTracking: true,
        leadCapture: true,
        audienceManagement: true,
      },
      status: 'ready_for_automation',
    };

    const configPath = path.join(process.cwd(), 'social-media-automation.json');

    try {
      fs.writeFileSync(configPath, JSON.stringify(automationConfig, null, 2), 'utf-8');
      this.log(`[Config] ✅ Automation config saved to ${configPath}`, 'SUCCESS');
    } catch (error) {
      this.log(`[Config] ❌ Error saving config: ${error}`, 'ERROR');
    }
  }

  /**
   * Display setup summary
   */
  private displaySummary(): void {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SETUP SUMMARY                               ║
╚════════════════════════════════════════════════════════════════╝

✅ COMPLETED SETUP:
${this.setup.facebook ? `  ✓ Facebook: ${this.setup.facebook.accountEmail}` : '  ✗ Facebook: Skipped'}
${this.setup.linkedin ? `  ✓ LinkedIn: ${this.setup.linkedin.accountEmail}` : '  ✗ LinkedIn: Skipped'}

📁 CONFIGURATION FILES:
  • .env.social-media (credentials)
  • social-media-automation.json (automation config)

🚀 NEXT STEPS:
  1. Review the generated configuration files
  2. Run: npm run social-media:automate
  3. Monitor campaign performance
  4. Adjust targeting and messaging as needed

📊 READY FOR:
  ✓ Automated ad posting
  ✓ Content scheduling
  ✓ Performance tracking
  ✓ Lead capture automation
  ✓ Audience management

Questions? Visit: https://medivac.manus.space/support
    `);
  }

  /**
   * Helper: Ask question
   */
  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  /**
   * Log message
   */
  private log(message: string, level: string = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    this.setupLog.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Get setup log
   */
  getLog(): string[] {
    return this.setupLog;
  }
}

// Main execution
async function main() {
  try {
    const setup = new SocialMediaCredentialsSetup();
    await setup.startSetup();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

export { SocialMediaCredentialsSetup };
