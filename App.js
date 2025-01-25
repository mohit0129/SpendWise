import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Switch,
  SafeAreaView,
  Alert,
  useColorScheme,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function App() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpense, setIsExpense] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState('all');

  // Theme configuration
  const theme = {
    light: {
      background: '#f8f9fa',
      cardBackground: 'white',
      headerBackground: '#007bff',
      text: 'black',
      secondaryText: '#6c757d',
      filterInactive: '#f8f9fa',
      filterActive: '#007bff',
    },
    dark: {
      background: '#121212',
      cardBackground: '#1E1E1E',
      headerBackground: '#0D47A1',
      text: 'white',
      secondaryText: '#B0B0B0',
      filterInactive: '#333333',
      filterActive: '#2196F3',
    }
  };

  useEffect(() => {
    loadTransactions();
    loadThemePreference();
  }, []);

  useEffect(() => {
    saveTransactions();
    applyFilter();
    saveThemePreference();
  }, [transactions, filter, isDarkMode]);

  const saveTransactions = async () => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const savedTransactions = await AsyncStorage.getItem('transactions');
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions).map(tx => ({
          ...tx,
          date: new Date(tx.date)
        }));
        setTransactions(parsedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions', error);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference', error);
    }
  };

  const saveThemePreference = async () => {
    try {
      await AsyncStorage.setItem('appTheme', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Error saving theme preference', error);
    }
  };

  const applyFilter = () => {
    let filtered = transactions;
    switch (filter) {
      case 'income':
        filtered = transactions.filter(tx => !tx.isExpense);
        break;
      case 'expense':
        filtered = transactions.filter(tx => tx.isExpense);
        break;
      default:
        filtered = transactions;
    }
    setFilteredTransactions(filtered);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setSelectedDate(new Date(transaction.date));
    setIsExpense(transaction.isExpense);
    setModalVisible(true);
  };

  const saveTransaction = () => {
    if (description && amount) {
      if (editingTransaction) {
        // Editing existing transaction
        const updatedTransactions = transactions.map(tx =>
          tx.id === editingTransaction.id
            ? {
              ...tx,
              description,
              amount: parseFloat(amount),
              date: selectedDate,
              isExpense
            }
            : tx
        );
        setTransactions(updatedTransactions);
      } else {
        // Adding new transaction
        const newTransaction = {
          id: Date.now().toString(),
          description,
          amount: parseFloat(amount),
          date: selectedDate,
          isExpense,
        };
        setTransactions([...transactions, newTransaction]);
      }

      // Reset modal state
      setModalVisible(false);
      setDescription('');
      setAmount('');
      setSelectedDate(new Date());
      setIsExpense(true);
      setEditingTransaction(null);
    }
  };

  const removeTransaction = (id) => {
    Alert.alert(
      'Remove Transaction',
      'Are you sure you want to remove this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedTransactions = transactions.filter(tx => tx.id !== id);
            setTransactions(updatedTransactions);
          },
        },
      ]
    );
  };

  const totalIncome = transactions
    .filter(tx => !tx.isExpense)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.isExpense)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={[
      styles.container,
      {
        backgroundColor: isDarkMode
          ? theme.dark.background
          : theme.light.background
      }
    ]}>
      <View style={[
        styles.header,
        {
          backgroundColor: isDarkMode
            ? theme.dark.headerBackground
            : theme.light.headerBackground
        }
      ]}>
        <Text style={[
          styles.headerText,
          { color: isDarkMode ? theme.dark.text : 'white' }
        ]}>
          Expense Tracker
        </Text>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
        >
          <Icon
            name={isDarkMode ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={isDarkMode ? theme.dark.text : 'white'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'income', 'expense'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === type
                  ? (isDarkMode ? theme.dark.filterActive : theme.light.filterActive)
                  : (isDarkMode ? theme.dark.filterInactive : theme.light.filterInactive)
              }
            ]}
            onPress={() => setFilter(type)}
          >
            <Text style={[
              styles.filterButtonText,
              {
                color: filter === type
                  ? 'white'
                  : (isDarkMode ? theme.dark.text : 'black')
              }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[
        styles.summaryContainer,
        { backgroundColor: isDarkMode ? theme.dark.background : theme.light.background }
      ]}>
        <View style={[
          styles.summaryCard,
          {
            backgroundColor: isDarkMode
              ? theme.dark.cardBackground
              : theme.light.cardBackground
          }
        ]}>
          <View style={styles.summaryRow}>
            <SummaryItem
              title="Income"
              amount={totalIncome}
              color={isDarkMode ? '#4CAF50' : '#28a745'}
            />
            <SummaryItem
              title="Expenses"
              amount={totalExpense}
              color={isDarkMode ? '#F44336' : '#dc3545'}
            />
            <SummaryItem
              title="Balance"
              amount={balance}
              color={balance >= 0
                ? (isDarkMode ? '#2196F3' : '#007bff')
                : (isDarkMode ? '#F44336' : '#dc3545')
              }
            />
          </View>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.transactionCard,
              {
                backgroundColor: isDarkMode
                  ? theme.dark.cardBackground
                  : theme.light.cardBackground
              }
            ]}
            onLongPress={() => removeTransaction(item.id)}
            onPress={() => openEditModal(item)}
          >
            <View style={styles.transactionRow}>
              <View style={[
                styles.transactionIcon,
                {
                  backgroundColor: item.isExpense
                    ? (isDarkMode ? '#F44336' : '#dc3545')
                    : (isDarkMode ? '#4CAF50' : '#28a745')
                }
              ]}>
                <Text style={styles.iconText}>
                  {item.isExpense ? '-' : '+'}
                </Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={[
                  styles.transactionDescription,
                  { color: isDarkMode ? theme.dark.text : theme.light.text }
                ]}>
                  {item.description}
                </Text>
                <Text style={[
                  styles.transactionDate,
                  { color: isDarkMode ? theme.dark.secondaryText : theme.light.secondaryText }
                ]}>
                  {formatDate(new Date(item.date))}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                {
                  color: item.isExpense
                    ? (isDarkMode ? '#F44336' : '#dc3545')
                    : (isDarkMode ? '#4CAF50' : '#28a745')
                }
              ]}>
                ₹{item.amount.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingTransaction(null);
        }}
      >
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode
              ? 'rgba(0, 0, 0, 0.8)'
              : 'rgba(0, 0, 0, 0.5)'
          }
        ]}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: isDarkMode
                ? theme.dark.cardBackground
                : theme.light.cardBackground
            }
          ]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#333' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                  borderColor: isDarkMode ? '#555' : '#ced4da'
                }
              ]}
              placeholderTextColor={isDarkMode ? '#888' : '#6c757d'}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#333' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                  borderColor: isDarkMode ? '#555' : '#ced4da'
                }
              ]}
              placeholderTextColor={isDarkMode ? '#888' : '#6c757d'}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: isDarkMode ? '#333' : '#f8f9fa',
                  borderColor: isDarkMode ? '#555' : '#ced4da'
                }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: isDarkMode ? 'white' : 'black' }}>
                Date: {formatDate(selectedDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            <View style={styles.switchContainer}>
              <Text style={{ color: isDarkMode ? 'white' : 'black' }}>
                Transaction Type:
              </Text>
              <Switch
                value={isExpense}
                onValueChange={setIsExpense}
                trackColor={{
                  false: isDarkMode ? '#888' : '#767577',
                  true: isDarkMode ? '#2196F3' : '#007bff'
                }}
              />
              <Text style={{ color: isDarkMode ? 'white' : 'black' }}>
                {isExpense ? 'Expense' : 'Income'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: isDarkMode
                    ? '#4CAF50'
                    : '#28a745'
                }
              ]}
              onPress={saveTransaction}
            >
              <Text style={styles.buttonText}>
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? '#F44336'
                    : '#dc3545'
                }
              ]}
              onPress={() => {
                setModalVisible(false);
                setEditingTransaction(null);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: isDarkMode
              ? theme.dark.filterActive
              : theme.light.headerBackground
          }
        ]}
        onPress={() => {
          setEditingTransaction(null);
          setModalVisible(true);
        }}
      >
        <Text style={[
          styles.fabText,
          { color: isDarkMode ? theme.dark.text : 'white' }
        ]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const SummaryItem = ({ title, amount, color }) => (
  <View style={styles.summaryItem}>
    <Text style={[
      styles.summaryTitle,
      {
        color: color === '#dc3545' || color === '#F44336'
          ? (color === '#dc3545' ? '#dc3545' : '#F44336')
          : 'gray'
      }
    ]}>
      {title}
    </Text>
    <Text style={[
      styles.summaryAmount,
      { color }
    ]}>
      ₹{amount.toFixed(2)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  filterButtonText: {
    color: 'white',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  dateButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});