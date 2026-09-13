import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Transaction, Account, AccountGroup, CategoryStructure, AppSettings } from "./types";
import { DEFAULT_CATS, DEFAULT_SETTINGS } from "./constants";

// Import Custom Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import History from "./components/History";
import Analysis from "./components/Analysis";
import Drawer from "./components/Drawer";
import TransactionForm from "./components/TransactionForm";
import AccountForm from "./components/AccountForm";
import GroupForm from "./components/GroupForm";
import CategoryManager from "./components/CategoryManager";
import IconPicker from "./components/IconPicker";

// Helper function to recursively remove undefined properties before saving to Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as any)[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToastState] = useState<boolean>(false);

  // Core application states
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([
    { id: "g-cash", name: "เงินสด/กระเป๋าเงิน" },
    { id: "g-bank", name: "บัญชีธนาคาร" }
  ]);
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "a-cash", name: "เงินสด", icon: "💵", groupId: "g-cash", initialBalance: 0 },
    { id: "a-wallet", name: "กระเป๋าสตางค์", icon: "👛", groupId: "g-cash", initialBalance: 0 }
  ]);
  const [categories, setCategories] = useState<CategoryStructure>(JSON.parse(JSON.stringify(DEFAULT_CATS)));
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [customIcons, setCustomIcons] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Navigation and month states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [analysisPeriod, setAnalysisPeriod] = useState<"day" | "week" | "month">("month");

  // History search/filter states
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [historyAccountFilter, setHistoryAccountFilter] = useState<string>("all");
  const [historySearch, setHistorySearch] = useState<string>("all");

  // Form toggles and states
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [txFormOpen, setTxFormOpen] = useState<boolean>(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [accountFormOpen, setAccountFormOpen] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState<boolean>(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState<boolean>(false);
  const [iconPickerOpen, setIconPickerOpen] = useState<boolean>(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<any>(null);
  const [selectedAccountIcon, setSelectedAccountIcon] = useState<string>("💵");

  // Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalText, setConfirmModalText] = useState<string>("");
  const [confirmResolver, setConfirmResolver] = useState<((val: boolean) => void) | null>(null);

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToastState(true);
    setTimeout(() => {
      setShowToastState(false);
    }, 1900);
  };

  // Confirmation Modal Handler
  const askConfirmation = (text: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmModalText(text);
      setConfirmModalOpen(true);
      setConfirmResolver(() => (val: boolean) => {
        setConfirmModalOpen(false);
        resolve(val);
      });
    });
  };

  // 1. Connection check & Auth Listener
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setAppLoading(true);
        try {
          // Load User metadata & settings
          const userDocRef = doc(db, "users", u.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.accountGroups) setAccountGroups(data.accountGroups);
            if (data.accounts) setAccounts(data.accounts);
            if (data.categories) setCategories(data.categories);
            if (data.categoryIcons) setCategoryIcons(data.categoryIcons);
            if (data.customIcons) setCustomIcons(data.customIcons);
            if (data.settings) setSettings(data.settings);
          } else {
            // First time user registration - initialize Document
            const initialMeta = {
              uid: u.uid,
              email: u.email || "",
              accountGroups: [
                { id: "g-cash", name: "เงินสด/กระเป๋าเงิน" },
                { id: "g-bank", name: "บัญชีธนาคาร" }
              ],
              accounts: [
                { id: "a-cash", name: "เงินสด", icon: "💵", groupId: "g-cash", initialBalance: 0 },
                { id: "a-wallet", name: "กระเป๋าสตางค์", icon: "👛", groupId: "g-cash", initialBalance: 0 }
              ],
              categories: DEFAULT_CATS,
              categoryIcons: {},
              customIcons: [],
              settings: DEFAULT_SETTINGS,
              createdAt: Date.now()
            };
            await setDoc(userDocRef, cleanUndefined(initialMeta));
            setAccountGroups(initialMeta.accountGroups);
            setAccounts(initialMeta.accounts);
            setCategories(initialMeta.categories);
            setCategoryIcons(initialMeta.categoryIcons);
            setCustomIcons(initialMeta.customIcons);
            setSettings(initialMeta.settings);
          }

          // Fetch user transactions
          const txColRef = collection(db, "users", u.uid, "transactions");
          const txSnap = await getDocs(txColRef);
          const list: Transaction[] = [];
          txSnap.forEach(doc => {
            list.push(doc.data() as Transaction);
          });
          setTransactions(list);
        } catch (e) {
          console.error("Firestore read error", e);
        } finally {
          setAppLoading(false);
        }
      } else {
        setUser(null);
        setAppLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Sync Theme whenever settings state updates
  useEffect(() => {
    if (settings && settings.theme) {
      applyThemeStyles(settings.theme);
    }
  }, [settings]);

  const applyThemeStyles = (themeKey: string) => {
    const root = document.documentElement;
    if (themeKey === "dark") {
      root.style.setProperty("--cream", "#17171A");
      root.style.setProperty("--card", "#232326");
      root.style.setProperty("--sage", "#6FA085");
      root.style.setProperty("--sage-dark", "#8FD1AC");
      root.style.setProperty("--sage-bg", "#1E2C25");
      root.style.setProperty("--blush", "#DE7E93");
      root.style.setProperty("--blush-dark", "#F2A9BA");
      root.style.setProperty("--blush-bg", "#2E2024");
      root.style.setProperty("--lavender", "#8F7FC2");
      root.style.setProperty("--lavender-dark", "#B6A6E8");
      root.style.setProperty("--lavender-bg", "#26223A");
      root.style.setProperty("--ink", "#EDE9E3");
      root.style.setProperty("--muted", "#8A857E");
      root.style.setProperty("--line", "#333336");
    } else if (themeKey === "gray") {
      root.style.setProperty("--cream", "#F1F1EF");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#A9B8AE");
      root.style.setProperty("--sage-dark", "#6E8375");
      root.style.setProperty("--sage-bg", "#E7ECE8");
      root.style.setProperty("--blush", "#C9AEB2");
      root.style.setProperty("--blush-dark", "#93676D");
      root.style.setProperty("--blush-bg", "#F0E6E7");
      root.style.setProperty("--lavender", "#B5B3C0");
      root.style.setProperty("--lavender-dark", "#736F87");
      root.style.setProperty("--lavender-bg", "#E9E8ED");
      root.style.setProperty("--ink", "#3D3D3B");
      root.style.setProperty("--muted", "#9A9995");
      root.style.setProperty("--line", "#E2E1DD");
    } else if (themeKey === "green") {
      root.style.setProperty("--cream", "#F2FAF4");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#7FC498");
      root.style.setProperty("--sage-dark", "#3F8B5C");
      root.style.setProperty("--sage-bg", "#DFF3E5");
      root.style.setProperty("--blush", "#F0C7A6");
      root.style.setProperty("--blush-dark", "#CC8A4B");
      root.style.setProperty("--blush-bg", "#FBEEE0");
      root.style.setProperty("--lavender", "#9FCBB0");
      root.style.setProperty("--lavender-dark", "#4E8E68");
      root.style.setProperty("--lavender-bg", "#E1F1E7");
      root.style.setProperty("--ink", "#284130");
      root.style.setProperty("--muted", "#87A190");
      root.style.setProperty("--line", "#DAEFE1");
    } else if (themeKey === "pink") {
      root.style.setProperty("--cream", "#FFF3F7");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#B7D9C6");
      root.style.setProperty("--sage-dark", "#6FA085");
      root.style.setProperty("--sage-bg", "#E7F2EA");
      root.style.setProperty("--blush", "#F193B4");
      root.style.setProperty("--blush-dark", "#D6588A");
      root.style.setProperty("--blush-bg", "#FCE1EA");
      root.style.setProperty("--lavender", "#EBAECF");
      root.style.setProperty("--lavender-dark", "#C15D96");
      root.style.setProperty("--lavender-bg", "#FBE7F1");
      root.style.setProperty("--ink", "#4A2A38");
      root.style.setProperty("--muted", "#B08A9A");
      root.style.setProperty("--line", "#F6DCE6");
    } else if (themeKey === "blue") {
      root.style.setProperty("--cream", "#F0F8FE");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#A6D8C9");
      root.style.setProperty("--sage-dark", "#4E9A82");
      root.style.setProperty("--sage-bg", "#E1F3ED");
      root.style.setProperty("--blush", "#F0B7A6");
      root.style.setProperty("--blush-dark", "#D67750");
      root.style.setProperty("--blush-bg", "#FBE7DF");
      root.style.setProperty("--lavender", "#8FC1EE");
      root.style.setProperty("--lavender-dark", "#3E7FBF");
      root.style.setProperty("--lavender-bg", "#DFEFFC");
      root.style.setProperty("--ink", "#20344A");
      root.style.setProperty("--muted", "#89A0B5");
      root.style.setProperty("--line", "#D9EAF8");
    } else if (themeKey === "purple") {
      root.style.setProperty("--cream", "#F7F1FD");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#B9D8C4");
      root.style.setProperty("--sage-dark", "#5F9B77");
      root.style.setProperty("--sage-bg", "#E5F2EA");
      root.style.setProperty("--blush", "#E3AED9");
      root.style.setProperty("--blush-dark", "#AB5C9E");
      root.style.setProperty("--blush-bg", "#F7E5F3");
      root.style.setProperty("--lavender", "#B48EE0");
      root.style.setProperty("--lavender-dark", "#6E3FAE");
      root.style.setProperty("--lavender-bg", "#EDE1FA");
      root.style.setProperty("--ink", "#372449");
      root.style.setProperty("--muted", "#9C8AB0");
      root.style.setProperty("--line", "#E9DDF8");
    } else {
      // Pastel Theme (Default)
      root.style.setProperty("--cream", "#FBF6EF");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--sage", "#AACDBA");
      root.style.setProperty("--sage-dark", "#6FA085");
      root.style.setProperty("--sage-bg", "#E7F2EA");
      root.style.setProperty("--blush", "#F1BFCB");
      root.style.setProperty("--blush-dark", "#DE7E93");
      root.style.setProperty("--blush-bg", "#FBEAEE");
      root.style.setProperty("--lavender", "#C7BEE0");
      root.style.setProperty("--lavender-dark", "#8F7FC2");
      root.style.setProperty("--lavender-bg", "#EFEBF8");
      root.style.setProperty("--ink", "#4A4139");
      root.style.setProperty("--muted", "#A69C92");
      root.style.setProperty("--line", "#EFE4D7");
    }
  };

  // Helper function to persist User metadata document
  const saveUserMetadata = async (newMeta: Partial<any>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, cleanUndefined(newMeta), { merge: true });
    } catch (e) {
      console.error("Firestore metadata save error", e);
      triggerToast("ไม่สามารถอัปเดตข้อมูลบนระบบคลาวด์ได้");
    }
  };

  // Category Icon helper
  const getCategoryIcon = (kind: string, catName: string) => {
    return categoryIcons[catName] || (kind === "income" ? "💰" : "🧾");
  };

  // Transaction Actions
  const handleSaveTransaction = async (txData: Partial<Transaction>) => {
    if (!user) return;
    const tid = editingTxId || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newTx: Transaction = {
      id: tid,
      kind: txData.kind!,
      amount: txData.amount!,
      date: txData.date!,
      note: txData.note,
      ref: txData.ref,
      photo: txData.photo,
      favorite: txData.favorite,
      accountId: txData.accountId,
      fromAccountId: txData.fromAccountId,
      toAccountId: txData.toAccountId,
      category: txData.category,
      nature: txData.nature,
      createdAt: editingTxId
        ? transactions.find(t => t.id === editingTxId)?.createdAt || Date.now()
        : Date.now()
    };

    try {
      const docRef = doc(db, "users", user.uid, "transactions", tid);
      await setDoc(docRef, cleanUndefined(newTx));

      if (editingTxId) {
        setTransactions(prev => prev.map(t => (t.id === editingTxId ? newTx : t)));
        triggerToast("แก้ไขรายการเรียบร้อยค่ะ ✨");
      } else {
        setTransactions(prev => [...prev, newTx]);
        triggerToast("บันทึกรายการสำเร็จค่ะ ✨");
      }
      setTxFormOpen(false);
    } catch (e) {
      console.error(e);
      triggerToast("เกิดข้อผิดพลาดในการบันทึกรายการ");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const confirmed = await askConfirmation("ยืนยันที่จะลบรายการบันทึกนี้ใช่หรือไม่?");
    if (!confirmed) return;

    try {
      const docRef = doc(db, "users", user.uid, "transactions", id);
      await deleteDoc(docRef);

      setTransactions(prev => prev.filter(t => t.id !== id));
      triggerToast("ลบรายการบันทึกเรียบร้อยค่ะ");
      setTxFormOpen(false);
    } catch (e) {
      console.error(e);
      triggerToast("ไม่สามารถลบรายการได้");
    }
  };

  const handleQuickToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const updated = { ...tx, favorite: !tx.favorite };
    try {
      const docRef = doc(db, "users", user.uid, "transactions", id);
      await setDoc(docRef, cleanUndefined(updated));

      setTransactions(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // Account Balance calculation
  const accountBalance = (accId: string): number => {
    const acc = accounts.find(a => a.id === accId);
    let bal = acc ? acc.initialBalance : 0;
    transactions.forEach(t => {
      if (t.kind === "income" && t.accountId === accId) bal += Number(t.amount);
      if (t.kind === "expense" && t.accountId === accId) bal -= Number(t.amount);
      if (t.kind === "transfer") {
        if (t.fromAccountId === accId) bal -= Number(t.amount);
        if (t.toAccountId === accId) bal += Number(t.amount);
      }
    });
    return bal;
  };

  const allAccountsTotal = accounts.reduce((sum, a) => sum + accountBalance(a.id), 0);

  // Account Form Handlers
  const handleSaveAccount = async (name: string, groupId: string, initialBalance: number, icon: string) => {
    const aid = editingAccountId || `a_${Date.now()}`;
    const newAcc: Account = { id: aid, name, groupId, initialBalance, icon };

    let nextAccountsList: Account[] = [];
    if (editingAccountId) {
      nextAccountsList = accounts.map(a => (a.id === editingAccountId ? newAcc : a));
    } else {
      nextAccountsList = [...accounts, newAcc];
    }

    setAccounts(nextAccountsList);
    setAccountFormOpen(false);
    triggerToast("บันทึกข้อมูลบัญชีแล้วค่ะ 💛");

    await saveUserMetadata({ accounts: nextAccountsList });
  };

  const handleDeleteAccount = async (id: string) => {
    if (accounts.length <= 1) {
      triggerToast("ต้องมีอย่างน้อย 1 บัญชีนะคะ");
      return;
    }
    const confirmed = await askConfirmation(
      "ลบบัญชีนี้ใช่ไหมคะ? รายการบันทึกที่เคยผูกกับบัญชีนี้จะยังไม่หายไป แต่ยอดเงินรวมจะคำนวณใหม่"
    );
    if (!confirmed) return;

    const nextList = accounts.filter(a => a.id !== id);
    setAccounts(nextList);
    setAccountFormOpen(false);
    triggerToast("ลบบัญชีเรียบร้อยค่ะ");

    await saveUserMetadata({ accounts: nextList });
  };

  // Save Account Group
  const handleSaveGroup = async (name: string) => {
    const nextGroupList = [...accountGroups, { id: `g_${Date.now()}`, name }];
    setAccountGroups(nextGroupList);
    setGroupFormOpen(false);
    triggerToast("เพิ่มกลุ่มบัญชีแล้วค่ะ 💛");

    await saveUserMetadata({ accountGroups: nextGroupList });
  };

  // Category Actions
  const handleAddCategory = async (kind: "income" | "expense", nature: string, name: string) => {
    const updated = { ...categories };
    if (!updated[kind][nature]) {
      updated[kind][nature] = [];
    }
    updated[kind][nature].push(name);
    setCategories(updated);
    triggerToast("เพิ่มหมวดหมู่เรียบร้อยค่ะ 🏷️");

    await saveUserMetadata({ categories: updated });
  };

  const handleRemoveCategory = async (kind: "income" | "expense", nature: string, index: number) => {
    const updated = { ...categories };
    updated[kind][nature].splice(index, 1);
    setCategories(updated);

    await saveUserMetadata({ categories: updated });
  };

  // Icon picking selection logic
  const handleOpenIconPicker = (target: any) => {
    setIconPickerTarget(target);
    setIconPickerOpen(true);
  };

  const handlePickIcon = async (icon: string) => {
    if (iconPickerTarget === "account") {
      setSelectedAccountIcon(icon);
    } else if (iconPickerTarget?.type === "category") {
      const { name } = iconPickerTarget;
      const updated = { ...categoryIcons, [name]: icon };
      setCategoryIcons(updated);
      triggerToast("อัปเดตไอคอนหมวดหมู่แล้วค่ะ 🏷️");

      await saveUserMetadata({ categoryIcons: updated });
    }
    setIconPickerOpen(false);
  };

  const handleUploadCustomIcons = async (files: FileList) => {
    let addedCount = 0;
    const list = [...customIcons];

    const resizeImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = (e: any) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const s = Math.min(1, 120 / img.width);
            canvas.width = img.width * s;
            canvas.height = img.height * s;
            canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png", 0.85));
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    };

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith("image/")) continue;
      try {
        const thumbUrl = await resizeImage(files[i]);
        list.push(thumbUrl);
        addedCount++;
      } catch (err) {
        console.error(err);
      }
    }

    if (addedCount > 0) {
      // Clear base64 stickers if metadata size starts going above limits
      if (JSON.stringify(list).length > 800000) {
        triggerToast("สติ๊กเกอร์รวมมีขนาดใหญ่เกินระบบคลาวด์รับไหว ขออภัยนะคะ");
        return;
      }
      setCustomIcons(list);
      triggerToast(`อัปโหลดรูปภาพสติกเกอร์ใหม่ ${addedCount} รูปสำเร็จค่ะ 🎀`);
      await saveUserMetadata({ customIcons: list });
    }
  };

  const handleDeleteCustomIcon = async (idx: number) => {
    const confirmed = await askConfirmation("ลบรูปสติกเกอร์นี้ออกใช่ไหมคะ?");
    if (!confirmed) return;

    const nextList = customIcons.filter((_, i) => i !== idx);
    setCustomIcons(nextList);
    triggerToast("ลบรูปภาพสติกเกอร์เรียบร้อยค่ะ");

    await saveUserMetadata({ customIcons: nextList });
  };

  // Re-themes setting
  const handleThemePick = async (themeKey: string) => {
    const nextSettings = { ...settings, theme: themeKey };
    setSettings(nextSettings);
    applyThemeStyles(themeKey);

    await saveUserMetadata({ settings: nextSettings });
  };

  // Set Budget setting
  const handleSetBudget = async (type: "day" | "week" | "month", val: number) => {
    const nextSettings = { ...settings };
    if (type === "day") nextSettings.budgetDay = val;
    else if (type === "week") nextSettings.budgetWeek = val;
    else nextSettings.budget = val;

    setSettings(nextSettings);
    triggerToast("อัปเดตแผนงบประมาณเรียบร้อยค่ะ");

    await saveUserMetadata({ settings: nextSettings });
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      triggerToast("ยังไม่มีรายการบันทึกที่จะสรุปรายงานค่ะ");
      return;
    }

    const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      "วันที่",
      "ประเภท",
      "จากบัญชี/บัญชี",
      "ไปบัญชี",
      "หมวดหมู่",
      "ลักษณะ",
      "จำนวนเงิน",
      "หมายเหตุ",
      "เลขที่อ้างอิง",
      "แนบรูปภาพ",
      "โปรด"
    ];

    const rows = [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        const kindLabel = t.kind === "income" ? "รายรับ" : t.kind === "expense" ? "รายจ่าย" : "โอนเงิน";
        const accFrom =
          t.kind === "transfer"
            ? accounts.find(a => a.id === t.fromAccountId)?.name
            : accounts.find(a => a.id === t.accountId)?.name;
        const accTo = t.kind === "transfer" ? accounts.find(a => a.id === t.toAccountId)?.name : "";
        const natureLabel = t.nature
          ? t.nature === "regular"
            ? "ประจำ"
            : t.nature === "irregular"
            ? "ไม่ประจำ"
            : "อื่นๆ"
          : "";

        return [
          t.date,
          kindLabel,
          accFrom || "",
          accTo || "",
          t.category || "",
          natureLabel,
          t.amount.toString(),
          t.note || "",
          t.ref || "",
          t.photo ? "มีรูปภาพ" : "-",
          t.favorite ? "★" : "-"
        ]
          .map(csvEscape)
          .join(",");
      });

    const csvContent = "\uFEFF" + header.map(csvEscape).join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `รายงานรายรับรายจ่าย_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    triggerToast("ดาวน์โหลดรายงาน CSV เรียบร้อยแล้วค่ะ 📤");
  };

  // Save / Load JSON backups
  const handleExportBackup = () => {
    const backupData = {
      accountGroups,
      accounts,
      categories,
      categoryIcons,
      customIcons,
      settings,
      transactions,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `สำรองข้อมูล_รายรับรายจ่าย_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    triggerToast("ดาวน์โหลดไฟล์สำรองข้อมูล JSON แล้วค่ะ 🗂️");
  };

  const handleImportBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.accounts || !data.transactions) {
          triggerToast("ไฟล์สำรองข้อมูลไม่ถูกต้อง");
          return;
        }

        const confirmed = await askConfirmation(
          "การนำเข้าไฟล์สำรองข้อมูล จะเขียนทับข้อมูลบัญชีและรายการทั้งหมดที่คุณมีในปัจจุบัน ยืนยันใช่หรือไม่?"
        );
        if (!confirmed) return;

        setAppLoading(true);

        const nextGroups = data.accountGroups || accountGroups;
        const nextAccs = data.accounts || accounts;
        const nextCats = data.categories || categories;
        const nextCatIcons = data.categoryIcons || categoryIcons;
        const nextCustomIcons = data.customIcons || customIcons;
        const nextSets = data.settings || settings;
        const nextTxList = data.transactions || [];

        setAccountGroups(nextGroups);
        setAccounts(nextAccs);
        setCategories(nextCats);
        setCategoryIcons(nextCatIcons);
        setCustomIcons(nextCustomIcons);
        setSettings(nextSets);
        setTransactions(nextTxList);

        // Upload Meta on Firestore
        await saveUserMetadata({
          accountGroups: nextGroups,
          accounts: nextAccs,
          categories: nextCats,
          categoryIcons: nextCatIcons,
          customIcons: nextCustomIcons,
          settings: nextSets
        });

        // Write transactions inside subcollection (remove all old ones first)
        if (user) {
          const oldTxSnap = await getDocs(collection(db, "users", user.uid, "transactions"));
          for (const dSnap of oldTxSnap.docs) {
            await deleteDoc(dSnap.ref);
          }

          // Upload new items
          for (const tx of nextTxList) {
            const docRef = doc(db, "users", user.uid, "transactions", tx.id);
            // Protect payload limits (if custom base64 slips are exceptionally huge)
            const backupPayload = { ...tx };
            if (JSON.stringify(backupPayload).length > 900000) {
              backupPayload.photo = null;
            }
            await setDoc(docRef, cleanUndefined(backupPayload));
          }
        }

        triggerToast("นำเข้าข้อมูลเสร็จสิ้นแล้วค่ะ 🌸");
        setDrawerOpen(false);
        setActiveTab("dashboard");
      } catch (err) {
        console.error(err);
        triggerToast("ไฟล์มีรูปแบบไม่ถูกต้อง ไม่สามารถนำเข้าได้");
      } finally {
        setAppLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    const confirmed = await askConfirmation("ต้องการออกจากระบบแอปพลิเคชันใช่ไหมคะ?");
    if (confirmed) {
      await signOut(auth);
    }
  };

  const handleGoToAccountHistory = (aid: string) => {
    setHistoryAccountFilter(aid);
    setActiveTab("history");
  };

  // Render Loader
  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-[var(--cream)] z-50 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">🌸</div>
        <div className="text-xs text-[var(--muted)] tracking-wider">กำลังโหลดข้อมูลของคุณจาก Cloud...</div>
      </div>
    );
  }

  // Render Login
  if (!user) {
    return <Login onLoading={setAppLoading} />;
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-[var(--cream)] relative pb-24 shadow-2xl flex flex-col justify-start">
      {/* App Tab Sections */}
      {activeTab === "dashboard" && (
        <Dashboard
          transactions={transactions}
          accounts={accounts}
          monthOffset={monthOffset}
          onChangeMonth={setMonthOffset}
          settings={settings}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenAddForm={() => {
            setEditingTxId(null);
            setTxFormOpen(true);
          }}
          onOpenEditForm={id => {
            setEditingTxId(id);
            setTxFormOpen(true);
          }}
          onQuickToggleFavorite={handleQuickToggleFavorite}
          getCategoryIcon={getCategoryIcon}
          allAccountsTotal={allAccountsTotal}
        />
      )}

      {activeTab === "accounts" && (
        <Accounts
          accounts={accounts}
          accountGroups={accountGroups}
          allAccountsTotal={allAccountsTotal}
          onOpenAccountForm={id => {
            setEditingAccountId(id || null);
            setAccountFormOpen(true);
          }}
          onOpenGroupForm={() => setGroupFormOpen(true)}
          onGoToAccountHistory={handleGoToAccountHistory}
          accountBalance={accountBalance}
        />
      )}

      {activeTab === "history" && (
        <History
          transactions={transactions}
          accounts={accounts}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
          historyAccountFilter={historyAccountFilter}
          setHistoryAccountFilter={setHistoryAccountFilter}
          historySearch={historySearch === "all" ? "" : historySearch}
          setHistorySearch={setHistorySearch}
          onOpenEditForm={id => {
            setEditingTxId(id);
            setTxFormOpen(true);
          }}
          onQuickToggleFavorite={handleQuickToggleFavorite}
          getCategoryIcon={getCategoryIcon}
        />
      )}

      {activeTab === "analysis" && (
        <Analysis
          transactions={transactions}
          accounts={accounts}
          analysisPeriod={analysisPeriod}
          setAnalysisPeriod={setAnalysisPeriod}
          getCategoryIcon={getCategoryIcon}
        />
      )}

      {/* Floating Action Button (FAB) & Bottom Navigation Tab Bar */}
      <button
        onClick={() => {
          setEditingTxId(null);
          setTxFormOpen(true);
        }}
        className="fixed bottom-16 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[var(--lavender-dark)] text-white border-none text-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 cursor-pointer"
      >
        +
      </button>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--card)] flex justify-between py-2 px-1 shadow-md border-t border-[var(--line)]/30 z-30 select-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-1 flex flex-col items-center gap-1 border-none bg-transparent font-medium text-[10px] cursor-pointer focus:outline-none transition-colors ${
            activeTab === "dashboard" ? "text-[var(--lavender-dark)]" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-lg">🏠</span>
          หน้าหลัก
        </button>

        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 py-1 flex flex-col items-center gap-1 border-none bg-transparent font-medium text-[10px] cursor-pointer focus:outline-none transition-colors ${
            activeTab === "accounts" ? "text-[var(--lavender-dark)]" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-lg">👛</span>
          บัญชี
        </button>

        <div className="w-14 flex-shrink-0" />

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1 flex flex-col items-center gap-1 border-none bg-transparent font-medium text-[10px] cursor-pointer focus:outline-none transition-colors ${
            activeTab === "history" ? "text-[var(--lavender-dark)]" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-lg">📋</span>
          รายการ
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex-1 py-1 flex flex-col items-center gap-1 border-none bg-transparent font-medium text-[10px] cursor-pointer focus:outline-none transition-colors ${
            activeTab === "analysis" ? "text-[var(--lavender-dark)]" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-lg">📊</span>
          วิเคราะห์
        </button>
      </nav>

      {/* OVERLAY & MODALS */}

      {/* Slide-out settings */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        onThemePick={handleThemePick}
        onSetBudget={handleSetBudget}
        accounts={accounts}
        accountBalance={accountBalance}
        onExportCSV={handleExportCSV}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onLogout={handleLogout}
        onOpenCategoryManager={() => setCategoryManagerOpen(true)}
      />

      {/* Add / Edit transaction */}
      <TransactionForm
        isOpen={txFormOpen}
        onClose={() => setTxFormOpen(false)}
        editingId={editingTxId}
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        getCategoryIcon={getCategoryIcon}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        showToast={triggerToast}
        onOpenIconPicker={handleOpenIconPicker}
      />

      {/* Add / Edit account */}
      <AccountForm
        isOpen={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        editingId={editingAccountId}
        accounts={accounts}
        accountGroups={accountGroups}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
        onOpenIconPicker={handleOpenIconPicker}
        selectedIcon={selectedAccountIcon}
        setSelectedIcon={setSelectedAccountIcon}
        showToast={triggerToast}
      />

      {/* Add Group */}
      <GroupForm
        isOpen={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        onSave={handleSaveGroup}
        showToast={triggerToast}
      />

      {/* Manage categories */}
      <CategoryManager
        isOpen={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
        getCategoryIcon={getCategoryIcon}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        onOpenIconPicker={handleOpenIconPicker}
      />

      {/* Icon Sticker picker popup */}
      <IconPicker
        isOpen={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        customIcons={customIcons}
        onUploadCustomIcons={handleUploadCustomIcons}
        onDeleteCustomIcon={handleDeleteCustomIcon}
        onPickIcon={handlePickIcon}
        showToast={triggerToast}
      />

      {/* Toast HUD */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[var(--ink)] text-white text-xs font-semibold rounded-full shadow-md z-[200] max-w-[85%] text-center animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center p-6 max-w-[480px] mx-auto">
          <div className="bg-[var(--card)] rounded-2xl p-6 w-full max-w-sm border border-[var(--line)] shadow-xl">
            <p className="text-sm font-medium text-[var(--ink)] leading-relaxed mb-6">
              {confirmModalText}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => confirmResolver?.(false)}
                className="flex-1 py-3 border border-[var(--line)] rounded-xl font-semibold text-xs text-[var(--ink)] hover:bg-[var(--line)]/10 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => confirmResolver?.(true)}
                className="flex-1 py-3 bg-[var(--blush-dark)] hover:opacity-90 rounded-xl font-semibold text-xs text-white cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
