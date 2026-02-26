// app/components/layout/footer.tsx
import { Profile, rumahSakit, socialMedia } from "@/config/profile";
import { LucideIcon, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  const contactInfo: {
    icon: LucideIcon;
    content: { text: string; href: string }[];
  }[] = [
    {
      icon: Phone,
      content: [
        { text: `IGD : ${Profile.phone}`, href: `tel:${Profile.phone}` },
        {
          text: `Whatsapp IGD : ${Profile.whatsapp}`,
          href: `https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`,
        },
        {
          text: `Ambulance : ${Profile.ambulance}`,
          href: `tel:${Profile.ambulance}`,
        },
      ],
    },
    {
      icon: User,
      content: [
        {
          text: `Pusat Panggilan : ${Profile.pusatPanggilan}`,
          href: `tel:${Profile.pusatPanggilan}`,
        },
      ],
    },
    {
      icon: Mail,
      content: [{ text: Profile.email, href: `mailto:${Profile.email}` }],
    },
  ];

  const locations = rumahSakit.map((rs) => ({
    name: rs.name,
    address: rs.alamat,
  }));

  const otherLinks: (string | { name: string; url: string })[] = [
    {
      name: "Profil Rumah Sakit",
      url: "/sections/rumah-sakit",
    },
    {
      name: "Artikel Kesehatan",
      url: "/sections/blog",
    },
    {
      name: "Layanan",
      url: "/sections/klinik-spesialis",
    },
    {
      name: "Kontak Kami",
      url: "/sections/kontak",
    },
  ];

  const ContactItem = ({
    icon: Icon,
    content,
  }: {
    icon: LucideIcon;
    content: { text: string; href: string }[];
  }) => (
    <div className="flex items-start gap-3">
      <div className="bg-mariner-50 rounded-xl p-2 shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-mariner-500" />
      </div>
      <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
        {content.map((item, idx) => (
          <p key={idx}>
            <a
              href={item.href}
              className="hover:text-mariner-600 transition-colors"
              target={item.href.startsWith("http") ? "_blank" : "_self"}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : ""}
            >
              {item.text}
            </a>
          </p>
        ))}
      </div>
    </div>
  );

  const LinkSection = ({
    title,
    links,
  }: {
    title: string;
    links: (string | { name: string; url: string })[];
  }) => (
    <div>
      <h4 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest">
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm text-gray-500">
        {links.map(
          (link: string | { name: string; url: string }, idx: number) => (
            <li key={idx}>
              <a
                href={typeof link === "string" ? "#" : link.url}
                className="hover:text-mariner-600 transition-colors"
                target={"_self"}
                rel={typeof link === "string" ? "" : "noopener noreferrer"}
              >
                {typeof link === "string" ? link : link.name}
              </a>
            </li>
          ),
        )}
      </ul>
    </div>
  );

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Col 1 — Brand + Contact */}
          <div className="lg:col-span-1">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-mariner-50 flex items-center justify-center">
                <Image
                  src={Profile.logo}
                  alt={Profile.name}
                  width={48}
                  height={48}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">
                  {Profile.institusi}
                </p>
                <h3 className="text-base font-extrabold text-mariner-600 leading-tight">
                  {Profile.name}
                </h3>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {Profile.subtitle}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 mb-6" />

            <h4 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest">
              Kontak Kami
            </h4>
            <div className="space-y-4">
              {contactInfo.map((contact, idx) => (
                <ContactItem
                  key={idx}
                  icon={contact.icon}
                  content={contact.content}
                />
              ))}
            </div>
          </div>

          {/* Col 2 — Rumah Sakit */}
          <div>
            <LinkSection title="Rumah Sakit" links={rumahSakit} />
          </div>

          {/* Col 3 — Social + Lainnya */}
          <div className="grid grid-cols-2 gap-6">
            <LinkSection title="Social Media" links={socialMedia} />
            <LinkSection title="Lainnya" links={otherLinks} />
          </div>

          {/* Col 4 — Lokasi */}
          <div>
            <h4 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest">
              Lokasi
            </h4>
            <div className="space-y-5">
              {locations.map((location, idx) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.address}`)}`;
                return (
                  <a
                    key={idx}
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-mariner-400 shrink-0 mt-0.5 group-hover:text-mariner-600 transition-colors" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-mariner-600 transition-colors leading-snug mb-0.5">
                        {location.name}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {location.address}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {Profile.name}. Hak cipta dilindungi.
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-mariner-500 font-medium">Ikhlas</span> dan{" "}
            <span className="text-mariner-500 font-medium">Ihsan</span> dalam
            pelayanan
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
