import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    mode?: 'fullscreen' | 'overlay' | 'inline';
    message?: string;
    subMessage?: string;
    className?: string;
}

export function Loading({
    mode = 'inline',
    message = 'Cargando...',
    subMessage,
    className
}: LoadingProps) {

    // Content inner component
    const LoadingContent = () => (
        <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="relative">
                <div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin relative z-10" />
            </div>
            {message && (
                <h3 className={cn(
                    "mt-4 font-semibold text-gray-900",
                    mode === 'inline' ? "text-sm" : "text-lg"
                )}>
                    {message}
                </h3>
            )}
            {subMessage && (
                <p className="mt-1 text-sm text-gray-500 max-w-xs">{subMessage}</p>
            )}
        </div>
    );

    // Render based on mode
    if (mode === 'fullscreen') {
        return (
            <div className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm",
                className
            )}>
                <LoadingContent />
            </div>
        );
    }

    if (mode === 'overlay') {
        return (
            <div className={cn(
                "absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-lg",
                className
            )}>
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <LoadingContent />
                </div>
            </div>
        );
    }

    // Inline mode
    return (
        <div className={cn("flex items-center justify-center w-full py-8", className)}>
            <LoadingContent />
        </div>
    );
}
