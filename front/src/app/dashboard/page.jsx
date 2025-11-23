"use client";

import AuctionCard from "@/components/AuctionCard";
import LoanDetail from "@/components/LoanDetail";
import PoolDetail from "@/components/PoolDetail";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const headerRef = useRef(null);
    const gridRef = useRef(null);
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const searchParams = useSearchParams();
    const loanId = searchParams.get("solicitud");
    const poolId = searchParams.get("bolsa");

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!loanId && headerRef.current) {
            gsap.set(headerRef.current, { opacity: 0, y: -20 });
            gsap.to(headerRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }

        if (!loanId && gridRef.current && gridRef.current.children.length > 0) {
            gsap.set(gridRef.current.children, { opacity: 0, y: 30 });
            gsap.to(gridRef.current.children, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                delay: 0.4,
                ease: "power2.out"
            });
        }
    }, [user, loanId]);

    const [loans, setLoans] = useState([]);
    const [pools, setPools] = useState([]);
    const [viewMode, setViewMode] = useState("loans"); // "loans" or "pools"

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setLoans(data);
                }
            } catch (error) {
                console.error("Error fetching loans:", error);
            }
        };

        const fetchPools = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pools/`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setPools(data);
                }
            } catch (error) {
                console.error("Error fetching pools:", error);
            }
        };

        if (isAuthenticated && !loanId) {
            fetchLoans();
            fetchPools();
        }
    }, [isAuthenticated, loanId]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center  text-black">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
                    <p className="text-zinc-400">Cargando...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated || !user) {
        return null;
    }

    const handleSelectLoan = (id) => {
        router.push(`/dashboard?solicitud=${id}`);
    };

    const handleSelectPool = (id) => {
        router.push(`/dashboard?bolsa=${id}`);
    };

    const handleBack = () => {
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen  text-black">
            {/* Dashboard Navigation */}
            <nav className="sticky top-0 z-40 w-full border-b border-[#285c40]/20 bg-white/70 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <div className="text-xl font-bold tracking-tight text-[#A6F096]">Eska</div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#113522]">
                            <Link href="/dashboard" className="hover:text-[#285c40] transition-colors">Mercado</Link>
                            <Link href="/dashboard/borrower" className="hover:text-[#285c40] transition-colors">Mis Solicitudes</Link>
                            <Link href="/dashboard/lender" className="hover:text-[#285c40] transition-colors">Ser Prestamista</Link>
                            <Link href="/completar-perfil" className="hover:text-[#285c40] transition-colors">Solicitar Prestamo</Link>
                        </div>

                        {/* User Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2">
                                {user.profile_picture_url ? (
                                    <img
                                        src={user.profile_picture_url}
                                        alt={user.first_name || user.email}
                                        className="h-8 w-8 rounded-full border border-white/10"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#285c40] text-sm font-medium">
                                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="rounded-lg border border-white/10 bg-[#285c40] p-2 shadow-xl">
                                    <div className="px-3 py-2 border-b border-white/10 mb-2">
                                        <p className="text-sm font-medium text-white">
                                            {user.first_name && user.last_name
                                                ? `${user.first_name} ${user.last_name}`
                                                : user.first_name || "User"}
                                        </p>
                                        <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full rounded px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="px-6 py-12 md:px-12">
                {loanId ? (
                    <LoanDetail loanId={loanId} onBack={handleBack} />
                ) : poolId ? (
                    <PoolDetail poolId={poolId} onBack={handleBack} />
                ) : (
                    <>
                        <div ref={headerRef} className="mb-10">
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-black">
                                        Bienvenido de nuevo, {user.first_name || "Usuario"}
                                    </h1>
                                    <p className="mt-2 text-zinc-400">Solicitudes de préstamo disponibles para invertir.</p>
                                </div>
                                <div className="hidden md:block">
                                    <Link href="/dashboard/lender" className="text-sm font-medium text-[#285c40] hover:underline">
                                        Ver mi portafolio →
                                    </Link>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-zinc-200">
                                <button
                                    onClick={() => setViewMode("loans")}
                                    className={`pb-3 px-4 font-medium transition-colors ${viewMode === "loans"
                                        ? "text-[#113522] border-b-2 border-[#113522]"
                                        : "text-zinc-500 hover:text-zinc-700"
                                        }`}
                                >
                                    Préstamos Individuales
                                </button>
                                <button
                                    onClick={() => setViewMode("pools")}
                                    className={`pb-3 px-4 font-medium transition-colors ${viewMode === "pools"
                                        ? "text-[#113522] border-b-2 border-[#113522]"
                                        : "text-zinc-500 hover:text-zinc-700"
                                        }`}
                                >
                                    Bolsas de Inversión ({pools.length})
                                </button>
                            </div>
                        </div>

                        <div ref={gridRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {viewMode === "loans" ? (
                                loans.length > 0 ? (
                                    loans.map((loan) => (
                                        <div key={loan.id} onClick={() => handleSelectLoan(loan.id)} className="cursor-pointer">
                                            <AuctionCard
                                                title={`Solicitud #${loan.id}`}
                                                amount={`$${loan.amount.toLocaleString()}`}
                                                rate={`${(loan.interest_rate * 100).toFixed(2)}%`}
                                                timeLeft={`${loan.term_months} meses`}
                                                riskScore={loan.credit_score}
                                                purpose={loan.purpose}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-zinc-500">
                                        No hay solicitudes de préstamo disponibles en este momento.
                                    </div>
                                )
                            ) : (
                                pools.length > 0 ? (
                                    pools.map((pool) => (
                                        <div key={pool.id} onClick={() => handleSelectPool(pool.id)} className="cursor-pointer">
                                            <AuctionCard
                                                title={`Bolsa #${pool.id}`}
                                                currentBid={`$${pool.total_amount.toLocaleString()}`}
                                                timeLeft={`${pool.member_count}/5 préstamos`}
                                                actionLabel="Invertir en Bolsa"
                                                purpose="Diversificación en múltiples préstamos con diferentes perfiles de riesgo."
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-zinc-500">
                                        No hay bolsas disponibles en este momento.
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

