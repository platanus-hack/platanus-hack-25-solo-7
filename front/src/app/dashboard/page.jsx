"use client";

import AuctionCard from "@/components/AuctionCard";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const headerRef = useRef(null);
    const gridRef = useRef(null);
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (headerRef.current) {
            gsap.set(headerRef.current, { opacity: 0, y: -20 });
            gsap.to(headerRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }

        if (gridRef.current && gridRef.current.children.length > 0) {
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
    }, [user]);

    const auctions = [
        { id: 1, title: "Vintage Camera Collection", currentBid: "$1,200", timeLeft: "2h 15m" },
        { id: 2, title: "Abstract Oil Painting", currentBid: "$3,450", timeLeft: "5h 30m" },
        { id: 3, title: "Rare First Edition Book", currentBid: "$850", timeLeft: "12m 45s" },
        { id: 4, title: "Mechanical Watch 1950s", currentBid: "$2,100", timeLeft: "1d 4h" },
        { id: 5, title: "Modernist Chair Set", currentBid: "$900", timeLeft: "3h 00m" },
        { id: 6, title: "Signed Vinyl Record", currentBid: "$450", timeLeft: "45m 20s" },
    ];

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

    return (
        <div className="min-h-screen  text-black">
            {/* Dashboard Navigation */}
            <nav className="sticky top-0 z-40 w-full border-b border-[#285c40]/20 bg-white/70 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <div className="text-xl font-bold tracking-tight text-[#A6F096]">Eska</div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#113522]">
                            <Link href="#" className="hover:text-[#285c40] transition-colors">Subastas</Link>
                            <Link href="#" className="hover:text-[#285c40] transition-colors">Ser Prestamista</Link>
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
                <div ref={headerRef} className="mb-10 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black">
                            Bienvenido de nuevo, {user.first_name || "Usuario"}
                        </h1>
                        <p className="mt-2 text-zinc-400">Descubre y oferta por artículos exclusivos.</p>
                    </div>
                    <div className="hidden md:block">
                        <button className="text-sm font-medium text-zinc-400 ">Ver todas las categorías &rarr;</button>
                    </div>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {auctions.map((auction) => (
                        <AuctionCard
                            key={auction.id}
                            title={auction.title}
                            currentBid={auction.currentBid}
                            timeLeft={auction.timeLeft}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}

