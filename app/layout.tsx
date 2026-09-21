import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Kesiapan Alat | TPK Bitung",
  description: "Monitoring Kesiapan Alat Terminal Petikemas Bitung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Secara default kita set class="dark"
    <html lang="id" className="dark">
      <body className="relative min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {/* Gambar Latar Belakang (Tetap sama) */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg-container.jpg')" }}
        ></div>
        
        {/* Overlay yang bisa berubah (Terang/Gelap) */}
        <div className="fixed inset-0 z-[-1] bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300"></div>

        {/* Konten Utama */}
        <main className="relative z-10 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}