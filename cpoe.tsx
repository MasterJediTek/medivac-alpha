/**
 * Computerized Physician Order Entry (CPOE) Screen
 * MediVac One v3.4 - Disco-themed order management with clinical decision support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  cpoeService,
  Order,
  OrderSet,
  OrderMetrics,
  DrugDatabase,
  ClinicalAlert,
  OrderType,
  OrderPriority,
  MedicationOrder,
} from '@/lib/services/cpoe-service';

const { width } = Dimensions.get('window');

// Disco neon colors
const DISCO_COLORS = {
  neonPink: '#FF10F0',
  neonCyan: '#00FFFF',
  neonPurple: '#BF00FF',
  neonGreen: '#39FF14',
  neonYellow: '#FFFF00',
  neonOrange: '#FF6600',
  neonRed: '#FF0040',
  neonBlue: '#00BFFF',
  darkBg: '#0D0221',
  cardBg: 'rgba(20, 10, 40, 0.8)',
};

type TabType = 'orders' | 'new_order' | 'order_sets' | 'alerts' | 'metrics';

export default function CPOEScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSets, setOrderSets] = useState<OrderSet[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [drugDatabase, setDrugDatabase] = useState<DrugDatabase[]>([]);
  const [alertOrders, setAlertOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<{ order: Order; alert: ClinicalAlert } | null>(null);
  const [drugSearch, setDrugSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DrugDatabase[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [alertPulse] = useState(new Animated.Value(1));

  useEffect(() => {
    initializeService();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulse, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(alertPulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeService = async () => {
    await cpoeService.initialize();
    
    const existingOrders = cpoeService.getOrders();
    if (existingOrders.length === 0) {
      await cpoeService.generateDemoData();
    }
    
    loadData();
  };

  const loadData = () => {
    setOrders(cpoeService.getOrders());
    setOrderSets(cpoeService.getOrderSets());
    setMetrics(cpoeService.calculateMetrics());
    setDrugDatabase(cpoeService.getDrugDatabase());
    setAlertOrders(cpoeService.getOrdersWithAlerts());
  };

  const handleDrugSearch = (query: string) => {
    setDrugSearch(query);
    if (query.length >= 2) {
      setSearchResults(cpoeService.searchDrugs(query));
    } else {
      setSearchResults([]);
    }
  };

  const getOrderTypeColor = (type: OrderType) => {
    switch (type) {
      case 'medication': return DISCO_COLORS.neonPink;
      case 'laboratory': return DISCO_COLORS.neonCyan;
      case 'imaging': return DISCO_COLORS.neonPurple;
      case 'procedure': return DISCO_COLORS.neonOrange;
      case 'consult': return DISCO_COLORS.neonBlue;
      case 'iv_fluid': return DISCO_COLORS.neonGreen;
      default: return '#888';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return DISCO_COLORS.neonGreen;
      case 'verified': return DISCO_COLORS.neonCyan;
      case 'pending_verification': return DISCO_COLORS.neonYellow;
      case 'completed': return '#888';
      case 'discontinued': return DISCO_COLORS.neonRed;
      case 'cancelled': return '#666';
      default: return '#888';
    }
  };

  const getPriorityColor = (priority: OrderPriority) => {
    switch (priority) {
      case 'stat': return DISCO_COLORS.neonRed;
      case 'urgent': return DISCO_COLORS.neonOrange;
      case 'asap': return DISCO_COLORS.neonYellow;
      case 'routine': return DISCO_COLORS.neonGreen;
      default: return '#888';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return '#FF0000';
      case 'critical': return DISCO_COLORS.neonRed;
      case 'warning': return DISCO_COLORS.neonOrange;
      case 'info': return DISCO_COLORS.neonCyan;
      default: return '#888';
    }
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 6 }}>
      {(['orders', 'new_order', 'order_sets', 'alerts', 'metrics'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderRadius: 10,
            backgroundColor: activeTab === tab ? DISCO_COLORS.neonPurple : DISCO_COLORS.cardBg,
            borderWidth: 1,
            borderColor: activeTab === tab ? DISCO_COLORS.neonPurple : DISCO_COLORS.neonPink,
            shadowColor: activeTab === tab ? DISCO_COLORS.neonPurple : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
          }}
        >
          <Text style={{
            color: '#FFF',
            fontSize: 9,
            fontWeight: '700',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {tab.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrders = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        📋 ACTIVE ORDERS ({orders.filter(o => o.status === 'active' || o.status === 'verified').length})
      </Text>

      {/* Pending Verification */}
      {orders.filter(o => o.status === 'pending_verification').length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
            ⏳ Pending Verification ({orders.filter(o => o.status === 'pending_verification').length})
          </Text>
          {orders.filter(o => o.status === 'pending_verification').map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => {
                setSelectedOrder(order);
                setShowOrderModal(true);
              }}
              style={{
                backgroundColor: DISCO_COLORS.cardBg,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 2,
                borderColor: DISCO_COLORS.neonYellow,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                  {order.orderType === 'medication' 
                    ? (order.orderDetails as MedicationOrder).drugName 
                    : order.orderType.toUpperCase()}
                </Text>
                <View style={{
                  backgroundColor: getPriorityColor(order.priority) + '30',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: getPriorityColor(order.priority), fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                    {order.priority}
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#AAA', fontSize: 11 }}>{order.patientName}</Text>
              {order.hasUnacknowledgedAlerts && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 8,
                  backgroundColor: DISCO_COLORS.neonRed + '30',
                  padding: 6,
                  borderRadius: 6,
                }}>
                  <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 11 }}>
                    ⚠️ {order.alerts.filter(a => !a.acknowledged).length} alert(s) require attention
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={async () => {
                  await cpoeService.verifyOrder(order.id, 'Current User');
                  loadData();
                }}
                style={{
                  backgroundColor: DISCO_COLORS.neonGreen + '30',
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: DISCO_COLORS.neonGreen,
                }}
              >
                <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  VERIFY ORDER
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Orders */}
      <Text style={{ color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
        All Orders
      </Text>
      {orders.map((order) => (
        <TouchableOpacity
          key={order.id}
          onPress={() => {
            setSelectedOrder(order);
            setShowOrderModal(true);
          }}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: getOrderTypeColor(order.orderType),
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getOrderTypeColor(order.orderType),
                marginRight: 8,
              }} />
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                {order.orderType === 'medication' 
                  ? (order.orderDetails as MedicationOrder).drugName 
                  : (order.orderDetails as any).testName || (order.orderDetails as any).studyName || order.orderType}
              </Text>
            </View>
            <View style={{
              backgroundColor: getStatusColor(order.status) + '30',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{ color: getStatusColor(order.status), fontSize: 9, textTransform: 'uppercase' }}>
                {order.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#AAA', fontSize: 11 }}>{order.patientName} • {order.orderedBy}</Text>
          {order.orderType === 'medication' && (
            <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 11, marginTop: 4 }}>
              {(order.orderDetails as MedicationOrder).dose} {(order.orderDetails as MedicationOrder).doseUnit} {(order.orderDetails as MedicationOrder).route} {(order.orderDetails as MedicationOrder).frequency}
            </Text>
          )}
          {order.hasUnacknowledgedAlerts && (
            <Animated.View style={{
              transform: [{ scale: alertPulse }],
              marginTop: 4,
            }}>
              <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 10 }}>
                ⚠️ Alerts pending
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderNewOrder = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        💊 NEW MEDICATION ORDER
      </Text>

      {/* Drug Search */}
      <View style={{
        backgroundColor: DISCO_COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: DISCO_COLORS.neonPink,
      }}>
        <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 8 }}>Search Medication</Text>
        <TextInput
          value={drugSearch}
          onChangeText={handleDrugSearch}
          placeholder="Type drug name..."
          placeholderTextColor="#666"
          style={{
            backgroundColor: '#1a0a30',
            borderRadius: 8,
            padding: 12,
            color: '#FFF',
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonPurple,
          }}
        />
        
        {searchResults.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {searchResults.map((drug) => (
              <TouchableOpacity
                key={drug.id}
                style={{
                  backgroundColor: '#1a0a30',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: DISCO_COLORS.neonCyan,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>{drug.name}</Text>
                <Text style={{ color: '#AAA', fontSize: 11 }}>{drug.genericName}</Text>
                <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 10 }}>{drug.drugClass}</Text>
                {drug.controlledSubstance && (
                  <View style={{
                    backgroundColor: DISCO_COLORS.neonOrange + '30',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 9 }}>
                      Schedule {drug.schedule}
                    </Text>
                  </View>
                )}
                {drug.blackBoxWarning && (
                  <View style={{
                    backgroundColor: DISCO_COLORS.neonRed + '20',
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: DISCO_COLORS.neonRed,
                  }}>
                    <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 10, fontWeight: '600' }}>
                      ⚠️ BLACK BOX WARNING
                    </Text>
                    <Text style={{ color: '#FFF', fontSize: 10, marginTop: 2 }}>
                      {drug.blackBoxWarning}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Order Types */}
      <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
        📝 QUICK ORDER TYPES
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {['medication', 'laboratory', 'imaging', 'procedure', 'consult', 'iv_fluid'].map((type) => (
          <TouchableOpacity
            key={type}
            style={{
              backgroundColor: getOrderTypeColor(type as OrderType) + '30',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: getOrderTypeColor(type as OrderType),
            }}
          >
            <Text style={{ color: getOrderTypeColor(type as OrderType), fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Drug Database Preview */}
      <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
        💊 DRUG DATABASE ({drugDatabase.length} medications)
      </Text>
      {drugDatabase.slice(0, 5).map((drug) => (
        <View
          key={drug.id}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#444',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{drug.name}</Text>
            <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 10 }}>{drug.drugClass}</Text>
          </View>
          <Text style={{ color: '#888', fontSize: 11 }}>
            Routes: {drug.routes.join(', ')} | Pregnancy: {drug.pregnancyCategory}
          </Text>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderOrderSets = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        📦 ORDER SETS ({orderSets.length})
      </Text>

      {orderSets.map((orderSet) => (
        <View
          key={orderSet.id}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonGreen,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>{orderSet.name}</Text>
            <View style={{
              backgroundColor: DISCO_COLORS.neonPurple + '30',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 10 }}>{orderSet.category}</Text>
            </View>
          </View>
          <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 8 }}>{orderSet.description}</Text>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 11, marginBottom: 8 }}>
            Contains {orderSet.orders.length} orders
          </Text>
          
          {/* Order Preview */}
          <View style={{ marginBottom: 12 }}>
            {orderSet.orders.slice(0, 3).map((order, i) => (
              <View key={i} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
              }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: getOrderTypeColor(order.orderType),
                  marginRight: 8,
                }} />
                <Text style={{ color: '#FFF', fontSize: 11 }}>
                  {order.orderType === 'medication' 
                    ? (order.orderDetails as any).drugName
                    : (order.orderDetails as any).testName || (order.orderDetails as any).studyName || order.orderType}
                </Text>
              </View>
            ))}
            {orderSet.orders.length > 3 && (
              <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                +{orderSet.orders.length - 3} more orders
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: DISCO_COLORS.neonGreen + '30',
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: DISCO_COLORS.neonGreen,
            }}
          >
            <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              APPLY ORDER SET
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAlerts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        ⚠️ CLINICAL ALERTS ({alertOrders.length} orders with alerts)
      </Text>

      {alertOrders.length === 0 ? (
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonGreen,
        }}>
          <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>No Pending Alerts</Text>
          <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4 }}>All clinical alerts have been addressed</Text>
        </View>
      ) : (
        alertOrders.map((order) => (
          <View
            key={order.id}
            style={{
              backgroundColor: DISCO_COLORS.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: DISCO_COLORS.neonRed,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>
                {order.orderType === 'medication' 
                  ? (order.orderDetails as MedicationOrder).drugName 
                  : order.orderType}
              </Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>{order.patientName}</Text>
            </View>

            {order.alerts.filter(a => !a.acknowledged).map((alert) => (
              <TouchableOpacity
                key={alert.id}
                onPress={() => {
                  setSelectedAlert({ order, alert });
                  setShowAlertModal(true);
                }}
                style={{
                  backgroundColor: getAlertSeverityColor(alert.severity) + '20',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: getAlertSeverityColor(alert.severity),
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: getAlertSeverityColor(alert.severity), fontSize: 12, fontWeight: '700' }}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={{
                    backgroundColor: getAlertSeverityColor(alert.severity) + '30',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: getAlertSeverityColor(alert.severity), fontSize: 9, textTransform: 'uppercase' }}>
                      {alert.severity}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                  {alert.title}
                </Text>
                <Text style={{ color: '#AAA', fontSize: 11 }}>{alert.description}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {alert.overridable && (
                    <TouchableOpacity
                      onPress={async () => {
                        await cpoeService.overrideAlert(order.id, alert.id, 'Current User', 'Clinical judgment');
                        loadData();
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: DISCO_COLORS.neonOrange + '30',
                        paddingVertical: 8,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: DISCO_COLORS.neonOrange,
                      }}
                    >
                      <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                        OVERRIDE
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={async () => {
                      await cpoeService.acknowledgeAlert(order.id, alert.id, 'Current User');
                      loadData();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: DISCO_COLORS.neonGreen + '30',
                      paddingVertical: 8,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: DISCO_COLORS.neonGreen,
                    }}
                  >
                    <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                      ACKNOWLEDGE
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          📊 CPOE METRICS
        </Text>

        {/* Total Orders */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 2,
            borderColor: DISCO_COLORS.neonPurple,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 4 }}>TOTAL ORDERS</Text>
            <Text style={{
              color: '#FFF',
              fontSize: 48,
              fontWeight: '900',
              textShadowColor: DISCO_COLORS.neonPurple,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}>
              {metrics.totalOrders}
            </Text>
          </View>
        </Animated.View>

        {/* Orders by Type */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPink,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            📋 ORDERS BY TYPE
          </Text>
          {Object.entries(metrics.ordersByType).filter(([_, count]) => count > 0).map(([type, count]) => (
            <View key={type} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: getOrderTypeColor(type as OrderType),
                  marginRight: 8,
                }} />
                <Text style={{ color: '#FFF', fontSize: 13, textTransform: 'capitalize' }}>
                  {type.replace('_', ' ')}
                </Text>
              </View>
              <Text style={{ color: getOrderTypeColor(type as OrderType), fontSize: 14, fontWeight: '700' }}>
                {count}
              </Text>
            </View>
          ))}
        </View>

        {/* Alert Statistics */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonRed,
        }}>
          <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            ⚠️ CLINICAL DECISION SUPPORT
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.alertsGenerated}</Text>
              <Text style={{ color: '#AAA', fontSize: 10 }}>Alerts Generated</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 28, fontWeight: '800' }}>{metrics.alertsOverridden}</Text>
              <Text style={{ color: '#AAA', fontSize: 10 }}>Overridden</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 28, fontWeight: '800' }}>{metrics.overrideRate}%</Text>
              <Text style={{ color: '#AAA', fontSize: 10 }}>Override Rate</Text>
            </View>
          </View>
          
          <Text style={{ color: '#AAA', fontSize: 11, marginTop: 8 }}>Alerts by Severity:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {Object.entries(metrics.alertsBySeverity).map(([severity, count]) => (
              <View key={severity} style={{
                backgroundColor: getAlertSeverityColor(severity) + '30',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
                <Text style={{ color: getAlertSeverityColor(severity), fontSize: 10, textTransform: 'uppercase' }}>
                  {severity}: {count}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Sets & Verbal Orders */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonGreen,
          }}>
            <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 10, fontWeight: '600' }}>📦 ORDER SETS USED</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.orderSetsUsed}</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonYellow,
          }}>
            <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 10, fontWeight: '600' }}>🎤 VERBAL ORDERS</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.verbalOrders}</Text>
          </View>
        </View>

        {/* Duplicates Prevented */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 100,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonCyan,
        }}>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            🛡️ SAFETY METRICS
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 24, fontWeight: '800' }}>
                {metrics.duplicateOrdersPrevented}
              </Text>
              <Text style={{ color: '#AAA', fontSize: 10 }}>Duplicates Prevented</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 24, fontWeight: '800' }}>
                {metrics.averageVerificationTime}m
              </Text>
              <Text style={{ color: '#AAA', fontSize: 10 }}>Avg Verification Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderOrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: DISCO_COLORS.darkBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            borderWidth: 2,
            borderColor: getOrderTypeColor(selectedOrder.orderType),
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: DISCO_COLORS.neonPurple,
            }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Patient</Text>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>{selectedOrder.patientName}</Text>
                <Text style={{ color: '#AAA', fontSize: 12 }}>MRN: {selectedOrder.mrn}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Order Type</Text>
                  <Text style={{ color: getOrderTypeColor(selectedOrder.orderType), fontSize: 14, fontWeight: '700', textTransform: 'uppercase' }}>
                    {selectedOrder.orderType.replace('_', ' ')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Status</Text>
                  <Text style={{ color: getStatusColor(selectedOrder.status), fontSize: 14, fontWeight: '700', textTransform: 'capitalize' }}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {selectedOrder.orderType === 'medication' && (
                <View style={{
                  backgroundColor: DISCO_COLORS.cardBg,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
                    Medication Details
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                    {(selectedOrder.orderDetails as MedicationOrder).drugName}
                  </Text>
                  <Text style={{ color: '#AAA', fontSize: 12 }}>
                    {(selectedOrder.orderDetails as MedicationOrder).genericName}
                  </Text>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, marginTop: 8 }}>
                    {(selectedOrder.orderDetails as MedicationOrder).dose} {(selectedOrder.orderDetails as MedicationOrder).doseUnit} {(selectedOrder.orderDetails as MedicationOrder).route} {(selectedOrder.orderDetails as MedicationOrder).frequency}
                  </Text>
                </View>
              )}

              {selectedOrder.alerts.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
                    Clinical Alerts ({selectedOrder.alerts.length})
                  </Text>
                  {selectedOrder.alerts.map((alert) => (
                    <View key={alert.id} style={{
                      backgroundColor: getAlertSeverityColor(alert.severity) + '20',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: getAlertSeverityColor(alert.severity),
                    }}>
                      <Text style={{ color: getAlertSeverityColor(alert.severity), fontSize: 12, fontWeight: '600' }}>
                        {alert.title}
                      </Text>
                      <Text style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{alert.description}</Text>
                      {alert.acknowledged && (
                        <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 10, marginTop: 4 }}>
                          ✓ Acknowledged by {alert.acknowledgedBy}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Ordered By</Text>
                <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedOrder.orderedBy}</Text>
                <Text style={{ color: '#888', fontSize: 11 }}>
                  {new Date(selectedOrder.orderedAt).toLocaleString()}
                </Text>
              </View>

              {selectedOrder.isVerbalOrder && (
                <View style={{
                  backgroundColor: DISCO_COLORS.neonYellow + '20',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}>
                  <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 12, fontWeight: '600' }}>
                    🎤 VERBAL ORDER
                  </Text>
                  {selectedOrder.verbalOrderAuthenticatedBy && (
                    <Text style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>
                      Authenticated by {selectedOrder.verbalOrderAuthenticatedBy}
                    </Text>
                  )}
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: 16, backgroundColor: DISCO_COLORS.darkBg }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#FFF',
            fontSize: 26,
            fontWeight: '900',
            textShadowColor: DISCO_COLORS.neonPurple,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
          }}>
            CPOE
          </Text>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14 }}>
            Computerized Physician Order Entry
          </Text>
        </View>

        {renderTabs()}

        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'new_order' && renderNewOrder()}
        {activeTab === 'order_sets' && renderOrderSets()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'metrics' && renderMetrics()}

        {renderOrderModal()}
      </View>
    </ScreenContainer>
  );
}
