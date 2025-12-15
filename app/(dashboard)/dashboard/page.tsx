// app/(dashboard)/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Newspaper,
    Stethoscope,
    MessageSquare
} from 'lucide-react';
import {

    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { AccessDeniedDialog } from '@/components/access-denied-dialog';

interface DashboardStats {
    totalUsers: number;
    totalBeritaActive: number;
    totalDokterActive: number;
    totalKritikSaran: number;
    totalKritikSaranUnread: number;
}

interface KritikSaranByMonth {
    month: string;
    total: number;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalBeritaActive: 0,
        totalDokterActive: 0,
        totalKritikSaran: 0,
        totalKritikSaranUnread: 0,
    });

    const [kritikSaranByMonth, setKritikSaranByMonth] = useState<KritikSaranByMonth[]>([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch total users
            const { count: usersCount, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (usersError) throw usersError;

            // Fetch total berita active
            const { count: beritaCount, error: beritaError } = await supabase
                .from('berita')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            if (beritaError) throw beritaError;

            // Fetch total dokter active
            const { count: dokterCount, error: dokterError } = await supabase
                .from('dokter')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            if (dokterError) throw dokterError;

            // Fetch total kritik saran
            const { count: kritikSaranCount, error: kritikSaranError } = await supabase
                .from('kritik_saran')
                .select('*', { count: 'exact', head: true });

            if (kritikSaranError) throw kritikSaranError;

            // Fetch total kritik saran unread
            const { count: kritikSaranUnreadCount, error: kritikSaranUnreadError } = await supabase
                .from('kritik_saran')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'unread');

            if (kritikSaranUnreadError) throw kritikSaranUnreadError;

            setStats({
                totalUsers: usersCount || 0,
                totalBeritaActive: beritaCount || 0,
                totalDokterActive: dokterCount || 0,
                totalKritikSaran: kritikSaranCount || 0,
                totalKritikSaranUnread: kritikSaranUnreadCount || 0,
            });

            // Fetch kritik saran by month (last 12 months)
            const { data: monthData, error: monthError } = await supabase
                .from('kritik_saran')
                .select('created_at')
                .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: true });

            if (monthError) throw monthError;

            // Group by month
            const monthMap = new Map<string, number>();

            monthData?.forEach(item => {
                const date = new Date(item.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
            });

            const monthDataArray = Array.from(monthMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([key, total]) => {
                    const [year, month] = key.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    const monthStr = `${monthNames[parseInt(month) - 1]} ${year}`;
                    console.log(`Key: ${key}, Month String: ${monthStr}, Total: ${total}`);
                    return {
                        month: monthStr,
                        total,
                    };
                });

            console.log('Chart data:', monthDataArray);
            console.log('Total data points:', monthDataArray.length);
            setKritikSaranByMonth(monthDataArray);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }, []);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);

                const currentUser = getCurrentUser();
                if (!currentUser) {
                    setShowAccessDenied(true);
                    return;
                }

                await fetchDashboardData();
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();

        // Subscribe to realtime changes
        const kritikSaranChannel = supabase
            .channel('dashboard_kritik_saran')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'kritik_saran' },
                () => fetchDashboardData()
            )
            .subscribe();

        const beritaChannel = supabase
            .channel('dashboard_berita')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'berita' },
                () => fetchDashboardData()
            )
            .subscribe();

        const dokterChannel = supabase
            .channel('dashboard_dokter')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'dokter' },
                () => fetchDashboardData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(kritikSaranChannel);
            supabase.removeChannel(beritaChannel);
            supabase.removeChannel(dokterChannel);
        };
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-7 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-80 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Ringkasan data dan statistik sistem
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Pengguna
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Pengguna terdaftar
                        </p>
                    </CardContent>
                </Card>

                {/* Total Berita Active */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Berita Aktif
                        </CardTitle>
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBeritaActive}</div>
                        <p className="text-xs text-muted-foreground">
                            Berita yang dipublikasikan
                        </p>
                    </CardContent>
                </Card>

                {/* Total Dokter Active */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Dokter Aktif
                        </CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDokterActive}</div>
                        <p className="text-xs text-muted-foreground">
                            Dokter yang bertugas
                        </p>
                    </CardContent>
                </Card>

                {/* Total Kritik Saran */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kritik & Saran
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalKritikSaran}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalKritikSaranUnread > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {stats.totalKritikSaranUnread} belum dibaca
                                </Badge>
                            )}
                            {stats.totalKritikSaranUnread === 0 && (
                                <span>Semua telah dibaca</span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart: Kritik Saran by Month */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>Grafik Kritik & Saran</CardTitle>
                    <CardDescription>
                        Total kritik dan saran yang diterima setiap bulan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {kritikSaranByMonth.length === 0 ? (
                        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Belum ada data kritik & saran</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={kritikSaranByMonth}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        interval={0}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                        labelStyle={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}
                                        itemStyle={{ color: '#06b6d4', fontSize: '14px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#06b6d4"
                                        strokeWidth={2}
                                        fill="url(#colorTotal)"
                                        fillOpacity={1}
                                        name="Total"
                                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AccessDeniedDialog
                open={showAccessDenied}
                onOpenChange={setShowAccessDenied}
            />
        </div>
    );
}