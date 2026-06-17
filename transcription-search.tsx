import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  transcriptionSearchService, 
  SearchResponse,
  SearchResult,
  SavedSearch,
  SearchStats,
} from '@/lib/services/transcription-search-service';

type TabType = 'search' | 'saved' | 'history';

export default function TranscriptionSearchScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await transcriptionSearchService.initialize();
      setSavedSearches(transcriptionSearchService.getSavedSearches());
      setStats(transcriptionSearchService.getStats());
    } catch (error) {
      console.error('Failed to load search data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const newSuggestions = transcriptionSearchService.getSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = transcriptionSearchService.search({ text: searchQuery });
      setSearchResponse(response);
      await transcriptionSearchService.addToHistory(searchQuery, undefined, response.totalResults);
      setSuggestions([]);
    } catch (error) {
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      await transcriptionSearchService.createSavedSearch({
        name: searchQuery,
        query: searchQuery,
        notifyOnNew: false,
      });
      setSavedSearches(transcriptionSearchService.getSavedSearches());
      Alert.alert('Saved', 'Search has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save search.');
    }
  };

  const handleRunSavedSearch = async (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setActiveTab('search');
    setSearching(true);
    try {
      const response = await transcriptionSearchService.runSavedSearch(savedSearch.id);
      if (response) {
        setSearchResponse(response);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to run saved search.');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    Alert.alert(
      'Delete Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await transcriptionSearchService.deleteSavedSearch(id);
            setSavedSearches(transcriptionSearchService.getSavedSearches());
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>{stats.totalTranscriptions}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Transcriptions</Text>
        </View>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{stats.totalSegments}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Segments</Text>
        </View>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{(stats.totalWords / 1000).toFixed(1)}k</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Words</Text>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
      {(['search', 'saved', 'history'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: activeTab === tab ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: activeTab === tab ? colors.primary : colors.border,
          }}
        >
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 13, 
            fontWeight: '600',
            color: activeTab === tab ? '#FFFFFF' : colors.foreground,
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchBar = () => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search transcriptions..."
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            fontSize: 16,
          }}
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={searching || !searchQuery.trim()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: searching || !searchQuery.trim() ? 0.5 : 1,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {searching ? '...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={{ 
          marginTop: 8, 
          backgroundColor: colors.surface, 
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSearchQuery(suggestion);
                setSuggestions([]);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground }}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderResultCard = (result: SearchResult, index: number) => {
    const isSelected = selectedResult?.segment.id === result.segment.id;

    return (
      <TouchableOpacity
        key={`${result.transcriptionId}-${result.segment.id}`}
        onPress={() => setSelectedResult(isSelected ? null : result)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
              {result.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              @ {formatTime(result.segment.startTime)}
            </Text>
          </View>
          <View style={{ 
            paddingHorizontal: 8, 
            paddingVertical: 4, 
            borderRadius: 8,
            backgroundColor: colors.primary + '20',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
              Score: {result.score.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Matched Text with Highlighting */}
        <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
          {result.highlightedText.split('**').map((part, i) => (
            <Text 
              key={i} 
              style={i % 2 === 1 ? { backgroundColor: '#FBBF2440', fontWeight: '600' } : {}}
            >
              {part}
            </Text>
          ))}
        </Text>

        {/* Confidence */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            Confidence: {Math.round(result.segment.confidence * 100)}%
          </Text>
        </View>

        {/* Expanded Context */}
        {isSelected && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            {result.context.before && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Before:</Text>
                <Text style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>
                  "{result.context.before}"
                </Text>
              </View>
            )}
            {result.context.after && (
              <View>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>After:</Text>
                <Text style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>
                  "{result.context.after}"
                </Text>
              </View>
            )}

            {/* Keywords */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Keywords:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {result.segment.keywords.map((keyword, i) => (
                  <View 
                    key={i}
                    style={{ 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 6,
                      backgroundColor: colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colors.foreground }}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchResults = () => {
    if (!searchResponse) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Search Transcriptions</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
            Enter keywords to search across all recording transcriptions
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* Results Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {searchResponse.totalResults} results in {searchResponse.searchTime}ms
          </Text>
          <TouchableOpacity onPress={handleSaveSearch}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>Save Search</Text>
          </TouchableOpacity>
        </View>

        {/* Facets */}
        {searchResponse.facets.speakers.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Speakers:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {searchResponse.facets.speakers.slice(0, 5).map((speaker) => (
                <View 
                  key={speaker.id}
                  style={{ 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 6,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.foreground }}>
                    {speaker.name} ({speaker.count})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {searchResponse.results.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No Results</Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
              Try different keywords or check your spelling
            </Text>
          </View>
        ) : (
          searchResponse.results.map((result, index) => renderResultCard(result, index))
        )}
      </View>
    );
  };

  const renderSavedTab = () => {
    if (savedSearches.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No Saved Searches</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
            Save your frequently used searches for quick access
          </Text>
        </View>
      );
    }

    return (
      <View>
        {savedSearches.map((saved) => (
          <View
            key={saved.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{saved.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>"{saved.query}"</Text>
                {saved.lastRun && (
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                    Last run: {formatDate(saved.lastRun)} • {saved.lastResultCount} results
                  </Text>
                )}
              </View>
              {saved.notifyOnNew && (
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6,
                  backgroundColor: '#10B98120',
                }}>
                  <Text style={{ fontSize: 11, color: '#10B981' }}>Alerts On</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => handleRunSavedSearch(saved)}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Run Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteSavedSearch(saved.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#EF4444', fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHistoryTab = () => {
    const history = transcriptionSearchService.getSearchHistory();

    if (history.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📜</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No Search History</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
            Your recent searches will appear here
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Recent Searches</Text>
          <TouchableOpacity onPress={async () => {
            await transcriptionSearchService.clearHistory();
            loadData();
          }}>
            <Text style={{ fontSize: 13, color: '#EF4444' }}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {history.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            onPress={() => {
              setSearchQuery(entry.query);
              setActiveTab('search');
            }}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: colors.foreground }}>{entry.query}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {entry.resultCount} results • {formatDate(entry.searchedAt)}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: colors.muted }}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: colors.muted }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.foreground }}>
            Transcription Search
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            Search across all recording transcriptions
          </Text>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Tabs */}
        {renderTabs()}

        {/* Search Bar (always visible on search tab) */}
        {activeTab === 'search' && renderSearchBar()}

        {/* Tab Content */}
        {activeTab === 'search' && renderSearchResults()}
        {activeTab === 'saved' && renderSavedTab()}
        {activeTab === 'history' && renderHistoryTab()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
