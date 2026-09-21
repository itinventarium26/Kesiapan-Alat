"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

export default function UserDashboard() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, { status: string; catatan: string }>>({});
  
  // Custom Pop-Up (Toast) State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('equipments').select('*').order('kode_alat', { ascending: true });
    if (data) setEquipments(data);
  };

  const handleUpdate = async (equipmentId: string, currentStatus: string) => {
    const updateData = formData[equipmentId];
    const statusBaru = updateData?.status || currentStatus;
    const catatanBaru = updateData?.catatan || '-';

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return showToast("Sesi habis, silakan login kembali.", "error");

    const { error } = await supabase.from('equipment_logs').insert({
      equipment_id: equipmentId,
      user_id: user.id,
      status_baru: statusBaru,
      catatan: catatanBaru
    });

    if (error) {
      showToast("Gagal memperbarui status: " + error.message, "error");
    } else {
      showToast("Status alat berhasil diperbarui!", "success");
      fetchData(); 
      setFormData(prev => ({ ...prev, [equipmentId]: { ...prev[equipmentId], catatan: '' } }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full relative">
      
      {/* Komponen Custom Toast / Pop-Up */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-50 px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 font-semibold transition-all duration-300 animate-bounce ${
          toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Panel Teknisi (User)</h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">Update status kesiapan alat secara berkala</p>
        </div>
        <Link href="/" className="w-full md:w-auto text-center bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-2 rounded-lg font-medium border border-red-500/20">
          Logout
        </Link>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-200/50 dark:bg-black/40 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-white/10 text-sm md:text-base">
                <th className="p-3 md:p-4 font-semibold w-1/3">Alat Operasional</th>
                <th className="p-3 md:p-4 font-semibold w-1/4">Status Baru</th>
                <th className="p-3 md:p-4 font-semibold">Catatan Tambahan</th>
                <th className="p-3 md:p-4 font-semibold w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {equipments.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada data alat.</td></tr>) : 
              equipments.map((alat) => (
                <tr key={alat.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="p-3 md:p-4">
                    <div className="font-bold text-slate-900 dark:text-white text-base md:text-lg">{alat.kode_alat}</div>
                    <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">{alat.nama_alat}</div>
                    <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 mt-1 uppercase font-bold">Saat ini: {alat.status_terkini.replace('_', ' ')}</div>
                  </td>
                  <td className="p-3 md:p-4">
                    <select 
                      defaultValue={alat.status_terkini}
                      onChange={(e) => setFormData(prev => ({ ...prev, [alat.id]: { ...prev[alat.id], status: e.target.value } }))}
                      className="w-full bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {/* Solusi untuk opsi warna list dropdown */}
                      <option value="siap" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Siap Operasi</option>
                      <option value="maintenance" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Maintenance</option>
                      <option value="tidak_siap" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Break Down</option>
                    </select>
                  </td>
                  <td className="p-3 md:p-4">
                    <input 
                      type="text" 
                      value={formData[alat.id]?.catatan || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [alat.id]: { ...prev[alat.id], catatan: e.target.value } }))}
                      className="w-full bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ketik catatan..."
                    />
                  </td>
                  <td className="p-3 md:p-4">
                    <button 
                      onClick={() => handleUpdate(alat.id, alat.status_terkini)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full transition-all shadow-md"
                    >
                      Simpan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* FOOTER HAK CIPTA */}
      <footer className="mt-12 py-6 border-t border-slate-300/30 dark:border-white/10 text-center w-full">
        <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300">
          Copyright &copy; Jonathan Parera, Jonathan Ruben, Melsanda Kabalu
        </p>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Teknik Informatika - Politeknik Negeri Manado
        </p>
      </footer>
    </div>
  );
}