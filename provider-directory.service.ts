/**
 * Provider Directory Service
 * Manages healthcare provider search and information
 */

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialty: string;
  qualifications: string[];
  bio: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  acceptingPatients: boolean;
  languages: string[];
  locations: Location[];
  availableSlots: number;
  responseTime: string;
  consultationFee: number;
  insurance: string[];
  verified: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

export interface ProviderReview {
  id: string;
  providerId: string;
  patientId: string;
  rating: number;
  comment: string;
  date: number;
  verified: boolean;
}

export interface SearchFilters {
  specialty?: string;
  location?: string;
  minRating?: number;
  acceptingPatients?: boolean;
  language?: string;
  maxFee?: number;
}

export class ProviderDirectoryService {
  private static instance: ProviderDirectoryService;
  private apiUrl = process.env.EXPO_PUBLIC_API_URL;
  private cachedProviders: Map<string, Provider[]> = new Map();

  private constructor() {}

  static getInstance(): ProviderDirectoryService {
    if (!ProviderDirectoryService.instance) {
      ProviderDirectoryService.instance = new ProviderDirectoryService();
    }
    return ProviderDirectoryService.instance;
  }

  /**
   * Search providers
   */
  async searchProviders(
    query: string,
    filters?: SearchFilters,
    limit: number = 20
  ): Promise<Provider[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        ...(filters?.specialty && { specialty: filters.specialty }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.minRating && { minRating: filters.minRating.toString() }),
        ...(filters?.acceptingPatients && { acceptingPatients: 'true' }),
        ...(filters?.language && { language: filters.language }),
        ...(filters?.maxFee && { maxFee: filters.maxFee.toString() }),
      });

      const cacheKey = `search-${query}-${JSON.stringify(filters)}`;
      
      if (this.cachedProviders.has(cacheKey)) {
        return this.cachedProviders.get(cacheKey)!;
      }

      const response = await fetch(`${this.apiUrl}/providers/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to search providers');
      
      const providers = await response.json();
      this.cachedProviders.set(cacheKey, providers);
      
      return providers;
    } catch (error) {
      console.error('Failed to search providers:', error);
      throw error;
    }
  }

  /**
   * Get provider details
   */
  async getProvider(providerId: string): Promise<Provider> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch provider');
      return await response.json();
    } catch (error) {
      console.error('Failed to get provider:', error);
      throw error;
    }
  }

  /**
   * Get providers by specialty
   */
  async getProvidersBySpecialty(specialty: string, limit: number = 20): Promise<Provider[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/providers/specialty/${specialty}?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch providers');
      return await response.json();
    } catch (error) {
      console.error('Failed to get providers by specialty:', error);
      throw error;
    }
  }

  /**
   * Get provider reviews
   */
  async getProviderReviews(providerId: string, limit: number = 10): Promise<ProviderReview[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/providers/${providerId}/reviews?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json();
    } catch (error) {
      console.error('Failed to get provider reviews:', error);
      throw error;
    }
  }

  /**
   * Submit provider review
   */
  async submitReview(
    providerId: string,
    rating: number,
    comment: string
  ): Promise<ProviderReview> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/${providerId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) throw new Error('Failed to submit review');
      
      // Clear cache
      this.cachedProviders.clear();
      
      return await response.json();
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  }

  /**
   * Get specialties
   */
  async getSpecialties(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/specialties`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch specialties');
      const data = await response.json();
      return data.specialties || [];
    } catch (error) {
      console.error('Failed to get specialties:', error);
      throw error;
    }
  }

  /**
   * Get nearby providers
   */
  async getNearbyProviders(
    latitude: number,
    longitude: number,
    radiusMiles: number = 10
  ): Promise<Provider[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/providers/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMiles}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch nearby providers');
      return await response.json();
    } catch (error) {
      console.error('Failed to get nearby providers:', error);
      throw error;
    }
  }

  /**
   * Add provider to favorites
   */
  async addToFavorites(providerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/${providerId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to add to favorites');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove provider from favorites
   */
  async removeFromFavorites(providerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/${providerId}/favorite`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to remove from favorites');
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  /**
   * Get favorite providers
   */
  async getFavoriteProviders(): Promise<Provider[]> {
    try {
      const response = await fetch(`${this.apiUrl}/providers/favorites`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch favorites');
      return await response.json();
    } catch (error) {
      console.error('Failed to get favorite providers:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedProviders.clear();
  }
}
