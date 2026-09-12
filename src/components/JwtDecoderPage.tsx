import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoRouteData } from '../lib/seoEngine';
import {
  decodeJwt,
  verifyHmacSignature,
  SAMPLE_JWTS,
  DecodedJwtResult,
  SignatureVerificationResult,
  STANDARD_CLAIMS_MAP
} from '../lib/jwtDecoder';
import {
  ShieldCheck,
  KeyRound,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Download,
  Terminal,
  Code2,
  FileJson,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
  Sparkles
} from 'lucide-react';

interface JwtDecoderPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export const JwtDecoderPage: React.FC<JwtDecoderPageProps> = ({ seoData, onNavigate }) => {
  // Input State
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_JWTS.auth0.token);
  const [activeTab, setActiveTab] = useState<'payload' | 'header' | 'signature'>('payload');
  const [payloadViewMode, setPayloadViewMode] = useState<'claims' | 'json'>('claims');
  const [claimSearch, setClaimSearch] = useState<string>('');

  // Live timer tick for real-time expiration countdown
  const [currentSec, setCurrentSec] = useState<number>(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Signature verification state
  const [hmacSecret, setHmacSecret] = useState<string>('your-256-bit-secret');
  const [isBase64Secret, setIsBase64Secret] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [signatureResult, setSignatureResult] = useState<SignatureVerificationResult | null>(null);
  const [isVerifyingSig, setIsVerifyingSig] = useState<boolean>(false);

  // Copy status feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Decode the token reactively with live current time
  const decoded: DecodedJwtResult = useMemo(() => {
    return decodeJwt(tokenInput, currentSec);
  }, [tokenInput, currentSec]);

  // Handle signature verification
  const handleVerifySignature = useCallback(async () => {
    if (!decoded.valid) return;
    setIsVerifyingSig(true);
    try {
      const res = await verifyHmacSignature(
        decoded.parts.headerBase64,
        decoded.parts.payloadBase64,
        decoded.parts.signatureBase64,
        decoded.algorithm,
        hmacSecret,
        isBase64Secret
      );
      setSignatureResult(res);
    } catch (err: any) {
      setSignatureResult({
        checked: false,
        algorithm: decoded.algorithm,
        isValid: false,
        message: err?.message || 'Verification error'
      });
    } finally {
      setIsVerifyingSig(false);
    }
  }, [decoded, hmacSecret, isBase64Secret]);

  // Auto-verify if secret is present and token is valid HMAC
  useEffect(() => {
    if (
      decoded.valid &&
      decoded.algorithm.toUpperCase().startsWith('HS') &&
      hmacSecret.trim().length > 0
    ) {
      handleVerifySignature();
    } else {
      setSignatureResult(null);
    }
  }, [decoded.valid, decoded.algorithm, decoded.parts.headerBase64, decoded.parts.payloadBase64, decoded.parts.signatureBase64, hmacSecret, isBase64Secret, handleVerifySignature]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Safe shell-escaped token for cURL export
  const safeToken = useMemo(() => {
    return decoded.rawToken.replace(/["\\]/g, '\\$&').replace(/[\r\n]/g, '');
  }, [decoded.rawToken]);

  // Download decoded JSON payload
  const handleDownloadPayload = () => {
    if (!decoded.payload) return;
    const blob = new Blob([JSON.stringify(decoded.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jwt-payload-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all states cleanly
  const handleClearAll = () => {
    setTokenInput('');
    setHmacSecret('');
    setSignatureResult(null);
    setClaimSearch('');
  };

  // Filtered claims list
  const filteredClaims = useMemo(() => {
    if (!decoded.claimsList) return [];
    if (!claimSearch.trim()) return decoded.claimsList;
    const query = claimSearch.toLowerCase();
    return decoded.claimsList.filter(
      (c) =>
        c.key.toLowerCase().includes(query) ||
        c.label.toLowerCase().includes(query) ||
        String(c.value).toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }, [decoded.claimsList, claimSearch]);

  const breadcrumbs = seoData.breadcrumbs || [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'JWT Debugger & Decoder', url: '/jwt-decoder' }
  ];

  const isHmacAlg = decoded.algorithm.toUpperCase().startsWith('HS');
  const isNoneAlg = decoded.algorithm.toUpperCase() === 'NONE' || !decoded.algorithm;
  const isAsymmetricAlg = decoded.algorithm.toUpperCase().startsWith('RS') || decoded.algorithm.toUpperCase().startsWith('ES') || decoded.algorithm.toUpperCase().startsWith('PS');

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 pb-12" id="jwt-decoder-root">
      {/* Preset Samples & Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-100/70 dark:bg-zinc-850 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-500 font-semibold px-1">Presets:</span>
          <button
            type="button"
            onClick={() => {
              setTokenInput(SAMPLE_JWTS.auth0.token);
              setHmacSecret('your-256-bit-secret');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
            id="preset-auth0"
          >
            Auth0 / OIDC
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput(SAMPLE_JWTS.firebase.token);
              setHmacSecret('');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
            id="preset-firebase"
          >
            Firebase ID
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput(SAMPLE_JWTS.expired.token);
              setHmacSecret('');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
            id="preset-expired"
          >
            Expired Token
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput(SAMPLE_JWTS.nested.token);
              setHmacSecret('');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
            id="preset-nested"
          >
            RBAC Permissions
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.readText().then((text) => {
                if (text) setTokenInput(text.trim());
              }).catch(() => {});
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            id="btn-paste-clipboard"
            title="Paste token from clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            id="btn-clear-token"
            title="Clear token and secret"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Encoded Token (Left) + Decoded Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Raw Encoded Token Input */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Encoded JWT Token
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">
                {tokenInput.length > 0 ? `${tokenInput.length} chars` : 'Empty'}
              </span>
            </div>
          </div>

          <div className="relative flex flex-col rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            {/* Legend banner */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-100/80 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Header
                </span>
                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Payload
                </span>
                <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Signature
                </span>
              </div>

              {tokenInput && (
                <button
                  type="button"
                  onClick={() => handleCopy(tokenInput, 'raw-token')}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy encoded token"
                >
                  {copiedKey === 'raw-token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'raw-token' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Token Textarea */}
            <textarea
              id="jwt-token-input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your JWT token here (e.g. eyJhbGciOi...)"
              className="w-full min-h-[340px] p-3.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-transparent resize-y focus:outline-hidden leading-relaxed break-all"
              spellCheck={false}
              aria-label="Encoded JWT Token Input"
            />

            {/* Token Syntax Color Preview (when valid 3 parts) */}
            {decoded.valid && decoded.parts && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-850/60 border-t border-zinc-200 dark:border-zinc-800 text-[11px] font-mono break-all max-h-24 overflow-y-auto select-all leading-snug">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">{decoded.parts.headerBase64}</span>
                <span className="text-zinc-400 font-bold">.</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{decoded.parts.payloadBase64}</span>
                <span className="text-zinc-400 font-bold">.</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{decoded.parts.signatureBase64 || '(unsigned)'}</span>
              </div>
            )}
          </div>

          {/* Quick Share / Export Action Bar */}
          {decoded.valid && (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Quick Developer Actions:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(`Authorization: Bearer ${safeToken}`, 'bearer-header')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  id="btn-copy-bearer"
                >
                  {copiedKey === 'bearer-header' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5" />}
                  <span>Copy Authorization Header</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(`curl -H "Authorization: Bearer ${safeToken}" https://api.example.com/v1/user`, 'curl-cmd')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  id="btn-copy-curl"
                >
                  {copiedKey === 'curl-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
                  <span>Copy cURL Example</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPayload}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  id="btn-download-payload"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Payload JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Decoded Inspector & Claim Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Expiration & Token Status Banner */}
          {decoded.valid ? (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {decoded.expirationStatus === 'active' ? (
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : decoded.expirationStatus === 'expired' ? (
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  ) : decoded.expirationStatus === 'immature' ? (
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Token Status:
                      </span>
                      {decoded.expirationStatus === 'active' && (
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          ACTIVE ({decoded.expirationTime.relativeText})
                        </span>
                      )}
                      {decoded.expirationStatus === 'expired' && (
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                          EXPIRED ({decoded.expirationTime.relativeText})
                        </span>
                      )}
                      {decoded.expirationStatus === 'immature' && (
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          NOT YET VALID (Starts {decoded.notBeforeTime.relativeText})
                        </span>
                      )}
                      {decoded.expirationStatus === 'none' && (
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          NO EXPIRATION CLAIM (exp not set)
                        </span>
                      )}
                      {decoded.expirationStatus === 'invalid_date' && (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          INVALID EXPIRATION TIMESTAMP
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Algorithm: <strong className="text-zinc-800 dark:text-zinc-200">{decoded.algorithm}</strong> • Type: <strong className="text-zinc-800 dark:text-zinc-200">{decoded.tokenType}</strong> • Status: <strong className="text-indigo-600 dark:text-indigo-400">Decoded (Parsed)</strong>
                    </span>
                  </div>
                </div>

                {decoded.expirationTime.localString && (
                  <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                    <div>Expires: <strong className="text-zinc-700 dark:text-zinc-300">{decoded.expirationTime.localString}</strong></div>
                    <div className="text-[10px] text-zinc-400">Unix: {decoded.expirationTime.unix}</div>
                  </div>
                )}
              </div>

              {/* Authenticity Notice */}
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 mt-1">
                <strong>Notice:</strong> Decoding parses token claims in local browser memory. A decoded token is not authentic or tamper-proof until its cryptographic signature is verified against a trusted key.
              </div>
            </div>
          ) : (
            decoded.error && (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Token Decoding Error</span>
                  <p className="leading-relaxed">{decoded.error}</p>
                </div>
              </div>
            )
          )}

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('payload')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payload'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                id="tab-payload"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Decoded Payload</span>
                {decoded.valid && decoded.payload && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {Object.keys(decoded.payload).length} claims
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'header'
                    ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                id="tab-header"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Header</span>
                {decoded.valid && decoded.header && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    {decoded.algorithm}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('signature')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'signature'
                    ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                id="tab-signature"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Verify Signature</span>
              </button>
            </div>

            {/* View Mode Toggle (in Payload tab) */}
            {activeTab === 'payload' && decoded.valid && (
              <div className="flex items-center gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setPayloadViewMode('claims')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    payloadViewMode === 'claims'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  id="view-mode-claims"
                >
                  Claims Table
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadViewMode('json')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    payloadViewMode === 'json'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  id="view-mode-json"
                >
                  Raw JSON
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: PAYLOAD CLAIMS */}
          {activeTab === 'payload' && (
            <div className="flex flex-col gap-3">
              {decoded.valid && decoded.payload ? (
                payloadViewMode === 'claims' ? (
                  <div className="flex flex-col rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
                    {/* Claims Search Bar */}
                    <div className="flex items-center justify-between p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={claimSearch}
                          onChange={(e) => setClaimSearch(e.target.value)}
                          placeholder="Filter claims by key, value or description..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                          aria-label="Filter claims"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(decoded.rawPayloadJson, 'payload-json')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        id="btn-copy-payload-json"
                      >
                        {copiedKey === 'payload-json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'payload-json' ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>

                    {/* Claims Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                          <tr>
                            <th className="p-3 w-36">Claim Key</th>
                            <th className="p-3">Claim Value</th>
                            <th className="p-3 w-48 hidden md:table-cell">Standard / Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                          {filteredClaims.length > 0 ? (
                            filteredClaims.map((claim) => {
                              const isObj = typeof claim.value === 'object' && claim.value !== null;
                              const isBool = typeof claim.value === 'boolean';
                              const isNum = typeof claim.value === 'number';

                              return (
                                <tr key={claim.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors">
                                  <td className="p-3 font-semibold text-indigo-700 dark:text-indigo-400 align-top">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-xs">{claim.key}</span>
                                      <span className="text-[10px] text-zinc-400 font-sans">{claim.label}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-zinc-800 dark:text-zinc-200 align-top break-all">
                                    {isBool ? (
                                      <span className={claim.value ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                        {String(claim.value)}
                                      </span>
                                    ) : isNum ? (
                                      <div className="flex flex-col">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{claim.value}</span>
                                        {claim.humanizedValue && (
                                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">
                                            {claim.humanizedValue}
                                          </span>
                                        )}
                                      </div>
                                    ) : isObj ? (
                                      <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-[11px] overflow-x-auto">
                                        <pre>{JSON.stringify(claim.value, null, 2)}</pre>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-800 dark:text-zinc-200 font-sans text-xs">
                                        "{String(claim.value)}"
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-sans align-top hidden md:table-cell">
                                    <div className="flex flex-col gap-1">
                                      {claim.standard && (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 w-fit">
                                          RFC 7519
                                        </span>
                                      )}
                                      <span className="leading-snug">{claim.description}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-zinc-400 text-xs font-sans">
                                No claims match the search query "{claimSearch}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Raw JSON View */
                  <div className="relative rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-zinc-100 p-4 shadow-xs font-mono text-xs overflow-x-auto">
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(decoded.rawPayloadJson, 'payload-raw-json')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-sans flex items-center gap-1 transition-colors cursor-pointer"
                        id="btn-copy-raw-payload-json"
                      >
                        {copiedKey === 'payload-raw-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'payload-raw-json' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="leading-relaxed">{decoded.rawPayloadJson}</pre>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-zinc-400 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  Enter or paste a valid JWT token to inspect payload claims.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HEADER */}
          {activeTab === 'header' && (
            <div className="flex flex-col gap-3">
              {decoded.valid && decoded.header ? (
                <div className="flex flex-col gap-4">
                  {/* Header summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex flex-col">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Algorithm (alg)</span>
                      <span className="text-base font-black text-rose-700 dark:text-rose-300 mt-1">{decoded.header.alg || 'none'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Token Type (typ)</span>
                      <span className="text-base font-black text-zinc-800 dark:text-zinc-200 mt-1">{decoded.header.typ || 'JWT'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Key ID (kid)</span>
                      <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 mt-1 truncate" title={decoded.header.kid || 'Not specified'}>
                        {decoded.header.kid || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Header JSON code box */}
                  <div className="relative rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-zinc-100 p-4 shadow-xs font-mono text-xs overflow-x-auto">
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(decoded.rawHeaderJson, 'header-json')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-sans flex items-center gap-1 transition-colors cursor-pointer"
                        id="btn-copy-header-json"
                      >
                        {copiedKey === 'header-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'header-json' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="leading-relaxed">{decoded.rawHeaderJson}</pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  Enter or paste a valid JWT token to inspect header data.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERIFY SIGNATURE */}
          {activeTab === 'signature' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Signature Verification
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    Alg: {decoded.algorithm}
                  </span>
                </div>

                {isNoneAlg ? (
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">Unsigned Token (alg: "none")</span>
                      <p className="leading-relaxed font-normal">
                        This token was created without a cryptographic signature. It cannot be authenticated, and its payload claims should never be trusted in production environments without external transport validation.
                      </p>
                    </div>
                  </div>
                ) : isAsymmetricAlg ? (
                  <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 text-xs flex items-start gap-2.5">
                    <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">Asymmetric Signature ({decoded.algorithm})</span>
                      <p className="leading-relaxed font-normal">
                        This token is signed using an asymmetric private key ({decoded.algorithm}). Validating its authenticity requires fetching or supplying the issuer's public key certificate (JWK / PEM), which cannot be authenticated using symmetric HMAC shared secrets.
                      </p>
                    </div>
                  </div>
                ) : isHmacAlg ? (
                  <>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Verify the cryptographic signature of HS256, HS384, or HS512 tokens client-side using the browser native Web Crypto API. Your secret key is kept strictly in local memory and is never transmitted over any network.
                    </p>

                    {/* Secret Input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="hmac-secret-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        HMAC Secret / Key:
                      </label>
                      <div className="relative">
                        <input
                          id="hmac-secret-input"
                          type={showSecret ? 'text' : 'password'}
                          value={hmacSecret}
                          onChange={(e) => setHmacSecret(e.target.value)}
                          placeholder="Enter the secret key used to sign the token..."
                          className="w-full pl-3 pr-10 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title={showSecret ? 'Hide secret' : 'Show secret'}
                          id="toggle-secret-visibility"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Secret Options & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none">
                        <input
                          type="checkbox"
                          checked={isBase64Secret}
                          onChange={(e) => setIsBase64Secret(e.target.checked)}
                          className="w-3.5 h-3.5 text-cyan-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-cyan-500"
                        />
                        <span>Secret is Base64 Encoded</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleVerifySignature}
                        disabled={isVerifyingSig || !decoded.valid}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        id="btn-verify-hmac"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isVerifyingSig ? 'Verifying...' : 'Verify Signature'}</span>
                      </button>
                    </div>

                    {/* Verification Result Banner */}
                    {signatureResult && (
                      <div
                        className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
                          signatureResult.isValid
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                        }`}
                        id="signature-verification-banner"
                      >
                        {signatureResult.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm">
                            {signatureResult.isValid ? 'Signature Verified' : 'Signature Invalid / Unverified'}
                          </span>
                          <p className="font-normal text-xs leading-relaxed">{signatureResult.message}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs">
                    Unsupported algorithm "{decoded.algorithm}". In-memory cryptographic signature verification is supported for HS256, HS384, and HS512.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Content Section (SEO & Educational) */}
      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Technical Guide & Documentation
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
            How JSON Web Tokens (JWT) Work
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-4xl">
            A JSON Web Token (JWT) is an open, industry-standard RFC 7519 method for securely representing claims between two parties. The token is composed of three Base64URL-encoded parts separated by periods:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">1. Header</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Specifies the cryptographic signing algorithm (such as HMAC SHA256 or RSA) and the token type (JWT).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">2. Payload (Claims)</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Contains the user identity, authorization roles, session expiration timestamps (exp, iat), and custom application data.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">3. Signature</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cryptographically secures the header and payload from tampering. Validated using a shared secret or public/private key pair.
            </p>
          </div>
        </div>

        {/* RFC 7519 Standard Claims Reference */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            RFC 7519 Standard Registered Claims Reference
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {Object.entries(STANDARD_CLAIMS_MAP).slice(0, 9).map(([key, def]) => (
              <div key={key} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{key}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold">{def.label}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">{def.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        {seoData.guideContent?.faqs && seoData.guideContent.faqs.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seoData.guideContent.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JwtDecoderPage;
