import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Compass, Gamepad2, FerrisWheel, BookOpen, 
  GraduationCap, Map as MapIcon, Users, Briefcase, 
  Globe, Star, Menu, X, ChevronRight, Trophy, Zap,
  MessageCircle, Send, Plus, Search, Lock, Calendar,
  Twitter, Facebook, Linkedin, Share2, MessageSquare,
  User, Bookmark, CheckCircle2, Award, Eye, Info, Bot, ArrowLeft,
  Sun, Moon
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { UserProfile, Exam, Review, Career, Mentor } from './types';
import type { Badge } from './types';
import { QUIZ_QUESTIONS, CAREERS, EXAMS, TRANSLATIONS, BADGES, MENTORS } from './constants';
import { getQuizAnalysis, getChatResponseStream, getTextToSpeech } from './services/gemini';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, getDocs,
  handleFirestoreError, OperationType
} from './firebase';
import MentorOnboarding from './components/MentorOnboarding';

import { UserProgressCharts } from './components/UserProgressCharts';
import { ThemeContext, useTheme } from './context/ThemeContext';

// --- Theme Logic ---

const getThemeConfig = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const date = now.getDate();

  // Halloween / Horror (Oct 25 - Oct 31)
  if (month === 9 && date >= 25) return { 
    name: "Halloween", 
    color: "from-orange-900 via-purple-900 to-black", 
    quote: "Face your career fears... if you dare!", 
    icon: "👻",
    type: 'horror'
  };

  // Festivals (2026)
  if (month === 2 && date === 14) return { name: "Holi", color: "from-pink-500 via-yellow-500 to-blue-500", quote: "Spread colors of joy and success!", icon: "🎨", type: 'festival' };
  if (month === 2 && date === 27) return { name: "Ram Navami", color: "from-orange-500 to-yellow-500", quote: "May Lord Ram guide your career path.", icon: "🏹", type: 'festival' };
  if (month === 3 && date === 2) return { name: "Hanuman Jayanti", color: "from-orange-600 to-red-600", quote: "Strength and wisdom to achieve your goals.", icon: "🏹", type: 'festival' };
  if (month === 3 && date === 5) return { name: "Easter Sunday", color: "from-blue-400 via-pink-300 to-yellow-200", quote: "A new beginning for your career journey!", icon: "🥚", type: 'festival' };
  if (month === 3 && date === 13) return { name: "Vaisakhi", color: "from-orange-500 to-yellow-600", quote: "Harvest the fruits of your hard work!", icon: "🌾", type: 'festival' };
  if (month === 3 && date === 14) return { name: "Ambedkar Jayanti", color: "from-blue-700 to-blue-900", quote: "Educate, Agitate, Organize for success.", icon: "⚖️", type: 'festival' };
  if (month === 4 && date === 1) return { name: "Maharashtra Day", color: "from-orange-500 to-red-600", quote: "Celebrating the spirit of hard work and progress.", icon: "🚩", type: 'festival' };
  if (month === 4 && date === 22) return { name: "Buddha Purnima", color: "from-yellow-200 to-yellow-500", quote: "Peace and wisdom on your career path.", icon: "☸️", type: 'festival' };
  if (month === 10 && date === 8) return { name: "Diwali", color: "from-yellow-400 via-orange-500 to-red-500", quote: "Light up your future with knowledge.", icon: "🪔", type: 'festival' };
  if (month === 11 && date === 25) return { name: "Christmas", color: "from-red-600 to-green-600", quote: "Merry Christmas! Gift yourself a great career.", icon: "🎄", type: 'festival' };

  // Seasons
  if (month >= 2 && month <= 5) return { 
    name: "Summer", 
    color: "from-yellow-400 to-orange-500", 
    quote: "Shine bright like the summer sun!", 
    icon: "☀️",
    type: 'summer'
  };
  if (month >= 6 && month <= 8) return { name: "Monsoon", color: "from-blue-400 to-indigo-600", quote: "Let your skills rain down success.", icon: "🌧️" };
  if (month >= 10 || month <= 1) return { name: "Winter", color: "from-blue-100 to-blue-300", quote: "Stay cool and focused on your goals.", icon: "❄️" };

  return { name: "Planet Journey", color: "from-blue-900 via-purple-900 to-black", quote: "Exploring the vast universe of careers.", icon: "🪐", type: 'planet' };
};

const AnimatedBackground = ({ theme }: { theme: any }) => {
  const { darkMode } = useTheme();
  const isFestival = theme.type === 'festival';
  const isHorror = theme.type === 'horror';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={cn(
      "fixed inset-0 z-0 overflow-hidden transition-colors duration-1000",
      darkMode ? "bg-[#020617]" : "bg-blue-50/30"
    )}>
      {/* Animated Gradient Orbs */}
      <motion.div 
        animate={{ 
          x: mousePos.x * 1.5,
          y: mousePos.y * 1.5,
        }}
        className={cn(
          "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000",
          darkMode ? "bg-blue-600/10" : "bg-blue-400/20"
        )}
      />
      <motion.div 
        animate={{ 
          x: -mousePos.x * 2,
          y: -mousePos.y * 2,
        }}
        className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000",
          darkMode ? "bg-purple-600/10" : "bg-purple-400/20"
        )}
      />

      {/* 3D Floating Glass Elements */}
      <div className="absolute inset-0 perspective-1000">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%', 
              z: Math.random() * -800,
              rotateX: Math.random() * 360,
              rotateY: Math.random() * 360,
              opacity: 0 
            }}
            animate={{ 
              y: [null, '-=150', '+=150'],
              rotateX: [null, '+=360'],
              rotateY: [null, '+=360'],
              opacity: [0, 0.2, 0],
              x: [null, `+=${mousePos.x * (i % 3 + 1)}`],
            }}
            transition={{ 
              duration: Math.random() * 15 + 15, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-24 h-24 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-[2px] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
          />
        ))}
      </div>

      {/* Festival Overlay */}
      {isFestival && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn("absolute inset-0 bg-gradient-to-br opacity-30 mix-blend-overlay", theme.color)}
        />
      )}

      {/* Horror Overlay */}
      {isHorror && (
        <div className="absolute inset-0 bg-red-950/40 mix-blend-multiply" />
      )}

      {/* Luxury Noise/Grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      {/* Subtle Grid */}
      <div className={cn(
        "absolute inset-0 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transition-opacity duration-1000",
        darkMode 
          ? "bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" 
          : "bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)]"
      )} />
    </div>
  );
};

const ScrollingTicker = () => {
  const { darkMode } = useTheme();
  return (
    <div className={cn(
      "w-full backdrop-blur-md border-y overflow-hidden py-2 mb-6 transition-all duration-300",
      darkMode ? "bg-blue-600/20 border-blue-500/30" : "bg-blue-50/50 border-blue-100"
    )}>
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={cn(
          "flex whitespace-nowrap gap-12 text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-300",
          darkMode ? "text-blue-400" : "text-blue-600"
        )}
      >
        {[...Array(10)].map((_, i) => (
          <span key={i}>🚀 Let's work for the future • Discover your potential • CareerQuest 2026 • Build your legacy</span>
        ))}
      </motion.div>
    </div>
  );
};

const Globe3D = () => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 perspective-1000">
      {/* Outer Atmosphere Glow */}
      <div className="absolute inset-[-20%] bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full rounded-full border-2 border-blue-500/40 relative preserve-3d shadow-[0_0_50px_rgba(59,130,246,0.2)]"
      >
        {/* Latitudes */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={`lat-${i}`}
            className="absolute inset-0 border border-blue-400/30 rounded-full"
            style={{ transform: `rotateX(${i * 22.5}deg)` }}
          />
        ))}
        {/* Longitudes */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={`long-${i}`}
            className="absolute inset-0 border border-blue-400/30 rounded-full"
            style={{ transform: `rotateY(${i * 22.5}deg)` }}
          />
        ))}
        
        {/* 3D Scanning Effect - Multi-layer Radar */}
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute inset-[-5%] rounded-full border-t-4 border-blue-400/60 shadow-[0_-15px_30px_rgba(96,165,250,0.5)]"
        />
        
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[10%] rounded-full border-b-2 border-cyan-400/40 shadow-[0_10px_20px_rgba(34,211,238,0.3)]"
        />

        {/* Scanning Effect - Vertical Laser Bar */}
        <motion.div 
          animate={{ top: ['-10%', '110%', '-10%'], opacity: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-10%] right-[-10%] h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_25px_rgba(34,211,238,1)] z-10"
        />

        {/* Core Energy Sphere */}
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 bg-gradient-to-br from-blue-400 to-indigo-600 blur-2xl rounded-full" 
        />
        
        {/* Inner Solid Core */}
        <div className="absolute inset-12 bg-blue-500/20 rounded-full border border-blue-400/50 backdrop-blur-sm" />
      </motion.div>
    </div>
  );
};

const Card3D = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      animate={{ 
        rotateX: rotate.x, 
        rotateY: rotate.y,
        scale: isHovered ? 1.02 : 1,
        z: isHovered ? 50 : 0
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("perspective-1000 preserve-3d cursor-pointer", className)}
    >
      <div className="preserve-3d shadow-2xl rounded-[40px] h-full">
        {children}
      </div>
    </motion.div>
  );
};

const SearchBar = ({ lang, darkMode }: { lang: string, darkMode: boolean }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Career[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  useEffect(() => {
    if (query.length > 1) {
      const filtered = CAREERS.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  return (
    <div className="relative flex-1 max-w-xs mx-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search_placeholder}
          className={cn(
            "w-full rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
            darkMode 
              ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-500" 
              : "bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400"
          )}
          onFocus={() => query.length > 1 && setIsOpen(true)}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto",
                darkMode ? "bg-gray-900 border-white/10" : "bg-white border-gray-100"
              )}
            >
              {results.length > 0 ? (
                results.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      navigate(`/explorer/${c.category.toLowerCase()}`);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors border-b last:border-0",
                      darkMode 
                        ? "hover:bg-white/5 border-white/5" 
                        : "hover:bg-blue-50 border-gray-50"
                    )}
                  >
                    <p className={cn("font-bold text-sm", darkMode ? "text-white" : "text-gray-900")}>{c.title}</p>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">{c.category}</p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">{t.no_results}</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
      <Compass className="text-white w-6 h-6 animate-pulse" />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
    </div>
    <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-orange-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
      CareerQuest
    </span>
  </div>
);

const XPBadge = ({ xp, isPremium, darkMode }: { xp: number, isPremium?: boolean, darkMode: boolean }) => (
  <div className="flex items-center gap-2">
    {isPremium && (
      <div className="bg-yellow-400 p-1.5 rounded-lg shadow-lg shadow-yellow-500/20 animate-pulse">
        <Star className="w-3 h-3 text-white fill-white" />
      </div>
    )}
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm border transition-all",
      darkMode 
        ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" 
        : "bg-yellow-100 text-yellow-700 border-yellow-200"
    )}>
      <Star className={cn("w-4 h-4", darkMode ? "fill-yellow-400" : "fill-yellow-500")} />
      <span>{xp} XP</span>
    </div>
  </div>
);

const LevelUpNotification = ({ level, onComplete }: { level: number, onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 1.5, rotate: 10 }}
      onAnimationComplete={() => setTimeout(onComplete, 4000)}
      className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-[60px] p-12 shadow-2xl border-4 border-blue-500 text-center relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
        />
        <div className="relative">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            🚀
          </motion.div>
          <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter">LEVEL UP!</h2>
          <p className="text-2xl font-black text-blue-600 uppercase tracking-widest">You reached Level {level}</p>
          <div className="mt-8 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ delay: i * 0.1, duration: 1, repeat: Infinity }}
                className="w-3 h-3 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BadgeNotification = ({ badgeId, onComplete }: { badgeId: string, onComplete: () => void }) => {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      onAnimationComplete={() => setTimeout(onComplete, 3000)}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-3xl shadow-2xl border-2 border-yellow-400 p-6 flex items-center gap-6 min-w-[320px]"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-bounce">
        {badge.icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">New Badge Earned!</p>
        <h4 className="text-xl font-black text-gray-900">{badge.name}</h4>
        <p className="text-sm text-gray-500 font-medium">{badge.description}</p>
      </div>
    </motion.div>
  );
};

const BadgeDisplay = ({ badgeId, size = "md" }: { badgeId: string, size?: "sm" | "md" | "lg", key?: string }) => {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return null;

  const sizes = {
    sm: "w-8 h-8 text-sm p-1",
    md: "w-12 h-12 text-xl p-2",
    lg: "w-20 h-20 text-3xl p-4"
  };

  return (
    <div className={cn(
      "rounded-2xl flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 shadow-sm group relative",
      sizes[size]
    )}>
      <span className="group-hover:scale-125 transition-transform duration-300">{badge.icon}</span>
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
        <p className="font-bold">{badge.name}</p>
        <p className="text-[8px] opacity-70">{badge.description}</p>
      </div>
    </div>
  );
};

const SmallCard = ({ icon: Icon, title, to, color, isLocked }: any) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  return (
    <Card3D 
      onClick={() => !isLocked && navigate(to)}
      className={cn(
        "relative flex flex-col items-center gap-3 transition-all group h-full",
        isLocked ? "opacity-60" : ""
      )}
    >
      <div className={cn(
        "p-6 rounded-[32px] flex flex-col items-center gap-3 transition-all border shadow-sm h-full w-full backdrop-blur-md",
        darkMode 
          ? (isLocked ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20 hover:border-blue-500/50 hover:bg-white/[0.15]")
          : (isLocked ? "bg-gray-100 border-gray-200" : "bg-white border-gray-200 hover:border-blue-500/50 hover:bg-gray-50 shadow-lg shadow-gray-200/50")
      )}>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
          isLocked ? (darkMode ? "bg-white/5 text-gray-500" : "bg-gray-200 text-gray-400") : (color ? color.replace('bg-', 'bg-opacity-20 text-').replace('50', '400') : "bg-blue-500/20 text-blue-400")
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest text-center group-hover:text-blue-400 transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{title}</span>
        {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
      </div>
    </Card3D>
  );
};

const Card = ({ title, icon: Icon, color, onClick, description, isLocked = false }: any) => {
  const { darkMode } = useTheme();
  return (
    <Card3D
      onClick={onClick}
      className={cn(
        "relative w-full transition-all group h-full",
        isLocked ? "opacity-75" : ""
      )}
    >
      <div className={cn(
        "p-8 rounded-[40px] text-left transition-all overflow-hidden border shadow-2xl h-full w-full backdrop-blur-xl",
        darkMode 
          ? (isLocked ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20 hover:border-blue-500/50 hover:bg-white/[0.15]")
          : (isLocked ? "bg-gray-100 border-gray-200" : "bg-white border-gray-200 hover:border-blue-500/50 hover:bg-gray-50 shadow-xl shadow-gray-200/50")
      )}>
        <div className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6",
          isLocked ? (darkMode ? "bg-white/5" : "bg-gray-200") : (color ? color.replace('bg-', 'bg-opacity-20 text-').replace('50', '400') : "bg-blue-500/20 text-blue-400")
        )}>
          <Icon className={cn("w-8 h-8", isLocked ? "text-gray-600" : "")} />
        </div>
        <h3 className={cn(
          "font-black text-2xl mb-3 tracking-tight group-hover:text-blue-400 transition-colors",
          darkMode ? "text-white" : "text-gray-900"
        )}>{title}</h3>
        <p className={cn(
          "text-sm leading-relaxed font-medium transition-colors duration-300",
          darkMode ? "text-gray-400" : "text-gray-600"
        )}>{description}</p>
        {isLocked && (
          <div className="absolute top-8 right-8 bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
            Premium
          </div>
        )}
        {!isLocked && (
          <div className={cn(
            "absolute bottom-8 right-8 w-12 h-12 rounded-full flex items-center justify-center border shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1",
            darkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
          )}>
            <ChevronRight className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card3D>
  );
};

// --- Pages ---

const Onboarding = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const { darkMode } = useTheme();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('English');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [formData, setFormData] = useState({ 
    name: '', 
    class: '', 
    age: '', 
    country: 'India',
    interests: [] as string[],
    hobbies: [] as string[],
    strengths: [] as string[]
  });

  const [isSearching, setIsSearching] = useState(false);

  const handleAISearch = async () => {
    setIsSearching(true);
    const query = step === 3 ? 'interests' : step === 4 ? 'hobbies' : 'strengths';
    try {
      const response = await getChatResponseStream(`Suggest 5 popular ${query} for a student in ${formData.class}. Provide only a comma-separated list of items. No extra text.`, [], undefined, lang);
      let fullText = "";
      for await (const chunk of response) {
        fullText += chunk;
      }
      const suggestions = fullText.split(',').map(s => s.trim().replace(/[.\n]/g, ''));
      const field = step === 3 ? 'interests' : step === 4 ? 'hobbies' : 'strengths';
      setFormData(prev => ({
        ...prev,
        [field]: Array.from(new Set([...(prev[field as keyof typeof prev] as string[]), ...suggestions]))
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const next = () => {
    if (step < 5) setStep(step + 1);
    else onComplete({ ...formData, lang });
  };

  const toggleItem = (field: 'interests' | 'hobbies' | 'strengths', item: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const INTERESTS = ['Technology', 'Arts', 'Science', 'Business', 'Social', 'Healthcare', 'Law', 'Design'];
  const HOBBIES = ['Reading', 'Gaming', 'Sports', 'Music', 'Coding', 'Painting', 'Writing', 'Traveling'];
  const STRENGTHS = ['Logic', 'Creativity', 'Empathy', 'Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Organization'];

  const isStepValid = () => {
    if (step === 0) return formData.name.length > 0;
    if (step === 1) return formData.class.length > 0;
    if (step === 2) return formData.age.length > 0;
    if (step === 3) return formData.interests.length > 0;
    if (step === 4) return formData.hobbies.length > 0;
    if (step === 5) return formData.strengths.length > 0;
    return false;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col p-8 overflow-y-auto font-sans selection:bg-blue-500 transition-colors duration-500",
      darkMode ? "bg-[#020617] text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Dark Luxury Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-12">
        <div className="flex justify-between items-center mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Logo />
          </motion.div>
          <motion.select 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            value={lang} 
            onChange={e => setLang(e.target.value)}
            className="text-xs font-black bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none hover:bg-white/10 transition-all cursor-pointer text-white appearance-none shadow-xl"
          >
            {['English', 'Hindi', 'Gujarati', 'Marathi', 'Bengali', 'French', 'German'].map(l => (
              <option key={l} value={l} className="bg-gray-900 text-white">{l}</option>
            ))}
          </motion.select>
        </div>
        
        {/* Progress Bar - Classic Style */}
        <div className="mt-8 flex gap-2">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={cn(
                  "h-full transition-all duration-500",
                  i <= step ? "bg-blue-600" : "bg-transparent"
                )} 
              />
            </div>
          ))}
        </div>

        <div className="mt-12 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {step === 0 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_name}
                  </h1>
                  <p className="text-gray-400 mb-8 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_name_desc}</p>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder={t.onboarding_name_placeholder}
                      className="w-full p-6 bg-white border-2 border-blue-100 rounded-[32px] text-2xl font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300 shadow-xl"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                    />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_class}
                  </h1>
                  <p className="text-gray-400 mb-8 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_class_desc}</p>
                  <div className="grid gap-4">
                    {['Class 8-10', 'Class 11-12', 'College/Degree'].map(c => (
                      <motion.button
                        key={c}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData({ ...formData, class: c })}
                        className={cn(
                          "p-6 rounded-[32px] border-2 text-left font-black transition-all relative overflow-hidden group",
                          formData.class === c 
                            ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" 
                            : "bg-white border-blue-50 text-gray-900 hover:border-blue-200 shadow-sm"
                        )}
                      >
                        <span className="relative z-10">{c}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_age}
                  </h1>
                  <p className="text-gray-400 mb-8 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_age_desc}</p>
                  <div className="relative group">
                    <input 
                      type="number" 
                      placeholder={t.onboarding_age_placeholder}
                      className="w-full p-6 bg-white border-2 border-blue-100 rounded-[32px] text-2xl font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300 shadow-xl"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      autoFocus
                    />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_interests}
                  </h1>
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_interests_desc}</p>
                    <button 
                      onClick={handleAISearch}
                      disabled={isSearching}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
                    >
                      <Bot className={cn("w-4 h-4", isSearching && "animate-spin")} />
                      {isSearching ? "Searching..." : "AI Suggest"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {INTERESTS.map(item => (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleItem('interests', item)}
                        className={cn(
                          "p-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all",
                          formData.interests.includes(item) 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_hobbies}
                  </h1>
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_hobbies_desc}</p>
                    <button 
                      onClick={handleAISearch}
                      disabled={isSearching}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
                    >
                      <Bot className={cn("w-4 h-4", isSearching && "animate-spin")} />
                      {isSearching ? "Searching..." : "AI Suggest"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {HOBBIES.map(item => (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleItem('hobbies', item)}
                        className={cn(
                          "p-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all",
                          formData.hobbies.includes(item) 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {step === 5 && (
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                    {t.onboarding_strengths}
                  </h1>
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest opacity-80">{t.onboarding_strengths_desc}</p>
                    <button 
                      onClick={handleAISearch}
                      disabled={isSearching}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
                    >
                      <Bot className={cn("w-4 h-4", isSearching && "animate-spin")} />
                      {isSearching ? "Searching..." : "AI Suggest"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {STRENGTHS.map(item => (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleItem('strengths', item)}
                        className={cn(
                          "p-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all",
                          formData.strengths.includes(item) 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(59,130,246,0.4)" }}
          whileTap={{ scale: 0.98 }}
          onClick={next}
          disabled={!isStepValid()}
          className={cn(
            "mt-12 w-full p-6 rounded-[32px] font-black text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group",
            isStepValid() 
              ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {step === 5 ? "Initialize System" : "Next Phase"}
          <ChevronRight className={cn("w-6 h-6 transition-transform group-hover:translate-x-1", !isStepValid() && "opacity-20")} />
        </motion.button>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, lang }: { isOpen: boolean, onClose: () => void, onPaymentSuccess: () => void, lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    
    // Simulate a successful payment after 2 seconds
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "rounded-[40px] w-full max-w-md p-8 relative shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide transition-colors duration-300",
          darkMode ? "bg-[#020617] border border-white/10" : "bg-white"
        )}
      >
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-colors duration-300",
          darkMode ? "bg-blue-900/20" : "bg-blue-50"
        )} />
        
        <button 
          onClick={onClose} 
          className={cn(
            "absolute top-6 right-6 p-2 rounded-full transition-colors",
            darkMode ? "hover:bg-white/10 text-gray-500" : "hover:bg-gray-100 text-gray-400"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300",
            darkMode ? "bg-blue-900/40" : "bg-blue-100"
          )}>
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className={cn(
            "text-2xl font-black transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{t.mentorship_upgrade}</h2>
          <p className={cn(
            "text-sm mt-2 font-medium transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>{t.mentorship_upgrade_desc}</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className={cn(
            "p-4 rounded-2xl border mb-4 flex items-center justify-between transition-colors duration-300",
            darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-100"
          )}>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pricing</p>
              <p className={cn(
                "text-xl font-black transition-colors duration-300",
                darkMode ? "text-blue-400" : "text-blue-900"
              )}>₹99 <span className="text-xs font-bold opacity-60">/ month</span></p>
            </div>
            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              Best Value
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.mentorship_payment_methods}</p>
          {[
            { id: 'phonepe', name: t.mentorship_phonepe, icon: '📱' },
            { id: 'gpay', name: t.mentorship_gpay, icon: '💰' },
            { id: 'upi', name: t.mentorship_upi, icon: '⚡' },
            { id: 'card', name: t.mentorship_card, icon: '💳' }
          ].map(method => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                "w-full p-4 rounded-2xl border flex items-center gap-4 transition-all",
                selectedMethod === method.id 
                  ? (darkMode ? "bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-900/20" : "bg-blue-50 border-blue-500 shadow-sm") 
                  : (darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/30" : "bg-white border-gray-100 hover:border-blue-200")
              )}
            >
              <span className="text-2xl">{method.icon}</span>
              <span className={cn(
                "font-bold transition-colors duration-300",
                selectedMethod === method.id 
                  ? (darkMode ? "text-blue-400" : "text-blue-700") 
                  : (darkMode ? "text-gray-400" : "text-gray-700")
              )}>{method.name}</span>
              {selectedMethod === method.id && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
            </button>
          ))}
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all",
            selectedMethod && !isProcessing ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200 cursor-not-allowed"
          )}
        >
          {isProcessing ? "Processing..." : t.mentorship_pay_now}
        </button>
      </motion.div>
    </div>
  );
};

const BookingModal = ({ isOpen, onClose, mentor, onBookingSuccess, lang }: { isOpen: boolean, onClose: () => void, mentor: Mentor | null, onBookingSuccess: (date: string, time: string) => void, lang: string }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !mentor) return null;

  const dates = [
    { day: 'Mon', date: '23', month: 'Mar' },
    { day: 'Tue', date: '24', month: 'Mar' },
    { day: 'Wed', date: '25', month: 'Mar' },
    { day: 'Thu', date: '26', month: 'Mar' },
    { day: 'Fri', date: '27', month: 'Mar' },
  ];

  const times = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onBookingSuccess(selectedDate, selectedTime);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-md p-8 relative shadow-2xl overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t.mentorship_book_session}</h2>
          <p className="text-gray-500 text-sm">with <span className="text-blue-600 font-bold">{mentor.name}</span></p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.mentorship_select_date}</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((d, i) => {
                const dateStr = `${d.date} ${d.month}`;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all",
                      selectedDate === dateStr ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase mb-1">{d.day}</span>
                    <span className="text-lg font-black">{d.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.mentorship_select_time}</p>
            <div className="grid grid-cols-3 gap-2">
              {times.map((time, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "py-3 rounded-xl border text-xs font-bold transition-all",
                    selectedTime === time ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || isProcessing}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all",
            selectedDate && selectedTime && !isProcessing ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200 cursor-not-allowed"
          )}
        >
          {isProcessing ? "Booking..." : t.mentorship_confirm_booking}
        </button>
      </motion.div>
    </div>
  );
};

const MentorChatModal = ({ isOpen, onClose, mentor, lang, mode, onLiveChatComplete }: { 
  isOpen: boolean, 
  onClose: () => void, 
  mentor: Mentor | null, 
  lang: string,
  mode: 'AI' | 'LIVE',
  onLiveChatComplete?: (mentorId: string) => void
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && mentor && messages.length === 0) {
      const welcomeText = mode === 'AI' 
        ? `Hello! I'm ${mentor.name}'s AI assistant. I can help you with career advice based on ${mentor.name}'s expertise in ${mentor.expertise.join(', ')}.`
        : `Hi! I'm ${mentor.name}. Thanks for reaching out! I've accepted your request and I'm happy to chat with you live. What's on your mind?`;
      
      setMessages([{
        role: 'model',
        text: welcomeText
      }]);
    }
  }, [isOpen, mentor, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen || !mentor) return null;

  const handleClose = () => {
    if (mode === 'LIVE') {
      onLiveChatComplete?.(mentor.id);
    }
    onClose();
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      let systemInstruction = "";
      if (mode === 'AI') {
        systemInstruction = `You are ${mentor.name}'s AI assistant, a ${mentor.role} at ${mentor.company}. 
        Your expertise includes: ${mentor.expertise.join(', ')}. 
        Your bio is: ${mentor.bio}. 
        Answer the student's questions in a helpful, professional, and encouraging way. 
        Keep your responses concise and focused on career advice. Mention that you are an AI assistant if asked.`;
      } else {
        systemInstruction = `You are ${mentor.name} himself/herself, a ${mentor.role} at ${mentor.company}. 
        You are now in a LIVE chat with a student. 
        IMPORTANT: Talk in "Hinglish" (a mix of Hindi and English). Use common Indian conversational fillers like "yaar", "achha", "bilkul", "samajh gaye?".
        Be very conversational, friendly, and use a more personal tone than an AI. 
        Use phrases like "Mere experience mein ${mentor.company} mein..." or "Jab maine start kiya tha...". 
        Keep responses relatively short as if texting on WhatsApp. 
        Do NOT mention you are an AI. Act as the real person. If the student asks something complex, explain it simply in Hinglish.`;
      }

      const stream = await getChatResponseStream(userMessage, [], systemInstruction);
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: fullResponse }];
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-2xl h-[calc(100vh-4rem)] md:h-[80vh] max-h-[800px] flex flex-col relative shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={mentor.image} alt={mentor.name} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                mode === 'AI' ? "bg-blue-500" : "bg-emerald-500"
              )} />
            </div>
            <div>
              <h3 className="font-black text-gray-900">{mentor.name}</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                  mode === 'AI' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {mode === 'AI' ? 'AI Assistant' : 'Live Session'}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", mode === 'AI' ? "bg-blue-400" : "bg-emerald-400")} />
                  Online
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center"
            aria-label="Close chat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
          {messages.map((msg, i) => (
            <div key={`${mentor.id}-msg-${i}`} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-700 border border-gray-100 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="relative flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CountdownTimer = ({ timestamp, duration, onComplete }: { timestamp: number, duration: number, onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((timestamp + duration - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      const newTime = Math.max(0, Math.floor((timestamp + duration - Date.now()) / 1000));
      setTimeLeft(newTime);
      if (newTime <= 0) onComplete();
    }, 1000);
    return () => clearInterval(timer);
  }, [timestamp, duration, timeLeft, onComplete]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-lg">
      <Zap className="w-3 h-3 animate-pulse" />
      Accepting in {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
};

const AvailabilityCalendarModal = ({ isOpen, onClose, mentor, onRequest, isAccepted, onBook }: { 
  isOpen: boolean, 
  onClose: () => void, 
  mentor: Mentor | null,
  onRequest?: (mentorId: string) => void,
  isAccepted?: boolean,
  onBook?: (mentorId: string, day: string, slot: string) => void
}) => {
  if (!isOpen || !mentor) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl"
      >
        <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-6">
            <img src={mentor.image} alt={mentor.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" referrerPolicy="no-referrer" />
            <div>
              <h2 className="text-2xl font-black text-gray-900">{mentor.name}'s Availability</h2>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest">
                {isAccepted ? "Select a slot to book your session" : "Select a slot to request mentorship"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-7 gap-4 mb-8">
            {days.map(day => (
              <div key={day} className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{day}</p>
                <div className="space-y-2">
                  {slots.map((slot, i) => (
                    <button 
                      key={`${day}-${slot}-${i}`}
                      onClick={() => {
                        if (isAccepted && onBook) {
                          onBook(mentor.id, day, slot);
                        } else if (onRequest) {
                          onRequest(mentor.id);
                        }
                        onClose();
                      }}
                      className={cn(
                        "w-full py-3 rounded-xl text-[10px] font-bold transition-all border",
                        Math.random() > 0.3 
                          ? "bg-white border-gray-100 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg" 
                          : "bg-gray-50 border-transparent text-gray-300 cursor-not-allowed"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-gray-100" /> Available
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-50" /> Booked
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MentorshipHub = ({ user, lang, onUpgrade, onRequest, onBook, onChat, onNotify, onAccept, realMentors, loadingMentors }: { 
  user: UserProfile, 
  lang: string, 
  onUpgrade: () => void, 
  onRequest: (mentorId: string) => void, 
  onBook: (mentorId: string, date: string, time: string) => void, 
  onChat: (mentor: Mentor, mode: 'AI' | 'LIVE') => void, 
  onNotify: (msg: string) => void,
  onAccept: (mentorId: string) => void,
  realMentors: Mentor[],
  loadingMentors: boolean
}) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedMentorForCalendar, setSelectedMentorForCalendar] = useState<Mentor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [minRating, setMinRating] = useState(0);

  const mentorsToDisplay = realMentors.filter(mentor => {
    const matchesSearch = 
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesExpertise = selectedExpertise === 'All' || mentor.expertise.includes(selectedExpertise);
    const matchesRole = selectedRole === 'All' || mentor.role === selectedRole;
    const matchesRating = mentor.rating >= minRating;

    return matchesSearch && matchesExpertise && matchesRole && matchesRating;
  });

  const allExpertise = ['All', ...Array.from(new Set(realMentors.flatMap(m => m.expertise)))];
  const allRoles = ['All', ...Array.from(new Set(realMentors.map(m => m.role)))];

  return (
    <div className="pb-32 max-w-4xl mx-auto px-6 relative z-10">
      <div className={cn(
        "backdrop-blur-3xl border rounded-[48px] p-12 mb-12 relative overflow-hidden shadow-2xl transition-all duration-300",
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100 text-gray-900"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-80 h-80 blur-[120px] rounded-full -mr-40 -mt-40 transition-colors duration-300",
          darkMode ? "bg-blue-900/20" : "bg-blue-600/10"
        )} />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className={cn(
              "px-4 py-1.5 rounded-full border transition-colors duration-300",
              darkMode ? "bg-blue-900/40 border-blue-800" : "bg-blue-500/20 border-blue-500/30"
            )}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Expert Network</span>
            </div>
          </div>
          <h1 className={cn(
            "text-5xl font-black mb-4 tracking-tight transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{t.mentorship_title}</h1>
          <p className={cn(
            "text-lg max-w-2xl leading-relaxed font-medium transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>{t.mentorship_desc}</p>
          <button 
            onClick={() => navigate('/mentor-signup')}
            className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
          >
            Become a Mentor
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-12 space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input 
            type="text"
            placeholder="Search mentors by name, role, company or expertise (e.g. Doctor, Engineer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full border-2 rounded-[32px] py-6 pl-16 pr-8 text-lg shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold",
              darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100 text-gray-900"
            )}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Expertise</label>
            <select 
              value={selectedExpertise}
              onChange={(e) => setSelectedExpertise(e.target.value)}
              className={cn(
                "w-full border-2 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all",
                darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-white border-gray-100 text-gray-700"
              )}
            >
              {allExpertise.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Role</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={cn(
                "w-full border-2 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all",
                darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-white border-gray-100 text-gray-700"
              )}
            >
              {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Min. Rating</label>
            <div className={cn(
              "flex items-center gap-2 border-2 rounded-2xl p-4 transition-colors duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100"
            )}>
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className={cn(
                  "flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-colors duration-300",
                  darkMode ? "bg-white/10" : "bg-gray-200"
                )}
              />
              <span className={cn(
                "font-black w-8 text-center transition-colors duration-300",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>{minRating}</span>
            </div>
          </div>
        </div>
      </div>

      {!user.isPremium && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "border-2 rounded-[32px] p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all duration-300",
            darkMode ? "bg-white/5 border-orange-900/30" : "bg-white border-orange-100"
          )}
        >
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border transition-colors duration-300",
              darkMode ? "bg-orange-900/20 border-orange-900/30" : "bg-orange-50 border-orange-100"
            )}>
              ⭐
            </div>
            <div>
              <h3 className={cn(
                "text-xl font-black transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{t.mentorship_upgrade}</h3>
              <p className={cn(
                "font-medium transition-colors duration-300",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>{t.mentorship_upgrade_desc}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsPaymentOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 whitespace-nowrap"
          >
            {t.mentorship_pay_now}
          </button>
        </motion.div>
      )}

      {loadingMentors ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mentorsToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mentorsToDisplay.map(mentor => {
          const isRequested = user.mentorshipRequests.includes(mentor.id);
          const isAccepted = user.acceptedMentors.includes(mentor.id);
          const isBooked = user.bookedSessions.some(s => s.mentorId === mentor.id);

          return (
            <Card3D 
              key={mentor.id}
              className="relative group h-full"
            >
              <div className={cn(
                "rounded-[48px] p-8 md:p-10 border shadow-sm hover:shadow-2xl transition-all h-full flex flex-col transition-all duration-300",
                darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/50" : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50"
              )}>
              {/* Mentor Level Badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-2xl font-black shadow-lg z-10 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Lvl {Math.floor(mentor.xp / 500) + 1}
              </div>

              <div className="flex items-start gap-6 mb-6">
                <div className="relative">
                  <img 
                    src={mentor.image} 
                    alt={mentor.name} 
                    className="w-20 h-20 rounded-3xl object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn(
                    "absolute -bottom-2 -right-2 px-2 py-1 rounded-lg shadow-md flex items-center gap-1 transition-colors duration-300",
                    darkMode ? "bg-[#020617] text-white" : "bg-white text-gray-900"
                  )}>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-black">{mentor.rating}</span>
                  </div>
                </div>
                <div>
                  <h3 className={cn(
                    "text-xl font-black transition-colors duration-300",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>{mentor.name}</h3>
                  <p className="text-blue-600 font-bold text-sm">{mentor.role}</p>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{mentor.company}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {mentor.badges.map((badge, i) => (
                  <span key={`${mentor.id}-badge-${badge}-${i}`} className={cn(
                    "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 whitespace-nowrap transition-colors duration-300",
                    darkMode ? "bg-yellow-900/20 text-yellow-400 border-yellow-900/30" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                  )}>
                    <Award className="w-3 h-3" /> {badge}
                  </span>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                <p className={cn(
                  "text-sm leading-relaxed italic transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>"{mentor.bio}"</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise.map((skill, i) => (
                    <span key={`${mentor.id}-skill-${skill}-${i}`} className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors duration-300",
                      darkMode ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-100"
                    )}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 px-2">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{mentor.sessionsCount}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Sessions</p>
                </div>
                <div className={cn(
                  "h-8 w-px transition-colors duration-300",
                  darkMode ? "bg-white/10" : "bg-gray-100"
                )} />
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{mentor.experience}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Exp</p>
                </div>
                <div className={cn(
                  "h-8 w-px transition-colors duration-300",
                  darkMode ? "bg-white/10" : "bg-gray-100"
                )} />
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{mentor.xp}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Mentor XP</p>
                </div>
                <div className={cn(
                  "h-8 w-px transition-colors duration-300",
                  darkMode ? "bg-white/10" : "bg-gray-100"
                )} />
                <div className="text-center">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" />
                    {mentor.profileViews.toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Views</p>
                </div>
              </div>

              <div className="space-y-3">
                {!isAccepted ? (
                  <div className="grid grid-cols-2 gap-3">
                      <button
                        disabled={isRequested}
                        onClick={() => {
                          if (!user.isPremium) {
                            setIsPaymentOpen(true);
                          } else {
                            setSelectedMentorForCalendar(mentor);
                          }
                        }}
                        className={cn(
                          "py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px]",
                          isRequested 
                            ? "bg-emerald-50 text-emerald-600 cursor-default border-2 border-emerald-100" 
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                        )}
                      >
                        {isRequested ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              {t.mentorship_requested}
                            </div>
                            <CountdownTimer 
                              timestamp={user.mentorshipRequestTimestamps[mentor.id] || Date.now()} 
                              duration={(mentor.id === 'm1' || mentor.name.includes('Ananya Sharma')) ? 5000 : 120000}
                              onComplete={() => onAccept(mentor.id)} 
                            />
                          </div>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4" />
                            Request Mentorship
                          </>
                        )}
                      </button>
                    <button
                      onClick={() => {
                        if (!user.isPremium) {
                          setIsPaymentOpen(true);
                        } else {
                          onChat(mentor, 'AI');
                        }
                      }}
                      className="py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px] hover:bg-indigo-100"
                    >
                      <Zap className="w-4 h-4" />
                      AI Chat
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onChat(mentor, 'LIVE')}
                        className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px] hover:bg-emerald-100 border-2 border-emerald-100"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Live Chat
                      </button>
                      <button
                        onClick={() => setSelectedMentorForCalendar(mentor)}
                        className={cn(
                          "py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px]",
                          isBooked 
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
                            : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        )}
                      >
                        {isBooked ? (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            Join Session
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4" />
                            Book Session
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => onChat(mentor, 'AI')}
                      className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px] hover:bg-indigo-100"
                    >
                      <Zap className="w-4 h-4" />
                      AI Chat Assistant
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card3D>
          );
        })}
      </div>
      ) : (
        <div className="bg-white rounded-[48px] p-20 text-center border-2 border-dashed border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🔍
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No Mentors Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn't find any mentors matching your current search or filters. Try adjusting your criteria!
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedExpertise('All');
              setSelectedRole('All');
              setMinRating(0);
            }}
            className="mt-8 text-blue-600 font-black uppercase tracking-widest hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onPaymentSuccess={onUpgrade}
        lang={lang}
      />

      <AvailabilityCalendarModal
        isOpen={!!selectedMentorForCalendar}
        onClose={() => setSelectedMentorForCalendar(null)}
        mentor={selectedMentorForCalendar}
        onRequest={onRequest}
        isAccepted={selectedMentorForCalendar ? user.acceptedMentors.includes(selectedMentorForCalendar.id) : false}
        onBook={(mentorId, day, slot) => {
          onBook(mentorId, day, slot);
          onNotify(`Session booked with ${selectedMentorForCalendar?.name} for ${day} at ${slot}!`);
        }}
      />
    </div>
  );
};

const Home = ({ user, lang }: { user: UserProfile, lang: string }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS['English'];
  const [activeTab, setActiveTab] = useState('quiz');
  const theme = getThemeConfig();

  const tabs = [
    { id: 'quiz', label: t.nav_quiz, icon: Target, to: '/quiz', desc: t.quiz_perfect_match, color: "bg-orange-50 text-orange-600" },
    { id: 'explore', label: t.nav_explore, icon: Compass, to: '/explorer', desc: t.explore_categories, color: "bg-blue-50 text-blue-600" },
    { id: 'income', label: t.first_income, icon: Zap, to: '/first-income', desc: t.first_income_desc, color: "bg-emerald-50 text-emerald-600", isLocked: !user.isPremium },
    { id: 'simulation', label: t.try_career, icon: Gamepad2, to: '/simulation', desc: t.simulate_scenarios, color: "bg-purple-50 text-purple-600" },
    { id: 'wheel', label: t.wheel_title, icon: FerrisWheel, to: '/wheel', desc: t.wheel_random, color: "bg-pink-50 text-pink-600" }
  ];

  return (
    <div className="pb-24 max-w-4xl mx-auto relative z-10 px-6">
      {/* Moving Line Loop */}
      <ScrollingTicker />

      {/* Festival/Season Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mb-8 p-6 rounded-[32px] bg-gradient-to-r text-white shadow-xl flex items-center justify-between overflow-hidden relative",
          theme.color
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{theme.icon}</span>
            <span className="font-black uppercase tracking-widest text-xs opacity-80">{theme.name} Special</span>
          </div>
          <p className="text-xl font-black italic tracking-tight">"{theme.quote}"</p>
        </div>
        <div className="hidden sm:block text-6xl opacity-20 rotate-12">{theme.icon}</div>
      </motion.div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative flex-1"
        >
          <div className="absolute -left-4 top-0 w-1.5 h-20 bg-gradient-to-b from-blue-500 to-transparent rounded-full" />
          <h2 className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">{t.home_welcome}</h2>
          <h1 className={cn(
            "text-6xl font-black tracking-tighter leading-none transition-colors duration-300",
            darkMode ? "text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "text-gray-900 shadow-none"
          )}>
            {user.name}<span className="text-blue-600">.</span>
          </h1>
          <p className={cn(
            "font-medium mt-4 italic text-xl max-w-md transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>{t.welcome}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="shrink-0 flex justify-center"
        >
          <Globe3D />
        </motion.div>
      </div>

      {/* Classic Tabs */}
      <div className="mb-12">
        <div className={cn(
          "flex p-2 rounded-[32px] border shadow-2xl mb-8 overflow-x-auto scrollbar-hide backdrop-blur-md transition-all duration-300",
          darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
        )}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isLocked) {
                  setActiveTab(tab.id);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={cn(
                "flex-1 min-w-[100px] py-4 px-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 relative group",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                  : (darkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")
              )}
            >
              {tab.isLocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-600" />}
              <tab.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110", 
                activeTab === tab.id ? "text-white" : (darkMode ? "text-gray-500" : "text-gray-400")
              )} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                activeTab === tab.id ? "text-white" : (darkMode ? "text-gray-500" : "text-gray-600")
              )}>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-2xl -z-10"
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tabs.map(tab => tab.id === activeTab && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="grid grid-cols-1 gap-6"
            >
              <Card 
                title={tab.label} 
                icon={tab.icon} 
                color={tab.color} 
                description={tab.desc}
                onClick={() => navigate(tab.to)}
                isLocked={tab.isLocked}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <SmallCard icon={GraduationCap} title={t.exams} to="/exams" color="bg-purple-50 text-purple-600" />
        <SmallCard icon={BookOpen} title={t.streams} to="/streams" color="bg-pink-50 text-pink-600" />
        <SmallCard icon={MapIcon} title={t.pathways} to="/pathways" color="bg-indigo-50 text-indigo-600" />
        <SmallCard icon={Users} title={t.parent_guide} to="/parents" color="bg-amber-50 text-amber-600" />
        <SmallCard icon={Briefcase} title={t.business} to="/business" color="bg-cyan-50 text-cyan-600" isLocked={!user.isPremium} />
        <SmallCard icon={Globe} title={t.global} to="/global" color="bg-orange-50 text-orange-600" />
      </div>

      <div className="mt-12">
        <Card3D 
          onClick={() => navigate('/mock-interview')}
          className="group cursor-pointer"
        >
          <div className={cn(
            "w-full p-10 md:p-12 rounded-[48px] shadow-2xl flex items-center justify-between relative overflow-hidden border h-full transition-all duration-300",
            darkMode ? "bg-white/5 border-white/10 text-white hover:border-blue-500/50" : "bg-white border-gray-100 text-gray-900 hover:border-blue-100"
          )}>
            <div className={cn(
              "absolute top-0 right-0 w-80 h-80 blur-[120px] rounded-full opacity-60 -mr-20 -mt-20",
              darkMode ? "bg-blue-900/20" : "bg-blue-50"
            )} />
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform duration-500">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">AI Mentor Active</span>
                </div>
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-3 leading-tight">AI Mock Interview</h3>
              <p className={cn(
                "text-base font-medium max-w-md leading-relaxed transition-colors duration-300",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>Simulate real-world pressure with our advanced AI mentor. Get instant feedback and improve your confidence.</p>
            </div>
            <div className={cn(
              "relative z-10 w-20 h-20 rounded-[32px] flex items-center justify-center transition-all duration-500 border group-hover:scale-110 shadow-sm",
              darkMode ? "bg-white/5 border-white/10 group-hover:bg-blue-600" : "bg-gray-50 border-gray-100 group-hover:bg-blue-600"
            )}>
              <ChevronRight className="w-10 h-10 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Card3D>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            "text-xl font-black tracking-tight transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>Top Entrance Exams</h3>
          <button onClick={() => navigate('/exams')} className="text-blue-400 text-xs font-black uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {EXAMS.slice(0, 5).map(exam => (
            <motion.div
              key={exam.id}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => navigate('/exams')}
              className={cn(
                "flex-shrink-0 w-64 p-6 rounded-[32px] border backdrop-blur-md cursor-pointer transition-all duration-300",
                darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/50" : "bg-white border-gray-200 hover:border-blue-500/50 shadow-lg shadow-gray-200/50"
              )}
            >
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 block">{exam.category}</span>
              <h4 className={cn(
                "font-black mb-2 truncate transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{exam.name}</h4>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                <Calendar className="w-3 h-3" />
                <span>{exam.keyDates?.split(' ')[0] || 'TBA'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Founder Tagline */}
      <div className="mt-24 text-center pb-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-white/10 to-transparent" />
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-16"
        >
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-blue-500/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">The Visionary</p>
            <div className="h-px w-8 bg-blue-500/30" />
          </div>
          
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-orange-600/20 rounded-full blur-2xl opacity-50" />
            <h2 className="relative text-4xl font-black tracking-tighter text-white">
              Sarthak Dhaked
            </h2>
          </div>

          <div className="max-w-xs mx-auto">
            <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
              "Architecting the future of Indian talent, one dream at a time. Your journey is my mission."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Quiz = ({ onComplete, lang }: { onComplete: (xp: number) => void, lang: string }) => {
  const { darkMode } = useTheme();
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  const filteredQuestions = difficulty 
    ? QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty)
    : [];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [filteredQuestions[step].id]: value };
    setAnswers(newAnswers);
    if (step < filteredQuestions.length - 1) {
      setStep(step + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers: any) => {
    setLoading(true);
    const analysis = await getQuizAnalysis(finalAnswers, lang, difficulty || 'Easy');
    setResult(analysis);
    setLoading(false);
    
    // XP based on difficulty
    let xp = 100;
    if (difficulty === 'Medium') xp = 150;
    if (difficulty === 'Hard') xp = 200;
    onComplete(xp);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className={cn(
        "text-xl font-bold transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.quiz_analyzing}</h2>
      <p className={cn(
        "transition-colors duration-300",
        darkMode ? "text-gray-400" : "text-gray-500"
      )}>{t.quiz_crunching}</p>
    </div>
  );

  if (result) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-32 max-w-2xl mx-auto space-y-12">
      <div className={cn(
        "p-12 rounded-[48px] text-center relative overflow-hidden group transition-all duration-300 border-2 shadow-xl",
        darkMode ? "bg-white/5 border-white/10 text-white shadow-blue-900/20" : "bg-white border-blue-100 text-gray-900 shadow-blue-50"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 opacity-50",
          darkMode ? "bg-blue-900/20" : "bg-blue-50"
        )} />
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="relative z-10"
        >
          <Trophy className="w-20 h-20 mx-auto mb-6 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
          <h1 className={cn(
            "text-4xl font-black mb-2 tracking-tighter transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{t.quiz_result}</h1>
          <div className="text-7xl font-black mb-4 tracking-tighter text-blue-600">{result.matchPercentage}%</div>
          <div className={cn(
            "inline-flex items-center gap-2 px-6 py-2 rounded-full border transition-all duration-300",
            darkMode ? "bg-blue-900/20 border-blue-800 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"
          )}>
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-black uppercase tracking-widest">{t.quiz_match} {result.bestStream}</p>
          </div>
        </motion.div>
      </div>
      
      <div className="space-y-8">
        <section className={cn(
          "p-10 rounded-[48px] border shadow-sm space-y-4 transition-all duration-300",
          darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.quiz_why}</h3>
            </div>
            <button 
              onClick={async () => {
                const audio = await getTextToSpeech(result.reasoning);
                if (audio) {
                  const a = new Audio(`data:audio/mp3;base64,${audio}`);
                  a.play();
                }
              }}
              className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
              title="Listen to Analysis"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 leading-relaxed font-medium">
            {result.reasoning}
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.quiz_suggested}</h3>
          </div>
          <div className="grid gap-4">
            {result.suggestedCareers.map((c: string, i: number) => (
              <motion.div 
                key={`${c}-${i}`} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 10 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between shadow-sm group cursor-pointer hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all"
              >
                <span className="font-black text-gray-800 group-hover:text-blue-600 transition-colors">{c}</span>
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <button 
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 text-white p-6 rounded-[32px] font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95"
        >
          {t.quiz_back}
        </button>
      </div>
    </motion.div>
  );

  if (!difficulty) {
    const difficulties: { id: 'Easy' | 'Medium' | 'Hard', title: string, desc: string, color: string, icon: any }[] = [
      { 
        id: 'Easy', 
        title: t.difficulty_easy, 
        desc: t.difficulty_easy_desc, 
        color: darkMode 
          ? 'border-emerald-900/30 hover:border-emerald-500 text-emerald-400 bg-white/5 shadow-xl shadow-emerald-900/10' 
          : 'border-emerald-100 hover:border-emerald-500 text-emerald-700 bg-white shadow-sm', 
        icon: Star 
      },
      { 
        id: 'Medium', 
        title: t.difficulty_medium, 
        desc: t.difficulty_medium_desc, 
        color: darkMode 
          ? 'border-blue-900/30 hover:border-blue-500 text-blue-400 bg-white/5 shadow-xl shadow-blue-900/10' 
          : 'border-blue-100 hover:border-blue-500 text-blue-700 bg-white shadow-sm', 
        icon: Zap 
      },
      { 
        id: 'Hard', 
        title: t.difficulty_hard, 
        desc: t.difficulty_hard_desc, 
        color: darkMode 
          ? 'border-purple-900/30 hover:border-purple-500 text-purple-400 bg-white/5 shadow-xl shadow-purple-900/10' 
          : 'border-purple-100 hover:border-purple-500 text-purple-700 bg-white shadow-sm', 
        icon: Trophy 
      },
    ];

    return (
      <div className="pb-24 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className={cn(
            "text-3xl font-bold mb-2 transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{t.quiz_difficulty_title}</h1>
          <p className={cn(
            "transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>{t.quiz_difficulty_desc}</p>
        </div>

        <div className="grid gap-4">
          {difficulties.map(d => (
            <motion.button
              key={d.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "p-6 rounded-[32px] border text-left transition-all flex items-center gap-6 group shadow-sm",
                d.color
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all",
                darkMode ? "bg-white/10" : "bg-white"
              )}>
                <d.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className={cn(
                  "text-xl font-bold mb-1 transition-colors duration-300",
                  darkMode ? "text-white" : "text-gray-900"
                )}>{d.title}</h3>
                <p className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>{d.desc}</p>
              </div>
              <ChevronRight className={cn(
                "w-6 h-6 ml-auto transition-all duration-300",
                darkMode ? "text-gray-600 group-hover:text-white" : "text-gray-300 group-hover:text-gray-600"
              )} />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[step];

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{t.quiz_step} {step + 1} of {filteredQuestions.length}</span>
          <span className="text-sm text-gray-400">{Math.round(((step + 1) / filteredQuestions.length) * 100)}%</span>
        </div>
        <div className={cn(
          "w-full h-2 rounded-full overflow-hidden transition-colors duration-300",
          darkMode ? "bg-white/10" : "bg-gray-100"
        )}>
          <motion.div 
            className="bg-blue-500 h-full" 
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className={cn(
        "text-2xl font-black mb-8 tracking-tight transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{currentQuestion.text}</h1>

      <div className="grid gap-4">
        {currentQuestion.options.map(opt => (
          <Card3D
            key={opt.value}
            onClick={() => handleAnswer(opt.value)}
            className="group"
          >
            <div className={cn(
              "p-6 border rounded-3xl text-left font-black transition-all text-lg tracking-tight h-full flex items-center shadow-2xl backdrop-blur-xl",
              darkMode 
                ? "bg-white/10 border-white/10 text-white group-hover:border-blue-500/50 group-hover:text-blue-400" 
                : "bg-white border-gray-200 text-gray-900 group-hover:border-blue-500 group-hover:text-blue-600 shadow-gray-200/50"
            )}>
              {opt.text}
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};

const Explorer = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const categories = [
    { id: 'tech', title: 'Technology', icon: Briefcase, color: 'bg-blue-600' },
    { id: 'health', title: 'Healthcare', icon: Heart, color: 'bg-red-600' },
    { id: 'business', title: 'Business', icon: Briefcase, color: 'bg-emerald-600' },
    { id: 'govt', title: 'Govt Top Careers', icon: Users, color: 'bg-orange-600' },
    { id: 'creative', title: 'Creative Fields', icon: Star, color: 'bg-purple-600' },
    { id: 'law', title: 'Law & Public Service', icon: BookOpen, color: 'bg-indigo-600' },
    { id: 'startup-jobs', title: 'Startup Jobs', icon: Briefcase, color: 'bg-amber-600' },
  ];

  return (
    <div className="pb-24 max-w-6xl mx-auto px-4 relative">
      <h1 className={cn(
        "text-4xl md:text-5xl font-black mb-10 tracking-tight text-center md:text-left transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.explorer_title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map(cat => (
          <Card3D
            key={cat.id}
            onClick={() => navigate(`/explorer/${cat.id}`)}
            className="group"
          >
            <div className={cn(
              "flex flex-col items-center p-10 rounded-[40px] border shadow-2xl transition-all text-center h-full backdrop-blur-xl",
              darkMode 
                ? "bg-white/10 border-white/10 hover:border-blue-500/50" 
                : "bg-white border-gray-200 hover:border-blue-500 shadow-gray-200/50"
            )}>
              <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-xl", cat.color.replace('bg-', 'bg-opacity-20 text-').replace('600', '400'))}>
                <cat.icon className="w-10 h-10" />
              </div>
              <span className={cn(
                "font-black text-lg tracking-tight transition-colors duration-300",
                darkMode ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"
              )}>{cat.title}</span>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};

const Heart = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;

const GeminiChat = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, audio?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [complexity, setComplexity] = useState<'fast' | 'general' | 'complex'>('general');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    let fullText = '';
    try {
      const stream = getChatResponseStream(userMsg, messages, undefined, lang, complexity);
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: fullText }];
        });
      }

      // Automatically get TTS for the AI response
      const audioData = await getTextToSpeech(fullText);
      if (audioData) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, audio: audioData }];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play();
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center z-50 hover:scale-110 transition-all border-4",
              darkMode ? "border-[#020617]" : "border-white"
            )}
          >
            <MessageSquare className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
            className={cn(
              "fixed inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] max-h-[700px] rounded-[40px] shadow-[0_0_60px_rgba(0,0,0,0.2)] z-[100] flex flex-col overflow-hidden border transition-all duration-300",
              darkMode ? "bg-[#020617] border-white/10" : "bg-white border-gray-100"
            )}
          >
            <div className={cn(
              "p-6 border-b flex justify-between items-center shrink-0 transition-colors duration-300",
              darkMode ? "bg-[#020617] border-white/10 text-white" : "bg-white border-gray-100 text-gray-900"
            )}>
              <div>
                <h3 className={cn(
                  "font-black text-lg tracking-tight transition-colors duration-300",
                  darkMode ? "text-white" : "text-gray-900"
                )}>Gemini Counselor</h3>
                <div className="flex gap-2 mt-1">
                  {(['fast', 'general', 'complex'] as const).map(c => (
                    <button 
                      key={c}
                      onClick={() => setComplexity(c)}
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all",
                        complexity === c ? "bg-blue-600 text-white border-blue-600" : "text-gray-400 border-gray-200 hover:border-blue-200"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center"
                aria-label="Close chat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={cn(
              "flex-1 overflow-y-auto p-6 space-y-4 transition-colors duration-300",
              darkMode ? "bg-white/5" : "bg-gray-50/50"
            )}>
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-[24px] text-sm font-medium leading-relaxed transition-all duration-300",
                    m.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : (darkMode ? "bg-white/10 text-gray-200 rounded-tl-none border border-white/10 shadow-sm" : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm")
                  )}>
                    {m.text}
                    {m.audio && (
                      <button 
                        onClick={() => playAudio(m.audio!)}
                        className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600"
                      >
                        <Zap className="w-3 h-3" /> Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className={cn(
                    "p-4 rounded-2xl rounded-tl-none border flex gap-1 transition-colors duration-300",
                    darkMode ? "bg-white/10 border-white/10" : "bg-white border-gray-100"
                  )}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className={cn(
              "p-6 border-t flex gap-3 transition-colors duration-300",
              darkMode ? "bg-[#020617] border-white/10" : "bg-white border-gray-100"
            )}>
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                className={cn(
                  "flex-1 rounded-2xl px-6 py-4 text-sm font-black transition-all outline-none",
                  darkMode ? "bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500/20" : "bg-gray-50 border border-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500/20"
                )}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Simulation ---

const Simulation = ({ onComplete, lang }: { onComplete: (xp: number) => void, lang: string }) => {
  const { darkMode } = useTheme();
  const [scenario, setScenario] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  const scenarios = [
    {
      title: t.quiz_doctor,
      icon: "🩺",
      desc: t.simulation_doctor_desc,
      options: [
        { text: t.simulation_doctor_opt1, correct: false, feedback: t.simulation_doctor_fb1 },
        { text: t.simulation_doctor_opt2, correct: true, feedback: t.simulation_doctor_fb2 },
        { text: t.simulation_doctor_opt3, correct: false, feedback: t.simulation_doctor_fb3 }
      ]
    },
    {
      title: t.quiz_engineer,
      icon: "🏗️",
      desc: t.simulation_eng_desc,
      options: [
        { text: t.simulation_eng_opt1, correct: false, feedback: t.simulation_eng_fb1 },
        { text: t.simulation_eng_opt2, correct: true, feedback: t.simulation_eng_fb2 },
        { text: t.simulation_eng_opt3, correct: false, feedback: t.simulation_eng_fb3 }
      ]
    },
    {
      title: t.quiz_entrepreneur,
      icon: "🚀",
      desc: t.simulation_ent_desc,
      options: [
        { text: t.simulation_ent_opt1, correct: false, feedback: t.simulation_ent_fb1 },
        { text: t.simulation_ent_opt2, correct: true, feedback: t.simulation_ent_fb2 },
        { text: t.simulation_ent_opt3, correct: false, feedback: t.simulation_ent_fb3 }
      ]
    },
    {
      title: t.quiz_artist,
      icon: "🎨",
      desc: t.simulation_art_desc,
      options: [
        { text: t.simulation_art_opt1, correct: false, feedback: t.simulation_art_fb1 },
        { text: t.simulation_art_opt2, correct: true, feedback: t.simulation_art_fb2 },
        { text: t.simulation_art_opt3, correct: false, feedback: t.simulation_art_fb3 }
      ]
    },
    {
      title: t.quiz_lawyer,
      icon: "⚖️",
      desc: t.simulation_law_desc,
      options: [
        { text: t.simulation_law_opt1, correct: false, feedback: t.simulation_law_fb1 },
        { text: t.simulation_law_opt2, correct: true, feedback: t.simulation_law_fb2 },
        { text: t.simulation_law_opt3, correct: false, feedback: t.simulation_law_fb3 }
      ]
    },
    {
      title: t.quiz_software,
      icon: "💻",
      desc: t.simulation_soft_desc,
      options: [
        { text: t.simulation_soft_opt1, correct: true, feedback: t.simulation_soft_fb1 },
        { text: t.simulation_soft_opt2, correct: false, feedback: t.simulation_soft_fb2 },
        { text: t.simulation_soft_opt3, correct: false, feedback: t.simulation_soft_fb3 }
      ]
    }
  ];

  const handleChoice = (opt: any, index: number) => {
    setSelectedOpt(index);
    setFeedback(opt.feedback);
    if (opt.correct) onComplete(50);
  };

  const next = () => {
    setFeedback(null);
    setSelectedOpt(null);
    if (scenario < scenarios.length - 1) setScenario(scenario + 1);
    else navigate('/');
  };

  const s = scenarios[scenario];
  const progress = ((scenario + 1) / scenarios.length) * 100;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className={cn(
          "text-3xl font-bold transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{t.simulation_title}</h1>
        <div className={cn(
          "text-sm font-bold px-3 py-1 rounded-full transition-colors duration-300",
          darkMode ? "text-blue-400 bg-blue-900/30" : "text-blue-600 bg-blue-50"
        )}>
          {scenario + 1} / {scenarios.length}
        </div>
      </div>

      <div className={cn(
        "w-full h-2 rounded-full mb-8 overflow-hidden transition-colors duration-300",
        darkMode ? "bg-white/10" : "bg-gray-100"
      )}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-blue-500"
        />
      </div>

      <Card3D 
        key={scenario}
        className="mb-12"
      >
        <div className={cn(
          "p-10 md:p-12 rounded-[48px] border shadow-2xl h-full flex flex-col transition-all duration-300",
          darkMode 
            ? "bg-white/5 border-white/10 hover:border-blue-500/50" 
            : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50"
        )}>
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-inner border transition-colors duration-300",
            darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-100"
          )}>
            {s.icon}
          </div>
          <h2 className={cn(
            "text-3xl font-black mb-4 tracking-tight transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{s.title}</h2>
          <p className={cn(
            "text-xl leading-relaxed mb-10 transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>{s.desc}</p>
          
          <div className="grid gap-5">
            {s.options.map((opt, i) => (
              <button
                key={`${scenario}-opt-${i}`}
                onClick={() => handleChoice(opt, i)}
                disabled={!!feedback}
                className={cn(
                  "p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group transition-all duration-300",
                  selectedOpt === i 
                    ? (opt.correct ? "bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/20" : "bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/20") 
                    : (darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10" : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 hover:scale-[1.02]")
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-black text-lg shrink-0 transition-all",
                    selectedOpt === i 
                      ? (opt.correct ? "border-green-500 bg-green-500 text-white" : "border-red-500 bg-red-500 text-white")
                      : (darkMode ? "border-white/10 text-gray-500 group-hover:border-blue-500/50 group-hover:text-blue-400" : "border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:text-blue-400 group-hover:scale-110")
                  )}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-black text-xl tracking-tight">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card3D>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl"
          >
            <div className={cn(
              "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl",
              s.options[selectedOpt!].correct ? "bg-green-500" : "bg-red-500"
            )}>
              {s.options[selectedOpt!].correct ? "✓" : "×"}
            </div>
            <p className="font-bold text-xl text-gray-900 mb-6">{feedback}</p>
            <button 
              onClick={next} 
              className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              {scenario < scenarios.length - 1 ? t.simulation_next : t.simulation_finish}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Wheel = ({ onComplete, lang }: { onComplete: (xp: number) => void, lang: string }) => {
  const { darkMode } = useTheme();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  const careers = [
    { title: t.wheel_ai_title, desc: t.wheel_ai_desc },
    { title: t.wheel_space_title, desc: t.wheel_space_desc },
    { title: t.wheel_urban_title, desc: t.wheel_urban_desc },
    { title: t.wheel_arch_title, desc: t.wheel_arch_desc },
  ];

  const spin = () => {
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      const res = careers[Math.floor(Math.random() * careers.length)];
      setResult(res);
      setSpinning(false);
      onComplete(20);
    }, 2000);
  };

  return (
    <div className="pb-24 text-center max-w-2xl mx-auto">
      <h1 className={cn(
        "text-3xl font-bold mb-8 transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.wheel_title}</h1>
      <div className="relative w-64 h-64 mx-auto mb-12">
        <motion.div 
          animate={spinning ? { rotate: 360 * 5 } : { rotate: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className={cn(
            "w-full h-full rounded-full border-8 flex items-center justify-center shadow-xl transition-all duration-300",
            darkMode ? "border-white/10 bg-white/5" : "border-blue-100 bg-white"
          )}
        >
          <FerrisWheel className="w-24 h-24 text-blue-600" />
        </motion.div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-500 rotate-45 rounded-sm shadow-md" />
      </div>

      <button 
        onClick={spin} 
        disabled={spinning}
        className={cn(
          "bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-lg disabled:opacity-50 transition-all uppercase tracking-widest",
          darkMode ? "shadow-blue-900/20" : "shadow-blue-100"
        )}
      >
        {spinning ? t.wheel_spinning : t.wheel_spin}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-12 p-6 rounded-3xl border shadow-xl transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
            )}
          >
            <h2 className="text-2xl font-black text-blue-600 mb-2">{result.title}</h2>
            <p className={cn(
              "transition-colors duration-300",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>{result.desc}</p>
            <div className="mt-4 text-xs font-bold text-yellow-600 uppercase tracking-widest">+20 {t.wheel_xp}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StudyPlanner = ({ exam, lang }: { exam: Exam, lang: string }) => {
  const { darkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  
  const plans: Record<string, any> = {
    'JEE': {
      daily: "3 hours Physics, 3 hours Math, 2 hours Chemistry",
      weekly: "Full length mock test every Sunday",
      resources: ["NCERT Textbooks", "HC Verma for Physics", "Cengage for Math"]
    },
    'NEET': {
      daily: "4 hours Biology, 2 hours Physics, 2 hours Chemistry",
      weekly: "Chapter-wise MCQ practice (200+ questions)",
      resources: ["NCERT Biology (Bible)", "MTG Objective NCERT", "Previous Year Papers"]
    },
    'CLAT': {
      daily: "2 hours Legal Reasoning, 2 hours English, 1 hour Current Affairs",
      weekly: "Reading 3 editorials daily, Weekly Mock",
      resources: ["The Hindu Editorial", "Legal Awareness by AP Bhardwaj", "GK Today"]
    },
    'CAT': {
      daily: "2 hours Quants, 2 hours DILR, 1 hour VARC",
      weekly: "Sectional tests every 3 days",
      resources: ["Arun Sharma Books", "IMS/TIME Mock Series", "Word Power Made Easy"]
    }
  };

  const plan = plans[exam.name] || {
    daily: "2 hours core subjects, 1 hour practice",
    weekly: "Review all topics covered in the week",
    resources: ["Standard Textbooks", "Online Practice Sets"]
  };

  return (
    <div className="mt-4">
      <button 
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all duration-300",
          darkMode ? "bg-blue-900/20 text-blue-400 border-blue-900/30 hover:bg-blue-900/40" : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
        )}
      >
        <Calendar className="w-4 h-4" />
        {open ? t.hide_plan : t.view_plan}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "p-4 border rounded-2xl mt-2 space-y-4 shadow-sm transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-100 shadow-gray-200/50"
            )}>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">{t.daily_goal}</h4>
                <p className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>{plan.daily}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">{t.weekly_goal}</h4>
                <p className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>{plan.weekly}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">{t.top_resources}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {plan.resources.map((r: string, i: number) => (
                    <span key={`${exam.id}-resource-${i}`} className={cn(
                      "px-2 py-1 text-[10px] rounded-lg border transition-all duration-300",
                      darkMode ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-50 text-gray-600 border-gray-100"
                    )}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExamsPage = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  return (
    <div className="pb-24 max-w-4xl mx-auto px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className={cn(
          "text-5xl font-black tracking-tight mb-4 transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{t.exams}</h1>
        <p className="text-gray-500 text-xl font-medium max-w-2xl">Comprehensive guide to the most important entrance exams for your career journey.</p>
      </motion.div>

      <div className="space-y-8">
        {EXAMS.map(exam => (
          <motion.div 
            key={exam.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[48px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group hover:border-blue-100"
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  {exam.category}
                </span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{exam.name}</h2>
              </div>
              <div className={cn(
                "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                exam.difficulty === 'High' || exam.difficulty === 'Very High' ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
              )}>
                {exam.difficulty} {t.exams_difficulty}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> {t.exams_eligibility}
                  </p>
                  <p className="font-bold text-gray-900 leading-relaxed">{exam.eligibility}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> {t.exams_subjects}
                  </p>
                  <p className="font-bold text-gray-900 leading-relaxed">{exam.subjects.join(', ')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Key Dates (2025-26)
                  </p>
                  <p className="font-black text-blue-900 text-lg">{exam.keyDates || "TBA"}</p>
                </div>
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                  <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Official Website
                  </p>
                  <a 
                    href={exam.officialWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-black text-emerald-900 hover:underline break-all"
                  >
                    {exam.officialWebsite?.replace('https://', '')}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Syllabus Highlights
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exam.syllabusHighlights?.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl text-[10px] font-bold border border-gray-100">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> {t.exams_strategy}
                </h3>
                <p className="text-gray-700 font-medium leading-relaxed italic">"{exam.strategy}"</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 pt-8 border-t border-gray-50">
              <ShareButtons title={exam.name} url={window.location.href} />
              <StudyPlanner exam={exam} lang={lang} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StreamsPage = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const streams = [
    { id: 'science', title: t.stream_science, desc: t.stream_science_desc, careers: t.stream_science_careers, skills: t.stream_science_skills },
    { id: 'commerce', title: t.stream_commerce, desc: t.stream_commerce_desc, careers: t.stream_commerce_careers, skills: t.stream_commerce_skills },
    { id: 'arts', title: t.stream_arts, desc: t.stream_arts_desc, careers: t.stream_arts_careers, skills: t.stream_arts_skills },
  ];

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <h1 className={cn(
        "text-3xl font-bold mb-6 transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.streams}</h1>
      <div className="space-y-4">
        {streams.map(s => (
          <div key={s.id} className={cn(
            "p-6 rounded-3xl border shadow-sm transition-all duration-300",
            darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
          )}>
            <h2 className="text-2xl font-black text-blue-600 mb-2">{s.title}</h2>
            <p className={cn(
              "mb-4 font-medium transition-colors duration-300",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>{s.desc}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={cn(
                "p-4 border rounded-2xl transition-all duration-300",
                darkMode ? "bg-blue-900/20 border-blue-900/30" : "bg-blue-50 border-blue-100"
              )}>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1">{t.streams_careers}</p>
                <p className={cn(
                  "font-bold transition-colors duration-300",
                  darkMode ? "text-blue-400" : "text-blue-900"
                )}>{s.careers}</p>
              </div>
              <div className={cn(
                "p-4 border rounded-2xl transition-all duration-300",
                darkMode ? "bg-orange-900/20 border-orange-900/30" : "bg-orange-50 border-orange-100"
              )}>
                <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-1">{t.streams_skills}</p>
                <p className={cn(
                  "font-bold transition-colors duration-300",
                  darkMode ? "text-orange-400" : "text-orange-900"
                )}>{s.skills}</p>
              </div>
            </div>
            <ShareButtons title={s.title} url={window.location.href} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PathwaysPage = ({ user, lang, onVisit }: { user: UserProfile, lang: string, onVisit?: () => void }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  useEffect(() => {
    onVisit?.();
  }, []);

  const steps = [
    { id: "class10", step: t.pathway_class10, desc: t.pathway_class10_desc, icon: BookOpen, color: "bg-blue-600", glow: "shadow-blue-50" },
    { id: "stream", step: t.pathway_stream, desc: t.pathway_stream_desc, icon: Compass, color: "bg-orange-600", glow: "shadow-orange-50" },
    { id: "exams", step: t.pathway_exams, desc: t.pathway_exams_desc, icon: GraduationCap, color: "bg-purple-600", glow: "shadow-purple-50" },
    { id: "degree", step: t.pathway_degree, desc: t.pathway_degree_desc, icon: Briefcase, color: "bg-indigo-600", glow: "shadow-indigo-50" },
    { id: "career", step: t.pathway_career, desc: t.pathway_career_desc, icon: Trophy, color: "bg-emerald-600", glow: "shadow-emerald-50" },
  ];

  const getCurrentStepIndex = () => {
    const userClass = user.class.toLowerCase();
    if (userClass.includes('10')) return 0;
    if (userClass.includes('11') || userClass.includes('12')) return 1;
    if (userClass.includes('college') || userClass.includes('degree')) return 3;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="pb-32 max-w-2xl mx-auto px-4">
      <div className="mb-12 text-center space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl transition-all duration-300",
            darkMode ? "bg-blue-600 shadow-blue-900/50" : "bg-blue-600 shadow-blue-200"
          )}
        >
          <MapIcon className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-black tracking-tighter transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{t.pathways}</h1>
        <p className={cn(
          "font-medium max-w-sm mx-auto transition-colors duration-300",
          darkMode ? "text-gray-400" : "text-gray-500"
        )}>{t.pathways_journey}</p>
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className={cn(
          "absolute left-8 top-0 bottom-0 w-1.5 rounded-full transition-colors duration-300",
          darkMode ? "bg-white/10" : "bg-gray-100"
        )} />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          className="absolute left-8 top-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />

        <div className="space-y-16">
          {steps.map((p, i) => {
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const Icon = p.icon;

            return (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative pl-24"
              >
                {/* Icon Circle */}
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  className={cn(
                    "absolute left-3 top-0 w-12 h-12 rounded-2xl flex items-center justify-center z-20 border-4 border-white shadow-xl transition-all duration-500",
                    isCompleted ? "bg-emerald-500 text-white" : 
                    isCurrent ? "bg-blue-600 text-white ring-8 ring-blue-100" : 
                    "bg-white text-gray-300 border-gray-100"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </motion.div>

                {/* Content Card */}
                <motion.div 
                  whileHover={{ x: 10 }}
                  className={cn(
                    "p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden group",
                    isCurrent ? "bg-white border-blue-200 shadow-2xl shadow-blue-100 ring-1 ring-blue-50" : 
                    isCompleted ? "bg-emerald-50/30 border-emerald-100" : 
                    "bg-white border-gray-100"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        isCurrent ? "text-blue-500" : isCompleted ? "text-emerald-500" : "text-gray-400"
                      )}>
                        Step {i + 1}
                      </p>
                      <h3 className={cn(
                        "font-black text-2xl tracking-tight",
                        isCurrent ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400"
                      )}>
                        {p.step}
                      </h3>
                    </div>
                    {isCurrent && (
                      <motion.span 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-blue-200"
                      >
                        {t.pathways_current}
                      </motion.span>
                    )}
                  </div>
                  <p className={cn(
                    "text-base leading-relaxed font-medium",
                    isCurrent ? "text-gray-600" : "text-gray-400"
                  )}>
                    {p.desc}
                  </p>
                  
                  {isCurrent && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 pt-6 border-t border-blue-50 flex items-center gap-4"
                    >
                      <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                        Explore This Step
                      </button>
                      <button className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all">
                        <Info className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ParentGuide = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <h1 className={cn(
        "text-3xl font-bold mb-6 transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.parent_guide}</h1>
    <div className="space-y-6">
      <section className={cn(
        "p-6 rounded-3xl border transition-all duration-300",
        darkMode ? "bg-orange-900/20 border-orange-900/30" : "bg-orange-50 border-orange-100"
      )}>
        <h2 className={cn(
          "text-xl font-bold mb-4 transition-colors duration-300",
          darkMode ? "text-orange-400" : "text-orange-700"
        )}>{t.parents_myth_reality}</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-orange-400 uppercase">{t.parents_myth}</p>
            <p className={cn(
              "font-medium transition-colors duration-300",
              darkMode ? "text-orange-200" : "text-orange-900"
            )}>{t.parent_myth1}</p>
          </div>
          <div className={cn(
            "h-px transition-colors duration-300",
            darkMode ? "bg-orange-900/50" : "bg-orange-200"
          )} />
          <div>
            <p className="text-xs font-bold text-green-500 uppercase">{t.parents_reality}</p>
            <p className={cn(
              "font-medium transition-colors duration-300",
              darkMode ? "text-green-400" : "text-green-900"
            )}>{t.parent_reality1}</p>
          </div>
        </div>
      </section>
      <section className={cn(
        "p-6 rounded-3xl border shadow-sm transition-all duration-300",
        darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
      )}>
        <h2 className={cn(
          "text-xl font-bold mb-4 transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{t.parents_tips}</h2>
        <ul className={cn(
          "space-y-3 transition-colors duration-300",
          darkMode ? "text-gray-400" : "text-gray-600"
        )}>
          <li className="flex gap-2"><span>👉</span> {t.parent_tip1}</li>
          <li className="flex gap-2"><span>👉</span> {t.parent_tip2}</li>
          <li className="flex gap-2"><span>👉</span> {t.parent_tip3}</li>
        </ul>
      </section>
    </div>
  </div>
);
};

const BusinessPage = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  return (
    <div className="pb-24 max-w-2xl mx-auto px-6 relative z-10">
      <h1 className={cn(
        "text-3xl font-black mb-6 tracking-tight transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.business}</h1>
    <div className={cn(
      "backdrop-blur-3xl border p-8 rounded-[40px] mb-6 shadow-2xl relative overflow-hidden transition-all duration-300",
      darkMode ? "bg-white/10 border-emerald-500/20 text-white" : "bg-white border-emerald-100 text-gray-900 shadow-emerald-100/50"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
      <Briefcase className="w-12 h-12 mb-4 text-emerald-400 relative z-10" />
      <h2 className={cn(
        "text-2xl font-black mb-2 relative z-10 transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{t.business_startup}</h2>
      <p className={cn(
        "font-medium relative z-10 transition-colors duration-300",
        darkMode ? "text-gray-400" : "text-gray-500"
      )}>{t.business_startup_desc}</p>
    </div>
    <div className="grid gap-4">
      {[
        { title: t.business_entrepreneur, desc: t.business_entrepreneur_desc },
        { title: t.business_founder, desc: t.business_founder_desc },
        { title: t.business_analyst, desc: t.business_analyst_desc },
        { title: t.business_marketing, desc: t.business_marketing_desc },
      ].map(b => (
        <div key={b.title} className={cn(
          "backdrop-blur-xl p-6 rounded-3xl border shadow-xl transition-all duration-300",
          darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
        )}>
          <h3 className={cn(
            "font-black mb-1 transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{b.title}</h3>
          <p className={cn(
            "text-sm mb-4 transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>{b.desc}</p>
          <ShareButtons title={b.title} url={window.location.href} />
        </div>
      ))}
    </div>

    {/* Founder Message */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "mt-12 p-8 rounded-[40px] border shadow-sm relative overflow-hidden group transition-all duration-300",
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100 text-gray-900"
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-50 transition-colors duration-300",
        darkMode ? "bg-blue-900/20" : "bg-blue-50"
      )} />
      <div className="relative z-10">
        <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
        <p className={cn(
          "text-lg italic font-medium leading-relaxed mb-6 transition-colors duration-300",
          darkMode ? "text-gray-300" : "text-gray-500"
        )}>
          "The world of business is not just about profit; it's about solving problems and creating value. Every great empire started with a single, bold idea. Don't be afraid to fail, be afraid not to try."
        </p>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 border rounded-2xl flex items-center justify-center font-black text-xl text-blue-600 shadow-sm transition-all duration-300",
            darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-100"
          )}>
            SD
          </div>
          <div>
            <p className={cn(
              "font-black transition-colors duration-300",
              darkMode ? "text-white" : "text-gray-900"
            )}>Sarthak Dhaked</p>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Founder, CareerQuest</p>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);
};

const GlobalPage = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const countries = [
    { name: t.germany, flag: "🇩🇪", desc: t.germany_desc, color: "bg-amber-50 border-amber-200 text-amber-900" },
    { name: t.france, flag: "🇫🇷", desc: t.france_desc, color: "bg-blue-50 border-blue-200 text-blue-900" },
    { name: t.usa, flag: "🇺🇸", desc: t.usa_desc, color: "bg-red-50 border-red-200 text-red-900" },
    { name: t.uk, flag: "🇬🇧", desc: t.uk_desc, color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
    { name: t.canada, flag: "🇨🇦", desc: t.canada_desc, color: "bg-rose-50 border-rose-200 text-rose-900" },
    { name: t.australia, flag: "🇦🇺", desc: t.australia_desc, color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  ];

  return (
    <div className="pb-24 max-w-2xl mx-auto px-6 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')} 
          className={cn(
            "p-3 rounded-2xl transition-all border transition-colors duration-300",
            darkMode ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-gray-100 hover:bg-gray-200 border-gray-200"
          )}
        >
          <ChevronRight className={cn(
            "w-6 h-6 rotate-180 transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )} />
        </button>
        <div>
          <h1 className={cn(
            "text-3xl font-black tracking-tight transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{t.global}</h1>
          <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">{t.global_intl}</p>
        </div>
      </div>

      <div className={cn(
        "border p-6 rounded-[32px] mb-8 flex items-center gap-4 backdrop-blur-xl transition-all duration-300",
        darkMode ? "bg-orange-900/20 border-orange-900/30" : "bg-orange-50 border-orange-100"
      )}>
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Globe className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h2 className={cn(
            "font-black uppercase tracking-widest text-xs transition-colors duration-300",
            darkMode ? "text-orange-400" : "text-orange-700"
          )}>{t.coming_soon}</h2>
          <p className={cn(
            "text-sm font-medium transition-colors duration-300",
            darkMode ? "text-orange-200/70" : "text-orange-600"
          )}>{t.global_database}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {countries.map(c => (
          <motion.div 
            key={c.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className={cn(
              "p-5 rounded-[32px] border shadow-sm flex flex-col items-center text-center gap-3 transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : c.color
            )}
          >
            <span className="text-4xl">{c.flag}</span>
            <div>
              <h3 className={cn(
                "font-bold transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{c.name}</h3>
              <p className={cn(
                "text-[10px] font-medium uppercase tracking-wider mt-1 transition-colors duration-300",
                darkMode ? "text-gray-400" : "text-gray-600 opacity-70"
              )}>{c.desc}</p>
            </div>
            <div className={cn(
              "mt-2 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border mb-3 transition-colors duration-300",
              darkMode ? "bg-white/10 border-white/20 text-white/50" : "bg-white/50 border-white/50 text-gray-500 opacity-50"
            )}>
              Preview
            </div>
            <ShareButtons title={c.name} url={window.location.href} />
          </motion.div>
        ))}
      </div>

      <div className={cn(
        "mt-12 p-8 rounded-[32px] text-center space-y-4 shadow-sm border transition-all duration-300",
        darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
      )}>
        <h2 className={cn(
          "text-2xl font-black transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>{t.global_study_abroad}</h2>
        <p className={cn(
          "text-sm font-medium transition-colors duration-300",
          darkMode ? "text-gray-400" : "text-gray-500"
        )}>{t.global_notified}</p>
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          {t.notify_me}
        </button>
      </div>

      {/* Founder Message */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 p-8 bg-white text-gray-900 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group"
      >
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-50 blur-3xl rounded-full opacity-50" />
        <div className="relative z-10">
          <Globe className="w-8 h-8 text-cyan-600 mb-4" />
          <p className="text-lg italic font-medium leading-relaxed mb-6 text-gray-500">
            "Boundaries are only on maps, not in minds. The future is global, and your potential is limitless. Embrace the diversity of the world and let it fuel your ambition to make a global impact."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center font-black text-xl text-cyan-600 shadow-sm">
              SD
            </div>
            <div>
              <p className="font-black text-gray-900">Sarthak Dhaked</p>
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Founder, CareerQuest</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ShareButtons = ({ title, url }: { title: string, url: string }) => {
  const shareText = encodeURIComponent(`Check out this career path: ${title}`);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share:</span>
      <a 
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors"
      >
        <Twitter className="w-3.5 h-3.5" />
      </a>
      <a 
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
      >
        <Facebook className="w-3.5 h-3.5" />
      </a>
      <a 
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <Linkedin className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

const CareerPage = ({ lang, user, onSaveToggle }: { lang: string, user: UserProfile, onSaveToggle: (id: string) => void }) => {
  const { darkMode } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const career = CAREERS.find(c => c.id === id);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const isSaved = user.savedCareers.includes(id || '');

  if (!career) return <div className="p-8 text-center">{t.no_results}</div>;

  return (
    <div className="pb-24 max-w-4xl mx-auto px-6 relative z-10">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="text-blue-400 font-black flex items-center gap-2 mb-6 hover:text-blue-300 transition-colors uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </button>
      </div>

      <Card3D className="mb-12">
        <div className={cn(
          "backdrop-blur-3xl rounded-[48px] border shadow-2xl overflow-hidden h-full flex flex-col transition-all duration-300",
          darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/50" : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50"
        )}>
          <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                {career.category}
              </span>
              <div className="flex items-center gap-4 mb-4">
                <h1 className={cn(
                  "text-4xl md:text-5xl font-black tracking-tight transition-colors duration-300",
                  darkMode ? "text-white" : "text-gray-900"
                )}>{career.title}</h1>
                <button 
                  onClick={() => onSaveToggle(career.id)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    isSaved 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : (darkMode ? "bg-white/5 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 border border-white/10" : "bg-gray-100 text-gray-400 hover:bg-blue-500/10 hover:text-blue-600 border border-gray-200")
                  )}
                  title={isSaved ? t.career_unsave : t.career_save}
                >
                  <Bookmark className={cn("w-6 h-6", isSaved ? "fill-white" : "")} />
                </button>
                <button 
                  onClick={async () => {
                    const audio = await getTextToSpeech(career.description);
                    if (audio) {
                      const a = new Audio(`data:audio/mp3;base64,${audio}`);
                      a.play();
                    }
                  }}
                  className={cn(
                    "p-3 rounded-2xl transition-all border",
                    darkMode ? "bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 border-white/10" : "bg-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 border-gray-200"
                  )}
                  title="Listen to Description"
                >
                  <Zap className="w-6 h-6" />
                </button>
              </div>
              <p className={cn(
                "text-xl leading-relaxed max-w-2xl font-medium transition-colors duration-300",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>{career.description}</p>
            </div>
            <div className="flex gap-3">
              <ShareButtons title={career.title} url={window.location.href} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-8">
              <section>
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <Target className="w-4 h-4" /> {t.career_responsibilities}
                </h3>
                <ul className="space-y-3">
                  {career.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                      <span className={cn(
                        "text-lg leading-relaxed font-medium transition-colors duration-300",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-400"
                )}>
                  <Compass className="w-4 h-4" /> {t.career_skills}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {career.skills.map(s => (
                    <span key={s} className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-bold border transition-colors duration-300",
                      darkMode ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-50 text-gray-700 border-gray-100"
                    )}>
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className={cn(
                "p-8 rounded-[32px] border transition-colors duration-300",
                darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-100"
              )}>
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> {t.career_salary}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">{t.career_salary}</p>
                    <p className={cn(
                      "text-xl font-black transition-colors duration-300",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>{career.salary}</p>
                  </div>
                  {career.avgSalary && (
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase mb-1">{t.career_avg_salary}</p>
                      <p className={cn(
                        "text-xl font-black transition-colors duration-300",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>{career.avgSalary}</p>
                    </div>
                  )}
                </div>
                <p className="text-blue-600/70 text-sm font-medium mt-4">{career.scope}</p>
              </section>

              {career.certifications && career.certifications.length > 0 && (
                <section>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" /> {t.career_certifications}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {career.certifications.map(cert => (
                      <span key={cert} className={cn(
                        "px-4 py-2 rounded-2xl text-sm font-bold border transition-colors duration-300",
                        darkMode ? "bg-orange-900/20 text-orange-400 border-orange-900/30" : "bg-orange-50 text-orange-700 border-orange-100"
                      )}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-400"
                )}>
                  <GraduationCap className="w-4 h-4" /> {t.career_education}
                </h3>
                <div className={cn(
                  "relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 transition-all duration-300",
                  darkMode ? "before:bg-white/10" : "before:bg-gray-100"
                )}>
                  {career.pathway.map((p, i) => (
                    <div key={i} className="relative">
                      <div className={cn(
                        "absolute -left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300",
                        darkMode ? "bg-gray-900 border-blue-500" : "bg-white border-blue-500"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <p className={cn(
                        "font-bold transition-colors duration-300",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>{p}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={cn(
                "p-8 rounded-[32px] border transition-all duration-300",
                darkMode ? "bg-emerald-900/20 border-emerald-900/30" : "bg-emerald-50 border-emerald-100"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn(
                    "text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors duration-300",
                    darkMode ? "text-emerald-400" : "text-emerald-600"
                  )}>
                    <Star className="w-4 h-4" /> {t.career_outlook}
                  </h3>
                  {career.outlookPercentage && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black transition-colors duration-300",
                      darkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                    )}>
                      +{career.outlookPercentage} {t.career_outlook_pct}
                    </span>
                  )}
                </div>
                <p className={cn(
                  "leading-relaxed font-medium transition-colors duration-300",
                  darkMode ? "text-emerald-100/80" : "text-gray-700"
                )}>{career.outlook}</p>
              </section>
            </div>
          </div>

          <div className={cn(
            "mt-12 pt-12 border-t transition-colors duration-300",
            darkMode ? "border-white/10" : "border-gray-100"
          )}>
            <p className={cn(
              "text-sm italic text-center transition-colors duration-300",
              darkMode ? "text-gray-500" : "text-gray-400"
            )}>Detailed roadmap and expert guidance available for premium members.</p>
          </div>
        </div>
      </div>
    </Card3D>

    <section className={cn(
      "mt-12 backdrop-blur-xl rounded-[48px] p-12 border relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center transition-all duration-300",
      darkMode ? "bg-white/5 border-white/10" : "bg-gray-900 border-gray-800"
    )}>
      <div className="relative z-10">
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Future Career Outlook</h2>
        <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-8">Exploring the vast universe of possibilities</p>
        <div className={cn(
          "max-w-md mx-auto font-medium leading-relaxed transition-colors duration-300",
          darkMode ? "text-gray-400" : "text-gray-300"
        )}>
          The career path for a <span className="text-white font-black">{career.title}</span> is as expansive as the stars. 
          With the right skills and determination, you can build a legacy that lasts.
        </div>
      </div>
    </section>
    </div>
  );
};

const FirstIncomePage = ({ lang }: { lang: string }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const navigate = useNavigate();
  
  const incomeSkills = [
    {
      title: "Social Media Influencer",
      icon: "📱",
      platforms: ["Instagram", "YouTube", "Reels"],
      steps: [
        { text: "Open Instagram/YouTube app and click 'Sign Up'.", detail: "Use a professional email and a catchy username related to your niche." },
        { text: "Switch to a 'Professional Account' in Settings.", detail: "Go to Settings > Account Type > Switch to Professional. This gives you analytics." },
        { text: "Choose a niche (Gaming, Tech, Fashion).", detail: "Focus on one topic so the algorithm knows who to show your content to." },
        { text: "Post 1 Reel/Short every day for 30 days.", detail: "Click the '+' icon, select 'Reel', add trending music, and use 5-10 relevant hashtags." },
        { text: "Engage with your audience.", detail: "Reply to every comment and follow other creators in your niche to build a community." }
      ]
    },
    {
      title: "Freelancing",
      icon: "💻",
      platforms: ["Fiverr", "Upwork", "Freelancer.com"],
      steps: [
        { text: "Go to Fiverr.com and click 'Become a Seller'.", detail: "Complete your profile with a professional photo and a clear description of what you can do." },
        { text: "Create your first 'Gig'.", detail: "Click 'Create a New Gig'. Title it: 'I will [service] for you'. Example: 'I will design a logo'." },
        { text: "Set your pricing starting at $5.", detail: "Click 'Pricing' tab. Offer a basic, standard, and premium package." },
        { text: "Add a portfolio image.", detail: "Upload 3 samples of your work so clients can see your quality." },
        { text: "Promote your gig on social media.", detail: "Share your gig link on LinkedIn or Twitter to get your first order." }
      ]
    },
    {
      title: "Making Websites",
      icon: "🌐",
      platforms: ["WordPress", "Wix", "Shopify"],
      steps: [
        { text: "Go to WordPress.com or buy hosting from Bluehost.", detail: "Click 'Get Started'. Choose a domain name (e.g., yourname.com)." },
        { text: "Install a theme like 'Astra'.", detail: "Go to Dashboard > Appearance > Themes > Add New. Search for 'Astra' and click 'Install'." },
        { text: "Install 'Elementor' page builder.", detail: "Go to Plugins > Add New. Search for 'Elementor'. Install and Activate." },
        { text: "Create your first page.", detail: "Go to Pages > Add New. Click 'Edit with Elementor'. Drag and drop elements to design." },
        { text: "Offer your service to local businesses.", detail: "Find local shops without websites. Show them your sample and offer a low price to start." }
      ]
    },
    {
      title: "Telecalling / Virtual Assistant",
      icon: "📞",
      platforms: ["LinkedIn", "Indeed", "Internshala"],
      steps: [
        { text: "Open LinkedIn and search for 'Remote Virtual Assistant'.", detail: "Filter by 'Remote' and 'Entry Level' to find the best matches." },
        { text: "Optimize your profile.", detail: "Add a headline like 'Aspiring Virtual Assistant | Skilled in Data Entry & Scheduling'." },
        { text: "Apply with a personalized note.", detail: "Click 'Apply'. In the message, say: 'I am highly organized and ready to help you save time'." },
        { text: "Set up a professional workspace at home.", detail: "Ensure you have a quiet room, good internet, and a clear voice for calls." },
        { text: "Track your applications.", detail: "Use an Excel sheet to note where you applied and follow up after 3 days." }
      ]
    }
  ];

  return (
    <div className="pb-24 max-w-4xl mx-auto px-6 relative z-10">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className={cn(
            "font-bold flex items-center gap-1 mb-6 hover:gap-2 transition-all px-4 py-2 rounded-xl backdrop-blur-md transition-colors duration-300",
            darkMode ? "text-white bg-white/10" : "text-gray-900 bg-gray-100"
          )}
        >
          <X className="w-4 h-4 rotate-45" /> {t.back}
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[48px] p-12 text-white mb-12 relative overflow-hidden shadow-2xl border border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Create Your First Income</h1>
          <p className="text-emerald-50 text-xl max-w-2xl leading-relaxed font-medium">
            Stop waiting, start earning. Use the skills you already have to make your first ₹10,000.
          </p>
          <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
            <p className="text-sm font-bold uppercase tracking-widest mb-2 text-emerald-200">Pro Tip</p>
            <p className="italic text-lg">"Don't just earn, learn. Polishing your communication and technical skills now will make you a leader tomorrow."</p>
          </div>
        </div>
      </div>

      <div className={cn(
        "backdrop-blur-xl border-2 p-8 rounded-[40px] mb-12 shadow-sm transition-all duration-300",
        darkMode ? "bg-blue-900/40 border-blue-500/30" : "bg-blue-50 border-blue-100"
      )}>
        <h3 className={cn(
          "text-2xl font-black mb-4 flex items-center gap-3 transition-colors duration-300",
          darkMode ? "text-blue-200" : "text-blue-600"
        )}>
          <Info className="w-8 h-8" /> Don't know your skill yet?
        </h3>
        <p className={cn(
          "text-lg mb-6 leading-relaxed transition-colors duration-300",
          darkMode ? "text-blue-100" : "text-blue-900/70"
        )}>
          It's okay! Most successful people started without knowing their best skill. Here is how to find yours:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Try 3 different skills from below for 1 week each.",
            "Ask 5 friends: 'What is one thing I am better at than others?'",
            "Notice what you enjoy doing even when you are tired.",
            "Take our Career Quiz to see your natural strengths."
          ].map((tip, i) => (
            <div key={i} className={cn(
              "backdrop-blur-md p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100"
            )}>
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">{i+1}</div>
              <p className={cn(
                "font-bold transition-colors duration-300",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {incomeSkills.map((skill, index) => (
          <Card3D key={index}>
            <div className={cn(
              "backdrop-blur-2xl p-10 rounded-[48px] border shadow-xl h-full transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
            )}>
              <div className="flex items-center gap-6 mb-8">
                <div className="text-5xl">{skill.icon}</div>
                <div>
                  <h2 className={cn(
                    "text-3xl font-black transition-colors duration-300",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>{skill.title}</h2>
                  <div className="flex gap-2 mt-2">
                    {skill.platforms.map(p => (
                      <span key={p} className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold border transition-colors duration-300",
                        darkMode ? "bg-white/5 text-gray-300 border-white/5" : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {skill.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-6 group">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all shrink-0",
                      darkMode ? "bg-white/5 text-gray-400 group-hover:bg-blue-600 group-hover:text-white" : "bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white"
                    )}>
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <p className={cn(
                        "text-lg font-black mb-1 transition-colors duration-300",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>{step.text}</p>
                      <p className={cn(
                        "text-sm font-medium leading-relaxed transition-colors duration-300",
                        darkMode ? "text-gray-400" : "text-gray-500"
                      )}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => window.open(`https://www.google.com/search?q=how+to+start+${skill.title.toLowerCase()}`, '_blank')}
                className="mt-10 w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
              >
                Start Now
              </button>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = ({ user, onUpdate, onLogout, onUpgrade, onCancelPremium, lang }: { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void, onLogout: () => void, onUpgrade: () => void, onCancelPremium: () => void, lang: string }) => {
  const { darkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '🚀');
  const navigate = useNavigate();

  const avatars = ['🚀', '👨‍🚀', '👩‍🚀', '🤖', '👾', '🌟', '🔥', '💎', '🌈', '🦁', '🦉', '🦊'];

  const handleSave = () => {
    onUpdate({ name, avatar: selectedAvatar });
    setIsEditing(false);
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-6 relative z-10">
      <div className={cn(
        "backdrop-blur-3xl rounded-[48px] p-12 border shadow-[0_0_50px_rgba(0,0,0,0.3)] mb-8 relative overflow-hidden transition-all duration-300",
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100 text-gray-900 shadow-gray-200/50"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors duration-300",
          darkMode ? "bg-blue-900/20" : "bg-blue-600/10"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 w-64 h-64 blur-[100px] rounded-full -ml-32 -mb-32 transition-colors duration-300",
          darkMode ? "bg-purple-900/20" : "bg-purple-600/10"
        )} />
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative group"
          >
            <div className={cn(
              "text-8xl mb-6 w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-[0_0_40px_rgba(59,130,246,0.3)] backdrop-blur-xl transition-all duration-300",
              darkMode ? "bg-white/5 border-blue-500/30" : "bg-gray-50 border-blue-100"
            )}>
              {selectedAvatar}
            </div>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs font-black uppercase tracking-widest text-white">Change</span>
              </div>
            )}
          </motion.div>

          {isEditing ? (
            <div className="w-full space-y-6">
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {avatars.map(a => (
                  <button 
                    key={a} 
                    onClick={() => setSelectedAvatar(a)}
                    className={cn(
                      "text-3xl p-3 rounded-2xl transition-all",
                      selectedAvatar === a 
                        ? "bg-blue-600 scale-110 shadow-lg" 
                        : (darkMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200")
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full border-2 rounded-2xl p-4 text-center text-2xl font-black outline-none focus:border-blue-500 transition-all shadow-sm",
                  darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-blue-100 text-gray-900"
                )}
                placeholder="Enter your name"
              />
              <div className="flex gap-4">
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Save Changes</button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all",
                    darkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full">
              <h1 className={cn(
                "text-4xl font-black mb-2 tracking-tight transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{user.name}</h1>
              <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-6">Level {Math.floor(user.xp / 1000) + 1} Explorer</p>
              
              {/* XP Progress Bar */}
              <div className="mb-8 max-w-xs mx-auto">
                <div className={cn(
                  "flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 transition-colors duration-300",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <span>Progress</span>
                  <span>{user.xp % 1000} / 1000 XP</span>
                </div>
                <div className={cn(
                  "w-full h-3 rounded-full overflow-hidden border transition-colors duration-300",
                  darkMode ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-200"
                )}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp % 1000) / 1000 * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(true)} 
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                  darkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
                )}
              >Edit Profile</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className={cn(
            "p-4 rounded-3xl border text-center transition-colors duration-300",
            darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
          )}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total XP</p>
            <p className="text-xl font-black text-yellow-400">{user.xp}</p>
          </div>
          <div className={cn(
            "p-4 rounded-3xl border text-center transition-colors duration-300",
            darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
          )}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Level</p>
            <p className="text-xl font-black text-blue-400">{Math.floor(user.xp / 1000) + 1}</p>
          </div>
          <div className={cn(
            "p-4 rounded-3xl border text-center transition-colors duration-300",
            darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
          )}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saved</p>
            <p className="text-xl font-black text-emerald-400">{user.savedCareers?.length || 0}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn(
            "p-6 rounded-3xl border flex items-center justify-between transition-colors duration-300",
            darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
          )}>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Premium Status</p>
              <p className={cn("text-lg font-black", user.isPremium ? "text-yellow-400" : "text-gray-500")}>
                {user.isPremium ? "Active Member" : "Free Member"}
              </p>
            </div>
            {user.isPremium ? (
              <button onClick={onCancelPremium} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20">Cancel</button>
            ) : (
              <button onClick={() => setIsPaymentOpen(true)} className="px-4 py-2 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20">Upgrade</button>
            )}
          </div>

          <button onClick={onLogout} className="w-full p-6 bg-white/5 rounded-3xl border border-white/10 text-left flex items-center justify-between group hover:bg-red-500/10 transition-all">
            <span className="font-black uppercase tracking-widest text-sm group-hover:text-red-500 transition-colors">Logout</span>
            <X className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onPaymentSuccess={onUpgrade}
        lang={lang}
      />

      {/* Badges Showcase */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-[48px] p-12 border border-white/10 shadow-2xl text-white">
        <div className="flex items-center gap-4 mb-8">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">Your Achievements</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {BADGES.map((badge) => {
            const isUnlocked = user.badges?.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={cn(
                  "flex flex-col items-center p-6 rounded-[32px] border transition-all",
                  isUnlocked 
                    ? "bg-white/5 border-yellow-400/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                    : "bg-black/20 border-white/5 opacity-40 grayscale"
                )}
              >
                <div className="text-4xl mb-4">{badge.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{badge.name}</p>
                {isUnlocked && (
                  <div className="mt-2 px-2 py-0.5 bg-yellow-400 text-black rounded-full text-[8px] font-black uppercase">Unlocked</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose, lang, onSubmit }: { isOpen: boolean, onClose: () => void, lang: string, onSubmit: (type: string, message: string) => void }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [type, setType] = useState<'Bug' | 'Improvement' | 'Other'>('Improvement');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    await onSubmit(type, message);
    setIsSubmitting(false);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-md p-8 relative shadow-2xl overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t.feedback_title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{t.feedback_desc}</p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
              {t.feedback_type}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Bug', label: t.feedback_type_bug },
                { id: 'Improvement', label: t.feedback_type_improvement },
                { id: 'Other', label: t.feedback_type_other }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setType(opt.id as any)}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] font-bold transition-all",
                    type === opt.id ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
              {t.feedback_message}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm outline-none focus:border-blue-300 transition-all resize-none text-black"
              placeholder="..."
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isSubmitting}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all",
            message.trim() && !isSubmitting ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Sending..." : t.feedback_submit}
        </button>
      </motion.div>
    </div>
  );
};

const Profile = ({ user, lang, onUnsave, onFeedback }: { user: UserProfile, lang: string, onUnsave: (id: string) => void, onFeedback: () => void }) => {
  const { darkMode } = useTheme();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const level = Math.floor(user.xp / 500) + 1;
  const xpInLevel = user.xp % 500;
  const xpProgress = (xpInLevel / 500) * 100;

  const savedCareers = CAREERS.filter(c => user.savedCareers.includes(c.id));

  // Badge Progress Logic
  const badgeProgress = [
    { id: 'explorer', current: user.unlockedPaths.length, total: 3, icon: '🧭' },
    { id: 'quiz-master', current: user.xp > 0 ? 1 : 0, total: 1, icon: '🎯' },
    { id: 'milestone-1000', current: user.xp, total: 1000, icon: '⭐' }
  ];

  const stats = [
    { label: t.xp, value: user.xp, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Level", value: level, icon: Target, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Badges", value: user.badges.length, icon: Award, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Premium", value: user.isPremium ? "Active" : "Inactive", icon: Zap, color: user.isPremium ? "text-emerald-500" : "text-gray-400", bg: user.isPremium ? "bg-emerald-50" : "bg-gray-50" },
  ];

  return (
    <div className="pb-32 max-w-2xl mx-auto space-y-12">
      <header className="text-center space-y-6">
        <div className="relative inline-block">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -inset-4 border-2 border-dashed rounded-full transition-colors duration-300",
              darkMode ? "border-blue-500/20" : "border-blue-200"
            )}
          />
          <div className={cn(
            "w-32 h-32 border-2 rounded-[48px] flex items-center justify-center mx-auto shadow-xl relative z-10 text-4xl font-black transition-all duration-300",
            darkMode ? "bg-gray-900 border-white/10 text-blue-400 shadow-blue-900/20" : "bg-white border-blue-100 text-blue-600 shadow-blue-50"
          )}>
            {user.name[0].toUpperCase()}
          </div>
        </div>
        <div>
          <h1 className={cn(
            "text-4xl font-black tracking-tighter transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>{user.name}</h1>
          <p className={cn(
            "font-medium transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>{user.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
              darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
            )}>
              {user.class}
            </span>
            {user.isPremium && (
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors duration-300",
                darkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
              )}>
                <Zap className="w-3 h-3" /> Premium
              </span>
            )}
          </div>
        </div>
      </header>

      {!user.isPremium && (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={cn(
            "border-2 p-8 rounded-[40px] shadow-xl relative overflow-hidden group cursor-pointer transition-all duration-300",
            darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-blue-100 text-gray-900 shadow-blue-50"
          )}
          onClick={() => setIsPaymentOpen(true)}
        >
          <div className={cn(
            "absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 opacity-50",
            darkMode ? "bg-blue-900/20" : "bg-blue-50"
          )} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h3 className={cn(
                "text-2xl font-black tracking-tight transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>Upgrade to Pro</h3>
              <p className={cn(
                "text-sm font-medium transition-colors duration-300",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>Unlock 1-on-1 Mentorship, AI Mock Interviews, and more!</p>
              <div className="flex items-center gap-4 mt-4">
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-300",
                  darkMode ? "bg-blue-900/40 text-blue-300 border-blue-900/60" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  <CheckCircle2 className="w-3 h-3" /> Expert Mentors
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-300",
                  darkMode ? "bg-blue-900/40 text-blue-300 border-blue-900/60" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  <CheckCircle2 className="w-3 h-3" /> AI Analysis
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-blue-600">₹499</p>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                darkMode ? "text-gray-500" : "text-gray-400"
              )}>One-time payment</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-6 rounded-[32px] border shadow-sm text-center space-y-2 transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-colors duration-300",
              darkMode ? "bg-white/10" : s.bg
            )}>
              <s.icon className={cn("w-5 h-5", darkMode ? "text-blue-400" : s.color)} />
            </div>
            <p className={cn(
              "text-2xl font-black transition-colors duration-300",
              darkMode ? "text-white" : "text-gray-900"
            )}>{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            "text-xl font-black flex items-center gap-2 transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <Award className="w-6 h-6 text-yellow-500" /> {t.profile_badges_title}
          </h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.profile_badge_progress}</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {BADGES.map(badge => {
            const isEarned = user.badges.includes(badge.id);
            const progress = badgeProgress.find(p => p.id === badge.id);
            const percent = progress ? Math.min((progress.current / progress.total) * 100, 100) : 0;

            return (
              <div key={badge.id} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all border-2 relative group",
                  isEarned 
                    ? (darkMode ? "bg-yellow-900/20 border-yellow-500/40 shadow-lg shadow-yellow-900/20" : "bg-yellow-50 border-yellow-200 shadow-lg shadow-yellow-100")
                    : (darkMode ? "bg-white/5 border-white/10 grayscale opacity-30" : "bg-gray-50 border-gray-100 grayscale opacity-50")
                )}>
                  {badge.icon}
                  {!isEarned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <p className="font-black">{badge.name}</p>
                    <p className="opacity-70">{badge.description}</p>
                  </div>
                </div>
                {!isEarned && progress && (
                  <div className={cn(
                    "w-full h-1.5 rounded-full overflow-hidden mt-1 transition-colors duration-300",
                    darkMode ? "bg-white/5" : "bg-gray-100"
                  )}>
                    <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-12">
        <h3 className={cn(
          "text-xl font-black mb-6 flex items-center gap-2 transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          <Bookmark className="w-6 h-6 text-blue-500" /> {t.profile_saved_careers}
        </h3>
        {savedCareers.length > 0 ? (
          <div className="space-y-4">
            {savedCareers.map(c => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300",
                  darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/40" : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50"
                )}
              >
                <div className="cursor-pointer flex-1" onClick={() => navigate(`/career/${c.id}`)}>
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-black transition-colors duration-300",
                      darkMode ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"
                    )}>{c.title}</h4>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1 opacity-0 group-hover:opacity-100" />
                  </div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{c.category}</p>
                </div>
                <button 
                  onClick={() => onUnsave(c.id)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    darkMode ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20" : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                  )}
                  title={t.career_unsave}
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "rounded-[40px] p-12 text-center border border-dashed transition-all duration-300",
            darkMode ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200"
          )}>
            <p className="text-gray-400 font-medium italic">{t.profile_no_saved}</p>
          </div>
        )}
      </section>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onPaymentSuccess={() => {
          const updated = { ...user, isPremium: true };
          localStorage.setItem('careerquest_user', JSON.stringify(updated));
          window.location.reload();
        }}
        lang={lang}
      />

      <section>
        <h3 className={cn(
          "text-xl font-black mb-6 flex items-center gap-2 transition-colors duration-300",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" /> {t.profile_interests}
        </h3>
        <div className="flex flex-wrap gap-2">
          {user.interests.map(i => (
            <span key={i} className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors duration-300",
              darkMode ? "bg-emerald-900/40 text-emerald-300 border-emerald-900/60" : "bg-emerald-50 text-emerald-700 border-emerald-100"
            )}>
              {i}
            </span>
          ))}
          {user.hobbies.map(h => (
            <span key={h} className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors duration-300",
              darkMode ? "bg-blue-900/40 text-blue-300 border-blue-900/60" : "bg-blue-50 text-blue-700 border-blue-100"
            )}>
              {h}
            </span>
          ))}
          {user.strengths.map(s => (
            <span key={s} className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors duration-300",
              darkMode ? "bg-purple-900/40 text-purple-300 border-purple-900/60" : "bg-purple-50 text-purple-700 border-purple-100"
            )}>
              {s}
            </span>
          ))}
        </div>
      </section>

      <UserProgressCharts user={user} lang={lang} />

      <section className="mt-12 space-y-4">
        <button 
          onClick={onFeedback}
          className={cn(
            "w-full flex items-center justify-between p-6 border rounded-3xl hover:shadow-lg transition-all group duration-300",
            darkMode ? "bg-white/5 border-white/10 hover:border-blue-500/40" : "bg-white border-gray-100 hover:shadow-blue-50"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300",
              darkMode ? "bg-blue-900/40" : "bg-blue-50"
            )}>
              <MessageSquare className={cn(
                "w-6 h-6 group-hover:text-white transition-colors duration-300",
                darkMode ? "text-blue-400" : "text-blue-600"
              )} />
            </div>
            <div className="text-left">
              <h4 className={cn(
                "font-black transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{t.feedback_title}</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Help us improve</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
        </button>

        <button 
          onClick={() => signOut(auth)}
          className={cn(
            "w-full flex items-center justify-between p-6 border rounded-3xl hover:shadow-lg transition-all group duration-300",
            darkMode ? "bg-white/5 border-white/10 hover:border-red-500/40" : "bg-white border-gray-100 hover:shadow-red-50"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300",
              darkMode ? "bg-red-900/40" : "bg-red-50"
            )}>
              <X className={cn(
                "w-6 h-6 group-hover:text-white transition-colors duration-300",
                darkMode ? "text-red-400" : "text-red-600"
              )} />
            </div>
            <div className="text-left">
              <h4 className={cn(
                "font-black transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>Logout</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sign out of your account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" />
        </button>
      </section>
    </div>
  );
};

const CategoryPage = ({ lang, onExplore }: { lang: string, onExplore?: () => void }) => {
  const { darkMode } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const careers = CAREERS.filter(c => c.category.toLowerCase().replace(/\s+/g, '-').includes(id || ''));
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(careers.length / itemsPerPage);
  const currentCareers = careers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    onExplore?.();
    setCurrentPage(1); // Reset to first page when category changes
  }, [id]);

  return (
    <div className="pb-24 max-w-6xl mx-auto px-4 relative z-10">
      <button 
        onClick={() => navigate('/explorer')} 
        className="text-blue-400 font-black flex items-center gap-2 mb-8 hover:text-blue-300 transition-colors uppercase tracking-widest text-[10px]"
      >
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </button>
      <h1 className={cn(
        "text-4xl md:text-5xl font-black mb-10 capitalize tracking-tight text-center md:text-left transition-colors duration-300",
        darkMode ? "text-white" : "text-gray-900"
      )}>{id} {t.streams_careers}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {currentCareers.map(c => (
          <Card3D 
            key={c.id} 
            onClick={() => navigate(`/career/${c.id}`)}
            className="group"
          >
            <div className={cn(
              "p-8 md:p-10 rounded-[48px] border shadow-sm hover:shadow-2xl transition-all cursor-pointer h-full flex flex-col transition-all duration-300",
              darkMode 
                ? "bg-white/5 border-white/10 hover:border-blue-500/50" 
                : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 pr-4">
                  <h2 className={cn(
                    "text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tight mb-2 transition-colors duration-300",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>{c.title}</h2>
                  <p className={cn(
                    "font-medium text-sm line-clamp-2 leading-relaxed transition-colors duration-300",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>{c.description}</p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 border shrink-0 transition-colors duration-300",
                  darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                )}>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            
              <div className="flex flex-wrap gap-2 mb-8 flex-1">
                {c.skills.slice(0, 4).map(s => (
                  <span key={s} className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors duration-300",
                    darkMode ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-100"
                  )}>
                    {s}
                  </span>
                ))}
                {c.skills.length > 4 && (
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors duration-300",
                    darkMode ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    +{c.skills.length - 4} More
                  </span>
                )}
              </div>

              <div className={cn(
                "grid grid-cols-2 gap-4 p-6 rounded-[32px] border transition-colors duration-300",
                darkMode ? "bg-blue-900/20 border-blue-900/30" : "bg-blue-50/50 border-blue-50"
              )}>
                <div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">{t.career_salary}</p>
                  <p className={cn(
                    "font-black text-lg transition-colors duration-300",
                    darkMode ? "text-blue-400" : "text-blue-900"
                  )}>{c.salary}</p>
                </div>
                <div className={cn(
                  "text-right border-l pl-4 transition-colors duration-300",
                  darkMode ? "border-blue-900/50" : "border-blue-100"
                )}>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">{t.exams}</p>
                  <p className={cn(
                    "font-black text-lg truncate transition-colors duration-300",
                    darkMode ? "text-blue-400" : "text-blue-900"
                  )}>{c.exams[0]}</p>
                </div>
              </div>
            </div>
          </Card3D>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={cn(
              "p-3 rounded-2xl border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 font-bold flex items-center gap-2 transition-all",
              darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-100 hover:bg-blue-50"
            )}
          >
            <ChevronRight className="w-5 h-5 rotate-180" /> {t.back}
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl font-bold transition-all",
                  currentPage === page 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "bg-white border border-gray-100 text-gray-400 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
          >
            {t.next} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const Badge = ({ name, icon: Icon, color }: any) => (
  <div className={cn("flex items-center gap-2 p-3 rounded-2xl border border-gray-100 shadow-sm", color)}>
    <Icon className="w-5 h-5" />
    <span className="font-bold text-xs uppercase tracking-tight">{name}</span>
  </div>
);

const MockInterviewPage = ({ lang, user, onComplete }: { lang: string, user: UserProfile, onComplete: (xp: number) => void }) => {
  const { darkMode } = useTheme();
  const [step, setStep] = useState<'intro' | 'interview' | 'feedback'>('intro');
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async (career: Career) => {
    setSelectedCareer(career);
    setStep('interview');
    setLoading(true);
    
    const initialPrompt = `You are an expert interviewer for the position of ${career.title}. 
    Start the interview by introducing yourself and asking the first question. 
    Keep it professional and realistic.`;
    
    try {
      const response = await getChatResponseStream(initialPrompt, [], undefined, lang);
      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk;
      }
      setMessages([{ role: 'ai', text: fullText }]);
    } catch (error) {
      console.error("Interview start failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getChatResponseStream(userMsg, messages, undefined, lang);
      let fullText = '';
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);
      
      for await (const chunk of response) {
        fullText += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: fullText }];
        });
      }
    } catch (error) {
      console.error("Message failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    setLoading(true);
    const feedbackPrompt = `The interview for ${selectedCareer?.title} has ended. 
    Based on the following conversation, provide a detailed feedback report. 
    Include:
    1. Strengths
    2. Areas for improvement
    3. Overall score (out of 10)
    4. Tips for the real interview.
    
    Conversation:
    ${messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}`;

    try {
      const response = await getChatResponseStream(feedbackPrompt, [], undefined, lang);
      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk;
      }
      setFeedback(fullText);
      setStep('feedback');
      onComplete(50); // Award 50 XP for completing an interview
    } catch (error) {
      console.error("Feedback failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <header className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-24 h-24 border-2 rounded-[32px] flex items-center justify-center mx-auto shadow-xl transition-all duration-300",
              darkMode ? "bg-white/5 border-white/10 shadow-blue-900/20" : "bg-white border-blue-100 shadow-blue-50"
            )}
          >
            <Bot className="w-12 h-12 text-blue-600" />
          </motion.div>
          <div className="space-y-2">
            <h1 className={cn(
              "text-5xl font-black tracking-tighter transition-colors duration-300",
              darkMode ? "text-white" : "text-gray-900"
            )}>AI Mock Interview</h1>
            <p className={cn(
              "font-medium text-lg transition-colors duration-300",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>Master your interview skills with our AI mentor. Select a career to begin.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CAREERS.slice(0, 6).map((career, i) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => startInterview(career)}
              className={cn(
                "p-8 rounded-[40px] border shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden transition-all duration-300",
                darkMode 
                  ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:shadow-blue-900/20" 
                  : "bg-white border-gray-100 hover:border-blue-100 shadow-gray-200/50 hover:shadow-blue-50"
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className={cn(
                    "text-xl font-black transition-colors duration-300",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>{career.title}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{career.category}</p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors transition-colors duration-300",
                  darkMode ? "bg-white/5" : "bg-blue-50"
                )}>
                  <ChevronRight className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className={cn(
        "max-w-3xl mx-auto h-[80vh] flex flex-col rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-300",
        darkMode ? "bg-gray-900 border-white/10" : "bg-white border-gray-100"
      )}>
        <header className={cn(
          "p-6 border-b flex items-center justify-between transition-colors duration-300",
          darkMode ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50/50"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={cn(
                "font-black transition-colors duration-300",
                darkMode ? "text-white" : "text-gray-900"
              )}>{selectedCareer?.title} Interview</h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Simulation in Progress</p>
            </div>
          </div>
          <button 
            onClick={endInterview}
            className={cn(
              "px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-colors duration-300",
              darkMode ? "bg-red-900/20 text-red-400 hover:bg-red-900/40" : "bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            End Session
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                m.role === 'ai' ? "justify-start" : "justify-end"
              )}
            >
              <div className={cn(
                "max-w-[80%] p-6 rounded-[32px] text-sm font-medium leading-relaxed shadow-sm transition-all duration-300",
                m.role === 'ai' 
                  ? (darkMode ? "bg-white/5 text-gray-300 rounded-tl-none border border-white/10" : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100") 
                  : "bg-blue-600 text-white rounded-tr-none shadow-blue-100"
              )}>
                {m.text || (
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <footer className={cn(
          "p-6 border-t transition-colors duration-300",
          darkMode ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-100"
        )}>
          <div className="flex gap-4">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your response..."
              className={cn(
                "flex-1 border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300",
                darkMode ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              )}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  if (step === 'feedback') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        <header className="text-center space-y-4">
          <div className={cn(
            "w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto transition-colors duration-300",
            darkMode ? "bg-emerald-900/20" : "bg-emerald-100"
          )}>
            <Award className={cn(
              "w-10 h-10 transition-colors duration-300",
              darkMode ? "text-emerald-400" : "text-emerald-600"
            )} />
          </div>
          <h2 className={cn(
            "text-4xl font-black tracking-tighter transition-colors duration-300",
            darkMode ? "text-white" : "text-gray-900"
          )}>Performance Analysis</h2>
          <p className={cn(
            "font-medium transition-colors duration-300",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>Session complete. Review your neural feedback below.</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-10 rounded-[48px] border shadow-xl prose prose-blue max-w-none transition-all duration-300",
            darkMode ? "bg-gray-900 border-white/10 prose-invert" : "bg-white border-gray-100"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 mb-8 p-4 rounded-2xl border transition-colors duration-300",
            darkMode ? "bg-blue-900/20 border-blue-900/40" : "bg-blue-50 border-blue-100"
          )}>
            <Info className={cn(
              "w-5 h-5 transition-colors duration-300",
              darkMode ? "text-blue-400" : "text-blue-600"
            )} />
            <p className={cn(
              "text-xs font-black uppercase tracking-widest m-0 transition-colors duration-300",
              darkMode ? "text-blue-300" : "text-blue-800"
            )}>AI-Generated Insights</p>
          </div>
          <div className={cn(
            "leading-relaxed font-medium transition-colors duration-300",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            <Markdown>{feedback || ''}</Markdown>
          </div>
        </motion.div>

        <div className="flex gap-4">
          <button 
            onClick={() => setStep('intro')}
            className={cn(
              "flex-1 py-5 rounded-3xl font-black shadow-sm transition-all duration-300",
              darkMode ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" : "bg-white border border-gray-100 text-gray-900 hover:bg-gray-50"
            )}
          >
            New Simulation
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default function App() {
  const navigate = useNavigate();
  const [realMentors, setRealMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const q = query(collection(db, 'mentors'), where('isVerified', '==', true));
        const snapshot = await getDocs(q);
        const mentorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mentor));
        setRealMentors(mentorsData.length > 0 ? mentorsData : MENTORS); // Fallback to static if none in DB
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'mentors');
      } finally {
        setLoadingMentors(false);
      }
    };
    fetchMentors();
  }, []);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('English');
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'AI' | 'LIVE'>('AI');
  const [selectedMentorForChat, setSelectedMentorForChat] = useState<Mentor | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('careerquest_darkmode');
    return saved ? JSON.parse(saved) : true;
  });
  const theme = getThemeConfig();

  useEffect(() => {
    localStorage.setItem('careerquest_darkmode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCancelPremium = () => {
    if (!user) return;
    const updated = { 
      ...user, 
      isPremium: false, 
      premiumExpiry: undefined 
    };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
    setNotification("Your premium subscription has been cancelled.");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpdateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
    setNotification("Profile updated successfully!");
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('careerquest_user');
    if (saved) {
      const userData = JSON.parse(saved);
      // Ensure new fields exist for legacy users
      if (!userData.savedCareers) userData.savedCareers = [];
      if (userData.isPremium === undefined) userData.isPremium = false;
      if (!userData.mentorshipRequests) userData.mentorshipRequests = [];
      if (!userData.mentorshipRequestTimestamps) userData.mentorshipRequestTimestamps = {};
      if (!userData.acceptedMentors) userData.acceptedMentors = [];
      if (!userData.bookedSessions) userData.bookedSessions = [];
      setUser(userData);
      if (userData.lang) setLang(userData.lang);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUser(prev => {
        if (!prev) return prev;
        const now = Date.now();
        let changed = false;

        // --- Premium Expiry Check ---
        if (prev.isPremium && prev.premiumExpiry && now > prev.premiumExpiry) {
          prev.isPremium = false;
          prev.premiumExpiry = undefined;
          changed = true;
          setNotification("Your premium subscription has expired. Renew to access exclusive content!");
        }

        const newAcceptedMentors = [...prev.acceptedMentors];

        prev.mentorshipRequests.forEach(mentorId => {
          if (prev.acceptedMentors.includes(mentorId)) return;
          const timestamp = prev.mentorshipRequestTimestamps[mentorId];
          if (!timestamp) return;
          
          // Find mentor to check name if ID is different in Firestore
          const mentor = MENTORS.find(m => m.id === mentorId) || realMentors.find(m => m.id === mentorId);
          const isAnanya = mentorId === 'm1' || mentor?.name.includes('Ananya Sharma');
          const duration = isAnanya ? 5000 : 120000;
          
          if (now >= timestamp + duration) {
            newAcceptedMentors.push(mentorId);
            changed = true;
            setNotification(`Mentor ${mentor?.name || 'Mentor'} has accepted your request!`);
            setTimeout(() => setNotification(null), 5000);
          }
        });

        if (changed) {
          const updated = { ...prev, acceptedMentors: newAcceptedMentors };
          localStorage.setItem('careerquest_user', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [realMentors]);

  const handleOnboarding = (data: any) => {
    const newUser = { 
      ...data, 
      xp: 0, 
      badges: [], 
      unlockedPaths: [], 
      savedCareers: [],
      isPremium: false,
      mentorshipRequests: [],
      mentorshipRequestTimestamps: {},
      acceptedMentors: [],
      bookedSessions: [],
      xpHistory: [{ date: new Date().toISOString().split('T')[0], xp: 0 }],
      skillProficiency: {
        'Communication': 10,
        'Problem Solving': 15,
        'Technical': 5,
        'Creativity': 20,
        'Leadership': 10
      }
    };
    setUser(newUser);
    if (data.lang) setLang(data.lang);
    localStorage.setItem('careerquest_user', JSON.stringify(newUser));
  };

  const handleUpgrade = () => {
    if (!user) return;
    const updated = { 
      ...user, 
      isPremium: true, 
      premiumExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
    setNotification("Welcome to Premium! You now have full access for 30 days.");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleMentorshipAccept = (mentorId: string) => {
    setUser(prev => {
      if (!prev || prev.acceptedMentors.includes(mentorId)) return prev;
      const updated = { ...prev, acceptedMentors: [...prev.acceptedMentors, mentorId] };
      localStorage.setItem('careerquest_user', JSON.stringify(updated));
      
      // Find mentor name for notification
      const mentor = MENTORS.find(m => m.id === mentorId) || realMentors.find(m => m.id === mentorId);
      setNotification(`Mentor ${mentor?.name || 'Mentor'} has accepted your request!`);
      setTimeout(() => setNotification(null), 5000);
      
      return updated;
    });
  };

  const handleMentorshipReset = (mentorId: string) => {
    setUser(prev => {
      if (!prev || !prev.acceptedMentors.includes(mentorId)) return prev;
      const updated = { ...prev, acceptedMentors: prev.acceptedMentors.filter(id => id !== mentorId) };
      localStorage.setItem('careerquest_user', JSON.stringify(updated));
      
      setNotification(`Live session ended. Mentor is now busy. You can request again later.`);
      setTimeout(() => setNotification(null), 5000);
      
      return updated;
    });
  };

  const handleMentorshipRequest = (mentorId: string) => {
    if (!user || !user.isPremium) return;
    if (user.mentorshipRequests.includes(mentorId)) return;
    
    const now = Date.now();
    const updated = { 
      ...user, 
      mentorshipRequests: [...user.mentorshipRequests, mentorId],
      mentorshipRequestTimestamps: { ...user.mentorshipRequestTimestamps, [mentorId]: now }
    };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
  };

  const handleBookSession = async (mentorId: string, date: string, time: string) => {
    if (!user || !user.isPremium) return;
    
    try {
      await addDoc(collection(db, 'bookings'), {
        mentorId,
        studentId: auth.currentUser?.uid,
        studentName: user.name,
        date,
        time,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      const updated = { 
        ...user, 
        bookedSessions: [...user.bookedSessions, { mentorId, date, time }] 
      };
      setUser(updated);
      localStorage.setItem('careerquest_user', JSON.stringify(updated));
      addXP(100); // Award 100 XP for booking a session
      setNotification(TRANSLATIONS[lang]?.mentorship_booking_success || TRANSLATIONS.English.mentorship_booking_success);
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    }
  };

  const handleFeedbackSubmit = async (type: string, message: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser?.uid || 'anonymous',
        userName: user.name,
        type,
        message,
        createdAt: Timestamp.now()
      });
      setNotification(TRANSLATIONS[lang]?.feedback_success || TRANSLATIONS.English.feedback_success);
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'feedback');
    }
  };

  const awardBadge = (badgeId: string) => {
    if (!user || user.badges.includes(badgeId)) return;
    
    const updated = { ...user, badges: [...user.badges, badgeId] };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
    setActiveBadge(badgeId);
  };

  const addXP = (amount: number) => {
    if (!user) return;
    let newBadges = [...user.badges];
    const oldLevel = Math.floor(user.xp / 500) + 1;
    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    
    if (newLevel > oldLevel) {
      setLevelUp(newLevel);
    }

    // Milestone Badges
    if (newXP >= 1000 && !newBadges.includes('milestone-1000')) {
      newBadges.push('milestone-1000');
      setActiveBadge('milestone-1000');
    }

    const today = new Date().toISOString().split('T')[0];
    const newXpHistory = [...(user.xpHistory || [])];
    const lastEntry = newXpHistory[newXpHistory.length - 1];
    
    if (lastEntry && lastEntry.date === today) {
      lastEntry.xp = newXP;
    } else {
      newXpHistory.push({ date: today, xp: newXP });
    }

    // Update skill proficiency randomly for demo
    const skills = Object.keys(user.skillProficiency || {});
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    const newSkillProficiency = { ...(user.skillProficiency || {}) };
    if (randomSkill) {
      newSkillProficiency[randomSkill] = Math.min(100, (newSkillProficiency[randomSkill] || 0) + Math.floor(amount / 10));
    }

    const updated = { 
      ...user, 
      xp: newXP, 
      badges: newBadges, 
      xpHistory: newXpHistory,
      skillProficiency: newSkillProficiency
    };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
  };

  const toggleSaveCareer = (careerId: string) => {
    if (!user) return;
    const isSaved = user.savedCareers.includes(careerId);
    const updated = {
      ...user,
      savedCareers: isSaved 
        ? user.savedCareers.filter(id => id !== careerId)
        : [...user.savedCareers, careerId]
    };
    setUser(updated);
    localStorage.setItem('careerquest_user', JSON.stringify(updated));
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  if (loading) return null;
  if (!user) return <Onboarding onComplete={handleOnboarding} />;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode(!darkMode) }}>
      <div className={cn(
        "min-h-screen font-sans transition-colors duration-300 selection:bg-blue-500 selection:text-white relative overflow-x-hidden",
        darkMode ? "bg-[#020617] text-white" : "bg-gray-50 text-gray-900"
      )}>
        <AnimatedBackground theme={theme} />
        
        {/* Theme Overlays */}
        {theme.type === 'summer' && (
          <div className="fixed inset-0 pointer-events-none z-[1] bg-yellow-500/10 mix-blend-overlay" />
        )}
        {theme.type === 'horror' && (
          <div className="fixed inset-0 pointer-events-none z-[1] bg-red-900/20 mix-blend-multiply" />
        )}

        {/* Header */}
        <header className={cn(
          "sticky top-0 z-30 backdrop-blur-xl border-b transition-all duration-300",
          darkMode ? "bg-white/10 border-white/10 shadow-sm" : "bg-white/80 border-gray-200 shadow-md"
        )}>
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex flex-1 justify-center">
              <SearchBar lang={lang} darkMode={darkMode} />
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "p-2 rounded-xl border transition-all",
                  darkMode ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                )}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <select 
                value={lang} 
                onChange={e => {
                  const newLang = e.target.value;
                  setLang(newLang);
                  if (user) {
                    const updated = { ...user, lang: newLang };
                    setUser(updated);
                    localStorage.setItem('careerquest_user', JSON.stringify(updated));
                  }
                }}
                className={cn(
                  "text-xs font-bold rounded-lg px-2 py-1 outline-none hidden sm:block transition-all",
                  darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-gray-100 border border-gray-200 text-gray-900"
                )}
              >
                {['English', 'Hindi', 'Gujarati', 'Marathi', 'Bengali', 'French', 'German'].map(l => (
                  <option key={l} value={l} className={darkMode ? "bg-gray-900" : "bg-white"}>{l}</option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <XPBadge xp={user.xp} isPremium={user.isPremium} darkMode={darkMode} />
                <button 
                  onClick={() => navigate('/profile')}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                    darkMode ? "bg-white/10 border border-white/10 hover:bg-white/20" : "bg-gray-100 border border-gray-200 hover:bg-gray-200"
                  )}
                >
                  {user.avatar || '🚀'}
                </button>
              </div>
            </div>
          </div>
          <div className="md:hidden px-6 pb-4">
            <SearchBar lang={lang} darkMode={darkMode} />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-6xl mx-auto px-6 pt-8 relative z-10">
          <Routes>
            <Route path="/" element={<Home user={user} lang={lang} />} />
            <Route path="/quiz" element={<Quiz onComplete={(xp) => { addXP(xp); awardBadge('quiz-master'); }} lang={lang} />} />
            <Route path="/explorer" element={<Explorer lang={lang} />} />
            <Route path="/explorer/:id" element={<CategoryPage lang={lang} onExplore={() => awardBadge('explorer')} />} />
            <Route path="/career/:id" element={<CareerPage lang={lang} user={user} onSaveToggle={toggleSaveCareer} />} />
            <Route path="/simulation" element={<Simulation onComplete={addXP} lang={lang} />} />
            <Route path="/first-income" element={<FirstIncomePage lang={lang} />} />
            <Route path="/wheel" element={<Wheel onComplete={addXP} lang={lang} />} />
            <Route path="/exams" element={<ExamsPage lang={lang} />} />
            <Route path="/streams" element={<StreamsPage lang={lang} />} />
            <Route path="/pathways" element={<PathwaysPage user={user} lang={lang} onVisit={() => awardBadge('pathfinder')} />} />
            <Route path="/parents" element={<ParentGuide lang={lang} />} />
            <Route path="/business" element={<BusinessPage lang={lang} />} />
            <Route path="/global" element={<GlobalPage lang={lang} />} />
            <Route path="/mock-interview" element={<MockInterviewPage lang={lang} user={user} onComplete={addXP} />} />
            <Route path="/mentorship" element={
              <MentorshipHub 
                user={user} 
                lang={lang} 
                onUpgrade={handleUpgrade} 
                onRequest={handleMentorshipRequest} 
                onBook={handleBookSession} 
                onChat={(mentor, mode) => {
                  setSelectedMentorForChat(mentor);
                  setChatMode(mode);
                  setIsChatOpen(true);
                }}
                onNotify={(msg) => {
                  setNotification(msg);
                  setTimeout(() => setNotification(null), 3000);
                }}
                onAccept={handleMentorshipAccept}
                realMentors={realMentors}
                loadingMentors={loadingMentors}
              />
            } />
            <Route path="/mentor-signup" element={<MentorOnboarding lang={lang} onComplete={() => { setNotification("Mentor application submitted! We will verify you soon."); navigate('/mentorship'); }} />} />
            <Route path="/profile" element={<ProfilePage user={user!} onUpdate={handleUpdateProfile} onLogout={() => setUser(null)} onUpgrade={handleUpgrade} onCancelPremium={handleCancelPremium} lang={lang} />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center mb-8 border border-blue-500/30"
                >
                  <Compass className="w-16 h-16 text-blue-500" />
                </motion.div>
                <h1 className="text-6xl font-black text-white mb-4 tracking-tighter">404</h1>
                <p className="text-gray-400 font-medium mb-8">Oops! This career path doesn't exist yet.</p>
                <button 
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Back to Earth
                </button>
              </div>
            } />
          </Routes>
        </main>

        <MentorChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mentor={selectedMentorForChat}
          lang={lang}
          mode={chatMode}
          onLiveChatComplete={handleMentorshipReset}
        />

        {/* Bottom Navigation */}
        <nav className={cn(
          "fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-30 transition-all duration-300",
          darkMode ? "bg-white/10 border-white/10 shadow-sm" : "bg-white/80 border-gray-100 shadow-md"
        )}>
          <div className="max-w-2xl mx-auto flex justify-around items-center h-20 px-4">
            <NavButton icon={Compass} label={t.nav_explore} to="/" darkMode={darkMode} />
            <NavButton icon={Target} label={t.nav_quiz} to="/quiz" darkMode={darkMode} />
            <NavButton icon={Users} label="Mentors" to="/mentorship" darkMode={darkMode} />
            <NavButton icon={User} label={t.nav_profile} to="/profile" darkMode={darkMode} />
          </div>
        </nav>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl"
            >
              {notification}
            </motion.div>
          )}
          {isChatOpen && (
            <MentorChatModal 
              isOpen={isChatOpen} 
              onClose={() => {
                if (chatMode === 'LIVE' && selectedMentorForChat) {
                  setUser(prev => {
                    if (!prev) return prev;
                    const updated = {
                      ...prev,
                      acceptedMentors: prev.acceptedMentors.filter(id => id !== selectedMentorForChat.id),
                      mentorshipRequests: prev.mentorshipRequests.filter(id => id !== selectedMentorForChat.id),
                      mentorshipRequestTimestamps: { ...prev.mentorshipRequestTimestamps }
                    };
                    delete updated.mentorshipRequestTimestamps[selectedMentorForChat.id];
                    localStorage.setItem('careerquest_user', JSON.stringify(updated));
                    return updated;
                  });
                  setNotification(`Live session with ${selectedMentorForChat.name} ended. Request again for next session!`);
                  setTimeout(() => setNotification(null), 3000);
                }
                setIsChatOpen(false);
              }} 
              mentor={selectedMentorForChat} 
              lang={lang} 
              mode={chatMode}
            />
          )}
          {activeBadge && (
            <BadgeNotification 
              badgeId={activeBadge} 
              onComplete={() => setActiveBadge(null)} 
            />
          )}
          {levelUp && (
            <LevelUpNotification 
              level={levelUp} 
              onComplete={() => setLevelUp(null)} 
            />
          )}
        </AnimatePresence>

        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)} 
          lang={lang}
          onSubmit={handleFeedbackSubmit}
        />

        <GeminiChat lang={lang} />
      </div>
    </ThemeContext.Provider>
  );
}

const NavButton = ({ icon: Icon, label, to, darkMode }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/' && location.pathname === '/');

  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(to)}
      className={cn(
        "flex flex-col items-center gap-1 transition-all group",
        isActive ? (darkMode ? "text-blue-400" : "text-blue-600") : (darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all shadow-lg",
        isActive 
          ? "bg-blue-600 text-white shadow-blue-500/20 scale-110" 
          : (darkMode ? "bg-white/5 text-gray-500 group-hover:bg-white/10" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200")
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={cn(
        "text-[10px] font-black uppercase tracking-wider",
        darkMode ? "text-gray-500" : "text-gray-400"
      )}>{label}</span>
    </motion.button>
  );
};
