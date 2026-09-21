"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './utils/supabase';

export default function Dashboard() {
  const [isDark, setIsDark] = useState(true);
  const [equipments, setEquipments] = useState<any[]>([]);

  // Terapkan Mode Gelap/Terang
  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDark]);

  // Ambil Data dari Database
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('equipments').select('*').order('kode_alat', { ascending: true });
      if (data) setEquipments(data);
    };
    fetchData();
  }, []);

  // Hitung jumlah masing-masing status
  const totalAlat = equipments.length;
  const siapOperasi = equipments.filter(a => a.status_terkini === 'siap').length;
  const maintenance = equipments.filter(a => a.status_terkini === 'maintenance').length;
  const tidakSiap = equipments.filter(a => a.status_terkini === 'tidak_siap').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">PT. Pelindo Terminal Petikemas TPK Bitung</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg font-medium">Sistem Monitoring Kesiapan Alat Operasional</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white" title="Ganti Tema">
            {isDark ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>)}
          </button>
          <Link href="/login" className="flex-1 md:flex-none justify-center bg-white/40 dark:bg-white/10 hover:bg-white/60 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>Login</Link>
          <Link href="/login?redirect=download" className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Laporan</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-white/50 dark:bg-white/10 border border-slate-200 dark:border-white/20 backdrop-blur-md p-6 rounded-xl text-center shadow-lg"><p className="text-slate-500 dark:text-slate-300 text-xs md:text-sm font-semibold uppercase">Total Alat</p><p className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mt-2">{totalAlat}</p></div>
        <div className="bg-green-100/50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 backdrop-blur-md p-6 rounded-xl text-center shadow-lg"><p className="text-green-700 dark:text-green-400 text-xs md:text-sm font-semibold uppercase">Siap Operasi</p><p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{siapOperasi}</p></div>
        <div className="bg-yellow-100/50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 backdrop-blur-md p-6 rounded-xl text-center shadow-lg"><p className="text-yellow-700 dark:text-yellow-400 text-xs md:text-sm font-semibold uppercase">Maintenance</p><p className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{maintenance}</p></div>
        <div className="bg-red-100/50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 backdrop-blur-md p-6 rounded-xl text-center shadow-lg"><p className="text-red-700 dark:text-red-400 text-xs md:text-sm font-semibold uppercase">Break Down</p><p className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mt-2">{tidakSiap}</p></div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-200/50 dark:bg-black/40 text-slate-600 dark:text-slate-300 border-b border-slate-300 dark:border-white/10">
                <th className="p-4 md:p-5 font-semibold">Kode Alat</th><th className="p-4 md:p-5 font-semibold">Nama Alat</th><th className="p-4 md:p-5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {equipments.length === 0 ? (<tr><td colSpan={3} className="p-8 text-center text-slate-500">Belum ada data alat.</td></tr>) : 
              equipments.map((alat) => (
                <tr key={alat.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="p-4 md:p-5 font-medium text-slate-800 dark:text-white">{alat.kode_alat}</td>
                  <td className="p-4 md:p-5 text-slate-600 dark:text-slate-300">{alat.nama_alat}</td>
                  <td className="p-4 md:p-5">
                    {alat.status_terkini === 'siap' && (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 text-xs md:text-sm font-medium"><span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span> Siap</span>)}
                    {alat.status_terkini === 'maintenance' && (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30 text-xs md:text-sm font-medium"><span className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400"></span> Maintenance</span>)}
                    {alat.status_terkini === 'tidak_siap' && (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 text-xs md:text-sm font-medium"><span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span> Break Down</span>)}
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