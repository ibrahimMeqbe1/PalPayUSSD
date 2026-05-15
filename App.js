import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Clipboard,
  Alert,
  StatusBar,
  SafeAreaView,
  FlatList,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PALPAY_COLORS = {
  primary: '#E91E8C',
  secondary: '#9C27B0',
  accent: '#FF9500',
  jawwal: '#00A3E0',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const WALLETS = {
  palpay: {
    name: 'PalPay',
    code: '*370*1*1*',
    color: PALPAY_COLORS.primary,
    icon: 'wallet',
  },
  jawwal: {
    name: 'Jawwal Pay',
    code: '*268*1*',
    color: PALPAY_COLORS.jawwal,
    icon: 'phone-in-talk',
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('palpay');
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTransactions();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    Notifications.addNotificationReceivedListener((notification) => {
      handleIncomingNotification(notification);
    });
  };

  const handleIncomingNotification = async (notification) => {
    const { body, title } = notification.request.content;
    const notificationText = `${title || ''} ${body || ''}`.toLowerCase();

    if (
      notificationText.includes('jawwal') ||
      notificationText.includes('268') ||
      notificationText.includes('تحويل') ||
      notificationText.includes('transfer')
    ) {
      const amountMatch = notificationText.match(/(\d+(?:\.\d{1,2})?)/);
      const phoneMatch = notificationText.match(/(\d{7,15})/);

      if (amountMatch || phoneMatch) {
        const extractedAmount = amountMatch ? amountMatch[1] : '0';
        const extractedPhone = phoneMatch ? phoneMatch[1] : '';

        await addTransaction({
          phone: extractedPhone,
          amount: extractedAmount,
          wallet: 'jawwal',
          source: 'notification',
          notificationText: body,
        });

        Alert.alert(
          '✓ تم تسجيل المعاملة',
          `تم تسجيل تحويل من جوال باي\nالمبلغ: ${extractedAmount}\nالرقم: ${extractedPhone}`,
          [{ text: 'حسناً' }]
        );
      }
    }
  };

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('transactions');
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('خطأ في تحميل السجل:', error);
    }
  };

  const saveTransactions = async (newTransactions) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('خطأ في حفظ السجل:', error);
    }
  };

  const addTransaction = async (transaction) => {
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      timestamp: new Date().toISOString(),
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    await saveTransactions(updated);
  };

  const deleteTransaction = async (id) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await saveTransactions(updated);
  };

  const clearHistory = () => {
    Alert.alert(
      'تأكيد',
      'هل تريد حذف جميع المعاملات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            setTransactions([]);
            await saveTransactions([]);
          },
        },
      ]
    );
  };

  const validatePhone = (phone) => {
    if (!phone) return '';
    if (!/^[0-9]{7,15}$/.test(phone)) {
      return 'رقم الهاتف يجب أن يكون بين 7 و 15 رقم';
    }
    return '';
  };

  const validateAmount = (amt) => {
    if (!amt) return '';
    if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(amt)) {
      return 'المبلغ يجب أن يكون رقماً موجباً';
    }
    const numAmount = parseFloat(amt);
    if (numAmount <= 0) {
      return 'المبلغ يجب أن يكون أكبر من صفر';
    }
    if (numAmount > 999999) {
      return 'المبلغ يجب أن لا يتجاوز 999,999';
    }
    return '';
  };

  const generateCode = () => {
    const phoneErr = validatePhone(phoneNumber);
    const amountErr = validateAmount(amount);

    setPhoneError(phoneErr);
    setAmountError(amountErr);

    if (!phoneErr && !amountErr && phoneNumber && amount) {
      const wallet = WALLETS[selectedWallet];
      const code = `${wallet.code}${phoneNumber}*${amount}#`;
      setGeneratedCode(code);
    } else {
      setGeneratedCode('');
    }
  };

  const copyCode = async () => {
    if (generatedCode) {
      await Clipboard.setString(generatedCode);
      setIsCopied(true);
      Alert.alert('نجح', '✓ تم نسخ الكود بنجاح!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const shareCode = async () => {
    if (generatedCode) {
      try {
        await Share.share({
          message: `كود التحويل: ${generatedCode}`,
          title: 'USSD Code',
        });
      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء المشاركة');
      }
    }
  };

  const recordTransaction = async () => {
    if (!phoneNumber || !amount) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف والمبلغ');
      return;
    }

    const phoneErr = validatePhone(phoneNumber);
    const amountErr = validateAmount(amount);

    if (phoneErr || amountErr) {
      Alert.alert('خطأ', 'يرجى التحقق من البيانات المدخلة');
      return;
    }

    await addTransaction({
      phone: phoneNumber,
      amount: amount,
      wallet: selectedWallet,
      code: generatedCode,
      source: 'manual',
    });

    Alert.alert('نجح', 'تم تسجيل المعاملة بنجاح');
    setPhoneNumber('');
    setAmount('');
    setGeneratedCode('');
  };

  React.useEffect(() => {
    generateCode();
  }, [phoneNumber, amount, selectedWallet]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALPAY_COLORS.primary} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={40}
                color={PALPAY_COLORS.background}
              />
            </View>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={PALPAY_COLORS.background}
              />
              {transactions.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {transactions.length > 99 ? '99+' : transactions.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>USSD Generator</Text>
          <Text style={styles.subtitle}>توليد أكواد التحويل الموحدة</Text>
        </View>

        {/* Wallet Selector */}
        <View style={styles.walletSelector}>
          {Object.entries(WALLETS).map(([key, wallet]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.walletButton,
                selectedWallet === key && styles.walletButtonActive,
              ]}
              onPress={() => setSelectedWallet(key)}
            >
              <MaterialCommunityIcons
                name={wallet.icon}
                size={20}
                color={selectedWallet === key ? PALPAY_COLORS.background : wallet.color}
              />
              <Text
                style={[
                  styles.walletButtonText,
                  selectedWallet === key && styles.walletButtonTextActive,
                ]}
              >
                {wallet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Phone Input */}
          <View style={styles.section}>
            <Text style={styles.label}>رقم المستقبل</Text>
            <TextInput
              style={[styles.input, phoneError ? styles.inputError : null]}
              placeholder="مثال: 201001234567"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : (
              <Text style={styles.helperText}>أدخل رقم الهاتف الكامل</Text>
            )}
          </View>

          {/* Amount Input */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={[styles.input, amountError ? styles.inputError : null]}
              placeholder="مثال: 100"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : (
              <Text style={styles.helperText}>أدخل المبلغ المراد تحويله</Text>
            )}
          </View>

          {/* Generated Code */}
          {generatedCode && (
            <View style={styles.codeSection}>
              <View style={styles.successHeader}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={PALPAY_COLORS.success}
                />
                <Text style={styles.successText}>كود التحويل الموحد</Text>
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.codeText} selectable={true}>
                  {generatedCode}
                </Text>
                <TouchableOpacity onPress={copyCode}>
                  <MaterialCommunityIcons
                    name={isCopied ? 'check' : 'content-copy'}
                    size={24}
                    color={isCopied ? PALPAY_COLORS.success : PALPAY_COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, !generatedCode && styles.disabledButton]}
              onPress={copyCode}
              disabled={!generatedCode}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color="#FFF" />
              <Text style={styles.buttonText}>نسخ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, !generatedCode && styles.disabledButton]}
              onPress={shareCode}
              disabled={!generatedCode}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
              <Text style={styles.buttonText}>مشاركة</Text>
            </TouchableOpacity>
          </View>

          {/* Record Transaction Button */}
          <TouchableOpacity
            style={[styles.button, styles.recordButton, (!phoneNumber || !amount) && styles.disabledButton]}
            onPress={recordTransaction}
            disabled={!phoneNumber || !amount}
          >
            <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
            <Text style={styles.buttonText}>تسجيل المعاملة</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 USSD Generator</Text>
        </View>
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <MaterialCommunityIcons name="close" size={28} color={PALPAY_COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>سجل الحركات</Text>
            <TouchableOpacity onPress={clearHistory}>
              <MaterialCommunityIcons name="delete-sweep" size={28} color={PALPAY_COLORS.error} />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={64} color={PALPAY_COLORS.lightGray} />
              <Text style={styles.emptyStateText}>لا توجد معاملات مسجلة</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TransactionItem transaction={item} onDelete={() => deleteTransaction(item.id)} />
              )}
              contentContainerStyle={styles.transactionList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function TransactionItem({ transaction, onDelete }) {
  const wallet = WALLETS[transaction.wallet];
  const isAutomatic = transaction.source === 'notification';

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: wallet.color + '20' }]}>
          <MaterialCommunityIcons name={wallet.icon} size={24} color={wallet.color} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionWallet}>{wallet.name}</Text>
          <Text style={styles.transactionPhone}>{transaction.phone}</Text>
          <Text style={styles.transactionTime}>
            {new Date(transaction.timestamp).toLocaleString('ar-SA')}
          </Text>
          {isAutomatic && (
            <View style={styles.automaticBadge}>
              <MaterialCommunityIcons name="bell" size={12} color={PALPAY_COLORS.warning} />
              <Text style={styles.automaticBadgeText}>تسجيل تلقائي</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>{transaction.amount}</Text>
        <TouchableOpacity onPress={onDelete}>
          <MaterialCommunityIcons name="delete" size={20} color={PALPAY_COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALPAY_COLORS.background },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { paddingVertical: 24, paddingHorizontal: 16, borderRadius: 16, marginTop: 16, marginBottom: 16, backgroundColor: PALPAY_COLORS.primary },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: PALPAY_COLORS.background, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  historyButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: PALPAY_COLORS.secondary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -8, backgroundColor: PALPAY_COLORS.error, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: PALPAY_COLORS.background, fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: PALPAY_COLORS.background, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: PALPAY_COLORS.background, textAlign: 'center', opacity: 0.9 },
  walletSelector: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  walletButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: PALPAY_COLORS.lightGray, borderWidth: 2, borderColor: 'transparent', gap: 8 },
  walletButtonActive: { backgroundColor: PALPAY_COLORS.primary, borderColor: PALPAY_COLORS.primary },
  walletButtonText: { fontSize: 14, fontWeight: '600', color: PALPAY_COLORS.text },
  walletButtonTextActive: { color: PALPAY_COLORS.background },
  card: { backgroundColor: PALPAY_COLORS.background, borderRadius: 16, padding: 20, marginBottom: 24, elevation: 5 },
  section: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', color: PALPAY_COLORS.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: PALPAY_COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: PALPAY_COLORS.text, backgroundColor: PALPAY_COLORS.lightGray },
  inputError: { borderColor: PALPAY_COLORS.error, backgroundColor: PALPAY_COLORS.error + '10' },
  errorText: { color: PALPAY_COLORS.error, fontSize: 12, marginTop: 4 },
  helperText: { color: '#999', fontSize: 12, marginTop: 4 },
  codeSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: PALPAY_COLORS.border },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  successText: { fontSize: 14, fontWeight: '600', color: PALPAY_COLORS.success },
  codeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: PALPAY_COLORS.lightGray, borderRadius: 12, borderWidth: 1, borderColor: PALPAY_COLORS.border },
  codeText: { fontSize: 16, fontWeight: 'bold', color: PALPAY_COLORS.text, flex: 1 },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  primaryButton: { backgroundColor: PALPAY_COLORS.primary },
  secondaryButton: { backgroundColor: PALPAY_COLORS.secondary },
  recordButton: { backgroundColor: PALPAY_COLORS.success, marginTop: 12 },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: PALPAY_COLORS.background, fontSize: 14, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: PALPAY_COLORS.border },
  footerText: { fontSize: 12, color: '#999', marginVertical: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALPAY_COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: PALPAY_COLORS.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyStateText: { fontSize: 16, color: '#999' },
  transactionList: { paddingHorizontal: 16, paddingVertical: 12 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: PALPAY_COLORS.lightGray, borderRadius: 12, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  transactionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1 },
  transactionWallet: { fontSize: 14, fontWeight: '600', color: PALPAY_COLORS.text },
  transactionPhone: { fontSize: 12, color: '#666', marginTop: 2 },
  transactionTime: { fontSize: 11, color: '#999', marginTop: 2 },
  automaticBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: PALPAY_COLORS.warning + '20', borderRadius: 6, alignSelf: 'flex-start' },
  automaticBadgeText: { fontSize: 10, color: PALPAY_COLORS.warning, fontWeight: '600' },
  transactionRight: { alignItems: 'flex-end', gap: 8 },
  transactionAmount: { fontSize: 14, fontWeight: 'bold', color: PALPAY_COLORS.primary },
});
