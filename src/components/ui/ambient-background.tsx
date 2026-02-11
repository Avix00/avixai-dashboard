'use client';

/**
 * Ambient Background - The "Deep Ocean" Effect
 * 
 * Creates 2-3 fixed gradient orbs that bleed through glass cards.
 * Colors: Sapphire Blue (#1E40AF / #2563EB / #3B82F6)
 * Opacity: 5-10%
 * Blur: Extreme (150px)
 * No Pink/Purple - Deep Ocean / Night Sky feel
 */
export function AmbientBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]" aria-hidden="true">
            {/* Top-Right Deep Blue Orb */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                    top: '-10%',
                    right: '-5%',
                    background: 'radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%)',
                    filter: 'blur(150px)',
                }}
            />

            {/* Center-Left Royal Blue Orb */}
            <div
                className="absolute w-[800px] h-[800px] rounded-full"
                style={{
                    top: '30%',
                    left: '-15%',
                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
                    filter: 'blur(150px)',
                }}
            />

            {/* Bottom-Right Electric Blue Orb */}
            <div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    bottom: '-10%',
                    right: '10%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                    filter: 'blur(150px)',
                }}
            />
        </div>
    );
}
