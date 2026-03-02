'use client';

import { useEffect, useState } from 'react';
import { Camera, Plus, MonitorPlay, MapPin, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface Camara {
    id_camara: number;
    nombre_camara: string;
    ip_local: string;
    modelo: string;
    ubicacion: string;
    estado: string;
}

export default function CamarasPage() {
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id_camara: 0,
        nombre_camara: '',
        ip_local: '',
        ubicacion: '',
        modelo: 'DH-IPC-B1E40',
        estado: 'activa'
    });

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            });

        fetchCamaras();
    }, []);

    const fetchCamaras = async () => {
        try {
            const res = await fetch('/api/camaras');
            const json = await res.json();
            if (json.success) {
                setCamaras(json.data);
            }
        } catch (error) {
            console.error('Error fetching camaras:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ id_camara: 0, nombre_camara: '', ip_local: '', ubicacion: '', modelo: 'DH-IPC-B1E40', estado: 'activa' });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (cam: Camara) => {
        setFormData({ ...cam });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta cámara? Esto desconectará la cámara de cualquier andén y registro.')) return;

        try {
            const res = await fetch(`/api/camaras?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                fetchCamaras();
            } else {
                alert(json.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de red al eliminar');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/camaras';
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                setShowModal(false);
                fetchCamaras();
            } else {
                alert(json.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de red');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <Camera className="w-8 h-8 text-emerald-400" />
                        Directorio de <span className="text-emerald-400">Cámaras IoT</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-md">
                        Gestiona los dispositivos de reconocimiento (LPR) del patio.
                    </p>
                </div>

                {user?.rol === 'admin' && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Instalar Cámara
                    </button>
                )}
            </div>

            {/* Grid de Cámaras */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {camaras.map(cam => (
                    <div key={cam.id_camara} className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl border ${cam.estado === 'activa' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <MonitorPlay className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-100">{cam.nombre_camara}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cam.estado === 'activa' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                                        {cam.estado.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {user?.rol === 'admin' && (
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(cam)} className="p-2 text-slate-400 hover:text-blue-400 bg-slate-800/50 rounded-lg hover:bg-blue-500/10 transition-colors">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(cam.id_camara)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-lg hover:bg-red-500/10 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Search className="w-4 h-4 text-slate-500" />
                                <span className="font-mono text-blue-400">{cam.ip_local}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                {cam.ubicacion}
                            </div>
                            <div className="text-xs text-slate-500 pt-1 border-t border-slate-800">
                                Modelo: {cam.modelo}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Agregar/Editar Cámara */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-emerald-400" />
                            {isEditing ? 'Editar Cámara LPR' : 'Nueva Cámara LPR'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Identificador / Nombre</label>
                                <input required type="text" placeholder="Ej. CAM-A06"
                                    value={formData.nombre_camara} onChange={e => setFormData({ ...formData, nombre_camara: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Dirección IP Local</label>
                                <input required type="text" placeholder="192.168.1.X"
                                    value={formData.ip_local} onChange={e => setFormData({ ...formData, ip_local: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Ubicación / Zona</label>
                                <input required type="text" placeholder="Andén X - Zona Sur"
                                    value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="activa">ACTIVA</option>
                                        <option value="inactiva">INACTIVA</option>
                                        <option value="mantenimiento">MANTENIMIENTO</option>
                                    </select>
                                </div>
                            )}
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
