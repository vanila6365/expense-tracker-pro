import React, { useState, useEffect } from "react";
import { Account, AccountGroup } from "../types";
import { X, Check, Trash2 } from "lucide-react";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  accounts: Account[];
  accountGroups: AccountGroup[];
  onSave: (name: string, groupId: string, initialBalance: number, icon: string) => void;
  onDelete: (id: string) => void;
  onOpenIconPicker: (target: string) => void;
  selectedIcon: string;
  setSelectedIcon: (icon: string) => void;
  showToast: (msg: string) => void;
}

export default function AccountForm({
  isOpen,
  onClose,
  editingId,
  accounts,
  accountGroups,
  onSave,
  onDelete,
  onOpenIconPicker,
  selectedIcon,
  setSelectedIcon,
  showToast
}: AccountFormProps) {
  const [name, setName] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [initialBalance, setInitialBalance] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    if (editingId) {
      const acc = accounts.find(a => a.id === editingId);
      if (acc) {
        setName(acc.name);
        setGroupId(acc.groupId);
        setInitialBalance(acc.initialBalance.toString());
        setSelectedIcon(acc.icon);
      }
    } else {
      setName("");
      setGroupId(accountGroups[0]?.id || "");
      setInitialBalance("");
      setSelectedIcon("💵");
    }
  }, [isOpen, editingId, accounts, accountGroups, setSelectedIcon]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("กรุณากรอกชื่อบัญชีด้วยนะคะ");
      return;
    }
    if (!groupId) {
      showToast("กรุณาเลือกกลุ่มบัญชีด้วยนะคะ");
      return;
    }

    onSave(trimmedName, groupId, Number(initialBalance) || 0, selectedIcon);
  };

  const renderIconGlyph = (icon: string, size = "100%") => {
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt="icon"
          style={{ width: size, height: size, objectFit: "cover", borderRadius: "12px" }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span style={{ fontSize: "24px" }}>{icon}</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--cream)] z-50 max-w-[480px] mx-auto overflow-y-auto flex flex-col animate-fade-in">
      <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--line)] bg-[var(--cream)] sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer"
        >
          <X size={15} />
        </button>
        <h3 className="text-base font-semibold text-[var(--ink)]">
          {editingId ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"}
        </h3>
        <span className="w-9" />
      </div>

      <div className="p-5 flex-1 space-y-5">
        {/* Icon picker previews */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">ไอคอนบัญชี</label>
          <div className="flex items-center gap-4 bg-[var(--card)] p-4 rounded-2xl border border-[var(--line)]/35 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[var(--lavender-bg)] flex items-center justify-center border border-[var(--line)] flex-shrink-0">
              {renderIconGlyph(selectedIcon)}
            </div>
            <button
              onClick={() => onOpenIconPicker("account")}
              className="py-2.5 px-4 bg-transparent border border-[var(--line)] hover:bg-white/50 text-xs font-semibold text-[var(--ink)] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              เลือก / อัปโหลดสติกเกอร์
            </button>
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">ชื่อบัญชี</label>
          <input
            type="text"
            className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
            placeholder="เช่น บัญชีเงินเดือน, เงินสดกระเป๋า..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Group Selector */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">กลุ่มบัญชี</label>
          <select
            className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none"
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
          >
            {accountGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Balance */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">ยอดเงินเริ่มต้น</label>
          <input
            type="number"
            className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
            placeholder="0"
            value={initialBalance}
            onChange={e => setInitialBalance(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[var(--ink)] text-white font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={18} />
            บันทึกบัญชี 💛
          </button>

          {editingId && (
            <button
              onClick={() => onDelete(editingId)}
              className="w-full py-3.5 bg-[var(--blush-bg)] text-[var(--blush-dark)] font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all border-none cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 size={15} />
              ลบบัญชีนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
