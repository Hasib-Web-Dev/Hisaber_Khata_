import React, { useState } from 'react';
import { Delete, PlusCircle } from 'lucide-react';
import { toBanglaDigits } from '../utils/bengali';

export default function CalculatorTab({ onAddWithAmount }) {
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [isDone, setIsDone] = useState(false);

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
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const handlePercent = () => {
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
    const lastChar = expr[expr.length - 1];
    if (['+', '-', '*', '/'].includes(lastChar)) {
      expr = expr.slice(0, -1);
    }

    try {
      const result = evaluateExpression(expr);
      const roundedResult = Math.round(result * 10000) / 10000;
      
      setFormula(expr + '=');
      setDisplay(roundedResult.toString());
      setIsDone(true);
    } catch {
      setDisplay('Error');
      setIsDone(true);
    }
  };

  const evaluateExpression = (expr) => {
    const tokens = [];
    let numberBuffer = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (/[0-9.]/.test(char)) {
        numberBuffer += char;
      } else if (['+', '-', '*', '/'].includes(char)) {
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
    
    const firstPass = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prev = firstPass.pop();
        const next = tokens[i + 1];
        if (prev === undefined || next === undefined) throw new Error('Invalid');
        const val = token === '*' ? prev * next : prev / next;
        firstPass.push(val);
        i += 2;
      } else {
        firstPass.push(token);
        i++;
      }
    }

    let result = firstPass[0];
    let j = 1;
    while (j < firstPass.length) {
      const op = firstPass[j];
      const val = firstPass[j + 1];
      if (op === '+') result += val;
      else if (op === '-') result -= val;
      j += 2;
    }
    
    return result;
  };

  const handleCreateTransaction = () => {
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
    onAddWithAmount(isNaN(numericVal) ? 0 : numericVal);
  };

  return (
    <div className="content-area" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingBottom: '30px' }}>
      <h2 className="section-title" style={{ marginTop: 0, textAlign: 'center' }}>ক্যালকুলেটর</h2>
      
      <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
        {/* Display */}
        <div className="calc-display" style={{ minHeight: '80px', marginBottom: '16px' }}>
          {formula && (
            <div className="calc-formula">
              {toBanglaDigits(formula)}
            </div>
          )}
          <div>
            {toBanglaDigits(display)}
          </div>
        </div>

        {/* Grid */}
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

        {/* Action button */}
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleCreateTransaction}
        >
          <PlusCircle size={20} /> হিসাব খাতায় লিখুন
        </button>
      </div>
    </div>
  );
}
