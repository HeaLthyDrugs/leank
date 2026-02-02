'use client';

import { useEffect, useState, useRef } from 'react';

interface LogoProps {
    /**
     * Size variant for the logo
     * - 'sm': 24px logo, good for headers/navbars
     * - 'md': 36px logo, good for cards/sections  
     * - 'lg': 48px logo, good for hero sections
     * - 'xl': 64px logo, good for landing pages
     */
    size?: 'sm' | 'md' | 'lg' | 'xl';

    /**
     * Whether to show the text alongside the logo
     */
    showText?: boolean;

    /**
     * Theme variant - determines which logo to use
     * - 'light': Black logo for light backgrounds (forced)
     * - 'dark': White logo for dark backgrounds (forced)
     * - 'auto': Automatically switches based on detected background color
     */
    variant?: 'light' | 'dark' | 'auto';

    /**
     * Additional CSS classes
     */
    className?: string;
}

const sizeConfig = {
    sm: { logo: 24, text: 'text-lg' },
    md: { logo: 36, text: 'text-2xl' },
    lg: { logo: 48, text: 'text-3xl' },
    xl: { logo: 64, text: 'text-5xl' },
};

// Check if a color is dark by calculating relative luminance
function isColorDark(color: string): boolean {
    // Parse RGB from color string
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    const [r, g, b] = rgb.map(Number);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5;
}

export function Logo({
    size = 'md',
    showText = true,
    variant = 'auto',
    className = ''
}: LogoProps) {
    const config = sizeConfig[size];
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDarkBackground, setIsDarkBackground] = useState(false);

    const blackLogo = '/logo/transparent-bg-leank-logo-black.png';
    const whiteLogo = '/logo/transparent-bg-leank-logo-white.jpg';

    // Detect background color changes (works with Dark Reader and similar extensions)
    useEffect(() => {
        if (variant !== 'auto') return;

        const checkBackground = () => {
            if (containerRef.current) {
                // Walk up the DOM to find the actual background color
                let element: HTMLElement | null = containerRef.current;
                let bgColor = 'rgb(255, 255, 255)'; // Default to white

                while (element) {
                    const computedBg = window.getComputedStyle(element).backgroundColor;
                    if (computedBg && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent') {
                        bgColor = computedBg;
                        break;
                    }
                    element = element.parentElement;
                }

                // Also check body as fallback
                if (bgColor === 'rgb(255, 255, 255)') {
                    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
                    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
                        bgColor = bodyBg;
                    }
                }

                setIsDarkBackground(isColorDark(bgColor));
            }
        };

        // Check immediately
        checkBackground();

        // Set up observer for style changes (catches Dark Reader modifications)
        const observer = new MutationObserver(checkBackground);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true
        });

        // Also check on system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkBackground);

        // Periodic check as fallback (for extensions that modify styles dynamically)
        const interval = setInterval(checkBackground, 1000);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', checkBackground);
            clearInterval(interval);
        };
    }, [variant]);

    // Determine which logo to show
    let showDarkVariant = false;
    if (variant === 'dark') {
        showDarkVariant = true;
    } else if (variant === 'auto') {
        showDarkVariant = isDarkBackground;
    }

    const logoSrc = showDarkVariant ? whiteLogo : blackLogo;
    const textColor = showDarkVariant ? 'text-white' : 'text-black';

    return (
        <div ref={containerRef} className={`inline-flex items-center gap-3 ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={logoSrc}
                alt="LeanK Logo"
                width={config.logo}
                height={config.logo}
                className="flex-shrink-0 object-contain"
            />
            {showText && (
                <span className={`font-black uppercase tracking-tighter ${config.text} ${textColor}`}>
                    LeanK
                </span>
            )}
        </div>
    );
}

