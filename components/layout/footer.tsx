// app/components/layout/footer.tsx
import { Phone, Mail, User, LucideIcon } from 'lucide-react';
import { Profile, rumahSakit, socialMedia } from '@/config/profile';
import Image from 'next/image';

const Footer = () => {
    // Data kontak dari profile
    const contactInfo: { icon: LucideIcon; content: string[] }[] = [
        {
            icon: Phone,
            content: [
                `IGD : ${Profile.phone}`,
                `Whatsapp IGD : ${Profile.whatsapp}`,
                `Ambulance : ${Profile.ambulance}`
            ]
        },
        {
            icon: User,
            content: [`Pusat Panggilan : ${Profile.pusatPanggilan}`]
        },
        {
            icon: Mail,
            content: [Profile.email]
        }
    ];

    // Data lokasi dari rumah sakit
    const locations: { name: string; address: string }[] = rumahSakit.map(rs => ({
        name: rs.name,
        address: rs.alamat
    }));

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

    const LinkSection = ({ title, links }: { title: string; links: string[] | { name: string; url: string }[] }) => (
        <div className="mb-6">
            <h4 className="font-bold text-mariner-600 text-base mb-4">{title}</h4>
            <ul className="space-y-2 text-sm text-mariner-500">
                {links.map((link: string | { name: string; url: string }, idx: number) => (
                    <li key={idx}>
                        <a
                            href={typeof link === 'string' ? '#' : link.url}
                            className="hover:text-mariner-700 transition cursor-pointer"
                            target={typeof link === 'string' ? '_self' : '_blank'}
                            rel={typeof link === 'string' ? '' : 'noopener noreferrer'}
                        >
                            {typeof link === 'string' ? link : link.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );

    // Komponen untuk location card
    const LocationCard = ({ name, address }: { name: string; address: string }) => (
        <div>
            <h5 className="font-semibold text-mariner-600 text-sm mb-2">{name}</h5>
            <p className="text-xs text-mariner-500 leading-relaxed">{address}</p>
        </div>
    );

    return (
        <footer className="bg-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                    {/* Logo & Kontak Kami - Row 1 Column 1 */}
                    <div className="order-1 col-span-2 md:col-span-2 lg:col-span-1 lg:row-span-2">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="shrink-0">
                                <Image
                                    src={Profile.logo}
                                    alt={Profile.name}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm text-mariner-600 font-semibold">{Profile.institusi}</h3>
                                <h2 className="text-xl font-bold text-mariner-600">{Profile.name}</h2>
                                <p className="text-xs text-mariner-600">{Profile.subtitle.toUpperCase()}</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-mariner-600 text-base mb-4">Kontak Kami</h4>
                        <div className="space-y-3">
                            {contactInfo.map((contact, idx) => (
                                <ContactItem key={idx} icon={contact.icon} content={contact.content} />
                            ))}
                        </div>
                    </div>

                    {/* Rumah Sakit - Row 1 Column 2 */}
                    <div className="order-2 col-span-2 md:col-span-1 lg:order-2">
                        <LinkSection title="Rumah Sakit" links={rumahSakit} />
                    </div>

                    {/* Social Media & Lainnya - Row 1 Column 3-4 */}
                    <div className="order-3 col-span-2 md:col-span-2 lg:order-3 lg:col-span-2">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <LinkSection title="Social Media" links={socialMedia} />
                            </div>
                            <div>
                                <LinkSection title="Lainnya" links={otherLinks} />
                            </div>
                        </div>
                    </div>

                    {/* Lokasi - Row 2 Column 2-4 (beside Kontak on desktop, below others on mobile) */}
                    <div className="order-5 col-span-2 md:col-span-2 lg:order-4 lg:col-span-3">
                        <h4 className="font-bold text-mariner-600 text-base mb-4">Lokasi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.map((location, idx) => (
                                <LocationCard key={idx} name={location.name} address={location.address} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;