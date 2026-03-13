import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CampaignEditor from './components/CampaignEditor';
import { 
  Sparkles, 
  Zap, 
  Menu,
  X,
  ChevronRight,
  Camera,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-right" />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2.5 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AdVantage Gen
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Campaign Studio</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1 group">
                <span>Products</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Showcase</a>
              <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105">
                Get Started
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <a href="#" className="block text-gray-300 hover:text-white py-2">Products</a>
              <a href="#" className="block text-gray-300 hover:text-white py-2">Pricing</a>
              <a href="#" className="block text-gray-300 hover:text-white py-2">Showcase</a>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium">
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Zap size={16} className="text-yellow-400 mr-2" />
            <span className="text-sm text-gray-300">AI-Powered Campaign Generation</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
  Create Stunning
  <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent py-2 leading-relaxed">
    Ad Campaigns in Seconds
  </span>
</h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your ideas into professional social media campaigns with AI-generated images, 
            captions, and branded content.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Camera className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">50K+</div>
                <div className="text-xs text-gray-400">Images Generated</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">10K+</div>
                <div className="text-xs text-gray-400">Happy Users</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-pink-500/20 p-2 rounded-lg">
                <Star className="w-5 h-5 text-pink-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">4.9/5</div>
                <div className="text-xs text-gray-400">User Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Campaign Editor Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-25"></div>
          
          {/* Main Content Card */}
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">v2.0</span>
                  <span className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    BETA
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Editor Component */}
            <div className="p-6">
              <CampaignEditor />
            </div>

            {/* Footer Stats */}
            <div className="border-t border-white/10 px-6 py-4 bg-black/20">
              <div className="flex flex-wrap items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">⚡ 2.5s generation time</span>
                  <span className="text-gray-400">🎨 4 AI models</span>
                  <span className="text-gray-400">📱 6 platforms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Trusted by</span>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-slate-900"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['AI Image Generation', 'Smart Captions', 'Brand Kit', 'Multi-Platform', 'Analytics'].map((feature) => (
            <span key={feature} className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-default">
              {feature}
            </span>
          ))}
        </div>
      </section>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
  __html: `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `
}} />
    </div>
  );
}

export default App;