import { useState, useEffect, useRef } from "react";
import { 
  Power, Key, Check, Gift, Settings, Sun, Moon, LogOut, ArrowRight, X,
  Gamepad2, Youtube, Instagram, Twitter, Facebook, Linkedin, Bot, SlidersHorizontal, Globe, Loader2, Sparkles,
  TriangleAlert, Music, Clapperboard, Palette, Swords, RefreshCw, Download, MapPin, ChevronDown, ChevronLeft, Send, Signal, Gauge, LifeBuoy, Layers
} from "lucide-react";

// НЕ ЗАБУДЬТЕ ОБНОВИТЬ ВЕРСИЮ В package.json ТОЖЕ
const CURRENT_VERSION = "1.2.11";

// --- ИКОНКИ ---
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);
const RobloxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
     <path d="M18.926 23.998 0 18.892 5.074.002 24 5.108l-5.074 18.89Zm-8.947-9.528 2.657.717.717-2.657-2.657-.717-.717 2.657Z"/>
  </svg>
);
const GrokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
    <path d="m9 15 6-6"/>
  </svg>
);
const AntigravityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v13"/>
    <path d="m7 8 5-5 5 5"/>
    <path d="M5 20h14"/>
  </svg>
);
const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-.5 3v3.5H8l4 4 4-4h-3.5V7h-1zm0 10v-3.5H8l4-4 4 4h-3.5V17h-1z"/>
  </svg>
);
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);
const RedditIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);
const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.017 0C8.612 0 5.927 2.059 5.927 5.683c0 .4.037.786.1 1.162l-.936.519a.64.64 0 0 0-.32.553.64.64 0 0 0 .64.641c.11 0 .215-.03.307-.082l.986-.548c.574 1.76 1.904 3.05 3.546 3.544-.27.422-.696.7-1.18.7-.155 0-.307-.028-.452-.08-.3-.111-.617-.175-.946-.175-1.043 0-1.9.754-1.9 1.685 0 .074.007.147.018.218C3.963 14.363 2 15.568 2 17.02c0 .297.246.538.55.538.059 0 .116-.009.17-.026.63-.197 1.286-.308 1.957-.308.304 0 .607.027.898.078-.43.988-.7 2.12-.7 3.32 0 1.875 1.56 3.378 3.486 3.378.613 0 1.194-.167 1.694-.461.637-.381 1.335-.586 2.048-.586.714 0 1.41.205 2.047.586.5.294 1.082.461 1.695.461 1.926 0 3.486-1.503 3.486-3.378 0-1.2-.27-2.332-.7-3.32.29-.051.594-.078.897-.078.671 0 1.328.111 1.957.308a.55.55 0 0 0 .17.026.544.544 0 0 0 .55-.538c0-1.452-1.963-2.657-3.79-3.401.011-.071.018-.144.018-.218 0-.931-.857-1.685-1.9-1.685-.33 0-.646.064-.947.175a1.56 1.56 0 0 1-.451.08c-.485 0-.912-.278-1.181-.7 1.642-.494 2.972-1.784 3.546-3.544l.986.548a.64.64 0 0 0 .307.082.64.64 0 0 0 .64-.641.64.64 0 0 0-.32-.553l-.936-.52c.063-.375.1-.76.1-1.161C18.107 2.059 15.422 0 12.017 0z"/>
  </svg>
);
const FigmaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 10.019c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117v-6.038H8.148zm4.587 13.04c0 2.476-2.014 4.49-4.49 4.49s-4.49-2.014-4.49-4.49 2.014-4.49 4.49-4.49h4.49v4.49zm-4.49-3.019a3.019 3.019 0 0 0 0 6.038 3.019 3.019 0 0 0 0-6.038zm16.362-4.49c0 2.476-2.014 4.49-4.49 4.49s-4.49-2.014-4.49-4.49 2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49zm-4.49-3.019a3.019 3.019 0 0 0 0 6.038 3.019 3.019 0 0 0 0-6.038z"/>
  </svg>
);
const NotionIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);
const MediumIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
  </svg>
);
const ZoomIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-7.79-4.5H7.616C6.725 7.5 6 8.225 6 9.116v5.768c0 .891.725 1.616 1.616 1.616H16.21c.891 0 1.616-.725 1.616-1.616V9.116c0-.891-.725-1.616-1.616-1.616zm3.29 1.383l-2.674 1.86v2.514l2.674 1.86c.2.138.5-.004.5-.247V9.13c0-.243-.3-.385-.5-.247z"/>
  </svg>
);
const SoundcloudIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 10.5c-.342 0-.674.04-.995.115A6.498 6.498 0 0 0 12 6a6.498 6.498 0 0 0-2 .316V17h9.5a2.5 2.5 0 0 0 0-5zM1 13.5a1 1 0 0 0 2 0v-2a1 1 0 0 0-2 0v2zm3-2.5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zm3-1a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1zm3-1a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1z"/>
  </svg>
);
const SteamIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.497 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
  </svg>
);

const AVAILABLE_APPS = [
  { id: 'discord', name: 'Discord', icon: <Gamepad2 size={26} className="text-indigo-500" /> },
  { id: 'youtube', name: 'YouTube', icon: <Youtube size={26} className="text-red-500" /> },
  { id: 'instagram', name: 'Instagram', icon: <Instagram size={26} className="text-pink-500" /> },
  { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon className="" /> },
  { id: 'telegram', name: 'Telegram', icon: <Send size={26} className="text-sky-500" /> },
  { id: 'twitter', name: 'Twitter', icon: <Twitter size={26} className="text-blue-400" /> },
  { id: 'facebook', name: 'Facebook', icon: <Facebook size={26} className="text-blue-600" /> },
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={26} className="text-blue-700" /> },
  { id: 'roblox', name: 'Roblox', icon: <RobloxIcon className="text-zinc-600 dark:text-zinc-400" /> },
  { id: 'brawlstars', name: 'Supercell', icon: <Swords size={26} className="text-yellow-500" /> },
  { id: 'netflix', name: 'Netflix', icon: <Clapperboard size={26} className="text-red-600" /> },
  { id: 'spotify', name: 'Spotify', icon: <Music size={26} className="text-green-500" /> },
  { id: 'openai', name: 'ChatGPT', icon: <Bot size={26} className="text-emerald-500" /> },
  { id: 'gemini', name: 'Gemini', icon: <Sparkles size={26} className="text-blue-400" /> },
  { id: 'antigravity', name: 'Antigravity', icon: <AntigravityIcon className="text-indigo-500" /> },
  { id: 'canva', name: 'Canva', icon: <Palette size={26} className="text-cyan-500" /> },
  { id: 'grok', name: 'Grok', icon: <GrokIcon className="text-gray-800 dark:text-gray-200" /> },
  { id: 'claude', name: 'Claude', icon: <ClaudeIcon className="text-amber-600" /> },
  { id: 'twitch', name: 'Twitch', icon: <TwitchIcon className="text-purple-500" /> },
  { id: 'reddit', name: 'Reddit', icon: <RedditIcon className="text-orange-500" /> },
  { id: 'github', name: 'GitHub', icon: <GithubIcon className="text-gray-800 dark:text-gray-200" /> },
  { id: 'pinterest', name: 'Pinterest', icon: <PinterestIcon className="text-red-600" /> },
  { id: 'steam', name: 'Steam', icon: <SteamIcon className="text-blue-500" /> },
  { id: 'snapchat', name: 'Snapchat', icon: <SnapchatIcon className="text-yellow-400" /> },
  { id: 'figma', name: 'Figma', icon: <FigmaIcon className="text-purple-400" /> },
  { id: 'notion', name: 'Notion', icon: <NotionIcon className="text-gray-800 dark:text-gray-200" /> },
  { id: 'medium', name: 'Medium', icon: <MediumIcon className="text-gray-800 dark:text-gray-200" /> },
  { id: 'zoom', name: 'Zoom', icon: <ZoomIcon className="text-blue-500" /> },
  { id: 'soundcloud', name: 'SoundCloud', icon: <SoundcloudIcon className="text-orange-500" /> },
];

function App() {
  // Default = 'tun' для свежих установок (нет ключа в localStorage).
  // Если юзер явно переключил на 'proxy' — это сохраняется и уважается.
  // Только 'proxy' трактуется как proxy, всё остальное (включая отсутствие) → 'tun'.
  const [routingMode, setRoutingMode] = useState<'proxy' | 'tun'>(() => {
      const stored = localStorage.getItem('vpn_routing_mode');
      return stored === 'proxy' ? 'proxy' : 'tun';
  });

  // Источник истины для startVpn — читаем localStorage напрямую,
  // чтобы исключить stale closure из useEffect([]) и любой state-init race.
  const getCurrentRoutingMode = (): 'proxy' | 'tun' => {
      return localStorage.getItem('vpn_routing_mode') === 'proxy' ? 'proxy' : 'tun';
  };

  // 🇷🇺 Bypass-RU: RU-сервисы (Сбер, Госы, Яндекс, VK и т.д.) идут напрямую мимо VPN.
  // По умолчанию выключено. Применяется только в TUN/full-proxy режимах — в split-режиме
  // юзер уже сам выбирает приложения, флаг там не нужен.
  const [bypassRu, setBypassRu] = useState<boolean>(() => {
      return localStorage.getItem('vpn_bypass_ru') === 'true';
  });
  const getCurrentBypassRu = (): boolean => {
      return localStorage.getItem('vpn_bypass_ru') === 'true';
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('vpn_theme');
      return saved !== null ? saved === 'dark' : true; 
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [, setEasterEggClicks] = useState(0);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [easterEggLeaving, setEasterEggLeaving] = useState(false);
  const easterEggTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerEasterEgg = () => {
    setEasterEggActive(true);
    setEasterEggLeaving(false);
    if (easterEggTimer.current) clearTimeout(easterEggTimer.current);
    easterEggTimer.current = setTimeout(() => {
      setEasterEggLeaving(true);
      setTimeout(() => {
        setEasterEggActive(false);
        setEasterEggLeaving(false);
      }, 133);
    }, 4000);
  };

  const handleCatClick = () => {
    setEasterEggClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        triggerEasterEgg();
        return 0;
      }
      return next;
    });
  };
  
  const [isUpdating] = useState(false);
  const [updateLink, setUpdateLink] = useState<string | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateFallbackUrl, setUpdateFallbackUrl] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  // Состояния авто-докачки в фоне
  const [updateProgress, setUpdateProgress] = useState<number>(0); // 0-100
  const [updateDownloaded, setUpdateDownloaded] = useState<number>(0);
  const [updateTotal, setUpdateTotal] = useState<number>(0);
  const [updateDownloadState, setUpdateDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'error' | 'installing'>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<'none' | 'up_to_date' | null>(null);
  const [isVersionDeprecated, setIsVersionDeprecated] = useState(false);

  // Сравнивает semver строки вида "1.2.3". Возвращает: -1 (a < b), 0 (a == b), 1 (a > b).
  function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    }
    return 0;
  }

  // Используется и при автостарте (useEffect), и кнопкой "Проверить обновления" в настройках.
  const triggerUpdateCheck = async (manual: boolean) => {
    if (manual) {
      setIsCheckingUpdates(true);
      setUpdateCheckResult(null);
    }
    try {
      const data = await (window as any).api.checkUpdates();
      if (data) {
        // Проверяем, не устарела ли текущая версия (ниже минимально поддерживаемой).
        if (data.minSupportedVersion && compareVersions(CURRENT_VERSION, data.minSupportedVersion) < 0) {
          setIsVersionDeprecated(true);
          setUpdateLink(data.downloadUrl);
          setUpdateVersion(data.version);
          setUpdateFallbackUrl(data.fallbackUrl || null);
          return;
        }
        if (data.version && data.version !== CURRENT_VERSION && data.downloadUrl) {
          setUpdateLink(data.downloadUrl);
          setUpdateVersion(data.version);
          setUpdateFallbackUrl(data.fallbackUrl || null);
          setIsUpdateModalOpen(true);
          setUpdateDownloadState('downloading');
          setUpdateError(null);
          setUpdateProgress(0);
          try {
            const result = await (window as any).api.downloadUpdate(data.downloadUrl, data.version);
            if (!result?.ok) {
              setUpdateDownloadState('error');
              setUpdateError(result?.error || 'Не удалось скачать обновление');
            }
          } catch (e: any) {
            setUpdateDownloadState('error');
            setUpdateError(e?.message || String(e));
          }
        } else if (manual) {
          setUpdateCheckResult('up_to_date');
          // Сбрасываем "У вас актуальная версия" через 3с
          setTimeout(() => setUpdateCheckResult(null), 3000);
        }
      } else if (manual) {
        setUpdateCheckResult('up_to_date');
        setTimeout(() => setUpdateCheckResult(null), 3000);
      }
    } catch (error) {
      console.error("Ошибка при проверке обновлений:", error);
      if (manual) setUpdateCheckResult('none');
    } finally {
      if (manual) setIsCheckingUpdates(false);
    }
  };
  
  const [ipData, setIpData] = useState<{ ip: string; country: string; flag: string; city: string; code?: string } | null>(null);
  const [isIpLoading, setIsIpLoading] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState("");
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);
  const [isServiceClosing, setIsServiceClosing] = useState(false);
  const [isServerClosing, setIsServerClosing] = useState(false);

  const [hasSeenApps, setHasSeenApps] = useState(false);

  const [isProxyAll, setIsProxyAll] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);

  const [autoStart, setAutoStart] = useState(false); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  
  // Состояние для хранения пинга серверов
  const [serverPings, setServerPings] = useState<Record<string, number>>({});
  // Состояние для анимации кнопки спидометра
  const [isPingingGlobal, setIsPingingGlobal] = useState(false);
  const [pingCooldown, setPingCooldown] = useState(false); // КД для пинга
  
  // Состояние для кнопки обновления серверов
  const [isRefreshingServers, setIsRefreshingServers] = useState(false);

  // Состояние для уведомлений (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Состояние авто-переподключения
  const [reconnectInfo, setReconnectInfo] = useState<{ attempt: number; max: number } | null>(null);

  const [selectedApps, setSelectedApps] = useState<Record<string, boolean>>({
    discord: false, youtube: false, instagram: false, twitter: false, telegram: false,
    openai: false, gemini: false, antigravity: false, spotify: false, roblox: false,
    tiktok: false, netflix: false, canva: false, linkedin: false, facebook: false, brawlstars: false,
    grok: false, claude: false, twitch: false, reddit: false, github: false, pinterest: false, steam: false,
    snapchat: false, figma: false, notion: false, medium: false, zoom: false, soundcloud: false
  });

  // Хелпер для показа уведомления
  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  // Функция с КД 5 секунд и последовательным пингом
  const handlePingAllServers = async () => {
    if (isPingingGlobal || pingCooldown) return;
    
    setIsPingingGlobal(true);
    setPingCooldown(true);
    
    setTimeout(() => {
        setPingCooldown(false);
    }, 5000);
    
    const resetPings = servers.reduce((acc, s) => ({ ...acc, [s.url]: -2 }), {});
    setServerPings(resetPings);

    for (const server of servers) {
        try {
            const ping = await (window as any).api.pingServer(server.url);
            setServerPings(prev => ({ ...prev, [server.url]: ping }));
        } catch (e) {
            setServerPings(prev => ({ ...prev, [server.url]: -1 }));
        }
        await new Promise(r => setTimeout(r, 20));
    }

    setIsPingingGlobal(false);
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ СЕРВЕРОВ
  const fetchServers = async (key: string, isManual: boolean = false) => {
    try {
        const configs = await (window as any).api.getServers(key);
        if (configs && configs.length > 0) {
            
            // ЛОГИКА УВЕДОМЛЕНИЙ ПРИ РУЧНОМ ОБНОВЛЕНИИ
            if (isManual) {
                const prevCount = servers.length;
                const newCount = configs.length;
                const diff = newCount - prevCount;

                if (diff > 0) {
                    showToast(`Добавлено новых серверов: ${diff}`, 'success');
                } else if (diff < 0) {
                    showToast(`Список обновлен. Удалено: ${Math.abs(diff)}`, 'info');
                } else {
                    showToast("Новые серверы не найдены", 'info');
                }
            }

            setServers(configs);
            
            const savedServer = localStorage.getItem('vpn_selected_server');
            if (savedServer) {
                const parsed = JSON.parse(savedServer);
                const stillExists = configs.find((s: any) => s.name === parsed.name);
                if (stillExists) {
                    setSelectedServer(stillExists);
                } else {
                    setSelectedServer(configs[0]);
                }
            } else {
                setSelectedServer(configs[0]);
            }
        }
    } catch (e) {
        console.error("Ошибка загрузки серверов", e);
        if (isManual) showToast("Ошибка обновления списка", 'info');
    }
  };

  // Функция ручного обновления с КД 10 сек
  const handleRefreshServers = async () => {
    if (isRefreshingServers || !savedKey) return;
  
    setIsRefreshingServers(true);
    
    // Передаем true, чтобы показать уведомление
    await fetchServers(savedKey, true);
  
    setTimeout(() => {
        setIsRefreshingServers(false);
    }, 10000);
  };

  // АВТО-ОБНОВЛЕНИЕ КАЖДЫЙ ЧАС (без уведомлений)
  useEffect(() => {
    if (!savedKey) return;

    const interval = setInterval(() => {
        console.log("⏰ Авто-обновление конфига...");
        fetchServers(savedKey, false);
    }, 3600000); 

    return () => clearInterval(interval);
  }, [savedKey]);

  // ПРОВЕРКА ОБНОВЛЕНИЙ + АВТО-ДОКАЧКА В ФОНЕ.
  // Подписка на progress ВСЕГДА переустанавливается (на каждом mount), а вот сам
  // triggerUpdateCheck — только один раз через useRef guard. В dev React.StrictMode
  // делает unmount → remount, что отписывало слушателя и события прогресса терялись.
  const updateCheckStartedRef = useRef(false);
  useEffect(() => {
    const unsubscribe = (window as any).api.onUpdateProgress?.((data: { percent: number; downloaded: number; total: number; done: boolean }) => {
      setUpdateProgress(data.percent);
      setUpdateDownloaded(data.downloaded);
      setUpdateTotal(data.total);
      if (data.done) setUpdateDownloadState('ready');
    });

    if (!updateCheckStartedRef.current) {
      updateCheckStartedRef.current = true;
      triggerUpdateCheck(false);
    }

    return () => { unsubscribe?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('vpn_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    (window as any).api?.setTitlebarTheme?.(isDarkMode);
  }, [isDarkMode]);

  // Слушаем события авто-переподключения от main process
  useEffect(() => {
    const removeReconnecting = (window as any).electron?.ipcRenderer.on('vpn-reconnecting', (data: { attempt: number; max: number }) => {
      setReconnectInfo(data);
      setIsConnected(false);
    });
    const removeReconnected = (window as any).electron?.ipcRenderer.on('vpn-reconnected', () => {
      setReconnectInfo(null);
      setIsConnected(true);
      showToast('VPN переподключён', 'success');
    });
    const removeDisconnected = (window as any).electron?.ipcRenderer.on('vpn-auto-disconnected', () => {
      setReconnectInfo(null);
      setIsConnected(false);
      setErrorMsg('VPN отключился. Не удалось переподключиться после 5 попыток.');
    });
    return () => {
      removeReconnecting?.();
      removeReconnected?.();
      removeDisconnected?.();
    };
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('vpn_access_key');
    if (storedKey) {
        setSavedKey(storedKey);
        fetchServers(storedKey);
    }
    
    const storedHasSeen = localStorage.getItem('vpn_has_seen_apps');
    if (storedHasSeen === 'true') {
        setHasSeenApps(true); 
    } else {
        setHasSeenApps(false); 
    }
    
    const storedApps = localStorage.getItem('vpn_selected_apps');
    let parsedApps = selectedApps;
    if (storedApps) {
        try {
            // Мерджим поверх дефолтов, а не заменяем: иначе сервисы, добавленные в новой
            // версии (Antigravity), отсутствуют в сохранённом объекте как ключи.
            parsedApps = { ...selectedApps, ...JSON.parse(storedApps) };
            setSelectedApps(parsedApps);
        } catch (e) {}
    }
    
    const storedProxyAll = localStorage.getItem('vpn_proxy_all');
    let proxyAllValue = false;
    if (storedProxyAll) {
        proxyAllValue = storedProxyAll === 'true';
        setIsProxyAll(proxyAllValue);
    }

    const storedMasking = localStorage.getItem('vpn_masking_mode');
    let maskingValue = false;
    if (storedMasking) {
        maskingValue = storedMasking === 'true';
        setIsMaskingMode(maskingValue);
    }
    
    const storedAutoStart = localStorage.getItem('vpn_autostart');
    if (storedAutoStart) setAutoStart(storedAutoStart === 'true');
  }, []);

  const checkIp = async () => {
      if (!isConnected) { setIpData(null); return; }

      // Сразу показываем флаг выбранного сервера, пока IP грузится
      const srvCode = selectedServer?.code?.toUpperCase() || null;
      const srvName = selectedServer?.name || "VPN";
      if (srvCode) {
        setIpData({ ip: "...", country: srvName, flag: selectedServer?.flag || "🛡️", city: srvName, code: srvCode });
      }

      setIsIpLoading(true);

      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
        try {
          const data = await (window as any).api.checkVpnIp();
          if (data && data.ip) {
            const hasGeo = data.code && data.code !== "SEC" && data.code !== "VPN";
            setIpData({
              ip: data.ip,
              country: hasGeo ? data.country : srvName,
              flag: hasGeo ? (data.flag || "🛡️") : (selectedServer?.flag || "🛡️"),
              city: (hasGeo && data.city && data.city !== "Secure") ? data.city : srvName,
              code: hasGeo ? data.code : (srvCode || "VPN"),
            });
            if (attempt === 0) setIsIpLoading(false);
            if (hasGeo) return;
          }
        } catch (e) {}
        if (attempt === 0) setIsIpLoading(false);
      }
  };

  // Проверка IP при подключении + фоновый polling каждые 10с пока подключен
  useEffect(() => {
    if (!isConnected) { setIpData(null); return; }
    // Сразу показываем флаг выбранного сервера, пока IP грузится
    const srvCode = selectedServer?.code?.toUpperCase() || null;
    const srvName = selectedServer?.name || "VPN";
    if (srvCode) {
      setIpData({ ip: "...", country: srvName, flag: selectedServer?.flag || "🛡️", city: srvName, code: srvCode });
    }
    // Задержка 2с перед первым чеком — даём VPN-прокси (10809) установить
    // соединение через правильный сервер. Без этого geo-API может ответить
    // через старый маршрут или CDN-кеш предыдущей сессии.
    const initialTimeout = setTimeout(() => checkIp(), 2000);
    const interval = setInterval(() => {
      if (!isConnected) return;
      // Тихое фоновое обновление без спиннера
      (async () => {
        try {
          const data = await (window as any).api.checkVpnIp();
          if (data && data.ip) {
            const srvCode = selectedServer?.code?.toUpperCase() || null;
            const srvName = selectedServer?.name || "VPN";
            const hasGeo = data.code && data.code !== "SEC" && data.code !== "VPN";
            setIpData({
              ip: data.ip,
              country: hasGeo ? data.country : srvName,
              flag: hasGeo ? (data.flag || "🛡️") : (selectedServer?.flag || "🛡️"),
              city: (hasGeo && data.city && data.city !== "Secure") ? data.city : srvName,
              code: hasGeo ? data.code : (srvCode || "VPN"),
            });
          }
        } catch (e) {}
      })();
    }, 10000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, [isConnected, selectedServer]);

  const closeSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => { setIsGlobalSettingsOpen(false); setIsSettingsClosing(false); }, 180);
  };
  const closeService = () => {
    setIsServiceClosing(true);
    setTimeout(() => { setIsServiceModalOpen(false); setIsServiceClosing(false); }, 180);
  };
  const closeServer = () => {
    setIsServerClosing(true);
    setTimeout(() => { setIsServerModalOpen(false); setIsServerClosing(false); }, 180);
  };

  const handleOpenServiceModal = () => {
    setIsGlobalSettingsOpen(false);
    setIsServerModalOpen(false);
    setIsServiceModalOpen(true);
    if (!hasSeenApps) {
        setHasSeenApps(true);
        localStorage.setItem('vpn_has_seen_apps', 'true');
    }
  };

  const toggleApp = (appId: string) => {
    if (isProxyAll) return; 
    const newState = { ...selectedApps, [appId]: !selectedApps[appId] };
    setSelectedApps(newState);
    localStorage.setItem('vpn_selected_apps', JSON.stringify(newState));
  };
  const toggleProxyAll = () => {
    const newState = !isProxyAll;
    setIsProxyAll(newState);
    localStorage.setItem('vpn_proxy_all', String(newState));
  };

  const toggleAutoStart = async () => {
    const newState = !autoStart;
    setAutoStart(newState);
    localStorage.setItem('vpn_autostart', String(newState));
    try { if ((window as any).api?.setAutostart) await (window as any).api.setAutostart(newState); } catch (e) {}
  };

  const handleSaveKey = async () => {
    const cleanKey = inputKey.trim();
    if (cleanKey.length < 5) {
      setErrorMsg("Ключ слишком короткий!");
      return;
    }
    
    setIsLoading(true);
    try {
      const validation = await (window as any).api.validateKey(cleanKey);
      if (validation.success) {
        const keyToSave = validation.cleanKey || cleanKey;
        localStorage.setItem('vpn_access_key', keyToSave);
        setSavedKey(keyToSave);
        setInputKey("");
        fetchServers(keyToSave);
      } else {
        setErrorMsg(validation.msg || "Ошибка активации ключа");
      }
    } catch (e) {
      setErrorMsg("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isConnected) await (window as any).api.stopVpn();
    localStorage.removeItem('vpn_access_key');
    localStorage.removeItem('vpn_selected_server');
    setSavedKey(null);
    setServers([]);
    setSelectedServer(null);
    setIsConnected(false);
    setIpData(null);
    setIsGlobalSettingsOpen(false);
  };

  const handlePaste = async () => {
    try { const text = await navigator.clipboard.readText(); setInputKey(text); } catch (err) {}
  };
  const openLink = (url: string) => (window as any).api.openExternal(url);

  const handleToggleVpn = async () => {
    // Во время loading (идёт connect/disconnect) повторное нажатие отменяет процесс.
    // Раньше был early-return — юзер не мог прервать долгое подключение, должен был ждать.
    if (isLoading) {
      if (!isConnected) {
        // Connect ещё не завершился — отменяем. Backend (vpn-stop) выставит cancelRequested
        // и vpn-start вернёт { cancelled: true }, ничего лишнего показывать не надо.
        try { await (window as any).api.stopVpn(); } catch {}
        setIsConnected(false);
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      if (isConnected) {
        const result = await (window as any).api.stopVpn();
        if (result && result.success) setIsConnected(false);
      } else {
        if (!savedKey) { setErrorMsg("Ключ не найден"); setIsLoading(false); return; }
        const activeAppList = Object.keys(selectedApps).filter(key => selectedApps[key]);
        // Fallback: если selectedServer ещё не загрузился из API (state null),
        // используем сохранённый сервер из localStorage — иначе бекенд пойдёт через подписку
        // и может выбрать другую страну (NL вместо DE).
        let serverUrl = selectedServer?.url;
        if (!serverUrl) {
          try {
            const saved = localStorage.getItem('vpn_selected_server');
            if (saved) serverUrl = JSON.parse(saved).url;
          } catch {}
        }
        const result = await (window as any).api.startVpn(savedKey, activeAppList, isProxyAll, isMaskingMode, serverUrl, getCurrentRoutingMode(), getCurrentBypassRu());

        if (result && result.success) {
            setIsConnected(true);
        } else if (result?.cancelled) {
            // Отмена пользователем — без сообщения об ошибке
            setIsConnected(false);
        } else {
            setErrorMsg(result?.msg || "Ошибка подключения");
            setIsConnected(false);
        }
      }
    } catch (err: any) { setErrorMsg("Ошибка: " + err.message); }
    finally { setIsLoading(false); }
  };

  const handleSaveServiceSettings = async () => {
    closeService();
    if (isConnected && savedKey) {
       setIsLoading(true); 
       const activeAppList = Object.keys(selectedApps).filter(key => selectedApps[key]);
       const result = await (window as any).api.startVpn(savedKey, activeAppList, isProxyAll, isMaskingMode, selectedServer?.url, getCurrentRoutingMode(), getCurrentBypassRu());
       if (!result.success) {
           setIsConnected(false);
           setErrorMsg(result.msg);
       }
       setIsLoading(false);
    }
  };

  const selectServer = async (server: any) => {
    setSelectedServer(server);
    localStorage.setItem('vpn_selected_server', JSON.stringify(server));
    closeServer();
    
    if (isConnected && savedKey) {
        setIsLoading(true);
        const activeAppList = Object.keys(selectedApps).filter(key => selectedApps[key]);
        await (window as any).api.startVpn(savedKey, activeAppList, isProxyAll, isMaskingMode, server.url, getCurrentRoutingMode(), getCurrentBypassRu());
        setIsLoading(false);
    }
  };

  // UI Helpers
  const getFlagImage = (code?: string) => {
      if (!code || code === 'VPN' || code === 'SEC') return null;
      return `flags/${code.toLowerCase()}.svg`;
  };

  const renderServerFlag = (server: any, size: string = "w-6 h-auto") => {
      if (server.code) {
          return (
              <img 
                src={getFlagImage(server.code)!} 
                alt={server.name}
                className={`${size} rounded-sm object-cover shadow-sm`}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                        fallback.classList.remove('hidden');
                        fallback.classList.add('flex');
                    }
                }}
              />
          );
      }
      return null;
  };

  const getPingColor = (ms: number) => {
      if (ms === -1) return "text-red-500";
      if (ms === -2) return "text-gray-400";
      if (ms < 100) return "text-emerald-500";
      if (ms < 250) return "text-yellow-500";
      return "text-orange-500";
  };

  const formatPing = (ms: number) => {
      if (ms === -1) return "Timeout";
      if (ms === -2) return "...";
      return `${ms} ms`;
  };

  return (
    <main className={`relative h-screen select-none overflow-hidden flex flex-row transition-colors duration-300 ease-out font-sans border
      ${isDarkMode ? 'bg-[#09090b] text-[#d4d4d8] border-white/10' : 'bg-[#F2F4F6] text-[#262626] border-black/10'}`
    }>
      
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-wave { background: linear-gradient(120deg, #2563EB 0%, #3B82F6 30%, #93C5FD 50%, #3B82F6 70%, #2563EB 100%); background-size: 250% 100%; animation: shimmer 8s infinite linear; }

        @keyframes modal-slide-in-left {
          from { transform: translateX(-60px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes modal-slide-in-up {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes modal-slide-out-left {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes modal-slide-out-down {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(60px); opacity: 0; }
        }
        @keyframes modal-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-fade-out { from { opacity: 1; } to { opacity: 0; } }

        .modal-opening-left    { animation: modal-slide-in-left 200ms ease-out forwards; }
        .modal-opening-up      { animation: modal-slide-in-up   200ms ease-out forwards; }
        .modal-overlay-opening { animation: modal-fade-in        200ms ease-out forwards; }
        .modal-closing-left    { animation: modal-slide-out-left 180ms ease-in  forwards; pointer-events: none; }
        .modal-closing-down    { animation: modal-slide-out-down 180ms ease-in  forwards; pointer-events: none; }
        .modal-overlay-closing { animation: modal-fade-out       180ms ease-in  forwards; pointer-events: none; }

        @keyframes breathing-glow {
           0%   { box-shadow: 0 0 3px 3px rgba(74, 222, 128, 0.2), 0 0 30px 8px rgba(34, 197, 94, 0.25), 0 0 70px 20px rgba(34, 197, 94, 0.10); }
           50%  { box-shadow: 0 0 4px 5px rgba(74, 222, 128, 0.3), 0 0 60px 20px rgba(34, 197, 94, 0.45), 0 0 120px 40px rgba(34, 197, 94, 0.20); }
           100% { box-shadow: 0 0 3px 3px rgba(74, 222, 128, 0.2), 0 0 30px 8px rgba(34, 197, 94, 0.25), 0 0 70px 20px rgba(34, 197, 94, 0.10); }
        }

        .btn-connect-active {
            animation: breathing-glow 12s infinite ease-in-out;
        }

        /* === Жидкая клякса (SVG turbulence + displacement) === */
        @keyframes blob-burst {
          0%   { transform: scale(0.15) translate(0,    0);     opacity: 0; }
          20%  { transform: scale(1.9)  translate(-8px, -12px); opacity: 1; }
          40%  { transform: scale(1.5)  translate(10px,  8px);  opacity: 1; }
          60%  { transform: scale(1.8)  translate(-6px,  12px); opacity: 0.8; }
          80%  { transform: scale(0.9)  translate(8px,  -6px);  opacity: 0.4; }
          100% { transform: scale(0.08) translate(0,    0);     opacity: 0; }
        }
        @keyframes blob-drift {
          0%   { transform: translate(0,    0)    scale(1);    opacity: 0.92; }
          20%  { transform: translate(14px, -9px) scale(1.05); opacity: 1; }
          40%  { transform: translate(-11px, 7px) scale(0.97); opacity: 0.95; }
          60%  { transform: translate(9px,  11px) scale(1.07); opacity: 1; }
          80%  { transform: translate(-13px,-5px) scale(1.02); opacity: 0.94; }
          100% { transform: translate(0,    0)    scale(1);    opacity: 0.92; }
        }
        @keyframes blob-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .orb-wrap {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 608px;
          height: 608px;
          margin-left: -304px;
          margin-top: -304px;
          pointer-events: none;
          z-index: 0;
          animation: blob-burst 1.5s ease-out forwards;
          will-change: transform, opacity;
        }
        .orb-drift {
          width: 100%;
          height: 100%;
          animation: blob-drift 42s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .orb-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          animation: blob-spin 134.4s linear infinite;
        }

        .cat-dance-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 113px;
          height: 113px;
          object-fit: contain;
          opacity: 0.55;
        }
        .cat-dance-bg--light { opacity: 0.9; }

        html, body { overflow-x: hidden; max-width: 100vw; }
        @keyframes slideUpIn {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
        @keyframes slideDownOut {
          from { transform: translateX(-50%) translateY(0);    opacity: 1; }
          to   { transform: translateX(-50%) translateY(100%); opacity: 0; }
        }
        @keyframes catPopUp {
          from { transform: translateX(-50%) translateY(0) scale(0.3); opacity: 0; }
          to   { transform: translateX(-50%) translateY(-100%) scale(1); opacity: 1; }
        }
        @keyframes catPopDown {
          from { transform: translateX(-50%) translateY(-100%) scale(1); opacity: 1; }
          to   { transform: translateX(-50%) translateY(0) scale(0.3); opacity: 0; }
        }

        .custom-placeholder::placeholder { color: #52525b !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar:horizontal { height: 0; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: rgba(63, 63, 70, 0.5); border-radius: 20px; }
      `}</style>

      {/* Sidebar */}
      <aside
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a')) return;
          if (isGlobalSettingsOpen) closeSettings();
          if (isServiceModalOpen) closeService();
          if (isServerModalOpen) closeServer();
        }}
        className={`w-[192px] shrink-0 flex flex-col z-20 cursor-default ${isDarkMode ? 'bg-[#0d0d10] border-r border-white/5' : 'bg-[#EAECEF] border-r border-gray-200'}`}>
        {/* Logo (drag-region для перетаскивания окна) */}
        <div className="px-4 pt-5 pb-4" style={{ WebkitAppRegion: 'drag' } as any}>
          <div
            onClick={handleCatClick}
            className={`text-base font-bold leading-tight tracking-tight cursor-default select-none ${isDarkMode ? 'text-[#d4d4d8]' : 'text-[#262626]'}`}
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <div>НАРОДНЫЙ</div>
            <div><span className="text-[#EE3F58]">V</span><span className="text-[#0D4CD3]">PN</span></div>
          </div>
        </div>

        {savedKey && (
          <nav className="flex flex-col gap-1.5 px-3 pt-1 pb-3 flex-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={() => {
                const newMode = routingMode === 'proxy' ? 'tun' : 'proxy';
                setRoutingMode(newMode);
                localStorage.setItem('vpn_routing_mode', newMode);
              }}
              disabled={isConnected || isLoading}
              title={isConnected ? "Отключите VPN для смены режима" : "Сменить режим"}
              className={`w-full px-3 py-2.5 min-h-8.5 rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.97] border ${
                (isConnected || isLoading)
                  ? 'opacity-40 cursor-not-allowed ' + (isDarkMode ? 'bg-white/3 border-white/[0.07]' : 'bg-black/2 border-black/[0.07]')
                  : (isDarkMode ? 'bg-white/3 border-white/[0.07] hover:bg-white/6 text-gray-300' : 'bg-black/2 border-black/[0.07] hover:bg-black/5 text-gray-700')
              }`}
            >
              <Layers size={18} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold leading-tight text-left">Режим: <span className="uppercase">{routingMode}</span></span>
            </button>

            <button
              onClick={handleOpenServiceModal}
              className={`relative w-full px-3 py-2.5 min-h-8.5 rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.97] border ${isDarkMode ? 'bg-white/3 border-white/[0.07] hover:bg-white/6 text-gray-300' : 'bg-black/2 border-black/[0.07] hover:bg-black/5 text-gray-700'}`}
            >
              <SlidersHorizontal size={18} className="text-blue-500 shrink-0" />
              <span className="text-xs font-semibold leading-tight text-left">Раздельный трафик</span>
              {!hasSeenApps && <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
            </button>

            <button
              onClick={() => openLink('https://t.me/narodniy_vpn_bot?start=ref')}
              className={`w-full px-3 py-2.5 min-h-8.5 rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.97] border ${isDarkMode ? 'bg-white/3 border-white/[0.07] hover:bg-white/6 text-gray-300' : 'bg-black/2 border-black/[0.07] hover:bg-black/5 text-gray-700'}`}
            >
              <Gift size={18} className="text-purple-500 shrink-0" />
              <span className="text-xs font-semibold leading-tight text-left">7 Дней Бесплатно</span>
            </button>

            <button
              onClick={() => { setIsServiceModalOpen(false); setIsServerModalOpen(false); setIsGlobalSettingsOpen(true); }}
              className={`mt-auto w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.97] border ${isDarkMode ? 'bg-white/3 border-white/[0.07] hover:bg-white/6 text-gray-300' : 'bg-black/2 border-black/[0.07] hover:bg-black/5 text-gray-700'}`}
            >
              <Settings size={18} className="text-gray-400 shrink-0" />
              <span className="text-xs font-semibold leading-tight text-left">Настройки</span>
            </button>
          </nav>
        )}
      </aside>

      {/* Main wrapper (правая часть) */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">

        {isConnected && (
          <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
            <img src="cat-shield.gif" alt="" className={isDarkMode ? 'cat-dance-bg' : 'cat-dance-bg cat-dance-bg--light'} />
          </div>
        )}

        {isConnected && (
          <div
            onClick={triggerEasterEgg}
            className="absolute bottom-0 left-0 w-28 h-28 z-30 cursor-default"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          />
        )}



        {/* Drag-strip сверху (32px = высота titleBarOverlay) */}
        <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as any} />

      {/* Deprecated Version Screen — полностью блокирует UI, закрыть нельзя */}
      {isVersionDeprecated && (
        <div className={`absolute inset-0 z-100 flex items-center justify-center backdrop-blur-md p-6 ${isDarkMode ? 'bg-black/80' : 'bg-white/70'}`}>
          <div className={`w-full max-w-sm p-8 rounded-4xl shadow-2xl flex flex-col items-center text-center gap-5 ${isDarkMode ? 'bg-[#18181b] border border-white/5' : 'bg-white'}`}>
            <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
              <TriangleAlert size={32} className="text-red-500" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold">Версия устарела</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                Версия <span className="font-mono font-semibold">{CURRENT_VERSION}</span> больше не поддерживается.
                Обновите приложение до последней версии, чтобы продолжить.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {updateDownloadState === 'ready' ? (
                <button
                  onClick={async () => {
                    setUpdateDownloadState('installing');
                    const r = await (window as any).api.installUpdate();
                    if (!r?.ok) {
                      setUpdateDownloadState('error');
                      setUpdateError(r?.error || 'Не удалось запустить установщик');
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
                >
                  Установить {updateVersion}
                </button>
              ) : updateDownloadState === 'downloading' ? (
                <div className="w-full flex flex-col gap-1.5">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200'}`}>
                    {updateTotal > 0 ? (
                      <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${updateProgress}%` }} />
                    ) : (
                      <div className="h-full w-1/3 bg-emerald-500 animate-pulse rounded-full" />
                    )}
                  </div>
                  <p className="text-xs opacity-50">
                    {updateTotal > 0 ? `Скачивается... ${updateProgress}%` : 'Скачивается...'}
                  </p>
                </div>
              ) : updateDownloadState === 'error' && updateLink ? (
                <>
                  <button
                    onClick={async () => {
                      setUpdateDownloadState('downloading');
                      setUpdateError(null);
                      setUpdateProgress(0);
                      const result = await (window as any).api.downloadUpdate(updateLink, updateVersion);
                      if (!result?.ok) {
                        setUpdateDownloadState('error');
                        setUpdateError(result?.error || 'Не удалось скачать обновление');
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
                  >
                    Попробовать снова
                  </button>
                  {updateFallbackUrl && (
                    <button
                      onClick={() => (window as any).api.openExternal(updateFallbackUrl)}
                      className={`w-full py-3 rounded-2xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    >
                      Скачать вручную
                    </button>
                  )}
                </>
              ) : updateLink ? (
                <button
                  onClick={async () => {
                    setUpdateDownloadState('downloading');
                    setUpdateError(null);
                    setUpdateProgress(0);
                    const result = await (window as any).api.downloadUpdate(updateLink, updateVersion);
                    if (!result?.ok) {
                      setUpdateDownloadState('error');
                      setUpdateError(result?.error || 'Не удалось скачать обновление');
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
                >
                  Скачать обновление {updateVersion && `(${updateVersion})`}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && updateLink && (
        <div className="absolute inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
           <div className={`relative w-full max-w-sm p-6 rounded-4xl shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#18181b] border border-white/5' : 'bg-white shadow-xl'}`}>

              {/* Закрыть (крест в левом-верхнем углу). Не показываем во время installing —
                  процесс уже не отменишь. */}
              {updateDownloadState !== 'installing' && (
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className={`absolute top-4 left-4 p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-[#27272a]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Закрыть"
                >
                  <X size={20} />
                </button>
              )}

              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${updateDownloadState === 'ready' ? 'bg-emerald-500/15' : updateDownloadState === 'error' ? 'bg-red-500/15' : 'bg-emerald-500/10'}`}>
                 {updateDownloadState === 'downloading' ? (
                   <Loader2 size={32} className="text-emerald-500 animate-spin" />
                 ) : (
                   <Download size={32} className={updateDownloadState === 'error' ? 'text-red-500' : 'text-emerald-500'} />
                 )}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">
                  {updateDownloadState === 'ready' ? 'Обновление готово' :
                   updateDownloadState === 'error' ? 'Ошибка скачивания' :
                   updateDownloadState === 'downloading' ? 'Скачивание обновления...' :
                   'Доступно обновление!'}
                </h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  {updateDownloadState === 'ready'
                    ? `Версия ${updateVersion} скачана. Нажмите чтобы установить — приложение перезапустится.`
                    : updateDownloadState === 'error'
                    ? (updateError || 'Не удалось скачать. Попробуйте позже.')
                    : updateDownloadState === 'downloading'
                    ? 'Загрузка идёт в фоне. Можно закрыть это окно и продолжать пользоваться приложением.'
                    : `Вышла новая версия ${updateVersion ? updateVersion + ' ' : ''}приложения.`}
                </p>
              </div>

              {/* Прогресс-бар во время скачивания. При total=0 (chunked encoding,
                  редкий случай для GitHub Releases) показываем индетерминированную
                  анимацию вместо "0%" — иначе юзеру кажется что ничего не происходит. */}
              {updateDownloadState === 'downloading' && (
                <div className="w-full flex flex-col gap-1.5 mt-1">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200'}`}>
                    {updateTotal > 0 ? (
                      <div
                        className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${updateProgress}%` }}
                      />
                    ) : (
                      <div className="h-full w-1/3 bg-linear-to-r from-emerald-500 to-emerald-400 animate-pulse rounded-full" />
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] opacity-60 font-mono">
                    <span>
                      {(updateDownloaded / 1024 / 1024).toFixed(1)} MB
                      {updateTotal > 0 && ` / ${(updateTotal / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                    <span>{updateTotal > 0 ? `${updateProgress}%` : 'Скачивается...'}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full mt-2">
                {updateDownloadState === 'ready' ? (
                  <button
                    onClick={async () => {
                      setUpdateDownloadState('installing');
                      try {
                        const r = await (window as any).api.installUpdate();
                        if (!r?.ok) {
                          setUpdateDownloadState('error');
                          setUpdateError(r?.error || 'Не удалось запустить установщик');
                        }
                        // На успех приложение завершится через ~1с — UI исчезнет
                      } catch (e: any) {
                        setUpdateDownloadState('error');
                        setUpdateError(e?.message || String(e));
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Установить и перезапустить
                  </button>
                ) : updateDownloadState === 'error' ? (
                  <button
                    onClick={async () => {
                      // Повторная попытка скачать
                      if (!updateLink || !updateVersion) return;
                      setUpdateDownloadState('downloading');
                      setUpdateError(null);
                      setUpdateProgress(0);
                      const r = await (window as any).api.downloadUpdate(updateLink, updateVersion);
                      if (!r?.ok) {
                        setUpdateDownloadState('error');
                        setUpdateError(r?.error || 'Не удалось скачать');
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Попробовать ещё раз
                  </button>
                ) : updateDownloadState === 'installing' ? (
                  <button disabled className="w-full py-3.5 bg-emerald-600/50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Запуск установщика...
                  </button>
                ) : updateDownloadState === 'downloading' ? (
                  <button
                    onClick={async () => {
                      // Прерываем скачивание — backend abort flag, удаляет partial файл
                      try { await (window as any).api.cancelUpdateDownload?.(); } catch {}
                      setUpdateDownloadState('error');
                      setUpdateError('Отменено пользователем');
                      setUpdateProgress(0);
                      setUpdateDownloaded(0);
                      setUpdateTotal(0);
                    }}
                    className={`w-full py-3.5 font-bold rounded-xl transition-all active:scale-[0.98] ${isDarkMode ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}
                  >
                    Отменить скачивание
                  </button>
                ) : null}

                {/* Альтернатива: Telegram-ссылка как полноценная кнопка (тот же размер как
                    "Установить"/"Попробовать ещё раз", только голубая в стиле Telegram).
                    Не показываем во время installing — процесс уже не отменишь. */}
                {updateFallbackUrl && updateDownloadState !== 'installing' && (
                  <button
                    onClick={() => openLink(updateFallbackUrl)}
                    className="w-full py-3.5 bg-[#0088cc] hover:bg-[#0099dd] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#0088cc]/20 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Скачать через Telegram
                  </button>
                )}
              </div>

           </div>
        </div>
      )}

      {/* Global Settings Modal */}
      {(isGlobalSettingsOpen || isSettingsClosing) && (
        <div onClick={closeSettings} className={`absolute left-0 top-8 right-0 bottom-0 z-70 flex items-stretch justify-stretch p-2 ${isSettingsClosing ? 'modal-overlay-closing' : 'modal-overlay-opening'}`}>
           <div onClick={(e) => e.stopPropagation()} className={`w-full h-full p-0 rounded-2xl flex flex-col overflow-hidden border ${isSettingsClosing ? 'modal-closing-left' : 'modal-opening-left'} ${isDarkMode ? 'bg-[#18181b] text-[#d4d4d8] border-white/10' : 'bg-white text-gray-900 border-black/10'}`}>
              <div className={`px-4 py-3 flex items-center transition-colors duration-150 border-b ${isDarkMode ? 'border-white/6' : 'border-black/6'}`}>
                 <button onClick={closeSettings} className={`p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-[#27272a]' : 'hover:bg-gray-100'}`}>
                   <ChevronLeft size={20} strokeWidth={2.5} />
                 </button>
                 <h2 className="text-base font-bold flex-1 text-right pr-3">Настройки</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                 
                 {/* Секция ТЕМА */}
                 <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-gray-500">Тема</p>
                    <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-[#27272a] border-white/[0.07]' : 'bg-gray-50 border-black/[0.07]'}`}>
                       <div onClick={() => setIsDarkMode(false)} className={`flex items-center justify-between p-4 cursor-pointer active:bg-black/5 transition-colors`}><div className="flex items-center gap-3"><Sun size={20} className="text-orange-500" /><span className="font-medium">Светлая</span></div>{!isDarkMode && <Check size={20} className="text-blue-500" strokeWidth={3} />}</div>
                       <div className={`h-px w-full mx-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                       <div onClick={() => setIsDarkMode(true)} className={`flex items-center justify-between p-4 cursor-pointer active:bg-black/5 transition-colors`}><div className="flex items-center gap-3"><Moon size={20} className="text-purple-400" /><span className="font-medium">Темная</span></div>{isDarkMode && <Check size={20} className="text-blue-500" strokeWidth={3} />}</div>
                    </div>
                 </div>

                 {/* Секция СИСТЕМА (Только автозапуск) */}
                 <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-gray-500">Система</p>
                    <div 
                       className={`rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border ${isDarkMode ? 'bg-[#27272a] border-white/[0.07]' : 'bg-gray-50 border-black/[0.07]'}`}
                       onClick={toggleAutoStart}
                    >
                       <span className="font-medium">Автозапуск с Windows</span>
                       <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${autoStart ? 'bg-blue-500' : (isDarkMode ? 'bg-[#3f3f46]' : 'bg-gray-300')}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${autoStart ? 'translate-x-5' : 'translate-x-0'}`} />
                       </div>
                    </div>
                 </div>

                 {/* Кнопка ОБНОВЛЕНИЯ */}
                 <div>
                     <p className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-gray-500">Обновления</p>
                     <button
                        onClick={() => {
                           // Если идёт скачивание / готово к установке — открываем модалку прогресса.
                           // Иначе — запускаем ручную проверку обновлений.
                           if (updateDownloadState === 'downloading' || updateDownloadState === 'ready' || updateDownloadState === 'installing') {
                             setIsUpdateModalOpen(true);
                             setIsGlobalSettingsOpen(false);
                           } else {
                             triggerUpdateCheck(true);
                           }
                        }}
                        disabled={isCheckingUpdates}
                        className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${isCheckingUpdates ? 'cursor-wait opacity-70' : 'cursor-pointer active:scale-[0.99]'} ${
                          updateDownloadState === 'ready'
                            ? (isDarkMode ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200')
                            : updateDownloadState === 'error'
                            ? (isDarkMode ? 'bg-red-500/10 hover:bg-red-500/15 border border-red-500/30' : 'bg-red-50 hover:bg-red-100 border border-red-200')
                            : (isDarkMode ? 'bg-[#27272a] hover:bg-[#323236] border border-white/[0.07]' : 'bg-gray-50 hover:bg-gray-100 border border-black/[0.07]')
                        }`}
                     >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                           {updateDownloadState === 'downloading' ? (
                             <Loader2 size={20} className="text-blue-500 animate-spin shrink-0" />
                           ) : updateDownloadState === 'ready' ? (
                             <Download size={20} className="text-emerald-500 shrink-0" />
                           ) : updateDownloadState === 'error' ? (
                             <TriangleAlert size={20} className="text-red-500 shrink-0" />
                           ) : isCheckingUpdates ? (
                             <Loader2 size={20} className="text-blue-500 animate-spin shrink-0" />
                           ) : (
                             <RefreshCw size={20} className="text-blue-500 shrink-0" />
                           )}
                           <div className="flex flex-col min-w-0 text-left">
                             <span className="font-medium truncate">
                               {updateDownloadState === 'downloading' ? (updateTotal > 0 ? `Скачивание ${updateProgress}%` : 'Скачивание...') :
                                updateDownloadState === 'ready' ? `Готово: установить ${updateVersion}` :
                                updateDownloadState === 'installing' ? 'Установка...' :
                                updateDownloadState === 'error' ? 'Ошибка скачивания' :
                                isCheckingUpdates ? 'Проверка...' :
                                updateCheckResult === 'up_to_date' ? 'У вас актуальная версия' :
                                updateCheckResult === 'none' ? 'Не удалось проверить' :
                                'Проверить обновления'}
                             </span>
                             {updateDownloadState === 'downloading' && (
                               <span className="text-[10px] opacity-50 font-mono">
                                 {updateTotal > 0
                                   ? `${(updateDownloaded / 1024 / 1024).toFixed(1)} / ${(updateTotal / 1024 / 1024).toFixed(1)} MB`
                                   : `${(updateDownloaded / 1024 / 1024).toFixed(1)} MB`}
                               </span>
                             )}
                           </div>
                        </div>
                        {/* Mini-progress bar внутри кнопки во время скачивания */}
                        {updateDownloadState === 'downloading' && (
                          <div className={`w-16 h-1.5 rounded-full overflow-hidden shrink-0 ml-2 ${isDarkMode ? 'bg-[#3f3f46]' : 'bg-gray-200'}`}>
                            {updateTotal > 0 ? (
                              <div className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-200" style={{ width: `${updateProgress}%` }} />
                            ) : (
                              <div className="h-full w-1/3 bg-linear-to-r from-blue-500 to-blue-400 animate-pulse" />
                            )}
                          </div>
                        )}
                     </button>
                 </div>

                 {/* Отдельная кнопка ПОДДЕРЖКИ */}
                 <div>
                     <p className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-gray-500">Помощь</p>
                     <button
                        onClick={() => openLink('https://t.me/narodniyVPN_support')}
                        className={`w-full p-3 rounded-xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border ${isDarkMode ? 'bg-[#27272a] hover:bg-[#323236] border-white/[0.07]' : 'bg-gray-50 hover:bg-gray-100 border-black/[0.07]'}`}
                     >
                        <div className="flex items-center gap-3">
                           <LifeBuoy size={20} className="text-emerald-500" />
                           <span className="font-medium">Написать в поддержку</span>
                        </div>
                        <ArrowRight size={18} className="opacity-30" />
                     </button>
                 </div>

                 <div className="pt-2">
                    <button onClick={handleLogout} className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 group transition-all duration-200 active:scale-[0.98] border ${isDarkMode ? 'bg-[#27272a] text-red-400 hover:bg-red-500/10 border-white/[0.07]' : 'bg-red-50 text-red-600 hover:bg-red-100 border-black/[0.07]'}`}>
                       <LogOut size={20} />
                       <span className="font-bold">Выйти из аккаунта</span>
                    </button>
                 </div>
                 
                 <div className="text-center mt-2">
                    <span className="text-[10px] font-mono opacity-30">Версия {CURRENT_VERSION}</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Services Modal */}
      {(isServiceModalOpen || isServiceClosing) && (
        <div onClick={closeService} className={`absolute left-0 top-8 right-0 bottom-0 z-50 flex items-stretch justify-stretch p-2 ${isServiceClosing ? 'modal-overlay-closing' : 'modal-overlay-opening'}`}>
          <div onClick={(e) => e.stopPropagation()} className={`w-full h-full px-4 pt-0 pb-4 rounded-2xl flex flex-col overflow-hidden border ${isServiceClosing ? 'modal-closing-left' : 'modal-opening-left'} ${isDarkMode ? 'bg-[#18181b] text-[#d4d4d8] border-white/10' : 'bg-white text-gray-900 border-black/10'}`}>

            <div className={`-mx-4 px-4 py-3 flex items-center shrink-0 border-b ${isDarkMode ? 'border-white/6' : 'border-black/6'}`}>
              <button onClick={closeService} className={`p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-[#27272a]' : 'hover:bg-gray-100'}`}>
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <h2 className="text-base font-bold flex-1 text-right pr-3">Настройка фильтрации</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 pt-3 custom-scrollbar">
                
                <div onClick={toggleProxyAll} className={`relative overflow-hidden flex items-center justify-between p-3 rounded-xl cursor-pointer border mb-2 transition-all duration-300 active:scale-[0.98] ${isProxyAll ? 'border-transparent text-white shadow-lg shadow-blue-500/30 bg-linear-to-r from-blue-600 to-blue-500' : (isDarkMode ? 'bg-[#27272a] border-white/[0.07] hover:bg-[#323236]' : 'bg-gray-100 border-black/[0.07]')}`}>
                  <div className="relative z-10 flex items-center gap-3.5">
                     <div className={`p-2 rounded-lg transition-colors ${isProxyAll ? 'bg-white/20' : (isDarkMode ? 'bg-black/20' : 'bg-white')}`}>
                        <Globe size={22} className={isProxyAll ? 'text-white' : 'text-gray-500'} />
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-[15px] leading-tight">Весь трафик</span>
                        <span className={`text-[11px] ${isProxyAll ? 'text-blue-100' : 'opacity-50'}`}>Проксировать всё устройство</span>
                     </div>
                  </div>
                  <div className={`relative z-10 w-11 h-6.5 rounded-full p-1 transition-colors ${isProxyAll ? 'bg-black/20' : 'bg-gray-500/30'}`}>
                     <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300 ${isProxyAll ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* 🇷🇺 RU сервисы напрямую — компактный, с приглушённым градиентом */}
                <div
                  onClick={() => {
                    const newState = !bypassRu;
                    setBypassRu(newState);
                    localStorage.setItem('vpn_bypass_ru', String(newState));
                  }}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border mb-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${bypassRu ? (isDarkMode ? 'bg-linear-to-r from-red-600/25 to-red-500/10 border-red-500/30' : 'bg-linear-to-r from-red-100 to-red-50 border-red-200') : (isDarkMode ? 'bg-[#27272a] border-white/[0.07] hover:bg-[#323236]' : 'bg-gray-100 border-black/[0.07]')}`}
                  title="RU-сервисы (Сбер, Яндекс, VK, Госы) пойдут мимо VPN"
                >
                  <div className="flex items-center gap-2.5">
                     <span className="text-base leading-none">🇷🇺</span>
                     <div className="flex flex-col">
                        <span className="font-semibold text-[13px] leading-tight">RU сервисы напрямую</span>
                        <span className="text-[10px] opacity-55 leading-tight mt-0.5">Сбер, Яндекс, VK, Госы — мимо VPN</span>
                     </div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${bypassRu ? 'bg-red-500/70' : 'bg-gray-500/30'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${bypassRu ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>


                <p className="text-xs font-bold opacity-40 mb-4 uppercase tracking-wider ml-1">Выборочные приложения</p>
                
                <div className={`pb-4 transition-all duration-300 ${isProxyAll ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_APPS.map((app) => (
                      <div key={app.id} onClick={() => toggleApp(app.id)} className={`relative flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer border select-none active:scale-90 transition-all duration-200 aspect-square ${selectedApps[app.id] ? (isDarkMode ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.15)]' : 'bg-blue-50 border-blue-300') : (isDarkMode ? 'bg-[#27272a] border-white/[0.07] hover:bg-[#323236]' : 'bg-gray-50 border-black/[0.07] hover:bg-gray-100')}`}>
                        <div className="mb-1 transition-transform duration-200 group-active:scale-90">{app.icon}</div>
                        <span className="text-[9px] font-bold text-center leading-tight line-clamp-1 w-full opacity-80">{app.name}</span>
                      </div>
                    ))}
                  </div>
                </div>


            </div>

            <button onClick={handleSaveServiceSettings} className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 text-sm shrink-0">Готово</button>
          </div>
        </div>
      )}

      {/* Server Selection Modal */}
      {(isServerModalOpen || isServerClosing) && (
        <div onClick={closeServer} className={`absolute left-0 top-8 right-0 bottom-0 z-70 flex items-stretch justify-stretch p-2 ${isServerClosing ? 'modal-overlay-closing' : 'modal-overlay-opening'}`}>
          <div onClick={(e) => e.stopPropagation()} className={`w-full h-full p-0 rounded-2xl flex flex-col overflow-hidden border ${isServerClosing ? 'modal-closing-down' : 'modal-opening-up'} ${isDarkMode ? 'bg-[#18181b] text-[#d4d4d8] border-white/10' : 'bg-white text-gray-900 border-black/10'}`}>
            <div className={`px-4 py-3 flex items-center border-b transition-colors duration-150 ${isDarkMode ? 'border-white/6' : 'border-black/6'}`}>
               <div className="flex gap-2">
                   <button onClick={closeServer} className={`p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-[#27272a]' : 'hover:bg-gray-100'}`}><ChevronDown size={20} strokeWidth={2.5} /></button>
                   {/* КНОПКА: ОБНОВЛЕНИЕ СЕРВЕРОВ */}
                    <button
                          onClick={handleRefreshServers}
                          disabled={isRefreshingServers}
                          title="Обновить список серверов"
                          className={`p-1.5 rounded-full transition-all duration-300 ${
                              isRefreshingServers
                              ? 'cursor-not-allowed text-blue-500'
                              : (isDarkMode ? 'hover:bg-[#27272a] text-[#d4d4d8]' : 'hover:bg-gray-100 text-black')
                          }`}
                    >
                          <RefreshCw
                              size={20}
                              className={`transition-all ${isRefreshingServers ? "animate-spin" : ""}`}
                          />
                    </button>
                   {/* КНОПКА ПИНГА С АНИМАЦИЕЙ */}
                    <button
                            onClick={handlePingAllServers}
                            disabled={pingCooldown || isPingingGlobal}
                            className={`p-1.5 rounded-full transition-all duration-300 ${
                                (pingCooldown || isPingingGlobal)
                                ? 'cursor-not-allowed text-blue-500'
                                : (isDarkMode ? 'hover:bg-[#27272a] text-[#d4d4d8]' : 'hover:bg-gray-100 text-black')
                            }`}
                      >
                            <Gauge
                                size={20}
                                className={`transition-all ${(isPingingGlobal || pingCooldown) ? "animate-spin" : ""}`}
                            />
                      </button>
               </div>
               <h2 className="text-base font-bold flex-1 text-right pr-3">Выберите сервер</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
               {servers.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-10 opacity-30">
                       <Loader2 size={32} className="animate-spin mb-2" />
                       <span>Загрузка списка серверов...</span>
                   </div>
               ) : (
                   <>
                       {/* --- СЕКЦИЯ 1: ОСНОВНЫЕ СЕРВЕРЫ --- */}
                       {servers.filter(s => !s.isRescue).length > 0 && (
                           <div className="space-y-2">
                               <h3 className="text-xs font-bold opacity-50 uppercase tracking-wider ml-2 mb-3">🚀 Основные серверы</h3>
                               {servers.filter(s => !s.isRescue).map((server, idx) => (
                                   <div 
                                     key={`main-${idx}`} 
                                     onClick={() => selectServer(server)}
                                     className={`group w-full p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all active:scale-[0.98] ${
                                         selectedServer?.name === server.name
                                         ? 'border-blue-500 bg-blue-500/10'
                                         : (isDarkMode ? 'border-white/[0.07] bg-[#27272a] hover:bg-[#323236]' : 'border-black/[0.07] bg-gray-50 hover:bg-gray-100')
                                     }`}
                                   >
                                       <div className="flex items-center gap-3 overflow-hidden">
                                           <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-xl shadow-sm overflow-hidden shrink-0 relative">
                                               {renderServerFlag(server) || <span>{server.flag || '🌐'}</span>}
                                               <span className="hidden absolute inset-0 items-center justify-center bg-inherit">{server.flag || '🌐'}</span>
                                           </div>
                                           <div className="flex flex-col overflow-hidden">
                                               <span className="font-bold text-[13px] truncate pr-2">{server.name}</span>
                                               {(serverPings[server.url] !== undefined) && (
                                                   <div className="flex items-center gap-2 mt-0.5">
                                                       <div className={`flex items-center gap-1 text-[11px] font-bold ${getPingColor(serverPings[server.url] ?? -2)}`}>
                                                            <Signal size={12} strokeWidth={3} />
                                                            <span>{formatPing(serverPings[server.url] ?? -2)}</span>
                                                       </div>
                                                   </div>
                                               )}
                                           </div>
                                       </div>
                                       {selectedServer?.name === server.name && (
                                           <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
                                               <Check size={18} strokeWidth={3} />
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}

                       {/* --- СЕКЦИЯ 2: ОБХОД БЛОКИРОВОК (RESCUE) --- */}
                       {servers.filter(s => s.isRescue).length > 0 && (
                           <div className="space-y-2 pt-4">
                               <div className={`h-px -mx-3 mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                               <h3 className="text-xs font-bold opacity-50 uppercase tracking-wider ml-2 mb-3">🛡 Обход блокировок</h3>
                               {servers.filter(s => s.isRescue).map((server, idx) => (
                                   <div
                                     key={`rescue-${idx}`}
                                     onClick={() => selectServer(server)}
                                     className={`group w-full p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all active:scale-[0.98] ${
                                         selectedServer?.name === server.name
                                         ? 'border-blue-500 bg-blue-500/10'
                                         : (isDarkMode ? 'border-white/[0.07] bg-[#27272a] hover:bg-[#323236]' : 'border-black/[0.07] bg-gray-50 hover:bg-gray-100')
                                     }`}
                                   >
                                       <div className="flex items-center gap-3 overflow-hidden">
                                           <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-xl shadow-sm overflow-hidden shrink-0 relative">
                                               {renderServerFlag(server) || <span>{server.flag || '🌐'}</span>}
                                               <span className="hidden absolute inset-0 items-center justify-center bg-inherit">{server.flag || '🌐'}</span>
                                           </div>
                                           <div className="flex flex-col overflow-hidden">
                                               <span className="font-bold text-[13px] truncate pr-2">{server.name}</span>
                                               {(serverPings[server.url] !== undefined) && (
                                                   <div className="flex items-center gap-2 mt-0.5">
                                                       <div className={`flex items-center gap-1 text-[11px] font-bold ${getPingColor(serverPings[server.url] ?? -2)}`}>
                                                            <Signal size={12} strokeWidth={3} />
                                                            <span>{formatPing(serverPings[server.url] ?? -2)}</span>
                                                       </div>
                                                   </div>
                                               )}
                                           </div>
                                       </div>
                                       {selectedServer?.name === server.name && (
                                           <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
                                               <Check size={18} strokeWidth={3} />
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </>
               )}
            </div>

          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
           <div className={`w-full max-w-sm p-6 rounded-4xl shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#18181b] border border-white/5' : 'bg-white shadow-xl'}`}>
              <div className={`p-4 rounded-full ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}`}><TriangleAlert size={40} className="text-red-500" /></div>
              <div className="flex flex-col gap-2"><h3 className="text-base font-bold">Упс!</h3><p className="text-sm opacity-60 leading-relaxed">{errorMsg}</p></div>
              <button onClick={() => setErrorMsg(null)} className="w-full mt-2 py-3.5 bg-[#27272a] hover:bg-[#323236] active:scale-[0.98] text-white font-bold rounded-xl transition-all">Закрыть</button>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
                isDarkMode 
                ? 'bg-[#18181b]/90 border-white/10 text-white' 
                : 'bg-white/90 border-gray-200 text-gray-800'
            }`}>
                {toast.type === 'success' ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                )}
                <span className="text-sm font-bold">{toast.message}</span>
            </div>
        </div>
      )}

      {/* Main Content (SCROLLABLE AREA) */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-0 pt-2 overflow-y-auto">
        {!savedKey ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full max-w-[320px] flex flex-col gap-4">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-500 to-purple-600 mx-auto mb-6 shadow-2xl shadow-blue-500/30 flex items-center justify-center">
                            <Key size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Вход по ключу</h2>
                        <p className="text-sm opacity-50">Вставьте вашу ссылку-подписку (VLESS)</p>
                    </div>
                    <div className={`p-2 rounded-2xl border flex items-center transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-gray-200'}`}>
                       <button onClick={handlePaste} className="p-3 opacity-40 hover:opacity-100 transition-opacity"><Key size={20} /></button>
                       <input type="text" value={inputKey} onChange={(e) => setInputKey(e.target.value)} placeholder="Вставьте ссылку сюда..." className="custom-placeholder flex-1 text-sm outline-none bg-transparent py-3 px-2" />
                    </div>
                    <button onClick={handleSaveKey} disabled={inputKey.length < 5} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-lg ${inputKey.length < 5 ? 'bg-[#27272a] text-gray-500 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25'}`}>
                       <span>Войти</span> <ArrowRight size={20} />
                    </button>
                    <div className="mt-8 text-center"><button onClick={() => openLink('https://t.me/narodniy_vpn_bot')} className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">Получить ключ в Telegram</button></div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col h-full animate-in zoom-in duration-300">

                {/* IP / страна — компактная строка над кнопкой ВКЛ */}
                <div className={`relative z-10 flex items-center justify-center gap-3 mt-2 mb-4 transition-all duration-500 px-4 py-2 rounded-2xl mx-auto w-fit ${isConnected ? 'opacity-100' : 'opacity-30'} ${isDarkMode ? '' : 'bg-black/5 border border-black/10'}`}>
                    {ipData?.code && ipData.code !== "VPN" && ipData.code !== "SEC" ? (
                        <img
                            src={getFlagImage(ipData.code)!}
                            alt={ipData.country}
                            className="w-7 h-auto rounded shadow object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <div className={`${(ipData?.code && getFlagImage(ipData.code)) ? 'hidden' : 'block'}`}>
                        <Globe size={20} className="text-gray-500" />
                    </div>
                    <span className={`text-base font-bold tracking-tight ${isLoading ? 'blur-sm' : ''}`}>{ipData?.ip || "..."}</span>
                    <span className="text-xs opacity-50 font-medium">{(ipData?.city && ipData.city !== "Secure") ? ipData.city : (ipData?.country && ipData.country !== "VPN" ? ipData.country : "Безопасное соединение")}</span>
                    <button onClick={checkIp} disabled={isIpLoading} className={`p-1.5 rounded-full transition-all ${isIpLoading ? 'animate-spin opacity-50' : 'opacity-30 hover:opacity-100 hover:bg-white/5'}`}>
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Power Button Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative my-4">

                  {easterEggActive && (
                    <div className="absolute left-1/2 z-50 pointer-events-none"
                      style={{
                        top: 'calc(50% - 120px)',
                        animation: easterEggLeaving
                          ? 'catPopDown 0.13s cubic-bezier(0.4,0,1,1) forwards'
                          : 'catPopUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'
                      }}>
                      <img src="easter-egg.gif" alt="" className="w-12 h-12 object-contain" />
                    </div>
                  )}

                    <button
                        onClick={handleToggleVpn}
                        // disabled только при isUpdating — isLoading НЕ блокирует, чтобы юзер
                        // мог отменить идущий connect повторным нажатием (см. handleToggleVpn).
                        disabled={isUpdating}
                        title={isLoading && !isConnected ? "Нажмите чтобы отменить" : undefined}
                        className={`
                            relative z-10 w-44 h-44 rounded-full flex items-center justify-center 
                            transition-all duration-500 ease-out shadow-2xl active:scale-95 group outline-none
                            ${isConnected
                                ? 'bg-linear-to-br from-green-400 to-green-600 btn-connect-active text-white'
                                : `border-4 ${isDarkMode ? 'bg-[#18181b] text-[#52525b] border-[#27272a] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-white text-gray-400 border-gray-200 shadow-lg shadow-gray-200'}`
                            }
                            ${isLoading ? 'scale-95 opacity-90' : ''}
                        `}
                    >
                       {isLoading || isUpdating ? (
                           <Loader2 size={48} className={`animate-spin ${isConnected ? 'text-white' : 'text-orange-500'}`} />
                       ) : (
                           <Power size={64} className={`transition-all duration-500 ${isConnected ? 'drop-shadow-md' : 'group-hover:text-gray-300'}`} strokeWidth={2.5} />
                       )}
                    </button>
                    
                    {reconnectInfo && (
                        <div className="relative z-10 mt-4 text-center">
                            <span className="text-sm font-medium text-orange-400">
                                Попытка {reconnectInfo.attempt} из {reconnectInfo.max}...
                            </span>
                        </div>
                    )}

                    {/* КНОПКА ВЫБОРА СЕРВЕРА */}
                    <div className="relative z-10 mt-6 animate-in slide-in-from-bottom-2 duration-500">
                        <button 
                            onClick={() => setIsServerModalOpen(true)}
                            disabled={isLoading}
                            className={`
                                group relative flex items-center gap-3 px-5 py-2.5 rounded-full 
                                transition-all active:scale-95 border
                                ${isDarkMode
                                    ? 'bg-black/30 border-white/10 hover:bg-black/40 text-gray-200 backdrop-blur-sm'
                                    : 'bg-white/60 border-black/10 hover:bg-white/80 text-gray-700 backdrop-blur-sm'
                                }
                            `}
                        >
                            <span className="text-lg leading-none flex items-center justify-center w-6">
                                {selectedServer 
                                  ? (renderServerFlag(selectedServer, "w-5 h-auto") || selectedServer.flag) 
                                  : <MapPin size={16} className="text-blue-500"/>
                                }
                            </span>
                            
                            <span className="text-sm font-semibold max-w-30 truncate">
                                {selectedServer ? selectedServer.name : 'Авто-выбор'}
                            </span>

                            <ChevronDown size={14} className="opacity-50" />
                        </button>
                    </div>
                </div>
                
            </div>
        )}
      </div>

      </div>{/* /Main wrapper */}
    </main>
  );
}

export default App;