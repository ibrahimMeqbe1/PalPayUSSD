import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PALPAY_COLORS = {
  primary: '#E91E8C',
  secondary: '#9C27B0',
  accent: '#FF9500',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
  success: '#4CAF50',
};

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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
      const code = `*370*1*1*${phoneNumber}*${amount}#`;
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
          message: `كود التحويل: ${generatedCode}\n\nتم توليده باستخدام PalPay USSD Generator`,
          title: 'PalPay USSD Code',
        });
      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء المشاركة');
      }
    }
  };

  React.useEffect(() => {
    generateCode();
  }, [phoneNumber, amount]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALPAY_COLORS.primary} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={40}
              color={PALPAY_COLORS.primary}
            />
          </View>
          <Text style={styles.title}>PalPay USSD Generator</Text>
          <Text style={styles.subtitle}>
            أسرع وأسهل طريقة لتوليد أكواد التحويل الموحدة
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Phone Input */}
          <View style={styles.section}>
            <Text style={styles.label}>رقم المستقبل</Text>
            <TextInput
              style={[
                styles.input,
                phoneError ? styles.inputError : null,
              ]}
              placeholder="مثال: 201001234567"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={true}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : (
              <Text style={styles.helperText}>أدخل رقم الهاتف الكامل (7-15 رقم)</Text>
            )}
          </View>

          {/* Amount Input */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={[
                styles.input,
                amountError ? styles.inputError : null,
              ]}
              placeholder="مثال: 100"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={true}
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
                <Text
                  style={styles.codeText}
                  selectable={true}
                >
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
              style={[
                styles.button,
                styles.primaryButton,
                !generatedCode && styles.disabledButton,
              ]}
              onPress={copyCode}
              disabled={!generatedCode}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
                color="#FFF"
              />
              <Text style={styles.buttonText}>نسخ الكود</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                !generatedCode && styles.disabledButton,
              ]}
              onPress={shareCode}
              disabled={!generatedCode}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color="#FFF"
              />
              <Text style={styles.buttonText}>مشاركة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>مميزات التطبيق</Text>

          <FeatureCard
            icon="lightning-bolt"
            title="تحويل سريع"
            description="توليد أكواد USSD في ثوانٍ معدودة"
          />

          <FeatureCard
            icon="cloud-off"
            title="بدون إنترنت"
            description="التطبيق يعمل بشكل كامل بدون اتصال إنترنت"
          />

          <FeatureCard
            icon="touch"
            title="سهل الاستخدام"
            description="واجهة بسيطة وسهلة لا تتطلب أي خبرة تقنية"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 PalPay USSD Generator
          </Text>
          <Text style={styles.footerText}>
            تم تطويره بواسطة Eng: Ibrahim Meqbel
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={PALPAY_COLORS.primary}
        />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALPAY_COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
    background: `linear-gradient(135deg, ${PALPAY_COLORS.primary}, ${PALPAY_COLORS.secondary}, ${PALPAY_COLORS.accent})`,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALPAY_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PALPAY_COLORS.background,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PALPAY_COLORS.background,
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    backgroundColor: PALPAY_COLORS.background,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: PALPAY_COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: PALPAY_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: PALPAY_COLORS.text,
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  codeSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PALPAY_COLORS.border,
  },
  successHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALPAY_COLORS.text,
    marginRight: 8,
  },
  codeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: PALPAY_COLORS.lightGray,
    borderWidth: 1,
    borderColor: PALPAY_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Courier New',
    color: PALPAY_COLORS.text,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: PALPAY_COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: PALPAY_COLORS.accent,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALPAY_COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  featureCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: PALPAY_COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: `${PALPAY_COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALPAY_COLORS.text,
    marginBottom: 4,
    textAlign: 'right',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: PALPAY_COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 4,
  },
});
