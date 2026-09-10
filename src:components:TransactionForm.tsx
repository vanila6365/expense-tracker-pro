import React, { useState, useEffect, useRef } from "react";
import { Transaction, Account } from "../types";
import { CATEGORY_RULES, NATURE_LABEL } from "../constants";
import { X, Star, FileText, Camera, Check, Trash2, Mic, Sparkles } from "lucide-react";

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getLocalTimeString = (d = new Date()) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  transactions: Transaction[];
  accounts: Account[];
  categories: any;
  getCategoryIcon: (kind: string, catName: string) => string;
  onSave: (tx: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string) => void;
  onOpenIconPicker: (target: any) => void;
}

export default function TransactionForm({
  isOpen,
  onClose,
  editingId,
  transactions,
  accounts,
  categories,
  getCategoryIcon,
  onSave,
  onDelete,
  showToast,
  onOpenIconPicker
}: TransactionFormProps) {
  const [kind, setKind] = useState<"income" | "expense" | "transfer">("expense");
  const [nature, setNature] = useState<string>("variable");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [ref, setRef] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<boolean>(false);

  // Calculator states
  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [calcExpr, setCalcExpr] = useState<string>("");

  // Suggested category state
  const [suggestion, setSuggestion] = useState<any>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");

  // Speech Recognition state
  const [recording, setRecording] = useState<boolean>(false);

  // Initialize form
  useEffect(() => {
    if (!isOpen) return;

    if (editingId) {
      const tx = transactions.find(t => t.id === editingId);
      if (tx) {
        setKind(tx.kind);
        setAmount(tx.amount.toString());
        setDate(tx.date);
        setTime(tx.time || "");
        setNote(tx.note || "");
        setRef(tx.ref || "");
        setPhoto(tx.photo || null);
        setFavorite(!!tx.favorite);

        // Always initialize transfer accounts as fallback, just in case the user switches the kind
        setFromAccountId(tx.fromAccountId || (accounts[0]?.id || ""));
        setToAccountId(tx.toAccountId || (accounts[1]?.id || accounts[0]?.id || ""));
        setAccountId(tx.accountId || (accounts[0]?.id || ""));

        if (tx.kind === "transfer") {
          // set above
        } else {
          setNature(tx.nature || "variable");

          const opts = categories[tx.kind]?.[tx.nature || ""] || [];
          if (tx.category && opts.includes(tx.category)) {
            setCategory(tx.category);
            setCustomCategory("");
          } else {
            setCategory("__custom");
            setCustomCategory(tx.category || "");
          }
        }
      }
    } else {
      // Create mode
      setKind("expense");
      setNature("variable");
      setAmount("");
      setDate(getLocalDateString());
      setTime(getLocalTimeString());
      setNote("");
      setRef("");
      setPhoto(null);
      setFavorite(false);
      setCustomCategory("");

      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        setFromAccountId(accounts[0].id);
        setToAccountId(accounts[1]?.id || accounts[0].id);
      }
    }
    setSuggestion(null);
    setOcrStatus("");
    setOcrLoading(false);
    setShowCalc(false);
    setCalcExpr("");
  }, [isOpen, editingId, transactions, accounts, categories]);

  const handleKindChange = (newKind: "income" | "expense" | "transfer") => {
    setKind(newKind);
    if (newKind === "transfer") {
      if (!fromAccountId && accounts.length > 0) {
        setFromAccountId(accounts[0].id);
      }
      if (!toAccountId && accounts.length > 0) {
        setToAccountId(accounts[1]?.id || accounts[0].id);
      }
    } else {
      if (!accountId && accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
    }
  };

  // Handle automatic category suggestion
  const handleNoteChange = (text: string) => {
    setNote(text);
    const lower = text.toLowerCase();
    const hit = CATEGORY_RULES.find(r => r.kw.some(k => lower.includes(k.toLowerCase())));

    if (hit) {
      setSuggestion(hit);
    } else {
      setSuggestion(null);
    }
  };

  const applySuggestion = (hit: any) => {
    setKind(hit.kind);
    setNature(hit.nature);
    setCategory(hit.category);
    setCustomCategory("");
    setSuggestion(null);
  };

  // Populate Categories drop-down when nature changes
  const categoryOpts = (categories[kind] && categories[kind][nature]) || [];

  useEffect(() => {
    if (!editingId && isOpen && kind !== "transfer") {
      const opts = categories[kind]?.[nature] || [];
      if (opts.length > 0 && !category) {
        setCategory(opts[0]);
      }
    }
  }, [kind, nature, categories, category, editingId, isOpen]);

  // Voice recording logic
  const handleVoiceNote = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast("ขออภัยค่ะ เบราว์เซอร์นี้ยังไม่รองรับการพูดบันทึกนะคะ 🙏");
      return;
    }

    const recog = new SpeechRec();
    recog.lang = "th-TH";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    setRecording(true);

    recog.onresult = (e: any) => {
      const said = e.results[0][0].transcript;
      const combined = note ? note + " " + said : said;
      handleNoteChange(combined);

      // Search for numbers to auto-fill amount
      const numMatch = said.replace(/,/g, "").match(/\d+(\.\d+)?/);
      if (numMatch && !amount) {
        setAmount(numMatch[0]);
      }
      showToast("แปลงเสียงเป็นข้อความแล้วค่ะ 🎤");
    };

    recog.onerror = (e: any) => {
      console.error(e);
      showToast("ฟังเสียงไม่สำเร็จ ลองใหม่อีกครั้งนะคะ (ต้องอนุญาตสิทธิ์ไมโครโฟน)");
    };

    recog.onend = () => {
      setRecording(false);
    };

    try {
      recog.start();
    } catch (err) {
      console.error(err);
      setRecording(false);
    }
  };

  // Resize and analyze image
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";

    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const rawBase64 = event.target.result.split(",")[1];

      if (isPdf) {
        setPhoto(null);
        analyzeWithGeminiServer(rawBase64, "application/pdf");
      } else {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const s = Math.min(1, 480 / img.width);
          canvas.width = img.width * s;
          canvas.height = img.height * s;
          canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const thumbDataUrl = canvas.toDataURL("image/jpeg", 0.6);
          setPhoto(thumbDataUrl);

          const base64Data = thumbDataUrl.split(",")[1];
          analyzeWithGeminiServer(base64Data, "image/jpeg");
        };
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithGeminiServer = async (base64Data: string, mimeType: string) => {
    setOcrLoading(true);
    setOcrStatus("🔍 AI กำลังอ่านข้อมูลสลิปให้นะคะ รอสักครู่ค่ะ...");

    try {
      const response = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, mimeType, todayDate: date })
      });

      if (!response.ok) {
        throw new Error("Failed to parse slip");
      }

      const resJson = await response.json();
      if (resJson.amount && Number(resJson.amount) > 0) {
        setAmount(resJson.amount.toString());
      }
      if (resJson.date) {
        setDate(resJson.date);
      }
      if (resJson.ref) {
        setRef(resJson.ref);
      }
      if (resJson.note) {
        handleNoteChange(resJson.note);
        // Look up rules
        const lower = resJson.note.toLowerCase();
        const rule = CATEGORY_RULES.find(r => r.kw.some(k => lower.includes(k.toLowerCase())));
        if (rule) {
          setKind(rule.kind);
          setNature(rule.nature);
          setCategory(rule.category);
          setCustomCategory("");
        }
      }
      setOcrStatus("✅ อ่านข้อมูลสลิปแล้วนะคะ ตรวจสอบก่อนบันทึกได้เลยค่ะ");
    } catch (err) {
      console.error(err);
      setOcrStatus("⚠️ ไม่สามารถอ่านข้อมูลสลิปได้ แต่คุณยังเขียนข้อมูลเองได้ตามปกติค่ะ");
    } finally {
      setOcrLoading(false);
    }
  };

  const evaluateMathExpression = (expr: string): string => {
    try {
      const sanitized = expr.replace(/[^0-9.+\-*/()]/g, "");
      if (!sanitized) return "";
      
      let temp = sanitized;
      const lastChar = temp.slice(-1);
      if (["+", "-", "*", "/"].includes(lastChar)) {
        temp = temp.slice(0, -1);
      }
      if (!temp) return "";
      
      const result = new Function(`return (${temp})`)();
      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        return String(Math.round(result * 100) / 100);
      }
      return "";
    } catch (e) {
      return "";
    }
  };

  const handleCalcPress = (key: string) => {
    if (key === "C") {
      setCalcExpr("");
      setAmount("");
    } else if (key === "⌫") {
      const next = calcExpr.trim().slice(0, -1).trim();
      setCalcExpr(next);
      const evalVal = evaluateMathExpression(next);
      if (evalVal) {
        setAmount(evalVal);
      } else if (next === "") {
        setAmount("");
      }
    } else if (key === "=") {
      const evalVal = evaluateMathExpression(calcExpr);
      if (evalVal) {
        setCalcExpr(evalVal);
        setAmount(evalVal);
      }
    } else {
      const lastChar = calcExpr.slice(-1);
      const ops = ["+", "-", "*", "/"];
      if (ops.includes(key) && ops.includes(lastChar)) {
        setCalcExpr(calcExpr.slice(0, -1) + key);
      } else {
        setCalcExpr(calcExpr + key);
      }
    }
  };

  useEffect(() => {
    if (!showCalc) return;
    const evaluated = evaluateMathExpression(calcExpr);
    if (amount !== evaluated && amount !== calcExpr) {
      setCalcExpr(amount);
    }
  }, [amount, showCalc]);

  // Save transaction handler
  const handleSave = () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast("กรุณากรอกจำนวนเงินด้วยนะคะ");
      return;
    }

    let txData: Partial<Transaction> = {
      kind,
      amount: parsedAmount,
      date: date || getLocalDateString(),
      time: time || "",
      note: note.trim(),
      ref: ref.trim(),
      photo,
      favorite
    };

    if (kind === "transfer") {
      const finalFrom = fromAccountId || (accounts[0]?.id || "");
      const finalTo = toAccountId || (accounts[1]?.id || accounts[0]?.id || "");

      if (finalFrom === finalTo) {
        showToast("กรุณาเลือกบัญชีต้นทางกับปลายทางให้ต่างกันนะคะ");
        return;
      }
      txData.fromAccountId = finalFrom;
      txData.toAccountId = finalTo;
    } else {
      txData.accountId = accountId || (accounts[0]?.id || "");
      txData.nature = nature;
      txData.category = category === "__custom" ? customCategory.trim() || "อื่นๆ" : category;
    }

    onSave(txData);
  };

  // Apply quick favorites
  const favs = transactions.filter(t => t.favorite);
  const handleApplyFavorite = (t: Transaction) => {
    setKind(t.kind);
    setAmount(t.amount.toString());
    setNote(t.note || "");
    setRef(t.ref || "");
    if (t.kind === "transfer") {
      const favFrom = accounts.some(a => a.id === t.fromAccountId) ? t.fromAccountId || "" : (accounts[0]?.id || "");
      const favTo = accounts.some(a => a.id === t.toAccountId) ? t.toAccountId || "" : (accounts[1]?.id || accounts[0]?.id || "");
      setFromAccountId(favFrom);
      setToAccountId(favTo);
    } else {
      const favAcc = accounts.some(a => a.id === t.accountId) ? t.accountId || "" : (accounts[0]?.id || "");
      setAccountId(favAcc);
      setNature(t.nature || "variable");
      setCategory(t.category || "");
      setCustomCategory("");
    }
    showToast("ใช้เทมเพลตโปรดเรียบร้อยค่ะ 💛");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--cream)] z-50 max-w-[480px] mx-auto overflow-y-auto animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--line)] bg-[var(--cream)] sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer"
        >
          <X size={15} />
        </button>
        <h3 className="text-base font-semibold text-[var(--ink)]">
          {editingId ? "แก้ไขรายการ" : "บันทึกรายการ"}
        </h3>
        <button
          onClick={() => setFavorite(!favorite)}
          className={`w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer ${
            favorite ? "text-[var(--gold)]" : "text-[var(--muted)]"
          }`}
        >
          <Star size={16} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-5 flex-1 space-y-5">
        {/* Favorite Template Strip */}
        {!editingId && favs.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">ใช้แบบร่างด่วน ⭐</label>
            <div className="flex gap-2 overflow-x-auto pb-1.5 select-none">
              {favs.slice(0, 10).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyFavorite(t)}
                  className="bg-[var(--card)] border border-[var(--line)] py-1.5 px-3.5 rounded-full text-xs text-[var(--ink)] whitespace-nowrap hover:bg-[var(--line)]/10 cursor-pointer"
                >
                  ⭐ {t.category || "โอน"} · {Math.round(t.amount)} บ.
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kind Switcher */}
        <div>
          <div className="flex bg-[var(--line)] rounded-full p-1 select-none">
            {(["income", "expense", "transfer"] as const).map(k => (
              <button
                key={k}
                onClick={() => handleKindChange(k)}
                className={`flex-1 py-2 rounded-full font-bold text-xs cursor-pointer border-none bg-transparent transition-all ${
                  kind === k
                    ? k === "income"
                      ? "bg-[var(--sage)] text-white"
                      : k === "expense"
                      ? "bg-[var(--blush)] text-white"
                      : "bg-[var(--lavender)] text-white"
                    : "text-[var(--muted)]"
                }`}
              >
                {k === "income" ? "รายรับ" : k === "expense" ? "รายจ่าย" : "โอนเงิน"}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-[var(--muted)]">จำนวนเงิน (บาท)</label>
            <button
              type="button"
              onClick={() => {
                setShowCalc(!showCalc);
                setCalcExpr(amount || "");
              }}
              className="text-xs text-[var(--lavender-dark)] font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none"
            >
              <span>{showCalc ? "✖️ ปิดเครื่องคิดเลข" : "🧮 เครื่องคิดเลข"}</span>
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            className="w-full p-3.5 bg-[var(--card)] rounded-xl border border-[var(--line)] text-xl font-bold tracking-wide text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)] text-center display-font"
            placeholder="0.00"
            value={amount}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9.+\-*/() ]/g, "");
              setAmount(val);
              setCalcExpr(val);
            }}
          />

          {/* Calculator Grid UI */}
          {showCalc && (
            <div className="mt-3 p-3.5 bg-[var(--cream)]/85 rounded-2xl border border-[var(--line)]/50 space-y-3 animate-fade-in select-none">
              <div className="flex justify-between items-center bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]/30 min-h-[58px]">
                <div className="text-left flex-1 min-w-0">
                  <span className="block text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">สูตรคำนวณ</span>
                  <div className="text-sm font-semibold text-[var(--ink)] truncate display-font">
                    {calcExpr || "0"}
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="block text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">ผลลัพธ์</span>
                  <div className="text-base font-bold text-[var(--lavender-dark)] display-font">
                    = {evaluateMathExpression(calcExpr) || amount || "0"}
                  </div>
                </div>
              </div>

              {/* Pad Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["7", "8", "9", "/"],
                  ["4", "5", "6", "*"],
                  ["1", "2", "3", "-"],
                  ["C", "0", "⌫", "+"]
                ].map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    {row.map(key => {
                      const isOp = ["/", "*", "-", "+"].includes(key);
                      const isClear = key === "C";
                      const isBack = key === "⌫";
                      
                      let btnClass = "py-3 rounded-xl font-bold text-base transition-all active:scale-95 cursor-pointer flex items-center justify-center border-none ";
                      if (isOp) {
                        btnClass += "bg-[var(--lavender-bg)] text-[var(--lavender-dark)] hover:bg-[var(--lavender-bg)]/80";
                      } else if (isClear) {
                        btnClass += "bg-[var(--blush-bg)] text-[var(--blush-dark)] hover:bg-[var(--blush-bg)]/80";
                      } else if (isBack) {
                        btnClass += "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/50";
                      } else {
                        btnClass += "bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--line)]/10 shadow-sm border border-[var(--line)]/10";
                      }

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCalcPress(key)}
                          className={btnClass}
                        >
                          {key === "*" ? "×" : key === "/" ? "÷" : key}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons inside Calculator */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const evaluated = evaluateMathExpression(calcExpr);
                    if (evaluated) {
                      setCalcExpr(evaluated);
                      setAmount(evaluated);
                    }
                  }}
                  className="w-full py-2.5 bg-[var(--line)]/50 hover:bg-[var(--line)] text-[var(--ink)] font-semibold text-xs rounded-xl transition-all active:scale-98 cursor-pointer border-none"
                >
                  คำนวณ (=)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const evaluated = evaluateMathExpression(calcExpr) || amount;
                    setAmount(evaluated || "0");
                    setShowCalc(false);
                  }}
                  className="w-full py-2.5 bg-[var(--lavender-dark)] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all active:scale-98 cursor-pointer border-none shadow-sm"
                >
                  ใช้ยอดนี้และปิด 🎯
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date & Time Input */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">วันที่</label>
            <input
              type="date"
              className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">เวลา</label>
            <input
              type="time"
              className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Account selection */}
        {kind !== "transfer" ? (
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
              {kind === "income" ? "เข้าบัญชี" : "จ่ายจากบัญชี"}
            </label>
            <select
              className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.icon && a.icon.startsWith("data:") ? "🖼️" : a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--muted)]">จากบัญชี → ไปบัญชี</label>
            <select
              className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  โอนจาก: {a.name}
                </option>
              ))}
            </select>
            <select
              className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  โอนเข้า: {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description Note */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">หมายเหตุ</label>
          <textarea
            rows={2}
            className="w-full p-3.5 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
            placeholder="เช่น ข้าวกลางวัน, เงินเดือน, โอนค่าไฟ..."
            value={note}
            onChange={e => handleNoteChange(e.target.value)}
          />

          <button
            type="button"
            onClick={handleVoiceNote}
            disabled={recording}
            className={`w-full mt-2.5 py-2.5 px-4 bg-transparent border border-[var(--line)] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-[var(--ink)] active:scale-98 transition-all cursor-pointer ${
              recording ? "bg-red-50 border-red-200 text-red-500 animate-pulse" : "hover:bg-white/50"
            }`}
          >
            <Mic size={14} />
            {recording ? "🎙️ กำลังฟัง... พูดได้เลยค่ะ" : "🎤 พูดบันทึกแทนพิมพ์"}
          </button>

          {suggestion && (
            <div
              onClick={() => applySuggestion(suggestion)}
              className="mt-3.5 p-3 rounded-xl bg-[var(--lavender-bg)] text-[var(--lavender-dark)] text-xs font-medium flex items-center justify-between cursor-pointer hover:opacity-90 animate-pulse"
            >
              <span>✨ แนะนำ: {suggestion.kind === "income" ? "รายรับ" : "รายจ่าย"} · {suggestion.category}</span>
              <span className="text-[10px] underline">แตะเพื่อใช้</span>
            </div>
          )}
        </div>

        {/* Nature & Category fields */}
        {kind !== "transfer" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">ลักษณะรายการ</label>
              <select
                className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
                value={nature}
                onChange={e => {
                  setNature(e.target.value);
                  const opts = categories[kind]?.[e.target.value] || [];
                  if (opts.length > 0) setCategory(opts[0]);
                }}
              >
                {Object.entries(NATURE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">หมวดหมู่</label>
              <select
                className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categoryOpts.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom">อื่นๆ (ระบุชื่อเอง)</option>
              </select>

              {category === "__custom" && (
                <input
                  type="text"
                  className="w-full mt-2.5 p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
                  placeholder="ระบุชื่อหมวดหมู่เอง..."
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Reference */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">เลขที่อ้างอิง / เลขที่สลิป</label>
          <input
            type="text"
            className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
            placeholder="ไม่ระบุก็ได้ค่ะ"
            value={ref}
            onChange={e => setRef(e.target.value)}
          />
        </div>

        {/* Photo zone */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">แนบรูปภาพ / ไฟล์ PDF ใบเสร็จ</label>
          <div className="border-1.5 border-dashed border-[var(--line)] rounded-2xl p-6 text-center text-xs text-[var(--muted)] relative bg-[var(--card)]">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handlePhotoSelect}
            />
            {!photo && !ocrLoading && (
              <div className="space-y-1.5">
                <Camera size={22} className="mx-auto text-[var(--muted)]/70" />
                <p>📷 แตะเพื่อถ่ายภาพ หรือเลือกรูปภาพ / ไฟล์ PDF ในเครื่อง</p>
                <p className="text-[10px] text-[var(--muted)]/80">ระบบ AI อัจฉริยะจะช่วยสแกนข้อมูลและเติมค่าให้อัตโนมัติค่ะ ✨</p>
              </div>
            )}

            {photo && !ocrLoading && (
              <div>
                <img
                  src={photo}
                  alt="preview"
                  className="w-full rounded-xl max-h-[220px] object-cover mx-auto"
                />
                <p className="mt-2 text-[10px]">แตะรูปภาพใหม่เพื่อเปลี่ยนไฟล์รูป</p>
              </div>
            )}

            {ocrLoading && (
              <div className="py-4 space-y-2">
                <Sparkles size={24} className="mx-auto text-[var(--lavender-dark)] animate-spin" />
                <p className="font-semibold text-[var(--lavender-dark)]">AI กำลังวิเคราะห์สลิป...</p>
              </div>
            )}
          </div>

          {ocrStatus && (
            <div
              className={`mt-2.5 p-2.5 rounded-xl text-center text-xs font-medium border ${
                ocrStatus.startsWith("✅")
                  ? "bg-[var(--sage-bg)] text-[var(--sage-dark)] border-[var(--sage)]/30"
                  : ocrStatus.startsWith("⚠️")
                  ? "bg-[var(--blush-bg)] text-[var(--blush-dark)] border-[var(--blush)]/30"
                  : "bg-[var(--lavender-bg)] text-[var(--lavender-dark)] border-[var(--lavender)]/30"
              }`}
            >
              {ocrStatus}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[var(--ink)] text-white font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={18} />
            บันทึกรายการ 💛
          </button>

          {editingId && (
            <button
              onClick={() => onDelete(editingId)}
              className="w-full py-3.5 bg-[var(--blush-bg)] text-[var(--blush-dark)] font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all border-none cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 size={15} />
              ลบรายการนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
