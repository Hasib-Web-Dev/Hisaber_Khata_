import React, { useState, useEffect } from 'react';
import { UserPlus, Lock, Unlock, User, ArrowLeft, AlertCircle, Key, Wallet, Info } from 'lucide-react';
import { formatBanglaCurrency, toBanglaDigits } from '../utils/bengali';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  getUserDuesSum, 
  migrateLegacyData, 
  setCurrentUser 
} from '../utils/storage';

export default function AuthScreen({ onLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [screen, setScreen] = useState('login'); // 'login', 'register'
  
  // Register form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load profiles
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    setUsers(loadedUsers);
    if (loadedUsers.length === 0) {
      setScreen('register');
    }
  }, [screen]);

  // Handle register
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanUsername) {
      setErrorMsg('ইউজারনেম অবশ্যই ইংরেজি অক্ষর বা সংখ্যায় হতে হবে।');
      return;
    }

    // Check if username exists
    const usersList = getStoredUsers();
    if (usersList.some(u => u.username === cleanUsername)) {
      setErrorMsg('এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি নির্বাচন করুন।');
      return;
    }

    if (pin.length !== 4 || isNaN(parseInt(pin, 10))) {
      setErrorMsg('পিন কোডটি অবশ্যই ৪ সংখ্যার হতে হবে।');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg('পিন কোড দুটি মেলেনি। আবার চেষ্টা করুন।');
      return;
    }

    const newUser = {
      username: cleanUsername,
      name: name.trim(),
      pin: pin,
      createdDate: new Date().toISOString()
    };

    const updatedUsers = [...usersList, newUser];
    saveStoredUsers(updatedUsers);
    
    // Automatically migrate old legacy data if this is the very first profile
    if (usersList.length === 0) {
      migrateLegacyData(cleanUsername);
    }

    setCurrentUser(cleanUsername);
    onLoginSuccess(newUser);
  };

  // Handle Secure Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanUsername = loginUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanUsername) {
      setLoginError('অনুগ্রহ করে ইউজারনেম লিখুন।');
      return;
    }

    if (loginPin.length !== 4 || isNaN(parseInt(loginPin, 10))) {
      setLoginError('পিন কোডটি অবশ্যই ৪ সংখ্যার হতে হবে।');
      return;
    }

    const usersList = getStoredUsers();
    const user = usersList.find(u => u.username === cleanUsername);

    if (!user) {
      setLoginError('ইউজারনেমটি পাওয়া যায়নি।');
      return;
    }

    if (loginPin === user.pin) {
      setCurrentUser(user.username);
      onLoginSuccess(user);
    } else {
      setLoginError('ভুল পিন কোড! আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      
      {/* App Logo/Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', padding: '0 20px' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '20px', 
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 12px',
          boxShadow: '0 8px 16px rgba(15, 118, 110, 0.2)'
        }}>
          <Unlock size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>হিসাবের খাতা</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>ডিভাইস ভিত্তিক নিরাপদ ডাবল-লক প্রোফাইল</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        
        {/* Secure Login Screen */}
        {screen === 'login' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
              
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>প্রোফাইলে লগইন করুন</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>আপনার ইউজারনেম এবং ৪ সংখ্যার পিন কোড দিন।</p>

              {loginError && (
                <div style={{ color: 'var(--expense-color)', backgroundColor: 'var(--expense-bg)', padding: '10px 12px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                
                {/* Username */}
                <div className="form-group">
                  <label className="form-label" htmlFor="login-username">ইউজারনেম (ইংরেজি অক্ষর ও সংখ্যা) *</label>
                  <div className="input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                      <User size={16} />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      className="form-input"
                      placeholder="যেমন: rahman12"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                      required
                    />
                  </div>
                </div>

                {/* PIN Code */}
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label" htmlFor="login-pin">পিন কোড (৪ সংখ্যা) *</label>
                  <div className="input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                      <Lock size={16} />
                    </div>
                    <input
                      id="login-pin"
                      type="password"
                      maxLength="4"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="••••"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ paddingLeft: '36px', letterSpacing: '8px', fontFamily: 'Inter, sans-serif' }}
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                    <Unlock size={18} /> লগইন করুন
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => {
                      setName('');
                      setUsername('');
                      setPin('');
                      setConfirmPin('');
                      setErrorMsg('');
                      setScreen('register');
                    }}
                  >
                    <UserPlus size={18} /> নতুন প্রোফাইল তৈরি করুন
                  </button>
                </div>

              </form>
            </div>
            
            {/* Info notice to explain offline security */}
            <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', marginTop: '20px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '12px' }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>অফলাইন ডাটা স্টোরেজ:</strong> এই প্রোফাইল ও হিসাবসমূহ সম্পূর্ণ অফলাইনে এই ব্রাউজারে সুরক্ষিত থাকে। কেউ আপনার ইউজারনেম ও পিন কোড ছাড়া আপনার হিসাবের ইতিহাস দেখতে পারবে না।
              </div>
            </div>
          </div>
        )}

        {/* Register Screen */}
        {screen === 'register' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
              
              {users.length > 0 && (
                <button 
                  type="button" 
                  className="icon-button" 
                  style={{ marginBottom: '16px' }}
                  onClick={() => setScreen('login')}
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>নতুন প্রোফাইল তৈরি করুন</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>আপনার হিসাব সম্পূর্ণ সুরক্ষিত ও আলাদা রাখতে প্রোফাইল খুলুন।</p>

              {errorMsg && (
                <div style={{ color: 'var(--expense-color)', backgroundColor: 'var(--expense-bg)', padding: '10px 12px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">আপনার নাম *</label>
                  <div className="input-container">
                    <input
                      id="reg-name"
                      type="text"
                      className="form-input"
                      placeholder="যেমন: আব্দুর রহমান, রবিন"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-username">ইউজারনেম (ইংরেজি অক্ষর ও সংখ্যা) *</label>
                  <div className="input-container">
                    <input
                      id="reg-username"
                      type="text"
                      className="form-input"
                      placeholder="যেমন: rahman12"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 4 Digit PIN and Confirm PIN */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-pin">পিন কোড (৪ সংখ্যা) *</label>
                    <input
                      id="reg-pin"
                      type="password"
                      maxLength="4"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ letterSpacing: '8px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-confirm-pin">পিন কনফার্ম করুন *</label>
                    <input
                      id="reg-confirm-pin"
                      type="password"
                      maxLength="4"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ letterSpacing: '8px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions" style={{ marginTop: '24px' }}>
                  {users.length > 0 && (
                    <button type="button" className="btn btn-secondary" onClick={() => setScreen('login')}>
                      বাতিল
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Key size={18} /> প্রোফাইল তৈরি করুন
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
