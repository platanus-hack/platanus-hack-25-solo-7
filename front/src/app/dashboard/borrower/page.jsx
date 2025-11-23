"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BorrowerDashboard() {
    const { user, isAuthenticated } = useAuth();
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchMyLoans = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/my`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    // Sort by date desc
                    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setLoans(data);
                }
            } catch (error) {
                console.error("Error fetching loans:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchMyLoans();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isLoading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
            );
        }
    }, [isLoading]);

    const handleCloseLoan = async (loanId) => {
        if (!confirm("¿Estás seguro de cerrar esta solicitud? Esta acción no se puede deshacer.")) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/close`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                alert("Solicitud cerrada con éxito");
                // Refresh loans
                const updatedLoans = loans.map(loan =>
                    loan.id === loanId ? { ...loan, status: "rejected" } : loan
                );
                setLoans(updatedLoans);
            } else {
                const error = await response.json();
                alert(`Error al cerrar solicitud: ${error.detail}`);
            }
        } catch (error) {
            console.error("Error closing loan:", error);
            alert("Error de conexión");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#285c40] border-t-transparent"></div>
            </div>
        );
    }

    const pendingLoans = loans.filter(l => l.status === "pending");
    const fundedLoans = loans.filter(l => l.status === "funded");
    const totalRequested = loans.reduce((sum, l) => sum + l.amount, 0);

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-xl font-bold text-[#113522]">
                            Eska
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-[#113522]">
                                Mercado
                            </Link>
                            <Link href="/dashboard/borrower" className="text-sm font-medium text-[#113522]">
                                Mis Solicitudes
                            </Link>
                            <Link href="/dashboard/lender" className="text-sm font-medium text-zinc-500 hover:text-[#113522]">
                                Ser Prestamista
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/completar-perfil"
                            className="px-4 py-2 bg-[#113522] text-white text-sm font-medium rounded-full hover:bg-[#285c40] transition-colors"
                        >
                            Nueva Solicitud
                        </Link>
                    </div>
                </div>
            </header>

            <main className="px-6 py-12 md:px-12 max-w-7xl mx-auto" ref={containerRef}>
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-[#113522] mb-2">Mis Solicitudes</h1>
                    <p className="text-zinc-500">Gestiona tus préstamos y revisa el estado de tus solicitudes.</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Total Solicitado</p>
                        <p className="text-3xl font-bold text-[#113522]">${totalRequested.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Solicitudes Activas</p>
                        <p className="text-3xl font-bold text-[#285c40]">{pendingLoans.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Préstamos Financiados</p>
                        <p className="text-3xl font-bold text-[#113522]">{fundedLoans.length}</p>
                    </div>
                </div>

                {/* Loans List */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100">
                        <h3 className="font-bold text-lg text-[#113522]">Historial de Solicitudes</h3>
                    </div>

                    {loans.length > 0 ? (
                        <div className="divide-y divide-zinc-100">
                            {loans.map((loan) => (
                                <div key={loan.id} className="p-6 hover:bg-zinc-50 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-[#113522]">Solicitud #{loan.id}</span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                        loan.status === 'funded' ? 'bg-green-100 text-green-800 border-green-200' :
                                                            'bg-zinc-100 text-zinc-800 border-zinc-200'
                                                    }`}>
                                                    {loan.status.toUpperCase()}
                                                </span>
                                                {loan.wants_pool && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium">
                                                        BOLSA
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-500">
                                                {new Date(loan.created_at).toLocaleDateString()} • {loan.term_months} meses
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-sm text-zinc-500">Monto</p>
                                                <p className="font-bold text-[#113522]">${loan.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-zinc-500">Tasa Actual</p>
                                                <p className="font-bold text-[#285c40]">{(loan.interest_rate * 100).toFixed(2)}%</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/dashboard?solicitud=${loan.id}`}
                                                    className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                                                >
                                                    Ver Detalle
                                                </Link>
                                                {loan.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCloseLoan(loan.id)}
                                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        Cerrar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-zinc-500 mb-4">No tienes solicitudes de préstamo activas.</p>
                            <Link
                                href="/completar-perfil"
                                className="inline-block px-6 py-3 bg-[#113522] text-white font-medium rounded-full hover:bg-[#285c40] transition-colors"
                            >
                                Crear Nueva Solicitud
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
