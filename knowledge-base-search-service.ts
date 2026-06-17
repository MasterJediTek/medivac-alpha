/**
 * Knowledge Base Search API Service
 * 
 * Provides full-text search across all JediTek knowledge base documents
 * stored in S3 CDN. Enables cross-task reference and documentation discovery.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// S3 CDN URLs for knowledge base documents
export const KNOWLEDGE_BASE_URLS = {
  knowledgeBase: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/JkByKVopkATKabTM.md",
  servicesInventory: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/ONxWryWMFqvanuHA.json",
  todoList: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/MrkqjUmghPxDJwDM.md",
  designDocument: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/uGRYffoynagOcoKP.md",
  integrationSuite: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/UUjuprmnTEocLITi.md",
} as const;

export type DocumentType = keyof typeof KNOWLEDGE_BASE_URLS;

export interface SearchResult {
  id: string;
  documentType: DocumentType;
  title: string;
  excerpt: string;
  matchedTerms: string[];
  relevanceScore: number;
  lineNumber?: number;
  section?: string;
  url: string;
  timestamp: string;
}

export interface SearchQuery {
  query: string;
  documentTypes?: DocumentType[];
  maxResults?: number;
  includeExcerpts?: boolean;
  caseSensitive?: boolean;
}

export interface SearchIndex {
  documentType: DocumentType;
  content: string;
  sections: IndexedSection[];
  lastUpdated: string;
}

export interface IndexedSection {
  title: string;
  content: string;
  lineStart: number;
  lineEnd: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: { query: string; count: number }[];
  averageResultCount: number;
  searchesByDocument: Record<DocumentType, number>;
  lastSearchTimestamp: string;
}

export interface CachedDocument {
  url: string;
  content: string;
  fetchedAt: string;
  expiresAt: string;
}

const STORAGE_KEYS = {
  searchIndex: "kb_search_index",
  searchHistory: "kb_search_history",
  searchAnalytics: "kb_search_analytics",
  documentCache: "kb_document_cache",
};

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

class KnowledgeBaseSearchService {
  private searchIndex: Map<DocumentType, SearchIndex> = new Map();
  private documentCache: Map<string, CachedDocument> = new Map();
  private searchHistory: SearchQuery[] = [];
  private analytics: SearchAnalytics = {
    totalSearches: 0,
    popularQueries: [],
    averageResultCount: 0,
    searchesByDocument: {} as Record<DocumentType, number>,
    lastSearchTimestamp: "",
  };
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load cached data
      const [indexData, historyData, analyticsData, cacheData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.searchIndex),
        AsyncStorage.getItem(STORAGE_KEYS.searchHistory),
        AsyncStorage.getItem(STORAGE_KEYS.searchAnalytics),
        AsyncStorage.getItem(STORAGE_KEYS.documentCache),
      ]);

      if (indexData) {
        const parsed = JSON.parse(indexData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.searchIndex.set(key as DocumentType, value as SearchIndex);
        });
      }

      if (historyData) {
        this.searchHistory = JSON.parse(historyData);
      }

      if (analyticsData) {
        this.analytics = JSON.parse(analyticsData);
      }

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.documentCache.set(key, value as CachedDocument);
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize knowledge base search:", error);
      this.initialized = true;
    }
  }

  private async saveState(): Promise<void> {
    try {
      const indexObj: Record<string, SearchIndex> = {};
      this.searchIndex.forEach((value, key) => {
        indexObj[key] = value;
      });

      const cacheObj: Record<string, CachedDocument> = {};
      this.documentCache.forEach((value, key) => {
        cacheObj[key] = value;
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.searchIndex, JSON.stringify(indexObj)),
        AsyncStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(this.searchHistory.slice(-100))),
        AsyncStorage.setItem(STORAGE_KEYS.searchAnalytics, JSON.stringify(this.analytics)),
        AsyncStorage.setItem(STORAGE_KEYS.documentCache, JSON.stringify(cacheObj)),
      ]);
    } catch (error) {
      console.error("Failed to save search state:", error);
    }
  }

  async fetchDocument(documentType: DocumentType): Promise<string> {
    const url = KNOWLEDGE_BASE_URLS[documentType];
    
    // Check cache
    const cached = this.documentCache.get(url);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached.content;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const content = await response.text();
      
      // Cache the document
      const now = new Date();
      this.documentCache.set(url, {
        url,
        content,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      });

      await this.saveState();
      return content;
    } catch (error) {
      // Return cached content if available, even if expired
      if (cached) {
        return cached.content;
      }
      throw error;
    }
  }

  async indexDocument(documentType: DocumentType): Promise<SearchIndex> {
    const content = await this.fetchDocument(documentType);
    const sections = this.parseDocumentSections(content);

    const index: SearchIndex = {
      documentType,
      content,
      sections,
      lastUpdated: new Date().toISOString(),
    };

    this.searchIndex.set(documentType, index);
    await this.saveState();

    return index;
  }

  private parseDocumentSections(content: string): IndexedSection[] {
    const lines = content.split("\n");
    const sections: IndexedSection[] = [];
    let currentSection: IndexedSection | undefined = undefined;

    lines.forEach((line, index) => {
      // Detect markdown headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        if (currentSection) {
          currentSection.lineEnd = index - 1;
          sections.push(currentSection);
        }

        currentSection = {
          title: headerMatch[2],
          content: "",
          lineStart: index,
          lineEnd: index,
        };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    });

    if (currentSection !== undefined) {
      (currentSection as IndexedSection).lineEnd = lines.length - 1;
      sections.push(currentSection as IndexedSection);
    }

    return sections;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    await this.initialize();

    const {
      query: searchTerm,
      documentTypes = Object.keys(KNOWLEDGE_BASE_URLS) as DocumentType[],
      maxResults = 20,
      includeExcerpts = true,
      caseSensitive = false,
    } = query;

    const results: SearchResult[] = [];
    const searchTermLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const searchWords = searchTermLower.split(/\s+/).filter(w => w.length > 2);

    for (const docType of documentTypes) {
      let index = this.searchIndex.get(docType);
      
      if (!index) {
        try {
          index = await this.indexDocument(docType);
        } catch (error) {
          console.error(`Failed to index ${docType}:`, error);
          continue;
        }
      }

      const contentToSearch = caseSensitive ? index.content : index.content.toLowerCase();

      // Search in sections
      for (const section of index.sections) {
        const sectionContent = caseSensitive ? section.content : section.content.toLowerCase();
        const sectionTitle = caseSensitive ? section.title : section.title.toLowerCase();

        const matchedTerms: string[] = [];
        let relevanceScore = 0;

        for (const word of searchWords) {
          if (sectionContent.includes(word) || sectionTitle.includes(word)) {
            matchedTerms.push(word);
            // Higher score for title matches
            if (sectionTitle.includes(word)) {
              relevanceScore += 10;
            }
            // Count occurrences in content
            const occurrences = (sectionContent.match(new RegExp(word, "g")) || []).length;
            relevanceScore += occurrences;
          }
        }

        if (matchedTerms.length > 0) {
          const excerpt = includeExcerpts
            ? this.generateExcerpt(section.content, searchWords[0], 150)
            : "";

          results.push({
            id: `${docType}-${section.lineStart}`,
            documentType: docType,
            title: section.title,
            excerpt,
            matchedTerms,
            relevanceScore,
            lineNumber: section.lineStart,
            section: section.title,
            url: KNOWLEDGE_BASE_URLS[docType],
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Update analytics
    this.updateAnalytics(query, results.length);

    return results.slice(0, maxResults);
  }

  private generateExcerpt(content: string, searchTerm: string, maxLength: number): string {
    const termIndex = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    
    if (termIndex === -1) {
      return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
    }

    const start = Math.max(0, termIndex - 50);
    const end = Math.min(content.length, termIndex + searchTerm.length + 100);
    
    let excerpt = content.slice(start, end);
    
    if (start > 0) excerpt = "..." + excerpt;
    if (end < content.length) excerpt = excerpt + "...";

    return excerpt.trim();
  }

  private updateAnalytics(query: SearchQuery, resultCount: number): void {
    this.analytics.totalSearches++;
    this.analytics.lastSearchTimestamp = new Date().toISOString();

    // Update average result count
    this.analytics.averageResultCount = 
      (this.analytics.averageResultCount * (this.analytics.totalSearches - 1) + resultCount) / 
      this.analytics.totalSearches;

    // Update popular queries
    const existingQuery = this.analytics.popularQueries.find(
      q => q.query.toLowerCase() === query.query.toLowerCase()
    );
    
    if (existingQuery) {
      existingQuery.count++;
    } else {
      this.analytics.popularQueries.push({ query: query.query, count: 1 });
    }

    // Sort and limit popular queries
    this.analytics.popularQueries.sort((a, b) => b.count - a.count);
    this.analytics.popularQueries = this.analytics.popularQueries.slice(0, 50);

    // Update searches by document
    for (const docType of query.documentTypes || Object.keys(KNOWLEDGE_BASE_URLS) as DocumentType[]) {
      this.analytics.searchesByDocument[docType] = 
        (this.analytics.searchesByDocument[docType] || 0) + 1;
    }

    // Save search history
    this.searchHistory.push(query);

    this.saveState();
  }

  async getSearchHistory(): Promise<SearchQuery[]> {
    await this.initialize();
    return [...this.searchHistory].reverse();
  }

  async getAnalytics(): Promise<SearchAnalytics> {
    await this.initialize();
    return { ...this.analytics };
  }

  async clearCache(): Promise<void> {
    this.documentCache.clear();
    this.searchIndex.clear();
    await this.saveState();
  }

  async refreshIndex(): Promise<void> {
    const documentTypes = Object.keys(KNOWLEDGE_BASE_URLS) as DocumentType[];
    
    for (const docType of documentTypes) {
      // Clear cache for this document
      this.documentCache.delete(KNOWLEDGE_BASE_URLS[docType]);
      await this.indexDocument(docType);
    }
  }

  getDocumentUrl(documentType: DocumentType): string {
    return KNOWLEDGE_BASE_URLS[documentType];
  }

  getAllDocumentUrls(): typeof KNOWLEDGE_BASE_URLS {
    return { ...KNOWLEDGE_BASE_URLS };
  }

  async getSuggestions(partialQuery: string): Promise<string[]> {
    await this.initialize();

    const suggestions: string[] = [];
    const partial = partialQuery.toLowerCase();

    // Get suggestions from popular queries
    for (const { query } of this.analytics.popularQueries) {
      if (query.toLowerCase().includes(partial) && !suggestions.includes(query)) {
        suggestions.push(query);
      }
    }

    // Get suggestions from indexed content
    for (const [, index] of this.searchIndex) {
      for (const section of index.sections) {
        if (section.title.toLowerCase().includes(partial) && !suggestions.includes(section.title)) {
          suggestions.push(section.title);
        }
      }
    }

    return suggestions.slice(0, 10);
  }
}

export const knowledgeBaseSearchService = new KnowledgeBaseSearchService();
