        }
        recordingCounts[transcription.recordingId].count++;

        if (!earliestDate || transcription.createdAt < earliestDate) {
          earliestDate = transcription.createdAt;
        }
        if (!latestDate || transcription.createdAt > latestDate) {
          latestDate = transcription.createdAt;
        }
      }
    }

    const searchTime = Date.now() - startTime;

    return {
      query: query.text,
      totalResults: results.length,
      results,
      facets: {
        speakers: Object.entries(speakerCounts).map(([id, data]) => ({ id, ...data })),
        recordings: Object.entries(recordingCounts).map(([id, data]) => ({ id, ...data })),
        dateRange: { earliest: earliestDate, latest: latestDate },
      },
      searchTime,
    };
  }

  // Search History
  getSearchHistory(): SearchHistoryEntry[] {
    return [...this.searchHistory].sort((a, b) => 
      new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime()
    );
  }

  async addToHistory(query: string, filters: SearchFilters | undefined, resultCount: number): Promise<void> {
    const entry: SearchHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      query,
      filters,
      resultCount,
      searchedAt: new Date().toISOString(),
    };

    this.searchHistory.unshift(entry);
    // Keep only last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }
    await this.saveSearchHistory();
  }

  async clearHistory(): Promise<void> {
    this.searchHistory = [];
    await this.saveSearchHistory();
  }

  // Saved Searches
  getSavedSearches(): SavedSearch[] {
    return [...this.savedSearches];
  }

  getSavedSearch(id: string): SavedSearch | undefined {
    return this.savedSearches.find(s => s.id === id);
  }

  async createSavedSearch(input: {
    name: string;
    query: string;
    filters?: SearchFilters;
    notifyOnNew: boolean;