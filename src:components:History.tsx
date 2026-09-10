import React from "react";
import { Transaction, Account } from "../types";
import { Search, Star } from "lucide-react";

interface HistoryProps {
  transactions: Transaction[];
  accounts: Account[];
  historyFilter: string;
  setHistoryFilter: (filter: string) => void;
  historyAccountFilter: string;
  setHistoryAccountFilter: (filter: string) => void;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  onOpenEditForm: (id: string) => void;
  onQuickToggleFavorite: (id: string, e: React.MouseEvent) => void;
  getCategoryIcon: (kind: string, catName: string) => string;
}

export default function History({
  transactions,
  accounts,
  historyFilter,
  setHistoryFilter,
  historyAccountFilter,
  setHistoryAccountFilter,
  historySearch,
  setHistorySearch,
  onOpenEditForm,
  onQuickToggleFavorite,
  getCategoryIcon
}: HistoryProps) {
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

  const txMatchesAccount = (t: Transaction, accId: string) => {
    if (accId === "all") return true;
    return t.accountId === accId || t.fromAccountId === accId || t.toAccountId === accId;
  };

  // Perform filters
  let filtered = [...transactions];

  if (historyFilter === "favorite") {
    filtered = filtered.filter(t => t.favorite);
  } else if (historyFilter !== "all") {
    filtered = filtered.filter(t => t.kind === historyFilter);
  }

  if (historyAccountFilter !== "all") {
    filtered = filtered.filter(t => txMatchesAccount(t, historyAccountFilter));
  }

  const query = historySearch.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(
      t =>
        (t.note || "").toLowerCase().includes(query) ||
        (t.category || "").toLowerCase().includes(query)
    );
  }

  // Sort: descending by date, then descending by creation time
  filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt
  );

  // Group by date
  let lastDate: string | null = null;

  return (
    <div className="w-full px-5 pt-4 pb-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">รายการทั้งหมด 📋</h2>

      {/* Filter Options */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <input
            className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
            placeholder="ค้นหาหมวดหมู่, หมายเหตุ..."
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
          />
          <Search size={15} className="absolute left-3.5 top-3.5 text-[var(--muted)]" />
        </div>

        <select
          className="w-full p-2.5 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)] cursor-pointer focus:outline-none"
          value={historyAccountFilter}
          onChange={e => setHistoryAccountFilter(e.target.value)}
        >
          <option value="all">ทุกบัญชี</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.icon && a.icon.startsWith("data:") ? "🖼️" : a.icon} {a.name}
            </option>
          ))}
        </select>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "income", label: "รายรับ" },
            { id: "expense", label: "รายจ่าย" },
            { id: "transfer", label: "โอนเงิน" },
            { id: "favorite", label: "⭐ โปรด" }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setHistoryFilter(chip.id)}
              className={`py-1.5 px-3.5 text-xs rounded-full cursor-pointer whitespace-nowrap transition-colors ${
                historyFilter === chip.id
                  ? "bg-[var(--ink)] text-white font-medium border border-[var(--ink)]"
                  : "bg-[var(--card)] text-[var(--muted)] border border-[var(--line)]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Transaction List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--muted)]">
            <span className="block text-3xl mb-1.5">🔍</span>ไม่พบรายการเลยค่ะ
          </div>
        ) : (
          filtered.map(t => {
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

            const showDateHeader = t.date !== lastDate;
            if (showDateHeader) {
              lastDate = t.date;
            }

            return (
              <React.Fragment key={t.id}>
                {showDateHeader && (
                  <div className="text-xs font-bold text-[var(--muted)] mt-4 mb-1.5 px-1">
                    {t.date}
                  </div>
                )}
                <div className="bg-[var(--card)] rounded-2xl p-3 flex items-center justify-between border border-[var(--line)]/20 shadow-sm">
                  <div
                    onClick={() => onOpenEditForm(t.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                        isIncome ? "bg-[var(--sage-bg)]" : isExpense ? "bg-[var(--blush-bg)]" : "bg-[var(--lavender-bg)]"
                      }`}
                    >
                      {renderIconGlyph(icon, "16px")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[var(--ink)] flex items-center gap-1 truncate">
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

                  <div className="flex items-center gap-2.5 ml-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => onQuickToggleFavorite(t.id, e)}
                      className={`text-base p-1 border-none bg-none cursor-pointer focus:outline-none ${
                        t.favorite ? "text-[var(--gold)]" : "text-[var(--muted)]"
                      }`}
                    >
                      {t.favorite ? "★" : "☆"}
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
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
