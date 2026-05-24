import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import appTheme from '../abTheme';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Image } from 'react-native';

const ChecklistFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { checklistId, title } = route.params || {};
  const { user } = useSelector(state => state.user);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showPicker, setShowPicker] = useState({ id: null, mode: 'date' });
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = new Animated.Value(0);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const docSnap = await firestore().collection('checklists').doc(checklistId).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            // Initialize answers with auto-fetched values
            const initialAnswers = {};
            data.questions.forEach(q => {
              let defaultVal = '';
              const questionLower = (q.question || '').toLowerCase();
              
              if (q.type === 'date' || questionLower === 'date' || questionLower === 'date*') {
                defaultVal = moment().format('MM/DD/YYYY');
              } else if (q.type === 'time' || questionLower === 'time' || questionLower === 'time*') {
                defaultVal = moment().format('hh:mm A');
              } else if (questionLower.includes('name of the branch') || questionLower.includes('branch name')) {
                defaultVal = user?.restaurantName || user?.name || '';
              }
              
              initialAnswers[q.id] = defaultVal;
            });
            setAnswers(initialAnswers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch checklist', error);
        Alert.alert('Error', 'Failed to load checklist questions.');
      } finally {
        setLoading(false);
      }
    };
    if (checklistId) {
      fetchChecklist();
    }
  }, [checklistId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleDateChange = (event, selectedDate) => {
    const id = showPicker.id;
    const mode = showPicker.mode;
    setShowPicker({ id: null, mode: 'date' }); // close picker immediately

    if (event.type === 'set' && selectedDate) {
      const formatted = mode === 'date' 
        ? moment(selectedDate).format('MM/DD/YYYY')
        : moment(selectedDate).format('hh:mm A');
      handleAnswerChange(id, formatted);
    }
  };

  const openPicker = (id, mode) => {
    setShowPicker({ id, mode });
  };

  const handleImagePick = (questionId) => {
    Alert.alert(
      'Upload Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            if (Platform.OS === 'android') {
              try {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.CAMERA,
                  {
                    title: "Camera Permission",
                    message: "App needs access to your camera to take photos.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                  }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                  return;
                }
              } catch (err) {
                console.warn(err);
                return;
              }
            }

            launchCamera({ mediaType: 'photo', includeBase64: true, maxWidth: 800, maxHeight: 800, quality: 0.6, saveToPhotos: false }, (response) => {
              if (response.didCancel) return;
              if (response.errorCode) {
                Alert.alert('Camera Error', response.errorMessage || 'Unknown error occurred');
                return;
              }
              if (response.assets && response.assets.length > 0) {
                const base64Str = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
                handleAnswerChange(questionId, base64Str);
              }
            });
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', includeBase64: true, maxWidth: 800, maxHeight: 800, quality: 0.6 }, (response) => {
              if (response.didCancel) return;
              if (response.errorCode) {
                Alert.alert('Gallery Error', response.errorMessage || 'Unknown error occurred');
                return;
              }
              if (response.assets && response.assets.length > 0) {
                const base64Str = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
                handleAnswerChange(questionId, base64Str);
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitChecklist = async () => {
    // Basic validation
    const unanswered = questions.some(q => q.required !== false && !answers[q.id]);
    if (unanswered) {
      Alert.alert('Incomplete', 'Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const reportData = {
        checklistId,
        checklistTitle: title,
        submittedByEmail: user?.email || 'Unknown',
        submittedByName: user?.name || 'Unknown',
        submittedAt: firestore.FieldValue.serverTimestamp(),
        answers: questions.map(q => ({
          questionId: q.id,
          question: q.question,
          type: q.type,
          answer: answers[q.id]
        }))
      };

      await firestore().collection('checklist_reports').add(reportData);
      
      // Show success popup
      successAnim.setValue(0);
      setShowSuccess(true);
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Auto dismiss and navigate
      setTimeout(() => {
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccess(false);
          navigation.goBack();
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report', error);
      Alert.alert('Error', 'Failed to submit checklist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const SuccessPopup = () => (
    showSuccess && (
      <Animated.View 
        style={[
          styles.successPopupContainer,
          {
            opacity: successAnim,
            transform: [
              {
                translateY: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.successPopup}>
          <MaterialIcons name="check-circle" size={60} color={appTheme.colors.primary} />
          <Text style={styles.successPopupTitle}>Submitted Successfully!</Text>
          <Text style={styles.successPopupText}>Your checklist has been saved.</Text>
        </View>
      </Animated.View>
    )
  );

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
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
    </LinearGradient>
  );

  const renderQuestion = (q, index) => {
    return (
      <View key={q.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>Q{index + 1}</Text>
          </View>
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        {q.type === 'multiple' && (
          <View style={styles.optionsContainer}>
            {(q.options || []).map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => handleMultipleSelect(q.id, opt)}
                >
                  <MaterialIcons 
                    name={isSelected ? 'check-circle' : 'radio-button-unchecked'} 
                    size={24} 
                    color={isSelected ? appTheme.colors.primary : appTheme.colors.dark + '50'} 
                  />
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
            {q.allowOther && (
              <View style={styles.optionRow}>
                <MaterialIcons name="edit" size={24} color={appTheme.colors.dark + '50'} />
                <TextInput
                  style={styles.textInputSmall}
                  placeholder="Other..."
                  placeholderTextColor={appTheme.colors.dark + '60'}
                  value={!q.options?.includes(answers[q.id]) && answers[q.id] ? answers[q.id] : ''}
                  onChangeText={(val) => handleAnswerChange(q.id, val)}
                  onFocus={() => {
                    if (q.options?.includes(answers[q.id])) {
                      handleAnswerChange(q.id, '');
                    }
                  }}
                />
              </View>
            )}
          </View>
        )}

        {q.type === 'text' && (
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            placeholderTextColor={appTheme.colors.dark + '60'}
            multiline={true}
            numberOfLines={3}
            value={answers[q.id] || ''}
            onChangeText={(val) => handleAnswerChange(q.id, val)}
          />
        )}

        {q.type === 'image' && (
          <TouchableOpacity style={styles.imageUploadBox} onPress={() => handleImagePick(q.id)}>
            {answers[q.id] && answers[q.id].startsWith('data:image') ? (
              <>
                <Image source={{ uri: answers[q.id] }} style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="edit" size={20} color={appTheme.colors.primary} />
                  <Text style={[styles.imageUploadText, { marginTop: 0, marginLeft: 4, color: appTheme.colors.primary }]}>Change Image</Text>
                </View>
              </>
            ) : (
              <>
                <MaterialIcons name="add-a-photo" size={32} color={appTheme.colors.dark + '50'} />
                <Text style={styles.imageUploadText}>Tap to upload image</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {(q.type === 'date' || q.type === 'time') && (
          <TouchableOpacity 
            style={styles.inputWithIconBox} 
            onPress={() => openPicker(q.id, q.type)}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={q.type === 'date' ? 'calendar-today' : 'access-time'} 
              size={20} 
              color={appTheme.colors.primary} 
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.iconTextInput, !answers[q.id] && { color: appTheme.colors.dark + '60' }]}>
              {answers[q.id] || (q.type === 'date' ? "MM/DD/YYYY" : "--:--")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, position: 'relative' }}>
        <Header />
        {questions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noQuestionsText}>No questions configured for this checklist.</Text>
          </View>
        ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {questions.map((q, i) => renderQuestion(q, i))}

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={submitChecklist}
            disabled={submitting}
          >
            <LinearGradient
              colors={[appTheme.colors.primary, appTheme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="check-circle-outline" size={24} color="white" />
                  <Text style={styles.submitButtonText}>Submit Checklist</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
        
        {showPicker.id && (
          <DateTimePicker
            value={
              answers[showPicker.id]
                ? (showPicker.mode === 'time' ? moment(answers[showPicker.id], 'hh:mm A').toDate() : moment(answers[showPicker.id], 'MM/DD/YYYY').toDate())
                : new Date()
            }
            mode={showPicker.mode}
            display="default"
            onChange={handleDateChange}
          />
        )}

        <SuccessPopup />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: appTheme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...appTheme.shadows.small,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionBadge: {
    backgroundColor: appTheme.colors.pastelPeach,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  questionBadgeText: {
    color: appTheme.colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.colors.dark,
    lineHeight: 24,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  optionRowSelected: {
    backgroundColor: appTheme.colors.pastelPeach + '30',
    borderColor: appTheme.colors.primary + '50',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 15,
    color: appTheme.colors.dark,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: appTheme.colors.primary,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: appTheme.colors.dark,
    textAlignVertical: 'top',
  },
  inputWithIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  iconTextInput: {
    flex: 1,
    fontSize: 15,
    color: appTheme.colors.dark,
    paddingVertical: 12,
  },
  textInputSmall: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    padding: 0,
    color: appTheme.colors.dark,
  },
  imageUploadBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    marginTop: 8,
    color: appTheme.colors.dark + '80',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: appTheme.borderRadius.lg,
    overflow: 'hidden',
    ...appTheme.shadows.medium,
  },
  submitGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noQuestionsText: {
    fontSize: 16,
    color: appTheme.colors.dark + '80',
  },
  successPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
  },
  successPopup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...appTheme.shadows.large,
  },
  successPopupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  successPopupText: {
    fontSize: 14,
    color: appTheme.colors.dark + '80',
    textAlign: 'center',
  },
});

export default ChecklistFormScreen;
