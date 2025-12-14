'use client';

import * as React from 'react';
import {
    LayoutDashboard,
    Tag,
    Newspaper,
    ClipboardList,
    Calendar,
    Star,
    Bed,
    MessageSquare,
    Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import { getCurrentUser } from '@/lib/auth';
import Profile from '@/config/profile';

const menuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        url: '/dashboard',
        access: ["administrator", "user"]
    },
    {
        title: 'Promo',
        icon: Tag,
        url: '/promo',
        access: ["administrator", "user"]
    },
    {
        title: 'Berita',
        icon: Newspaper,
        url: '/berita',
        access: ["administrator", "user"]
    },
    {
        title: 'Daftar Poli',
        icon: ClipboardList,
        url: '/daftar-poli',
        access: ["administrator", "user"]
    },
    {
        title: 'Jadwal Dokter',
        icon: Calendar,
        url: '/jadwal-dokter',
        access: ["administrator", "user"]
    },
    {
        title: 'Layanan Unggulan',
        icon: Star,
        url: '/layanan-unggulan',
        access: ["administrator", "user"]
    },
    {
        title: 'Kamar Inap',
        icon: Bed,
        url: '/kamar-inap',
        access: ["administrator", "user"]
    },
    {
        title: 'Kritik & Saran',
        icon: MessageSquare,
        url: '/kritik-saran',
        access: ["administrator", "user"]
    },
    {
        title: 'Users',
        icon: Users,
        url: '/users',
        access: ["administrator"]
    }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const user = getCurrentUser();
    const { setOpenMobile } = useSidebar();

    const userData = {
        name: user?.nama || 'User',
        email: user?.username || 'user@example.com',
        avatar: '/avatars/default.jpg',
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
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-white">
                                    <Image
                                        src={Profile.logo}
                                        alt={Profile.shortName}
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{Profile.shortName}</span>
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
                                .filter((item) => item.access.includes(user?.role || 'user'))
                                .map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                            onClick={handleMenuClick}
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
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