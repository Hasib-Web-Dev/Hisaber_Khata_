import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import CalculatorModal from './CalculatorModal';
import { padSerial, parseBanglaFloat } from '../utils/bengali';

export default function TransactionForm({ isOpen, onClose, onSave, transactionToEdit, categories, nextSerial }) {
  const [description, setDescription] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  
  // Status states
  const [status, setStatus] = useState('paid'); // 'pending', 'partial', 'paid'
  const [paidAmountInput, setPaidAmountInput] = useState('');
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Auto set default status based on category selection
  useEffect(() => {
    if (!transactionToEdit) {
      if (categoryType === 'expense') {
        setStatus('paid');
      } else {
        setStatus('pending');
      }
    }
  }, [categoryType, transactionToEdit]);

  // Set default values when form opens or edits
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDescription(transactionToEdit.description || '');
        setPersonName(transactionToEdit.personName || '');
        setAmount(transactionToEdit.amount ? transactionToEdit.amount.toString() : '');
        setCategoryType(transactionToEdit.categoryType || 'expense');
        setStatus(transactionToEdit.status || 'paid');
        setPaidAmountInput(transactionToEdit.paidAmount ? transactionToEdit.paidAmount.toString() : '');
        setDate(transactionToEdit.date || '');
        setTime(transactionToEdit.time || '');
        setNote(transactionToEdit.note || '');
      } else {
        // Adding new
        setDescription('');
        setPersonName('');
        setAmount('');
        setCategoryType('expense');
        setStatus('paid');
        setPaidAmountInput('');
        
        // Get local time in 2026-08-11 format
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
        
        const hh = String(today.getHours()).padStart(2, '0');
        const min = String(today.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${min}`);
        
        setNote('');
      }
    }
  }, [isOpen, transactionToEdit]);

  if (!isOpen) return null;

  // Determine the dynamic label for the person input
  const getPersonLabelAndPlaceholder = () => {
    switch (categoryType) {
      case 'borrowed':
        return {
          label: 'কার কাছ থেকে ধার নিয়েছেন? (ব্যক্তির নাম) *',
          placeholder: 'যেমন: করিম, রহিম, ভাইয়া'
        };
      case 'receivable':
        return {
          label: 'কার কাছ থেকে টাকা পাবেন? (ব্যক্তির নাম) *',
          placeholder: 'যেমন: রফিক, জামিল, অফিস'
        };
      case 'owed':
        return {
          label: 'কে বাকি টাকা পাবে? (ব্যক্তির নাম/দোকান) *',
          placeholder: 'যেমন: আব্দুর রহমান, ভাই ভাই স্টোর'
        };
      case 'expense':
      default:
        return {
          label: 'দোকান বা প্রতিষ্ঠানের নাম (ঐচ্ছিক)',
          placeholder: 'যেমন: স্বপ্ন সুপার শপ, মুদি দোকান'
        };
    }
  };

  const personConfig = getPersonLabelAndPlaceholder();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('অনুগ্রহ করে বিবরণ লিখুন!');
      return;
    }

    // Require person name for non-general expenses
    if (categoryType !== 'expense' && !personName.trim()) {
      alert('অনুগ্রহ করে ব্যক্তির নাম লিখুন!');
      return;
    }
    
    const numericAmount = parseBanglaFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (০ এর বেশি)!');
      return;
    }

    // Process status-related payments
    let finalPaidAmount = 0;
    if (status === 'paid') {
      finalPaidAmount = numericAmount;
    } else if (status === 'partial') {
      const parsedPaid = parseBanglaFloat(paidAmountInput);
      if (isNaN(parsedPaid) || parsedPaid <= 0) {
        alert('অনুগ্রহ করে সঠিক পরিশোধিত টাকার পরিমাণ লিখুন!');
        return;
      }
      if (parsedPaid >= numericAmount) {
        alert('পরিশোধিত টাকা অবশ্যই মোট টাকার চেয়ে কম হতে হবে! অন্যথায় সম্পূর্ণ পরিশোধিত সিলেক্ট করুন।');
        return;
      }
      finalPaidAmount = parsedPaid;
    } else {
      // pending
      finalPaidAmount = 0;
    }

    const payload = {
      id: transactionToEdit && transactionToEdit.id && !transactionToEdit.id.startsWith('prefill-')
        ? transactionToEdit.id 
        : 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      serial: transactionToEdit && transactionToEdit.serial ? transactionToEdit.serial : nextSerial,
      description: description.trim(),
      personName: personName.trim(),
      amount: numericAmount,
      categoryType,
      status,
      paidAmount: finalPaidAmount,
      pendingAmount: numericAmount - finalPaidAmount,
      date,
      time,
      note: note.trim()
    };

    onSave(payload);
    onClose();
  };

  const handleSelectCalcAmount = (calculatedValue) => {
    setAmount(calculatedValue.toString());
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {transactionToEdit && transactionToEdit.id && !transactionToEdit.id.startsWith('prefill-') ? 'হিসাব সংশোধন' : 'নতুন হিসাব লিখুন'} 
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px', fontWeight: 'normal' }}>
                (ক্রমিক: {padSerial(transactionToEdit && transactionToEdit.serial ? transactionToEdit.serial : nextSerial)})
              </span>
            </div>
            <button type="button" className="icon-button" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">বিবরণ *</label>
              <input
                id="description"
                type="text"
                className="form-input"
                placeholder="যেমন: ঘর ভাড়া, সাপ্তাহিক বাজার, বন্ধুদের সাথে খাওয়া"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Person Name (Conditional labels/validators) */}
            <div className="form-group">
              <label className="form-label" htmlFor="personName">{personConfig.label}</label>
              <input
                id="personName"
                type="text"
                className="form-input"
                placeholder={personConfig.placeholder}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                required={categoryType !== 'expense'}
              />
            </div>

            {/* Amount and Category */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="amount">মোট টাকার পরিমাণ *</label>
                <div className="input-container">
                  <input
                    id="amount"
                    type="text"
                    className="form-input input-with-action"
                    placeholder="৳ ০.০০"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    title="ক্যালকুলেটর ব্যবহার করুন"
                    onClick={() => setIsCalcOpen(true)}
                  >
                    <Calculator size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="categoryType">হিসাবের ধরন *</label>
                <select
                  id="categoryType"
                  className="form-select"
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                >
                  <option value="borrowed">{categories.borrowed}</option>
                  <option value="receivable">{categories.receivable}</option>
                  <option value="expense">{categories.expense}</option>
                  <option value="owed">{categories.owed}</option>
                </select>
              </div>
            </div>

            {/* Payment Status System */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="status">পরিশোধের অবস্থা *</label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">পরিশোধ করা হয়নি (বাকি)</option>
                  <option value="partial">আংশিক পরিশোধিত</option>
                  <option value="paid">সম্পূর্ণ পরিশোধিত</option>
                </select>
              </div>

              {status === 'partial' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="paidAmount">পরিশোধিত টাকা *</label>
                  <input
                    id="paidAmount"
                    type="text"
                    className="form-input"
                    placeholder="৳ ০.০০"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">অবশিষ্ট বকেয়া</label>
                  <div className="form-input" style={{ backgroundColor: '#e2e8f0', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {status === 'paid' ? '৳০.০০' : `৳${amount || '০.০০'}`}
                  </div>
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="date">তারিখ *</label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="time">সময় *</label>
                <input
                  id="time"
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label" htmlFor="note">বিশেষ নোট (ঐচ্ছিক)</label>
              <textarea
                id="note"
                className="form-textarea"
                rows="2"
                placeholder="অন্যান্য তথ্য..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                বাতিল
              </button>
              <button type="submit" className="btn btn-primary">
                {transactionToEdit && transactionToEdit.id && !transactionToEdit.id.startsWith('prefill-') ? 'পরিবর্তন সংরক্ষণ করুন' : 'হিসাব যুক্ত করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Internal Calculator Modal */}
      <CalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onSelectAmount={handleSelectCalcAmount}
      />
    </>
  );
}
