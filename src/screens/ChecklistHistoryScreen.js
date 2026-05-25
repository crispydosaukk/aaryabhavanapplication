import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import appTheme from '../abTheme';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import moment from 'moment';

const ChecklistHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.user);
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!user?.email) return;

        const unsubscribe = firestore()
          .collection('checklist_reports')
          .where('submittedByEmail', '==', user.email)
          .orderBy('updatedAt', 'desc')
          .onSnapshot(
            snapshot => {
              if (snapshot) {
                const fetchedReports = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setReports(fetchedReports);
              }
              setLoading(false);
            },
            error => {
              // Fallback to submittedAt if updatedAt indexing isn't ready
              firestore()
                .collection('checklist_reports')
                .where('submittedByEmail', '==', user.email)
                .orderBy('submittedAt', 'desc')
                .onSnapshot(snap2 => {
                  if (snap2) {
                    const fetchedReports2 = snap2.docs.map(doc => ({
                      id: doc.id,
                      ...doc.data(),
                    }));
                    setReports(fetchedReports2);
                  }
                  setLoading(false);
                }, err2 => {
                    console.error('Failed to fetch checklist history', err2);
                    setLoading(false);
                });
            }
          );
          
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching history:', error);
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [user]);

  const Header = () => (
    <LinearGradient
      colors={[appTheme.colors.primary, appTheme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checklist History</Text>
        <View style={{ width: 24 }} />
      </View>
    </LinearGradient>
  );

  const renderReportCard = ({ item }) => {
    const timestamp = item.updatedAt || item.submittedAt;
    const dateStr = timestamp ? moment(timestamp.toDate()).format('MMM DD, YYYY - hh:mm A') : 'Unknown Date';

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.checklistTitle || 'Untitled Checklist'}</Text>
          <View style={styles.dateRow}>
            <MaterialIcons name="event-available" size={14} color={appTheme.colors.dark + '80'} />
            <Text style={styles.reportDate}>{dateStr}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('ChecklistFormScreen', { 
            checklistId: item.checklistId, 
            title: item.checklistTitle, 
            reportId: item.id 
          })}
        >
          <MaterialIcons name="edit" size={20} color={appTheme.colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color={appTheme.colors.dark + '30'} />
          <Text style={styles.emptyText}>No submitted checklists found.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderReportCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: appTheme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...appTheme.shadows.small,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 13,
    color: appTheme.colors.dark + '80',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.pastelPeach,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: appTheme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: appTheme.colors.dark + '80',
  },
});

export default ChecklistHistoryScreen;
