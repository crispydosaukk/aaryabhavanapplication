import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Plus, Calendar, Weight, AlertCircle, PoundSterling } from 'lucide-react-native';
import WasteItemCard from '../components/wasteItemCard';
import AddWasteModal from '../components/addWasteModel';
import LoadingSpinner, { EmptyState } from '../components/supportingComponent';
import appTheme from '../abTheme';
import firestore from '@react-native-firebase/firestore';

const WasteManagementScreen = () => {
  const { user } = useSelector(state => state.user);
  const [wasteItems, setWasteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [totalWasteToday, setTotalWasteToday] = useState(0);
  const [totalWasteValue, setTotalWasteValue] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
  
    const unsubscribe = firestore()
      .collection('wastage')
      .where('userId', '==', user.id)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
  
          setWasteItems(items);
          calculateTodayStats(items);
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          console.error('Error fetching waste items:', error);
          Alert.alert('Error', 'Failed to load waste items');
          setLoading(false);
          setRefreshing(false);
        }
      );
  
    return () => unsubscribe();
  }, [user?.id]);

  const calculateTodayStats = (items) => {
    const today = new Date().toDateString();
    
    const todayItems = items.filter(item => {
      // Handle both Firestore timestamp and string dates
      let itemDate;
      if (item.createdAt && typeof item.createdAt === 'object') {
        // Firestore timestamp format
        if ('toDate' in item.createdAt) {
          itemDate = item.createdAt.toDate();
        } else if ('_seconds' in item.createdAt) {
          itemDate = new Date(item.createdAt._seconds * 1000);
        }
      } else if (typeof item.createdAt === 'string') {
        // String date format
        itemDate = new Date(item.createdAt);
      }
      
      // Fallback to current date if parsing fails
      if (!itemDate || isNaN(itemDate.getTime())) {
        console.warn('Invalid date format for item:', item.id);
        itemDate = new Date();
      }
      
      return itemDate.toDateString() === today;
    });
  
    // Correct reduce functions
    const totalQuantity = todayItems.reduce((sum, item) => {
      const quantity = parseFloat(item.wastedQuantity) || 0;
      return sum + 1;
    }, 0);
  
    const totalValue = todayItems.reduce((sum, item) => {
      const value = parseFloat(item.estimatedValue) || 0;
      return sum + value;
    }, 0);
    
    setTotalWasteToday(totalQuantity);
    setTotalWasteValue(totalValue);
  };

  const onRefresh = () => {
    setRefreshing(true);
  };

  const handleAddWaste = () => {
    setShowAddModal(true);
  };

  const renderWasteItem = ({ item }) => (
    <WasteItemCard item={item} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Weight size={20} color={appTheme.colors.accent} />
          <Text style={styles.statValue}>
            {typeof totalWasteToday === 'number' ? totalWasteToday.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Items Wasted Today</Text>
        </View>
        <View style={styles.statCard}>
          <AlertCircle size={20} color={appTheme.colors.secondary} />
          <Text style={styles.statValue}>
            <PoundSterling size={14} color={'black'} />
            {typeof totalWasteValue === 'number' ? totalWasteValue.toFixed(2) : '0.00'}
          </Text>
          <Text style={styles.statLabel}>Value Lost Today</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Waste Management</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddWaste}>
            <Plus size={24} color={appTheme.colors.white} />
            <Text style={styles.addButtonText}>Add Waste</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={wasteItems}
          renderItem={renderWasteItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="trash-2"
              title="No Waste Items"
              subtitle="Start tracking your food waste by adding items"
              actionText="Add First Item"
              onActionPress={handleAddWaste}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[appTheme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContainer}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEnabled={true}
        />

        <AddWasteModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={user?.id}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
    marginBottom:90
  },
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: appTheme.borderRadius.md,
  },
  addButtonText: {
    color: appTheme.colors.white,
    fontWeight: '600',
    marginLeft: appTheme.spacing.xs,
  },
  flatList: {
    flex: 1,
  },
  header: {
    padding: appTheme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelGreen,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: appTheme.spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
    marginTop: appTheme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: appTheme.colors.dark,
    textAlign: 'center',
    marginTop: appTheme.spacing.xs,
  },
  listContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
});

export default WasteManagementScreen;