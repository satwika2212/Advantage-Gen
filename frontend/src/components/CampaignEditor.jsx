import React, { useState, useRef, useEffect, useCallback } from "react";
import * as fabric from "fabric";
import axios from "axios";
import { Send, Download, Upload, Sun, Moon, Sparkles, RefreshCw, Copy, Check, Settings, X, Maximize2, Minimize2, Layers, Palette, Grid3X3, Eye, EyeOff, Heart, Share2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = axios.create({ baseURL: "http://localhost:5000/api", timeout: 30000 });

export default function CampaignEditor() {
  const [messages, setMessages] = useState([{ 
    id: 1, 
    role: "assistant", 
    content: "Welcome to AdVantage Studio — where AI meets creativity. Describe your vision and watch it come to life.",
    time: new Date() 
  }]);
  
  const [prompt, setPrompt] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [logo, setLogo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [favorites, setFavorites] = useState([]);
  
  const [config, setConfig] = useState({ 
    style: "cinematic", 
    mood: "dramatic", 
    aspectRatio: "16:9",
    lighting: "golden hour",
    orientation: "landscape"
  });
  
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { checkBackend(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const checkBackend = async () => {
    try { 
      const { data } = await API.get("/test"); 
      data.success ? setBackendStatus("connected") : setBackendStatus("disconnected"); 
    } catch { 
      setBackendStatus("disconnected"); 
    }
  };

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !campaign?.image) return;
    
    const width = fullscreen ? window.innerWidth * 0.7 : 800;
    const height = fullscreen ? window.innerHeight * 0.7 : 450;
    
    const canvas = new fabric.Canvas(canvasRef.current, { 
      width, 
      height, 
      backgroundColor: darkMode ? "#111827" : "#f9fafb",
      selection: true,
      preserveObjectStacking: true
    });
    
    fabricRef.current = canvas;

    fabric.Image.fromURL(campaign.image.dataUrl, (img) => {
      const scale = Math.min(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      img.set({
        left: (width - scaledWidth) / 2,
        top: (height - scaledHeight) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        cornerSize: 0
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      
      // Add subtle vignette effect
      const vignette = new fabric.Rect({
        width,
        height,
        fill: 'rgba(0,0,0,0.1)',
        selectable: false,
        evented: false,
        left: 0,
        top: 0,
        globalCompositeOperation: 'multiply'
      });
      canvas.add(vignette);
      
      if (logo) {
        fabric.Image.fromURL(logo.dataUrl, (logoImg) => {
          const logoScale = Math.min(80 / logoImg.width, 80 / logoImg.height);
          logoImg.set({
            left: 20,
            top: 20,
            scaleX: logoScale,
            scaleY: logoScale,
            cornerSize: 10,
            transparentCorners: false,
            borderColor: '#3b82f6',
            cornerColor: '#3b82f6'
          });
          canvas.add(logoImg);
        });
      }
      
      // Add artistic watermark
      const watermark = new fabric.Text('AdVantage', {
        left: width - 100,
        top: height - 30,
        fontSize: 12,
        fill: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        fontFamily: 'SF Mono, Monaco, monospace',
        selectable: false,
        evented: false
      });
      canvas.add(watermark);
      
      canvas.renderAll();
    });
  }, [campaign, logo, darkMode, fullscreen]);

  useEffect(() => { 
    if (campaign) {
      setTimeout(initCanvas, 100);
      window.addEventListener('resize', initCanvas);
      return () => window.removeEventListener('resize', initCanvas);
    }
  }, [campaign, initCanvas]);

  const generateCampaign = async () => {
    if (!prompt || loading) return;
    
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: "user", 
      content: prompt, 
      time: new Date() 
    }]);
    
    setLoading(true);
    setIsTyping(true);
    
    try {
      const { data } = await API.post("/full-campaign", { 
        prompt, 
        ...config, 
        logoData: logo?.dataUrl 
      });
      
      if (data.success) {
        setCampaign(data.data);
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: "assistant", 
          content: "Your vision has been transformed into art. The landscape is ready for refinement.",
          time: new Date() 
        }]);
        toast.success("Creation complete", { icon: '🎨' });
      }
    } catch { 
      toast.error("Unable to create. Please try again."); 
    }
    
    setLoading(false);
    setIsTyping(false);
    setPrompt("");
  };

  const uploadLogo = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return toast.error("Logo must be under 5MB");
    const reader = new FileReader();
    reader.onload = () => { 
      setLogo({ file, dataUrl: reader.result }); 
      toast.success("Brand mark added", { icon: '✨' }); 
    };
    reader.readAsDataURL(file);
  };

  const exportImage = () => {
    if (!fabricRef.current) return;
    const link = document.createElement("a");
    link.download = `masterpiece-${Date.now()}.png`;
    link.href = fabricRef.current.toDataURL({ 
      format: "png", 
      quality: 1,
      multiplier: 2 
    });
    link.click();
    toast.success("Your masterpiece has been saved", { icon: '🏆' });
  };

  const copyCaption = () => {
    if (!campaign?.caption) return;
    navigator.clipboard.writeText(campaign.caption.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Caption copied to clipboard", { icon: '📋' });
  };

  const toggleFavorite = () => {
    if (favorites.includes(campaign?.id)) {
      setFavorites(prev => prev.filter(id => id !== campaign.id));
      toast.success("Removed from collection");
    } else {
      setFavorites(prev => [...prev, campaign?.id]);
      toast.success("Added to favorites", { icon: '❤️' });
    }
  };

  if (backendStatus === "checking") {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400" size={24} />
          </div>
          <p className="mt-4 text-gray-300 font-light tracking-wide">Awakening the creative mind...</p>
        </div>
      </div>
    );
  }

  if (backendStatus === "disconnected") {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <EyeOff className="text-red-400" size={32} />
          </div>
          <h2 className="text-2xl font-light text-white mb-3">Connection Interrupted</h2>
          <p className="text-gray-400 mb-8">The creative studio is currently unavailable</p>
          <button 
            onClick={checkBackend} 
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all transform hover:scale-105"
          >
            Attempt Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-right" toastOptions={{ style: { background: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#000' } }} />
      
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-lg z-10`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className={`text-xl font-light ${darkMode ? 'text-white' : 'text-gray-900'}`}>AdVantage<span className="font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Studio</span></h1>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Where imagination takes form</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Grid"
          >
            <Grid3X3 size={18} />
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Minimal */}
        <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-lg`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className="space-y-1">
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {m.role === 'assistant' ? '🎨 Studio' : '👤 You'} • {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${
                  m.role === "user" 
                    ? "ml-auto max-w-[90%] bg-gradient-to-r from-purple-600 to-blue-600 text-white" 
                    : darkMode 
                      ? "bg-gray-800/50 text-gray-200 border border-gray-700" 
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-300"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t dark:border-gray-800 space-y-3">
            <div className="relative">
              <input 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && generateCampaign()} 
                placeholder="Describe your vision..." 
                className={`w-full px-4 py-3 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`} 
              />
              <button 
                onClick={generateCampaign} 
                disabled={loading || !prompt} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`flex-1 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Palette size={14} />Style
              </button>
              <button 
                onClick={() => fileInputRef.current.click()} 
                className={`flex-1 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Upload size={14} />{logo ? 'Brand' : 'Logo'}
              </button>
              <input type="file" hidden ref={fileInputRef} onChange={uploadLogo} accept="image/*" />
            </div>

            {showSettings && (
              <div className={`p-4 rounded-xl space-y-3 animate-fadeIn ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <select 
                  value={config.style} 
                  onChange={(e) => setConfig(c => ({ ...c, style: e.target.value }))} 
                  className={`w-full p-2 rounded-lg text-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                >
                  <option value="cinematic">🎬 Cinematic</option>
                  <option value="artistic">🖼️ Artistic</option>
                  <option value="minimal">⬜ Minimal</option>
                  <option value="dramatic">🌅 Dramatic</option>
                </select>
                <select 
                  value={config.lighting} 
                  onChange={(e) => setConfig(c => ({ ...c, lighting: e.target.value }))} 
                  className={`w-full p-2 rounded-lg text-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                >
                  <option value="golden hour">✨ Golden Hour</option>
                  <option value="studio">💡 Studio</option>
                  <option value="natural">☀️ Natural</option>
                  <option value="dramatic">🌑 Dramatic</option>
                </select>
              </div>
            )}

            {logo && (
              <div className={`p-3 rounded-xl flex items-center justify-between ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <img src={logo.dataUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Brand asset</span>
                </div>
                <button onClick={() => setLogo(null)} className="p-1 hover:bg-red-500/20 rounded text-red-400"><X size={14} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area - Landscape Focus */}
        <div className={`flex-1 relative overflow-auto bg-gradient-to-br ${darkMode ? 'from-gray-950 via-gray-900 to-gray-950' : 'from-gray-100 via-white to-gray-100'}`}>
          <div 
            ref={containerRef}
            className={`min-h-full flex items-center justify-center p-8 transition-all ${fullscreen ? 'p-0' : ''}`}
          >
            {campaign ? (
              <div className="relative group">
                {/* Canvas Container */}
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all ${
                  fullscreen ? 'rounded-none shadow-none' : ''
                }`}>
                  <canvas ref={canvasRef} className="w-full h-auto" />
                  
                  {/* Overlay Controls */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setFullscreen(!fullscreen)}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                      title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button 
                      onClick={exportImage}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                      title="Download masterpiece"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={toggleFavorite}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                      title="Add to collection"
                    >
                      <Heart size={16} className={favorites.includes(campaign.id) ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                  </div>
                  
                  {/* Caption Overlay */}
                  {campaign.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-start justify-between">
                        <div className="max-w-2xl">
                          <p className="text-white/90 text-sm font-light leading-relaxed">
                            {campaign.caption.caption}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {campaign.caption.hashtags?.slice(0, 5).map((tag, i) => (
                              <span key={i} className="text-xs text-white/60 hover:text-white transition-colors cursor-default">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={copyCaption}
                          className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
                          title="Copy caption"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center max-w-2xl">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                    <Layers className="text-purple-400" size={48} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl -z-10"></div>
                </div>
                <h2 className={`text-4xl font-light mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Begin your<span className="block font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">creative journey</span>
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Share your vision, and watch as AI transforms it into a stunning landscape composition
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}