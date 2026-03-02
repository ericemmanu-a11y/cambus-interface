import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cambus - Sistema de Control',
  description: 'Panel de administración del sistema Cambus',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  let user = null;

  if (session) {
    const payload = await decrypt(session);
    if (payload?.userId) {
      user = { id: payload.userId, rol: payload.rol, nombre: payload.nombre };
    }
  }

  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen selection:bg-blue-500/30`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} />

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none bg-grid-slate-900/[0.04]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
