// components/SearchableDropdown.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Search, ChevronDown } from 'lucide-react-native';
import appTheme from '../abTheme';

const { height: screenHeight } = Dimensions.get('window');

const SearchableDropdown = ({
  items = [],
  onItemSelect,
  placeholder = 'Search items...',
  loading = false,
  value = '',
  onChangeText,
  maxHeight = 200,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [filteredItems, setFilteredItems] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    if (searchText.length === 0) {
      setFilteredItems(items.slice(0, 20)); // Show first 20 items when no search
    } else {
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 20)); // Limit to 20 results
    }
  }, [searchText, items]);

  const handleTextChange = (text) => {
    setSearchText(text);
    if (onChangeText) {
      onChangeText(text);
    }
    if (!isOpen && text.length > 0) {
      setIsOpen(true);
    }
  };

  const handleItemSelect = (item) => {
    setSearchText(item.title);
    setIsOpen(false);
    if (onItemSelect) {
      onItemSelect(item);
    }
    inputRef.current?.blur();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  const renderItem = ({ item }) => {
    console.log(item,'DROP ITEM')
    return(
    
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleItemSelect(item)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemUnit}>{item.units}</Text>
          <Text style={styles.itemPrice}>£{item.sellingPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )};

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => setIsOpen(true)}
        />
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          {loading ? (
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
          ) : (
            <ChevronDown 
              size={20} 
              color={appTheme.colors.primary}
              style={[styles.chevron, isOpen && styles.chevronUp]} 
            />
          )}
        </TouchableOpacity>
      </View>

      {isOpen && (
        <View style={[styles.dropdown, { maxHeight }]}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={24} color={appTheme.colors.primary} />
              <Text style={styles.emptyText}>
                {searchText.length > 0 ? 'No items found' : 'Start typing to search'}
              </Text>
              {searchText.length > 0 && (
                <Text style={styles.emptySubtext}>
                  You can still use "{searchText}" as a custom item
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: appTheme.borderRadius.md,
    backgroundColor: appTheme.colors.white,
  },
  input: {
    flex: 1,
    padding: appTheme.spacing.sm,
    fontSize: 16,
    color: appTheme.colors.dark,
  },
  dropdownButton: {
    padding: appTheme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: appTheme.colors.white,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopWidth: 0,
    borderBottomLeftRadius: appTheme.borderRadius.md,
    borderBottomRightRadius: appTheme.borderRadius.md,
    ...appTheme.shadows.medium,
    zIndex: 1001,
  },
  list: {
    flexGrow: 0,
  },
  dropdownItem: {
    padding: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    color: appTheme.colors.dark,
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemUnit: {
    fontSize: 12,
    color: appTheme.colors.primary,
    marginRight: appTheme.spacing.xs,
    backgroundColor: appTheme.colors.pastelGreen,
    paddingHorizontal: appTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: appTheme.colors.secondary,
    fontWeight: '600',
  },
  emptyState: {
    padding: appTheme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: appTheme.colors.dark,
    textAlign: 'center',
    marginTop: appTheme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 12,
    color: appTheme.colors.primary,
    textAlign: 'center',
    marginTop: appTheme.spacing.xs,
  },
});

export default SearchableDropdown;