'use client';

import React, { useState, useEffect } from 'react';
import { Radar, Truck, Activity, Database } from 'lucide-react';

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
        <div className="min-h-screen bg-[#020617] text-emerald-400 font-mono p-6 overflow-hidden relative">
            {/* Background sweep radar effect CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes radar-sweep {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .radar-line {
                  position: absolute;
                  top: 50%; left: 50%;
                  width: 70vw; height: 2px;
                  background: linear-gradient(90deg, rgba(2,6,23,0), rgba(52, 211, 153, 0.8));
                  transform-origin: left center;
                  animation: radar-sweep 6s linear infinite;
                  pointer-events: none;
                  z-index: 0;
                }
                .grid-bg {
                  background-size: 50px 50px;
                  background-image: 
                    linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
                }
            `}} />
            <div className="absolute inset-0 grid-bg z-0 pointer-events-none"></div>
            <div className="radar-line opacity-30"></div>

            <header className="flex items-center justify-between mb-8 border-b border-emerald-900/50 pb-4 relative z-10 bg-slate-950/50 p-4 rounded-xl backdrop-blur-md shadow-lg shadow-emerald-900/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-950 rounded-lg border border-emerald-800">
                        <Radar className="w-8 h-8 animate-spin-slow text-emerald-400" style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">RADAR IoT LOGÍSTICO</h1>
                        <p className="text-xs text-emerald-600 tracking-wider">GEMELO DIGITAL (SIMULADOR 2D)</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold bg-emerald-950/60 shadow-[0_0_10px_rgba(52,211,153,0.2)] px-4 py-2 rounded-full border border-emerald-700/50 text-emerald-300">
                        <Database className="w-4 h-4" /> POSTGRESQL [CONECTADO]
                    </div>
                    <p className="text-[10px] text-emerald-600/60">SIMULANDO INSERCIONES DE CUSTODIA SHA-256</p>
                </div>
            </header>

            {/* Grid of Andenes */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10 h-[65vh] max-w-7xl mx-auto overflow-y-auto p-4 custom-scrollbar bg-slate-900/40 rounded-xl border border-emerald-900/30">
                {andenes.map(anden => {
                    const myTruck = trucks.find(t => t.anden === anden);
                    return (
                        <div key={anden} className="flex flex-col items-center justify-end border-x-2 border-t-2 border-emerald-900/30 bg-slate-900/60 rounded-t-2xl relative overflow-hidden backdrop-blur-md h-[400px]">

                            {/* Truck moving div */}
                            {myTruck && (
                                <div
                                    className={`absolute w-24 h-36 border-2 flex flex-col items-center justify-center transition-all duration-100 z-20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]
                                 ${myTruck.state === 'error' ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                            myTruck.state === 'docked' ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)]' :
                                                'bg-slate-800 border-emerald-600 text-emerald-500'}`}
                                    style={{
                                        bottom: `${Math.max(10, 100 - myTruck.progress)}%`,
                                        opacity: myTruck.state === 'docking' ? 0.9 : 1
                                    }}
                                >
                                    <Truck className={`w-10 h-10 mb-2 ${myTruck.state === 'incoming' ? 'animate-bounce' : ''}`} />

                                    {myTruck.state === 'docking' && <span className="text-[10px] animate-pulse font-bold">ENLAZANDO DB...</span>}
                                    {myTruck.state === 'error' && <span className="text-xs font-bold bg-red-900 px-2 py-1 rounded">ERROR DB</span>}

                                    {myTruck.state === 'docked' && (
                                        <div className="text-center w-full px-1">
                                            <div className="text-sm font-extrabold text-white bg-emerald-800 px-1 py-0.5 rounded shadow-inner truncate">{myTruck.placa}</div>
                                            <div className="text-[8px] text-emerald-500 mt-1 truncate px-1 opacity-70">HASH OK</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Anden Base Slot */}
                            <div className="w-full h-12 border-t border-emerald-800/80 bg-emerald-950/80 flex items-center justify-center z-30 relative shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                                <span className={`font-bold tracking-widest text-sm shadow-black drop-shadow-md
                                   ${myTruck?.state === 'docked' ? 'text-white' : 'text-emerald-600'}`}>
                                    ANDÉN {anden}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Terminal Logs Container */}
            <div className="mt-8 bg-[#0a0f1c] border-2 border-emerald-900/50 rounded-xl p-5 h-56 mx-auto relative z-10 font-mono text-sm leading-relaxed backdrop-blur-2xl shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] flex flex-col-reverse">
                <div className="overflow-y-auto flex flex-col-reverse relative">
                    {logs.map((L, i) => (
                        <div key={i} className={`flex gap-3 mb-1 ${i === 0 ? 'opacity-100' : 'opacity-70'}`}>
                            <span className="text-emerald-700/80 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                            <span className={`
                                ${L.includes('ERROR') || L.includes('CRITICAL') ? 'text-red-400 font-bold' :
                                    L.includes('Exitoso') ? 'text-emerald-300 font-semibold' :
                                        L.includes('SALIDA') ? 'text-amber-400/80' :
                                            'text-emerald-500/80'}
                            `}>{L}</span>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-emerald-800 animate-pulse mt-auto">A LA ESCUCHA DE TRÁFICO LOGÍSTICO...</div>}
                </div>
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
                </div>
            </div>
        </div>
    );
}
