// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Newspaper,
    Stethoscope,
    MessageSquare,
    Tag,
    Handshake,
    Building2,
    LayoutGrid,
    ListFilter,
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { AccessDeniedDialog } from '@/components/access-denied-dialog';

interface DashboardStats {
    totalPromoActive: number;
    totalBeritaActive: number;
    totalPartner: number;
    totalDokterActive: number;
    totalPoliActive: number;
    totalKritikSaran: number;
    totalKritikSaranUnread: number;
}

interface KritikSaranByMonth {
    month: string;
    total: number;
}

interface CategoryCount {
    name: string;
    total: number;
}

interface UnitCount {
    name: string;
    total: number;
}

interface KritikSaranRow {
    unit_pelayanan: { title: string } | null;
}

const PIE_COLORS = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981',
    '#ef4444', '#3b82f6', '#ec4899', '#84cc16',
];

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalPromoActive: 0,
        totalBeritaActive: 0,
        totalPartner: 0,
        totalDokterActive: 0,
        totalPoliActive: 0,
        totalKritikSaran: 0,
        totalKritikSaranUnread: 0,
    });

    const [kritikSaranByMonth, setKritikSaranByMonth] = useState<KritikSaranByMonth[]>([]);
    const [beritaByKategori, setBeritaByKategori] = useState<CategoryCount[]>([]);
    const [kritikByUnit, setKritikByUnit] = useState<UnitCount[]>([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [
                { count: promoCount },
                { count: beritaCount },
                { count: partnerCount },
                { count: dokterCount },
                { count: poliCount },
                { count: kritikSaranCount },
                { count: kritikSaranUnreadCount },
                { data: monthData },
                { data: beritaKategoriData },
                { data: kritikUnitData },
            ] = await Promise.all([
                supabase.from('promo').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('berita').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('partner').select('*', { count: 'exact', head: true }),
                supabase.from('dokter').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('poli').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('kritik_saran').select('*', { count: 'exact', head: true }),
                supabase.from('kritik_saran').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
                supabase
                    .from('kritik_saran')
                    .select('created_at')
                    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: true }),
                supabase
                    .from('berita')
                    .select('category')
                    .eq('status', 'active'),
                supabase
                    .from('kritik_saran')
                    .select('unit_pelayanan_id, unit_pelayanan(title)'),
            ]);

            setStats({
                totalPromoActive: promoCount || 0,
                totalBeritaActive: beritaCount || 0,
                totalPartner: partnerCount || 0,
                totalDokterActive: dokterCount || 0,
                totalPoliActive: poliCount || 0,
                totalKritikSaran: kritikSaranCount || 0,
                totalKritikSaranUnread: kritikSaranUnreadCount || 0,
            });

            // Group kritik saran by month
            const monthMap = new Map<string, number>();
            monthData?.forEach(item => {
                const date = new Date(item.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
            });
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            setKritikSaranByMonth(
                Array.from(monthMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([key, total]) => {
                        const [year, month] = key.split('-');
                        return { month: `${monthNames[parseInt(month) - 1]} ${year}`, total };
                    })
            );

            // Group berita by category
            const catMap = new Map<string, number>();
            beritaKategoriData?.forEach(item => {
                const cat = item.category || 'Lainnya';
                catMap.set(cat, (catMap.get(cat) || 0) + 1);
            });
            setBeritaByKategori(
                Array.from(catMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, total]) => ({ name, total }))
            );

            // Group kritik saran by unit pelayanan
            const unitMap = new Map<string, number>();
            (kritikUnitData as KritikSaranRow[] | null)?.forEach((item) => {
                const title = item.unit_pelayanan?.title || 'Tidak Diketahui';
                unitMap.set(title, (unitMap.get(title) || 0) + 1);
            });
            setKritikByUnit(
                Array.from(unitMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, total]) => ({ name, total }))
            );

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

        const channels = [
            supabase.channel('db_kritik_saran').on('postgres_changes', { event: '*', schema: 'public', table: 'kritik_saran' }, () => fetchDashboardData()).subscribe(),
            supabase.channel('db_berita').on('postgres_changes', { event: '*', schema: 'public', table: 'berita' }, () => fetchDashboardData()).subscribe(),
            supabase.channel('db_dokter').on('postgres_changes', { event: '*', schema: 'public', table: 'dokter' }, () => fetchDashboardData()).subscribe(),
            supabase.channel('db_promo').on('postgres_changes', { event: '*', schema: 'public', table: 'promo' }, () => fetchDashboardData()).subscribe(),
            supabase.channel('db_partner').on('postgres_changes', { event: '*', schema: 'public', table: 'partner' }, () => fetchDashboardData()).subscribe(),
            supabase.channel('db_poli').on('postgres_changes', { event: '*', schema: 'public', table: 'poli' }, () => fetchDashboardData()).subscribe(),
        ];

        return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
    }, [fetchDashboardData]);

    const statCards = [
        { title: 'Promo Aktif', value: stats.totalPromoActive, desc: 'Promo yang berjalan', icon: Tag, color: 'text-amber-500' },
        { title: 'Berita Aktif', value: stats.totalBeritaActive, desc: 'Berita dipublikasikan', icon: Newspaper, color: 'text-blue-500' },
        { title: 'Total Partner', value: stats.totalPartner, desc: 'Mitra terdaftar', icon: Handshake, color: 'text-emerald-500' },
        { title: 'Dokter Aktif', value: stats.totalDokterActive, desc: 'Dokter bertugas', icon: Stethoscope, color: 'text-cyan-500' },
        { title: 'Poli Aktif', value: stats.totalPoliActive, desc: 'Poliklinik beroperasi', icon: Building2, color: 'text-violet-500' },
        {
            title: 'Kritik & Saran',
            value: stats.totalKritikSaran,
            desc: null,
            icon: MessageSquare,
            color: 'text-rose-500',
            badge: stats.totalKritikSaranUnread,
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
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
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-72 w-full" /></CardContent></Card>
            </div>
        );
    }

    const totalBeritaChart = beritaByKategori.reduce((s, i) => s + i.total, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Ringkasan data dan statistik sistem</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {statCards.map(({ title, value, desc, icon: Icon, color, badge }) => (
                    <Card key={title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {badge !== undefined
                                    ? badge > 0
                                        ? <Badge variant="destructive" className="text-xs">{badge} belum dibaca</Badge>
                                        : <span>Semua telah dibaca</span>
                                    : desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pie Charts Row */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Berita by Kategori */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-blue-500" />
                            <CardTitle className="text-base">Berita per Kategori</CardTitle>
                        </div>
                        <CardDescription>Distribusi berita aktif berdasarkan kategori</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {beritaByKategori.length === 0 ? (
                            <div className="flex items-center justify-center h-56 text-muted-foreground">
                                <div className="text-center">
                                    <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Belum ada data berita</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={beritaByKategori}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="total"
                                        >
                                            {beritaByKategori.map((_, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [`${value} berita`, 'Total']}
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 px-1">
                                    {beritaByKategori.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                                />
                                                <span className="text-muted-foreground truncate max-w-40">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.total}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({totalBeritaChart > 0 ? Math.round((item.total / totalBeritaChart) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Kritik Saran by Unit Pelayanan */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ListFilter className="h-4 w-4 text-rose-500" />
                            <CardTitle className="text-base">Kritik & Saran per Unit</CardTitle>
                        </div>
                        <CardDescription>Distribusi kritik dan saran berdasarkan unit pelayanan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {kritikByUnit.length === 0 ? (
                            <div className="flex items-center justify-center h-56 text-muted-foreground">
                                <div className="text-center">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Belum ada data kritik & saran</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-1">
                                {kritikByUnit.map((item, index) => {
                                    const max = kritikByUnit[0].total;
                                    const pct = Math.round((item.total / max) * 100);
                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                                    />
                                                    <span className="text-muted-foreground truncate max-w-44">{item.name}</span>
                                                </div>
                                                <span className="font-medium">{item.total}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Area Chart: Kritik Saran by Month */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-cyan-500" />
                        <CardTitle className="text-base">Tren Kritik & Saran</CardTitle>
                    </div>
                    <CardDescription>Total kritik dan saran yang diterima per bulan (12 bulan terakhir)</CardDescription>
                </CardHeader>
                <CardContent>
                    {kritikSaranByMonth.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Belum ada data kritik & saran</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={kritikSaranByMonth} margin={{ top: 10, right: 20, left: 0, bottom: 55 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} angle={-40} textAnchor="end" height={65} interval={0} />
                                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '13px' }}
                                        labelStyle={{ fontWeight: '600', color: '#374151', marginBottom: '2px' }}
                                        itemStyle={{ color: '#06b6d4' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2.5} fill="url(#colorTotal)" name="Total" dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
        </div>
    );
}