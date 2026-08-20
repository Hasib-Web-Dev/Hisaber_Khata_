import React, { useState } from 'react';
import { Download, Upload, Trash2, Info, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { 
  exportBackupData, 
  restoreBackupData, 
  clearAllAppData,
  getStoredUsers,
  saveStoredUsers
} from '../utils/storage';

export default function Settings({ categories, onRestoreSuccess, onClearAllData, currentUser, onLogout, onProfileUpdate }) {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  
  // PIN change state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const result = restoreBackupData(content);
      if (result.success) {
        onRestoreSuccess(result.transactions, result.categories);
        alert('ডাটা সফলভাবে রিস্টোর করা হয়েছে!');
      } else {
        alert('ডাটা রিস্টোর করতে ব্যর্থ হয়েছে: ' + result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const triggerFileInput = () => {
    document.getElementById('restore-file-input').click();
  };

  const handleClearData = () => {
    clearAllAppData(currentUser.username);
    onClearAllData();
    setIsClearConfirmOpen(false);
    alert('আপনার প্রোফাইলের সমস্ত ডাটা সফলভাবে মুছে ফেলা হয়েছে এবং রিসেট করা হয়েছে!');
  };

  const handlePinChange = (e) => {
    e.preventDefault();
    if (oldPin !== currentUser.pin) {
      alert('আপনার বর্তমান পিন কোডটি ভুল!');
      return;
    }
    if (newPin.length !== 4) {
      alert('নতুন পিন অবশ্যই ৪ সংখ্যার হতে হবে!');
      return;
    }
    if (newPin !== confirmNewPin) {
      alert('নতুন পিন কোড দুটি মেলেনি!');
      return;
    }
    
    // Update user pin
    const users = getStoredUsers();
    const updatedUsers = users.map(u => {
      if (u.username === currentUser.username) {
        return { ...u, pin: newPin };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);
    
    // Update parent current user state
    onProfileUpdate({ ...currentUser, pin: newPin });
    
    // Clear form
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    alert('আপনার পিন কোড সফলভাবে পরিবর্তন করা হয়েছে!');
  };

  return (
    <div className="content-area" style={{ paddingBottom: '40px' }}>
      <h2 className="section-title" style={{ marginTop: 0 }}>সেটিংস</h2>

      <div className="settings-list">
        {/* Profile & Security */}
        <div className="settings-section">
          <div className="settings-section-title">প্রোফাইল ও নিরাপত্তা</div>
          
          <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="settings-info">
              <span className="settings-label" style={{ fontWeight: 'bold', fontSize: '16px' }}>👤 {currentUser.name}</span>
              <span className="settings-desc">ইউজারনেম: @{currentUser.username}</span>
            </div>
            <button 
              type="button" 
              className="settings-action" 
              onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--expense-bg)', color: 'var(--expense-color)', border: 'none' }}
            >
              <Lock size={16} /> লগআউট করুন
            </button>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '12px' }}>
            <span className="settings-label" style={{ marginBottom: '8px', display: 'block', fontSize: '13px' }}>পিন কোড পরিবর্তন করুন</span>
            <form onSubmit={handlePinChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input 
                  type="password" 
                  maxLength="4" 
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="বর্তমান পিন" 
                  value={oldPin} 
                  onChange={e => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input" 
                  style={{ fontSize: '13px', padding: '8px 12px', textAlign: 'center' }}
                  required
                />
                <input 
                  type="password" 
                  maxLength="4" 
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="নতুন পিন" 
                  value={newPin} 
                  onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input" 
                  style={{ fontSize: '13px', padding: '8px 12px', textAlign: 'center' }}
                  required
                />
                <input 
                  type="password" 
                  maxLength="4" 
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="পিন নিশ্চিত করুন" 
                  value={confirmNewPin} 
                  onChange={e => setConfirmNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input" 
                  style={{ fontSize: '13px', padding: '8px 12px', textAlign: 'center' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', width: 'auto', alignSelf: 'flex-end', height: 'auto' }}
              >
                পিন কোড আপডেট করুন
              </button>
            </form>
          </div>
        </div>

        {/* Category Management - Read Only */}
        <div className="settings-section">
          <div className="settings-section-title">ক্যাটাগরি ব্যবস্থাপনা (নির্ধারিত)</div>
          
          <div>
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">আমি ধার নিয়েছি (Money I Borrow)</span>
                <span className="settings-desc">বর্তমান নাম: {categories.borrowed}</span>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">আমি পাবো (Money I Receive)</span>
                <span className="settings-desc">বর্তমান নাম: {categories.receivable}</span>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">ক্রয় / খরচ (Expenses)</span>
                <span className="settings-desc">বর্তমান নাম: {categories.expense}</span>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">বাকি / বকেয়া (Owed / Due)</span>
                <span className="settings-desc">বর্তমান নাম: {categories.owed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="settings-section">
          <div className="settings-section-title">ডাটা ব্যাকআপ ও রিস্টোর</div>
          
          <div className="settings-row">
            <div className="settings-info" style={{ marginRight: '16px' }}>
              <span className="settings-label">ব্যাকআপ ফাইল ডাউনলোড</span>
              <span className="settings-desc">আপনার বর্তমান হিসাবসমূহ অফলাইনে সংরক্ষণের জন্য ব্যাকআপ ফাইল ডাউনলোড করুন।</span>
            </div>
            <button type="button" className="settings-action" onClick={exportBackupData} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={18} /> ব্যাকআপ
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-info" style={{ marginRight: '16px' }}>
              <span className="settings-label">ডাটা রিস্টোর</span>
              <span className="settings-desc">পূর্বে ব্যাকআপ নেওয়া .json ফাইল থেকে ডাটা ফিরিয়ে আনুন।</span>
            </div>
            <button type="button" className="settings-action" onClick={triggerFileInput} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={18} /> রিস্টোর
            </button>
            <input
              id="restore-file-input"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Clear Data & Reset */}
        <div className="settings-section">
          <div className="settings-section-title" style={{ color: 'var(--expense-color)' }}>ডাটা রিসেট</div>
          
          <div className="settings-row">
            <div className="settings-info" style={{ marginRight: '16px' }}>
              <span className="settings-label" style={{ color: 'var(--expense-color)' }}>সব ডাটা মুছুন</span>
              <span className="settings-desc">এই প্রোফাইলের সমস্ত হিসাব এবং কাস্টম ক্যাটাগরি মুছে ফেলে নতুন করে শুরু করুন।</span>
            </div>
            <button type="button" className="settings-action danger" onClick={() => setIsClearConfirmOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={18} /> মুছুন
            </button>
          </div>
        </div>

        {/* App Info / About */}
        <div className="settings-section">
          <div className="settings-section-title">অ্যাপ সম্পর্কে</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '6px 0' }}>
            <Info size={20} color="var(--primary)" style={{ marginTop: '2px' }} />
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>অফলাইন ডেটা সিকিউরিটি</p>
              <p>আপনার কোন হিসাব বা ব্যক্তিগত ডাটা কোন online সার্ভারে পাঠানো হয় না। সকল তথ্য শুধুমাত্র আপনার ডিভাইসের ব্রাউজারে সুরক্ষিত থাকে।</p>
            </div>
          </div>
        </div>

        {/* App Developer Credit Box */}
        <div className="credit-box">
          <div className="credit-app-name">হিসাবের খাতা</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>ভার্সন ১.০.০ (PWA)</div>
          <div className="credit-by" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={16} color="var(--primary)" /> App By Hasibul Alam
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      {isClearConfirmOpen && (
        <div className="modal-overlay" style={{ alignItems: 'center' }} onClick={() => setIsClearConfirmOpen(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--expense-color)', marginBottom: '12px' }}>
              <AlertTriangle size={48} />
            </div>
            <div className="confirm-title" style={{ color: 'var(--expense-color)' }}>সমস্ত ডাটা মুছে ফেলবেন?</div>
            <div className="confirm-text">আপনি কি নিশ্চিত যে আপনি এই প্রোফাইলের সমস্ত হিসাব বিবরণী মুছে ফেলতে চান? এর ফলে ব্যাকআপ ছাড়া ডাটা আর ফিরে পাবেন না।</div>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsClearConfirmOpen(false)}>
                বাতিল
              </button>
              <button type="button" className="btn btn-danger" onClick={handleClearData}>
                হ্যাঁ, সব মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
