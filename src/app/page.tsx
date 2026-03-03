'use client';

import { useEffect, useState } from 'react';
import {
  Camera,
  Truck,
  Clock,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  MonitorPlay,
  Lock,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: number;
  rol: string;
  nombre: string;
}

interface DashboardData {
  recentActivity: Array<{
    id_registro: number;
    placa: string;
    numero_anden: number;
    evento: string;
    fecha_hora_entrada: string;
  }>;
  cameras: Array<{
    id_camara: number;
    nombre_camara: string;
    ubicacion: string;
    estado: string;
  }>;
  andenes: Array<{
    id_anden: number;
    numero_anden: number;
    estado_actual: string;
    zona: string;
  }>;
  registrosHoy: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        const sessionJson = await res.json();
        if (sessionJson.user) {
          setUser(sessionJson.user);
        } else {
          router.push('/login');
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Poll every 5 seconds for live feel, although realistic implementations would use websockets
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const activeCameras = data?.cameras.filter(c => c.estado === 'activa').length || 0;
  const occupiedAndenes = data?.andenes.filter(a => a.estado_actual === 'ocupado').length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] p-1 hidden sm:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CamBus Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight font-sans">
              Sistema <span className="text-gradient">CamBus</span>
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-lg">
              Monitorización en tiempo real de andenes y vehículos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-200">{user.nombre}</p>
              <p className="text-[10px] font-mono text-blue-400 capitalize bg-blue-900/30 px-2 py-0.5 mt-1 rounded-full inline-block border border-blue-800">
                ROL: {user.rol}
              </p>
            </div>
          )}
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            title="Cerrar Sesión Segura"
            className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-red-950/60 rounded-full border border-slate-700/50 backdrop-blur-sm transition-colors text-slate-400 hover:text-red-400 hover:border-red-900/50"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Andenes Ocupados"
          value={`${occupiedAndenes} / ${data?.andenes.length || 0}`}
          icon={<Truck className="w-6 h-6 text-blue-400" />}
          trend="+2 hoy"
          color="blue"
        />
        <KPICard
          title="Cámaras Activas"
          value={`${activeCameras} / ${data?.cameras.length || 0}`}
          icon={<MonitorPlay className="w-6 h-6 text-emerald-400" />}
          trend="100% operativo"
          color="emerald"
        />
        <KPICard
          title="Registros Hoy"
          value={data?.registrosHoy?.toString() || "0"}
          icon={<Activity className="w-6 h-6 text-rose-400" />}
          trend="Flujo normal"
          color="rose"
        />
        <KPICard
          title="Seguridad"
          value={user?.rol === 'operador' ? "***" : "Óptima"}
          icon={user?.rol === 'operador' ? <Lock className="w-6 h-6 text-slate-600" /> : <ShieldCheck className="w-6 h-6 text-amber-400" />}
          trend={user?.rol === 'operador' ? "Acceso Restringido" : "0 incidentes"}
          color={user?.rol === 'operador' ? 'slate' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Andenes Status Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6 text-slate-400" />
              Estado de Andenes
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data?.andenes.map(anden => (
              <div
                key={anden.id_anden}
                className={`glass-card p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group`}
              >
                {/* Status Indicator Glow */}
                <div className={`absolute -inset-1 opacity-20 blur-xl transition-opacity group-hover:opacity-40 ${anden.estado_actual === 'ocupado' ? 'bg-rose-500' :
                  anden.estado_actual === 'libre' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>

                <span className="text-4xl font-black text-slate-300 relative z-10">
                  {anden.numero_anden}
                </span>

                <div className={`px-3 py-1 rounded-full text-xs font-semibold relative z-10 ${anden.estado_actual === 'ocupado' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  anden.estado_actual === 'libre' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                  {anden.estado_actual.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-slate-400" />
            Actividad Reciente
          </h2>

          <div className="glass-card p-1">
            <ul className="divide-y divide-slate-700/50">
              {data?.recentActivity?.map((activity) => (
                <li key={activity.id_registro} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activity.evento === 'entrada' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                        {activity.evento === 'entrada' ? <ArrowRight className="w-5 h-5 translate-y-px" /> : <ArrowRight className="w-5 h-5 -scale-x-100 translate-y-px" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{activity.placa}</p>
                        <p className="text-xs text-slate-400">Andén {activity.numero_anden}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300 capitalize">{activity.evento}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.fecha_hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <li className="p-8 text-center text-slate-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No hay actividad reciente
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}

function KPICard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-transparent border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-400',
    slate: 'from-slate-700/20 to-transparent border-slate-700/30 text-slate-500',
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-4xl font-bold tracking-tight text-slate-100">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl bg-slate-800 border ${colorMap[color]} border-opacity-50`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <span className={`text-sm font-medium ${colorMap[color].split(' ')[2]}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
