"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LenderDashboard() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [investments, setInvestments] = useState([]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lender/stats`, {
                    credentials: "include",
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }

                // Fetch investments
                const investRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lender/investments`, {
                    credentials: "include",
                });
                if (investRes.ok) {
                    const data = await investRes.json();
                    setInvestments(data);
                }
            } catch (error) {
                console.error("Error fetching lender data:", error);
            }
        };

        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#285c40] border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-black">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 w-full border-b border-[#285c40]/20 bg-white/70 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <div className="text-xl font-bold tracking-tight text-[#A6F096]">Eska</div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#113522]">
                            <Link href="/dashboard" className="hover:text-[#285c40] transition-colors">Explorar</Link>
                            <Link href="/dashboard/lender" className="text-[#285c40] font-bold">Mi Portafolio</Link>
                        </div>

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
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-black">
                        Mi Portafolio de Inversiones
                    </h1>
                    <p className="mt-2 text-zinc-400">Monitorea tus inversiones y rentabilidad.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Total Invertido</p>
                        <p className="text-3xl font-bold text-[#113522]">
                            ${stats?.total_invested?.toLocaleString() || "0"}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Retorno Esperado</p>
                        <p className="text-3xl font-bold text-[#285c40]">
                            ${stats?.expected_return?.toLocaleString() || "0"}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                        <p className="text-sm text-zinc-500 mb-1">Inversiones Activas</p>
                        <p className="text-3xl font-bold text-[#113522]">
                            {stats?.active_count || 0}
                        </p>
                    </div>
                </div>

                {/* Investments List */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                    <h2 className="text-xl font-bold text-[#113522] mb-6">Mis Inversiones</h2>
                    {investments.length > 0 ? (
                        <div className="space-y-4">
                            {investments.map((inv) => (
                                <div key={inv.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-zinc-900">{inv.type} #{inv.id}</p>
                                        <p className="text-sm text-zinc-500">
                                            {inv.type === "Pool" ? `${inv.member_count} préstamos` : `Préstamo individual`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#113522]">${inv.amount?.toLocaleString()}</p>
                                        <p className="text-sm text-zinc-500">{inv.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">Aún no tienes inversiones activas.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
