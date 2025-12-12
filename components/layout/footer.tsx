// app/components/layout/footer.tsx
import { Phone, Mail, User, LucideIcon } from 'lucide-react';

const Footer = () => {
    // Data kontak
    const contactInfo: { icon: LucideIcon; content: string[] }[] = [
        {
            icon: Phone,
            content: [
                'IGD : 031-7883980',
                'Whatsapp IGD : 0811 3087119',
                'Ambulance : 0811 3330 988'
            ]
        },
        {
            icon: User,
            content: ['Pusat Panggilan : (031) 7881130']
        },
        {
            icon: Mail,
            content: ['humas@sitikhodijah.com']
        }
    ];

    // Data rumah sakit
    const hospitals: string[] = [
        'RS Siti Khodijah Muhammadiyah Cabang Sepanjang',
        'RSU Assakinah Medika',
        'RS Moedito Dwidjoiswojo',
        'Klinik Siti Khodijah Prima'
    ];

    // Data lokasi
    const locations: { name: string; address: string }[] = [
        {
            name: 'RS Siti Khodijah Muhammadiyah Cabang Sepanjang Sidoarjo',
            address: 'Jl. Raya Bebekan, RT.02/ RW.01, Bebekan, Taman, Kabupaten Sidoarjo, Jawa Timur 61257'
        },
        {
            name: 'RSU Assakinah Medika Sidoarjo',
            address: 'Jl. Raya Katon Agung No.63, Semban, Kebohanjang, Kec. Sukodono, Kabupaten Sidoarjo, Jawa Timur 61258'
        },
        {
            name: 'RSU Moedito Dwidjoiswojo Jombang',
            address: 'Jl. Hayam Wuruk No.9, Kepanjen, Kec. Jombang, Kabupaten Jombang, Jawa Timur 61411'
        }
    ];

    // Data social media
    const socialMedia: string[] = ['Instagram', 'Facebook', 'YouTube', 'Tiktok'];

    // Data menu lainnya
    const otherLinks: string[] = [
        'Profil Rumah Sakit',
        'Artikel Kesehatan',
        'Layanan',
        'Kontak Kami',
        'Karir'
    ];

    // Komponen untuk contact item
    const ContactItem = ({ icon: Icon, content }: { icon: LucideIcon; content: string[] }) => (
        <div className="flex items-start gap-3">
            <div className="bg-mariner-500 rounded-full p-2 shrink-0">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-mariner-500 leading-relaxed">
                {content.map((text: string, idx: number) => (
                    <p key={idx}>{text}</p>
                ))}
            </div>
        </div>
    );
    const LinkSection = ({ title, links }: { title: string; links: string[] }) => (
        <div className="mb-6">
            <h4 className="font-bold text-mariner-600 text-base mb-4">{title}</h4>
            <ul className="space-y-2 text-sm text-mariner-500">
                {links.map((link: string, idx: number) => (
                    <li key={idx}>
                        <a href="#" className="hover:text-mariner-700 transition">
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );

    // Komponen untuk location card
    const LocationCard = ({ name, address, showTitle = false }: { name: string; address: string; showTitle?: boolean }) => (
        <div>
            {showTitle && <h4 className="font-bold text-mariner-600 text-base mb-4">Lokasi</h4>}
            <h5 className="font-semibold text-mariner-600 text-sm mb-2">{name}</h5>
            <p className="text-xs text-mariner-500 leading-relaxed">{address}</p>
        </div>
    );

    return (
        <footer className="bg-white">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                    {/* Logo & Kontak Kami */}
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="shrink-0">
                                <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
                                    <circle cx="50" cy="50" r="48" fill="#FDB714" />
                                    <circle cx="50" cy="50" r="30" fill="#0D5C75" />
                                    <g transform="translate(50, 50)">
                                        <circle cx="0" cy="-18" r="3" fill="#FDB714" />
                                        <circle cx="0" cy="18" r="3" fill="#FDB714" />
                                        <circle cx="-18" cy="0" r="3" fill="#FDB714" />
                                        <circle cx="18" cy="0" r="3" fill="#FDB714" />
                                        <circle cx="-13" cy="-13" r="3" fill="#FDB714" />
                                        <circle cx="13" cy="-13" r="3" fill="#FDB714" />
                                        <circle cx="-13" cy="13" r="3" fill="#FDB714" />
                                        <circle cx="13" cy="13" r="3" fill="#FDB714" />
                                    </g>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm text-mariner-600 font-semibold">RUMAH SAKIT</h3>
                                <h2 className="text-xl font-bold text-mariner-600">SITI KHODIJAH</h2>
                                <p className="text-xs text-mariner-600">MUHAMMADIYAH CABANG SEPANJANG</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-mariner-600 text-base mb-4">Kontak Kami</h4>
                        <div className="space-y-3">
                            {contactInfo.map((contact, idx) => (
                                <ContactItem key={idx} icon={contact.icon} content={contact.content} />
                            ))}
                        </div>
                    </div>

                    {/* Rumah Sakit */}
                    <div>
                        <LinkSection title="Rumah Sakit" links={hospitals} />
                        <div>
                            <h4 className="font-bold text-mariner-600 text-base mb-4">Lokasi</h4>
                            <div className="space-y-6">
                                <LocationCard name={locations[0].name} address={locations[0].address} />
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div>
                        <LinkSection title="Social Media" links={socialMedia} />
                        <div>
                            <div className="h-7"></div>
                            <div className="space-y-6">
                                <LocationCard name={locations[1].name} address={locations[1].address} />
                            </div>
                        </div>
                    </div>

                    {/* Lainnya */}
                    <div>
                        <LinkSection title="Lainnya" links={otherLinks} />
                        <div>
                            <div className="h-7"></div>
                            <div className="space-y-6">
                                <LocationCard name={locations[2].name} address={locations[2].address} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;