import { useState, useCallback } from "react";

type Operation = "+" | "-" | null;

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

  const base =
    "relative flex items-center justify-center select-none cursor-pointer transition-all duration-100 font-golos font-medium rounded-xl border";

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
      className={`${base} ${variants[variant]} ${wide ? "col-span-2" : ""} ${pressed ? "scale-95" : "scale-100"} h-[72px]`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default function Index() {
  const [display, setDisplay] = useState("0");
  const [firstNumber, setFirstNumber] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingNext, setWaitingNext] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expression, setExpression] = useState("");

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
                className="flex justify-between items-center animate-fade-in"
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
              <div className="text-cash-muted text-sm font-mono mb-1 tracking-wide animate-fade-in">
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
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-cash-accent opacity-50" />
                  <span className="text-[11px] text-cash-muted font-mono">
                    {operation === "+" ? "сложение" : "вычитание"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
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

        <div className="mt-5 h-px bg-cash-border" />
        <p className="text-center text-cash-muted text-[10px] font-mono mt-3 tracking-[0.2em] uppercase">
          Версия 1.0
        </p>
      </div>
    </div>
  );
}
