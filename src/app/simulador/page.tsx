'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Truck, Activity, Database, LayoutTemplate } from 'lucide-react';

interface SimulatorTruck {
    id: string;
    anden: number;
    progress: number;
    state: 'incoming' | 'docking' | 'docked' | 'error';
    placa?: string;
    hash?: string;
}

export default function SimulatorPage() {
    const [trucks, setTrucks] = useState<SimulatorTruck[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    // Generate an array from 1 to 100 representing the industrial scale bays
    const andenes = Array.from({ length: 100 }, (_, i) => i + 1);

    const addLog = (msg: string) => {
        setLogs((prev) => [msg, ...prev].slice(0, 20));
    };

    // Heartbeat to prevent daemon collision (sends signal every 2 seconds)
    useEffect(() => {
        const pingHeartbeat = async () => {
            try {
                await fetch('/api/simulador/heartbeat', { method: 'POST' });
            } catch (e) { }
        };
        pingHeartbeat();
        const interval = setInterval(pingHeartbeat, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const spawnInterval = setInterval(() => {
            setTrucks((current) => {
                // Can only spawn if an anden is free
                const occupiedAndenes = current.map((t) => t.anden);
                const freeAndenes = andenes.filter((a) => !occupiedAndenes.includes(a));

                // Heavy Industrial Simulation: Spawn chance is very high now that there's 100 bays.
                // Spawn up to 3 trucks at once optionally
                let newTrucks = [...current];
                let loopCount = Math.floor(Math.random() * 4); // 0 to 3 trucks spawned every interval

                for (let i = 0; i < loopCount; i++) {
                    const stillFree = andenes.filter((a) => !newTrucks.map(t => t.anden).includes(a));
                    if (stillFree.length > 0) {
                        const anden = stillFree[Math.floor(Math.random() * stillFree.length)];
                        newTrucks.push({
                            id: Math.random().toString(36).substring(7),
                            anden,
                            progress: 0,
                            state: 'incoming'
                        });
                        addLog(`[RADAR] Detecta nuevo objetivo aproximándose al Andén ${anden}...`);
                    }
                }
                return newTrucks;
            });
        }, 1500); // Trigger spawn check every 1.5 seconds to build up traffic faster

        return () => clearInterval(spawnInterval);
    }, []);

    useEffect(() => {
        const moveInterval = setInterval(() => {
            setTrucks((current) => {
                return current.map(truck => {
                    if (truck.state === 'incoming') {
                        const nextProgress = truck.progress + 2; // Speed of truck
                        if (nextProgress >= 100) {
                            // When truck docks, trigger the API sync
                            setTimeout(() => handleDock(truck), 0);
                            return { ...truck, progress: 100, state: 'docking' };
                        }
                        return { ...truck, progress: nextProgress };
                    }
                    return truck;
                });
            });
        }, 100);

        return () => clearInterval(moveInterval);
    }, []);

    const handleDock = async (truck: SimulatorTruck) => {
        addLog(`[DOCK] Objetivo en Andén ${truck.anden}. Iniciando handshake con PostgreSQL...`);
        try {
            const res = await fetch('/api/simulador/ingreso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anden_id: truck.anden })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`[DB SYNC] INSERT Exitoso: Placa [${data.data.placa}] | SHA256: ${data.data.hash_imagen.substring(0, 16)}...`);
                setTrucks(curr => curr.map(t => t.id === truck.id ? { ...t, state: 'docked', placa: data.data.placa, hash: data.data.hash_imagen } : t));

                // Espera 8 segundos simulados de descarga y luego dispara el evento de Salida DB
                setTimeout(async () => {
                    try {
                        const outRes = await fetch('/api/simulador/salida', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ anden_id: truck.anden, placa: data.data.placa })
                        });
                        const outData = await outRes.json();
                        if (outData.success) {
                            addLog(`[DB SYNC] SALIDA Registrada: Vehículo [${data.data.placa}] liberó Andén ${truck.anden}.`);
                        } else {
                            addLog(`[ERROR DB] Fallo en Salida: ${outData.error}`);
                        }
                    } catch (e: any) {
                        addLog(`[CRITICAL] Fallo de red en Salida: ${e.message}`);
                    }

                    setTrucks(curr => curr.filter(t => t.id !== truck.id));
                }, 8000);
            } else {
                addLog(`[ERROR DB] Fallo: ${data.error}`);
                setTrucks(curr => curr.map(t => t.id === truck.id ? { ...t, state: 'error' } : t));
                setTimeout(() => {
                    setTrucks(curr => curr.filter(t => t.id !== truck.id));
                }, 3000);
            }
        } catch (e: any) {
            addLog(`[CRITICAL] Fallo de conexión de red o API: ${e.message}`);
            setTimeout(() => {
                setTrucks(curr => curr.filter(t => t.id !== truck.id));
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans p-2 overflow-hidden relative transition-colors duration-300">
            {/* Background sweep radar effect CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-pattern {
                  background-color: #f1f5f9;
                  background-image: 
                    linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px);
                  background-size: 20px 20px;
                }
                .dark .bg-pattern {
                  background-color: #0f172a;
                  background-image: 
                    linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px);
                }
                .scanline {
                  width: 100%;
                  height: 10px;
                  background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(0,0,0,0) 100%);
                  opacity: 0.1;
                  position: absolute;
                  bottom: 100%;
                  animation: scanline 8s linear infinite;
                }
                @keyframes scanline {
                  0% { bottom: 100%; }
                  100% { bottom: -10px; }
                }
            `}} />
            <div className="absolute inset-0 bg-pattern z-0"></div>

            <header className="flex items-center justify-between mb-8 pb-4 relative z-10 glass-card mx-auto max-w-7xl mt-4 px-6 border-slate-200/50 dark:border-slate-800/50 isolate">
                <div className="flex items-center gap-4 py-2">
                    <div className="p-3 bg-blue-100 dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-slate-800 shadow-sm">
                        <Camera className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">CÁMARAS LPR - TEST HUB</h1>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">ENTORNO DE SIMULACIÓN Y PRUEBAS</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <div className="flex items-center gap-2 text-xs font-bold  px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                        <Database className="w-4 h-4" /> POSTGRESQL CONECTADO
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">SIMULANDO INSERCIONES DE CUSTODIA (R-100)</p>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 max-w-7xl mx-auto h-[70vh]">
                {/* Visual Camera Feed */}
                <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col relative border-slate-200/50 dark:border-slate-700/50 shadow-md">
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                            <span className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-300">LIVE FEED OCR</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
                        <div className="scanline"></div>

                        <div className="w-full h-full relative border border-slate-800 rounded-lg overflow-hidden bg-black/40 flex flex-wrap gap-2 p-4 content-start custom-scrollbar overflow-y-auto">
                            {/* Visual Boxes for "Detected Trucks" */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                                <Truck className="w-64 h-64 text-slate-500" />
                            </div>

                            {andenes.filter(a => trucks.find(t => t.anden === a)).map(anden => {
                                const myTruck = trucks.find(t => t.anden === anden);
                                if (!myTruck) return null;

                                return (
                                    <div key={anden} className={`relative z-10 w-40 p-3 rounded-lg border-2 backdrop-blur-md transition-all ${myTruck.state === 'error' ? 'border-rose-500 bg-rose-950/50 text-rose-200' :
                                            myTruck.state === 'docked' ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200' :
                                                'border-blue-500 bg-blue-950/50 text-blue-200'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2 border-b border-inherit pb-1">
                                            <span className="text-xs font-bold font-mono">CH-{anden.toString().padStart(3, '0')}</span>
                                            {myTruck.state === 'docking' && <Activity className="w-3 h-3 animate-spin" />}
                                        </div>

                                        <div className="space-y-1">
                                            {myTruck.state === 'incoming' && <p className="text-[10px] uppercase font-bold text-center py-2 animate-pulse">Detecting...</p>}
                                            {(myTruck.state === 'docking' || myTruck.state === 'docked' || myTruck.state === 'error') && (
                                                <div className="font-mono text-center">
                                                    <div className="font-bold tracking-widest text-sm bg-black/40 py-1 rounded border border-inherit">
                                                        {myTruck.placa || '???-???'}
                                                    </div>
                                                </div>
                                            )}
                                            {myTruck.state === 'error' && <p className="text-[9px] text-center mt-1 uppercase font-bold text-rose-400">DB Error</p>}
                                            {myTruck.state === 'docked' && <p className="text-[8px] text-center mt-1 text-emerald-400 opacity-80 truncate">{myTruck.hash}</p>}
                                        </div>

                                        {/* Progress bar visualizer */}
                                        {myTruck.state === 'incoming' && (
                                            <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                                                <div className="bg-blue-500 h-1 transition-all" style={{ width: `${myTruck.progress}%` }}></div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {trucks.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-slate-600">
                                    [ WAITING FOR MOTION DETECTION ]
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Right side Log Panel */}
                <div className="glass-card flex flex-col rounded-2xl overflow-hidden border-slate-200/50 dark:border-slate-700/50 shadow-md">
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex items-center px-4">
                        <h3 className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-300">OUTPUT LOG</h3>
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950/50 overflow-y-auto custom-scrollbar flex flex-col-reverse relative text-xs">
                        <div className="flex flex-col-reverse gap-2 font-mono">
                            {logs.map((L, i) => (
                                <div key={i} className={`pb-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0 ${i === 0 ? 'opacity-100' : 'opacity-70'}`}>
                                    <span className="text-slate-400 dark:text-slate-600 block text-[10px] mb-0.5">[{new Date().toLocaleTimeString()}]</span>
                                    <span className={`leading-relaxed
                                        ${L.includes('ERROR') || L.includes('CRITICAL') ? 'text-rose-600 dark:text-rose-400 font-bold' :
                                            L.includes('Exitoso') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                                                L.includes('SALIDA') ? 'text-amber-600 dark:text-amber-400/90' :
                                                    'text-slate-700 dark:text-blue-300'}
                                    `}>{L}</span>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-slate-400 text-center py-8">No events logged.</div>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
