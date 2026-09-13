import React, { useState } from "react";
import { signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { LogIn, Sparkles, UserCheck } from "lucide-react";

interface LoginProps {
  onLoading: (isLoading: boolean) => void;
}

export default function Login({ onLoading }: LoginProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    onLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้งค่ะ");
      onLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    onLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถใช้งานแบบทดลองได้ กรุณาลองใหม่อีกครั้งค่ะ");
      onLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--cream)]" id="login-screen">
      <div className="w-full max-w-[420px] bg-[var(--card)] rounded-2xl p-8 shadow-md text-center border border-[var(--line)]">
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="text-2xl font-semibold mb-2 text-[var(--ink)]">บันทึกรายรับรายจ่าย</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          ตัวช่วยบันทึกการเงินส่วนตัวสำหรับมือถือ สแกนสลิปด้วย AI และจัดการงบประมาณแบบเรียลไทม์
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-left">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 bg-[var(--ink)] text-white font-medium rounded-xl flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-98 transition-transform cursor-pointer"
          >
            <LogIn size={18} />
            เข้าสู่ระบบด้วย Google
          </button>

          <button
            onClick={handleAnonymousLogin}
            className="w-full py-3.5 px-4 bg-transparent border border-[var(--line)] text-[var(--ink)] font-medium rounded-xl flex items-center justify-center gap-2.5 hover:bg-white/50 active:scale-98 transition-transform cursor-pointer"
          >
            <UserCheck size={18} />
            ทดลองใช้งาน (ไม่ต้องเข้าสู่ระบบ)
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]">
          <Sparkles size={14} className="text-[var(--lavender-dark)]" />
          <span>ข้อมูลปลอดภัย บันทึกและสำรองบนระบบ Cloud โดยตรง</span>
        </div>
      </div>
    </div>
  );
}
