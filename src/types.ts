export interface Transaction {
  id: string;
  kind: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  time?: string;
  note?: string;
  ref?: string;
  category?: string;
  nature?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  photo?: string | null;
  favorite?: boolean;
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
  groupId: string;
  initialBalance: number;
}

export interface AccountGroup {
  id: string;
  name: string;
}

export interface CategoryStructure {
  income: {
    regular: string[];
    irregular: string[];
    other: string[];
  };
  expense: {
    fixed: string[];
    variable: string[];
    irregular: string[];
    other: string[];
  };
}

export interface AppSettings {
  budget: number;
  budgetDay: number;
  budgetWeek: number;
  actualBalance: string;
  theme: string;
}

export interface UserData {
  accountGroups: AccountGroup[];
  accounts: Account[];
  categories: CategoryStructure;
  categoryIcons: Record<string, string>;
  customIcons: string[];
  settings: AppSettings;
}
