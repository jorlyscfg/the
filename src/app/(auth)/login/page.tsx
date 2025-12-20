'use client';

import { useState } from 'react';
import { login } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function LoginContent() {
    const searchParams = useSearchParams();
    const isRegistered = searchParams.get('registered') === 'true';
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await login(formData);

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
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader className="text-center pt-8 pb-2 border-none">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Bienvenido
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Ingresa tus credenciales para continuar
                        </p>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isRegistered && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 11V9h2v2H9zm0 4v-2h2v2H9z" />
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-green-700 font-medium">¡Cuenta creada con éxito! Por favor, inicia sesión para continuar.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                autoComplete="current-password"
                            />

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
                                    Mostrar contraseña
                                </label>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm animate-shake">
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
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-gray-50 px-8 py-6 border-none text-center rounded-b-lg">
                        <p className="text-sm text-gray-600">
                            ¿No tienes una cuenta?{' '}
                            <Link href="/register" className="text-primary-600 font-semibold hover:text-primary-700 underline-offset-4 hover:underline">
                                Regístrate aquí
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
