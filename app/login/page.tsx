"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase";

export default function Login() {
  const router = useRouter();
  const [isResetMode, setIsResetMode] = useState(false);
  
  // Ubah penamaan variabel menjadi identifier (bisa email admin, bisa username teknisi)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // Cek apakah input mengandung '@'. Jika TIDAK, berarti dia mencoba login sebagai Username Teknisi.
    let finalLoginEmail = identifier.trim();
    if (!finalLoginEmail.includes('@')) {
      finalLoginEmail = `${finalLoginEmail.replace(/\s+/g, '').toLowerCase()}@teknisi.lokal`;
    }

    if (isResetMode) {
      // PROSES LUPA PASSWORD (Hanya berlaku untuk Email Admin asli)
      if (!identifier.includes('@')) {
        setMessage({ text: "Fungsi lupa password hanya untuk Admin (Gunakan Email). Teknisi silakan hubungi Admin.", type: "error" });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(finalLoginEmail, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) setMessage({ text: "Gagal mengirim link reset.", type: "error" });
      else setMessage({ text: "Link pemulihan telah dikirim ke email Anda!", type: "success" });
    } else {
      // PROSES LOGIN BIASA
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: finalLoginEmail, 
        password 
      });
      
      if (authError) {
        setMessage({ text: "Username/Email atau Password salah!", type: "error" });
      } else if (authData.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
        if (profile?.role === "admin") router.push("/admin");
        else router.push("/user");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 w-full min-h-screen">
      <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {isResetMode ? "Lupa Password" : "Login Sistem"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">PT. Pelindo Terminal Petikemas TPK Bitung</p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 border rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username / Email</label>
            <input 
              type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Username/Email"
            />
          </div>

          {!isResetMode && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <button type="button" onClick={() => setIsResetMode(true)} className="text-sm text-blue-600 hover:underline">Lupa sandi?</button>
              </div>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all ${loading ? "bg-slate-500" : "bg-blue-600 hover:bg-blue-500"}`}>
            {loading ? "Memproses..." : (isResetMode ? "Kirim Link Reset" : "Masuk")}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {isResetMode && (
            <button onClick={() => setIsResetMode(false)} className="text-sm text-slate-600 dark:text-slate-400 hover:underline block w-full">
              Kembali ke Login
            </button>
          )}
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline block">
            &larr; Kembali ke Dashboard Publik
          </Link>
        </div>
      </div>
    </div>
  );
}