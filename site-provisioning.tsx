/**
 * WACHS Site Provisioning Wizard Screen
 * Step-by-step wizard for adding new health sites
 * MediVac One v5.8
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  siteProvisioningService,
  SiteTemplate,
  ProvisioningDraft,
  ProvisioningResult,
  WIZARD_STEPS,
  AVAILABLE_SERVICES,
  CONTACT_ROLES,
  WizardStep,
  SiteContact,
} from "@/lib/services/site-provisioning-service";
import { WACHS_REGIONS, WACHSRegion } from "@/lib/services/wachs-wan-service";

type ViewMode = 'list' | 'wizard';

export default function SiteProvisioningScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [drafts, setDrafts] = useState<ProvisioningDraft[]>([]);
  const [history, setHistory] = useState<ProvisioningResult[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ProvisioningDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  // Contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await siteProvisioningService.initialize();
      setTemplates(siteProvisioningService.getTemplates());
      setDrafts(siteProvisioningService.getDrafts());
      setHistory(siteProvisioningService.getHistory());
    } catch (error) {
      console.error('Failed to load provisioning data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartWizard = async (templateId?: string) => {
    try {
      const draft = await siteProvisioningService.createDraft(templateId);
      setCurrentDraft(draft);
      setViewMode('wizard');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start wizard');
    }
  };

  const handleResumeDraft = (draft: ProvisioningDraft) => {
    setCurrentDraft(draft);
    setViewMode('wizard');
  };

  const handleUpdateDraft = async (updates: Partial<ProvisioningDraft>) => {
    if (!currentDraft) return;
    
    const updated = await siteProvisioningService.updateDraft(currentDraft.id, updates);
    if (updated) {
      setCurrentDraft(updated);
    }
  };

  const handleCompleteStep = async () => {
    if (!currentDraft) return;
    
    const updated = await siteProvisioningService.completeStep(currentDraft.id, currentDraft.currentStep);
    if (updated) {
      setCurrentDraft(updated);
    }
  };

  const handleGoToStep = async (step: WizardStep) => {
    if (!currentDraft) return;
    
    const updated = await siteProvisioningService.goToStep(currentDraft.id, step);
    if (updated) {
      setCurrentDraft(updated);
    }
  };

  const handleAutoDiscover = async () => {
    if (!currentDraft) return;
    
    setDiscovering(true);
    try {
      const result = await siteProvisioningService.autoDiscoverNetwork(currentDraft.id);
      if (result.success) {
        Alert.alert('Success', result.message);
        const updated = siteProvisioningService.getDraft(currentDraft.id);
        if (updated) setCurrentDraft(updated);
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Auto-discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddContact = () => {
    if (!currentDraft || !newContactName || !newContactRole) {
      Alert.alert('Error', 'Name and role are required');
      return;
    }

    const contact: SiteContact = {
      id: `contact_${Date.now()}`,
      name: newContactName,
      role: newContactRole,
      phone: newContactPhone,
      email: newContactEmail,
      isPrimary: currentDraft.contacts.length === 0,
    };

    handleUpdateDraft({
      contacts: [...currentDraft.contacts, contact],
    });

    setNewContactName('');
    setNewContactRole('');
    setNewContactPhone('');
    setNewContactEmail('');
  };

  const handleProvision = async () => {
    if (!currentDraft) return;
    
    setProvisioning(true);
    try {
      const result = await siteProvisioningService.provisionSite(currentDraft.id);
      if (result.status === 'success') {
        Alert.alert('Success', `Site "${result.siteName}" has been provisioned successfully!`);
        setViewMode('list');
        setCurrentDraft(null);
      } else {
        Alert.alert('Failed', result.errors.join('\n'));
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Provisioning failed');
    } finally {
      setProvisioning(false);
    }
  };

  const stats = siteProvisioningService.getStatistics();

  const getCurrentStepIndex = (): number => {
    if (!currentDraft) return 0;
    return WIZARD_STEPS.findIndex(s => s.id === currentDraft.currentStep);
  };

  const renderList = () => (
    <View>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Templates</Text>
          <Text className="text-foreground text-xl font-bold">{stats.totalTemplates}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Drafts</Text>
          <Text className="text-foreground text-xl font-bold">{stats.activeDrafts}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Success Rate</Text>
          <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.successRate}%</Text>
        </View>
      </View>

      {/* Templates */}
      <Text className="text-foreground text-lg font-bold mb-3">Site Templates</Text>
      {templates.map((template) => (
        <TouchableOpacity
          key={template.id}
          onPress={() => handleStartWizard(template.id)}
          className="bg-surface rounded-xl p-4 mb-3"
        >
          <View className="flex-row items-center gap-3">
            <View style={{ backgroundColor: template.color }} className="p-3 rounded-xl">
              <IconSymbol name="building.2.fill" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{template.name}</Text>
              <Text className="text-muted text-sm">{template.description}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </View>
        </TouchableOpacity>
      ))}

      {/* Active Drafts */}
      {drafts.filter(d => d.status === 'draft').length > 0 && (
        <>
          <Text className="text-foreground text-lg font-bold mb-3 mt-4">Continue Draft</Text>
          {drafts.filter(d => d.status === 'draft').map((draft) => (
            <TouchableOpacity
              key={draft.id}
              onPress={() => handleResumeDraft(draft)}
              className="bg-surface rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-semibold">
                  {draft.basicInfo.name || 'Untitled Site'}
                </Text>
                <View className="bg-warning/20 px-2 py-1 rounded">
                  <Text style={{ color: colors.warning }} className="text-xs">Draft</Text>
                </View>
              </View>
              <Text className="text-muted text-sm">
                Step: {WIZARD_STEPS.find(s => s.id === draft.currentStep)?.title}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Recent Provisions */}
      {history.length > 0 && (
        <>
          <Text className="text-foreground text-lg font-bold mb-3 mt-4">Recent Provisions</Text>
          {history.slice(0, 5).map((result) => (
            <View key={result.id} className="bg-surface rounded-xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-semibold">{result.siteName}</Text>
                <View 
                  style={{ backgroundColor: result.status === 'success' ? colors.success + '20' : colors.error + '20' }}
                  className="px-2 py-1 rounded"
                >
                  <Text style={{ color: result.status === 'success' ? colors.success : colors.error }} className="text-xs capitalize">
                    {result.status}
                  </Text>
                </View>
              </View>
              <Text className="text-muted text-sm">
                {WACHS_REGIONS[result.region].label} • {new Date(result.completedAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderWizard = () => {
    if (!currentDraft) return null;

    const stepIndex = getCurrentStepIndex();

    return (
      <View>
        {/* Progress */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-semibold">
              Step {stepIndex + 1} of {WIZARD_STEPS.length}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setViewMode('list');
                setCurrentDraft(null);
              }}
              className="px-3 py-1 rounded-lg"
              style={{ backgroundColor: colors.error + '20' }}
            >
              <Text style={{ color: colors.error }} className="text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-1">
            {WIZARD_STEPS.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                onPress={() => currentDraft.completedSteps.includes(step.id) && handleGoToStep(step.id)}
                className="flex-1 h-2 rounded-full"
                style={{
                  backgroundColor: index <= stepIndex ? colors.primary : colors.border,
                  opacity: currentDraft.completedSteps.includes(step.id) ? 1 : 0.5,
                }}
              />
            ))}
          </View>
          <Text className="text-muted text-sm mt-2">
            {WIZARD_STEPS[stepIndex].title}: {WIZARD_STEPS[stepIndex].description}
          </Text>
        </View>

        {/* Step Content */}
        {currentDraft.currentStep === 'template' && (
          <View>
            <Text className="text-foreground font-semibold mb-3">Selected Template</Text>
            {currentDraft.template ? (
              <View className="bg-surface rounded-xl p-4 mb-4">
                <View className="flex-row items-center gap-3">
                  <View style={{ backgroundColor: currentDraft.template.color }} className="p-3 rounded-xl">
                    <IconSymbol name="building.2.fill" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-foreground font-semibold">{currentDraft.template.name}</Text>
                    <Text className="text-muted text-sm">{currentDraft.template.description}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-4 mb-4">
                <Text className="text-muted">No template selected - using defaults</Text>
              </View>
            )}
          </View>
        )}

        {currentDraft.currentStep === 'basic' && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">Site Name *</Text>
              <TextInput
                value={currentDraft.basicInfo.name}
                onChangeText={(text) => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, name: text } })}
                placeholder="e.g., Bunbury Regional Hospital"
                placeholderTextColor={colors.muted}
                className="bg-background text-foreground p-3 rounded-lg"
              />
            </View>

            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">Site Code *</Text>
              <TextInput
                value={currentDraft.basicInfo.code}
                onChangeText={(text) => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, code: text.toUpperCase() } })}
                placeholder="e.g., BRH"
                placeholderTextColor={colors.muted}
                className="bg-background text-foreground p-3 rounded-lg"
                autoCapitalize="characters"
                maxLength={5}
              />
            </View>

            <View className="mb-3">
              <Text className="text-muted text-sm mb-2">Region</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {(Object.keys(WACHS_REGIONS) as WACHSRegion[]).map((region) => {
                    const regConfig = WACHS_REGIONS[region];
                    return (
                      <TouchableOpacity
                        key={region}
                        onPress={() => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, region } })}
                        style={currentDraft.basicInfo.region === region ? { backgroundColor: regConfig.color } : undefined}
                        className={`px-3 py-2 rounded-lg ${currentDraft.basicInfo.region !== region ? 'bg-background' : ''}`}
                      >
                        <Text className={currentDraft.basicInfo.region === region ? 'text-white font-medium' : 'text-muted'}>
                          {regConfig.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">Address *</Text>
              <TextInput
                value={currentDraft.basicInfo.address}
                onChangeText={(text) => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, address: text } })}
                placeholder="Street address"
                placeholderTextColor={colors.muted}
                className="bg-background text-foreground p-3 rounded-lg"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-muted text-sm mb-1">Postcode</Text>
                <TextInput
                  value={currentDraft.basicInfo.postcode}
                  onChangeText={(text) => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, postcode: text } })}
                  placeholder="6230"
                  placeholderTextColor={colors.muted}
                  className="bg-background text-foreground p-3 rounded-lg"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted text-sm mb-1">Phone</Text>
                <TextInput
                  value={currentDraft.basicInfo.phone}
                  onChangeText={(text) => handleUpdateDraft({ basicInfo: { ...currentDraft.basicInfo, phone: text } })}
                  placeholder="08 9722 1000"
                  placeholderTextColor={colors.muted}
                  className="bg-background text-foreground p-3 rounded-lg"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        )}

        {currentDraft.currentStep === 'network' && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <TouchableOpacity
              onPress={handleAutoDiscover}
              disabled={discovering}
              className="bg-primary py-3 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-medium">
                {discovering ? 'Discovering...' : 'Auto-Discover Network'}
              </Text>
            </TouchableOpacity>

            {currentDraft.networkConfig.autoDiscovered && (
              <View className="bg-success/10 p-3 rounded-lg mb-4">
                <Text style={{ color: colors.success }} className="text-sm">
                  Network configuration auto-discovered
                </Text>
              </View>
            )}

            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">IP Range *</Text>
              <TextInput
                value={currentDraft.networkConfig.ipRange}
                onChangeText={(text) => handleUpdateDraft({ networkConfig: { ...currentDraft.networkConfig, ipRange: text } })}
                placeholder="10.100.1.0/24"
                placeholderTextColor={colors.muted}
                className="bg-background text-foreground p-3 rounded-lg"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">Gateway *</Text>
              <TextInput
                value={currentDraft.networkConfig.gateway}
                onChangeText={(text) => handleUpdateDraft({ networkConfig: { ...currentDraft.networkConfig, gateway: text } })}
                placeholder="10.100.1.1"
                placeholderTextColor={colors.muted}
                className="bg-background text-foreground p-3 rounded-lg"
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-muted text-sm mb-1">VLAN ID</Text>
                <TextInput
                  value={String(currentDraft.networkConfig.vlanId)}
                  onChangeText={(text) => handleUpdateDraft({ networkConfig: { ...currentDraft.networkConfig, vlanId: parseInt(text) || 0 } })}
                  placeholder="100"
                  placeholderTextColor={colors.muted}
                  className="bg-background text-foreground p-3 rounded-lg"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted text-sm mb-1">Bandwidth (Mbps)</Text>
                <TextInput
                  value={String(currentDraft.networkConfig.bandwidth)}
                  onChangeText={(text) => handleUpdateDraft({ networkConfig: { ...currentDraft.networkConfig, bandwidth: parseInt(text) || 0 } })}
                  placeholder="1000"
                  placeholderTextColor={colors.muted}
                  className="bg-background text-foreground p-3 rounded-lg"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        )}

        {currentDraft.currentStep === 'services' && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-foreground font-semibold mb-3">Select Services</Text>
            {['Clinical', 'Administrative', 'Operations'].map((category) => (
              <View key={category} className="mb-4">
                <Text className="text-muted text-sm mb-2">{category}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {AVAILABLE_SERVICES.filter(s => s.category === category).map((service) => {
                    const isSelected = currentDraft.services.selected.includes(service.id);
                    return (
                      <TouchableOpacity
                        key={service.id}
                        onPress={() => {
                          const newSelected = isSelected
                            ? currentDraft.services.selected.filter(s => s !== service.id)
                            : [...currentDraft.services.selected, service.id];
                          handleUpdateDraft({ services: { ...currentDraft.services, selected: newSelected } });
                        }}
                        className={`px-3 py-2 rounded-lg ${isSelected ? 'bg-primary' : 'bg-background'}`}
                      >
                        <Text className={isSelected ? 'text-white font-medium' : 'text-muted'}>
                          {service.name}
                          {service.required && ' *'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {currentDraft.currentStep === 'contacts' && (
          <View>
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-foreground font-semibold mb-3">Add Contact</Text>
              
              <View className="mb-3">
                <Text className="text-muted text-sm mb-1">Name *</Text>
                <TextInput
                  value={newContactName}
                  onChangeText={setNewContactName}
                  placeholder="Full name"
                  placeholderTextColor={colors.muted}
                  className="bg-background text-foreground p-3 rounded-lg"
                />
              </View>

              <View className="mb-3">
                <Text className="text-muted text-sm mb-2">Role *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {CONTACT_ROLES.map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => setNewContactRole(role)}
                        className={`px-3 py-2 rounded-lg ${newContactRole === role ? 'bg-primary' : 'bg-background'}`}
                      >
                        <Text className={newContactRole === role ? 'text-white font-medium' : 'text-muted'}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-1">Phone</Text>
                  <TextInput
                    value={newContactPhone}
                    onChangeText={setNewContactPhone}
                    placeholder="Phone number"
                    placeholderTextColor={colors.muted}
                    className="bg-background text-foreground p-3 rounded-lg"
                    keyboardType="phone-pad"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-1">Email</Text>
                  <TextInput
                    value={newContactEmail}
                    onChangeText={setNewContactEmail}
                    placeholder="Email address"
                    placeholderTextColor={colors.muted}
                    className="bg-background text-foreground p-3 rounded-lg"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddContact}
                className="bg-primary/10 py-3 rounded-lg"
              >
                <Text style={{ color: colors.primary }} className="text-center font-medium">Add Contact</Text>
              </TouchableOpacity>
            </View>

            {currentDraft.contacts.length > 0 && (
              <View className="bg-surface rounded-xl p-4 mb-4">
                <Text className="text-foreground font-semibold mb-3">Contacts ({currentDraft.contacts.length})</Text>
                {currentDraft.contacts.map((contact) => (
                  <View key={contact.id} className="bg-background rounded-lg p-3 mb-2">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-foreground font-medium">{contact.name}</Text>
                        <Text className="text-muted text-sm">{contact.role}</Text>
                      </View>
                      {contact.isPrimary && (
                        <View className="bg-primary/20 px-2 py-1 rounded">
                          <Text style={{ color: colors.primary }} className="text-xs">Primary</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentDraft.currentStep === 'review' && (
          <View>
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-foreground font-semibold mb-3">Review Configuration</Text>
              
              <View className="mb-3">
                <Text className="text-muted text-xs">Site Name</Text>
                <Text className="text-foreground font-medium">{currentDraft.basicInfo.name || '-'}</Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-muted text-xs">Code & Region</Text>
                <Text className="text-foreground font-medium">
                  {currentDraft.basicInfo.code || '-'} • {WACHS_REGIONS[currentDraft.basicInfo.region].label}
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-muted text-xs">Network</Text>
                <Text className="text-foreground font-medium">
                  {currentDraft.networkConfig.ipRange || '-'} (VLAN {currentDraft.networkConfig.vlanId})
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-muted text-xs">Services</Text>
                <Text className="text-foreground font-medium">
                  {currentDraft.services.selected.length} services selected
                </Text>
              </View>
              
              <View>
                <Text className="text-muted text-xs">Contacts</Text>
                <Text className="text-foreground font-medium">
                  {currentDraft.contacts.length} contacts configured
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleProvision}
              disabled={provisioning}
              className="bg-[#1E40AF] py-4 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">
                {provisioning ? 'Provisioning...' : 'Provision Site'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        {currentDraft.currentStep !== 'review' && (
          <TouchableOpacity
            onPress={handleCompleteStep}
            className="bg-primary py-4 rounded-xl mt-4"
          >
            <Text className="text-white text-center font-semibold">Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading provisioning wizard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Site Provisioning</Text>
            <Text className="text-muted">WACHS Site Setup Wizard</Text>
          </View>
          <View className="bg-[#1E40AF] p-3 rounded-full">
            <IconSymbol name="building.2.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {viewMode === 'list' ? renderList() : renderWizard()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
