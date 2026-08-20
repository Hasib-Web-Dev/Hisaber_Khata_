const TRANSACTIONS_KEY_PREFIX = 'hisaber_khata_transactions_';
const CATEGORIES_KEY_PREFIX = 'hisaber_khata_categories_';
const USERS_KEY = 'hisaber_khata_users';
const CURRENT_USER_KEY = 'hisaber_khata_current_user';

// Default categories (4 Categories)
const DEFAULT_CATEGORIES = {
  borrowed: 'আমি ধার নিয়েছি',
  receivable: 'আমি পাবো',
  expense: 'ক্রয় / খরচ',
  owed: 'বাকি / বকেয়া'
};

// Initial Mock Data (Empty for clean production state)
const SAMPLE_TRANSACTIONS = [];

// --- User Management Helpers ---

export const getStoredUsers = () => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveStoredUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUser = () => {
  const username = localStorage.getItem(CURRENT_USER_KEY);
  if (!username) return null;
  const users = getStoredUsers();
  return users.find(u => u.username === username) || null;
};

export const setCurrentUser = (username) => {
  localStorage.setItem(CURRENT_USER_KEY, username);
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Scoped Storage Helpers ---

export const getStoredCategories = (username) => {
  const activeUser = username || localStorage.getItem(CURRENT_USER_KEY);
  if (!activeUser) return DEFAULT_CATEGORIES;
  
  const key = CATEGORIES_KEY_PREFIX + activeUser;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveStoredCategories = (categories, username) => {
  const activeUser = username || localStorage.getItem(CURRENT_USER_KEY);
  if (!activeUser) return;
  
  const key = CATEGORIES_KEY_PREFIX + activeUser;
  localStorage.setItem(key, JSON.stringify(categories));
};

export const getStoredTransactions = (username) => {
  const activeUser = username || localStorage.getItem(CURRENT_USER_KEY);
  if (!activeUser) return SAMPLE_TRANSACTIONS;
  
  const key = TRANSACTIONS_KEY_PREFIX + activeUser;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(SAMPLE_TRANSACTIONS));
    return SAMPLE_TRANSACTIONS;
  }
  try {
    const parsed = JSON.parse(data);
    const cleaned = parsed.filter(tx => tx && tx.id && !tx.id.startsWith('sample-'));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return SAMPLE_TRANSACTIONS;
  }
};

export const saveStoredTransactions = (transactions, username) => {
  const activeUser = username || localStorage.getItem(CURRENT_USER_KEY);
  if (!activeUser) return;
  
  const key = TRANSACTIONS_KEY_PREFIX + activeUser;
  localStorage.setItem(key, JSON.stringify(transactions));
};

export const clearAllAppData = (username) => {
  const activeUser = username || localStorage.getItem(CURRENT_USER_KEY);
  if (!activeUser) return;
  
  localStorage.setItem(TRANSACTIONS_KEY_PREFIX + activeUser, JSON.stringify([]));
  localStorage.setItem(CATEGORIES_KEY_PREFIX + activeUser, JSON.stringify(DEFAULT_CATEGORIES));
};

// --- User Profile Summaries ---

export const getUserDuesSum = (username) => {
  const txs = getStoredTransactions(username);
  let iOwe = 0;
  let theyOwe = 0;
  txs.forEach(tx => {
    const pending = tx.pendingAmount || 0;
    const type = tx.categoryType;
    if (type === 'borrowed' || type === 'owed') {
      iOwe += pending;
    }
    if (type === 'receivable') {
      theyOwe += pending;
    }
  });
  return { iOwe, theyOwe, totalPending: iOwe + theyOwe };
};

// --- Legacy Data Migration ---

export const migrateLegacyData = (username) => {
  const legacyTxs = localStorage.getItem('hisaber_khata_transactions');
  const legacyCats = localStorage.getItem('hisaber_khata_categories');

  if (legacyTxs) {
    try {
      const parsed = JSON.parse(legacyTxs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(TRANSACTIONS_KEY_PREFIX + username, legacyTxs);
        console.log(`Successfully migrated ${parsed.length} legacy transactions to user: ${username}`);
      }
    } catch (e) {
      console.error('Failed to migrate legacy transactions', e);
    }
    localStorage.removeItem('hisaber_khata_transactions');
  }

  if (legacyCats) {
    try {
      const parsed = JSON.parse(legacyCats);
      if (parsed && typeof parsed === 'object') {
        localStorage.setItem(CATEGORIES_KEY_PREFIX + username, legacyCats);
        console.log(`Successfully migrated legacy categories to user: ${username}`);
      }
    } catch (e) {
      console.error('Failed to migrate legacy categories', e);
    }
    localStorage.removeItem('hisaber_khata_categories');
  }
};

// --- Backup & Restore Scoped ---

export const exportBackupData = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const categories = getStoredCategories(currentUser.username);
  const transactions = getStoredTransactions(currentUser.username);
  const backup = {
    app: 'Hisaber Khata',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    username: currentUser.username,
    name: currentUser.name,
    data: {
      categories,
      transactions
    }
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hisaber_khata_backup_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const restoreBackupData = (jsonString) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false, error: 'কোন প্রোফাইল লগইন করা নেই' };
  
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== 'Hisaber Khata' || !parsed.data) {
      throw new Error('অবৈধ ব্যাকআপ ফাইল');
    }
    
    const { categories, transactions } = parsed.data;
    if (!categories || !Array.isArray(transactions)) {
      throw new Error('অবৈধ ব্যাকআপ ডাটা ফরম্যাট');
    }
    
    saveStoredCategories(categories, currentUser.username);
    saveStoredTransactions(transactions, currentUser.username);
    return { success: true, categories, transactions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

