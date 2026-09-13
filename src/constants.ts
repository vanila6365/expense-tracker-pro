import { CategoryStructure, AppSettings } from "./types";

export const NATURE_LABEL: Record<string, string> = {
  regular: "ประจำ",
  irregular: "ไม่ประจำ",
  other: "อื่นๆ",
  fixed: "คงที่",
  variable: "แปรผัน"
};

export const DEFAULT_CATS: CategoryStructure = {
  income: {
    regular: ["เงินเดือน/ค่าจ้างประจำ", "ค่าเช่าที่ได้รับประจำ"],
    irregular: ["โบนัส", "ค่าขายสินค้า", "ล็อตเตอรี่/เงินรางวัล"],
    other: ["ดอกเบี้ยธนาคาร", "เงินคืนจากการลงทุน"]
  },
  expense: {
    fixed: ["ค่าเช่าบ้าน", "ค่าผ่อนสินค้า", "ค่าประกัน", "ค่าอินเทอร์เน็ต"],
    variable: ["ค่าอาหาร", "ค่าเดินทาง", "ค่าไฟฟ้า-น้ำ", "ของใช้ในบ้าน"],
    irregular: ["ค่ารักษาพยาบาล", "ของขวัญ", "ค่าซ่อมแซมบ้าน-รถ"],
    other: ["เงินบริจาค", "ค่าปรับ"]
  }
};

export const CATEGORY_RULES = [
  { kw: ["เงินเดือน", "ค่าจ้างประจำ"], kind: "income" as const, nature: "regular", category: "เงินเดือน/ค่าจ้างประจำ" },
  { kw: ["ค่าเช่าที่ได้รับ", "ค่าเช่าห้องที่ปล่อย"], kind: "income" as const, nature: "regular", category: "ค่าเช่าที่ได้รับประจำ" },
  { kw: ["โบนัส"], kind: "income" as const, nature: "irregular", category: "โบนัส" },
  { kw: ["ขายสินค้า", "ขายของ"], kind: "income" as const, nature: "irregular", category: "ค่าขายสินค้า" },
  { kw: ["หวย", "ลอตเตอรี่", "ล็อตเตอรี่", "ถูกรางวัล"], kind: "income" as const, nature: "irregular", category: "ล็อตเตอรี่/เงินรางวัล" },
  { kw: ["ดอกเบี้ย"], kind: "income" as const, nature: "other", category: "ดอกเบี้ยธนาคาร" },
  { kw: ["เงินคืน", "ปันผล"], kind: "income" as const, nature: "other", category: "เงินคืนจากการลงทุน" },
  { kw: ["ค่าเช่าบ้าน", "ค่าเช่าคอนโด", "ค่าเช่าห้อง"], kind: "expense" as const, nature: "fixed", category: "ค่าเช่าบ้าน" },
  { kw: ["ผ่อนรถ", "ผ่อนบ้าน", "ผ่อนของ", "ผ่อนสินค้า"], kind: "expense" as const, nature: "fixed", category: "ค่าผ่อนสินค้า" },
  { kw: ["ประกันชีวิต", "ประกันรถ", "ค่าประกัน"], kind: "expense" as const, nature: "fixed", category: "ค่าประกัน" },
  { kw: ["เน็ต", "อินเทอร์เน็ต", "ไวไฟ", "wifi"], kind: "expense" as const, nature: "fixed", category: "ค่าอินเทอร์เน็ต" },
  { kw: ["ข้าว", "อาหาร", "กับข้าว", "ก๋วยเตี๋ยว", "กาแฟ"], kind: "expense" as const, nature: "variable", category: "ค่าอาหาร" },
  { kw: ["น้ำมัน", "แท็กซี่", "วินมอไซค์", "รถเมล์", "bts", "mrt", "แกร็บ", "grab"], kind: "expense" as const, nature: "variable", category: "ค่าเดินทาง" },
  { kw: ["ค่าไฟ", "ค่าน้ำ"], kind: "expense" as const, nature: "variable", category: "ค่าไฟฟ้า-น้ำ" },
  { kw: ["ของใช้", "ผงซักฟอก", "สบู่", "ทิชชู่"], kind: "expense" as const, nature: "variable", category: "ของใช้ในบ้าน" },
  { kw: ["หมอ", "โรงพยาบาล", "ค่ายา", "รักษา"], kind: "expense" as const, nature: "irregular", category: "ค่ารักษาพยาบาล" },
  { kw: ["ของขวัญ"], kind: "expense" as const, nature: "irregular", category: "ของขวัญ" },
  { kw: ["ซ่อมรถ", "ซ่อมบ้าน", "ค่าซ่อม"], kind: "expense" as const, nature: "irregular", category: "ค่าซ่อมแซมบ้าน-รถ" },
  { kw: ["บริจาค"], kind: "expense" as const, nature: "other", category: "เงินบริจาค" },
  { kw: ["ค่าปรับ"], kind: "expense" as const, nature: "other", category: "ค่าปรับ" }
];

export const MONTH_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const ICON_PRESETS = [
  "💵", "👛", "🏦", "💳", "🐷", "🧧", "💰", "🎀", "🌸", "⭐",
  "🍀", "🐣", "🧸", "🎈", "🍬", "🦄", "🌈", "☁️", "🍑", "🐻"
];

export interface ThemeConfig {
  name: string;
  swatch: string;
  cream: string;
  card: string;
  sage: string;
  sageDark: string;
  sageBg: string;
  blush: string;
  blushDark: string;
  blushBg: string;
  lavender: string;
  lavenderDark: string;
  lavenderBg: string;
  ink: string;
  muted: string;
  line: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  pastel: {
    name: "พาสเทล",
    swatch: "linear-gradient(135deg, #F1BFCB, #C7BEE0)",
    cream: "#FBF6EF",
    card: "#FFFFFF",
    sage: "#AACDBA",
    sageDark: "#6FA085",
    sageBg: "#E7F2EA",
    blush: "#F1BFCB",
    blushDark: "#DE7E93",
    blushBg: "#FBEAEE",
    lavender: "#C7BEE0",
    lavenderDark: "#8F7FC2",
    lavenderBg: "#EFEBF8",
    ink: "#4A4139",
    muted: "#A69C92",
    line: "#EFE4D7"
  },
  dark: {
    name: "ดำ",
    swatch: "linear-gradient(135deg, #2B2B2E, #111113)",
    cream: "#17171A",
    card: "#232326",
    sage: "#6FA085",
    sageDark: "#8FD1AC",
    sageBg: "#1E2C25",
    blush: "#DE7E93",
    blushDark: "#F2A9BA",
    blushBg: "#2E2024",
    lavender: "#8F7FC2",
    lavenderDark: "#B6A6E8",
    lavenderBg: "#26223A",
    ink: "#EDE9E3",
    muted: "#8A857E",
    line: "#333336"
  },
  gray: {
    name: "เทา",
    swatch: "linear-gradient(135deg, #B9B9B9, #E8E8E8)",
    cream: "#F1F1EF",
    card: "#FFFFFF",
    sage: "#A9B8AE",
    sageDark: "#6E8375",
    sageBg: "#E7ECE8",
    blush: "#C9AEB2",
    blushDark: "#93676D",
    blushBg: "#F0E6E7",
    lavender: "#B5B3C0",
    lavenderDark: "#736F87",
    lavenderBg: "#E9E8ED",
    ink: "#3D3D3B",
    muted: "#9A9995",
    line: "#E2E1DD"
  },
  green: {
    name: "เขียว",
    swatch: "linear-gradient(135deg, #9FD8B0, #5FA476)",
    cream: "#F2FAF4",
    card: "#FFFFFF",
    sage: "#7FC498",
    sageDark: "#3F8B5C",
    sageBg: "#DFF3E5",
    blush: "#F0C7A6",
    blushDark: "#CC8A4B",
    blushBg: "#FBEEE0",
    lavender: "#9FCBB0",
    lavenderDark: "#4E8E68",
    lavenderBg: "#E1F1E7",
    ink: "#284130",
    muted: "#87A190",
    line: "#DAEFE1"
  },
  pink: {
    name: "ชมพู",
    swatch: "linear-gradient(135deg, #F7C6D9, #EF93B4)",
    cream: "#FFF3F7",
    card: "#FFFFFF",
    sage: "#B7D9C6",
    sageDark: "#6FA085",
    sageBg: "#E7F2EA",
    blush: "#F193B4",
    blushDark: "#D6588A",
    blushBg: "#FCE1EA",
    lavender: "#EBAECF",
    lavenderDark: "#C15D96",
    lavenderBg: "#FBE7F1",
    ink: "#4A2A38",
    muted: "#B08A9A",
    line: "#F6DCE6"
  },
  blue: {
    name: "ฟ้า",
    swatch: "linear-gradient(135deg, #A9D6F5, #5FA8E0)",
    cream: "#F0F8FE",
    card: "#FFFFFF",
    sage: "#A6D8C9",
    sageDark: "#4E9A82",
    sageBg: "#E1F3ED",
    blush: "#F0B7A6",
    blushDark: "#D67750",
    blushBg: "#FBE7DF",
    lavender: "#8FC1EE",
    lavenderDark: "#3E7FBF",
    lavenderBg: "#DFEFFC",
    ink: "#20344A",
    muted: "#89A0B5",
    line: "#D9EAF8"
  },
  purple: {
    name: "ม่วง",
    swatch: "linear-gradient(135deg, #C9AEEF, #8E5FD1)",
    cream: "#F7F1FD",
    card: "#FFFFFF",
    sage: "#B9D8C4",
    sageDark: "#5F9B77",
    sageBg: "#E5F2EA",
    blush: "#E3AED9",
    blushDark: "#AB5C9E",
    blushBg: "#F7E5F3",
    lavender: "#B48EE0",
    lavenderDark: "#6E3FAE",
    lavenderBg: "#EDE1FA",
    ink: "#372449",
    muted: "#9C8AB0",
    line: "#E9DDF8"
  }
};

export const DEFAULT_SETTINGS: AppSettings = {
  budget: 0,
  budgetDay: 0,
  budgetWeek: 0,
  actualBalance: "",
  theme: "pastel"
};
