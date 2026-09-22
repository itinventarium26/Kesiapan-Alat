"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // Menyimpan kata sandi baru menggunakan sesi sementara dari link email
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage({ text: "Gagal memperbarui sandi: " + error.message, type: "error" });
    } else {
      setMessage({ text: "Sandi berhasil diperbarui! Mengalihkan...", type: "success" });
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    }
    
    setLoading(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center px-4 w-full min-h-screen">
      <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10 mb-16">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Buat Sandi Baru</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Silakan masukkan kata sandi baru Anda.</p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 border rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kata Sandi Baru</label>
            <input 
              type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" 
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all ${loading ? "bg-slate-500" : "bg-blue-600 hover:bg-blue-500"}`}>
            {loading ? "Menyimpan..." : "Simpan Sandi & Masuk"}
          </button>
        </form>
      </div>

      <footer className="absolute bottom-0 w-full text-center pb-6 z-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Copyright &copy; Jonathan Parera, Jonathan Ruben, Melsanda Kabalu
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Teknik Informatika - Politeknik Negeri Manado
        </p>
      </footer>
    </div>
  );
}