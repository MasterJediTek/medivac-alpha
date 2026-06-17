/**
 * Print Preview UI Screen - MediVac WACHS v9.3
 * PDF-accurate page layout preview with annotations
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { printPreviewService, PreviewState, PageContent, ZoomLevel } from "@/lib/services/print-preview-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = 'preview' | 'pages' | 'settings' | 'annotations';

export default function PrintPreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [documentId] = useState('demo_ahd_preview');
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [settings, setSettings] = useState(printPreviewService.getSettings(documentId));

  useEffect(() => {
    // Initialize preview with demo document
    const demoDoc = {
      personalDetails: {
        fullName: 'John Smith',
        dateOfBirth: '1950-05-15',
        address: '123 Main St, Perth WA 6000',
        phone: '0412 345 678',
        email: 'john.smith@email.com',
      },
      treatmentDecisionMakers: [
        { fullName: 'Jane Smith', relationship: 'Spouse', address: '123 Main St', phone: '0412 345 679' },
      ],
      valuesAndWishes: {
        qualityOfLife: 'I value being able to communicate with my family and maintain my independence.',
        importantActivities: 'Spending time with grandchildren, gardening, reading.',
        fears: 'Being a burden on my family, losing my dignity.',
      },
      treatmentDecisions: {
        'cardiopulmonary-resuscitation': { preference: 'Do Not Want' },
        'mechanical-ventilation': { preference: 'Do Not Want' },
        'artificial-nutrition': { preference: 'Undecided' },
        'palliative-care': { preference: 'Want' },
      },
      witnesses: [
        { fullName: 'Dr. Sarah Johnson', occupation: 'General Practitioner', signedAt: '2024-01-15' },
      ],
    };

    const state = printPreviewService.initializePreview(documentId, demoDoc);
    setPreviewState(state);
    setPages(printPreviewService.getPages(documentId));
    setSettings(printPreviewService.getSettings(documentId));
  }, []);

  const handleZoomIn = () => {
    const state = printPreviewService.zoomIn(documentId);
    if (state) setPreviewState({ ...state });
  };

  const handleZoomOut = () => {
    const state = printPreviewService.zoomOut(documentId);
    if (state) setPreviewState({ ...state });
  };

  const handleNextPage = () => {
    const state = printPreviewService.nextPage(documentId);
    if (state) setPreviewState({ ...state });
  };

  const handlePrevPage = () => {
    const state = printPreviewService.previousPage(documentId);
    if (state) setPreviewState({ ...state });
  };

  const handleGoToPage = (pageNumber: number) => {
    const state = printPreviewService.goToPage(documentId, pageNumber);
    if (state) setPreviewState({ ...state });
  };

  const handlePrint = () => {
    const result = printPreviewService.print(documentId);
    console.log('Print result:', result);
  };

  const handleExportPDF = () => {
    const result = printPreviewService.exportPDF(documentId);
    console.log('Export result:', result.filename);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'preview', label: 'Preview', icon: '📄' },
    { id: 'pages', label: 'Pages', icon: '📑' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'annotations', label: 'Notes', icon: '📝' },
  ];

  const currentPage = previewState ? printPreviewService.getPage(documentId, previewState.currentPage) : null;
  const thumbnails = printPreviewService.getThumbnails(documentId);
  const annotations = printPreviewService.getAnnotations(documentId, previewState?.currentPage);
  const pageSizes = printPreviewService.getAvailablePageSizes();
  const zoomLevels = printPreviewService.getAvailableZoomLevels();
  const annotationTypes = printPreviewService.getAnnotationTypes();

  const renderPreviewTab = () => (
    <View className="flex-1">
      {/* Zoom Controls */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center justify-between bg-surface rounded-xl p-3">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleZoomOut}
              className="w-10 h-10 rounded-lg bg-background items-center justify-center"
            >
              <Text className="text-foreground text-xl">−</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold w-16 text-center">
              {previewState?.zoom || 100}%
            </Text>
            <TouchableOpacity
              onPress={handleZoomIn}
              className="w-10 h-10 rounded-lg bg-background items-center justify-center"
            >
              <Text className="text-foreground text-xl">+</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handlePrint}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">🖨️ Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExportPDF}
              className="px-4 py-2 rounded-lg bg-surface border border-border"
            >
              <Text className="text-foreground font-semibold">📥 PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Page Preview */}
      <View className="px-5 mb-4">
        <View 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ 
            width: SCREEN_WIDTH - 40,
            aspectRatio: 0.707, // A4 ratio
            transform: [{ scale: (previewState?.zoom || 100) / 100 }],
          }}
        >
          {currentPage && (
            <ScrollView className="flex-1 p-4">
              {currentPage.sections.map(section => (
                <View key={section.id} style={{ marginBottom: section.style.marginBottom }}>
                  {section.type === 'heading' && (
                    <Text 
                      style={{ 
                        fontSize: section.style.fontSize * 0.6,
                        fontWeight: section.style.fontWeight,
                        textAlign: section.style.textAlign,
                        color: '#000',
                      }}
                    >
                      {section.content}
                    </Text>
                  )}
                  {section.type === 'paragraph' && (
                    <Text 
                      style={{ 
                        fontSize: section.style.fontSize * 0.6,
                        color: '#333',
                        lineHeight: section.style.fontSize * 0.9,
                      }}
                    >
                      {section.content}
                    </Text>
                  )}
                  {section.type === 'table' && (
                    <View className="border border-gray-300 rounded">
                      {JSON.parse(section.content).map((row: string[], rowIndex: number) => (
                        <View key={rowIndex} className="flex-row border-b border-gray-200">
                          {row.map((cell, cellIndex) => (
                            <Text 
                              key={cellIndex}
                              className="flex-1 p-1"
                              style={{ fontSize: 8, color: cellIndex === 0 ? '#666' : '#000' }}
                            >
                              {cell}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                  {section.type === 'signature-block' && (
                    <View className="border-t border-gray-300 pt-2 mt-2">
                      <Text style={{ fontSize: 8, color: '#666' }}>
                        {JSON.parse(section.content).label}
                      </Text>
                      <View className="h-8 border-b border-gray-400 mt-1" />
                      <Text style={{ fontSize: 7, color: '#999', marginTop: 2 }}>
                        {JSON.parse(section.content).name || 'Name'} | Date: {JSON.parse(section.content).date || '___/___/______'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Watermark */}
          {settings.watermark.enabled && (
            <View 
              className="absolute inset-0 items-center justify-center"
              style={{ transform: [{ rotate: `${settings.watermark.rotation}deg` }] }}
            >
              <Text 
                style={{ 
                  fontSize: settings.watermark.fontSize * 0.5,
                  color: settings.watermark.color,
                  opacity: settings.watermark.opacity,
                }}
              >
                {settings.watermark.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Page Navigation */}
      <View className="px-5">
        <View className="flex-row items-center justify-center gap-4 bg-surface rounded-xl p-3">
          <TouchableOpacity
            onPress={handlePrevPage}
            disabled={previewState?.currentPage === 1}
            className="w-10 h-10 rounded-lg bg-background items-center justify-center"
            style={{ opacity: previewState?.currentPage === 1 ? 0.5 : 1 }}
          >
            <Text className="text-foreground text-xl">←</Text>
          </TouchableOpacity>
          
          <Text className="text-foreground font-semibold">
            Page {previewState?.currentPage || 1} of {previewState?.totalPages || 1}
          </Text>
          
          <TouchableOpacity
            onPress={handleNextPage}
            disabled={previewState?.currentPage === previewState?.totalPages}
            className="w-10 h-10 rounded-lg bg-background items-center justify-center"
            style={{ opacity: previewState?.currentPage === previewState?.totalPages ? 0.5 : 1 }}
          >
            <Text className="text-foreground text-xl">→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPagesTab = () => (
    <View className="flex-1 px-5">
      <Text className="text-foreground font-semibold text-lg mb-3">Page Thumbnails</Text>
      
      <View className="flex-row flex-wrap gap-3">
        {thumbnails.map(thumb => (
          <TouchableOpacity
            key={thumb.pageNumber}
            onPress={() => {
              handleGoToPage(thumb.pageNumber);
              setActiveTab('preview');
            }}
            className="rounded-lg overflow-hidden border-2"
            style={{
              width: (SCREEN_WIDTH - 60) / 3,
              aspectRatio: 0.707,
              borderColor: previewState?.currentPage === thumb.pageNumber ? colors.primary : colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-4xl">📄</Text>
              <Text className="text-foreground font-semibold mt-2">Page {thumb.pageNumber}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Page Info */}
      <View className="mt-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Document Info</Text>
        <View className="bg-surface rounded-xl p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Total Pages</Text>
            <Text className="text-foreground font-semibold">{previewState?.totalPages || 0}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Page Size</Text>
            <Text className="text-foreground font-semibold">{settings.pageSize}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Orientation</Text>
            <Text className="text-foreground font-semibold capitalize">{settings.orientation}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View className="flex-1 px-5">
      {/* Page Size */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Page Size</Text>
        <View className="gap-2">
          {pageSizes.map(size => (
            <TouchableOpacity
              key={size.id}
              onPress={() => {
                printPreviewService.updateSettings(documentId, { pageSize: size.id });
                setSettings(printPreviewService.getSettings(documentId));
              }}
              className="flex-row items-center bg-surface rounded-xl p-4"
            >
              <View className="flex-1">
                <Text className="text-foreground">{size.name}</Text>
                <Text className="text-muted text-xs">{size.dimensions}</Text>
              </View>
              {settings.pageSize === size.id && (
                <Text style={{ color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orientation */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Orientation</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => {
              printPreviewService.updateSettings(documentId, { orientation: 'portrait' });
              setSettings(printPreviewService.getSettings(documentId));
            }}
            className="flex-1 bg-surface rounded-xl p-4 items-center"
            style={{
              borderWidth: settings.orientation === 'portrait' ? 2 : 0,
              borderColor: colors.primary,
            }}
          >
            <Text className="text-3xl mb-2">📄</Text>
            <Text className="text-foreground">Portrait</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              printPreviewService.updateSettings(documentId, { orientation: 'landscape' });
              setSettings(printPreviewService.getSettings(documentId));
            }}
            className="flex-1 bg-surface rounded-xl p-4 items-center"
            style={{
              borderWidth: settings.orientation === 'landscape' ? 2 : 0,
              borderColor: colors.primary,
            }}
          >
            <Text className="text-3xl mb-2" style={{ transform: [{ rotate: '90deg' }] }}>📄</Text>
            <Text className="text-foreground">Landscape</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Watermark */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Watermark</Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            onPress={() => {
              printPreviewService.updateWatermark(documentId, { enabled: !settings.watermark.enabled });
              setSettings(printPreviewService.getSettings(documentId));
            }}
            className="flex-row items-center p-4 border-b border-border"
          >
            <Text className="text-foreground flex-1">Show Watermark</Text>
            <Text>{settings.watermark.enabled ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
          
          {settings.watermark.enabled && (
            <>
              <View className="p-4 border-b border-border">
                <Text className="text-muted text-sm mb-1">Text</Text>
                <Text className="text-foreground">{settings.watermark.text}</Text>
              </View>
              <View className="p-4">
                <Text className="text-muted text-sm mb-1">Opacity</Text>
                <Text className="text-foreground">{(settings.watermark.opacity * 100).toFixed(0)}%</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Print Options */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Print Options</Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            onPress={() => {
              printPreviewService.updateSettings(documentId, { grayscale: !settings.grayscale });
              setSettings(printPreviewService.getSettings(documentId));
            }}
            className="flex-row items-center p-4 border-b border-border"
          >
            <Text className="text-foreground flex-1">Grayscale</Text>
            <Text>{settings.grayscale ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              printPreviewService.updateSettings(documentId, { highQuality: !settings.highQuality });
              setSettings(printPreviewService.getSettings(documentId));
            }}
            className="flex-row items-center p-4"
          >
            <Text className="text-foreground flex-1">High Quality</Text>
            <Text>{settings.highQuality ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAnnotationsTab = () => (
    <View className="flex-1 px-5">
      <Text className="text-foreground font-semibold text-lg mb-3">Annotation Tools</Text>
      
      {/* Annotation Types */}
      <View className="flex-row flex-wrap gap-2 mb-6">
        {annotationTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            onPress={() => {
              // Add annotation at center of current page
              printPreviewService.addAnnotation(
                documentId,
                previewState?.currentPage || 1,
                type.id,
                100,
                100,
                50,
                20,
                colors.primary,
                type.name
              );
            }}
            className="bg-surface rounded-xl p-3 items-center"
            style={{ width: (SCREEN_WIDTH - 60) / 3 }}
          >
            <Text className="text-2xl mb-1">{type.icon}</Text>
            <Text className="text-foreground text-sm">{type.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Page Annotations */}
      <Text className="text-foreground font-semibold text-lg mb-3">
        Page {previewState?.currentPage || 1} Annotations
      </Text>
      
      {annotations.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">📝</Text>
          <Text className="text-muted text-center">No annotations on this page</Text>
          <Text className="text-muted text-center text-sm mt-1">
            Tap an annotation tool above to add one
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {annotations.map(ann => (
            <View key={ann.id} className="bg-surface rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text>{annotationTypes.find(t => t.id === ann.type)?.icon || '📝'}</Text>
                  <View>
                    <Text className="text-foreground capitalize">{ann.type}</Text>
                    <Text className="text-muted text-xs">
                      {new Date(ann.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    printPreviewService.deleteAnnotation(documentId, ann.id);
                    // Force re-render
                    setPreviewState({ ...previewState! });
                  }}
                  className="bg-error/20 rounded-lg px-3 py-1"
                >
                  <Text style={{ color: colors.error }} className="text-sm">Delete</Text>
                </TouchableOpacity>
              </View>
              {ann.content && (
                <Text className="text-muted text-sm mt-2">{ann.content}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Include in Print */}
      <View className="mt-6">
        <TouchableOpacity
          onPress={() => {
            printPreviewService.updateSettings(documentId, { 
              includeAnnotations: !settings.includeAnnotations 
            });
            setSettings(printPreviewService.getSettings(documentId));
          }}
          className="flex-row items-center bg-surface rounded-xl p-4"
        >
          <Text className="text-foreground flex-1">Include annotations in print</Text>
          <Text>{settings.includeAnnotations ? '✅' : '⬜'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-3xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold">Print Preview</Text>
              <Text className="text-muted text-sm">PDF-accurate document preview</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-surface rounded-xl p-1">
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
                }}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text 
                  className="text-xs mt-1"
                  style={{ color: activeTab === tab.id ? '#FFFFFF' : colors.muted }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'preview' && renderPreviewTab()}
        {activeTab === 'pages' && renderPagesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'annotations' && renderAnnotationsTab()}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
