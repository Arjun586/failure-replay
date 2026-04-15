// client/src/app/Landing.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TerminalSquare, ShieldAlert, GitMerge, ChevronRight, Activity, Zap, Server, Code, ArrowRight, Palette } from 'lucide-react';
import { useTheme } from '../core/context/theme';

// Manages the application-wide theme selection dropdown
function ThemeDropdown() {
    // Accesses global theme state and update functions
    const { theme, setTheme } = useTheme();
    
    return (
        <div className="relative group z-50">
            {/* Primary button to toggle the theme menu visibility */}
            <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface/50 border border-surfaceBorder hover:border-primary/50 transition-all text-muted hover:text-gray-100">
                <Palette size={18} />
            </button>
            {/* Animated dropdown list containing available theme options */}
            <div className="absolute right-0 top-full mt-2 w-40 bg-surface border border-surfaceBorder rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1.5">
                {[
                    { id: 'purple', label: 'Purple', color: 'bg-[#8b5cf6]' },
                    { id: 'blue', label: 'Ocean', color: 'bg-[#3b82f6]' },
                    { id: 'red', label: 'Crimson', color: 'bg-[#ef4444]' },
                    { id: 'gray', label: 'Gray', color: 'bg-[#d4d4d8]' },
                ].map(t => (
                    <button
                        key={t.id}
                        // Updates the application theme when a specific option is clicked
                        onClick={() => setTheme(t.id as any)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-300 hover:bg-surfaceBorder/50'}`}
                    >
                        <span className={`w-3 h-3 rounded-full ${t.color}`}></span>
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Renders a card with a dynamic radial spotlight effect that follows the mouse
function SpotlightCard({ children, className = "", solid = false }: { children: React.ReactNode, className?: string, solid?: boolean }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    // Updates the spotlight position based on mouse coordinates relative to the card
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden border border-glassBorder rounded-2xl transition-colors duration-300 ${solid ? 'bg-surface' : 'bg-glass backdrop-blur-glass'} ${className}`}
            whileHover={{ y: -5, borderColor: 'rgb(var(--primary) / 0.5)', boxShadow: '0 10px 30px -10px rgb(var(--primary) / 0.2)' }}
        >
            {/* The radial gradient layer that creates the spotlight visual */}
            <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-in-out"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgb(var(--primary) / 0.15), transparent 40%)`,
                }}
            />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

// The main landing page component containing the hero section, features, and marketing content
export default function Landing() {
    const [activeLog, setActiveLog] = useState(0);
    const { scrollYProgress } = useScroll();
    // Maps the scroll progress to a vertical offset for the hero section parallax effect
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);

    // Sets up a periodic interval to animate the simulated log terminal
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLog((prev) => (prev + 1) % 6);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    // Configuration for the primary platform feature descriptions
    const features = [
        { icon: Activity, title: 'Asynchronous Parsing', desc: 'Process 50MB+ log files in the background without blocking the Node.js event loop.' },
        { icon: GitMerge, title: 'Trace Stitching', desc: 'Reconstruct the exact path of failing requests across your entire microservice fleet.' },
        { icon: ShieldAlert, title: 'Automated Postmortems', desc: 'Generate copy-ready markdown reports from incident timelines instantly.' },
        { icon: Zap, title: 'Optimistic UI', desc: 'Lightning-fast navigation powered by Vite, React, and hardware-accelerated Framer Motion.' }
    ];

    // Data for the interactive terminal simulation on the landing page
    const logs = [
        { time: '10:00:15.241', level: 'INFO', text: '[gateway] System initialized on port 8080', color: 'text-blue-400' },
        { time: '10:00:22.019', level: 'WARN', text: '[auth-svc] High latency detected on DB-01', color: 'text-yellow-400' },
        { time: '10:00:34.882', level: 'ERROR', text: '[payment-svc] Connection timeout to Stripe API', color: 'text-red-400' },
        { time: '10:00:35.105', level: 'FATAL', text: '[payment-svc] Unhandled Promise Rejection. Process exiting.', color: 'text-red-500 font-bold' },
        { time: '10:01:02.000', level: 'SYSTEM', text: 'ReplayOS ingested 14,205 events.', color: 'text-primary' },
        { time: '10:01:03.450', level: 'SYSTEM', text: 'Visual timeline generated. Root cause identified.', color: 'text-green-400' }
    ];

    return (
        <div className="min-h-screen bg-background text-gray-100 overflow-x-hidden font-sans relative selection:bg-primary/30 transition-colors duration-500">
            
            {/* Background pattern and gradient decorations */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none transition-colors duration-500"></div>
            <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>

            {/* Sticky navigation header with branding and theme switcher */}
            <nav className="fixed top-0 left-0 right-0 w-full border-b border-glassBorder bg-surface/80 backdrop-blur-md z-50 shadow-sm transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg brand-logo group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(var(--primary),0.6)]">
                            <TerminalSquare size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-wide">Replay<span className="text-primary">OS</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeDropdown />
                        <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors ml-2">Sign In</Link>
                        <Link to="/register" className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-[0_0_20px_rgb(var(--primary)/0.4)] hover:-translate-y-0.5">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Main hero section featuring marketing copy and the terminal visual */}
            <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                <motion.div 
                    style={{ y: yHero }}
                    className="flex-1 text-center lg:text-left z-10"
                >
                    {/* Animated badge indicating platform status */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass backdrop-blur-md border border-primary/30 text-primary text-sm font-medium mb-6 cursor-default hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgb(var(--primary)/0.15)]"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        ReplayOS v1.0 is Live
                    </motion.div>
                    
                    {/* High-impact headline text */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-6xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.1]"
                    >
                        Stop Guessing.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gray-300">
                            Start Replaying.
                        </span>
                    </motion.h1>
                    
                    {/* Primary value proposition paragraph */}
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg lg:text-xl text-muted mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                    >
                        The enterprise-grade observability platform that ingests raw logs, reconstructs complex microservice failures, and generates playable timelines for instant root-cause analysis.
                    </motion.p>
                    
                    {/* Primary call-to-action links */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                    >
                        <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 shadow-[0_0_30px_rgb(var(--primary)/0.3)] hover:shadow-[0_0_40px_rgb(var(--primary)/0.6)]">
                            Start Investigating <ChevronRight size={18} />
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-glass backdrop-blur-glass border border-glassBorder hover:border-primary/50 text-white px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:text-primary shadow-lg">
                            <Code size={18} /> View Live Demo
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Simulated log terminal visualization component */}
                <motion.div 
                    initial={{ opacity: 0, rotateX: 20, y: 40 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ duration: 0.8, type: "spring" }}
                    className="flex-1 w-full max-w-2xl perspective-1000 z-10 group"
                >
                    <div className="bg-background/40 backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl relative overflow-hidden transform-gpu transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_50px_rgb(var(--primary)/0.2)] group-hover:-translate-y-2">
                        {/* Terminal window header */}
                        <div className="bg-glass border-b border-glassBorder px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors cursor-pointer"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors cursor-pointer"></div>
                            </div>
                            <div className="mx-auto text-xs text-muted font-mono flex items-center gap-2">
                                <Server size={12} /> production-cluster-01.log
                            </div>
                        </div>
                        
                        {/* Dynamic terminal line output area */}
                        <div className="p-6 h-[320px] overflow-hidden relative">
                            <div className="space-y-4 font-mono text-sm">
                                {logs.map((log, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        // Staggers the visibility of log lines based on the active log state
                                        animate={{ 
                                            opacity: i <= activeLog ? (i === activeLog ? 1 : 0.4) : 0, 
                                            x: i <= activeLog ? 0 : -20,
                                            y: i <= activeLog ? 0 : 10
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex gap-3 ${log.color}`}
                                    >
                                        <span className="text-muted/60 shrink-0">{log.time}</span>
                                        <span className="shrink-0 w-14 font-semibold">{log.level}</span>
                                        <span className="truncate">{log.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Floating metric badges for social proof */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
                        className="absolute -right-8 top-20 bg-glass backdrop-blur-glass border border-glassBorder px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 hover:scale-110 transition-transform cursor-default"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium">99.9% Uptime</span>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
                        className="absolute -left-12 bottom-20 bg-glass backdrop-blur-glass border border-glassBorder px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 hover:scale-110 transition-transform cursor-default"
                    >
                        <Zap size={16} className="text-yellow-400" />
                        <span className="text-sm font-medium">100k+ Events/sec</span>
                    </motion.div>
                </motion.div>
            </main>

            {/* How-it-works section with a visual process timeline */}
            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-3xl lg:text-5xl font-bold mb-4"
                        >
                            From Chaos to <span className="text-primary">Clarity</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="text-muted max-w-2xl mx-auto text-lg"
                        >
                            See exactly how ReplayOS transforms gigabytes of unreadable text into actionable intelligence.
                        </motion.p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
                        {/* Connecting line visual between process steps */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-surfaceBorder -z-10">
                            <motion.div 
                                initial={{ width: "0%" }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="h-full bg-primary shadow-[0_0_10px_rgb(var(--primary))]"
                            ></motion.div>
                        </div>

                        {/* Interactive cards detailing each step of the pipeline */}
                        {['1. Ingest Raw Logs', '2. Stitch Traces', '3. Visual Replay'].map((step, i) => (
                            <SpotlightCard key={i} solid={true} className="p-8 w-full md:w-[30%] text-center shadow-xl">
                                <div className="w-16 h-16 mx-auto bg-background border border-glassBorder rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgb(var(--primary)/0.15)] text-primary">
                                    {i === 0 ? <Server size={28} /> : i === 1 ? <GitMerge size={28} /> : <Activity size={28} />}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{step}</h3>
                                <p className="text-muted text-sm">
                                    {i === 0 && "Upload massive JSON/Text logs. Our decoupled architecture processes them instantly."}
                                    {i === 1 && "We correlate IDs to map how errors propagate across your distributed system."}
                                    {i === 2 && "Interact with a playable timeline to pinpoint the exact millisecond things went wrong."}
                                </p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grid display for platform features and capabilities */}
            <section className="py-24 relative z-10">
                <div className="absolute inset-0 bg-glass backdrop-blur-sm border-t border-b border-glassBorder z-0"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for scale. Designed for speed.</h2>
                        <p className="text-muted text-lg max-w-2xl">Everything you need to turn raw, noisy text logs into a clear narrative.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <SpotlightCard key={i} className="p-6 group cursor-default shadow-lg">
                                <div className="w-12 h-12 rounded-xl mb-6 theme-icon-box group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-300">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold mb-3 text-gray-100">{feature.title}</h3>
                                <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA section to drive new registrations */}
            <section className="py-32 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none transition-colors duration-500"></div>
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-extrabold mb-6"
                    >
                        Ready to unblock your engineering team?
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="text-xl text-muted mb-10"
                    >
                        Join forward-thinking developers who resolve incidents 10x faster.
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <Link to="/register" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-10 py-5 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgb(var(--primary)/0.4)]">
                            Create Free Workspace <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Global application footer with copyright and project meta info */}
            <footer className="border-t border-glassBorder bg-glass backdrop-blur-md py-8 text-center text-muted text-sm relative z-10 transition-colors duration-500">
                <p>© {new Date().getFullYear()} ReplayOS. Built for developers, by developers.</p>
            </footer>
        </div>
    );
}