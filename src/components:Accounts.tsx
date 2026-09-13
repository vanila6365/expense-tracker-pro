import React from "react";
import { Account, AccountGroup } from "../types";
import { PlusCircle, Wallet, Edit2, FolderPlus } from "lucide-react";

interface AccountsProps {
  accounts: Account[];
  accountGroups: AccountGroup[];
  allAccountsTotal: number;
  onOpenAccountForm: (id?: string) => void;
  onOpenGroupForm: () => void;
  onGoToAccountHistory: (id: string) => void;
  accountBalance: (accId: string) => number;
}

export default function Accounts({
  accounts,
  accountGroups,
  allAccountsTotal,
  onOpenAccountForm,
  onOpenGroupForm,
  onGoToAccountHistory,
  accountBalance
}: AccountsProps) {
  const fmt = (n: number) => "฿" + Math.round(n).toLocaleString("th-TH");

  const renderIconGlyph = (icon: string | undefined, size = "1.2em") => {
    if (!icon) return "💼";
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt="icon"
          style={{ width: size, height: size, objectFit: "cover", borderRadius: "8px" }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span style={{ fontSize: size }}>{icon}</span>;
  };

  return (
    <div className="w-full px-5 pt-4 pb-8">
      {/* Tab Title */}
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">บัญชีของฉัน 👛</h2>

      {/* Account Total Hero */}
      <div className="bg-[var(--card)] rounded-2xl p-6 text-center shadow-sm border border-[var(--line)]/50 mb-6">
        <div className="text-xs text-[var(--muted)]">ยอดรวมทุกบัญชี ณ วันนี้</div>
        <div className="text-3xl font-bold mt-1 text-[var(--ink)] display-font">{fmt(allAccountsTotal)}</div>
      </div>

      {/* Account Groups */}
      <div className="space-y-6">
        {accountGroups.map(group => {
          const groupAccounts = accounts.filter(acc => acc.groupId === group.id);

          return (
            <div key={group.id} className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)] tracking-wide uppercase px-1">
                <span>{group.name}</span>
                <span>ยอดเงิน</span>
              </div>

              {groupAccounts.length === 0 ? (
                <div className="bg-[var(--card)]/50 rounded-2xl p-4 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)]">
                  ยังไม่มีบัญชีในกลุ่มนี้
                </div>
              ) : (
                groupAccounts.map(acc => {
                  const bal = accountBalance(acc.id);
                  return (
                    <div
                      key={acc.id}
                      className="bg-[var(--card)] rounded-2xl p-3.5 flex items-center justify-between border border-[var(--line)]/30 shadow-sm"
                    >
                      <div
                        onClick={() => onGoToAccountHistory(acc.id)}
                        className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--lavender-bg)] flex items-center justify-center">
                          {renderIconGlyph(acc.icon, "20px")}
                        </div>
                        <div className="font-semibold text-[13.5px] text-[var(--ink)] truncate">
                          {acc.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="font-bold text-[14.5px] text-[var(--ink)]">
                          {fmt(bal)}
                        </div>
                        <button
                          onClick={() => onOpenAccountForm(acc.id)}
                          className="w-8 h-8 rounded-full border-none bg-none text-[var(--muted)] flex items-center justify-center hover:bg-[var(--line)]/35 hover:text-[var(--ink)] active:scale-95 transition-all cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 space-y-2.5">
        <button
          onClick={() => onOpenAccountForm()}
          className="w-full py-3.5 bg-transparent border-1.5 border-dashed border-[var(--line)] text-[var(--lavender-dark)] font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/50 cursor-pointer"
        >
          <PlusCircle size={15} />
          เพิ่มบัญชีใหม่
        </button>

        <button
          onClick={onOpenGroupForm}
          className="w-full py-3.5 bg-transparent border-1.5 border-dashed border-[var(--line)] text-[var(--lavender-dark)] font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/50 cursor-pointer"
        >
          <FolderPlus size={15} />
          เพิ่มกลุ่มบัญชี
        </button>
      </div>
    </div>
  );
}
