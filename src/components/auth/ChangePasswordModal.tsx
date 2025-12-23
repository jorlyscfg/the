'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cambiarPassword, logout } from '@/app/(auth)/actions';
import { useNotification } from '@/components/notifications/NotificationContext';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const { success, error: showError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const isMatch = form.newPassword === form.confirmPassword || form.confirmPassword === '';
    const isReady = form.currentPassword && form.newPassword && form.confirmPassword && isMatch && form.newPassword.length >= 6;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isReady) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('currentPassword', form.currentPassword);
        formData.append('newPassword', form.newPassword);

        try {
            const result = await cambiarPassword(formData);

            if (result.success) {
                success('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente. Se cerrará la sesión por seguridad.');
                // Esperar un momento para que el usuario lea la notificación
                setTimeout(async () => {
                    await logout();
                }, 2000);
            } else {
                showError('Error', result.error || 'No se pudo cambiar la contraseña');
                setIsLoading(false);
            }
        } catch (err) {
            showError('Error', 'Ocurrió un error inesperado al cambiar la contraseña');
            setIsLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 mb-2 border border-blue-100">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
                        Por razones de seguridad, al cambiar tu contraseña se cerrará la sesión automáticamente y deberás ingresar nuevamente con tus nuevas credenciales.
                    </p>
                </div>

                <Input
                    label="Contraseña Actual"
                    type={showPasswords ? "text" : "password"}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Tu contraseña actual"
                    required
                    icon={<Lock className="w-4 h-4" />}
                />

                <div className="h-px bg-gray-100 my-2" />

                <Input
                    label="Nueva Contraseña"
                    type={showPasswords ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    required
                    icon={<Lock className="w-4 h-4 text-primary-500" />}
                />

                <Input
                    label="Confirmar Nueva Contraseña"
                    type={showPasswords ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repite la nueva contraseña"
                    required
                    error={!isMatch ? "Las contraseñas no coinciden" : undefined}
                    icon={<Lock className="w-4 h-4 text-primary-500" />}
                />

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 hover:text-primary-600 transition-colors"
                    >
                        {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPasswords ? 'Ocultar contraseñas' : 'Ver contraseñas'}
                    </button>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-xl h-11"
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1 rounded-xl shadow-md h-11"
                        type="submit"
                        isLoading={isLoading}
                        disabled={!isReady}
                    >
                        Actualizar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
