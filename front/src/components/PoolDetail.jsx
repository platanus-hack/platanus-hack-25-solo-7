"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function PoolDetail({ poolId, onBack }) {
    const [pool, setPool] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bidRate, setBidRate] = useState("");
    const [isBidding, setIsBidding] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchPool = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pools/${poolId}`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setPool(data);
                }
            } catch (error) {
                console.error("Error fetching pool:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPool();
    }, [poolId]);

    // Countdown timer
    useEffect(() => {
        if (!pool?.expires_at) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(pool.expires_at).getTime();
            const difference = expiry - now;

            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [pool]);

    // GSAP animation
    useEffect(() => {
        if (!isLoading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
            );
        }
    }, [isLoading]);

    const handleBid = async () => {
        const rate = parseFloat(bidRate) / 100;
        const currentBest = pool.best_bid || pool.avg_interest_rate;

        if (isNaN(rate) || rate >= currentBest) {
            alert(`Tu oferta debe ser menor a ${(currentBest * 100).toFixed(2)}%`);
            return;
        }

        if (!confirm(`¿Estás seguro de ofertar una tasa de ${bidRate}% para toda la bolsa?`)) return;

        setIsBidding(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pools/${poolId}/bid`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ interest_rate: rate }),
                credentials: "include",
            });

            if (response.ok) {
                alert("¡Oferta realizada con éxito!");
                // Refresh pool data
                const updatedPool = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pools/${poolId}`, { credentials: "include" }).then(res => res.json());
                setPool(updatedPool);
                setBidRate("");
            } else {
                const error = await response.json();
                alert(`Error al ofertar: ${error.detail}`);
            }
        } catch (error) {
            console.error("Error bidding:", error);
            alert("Error de conexión");
        } finally {
            setIsBidding(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#285c40] border-t-transparent"></div>
            </div>
        );
    }

    if (!pool) return <div className="text-center py-12">Bolsa no encontrada</div>;

    const currentBestRate = pool.best_bid || pool.avg_interest_rate;

    return (
        <div ref={containerRef} className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-[#285c40] transition-colors"
            >
                ← Volver al listado
            </button>

            {/* Countdown Timer */}
            {timeLeft && (
                <div className="mb-6 bg-linear-to-r from-[#113522] to-[#285c40] p-6 rounded-2xl text-white shadow-xl">
                    <p className="text-sm text-white/80 mb-2">Tiempo restante para pujar</p>
                    <div className="flex gap-4 text-center">
                        <div className="flex-1">
                            <div className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                            <div className="text-xs text-white/60">HORAS</div>
                        </div>
                        <div className="text-4xl font-bold">:</div>
                        <div className="flex-1">
                            <div className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                            <div className="text-xs text-white/60">MINUTOS</div>
                        </div>
                        <div className="text-4xl font-bold">:</div>
                        <div className="flex-1">
                            <div className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                            <div className="text-xs text-white/60">SEGUNDOS</div>
                        </div>
                    </div>
                    <p className="text-xs text-white/60 mt-4 text-center">
                        La mejor oferta se aceptará automáticamente cuando expire el tiempo
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Pool Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[#113522]">Bolsa #{pool.id}</h1>
                                <p className="text-zinc-500">Creada el {new Date(pool.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-[#A6F096]/20 text-[#113522] text-sm font-bold border border-[#A6F096]/50">
                                {pool.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-sm text-zinc-500 mb-1">Monto Total</p>
                                <p className="text-3xl font-bold text-[#113522]">${pool.total_amount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-sm text-zinc-500 mb-1">Mejor Oferta Actual</p>
                                <p className="text-3xl font-bold text-[#285c40]">{(currentBestRate * 100).toFixed(2)}%</p>
                                <p className="text-xs text-zinc-400">Tasa Anual</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-zinc-900">Detalles de la Bolsa</h3>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Préstamos en la bolsa</span>
                                <span className="font-medium">{pool.member_count}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Score Promedio</span>
                                <span className="font-medium">{pool.avg_credit_score.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Ganancia Estimada (Mejor Oferta)</span>
                                <span className="font-medium text-[#285c40]">
                                    +${(pool.total_amount * currentBestRate * 0.5).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bid History */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <h3 className="font-bold text-lg text-[#113522] mb-4">Historial de Pujas</h3>
                        {pool.bids && pool.bids.length > 0 ? (
                            <div className="space-y-3">
                                {pool.bids.map((bid) => (
                                    <div key={bid.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                                        <span className="text-sm text-zinc-600">{new Date(bid.created_at).toLocaleString()}</span>
                                        <span className="font-bold text-[#113522]">{(bid.interest_rate * 100).toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">Aún no hay pujas. ¡Sé el primero!</p>
                        )}
                    </div>

                    {/* Loans in Pool */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <h3 className="font-bold text-lg text-[#113522] mb-4">Préstamos en esta Bolsa</h3>
                        <div className="space-y-3">
                            {pool.loans.map((loan) => (
                                <div key={loan.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                                    <span className="text-sm font-medium">Préstamo #{loan.id}</span>
                                    <div className="text-right">
                                        <p className="font-bold text-[#113522]">${loan.amount.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-500">{loan.term_months} meses</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Bidding */}
                <div className="space-y-6">
                    <div className="bg-[#113522] p-6 rounded-2xl text-white shadow-xl">
                        <h3 className="font-bold text-lg mb-2">Hacer una Oferta</h3>
                        <p className="text-white/80 text-sm mb-6">
                            Compite ofreciendo una tasa de interés más baja para toda la bolsa.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Tasa Actual</span>
                                <span className="font-medium">{(currentBestRate * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Monto Total</span>
                                <span className="font-medium">${pool.total_amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-white/70 mb-1">Tu Tasa Propuesta (%)</label>
                            <input
                                type="number"
                                value={bidRate}
                                onChange={(e) => setBidRate(e.target.value)}
                                placeholder="Ej: 12.5"
                                step="0.1"
                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-[#A6F096]"
                            />
                            <p className="text-xs text-white/50 mt-1">Debe ser menor a {(currentBestRate * 100).toFixed(2)}%</p>
                        </div>

                        <button
                            onClick={handleBid}
                            disabled={isBidding || pool.status !== "open"}
                            className="w-full bg-[#A6F096] text-[#113522] py-3 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBidding ? "Procesando..." :
                                pool.status !== "open" ? "No disponible" : "Confirmar Oferta"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
