'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function DataCard({ children, className, onClick }: DataCardProps) {
    return (
        <Card
            className={cn(
                "transition-all duration-300 border border-gray-100 bg-white shadow-sm hover:shadow-md h-full flex flex-col",
                onClick && "cursor-pointer hover:border-primary-200",
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-0 flex flex-col h-full">
                {children}
            </CardContent>
        </Card>
    );
}

interface DataCardHeaderProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string | React.ReactNode;
    subtitleClassName?: string;
    titleClassName?: string;
    alignActions?: 'start' | 'center';
    actions?: React.ReactNode;
    className?: string;
}

export function DataCardHeader({
    icon,
    title,
    subtitle,
    subtitleClassName,
    titleClassName,
    alignActions = 'center',
    actions,
    className
}: DataCardHeaderProps) {
    return (
        <div className={cn(
            "px-3 py-1.5 flex justify-between border-b border-gray-50 bg-gray-50/20",
            alignActions === 'center' ? "items-center" : "items-start",
            className
        )}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && (
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 text-primary-600">
                        {icon}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className={cn("text-sm font-bold text-gray-900 truncate leading-tight uppercase", titleClassName)}>
                        {title}
                    </h3>
                    {subtitle && (
                        <div className={cn("text-[11px] text-gray-400 font-bold uppercase tracking-tight truncate", subtitleClassName)}>
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex gap-1 shrink-0 ml-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface DataCardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function DataCardContent({ children, className }: DataCardContentProps) {
    return (
        <div className={cn("px-3 py-2 flex-1 flex flex-col gap-2", className)}>
            {children}
        </div>
    );
}

interface DataCardItemProps {
    icon: LucideIcon;
    label?: string;
    value: string | React.ReactNode;
    className?: string;
    iconClassName?: string;
}

export function DataCardItem({ icon: Icon, label, value, className, iconClassName }: DataCardItemProps) {
    return (
        <div className={cn("flex items-center gap-2 text-sm text-gray-600", className)}>
            <div className={cn("p-1.5 bg-gray-50 rounded-lg shrink-0", iconClassName)}>
                <Icon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
                <span className="truncate block font-medium">{value}</span>
                {label && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block leading-none mt-0.5">{label}</span>}
            </div>
        </div>
    );
}

interface DataCardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function DataCardFooter({ children, className }: DataCardFooterProps) {
    return (
        <div className={cn("mt-auto pt-2 grid grid-cols-2 gap-2", className)}>
            {children}
        </div>
    );
}

interface DataCardStatProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    className?: string;
    variant?: 'primary' | 'default';
}

export function DataCardStat({ icon: Icon, label, value, className, variant = 'default' }: DataCardStatProps) {
    const isPrimary = variant === 'primary';

    return (
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg border",
            isPrimary
                ? "bg-primary-50/50 border-primary-100/20"
                : "bg-gray-50 border-gray-100/50",
            className
        )}>
            <div className={cn(
                "h-7 w-7 rounded flex items-center justify-center shadow-sm",
                isPrimary ? "bg-white text-primary-600" : "bg-white text-gray-400"
            )}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className={cn(
                    "text-sm font-black leading-none",
                    isPrimary ? "text-primary-900" : "text-gray-800"
                )}>
                    {value}
                </p>
                <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter mt-0.5",
                    isPrimary ? "text-primary-600" : "text-gray-400"
                )}>
                    {label}
                </p>
            </div>
        </div>
    );
}
