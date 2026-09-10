import { useState, useEffect, useCallback } from 'react';

interface SavedPassword {
  id: string;
  password: string;
  label: string;
  createdAt: number;
  options: PasswordOptions;
}

interface PasswordOptions {
  length: number;
  symbols: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
}

const SYMBOLS = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
  '-', '_', '=', '+', '{', '}', '[', ']', ':', ';', '"',
  "'", '<', '>', ',', '.', '?', '/'];
const LOWERCASE = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
  'v', 'w', 'x', 'y', 'z'];
const UPPERCASE = ['A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
  'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function generatePassword(options: PasswordOptions): string {
  let pool: string[] = [];
  if (options.symbols) pool = pool.concat(SYMBOLS);
  if (options.uppercase) pool = pool.concat(UPPERCASE);
  if (options.lowercase) pool = pool.concat(LOWERCASE);
  if (options.digits) pool = pool.concat(DIGITS);

  if (pool.length === 0) return '';

  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += pool[Math.floor(Math.random() * pool.length)];
  }
  return password;
}

function calculateStrength(password: string, options: PasswordOptions): { score: number; label: string; color: string } {
  let score = 0;
  if (options.length >= 8) score += 1;
  if (options.length >= 12) score += 1;
  if (options.length >= 16) score += 1;
  if (options.symbols) score += 1;
  if (options.uppercase && options.lowercase) score += 1;
  if (options.digits) score += 1;

  if (score <= 2) return { score, label: 'Слабый', color: '#ff3b30' };
  if (score <= 4) return { score, label: 'Средний', color: '#ff9500' };
  return { score, label: 'Сильный', color: '#34c759' };
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  return date.toLocaleDateString('ru-RU');
}

export default function App() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    symbols: true,
    uppercase: true,
    lowercase: true,
    digits: true,
  });
  const [password, setPassword] = useState('');
  const [savedPasswords, setSavedPasswords] = useState<SavedPassword[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'vault'>('generator');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load saved passwords from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('passwords_vault');
    if (saved) {
      try {
        setSavedPasswords(JSON.parse(saved));
      } catch {
        setSavedPasswords([]);
      }
    }
  }, []);

  // Save to localStorage when passwords change
  useEffect(() => {
    localStorage.setItem('passwords_vault', JSON.stringify(savedPasswords));
  }, [savedPasswords]);

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setCopied(false);
  }, [options]);

  // Generate initial password
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!password || !saveLabel.trim()) return;
    const newEntry: SavedPassword = {
      id: Date.now().toString() + Math.random().toString(36).substr(2),
      password,
      label: saveLabel.trim(),
      createdAt: Date.now(),
      options: { ...options },
    };
    setSavedPasswords(prev => [newEntry, ...prev]);
    setShowSaveModal(false);
    setSaveLabel('');
  };

  const handleDelete = (id: string) => {
    setSavedPasswords(prev => prev.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleCopySaved = async (pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pwd;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const strength = password ? calculateStrength(password, options) : { score: 0, label: '', color: '#e5e5ea' };
  const hasAnyOption = options.symbols || options.uppercase || options.lowercase || options.digits;

  return (
    <div className="min-h-screen pb-24">
      {/* iOS Status Bar */}
      <div className="sticky top-0 z-50">
        <div className="bg-white/80 backdrop-blur-xl border-b border-black/5">
          <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
            <h1 className="text-[28px] font-bold text-center text-black/90">
              {activeTab === 'generator' ? 'Генератор' : 'Хранилище'}
            </h1>
          </div>
          {/* Tab Bar */}
          <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'generator'
                  ? 'bg-[#007aff] text-white'
                  : 'bg-black/5 text-black/60'
              }`}
            >
              🔑 Генератор
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'vault'
                  ? 'bg-[#007aff] text-white'
                  : 'bg-black/5 text-black/60'
              }`}
            >
              🗄 Хранилище
              {savedPasswords.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'vault' ? 'bg-white/20' : 'bg-black/10'
                }`}>
                  {savedPasswords.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {activeTab === 'generator' ? (
          <>
            {/* Password Display */}
            <div className="ios-card p-5 slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-black/40 uppercase tracking-wider">Ваш пароль</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: strength.color + '20', color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>

              <div className="password-display bg-black/5 rounded-xl p-4 min-h-[60px] flex items-center mb-3">
                {hasAnyOption ? (
                  <span className="text-black/90">{password || 'Нажмите «Сгенерировать»'}</span>
                ) : (
                  <span className="text-red-500 text-sm">Выберите хотя бы один тип символов</span>
                )}
              </div>

              {/* Strength Bar */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="strength-bar flex-1"
                    style={{
                      backgroundColor: i <= strength.score ? strength.color : '#e5e5ea',
                    }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={!hasAnyOption}
                  className="ios-button flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  Сгенерировать
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!password || !hasAnyOption}
                  className="ios-button ios-button-secondary flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ width: 'auto', padding: '14px 18px' }}
                >
                  {copied ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!password || !hasAnyOption}
                  className="ios-button ios-button-secondary flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ width: 'auto', padding: '14px 18px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="ios-card overflow-hidden fade-in">
              {/* Length Slider */}
              <div className="p-4 border-b border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-medium text-black/90">Длина пароля</span>
                  <span className="text-[15px] font-semibold text-[#007aff] bg-[#007aff]/10 px-3 py-1 rounded-full">
                    {options.length}
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={options.length}
                  onChange={e => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="ios-slider"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-black/40">4</span>
                  <span className="text-xs text-black/40">64</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="divide-y divide-black/5">
                <ToggleRow
                  label="Специальные символы"
                  sublabel="!@#$%^&*()-_+=..."
                  active={options.symbols}
                  onToggle={() => setOptions(prev => ({ ...prev, symbols: !prev.symbols }))}
                />
                <ToggleRow
                  label="Заглавные буквы"
                  sublabel="A B C D E F..."
                  active={options.uppercase}
                  onToggle={() => setOptions(prev => ({ ...prev, uppercase: !prev.uppercase }))}
                />
                <ToggleRow
                  label="Строчные буквы"
                  sublabel="a b c d e f..."
                  active={options.lowercase}
                  onToggle={() => setOptions(prev => ({ ...prev, lowercase: !prev.lowercase }))}
                />
                <ToggleRow
                  label="Цифры"
                  sublabel="0 1 2 3 4 5..."
                  active={options.digits}
                  onToggle={() => setOptions(prev => ({ ...prev, digits: !prev.digits }))}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="ios-card p-4 fade-in">
              <span className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3 block">Быстрые настройки</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOptions({ length: 8, symbols: false, uppercase: true, lowercase: true, digits: true })}
                  className="py-2.5 px-3 rounded-xl bg-black/5 text-xs font-semibold text-black/70 hover:bg-black/10 transition-colors"
                >
                  Простой
                </button>
                <button
                  onClick={() => setOptions({ length: 16, symbols: true, uppercase: true, lowercase: true, digits: true })}
                  className="py-2.5 px-3 rounded-xl bg-black/5 text-xs font-semibold text-black/70 hover:bg-black/10 transition-colors"
                >
                  Надёжный
                </button>
                <button
                  onClick={() => setOptions({ length: 32, symbols: true, uppercase: true, lowercase: true, digits: true })}
                  className="py-2.5 px-3 rounded-xl bg-black/5 text-xs font-semibold text-black/70 hover:bg-black/10 transition-colors"
                >
                  Максимальный
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Vault Tab */
          <>
            {savedPasswords.length === 0 ? (
              <div className="ios-card p-8 text-center slide-up">
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">Хранилище пусто</h3>
                <p className="text-sm text-black/50">
                  Сгенерируйте пароль и сохраните его, чтобы он появился здесь
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedPasswords.map((item, index) => (
                  <div key={item.id} className="ios-card p-4 slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-semibold text-black/90 truncate">{item.label}</h4>
                        <p className="text-xs text-black/40 mt-0.5">{formatDate(item.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(item.id)}
                        className="p-2 -mr-2 -mt-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div className="password-display text-sm bg-black/5 rounded-lg p-3 mb-3 text-black/70">
                      {item.password}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {item.options.symbols && <Tag label="!@#" />}
                        {item.options.uppercase && <Tag label="ABC" />}
                        {item.options.lowercase && <Tag label="abc" />}
                        {item.options.digits && <Tag label="123" />}
                      </div>
                      <span className="text-xs text-black/40 ml-auto">{item.options.length} симв.</span>
                    </div>
                    <button
                      onClick={() => handleCopySaved(item.password)}
                      className="mt-3 w-full py-2 rounded-lg bg-[#007aff]/10 text-[#007aff] text-sm font-semibold hover:bg-[#007aff]/15 transition-colors"
                    >
                      Скопировать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Сохранить пароль</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-full hover:bg-black/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-black/50 mb-4">Подпишите пароль, чтобы было понятно, от чего он:</p>
            <input
              type="text"
              value={saveLabel}
              onChange={e => setSaveLabel(e.target.value)}
              placeholder="Например: Gmail, Netflix, WiFi..."
              className="ios-input mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className="password-display text-sm bg-black/5 rounded-lg p-3 mb-4 text-black/60 truncate">
              {password}
            </div>
            <button
              onClick={handleSave}
              disabled={!saveLabel.trim()}
              className="ios-button disabled:opacity-40"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="bg-white/95 backdrop-blur-xl rounded-2xl w-[280px] overflow-hidden slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <h3 className="text-[17px] font-semibold mb-1">Удалить пароль?</h3>
              <p className="text-[13px] text-black/50">Это действие нельзя отменить</p>
            </div>
            <div className="border-t border-black/10">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="w-full py-3 text-[17px] font-medium text-[#ff3b30] border-b border-black/10"
              >
                Удалить
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full py-3 text-[17px] font-semibold text-[#007aff]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, sublabel, active, onToggle }: {
  label: string;
  sublabel: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-[15px] font-medium text-black/90">{label}</p>
        <p className="text-xs text-black/40 mt-0.5">{sublabel}</p>
      </div>
      <div className={`ios-toggle ${active ? 'active' : ''}`} onClick={onToggle} />
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold bg-black/5 text-black/50 px-1.5 py-0.5 rounded">
      {label}
    </span>
  );
}
