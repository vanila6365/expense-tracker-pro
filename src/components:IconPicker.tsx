import React from "react";
import { ICON_PRESETS } from "../constants";
import { X, UploadCloud } from "lucide-react";

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  customIcons: string[];
  onUploadCustomIcons: (files: FileList) => void;
  onDeleteCustomIcon: (index: number) => void;
  onPickIcon: (icon: string) => void;
  showToast: (msg: string) => void;
}

export default function IconPicker({
  isOpen,
  onClose,
  customIcons,
  onUploadCustomIcons,
  onDeleteCustomIcon,
  onPickIcon,
  showToast
}: IconPickerProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadCustomIcons(e.target.files);
      e.target.value = ""; // reset
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--cream)] z-[100] max-w-[480px] mx-auto overflow-y-auto flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--line)] bg-[var(--cream)] sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer"
        >
          <X size={15} />
        </button>
        <h3 className="text-base font-semibold text-[var(--ink)]">เลือกไอคอนหรือสติกเกอร์ 🎀</h3>
        <span className="w-9" />
      </div>

      <div className="p-5 flex-1 space-y-6">
        {/* Custom Upload Button */}
        <div>
          <label className="relative w-full py-4 bg-[var(--card)] border border-dashed border-[var(--line)] hover:bg-white/50 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs text-[var(--muted)] cursor-pointer text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <UploadCloud size={20} className="text-[var(--lavender-dark)]" />
            <span className="font-semibold text-[var(--lavender-dark)]">
              📤 อัปโหลดสติกเกอร์/รูปของตัวเอง
            </span>
            <span>(สามารถเลือกได้ทีละหลายไฟล์)</span>
          </label>
          <p className="text-[10px] text-[var(--muted)]/80 mt-2 leading-relaxed text-center">
            💡 แตะปุ่ม ✕ ที่สติกเกอร์ส่วนตัวเพื่อลบรูปออกจากคลังได้ค่ะ
          </p>
        </div>

        {/* Icons Preset Section */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider px-1">
            ไอคอนยอดนิยม
          </h4>
          <div className="grid grid-cols-6 gap-2.5">
            {ICON_PRESETS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onPickIcon(emoji)}
                className="aspect-square bg-[var(--card)] hover:bg-[var(--line)]/10 rounded-xl border border-[var(--line)]/40 flex items-center justify-center text-xl cursor-pointer active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Uploaded Sticker Section */}
        {customIcons.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider px-1">
              สติกเกอร์ส่วนตัว
            </h4>
            <div className="grid grid-cols-6 gap-2.5">
              {customIcons.map((src, i) => (
                <div key={i} className="relative group">
                  <button
                    onClick={() => onPickIcon(src)}
                    className="aspect-square w-full bg-[var(--card)] rounded-xl border border-[var(--line)]/40 overflow-hidden flex items-center justify-center p-1 cursor-pointer active:scale-95 transition-transform"
                  >
                    <img
                      src={src}
                      alt="sticker"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  <button
                    onClick={() => onDeleteCustomIcon(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--blush-dark)] text-white border border-white flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors shadow-sm text-[9px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
