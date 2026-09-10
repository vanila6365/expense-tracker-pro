import React from "react";
import { Transaction, Account } from "../types";
import { MONTH_TH } from "../constants";
import { TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight, PlusCircle, AlertCircle, Award, X } from "lucide-react";

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  monthOffset: number;
  onChangeMonth: (delta: number) => void;
  settings: { budget: number; budgetDay: number; budgetWeek: number };
  onOpenDrawer: () => void;
  onOpenAddForm: () => void;
  onOpenEditForm: (id: string) => void;
  onQuickToggleFavorite: (id: string, e: React.MouseEvent) => void;
  getCategoryIcon: (kind: string, catName: string) => string;
  allAccountsTotal: number;
}

export default function Dashboard({
  transactions,
  accounts,
  monthOffset,
  onChangeMonth,
  settings,
  onOpenDrawer,
  onOpenAddForm,
  onOpenEditForm,
  onQuickToggleFavorite,
  getCategoryIcon,
  allAccountsTotal
}: DashboardProps) {
  // Expense Explorer state
  const [explorerStack, setExplorerStack] = React.useState<{
    type: "all_weeks" | "week_days" | "day_txs";
    label: string;
    data: any;
  }[]>([]);

  // Get current month details
  const getMonthWindow = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return { y: d.getFullYear(), m: d.getMonth() };
  };

  const { y, m } = getMonthWindow(monthOffset);
  const currentMonthLabel = `${MONTH_TH[m]} ${y + 543}`;

  const getWeeksOfMonth = (year: number, month: number) => {
    const weeks: { index: number; label: string; start: Date; end: Date }[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let current = new Date(firstDay);
    let weekIdx = 1;

    while (current <= lastDay) {
      const start = new Date(current);
      const dayOfWeek = current.getDay(); // 0 Sunday, 1 Monday, etc.
      const diffToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const end = new Date(current);
      end.setDate(current.getDate() + diffToSunday);
      end.setHours(23, 59, 59, 999);

      const actualEnd = end > lastDay ? lastDay : end;
      actualEnd.setHours(23, 59, 59, 999);

      const formatD = (d: Date) => `${d.getDate()} ${MONTH_TH[d.getMonth()]}`;

      weeks.push({
        index: weekIdx,
        label: `สัปดาห์ที่ ${weekIdx} (${formatD(start)} - ${formatD(actualEnd)})`,
        start,
        end: actualEnd
      });

      current = new Date(actualEnd);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      weekIdx++;
    }

    return weeks;
  };

  const getWeekExpense = (week: { start: Date; end: Date }) => {
    return transactions
      .filter(t => {
        if (t.kind !== "expense") return false;
        const d = new Date(t.date);
        return d >= week.start && d <= week.end;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getDaysInRange = (start: Date, end: Date) => {
    const list: { dateStr: string; label: string; total: number }[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    const limit = new Date(end);
    limit.setHours(23, 59, 59, 999);

    const DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

    while (current <= limit) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const total = transactions
        .filter(t => t.date === dateStr && t.kind === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayLabel = `${DAYS_SHORT[current.getDay()]} ${current.getDate()} ${MONTH_TH[current.getMonth()]}`;

      list.push({
        dateStr,
        label: dayLabel,
        total
      });

      current.setDate(current.getDate() + 1);
    }

    return list.reverse();
  };

  // Filter transactions for this month
  const txInMonth = (tx: Transaction, year: number, month: number) => {
    const d = new Date(tx.date);
    return d.getFullYear() === year && d.getMonth() === month;
  };

  const monthTx = transactions.filter(t => txInMonth(t, y, m));
  const income = monthTx.filter(t => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = monthTx.filter(t => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = income - expense;

  // Calculate carried forward balance (ยอดยกมา) from preceding months + account initial balances
  const initialAccountsBalance = accounts.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
  const carriedForward = initialAccountsBalance + transactions
    .filter(t => {
      const d = new Date(t.date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth();
      return tYear < y || (tYear === y && tMonth < m);
    })
    .reduce((sum, t) => {
      if (t.kind === "income") return sum + Number(t.amount);
      if (t.kind === "expense") return sum - Number(t.amount);
      return sum;
    }, 0);

  const totalBalance = carriedForward + netBalance;

  // Filter today's transactions
  const getLocalDateStr = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayStr = getLocalDateStr();
  const dayExp = transactions
    .filter(t => t.date === todayStr && t.kind === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Filter this week's transactions
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 Sunday, 1 Monday, etc.
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange();
  const weekExp = transactions
    .filter(t => {
      if (t.kind !== "expense") return false;
      const d = new Date(t.date);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Helper formatting functions
  const fmt = (n: number) => "฿" + Math.round(n).toLocaleString("th-TH");

  const renderIconGlyph = (icon: string | undefined, size = "1.2em") => {
    if (!icon) return "🧾";
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt="icon"
          style={{ width: size, height: size, objectFit: "cover", borderRadius: "6px" }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span style={{ fontSize: size }}>{icon}</span>;
  };

  const getAccountName = (id: string | undefined) => {
    return accounts.find(a => a.id === id)?.name || "ไม่ทราบชื่อบัญชี";
  };

  // Top Category breakdown
  const byCat: Record<string, number> = {};
  monthTx
    .filter(t => t.kind === "expense" && t.category)
    .forEach(t => {
      if (t.category) {
        byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
      }
    });

  const sortedCats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxCatVal = sortedCats.length > 0 ? sortedCats[0][1] : 1;

  // Recent transactions
  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="px-5 pt-6 pb-2 flex justify-between items-start">
        <div>
          <p className="text-xs tracking-wider text-[var(--muted)] mb-0.5">สรุปการเงินของเรา 🌸</p>
          <div className="flex items-center gap-4 mt-0.5">
            <button
              onClick={() => onChangeMonth(-1)}
              className="w-8 h-8 rounded-full border-none bg-[var(--card)] text-[var(--ink)] shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer transition-transform"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-xl font-semibold m-0 text-[var(--ink)]">{currentMonthLabel}</h2>
            <button
              onClick={() => onChangeMonth(1)}
              className="w-8 h-8 rounded-full border-none bg-[var(--card)] text-[var(--ink)] shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer transition-transform"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <button
          onClick={onOpenDrawer}
          className="w-10 h-10 rounded-full border-none bg-[var(--card)] text-base shadow-sm flex items-center justify-center text-[var(--ink)] cursor-pointer"
        >
          ⚙️
        </button>
      </div>

      {/* Main Stats Card */}
      <div className="mx-5 my-4 bg-[var(--card)] rounded-2xl p-6 shadow-md relative pb-8">
        <div className="absolute left-0 right-0 bottom-[-11px] h-3 overflow-hidden pointer-events-none">
          <div
            className="h-3 w-full"
            style={{
              backgroundImage: `linear-gradient(-45deg, var(--card) 6px, transparent 0), linear-gradient(45deg, var(--card) 6px, transparent 0)`,
              backgroundSize: "12px 12px",
              backgroundRepeat: "repeat-x"
            }}
          />
        </div>

        <p className="text-xs text-[var(--muted)] m-0 font-medium">💰 ยอดเงินคงเหลือสะสมปลายเดือน {MONTH_TH[m]}</p>
        <div className="text-3xl font-bold mt-1 mb-4 text-[var(--ink)] tracking-tight display-font">
          {fmt(totalBalance)}
        </div>

        {/* Small details grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-4 p-3 bg-[var(--cream)]/60 rounded-xl border border-[var(--line)]/40">
          <div>
            <span className="block text-[10px] text-[var(--muted)] font-bold tracking-wide uppercase">📦 ยอดยกมาจากเดือนก่อน</span>
            <span className={`text-xs font-bold mt-0.5 block ${carriedForward >= 0 ? "text-[var(--sage-dark)]" : "text-[var(--blush-dark)]"}`}>
              {carriedForward >= 0 ? "+" : ""}{fmt(carriedForward)}
            </span>
          </div>
          <div className="border-l border-[var(--line)]/50 pl-3.5">
            <span className="block text-[10px] text-[var(--muted)] font-bold tracking-wide uppercase">🌸 สุทธิเฉพาะเดือนนี้</span>
            <span className={`text-xs font-bold mt-0.5 block ${netBalance >= 0 ? "text-[var(--sage-dark)]" : "text-[var(--blush-dark)]"}`}>
              {netBalance >= 0 ? "+" : ""}{fmt(netBalance)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          {totalBalance >= 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--sage-bg)] text-[var(--sage-dark)]">
              🟢 ยอดเงินสะสมเป็นบวก
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--blush-bg)] text-[var(--blush-dark)]">
              🔴 ยอดสะสมติดลบ (ระวังหน่อยนะคะ)
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 p-3 bg-[var(--sage-bg)] rounded-xl">
            <p className="m-0 text-[10px] text-[var(--muted)]">รายรับรวม</p>
            <div className="text-base font-semibold text-[var(--sage-dark)] mt-0.5 flex items-center gap-1">
              <TrendingUp size={14} />
              {fmt(income)}
            </div>
          </div>
          <div
            onClick={() => setExplorerStack([{
              type: "all_weeks",
              label: `สำรวจรายจ่ายเดือน ${currentMonthLabel}`,
              data: { month: m, year: y }
            }])}
            className="flex-1 p-3 bg-[var(--blush-bg)] rounded-xl cursor-pointer hover:opacity-90 active:scale-98 transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-center w-full">
              <p className="m-0 text-[10px] text-[var(--muted)] font-medium">รายจ่ายรวม</p>
              <span className="text-[9px] font-bold text-[var(--blush-dark)]/80">เจาะลึก 🔍</span>
            </div>
            <div className="text-base font-semibold text-[var(--blush-dark)] mt-0.5 flex items-center gap-1">
              <TrendingDown size={14} />
              {fmt(expense)}
            </div>
          </div>
        </div>

        {/* Dynamic Budget Display */}
        {(settings.budgetDay > 0 || settings.budgetWeek > 0 || settings.budget > 0) && (
          <div className="mt-5 pt-3 border-t border-[var(--line)] space-y-1.5">
            {settings.budgetDay > 0 && monthOffset === 0 && (
              <div
                onClick={() => setExplorerStack([{
                  type: "day_txs",
                  label: `สำรวจรายการวันนี้ (${todayStr})`,
                  data: { dateStr: todayStr }
                }])}
                className="p-2 rounded-xl hover:bg-[var(--line)]/10 transition-colors cursor-pointer"
              >
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1 font-medium">📅 งบรายวัน (วันนี้) <span className="text-[9px] font-bold text-[var(--muted)]/80 underline">คลิกดู 🔍</span></span>
                  <span className="font-medium text-[var(--ink)]">
                    {fmt(dayExp)} / {fmt(settings.budgetDay)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--line)] mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dayExp / settings.budgetDay) * 100)}%`,
                      backgroundColor:
                        dayExp >= settings.budgetDay
                          ? "var(--blush-dark)"
                          : dayExp > settings.budgetDay * 0.8
                          ? "var(--gold)"
                          : "var(--sage-dark)"
                    }}
                  />
                </div>
              </div>
            )}

            {settings.budgetWeek > 0 && monthOffset === 0 && (
              <div
                onClick={() => setExplorerStack([{
                  type: "week_days",
                  label: `สำรวจสัปดาห์นี้`,
                  data: { weekStart, weekEnd }
                }])}
                className="p-2 rounded-xl hover:bg-[var(--line)]/10 transition-colors cursor-pointer"
              >
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1 font-medium">🔄 งบรายสัปดาห์ (สัปดาห์นี้) <span className="text-[9px] font-bold text-[var(--muted)]/80 underline">คลิกดู 🔍</span></span>
                  <span className="font-medium text-[var(--ink)]">
                    {fmt(weekExp)} / {fmt(settings.budgetWeek)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--line)] mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weekExp / settings.budgetWeek) * 100)}%`,
                      backgroundColor:
                        weekExp >= settings.budgetWeek
                          ? "var(--blush-dark)"
                          : weekExp > settings.budgetWeek * 0.8
                          ? "var(--gold)"
                          : "var(--sage-dark)"
                    }}
                  />
                </div>
              </div>
            )}

            {settings.budget > 0 && (
              <div
                onClick={() => setExplorerStack([{
                  type: "all_weeks",
                  label: `สำรวจรายสัปดาห์ของเดือนนี้`,
                  data: { month: m, year: y }
                }])}
                className="p-2 rounded-xl hover:bg-[var(--line)]/10 transition-colors cursor-pointer"
              >
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1 font-medium">📊 งบรายเดือน (เดือนนี้) <span className="text-[9px] font-bold text-[var(--muted)]/80 underline">คลิกดู 🔍</span></span>
                  <span className="font-medium text-[var(--ink)]">
                    {fmt(expense)} / {fmt(settings.budget)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--line)] mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (expense / settings.budget) * 100)}%`,
                      backgroundColor:
                        expense >= settings.budget
                          ? "var(--blush-dark)"
                          : expense > settings.budget * 0.8
                          ? "var(--gold)"
                          : "var(--lavender-dark)"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-[var(--muted)] mt-4 leading-normal">
          💡 ตัวเลขนี้คือรายรับ-รายจ่ายเฉพาะช่วงเวลาของเดือนนี้ ไม่ใช่ยอดคงเหลือจริง สามารถตรวจสอบยอดเงินรวมทุกบัญชีที่แถบด้านล่างค่ะ
        </p>
      </div>

      {/* Account Balance Banner */}
      <div className="mx-5 mb-5 bg-[var(--lavender-bg)] rounded-2xl p-4 flex justify-between items-center border border-[var(--line)]/50">
        <div>
          <div className="text-[11px] text-[var(--lavender-dark)] font-medium">ยอดเงินจริงรวมทุกบัญชี 💰</div>
          <div className="text-xl font-bold text-[var(--lavender-dark)] mt-0.5 display-font">{fmt(allAccountsTotal)}</div>
        </div>
        <Award size={24} className="text-[var(--lavender-dark)]/70" />
      </div>

      {/* Top Categories */}
      <div className="px-5 mb-5">
        <h3 className="text-sm font-semibold mb-3 text-[var(--ink)] flex items-center gap-1">
          <span>📊</span> รายจ่ายอันดับต้นเดือนนี้
        </h3>
        <div className="bg-[var(--card)] rounded-2xl p-4 shadow-sm border border-[var(--line)]/40 space-y-3.5">
          {sortedCats.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--muted)]">
              <span className="block text-2xl mb-1.5">🧾</span>ยังไม่มีรายจ่ายในเดือนนี้เลยจ้า
            </div>
          ) : (
            sortedCats.map(([cat, amt]) => {
              const pct = Math.round((amt / maxCatVal) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-[var(--ink)] flex items-center gap-1.5 truncate">
                    {renderIconGlyph(getCategoryIcon("expense", cat), "14px")}
                    <span className="truncate">{cat}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--blush-dark)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-xs font-semibold text-[var(--muted)]">
                    {fmt(amt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent List */}
      <div className="px-5 pb-8">
        <h3 className="text-sm font-semibold mb-3 text-[var(--ink)] flex items-center gap-1">
          <span>📋</span> รายการล่าสุด
        </h3>
        <div className="space-y-2.5">
          {recentTx.length === 0 ? (
            <div className="bg-[var(--card)] rounded-2xl p-8 text-center text-sm text-[var(--muted)] border border-[var(--line)]/40">
              <span className="block text-3xl mb-2">✨</span>เริ่มบันทึกรายการแรกของคุณกันเลยค่ะ
            </div>
          ) : (
            recentTx.map(t => {
              const isIncome = t.kind === "income";
              const isExpense = t.kind === "expense";
              const isTransfer = t.kind === "transfer";

              let icon = "🧾";
              let label = t.category || "";
              let sub = t.note || "";

              if (isIncome) {
                icon = getCategoryIcon("income", t.category || "");
              } else if (isExpense) {
                icon = getCategoryIcon("expense", t.category || "");
              } else if (isTransfer) {
                icon = "🔄";
                label = `${getAccountName(t.fromAccountId)} → ${getAccountName(t.toAccountId)}`;
                sub = t.note || "โอนเงินระหว่างบัญชี";
              }

              const accName = !isTransfer ? getAccountName(t.accountId) : "";

              return (
                <div
                  key={t.id}
                  className="bg-[var(--card)] rounded-2xl p-3.5 flex items-center justify-between border border-[var(--line)]/30 hover:border-[var(--line)] transition-colors"
                >
                  <div
                    onClick={() => onOpenEditForm(t.id)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                        isIncome ? "bg-[var(--sage-bg)]" : isExpense ? "bg-[var(--blush-bg)]" : "bg-[var(--lavender-bg)]"
                      }`}
                    >
                      {renderIconGlyph(icon, "18px")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-[var(--ink)] flex items-center gap-1 truncate">
                        <span className="truncate">{label}</span>
                        {t.photo && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] truncate">
                        {sub ? `${sub} · ` : ""}
                        {!isTransfer && `${accName} · `}
                        {t.date}
                        {t.time ? ` ⏰ ${t.time}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => onQuickToggleFavorite(t.id, e)}
                      className={`text-base p-1 border-none bg-none cursor-pointer focus:outline-none ${
                        t.favorite ? "text-[var(--gold)]" : "text-[var(--muted)]"
                      }`}
                    >
                      ★
                    </button>
                    <div
                      onClick={() => onOpenEditForm(t.id)}
                      className={`text-sm font-bold cursor-pointer ${
                        isIncome ? "text-[var(--sage-dark)]" : isExpense ? "text-[var(--blush-dark)]" : "text-[var(--lavender-dark)]"
                      }`}
                    >
                      {isIncome ? "+" : isExpense ? "-" : ""}
                      {fmt(t.amount)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expense Explorer Modal */}
      {explorerStack.length > 0 && (() => {
        const activeFrame = explorerStack[explorerStack.length - 1];
        const handleBackExplorer = () => setExplorerStack(prev => prev.slice(0, -1));
        const handleCloseExplorer = () => setExplorerStack([]);

        return (
          <div className="fixed inset-0 bg-[var(--cream)] z-50 max-w-[480px] mx-auto overflow-y-auto animate-fade-in flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--line)] bg-[var(--cream)] sticky top-0 z-10 shadow-sm">
              <button
                onClick={explorerStack.length > 1 ? handleBackExplorer : handleCloseExplorer}
                className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-sm font-semibold text-[var(--ink)] truncate max-w-[260px]">
                {activeFrame.label}
              </h3>
              <button
                onClick={handleCloseExplorer}
                className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform text-[var(--muted)]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Breadcrumbs for Drill-down Path */}
            {explorerStack.length > 1 && (
              <div className="px-5 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto text-[10px] text-[var(--muted)] font-medium">
                {explorerStack.map((frame, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="opacity-50">/</span>}
                    <span 
                      onClick={() => setExplorerStack(prev => prev.slice(0, idx + 1))}
                      className={`whitespace-nowrap cursor-pointer hover:underline ${idx === explorerStack.length - 1 ? "text-[var(--ink)] font-bold" : ""}`}
                    >
                      {frame.type === "all_weeks" ? "รายสัปดาห์" : frame.type === "week_days" ? "รายวัน" : "รายการ"}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="p-5 flex-1 space-y-3.5">
              {/* Level 1: Weeks */}
              {activeFrame.type === "all_weeks" && (() => {
                const weeks = getWeeksOfMonth(y, m);
                const maxVal = Math.max(...weeks.map(w => getWeekExpense(w)), 1);

                return (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--muted)] font-medium px-1">เลือกสัปดาห์เพื่อเจาะลึกดูรายวัน 🔎</p>
                    {weeks.map(w => {
                      const amt = getWeekExpense(w);
                      const percent = Math.min(100, (amt / maxVal) * 100);
                      return (
                        <div
                          key={w.index}
                          onClick={() => setExplorerStack(prev => [...prev, {
                            type: "week_days",
                            label: w.label,
                            data: { weekStart: w.start, weekEnd: w.end }
                          }])}
                          className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--line)]/30 hover:border-[var(--line)]/80 shadow-sm transition-all cursor-pointer flex flex-col gap-2 group active:scale-99"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-semibold text-[var(--ink)] group-hover:text-[var(--lavender-dark)] transition-colors">{w.label}</span>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-medium">
                              <span className="font-bold text-[var(--blush-dark)] text-sm">{fmt(amt)}</span>
                              <ChevronRight size={14} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--line)]/50 overflow-hidden">
                            <div
                              className="h-full bg-[var(--blush-dark)] rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Level 2: Week Days */}
              {activeFrame.type === "week_days" && (() => {
                const days = getDaysInRange(new Date(activeFrame.data.weekStart), new Date(activeFrame.data.weekEnd));
                const maxVal = Math.max(...days.map(d => d.total), 1);

                return (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--muted)] font-medium px-1">เลือกวันเพื่อดูรายการใช้จ่ายทั้งหมด 📝</p>
                    {days.map(d => {
                      const percent = Math.min(100, (d.total / maxVal) * 100);
                      return (
                        <div
                          key={d.dateStr}
                          onClick={() => setExplorerStack(prev => [...prev, {
                            type: "day_txs",
                            label: `รายการวันที่ ${d.label}`,
                            data: { dateStr: d.dateStr }
                          }])}
                          className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--line)]/30 hover:border-[var(--line)]/80 shadow-sm transition-all cursor-pointer flex flex-col gap-2 group active:scale-99"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-semibold text-[var(--ink)] group-hover:text-[var(--lavender-dark)] transition-colors">{d.label}</span>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-medium">
                              <span className={`font-bold text-sm ${d.total > 0 ? "text-[var(--blush-dark)]" : "text-[var(--muted)]"}`}>
                                {fmt(d.total)}
                              </span>
                              <ChevronRight size={14} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                          {d.total > 0 && (
                            <div className="w-full h-1.5 rounded-full bg-[var(--line)]/50 overflow-hidden">
                              <div
                                className="h-full bg-[var(--blush-dark)] rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Level 3: Day Transactions */}
              {activeFrame.type === "day_txs" && (() => {
                const dayTxs = transactions.filter(t => t.date === activeFrame.data.dateStr);

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-xs text-[var(--muted)] font-medium m-0">คลิกที่รายการเพื่อทำการแก้ไข ✏️</p>
                      <span className="text-[11px] font-semibold text-[var(--muted)] bg-[var(--line)]/40 px-2 py-0.5 rounded-full">
                        {dayTxs.length} รายการ
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {dayTxs.length === 0 ? (
                        <div className="text-center py-10 text-sm text-[var(--muted)] bg-[var(--card)] rounded-2xl border border-[var(--line)]/30">
                          <span className="block text-2xl mb-1.5">🕊️</span>ไม่มีรายการของวันนี้เลยค่ะ
                        </div>
                      ) : (
                        dayTxs.map(t => {
                          const isIncome = t.kind === "income";
                          const isExpense = t.kind === "expense";
                          const isTransfer = t.kind === "transfer";

                          let icon = "🧾";
                          let label = t.category || "";
                          let sub = t.note || "";

                          if (isIncome) {
                            icon = getCategoryIcon("income", t.category || "");
                          } else if (isExpense) {
                            icon = getCategoryIcon("expense", t.category || "");
                          } else if (isTransfer) {
                            icon = "🔄";
                            label = `${getAccountName(t.fromAccountId)} → ${getAccountName(t.toAccountId)}`;
                            sub = t.note || "โอนเงินระหว่างบัญชี";
                          }

                          const accName = !isTransfer ? getAccountName(t.accountId) : "";

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                handleCloseExplorer();
                                onOpenEditForm(t.id);
                              }}
                              className="bg-[var(--card)] rounded-2xl p-3.5 flex items-center justify-between border border-[var(--line)]/30 hover:border-[var(--line)] shadow-sm hover:shadow transition-all cursor-pointer active:scale-99"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                                    isIncome ? "bg-[var(--sage-bg)]" : isExpense ? "bg-[var(--blush-bg)]" : "bg-[var(--lavender-bg)]"
                                  }`}
                                >
                                  {renderIconGlyph(icon, "18px")}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[13.5px] font-semibold text-[var(--ink)] flex items-center gap-1 truncate">
                                    <span className="truncate">{label}</span>
                                    {t.photo && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] truncate">
                                    {sub ? `${sub} · ` : ""}
                                    {!isTransfer && `${accName}`}
                                    {t.time ? ` · ⏰ ${t.time}` : ""}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                                <div
                                  className={`text-sm font-bold ${
                                    isIncome ? "text-[var(--sage-dark)]" : isExpense ? "text-[var(--blush-dark)]" : "text-[var(--lavender-dark)]"
                                  }`}
                                >
                                  {isIncome ? "+" : isExpense ? "-" : ""}
                                  {fmt(t.amount)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
