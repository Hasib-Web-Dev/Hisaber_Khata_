import React from 'react';
import { TrendingDown, CheckCircle } from 'lucide-react';
import { formatBanglaCurrency, toBanglaDigits } from '../utils/bengali';

export default function Report({ transactions, categories }) {
  const getStats = () => {
    let totalBorrowed = 0;
    let totalReceivable = 0;
    let totalExpense = 0;
    let totalOwed = 0;
    
    let countBorrowed = 0;
    let countReceivable = 0;
    let countExpense = 0;
    let countOwed = 0;

    let totalPaid = 0;
    let totalPending = 0;
    
    let countPaid = 0;
    let countPartial = 0;
    let countPending = 0;

    transactions.forEach(tx => {
      const amt = tx.amount;
      const paid = tx.paidAmount || 0;
      const pending = tx.pendingAmount || 0;
      const type = tx.categoryType;
      const status = tx.status || 'paid';

      // Category totals
      if (type === 'borrowed') {
        totalBorrowed += amt;
        countBorrowed++;
      } else if (type === 'receivable') {
        totalReceivable += amt;
        countReceivable++;
      } else if (type === 'expense') {
        totalExpense += amt;
        countExpense++;
      } else if (type === 'owed') {
        totalOwed += amt;
        countOwed++;
      }

      // Status aggregations
      totalPaid += paid;
      totalPending += pending;

      if (status === 'paid') countPaid++;
      else if (status === 'partial') countPartial++;
      else countPending++;
    });

    const totalVolume = totalBorrowed + totalReceivable + totalExpense + totalOwed;
    const countTotal = transactions.length;
    const averageTx = countTotal > 0 ? (totalVolume / countTotal) : 0;

    // Percentages
    const borrowedPercent = totalVolume > 0 ? Math.round((totalBorrowed / totalVolume) * 100) : 0;
    const receivablePercent = totalVolume > 0 ? Math.round((totalReceivable / totalVolume) * 100) : 0;
    const expensePercent = totalVolume > 0 ? Math.round((totalExpense / totalVolume) * 100) : 0;
    const owedPercent = totalVolume > 0 ? Math.round((totalOwed / totalVolume) * 100) : 0;

    // Settled ratio: totalPaid relative to totalVolume
    const settledRatioPercent = totalVolume > 0 ? Math.round((totalPaid / totalVolume) * 100) : 0;

    return {
      totalBorrowed,
      totalReceivable,
      totalExpense,
      totalOwed,
      countBorrowed,
      countReceivable,
      countExpense,
      countOwed,
      totalPaid,
      totalPending,
      countPaid,
      countPartial,
      countPending,
      countTotal,
      averageTx,
      borrowedPercent,
      receivablePercent,
      expensePercent,
      owedPercent,
      settledRatioPercent
    };
  };

  const stats = getStats();

  // SVG Gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.settledRatioPercent / 100) * circumference;

  return (
    <div className="content-area" style={{ paddingBottom: '40px' }}>
      <h2 className="section-title" style={{ marginTop: 0 }}>হিসাব রিপোর্ট ও পরিসংখ্যান</h2>

      {/* Main KPI Stats */}
      <div className="stats-summary">
        {/* Total Paid */}
        <div className="summary-card" style={{ borderLeft: '4px solid #10b981', minHeight: '80px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="summary-label">মোট পরিশোধিত টাকা</div>
            <div className="summary-value" style={{ color: '#10b981' }}>{formatBanglaCurrency(stats.totalPaid)}</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '12px', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Total Pending */}
        <div className="summary-card" style={{ borderLeft: '4px solid var(--expense-color)', minHeight: '80px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="summary-label">মোট বকেয়া / অপরিশোধিত</div>
            <div className="summary-value" style={{ color: 'var(--expense-color)' }}>{formatBanglaCurrency(stats.totalPending)}</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--expense-bg)', borderRadius: '12px', color: 'var(--expense-color)' }}>
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Settled Ratio Circle Meter */}
      <div className="stats-bar-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px', padding: '24px 16px' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>মোট পরিশোধ বনাম বকেয়া অনুপাত</span>
        
        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
          <svg width="130" height="130" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--bg-input)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: '700' }}>
              {toBanglaDigits(stats.settledRatioPercent)}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>পরিশোধিত</span>
          </div>
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px' }}>
          আপনার মোট হিসাব ভলিউমের মধ্যে {toBanglaDigits(stats.settledRatioPercent)}% টাকা ইতোমধ্যে লেনদেন সম্পন্ন হয়েছে।
        </p>
      </div>

      {/* Distribution Progress Bars (4 Categories) */}
      <div className="stats-bar-container" style={{ marginBottom: '20px' }}>
        <div className="stats-bar-title">
          <span>ক্যাটাগরি ভিত্তিক হিসাব বন্টন অনুপাত</span>
          <span>শতকরা হার (%)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {/* Borrowed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>
              <span>{categories.borrowed}</span>
              <span style={{ color: 'var(--expense-color)' }}>{toBanglaDigits(stats.borrowedPercent)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stats.borrowedPercent}%`, backgroundColor: 'var(--expense-color)' }} />
            </div>
          </div>

          {/* Receivable */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>
              <span>{categories.receivable}</span>
              <span style={{ color: 'var(--income-color)' }}>{toBanglaDigits(stats.receivablePercent)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stats.receivablePercent}%`, backgroundColor: 'var(--income-color)' }} />
            </div>
          </div>

          {/* Expense */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>
              <span>{categories.expense}</span>
              <span style={{ color: '#3b82f6' }}>{toBanglaDigits(stats.expensePercent)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stats.expensePercent}%`, backgroundColor: '#3b82f6' }} />
            </div>
          </div>

          {/* Owed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>
              <span>{categories.owed}</span>
              <span style={{ color: 'var(--due-color)' }}>{toBanglaDigits(stats.owedPercent)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stats.owedPercent}%`, backgroundColor: 'var(--due-color)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="stats-bar-container">
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '12px' }}>লেনদেনের বিবরণী পরিসংখ্যান</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>মোট হিসাব এন্ট্রি:</span>
            <span style={{ fontWeight: '600' }}>{toBanglaDigits(stats.countTotal)} টি</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>আমি ধার নিয়েছি (এন্ট্রি সংখ্যা):</span>
            <span style={{ fontWeight: '600', color: 'var(--expense-color)' }}>{toBanglaDigits(stats.countBorrowed)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>আমি পাবো / পাওনা এন্ট্রি:</span>
            <span style={{ fontWeight: '600', color: 'var(--income-color)' }}>{toBanglaDigits(stats.countReceivable)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>ক্রয় / খরচ এন্ট্রি:</span>
            <span style={{ fontWeight: '600', color: '#3b82f6' }}>{toBanglaDigits(stats.countExpense)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>বাকি / বকেয়া এন্ট্রি:</span>
            <span style={{ fontWeight: '600', color: 'var(--due-color)' }}>{toBanglaDigits(stats.countOwed)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>সম্পূর্ণ পরিশোধিত লেনদেন:</span>
            <span style={{ fontWeight: '600', color: '#10b981' }}>{toBanglaDigits(stats.countPaid)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>আংশিক পরিশোধিত বকেয়া:</span>
            <span style={{ fontWeight: '600', color: 'var(--due-color)' }}>{toBanglaDigits(stats.countPartial)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>পরিশোধহীন বাকি (Unpaid) এন্ট্রি:</span>
            <span style={{ fontWeight: '600', color: 'var(--expense-color)' }}>{toBanglaDigits(stats.countPending)} টি</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>গড় লেনদেন অ্যামাউন্ট:</span>
            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatBanglaCurrency(stats.averageTx)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
