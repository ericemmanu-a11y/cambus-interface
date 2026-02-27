'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, ShieldAlert, CheckCircle2, Clock, Trash2, Pencil } from 'lucide-react';

interface Incidencia {
    id_incidencia: number;
    id_usuario: number;
    nombre_usuario: string;
    titulo: string;
    descripcion: string;
    nivel_gravedad: string;
    estado: string;
    fecha_reporte: string;
    fecha_resolucion?: string;
}

export default function IncidenciasPage() {
    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id_incidencia: 0,
        titulo: '',
        descripcion: '',
        nivel_gravedad: 'media',
        estado: 'abierta'
    });

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            });

        fetchIncidencias();
    }, []);

    const fetchIncidencias = async () => {
        try {
            const res = await fetch('/api/incidencias');
            const json = await res.json();
            if (json.success) {
                setIncidencias(json.data);
            }
        } catch (error) {
            console.error('Error fetching incidencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ id_incidencia: 0, titulo: '', descripcion: '', nivel_gravedad: 'media', estado: 'abierta' });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (inc: Incidencia) => {
        setFormData({
            id_incidencia: inc.id_incidencia,
            titulo: inc.titulo,
            descripcion: inc.descripcion,
            nivel_gravedad: inc.nivel_gravedad,
            estado: inc.estado
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta incidencia? No quedará registro de la acción.')) return;

        try {
            const res = await fetch(`/api/incidencias?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                fetchIncidencias();
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
            const url = '/api/incidencias';
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                setShowModal(false);
                fetchIncidencias();
            } else {
                alert(json.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de red');
        }
    };

    const getGravedadStyle = (gravedad: string) => {
        switch (gravedad) {
            case 'critica': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
            case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            case 'media': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'baja': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'resuelta': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case 'en_progreso': return <Clock className="w-5 h-5 text-amber-400" />;
            default: return <AlertCircle className="w-5 h-5 text-rose-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-rose-400" />
                        Centro de <span className="text-rose-400">Incidencias</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-md">
                        Gestión, reporte y resolución de problemas logísticos e IT en patio.
                    </p>
                </div>

                {user && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-rose-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Reportar Incidencia
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incidencias.map((inc) => (
                    <div key={inc.id_incidencia} className={`glass-card p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-600/50 transition-all ${inc.estado === 'resuelta' ? 'opacity-80' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {getEstadoIcon(inc.estado)}
                                <h3 className={`font-bold text-lg leading-tight ${inc.estado === 'resuelta' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                                    {inc.titulo}
                                </h3>
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            {inc.descripcion}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-700/50">
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border tracking-wider ${getGravedadStyle(inc.nivel_gravedad)}`}>
                                {inc.nivel_gravedad}
                            </span>
                            <span className="text-xs text-slate-500">
                                {new Date(inc.fecha_reporte).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                                Reportado por: <strong className="text-blue-400">{inc.nombre_usuario}</strong>
                            </span>
                        </div>

                        {/* Actions overlay */}
                        {(user?.rol === 'admin' || user?.rol === 'supervisor') && (
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(inc)} className="p-2 text-slate-400 hover:text-blue-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-lg">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                {user?.rol === 'admin' && (
                                    <button onClick={() => handleDelete(inc.id_incidencia)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {incidencias.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 glass-card">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50 text-emerald-400" />
                        No se han reportado incidencias. El patio opera con normalidad.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-400" />
                            {isEditing ? 'Gestionar Incidencia' : 'Reportar Incidencia'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Título del Problema</label>
                                <input required type="text" placeholder="Ej. Falla en pluma andén 2" disabled={isEditing}
                                    value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-rose-500 focus:outline-none disabled:opacity-50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Descripción Detallada</label>
                                <textarea required placeholder="Describe el suceso..." rows={4} disabled={isEditing}
                                    value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-rose-500 focus:outline-none resize-none disabled:opacity-50" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nivel de Gravedad</label>
                                    <select
                                        value={formData.nivel_gravedad}
                                        onChange={e => setFormData({ ...formData, nivel_gravedad: e.target.value })}
                                        disabled={isEditing && user?.rol !== 'admin'}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-rose-500 focus:outline-none disabled:opacity-50"
                                    >
                                        <option value="baja">BAJA</option>
                                        <option value="media">MEDIA</option>
                                        <option value="alta">ALTA</option>
                                        <option value="critica">CRÍTICA</option>
                                    </select>
                                </div>

                                {isEditing && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                                        <select
                                            value={formData.estado}
                                            onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                                        >
                                            <option value="abierta">ABIERTA</option>
                                            <option value="en_progreso">EN PROGRESO</option>
                                            <option value="resuelta">RESUELTA</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-rose-500/20">
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
