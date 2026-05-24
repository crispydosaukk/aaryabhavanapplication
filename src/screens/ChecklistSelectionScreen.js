import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import appTheme from '../abTheme';

const ChecklistSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params || { type: 'kitchen' }; // 'kitchen' or 'restaurant'

  const kitchenChecklists = [
    { id: 'kitchen-opening', title: 'Daily Kitchen Opening Checklist', icon: 'wb-sunny' },
    { id: 'kitchen-closing', title: 'Daily Kitchen Closing Checklist', icon: 'nights-stay' },
    { id: 'kitchen-cleaning', title: 'Daily Kitchen Cleaning Checklist', icon: 'cleaning-services' },
  ];

  const restaurantChecklists = [
    { id: 'restaurant-opening', title: 'Daily Restaurant Opening Checklist', icon: 'wb-sunny' },
    { id: 'restaurant-closing', title: 'Daily Restaurant Closing Checklist', icon: 'nights-stay' },
    { id: 'eho-compliance', title: 'Daily Kitchen EHO Compliance Checklist', icon: 'assignment-turned-in' },
  ];

  const checklists = type === 'kitchen' ? kitchenChecklists : restaurantChecklists;
  const title = type === 'kitchen' ? 'Kitchen Checklists' : 'Restaurant Checklists';

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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select a checklist to proceed</Text>
        {checklists.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ChecklistFormScreen', { checklistId: item.id, title: item.title })}
          >
            <LinearGradient
              colors={['#ffffff', '#fdfdfd']}
              style={styles.card}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name={item.icon} size={32} color={appTheme.colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={appTheme.colors.dark + '80'} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: appTheme.colors.dark,
    marginBottom: 20,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: appTheme.borderRadius.lg,
    marginBottom: 16,
    ...appTheme.shadows.small,
    borderWidth: 1,
    borderColor: appTheme.colors.pastelGreen,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: appTheme.colors.pastelPeach,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
  },
});

export default ChecklistSelectionScreen;
