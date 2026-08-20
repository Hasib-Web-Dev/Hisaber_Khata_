import React, { useState } from 'react';
import { X, Delete, Check } from 'lucide-react';
import { toBanglaDigits } from '../utils/bengali';

export default function CalculatorModal({ isOpen, onClose, onSelectAmount }) {
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (isDone) {
      setDisplay(digit);
      setFormula('');
      setIsDone(false);
      return;
    }
    
    if (display === '0') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (isDone) {
      setDisplay('0.');
      setFormula('');
      setIsDone(false);
      return;
    }

    // Allow only one decimal per number segment in formula
    // Find the last number segment
    const parts = display.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op) => {
    setIsDone(false);
    const lastChar = display[display.length - 1];
    
    if (['+', '-', '*', '/'].includes(lastChar)) {
      // Replace last operator
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const handlePercent = () => {
    // Basic percentage: divide the last number segment by 100
    const parts = display.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart || lastPart === '0') return;
    
    const value = parseFloat(lastPart) / 100;
    const beforePart = display.slice(0, display.length - lastPart.length);
    setDisplay(beforePart + value.toString());
  };

  const handleClear = () => {
    setDisplay('0');
    setFormula('');
    setIsDone(false);
  };

  const handleBackspace = () => {
    if (isDone) {
      handleClear();
      return;
    }
    
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    if (isDone) return;
    
    let expr = display;
    // Remove any trailing operators
    const lastChar = expr[expr.length - 1];
    if (['+', '-', '*', '/'].includes(lastChar)) {
      expr = expr.slice(0, -1);
    }

    try {
      // Safe math evaluation
      // Parse token by token to prevent eval() security risks
      const result = evaluateExpression(expr);
      
      // Round to 4 decimal places max
      const roundedResult = Math.round(result * 10000) / 10000;
      
      setFormula(expr + '=');
      setDisplay(roundedResult.toString());
      setIsDone(true);
    } catch {
      setDisplay('Error');
      setIsDone(true);
    }
  };

  // Helper function to evaluate math string safely
  const evaluateExpression = (expr) => {
    // Basic tokenizer and parser
    // Supports + - * / and numbers
    const tokens = [];
    let numberBuffer = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (/[0-9.]/.test(char)) {
        numberBuffer += char;
      } else if (['+', '-', '*', '/'].toLowerCase().includes(char)) {
        if (numberBuffer) {
          tokens.push(parseFloat(numberBuffer));
          numberBuffer = '';
        }
        tokens.push(char);
      }
    }
    if (numberBuffer) {
      tokens.push(parseFloat(numberBuffer));
    }

    if (tokens.length === 0) return 0;
    
    // First pass for multiplication and division
    const firstPass = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prev = firstPass.pop();
        const next = tokens[i + 1];
        if (prev === undefined || next === undefined) {
          throw new Error('Invalid expression');
        }
        const val = token === '*' ? prev * next : prev / next;
        firstPass.push(val);
        i += 2;
      } else {
        firstPass.push(token);
        i++;
      }
    }

    // Second pass for addition and subtraction
    let result = firstPass[0];
    if (typeof result !== 'number') {
      throw new Error('Invalid expression');
    }
    
    let j = 1;
    while (j < firstPass.length) {
      const op = firstPass[j];
      const val = firstPass[j + 1];
      if (typeof val !== 'number') {
        throw new Error('Invalid expression');
      }
      
      if (op === '+') {
        result += val;
      } else if (op === '-') {
        result -= val;
      } else {
        throw new Error('Invalid operator');
      }
      j += 2;
    }
    
    return result;
  };

  const handleApply = () => {
    // Calculate first if operators are present in display and not evaluated yet
    let finalVal = display;
    if (/[+\-*/]/.test(display) && !isDone) {
      let expr = display;
      const lastChar = expr[expr.length - 1];
      if (['+', '-', '*', '/'].includes(lastChar)) {
        expr = expr.slice(0, -1);
      }
      try {
        const res = evaluateExpression(expr);
        finalVal = (Math.round(res * 100) / 100).toString();
      } catch {
        finalVal = '0';
      }
    }

    const numericVal = parseFloat(finalVal);
    onSelectAmount(isNaN(numericVal) ? 0 : numericVal);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '360px', borderRadius: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">ক্যালকুলেটর</div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div>
          {/* Display */}
          <div className="calc-display">
            {formula && (
              <div className="calc-formula">
                {toBanglaDigits(formula)}
              </div>
            )}
            <div>
              {toBanglaDigits(display)}
            </div>
          </div>

          {/* Grid Buttons */}
          <div className="calculator-grid">
            <button className="calc-btn op" onClick={handleClear}>C</button>
            <button className="calc-btn op" onClick={handleBackspace}><Delete size={20} /></button>
            <button className="calc-btn op" onClick={handlePercent}>%</button>
            <button className="calc-btn op" onClick={() => handleOperator('/')}>÷</button>

            <button className="calc-btn" onClick={() => handleDigit('7')}>7</button>
            <button className="calc-btn" onClick={() => handleDigit('8')}>8</button>
            <button className="calc-btn" onClick={() => handleDigit('9')}>9</button>
            <button className="calc-btn op" onClick={() => handleOperator('*')}>×</button>

            <button className="calc-btn" onClick={() => handleDigit('4')}>4</button>
            <button className="calc-btn" onClick={() => handleDigit('5')}>5</button>
            <button className="calc-btn" onClick={() => handleDigit('6')}>6</button>
            <button className="calc-btn op" onClick={() => handleOperator('-')}>-</button>

            <button className="calc-btn" onClick={() => handleDigit('1')}>1</button>
            <button className="calc-btn" onClick={() => handleDigit('2')}>2</button>
            <button className="calc-btn" onClick={() => handleDigit('3')}>3</button>
            <button className="calc-btn op" onClick={() => handleOperator('+')}>+</button>

            <button className="calc-btn" style={{ gridColumn: 'span 2' }} onClick={() => handleDigit('0')}>0</button>
            <button className="calc-btn" onClick={handleDecimal}>.</button>
            <button className="calc-btn eq" onClick={handleCalculate}>=</button>
          </div>

          {/* Transfer Button */}
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleApply}>
              <Check size={18} /> হিসাবে যোগ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
