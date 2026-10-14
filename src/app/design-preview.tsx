import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { HeaderBrand } from '@/components/header-brand';
import { Ledger, LedgerSnapshot, RecordRow } from '@/db/ledger';
import { LedgerProvider } from '@/features/ledger/provider';
import { demoData, demoHistory, demoBudgets, demoGoals, demoTemplates } from '@/db/demo';
import HomeScreen from '@/features/ledger/home-screen';
import ReportsScreen from '@/features/reports/reports-screen';
import { localDay } from '@/features/ledger/model';
import { BottomBar, BottomBarProps } from '@/features/navigation/bottom-bar';
import { usePreferences } from '@/features/preferences/provider';
import { Icon } from 'react-native-paper';
const day = localDay(), demo = demoData(day), goals = demoGoals(day);
const data: LedgerSnapshot = {
  accounts: [{ id: 'default-cash', name: 'Cash', kind: 'cash', currency: 'TRY' }, ...demo.accounts],
  categories: [{ id: 'default-general', name: 'general', kind: 'expense' }, { id: 'default-food', name: 'food', kind: 'expense' }, { id: 'default-transport', name: 'transport', kind: 'expense' }, { id: 'default-bills', name: 'bills', kind: 'expense' }, { id: 'default-salary', name: 'salary', kind: 'income' }],
  records: [...demo.records, ...demoHistory(day).records].map(input => ({ id: input.id, kind: input.kind, account_id: input.accountId, currency: input.amount.currency, minor: input.amount.minor, category_id: 'categoryId' in input ? input.categoryId : null, target_id: input.kind === 'transfer' ? input.targetId : null, target_minor: input.kind === 'transfer' ? input.targetAmount.minor : null, target_currency: input.kind === 'transfer' ? input.targetAmount.currency : null, occurred_on: input.occurredOn, created_at: day, note: input.note, source: input.source, voided: 0 } as RecordRow)).sort((a,b) => b.occurred_on.localeCompare(a.occurred_on) || a.id.localeCompare(b.id)),
  budgets: demoBudgets(day).budgets, goals: goals.goals, contributions: goals.contributions.map(item => ({ id: item.id, goal_id: item.goalId, minor: item.amount.minor, occurred_on: item.day, created_at: day, voided: 0 })), templates: demoTemplates().templates,
};
const open = async () => ({ bootstrap: async () => {}, close: async () => {}, snapshot: async () => data }) as unknown as Ledger;
export default function Preview() {
  const params = useLocalSearchParams<{ page?: string }>(); const { t } = usePreferences();
  const routes = ['index', 'transactions', 'reports', 'assistant'].map(name => ({name,key:name}));
  const titles = [t.home,t.transactions,t.reports,t.assistant], icons = ['home-variant','swap-vertical','chart-bar','message-outline'];
  const props = { state: {routes,index:params.page === 'reports' ? 2 : 0}, insets: {bottom:8,top:0,left:0,right:0}, descriptors: Object.fromEntries(routes.map((route,index) => [route.key,{options:{title:titles[index],tabBarIcon:({color}:{color:string}) => <Icon source={icons[index]} size={22} color={color} />}}])), navigation:{emit:()=>({defaultPrevented:true}),navigate:()=>{}} } as unknown as BottomBarProps;
  return <View style={{flex:1}}><Stack.Screen options={{headerShown:false}} /><View style={{minHeight:56,justifyContent:'center'}}><HeaderBrand /></View><View style={{flex:1}}><LedgerProvider open={open}>{params.page === 'reports' ? <ReportsScreen /> : <HomeScreen />}</LedgerProvider></View><BottomBar {...props} /></View>;
}
