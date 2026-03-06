"use client";

import {
  Bed,
  Building2,
  Calendar,
  ChevronDown,
  Database,
  File,
  Folder,
  FolderTree,
  Form,
  Inbox,
  LayoutDashboard,
  LayoutList,
  MessageCircle,
  Newspaper,
  Printer,
  ShieldCheck,
  Stethoscope,
  Tag,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { NavUser } from "@/components/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Profile from "@/config/profile";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Promo",
    icon: Tag,
    url: "/promo",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Berita",
    icon: Newspaper,
    url: "/berita",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Kamar Inap",
    icon: Bed,
    url: "/kamar-inap",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Daftar Partner",
    icon: ShieldCheck,
    url: "/daftar-partner",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Jadwal Dokter",
    icon: Calendar,
    url: "/jadwal-dokter",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Layanan Unggulan",
    icon: FolderTree,
    url: "/layanan-unggulan",
    access: ["administrator", "user"] as UserRole[],
  },
  {
    title: "Formulir",
    icon: File,
    access: ["administrator", "user"] as UserRole[],
    subItems: [
      {
        title: "FMO Pembayaran Uang Muka",
        icon: Form,
        url: "/formulir/pembayaran-uang-muka",
        access: ["administrator", "user"] as UserRole[],
      },
    ],
  },
  {
    title: "Kritik & Saran",
    icon: MessageCircle,
    access: ["administrator", "user"] as UserRole[],
    subItems: [
      {
        title: "Pesan Masuk",
        icon: Inbox,
        url: "/kritik-saran",
        access: ["administrator", "user"] as UserRole[],
      },
      {
        title: "Cetak Laporan Kritikan",
        icon: Printer,
        url: "/cetak-kritik-saran",
        access: ["administrator", "user"] as UserRole[],
      },
    ],
  },
  {
    title: "Master Data",
    icon: Database,
    access: ["administrator", "user"] as UserRole[],
    subItems: [
      {
        title: "Daftar Poli Spesialis",
        icon: Stethoscope,
        url: "/daftar-poli",
        access: ["administrator", "user"] as UserRole[],
      },
      {
        title: "Daftar Kelas",
        icon: LayoutList,
        url: "/daftar-kelas",
        access: ["administrator", "user"] as UserRole[],
      },
      {
        title: "Daftar Kategori Berita",
        icon: FolderTree,
        url: "/daftar-kategori",
        access: ["administrator", "user"] as UserRole[],
      },
      {
        title: "Daftar Unit Kritikan",
        icon: Building2,
        url: "/unit-pelayanan",
        access: ["administrator", "user"] as UserRole[],
      },
    ],
  },
  {
    title: "Users",
    icon: Users,
    url: "/users",
    access: ["administrator"] as UserRole[],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = getCurrentUser();
  const { setOpenMobile } = useSidebar();

  const userData = {
    name: user?.nama || "User",
    email: user?.username || "user@example.com",
    avatar: "/avatars/default.jpg",
    role: (user?.role || "user") as UserRole,
  };

  const handleMenuClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="cursor-default">
                <div className="flex aspect-square size-8 items-center justify-center rounded-full overflow-hidden bg-white">
                  <Image
                    src={Profile.logo}
                    alt={Profile.shortName}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {Profile.shortName}
                  </span>
                  <span className="truncate text-xs">{Profile.subtitle}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => item.access.includes(user?.role || "user"))
                .map((item) => {
                  // Check if item has subItems (dropdown menu)
                  if (item.subItems) {
                    const isAnySubItemActive = item.subItems.some(
                      (subItem) => pathname === subItem.url,
                    );

                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isAnySubItemActive}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.url}
                                    onClick={handleMenuClick}
                                  >
                                    <Link href={subItem.url}>
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Regular menu item without dropdown
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        onClick={handleMenuClick}
                      >
                        <Link href={item.url!}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
