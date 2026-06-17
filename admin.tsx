import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Admin Tasks from FileMaker
const ADMIN_TASKS = [
  { id: 'stud-data', name: 'Stud.Data', icon: '📊', color: '#4A90D9' },
  { id: 'expenses', name: 'Expenses', icon: '💰', color: '#E74C3C' },
  { id: 'letters', name: 'Letters', icon: '✉️', color: '#9B59B6' },
  { id: 'sms', name: 'SMS', icon: '📱', color: '#27AE60' },
];

// Finance Tools
const FINANCE_TOOLS = [
  { id: 'invoices', name: 'Invoices', icon: '📄', color: '#4A90D9' },
  { id: 'payments', name: 'Payments', icon: '💳', color: '#27AE60' },
  { id: 'gap-quotes', name: 'Gap Quotes', icon: '📋', color: '#F39C12' },
  { id: 'billing', name: 'Billing', icon: '🧾', color: '#E74C3C' },
  { id: 'reports', name: 'Reports', icon: '📈', color: '#9B59B6' },
  { id: 'budget', name: 'Budget', icon: '💵', color: '#1ABC9C' },
];

// Direct Message Tabs from FileMaker
const MESSAGE_TABS = ['Enterprise', 'Branch', 'Direct_Message', 'Download'];

// Sample Invoices
const SAMPLE_INVOICES = [
  { id: 'INV-2026-001', patient: 'John Smith', amount: 450.00, status: 'paid', date: '2026-01-28' },
  { id: 'INV-2026-002', patient: 'Sarah Johnson', amount: 1250.00, status: 'pending', date: '2026-01-30' },
  { id: 'INV-2026-003', patient: 'Michael Brown', amount: 780.00, status: 'overdue', date: '2026-01-15' },
  { id: 'INV-2026-004', patient: 'Emily Davis', amount: 320.00, status: 'paid', date: '2026-01-25' },
];

// Sample Expenses
const SAMPLE_EXPENSES = [
  { id: 1, category: 'Medical Supplies', amount: 12500.00, date: '2026-01-30', status: 'approved' },
  { id: 2, category: 'Equipment Maintenance', amount: 3200.00, date: '2026-01-28', status: 'pending' },
  { id: 3, category: 'Staff Training', amount: 5600.00, date: '2026-01-25', status: 'approved' },
  { id: 4, category: 'IT Infrastructure', amount: 8900.00, date: '2026-01-20', status: 'approved' },
];

// Financial Summary
const FINANCIAL_SUMMARY = {
  totalRevenue: 245680.00,
  totalExpenses: 189450.00,
  pendingInvoices: 34560.00,
  overdueAmount: 12340.00,
};

type ViewMode = 'overview' | 'invoices' | 'expenses' | 'reports' | 'messages' | 'letters';

export default function AdminScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [activeTab, setActiveTab] = useState('Enterprise');
  const [searchQuery, setSearchQuery] = useState('');

  const renderOverview = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Administration</Text>
      <Text className="text-muted mb-6">Admin tasks, finance tools, and reporting dashboard.</Text>

      {/* Financial Summary */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">Financial Summary</Text>
        <View className="flex-row flex-wrap gap-3">
          <View className="bg-green-100 p-3 rounded-xl" style={{ width: '47%' }}>
            <Text className="text-green-700 text-sm">Total Revenue</Text>
            <Text className="text-green-700 text-xl font-bold">${FINANCIAL_SUMMARY.totalRevenue.toLocaleString()}</Text>
          </View>
          <View className="bg-red-100 p-3 rounded-xl" style={{ width: '47%' }}>
            <Text className="text-red-700 text-sm">Total Expenses</Text>
            <Text className="text-red-700 text-xl font-bold">${FINANCIAL_SUMMARY.totalExpenses.toLocaleString()}</Text>
          </View>
          <View className="bg-yellow-100 p-3 rounded-xl" style={{ width: '47%' }}>
            <Text className="text-yellow-700 text-sm">Pending Invoices</Text>
            <Text className="text-yellow-700 text-xl font-bold">${FINANCIAL_SUMMARY.pendingInvoices.toLocaleString()}</Text>
          </View>
          <View className="bg-orange-100 p-3 rounded-xl" style={{ width: '47%' }}>
            <Text className="text-orange-700 text-sm">Overdue Amount</Text>
            <Text className="text-orange-700 text-xl font-bold">${FINANCIAL_SUMMARY.overdueAmount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Admin Tasks Grid */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">Admin Tasks</Text>
        <View className="flex-row gap-3">
          {ADMIN_TASKS.map(task => (
            <TouchableOpacity
              key={task.id}
              className="items-center"
              style={{ width: '22%' }}
              onPress={() => {
                if (task.id === 'expenses') setViewMode('expenses');
                else if (task.id === 'letters') setViewMode('letters');
              }}
            >
              <View 
                style={{ backgroundColor: task.color }}
                className="w-14 h-14 rounded-xl items-center justify-center mb-1"
              >
                <Text className="text-2xl">{task.icon}</Text>
              </View>
              <Text className="text-foreground text-xs text-center">{task.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Finance Tools Grid */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">Finance Tools</Text>
          <TouchableOpacity onPress={() => setViewMode('reports')}>
            <Text className="text-primary">View Reports</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {FINANCE_TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.id}
              className="items-center"
              style={{ width: '30%' }}
              onPress={() => {
                if (tool.id === 'invoices') setViewMode('invoices');
                else if (tool.id === 'reports') setViewMode('reports');
              }}
            >
              <View 
                style={{ backgroundColor: tool.color }}
                className="w-14 h-14 rounded-xl items-center justify-center mb-1"
              >
                <Text className="text-2xl">{tool.icon}</Text>
              </View>
              <Text className="text-foreground text-xs text-center">{tool.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Direct Message Panel */}
      <TouchableOpacity 
        className="bg-surface p-4 rounded-xl"
        onPress={() => setViewMode('messages')}
      >
        <Text className="text-lg font-bold text-foreground mb-2">Direct Message</Text>
        <View className="flex-row gap-2">
          {MESSAGE_TABS.map(tab => (
            <View key={tab} className="bg-primary/10 px-3 py-1 rounded">
              <Text className="text-primary text-sm">{tab}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderInvoices = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Invoices</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 mb-4">
        <IconSymbol name="house.fill" size={20} color="#9BA1A6" />
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search invoices..."
          placeholderTextColor="#9BA1A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        {['All', 'Paid', 'Pending', 'Overdue'].map(filter => (
          <TouchableOpacity key={filter} className="bg-surface px-4 py-2 rounded-lg">
            <Text className="text-foreground">{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Invoice List */}
      {SAMPLE_INVOICES.map(invoice => (
        <TouchableOpacity key={invoice.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground font-semibold">{invoice.id}</Text>
            <View className={`px-2 py-1 rounded ${
              invoice.status === 'paid' ? 'bg-green-100' :
              invoice.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Text className={`text-xs font-medium ${
                invoice.status === 'paid' ? 'text-green-700' :
                invoice.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
              }`}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text className="text-muted mb-1">{invoice.patient}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-bold">${invoice.amount.toFixed(2)}</Text>
            <Text className="text-muted text-sm">{invoice.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderExpenses = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Expenses</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Expense Summary */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-bold text-foreground mb-2">This Month</Text>
        <Text className="text-3xl font-bold text-foreground">${SAMPLE_EXPENSES.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</Text>
        <Text className="text-muted">Total expenses</Text>
      </View>

      {/* Expense List */}
      {SAMPLE_EXPENSES.map(expense => (
        <TouchableOpacity key={expense.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground font-semibold">{expense.category}</Text>
            <View className={`px-2 py-1 rounded ${
              expense.status === 'approved' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Text className={`text-xs font-medium ${
                expense.status === 'approved' ? 'text-green-700' : 'text-yellow-700'
              }`}>{expense.status.toUpperCase()}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-bold">${expense.amount.toLocaleString()}</Text>
            <Text className="text-muted text-sm">{expense.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReports = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Reports</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">Export</Text>
        </TouchableOpacity>
      </View>

      {/* Report Types */}
      <View className="gap-3">
        {[
          { name: 'Patient Turnover Report', icon: '📊', description: 'Monthly patient statistics' },
          { name: 'Referrals Report', icon: '📈', description: 'Referral sources and trends' },
          { name: 'Financial Summary', icon: '💰', description: 'Revenue and expense overview' },
          { name: 'Staff Performance', icon: '👥', description: 'Staff metrics and KPIs' },
          { name: 'Inventory Report', icon: '📦', description: 'Stock levels and usage' },
          { name: 'Compliance Report', icon: '✅', description: 'SMPO.ink protocol compliance' },
        ].map(report => (
          <TouchableOpacity key={report.name} className="bg-surface p-4 rounded-xl flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
              <Text className="text-2xl">{report.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{report.name}</Text>
              <Text className="text-muted text-sm">{report.description}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMessages = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Direct Message</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Message Tabs */}
      <View className="flex-row gap-2 mb-4">
        {MESSAGE_TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            className={`px-4 py-2 rounded-lg ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
            onPress={() => setActiveTab(tab)}
          >
            <Text className={activeTab === tab ? 'text-white' : 'text-foreground'}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message Compose */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-foreground font-semibold mb-2">Direct_Message For:</Text>
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity className="bg-background border border-border px-3 py-2 rounded-lg">
            <Text className="text-muted">&lt;Table&gt;</Text>
          </TouchableOpacity>
          <Text className="text-foreground self-center">Priority:</Text>
          <TouchableOpacity className="bg-background border border-border px-3 py-2 rounded-lg">
            <Text className="text-red-500">&lt;Table Missing&gt;</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground h-24 mb-4"
          placeholder="&lt;Table Missing&gt;"
          placeholderTextColor="#9BA1A6"
          multiline
          textAlignVertical="top"
        />

        <Text className="text-foreground font-semibold mb-2">Direct_Note_Reply</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground h-24 mb-4"
          placeholder="&lt;Table Missing&gt;"
          placeholderTextColor="#9BA1A6"
          multiline
          textAlignVertical="top"
        />

        <Text className="text-foreground font-semibold mb-2">Add Attachment:</Text>
        <View className="flex-row gap-2">
          {[1, 2, 3, 4].map(i => (
            <TouchableOpacity key={i} className="bg-background border border-dashed border-border p-4 rounded-lg items-center">
              <Text className="text-muted text-xs">&lt;Table Missing&gt;</Text>
              <Text className="text-primary mt-1">📎</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLetters = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Letters</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Letter Templates */}
      <Text className="text-lg font-bold text-foreground mb-3">Templates</Text>
      <View className="gap-3">
        {[
          { name: 'Appointment Confirmation', type: 'Patient' },
          { name: 'Referral Letter', type: 'Medical' },
          { name: 'Discharge Summary', type: 'Medical' },
          { name: 'Invoice Reminder', type: 'Finance' },
          { name: 'Welcome Letter', type: 'Patient' },
          { name: 'Follow-up Instructions', type: 'Medical' },
        ].map(letter => (
          <TouchableOpacity key={letter.name} className="bg-surface p-4 rounded-xl flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-purple-100 items-center justify-center mr-4">
              <Text className="text-2xl">✉️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{letter.name}</Text>
              <Text className="text-muted text-sm">{letter.type}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'invoices' && renderInvoices()}
        {viewMode === 'expenses' && renderExpenses()}
        {viewMode === 'reports' && renderReports()}
        {viewMode === 'messages' && renderMessages()}
        {viewMode === 'letters' && renderLetters()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
