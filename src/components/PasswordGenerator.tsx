import React, { useState, useEffect, useCallback } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw,
  ShieldCheck,
  Settings2,
  AlertCircle
} from 'lucide-react';

export function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'text-red-500' });

  const generatePassword = useCallback(() => {
    let charset = '';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (!charset) {
      setPassword('');
      setStrength({ score: 0, label: 'Invalid', color: 'text-red-500' });
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }
    
    setPassword(newPassword);
    evaluateStrength(newPassword);
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const evaluateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score += 1;
    if (pass.length > 12) score += 1;
    if (pass.length >= 16) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 3) setStrength({ score, label: 'Weak', color: 'text-red-500' });
    else if (score < 5) setStrength({ score, label: 'Fair', color: 'text-amber-500' });
    else if (score < 7) setStrength({ score, label: 'Good', color: 'text-emerald-500' });
    else setStrength({ score, label: 'Strong', color: 'text-emerald-600 dark:text-emerald-400' });
  };

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Secure Password Generator</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            Generate strong, random passwords using cryptographically secure client-side APIs.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="w-full min-h-[80px] p-4 pr-32 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center break-all font-mono text-xl sm:text-2xl text-zinc-800 dark:text-zinc-100 transition-colors">
              {password || <span className="text-zinc-400">Select options...</span>}
            </div>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={generatePassword}
                className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700"
                title="Generate New Password"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-smooth cursor-pointer active:scale-95 ${
                  isCopied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Password Strength:
            </span>
            <span className={`text-sm font-bold ${strength.color}`}>
              {strength.label}
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Length: {length}
            </label>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-2/3 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <input
                type="checkbox"
                checked={useUppercase}
                onChange={(e) => setUseUppercase(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Uppercase (A-Z)</span>
            </label>
            
            <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <input
                type="checkbox"
                checked={useLowercase}
                onChange={(e) => setUseLowercase(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lowercase (a-z)</span>
            </label>
            
            <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => setUseNumbers(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Numbers (0-9)</span>
            </label>
            
            <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => setUseSymbols(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Symbols (!@#$...)</span>
            </label>
          </div>

          {(!useUppercase && !useLowercase && !useNumbers && !useSymbols) && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> You must select at least one character type.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
