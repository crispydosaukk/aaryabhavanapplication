// components/WasteItemCard.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Calendar, Package, PoundSterling, AlertTriangle } from 'lucide-react-native';
import appTheme from '../abTheme';


const WasteItemCard = ({ item, onPress }) => {
    const safeParseFloat = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };
    const formatCurrency = (value) => {
        const num = safeParseFloat(value);
        return num.toFixed(2);
    };

    const formatQuantity = (value) => {
        const num = safeParseFloat(value);
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };
    const formatDate = (dateInput) => {
        try {
          // Handle Firestore Timestamp object
          if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
            const date = dateInput.toDate();
            return formatDateOutput(date);
          }
          
          // Handle Firestore timestamp format {_seconds, _nanoseconds}
          if (dateInput && typeof dateInput === 'object' && '_seconds' in dateInput) {
            const date = new Date(dateInput._seconds * 1000);
            return formatDateOutput(date);
          }
          
          // Handle ISO string format
          if (typeof dateInput === 'string') {
            // Check if it's already a valid date string
            const date = new Date(dateInput);
            if (!isNaN(date.getTime())) {
              return formatDateOutput(date);
            }
          }
          
          // Fallback for invalid dates
          return 'Unknown date';
        } catch (error) {
          console.error('Error formatting date:', error);
          return 'Invalid date';
        }
      };
      
      const formatDateOutput = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
      
        if (date.toDateString() === today.toDateString()) {
          return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
          return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          return date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      };

    const getReasonColor = (reason) => {
        switch (reason) {
            case 'Overproduction':
                return appTheme.colors.secondary;
            case 'Quality Issues':
                return appTheme.colors.accent;
            case 'Expiration':
                return '#ff9800';
            case 'Customer Cancellation':
                return '#9c27b0';
            case 'Storage Issues':
                return '#607d8b';
            case 'Preparation Error':
                return '#795548';
            default:
                return appTheme.colors.primary;
        }
    };
    console.log(item, "ITEM ITESSS")
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <View style={styles.quantityContainer}>
                        <Package size={14} color={appTheme.colors.primary} />
                        <Text style={styles.quantity}>
                            {formatQuantity(item.wastedQuantity)} {item.unit || 'pcs'}
                        </Text>
                    </View>
                </View>

                {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                )}
            </View>

            <View style={styles.cardBody}>
                <View style={styles.reasonContainer}>
                    <AlertTriangle size={16} color={getReasonColor(item.reason)} />
                    <Text style={[styles.reason, { color: getReasonColor(item.reason) }]}>
                        {item.reason}
                    </Text>
                </View>

                {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Calendar size={14} color={appTheme.colors.primary} />
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>

                {/* <View style={styles.valueContainer}>
          <DollarSign size={14} color={appTheme.colors.accent} />
          <Text style={styles.value}>₹{item.estimatedValue?.toFixed(2) || '0.00'}</Text>
        </View> */}
                <View style={styles.valueContainer}>
                    <PoundSterling size={14} color={appTheme.colors.accent} />
                    <Text style={styles.value}>{formatCurrency(item.estimatedValue)}</Text>
                </View>
            </View>

            {item.itemType && (
                <View style={styles.typeIndicator}>
                    <Text style={styles.typeText}>
                        {item.itemType === 'inventory' ? 'INV' :
                            item.itemType === 'ingredient' ? 'ING' : 'CUSTOM'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: appTheme.colors.white,
        borderRadius: appTheme.borderRadius.md,
        marginHorizontal: appTheme.spacing.md,
        marginVertical: appTheme.spacing.xs,
        padding: appTheme.spacing.md,
        ...appTheme.shadows.medium,
        borderLeftWidth: 4,
        borderLeftColor: appTheme.colors.primary,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: appTheme.spacing.sm,
    },
    itemInfo: {
        flex: 1,
        marginRight: appTheme.spacing.sm,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: appTheme.colors.dark,
        marginBottom: appTheme.spacing.xs,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantity: {
        fontSize: 14,
        color: appTheme.colors.primary,
        fontWeight: '600',
        marginLeft: appTheme.spacing.xs,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: appTheme.borderRadius.md,
        backgroundColor: appTheme.colors.pastelGreen,
    },
    cardBody: {
        marginBottom: appTheme.spacing.sm,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: appTheme.spacing.xs,
    },
    reason: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: appTheme.spacing.xs,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: appTheme.colors.primary,
        marginLeft: appTheme.spacing.xs,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: appTheme.colors.accent,
        marginLeft: appTheme.spacing.xs,
    },
    typeIndicator: {
        position: 'absolute',
        top: appTheme.spacing.xs,
        right: appTheme.spacing.xs,
        backgroundColor: appTheme.colors.pastelGreen,
        paddingHorizontal: appTheme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: appTheme.colors.primary,
    },
});

export default WasteItemCard;