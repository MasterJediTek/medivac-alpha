              onPress={() => router.push("/auth" as any)}
            >
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + '20' }}
                >
                  <IconSymbol name="person.fill" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-foreground font-semibold">Sign In</Text>
                  <Text className="text-muted text-sm">Access all features</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sync Status Card */}
        <View className="px-5 mb-6">
          <TouchableOpacity 
            className="bg-surface rounded-2xl p-4 flex-row items-center justify-between border border-border"
            activeOpacity={0.7}
            onPress={() => router.push("/sync" as any)}
          >
            <View className="flex-row items-center gap-3">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ 
                  backgroundColor: offlineState?.isOnline 
                    ? colors.success + '20' 
                    : colors.warning + '20' 
                }}
              >
                <IconSymbol 
                  name="arrow.triangle.2.circlepath" 
                  size={24} 
                  color={offlineState?.isOnline ? colors.success : colors.warning} 
                />
              </View>
              <View>
                <Text className="text-foreground font-semibold">
                  {offlineState?.isOnline ? 'Online' : 'Offline Mode'}
                </Text>
                <Text className="text-muted text-sm">
                  {offlineState?.pendingActionsCount 
                    ? `${offlineState.pendingActionsCount} pending actions`
                    : 'All synced'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.7}
            >
              <Text className="text-background font-semibold text-sm">Sync Now</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} className="mb-6">
            <Text className="text-muted text-sm font-semibold uppercase tracking-wide px-5 mb-2">
              {section.title}
            </Text>
            <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center p-4 gap-3"
                  style={{
                    borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: (item.color || colors.primary) + '15' }}
                  >
                    <IconSymbol 
                      name={item.icon} 
                      size={22} 
                      color={item.color || colors.primary} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{item.title}</Text>
                    <Text className="text-muted text-sm">{item.subtitle}</Text>
                  </View>
                  {item.badge && (
                    <View 
                      className="px-2 py-1 rounded-full mr-2"
                      style={{ backgroundColor: colors.error }}
                    >
                      <Text className="text-background text-xs font-bold">{item.badge}</Text>