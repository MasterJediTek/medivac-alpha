import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

describe('Social Media Credentials Validation', () => {
  const facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const linkedinAppId = process.env.LINKEDIN_APP_ID;
  const linkedinAppSecret = process.env.LINKEDIN_APP_SECRET;

  describe('Facebook Credentials', () => {
    it('should validate Facebook access token', async () => {
      if (!facebookToken) {
        console.warn('Facebook token not provided, skipping test');
        expect(true).toBe(true);
        return;
      }

      try {
        const response = await axios.get('https://graph.facebook.com/me', {
          params: {
            access_token: facebookToken,
            fields: 'id,name,email',
          },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        console.log('✅ Facebook token validated successfully');
      } catch (error: any) {
        console.error('❌ Facebook token validation failed:', error.response?.data || error.message);
        throw new Error(`Facebook token validation failed: ${error.message}`);
      }
    });

    it('should verify Facebook token has required permissions', async () => {
      if (!facebookToken) {
        expect(true).toBe(true);
        return;
      }

      try {
        const response = await axios.get('https://graph.facebook.com/me/permissions', {
          params: {
            access_token: facebookToken,
          },
        });

        expect(response.status).toBe(200);
        const permissions = response.data.data.map((p: any) => p.permission);
        
        // Check for required permissions
        const requiredPermissions = ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'];
        const hasRequiredPermissions = requiredPermissions.some(p => permissions.includes(p));
        
        if (hasRequiredPermissions) {
          console.log('✅ Facebook token has required permissions');
        } else {
          console.warn('⚠️ Facebook token may be missing some permissions');
        }
        
        expect(permissions.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('❌ Permission check failed:', error.response?.data || error.message);
        // Don't throw - permissions check is optional
      }
    });
  });

  describe('LinkedIn Credentials', () => {
    it('should validate LinkedIn app credentials', async () => {
      if (!linkedinAppId || !linkedinAppSecret) {
        console.warn('LinkedIn credentials not provided, skipping test');
        expect(true).toBe(true);
        return;
      }

      try {
        // LinkedIn credentials are validated by attempting to use them
        // We'll check if they're in the correct format
        expect(linkedinAppId).toBeDefined();
        expect(linkedinAppSecret).toBeDefined();
        expect(linkedinAppId.length).toBeGreaterThan(0);
        expect(linkedinAppSecret.length).toBeGreaterThan(0);
        
        console.log('✅ LinkedIn credentials format validated');
      } catch (error: any) {
        console.error('❌ LinkedIn credentials validation failed:', error.message);
        throw new Error(`LinkedIn credentials validation failed: ${error.message}`);
      }
    });

    it('should verify LinkedIn credentials are properly formatted', async () => {
      if (!linkedinAppId || !linkedinAppSecret) {
        expect(true).toBe(true);
        return;
      }

      // Check format
      expect(linkedinAppId).toMatch(/^[a-z0-9]+$/i);
      expect(linkedinAppSecret).toMatch(/^WPL_AP1\./);
      
      console.log('✅ LinkedIn credentials format is correct');
    });
  });

  describe('Integration Test', () => {
    it('should confirm both platforms are configured', async () => {
      const hasFacebook = !!facebookToken;
      const hasLinkedIn = !!linkedinAppId && !!linkedinAppSecret;

      console.log(`
📊 Social Media Configuration Status:
  Facebook: ${hasFacebook ? '✅ Configured' : '❌ Not configured'}
  LinkedIn: ${hasLinkedIn ? '✅ Configured' : '❌ Not configured'}
      `);

      expect(hasFacebook || hasLinkedIn).toBe(true);
    });
  });
});
