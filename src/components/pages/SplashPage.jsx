import React, { useEffect, useState } from 'react';
import splashBg from '../../assets/splash-bg.jpg';

const SplashPage = ({ onComplete }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Start exit sequence after 3.5 seconds
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onComplete, 800);
        }, 3500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-[#000814] flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${exiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
            {/* Main Content */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_#2e1065_0%,_#000814_100%)]">

                {/* Background Image (Subtle) */}
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
                    <img src={splashBg} alt="Background" className="w-full h-full object-cover" />
                </div>

                {/* Check Pattern / Circuit Background */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#7c3aed20_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed20_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_80%)]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 flex flex-col items-center scale-90 md:scale-100">

                    {/* Intel Logo Line */}
                    <div className="mb-2 animate-fade-in-up leading-none">
                        <span className="text-6xl md:text-8xl font-black text-white tracking-tighter">intel</span>
                    </div>

                    <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] via-white to-[#7c3aed] tracking-tighter mb-4 text-center leading-tight drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        SIV Gaming
                    </h1>

                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-[0.2em] uppercase mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        Performance Lab
                    </h2>

                    <p className="text-[#d946ef] font-mono text-lg md:text-xl tracking-[0.5em] uppercase animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        Precision. Power. Play.
                    </p>

                    {/* The "Dope" Loading Bar */}
                    <div className="mt-16 h-1 w-64 mx-auto bg-white/10 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] via-[#d946ef] to-[#00C7FD] animate-[loading_2s_ease-in-out_infinite]" />
                    </div>

                </div>

                {/* Blue/Purple Glows */}
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#7c3aed]/20 rounded-full blur-[150px] animate-pulse pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d946ef]/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />

            </div>
        </div>
    );
};

export default SplashPage;
