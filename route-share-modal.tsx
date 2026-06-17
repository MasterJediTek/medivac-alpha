/**
 * Route Share Modal Component
 * Displays QR code and share options for routes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Share, Platform } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { routeSharingService, SharedRoute, ShareResult } from '@/lib/services/route-sharing.service';

interface RouteShareModalProps {
  visible: boolean;
  route: SharedRoute | null;
  onClose: () => void;
  onImportSuccess?: (route: SharedRoute) => void;
}

export function RouteShareModal({
  visible,
  route,
  onClose,
  onImportSuccess
}: RouteShareModalProps) {
  const colors = useColors();
  const [mode, setMode] = useState<'share' | 'import'>('share');
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && route) {
      const result = routeSharingService.shareRoute(route);
      setShareResult(result);
      setMode('share');
    } else if (visible && !route) {
      setMode('import');
    }
  }, [visible, route]);

  const handleShare = async () => {
    if (!shareResult || !route) return;

    const shareText = routeSharingService.generateShareText(route, shareResult.shortCode || '');
    
    try {
      await Share.share({
        message: shareText,
        title: `Route: ${route.name}`
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCopyCode = () => {
    if (shareResult?.shortCode) {
      // In production, use Clipboard API
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    setImportError(null);
    
    if (importCode.length < 6) {
      setImportError('Please enter a valid 6-character code');
      return;
    }

    const result = routeSharingService.importFromCode(importCode);
    
    if (result.success && result.route) {
      onImportSuccess?.(result.route);
      onClose();
    } else {
      setImportError(result.error || 'Import failed');
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {mode === 'share' ? '📤 Share Route' : '📥 Import Route'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>

        {/* Mode Toggle */}
        <View style={[styles.modeToggle, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[
              styles.modeButton,
              mode === 'share' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setMode('share')}
          >
            <Text style={[
              styles.modeText,
              { color: mode === 'share' ? '#fff' : colors.muted }
            ]}>
              Share
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              mode === 'import' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setMode('import')}
          >
            <Text style={[
              styles.modeText,
              { color: mode === 'import' ? '#fff' : colors.muted }
            ]}>
              Import
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {mode === 'share' && route && shareResult?.success ? (
            <>
              {/* Route Info */}
              <View style={[styles.routeInfo, { backgroundColor: colors.surface }]}>
                <Text style={[styles.routeName, { color: colors.foreground }]}>
                  {route.name}
                </Text>
                <Text style={[styles.routeDetails, { color: colors.muted }]}>
                  📍 {route.startLocation} → {route.endLocation}
                </Text>
                <Text style={[styles.routeDetails, { color: colors.muted }]}>
                  ⏱️ {Math.ceil(route.estimatedTime / 60)} min • 
                  {route.isAccessible ? ' ♿ Accessible' : ''}
                </Text>
              </View>

              {/* QR Code Placeholder */}
              <View style={[styles.qrContainer, { backgroundColor: '#fff' }]}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrEmoji}>📱</Text>
                  <Text style={styles.qrLabel}>QR Code</Text>
                  <Text style={styles.qrCode}>{shareResult.shortCode}</Text>
                </View>
              </View>

              {/* Share Code */}
              <View style={[styles.codeContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.codeLabel, { color: colors.muted }]}>
                  Share Code
                </Text>
                <View style={styles.codeRow}>
                  <Text style={[styles.code, { color: colors.foreground }]}>
                    {shareResult.shortCode}
                  </Text>
                  <Pressable
                    style={[styles.copyButton, { backgroundColor: colors.primary }]}
                    onPress={handleCopyCode}
                  >
                    <Text style={styles.copyText}>
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Deep Link */}
              <View style={[styles.linkContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.linkLabel, { color: colors.muted }]}>
                  Deep Link
                </Text>
                <Text style={[styles.link, { color: colors.primary }]} numberOfLines={1}>
                  {shareResult.deepLink}
                </Text>
              </View>

              {/* Share Button */}
              <Pressable
                style={[styles.shareButton, { backgroundColor: colors.primary }]}
                onPress={handleShare}
              >
                <Text style={styles.shareButtonText}>📤 Share via...</Text>
              </Pressable>

              {/* Expiry Notice */}
              <Text style={[styles.expiryText, { color: colors.muted }]}>
                This share link expires in 7 days
              </Text>
            </>
          ) : mode === 'import' ? (
            <>
              {/* Import Instructions */}
              <View style={[styles.importInfo, { backgroundColor: colors.surface }]}>
                <Text style={[styles.importTitle, { color: colors.foreground }]}>
                  Enter Share Code
                </Text>
                <Text style={[styles.importDesc, { color: colors.muted }]}>
                  Enter the 6-character code from a shared route
                </Text>
              </View>

              {/* Code Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.codeInput,
                    { 
                      backgroundColor: colors.surface,
                      color: colors.foreground,
                      borderColor: importError ? colors.error : colors.border
                    }
                  ]}
                  value={importCode}
                  onChangeText={(text) => {
                    setImportCode(text.toUpperCase().slice(0, 6));
                    setImportError(null);
                  }}
                  placeholder="ABC123"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>

              {/* Error Message */}
              {importError && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  ⚠️ {importError}
                </Text>
              )}

              {/* Import Button */}
              <Pressable
                style={[
                  styles.importButton,
                  { backgroundColor: importCode.length === 6 ? colors.primary : colors.muted }
                ]}
                onPress={handleImport}
                disabled={importCode.length !== 6}
              >
                <Text style={styles.importButtonText}>📥 Import Route</Text>
              </Pressable>

              {/* QR Scan Option */}
              <Pressable style={[styles.scanButton, { borderColor: colors.border }]}>
                <Text style={[styles.scanText, { color: colors.foreground }]}>
                  📷 Scan QR Code
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.noRoute}>
              <Text style={[styles.noRouteText, { color: colors.muted }]}>
                No route selected for sharing
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  routeInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  routeDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 12,
    color: '#666',
  },
  qrCode: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 2,
  },
  codeContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  linkContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
  },
  shareButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  importInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  importDesc: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  importButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noRoute: {
    padding: 32,
    alignItems: 'center',
  },
  noRouteText: {
    fontSize: 14,
  },
});

export default RouteShareModal;
