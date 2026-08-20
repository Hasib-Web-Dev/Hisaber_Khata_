const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Converts English digits and characters to Bangla digits
 */
export const toBanglaDigits = (num) => {
  if (num === null || num === undefined) return '';
  return num.toString().split('').map(char => {
    const digit = parseInt(char, 10);
    if (!isNaN(digit)) {
      return BANGLA_DIGITS[digit];
    }
    return char;
  }).join('');
};

/**
 * Converts Bangla digits in a string to English digits
 */
export const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return '';
  return str.toString().split('').map(char => {
    if (ENGLISH_DIGITS[char] !== undefined) {
      return ENGLISH_DIGITS[char];
    }
    return char;
  }).join('');
};

/**
 * Parses a string containing Bangla or English numbers into a float
 */
export const parseBanglaFloat = (str) => {
  if (!str) return 0;
  const englishStr = toEnglishDigits(str);
  // Remove non-numeric symbols except decimal points and minus signs
  const cleaned = englishStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
};

const BANGLA_MONTHS = {
  '01': 'জানুয়ারি',
  '02': 'ফেব্রুয়ারি',
  '03': 'মার্চ',
  '04': 'এপ্রিল',
  '05': 'মে',
  '06': 'জুন',
  '07': 'জুলাই',
  '08': 'আগস্ট',
  '09': 'সেপ্টেম্বর',
  '10': 'অক্টোবর',
  '11': 'নভেম্বর',
  '12': 'ডিসেম্বর'
};

/**
 * Formats a Date string (YYYY-MM-DD) into readable Bangla
 * Example: "2026-08-11" -> "১১ আগস্ট ২০২৬"
 */
export const formatBanglaDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return toBanglaDigits(dateStr);
  
  const year = parts[0];
  const month = parts[1];
  const day = parseInt(parts[2], 10);
  
  const banglaDay = toBanglaDigits(day);
  const banglaMonth = BANGLA_MONTHS[month] || month;
  const banglaYear = toBanglaDigits(year);
  
  return `${banglaDay} ${banglaMonth} ${banglaYear}`;
};

/**
 * Formats a 24-hour time string (HH:MM) into a readable 12-hour Bangla time
 * Example: "14:30" -> "০২:৩০ PM"
 */
export const formatBanglaTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length !== 2) return toBanglaDigits(timeStr);
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const displayHours = hours < 10 ? '0' + hours : hours.toString();
  
  return `${toBanglaDigits(displayHours)}:${toBanglaDigits(minutes)} ${ampm}`;
};

/**
 * Formats currency amount in Bangla (Indian format formatting)
 * Example: 25000 -> "৳২৫,০০০"
 */
export const formatBanglaCurrency = (amount) => {
  if (amount === undefined || amount === null) return '৳০';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Round to nearest integer (Taka only, no paisa)
  const integerAmount = Math.round(absAmount);
  let integerPart = integerAmount.toString();
  
  // Currency formatting with commas (e.g. 12,34,567)
  let formattedInteger = integerPart;
  if (integerPart.length > 3) {
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherParts = integerPart.substring(0, integerPart.length - 3);
    formattedInteger = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ',' + lastThree;
  }
  
  const banglaInteger = toBanglaDigits(formattedInteger);
  
  return `${isNegative ? '-' : ''}৳${banglaInteger}`;
};

/**
 * Pads and formats a serial number
 * Example: 5 -> "০০৫"
 */
export const padSerial = (serial) => {
  if (serial === undefined || serial === null) return '০০০';
  const num = parseInt(serial, 10);
  if (isNaN(num)) return toBanglaDigits(serial);
  
  const str = num.toString().padStart(3, '0');
  return toBanglaDigits(str);
};
