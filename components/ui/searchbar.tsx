import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  onSearch?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search...",
  debounceMs = 500,
  isLoading = false,
  onSearch,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Debouncing logic
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && internalValue !== value) {
        onSearch(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch, value]);

  const handleChangeText = (text: string) => {
    setInternalValue(text);
    onChangeText(text);
  };

  const handleClear = () => {
    setInternalValue("");
    onChangeText("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          value={internalValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => onSearch && onSearch(internalValue)}
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="#666"
            style={styles.loadingIcon}
          />
        )}
        {!isLoading && internalValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    width: "100%",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 0,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});
