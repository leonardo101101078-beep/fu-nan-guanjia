import { useState, useCallback, useEffect } from 'react';
import './NumericKeypad.css';

type Operator = '+' | '-' | '×' | '÷' | null;

interface KeypadState {
  display: string;
  operand1: number | null;
  operator: Operator;
  justPressedOp: boolean;
}

const initialState: KeypadState = {
  display: '0',
  operand1: null,
  operator: null,
  justPressedOp: false,
};

function evaluate(a: number, op: Operator, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : a;
    default: return b;
  }
}

function formatResult(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

interface Props {
  onConfirm: (amount: number) => void;
  onChange?: (amount: number) => void;
}

export default function NumericKeypad({ onConfirm, onChange }: Props) {

  const [state, setState] = useState<KeypadState>(initialState);

  useEffect(() => {
    onChange?.(parseFloat(state.display) || 0);
  }, [state.display, onChange]);

  const handleDigit = useCallback((key: string) => {
    setState(prev => {
      if (prev.justPressedOp) {
        const initial = key === '.' ? '0.' : key === '00' ? '0' : key;
        return { ...prev, display: initial, justPressedOp: false };
      }
      if (key === '.') {
        if (prev.display.includes('.')) return prev;
        return { ...prev, display: prev.display + '.' };
      }
      if (key === '00') {
        if (prev.display === '0') return prev;
        return { ...prev, display: prev.display + '00' };
      }
      if (prev.display === '0' && key !== '.') {
        return { ...prev, display: key };
      }
      if (prev.display.length >= 10) return prev;
      return { ...prev, display: prev.display + key };
    });
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    setState(prev => {
      const currentValue = parseFloat(prev.display) || 0;
      if (prev.operand1 !== null && !prev.justPressedOp && prev.operator) {
        const result = evaluate(prev.operand1, prev.operator, currentValue);
        return {
          display: formatResult(result),
          operand1: result,
          operator: op,
          justPressedOp: true,
        };
      }
      return {
        ...prev,
        operand1: currentValue,
        operator: op,
        justPressedOp: true,
      };
    });
  }, []);

  const handleAC = useCallback(() => {
    setState(initialState);
  }, []);

  const handleBackspace = useCallback(() => {
    setState(prev => {
      if (prev.display.length <= 1) return { ...prev, display: '0' };
      const next = prev.display.slice(0, -1);
      return { ...prev, display: next === '' || next === '-' ? '0' : next };
    });
  }, []);

  const handleOK = useCallback(() => {
    setState(prev => {
      const currentValue = parseFloat(prev.display) || 0;
      let finalAmount = currentValue;
      if (prev.operand1 !== null && prev.operator) {
        finalAmount = evaluate(prev.operand1, prev.operator, currentValue);
      }
      finalAmount = Math.round(Math.abs(finalAmount) * 100) / 100;
      onConfirm(finalAmount);
      return initialState;
    });
  }, [onConfirm]);

  const pendingExpr = state.operand1 !== null && state.operator
    ? `${formatResult(state.operand1)} ${state.operator}`
    : null;

  return (
    <div className="keypad-wrapper">
      <div className="keypad-display">
        {pendingExpr && <div className="keypad-pending">{pendingExpr}</div>}
        <div className="keypad-amount">{state.display}</div>
      </div>
      <div className="keypad">
        <button className="key key-digit" onClick={() => handleDigit('7')}>7</button>
        <button className="key key-digit" onClick={() => handleDigit('8')}>8</button>
        <button className="key key-digit" onClick={() => handleDigit('9')}>9</button>
        <button className="key key-operator" onClick={() => handleOperator('÷')}>÷</button>
        <button className="key key-ac" onClick={handleAC}>AC</button>

        <button className="key key-digit" onClick={() => handleDigit('4')}>4</button>
        <button className="key key-digit" onClick={() => handleDigit('5')}>5</button>
        <button className="key key-digit" onClick={() => handleDigit('6')}>6</button>
        <button className="key key-operator" onClick={() => handleOperator('×')}>×</button>
        <button className="key key-back" onClick={handleBackspace}>←</button>

        <button className="key key-digit" onClick={() => handleDigit('1')}>1</button>
        <button className="key key-digit" onClick={() => handleDigit('2')}>2</button>
        <button className="key key-digit" onClick={() => handleDigit('3')}>3</button>
        <button className="key key-operator" onClick={() => handleOperator('+')}>+</button>
        <button className="key key-ok" onClick={handleOK}>OK</button>

        <button className="key key-digit" onClick={() => handleDigit('00')}>00</button>
        <button className="key key-digit" onClick={() => handleDigit('0')}>0</button>
        <button className="key key-digit" onClick={() => handleDigit('.')}>.</button>
        <button className="key key-operator" onClick={() => handleOperator('-')}>-</button>
      </div>
    </div>
  );
}
