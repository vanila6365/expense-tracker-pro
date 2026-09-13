import React, { useState } from "react";
import { CategoryStructure } from "../types";
import { NATURE_LABEL } from "../constants";
import { X, Plus, Trash2 } from "lucide-react";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryStructure;
  getCategoryIcon: (kind: string, catName: string) => string;
  onAddCategory: (kind: "income" | "expense", nature: string, name: string) => void;
  onRemoveCategory: (kind: "income" | "expense", nature: string, index: number) => void;
  onOpenIconPicker: (target: any) => void;
}

export default function CategoryManager({
  isOpen,
  onClose,
  categories,
  getCategoryIcon,
  onAddCategory,
  onRemoveCategory,
  onOpenIconPicker
}: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [newCatNames, setNewCatNames] = useState<Record<string, string>>({});

  const handleAdd = (nature: string) => {
    const val = (newCatNames[nature] || "").trim();
    if (!val) return;

    onAddCategory(activeTab, nature, val);
    setNewCatNames(prev => ({ ...prev, [nature]: "" }));
  };

  const renderIconGlyph = (icon: string, size = "1.1em") => {
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt="icon"
          style={{ width: size, height: size, objectFit: "cover", borderRadius: "4px" }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span style={{ fontSize: "16px" }}>{icon}</span>;
  };

  if (!isOpen) return null;

  const natures = Object.keys(categories[activeTab] || {});

  return (
    <div className="fixed inset-0 bg-[var(--cream)] z-50 max-w-[480px] mx-auto overflow-y-auto flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--line)] bg-[var(--cream)] sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border-none shadow-sm cursor-pointer"
        >
          <X size={15} />
        </button>
        <h3 className="text-base font-semibold text-[var(--ink)]">จัดการหมวดหมู่ 🏷️</h3>
        <span className="w-9" />
      </div>

      <div className="p-5 flex-1 space-y-5">
        {/* Tab switcher */}
        <div>
          <div className="flex bg-[var(--line)] rounded-full p-1 select-none">
            <button
              onClick={() => setActiveTab("income")}
              className={`flex-1 py-2 rounded-full font-bold text-xs cursor-pointer border-none bg-transparent transition-all ${
                activeTab === "income" ? "bg-[var(--sage)] text-white" : "text-[var(--muted)]"
              }`}
            >
              รายรับ
            </button>
            <button
              onClick={() => setActiveTab("expense")}
              className={`flex-1 py-2 rounded-full font-bold text-xs cursor-pointer border-none bg-transparent transition-all ${
                activeTab === "expense" ? "bg-[var(--blush)] text-white" : "text-[var(--muted)]"
              }`}
            >
              รายจ่าย
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-2 leading-relaxed text-center">
            💡 แตะที่ไอคอนหน้าชื่อหมวดหมู่ เพื่อเปลี่ยนรูปภาพหรือสติ๊กเกอร์ของตัวเองได้ค่ะ
          </p>
        </div>

        {/* Natures list */}
        <div className="space-y-6">
          {natures.map(nat => {
            const items = (categories[activeTab] as any)[nat] || [];

            return (
              <div key={nat} className="space-y-2.5">
                <label className="block text-xs font-semibold text-[var(--muted)] tracking-wide uppercase px-1">
                  {NATURE_LABEL[nat] || nat}
                </label>

                {/* Chips container */}
                <div className="flex flex-wrap gap-2">
                  {items.length === 0 ? (
                    <span className="text-xs text-[var(--muted)] italic p-1">ยังไม่มีหมวดหมู่</span>
                  ) : (
                    items.map((c: string, idx: number) => {
                      const icon = getCategoryIcon(activeTab, c);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 bg-[var(--card)] py-2 px-3.5 rounded-full border border-[var(--line)]/50 text-xs text-[var(--ink)] shadow-sm"
                        >
                          <span
                            className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            onClick={() =>
                              onOpenIconPicker({
                                type: "category",
                                kind: activeTab,
                                name: c
                              })
                            }
                          >
                            {renderIconGlyph(icon)}
                          </span>
                          <span className="font-medium">{c}</span>
                          <button
                            onClick={() => onRemoveCategory(activeTab, nat, idx)}
                            className="text-[var(--blush-dark)] hover:opacity-80 p-0.5 border-none bg-none cursor-pointer focus:outline-none"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Add Input */}
                <div className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    className="flex-1 p-2.5 bg-[var(--card)] rounded-xl border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none"
                    placeholder="เพิ่มหมวดหมู่ใหม่..."
                    value={newCatNames[nat] || ""}
                    onChange={e =>
                      setNewCatNames(prev => ({ ...prev, [nat]: e.target.value }))
                    }
                    onKeyDown={e => {
                      if (e.key === "Enter") handleAdd(nat);
                    }}
                  />
                  <button
                    onClick={() => handleAdd(nat)}
                    className="w-10 h-10 rounded-xl bg-[var(--ink)] text-white border-none flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
