import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const playCashRegister = () => {
  const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();

  const bell = (freq: number, startTime: number, duration: number, gain: number) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const t = ctx.currentTime;
  bell(1318, t, 0.5, 0.4);
  bell(1760, t + 0.07, 0.45, 0.3);
  bell(2637, t + 0.13, 0.6, 0.2);
  bell(1318, t + 0.22, 0.35, 0.15);
};

type Operation = "+" | "-" | null;
type PayMethod = "card" | "qr" | "cash" | "mir" | null;
type Screen = "calc" | "pay" | "success";

interface HistoryItem {
  expression: string;
  result: string;
}

const CashButton = ({
  children,
  onClick,
  variant = "default",
  wide = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "operator" | "cancel" | "equal";
  wide?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    onClick();
  };

  const variants: Record<string, string> = {
    default:
      "bg-cash-surface border-cash-border text-cash-text hover:bg-gray-50 active:bg-gray-100 text-xl",
    operator:
      "bg-cash-surface border-cash-border text-cash-accent hover:bg-gray-50 active:bg-gray-100 text-2xl font-light",
    cancel:
      "bg-white border-red-200 text-red-500 hover:bg-red-50 active:bg-red-100 text-sm font-semibold tracking-wide",
    equal:
      "bg-cash-accent border-cash-accent text-white hover:opacity-90 active:opacity-80 text-2xl",
  };

  return (
    <button
      className={`relative flex items-center justify-center select-none cursor-pointer transition-all duration-100 font-golos font-medium rounded-xl border ${variants[variant]} ${wide ? "col-span-2" : ""} ${pressed ? "scale-95" : "scale-100"} h-[72px]`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

const PAY_METHODS = [
  {
    id: "card" as PayMethod,
    label: "Банковская карта",
    icon: "CreditCard",
    hint: "Visa, Mastercard",
  },
  {
    id: "mir" as PayMethod,
    label: "Мир",
    icon: "CreditCard",
    hint: "Карта Мир",
  },
  {
    id: "qr" as PayMethod,
    label: "QR-код / СБП",
    icon: "QrCode",
    hint: "Система быстрых платежей",
  },
  {
    id: "cash" as PayMethod,
    label: "Наличные",
    icon: "Banknote",
    hint: "Оплата наличными",
  },
];

export default function Index() {
  const [display, setDisplay] = useState("0");
  const [firstNumber, setFirstNumber] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingNext, setWaitingNext] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expression, setExpression] = useState("");
  const [screen, setScreen] = useState<Screen>("calc");
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>(null);

  const handleDigit = useCallback(
    (digit: string) => {
      if (waitingNext) {
        setDisplay(digit);
        setWaitingNext(false);
        return;
      }
      if (display === "0") {
        setDisplay(digit);
      } else if (display.length < 12) {
        setDisplay(display + digit);
      }
    },
    [display, waitingNext]
  );

  const calcResult = (a: string, b: string, op: Operation): string => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    let result: number;
    if (op === "+") result = numA + numB;
    else if (op === "-") result = numA - numB;
    else return b;
    const str = result.toString();
    if (str.includes(".") && str.split(".")[1].length > 4) {
      return result.toFixed(4).replace(/\.?0+$/, "");
    }
    return str;
  };

  const handleOperation = useCallback(
    (op: Operation) => {
      if (firstNumber !== null && !waitingNext) {
        const result = calcResult(firstNumber, display, operation!);
        setDisplay(result);
        setFirstNumber(result);
        setExpression(result + " " + op + " ");
      } else {
        setFirstNumber(display);
        setExpression(display + " " + op + " ");
      }
      setOperation(op);
      setWaitingNext(true);
    },
    [display, firstNumber, operation, waitingNext]
  );

  const handleEqual = useCallback(() => {
    if (firstNumber === null || operation === null || waitingNext) return;
    const result = calcResult(firstNumber, display, operation);
    const expr = expression + display;
    setHistory((prev) => [{ expression: expr, result }, ...prev.slice(0, 4)]);
    setDisplay(result);
    setFirstNumber(null);
    setOperation(null);
    setWaitingNext(true);
    setExpression("");
  }, [firstNumber, display, operation, expression, waitingNext]);

  const handleBackspace = useCallback(() => {
    if (waitingNext || display === "0") return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display, waitingNext]);

  const handleCancel = useCallback(() => {
    setDisplay("0");
    setFirstNumber(null);
    setOperation(null);
    setWaitingNext(false);
    setExpression("");
  }, []);

  const handlePayConfirm = () => {
    if (!selectedMethod) return;
    playCashRegister();
    setScreen("success");
    setTimeout(() => {
      setDisplay("0");
      setFirstNumber(null);
      setOperation(null);
      setWaitingNext(false);
      setExpression("");
      setSelectedMethod(null);
      setScreen("calc");
    }, 2200);
  };

  const formatDisplay = (val: string) => {
    if (val.includes(".")) return val;
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    return num.toLocaleString("ru-RU");
  };

  const displayFontSize =
    display.length > 10
      ? "text-3xl"
      : display.length > 7
        ? "text-4xl"
        : "text-5xl";

  const totalAmount = display !== "0" ? formatDisplay(display) : null;

  if (screen === "success") {
    const method = PAY_METHODS.find((m) => m.id === selectedMethod);
    return (
      <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] flex flex-col items-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-5">
            <Icon name="Check" size={36} className="text-green-600" />
          </div>
          <p className="text-2xl font-semibold text-cash-text mb-1">
            Оплата принята
          </p>
          <p className="text-cash-muted text-sm mb-3">
            {method?.label} · {formatDisplay(display)} ₽
          </p>
          <div className="h-px bg-cash-border w-full mb-3" />
          <p className="text-[11px] font-mono text-cash-muted tracking-widest uppercase">
            Возврат к кассе...
          </p>
        </div>
      </div>
    );
  }

  if (screen === "pay") {
    return (
      <div className="min-h-screen bg-cash-bg font-golos flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] animate-slide-up">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => { setScreen("calc"); setSelectedMethod(null); }}
                className="flex items-center gap-1.5 text-cash-muted hover:text-cash-text transition-colors text-sm"
              >
                <Icon name="ChevronLeft" size={16} />
                Назад
              </button>
              <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">
                Оплата
              </p>
              <div className="w-12" />
            </div>
            <div className="h-px bg-cash-border" />
          </div>

          <div className="bg-cash-surface border border-cash-border rounded-2xl p-5 mb-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <p className="text-cash-muted text-xs font-mono uppercase tracking-widest mb-1">
              К оплате
            </p>
            <p className="text-5xl font-mono font-light text-cash-text">
              {totalAmount} ₽
            </p>
          </div>

          <p className="text-cash-muted text-xs font-mono uppercase tracking-widest mb-3 px-1">
            Способ оплаты
          </p>

          <div className="space-y-2 mb-4">
            {PAY_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-150 ${
                  selectedMethod === method.id
                    ? "border-cash-accent bg-cash-accent text-white shadow-md scale-[1.01]"
                    : "border-cash-border bg-cash-surface text-cash-text hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedMethod === method.id
                      ? "bg-white/15"
                      : "bg-gray-100"
                  }`}
                >
                  <Icon
                    name={method.icon}
                    size={18}
                    className={selectedMethod === method.id ? "text-white" : "text-cash-muted"}
                  />
                </div>
                <div className="text-left">
                  <p className={`font-medium text-sm ${selectedMethod === method.id ? "text-white" : "text-cash-text"}`}>
                    {method.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${selectedMethod === method.id ? "text-white/70" : "text-cash-muted"}`}>
                    {method.hint}
                  </p>
                </div>
                {selectedMethod === method.id && (
                  <div className="ml-auto">
                    <Icon name="CheckCircle2" size={18} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handlePayConfirm}
            disabled={!selectedMethod}
            className={`w-full h-14 rounded-xl font-semibold text-base transition-all duration-150 ${
              selectedMethod
                ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-md"
                : "bg-gray-100 text-cash-muted cursor-not-allowed"
            }`}
          >
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
            <p className="text-cash-muted text-[11px] font-mono tracking-widest uppercase">
              Касса
            </p>
            <p className="text-cash-muted text-[11px] font-mono">
              {new Date().toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="h-px bg-cash-border" />
        </div>

        <div className="bg-cash-surface border border-cash-border rounded-2xl p-5 mb-3 min-h-[148px] flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
          <div className="min-h-[32px]">
            {history.slice(0, 2).map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center"
                style={{ opacity: 0.25 - i * 0.1 }}
              >
                <span className="text-xs font-mono text-cash-muted truncate">
                  {item.expression}
                </span>
                <span className="text-xs font-mono text-cash-muted ml-2 shrink-0">
                  = {formatDisplay(item.result)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end mt-2">
            {expression && (
              <div className="text-cash-muted text-sm font-mono mb-1 tracking-wide">
                {expression}
              </div>
            )}
            <div
              className={`${displayFontSize} font-mono font-light text-cash-text tracking-tight leading-none`}
            >
              {formatDisplay(display)}
            </div>
            <div className="mt-2.5 h-4 flex items-center">
              {operation && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cash-accent opacity-50" />
                  <span className="text-[11px] text-cash-muted font-mono">
                    {operation === "+" ? "сложение" : "вычитание"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <CashButton onClick={() => handleDigit("7")}>7</CashButton>
          <CashButton onClick={() => handleDigit("8")}>8</CashButton>
          <CashButton onClick={() => handleDigit("9")}>9</CashButton>
          <CashButton onClick={() => handleOperation("+")} variant="operator">
            +
          </CashButton>

          <CashButton onClick={() => handleDigit("4")}>4</CashButton>
          <CashButton onClick={() => handleDigit("5")}>5</CashButton>
          <CashButton onClick={() => handleDigit("6")}>6</CashButton>
          <CashButton onClick={() => handleOperation("-")} variant="operator">
            −
          </CashButton>

          <CashButton onClick={() => handleDigit("1")}>1</CashButton>
          <CashButton onClick={() => handleDigit("2")}>2</CashButton>
          <CashButton onClick={() => handleDigit("3")}>3</CashButton>
          <CashButton onClick={handleEqual} variant="equal">
            =
          </CashButton>

          <CashButton onClick={() => handleDigit("0")} wide>
            0
          </CashButton>
          <CashButton onClick={handleBackspace}>⌫</CashButton>
          <CashButton onClick={handleCancel} variant="cancel">
            ОТМЕНА
          </CashButton>
        </div>

        <button
          onClick={() => display !== "0" && setScreen("pay")}
          className={`w-full h-14 rounded-xl font-semibold text-base transition-all duration-150 flex items-center justify-center gap-2 ${
            display !== "0"
              ? "bg-cash-accent text-white hover:opacity-90 active:scale-[0.98] shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
              : "bg-gray-100 text-cash-muted cursor-not-allowed"
          }`}
        >
          <Icon name="Wallet" size={18} />
          {display !== "0"
            ? `Оплатить ${formatDisplay(display)} ₽`
            : "Введите сумму"}
        </button>

        <div className="mt-5 h-px bg-cash-border" />
        <p className="text-center text-cash-muted text-[10px] font-mono mt-3 tracking-[0.2em] uppercase">
          Версия 1.0
        </p>
      </div>
    </div>
  );
}