import React, { useState, useEffect } from 'react';
import { Home, ClipboardList, Calculator, PieChart, Settings as SettingsIcon, Lock } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import CalculatorTab from './components/CalculatorTab';
import Report from './components/Report';
import Settings from './components/Settings';
import TransactionForm from './components/TransactionForm';
import AuthScreen from './components/AuthScreen';

import { 
  getStoredTransactions, 
  saveStoredTransactions, 
  getStoredCategories,
  getCurrentUser,
  logoutUser
} from './utils/storage';

export default function App() {
  // App States
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'history', 'calculator', 'report', 'settings'
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({
    borrowed: 'আমি ধার নিয়েছি',
    receivable: 'আমি পাবো',
    expense: 'ক্রয় / খরচ',
    owed: 'বাকি / বকেয়া'
  });
  const [initialSubTab, setInitialSubTab] = useState('all');
  const [initialStatusFilter, setInitialStatusFilter] = useState('all');
  const [initialCategoryFilter, setInitialCategoryFilter] = useState('all');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  // Load user session on start
  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully', reg.scope))
          .catch((err) => console.error('Service Worker registration failed', err));
      });
    }

    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setTransactions(getStoredTransactions(user.username));
      setCategories(getStoredCategories(user.username));
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setTransactions(getStoredTransactions(user.username));
    setCategories(getStoredCategories(user.username));
    setActiveTab('home');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setTransactions([]);
  };

  // Save transaction (Adding / Editing)
  const handleSaveTransaction = (payload) => {
    if (!currentUser) return;
    
    let updatedTxs = [];
    const isEdit = transactions.some(t => t.id === payload.id);
    
    if (isEdit) {
      updatedTxs = transactions.map(t => t.id === payload.id ? payload : t);
    } else {
      updatedTxs = [...transactions, payload];
    }
    
    updatedTxs.sort((a, b) => a.serial - b.serial);
    
    setTransactions(updatedTxs);
    saveStoredTransactions(updatedTxs, currentUser.username);
    setIsFormOpen(false);
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = (id) => {
    if (!currentUser) return;
    const updatedTxs = transactions.filter(t => t.id !== id);
    setTransactions(updatedTxs);
    saveStoredTransactions(updatedTxs, currentUser.username);
  };

  const handleRestoreSuccess = (newTransactions, newCategories) => {
    setTransactions(newTransactions);
    setCategories(newCategories);
  };

  const handleClearAllData = () => {
    setTransactions([]);
    setCategories({
      borrowed: 'আমি ধার নিয়েছি',
      receivable: 'আমি পাবো',
      expense: 'ক্রয় / খরচ',
      owed: 'বাকি / বকেয়া'
    });
  };

  const handleViewSubTab = (subTabKey, statusFilterKey = 'all', categoryFilterKey = 'all') => {
    if (['borrowed', 'receivable', 'expense', 'owed'].includes(subTabKey)) {
      if (subTabKey === 'borrowed' || subTabKey === 'owed') {
        setInitialSubTab('i_owe');
        setInitialCategoryFilter(subTabKey);
        setInitialStatusFilter('all');
      } else if (subTabKey === 'receivable') {
        setInitialSubTab('they_owe');
        setInitialCategoryFilter('all');
        setInitialStatusFilter('all');
      } else if (subTabKey === 'expense') {
        setInitialSubTab('expense');
        setInitialCategoryFilter('all');
        setInitialStatusFilter('all');
      }
    } else {
      if (subTabKey === 'all_pending') {
        setInitialSubTab('all');
        setInitialStatusFilter('pending');
        setInitialCategoryFilter('all');
      } else if (subTabKey === 'all_partial') {
        setInitialSubTab('all');
        setInitialStatusFilter('partial');
        setInitialCategoryFilter('all');
      } else {
        setInitialSubTab(subTabKey);
        setInitialStatusFilter(statusFilterKey);
        setInitialCategoryFilter(categoryFilterKey);
      }
    }
    setActiveTab('history');
  };

  const handleAddWithAmount = (amount) => {
    setTransactionToEdit({ id: 'prefill-' + Date.now(), amount: amount });
    setIsFormOpen(true);
  };

  // If not logged in, render the Auth/PIN Lock screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            transactions={transactions}
            categories={categories}
            onAddClick={() => {
              setTransactionToEdit(null);
              setIsFormOpen(true);
            }}
            onViewSubTab={handleViewSubTab}
          />
        );
      case 'history':
        return (
          <TransactionHistory
            transactions={transactions}
            categories={categories}
            onEdit={(tx) => {
              setTransactionToEdit(tx);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteTransaction}
            onUpdate={handleSaveTransaction}
            initialSubTab={initialSubTab}
            initialStatusFilter={initialStatusFilter}
            initialCategoryFilter={initialCategoryFilter}
          />
        );
      case 'calculator':
        return (
          <CalculatorTab
            onAddWithAmount={handleAddWithAmount}
          />
        );
      case 'report':
        return (
          <Report
            transactions={transactions}
            categories={categories}
          />
        );
      case 'settings':
        return (
          <Settings
            categories={categories}
            onRestoreSuccess={handleRestoreSuccess}
            onClearAllData={handleClearAllData}
            currentUser={currentUser}
            onLogout={handleLogout}
            onProfileUpdate={handleLoginSuccess}
          />
        );
      default:
        return null;
    }
  };

  // Next serial
  const nextSerial = transactions.length > 0 
    ? Math.max(...transactions.map(t => t.serial)) + 1 
    : 1;

  return (
    <div className="app-container">
      {/* App Header with lock button and profile label */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <div>
          <h1 className="header-title" style={{ margin: 0, fontSize: '24px' }}>হিসাবের খাতা</h1>
          <p className="header-subtitle" style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            👤 {currentUser.name}
          </p>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.15)', 
            border: 'none', 
            borderRadius: '12px', 
            width: '40px',
            height: '40px',
            color: '#fff', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            outline: 'none'
          }}
          title="প্রোফাইল লক করুন"
          className="header-lock-btn"
        >
          <Lock size={18} />
        </button>
      </header>

      {/* Content Area */}
      {renderTabContent()}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('home');
            setInitialSubTab('all');
            setInitialStatusFilter('all');
            setInitialCategoryFilter('all');
          }}
        >
          <Home size={20} />
          হোম
        </button>
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            setInitialSubTab('all');
            setInitialStatusFilter('all');
            setInitialCategoryFilter('all');
          }}
        >
          <ClipboardList size={20} />
          হিসাব
        </button>
        <button 
          className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={20} />
          ক্যালকুলেটর
        </button>
        <button 
          className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <PieChart size={20} />
          রিপোর্ট
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={20} />
          সেটিংস
        </button>
      </nav>

      {/* Transaction Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTransactionToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        categories={categories}
        nextSerial={nextSerial}
      />
    </div>
  );
}

