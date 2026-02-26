// app/components/layout/footer.tsx
"use client";
import { ease } from "@/components/animations/animate";
import { Profile, rumahSakit, socialMedia } from "@/config/profile";
import { motion, type Transition } from "framer-motion";
import { LucideIcon, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   HOOK: useInViewOnce — trigger once on scroll
───────────────────────────────────────── */
function useInViewOnce(rootMargin = "-40px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

/* ─────────────────────────────────────────
   ANIMATED COLUMN WRAPPER
   Setiap kolom footer slide-up + fade bergantian
───────────────────────────────────────── */
const colVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease, delay } satisfies Transition,
  }),
};

interface FooterColumnProps {
  delay: number;
  inView: boolean;
  children: React.ReactNode;
  className?: string;
}

const FooterColumn: React.FC<FooterColumnProps> = ({
  delay,
  inView,
  children,
  className,
}) => (
  <motion.div
    custom={delay}
    variants={colVariants}
    initial="hidden"
    animate={inView ? "visible" : "hidden"}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─────────────────────────────────────────
   CONTACT ITEM
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   LINK SECTION
───────────────────────────────────────── */
const LinkSection = ({
  title,
  links,
  inView,
  baseDelay,
}: {
  title: string;
  links: (string | { name: string; url: string })[];
  inView: boolean;
  baseDelay: number;
}) => (
  <div>
    <motion.h4
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={
        { duration: 0.42, ease, delay: baseDelay } satisfies Transition
      }
      className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest"
    >
      {title}
    </motion.h4>
    <ul className="space-y-2.5 text-sm text-gray-500">
      {links.map(
        (link: string | { name: string; url: string }, idx: number) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={
              {
                duration: 0.38,
                ease,
                delay: baseDelay + 0.06 + idx * 0.05,
              } satisfies Transition
            }
          >
            <a
              href={typeof link === "string" ? "#" : link.url}
              className="hover:text-mariner-600 transition-colors"
              target={"_self"}
              rel={typeof link === "string" ? "" : "noopener noreferrer"}
            >
              {typeof link === "string" ? link : link.name}
            </a>
          </motion.li>
        ),
      )}
    </ul>
  </div>
);

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
const Footer = () => {
  const { ref, inView } = useInViewOnce("-30px");

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
    { name: "Profil Rumah Sakit", url: "/sections/rumah-sakit" },
    { name: "Artikel Kesehatan", url: "/sections/blog" },
    { name: "Layanan", url: "/sections/klinik-spesialis" },
    { name: "Kontak Kami", url: "/sections/kontak" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Sentinel div — dipakai untuk deteksi masuk viewport */}
      <div ref={ref} />

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Col 1 — Brand + Contact */}
          <FooterColumn delay={0} inView={inView} className="lg:col-span-1">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={
                  inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }
                }
                transition={
                  { duration: 0.5, ease, delay: 0.08 } satisfies Transition
                }
                className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-mariner-50 flex items-center justify-center"
              >
                <Image
                  src={Profile.logo}
                  alt={Profile.name}
                  width={48}
                  height={48}
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={
                  { duration: 0.45, ease, delay: 0.14 } satisfies Transition
                }
              >
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">
                  {Profile.institusi}
                </p>
                <h3 className="text-base font-extrabold text-mariner-600 leading-tight">
                  {Profile.name}
                </h3>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {Profile.subtitle}
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }
              }
              style={{ originX: 0 }}
              transition={
                { duration: 0.55, ease, delay: 0.22 } satisfies Transition
              }
              className="h-px bg-gray-100 mb-6"
            />

            <motion.h4
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={
                { duration: 0.4, ease, delay: 0.28 } satisfies Transition
              }
              className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest"
            >
              Kontak Kami
            </motion.h4>

            <div className="space-y-4">
              {contactInfo.map((contact, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={
                    {
                      duration: 0.4,
                      ease,
                      delay: 0.34 + idx * 0.08,
                    } satisfies Transition
                  }
                >
                  <ContactItem icon={contact.icon} content={contact.content} />
                </motion.div>
              ))}
            </div>
          </FooterColumn>

          {/* Col 2 — Rumah Sakit */}
          <FooterColumn delay={0.12} inView={inView}>
            <LinkSection
              title="Rumah Sakit"
              links={rumahSakit}
              inView={inView}
              baseDelay={0.18}
            />
          </FooterColumn>

          {/* Col 3 — Social + Lainnya */}
          <FooterColumn
            delay={0.22}
            inView={inView}
            className="grid grid-cols-2 gap-6"
          >
            <LinkSection
              title="Social Media"
              links={socialMedia}
              inView={inView}
              baseDelay={0.28}
            />
            <LinkSection
              title="Lainnya"
              links={otherLinks}
              inView={inView}
              baseDelay={0.32}
            />
          </FooterColumn>

          {/* Col 4 — Lokasi */}
          <FooterColumn delay={0.32} inView={inView}>
            <motion.h4
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={
                { duration: 0.42, ease, delay: 0.38 } satisfies Transition
              }
              className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest"
            >
              Lokasi
            </motion.h4>
            <div className="space-y-5">
              {locations.map((location, idx) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.address}`)}`;
                return (
                  <motion.a
                    key={idx}
                    initial={{ opacity: 0, x: 12 }}
                    animate={
                      inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }
                    }
                    transition={
                      {
                        duration: 0.42,
                        ease,
                        delay: 0.44 + idx * 0.1,
                      } satisfies Transition
                    }
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
                  </motion.a>
                );
              })}
            </div>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease, delay: 0.6 } satisfies Transition}
          className="mt-14 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {Profile.name}. Hak cipta dilindungi.
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-mariner-500 font-medium">Ikhlas</span> dan{" "}
            <span className="text-mariner-500 font-medium">Ihsan</span> dalam
            pelayanan
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
