import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Platform,
  Alert,
  Linking
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';
import appTheme from '../abTheme';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { 
  check, 
  request, 
  PERMISSIONS, 
  RESULTS, 
  openSettings 
} from 'react-native-permissions';

const OrderHistoryScreen = () => {
  const {user} = useSelector(state => state.user);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('invoices')
      .where('userId', '==', user.id)
      .orderBy('createdAt', 'desc')
      .onSnapshot((ordersSnapshot) => {
        const userOrders = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            formattedDate: formatDate(data.createdAt),
            timestamp: data.updatedAt || data.createdAt,
          };
        });
        setOrders(userOrders);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user.id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else {
      return 'Invalid Date';
    }

    return moment(date).format('MMM D, YYYY');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';

    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else {
      return 'Invalid Time';
    }

    return moment(date).format('h:mm A');
  };

  const checkAndRequestPermissions = async () => {
    if (Platform.OS === 'ios') {
      // iOS doesn't need explicit permission for PDF/Excel files saved to app's documents
      return true;
    } else {
      // For Android
      try {
        // Check for permission
        const permission = Platform.Version >= 33 
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES 
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
        
        const result = await check(permission);
        
        if (result === RESULTS.GRANTED) {
          return true;
        }
        
        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
        }
        
        if (result === RESULTS.BLOCKED) {
          Alert.alert(
            'Permission Required',
            'This app needs storage permissions to save files. Please enable them in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openSettings() }
            ]
          );
          return false;
        }
        
        return false;
      } catch (error) {
        console.error('Permission check error:', error);
        return false;
      }
    }
  };

  const getDownloadPath = (fileName, extension) => {
    if (Platform.OS === 'ios') {
      // For iOS, save to the app's documents directory
      return `${RNFS.DocumentDirectoryPath}/${fileName}.${extension}`;
    } else {
      // For Android, save to the Downloads directory
      return `${RNFS.DownloadDirectoryPath}/${fileName}.${extension}`;
    }
  };

  const shareFile = async (filePath) => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we need to use the share functionality
        const options = {
          url: `file://${filePath}`,
          type: filePath.endsWith('pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        
        // You would need to add a share library like react-native-share
        // await Share.open(options);
        
        // As a fallback, just show an alert with the file location
        Alert.alert('File Saved', `File saved to: ${filePath}`);
      } else {
        // For Android, just show a notification
        Alert.alert('Download Complete', `File saved to Downloads folder`);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  };
  
  // Updated PDF generation function
  const getBase64Image = async () => {
    const imagePath =
      Platform.OS === 'android'
        ? `${RNFS.MainBundlePath}/assets/abLogo.png` // Fallback, may not work
        : `${RNFS.MainBundlePath}/abLogo.png`;
  
    // Try fallback if in development
    const devPath = `${RNFS.DocumentDirectoryPath}/abLogo.png`; // Copy asset manually if needed
  
    try {
      const base64 = await RNFS.readFile(imagePath, 'base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.warn('Failed to read image:', error);
      return null;
    }
  };
// Enhanced PDF generation function with logo and better alignment
const generatePDF = async (order) => {
  const hasPermission = await checkAndRequestPermissions();
  if (!hasPermission) return;
  
  const fileName = `Order_${order.id.slice(-6)}`;
  
  // Base64 placeholder for company logo - replace this with your actual logo
  // You can convert your logo to base64 using online tools
  const logoBase64 = getBase64Image()
  
  // Create HTML content for the PDF with improved styling and logo
  const htmlContent = `
    <html>
    <head>
      <style>
        @page {
          margin: 0.5cm;
        }
        body { 
          font-family: 'Helvetica', Arial, sans-serif; 
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 2px solid #366732;
          margin-bottom: 20px;
        }
        .logo-container {
          width: 180px;
        }
        .logo {
          width: 100%;
          height: auto;
        }
        .order-info {
          text-align: right;
        }
        h1 { 
          color: #366732; 
          margin: 0 0 5px 0;
          font-size: 24px;
        }
        .invoice-id {
          font-size: 16px;
          color: #666;
          margin: 0;
        }
        .status { 
          display: inline-block; 
          padding: 5px 10px; 
          border-radius: 4px; 
          color: white; 
          background-color: ${getStatusColor(order.orderStatus)};
          text-transform: uppercase;
          font-size: 12px;
          font-weight: bold;
        }
        .info-row {
          margin-bottom: 5px;
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .info-value {
          text-align: right;
        }
        .section {
          margin-bottom: 25px;
        }
        h2 {
          color: #366732;
          font-size: 18px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .items-table th {
          background-color: #f3f3f3;
          text-align: left;
          padding: 10px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .items-table tr:last-child td {
          border-bottom: none;
        }
        .address-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #366732;
        }
        .notes-box {
          background-color: #fff9e6;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #f68422;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
          
          </div>
          <div class="order-info">
            <p class="invoice-id">ID: #${order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        
        <div class="section">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${moment(order.createdAt).format('MMMM D, YYYY [at] h:mm A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status">${order.orderStatus}</span>
          </div>
          ${order.updatedAt ? `
          <div class="info-row">
            <span class="info-label">Last Updated:</span>
            <span class="info-value">${moment(order.updatedAt).format('MMMM D, YYYY [at] h:mm A')}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h2>Order Items</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Brand</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.brand || '-'}</td>
                  <td>${item.quantity} × ${item.units}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${order.deliveryAddress ? `
          <div class="section">
            <h2>Delivery Information</h2>
            <div class="address-box">
              ${order.deliveryAddress}
            </div>
          </div>
        ` : ''}
        
        ${order.notes ? `
          <div class="section">
            <h2>Special Instructions</h2>
            <div class="notes-box">
              ${order.notes}
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your order! For any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Define options with proper file path handling
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: 'Download',
      base64: false,
      padding: 10,
    };

    // Generate the PDF
    const file = await RNHTMLtoPDF.convert(options);
    console.log('PDF file created at:', file.filePath);
    
    if (Platform.OS === 'android') {
      // For Android, verify if the file exists in the specified path
      const exists = await RNFS.exists(file.filePath);
      console.log('File exists:', exists);
      
      if (exists) {
        // Ensure the file is properly saved to Downloads for Android
        const androidDownloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
        
        // Copy the file to Downloads if it's not already there
        if (file.filePath !== androidDownloadPath) {
          try {
            await RNFS.copyFile(file.filePath, androidDownloadPath);
            console.log('File copied to:', androidDownloadPath);
            
            // Delete the original file to avoid duplicates
            await RNFS.unlink(file.filePath);
          } catch (copyError) {
            console.error('Error copying file:', copyError);
          }
        }
        
        // Alert with a more specific message
        Alert.alert(
          'PDF Generated', 
          `File saved to Downloads folder as "${fileName}.pdf"`,
          [
            { text: 'OK' },
            { 
              text: 'Open Downloads', 
              onPress: () => {
                // Opens Downloads folder on Android
                if (Platform.OS === 'android') {
                  Linking.openURL('content://com.android.externalstorage.documents/document/primary%3ADownload');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to verify the PDF file was created. Please check app permissions.');
      }
    } else {
      // For iOS
      const destinationPath = getDownloadPath(fileName, 'pdf');
      await RNFS.moveFile(file.filePath, destinationPath);
      shareFile(destinationPath);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};
  
  const generateExcel = async (order) => {
    const hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) return;
  
    const wsData = [
      ['Item', 'Brand', 'Quantity', 'Units'],
      ...order.items.map(item => [item.title, item.brand || '-', item.quantity, item.units]),
    ];
  
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order Items');
  
    const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});
    
    const fileName = `Order_${order.id.slice(-6)}`;
    const filePath = getDownloadPath(fileName, 'xlsx');
  
    try {
      await RNFS.writeFile(filePath, wbout, 'ascii');
      shareFile(filePath);
    } catch (e) {
      console.error('Excel generation error:', e);
      Alert.alert('Error', 'Failed to generate Excel file. Please try again.');
    }
  };

  const getSortedOrders = () => {
    let sortedOrders = [...orders];

    if (filterStatus !== 'all') {
      sortedOrders = sortedOrders.filter(order => order.orderStatus === filterStatus);
    }

    return sortedOrders.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp?.toDate() || 0;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp?.toDate() || 0;

      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500'; // Orange
      case 'accepted': return '#366732'; // Using primary green
      case 'preparing': return '#f68422'; // Using secondary orange
      case 'ready': return '#366732'; // Using primary green
      case 'delivered': return '#4CAF50'; // Green
      case 'cancelled': return '#ee2327'; // Using accent red
      default: return '#808080'; // Gray
    }
  };

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statusFilterContainer}
    >
      {['all', 'pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.statusFilterButton,
            filterStatus === status && styles.activeStatusFilter,
            {borderColor: getStatusColor(status)}
          ]}
          onPress={() => setFilterStatus(status)}>
          <Text style={[
            styles.statusFilterText,
            filterStatus === status && styles.activeStatusFilterText,
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOrderItem = ({item}) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.orderStatus)}]}>
          <Text style={styles.statusBadgeText}>
            {item.orderStatus.charAt(0).toUpperCase() + item.orderStatus.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={16} color="#808080" />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="clock-outline" size={16} color="#808080" />
          <Text style={styles.metaText}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="package-variant" size={16} color="#808080" />
          <Text style={styles.metaText}>{item.items.length} items</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.viewDetailsText}>View details</Text>
        <Icon name="chevron-right" size={20} color={appTheme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderOrderDetails = () => (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Order Details</Text>
        <TouchableOpacity onPress={() => setModalVisible(false)}>
          <Icon name="close" size={24} color={appTheme.colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        {/* Order Summary */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>#{selectedOrder.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, {backgroundColor: getStatusColor(selectedOrder.orderStatus)}]}>
              <Text style={styles.statusBadgeText}>
                {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
              </Text>
            </View>
          </View>
          {selectedOrder.updatedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated:</Text>
              <Text style={styles.detailValue}>{formatDate(selectedOrder.updatedAt)} at {formatTime(selectedOrder.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Items ({selectedOrder.items.length})</Text>
          {selectedOrder.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.title}</Text>
                {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
              </View>
              <View style={styles.itemQuantity}>
                <Text style={styles.itemQtyText}>{item.quantity} × {item.units}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        {selectedOrder.deliveryAddress && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.addressContainer}>
              <Icon name="map-marker-outline" size={20} color={appTheme.colors.primary} />
              <Text style={styles.addressText}>{selectedOrder.deliveryAddress}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {selectedOrder.notes && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.notesText}>{selectedOrder.notes}</Text>
          </View>
        )}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Download Options</Text>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => generatePDF(selectedOrder)}
            >
              <Text style={styles.downloadButtonText}>Download PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.downloadButton, {marginLeft: 12}]}
              onPress={() => generateExcel(selectedOrder)}
            >
              <Text style={styles.downloadButtonText}>Download Excel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'newest' && styles.activeSortButton]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'newest' && styles.activeSortButtonText]}>
              Newest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'oldest' && styles.activeSortButton]}
            onPress={() => setSortBy('oldest')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'oldest' && styles.activeSortButtonText]}>
              Oldest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        {renderStatusFilter()}
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={getSortedOrders()}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedOrder && renderOrderDetails()}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: appTheme.colors.primary,
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 2,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeSortButton: {
    backgroundColor: appTheme.colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  activeSortButtonText: {
    color: appTheme.colors.white,
  },
  statusFilterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    backgroundColor: appTheme.colors.white,
  },
  activeStatusFilter: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  statusFilterText: {
    fontSize: 14,
    color: '#666666',
  },
  activeStatusFilterText: {
    color: appTheme.colors.white,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: appTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.colors.white,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    color: appTheme.colors.primary,
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.dark,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666666',
  },
  detailValue: {
    fontSize: 15,
    color: appTheme.colors.dark,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: appTheme.colors.dark,
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 13,
    color: '#666666',
  },
  itemQuantity: {
    marginLeft: 10,
  },
  itemQtyText: {
    fontSize: 15,
    color: appTheme.colors.dark,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  addressText: {
    fontSize: 15,
    color: appTheme.colors.dark,
    marginLeft: 10,
    flex: 1,
  },
  notesText: {
    fontSize: 15,
    color: appTheme.colors.dark,
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: appTheme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderHistoryScreen;