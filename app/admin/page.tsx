"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

// Helper function format "Minggu ke-X tahun YYYY"
const getISOWeek = (dateObj: Date) => {
  const date = new Date(dateObj.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'alat' | 'users' | 'logs'>('alat');
  
  const [equipments, setEquipments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [loadingUser, setLoadingUser] = useState(false);

  const [kodeAlat, setKodeAlat] = useState('');
  const [namaAlat, setNamaAlat] = useState('');
  const [statusAlat, setStatusAlat] = useState('siap');
  const [loadingAlat, setLoadingAlat] = useState(false);

  const [filterType, setFilterType] = useState<'hari' | 'minggu' | 'bulan'>('bulan');
  const todayStr = new Date().toISOString().slice(0, 10); 
  const currentWeek = getISOWeek(new Date()); 
  const currentMonth = new Date().toISOString().slice(0, 7); 
  const [filterValue, setFilterValue] = useState(currentMonth);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- EFEK PERTAMA KALI MUAT & REAL-TIME LISTENER ---
  useEffect(() => {
    fetchData(); // Tarik data pertama kali

    // Berlangganan (Subscribe) ke perubahan Database secara Real-Time
    const realtimeChannel = supabase
      .channel('admin-realtime')
      // Jika ada perubahan di tabel Alat
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, () => {
        fetchData(); 
      })
      // Jika ada perubahan di tabel Riwayat (Catatan Teknisi)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_logs' }, () => {
        fetchData(); 
      })
      .subscribe();

    // Membersihkan memori langganan saat Admin menutup halaman
    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const fetchData = async () => {
    // 1. Tarik Data Alat
    const { data: alatData } = await supabase.from('equipments').select('*').order('created_at', { ascending: false });
    if (alatData) setEquipments(alatData);
    
    // 2. Tarik Data Teknisi
    const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (profilesData) setUsersList(profilesData);

    // 3. Tarik Data Riwayat Log
    const { data: logData } = await supabase.from('equipment_logs').select('*, equipments(kode_alat, nama_alat)').order('created_at', { ascending: false });
    if (logData) setLogsList(logData);
    
    setIsLoadingData(false);
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'hari' | 'minggu' | 'bulan';
    setFilterType(type);
    if (type === 'hari') setFilterValue(todayStr);
    if (type === 'minggu') setFilterValue(currentWeek);
    if (type === 'bulan') setFilterValue(currentMonth);
  };

  const displayedLogs = logsList.filter(log => {
    if (!filterValue) return true;
    if (filterType === 'hari' || filterType === 'bulan') return log.created_at.startsWith(filterValue);
    if (filterType === 'minggu') return getISOWeek(new Date(log.created_at)) === filterValue;
    return true;
  });

  const handleDownloadCSV = () => {
    if (displayedLogs.length === 0) return showToast("Tidak ada riwayat laporan di periode ini.", "error");
    const headers = ["Waktu Catatan", "Kode Alat", "Nama Alat", "Status", "Catatan Teknisi"];
    const csvRows = displayedLogs.map(log => {
      const waktu = new Date(log.created_at).toLocaleString('id-ID');
      const kode = log.equipments?.kode_alat || 'Dihapus';
      const nama = log.equipments?.nama_alat || '-';
      const status = log.status_baru === 'maintenance' ? 'MAINTENANCE' : log.status_baru === 'tidak_siap' ? 'BREAK DOWN' : 'SIAP OPERASI';
      const catatanAman = log.catatan.replace(/"/g, '""').replace(/\n/g, ' '); 
      return `"${waktu}","${kode}","${nama}","${status}","${catatanAman}"`;
    });
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Alat_${filterType}_${filterValue}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast(`Laporan ${filterType} berhasil diunduh!`, "success");
  };

  const handleTambahAlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAlat(true);
    const { error } = await supabase.from('equipments').insert([{ kode_alat: kodeAlat, nama_alat: namaAlat, status_terkini: statusAlat }]);
    if (error) showToast("Gagal menambah alat: " + error.message, "error");
    else { showToast("Alat berhasil ditambahkan!", "success"); setKodeAlat(''); setNamaAlat(''); setStatusAlat('siap'); }
    setLoadingAlat(false);
  };

  const handleHapusAlat = async (id: string, kode: string) => {
    if (!confirm(`Hapus data alat ${kode}?`)) return;
    const { error } = await supabase.from('equipments').delete().eq('id', id);
    if (error) showToast("Gagal menghapus alat.", "error");
    else showToast(`Alat ${kode} dihapus.`, "success");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUser(true);
    const dummyEmail = `${username.replace(/\s+/g, '').toLowerCase()}@teknisi.lokal`;
    const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: dummyEmail, password, nama_lengkap: nama }) });
    if (response.ok) { showToast('Akun teknisi dibuat!', "success"); setUsername(''); setPassword(''); setNama(''); fetchData(); } 
    else showToast('Gagal: ' + (await response.json()).error, "error");
    setLoadingUser(false);
  };

  const handleUpdatePassword = async (uid: string, namaLengkap: string) => {
    const newPassword = prompt(`Masukkan sandi baru (min 6 karakter) untuk akun ${namaLengkap}:`);
    if (!newPassword || newPassword.length < 6) return showToast("Batal: Sandi kurang dari 6 karakter.", "error");
    const response = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, newPassword }) });
    if (response.ok) showToast(`Sandi akun ${namaLengkap} berhasil diubah!`, "success"); else showToast('Gagal mengubah sandi.', "error");
  };

  const handleDeleteUser = async (uid: string, namaLengkap: string) => {
    if (!confirm(`Yakin ingin MENGHAPUS akun ${namaLengkap}?`)) return;
    const response = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }) });
    if (response.ok) { showToast(`Akun ${namaLengkap} dihapus.`, "success"); fetchData(); } else showToast('Gagal menghapus akun.', "error");
  };

  const teknisiList = usersList.filter(u => u.role === 'user');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full relative min-h-screen flex flex-col">
      
      {/* KONTEN UTAMA */}
      <div className="flex-1">
        {toast && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-50 px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 font-semibold transition-all duration-300 animate-bounce ${
            toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span> {toast.message}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Panel Administrator</h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">Kelola data alat, teknisi, dan pantau riwayat</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button onClick={handleDownloadCSV} className="w-full md:w-auto justify-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download Laporan
            </button>
            <Link href="/" className="w-full md:w-auto text-center bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium border border-red-500/20">Logout</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveTab('alat')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg md:rounded-b-none md:rounded-t-lg font-bold transition-all border-b-4 ${activeTab === 'alat' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/40 dark:bg-slate-900/60' : 'border-transparent text-slate-500 bg-white/20 dark:bg-slate-800/30'}`}>Data Alat <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{equipments.length}</span></button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg md:rounded-b-none md:rounded-t-lg font-bold transition-all border-b-4 ${activeTab === 'users' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/40 dark:bg-slate-900/60' : 'border-transparent text-slate-500 bg-white/20 dark:bg-slate-800/30'}`}>Teknisi <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{teknisiList.length}</span></button>
          <button onClick={() => setActiveTab('logs')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg md:rounded-b-none md:rounded-t-lg font-bold transition-all border-b-4 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/40 dark:bg-slate-900/60' : 'border-transparent text-slate-500 bg-white/20 dark:bg-slate-800/30'}`}>Riwayat Laporan <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{displayedLogs.length}</span></button>
        </div>

        {activeTab === 'alat' && (
          <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-xl md:rounded-tl-none md:rounded-tr-2xl p-4 md:p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Daftar Alat Operasional</h2>
            <div className="overflow-x-auto mb-8 border border-slate-200 dark:border-white/10 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-200/50 dark:bg-black/40 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-white/10 text-sm md:text-base">
                    <th className="p-3 md:p-4 font-semibold">Kode</th><th className="p-3 md:p-4 font-semibold">Nama Alat</th><th className="p-3 md:p-4 font-semibold">Status</th><th className="p-3 md:p-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm md:text-base">
                  {isLoadingData ? (<tr><td colSpan={4} className="p-8 text-center text-slate-500">Memuat...</td></tr>) : equipments.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada data.</td></tr>) : 
                  equipments.map((alat) => (
                    <tr key={alat.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 md:p-4 font-bold text-slate-900 dark:text-white">{alat.kode_alat}</td><td className="p-3 md:p-4 text-slate-700 dark:text-slate-300">{alat.nama_alat}</td>
                      <td className="p-3 md:p-4"><span className="uppercase text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300">{alat.status_terkini === 'maintenance' ? 'MAINTENANCE' : alat.status_terkini === 'tidak_siap' ? 'BREAK DOWN' : 'SIAP OPERASI'}</span></td>
                      <td className="p-3 md:p-4 text-right"><button onClick={() => handleHapusAlat(alat.id, alat.kode_alat)} className="text-red-600 dark:text-red-400 hover:underline font-semibold">Hapus</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tambah Alat Baru</h2>
            <form onSubmit={handleTambahAlat} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/40 dark:bg-black/20 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-white/5">
              <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Kode Alat</label><input type="text" required value={kodeAlat} onChange={(e) => setKodeAlat(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="RS-01" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">Nama Alat</label><input type="text" required value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Reach Stacker 45T" /></div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Status Awal</label>
                <select value={statusAlat} onChange={(e) => setStatusAlat(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="siap" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Siap Operasi</option>
                  <option value="maintenance" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Maintenance</option>
                  <option value="tidak_siap" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Break Down</option>
                </select>
              </div>
              <div className="md:col-span-4 mt-2"><button type="submit" disabled={loadingAlat} className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white ${loadingAlat ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-500 shadow-lg'}`}>{loadingAlat ? 'Menyimpan...' : '+ Tambah Alat'}</button></div>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-xl md:rounded-tl-none md:rounded-tr-2xl p-4 md:p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Daftar Teknisi (User)</h2>
            <div className="overflow-x-auto mb-8 border border-slate-200 dark:border-white/10 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead><tr className="bg-slate-200/50 dark:bg-black/40 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-white/10 text-sm md:text-base"><th className="p-3 md:p-4 font-semibold">Nama Lengkap</th><th className="p-3 md:p-4 font-semibold">Role</th><th className="p-3 md:p-4 font-semibold text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm md:text-base">
                  {isLoadingData ? (<tr><td colSpan={3} className="p-8 text-center">Memuat...</td></tr>) : teknisiList.length === 0 ? (<tr><td colSpan={3} className="p-8 text-center text-slate-500">Belum ada akun.</td></tr>) : 
                  teknisiList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 md:p-4 font-bold text-slate-900 dark:text-white">{user.nama_lengkap}</td>
                      <td className="p-3 md:p-4"><span className="uppercase text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">{user.role}</span></td>
                      <td className="p-3 md:p-4 text-right space-x-3"><button onClick={() => handleUpdatePassword(user.id, user.nama_lengkap)} className="text-yellow-600 dark:text-yellow-400 hover:underline font-semibold">Ubah Sandi</button><button onClick={() => handleDeleteUser(user.id, user.nama_lengkap)} className="text-red-600 dark:text-red-400 hover:underline font-semibold">Hapus Akun</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Buat Akun Teknisi Baru</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/40 dark:bg-black/20 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-white/5">
              <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Nama Lengkap</label><input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Budi Teknisi" /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Username Login</label><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="budi123" /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Password</label><input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 border border-slate-300 dark:border-white/10 outline-none dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 karakter" /></div>
              <div className="md:col-span-3 mt-2"><button type="submit" disabled={loadingUser} className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white ${loadingUser ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-500 shadow-lg'}`}>{loadingUser ? 'Memproses...' : '+ Buat Akun Teknisi'}</button></div>
            </form>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-xl md:rounded-tl-none md:rounded-tr-2xl p-4 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Riwayat Perubahan Status</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</label>
                <select value={filterType} onChange={handleFilterTypeChange} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/70 dark:bg-black/60 border border-slate-300 dark:border-white/20 outline-none dark:text-white text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500">
                  <option value="hari" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Harian</option>
                  <option value="minggu" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Mingguan</option>
                  <option value="bulan" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Bulanan</option>
                </select>
                <input type={filterType === 'hari' ? 'date' : filterType === 'minggu' ? 'week' : 'month'} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/70 dark:bg-black/60 border border-slate-300 dark:border-white/20 outline-none dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-200/50 dark:bg-black/40 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-white/10 text-sm md:text-base">
                    <th className="p-3 md:p-4 font-semibold w-1/6">Waktu</th><th className="p-3 md:p-4 font-semibold w-1/5">Alat</th><th className="p-3 md:p-4 font-semibold w-1/5">Status Baru</th><th className="p-3 md:p-4 font-semibold">Catatan Teknisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm md:text-base">
                  {isLoadingData ? (<tr><td colSpan={4} className="p-8 text-center">Memuat...</td></tr>) : 
                  displayedLogs.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada laporan di periode ini.</td></tr>) : 
                  displayedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 md:p-4 text-slate-600 dark:text-slate-400 text-xs md:text-sm">{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="p-3 md:p-4"><div className="font-bold text-slate-900 dark:text-white">{log.equipments?.kode_alat || 'Alat Dihapus'}</div><div className="text-xs text-slate-500">{log.equipments?.nama_alat}</div></td>
                      <td className="p-3 md:p-4"><span className="uppercase text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300">{log.status_baru === 'maintenance' ? 'MAINTENANCE' : log.status_baru === 'tidak_siap' ? 'BREAK DOWN' : 'SIAP OPERASI'}</span></td>
                      <td className="p-3 md:p-4 italic text-slate-800 dark:text-slate-200">"{log.catatan}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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