/**
 * MediVac One - Social Media Connector Service
 * Automated Facebook and LinkedIn posting with scheduling, analytics, and lead capture
 */

import axios, { AxiosInstance } from 'axios';

interface SocialMediaPost {
  id: string;
  platform: 'facebook' | 'linkedin';
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: PostMetrics;
  createdAt: Date;
  publishedAt?: Date;
}

interface PostMetrics {
  impressions: number;
  clicks: number;
  engagements: number;
  shares: number;
  comments: number;
  reactions: number;
  ctr: number;
  engagement_rate: number;
}

interface CampaignConfig {
  name: string;
  description: string;
  platforms: ('facebook' | 'linkedin')[];
  startDate: Date;
  endDate: Date;
  budget?: number;
  targetAudience: {
    ageRange: [number, number];
    locations: string[];
    interests: string[];
    jobTitles?: string[];
  };
  posts: SocialMediaPost[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export class SocialMediaConnectorService {
  private facebookClient: AxiosInstance | null = null;
  private linkedinClient: AxiosInstance | null = null;
  private campaigns: Map<string, CampaignConfig> = new Map();
  private posts: Map<string, SocialMediaPost> = new Map();

  constructor(
    private facebookToken?: string,
    private facebookPageId?: string,
    private linkedinToken?: string,
    private linkedinOrgId?: string
  ) {
    this.initializeClients();
  }

  /**
   * Initialize API clients
   */
  private initializeClients(): void {
    if (this.facebookToken) {
      this.facebookClient = axios.create({
        baseURL: 'https://graph.facebook.com/v18.0',
        params: {
          access_token: this.facebookToken,
        },
      });
    }

    if (this.linkedinToken) {
      this.linkedinClient = axios.create({
        baseURL: 'https://api.linkedin.com/v2',
        headers: {
          Authorization: `Bearer ${this.linkedinToken}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Create and schedule a post
   */
  async createPost(
    platform: 'facebook' | 'linkedin',
    content: string,
    media?: { type: 'image' | 'video'; url: string },
    scheduledTime?: Date
  ): Promise<SocialMediaPost> {
    const post: SocialMediaPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform,
      content,
      media,
      scheduledTime,
      status: scheduledTime ? 'scheduled' : 'draft',
      createdAt: new Date(),
    };

    this.posts.set(post.id, post);

    if (scheduledTime) {
      this.schedulePost(post);
    }

    return post;
  }

  /**
   * Schedule post for later publishing
   */
  private schedulePost(post: SocialMediaPost): void {
    if (!post.scheduledTime) return;

    const delay = post.scheduledTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => this.publishPost(post.id), delay);
    }
  }

  /**
   * Publish post to Facebook
   */
  async publishToFacebook(postId: string): Promise<boolean> {
    const post = this.posts.get(postId);
    if (!post || !this.facebookClient || !this.facebookPageId) {
      return false;
    }

    try {
      const payload: any = {
        message: post.content,
      };

      if (post.media) {
        if (post.media.type === 'image') {
          payload.url = post.media.url;
        } else if (post.media.type === 'video') {
          payload.video_url = post.media.url;
        }
      }

      const response = await this.facebookClient.post(`/${this.facebookPageId}/feed`, payload);

      post.status = 'published';
      post.publishedAt = new Date();

      return !!response.data.id;
    } catch (error) {
      post.status = 'failed';
      console.error('Facebook publish error:', error);
      return false;
    }
  }

  /**
   * Publish post to LinkedIn
   */
  async publishToLinkedIn(postId: string): Promise<boolean> {
    const post = this.posts.get(postId);
    if (!post || !this.linkedinClient || !this.linkedinOrgId) {
      return false;
    }

    try {
      const payload: any = {
        author: `urn:li:organization:${this.linkedinOrgId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      if (post.media) {
        payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory =
          post.media.type === 'image' ? 'IMAGE' : 'VIDEO';
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            media: post.media.url,
          },
        ];
      }

      const response = await this.linkedinClient.post('/ugcPosts', payload);

      post.status = 'published';
      post.publishedAt = new Date();

      return !!response.data.id;
    } catch (error) {
      post.status = 'failed';
      console.error('LinkedIn publish error:', error);
      return false;
    }
  }

  /**
   * Publish post to all configured platforms
   */
  async publishPost(postId: string): Promise<boolean> {
    const post = this.posts.get(postId);
    if (!post) return false;

    let success = false;

    if (post.platform === 'facebook' || post.platform === 'linkedin') {
      if (post.platform === 'facebook') {
        success = await this.publishToFacebook(postId);
      } else {
        success = await this.publishToLinkedIn(postId);
      }
    }

    return success;
  }

  /**
   * Create a campaign
   */
  async createCampaign(config: Omit<CampaignConfig, 'posts' | 'status'>): Promise<CampaignConfig> {
    const campaign: CampaignConfig = {
      ...config,
      posts: [],
      status: 'draft',
    };

    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  /**
   * Add post to campaign
   */
  async addPostToCampaign(campaignId: string, post: SocialMediaPost): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    campaign.posts.push(post);
    return true;
  }

  /**
   * Launch campaign
   */
  async launchCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    campaign.status = 'active';

    for (const post of campaign.posts) {
      if (post.status === 'scheduled' || post.status === 'draft') {
        await this.publishPost(post.id);
      }
    }

    return true;
  }

  /**
   * Get post metrics
   */
  async getPostMetrics(postId: string): Promise<PostMetrics | null> {
    const post = this.posts.get(postId);
    if (!post || !post.publishedAt) return null;

    try {
      let metrics: PostMetrics | null = null;

      if (post.platform === 'facebook' && this.facebookClient) {
        metrics = await this.getFacebookMetrics(postId);
      } else if (post.platform === 'linkedin' && this.linkedinClient) {
        metrics = await this.getLinkedInMetrics(postId);
      }

      if (metrics) {
        post.metrics = metrics;
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  }

  /**
   * Get Facebook post metrics
   */
  private async getFacebookMetrics(postId: string): Promise<PostMetrics | null> {
    if (!this.facebookClient) return null;

    try {
      const response = await this.facebookClient.get(`/${postId}/insights`, {
        params: {
          metric: 'post_impressions,post_clicks,post_engaged_users,post_shares,post_comments_count',
        },
      });

      const data = response.data.data || [];
      const metrics: PostMetrics = {
        impressions: data.find((m: any) => m.name === 'post_impressions')?.values?.[0]?.value || 0,
        clicks: data.find((m: any) => m.name === 'post_clicks')?.values?.[0]?.value || 0,
        engagements: data.find((m: any) => m.name === 'post_engaged_users')?.values?.[0]?.value || 0,
        shares: data.find((m: any) => m.name === 'post_shares')?.values?.[0]?.value || 0,
        comments: data.find((m: any) => m.name === 'post_comments_count')?.values?.[0]?.value || 0,
        reactions: 0,
        ctr: 0,
        engagement_rate: 0,
      };

      if (metrics.impressions > 0) {
        metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
        metrics.engagement_rate = (metrics.engagements / metrics.impressions) * 100;
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching Facebook metrics:', error);
      return null;
    }
  }

  /**
   * Get LinkedIn post metrics
   */
  private async getLinkedInMetrics(postId: string): Promise<PostMetrics | null> {
    if (!this.linkedinClient) return null;

    try {
      const response = await this.linkedinClient.get(`/posts/${postId}`, {
        params: {
          fields: 'impressionCount,clickCount,likeCount,commentCount,shareCount',
        },
      });

      const data = response.data;
      const metrics: PostMetrics = {
        impressions: data.impressionCount || 0,
        clicks: data.clickCount || 0,
        engagements: (data.likeCount || 0) + (data.commentCount || 0),
        shares: data.shareCount || 0,
        comments: data.commentCount || 0,
        reactions: data.likeCount || 0,
        ctr: 0,
        engagement_rate: 0,
      };

      if (metrics.impressions > 0) {
        metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
        metrics.engagement_rate = (metrics.engagements / metrics.impressions) * 100;
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching LinkedIn metrics:', error);
      return null;
    }
  }

  /**
   * Get all posts
   */
  getAllPosts(): SocialMediaPost[] {
    return Array.from(this.posts.values());
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): CampaignConfig[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): CampaignConfig | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: 'draft' | 'active' | 'paused' | 'completed'
  ): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    campaign.status = status;
    return true;
  }

  /**
   * Generate campaign report
   */
  async generateCampaignReport(campaignId: string): Promise<any> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const report = {
      campaignId,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      totalPosts: campaign.posts.length,
      publishedPosts: campaign.posts.filter(p => p.status === 'published').length,
      failedPosts: campaign.posts.filter(p => p.status === 'failed').length,
      metrics: {
        totalImpressions: 0,
        totalClicks: 0,
        totalEngagements: 0,
        averageCTR: 0,
        averageEngagementRate: 0,
      },
      postDetails: [] as any[],
    };

    for (const post of campaign.posts) {
      if (post.metrics) {
        report.metrics.totalImpressions += post.metrics.impressions;
        report.metrics.totalClicks += post.metrics.clicks;
        report.metrics.totalEngagements += post.metrics.engagements;

        report.postDetails.push({
          id: post.id,
          platform: post.platform,
          status: post.status,
          publishedAt: post.publishedAt,
          metrics: post.metrics,
        });
      }
    }

    if (campaign.posts.length > 0) {
      const publishedPosts = campaign.posts.filter(p => p.metrics);
      if (publishedPosts.length > 0) {
        report.metrics.averageCTR =
          publishedPosts.reduce((sum, p) => sum + (p.metrics?.ctr || 0), 0) / publishedPosts.length;
        report.metrics.averageEngagementRate =
          publishedPosts.reduce((sum, p) => sum + (p.metrics?.engagement_rate || 0), 0) /
          publishedPosts.length;
      }
    }

    return report;
  }
}

export default SocialMediaConnectorService;
