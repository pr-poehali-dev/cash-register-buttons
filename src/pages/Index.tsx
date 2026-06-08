import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

// --- Audio ---
const playCashRegister = () => {
  const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const bell = (freq: number, startTime: number, duration: number, gain: number) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env); env.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime); osc.stop(startTime + duration);
  };
  const t = ctx.currentTime;
  bell(1318, t, 0.5, 0.4); bell(1760, t + 0.07, 0.45, 0.3);
  bell(2637, t + 0.13, 0.6, 0.2); bell(1318, t + 0.22, 0.35, 0.15);
};

const playScan = () => {
  const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.connect(env); env.connect(ctx.destination);
  osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);
  env.gain.setValueAtTime(0.3, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
};

// --- Types ---
type Operation = "+" | "-" | null;
type PayMethod = "card" | "qr" | "cash" | "mir" | null;
type Screen = "pin" | "calc" | "pay" | "success" | "products" | "scanner";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface HistoryItem {
  expression: string;
  result: string;
}

const CORRECT_PIN = "5555";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Хлеб белый", price: 45, barcode: "4600001" },
  { id: "2", name: "Молоко 1л", price: 89, barcode: "4600002" },
  { id: "3", name: "Вода 0.5л", price: 35, barcode: "4600003" },
  { id: "4", name: "Кофе американо", price: 150, barcode: "4600004" },
];

// --- PIN Screen ---
const PinScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next); setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) { onSuccess(); }
        else {
          setShake(true); setError(true);
          setTimeout(() => { setPin(""); setShake(false); }, 600);
        }
      }, 120);
    }
  };

  return (
    <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
      <div className="w-full max-w-[320px] flex flex-col items-center animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-cash-surface border border-cash-border flex items-center justify-center mb-6 shadow-sm">
          <Icon name="Lock" size={24} className="text-cash-muted" />
        </div>
        <p className="text-cash-text text-lg font-semibold mb-1">Введите PIN</p>
        <p className="text-cash-muted text-sm mb-8">Для доступа к кассе</p>
        <div className={`flex gap-4 mb-10 ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${pin.length > i ? error ? "bg-red-400 border-red-400" : "bg-cash-accent border-cash-accent" : "border-cash-border bg-transparent"}`} />
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mb-6 -mt-6 animate-fade-in">Неверный PIN</p>}
        <div className="grid grid-cols-3 gap-3 w-full">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button key={d} onClick={() => handleDigit(d)} className="h-16 rounded-xl bg-cash-surface border border-cash-border text-cash-text text-xl font-medium hover:bg-gray-50 active:scale-95 transition-all duration-100">{d}</button>
          ))}
          <div />
          <button onClick={() => handleDigit("0")} className="h-16 rounded-xl bg-cash-surface border border-cash-border text-cash-text text-xl font-medium hover:bg-gray-50 active:scale-95 transition-all duration-100">0</button>
          <button onClick={() => setPin(p => p.slice(0, -1))} className="h-16 rounded-xl bg-cash-surface border border-cash-border text-cash-muted text-lg hover:bg-gray-50 active:scale-95 transition-all duration-100">⌫</button>
        </div>
      </div>
    </div>
  );
};

// --- CashButton ---
const CashButton = ({ children, onClick, variant = "default", wide = false }: {
  children: React.ReactNode; onClick: () => void;
  variant?: "default" | "operator" | "cancel" | "equal"; wide?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);
  const handleClick = () => { setPressed(true); setTimeout(() => setPressed(false), 150); onClick(); };
  const variants: Record<string, string> = {
    default: "bg-cash-surface border-cash-border text-cash-text hover:bg-gray-50 active:bg-gray-100 text-xl",
    operator: "bg-cash-surface border-cash-border text-cash-accent hover:bg-gray-50 active:bg-gray-100 text-2xl font-light",
    cancel: "bg-white border-red-200 text-red-500 hover:bg-red-50 active:bg-red-100 text-sm font-semibold tracking-wide",
    equal: "bg-cash-accent border-cash-accent text-white hover:opacity-90 active:opacity-80 text-2xl",
  };
  return (
    <button className={`relative flex items-center justify-center select-none cursor-pointer transition-all duration-100 font-golos font-medium rounded-xl border ${variants[variant]} ${wide ? "col-span-2" : ""} ${pressed ? "scale-95" : "scale-100"} h-[72px]`} onClick={handleClick}>
      {children}
    </button>
  );
};

// --- Pay Methods ---
const PAY_METHODS = [
  { id: "card" as PayMethod, label: "Банковская карта", icon: "CreditCard", hint: "Visa, Mastercard" },
  { id: "mir" as PayMethod, label: "Мир", icon: "CreditCard", hint: "Карта Мир" },
  { id: "qr" as PayMethod, label: "QR-код / СБП", icon: "QrCode", hint: "Система быстрых платежей" },
  { id: "cash" as PayMethod, label: "Наличные", icon: "Banknote", hint: "Оплата наличными" },
];

// --- Products Manager ---
const ProductsScreen = ({ products, onSave, onBack }: {
  products: Product[]; onSave: (p: Product[]) => void; onBack: () => void;
}) => {
  const [list, setList] = useState<Product[]>(products);
  const [form, setForm] = useState({ name: "", price: "", barcode: "" });
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!form.name || !form.price) return;
    const newP: Product = { id: Date.now().toString(), name: form.name, price: parseFloat(form.price), barcode: form.barcode || Date.now().toString() };
    const updated = [...list, newP];
    setList(updated); onSave(updated);
    setForm({ name: "", price: "", barcode: "" }); setAdding(false);
  };

  const handleDelete = (id: string) => {
    const updated = list.filter(p => p.id !== id);
    setList(updated); onSave(updated);
  };

  return (
    <div className="min-h-screen bg-cash-bg font-golos p-4">
      <div className="max-w-[400px] mx-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5 pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-cash-muted hover:text-cash-text transition-colors text-sm">
            <Icon name="ChevronLeft" size={16} />Назад
          </button>
          <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">Товары</p>
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-cash-accent text-sm font-medium hover:opacity-70 transition-opacity">
            <Icon name="Plus" size={16} />Добавить
          </button>
        </div>
        <div className="h-px bg-cash-border mb-4" />

        {adding && (
          <div className="bg-cash-surface border border-cash-border rounded-2xl p-4 mb-4 animate-fade-in">
            <p className="text-sm font-medium text-cash-text mb-3">Новый товар</p>
            <div className="space-y-2">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название товара" className="w-full h-11 px-3 rounded-xl border border-cash-border bg-cash-bg text-cash-text text-sm outline-none focus:border-cash-accent transition-colors" />
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Цена, ₽" type="number" className="w-full h-11 px-3 rounded-xl border border-cash-border bg-cash-bg text-cash-text text-sm outline-none focus:border-cash-accent transition-colors" />
              <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Штрихкод (необязательно)" className="w-full h-11 px-3 rounded-xl border border-cash-border bg-cash-bg text-cash-text text-sm outline-none focus:border-cash-accent transition-colors" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setAdding(false)} className="flex-1 h-11 rounded-xl border border-cash-border text-cash-muted text-sm hover:bg-gray-50 transition-colors">Отмена</button>
              <button onClick={handleAdd} className="flex-1 h-11 rounded-xl bg-cash-accent text-white text-sm font-medium hover:opacity-90 transition-opacity">Сохранить</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {list.length === 0 && (
            <div className="text-center py-12 text-cash-muted text-sm">
              <Icon name="Package" size={32} className="mx-auto mb-3 opacity-30" />
              Товаров пока нет
            </div>
          )}
          {list.map((p) => (
            <div key={p.id} className="bg-cash-surface border border-cash-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-cash-text text-sm font-medium">{p.name}</p>
                <p className="text-cash-muted text-xs font-mono mt-0.5">{p.barcode}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-cash-accent font-semibold text-sm">{p.price} ₽</p>
                <button onClick={() => handleDelete(p.id)} className="text-cash-muted hover:text-red-400 transition-colors">
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Scanner Screen ---
const ScannerScreen = ({ products, onScanned, onBack }: {
  products: Product[]; onScanned: (p: Product) => void; onBack: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const tryFind = (val: string) => {
    const found = products.find(p => p.barcode === val.trim() || p.name.toLowerCase().includes(val.trim().toLowerCase()));
    if (found) {
      playScan();
      setFlash(found.name);
      setTimeout(() => { onScanned(found); }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-cash-bg font-golos p-4">
      <div className="max-w-[400px] mx-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5 pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-cash-muted hover:text-cash-text transition-colors text-sm">
            <Icon name="ChevronLeft" size={16} />Назад
          </button>
          <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">Сканер</p>
          <div className="w-12" />
        </div>
        <div className="h-px bg-cash-border mb-6" />

        <div className="bg-cash-surface border border-cash-border rounded-2xl p-5 mb-5 flex flex-col items-center shadow-sm">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${flash ? "bg-green-50 border-2 border-green-300" : "bg-gray-50 border-2 border-dashed border-cash-border"}`}>
            <Icon name={flash ? "CheckCircle2" : "ScanLine"} size={36} className={flash ? "text-green-500" : "text-cash-muted"} />
          </div>
          {flash
            ? <p className="text-green-600 font-medium text-sm animate-fade-in">{flash} — добавлен!</p>
            : <p className="text-cash-muted text-sm">Введите штрихкод или название</p>
          }
        </div>

        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && tryFind(query)}
            placeholder="Штрихкод или название товара..."
            className="flex-1 h-12 px-4 rounded-xl border border-cash-border bg-cash-surface text-cash-text text-sm outline-none focus:border-cash-accent transition-colors"
            autoFocus
          />
          <button onClick={() => tryFind(query)} className="h-12 px-4 rounded-xl bg-cash-accent text-white hover:opacity-90 active:scale-95 transition-all">
            <Icon name="Search" size={18} />
          </button>
        </div>

        <p className="text-cash-muted text-xs font-mono uppercase tracking-widest mb-3">Все товары</p>
        <div className="space-y-2">
          {products.map((p) => (
            <button key={p.id} onClick={() => { playScan(); setFlash(p.name); setTimeout(() => onScanned(p), 600); }}
              className="w-full bg-cash-surface border border-cash-border rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:scale-[0.99] transition-all">
              <div className="text-left">
                <p className="text-cash-text text-sm font-medium">{p.name}</p>
                <p className="text-cash-muted text-xs font-mono">{p.barcode}</p>
              </div>
              <p className="text-cash-accent font-semibold text-sm">{p.price} ₽</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main ---
export default function Index() {
  const [display, setDisplay] = useState("0");
  const [firstNumber, setFirstNumber] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingNext, setWaitingNext] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expression, setExpression] = useState("");
  const [screen, setScreen] = useState<Screen>("pin");
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>(null);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    const total = cartTotal + product.price;
    setDisplay(total.toString());
  };

  const handleDigit = useCallback((digit: string) => {
    if (cart.length > 0) return;
    if (waitingNext) { setDisplay(digit); setWaitingNext(false); return; }
    if (display === "0") { setDisplay(digit); }
    else if (display.length < 12) { setDisplay(display + digit); }
  }, [display, waitingNext, cart]);

  const calcResult = (a: string, b: string, op: Operation): string => {
    const numA = parseFloat(a), numB = parseFloat(b);
    let result: number;
    if (op === "+") result = numA + numB;
    else if (op === "-") result = numA - numB;
    else return b;
    const str = result.toString();
    if (str.includes(".") && str.split(".")[1].length > 4) return result.toFixed(4).replace(/\.?0+$/, "");
    return str;
  };

  const handleOperation = useCallback((op: Operation) => {
    if (cart.length > 0) return;
    if (firstNumber !== null && !waitingNext) {
      const result = calcResult(firstNumber, display, operation!);
      setDisplay(result); setFirstNumber(result); setExpression(result + " " + op + " ");
    } else { setFirstNumber(display); setExpression(display + " " + op + " "); }
    setOperation(op); setWaitingNext(true);
  }, [display, firstNumber, operation, waitingNext, cart]);

  const handleEqual = useCallback(() => {
    if (firstNumber === null || operation === null || waitingNext) return;
    const result = calcResult(firstNumber, display, operation);
    const expr = expression + display;
    setHistory(prev => [{ expression: expr, result }, ...prev.slice(0, 4)]);
    setDisplay(result); setFirstNumber(null); setOperation(null); setWaitingNext(true); setExpression("");
  }, [firstNumber, display, operation, expression, waitingNext]);

  const handleBackspace = useCallback(() => {
    if (cart.length > 0 || waitingNext || display === "0") return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }, [display, waitingNext, cart]);

  const handleCancel = useCallback(() => {
    setDisplay("0"); setFirstNumber(null); setOperation(null);
    setWaitingNext(false); setExpression(""); setCart([]);
  }, []);

  const handlePayConfirm = () => {
    if (!selectedMethod) return;
    playCashRegister();
    setScreen("success");
    setTimeout(() => {
      setDisplay("0"); setFirstNumber(null); setOperation(null);
      setWaitingNext(false); setExpression(""); setSelectedMethod(null); setCart([]);
      setScreen("calc");
    }, 2200);
  };

  const formatDisplay = (val: string) => {
    if (val.includes(".")) return val;
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    return num.toLocaleString("ru-RU");
  };

  const displayFontSize = display.length > 10 ? "text-3xl" : display.length > 7 ? "text-4xl" : "text-5xl";
  const totalAmount = display !== "0" ? formatDisplay(display) : null;

  if (screen === "pin") return <PinScreen onSuccess={() => setScreen("calc")} />;

  if (screen === "products") return <ProductsScreen products={products} onSave={setProducts} onBack={() => setScreen("calc")} />;

  if (screen === "scanner") return <ScannerScreen products={products} onScanned={(p) => { addToCart(p); setScreen("calc"); }} onBack={() => setScreen("calc")} />;

  if (screen === "success") {
    const method = PAY_METHODS.find(m => m.id === selectedMethod);
    return (
      <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] flex flex-col items-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-5">
            <Icon name="Check" size={36} className="text-green-600" />
          </div>
          <p className="text-2xl font-semibold text-cash-text mb-1">Оплата принята</p>
          <p className="text-cash-muted text-sm mb-3">{method?.label} · {cart.length > 0 ? cartTotal.toLocaleString("ru-RU") : formatDisplay(display)} ₽</p>
          <div className="h-px bg-cash-border w-full mb-3" />
          <p className="text-[11px] font-mono text-cash-muted tracking-widest uppercase">Возврат к кассе...</p>
        </div>
      </div>
    );
  }

  if (screen === "pay") {
    const amount = cart.length > 0 ? cartTotal : parseFloat(display);
    return (
      <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] animate-slide-up">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => { setScreen("calc"); setSelectedMethod(null); }} className="flex items-center gap-1.5 text-cash-muted hover:text-cash-text transition-colors text-sm">
                <Icon name="ChevronLeft" size={16} />Назад
              </button>
              <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">Оплата</p>
              <div className="w-12" />
            </div>
            <div className="h-px bg-cash-border" />
          </div>
          <div className="bg-cash-surface border border-cash-border rounded-2xl p-5 mb-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <p className="text-cash-muted text-xs font-mono uppercase tracking-widest mb-1">К оплате</p>
            <p className="text-5xl font-mono font-light text-cash-text">{amount.toLocaleString("ru-RU")} ₽</p>
            {cart.length > 0 && (
              <div className="mt-3 pt-3 border-t border-cash-border space-y-1">
                {cart.map(i => (
                  <div key={i.product.id} className="flex justify-between text-xs text-cash-muted">
                    <span>{i.product.name} × {i.qty}</span>
                    <span>{(i.product.price * i.qty).toLocaleString("ru-RU")} ₽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-cash-muted text-xs font-mono uppercase tracking-widest mb-3 px-1">Способ оплаты</p>
          <div className="space-y-2 mb-4">
            {PAY_METHODS.map((method) => (
              <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-150 ${selectedMethod === method.id ? "border-cash-accent bg-cash-accent text-white shadow-md scale-[1.01]" : "border-cash-border bg-cash-surface text-cash-text hover:bg-gray-50"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selectedMethod === method.id ? "bg-white/15" : "bg-gray-100"}`}>
                  <Icon name={method.icon} size={18} className={selectedMethod === method.id ? "text-white" : "text-cash-muted"} />
                </div>
                <div className="text-left">
                  <p className={`font-medium text-sm ${selectedMethod === method.id ? "text-white" : "text-cash-text"}`}>{method.label}</p>
                  <p className={`text-xs mt-0.5 ${selectedMethod === method.id ? "text-white/70" : "text-cash-muted"}`}>{method.hint}</p>
                </div>
                {selectedMethod === method.id && <div className="ml-auto"><Icon name="CheckCircle2" size={18} className="text-white" /></div>}
              </button>
            ))}
          </div>
          <button onClick={handlePayConfirm} disabled={!selectedMethod}
            className={`w-full h-14 rounded-xl font-semibold text-base transition-all duration-150 ${selectedMethod ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-md" : "bg-gray-100 text-cash-muted cursor-not-allowed"}`}>
            {selectedMethod ? "Подтвердить оплату" : "Выберите способ оплаты"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] animate-slide-up">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">Касса</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setScreen("products")} className="text-cash-muted hover:text-cash-text transition-colors" title="Товары">
                <Icon name="Package" size={16} />
              </button>
              <p className="text-cash-muted text-[11px] font-mono">
                {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="h-px bg-cash-border" />
        </div>

        <div className="bg-cash-surface border border-cash-border rounded-2xl p-5 mb-3 min-h-[148px] flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
          {cart.length > 0 ? (
            <div className="space-y-1.5">
              {cart.map(i => (
                <div key={i.product.id} className="flex justify-between items-center animate-fade-in">
                  <span className="text-sm text-cash-text truncate">{i.product.name} <span className="text-cash-muted">×{i.qty}</span></span>
                  <span className="text-sm font-mono text-cash-accent shrink-0 ml-2">{(i.product.price * i.qty).toLocaleString("ru-RU")} ₽</span>
                </div>
              ))}
              <div className="h-px bg-cash-border mt-2 pt-2">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-cash-muted font-mono uppercase tracking-wide">Итого</span>
                  <span className="text-xl font-mono font-semibold text-cash-text">{cartTotal.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-[32px]">
                {history.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex justify-between items-center" style={{ opacity: 0.25 - i * 0.1 }}>
                    <span className="text-xs font-mono text-cash-muted truncate">{item.expression}</span>
                    <span className="text-xs font-mono text-cash-muted ml-2 shrink-0">= {formatDisplay(item.result)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end mt-2">
                {expression && <div className="text-cash-muted text-sm font-mono mb-1 tracking-wide">{expression}</div>}
                <div className={`${displayFontSize} font-mono font-light text-cash-text tracking-tight leading-none`}>{formatDisplay(display)}</div>
                <div className="mt-2.5 h-4 flex items-center">
                  {operation && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cash-accent opacity-50" />
                      <span className="text-[11px] text-cash-muted font-mono">{operation === "+" ? "сложение" : "вычитание"}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => setScreen("scanner")}
          className="w-full h-12 mb-3 rounded-xl border-2 border-dashed border-cash-border text-cash-muted hover:border-cash-accent hover:text-cash-accent active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 text-sm font-medium">
          <Icon name="ScanLine" size={18} />
          Сканировать товар
        </button>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <CashButton onClick={() => handleDigit("7")}>7</CashButton>
          <CashButton onClick={() => handleDigit("8")}>8</CashButton>
          <CashButton onClick={() => handleDigit("9")}>9</CashButton>
          <CashButton onClick={() => handleOperation("+")} variant="operator">+</CashButton>
          <CashButton onClick={() => handleDigit("4")}>4</CashButton>
          <CashButton onClick={() => handleDigit("5")}>5</CashButton>
          <CashButton onClick={() => handleDigit("6")}>6</CashButton>
          <CashButton onClick={() => handleOperation("-")} variant="operator">−</CashButton>
          <CashButton onClick={() => handleDigit("1")}>1</CashButton>
          <CashButton onClick={() => handleDigit("2")}>2</CashButton>
          <CashButton onClick={() => handleDigit("3")}>3</CashButton>
          <CashButton onClick={handleEqual} variant="equal">=</CashButton>
          <CashButton onClick={() => handleDigit("0")} wide>0</CashButton>
          <CashButton onClick={handleBackspace}>⌫</CashButton>
          <CashButton onClick={handleCancel} variant="cancel">ОТМЕНА</CashButton>
        </div>

        <button onClick={() => (display !== "0" || cart.length > 0) && setScreen("pay")}
          className={`w-full h-14 rounded-xl font-semibold text-base transition-all duration-150 flex items-center justify-center gap-2 ${(display !== "0" || cart.length > 0) ? "bg-cash-accent text-white hover:opacity-90 active:scale-[0.98] shadow-[0_2px_12px_rgba(0,0,0,0.15)]" : "bg-gray-100 text-cash-muted cursor-not-allowed"}`}>
          <Icon name="Wallet" size={18} />
          {cart.length > 0 ? `Оплатить ${cartTotal.toLocaleString("ru-RU")} ₽` : display !== "0" ? `Оплатить ${formatDisplay(display)} ₽` : "Введите сумму"}
        </button>

        <div className="mt-5 h-px bg-cash-border" />
        <p className="text-center text-cash-muted text-[10px] font-mono mt-3 tracking-[0.2em] uppercase">Версия 1.0</p>
      </div>
    </div>
  );
}
