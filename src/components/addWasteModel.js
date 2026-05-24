// components/AddWasteModal.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Pressable,
    PermissionsAndroid, Platform,
    SafeAreaView
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import Toast from 'react-native-toast-message';
import SearchableDropdown from './searchableDropdown';
import appTheme from '../abTheme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const AddWasteModal = ({ visible, onClose, userId }) => {
    const [formData, setFormData] = useState({
        itemName: '',
        selectedItem: null,
        wastedQuantity: '',
        unit: '',
        description: '',
        reason: '',
        estimatedValue: '',
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);

    const wasteReasons = [
        'Overproduction',
        'Quality Issues',
        'Expiration',
        'Customer Cancellation',
        'Storage Issues',
        'Preparation Error',
        'Other'
    ];

    useEffect(() => {
        if (visible) {
            fetchItems();
            resetForm();
        }
    }, [visible]);

    const fetchItems = async () => {
        setLoadingItems(true);
        try {
            // Fetch from inventoryItems collection
            const inventoryQuery = firestore().collection('inventoryItems');
            const inventorySnapshot = await inventoryQuery.get();
            const inventoryItems = inventorySnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                units: doc.data().units,
                sellingPrice: doc.data().sellingPrice,
                type: 'inventory'
            }));

            // Fetch from ingredients collection
            const ingredientsQuery = firestore().collection('ingredients');
            const ingredientsSnapshot = await ingredientsQuery.get();
            const ingredientItems = ingredientsSnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title || doc.data().name,
                units: doc.data().units,
                sellingPrice: doc.data().sellingPrice || doc.data().price,
                type: 'ingredient'
            }));

            // Combine and deduplicate
            const allItems = [...inventoryItems, ...ingredientItems];
            const uniqueItems = allItems.filter((item, index, self) =>
                index === self.findIndex(i => i.title === item.title)
            );

            setItems(uniqueItems);
        } catch (error) {
            console.error('Error fetching items:', error);
            showToast('error', 'Error', 'Failed to load items');
        } finally {
            setLoadingItems(false);
        }
    };

    const resetForm = () => {
        setFormData({
            itemName: '',
            selectedItem: null,
            wastedQuantity: '',
            unit: '',
            description: '',
            reason: '',
            estimatedValue: '',
        });
        setImage(null);
    };

    const showToast = (type, text1, text2) => {
        Toast.show({
            type,
            text1,
            text2,
            visibilityTime: 3000,
            autoHide: true,
        });
    };

    const handleItemSelect = (item) => {
        setFormData(prev => ({
            ...prev,
            selectedItem: item,
            itemName: item.title,
            unit: item.units || '',
            estimatedValue: (parseFloat(item.sellingPrice) || 0).toString()
        }));
    };

    const handleImagePicker = () => {
        setShowImagePicker(true);
    };

    // Update your selectImage function:
    const selectImage = async (useCamera = false) => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
            includeBase64: false,
            saveToPhotos: true,
        };

        const callback = (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                console.log(response.errorMessage, "error in image picker");
                Alert.alert('Error', `Image picker error: ${response.errorMessage}`);
                return;
            }

            if (response.assets && response.assets.length > 0) {
                const imageUri = response.assets[0].uri;
                compressImage(imageUri);
            }
        };

        if (useCamera) {
            try {
                if (Platform.OS === 'android') {
                    // For Android
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: "Camera Permission",
                            message: "This app needs access to your camera",
                            buttonNeutral: "Ask Me Later",
                            buttonNegative: "Cancel",
                            buttonPositive: "OK"
                        }
                    );

                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        launchCamera(options, callback);
                    } else {
                        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
                    }
                } else {
                    // For iOS
                    const cameraPermission = await check(PERMISSIONS.IOS.CAMERA);

                    if (cameraPermission === RESULTS.GRANTED) {
                        launchCamera(options, callback);
                    } else {
                        const result = await request(PERMISSIONS.IOS.CAMERA);
                        if (result === RESULTS.GRANTED) {
                            launchCamera(options, callback);
                        } else {
                            Alert.alert('Permission Denied', 'Camera permission is required to take photos');
                        }
                    }
                }
            } catch (err) {
                console.warn(err);
                Alert.alert('Error', 'Failed to request camera permission');
            }
        } else {
            launchImageLibrary(options, callback);
        }

        setShowImagePicker(false);
    };

    const compressImage = async (uri) => {
        try {
            const compressedImage = await ImageResizer.createResizedImage(
                uri,
                800,
                800,
                'JPEG',
                80,
                0,
                undefined,
                false,
                { mode: 'contain', onlyScaleDown: true }
            );
            setImage(compressedImage);
        } catch (error) {
            console.error('Image compression error:', error);
            setImage({ uri });
        }
    };

    const uploadImage = async () => {
        if (!image) return null;

        try {
            const filename = `waste_images/${userId}/${Date.now()}.jpg`;
            const reference = storage().ref(filename);

            // For Android, we need to convert the file URI to a Blob
            const response = await fetch(image.uri);
            const blob = await response.blob();

            await reference.put(blob);
            const downloadURL = await reference.getDownloadURL();

            return downloadURL;
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    };

    const calculateEstimatedValue = () => {
        const quantity = parseFloat(formData.wastedQuantity) || 0;
        const basePrice = formData.selectedItem?.sellingPrice ||
            parseFloat(formData.estimatedValue) || 0;
        return (quantity * basePrice).toFixed(2);
    };

    const validateForm = () => {
        if (!formData.itemName.trim()) {
            showToast('error', 'Validation Error', 'Please enter item name');
            return false;
        }

        if (!formData.wastedQuantity.trim() || isNaN(formData.wastedQuantity) || parseFloat(formData.wastedQuantity) <= 0) {
            showToast('error', 'Validation Error', 'Please enter valid wasted quantity');
            return false;
        }

        if (!formData.reason.trim()) {
            showToast('error', 'Validation Error', 'Please select a reason for waste');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImage();
            }

            const wasteData = {
                userId,
                itemName: formData.itemName.trim(),
                selectedItemId: formData.selectedItem?.id || null,
                itemType: formData.selectedItem?.type || 'custom',
                wastedQuantity: parseFloat(formData.wastedQuantity),
                unit: formData.unit.trim() || 'pcs',
                description: formData.description.trim(),
                reason: formData.reason,
                estimatedValue: calculateEstimatedValue(),
                imageUrl,
                createdAt: firestore.FieldValue.serverTimestamp(),
                date: new Date().toISOString().split('T')[0],
            };

            await firestore()
                .collection('wastage')
                .add(wasteData);

            showToast('success', 'Success', 'Waste item added successfully');
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error adding waste item:', error);
            showToast('error', 'Error', 'Failed to add waste item');
        } finally {
            setLoading(false);
        }
    };

    const renderImagePicker = () => (
        <Modal
            visible={showImagePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowImagePicker(false)}
        >
            <Pressable
                style={styles.imagePickerOverlay}
                onPress={() => setShowImagePicker(false)}
            >
                <View style={styles.imagePickerModal}>
                    <Text style={styles.imagePickerTitle}>Select Image</Text>
                    <TouchableOpacity
                        style={styles.imagePickerOption}
                        onPress={() => selectImage(true)}
                    >
                        <Icon name="photo-camera" size={24} color={appTheme.colors.primary} />
                        <Text style={styles.imagePickerText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.imagePickerOption}
                        onPress={() => selectImage(false)}
                    >
                        <Icon name="image" size={24} color={appTheme.colors.primary} />
                        <Text style={styles.imagePickerText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Waste Item</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon name="close" size={24} color={appTheme.colors.dark} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.form}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.section}>
                        <Text style={styles.label}>Item Name *</Text>
                        <SearchableDropdown
                            items={items}
                            onItemSelect={handleItemSelect}
                            placeholder="Search or enter item name"
                            loading={loadingItems}
                            value={formData.itemName}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, itemName: text }))}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.section, { flex: 2 }]}>
                            <Text style={styles.label}>Wasted Quantity *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter quantity"
                                value={formData.wastedQuantity}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, wastedQuantity: text.replace(/[^0-9.]/g, '') }))}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.section, { flex: 1, marginLeft: appTheme.spacing.sm }]}>
                            <Text style={styles.label}>Unit</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="kg, pcs, etc."
                                value={formData.unit}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Estimated Value (£)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Estimated value"
                            value={formData.estimatedValue}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, estimatedValue: text.replace(/[^0-9.]/g, '') }))}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Reason for Waste *</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.reasonContainer}
                            contentContainerStyle={styles.reasonContent}
                        >
                            {wasteReasons.map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonChip,
                                        formData.reason === reason && styles.reasonChipActive
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, reason }))}
                                >
                                    <Text style={[
                                        styles.reasonChipText,
                                        formData.reason === reason && styles.reasonChipTextActive
                                    ]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Additional details about the waste"
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Photo</Text>
                        <TouchableOpacity
                            style={styles.imageButton}
                            onPress={handleImagePicker}
                            activeOpacity={0.7}
                        >
                            {image ? (
                                <Image
                                    source={{ uri: image.uri }}
                                    style={styles.selectedImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Icon name="photo-camera" size={24} color={appTheme.colors.primary} />
                                    <Text style={styles.imageButtonText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={appTheme.colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Add Waste Item</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                {renderImagePicker()}
                <Toast />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: appTheme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: appTheme.colors.lightGray,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: appTheme.colors.dark,
    },
    closeButton: {
        padding: appTheme.spacing.xs,
    },
    form: {
        flex: 1,
        paddingHorizontal: appTheme.spacing.lg,
    },
    scrollContent: {
        paddingBottom: appTheme.spacing.xl,
    },
    section: {
        marginBottom: appTheme.spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: appTheme.colors.dark,
        marginBottom: appTheme.spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: appTheme.colors.lightGray,
        borderRadius: appTheme.borderRadius.md,
        padding: appTheme.spacing.sm,
        fontSize: 16,
        backgroundColor: appTheme.colors.white,
        color: appTheme.colors.dark,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingVertical: appTheme.spacing.sm,
    },
    reasonContainer: {
        flexGrow: 0,
    },
    reasonContent: {
        paddingVertical: appTheme.spacing.xs,
    },
    reasonChip: {
        backgroundColor: appTheme.colors.lightBackground,
        paddingHorizontal: appTheme.spacing.md,
        paddingVertical: appTheme.spacing.sm,
        borderRadius: appTheme.borderRadius.lg,
        marginRight: appTheme.spacing.sm,
    },
    reasonChipActive: {
        backgroundColor: appTheme.colors.primary,
    },
    reasonChipText: {
        color: appTheme.colors.dark,
        fontSize: 14,
    },
    reasonChipTextActive: {
        color: appTheme.colors.white,
    },
    imageButton: {
        borderWidth: 2,
        borderColor: appTheme.colors.lightGray,
        borderStyle: 'dashed',
        borderRadius: appTheme.borderRadius.md,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: appTheme.colors.lightBackground,
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageButtonText: {
        marginTop: appTheme.spacing.sm,
        color: appTheme.colors.primary,
        fontWeight: '600',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
        borderRadius: appTheme.borderRadius.md,
    },
    submitButton: {
        backgroundColor: appTheme.colors.primary,
        padding: appTheme.spacing.md,
        borderRadius: appTheme.borderRadius.md,
        alignItems: 'center',
        marginTop: appTheme.spacing.xl,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: appTheme.colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    imagePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerModal: {
        backgroundColor: appTheme.colors.white,
        borderRadius: appTheme.borderRadius.lg,
        padding: appTheme.spacing.lg,
        width: '80%',
    },
    imagePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: appTheme.spacing.lg,
        color: appTheme.colors.dark,
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: appTheme.spacing.md,
        borderRadius: appTheme.borderRadius.md,
        marginBottom: appTheme.spacing.sm,
        backgroundColor: appTheme.colors.lightBackground,
    },
    imagePickerText: {
        marginLeft: appTheme.spacing.md,
        fontSize: 16,
        color: appTheme.colors.dark,
        fontWeight: '500',
    },
});

export default AddWasteModal;