import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FUNGSI MEMBUAT AKUN (Hanya untuk role 'user')
export async function POST(request: Request) {
  try {
    const { email, password, nama_lengkap } = await request.json();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { nama_lengkap, role: 'user' } // Role dipaksa hanya jadi 'user'
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Akun berhasil dibuat!', user: data.user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
  }
}

// FUNGSI MENGUBAH SANDI USER
export async function PUT(request: Request) {
  try {
    const { uid, newPassword } = await request.json();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      password: newPassword
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Sandi berhasil diubah!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
  }
}

// FUNGSI MENGHAPUS AKUN USER
export async function DELETE(request: Request) {
  try {
    const { uid } = await request.json();
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Akun berhasil dihapus!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
  }
}