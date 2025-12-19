'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/config/profile';
import { AnimatePresence, motion } from 'framer-motion';

type QuickAction =
    | 'menu_klinik'
    | 'menu_dokter'
    | 'menu_layanan'
    | 'menu_kamar'
    | 'menu_promo'
    | 'list_poli'
    | 'list_dokter_by_poli'
    | 'detail_dokter'
    | 'detail_layanan'
    | 'detail_kamar'
    | 'detail_promo'
    | 'back_poli'
    | 'back_main';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: string;
}

interface QuickReply {
    label: string;
    action: QuickAction;
    value?: string;
}

type PoliRow = { id: string; nama_poli: string; status: string };
type DokterRow = {
    id: string;
    gelar_depan: string | null;
    nama: string;
    gelar_belakang: string | null;
    poli_id: string;
    profile: string | null;
    status: string;
};
type JadwalRow = { id: string; dokter_id: string; hari: string; jam_mulai: string; jam_selesai: string };
type LayananRow = { id: string; title: string; description: string; urutan: number };
type KamarRow = {
    id: string;
    title: string;
    description: string;
    price: number;
    facilities: unknown;
    is_recommended: boolean;
};
type PromoRow = { id: string; title: string; description: string; picture: string | null; status: string };

const CHAT_DELAY_MS = 500;
const QUICK_REPLY_STAGGER_MS = 500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function nowTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getWaktuSapaanID(): string {
    const hour = Number(
        new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date())
    );
    if (hour >= 4 && hour < 11) return 'pagi';
    if (hour >= 11 && hour < 15) return 'siang';
    if (hour >= 15 && hour < 18) return 'sore';
    return 'malam';
}

function formatNamaDokter(d: DokterRow) {
    return `${d.gelar_depan ? d.gelar_depan + ' ' : ''}${d.nama}${d.gelar_belakang ? ', ' + d.gelar_belakang : ''}`;
}

function isLikelyImageUrl(s: string) {
    const v = s.trim();
    if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) return false;
    return /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(v) || v.includes('supabase') || v.includes('storage');
}

function normalizeFacilities(input: unknown): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String);

    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input) as unknown;
            if (Array.isArray(parsed)) return parsed.map(String);
            if (parsed && typeof parsed === 'object') return Object.values(parsed as Record<string, unknown>).map(String);
            return [input];
        } catch {
            return [input];
        }
    }

    if (typeof input === 'object') {
        return Object.values(input as Record<string, unknown>).map(String);
    }

    return [String(input)];
}

// ✅ Animations (fix ease typing: use array easing, not string)
const msgMotion = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.98 },
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
};

const badgeMotion = {
    initial: { opacity: 0, y: 6, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.98 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ChatWidget() {
    const greetingText = useMemo(() => {
        const sapaan = getWaktuSapaanID();
        return `Assalamualaikum warahmatullahi wabarakatuh dan selamat ${sapaan}.\nAda yang bisa saya bantu?`;
    }, []);

    const mainMenuReplies: QuickReply[] = useMemo(
        () => [
            { label: 'Klinik', action: 'menu_klinik' },
            { label: 'Dokter', action: 'menu_dokter' },
            { label: 'Layanan', action: 'menu_layanan' },
            { label: 'Kamar Inap', action: 'menu_kamar' },
            { label: 'Promo', action: 'menu_promo' },
        ],
        []
    );

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [visibleQuickReplies, setVisibleQuickReplies] = useState<QuickReply[]>([]);

    // ✅ typing indicator replaces "Online" in header
    const [isTyping, setIsTyping] = useState(false);

    // ✅ queue so everything appears in order
    const queueRef = useRef(Promise.resolve());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => {
        scrollToBottom();
    }, [messages, visibleQuickReplies]);

    const enqueue = (task: () => Promise<void>) => {
        queueRef.current = queueRef.current.then(task).catch(() => { });
        return queueRef.current;
    };

    const addMessage = (text: string, sender: 'user' | 'bot') => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.floor(Math.random() * 1000), text, sender, time: nowTime() },
        ]);
    };

    // ✅ typing controller (no "Sedang memproses..." message anymore)
    const startTyping = () => setIsTyping(true);
    const stopTyping = () => setIsTyping(false);

    const botSay = (text: string) =>
        enqueue(async () => {
            startTyping();
            await sleep(CHAT_DELAY_MS);
            addMessage(text, 'bot');
            stopTyping();
        });

    const botSayMany = (texts: string[]) =>
        enqueue(async () => {
            startTyping();
            for (const t of texts) {
                await sleep(CHAT_DELAY_MS);
                addMessage(t, 'bot');
            }
            stopTyping();
        });

    // ✅ tampilkan badge satu-per-satu tiap 500ms
    const showQuickReplies = (replies: QuickReply[]) =>
        enqueue(async () => {
            startTyping();
            setVisibleQuickReplies([]);
            await sleep(CHAT_DELAY_MS);
            stopTyping();

            for (const r of replies) {
                setVisibleQuickReplies((prev) => [...prev, r]);
                await sleep(QUICK_REPLY_STAGGER_MS);
            }
        });

    const resetToMainMenu = () => {
        void showQuickReplies(mainMenuReplies);
    };

    /**
     * ✅ RESET TOTAL saat widget ditutup:
     * - kosongkan messages & quick replies
     * - matikan typing
     * - reset queue agar task lama tidak “nyusul” setelah dibuka lagi
     */
    const resetChat = () => {
        setIsTyping(false);
        setMessages([]);
        setVisibleQuickReplies([]);
        queueRef.current = Promise.resolve(); // penting!
    };

    // init when opened
    useEffect(() => {
        if (!isOpen) return;

        if (messages.length === 0) {
            enqueue(async () => {
                startTyping();
                await sleep(CHAT_DELAY_MS);
                setMessages([{ id: 1, text: greetingText, sender: 'bot', time: nowTime() }]);
                stopTyping();
            });
            void showQuickReplies(mainMenuReplies);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // =================== KLINIK ===================

    const handleMenuKlinik = async () => {
        addMessage('Klinik', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('poli')
                .select('id, nama_poli, status')
                .eq('status', 'active')
                .order('nama_poli', { ascending: true });

            if (error) throw error;

            const poliList = (data ?? []) as PoliRow[];
            if (!poliList.length) {
                stopTyping();
                await botSay('Maaf, data klinik/poli belum tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Berikut daftar klinik/poli yang tersedia. Silakan pilih:');
            await showQuickReplies(
                poliList.map((p): QuickReply => ({
                    label: p.nama_poli,
                    action: 'list_dokter_by_poli',
                    value: p.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil data poli.');
            resetToMainMenu();
        }
    };

    const handleDokterByPoli = async (poliId: string) => {
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data: poliRow, error: poliErr } = await supabase.from('poli').select('id, nama_poli, status').eq('id', poliId).single();
            if (poliErr) throw poliErr;

            const poliName = (poliRow as PoliRow)?.nama_poli ?? 'Poli';
            addMessage(poliName, 'user');

            const { data, error } = await supabase
                .from('dokter')
                .select('id, gelar_depan, nama, gelar_belakang, poli_id, profile, status')
                .eq('status', 'active')
                .eq('poli_id', poliId)
                .order('nama', { ascending: true });

            if (error) throw error;

            const dokterList = (data ?? []) as DokterRow[];
            if (!dokterList.length) {
                stopTyping();
                await botSay(`Maaf, belum ada dokter aktif untuk ${poliName}.`);
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay(`Berikut dokter aktif di ${poliName}. Silakan pilih dokter:`);
            await showQuickReplies([
                { label: 'Kembali', action: 'back_poli' },
                ...dokterList.map((d): QuickReply => ({
                    label: formatNamaDokter(d),
                    action: 'detail_dokter',
                    value: d.id,
                })),
            ]);
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil dokter berdasarkan poli.');
            resetToMainMenu();
        }
    };

    const handleBackToPoliList = async () => {
        addMessage('Kembali', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('poli')
                .select('id, nama_poli, status')
                .eq('status', 'active')
                .order('nama_poli', { ascending: true });

            if (error) throw error;

            const poliList = (data ?? []) as PoliRow[];
            if (!poliList.length) {
                stopTyping();
                await botSay('Maaf, data poli belum tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Silakan pilih klinik/poli:');
            await showQuickReplies(
                poliList.map((p): QuickReply => ({
                    label: p.nama_poli,
                    action: 'list_dokter_by_poli',
                    value: p.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat kembali ke daftar poli.');
            resetToMainMenu();
        }
    };

    // =================== DOKTER ===================

    const handleMenuDokter = async () => {
        addMessage('Dokter', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('dokter')
                .select('id, gelar_depan, nama, gelar_belakang, poli_id, profile, status')
                .eq('status', 'active')
                .order('nama', { ascending: true });

            if (error) throw error;

            const dokterList = (data ?? []) as DokterRow[];
            if (!dokterList.length) {
                stopTyping();
                await botSay('Maaf, data dokter belum tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Berikut daftar dokter aktif. Silakan pilih dokter untuk melihat jadwal:');
            await showQuickReplies(
                dokterList.map((d): QuickReply => ({
                    label: formatNamaDokter(d),
                    action: 'detail_dokter',
                    value: d.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil data dokter.');
            resetToMainMenu();
        }
    };

    const handleDokterDetail = async (dokterId: string) => {
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data: dokter, error } = await supabase
                .from('dokter')
                .select('id, gelar_depan, nama, gelar_belakang, poli_id, profile, status')
                .eq('id', dokterId)
                .single();

            if (error) throw error;

            const dok = dokter as DokterRow;
            const namaLengkap = formatNamaDokter(dok);

            const { data: jadwal, error: jadwalErr } = await supabase
                .from('jadwal_dokter')
                .select('id, dokter_id, hari, jam_mulai, jam_selesai')
                .eq('dokter_id', dokterId);

            if (jadwalErr) throw jadwalErr;

            stopTyping();

            addMessage(namaLengkap, 'user');

            const jadwalList = (jadwal ?? []) as JadwalRow[];
            const hariUrutan = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            const sorted = [...jadwalList].sort(
                (a, b) => hariUrutan.indexOf(a.hari) - hariUrutan.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
            );

            const profileVal = (dok.profile ?? '').trim();
            const photoUrl = profileVal && isLikelyImageUrl(profileVal) ? profileVal : '';

            const lines: string[] = [];
            lines.push(`${namaLengkap}`);
            if (photoUrl) {
                lines.push('');
                lines.push('[Foto Dokter]');
                lines.push(photoUrl);
            } else if (profileVal) {
                lines.push('');
                lines.push(profileVal);
            }

            lines.push('');
            if (sorted.length) {
                lines.push('Jadwal Praktik:');
                for (const j of sorted) lines.push(`- ${j.hari}: ${j.jam_mulai} - ${j.jam_selesai}`);
            } else {
                lines.push('Jadwal Praktik: Belum tersedia');
            }
            lines.push('');
            lines.push('Untuk membuat janji temu, silakan hubungi front desk kami.');

            await botSayMany([lines.join('\n')]);
            resetToMainMenu();
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil jadwal dokter.');
            resetToMainMenu();
        }
    };

    // =================== LAYANAN ===================

    const handleMenuLayanan = async () => {
        addMessage('Layanan', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase.from('layanan_unggulan').select('id, title, description, urutan').order('urutan', { ascending: true });
            if (error) throw error;

            const list = (data ?? []) as LayananRow[];
            if (!list.length) {
                stopTyping();
                await botSay('Maaf, informasi layanan belum tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Silakan pilih layanan:');
            await showQuickReplies(
                list.map((l): QuickReply => ({
                    label: l.title,
                    action: 'detail_layanan',
                    value: l.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil data layanan.');
            resetToMainMenu();
        }
    };

    const handleLayananDetail = async (layananId: string) => {
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase.from('layanan_unggulan').select('id, title, description, urutan').eq('id', layananId).single();
            if (error) throw error;

            stopTyping();

            const l = data as LayananRow;
            addMessage(l.title, 'user');
            await botSay(`${l.title}\n\n${l.description}`);
            resetToMainMenu();
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil detail layanan.');
            resetToMainMenu();
        }
    };

    // =================== KAMAR ===================

    const handleMenuKamar = async () => {
        addMessage('Kamar Inap', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('kamar_inap')
                .select('id, title, description, price, facilities, is_recommended')
                .order('is_recommended', { ascending: false })
                .order('title', { ascending: true });

            if (error) throw error;

            const list = (data ?? []) as KamarRow[];
            if (!list.length) {
                stopTyping();
                await botSay('Maaf, informasi kamar inap belum tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Silakan pilih kamar inap:');
            await showQuickReplies(
                list.map((k): QuickReply => ({
                    label: k.title,
                    action: 'detail_kamar',
                    value: k.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil data kamar.');
            resetToMainMenu();
        }
    };

    const handleKamarDetail = async (kamarId: string) => {
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('kamar_inap')
                .select('id, title, description, price, facilities, is_recommended')
                .eq('id', kamarId)
                .single();

            if (error) throw error;

            stopTyping();

            const k = data as KamarRow;
            const facilities = normalizeFacilities(k.facilities);

            addMessage(k.title, 'user');

            const parts: string[] = [];
            parts.push(`${k.title}${k.is_recommended ? ' (Rekomendasi)' : ''}`);
            parts.push('');
            parts.push(k.description);
            parts.push('');
            parts.push(`Harga: Rp ${Number(k.price).toLocaleString('id-ID')}/hari`);
            if (facilities.length) {
                parts.push('');
                parts.push('Fasilitas:');
                for (const f of facilities) parts.push(`- ${f}`);
            }
            parts.push('');
            parts.push('Harga dapat berubah sewaktu-waktu.');

            await botSay(parts.join('\n'));
            resetToMainMenu();
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil detail kamar.');
            resetToMainMenu();
        }
    };

    // =================== PROMO ===================

    const handleMenuPromo = async () => {
        addMessage('Promo', 'user');
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase
                .from('promo')
                .select('id, title, description, picture, status, created_at')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const list = (data ?? []) as PromoRow[];
            if (!list.length) {
                stopTyping();
                await botSay('Saat ini belum ada promo yang tersedia.');
                resetToMainMenu();
                return;
            }

            stopTyping();
            await botSay('Silakan pilih promo:');
            await showQuickReplies(
                list.map((p): QuickReply => ({
                    label: p.title,
                    action: 'detail_promo',
                    value: p.id,
                }))
            );
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil data promo.');
            resetToMainMenu();
        }
    };

    const handlePromoDetail = async (promoId: string) => {
        setVisibleQuickReplies([]);

        try {
            startTyping();

            const { data, error } = await supabase.from('promo').select('id, title, description, picture, status').eq('id', promoId).single();
            if (error) throw error;

            stopTyping();

            const p = data as PromoRow;
            addMessage(p.title, 'user');

            const parts: string[] = [];
            parts.push(p.title);
            if (p.picture) {
                parts.push('');
                parts.push('[Gambar Promo]');
                parts.push(p.picture);
            }
            parts.push('');
            parts.push(p.description);

            await botSay(parts.join('\n'));
            resetToMainMenu();
        } catch {
            stopTyping();
            await botSay('Maaf, terjadi kesalahan saat mengambil detail promo.');
            resetToMainMenu();
        }
    };

    const handleQuickReply = (reply: QuickReply) => {
        setVisibleQuickReplies([]);

        switch (reply.action) {
            case 'menu_klinik':
                void handleMenuKlinik();
                break;
            case 'menu_dokter':
                void handleMenuDokter();
                break;
            case 'menu_layanan':
                void handleMenuLayanan();
                break;
            case 'menu_kamar':
                void handleMenuKamar();
                break;
            case 'menu_promo':
                void handleMenuPromo();
                break;

            case 'list_dokter_by_poli':
                if (reply.value) void handleDokterByPoli(reply.value);
                break;

            case 'detail_dokter':
                if (reply.value) void handleDokterDetail(reply.value);
                break;

            case 'detail_layanan':
                if (reply.value) void handleLayananDetail(reply.value);
                break;

            case 'detail_kamar':
                if (reply.value) void handleKamarDetail(reply.value);
                break;

            case 'detail_promo':
                if (reply.value) void handlePromoDetail(reply.value);
                break;

            case 'back_poli':
                void handleBackToPoliList();
                break;

            case 'back_main':
                addMessage('Kembali', 'user');
                void botSay('Silakan pilih topik yang ingin Anda tanyakan:');
                resetToMainMenu();
                break;

            default:
                break;
        }
    };

    const handleClose = () => {
        resetChat();      // ✅ reset semua state agar saat dibuka kembali mulai dari greeting
        setIsOpen(false);
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-linear-to-br from-easternblue-500 to-easternblue-600 hover:from-easternblue-600 hover:to-easternblue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-80 group"
                    aria-label="Buka Chat"
                >
                    <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </button>
            )}

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed md:bottom-6 md:right-6 md:w-[420px] md:h-[650px] md:rounded-3xl bottom-0 right-0 w-full h-full bg-white shadow-2xl flex flex-col z-80"
                >
                    {/* Header */}
                    <div className="bg-linear-to-r from-easternblue-500 to-easternblue-600 text-white p-5 md:rounded-t-3xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center relative">
                                <Image src={Profile.logo} alt={Profile.name} width={48} height={48} className="w-full h-full object-cover" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Rssk Assistant</h3>

                                {/* ✅ Replace Online with "Sedang mengetik" */}
                                <div className="text-xs text-easternblue-100 flex items-center gap-2 min-h-4">
                                    {isTyping ? (
                                        <>
                                            <span>Sedang mengetik</span>
                                            <span className="flex items-center gap-1">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.span
                                                        key={i}
                                                        initial={{ opacity: 0.2, y: 0 }}
                                                        animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                                                        transition={{
                                                            duration: 0.9,
                                                            repeat: Infinity,
                                                            ease: 'easeInOut',
                                                            delay: i * 0.15,
                                                        }}
                                                        className="inline-block w-1.5 h-1.5 bg-white/90 rounded-full"
                                                    />
                                                ))}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            <span>Online</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleClose} className="hover:bg-white/20 p-2 rounded-full transition-colors" aria-label="Tutup Chat">
                            <X size={22} />
                        </button>
                    </div>

                    {/* Chat area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-linear-to-b from-gray-50 to-white space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={msgMotion.initial}
                                    animate={msgMotion.animate}
                                    exit={msgMotion.exit}
                                    transition={msgMotion.transition}
                                    className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    {message.sender === 'user' ? (
                                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-easternblue-500 text-white">
                                            <User size={16} />
                                        </div>
                                    ) : (
                                        <div className="shrink-0 w-8 h-8" />
                                    )}

                                    <div className="flex-1 max-w-[75%]">
                                        <div
                                            className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                                                    ? 'bg-easternblue-500 text-white rounded-tr-sm'
                                                    : 'bg-white text-gray-800 rounded-tl-sm shadow-md border border-gray-100'
                                                }`}
                                        >
                                            {message.sender === 'bot' && message.text.includes('[Gambar Promo]') ? (
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const lines = message.text.split('\n');
                                                        const idx = lines.findIndex((l) => l.trim() === '[Gambar Promo]');
                                                        const url = idx >= 0 ? (lines[idx + 1] || '').trim() : '';
                                                        const before = idx >= 0 ? lines.slice(0, idx).join('\n').trim() : '';
                                                        const rest = idx >= 0 ? lines.slice(idx + 2).join('\n').trim() : message.text;

                                                        return (
                                                            <>
                                                                {url ? (
                                                                    <div className="w-full overflow-hidden rounded-xl border border-gray-100">
                                                                        <Image src={url} alt="Promo" width={600} height={320} className="w-full h-auto object-cover" />
                                                                    </div>
                                                                ) : null}
                                                                <p className="text-sm leading-relaxed whitespace-pre-line wrap-break-word">
                                                                    {before ? `${before}\n\n${rest}` : rest}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : message.sender === 'bot' && message.text.includes('[Foto Dokter]') ? (
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const lines = message.text.split('\n');
                                                        const idx = lines.findIndex((l) => l.trim() === '[Foto Dokter]');
                                                        const url = idx >= 0 ? (lines[idx + 1] || '').trim() : '';
                                                        const before = idx >= 0 ? lines.slice(0, idx).join('\n').trim() : '';
                                                        const rest = idx >= 0 ? lines.slice(idx + 2).join('\n').trim() : message.text;

                                                        return (
                                                            <>
                                                                {url ? (
                                                                    <div className="w-full overflow-hidden rounded-xl border border-gray-100">
                                                                        <Image src={url} alt="Dokter" width={600} height={320} className="w-full h-auto object-cover" />
                                                                    </div>
                                                                ) : null}

                                                                <p className="text-sm leading-relaxed whitespace-pre-line wrap-break-word">
                                                                    {before ? `${before}\n\n${rest}` : rest}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed whitespace-pre-line wrap-break-word">{message.text}</p>
                                            )}
                                        </div>

                                        <p className={`text-xs mt-1 px-1 ${message.sender === 'user' ? 'text-right text-gray-500' : 'text-gray-400'}`}>
                                            {message.time}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Quick replies (muncul bergantian 500ms + animasi) */}
                        {visibleQuickReplies.length > 0 && (
                            <div className="pt-1">
                                <div className="flex items-start gap-2">
                                    <div className="shrink-0 w-8 h-8" />
                                    <div className="flex-1 max-w-[75%] space-y-2">
                                        <AnimatePresence initial={false}>
                                            {visibleQuickReplies.map((reply, index) => (
                                                <motion.button
                                                    key={`${reply.action}-${reply.value ?? index}`}
                                                    initial={badgeMotion.initial}
                                                    animate={badgeMotion.animate}
                                                    exit={badgeMotion.exit}
                                                    transition={badgeMotion.transition}
                                                    onClick={() => handleQuickReply(reply)}
                                                    className="block w-fit max-w-full text-left px-4 py-2.5 bg-easternblue-50 hover:bg-easternblue-100 text-easternblue-800 text-sm rounded-full transition-colors border border-easternblue-200 font-medium shadow-sm"
                                                >
                                                    <span className="block truncate">{reply.label}</span>
                                                </motion.button>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </motion.div>
            )}
        </>
    );
}
