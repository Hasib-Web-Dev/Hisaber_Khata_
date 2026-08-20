import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, CheckCircle, AlertCircle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatBanglaCurrency, toBanglaDigits, formatBanglaDate, padSerial, parseBanglaFloat, formatBanglaTime } from '../utils/bengali';

export default function TransactionHistory({ 
  transactions, 
  categories, 
  onEdit, 
  onDelete, 
  onUpdate, 
  initialSubTab, 
  initialStatusFilter, 
  initialCategoryFilter 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tab state
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'i_owe', 'they_owe', 'expense', 'settled'
  
  // Filtering states (applicable for the 'All' tab)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all'); // 'all', 'borrowed', 'receivable', 'expense', 'owed'
  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // 'all', 'pending', 'partial', 'paid'
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Custom Confirmation Modals
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  
  // Quick Pay Modal State
  const [quickPayTx, setQuickPayTx] = useState(null);
  const [quickPayMode, setQuickPayMode] = useState('full'); // 'full', 'partial'
  const [quickPaidAmount, setQuickPaidAmount] = useState('');
  const [expandedPerson, setExpandedPerson] = useState(null);

  // Sync initial filters from Dashboard redirects
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    } else {
      setActiveSubTab('all');
    }
    
    if (initialStatusFilter) {
      setActiveStatusFilter(initialStatusFilter);
    } else {
      setActiveStatusFilter('all');
    }
    
    if (initialCategoryFilter) {
      setActiveCategoryFilter(initialCategoryFilter);
    } else {
      setActiveCategoryFilter('all');
    }
  }, [initialSubTab, initialStatusFilter, initialCategoryFilter]);

  // Filter transactions
  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      // 1. Sub-Tab segmentation
      if (activeSubTab === 'i_owe') {
        const isOweType = tx.categoryType === 'borrowed' || tx.categoryType === 'owed';
        const isUnsettled = tx.status !== 'paid';
        if (!isOweType || !isUnsettled) return false;
      } else if (activeSubTab === 'they_owe') {
        const isReceivableType = tx.categoryType === 'receivable';
        const isUnsettled = tx.status !== 'paid';
        if (!isReceivableType || !isUnsettled) return false;
      } else if (activeSubTab === 'expense') {
        if (tx.categoryType !== 'expense') return false;
      } else if (activeSubTab === 'settled') {
        if (tx.status !== 'paid') return false;
      }

      // 2. Category Filter (for 'All' tab or general overrides)
      if (activeCategoryFilter !== 'all' && tx.categoryType !== activeCategoryFilter) {
        return false;
      }

      // 3. Status Filter (for 'All' tab or general overrides)
      if (activeStatusFilter !== 'all' && tx.status !== activeStatusFilter) {
        return false;
      }

      // 4. Search Term Filter (includes Person Name search)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        
        const descMatch = tx.description.toLowerCase().includes(query);
        const personMatch = tx.personName ? tx.personName.toLowerCase().includes(query) : false;
        const amtMatch = tx.amount.toString().includes(query) || 
                         formatBanglaCurrency(tx.amount).includes(query);
        const categoryName = categories[tx.categoryType] || '';
        const catMatch = categoryName.toLowerCase().includes(query);
        const formattedDate = formatBanglaDate(tx.date);
        const dateMatch = tx.date.includes(query) || formattedDate.toLowerCase().includes(query);
        
        if (!descMatch && !personMatch && !amtMatch && !catMatch && !dateMatch) {
          return false;
        }
      }

      // 5. Date Range Filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      const nameA = (a.personName || '').trim().toLowerCase();
      const nameB = (b.personName || '').trim().toLowerCase();
      if (nameA && !nameB) return -1;
      if (!nameA && nameB) return 1;
      if (nameA && nameB) {
        const nameCompare = nameA.localeCompare(nameB, 'bn');
        if (nameCompare !== 0) return nameCompare;
      }
      const dateA = a.date + 'T' + (a.time || '00:00');
      const dateB = b.date + 'T' + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    });
  };

  const filteredList = getFilteredTransactions();

  const getGroupedPersons = () => {
    const groups = {};

    transactions.forEach(tx => {
      if (!tx.personName || !tx.personName.trim()) return;
      const name = tx.personName.trim();
      const nameKey = name.toLowerCase();

      if (!groups[nameKey]) {
        groups[nameKey] = {
          name: name,
          receivablePending: 0,
          payablePending: 0,
          totalTransactions: 0
        };
      }

      groups[nameKey].totalTransactions += 1;
      
      const pending = tx.pendingAmount || 0;
      if (tx.categoryType === 'receivable') {
        groups[nameKey].receivablePending += pending;
      } else if (tx.categoryType === 'borrowed' || tx.categoryType === 'owed') {
        groups[nameKey].payablePending += pending;
      }
    });

    return Object.values(groups)
      .filter(p => {
        const hasDues = p.receivablePending > 0 || p.payablePending > 0;
        if (!hasDues) return false;
        
        if (searchTerm.trim()) {
          return p.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        const totalA = a.receivablePending + a.payablePending;
        const totalB = b.receivablePending + b.payablePending;
        return totalB - totalA;
      });
  };

  const personLedgerList = getGroupedPersons();

  // Status Badge Renderer
  const renderStatusBadge = (tx) => {
    if (tx.status === 'paid') {
      return <span className="tx-category-tag" style={{ backgroundColor: 'var(--income-bg)', color: 'var(--income-color)' }}>পরিশোধিত</span>;
    } else if (tx.status === 'partial') {
      return (
        <span className="tx-category-tag" style={{ backgroundColor: 'var(--due-bg)', color: 'var(--due-color)' }}>
          আংশিক (বাকি: {formatBanglaCurrency(tx.pendingAmount)})
        </span>
      );
    } else {
      return <span className="tx-category-tag" style={{ backgroundColor: 'var(--expense-bg)', color: 'var(--expense-color)' }}>বাকি (অপরিশোধিত)</span>;
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Quick Pay Handler
  const openQuickPay = (tx) => {
    setQuickPayTx(tx);
    setQuickPayMode('full');
    setQuickPaidAmount(tx.pendingAmount ? tx.pendingAmount.toString() : '');
  };

  const handleQuickPaySubmit = (e) => {
    e.preventDefault();
    if (!quickPayTx) return;

    let updatedTx = { ...quickPayTx };
    
    if (quickPayMode === 'full') {
      updatedTx.status = 'paid';
      updatedTx.paidAmount = quickPayTx.amount;
      updatedTx.pendingAmount = 0;
    } else {
      // Partial payment
      const additionalPaid = parseBanglaFloat(quickPaidAmount);
      if (isNaN(additionalPaid) || additionalPaid <= 0) {
        alert('অনুগ্রহ করে সঠিক পরিশোধের টাকা লিখুন!');
        return;
      }
      
      const previousPaid = quickPayTx.paidAmount || 0;
      const totalPaid = previousPaid + additionalPaid;

      if (totalPaid > quickPayTx.amount) {
        alert('পরিশোধিত টাকা মোট হিসাবের পরিমাণের চেয়ে বেশি হতে পারে না!');
        return;
      }

      updatedTx.paidAmount = totalPaid;
      updatedTx.pendingAmount = quickPayTx.amount - totalPaid;
      
      if (updatedTx.pendingAmount === 0) {
        updatedTx.status = 'paid';
      } else {
        updatedTx.status = 'partial';
      }
    }

    onUpdate(updatedTx);
    setQuickPayTx(null);
    alert('পরিশোধের তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  return (
    <div className="content-area">
      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'i_owe' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('i_owe');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          আমার দেনা (আমি দেবো)
        </button>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'they_owe' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('they_owe');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          আমার পাওনা (অন্যরা দেবে)
        </button>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'expense' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('expense');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          ক্রয় / খরচ
        </button>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'settled' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('settled');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          পরিশোধিত (সম্পন্ন)
        </button>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'person_ledger' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('person_ledger');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          ব্যক্তিভিত্তিক হিসাব
        </button>
        <button
          type="button"
          className={`filter-chip ${activeSubTab === 'all' ? 'active' : ''}`}
          style={{ borderRadius: '10px', padding: '8px 16px', flex: '1 0 auto', textAlign: 'center' }}
          onClick={() => {
            setActiveSubTab('all');
            setActiveCategoryFilter('all');
            setActiveStatusFilter('all');
          }}
        >
          সব হিসাব
        </button>
      </div>

      {/* Controls Container */}
      <div className="history-controls">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={activeSubTab === 'person_ledger' ? "ব্যক্তির নাম দিয়ে খুঁজুন..." : "হিসাব খুঁজুন (বিবরণ, টাকা, ব্যক্তি, তারিখ)..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Detailed Filters (Only shown when active sub-tab is 'All') */}
        {activeSubTab === 'all' && (
          <>
            {/* Category Filters */}
            <div className="filters-row">
              <button
                type="button"
                className={`filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('all')}
              >
                সব ক্যাটাগরি
              </button>
              <button
                type="button"
                className={`filter-chip ${activeCategoryFilter === 'borrowed' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('borrowed')}
              >
                {categories.borrowed}
              </button>
              <button
                type="button"
                className={`filter-chip ${activeCategoryFilter === 'receivable' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('receivable')}
              >
                {categories.receivable}
              </button>
              <button
                type="button"
                className={`filter-chip ${activeCategoryFilter === 'expense' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('expense')}
              >
                {categories.expense}
              </button>
              <button
                type="button"
                className={`filter-chip ${activeCategoryFilter === 'owed' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('owed')}
              >
                {categories.owed}
              </button>
            </div>

            {/* Status Filters */}
            <div className="filters-row" style={{ marginTop: '2px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <button
                type="button"
                className={`filter-chip ${activeStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveStatusFilter('all')}
              >
                সব স্ট্যাটাস
              </button>
              <button
                type="button"
                className={`filter-chip ${activeStatusFilter === 'pending' ? 'active' : ''}`}
                style={{ color: 'var(--expense-color)', borderColor: activeStatusFilter === 'pending' ? 'var(--expense-color)' : '' }}
                onClick={() => setActiveStatusFilter('pending')}
              >
                বাকি (অপরিশোধিত)
              </button>
              <button
                type="button"
                className={`filter-chip ${activeStatusFilter === 'partial' ? 'active' : ''}`}
                style={{ color: 'var(--due-color)', borderColor: activeStatusFilter === 'partial' ? 'var(--due-color)' : '' }}
                onClick={() => setActiveStatusFilter('partial')}
              >
                আংশিক পরিশোধিত
              </button>
              <button
                type="button"
                className={`filter-chip ${activeStatusFilter === 'paid' ? 'active' : ''}`}
                style={{ color: 'var(--income-color)', borderColor: activeStatusFilter === 'paid' ? 'var(--income-color)' : '' }}
                onClick={() => setActiveStatusFilter('paid')}
              >
                পরিশোধিত
              </button>
            </div>
          </>
        )}

        {/* Date Filters */}
        {activeSubTab !== 'person_ledger' && (
          <div className="date-filter-group">
            <div className="date-input-wrapper">
              <label>শুরুর তারিখ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-wrapper">
              <label>শেষ তারিখ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(startDate || endDate || searchTerm || activeCategoryFilter !== 'all' || activeStatusFilter !== 'all' || activeSubTab !== 'all') && (
          <button
            type="button"
            className="settings-action"
            style={{ fontSize: '12px', alignSelf: 'flex-end', marginTop: '-4px' }}
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSearchTerm('');
              setActiveCategoryFilter('all');
              setActiveStatusFilter('all');
              setActiveSubTab('all');
            }}
          >
            ফিল্টার রিসেট করুন
          </button>
        )}
      </div>

      {/* Transaction History List */}
      <div className="transaction-list" style={{ paddingBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
          <span>
            ফলাফল: {toBanglaDigits(activeSubTab === 'person_ledger' ? personLedgerList.length : filteredList.length)} টি {activeSubTab === 'person_ledger' ? 'ব্যক্তি' : 'হিসাব'}
          </span>
        </div>

        {activeSubTab === 'person_ledger' ? (
          personLedgerList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              বকেয়া বর্গের কোনো ব্যক্তি পাওয়া যায়নি
            </div>
          ) : (
            personLedgerList.map((p) => {
              const netBalance = p.receivablePending - p.payablePending;
              const firstLetter = p.name ? p.name.charAt(0).toUpperCase() : '👤';
              
              return (
                <div 
                  className="transaction-card" 
                  key={p.name.toLowerCase()}
                  style={{ 
                    borderLeft: netBalance > 0 ? '5px solid var(--income-color)' : netBalance < 0 ? '5px solid var(--expense-color)' : '5px solid var(--border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedPerson(expandedPerson === p.name.toLowerCase() ? null : p.name.toLowerCase())}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        backgroundColor: netBalance > 0 ? 'var(--income-bg)' : netBalance < 0 ? 'var(--expense-bg)' : 'var(--bg-input)', 
                        color: netBalance > 0 ? 'var(--income-color)' : netBalance < 0 ? 'var(--expense-color)' : 'var(--text-muted)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {firstLetter}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '17px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {p.name}
                          {expandedPerson === p.name.toLowerCase() ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>মোট হিসাব এন্ট্রি: {toBanglaDigits(p.totalTransactions)} টি (বিস্তারিত দেখতে ট্যাপ করুন)</div>
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', height: 'auto', flex: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm(p.name);
                        setActiveSubTab('all');
                      }}
                    >
                      হিসাব দেখুন
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', backgroundColor: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    {p.receivablePending > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>আমি পাবো: </span>
                        <strong style={{ color: 'var(--income-color)' }}>{formatBanglaCurrency(p.receivablePending)}</strong>
                      </div>
                    )}
                    {p.payablePending > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>আমি দেবো (দেনা): </span>
                        <strong style={{ color: 'var(--expense-color)' }}>{formatBanglaCurrency(p.payablePending)}</strong>
                      </div>
                    )}
                    
                    <div style={{ width: '100%', borderTop: '1px dashed var(--border)', margin: '4px 0' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>অবशिष्ट নেট ব্যালেন্স:</span>
                      {netBalance > 0 ? (
                        <span className="tx-category-tag" style={{ backgroundColor: 'var(--income-bg)', color: 'var(--income-color)', margin: 0, fontSize: '12px', fontWeight: 'bold' }}>
                          নেট পাওনা: {formatBanglaCurrency(netBalance)}
                        </span>
                      ) : netBalance < 0 ? (
                        <span className="tx-category-tag" style={{ backgroundColor: 'var(--expense-bg)', color: 'var(--expense-color)', margin: 0, fontSize: '12px', fontWeight: 'bold' }}>
                          নেট দেনা: {formatBanglaCurrency(Math.abs(netBalance))}
                        </span>
                      ) : (
                        <span className="tx-category-tag" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>
                          সমতা
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Transactions list of this person */}
                  {expandedPerson === p.name.toLowerCase() && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>লেনদেনের বিবরণী:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {transactions
                          .filter(tx => tx.personName && tx.personName.trim().toLowerCase() === p.name.toLowerCase() && tx.status !== 'paid')
                          .sort((a, b) => {
                            const dateA = a.date + 'T' + (a.time || '00:00');
                            const dateB = b.date + 'T' + (b.time || '00:00');
                            return dateB.localeCompare(dateA);
                          })
                          .map(tx => (
                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '1px 5px', borderRadius: '4px' }}>
                                    {toBanglaDigits(tx.serial.toString().padStart(3, '0'))}
                                  </span>
                                  <span style={{ fontWeight: '600', fontSize: '14px', textDecoration: tx.status === 'paid' ? 'line-through' : 'none' }}>
                                    {tx.description}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {formatBanglaDate(tx.date)} • {formatBanglaTime(tx.time)}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                  <span className="tx-category-tag" style={{ border: '1px solid var(--border)', fontSize: '10px', padding: '1px 6px', margin: 0 }}>
                                    {categories[tx.categoryType]}
                                  </span>
                                  <span className="tx-category-tag" style={{ 
                                    backgroundColor: tx.status === 'paid' ? 'var(--income-bg)' : tx.status === 'partial' ? 'var(--due-bg)' : 'var(--expense-bg)', 
                                    color: tx.status === 'paid' ? 'var(--income-color)' : tx.status === 'partial' ? 'var(--due-color)' : 'var(--expense-color)',
                                    fontSize: '10px', 
                                    padding: '1px 6px', 
                                    margin: 0 
                                  }}>
                                    {tx.status === 'paid' ? 'পরিশোধিত' : tx.status === 'partial' ? `আংশিক (বাকি: ${formatBanglaCurrency(tx.pendingAmount)})` : 'বাকি (অপরিশোধিত)'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <span style={{ fontWeight: '700', fontSize: '15px', color: tx.status === 'paid' ? 'var(--income-color)' : 'var(--text-main)' }}>
                                  {formatBanglaCurrency(tx.amount)}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button type="button" className="icon-button" style={{ padding: '2px' }} title="সংশোধন" onClick={(e) => { e.stopPropagation(); onEdit(tx); }}>
                                    <Edit size={14} />
                                  </button>
                                  <button type="button" className="icon-button" style={{ color: 'var(--expense-color)', padding: '2px' }} title="মুছুন" onClick={(e) => { e.stopPropagation(); setDeleteTargetId(tx.id); }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              কোন হিসাব পাওয়া যায়নি
            </div>
          ) : (
            filteredList.map((tx) => (
              <div 
                className="transaction-card" 
                key={tx.id}
                style={{ 
                  opacity: tx.status === 'paid' ? 0.75 : 1,
                  borderLeft: tx.status === 'paid' ? '5px solid var(--income-color)' : tx.status === 'partial' ? '5px solid var(--due-color)' : '5px solid var(--expense-color)',
                  transition: 'opacity 0.2s'
                }}
              >
                <div className="transaction-meta">
                  <div className="tx-header">
                    <span className="tx-serial">{padSerial(tx.serial)}</span>
                    <span className="tx-description" style={{ textDecoration: tx.status === 'paid' ? 'line-through' : 'none' }}>
                      {tx.description}
                    </span>
                  </div>
                  <div className="tx-details">
                    {formatBanglaDate(tx.date)} • {formatBanglaTime(tx.time)}
                    {tx.personName && ` • 👤 ${tx.personName}`}
                  </div>
                  {tx.note && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                      নোট: {tx.note}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className="tx-category-tag" style={{ border: `1px solid var(--border)` }}>
                      {categories[tx.categoryType]}
                    </span>
                    {renderStatusBadge(tx)}
                  </div>
                </div>

                <div className="transaction-right">
                  <div className="tx-amount" style={{ color: tx.status === 'paid' ? 'var(--income-color)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {formatBanglaCurrency(tx.amount)}
                    {tx.status === 'paid' && <CheckCircle size={16} color="var(--income-color)" />}
                  </div>
                  
                  {tx.status !== 'paid' && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', marginTop: '4px', flex: 'none', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => openQuickPay(tx)}
                    >
                      পরিশোধ করুন
                    </button>
                  )}

                  <div className="tx-actions" style={{ marginTop: '8px' }}>
                    <button type="button" className="icon-button" title="সংশোধন করুন" onClick={() => onEdit(tx)}>
                      <Edit size={16} />
                    </button>
                    <button type="button" className="icon-button" style={{ color: 'var(--expense-color)' }} title="মুছে ফেলুন" onClick={() => setDeleteTargetId(tx.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-overlay" style={{ alignItems: 'center' }} onClick={() => setDeleteTargetId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--expense-color)', marginBottom: '12px' }}>
              <AlertCircle size={48} />
            </div>
            <div className="confirm-title">আপনি কি নিশ্চিত?</div>
            <div className="confirm-text">আপনি কি এই হিসাবটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।</div>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTargetId(null)}>
                বাতিল
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pay Modal Popup */}
      {quickPayTx && (
        <div className="modal-overlay" style={{ alignItems: 'center' }} onClick={() => setQuickPayTx(null)}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '400px', borderRadius: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">পরিশোধ বিবরণী আপডেট</div>
              <button type="button" className="icon-button" onClick={() => setQuickPayTx(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleQuickPaySubmit}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{quickPayTx.description}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  মোট হিসাব: <strong>{formatBanglaCurrency(quickPayTx.amount)}</strong> | 
                  পরিশোধিত: <strong style={{ color: 'var(--income-color)' }}>{formatBanglaCurrency(quickPayTx.paidAmount || 0)}</strong> | 
                  বকেয়া: <strong style={{ color: 'var(--expense-color)' }}>{formatBanglaCurrency(quickPayTx.pendingAmount || 0)}</strong>
                </div>
              </div>

              {/* Mode Select */}
              <div className="form-group">
                <label className="form-label">পরিশোধের ধরণ</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn ${quickPayMode === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '10px' }}
                    onClick={() => setQuickPayMode('full')}
                  >
                    সম্পূর্ণ পরিশোধ
                  </button>
                  <button
                    type="button"
                    className={`btn ${quickPayMode === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '10px' }}
                    onClick={() => setQuickPayMode('partial')}
                  >
                    আংশিক পরিশোধ
                  </button>
                </div>
              </div>

              {/* Amount input if partial */}
              {quickPayMode === 'partial' && (
                <div className="form-group">
                  <label className="form-label">নতুন পরিশোধিত টাকার পরিমাণ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="যেমন: ৫০০"
                    value={quickPaidAmount}
                    onChange={(e) => setQuickPaidAmount(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * এটি আগের পরিশোধিত পরিমাণের সাথে যোগ হবে। সর্বোচ্চ বকেয়া বর্গের সমান হতে পারে।
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setQuickPayTx(null)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <RefreshCw size={16} /> আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
