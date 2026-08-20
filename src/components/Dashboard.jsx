import React from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, Plus, ArrowRight, Wallet, HelpCircle, CheckCircle } from 'lucide-react';
import { formatBanglaCurrency, toBanglaDigits, formatBanglaDate, formatBanglaTime } from '../utils/bengali';

export default function Dashboard({ transactions, categories, onAddClick, onViewSubTab }) {
  // Calculations
  const getTotals = () => {
    let iOwe = 0; // borrowed + owed pendingAmount
    let theyOwe = 0; // receivable pendingAmount
    let totalPaid = 0; // all paidAmount
    let totalPending = 0; // all pendingAmount
    let totalPartial = 0; // pendingAmount of status === 'partial'
    
    let todayPaid = 0;
    let monthPaid = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    transactions.forEach(tx => {
      const paid = tx.paidAmount || 0;
      const pending = tx.pendingAmount || 0;
      const status = tx.status || 'paid';
      const type = tx.categoryType;

      // I Owe: borrowed & owed pending amounts
      if (type === 'borrowed' || type === 'owed') {
        iOwe += pending;
      }
      // They Owe Me: receivable pending amounts
      if (type === 'receivable') {
        theyOwe += pending;
      }

      totalPaid += paid;
      totalPending += pending;

      if (status === 'partial') {
        totalPartial += pending;
      }

      // Today/Month totals
      if (tx.date === todayStr) todayPaid += paid;
      if (tx.date.startsWith(currentMonthStr)) monthPaid += paid;
    });

    return {
      iOwe,
      theyOwe,
      totalPaid,
      totalPending,
      totalPartial,
      todayPaid,
      monthPaid
    };
  };

  const totals = getTotals();

  // Get category stats
  const getCategoryStats = (type) => {
    const filtered = transactions.filter(t => t.categoryType === type);
    const count = filtered.length;
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.date + 'T' + (a.time || '00:00');
      const dateB = b.date + 'T' + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    });
    
    const latest = sorted[0] ? `${sorted[0].description} (${formatBanglaCurrency(sorted[0].amount)})` : 'কোন হিসাব নেই';
    
    return { count, total, latest };
  };

  const categoryKeys = ['borrowed', 'receivable', 'expense', 'owed'];

  // Get recent 4 transactions, sorted by name to group same person together
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = a.date + 'T' + (a.time || '00:00');
      const dateB = b.date + 'T' + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    })
    .slice(0, 4)
    .sort((a, b) => {
      const nameA = (a.personName || '').trim().toLowerCase();
      const nameB = (b.personName || '').trim().toLowerCase();
      if (nameA && !nameB) return -1;
      if (!nameA && nameB) return 1;
      return nameA.localeCompare(nameB, 'bn');
    });

  // Status badge renderer
  const renderStatusBadge = (tx) => {
    if (tx.status === 'paid') {
      return <span className="tx-category-tag" style={{ backgroundColor: 'var(--income-bg)', color: 'var(--income-color)' }}>পরিশোধিত</span>;
    } else if (tx.status === 'partial') {
      return (
        <span className="tx-category-tag" style={{ backgroundColor: 'var(--due-bg)', color: 'var(--due-color)' }}>
          আংশিক পরিশোধিত (বাকি: {formatBanglaCurrency(tx.pendingAmount)})
        </span>
      );
    } else {
      return <span className="tx-category-tag" style={{ backgroundColor: 'var(--expense-bg)', color: 'var(--expense-color)' }}>বাকি (অপরিশোধিত)</span>;
    }
  };

  return (
    <div className="content-area">
      {/* Summary Cards */}
      <div className="summary-container">
        {/* মোট বকেয়া (Total Net Pending) */}
        <div 
          className="summary-card full-width" 
          style={{ background: 'linear-gradient(135deg, #0f766e, #115e59)', cursor: 'pointer' }}
          onClick={() => onViewSubTab('all_pending')}
          title="বাকি থাকা সকল হিসাব দেখতে ক্লিক করুন"
        >
          <div>
            <div className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={16} /> মোট বকেয়া / অপরিশোধিত
            </div>
            <div className="summary-value">{formatBanglaCurrency(totals.totalPending)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '12px', opacity: 0.95, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
            <span>আমার দেনা: <strong>{formatBanglaCurrency(totals.iOwe)}</strong></span>
            <span>আমার পাওনা: <strong>{formatBanglaCurrency(totals.theyOwe)}</strong></span>
          </div>
        </div>

        {/* আমার দেনা */}
        <div 
          className="summary-card" 
          style={{ borderLeft: '4px solid var(--expense-color)', cursor: 'pointer' }}
          onClick={() => onViewSubTab('i_owe')}
          title="দেনার তালিকা দেখতে ক্লিক করুন"
        >
          <div className="summary-label">আমি পাবো না / আমার দেনা</div>
          <div className="summary-value" style={{ color: 'var(--expense-color)' }}>
            {formatBanglaCurrency(totals.iOwe)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ধার ও বকেয়া ক্রয়ের বকেয়া</span>
        </div>

        {/* আমার পাওনা */}
        <div 
          className="summary-card" 
          style={{ borderLeft: '4px solid var(--income-color)', cursor: 'pointer' }}
          onClick={() => onViewSubTab('they_owe')}
          title="পাওনার তালিকা দেখতে ক্লিক করুন"
        >
          <div className="summary-label">আমার পাওনা (অন্যরা দেবে)</div>
          <div className="summary-value" style={{ color: 'var(--income-color)' }}>
            {formatBanglaCurrency(totals.theyOwe)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>প্রাপ্য ধারের বকেয়া</span>
        </div>

        {/* মোট পরিশোধিত */}
        <div 
          className="summary-card" 
          style={{ borderLeft: '4px solid #10b981', cursor: 'pointer' }}
          onClick={() => onViewSubTab('settled')}
          title="সম্পন্ন লেনদেন দেখতে ক্লিক করুন"
        >
          <div className="summary-label">মোট পরিশোধিত টাকা</div>
          <div className="summary-value" style={{ color: '#10b981' }}>
            {formatBanglaCurrency(totals.totalPaid)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>পরিশোধকৃত মোট টাকা</span>
        </div>

        {/* আংশিক পরিশোধিত */}
        <div 
          className="summary-card" 
          style={{ borderLeft: '4px solid var(--due-color)', cursor: 'pointer' }}
          onClick={() => onViewSubTab('all_partial')}
          title="আংশিক পরিশোধিত হিসাব দেখতে ক্লিক করুন"
        >
          <div className="summary-label">আংশিক পরিশোধিত বকেয়া</div>
          <div className="summary-value" style={{ color: 'var(--due-color)' }}>
            {formatBanglaCurrency(totals.totalPartial)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>চলতি আংশিক বকেয়া</span>
        </div>

        {/* আজকের পরিশোধিত */}
        <div className="summary-card">
          <div className="summary-label">আজকের জমা/পরিশোধ</div>
          <div className="summary-value" style={{ fontSize: '18px', color: 'var(--primary)' }}>
            {formatBanglaCurrency(totals.todayPaid)}
          </div>
        </div>

        {/* এই মাসের পরিশোধিত */}
        <div className="summary-card">
          <div className="summary-label">এই মাসের মোট পরিশোধ</div>
          <div className="summary-value" style={{ fontSize: '18px', color: 'var(--primary)' }}>
            {formatBanglaCurrency(totals.monthPaid)}
          </div>
        </div>
      </div>

      {/* Four Customizable Categories */}
      <h2 className="section-title">ক্যাটাগরি ভিত্তিক হিসাব</h2>
      <div className="categories-grid">
        {categoryKeys.map((key) => {
          const stats = getCategoryStats(key);
          // Set color scheme based on category
          let color = 'var(--primary)';
          let bgClass = 'owed';
          let IconComponent = HelpCircle;

          if (key === 'borrowed') {
            color = 'var(--expense-color)';
            bgClass = 'expense';
            IconComponent = ArrowDownRight;
          } else if (key === 'receivable') {
            color = 'var(--income-color)';
            bgClass = 'income';
            IconComponent = ArrowUpRight;
          } else if (key === 'expense') {
            color = '#3b82f6';
            bgClass = 'expense-blue';
            IconComponent = Wallet;
          } else if (key === 'owed') {
            color = 'var(--due-color)';
            bgClass = 'due';
            IconComponent = Clock;
          }

          return (
            <div className={`category-card ${bgClass}`} key={key} style={{ borderLeftColor: color }}>
              <div className="category-header">
                <div className="category-info">
                  <IconComponent color={color} size={22} />
                  <span className="category-title">{categories[key]}</span>
                </div>
                <div className="category-stats">
                  {toBanglaDigits(stats.count)} টি হিসাব
                </div>
              </div>
              <div className="category-body">
                <div className="category-amount" style={{ color: color }}>
                  {formatBanglaCurrency(stats.total)}
                </div>
              </div>
              <div className="category-footer">
                <span>সর্বশেষ: {stats.latest}</span>
                <button className="btn-view-all" onClick={() => onViewSubTab(key)}>
                  সব দেখুন <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '12px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>সাম্প্রতিক হিসাব</h2>
        <button className="btn-view-all" onClick={() => onViewSubTab('all')}>
          সব দেখুন <ArrowRight size={14} />
        </button>
      </div>

      <div className="transaction-list">
        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            কোন হিসাব যুক্ত করা হয়নি
          </div>
        ) : (
          recentTransactions.map((tx) => (
            <div className="transaction-card" key={tx.id} style={{ opacity: tx.status === 'paid' ? 0.85 : 1 }}>
              <div className="transaction-meta">
                <div className="tx-header">
                  <span className="tx-serial">{toBanglaDigits(tx.serial.toString().padStart(3, '0'))}</span>
                  <span className="tx-description" style={{ textDecoration: tx.status === 'paid' ? 'line-through' : 'none' }}>
                    {tx.description}
                  </span>
                </div>
                <div className="tx-details">
                  {formatBanglaDate(tx.date)} • {formatBanglaTime(tx.time)}
                  {tx.personName && ` • 👤 ${tx.personName}`}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span className="tx-category-tag" style={{ border: `1px solid var(--border)` }}>
                    {categories[tx.categoryType]}
                  </span>
                  {renderStatusBadge(tx)}
                </div>
              </div>
              <div className="transaction-right">
                <div className="tx-amount" style={{ color: tx.status === 'paid' ? '#10b981' : 'var(--text-main)' }}>
                  {formatBanglaCurrency(tx.amount)}
                </div>
                {tx.status === 'paid' && <CheckCircle size={16} color="#10b981" style={{ marginTop: '4px' }} />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={onAddClick}>
        <Plus size={20} /> হিসাব লিখুন
      </button>
    </div>
  );
}
