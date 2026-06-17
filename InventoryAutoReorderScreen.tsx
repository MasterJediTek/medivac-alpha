/**
 * Inventory Auto-Reorder Screen
 * MediVac One v3.0 - Smart Inventory Management UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  InventoryAutoReorderService,
  InventoryItem,
  ReorderAlert,
  PurchaseOrder,
  InventoryAnalytics,
  StockStatus,
  ItemCategory,
} from '../services/InventoryAutoReorderService';

type ViewMode = 'dashboard' | 'inventory' | 'alerts' | 'orders';

export default function InventoryAutoReorderScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = InventoryAutoReorderService.subscribe(handleEvent);
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const [analyticsData, itemsData, alertsData, ordersData] = await Promise.all([
      InventoryAutoReorderService.getAnalytics(),
      InventoryAutoReorderService.getItems({ category: selectedCategory || undefined }),
      InventoryAutoReorderService.getAlerts(),
      InventoryAutoReorderService.getPurchaseOrders(),
    ]);
    setAnalytics(analyticsData);
    setItems(itemsData);
    setAlerts(alertsData);
    setOrders(ordersData);
  };

  const handleEvent = () => {
    loadData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderViewTabs = () => (
    <View style={styles.viewTabs}>
      {[
        { key: 'dashboard', label: '📊 Dashboard' },
        { key: 'inventory', label: '📦 Inventory' },
        { key: 'alerts', label: `⚠️ Alerts (${alerts.length})` },
        { key: 'orders', label: '📋 Orders' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.viewTab, viewMode === tab.key && styles.activeViewTab]}
          onPress={() => setViewMode(tab.key as ViewMode)}
        >
          <Text style={[styles.viewTabText, viewMode === tab.key && styles.activeViewTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => {
    if (!analytics) return null;

    return (
      <View style={styles.dashboardContainer}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.summaryNumber}>{analytics.totalItems}</Text>
            <Text style={styles.summaryLabel}>Total Items</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.summaryNumber}>${analytics.totalValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Inventory Value</Text>
          </View>
        </View>

        {/* Stock Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Stock Status</Text>
          <View style={styles.statusGrid}>
            <StatusBadge label="In Stock" count={analytics.stockStatusSummary.in_stock} color="#10B981" />
            <StatusBadge label="Low Stock" count={analytics.stockStatusSummary.low_stock} color="#F59E0B" />
            <StatusBadge label="Critical" count={analytics.stockStatusSummary.critical} color="#EF4444" />
            <StatusBadge label="Out of Stock" count={analytics.stockStatusSummary.out_of_stock} color="#DC2626" />
          </View>
        </View>

        {/* Alerts Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚠️ Active Alerts</Text>
          <View style={styles.alertSummary}>
            <View style={styles.alertSummaryItem}>
              <Text style={[styles.alertCount, { color: '#DC2626' }]}>{analytics.criticalAlerts}</Text>
              <Text style={styles.alertLabel}>Critical</Text>
            </View>
            <View style={styles.alertSummaryItem}>
              <Text style={[styles.alertCount, { color: '#F59E0B' }]}>{analytics.reorderAlerts - analytics.criticalAlerts}</Text>
              <Text style={styles.alertLabel}>Warning</Text>
            </View>
            <View style={styles.alertSummaryItem}>
              <Text style={[styles.alertCount, { color: '#6B7280' }]}>{analytics.expiringItems}</Text>
              <Text style={styles.alertLabel}>Expiring</Text>
            </View>
          </View>
        </View>

        {/* Pending Orders */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📋 Pending Orders</Text>
          <View style={styles.orderSummary}>
            <Text style={styles.orderCount}>{analytics.pendingOrders} orders</Text>
            <Text style={styles.orderValue}>${analytics.pendingOrderValue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📦 By Category</Text>
          <View style={styles.categoryGrid}>
            {Object.entries(analytics.itemsByCategory).map(([category, count]) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryItem}
                onPress={() => {
                  setSelectedCategory(category as ItemCategory);
                  setViewMode('inventory');
                }}
              >
                <Text style={styles.categoryIcon}>{getCategoryIcon(category as ItemCategory)}</Text>
                <Text style={styles.categoryCount}>{count}</Text>
                <Text style={styles.categoryLabel}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderInventory = () => (
    <View style={styles.inventoryContainer}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(['medications', 'supplies', 'ppe', 'surgical', 'lab', 'nutrition'] as ItemCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {getCategoryIcon(cat)} {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Item List */}
      {items.map((item) => (
        <InventoryItemCard key={item.id} item={item} onReorder={() => handleReorder(item)} />
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.alertsContainer}>
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No active alerts</Text>
          <Text style={styles.emptySubtext}>All inventory levels are healthy</Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
            onCreatePO={() => handleCreatePOFromAlert(alert)}
          />
        ))
      )}
    </View>
  );

  const renderOrders = () => (
    <View style={styles.ordersContainer}>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onApprove={() => handleApproveOrder(order.id)}
          onReceive={() => handleReceiveOrder(order.id)}
        />
      ))}
    </View>
  );

  const handleReorder = async (item: InventoryItem) => {
    Alert.alert(
      'Create Purchase Order',
      `Create PO for ${item.reorderQuantity} ${item.unit}(s) of ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            await InventoryAutoReorderService.createPurchaseOrder(
              item.preferredVendorId,
              [{ itemId: item.id, quantity: item.reorderQuantity }],
              'User'
            );
            loadData();
          },
        },
      ]
    );
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await InventoryAutoReorderService.acknowledgeAlert(alertId, 'User');
    loadData();
  };

  const handleCreatePOFromAlert = async (alert: ReorderAlert) => {
    const item = await InventoryAutoReorderService.getItem(alert.inventoryItemId);
    if (item) {
      await InventoryAutoReorderService.createPurchaseOrder(
        item.preferredVendorId,
        [{ itemId: item.id, quantity: alert.reorderQuantity }],
        'User'
      );
      await handleAcknowledgeAlert(alert.id);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    await InventoryAutoReorderService.updatePOStatus(orderId, 'approved', 'User');
    loadData();
  };

  const handleReceiveOrder = async (orderId: string) => {
    await InventoryAutoReorderService.updatePOStatus(orderId, 'received');
    loadData();
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Inventory Management</Text>
        <Text style={styles.headerSubtitle}>Auto-Reorder System</Text>
      </View>

      {renderViewTabs()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'inventory' && renderInventory()}
        {viewMode === 'alerts' && renderAlerts()}
        {viewMode === 'orders' && renderOrders()}
      </ScrollView>
    </ScreenContainer>
  );
}

// Helper Components
function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[badgeStyles.container, { borderColor: color }]}>
      <Text style={[badgeStyles.count, { color }]}>{count}</Text>
      <Text style={badgeStyles.label}>{label}</Text>
    </View>
  );
}

function InventoryItemCard({ item, onReorder }: { item: InventoryItem; onReorder: () => void }) {
  const status = getStockStatusLocal(item);
  const statusColor = getStatusColor(status);

  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.header}>
        <View>
          <Text style={itemStyles.name}>{item.name}</Text>
          <Text style={itemStyles.sku}>SKU: {item.sku}</Text>
        </View>
        <View style={[itemStyles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={itemStyles.statusText}>{status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={itemStyles.details}>
        <View style={itemStyles.detailItem}>
          <Text style={itemStyles.detailLabel}>Current</Text>
          <Text style={itemStyles.detailValue}>{item.currentQuantity} {item.unit}</Text>
        </View>
        <View style={itemStyles.detailItem}>
          <Text style={itemStyles.detailLabel}>Reorder Point</Text>
          <Text style={itemStyles.detailValue}>{item.reorderPoint}</Text>
        </View>
        <View style={itemStyles.detailItem}>
          <Text style={itemStyles.detailLabel}>Unit Cost</Text>
          <Text style={itemStyles.detailValue}>${item.unitCost.toFixed(2)}</Text>
        </View>
      </View>

      <View style={itemStyles.progressContainer}>
        <View style={itemStyles.progressBar}>
          <View
            style={[
              itemStyles.progressFill,
              {
                width: `${Math.min((item.currentQuantity / item.maxQuantity) * 100, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={itemStyles.progressText}>
          {item.currentQuantity}/{item.maxQuantity}
        </Text>
      </View>

      {status !== 'in_stock' && status !== 'overstocked' && (
        <TouchableOpacity style={itemStyles.reorderButton} onPress={onReorder}>
          <Text style={itemStyles.reorderButtonText}>🛒 Create Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onCreatePO,
}: {
  alert: ReorderAlert;
  onAcknowledge: () => void;
  onCreatePO: () => void;
}) {
  const priorityColor = getPriorityColor(alert.priority);

  return (
    <View style={[alertStyles.card, { borderLeftColor: priorityColor, borderLeftWidth: 4 }]}>
      <View style={alertStyles.header}>
        <View style={[alertStyles.priorityBadge, { backgroundColor: priorityColor }]}>
          <Text style={alertStyles.priorityText}>{alert.priority.toUpperCase()}</Text>
        </View>
        <Text style={alertStyles.time}>
          {new Date(alert.createdAt).toLocaleTimeString()}
        </Text>
      </View>

      <Text style={alertStyles.itemName}>{alert.itemName}</Text>
      <Text style={alertStyles.category}>{getCategoryIcon(alert.category)} {alert.category}</Text>

      <View style={alertStyles.details}>
        <Text style={alertStyles.detailText}>
          Current: <Text style={alertStyles.detailValue}>{alert.currentQuantity}</Text>
        </Text>
        <Text style={alertStyles.detailText}>
          Reorder Point: <Text style={alertStyles.detailValue}>{alert.reorderPoint}</Text>
        </Text>
        <Text style={alertStyles.detailText}>
          Days Supply: <Text style={alertStyles.detailValue}>{alert.daysOfSupplyRemaining}</Text>
        </Text>
      </View>

      <Text style={alertStyles.suggestion}>{alert.suggestedAction}</Text>

      <View style={alertStyles.actions}>
        <TouchableOpacity style={alertStyles.acknowledgeButton} onPress={onAcknowledge}>
          <Text style={alertStyles.acknowledgeText}>Acknowledge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={alertStyles.createPOButton} onPress={onCreatePO}>
          <Text style={alertStyles.createPOText}>Create PO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OrderCard({
  order,
  onApprove,
  onReceive,
}: {
  order: PurchaseOrder;
  onApprove: () => void;
  onReceive: () => void;
}) {
  const statusColor = getOrderStatusColor(order.status);

  return (
    <View style={orderStyles.card}>
      <View style={orderStyles.header}>
        <View>
          <Text style={orderStyles.orderNumber}>{order.orderNumber}</Text>
          <Text style={orderStyles.vendor}>{order.vendorName}</Text>
        </View>
        <View style={[orderStyles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={orderStyles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={orderStyles.items}>
        {order.items.map((item) => (
          <View key={item.id} style={orderStyles.itemRow}>
            <Text style={orderStyles.itemName}>{item.itemName}</Text>
            <Text style={orderStyles.itemQty}>x{item.quantity}</Text>
            <Text style={orderStyles.itemCost}>${item.totalCost.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={orderStyles.footer}>
        <Text style={orderStyles.total}>Total: ${order.total.toFixed(2)}</Text>
        {order.isAutoGenerated && (
          <Text style={orderStyles.autoGenerated}>🤖 Auto-Generated</Text>
        )}
      </View>

      <View style={orderStyles.actions}>
        {order.status === 'pending_approval' && (
          <TouchableOpacity style={orderStyles.approveButton} onPress={onApprove}>
            <Text style={orderStyles.approveText}>✓ Approve</Text>
          </TouchableOpacity>
        )}
        {order.status === 'shipped' && (
          <TouchableOpacity style={orderStyles.receiveButton} onPress={onReceive}>
            <Text style={orderStyles.receiveText}>📦 Mark Received</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Helper Functions
function getCategoryIcon(category: ItemCategory): string {
  const icons: Record<ItemCategory, string> = {
    medications: '💊',
    supplies: '🩹',
    equipment: '🔧',
    ppe: '🧤',
    surgical: '🔪',
    lab: '🧪',
    nutrition: '🥤',
  };
  return icons[category] || '📦';
}

function getStockStatusLocal(item: InventoryItem): StockStatus {
  if (item.currentQuantity <= 0) return 'out_of_stock';
  if (item.currentQuantity <= item.minQuantity) return 'critical';
  if (item.currentQuantity <= item.reorderPoint) return 'low_stock';
  if (item.currentQuantity >= item.maxQuantity) return 'overstocked';
  return 'in_stock';
}

function getStatusColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    in_stock: '#10B981',
    low_stock: '#F59E0B',
    critical: '#EF4444',
    out_of_stock: '#DC2626',
    overstocked: '#6366F1',
  };
  return colors[status];
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: '#DC2626',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };
  return colors[priority] || '#6B7280';
}

function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: '#6B7280',
    pending_approval: '#F59E0B',
    approved: '#3B82F6',
    submitted: '#8B5CF6',
    confirmed: '#6366F1',
    shipped: '#10B981',
    received: '#059669',
    cancelled: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

// Styles
const styles = StyleSheet.create({
  header: { padding: 20, backgroundColor: '#059669' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#A7F3D0', marginTop: 4 },
  viewTabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  viewTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeViewTab: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  viewTabText: { fontSize: 12, color: '#6B7280' },
  activeViewTabText: { color: '#059669', fontWeight: '600' },
  content: { flex: 1, backgroundColor: '#F3F4F6' },
  dashboardContainer: { padding: 12, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alertSummary: { flexDirection: 'row', justifyContent: 'space-around' },
  alertSummaryItem: { alignItems: 'center' },
  alertCount: { fontSize: 28, fontWeight: 'bold' },
  alertLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  orderSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCount: { fontSize: 18, fontWeight: '600', color: '#111827' },
  orderValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryItem: { width: '30%', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },
  categoryIcon: { fontSize: 24 },
  categoryCount: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  categoryLabel: { fontSize: 10, color: '#6B7280', textTransform: 'capitalize' },
  inventoryContainer: { padding: 12 },
  categoryFilter: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterChipText: { fontSize: 12, color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  alertsContainer: { padding: 12, gap: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ordersContainer: { padding: 12, gap: 12 },
});

const badgeStyles = StyleSheet.create({
  container: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  count: { fontSize: 24, fontWeight: 'bold' },
  label: { fontSize: 10, color: '#6B7280', marginTop: 4 },
});

const itemStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sku: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 10, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressText: { fontSize: 12, color: '#6B7280' },
  reorderButton: { marginTop: 12, backgroundColor: '#059669', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  reorderButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

const alertStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  time: { fontSize: 12, color: '#6B7280' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  category: { fontSize: 12, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailText: { fontSize: 12, color: '#6B7280' },
  detailValue: { fontWeight: '600', color: '#111827' },
  suggestion: { fontSize: 13, color: '#374151', marginTop: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  acknowledgeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  acknowledgeText: { color: '#6B7280', fontWeight: '500' },
  createPOButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#059669', alignItems: 'center' },
  createPOText: { color: '#FFFFFF', fontWeight: '600' },
});

const orderStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#111827' },
  vendor: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  items: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 13, color: '#374151' },
  itemQty: { fontSize: 13, color: '#6B7280', marginHorizontal: 12 },
  itemCost: { fontSize: 13, fontWeight: '500', color: '#111827' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  autoGenerated: { fontSize: 12, color: '#6B7280' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  approveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center' },
  approveText: { color: '#FFFFFF', fontWeight: '600' },
  receiveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#059669', alignItems: 'center' },
  receiveText: { color: '#FFFFFF', fontWeight: '600' },
});
