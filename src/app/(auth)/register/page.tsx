'use client';

import { useState } from 'react';
import { signUp } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordsMatch = password === confirmPassword || confirmPassword === '';

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await signUp(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="bg-primary-600 p-3 rounded-2xl shadow-lg">
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader className="text-center pt-8 pb-2 border-none">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Crear Empresa
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Regístrate para comenzar a gestionar tu taller
                        </p>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                placeholder="tu@ejemplo.com"
                                required
                                autoComplete="email"
                            />

                            <Input
                                label="Contraseña"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <Input
                                label="Confirmar Contraseña"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={!passwordsMatch && confirmPassword !== '' ? 'border-red-500 focus:ring-red-500' : ''}
                            />

                            {!passwordsMatch && confirmPassword !== '' && (
                                <p className="text-xs text-red-500 -mt-3 animate-pulse">
                                    * Las contraseñas no coinciden
                                </p>
                            )}

                            <div className="flex items-center space-x-2 pb-2">
                                <input
                                    type="checkbox"
                                    id="showPassword"
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                />
                                <label
                                    htmlFor="showPassword"
                                    className="text-sm font-medium text-gray-600 cursor-pointer select-none"
                                >
                                    Mostrar contraseñas
                                </label>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700 font-medium">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all duration-200"
                                isLoading={isLoading}
                            >
                                {isLoading ? 'Registrando...' : 'Registrarse'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-gray-50 px-8 py-6 border-none text-center rounded-b-lg">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 underline-offset-4 hover:underline">
                                Inicia Sesión
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-xs">
                        © {new Date().getFullYear()} TH Empresarial. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
