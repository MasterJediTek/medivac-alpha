import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  abTestReportingService, 
  ABTestReport, 
  ReportTemplate,
  ReportAnalytics,
  ReportStatus 
} from '@/lib/services/ab-test-reporting-service';

export default function ABTestReportsScreen() {
  const colors = useColors();
  const [reports, setReports] = useState<ABTestReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'reports' | 'templates' | 'analytics'>('reports');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = abTestReportingService.onReportReady((report) => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    setReports(abTestReportingService.getAllReports());
    setTemplates(abTestReportingService.getAllTemplates());
    setAnalytics(abTestReportingService.getAnalytics());
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await abTestReportingService.generateReport('test-new', 'executive-summary', {
        title: 'New A/B Test Report',
        recipients: ['admin@medivac-wachs.com'],
      });
      loadData();
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: ReportStatus): string => {
    const statusColors: Record<ReportStatus, string> = {
      draft: '#6B7280',
      generating: '#F59E0B',
      ready: '#22C55E',
      failed: '#EF4444',
      archived: '#9CA3AF',
    };
    return statusColors[status];
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderReport = (report: ABTestReport) => (
    <View 
      key={report.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
          {report.title}
        </Text>
        <View 
          className="px-2 py-1 rounded ml-2"
          style={{ backgroundColor: getStatusColor(report.status) + '20' }}
        >
          <Text 
            className="text-xs font-medium uppercase"
            style={{ color: getStatusColor(report.status) }}
          >
            {report.status}
          </Text>
        </View>
      </View>
      
      <Text className="text-muted text-sm mb-3">{report.description}</Text>
      
      <View className="flex-row flex-wrap mb-3">
        <View className="mr-4 mb-2">
          <Text className="text-muted text-xs">Store</Text>
          <Text className="text-foreground text-sm">{report.metadata.store}</Text>
        </View>
        <View className="mr-4 mb-2">
          <Text className="text-muted text-xs">Impressions</Text>
          <Text className="text-foreground text-sm">{report.metadata.totalImpressions.toLocaleString()}</Text>
        </View>
        <View className="mr-4 mb-2">
          <Text className="text-muted text-xs">Installs</Text>
          <Text className="text-foreground text-sm">{report.metadata.totalInstalls.toLocaleString()}</Text>
        </View>
        <View className="mb-2">
          <Text className="text-muted text-xs">File Size</Text>
          <Text className="text-foreground text-sm">{formatFileSize(report.fileSize)}</Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs">
          {report.generatedAt ? `Generated ${report.generatedAt.toLocaleDateString()}` : 'Not generated'}
        </Text>
        
        {report.status === 'ready' && (
          <View className="flex-row">
            <TouchableOpacity className="bg-primary/20 px-3 py-1 rounded mr-2">
              <Text className="text-primary text-sm">Download</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface px-3 py-1 rounded border border-border">
              <Text className="text-foreground text-sm">Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderTemplate = (template: ReportTemplate) => (
    <View 
      key={template.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold">{template.name}</Text>
        {template.isDefault && (
          <View className="bg-primary/20 px-2 py-1 rounded">
            <Text className="text-primary text-xs font-medium">DEFAULT</Text>
          </View>
        )}
      </View>
      <Text className="text-muted text-sm mb-3">{template.description}</Text>
      <View className="flex-row flex-wrap">
        {template.sections.map((section) => (
          <View 
            key={section.id}
            className="bg-background px-2 py-1 rounded mr-2 mb-2"
          >
            <Text className="text-muted text-xs">{section.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">A/B Test Reports</Text>
        <Text className="text-muted mb-6">Generate and manage PDF reports for A/B tests</Text>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerateReport}
          disabled={generating}
          className="bg-primary rounded-xl p-4 mb-4 flex-row items-center justify-center"
          style={{ opacity: generating ? 0.7 : 1 }}
        >
          {generating ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold ml-2">Generating...</Text>
            </>
          ) : (
            <Text className="text-white font-semibold">Generate New Report</Text>
          )}
        </TouchableOpacity>

        {/* Tab Navigation */}
        <View className="flex-row mb-4">
          {(['reports', 'templates', 'analytics'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`flex-1 py-2 rounded-lg mr-2 ${
                selectedTab === tab ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text 
                className={`text-center font-medium capitalize ${
                  selectedTab === tab ? 'text-white' : 'text-muted'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'reports' && (
          <>
            {reports.map(renderReport)}
          </>
        )}

        {selectedTab === 'templates' && (
          <>
            {templates.map(renderTemplate)}
          </>
        )}

        {selectedTab === 'analytics' && analytics && (
          <>
            {/* Summary Stats */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Summary</Text>
              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.totalReports}</Text>
                  <Text className="text-muted text-sm">Total Reports</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.reportsThisMonth}</Text>
                  <Text className="text-muted text-sm">This Month</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.averageGenerationTime}s</Text>
                  <Text className="text-muted text-sm">Avg Gen Time</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.totalRecipients}</Text>
                  <Text className="text-muted text-sm">Recipients</Text>
                </View>
              </View>
            </View>

            {/* By Status */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">By Status</Text>
              {Object.entries(analytics.reportsByStatus).map(([status, count]) => (
                <View key={status} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: getStatusColor(status as ReportStatus),
                        marginRight: 8,
                      }} 
                    />
                    <Text className="text-foreground capitalize">{status}</Text>
                  </View>
                  <Text className="text-muted">{count}</Text>
                </View>
              ))}
            </View>

            {/* By Format */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">By Format</Text>
              {Object.entries(analytics.reportsByFormat).map(([format, count]) => (
                <View key={format} className="flex-row items-center justify-between py-2">
                  <Text className="text-foreground uppercase">{format}</Text>
                  <Text className="text-muted">{count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
