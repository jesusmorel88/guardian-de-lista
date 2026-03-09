import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (newPin.every(p => p !== '') && index === 5) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = [...pin];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);

    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    } else if (pastedData.length < 6) {
      inputRefs.current[pastedData.length].focus();
    }
  };

  const handleSubmit = async (pinCode) => {
    if (pinCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', { pin: pinCode });

      if (response.data.success) {
        localStorage.setItem('adminToken', 'authenticated');
        onLogin();
      }
    } catch (err) {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">🔒</div>
        <h1 className="login-title">M3U Guardian Shield</h1>
        <p className="login-subtitle">Ingresa tu PIN de 6 dígitos para acceder</p>

        <div className="pin-input" onPaste={handlePaste}>
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handlePinChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <button
          className="login-btn"
          onClick={() => handleSubmit(pin.join(''))}
          disabled={loading || pin.join('').length !== 6}
        >
          {loading ? 'Verificando...' : 'Ingresar'}
        </button>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
