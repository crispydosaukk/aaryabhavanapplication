// components/LoadingSpinner.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet , Text, TouchableOpacity } from 'react-native';


const LoadingSpinner = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={appTheme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.white,
  },
});

export default LoadingSpinner;

// components/EmptyState.js
import { Trash2, Plus } from 'lucide-react-native';
import appTheme from '../abTheme';

const EmptyState = ({ 
  icon = 'trash-2', 
  title, 
  subtitle, 
  actionText, 
  onActionPress 
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'trash-2':
        return <Trash2 size={64} color={appTheme.colors.primary} />;
      default:
        return <Trash2 size={64} color={appTheme.colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionText && onActionPress && (
        <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
          <Plus size={20} color={appTheme.colors.white} />
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: appTheme.spacing.xl,
  },
  iconContainer: {
    backgroundColor: appTheme.colors.pastelGreen,
    padding: appTheme.spacing.lg,
    borderRadius: 50,
    marginBottom: appTheme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
    textAlign: 'center',
    marginBottom: appTheme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: appTheme.spacing.lg,
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
    borderRadius: appTheme.borderRadius.lg,
  },
  actionText: {
    color: appTheme.colors.white,
    fontWeight: '600',
    marginLeft: appTheme.spacing.xs,
  },
});

// Merge styles for EmptyState
EmptyState.defaultProps = {
  style: emptyStyles,
};

export { LoadingSpinner, EmptyState };

// components/index.js - Export all components
// export { default as WasteItemCard } from './WasteItemCard';
// export { default as AddWasteModal } from './AddWasteModal';
// export { default as SearchableDropdown } from './SearchableDropdown';