/**
 * Signature Pad UI Screen - MediVac WACHS v9.3
 * Touch-based signature drawing with canvas capture
 */

import { useState, useEffect, useRef } from "react";
import { ScrollView, Text, View, TouchableOpacity, Pressable, PanResponder, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { signaturePadService, SignatureData, SignatureColor, SignatureThickness } from "@/lib/services/signature-pad-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAD_WIDTH = SCREEN_WIDTH - 40;
const PAD_HEIGHT = 200;

type TabType = 'draw' | 'settings' | 'saved' | 'compare';

export default function SignaturePadScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [currentPoints, setCurrentPoints] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [settings, setSettings] = useState(signaturePadService.getSettings());
  const [savedSignatures, setSavedSignatures] = useState<SignatureData[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    // Initialize signature
    const sig = signaturePadService.createSignature('User', 'maker', PAD_WIDTH, PAD_HEIGHT);
    setSignature(sig);
    setSavedSignatures(signaturePadService.getAllSignatures());
  }, []);

  const handleTouchStart = (x: number, y: number) => {
    signaturePadService.startStroke(x, y);
    setCurrentPoints([{ x, y }]);
    setIsDrawing(true);
  };

  const handleTouchMove = (x: number, y: number) => {
    if (!isDrawing) return;
    signaturePadService.addPoint(x, y);
    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const handleTouchEnd = () => {
    if (!isDrawing) return;
    const stroke = signaturePadService.endStroke();
    if (stroke) {
      setStrokes(prev => [...prev, { points: currentPoints, color: settings.color, thickness: settings.thickness }]);
    }
    setCurrentPoints([]);
    setIsDrawing(false);
    setSignature(signaturePadService.getCurrentSignature());
  };

  const handleClear = () => {
    signaturePadService.clear();
    setStrokes([]);
    setCurrentPoints([]);
    setSignature(signaturePadService.getCurrentSignature());
  };

  const handleUndo = () => {
    if (signaturePadService.undo()) {
      setStrokes(prev => prev.slice(0, -1));
      setSignature(signaturePadService.getCurrentSignature());
    }
  };

  const handleRedo = () => {
    if (signaturePadService.redo()) {
      setSignature(signaturePadService.getCurrentSignature());
    }
  };

  const handleSave = () => {
    const saved = signaturePadService.saveSignature();
    if (saved) {
      setSavedSignatures(signaturePadService.getAllSignatures());
      // Create new signature for next use
      const newSig = signaturePadService.createSignature('User', 'maker', PAD_WIDTH, PAD_HEIGHT);
      setSignature(newSig);
      setStrokes([]);
    }
  };

  const handleColorChange = (color: SignatureColor) => {
    signaturePadService.setColor(color);
    setSettings(signaturePadService.getSettings());
  };

  const handleThicknessChange = (thickness: SignatureThickness) => {
    signaturePadService.setThickness(thickness);
    setSettings(signaturePadService.getSettings());
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'draw', label: 'Draw', icon: '✍️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'saved', label: 'Saved', icon: '💾' },
    { id: 'compare', label: 'Compare', icon: '🔍' },
  ];

  const availableColors = signaturePadService.getAvailableColors();
  const availableThicknesses = signaturePadService.getAvailableThicknesses();
  const analytics = signaturePadService.getAnalytics();

  const renderDrawTab = () => (
    <View className="flex-1">
      {/* Signature Pad */}
      <View className="mx-5 mb-4">
        <Text className="text-foreground font-semibold text-lg mb-2">Sign Below</Text>
        <View 
          className="rounded-2xl border-2 border-dashed overflow-hidden"
          style={{ 
            width: PAD_WIDTH, 
            height: PAD_HEIGHT, 
            backgroundColor: settings.backgroundColor,
            borderColor: colors.border,
          }}
          onTouchStart={(e) => {
            const touch = e.nativeEvent;
            handleTouchStart(touch.locationX, touch.locationY);
          }}
          onTouchMove={(e) => {
            const touch = e.nativeEvent;
            handleTouchMove(touch.locationX, touch.locationY);
          }}
          onTouchEnd={handleTouchEnd}
        >
          {/* Guide lines */}
          {settings.showGuideLines && (
            <View className="absolute bottom-10 left-5 right-5 h-px bg-border opacity-50" />
          )}
          
          {/* Rendered strokes */}
          <View className="absolute inset-0">
            {strokes.map((stroke, strokeIndex) => (
              <View key={strokeIndex}>
                {stroke.points.map((point: any, pointIndex: number) => {
                  if (pointIndex === 0) return null;
                  const prevPoint = stroke.points[pointIndex - 1];
                  return (
                    <View
                      key={pointIndex}
                      className="absolute rounded-full"
                      style={{
                        left: point.x - 1,
                        top: point.y - 1,
                        width: 3,
                        height: 3,
                        backgroundColor: availableColors.find(c => c.id === stroke.color)?.hex || '#000',
                      }}
                    />
                  );
                })}
              </View>
            ))}
            
            {/* Current stroke being drawn */}
            {currentPoints.map((point, index) => (
              <View
                key={index}
                className="absolute rounded-full"
                style={{
                  left: point.x - 1,
                  top: point.y - 1,
                  width: 3,
                  height: 3,
                  backgroundColor: availableColors.find(c => c.id === settings.color)?.hex || '#000',
                }}
              />
            ))}
          </View>

          {/* Empty state */}
          {strokes.length === 0 && currentPoints.length === 0 && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-sm">Touch and drag to sign</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Color Selection */}
      <View className="mx-5 mb-4">
        <Text className="text-muted text-sm mb-2">Ink Color</Text>
        <View className="flex-row gap-3">
          {availableColors.map(color => (
            <TouchableOpacity
              key={color.id}
              onPress={() => handleColorChange(color.id)}
              className="w-10 h-10 rounded-full items-center justify-center border-2"
              style={{ 
                backgroundColor: color.hex,
                borderColor: settings.color === color.id ? colors.primary : 'transparent',
              }}
            >
              {settings.color === color.id && (
                <Text className="text-white text-lg">✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mx-5 mb-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleUndo}
            disabled={!signaturePadService.canUndo()}
            className="flex-1 bg-surface rounded-xl p-3 items-center"
            style={{ opacity: signaturePadService.canUndo() ? 1 : 0.5 }}
          >
            <Text className="text-xl mb-1">↩️</Text>
            <Text className="text-foreground text-sm">Undo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleRedo}
            disabled={!signaturePadService.canRedo()}
            className="flex-1 bg-surface rounded-xl p-3 items-center"
            style={{ opacity: signaturePadService.canRedo() ? 1 : 0.5 }}
          >
            <Text className="text-xl mb-1">↪️</Text>
            <Text className="text-foreground text-sm">Redo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleClear}
            className="flex-1 bg-surface rounded-xl p-3 items-center"
          >
            <Text className="text-xl mb-1">🗑️</Text>
            <Text className="text-foreground text-sm">Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Validation Status */}
      {signature && (
        <View className="mx-5 mb-4">
          <View 
            className="rounded-xl p-4"
            style={{ backgroundColor: signature.isValid ? colors.success + '20' : colors.warning + '20' }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-lg">{signature.isValid ? '✅' : '⚠️'}</Text>
              <Text className="text-foreground font-semibold">
                {signature.isValid ? 'Signature Valid' : 'Signature Incomplete'}
              </Text>
            </View>
            {!signature.isValid && signature.validationErrors.length > 0 && (
              <Text className="text-muted text-sm">
                {signature.validationErrors[0]}
              </Text>
            )}
            <Text className="text-muted text-xs mt-2">
              Strokes: {signature.strokes.length} • Points: {signature.metadata.touchPoints}
            </Text>
          </View>
        </View>
      )}

      {/* Save Button */}
      <View className="mx-5">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!signature?.isValid}
          className="rounded-xl p-4 items-center"
          style={{ 
            backgroundColor: signature?.isValid ? colors.primary : colors.muted,
            opacity: signature?.isValid ? 1 : 0.5,
          }}
        >
          <Text className="text-white font-bold text-lg">Save Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View className="flex-1 px-5">
      {/* Color Settings */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Ink Color</Text>
        <View className="gap-2">
          {availableColors.map(color => (
            <TouchableOpacity
              key={color.id}
              onPress={() => handleColorChange(color.id)}
              className="flex-row items-center bg-surface rounded-xl p-4"
            >
              <View 
                className="w-8 h-8 rounded-full mr-3"
                style={{ backgroundColor: color.hex }}
              />
              <Text className="text-foreground flex-1">{color.name}</Text>
              {settings.color === color.id && (
                <Text style={{ color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Thickness Settings */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Stroke Thickness</Text>
        <View className="gap-2">
          {availableThicknesses.map(thickness => (
            <TouchableOpacity
              key={thickness.id}
              onPress={() => handleThicknessChange(thickness.id)}
              className="flex-row items-center bg-surface rounded-xl p-4"
            >
              <View 
                className="w-8 h-2 rounded mr-3"
                style={{ 
                  backgroundColor: colors.foreground,
                  height: thickness.pixels * 2,
                }}
              />
              <Text className="text-foreground flex-1">{thickness.name}</Text>
              {settings.thickness === thickness.id && (
                <Text style={{ color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Other Settings */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold text-lg mb-3">Options</Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            onPress={() => {
              signaturePadService.updateSettings({ 
                hapticFeedback: !settings.hapticFeedback 
              });
              setSettings(signaturePadService.getSettings());
            }}
            className="flex-row items-center p-4 border-b border-border"
          >
            <Text className="text-foreground flex-1">Haptic Feedback</Text>
            <Text>{settings.hapticFeedback ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              signaturePadService.updateSettings({ 
                showGuideLines: !settings.showGuideLines 
              });
              setSettings(signaturePadService.getSettings());
            }}
            className="flex-row items-center p-4 border-b border-border"
          >
            <Text className="text-foreground flex-1">Show Guide Lines</Text>
            <Text>{settings.showGuideLines ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              signaturePadService.updateSettings({ 
                pressureSensitivity: !settings.pressureSensitivity 
              });
              setSettings(signaturePadService.getSettings());
            }}
            className="flex-row items-center p-4"
          >
            <Text className="text-foreground flex-1">Pressure Sensitivity</Text>
            <Text>{settings.pressureSensitivity ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSavedTab = () => (
    <View className="flex-1 px-5">
      {/* Analytics */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-2">Statistics</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">{analytics.totalSignatures}</Text>
            <Text className="text-muted text-xs">Total</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.success }}>{analytics.validSignatures}</Text>
            <Text className="text-muted text-xs">Valid</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.warning }}>{analytics.invalidSignatures}</Text>
            <Text className="text-muted text-xs">Invalid</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">{analytics.averageStrokes.toFixed(1)}</Text>
            <Text className="text-muted text-xs">Avg Strokes</Text>
          </View>
        </View>
      </View>

      {/* Saved Signatures */}
      <Text className="text-foreground font-semibold text-lg mb-3">Saved Signatures</Text>
      {savedSignatures.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">✍️</Text>
          <Text className="text-muted text-center">No saved signatures yet</Text>
          <Text className="text-muted text-center text-sm mt-1">Draw and save your first signature</Text>
        </View>
      ) : (
        <View className="gap-3">
          {savedSignatures.map(sig => (
            <View key={sig.id} className="bg-surface rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-foreground font-semibold">{sig.signedBy}</Text>
                  <Text className="text-muted text-xs">
                    {new Date(sig.createdAt).toLocaleDateString()} • {sig.purpose}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      const exported = signaturePadService.exportSignature('svg');
                      if (exported) {
                        console.log('Exported:', exported.filename);
                      }
                    }}
                    className="bg-primary/20 rounded-lg px-3 py-1"
                  >
                    <Text style={{ color: colors.primary }} className="text-sm">Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      signaturePadService.deleteSignature(sig.id);
                      setSavedSignatures(signaturePadService.getAllSignatures());
                    }}
                    className="bg-error/20 rounded-lg px-3 py-1"
                  >
                    <Text style={{ color: colors.error }} className="text-sm">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-4">
                <Text className="text-muted text-xs">Strokes: {sig.strokes.length}</Text>
                <Text className="text-muted text-xs">Points: {sig.metadata.touchPoints}</Text>
                <Text className="text-muted text-xs">
                  Time: {(sig.metadata.totalTime / 1000).toFixed(1)}s
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCompareTab = () => (
    <View className="flex-1 px-5">
      <Text className="text-foreground font-semibold text-lg mb-3">Compare Signatures</Text>
      
      {savedSignatures.length < 2 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">🔍</Text>
          <Text className="text-muted text-center">Need at least 2 signatures to compare</Text>
          <Text className="text-muted text-center text-sm mt-1">
            Save more signatures to use this feature
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-muted text-sm mb-3">Select two signatures to compare</Text>
          <View className="gap-2 mb-4">
            {savedSignatures.map(sig => (
              <TouchableOpacity
                key={sig.id}
                onPress={() => {
                  if (selectedForCompare.includes(sig.id)) {
                    setSelectedForCompare(prev => prev.filter(id => id !== sig.id));
                  } else if (selectedForCompare.length < 2) {
                    setSelectedForCompare(prev => [...prev, sig.id]);
                  }
                }}
                className="flex-row items-center bg-surface rounded-xl p-4"
                style={{
                  borderWidth: selectedForCompare.includes(sig.id) ? 2 : 0,
                  borderColor: colors.primary,
                }}
              >
                <View className="w-6 h-6 rounded border border-border items-center justify-center mr-3">
                  {selectedForCompare.includes(sig.id) && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground">{sig.signedBy}</Text>
                  <Text className="text-muted text-xs">
                    {new Date(sig.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedForCompare.length === 2 && (
            <TouchableOpacity
              onPress={() => {
                const result = signaturePadService.compareSignatures(
                  selectedForCompare[0],
                  selectedForCompare[1]
                );
                if (result) {
                  console.log('Comparison result:', result);
                }
              }}
              className="bg-primary rounded-xl p-4 items-center"
            >
              <Text className="text-white font-bold">Compare Selected</Text>
            </TouchableOpacity>
          )}
        </>
      )}
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
              <Text className="text-foreground text-xl font-bold">Signature Pad</Text>
              <Text className="text-muted text-sm">Touch-based signature capture</Text>
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
        {activeTab === 'draw' && renderDrawTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'saved' && renderSavedTab()}
        {activeTab === 'compare' && renderCompareTab()}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
