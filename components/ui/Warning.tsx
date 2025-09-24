import React from 'react';
import Image from 'next/image';

interface WarningProps {
    message: string | React.ReactNode;
    className?: string;
}

export const Warning: React.FC<WarningProps> = ({ message, className = '' }) => {
    return (
        <div className={`flex w-full h-[52px] bg-primary-100 rounded-lg p-4 ${className} gap-2.5`}>
            <Image
                src="/icons/lightbulb-alt.png"
                alt="Warning icon"
                width={20}
                height={20}
                className="shrink-0"
            />
            <span className="text-sm/normal font-normal">{message}</span>
        </div>
    );
};