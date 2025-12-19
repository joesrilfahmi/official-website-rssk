'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
    JadwalDokter,
    Poli,
    LayananUnggulan,
    KamarInap,
    Promo
} from '@/types';

// Tipe data untuk pesan
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: string;
    isLoading?: boolean;
}

interface DokterDetail {
    id: string;
    gelar_depan: string | null;
    nama: string;
    gelar_belakang: string | null;
    poli_id: string;
    profile: string | null;
    status: string;
    poli_detail?: Poli;
    jadwal?: JadwalDokter[];
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'Halo! Saya asisten virtual Rumah Sakit. Saya dapat membantu Anda dengan informasi tentang:\n\n• Dokter dan jadwal praktik\n• Layanan unggulan\n• Kamar inap dan fasilitas\n• Promo terkini\n\nAda yang bisa saya bantu?',
            sender: 'bot',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fungsi untuk menganalisis pertanyaan
    const analyzeQuestion = (question: string): { topic: string; doctorName?: string } => {
        const q = question.toLowerCase();

        // Cek apakah ada nama dokter spesifik
        const doctorPatterns = [
            /dokter\s+([a-z\s]+)/i,
            /dr\.?\s+([a-z\s]+)/i,
            /dr\s+([a-z\s]+)/i
        ];

        for (const pattern of doctorPatterns) {
            const match = question.match(pattern);
            if (match && match[1]) {
                const doctorName = match[1].trim();
                // Pastikan bukan kata kunci umum
                if (!['anak', 'kandungan', 'umum', 'gigi', 'mata'].includes(doctorName.toLowerCase())) {
                    return { topic: 'dokter_spesifik', doctorName };
                }
            }
        }

        // Deteksi topik umum
        if (q.includes('dokter') || q.includes('dr') || q.includes('spesialis')) {
            return { topic: 'dokter' };
        } else if (q.includes('jadwal') || q.includes('praktek') || q.includes('jam')) {
            return { topic: 'jadwal' };
        } else if (q.includes('layanan') || q.includes('fasilitas') || q.includes('pelayanan')) {
            return { topic: 'layanan' };
        } else if (q.includes('kamar') || q.includes('rawat inap') || q.includes('inap')) {
            return { topic: 'kamar' };
        } else if (q.includes('promo') || q.includes('diskon') || q.includes('penawaran')) {
            return { topic: 'promo' };
        } else if (q.includes('harga') || q.includes('biaya') || q.includes('tarif')) {
            return { topic: 'harga' };
        } else if (q.includes('anak') || q.includes('pediatri')) {
            return { topic: 'dokter_anak' };
        } else if (q.includes('kandungan') || q.includes('kehamilan') || q.includes('bumil')) {
            return { topic: 'dokter_kandungan' };
        } else if (q.includes('poli') || q.includes('poliklinik')) {
            return { topic: 'poli' };
        }

        return { topic: 'general' };
    };

    // Fungsi untuk generate response berdasarkan data
    const generateResponse = async (question: string): Promise<string> => {
        const analysis = analyzeQuestion(question);
        const topic = analysis.topic;

        try {
            switch (topic) {
                case 'dokter_spesifik': {
                    if (!analysis.doctorName) {
                        return 'Maaf, saya tidak dapat mengenali nama dokter yang Anda maksud. Silakan sebutkan nama dokter dengan jelas.';
                    }

                    const { data: dokterList, error: dokterError } = await supabase
                        .from('dokter')
                        .select('*, poli_detail:poli(id, nama_poli), jadwal:jadwal_dokter(*)')
                        .eq('status', 'active')
                        .ilike('nama', `%${analysis.doctorName}%`);

                    if (dokterError) throw dokterError;

                    if (dokterList && dokterList.length > 0) {
                        const dokter = dokterList[0] as DokterDetail;
                        const namaLengkap = `${dokter.gelar_depan ? dokter.gelar_depan + ' ' : ''}${dokter.nama}${dokter.gelar_belakang ? ', ' + dokter.gelar_belakang : ''}`;

                        let response = `👨‍⚕️ **${namaLengkap}**\n\n`;
                        response += `🏥 **Poliklinik:** ${dokter.poli_detail?.nama_poli || 'Tidak tersedia'}\n\n`;

                        if (dokter.profile) {
                            response += `📋 **Profile:**\n${dokter.profile}\n\n`;
                        }

                        if (dokter.jadwal && dokter.jadwal.length > 0) {
                            response += `📅 **Jadwal Praktik:**\n`;
                            const hariUrutan = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                            const jadwalSorted = [...dokter.jadwal].sort((a, b) => {
                                return hariUrutan.indexOf(a.hari) - hariUrutan.indexOf(b.hari);
                            });

                            jadwalSorted.forEach((j: JadwalDokter) => {
                                response += `• ${j.hari}: ${j.jam_mulai} - ${j.jam_selesai}\n`;
                            });
                        } else {
                            response += `📅 **Jadwal Praktik:** Belum tersedia\n`;
                        }

                        response += '\n💡 Untuk membuat janji temu, silakan hubungi front desk kami.';
                        return response;
                    }

                    return `Maaf, tidak ada dokter dengan nama "${analysis.doctorName}" yang ditemukan dalam sistem kami. Silakan periksa kembali nama dokter atau tanyakan daftar dokter yang tersedia.`;
                }

                case 'dokter': {
                    const { data: dokterList, error: dokterError } = await supabase
                        .from('dokter')
                        .select('*, poli_detail:poli(id, nama_poli)')
                        .eq('status', 'active')
                        .order('nama', { ascending: true });

                    if (dokterError) throw dokterError;

                    if (dokterList && dokterList.length > 0) {
                        let response = '🏥 **Dokter Kami:**\n\n';
                        (dokterList as DokterDetail[]).forEach((dok) => {
                            const namaLengkap = `${dok.gelar_depan ? dok.gelar_depan + ' ' : ''}${dok.nama}${dok.gelar_belakang ? ', ' + dok.gelar_belakang : ''}`;
                            response += `👨‍⚕️ **${namaLengkap}**\n`;
                            response += `   ${dok.poli_detail?.nama_poli || 'Poli Umum'}\n`;
                            if (dok.profile) {
                                response += `   ${dok.profile}\n`;
                            }
                            response += '\n';
                        });
                        response += '\n💡 Untuk info detail dokter tertentu, silakan tanyakan: "Dokter [nama dokter]"';
                        return response;
                    }
                    return 'Maaf, informasi dokter belum tersedia saat ini. Silakan hubungi front desk kami untuk informasi lebih lanjut.';
                }

                case 'poli': {
                    const { data: poliList, error: poliError } = await supabase
                        .from('poli')
                        .select('*')
                        .eq('status', 'active')
                        .order('nama_poli', { ascending: true });

                    if (poliError) throw poliError;

                    if (poliList && poliList.length > 0) {
                        let response = '🏥 **Poliklinik Tersedia:**\n\n';
                        (poliList as Poli[]).forEach((poli, index) => {
                            response += `${index + 1}. ${poli.nama_poli}\n`;
                        });
                        response += '\nUntuk informasi dokter di poliklinik tertentu, silakan tanyakan!';
                        return response;
                    }
                    return 'Maaf, informasi poliklinik belum tersedia saat ini.';
                }

                case 'dokter_anak': {
                    const { data: dokterList, error: dokterError } = await supabase
                        .from('dokter')
                        .select('*, poli_detail:poli(id, nama_poli), jadwal:jadwal_dokter(*)')
                        .eq('status', 'active')
                        .or('gelar_belakang.ilike.%Sp.A%');

                    if (dokterError) throw dokterError;

                    const { data: poliAnak } = await supabase
                        .from('poli')
                        .select('id, nama_poli')
                        .ilike('nama_poli', '%anak%');

                    let dokterAnak = (dokterList as DokterDetail[]) || [];

                    if (poliAnak && poliAnak.length > 0) {
                        const poliAnakIds = poliAnak.map(p => p.id);
                        const { data: dokterDariPoli } = await supabase
                            .from('dokter')
                            .select('*, poli_detail:poli(id, nama_poli), jadwal:jadwal_dokter(*)')
                            .eq('status', 'active')
                            .in('poli_id', poliAnakIds);

                        if (dokterDariPoli) {
                            dokterAnak = [...dokterAnak, ...(dokterDariPoli as DokterDetail[])];
                            dokterAnak = dokterAnak.filter((dok, index, self) =>
                                index === self.findIndex((d) => d.id === dok.id)
                            );
                        }
                    }

                    if (dokterAnak.length > 0) {
                        let response = '👶 **Dokter Spesialis Anak Kami:**\n\n';
                        dokterAnak.forEach((dok) => {
                            const namaLengkap = `${dok.gelar_depan ? dok.gelar_depan + ' ' : ''}${dok.nama}${dok.gelar_belakang ? ', ' + dok.gelar_belakang : ''}`;
                            response += `👨‍⚕️ **${namaLengkap}**\n`;
                            if (dok.profile) response += `   ${dok.profile}\n`;

                            if (dok.jadwal && dok.jadwal.length > 0) {
                                response += '   📅 Jadwal Praktik:\n';
                                dok.jadwal.forEach((j) => {
                                    response += `      • ${j.hari}: ${j.jam_mulai} - ${j.jam_selesai}\n`;
                                });
                            }
                            response += '\n';
                        });
                        return response;
                    }
                    return 'Maaf, saat ini belum ada informasi dokter spesialis anak yang tersedia.';
                }

                case 'dokter_kandungan': {
                    const { data: dokterKandungan, error } = await supabase
                        .from('dokter')
                        .select('*, poli_detail:poli(id, nama_poli), jadwal:jadwal_dokter(*)')
                        .eq('status', 'active')
                        .or('gelar_belakang.ilike.%Sp.OG%,gelar_belakang.ilike.%SpOG%');

                    if (error) throw error;

                    if (dokterKandungan && dokterKandungan.length > 0) {
                        let response = '🤰 **Dokter Spesialis Kandungan Kami:**\n\n';
                        (dokterKandungan as DokterDetail[]).forEach((dok) => {
                            const namaLengkap = `${dok.gelar_depan ? dok.gelar_depan + ' ' : ''}${dok.nama}${dok.gelar_belakang ? ', ' + dok.gelar_belakang : ''}`;
                            response += `👨‍⚕️ **${namaLengkap}**\n`;
                            if (dok.profile) response += `   ${dok.profile}\n`;

                            if (dok.jadwal && dok.jadwal.length > 0) {
                                response += '   📅 Jadwal Praktik:\n';
                                dok.jadwal.forEach((j) => {
                                    response += `      • ${j.hari}: ${j.jam_mulai} - ${j.jam_selesai}\n`;
                                });
                            }
                            response += '\n';
                        });
                        return response;
                    }
                    return 'Maaf, saat ini belum ada informasi dokter spesialis kandungan yang tersedia.';
                }

                case 'jadwal': {
                    const { data: jadwalList, error: jadwalError } = await supabase
                        .from('jadwal_dokter')
                        .select('*, dokter:dokter(id, gelar_depan, nama, gelar_belakang, status)')
                        .eq('dokter.status', 'active')
                        .order('hari', { ascending: true })
                        .order('jam_mulai', { ascending: true });

                    if (jadwalError) throw jadwalError;

                    if (jadwalList && jadwalList.length > 0) {
                        let response = '📅 **Jadwal Praktik Dokter:**\n\n';

                        const jadwalPerHari: { [key: string]: typeof jadwalList } = {};
                        jadwalList.forEach((jadwal) => {
                            if (jadwal.dokter && jadwal.dokter.status === 'active') {
                                if (!jadwalPerHari[jadwal.hari]) {
                                    jadwalPerHari[jadwal.hari] = [];
                                }
                                jadwalPerHari[jadwal.hari].push(jadwal);
                            }
                        });

                        const hariUrutan = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                        hariUrutan.forEach(hari => {
                            if (jadwalPerHari[hari]) {
                                response += `**${hari}:**\n`;
                                jadwalPerHari[hari].forEach((jadwal) => {
                                    if (jadwal.dokter) {
                                        const namaLengkap = `${jadwal.dokter.gelar_depan ? jadwal.dokter.gelar_depan + ' ' : ''}${jadwal.dokter.nama}${jadwal.dokter.gelar_belakang ? ', ' + jadwal.dokter.gelar_belakang : ''}`;
                                        response += `   • ${jadwal.jam_mulai}-${jadwal.jam_selesai}: ${namaLengkap}\n`;
                                    }
                                });
                                response += '\n';
                            }
                        });

                        return response;
                    }
                    return 'Maaf, informasi jadwal belum tersedia. Silakan hubungi front desk untuk informasi lebih lanjut.';
                }

                case 'layanan': {
                    const { data: layananList, error: layananError } = await supabase
                        .from('layanan_unggulan')
                        .select('*')
                        .eq('status', 'active')
                        .order('urutan', { ascending: true });

                    if (layananError) throw layananError;

                    if (layananList && layananList.length > 0) {
                        let response = '✨ **Layanan Unggulan Kami:**\n\n';
                        (layananList as LayananUnggulan[]).forEach((layanan, index) => {
                            response += `${index + 1}. **${layanan.title}**\n`;
                            response += `   ${layanan.description}\n\n`;
                        });
                        response += 'Untuk informasi lebih detail atau pendaftaran, silakan hubungi customer service kami.';
                        return response;
                    }
                    return 'Maaf, informasi layanan belum tersedia saat ini.';
                }

                case 'kamar':
                case 'harga': {
                    const { data: kamarList, error: kamarError } = await supabase
                        .from('kamar_inap')
                        .select('*')
                        .order('urutan', { ascending: true });

                    if (kamarError) throw kamarError;

                    if (kamarList && kamarList.length > 0) {
                        let response = '🛏️ **Pilihan Kamar Inap:**\n\n';
                        (kamarList as KamarInap[]).forEach((kamar) => {
                            response += `**${kamar.title}** ${kamar.is_recommended ? '⭐ (Rekomendasi)' : ''}\n`;
                            response += `   ${kamar.description}\n`;
                            response += `   💰 Rp ${kamar.price.toLocaleString('id-ID')}/hari\n`;
                            if (kamar.facilities && kamar.facilities.length > 0) {
                                response += `   🏨 Fasilitas: ${kamar.facilities.join(', ')}\n`;
                            }
                            response += '\n';
                        });
                        response += 'Harga dapat berubah sewaktu-waktu. Untuk informasi terkini dan reservasi, silakan hubungi front desk kami.';
                        return response;
                    }
                    return 'Maaf, informasi kamar inap belum tersedia saat ini.';
                }

                case 'promo': {
                    const { data: promoList, error: promoError } = await supabase
                        .from('promo')
                        .select('*')
                        .eq('status', 'active')
                        .order('created_at', { ascending: false });

                    if (promoError) throw promoError;

                    if (promoList && promoList.length > 0) {
                        let response = '🎉 **Promo Terkini:**\n\n';
                        (promoList as Promo[]).forEach((promo, index) => {
                            response += `${index + 1}. **${promo.title}**\n`;
                            response += `   ${promo.description}\n\n`;
                        });
                        response += 'Syarat dan ketentuan berlaku. Hubungi customer service untuk detail lebih lanjut!';
                        return response;
                    }
                    return 'Saat ini belum ada promo yang tersedia. Pantau terus untuk penawaran menarik dari kami!';
                }

                default:
                    return 'Maaf, saya belum memahami pertanyaan Anda. Saya dapat membantu dengan informasi tentang:\n\n• Dokter dan jadwal praktik (contoh: "Dokter Ahmad")\n• Poliklinik tersedia\n• Layanan unggulan\n• Kamar inap dan harga\n• Promo terkini\n\nSilakan tanyakan hal-hal tersebut atau hubungi customer service kami untuk bantuan lebih lanjut.';
            }
        } catch (error) {
            console.error('Error generating response:', error);
            return 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi atau hubungi customer service kami.';
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: messages.length + 1,
            text: inputText,
            sender: 'user',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        const loadingMessage: Message = {
            id: messages.length + 2,
            text: 'Sedang mengetik...',
            sender: 'bot',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isLoading: true
        };
        setMessages(prev => [...prev, loadingMessage]);

        const response = await generateResponse(inputText);

        setMessages(prev => {
            const filtered = prev.filter(m => !m.isLoading);
            return [
                ...filtered,
                {
                    id: prev.length + 1,
                    text: response,
                    sender: 'bot',
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                }
            ];
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-linear-to-br from-easternblue-500 to-easternblue-600 hover:from-easternblue-600 hover:to-easternblue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group"
                >
                    <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </button>
            )}

            {isOpen && (
                <div className="fixed md:bottom-6 md:right-6 md:w-[420px] md:h-[650px] md:rounded-3xl bottom-0 right-0 w-full h-full bg-white shadow-2xl flex flex-col z-50">
                    <div className="bg-linear-to-r from-easternblue-500 to-easternblue-600 text-white p-5 md:rounded-t-3xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center relative">
                                <Bot className="w-6 h-6" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Assistant</h3>
                                <p className="text-xs text-easternblue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Online - Siap Membantu
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-full transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-linear-to-b from-gray-50 to-white space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                <div
                                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user'
                                        ? 'bg-easternblue-500 text-white'
                                        : 'bg-linear-to-br from-easternblue-400 to-easternblue-600 text-white'
                                        }`}
                                >
                                    {message.sender === 'user' ? (
                                        <User size={16} />
                                    ) : (
                                        <Bot size={16} />
                                    )}
                                </div>

                                <div className="flex-1 max-w-[75%]">
                                    <div
                                        className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                                            ? 'bg-easternblue-500 text-white rounded-tr-sm'
                                            : 'bg-white text-gray-800 rounded-tl-sm shadow-md border border-gray-100'
                                            }`}
                                    >
                                        {message.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">{message.text}</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-line wrap-break-word">
                                                {message.text}
                                            </p>
                                        )}
                                    </div>
                                    <p
                                        className={`text-xs mt-1 px-1 ${message.sender === 'user' ? 'text-right text-gray-500' : 'text-gray-400'
                                            }`}
                                    >
                                        {message.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-easternblue-500 transition-all">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ketik pertanyaan Anda..."
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className={`p-3 rounded-full transition-all shadow-lg ${inputText.trim()
                                    ? 'bg-linear-to-r from-easternblue-500 to-easternblue-600 hover:from-easternblue-600 hover:to-easternblue-700 text-white hover:shadow-xl hover:scale-105'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={20} />
                            </button>
                        </div>

                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {['Dokter', 'Jadwal', 'Layanan', 'Kamar', 'Promo'].map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setInputText(`Informasi ${topic.toLowerCase()}`)}
                                    className="px-3 py-1.5 bg-easternblue-50 hover:bg-easternblue-100 text-easternblue-700 text-xs rounded-full whitespace-nowrap transition-colors border border-easternblue-200"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}