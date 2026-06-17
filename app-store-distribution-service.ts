        
        this.analytics.averageReviewTime = 
          (this.analytics.averageReviewTime * (this.analytics.approvedSubmissions + this.analytics.rejectedSubmissions) + reviewTime) /
          (this.analytics.approvedSubmissions + this.analytics.rejectedSubmissions + 1);
      }

      if (status === "approved") {
        this.analytics.approvedSubmissions++;
      } else {
        this.analytics.rejectedSubmissions++;
        submission.rejectionReason = details?.rejectionReason;
      }
    }

    if (status === "published") {
      submission.publishedAt = new Date().toISOString();

      // Update store config
      const config = this.storeConfigs.get(submission.store);
      if (config) {
        config.publishedVersion = submission.version;
        this.storeConfigs.set(submission.store, config);
      }
    }

    await this.saveState();
    return submission;
  }

  async getSubmission(submissionId: string): Promise<StoreSubmission | null> {
    await this.initialize();
    return this.submissions.find(s => s.id === submissionId) || null;
  }

  async getSubmissions(store?: StoreType): Promise<StoreSubmission[]> {
    await this.initialize();

    let submissions = [...this.submissions];
    
    if (store) {
      submissions = submissions.filter(s => s.store === store);
    }

    return submissions.reverse();
  }

  async getLatestSubmission(store: StoreType): Promise<StoreSubmission | null> {
    await this.initialize();

    const storeSubmissions = this.submissions
      .filter(s => s.store === store)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return storeSubmissions[0] || null;
  }

  async getAnalytics(): Promise<DistributionAnalytics> {
    await this.initialize();
    return { ...this.analytics };
  }

  getStoreRequirements(store: StoreType): {
    iconSize: string;
    screenshotSizes: { phone: string; tablet?: string; desktop?: string };
    maxDescriptionLength: number;
    maxKeywords: number;
    requiredFields: string[];
  } {
    const requirements = {
      google_play: {
        iconSize: "512x512",
        screenshotSizes: { phone: "1080x1920", tablet: "1200x1920" },
        maxDescriptionLength: 4000,
        maxKeywords: 0, // Google Play doesn't use keywords
        requiredFields: ["appName", "shortDescription", "fullDescription", "category", "contentRating", "privacyPolicyUrl"],
      },
      apple_app_store: {
        iconSize: "1024x1024",
        screenshotSizes: { phone: "1290x2796", tablet: "2048x2732" },
        maxDescriptionLength: 4000,
        maxKeywords: 100, // 100 characters total
        requiredFields: ["appName", "shortDescription", "fullDescription", "category", "contentRating", "privacyPolicyUrl", "supportUrl"],
      },
      microsoft_store: {
        iconSize: "1240x1240",
        screenshotSizes: { phone: "1080x1920", tablet: "1366x768", desktop: "1920x1080" },
        maxDescriptionLength: 10000,
        maxKeywords: 7,
        requiredFields: ["appName", "shortDescription", "fullDescription", "category", "contentRating", "privacyPolicyUrl"],
      },
    };

    return requirements[store];
  }

  validateMetadata(store: StoreType): { valid: boolean; errors: string[] } {
    const requirements = this.getStoreRequirements(store);
    const errors: string[] = [];

    // Check required fields