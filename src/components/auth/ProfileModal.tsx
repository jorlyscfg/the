'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
    User, Mail, Shield, Building2, MapPin, Phone,
    Calendar, BadgeCheck, Briefcase
} from 'lucide-react';
import { DataCardItem } from '@/components/ui/DataCard';

interface UserInfo {
    id: string;
    email?: string | null;
    nombre: string;
    rol: string;
    empresa: {
        nombre: string;
        razon_social?: string | null;
        rfc?: string | null;
        email?: string | null;
        telefono?: string | null;
    };
    sucursal: {
        nombre: string;
        direccion?: string | null;
        telefono?: string | null;
    };
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserInfo | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Perfil de Usuario">
            <div className="space-y-6 pt-2">
                {/* Cabecera de Perfil */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-white shadow-md mb-4 overflow-hidden relative group">
                        <span className="text-3xl font-black text-primary-700">
                            {user.nombre.charAt(0).toUpperCase()}
                        </span>
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{user.nombre}</h2>
                    <div className="flex items-center gap-1.5 mt-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {user.rol === 'admin' ? 'Administrador' : 'Técnico Especialista'}
                        </span>
                    </div>
                </div>

                {/* Grid de Información */}
                <div className="space-y-6">
                    {/* Información Personal */}
                    <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User className="w-3 h-3 text-primary-500" />
                            Información de Contacto
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataCardItem
                                label="Correo Electrónico"
                                value={user.email || 'No proporcionado'}
                                icon={Mail}
                                className="bg-white p-3 rounded-xl border border-gray-100"
                            />
                            <DataCardItem
                                label="Estado de Cuenta"
                                value="Activa"
                                icon={BadgeCheck}
                                className="bg-white p-3 rounded-xl border border-gray-100"
                                iconClassName="text-green-500"
                            />
                        </div>
                    </section>

                    {/* Información Laboral */}
                    <section className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-primary-500" />
                            Ubicación y Asignación
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <Building2 className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase underline-offset-4 mb-0.5">Empresa</p>
                                    <p className="text-sm font-bold text-gray-900">{user.empresa.nombre}</p>
                                    {user.empresa.rfc && (
                                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">RFC: {user.empresa.rfc}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <MapPin className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase underline-offset-4 mb-0.5">Sucursal</p>
                                    <p className="text-sm font-bold text-gray-900">{user.sucursal.nombre}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                                        {user.sucursal.direccion || 'Dirección no registrada'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <Phone className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase underline-offset-4 mb-0.5">Contacto Sucursal</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {user.sucursal.telefono || 'Sin teléfono registrado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </Modal>
    );
}
