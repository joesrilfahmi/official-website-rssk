// app/components/layout/footer.tsx
import { Profile, rumahSakit, socialMedia } from "@/config/profile";
import { LucideIcon, Mail, Phone, User } from "lucide-react";
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

  const locations: { name: string; address: string }[] = rumahSakit.map(
    (rs) => ({
      name: rs.name,
      address: rs.alamat,
    }),
  );

  const otherLinks: string[] = [
    "Profil Rumah Sakit",
    "Artikel Kesehatan",
    "Layanan",
    "Kontak Kami",
    "Karir",
  ];

  const ContactItem = ({
    icon: Icon,
    content,
  }: {
    icon: LucideIcon;
    content: { text: string; href: string }[];
  }) => (
    <div className="flex items-start gap-3">
      <div className="bg-mariner-500 rounded-full p-2 shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="text-sm text-mariner-500 leading-relaxed">
        {content.map((item, idx) => (
          <p key={idx}>
            <a
              href={item.href}
              className="hover:text-mariner-700 transition"
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
    links: string[] | { name: string; url: string }[];
  }) => (
    <div className="mb-6">
      <h4 className="font-bold text-mariner-600 text-base mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-mariner-500">
        {links.map(
          (link: string | { name: string; url: string }, idx: number) => (
            <li key={idx}>
              <a
                href={typeof link === "string" ? "#" : link.url}
                className="hover:text-mariner-700 transition cursor-pointer"
                target={typeof link === "string" ? "_self" : "_blank"}
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

  const LocationCard = ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-80 transition group"
      >
        <h5 className="font-semibold text-mariner-600 text-sm mb-2 group-hover:text-mariner-700">
          {name}
        </h5>
        <p className="text-xs text-mariner-500 leading-relaxed">{address}</p>
      </a>
    );
  };

  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
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
                <h3 className="text-sm text-mariner-600 font-semibold">
                  {Profile.institusi}
                </h3>
                <h2 className="text-xl font-bold text-mariner-600">
                  {Profile.name}
                </h2>
                <p className="text-xs text-mariner-600">
                  {Profile.subtitle.toUpperCase()}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-mariner-600 text-base mb-4">
              Kontak Kami
            </h4>
            <div className="space-y-3">
              {contactInfo.map((contact, idx) => (
                <ContactItem
                  key={idx}
                  icon={contact.icon}
                  content={contact.content}
                />
              ))}
            </div>
          </div>

          <div className="order-2 col-span-2 md:col-span-1 lg:order-2">
            <LinkSection title="Rumah Sakit" links={rumahSakit} />
          </div>

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

          <div className="order-5 col-span-2 md:col-span-2 lg:order-4 lg:col-span-3">
            <h4 className="font-bold text-mariner-600 text-base mb-4">
              Lokasi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location, idx) => (
                <LocationCard
                  key={idx}
                  name={location.name}
                  address={location.address}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
