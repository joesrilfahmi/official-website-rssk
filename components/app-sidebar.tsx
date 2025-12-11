'use client';

import * as React from 'react';
import {
    Building2,
    Home,
    Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

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

const menuItems = [
    {
        title: 'Dashboard',
        icon: Home,
        url: '/dashboard',
        access: ["administrator", "user"]
    },
    {
        title: 'Layanan Unggulan',
        icon: Home,
        url: '/layanan-unggulan',
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
                                <div className="bg-foreground text-background flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Hospital System</span>
                                    <span className="truncate text-xs">Management</span>
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