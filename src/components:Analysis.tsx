import React from "react";
import { Transaction, Account } from "../types";
import { MONTH_TH } from "../constants";

interface AnalysisProps {
  transactions: Transaction[];
  accounts: Account[];
  analysisPeriod: "day" | "week" | "month";
  setAnalysisPeriod: (period: "day" | "week" | "month") => void;
  getCategoryIcon: (kind: string, catName: string) => string;
}

export default function Analysis({
  transactions,
  accounts,
  analysisPeriod,
  setAnalysisPeriod,
  getCategoryIcon
}: AnalysisProps) {
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

  const getLocalDateStr = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateStr();

  // Helper date calculators
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange();

  const getMonthWindow = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return { y: d.getFullYear(), m: d.getMonth() };
  };

  const { y, m } = getMonthWindow(0);

  // Total metrics
  const dayExp = transactions
    .filter(t => t.date === todayStr && t.kind === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const weekExp = transactions
    .filter(t => {
      if (t.kind !== "expense") return false;
      const d = new Date(t.date);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthExp = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m && t.kind === "expense";
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Period-specific filters for breakdown
  let activePeriodTx = [];
  if (analysisPeriod === "day") {
    activePeriodTx = transactions.filter(t => t.date === todayStr && t.kind === "expense");
  } else if (analysisPeriod === "week") {
    activePeriodTx = transactions.filter(t => {
      if (t.kind !== "expense") return false;
      const d = new Date(t.date);
      return d >= weekStart && d <= weekEnd;
    });
  } else {
    activePeriodTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m && t.kind === "expense";
    });
  }

  const periodTotal = activePeriodTx.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const byCat: Record<string, number> = {};
  activePeriodTx.forEach(t => {
    if (t.category) {
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    }
  });

  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  // Generate trend buckets
  interface TrendBucket {
    label: string;
    inc: number;
    exp: number;
  }
  let buckets: TrendBucket[] = [];

  const isoWeekLabel = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `W${week}`;
  };

  if (analysisPeriod === "month") {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const { y: yy, m: mm } = getMonthWindow(-i);
      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === yy && d.getMonth() === mm;
      });
      buckets.push({
        label: MONTH_TH[mm].slice(0, 3),
        inc: txs.filter(t => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0),
        exp: txs.filter(t => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0)
      });
    }
  } else if (analysisPeriod === "week") {
    // Last 8 weeks
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const startW = new Date(now.getTime());
      startW.setDate(now.getDate() - now.getDay() - i * 7);
      startW.setHours(0, 0, 0, 0);
      const endW = new Date(startW.getTime());
      endW.setDate(startW.getDate() + 6);
      endW.setHours(23, 59, 59, 999);

      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startW && d <= endW;
      });

      buckets.push({
        label: isoWeekLabel(startW),
        inc: txs.filter(t => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0),
        exp: txs.filter(t => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0)
      });
    }
  } else {
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateStr(d);
      const txs = transactions.filter(t => t.date === dStr);
      buckets.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        inc: txs.filter(t => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0),
        exp: txs.filter(t => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0)
      });
    }
  }

  const maxValInBuckets = Math.max(1, ...buckets.map(b => Math.max(b.inc, b.exp)));

  // Insight generator
  let insightText = "ยังไม่มีข้อมูลเพียงพอนะคะ ลองบันทึกรายการเพิ่มดูค่ะ 🌷";
  if (sortedCats.length > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const topPct = periodTotal ? Math.round((topAmt / periodTotal) * 100) : 0;
    insightText = `หมวด "${topCat}" ใช้จ่ายมากที่สุด คิดเป็น ${topPct}% ของรายจ่ายทั้งหมดในช่วงนี้ (${fmt(
      topAmt
    )}) ค่ะ แนะนำให้ปรับลดตรงส่วนนี้ลงถ้าต้องการประหยัดเพิ่มขึ้นนะคะ 🌷`;
  }

  return (
    <div className="w-full px-5 pt-4 pb-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">วิเคราะห์การเงิน 📊</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm border border-[var(--line)]/20">
          <div className="text-[10px] text-[var(--muted)] mb-1 font-medium">จ่ายวันนี้</div>
          <div className="text-sm font-semibold text-[var(--blush-dark)] display-font">{fmt(dayExp)}</div>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm border border-[var(--line)]/20">
          <div className="text-[10px] text-[var(--muted)] mb-1 font-medium font-medium">สัปดาห์นี้</div>
          <div className="text-sm font-semibold text-[var(--blush-dark)] display-font">{fmt(weekExp)}</div>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm border border-[var(--line)]/20">
          <div className="text-[10px] text-[var(--muted)] mb-1 font-medium">เดือนนี้</div>
          <div className="text-sm font-semibold text-[var(--blush-dark)] display-font">{fmt(monthExp)}</div>
        </div>
      </div>

      {/* Period Toggles */}
      <div className="flex bg-[var(--line)] rounded-full p-1 mb-5 select-none">
        {(["day", "week", "month"] as const).map(p => (
          <button
            key={p}
            onClick={() => setAnalysisPeriod(p)}
            className={`flex-1 border-none bg-transparent py-2 rounded-full font-bold text-xs cursor-pointer transition-all ${
              analysisPeriod === p ? "bg-[var(--card)] text-[var(--ink)]" : "text-[var(--muted)]"
            }`}
          >
            {p === "day" ? "รายวัน" : p === "week" ? "รายสัปดาห์" : "รายเดือน"}
          </button>
        ))}
      </div>

      {/* Breakdown Block */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">สัดส่วนรายจ่ายช่วงนี้</h3>
        <div className="bg-[var(--card)] rounded-2xl p-4.5 shadow-sm border border-[var(--line)]/30 space-y-3.5">
          {sortedCats.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--muted)]">
              <span className="block text-3xl mb-1.5">📊</span>ยังไม่มีรายจ่ายในช่วงเวลานี้เลยค่ะ
            </div>
          ) : (
            sortedCats.map(([cat, amt]) => {
              const pct = periodTotal ? Math.round((amt / periodTotal) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-[var(--ink)] flex items-center gap-1.5 truncate">
                    {renderIconGlyph(getCategoryIcon("expense", cat), "14px")}
                    <span className="truncate">{cat}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--line)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--blush-dark)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-xs font-semibold text-[var(--muted)]">
                    {pct}%
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chart Block */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">แนวโน้มรายรับ - รายจ่าย</h3>
        <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm border border-[var(--line)]/30">
          <div className="flex justify-between items-end h-32 gap-1.5 overflow-x-auto pb-1">
            {buckets.map((b, idx) => {
              const incH = Math.round((b.inc / maxValInBuckets) * 90);
              const expH = Math.round((b.exp / maxValInBuckets) * 90);
              return (
                <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center justify-end h-full">
                  <div className="flex items-end gap-1 h-[90px]">
                    <div
                      className="w-2 rounded-t bg-[var(--sage)] transition-all duration-300"
                      style={{ height: `${incH}px` }}
                      title={`รายรับ: ${fmt(b.inc)}`}
                    />
                    <div
                      className="w-2 rounded-t bg-[var(--blush)] transition-all duration-300"
                      style={{ height: `${expH}px` }}
                      title={`รายจ่าย: ${fmt(b.exp)}`}
                    />
                  </div>
                  <div className="text-[9.5px] text-[var(--muted)] font-medium mt-2.5 whitespace-nowrap">
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-5 pt-3 border-t border-[var(--line)]/50 text-[11px] text-[var(--muted)] justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[var(--sage)] inline-block" />
              รายรับ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[var(--blush)] inline-block" />
              รายจ่าย
            </span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">ข้อสังเกตน่ารักๆ ✨</h3>
        <div className="bg-[var(--lavender-bg)] rounded-2xl p-4 text-[13px] text-[var(--ink)] leading-relaxed border border-[var(--line)]/40">
          {insightText}
        </div>
      </div>
    </div>
  );
}
