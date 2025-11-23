"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";

export default function LoanDetail({ loanId, onBack }) {
    const { user } = useAuth();
    const [loan, setLoan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bidRate, setBidRate] = useState("");
    const [isBidding, setIsBidding] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const containerRef = useRef(null);

    const isOwner = loan && user && loan.user_id === user.id;

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setLoan(data);
                }
            } catch (error) {
                console.error("Error fetching loan:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLoan();
    }, [loanId]);

    useEffect(() => {
        if (!isLoading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
            );
        }
    }, [isLoading]);

    const handleAcceptBid = async (bidId) => {
        if (!confirm("¿Estás seguro de aceptar esta oferta? Esta acción no se puede deshacer.")) return;

        setIsAccepting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/accept-bid/${bidId}`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                alert("¡Oferta aceptada con éxito!");
                const updatedLoan = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}`, { credentials: "include" }).then(res => res.json());
                setLoan(updatedLoan);
            } else {
                const error = await response.json();
                alert(`Error al aceptar oferta: ${error.detail}`);
            }
        } catch (error) {
            console.error("Error accepting bid:", error);
            alert("Error de conexión");
        } finally {
            setIsAccepting(false);
        }
    };

    const currentBestRate = loan?.best_bid || loan?.interest_rate;

    const handleBid = async () => {
        const rate = parseFloat(bidRate) / 100;
        if (isNaN(rate) || rate >= currentBestRate) {
            alert(`Tu oferta debe ser menor a ${(currentBestRate * 100).toFixed(2)}%`);
            return;
        }

        if (!confirm(`¿Estás seguro de ofertar una tasa de ${bidRate}%?`)) return;

        setIsBidding(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/bid`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ interest_rate: rate }),
                credentials: "include",
            });

            if (response.ok) {
                alert("¡Oferta realizada con éxito!");
                const updatedLoan = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}`, { credentials: "include" }).then(res => res.json());
                setLoan(updatedLoan);
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

    if (!loan) return <div className="text-center py-12">Solicitud no encontrada</div>;

    const borrower = loan.borrower || {};
    const scoreColor = (score) => {
        if (score >= 700) return "text-green-600";
        if (score >= 600) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div ref={containerRef} className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-[#285c40] transition-colors"
            >
                ← Volver al listado
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Loan Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[#113522]">Solicitud #{loan.id}</h1>
                                <p className="text-zinc-500">Publicado el {new Date(loan.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-[#A6F096]/20 text-[#113522] text-sm font-bold border border-[#A6F096]/50">
                                {loan.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-sm text-zinc-500 mb-1">Motivo del Préstamo</p>
                                <p className="text-lg font-medium text-[#113522] italic">"{loan.purpose || "Propósito no especificado"}"</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-sm text-zinc-500 mb-1">Monto Solicitado</p>
                                <p className="text-3xl font-bold text-[#113522]">${loan.amount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <p className="text-sm text-zinc-500 mb-1">Mejor Oferta Actual</p>
                                <p className="text-3xl font-bold text-[#285c40]">{(currentBestRate * 100).toFixed(2)}%</p>
                                <p className="text-xs text-zinc-400">Tasa Anual</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-zinc-900">Detalles de la Inversión</h3>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Plazo</span>
                                <span className="font-medium">{loan.term_months} meses</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Riesgo (Score)</span>
                                <span className={`font-medium ${scoreColor(loan.credit_score)}`}>
                                    {loan.credit_score} ({borrower.score_category || "N/A"})
                                </span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-zinc-100">
                                <span className="text-zinc-600">Ganancia Total (Mejor Oferta)</span>
                                <span className="font-medium text-[#285c40]">
                                    +${(loan.amount * currentBestRate * (loan.term_months / 12)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bid History */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <h3 className="font-bold text-lg text-[#113522] mb-4">Historial de Pujas</h3>
                        {loan.bids && loan.bids.length > 0 ? (
                            <div className="space-y-3">
                                {loan.bids.map((bid) => (
                                    <div key={bid.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                                        <div className="flex-1">
                                            <span className="text-sm text-zinc-600">{new Date(bid.created_at).toLocaleString()}</span>
                                            <p className="font-bold text-[#113522] text-lg">{(bid.interest_rate * 100).toFixed(2)}%</p>
                                        </div>
                                        {isOwner && loan.status === "pending" && (
                                            <button
                                                onClick={() => handleAcceptBid(bid.id)}
                                                disabled={isAccepting}
                                                className="px-4 py-2 bg-[#285c40] text-white rounded-lg font-medium hover:bg-[#113522] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isAccepting ? "Procesando..." : "Aceptar"}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">Aún no hay pujas. ¡Sé el primero!</p>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <h3 className="font-bold text-lg text-[#113522] mb-4">Sobre el Solicitante</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-zinc-500">Nombre</p>
                                <p className="font-medium text-zinc-900">{borrower.first_name} {borrower.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Profesión</p>
                                <p className="font-medium text-zinc-900">{borrower.profession || "No especificado"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Situación Laboral</p>
                                <p className="font-medium text-zinc-900">{borrower.work_situation || "No especificado"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Antigüedad</p>
                                <p className="font-medium text-zinc-900">
                                    {borrower.seniority_years} años, {borrower.seniority_months} meses
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Ingresos Mensuales</p>
                                <p className="font-medium text-zinc-900">
                                    ${parseFloat(borrower.monthly_income || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action */}
                <div className="space-y-6">
                    {isOwner ? (
                        <div className="bg-[#113522] p-6 rounded-2xl text-white shadow-xl">
                            <h3 className="font-bold text-lg mb-2">Tu Solicitud</h3>
                            <p className="text-white/80 text-sm mb-6">
                                Esta es tu solicitud de préstamo. Puedes aceptar cualquier oferta del historial de pujas.
                            </p>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Estado</span>
                                    <span className="font-medium">{loan.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Ofertas Recibidas</span>
                                    <span className="font-medium">{loan.bids?.length || 0}</span>
                                </div>
                                {loan.bids && loan.bids.length > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Mejor Oferta</span>
                                        <span className="font-medium text-[#A6F096]">{(currentBestRate * 100).toFixed(2)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#113522] p-6 rounded-2xl text-white shadow-xl">
                            <h3 className="font-bold text-lg mb-2">Hacer una Oferta</h3>
                            <p className="text-white/80 text-sm mb-6">
                                Compite ofreciendo una tasa de interés más baja.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Tasa Actual</span>
                                    <span className="font-medium">{(currentBestRate * 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Monto</span>
                                    <span className="font-medium">${loan.amount.toLocaleString()}</span>
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
                                disabled={isBidding || loan.status !== "pending"}
                                className="w-full bg-[#A6F096] text-[#113522] py-3 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBidding ? "Procesando..." :
                                    loan.status !== "pending" ? "No disponible" : "Confirmar Oferta"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
