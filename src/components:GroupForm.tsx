import React, { useState } from "react";
import { X, Check } from "lucide-react";

interface GroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  showToast: (msg: string) => void;
}

export default function GroupForm({ isOpen, onClose, onSave, showToast }: GroupFormProps) {
  const [name, setName] = useState<string>("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("กรุณากรอกชื่อกลุ่มบัญชีด้วยนะคะ");
      return;
    }
    onSave(trimmed);
    setName("");
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
        <h3 className="text-base font-semibold text-[var(--ink)]">เพิ่มกลุ่มบัญชี</h3>
        <span className="w-9" />
      </div>

      <div className="p-5 space-y-5 flex-1">
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">ชื่อกลุ่ม</label>
          <input
            type="text"
            className="w-full p-3 bg-[var(--card)] rounded-xl border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lavender-dark)]"
            placeholder="เช่น บัญชีธุรกิจ, บัญชีออมทอง..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-[var(--ink)] text-white font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Check size={18} />
          บันทึกกลุ่ม 💛
        </button>
      </div>
    </div>
  );
}
