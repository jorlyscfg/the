'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu,
    X,
    Home,
    ClipboardList,
    Users,
    Package,
    BarChart3,
    Settings,
    PlusCircle,
    QrCode,
    LogOut,
    User,
    Key,
    ChevronDown
} from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { obtenerUserInfo } from '@/app/actions';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';
import ProfileModal from '@/components/auth/ProfileModal';

interface NavbarProps {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    backHref?: string;
    userInfo?: {
        nombre: string;
        email?: string | null;
        rol?: string;
        empresa: { nombre: string };
        sucursal: { nombre: string };
    } | null;
}

export default function Navbar({
    title: propTitle,
    subtitle: propSubtitle,
    showBackButton = false,
    backHref = '/',
    userInfo: initialUserInfo,
}: NavbarProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<{
        nombre: string;
        email?: string | null;
        empresa: { nombre: string };
        sucursal: { nombre: string };
    } | null>(initialUserInfo || null);
    const pathname = usePathname();

    useScrollLock(isSidebarOpen);

    useEffect(() => {
        const fetchUserInfo = async () => {
            // Solo buscar si no se pasaron como props (por ejemplo en otras páginas)
            if (userInfo) return;

            const result = await obtenerUserInfo();
            if (result.success && result.user) {
                setUserInfo(result.user);
            }
        };
        fetchUserInfo();
    }, [userInfo]);

    const title = propTitle || 'Inicio';
    const subtitle = userInfo ? `${userInfo.empresa.nombre} - ${userInfo.sucursal.nombre}` : 'Cargando...';

    const menuItems = [
        {
            title: 'Inicio',
            href: '/',
            icon: Home,
        },
        {
            title: 'Escanear QR',
            href: '/scanner',
            icon: QrCode,
        },
        {
            title: 'Nueva Orden',
            href: '/ordenes/nueva',
            icon: PlusCircle,
        },
        {
            title: 'Órdenes',
            href: '/ordenes',
            icon: ClipboardList,
        },
        {
            title: 'Clientes',
            href: '/clientes',
            icon: Users,
        },
        {
            title: 'Equipos',
            href: '/equipos',
            icon: Package,
        },
        {
            title: 'Reportes',
            href: '/reportes',
            icon: BarChart3,
        },
        {
            title: 'Configuración',
            href: '/configuracion',
            icon: Settings,
        },
    ];

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname?.startsWith(href);
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Abrir menú"
                            >
                                <Menu className="w-6 h-6 text-gray-600" />
                            </button>

                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-primary-700 truncate max-w-[150px] sm:max-w-xs">
                                    {title}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block truncate max-w-xs">
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">
                                    {userInfo?.nombre || 'Cargando...'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {userInfo?.email || '...'}
                                </p>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                        <span className="text-primary-700 font-bold">
                                            {userInfo?.nombre ? userInfo.nombre.charAt(0).toUpperCase() : 'A'}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                                            <div className="px-4 py-3 border-b border-gray-50 mb-2">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {userInfo?.nombre}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {userInfo?.email}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <User className="w-4 h-4 text-gray-400" />
                                                Mi Perfil
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsChangePasswordOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Key className="w-4 h-4 text-gray-400" />
                                                Cambiar Contraseña
                                            </button>

                                            <div className="h-px bg-gray-100 my-2" />

                                            <form action={async () => {
                                                const { logout } = await import('@/app/(auth)/actions');
                                                await logout();
                                            }}>
                                                <button
                                                    type="submit"
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Cerrar Sesión
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm z-50 transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-primary-700 truncate max-w-[200px]">
                            {userInfo?.empresa.nombre || 'TH Empresarial'}
                        </h2>
                        <p className="text-xs text-gray-600">Menú Principal</p>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
                                    ? 'bg-primary-50 text-primary-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 px-4 py-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border border-white shadow-sm flex-shrink-0">
                            <span className="text-primary-700 font-bold">
                                {userInfo?.nombre ? userInfo.nombre.charAt(0).toUpperCase() : 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {userInfo?.nombre || 'Cargando...'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {userInfo?.email || '...'}
                            </p>
                        </div>
                    </div>
                    <form action={async () => {
                        const { logout } = await import('@/app/(auth)/actions');
                        await logout();
                    }}>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={userInfo as any}
            />
        </>
    );
}
