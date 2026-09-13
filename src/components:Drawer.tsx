import React, { useState, useEffect } from "react";
import { AppSettings, Account } from "../types";
import { THEMES } from "../constants";
import { X, Palette, DollarSign, HelpCircle, FileSpreadsheet, Download, UploadCloud, LogOut } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onThemePick: (key: string) => void;
  onSetBudget: (type: "day" | "week" | "month", val: number) => void;
  accounts: Account[];
  accountBalance: (accId: string) => number;
  onExportCSV: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onLogout: () => void;
  onOpenCategoryManager: () => void;
}

export default function Drawer({
  isOpen,
  onClose,
  settings,
  onThemePick,
  onSetBudget,
  accounts,
  accountBalance,
  onExportCSV,
  onExportBackup,
  onImportBackup,
  onLogout,
  onOpenCategoryManager
}: DrawerProps) {
  const [dayVal, setDayVal] = useState<string>("");
  const [weekVal, setWeekVal] = useState<string>("");
  const [monthVal, setMonthVal] = useState<string>("");
  const [actualBalance, setActualBalance] = useState<string>("");
  const [reconcileResult, setReconcileResult] = useState<string>("");
  const [reconcileSuccess, setReconcileSuccess] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setDayVal(settings.budgetDay > 0 ? settings.budgetDay.toString() : "");
      setWeekVal(settings.budgetWeek > 0 ? settings.budgetWeek.toString() : "");
      setMonthVal(settings.budget > 0 ? settings.budget.toString() : "");
      setActualBalance(settings.actualBalance || "");
      setReconcileResult("");
    }
  }, [isOpen, settings]);

  const allAccountsTotal = accounts.reduce((sum, a) => sum + accountBalance(a.id), 0);
  const fmt = (n: number) => "฿" + Math.round(n).toLocaleString("th-TH");

  // Reconcile logic
  const handleReconcileChange = (val: string) => {
    setActualBalance(val);
    if (!val || isNaN(Number(val))) {
      setReconcileResult("");
      return;
    }

    const actual = Number(val);
    const diff = actual - allAccountsTotal;

    if (Math.abs(diff) < 1) {
      setReconcileSuccess(true);
      setReconcileResult(`✅ ยอดตรงกันค่ะ! รวมทุกบัญชีคำนวณได้ ${fmt(allAccountsTotal)}`);
    } else {
      setReconcileSuccess(false);
      setReconcileResult(
        `⚠️ ยอดไม่ตรงกัน: คำนวณได้ ${fmt(allAccountsTotal)} แต่ยอดจริง ${fmt(actual)} (ต่างกัน ${fmt(
          Math.abs(diff)
        )})`
      );
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[150] max-w-[480px] mx-auto animate-fade-in"
      />

      {/* Drawer body */}
      <div className="fixed top-0 right-0 bottom-0 w-[82%] max-w-[340px] bg-[var(--cream)] z-[160] shadow-2xl flex flex-col overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-5 border-b border-[var(--line)]">
          <h3 className="text-base font-semibold text-[var(--ink)]">ตั้งค่าการเงิน ⚙️</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 flex-1 space-y-6">
          {/* Main Menus */}
          <div className="space-y-1">
            <button
              onClick={onOpenCategoryManager}
              className="w-full text-left p-3 rounded-xl bg-[var(--card)] hover:bg-[var(--line)]/10 border border-[var(--line)]/30 font-medium text-xs text-[var(--ink)] shadow-sm flex items-center gap-2"
            >
              <span>🏷️</span> จัดการหมวดรับ - จ่าย
            </button>
            <p className="text-[9.5px] text-[var(--muted)] px-1 leading-normal">
              (หมายเหตุ: การเพิ่มหรือแก้ไขบัญชี/กลุ่มบัญชี สามารถจัดการได้ที่แท็บ "บัญชี" โดยตรงค่ะ)
            </p>
          </div>

          {/* Theme grid */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] mb-3 flex items-center gap-1.5 uppercase tracking-wide px-1">
              <Palette size={13} className="text-[var(--lavender-dark)]" />
              ธีมสีแอป 🎨
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} className="text-center">
                  <button
                    onClick={() => onThemePick(key)}
                    className={`w-full aspect-square rounded-xl border-2 transition-all cursor-pointer relative ${
                      settings.theme === key ? "border-[var(--ink)] scale-102" : "border-transparent"
                    }`}
                    style={{ background: t.swatch }}
                  />
                  <span className="text-[9px] text-[var(--muted)] block mt-1">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5 uppercase tracking-wide px-1">
              <DollarSign size={13} className="text-[var(--lavender-dark)]" />
              งบประมาณรายจ่าย (แจ้งเตือนแถบสี)
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]/30">
                <span className="text-xs text-[var(--ink)] font-medium">งบต่อวัน</span>
                <input
                  type="number"
                  placeholder="บาท"
                  className="w-24 p-1.5 bg-transparent border-b border-[var(--line)] text-right text-xs focus:outline-none"
                  value={dayVal}
                  onChange={e => setDayVal(e.target.value)}
                  onBlur={() => onSetBudget("day", Number(dayVal) || 0)}
                />
              </div>

              <div className="flex items-center justify-between bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]/30">
                <span className="text-xs text-[var(--ink)] font-medium">งบต่อสัปดาห์</span>
                <input
                  type="number"
                  placeholder="บาท"
                  className="w-24 p-1.5 bg-transparent border-b border-[var(--line)] text-right text-xs focus:outline-none"
                  value={weekVal}
                  onChange={e => setWeekVal(e.target.value)}
                  onBlur={() => onSetBudget("week", Number(weekVal) || 0)}
                />
              </div>

              <div className="flex items-center justify-between bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]/30">
                <span className="text-xs text-[var(--ink)] font-medium">งบต่อเดือน</span>
                <input
                  type="number"
                  placeholder="บาท"
                  className="w-24 p-1.5 bg-transparent border-b border-[var(--line)] text-right text-xs focus:outline-none"
                  value={monthVal}
                  onChange={e => setMonthVal(e.target.value)}
                  onBlur={() => onSetBudget("month", Number(monthVal) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Reconcile checker */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5 uppercase tracking-wide px-1">
              <HelpCircle size={13} className="text-[var(--lavender-dark)]" />
              ตรวจสอบยอดเงินจริง
            </h4>
            <div className="bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]/30 space-y-2">
              <label className="block text-[10px] text-[var(--muted)]">กรอกยอดเงินจริงทั้งหมดที่คุณมี ณ ตอนนี้</label>
              <input
                type="number"
                placeholder="ยอดเงินจริงรวมทั้งหมด"
                className="w-full p-2 bg-[var(--cream)] rounded-lg text-xs font-semibold focus:outline-none"
                value={actualBalance}
                onChange={e => handleReconcileChange(e.target.value)}
              />
              {reconcileResult && (
                <div
                  className={`p-2 rounded-lg text-[10.5px] leading-relaxed font-semibold border ${
                    reconcileSuccess
                      ? "bg-[var(--sage-bg)] text-[var(--sage-dark)] border-[var(--sage)]/20"
                      : "bg-[var(--blush-bg)] text-[var(--blush-dark)] border-[var(--blush)]/20"
                  }`}
                >
                  {reconcileResult}
                </div>
              )}
            </div>
          </div>

          {/* Data Export / Import Backups */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide px-1">
              สำรองและดาวน์โหลดข้อมูล
            </h4>

            <button
              onClick={onExportCSV}
              className="w-full py-2.5 bg-transparent border border-[var(--line)] hover:bg-white/40 text-xs text-[var(--ink)] font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              ดาวน์โหลดไฟล์รายงาน CSV
            </button>

            <button
              onClick={onExportBackup}
              className="w-full py-2.5 bg-transparent border border-[var(--line)] hover:bg-white/40 text-xs text-[var(--ink)] font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <Download size={14} className="text-blue-500" />
              สำรองข้อมูลหลัก (ไฟล์ JSON)
            </button>

            <label className="relative w-full py-2.5 bg-transparent border border-[var(--line)] hover:bg-white/40 text-xs text-[var(--ink)] font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="application/json"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImportFile}
              />
              <UploadCloud size={14} className="text-orange-500" />
              นำเข้าข้อมูลจากไฟล์สำรอง
            </label>
          </div>

          {/* Log Out */}
          <div className="pt-4 border-t border-[var(--line)]">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-[var(--blush-bg)] text-[var(--blush-dark)] font-semibold rounded-xl flex items-center justify-center gap-2 text-xs border-none cursor-pointer"
            >
              <LogOut size={14} />
              ออกจากระบบบัญชี
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
