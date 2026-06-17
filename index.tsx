                <Text className="text-muted text-sm">Alerts</Text>
              </View>
              <Text className="text-foreground text-2xl font-bold mt-1">{stats.criticalAlerts}</Text>
            </View>
          </View>
        </View>

        {/* JEDI Sync Status */}
        <View className="px-5 mb-4">
          <TouchableOpacity 
            className="bg-surface rounded-2xl p-4 flex-row items-center gap-3 border border-border"
            activeOpacity={0.7}
            onPress={() => router.push("/jedi" as any)}
          >
            <View 
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#8B5CF6' + '20' }}
            >
              <IconSymbol name="network" size={24} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">JEDI Systems Connected</Text>
              <Text className="text-muted text-sm">L3 Cache: 98% • S3 Sync: Active</Text>
            </View>
            <View 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
          </TouchableOpacity>
        </View>

        {/* Main Module Grid */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold text-lg mb-3">General Practice</Text>
          <View className="flex-row flex-wrap gap-3">
            {modules.map(module => (
              <TouchableOpacity
                key={module.id}
                className="items-center justify-center rounded-2xl"
                style={{ 
                  width: moduleSize, 
                  height: moduleSize,
                  backgroundColor: module.color,
                }}
                activeOpacity={0.8}
                onPress={() => router.push(module.route as any)}
              >
                <IconSymbol name={module.icon} size={32} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold mt-2 text-center">{module.label}</Text>
                {module.badge && (
                  <View 
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <Text className="text-white text-xs font-bold">{module.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Patient Turnover Chart */}
        <View className="px-5 mb-4">
          <ControlPanel
            title="Patient Turnover"
            subtitle="This month"
            icon="chart.bar.fill"
          >
            <View className="flex-row items-end justify-between h-32 mt-2">
              {patientTurnover.map((item, index) => (
                <View key={index} className="items-center flex-1">
                  <View 
                    className="w-6 rounded-t-md"
                    style={{ 
                      height: (item.value / maxTurnover) * 100,
                      backgroundColor: index === patientTurnover.length - 1 ? colors.primary : colors.primary + '60',
                    }}
                  />
                  <Text className="text-muted text-xs mt-1">{item.month}</Text>
                </View>
              ))}
            </View>
          </ControlPanel>
        </View>

        {/* Secondary Module Grid */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold text-lg mb-3">Database Modules</Text>
          <View className="flex-row flex-wrap gap-3">
            {secondaryModules.map(module => (
              <TouchableOpacity
                key={module.id}
                className="items-center justify-center rounded-2xl"
                style={{ 
                  width: moduleSize, 
                  height: moduleSize,
                  backgroundColor: module.color,
                }}
                activeOpacity={0.8}
                onPress={() => router.push(module.route as any)}
              >
                <IconSymbol name={module.icon} size={28} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold mt-2 text-center">{module.label}</Text>
                {module.badge && (
                  <View 
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <Text className="text-white text-xs font-bold">{module.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Access Toolbar */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold text-lg mb-3">Quick Access</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {toolbarItems.map(item => (
              <TouchableOpacity
                key={item.id}
                className="items-center bg-surface rounded-xl px-4 py-3"
                activeOpacity={0.7}
              >
                <IconSymbol name={item.icon} size={24} color={colors.primary} />
                <Text className="text-muted text-xs mt-1">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Status Indicators */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold text-lg mb-3">System Status</Text>
          <View className="gap-3">
            <StatusIndicator 
              label="JEDI Connection" 
              value="Online" 
              status="success" 
            />
            <StatusIndicator 
              label="S3 Storage" 
              value="2.4 GB / 10 GB" 
              status="info" 
            />
            <StatusIndicator 
              label="L3 Cache" 
              value="98% Synced" 
              status="success" 
            />
            <StatusIndicator 
              label="VPN Status" 
              value="Connected" 
              status="success" 
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-5 mb-4">
          <ControlPanel
            title="Recent Activity"
            subtitle="Last 24 hours"
            icon="clock.fill"
            headerAction={{ label: "View All", onPress: () => router.push("/comms" as any) }}
          >
            <View className="gap-3 mt-2">
              {[
                { time: "2 min ago", action: "Patient admitted", detail: "John Doe - Room 101", color: colors.success },
                { time: "15 min ago", action: "Lab results ready", detail: "Patient #1234 - CBC", color: colors.warning },
                { time: "1 hour ago", action: "Surgery completed", detail: "Dr. Watson - OR-1", color: colors.primary },
                { time: "2 hours ago", action: "Medication dispensed", detail: "Paracetamol 500mg x 20", color: colors.muted },
              ].map((activity, index) => (
                <View key={index} className="flex-row items-center gap-3">
                  <View 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activity.color }}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-medium">{activity.action}</Text>
                    <Text className="text-muted text-xs">{activity.detail}</Text>
                  </View>
                  <Text className="text-muted text-xs">{activity.time}</Text>
                </View>
              ))}
            </View>
          </ControlPanel>
        </View>

        {/* Footer */}
        <View className="px-5 items-center mt-4">
          <Text className="text-muted text-xs">MediVac One™ Virtual Hospital</Text>
          <Text className="text-muted text-xs mt-1">© 2024 SMPO.INK • Powered by JediTek.net</Text>
        </View>
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </ScreenContainer>
  );
}
