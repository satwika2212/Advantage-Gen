import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import axios from 'axios';
import { 
  Send, Image as ImageIcon, Download, Sparkles, Upload, Trash2, 
  Settings, Copy, Check, X, RefreshCw, Save, Edit3, Type, 
  Square, Circle, Palette, Zap, Globe, Users, Target, 
  TrendingUp, Moon, Sun, Maximize2, Minimize2, AlertCircle,
  ChevronDown, ChevronUp, Plus, Layers, Eye, EyeOff
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const CampaignEditor = () => {
  // Chat state
  const [messages, setMessages] = useState([
    { 
      id: 1,
      type: 'assistant', 
      content: '👋 Welcome to AdVantage AI! I\'m your creative assistant. Tell me about your campaign idea and I\'ll help you create stunning visuals and compelling copy.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(Date.now().toString());

  // Campaign state
  const [campaignData, setCampaignData] = useState({
    image: null,
    caption: null,
    variations: []
  });
  const [activeVariation, setActiveVariation] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('design'); // 'design', 'text', 'elements'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Advanced options
  const [campaignConfig, setCampaignConfig] = useState({
    style: 'photorealistic',
    platform: 'instagram',
    tone: 'professional',
    industry: 'retail',
    targetAudience: 'millennials',
    campaignGoal: 'awareness',
    ctaText: 'Shop Now',
    ctaColor: '#007AFF',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontFamily: 'Inter',
    mood: 'energetic',
    lighting: 'natural',
    composition: 'rule-of-thirds',
    aspectRatio: '1:1',
    includeLogo: true,
    includeHeadline: true,
    headlinePosition: 'top',
    textOverlay: true
  });

  // Logo state
  const [logo, setLogo] = useState(null);
  const [logoPosition, setLogoPosition] = useState({ x: 20, y: 20 });

  // UI state
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [selectedElement, setSelectedElement] = useState(null);
  const [layers, setLayers] = useState([]);

  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize canvas
  useEffect(() => {
    if (showEditor && campaignData.image && !fabricCanvasRef.current) {
      setTimeout(() => initCanvas(), 100);
    }
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [showEditor, campaignData.image, activeVariation]);

  // Update canvas when config changes
  useEffect(() => {
    if (fabricCanvasRef.current && showEditor) {
      updateCanvasElements();
    }
  }, [campaignConfig, logo, activeVariation]);

  const initCanvas = () => {
    const canvas = new fabric.Canvas('editor-canvas', {
      width: 800,
      height: 800,
      backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
      selection: true,
      preserveObjectStacking: true
    });

    const currentImage = campaignData.variations[activeVariation] || campaignData.image;
    
    if (currentImage) {
      fabric.Image.fromURL(currentImage.dataUrl, (img) => {
        const scale = Math.min(800 / img.width, 800 / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (800 - img.width * scale) / 2,
          top: (800 - img.height * scale) / 2,
          selectable: false,
          evented: false,
          name: 'background'
        });
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        
        // Add all design elements
        addAllElements(canvas);
        
        // Initialize layers
        updateLayers(canvas);
      });
    }

    // Add event listeners
    canvas.on('object:selected', (e) => {
      setSelectedElement(e.target);
    });

    canvas.on('object:modified', () => {
      updateLayers(canvas);
    });

    fabricCanvasRef.current = canvas;
  };

  const addAllElements = (canvas) => {
    // Add CTA button
    if (campaignConfig.ctaText) {
      addCTAButton(canvas);
    }

    // Add logo
    if (campaignConfig.includeLogo && logo) {
      addLogo(canvas);
    }

    // Add headline
    if (campaignConfig.includeHeadline && campaignData.caption?.headline) {
      addHeadline(canvas);
    }

    // Add decorative elements based on mood
    addMoodElements(canvas);
  };

  const addCTAButton = (canvas) => {
    const buttonGroup = createCTAButton(
      campaignConfig.ctaText,
      campaignConfig.ctaColor,
      { left: 800 - 180, top: 800 - 80 }
    );
    buttonGroup.set({
      name: 'cta-button',
      hasControls: true,
      hasBorders: true
    });
    canvas.add(buttonGroup);
  };

  const createCTAButton = (text, color, position) => {
    const rect = new fabric.Rect({
      width: 160,
      height: 48,
      fill: color,
      rx: 24,
      ry: 24,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 10,
        offsetX: 0,
        offsetY: 4
      })
    });

    const textElement = new fabric.Text(text, {
      fontSize: 18,
      fontFamily: campaignConfig.fontFamily,
      fill: '#ffffff',
      fontWeight: 'bold',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.2)',
        blur: 4,
        offsetX: 0,
        offsetY: 2
      })
    });

    return new fabric.Group([rect, textElement], {
      left: position.left,
      top: position.top,
      originX: 'center',
      originY: 'center'
    });
  };

  const addLogo = (canvas) => {
    if (!logo) return;

    fabric.Image.fromURL(logo.dataUrl, (img) => {
      const scale = Math.min(80 / img.width, 80 / img.height);
      img.set({
        left: logoPosition.x,
        top: logoPosition.y,
        scaleX: scale,
        scaleY: scale,
        hasControls: true,
        hasBorders: true,
        name: 'logo',
        cornerColor: campaignConfig.primaryColor,
        cornerSize: 10,
        transparentCorners: false
      });
      canvas.add(img);
      canvas.renderAll();
    });
  };

  const addHeadline = (canvas) => {
    if (!campaignData.caption?.headline) return;

    const headline = new fabric.Text(campaignData.caption.headline, {
      fontSize: 32,
      fontFamily: campaignConfig.fontFamily,
      fill: darkMode ? '#ffffff' : '#000000',
      fontWeight: 'bold',
      left: 400,
      top: campaignConfig.headlinePosition === 'top' ? 60 : 740,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      width: 600,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.2)',
        blur: 8,
        offsetX: 0,
        offsetY: 2
      }),
      name: 'headline'
    });

    canvas.add(headline);
  };

  const addMoodElements = (canvas) => {
    // Add decorative elements based on campaign mood
    const elements = [];
    
    if (campaignConfig.mood === 'energetic') {
      // Add some dynamic shapes
      for (let i = 0; i < 5; i++) {
        const circle = new fabric.Circle({
          radius: 10 + Math.random() * 20,
          fill: campaignConfig.secondaryColor,
          opacity: 0.3,
          left: Math.random() * 800,
          top: Math.random() * 800,
          selectable: false,
          evented: false,
          name: `decor-${i}`
        });
        elements.push(circle);
      }
    }

    elements.forEach(el => canvas.add(el));
  };

  const updateCanvasElements = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Update CTA button if exists
    const ctaButton = canvas.getObjects().find(obj => obj.name === 'cta-button');
    if (ctaButton) {
      canvas.remove(ctaButton);
      addCTAButton(canvas);
    }

    canvas.renderAll();
    updateLayers(canvas);
  };

  const updateLayers = (canvas) => {
    const objects = canvas.getObjects();
    const layerData = objects.map((obj, index) => ({
      id: index,
      name: obj.name || `Layer ${index + 1}`,
      type: obj.type,
      visible: obj.visible !== false,
      locked: obj.lockMovementX && obj.lockMovementY,
      object: obj
    }));
    setLayers(layerData);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate campaign based on input
      const response = await generateCampaignFromPrompt(input);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.message,
        campaignData: response.campaign,
        suggestions: response.suggestions,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.campaign) {
        setCampaignData(prev => ({
          ...prev,
          image: response.campaign.image,
          caption: response.campaign.caption,
          variations: response.campaign.variations || []
        }));
        setShowEditor(true);
      }

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while generating your campaign. Could you please try again?',
        error: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateCampaignFromPrompt = async (prompt) => {
    // This would be your actual API call
    // For now, returning mock data
    return {
      message: `I've created a stunning ${campaignConfig.style} campaign for your ${campaignConfig.industry} brand targeting ${campaignConfig.targetAudience}. The visual emphasizes ${campaignConfig.mood} vibes with ${campaignConfig.lighting} lighting. Here's what I've prepared:`,
      campaign: {
        image: { dataUrl: 'mock-image-url' },
        caption: {
          headline: 'Transform Your Morning Routine',
          caption: `Start your day right with our revolutionary product. Designed for ${campaignConfig.targetAudience} who value quality and innovation.`,
          hashtags: ['#Innovation', '#Quality', '#Lifestyle', campaignConfig.industry],
          cta: campaignConfig.ctaText
        },
        variations: [
          { dataUrl: 'mock-variation-1', style: 'modern' },
          { dataUrl: 'mock-variation-2', style: 'minimalist' },
          { dataUrl: 'mock-variation-3', style: 'bold' }
        ]
      },
      suggestions: [
        'Try a different color palette',
        'Adjust the headline position',
        'Add a promotional badge',
        'Create a carousel version'
      ]
    };
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo({
          file,
          dataUrl: event.target.result,
          name: file.name
        });

        // Add assistant message about logo
        const logoMessage = {
          id: Date.now(),
          type: 'assistant',
          content: `✅ Logo "${file.name}" uploaded successfully! You can now drag it to position it perfectly on your design.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, logoMessage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportImage = () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2 // High resolution
    });
    
    const link = document.createElement('a');
    link.download = `campaign-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    // Success message
    const exportMessage = {
      id: Date.now(),
      type: 'assistant',
      content: '✨ Campaign exported successfully! Ready to publish on your social channels.',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, exportMessage]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateVariation = async () => {
    setIsTyping(true);
    // Simulate generating a variation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newVariation = {
      dataUrl: 'mock-variation-new',
      style: 'creative'
    };

    setCampaignData(prev => ({
      ...prev,
      variations: [...prev.variations, newVariation]
    }));
    
    setActiveVariation(campaignData.variations.length);
    setIsTyping(false);
  };

  const toggleLayerVisibility = (layer) => {
    if (layer.object) {
      layer.object.visible = !layer.object.visible;
      fabricCanvasRef.current.renderAll();
      updateLayers(fabricCanvasRef.current);
    }
  };

  const removeLayer = (layer) => {
    if (layer.object && layer.object.name !== 'background') {
      fabricCanvasRef.current.remove(layer.object);
      fabricCanvasRef.current.renderAll();
      updateLayers(fabricCanvasRef.current);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Left Panel - ChatGPT-like Interface */}
      <div className={`w-96 flex flex-col border-r ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-white'}`}>
                AdVantage AI
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                Creative Assistant • v2.0
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-blue-500 text-white'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3 ${
                  msg.type === 'user'
                    ? darkMode
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-blue-600 text-white rounded-br-none'
                    : darkMode
                      ? 'bg-gray-700 text-gray-100 rounded-bl-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Suggestions */}
                {msg.suggestions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          darkMode
                            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  msg.type === 'user' 
                    ? 'text-blue-200' 
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-none p-4 ${
                darkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    darkMode ? 'bg-gray-400' : 'bg-gray-400'
                  }`} />
                  <div className={`w-2 h-2 rounded-full animate-bounce delay-100 ${
                    darkMode ? 'bg-gray-400' : 'bg-gray-400'
                  }`} />
                  <div className={`w-2 h-2 rounded-full animate-bounce delay-200 ${
                    darkMode ? 'bg-gray-400' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Settings size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ImageIcon size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={generateVariation}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <RefreshCw size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <div className="flex-1" />
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {campaignData.variations.length} variations
            </span>
          </div>

          {/* Advanced Settings Panel */}
          {showSettings && (
            <div className={`mb-3 p-3 rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="space-y-2">
                <select
                  value={campaignConfig.industry}
                  onChange={(e) => setCampaignConfig(prev => ({ ...prev, industry: e.target.value }))}
                  className={`w-full text-sm p-2 rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="retail">🛍️ Retail</option>
                  <option value="tech">💻 Technology</option>
                  <option value="fashion">👗 Fashion</option>
                  <option value="food">🍔 Food & Beverage</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="health">💪 Health & Fitness</option>
                </select>

                <select
                  value={campaignConfig.targetAudience}
                  onChange={(e) => setCampaignConfig(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className={`w-full text-sm p-2 rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="genz">👥 Gen Z</option>
                  <option value="millennials">👥 Millennials</option>
                  <option value="genx">👥 Gen X</option>
                  <option value="boomers">👥 Baby Boomers</option>
                  <option value="professionals">💼 Professionals</option>
                </select>

                <select
                  value={campaignConfig.mood}
                  onChange={(e) => setCampaignConfig(prev => ({ ...prev, mood: e.target.value }))}
                  className={`w-full text-sm p-2 rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="energetic">⚡ Energetic</option>
                  <option value="calm">😌 Calm</option>
                  <option value="luxury">💎 Luxury</option>
                  <option value="playful">🎮 Playful</option>
                  <option value="professional">👔 Professional</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your campaign idea..."
              className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 focus:ring-blue-500'
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Right Panel - Enhanced Editor */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        {showEditor ? (
          <>
            {/* Editor Toolbar */}
            <div className={`p-4 border-b flex items-center justify-between ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorMode('design')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                    editorMode === 'design'
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <Palette size={18} />
                  Design
                </button>
                <button
                  onClick={() => setEditorMode('text')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                    editorMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <Type size={18} />
                  Text
                </button>
                <button
                  onClick={() => setEditorMode('elements')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                    editorMode === 'elements'
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <Layers size={18} />
                  Layers
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activeVariation}
                  onChange={(e) => setActiveVariation(Number(e.target.value))}
                  className={`px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {campaignData.variations.map((_, index) => (
                    <option key={index} value={index}>
                      Variation {index + 1}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Plus size={18} />
                </button>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Minimize2 size={18} />
                </button>

                <button
                  onClick={exportImage}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Canvas */}
              <div className="flex-1 p-6 overflow-auto">
                <div 
                  className={`inline-block rounded-lg shadow-2xl ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } p-4`}
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  <canvas id="editor-canvas" width="800" height="800" />
                </div>
              </div>

              {/* Right Properties Panel */}
              <div className={`w-80 border-l overflow-y-auto ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {editorMode === 'design' && (
                  <div className="p-4 space-y-4">
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Design Settings
                    </h3>
                    
                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={campaignConfig.primaryColor}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full h-10 rounded"
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        value={campaignConfig.secondaryColor}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-full h-10 rounded"
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        CTA Color
                      </label>
                      <input
                        type="color"
                        value={campaignConfig.ctaColor}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, ctaColor: e.target.value }))}
                        className="w-full h-10 rounded"
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Lighting
                      </label>
                      <select
                        value={campaignConfig.lighting}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, lighting: e.target.value }))}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="natural">Natural</option>
                        <option value="studio">Studio</option>
                        <option value="dramatic">Dramatic</option>
                        <option value="soft">Soft</option>
                      </select>
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Composition
                      </label>
                      <select
                        value={campaignConfig.composition}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, composition: e.target.value }))}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="rule-of-thirds">Rule of Thirds</option>
                        <option value="centered">Centered</option>
                        <option value="symmetrical">Symmetrical</option>
                        <option value="dynamic">Dynamic</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <input
                          type="checkbox"
                          checked={campaignConfig.includeLogo}
                          onChange={(e) => setCampaignConfig(prev => ({ ...prev, includeLogo: e.target.checked }))}
                          className="rounded"
                        />
                        Include Logo
                      </label>
                      
                      <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <input
                          type="checkbox"
                          checked={campaignConfig.includeHeadline}
                          onChange={(e) => setCampaignConfig(prev => ({ ...prev, includeHeadline: e.target.checked }))}
                          className="rounded"
                        />
                        Include Headline
                      </label>
                      
                      <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <input
                          type="checkbox"
                          checked={campaignConfig.textOverlay}
                          onChange={(e) => setCampaignConfig(prev => ({ ...prev, textOverlay: e.target.checked }))}
                          className="rounded"
                        />
                        Text Overlay
                      </label>
                    </div>
                  </div>
                )}

                {editorMode === 'text' && campaignData.caption && (
                  <div className="p-4 space-y-4">
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Text Settings
                    </h3>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Headline
                      </label>
                      <input
                        type="text"
                        value={campaignData.caption.headline || ''}
                        onChange={(e) => {
                          setCampaignData(prev => ({
                            ...prev,
                            caption: { ...prev.caption, headline: e.target.value }
                          }));
                        }}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Caption
                      </label>
                      <textarea
                        value={campaignData.caption.caption || ''}
                        onChange={(e) => {
                          setCampaignData(prev => ({
                            ...prev,
                            caption: { ...prev.caption, caption: e.target.value }
                          }));
                        }}
                        rows={4}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        CTA Text
                      </label>
                      <input
                        type="text"
                        value={campaignConfig.ctaText}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Font Family
                      </label>
                      <select
                        value={campaignConfig.fontFamily}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>

                    <button
                      onClick={() => copyToClipboard(campaignData.caption.caption)}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Caption'}
                    </button>
                  </div>
                )}

                {editorMode === 'elements' && (
                  <div className="p-4 space-y-4">
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Layers
                    </h3>

                    <div className="space-y-2">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleLayerVisibility(layer)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {layer.name}
                            </span>
                          </div>
                          {layer.name !== 'background' && (
                            <button
                              onClick={() => removeLayer(layer)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Add Elements
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                          <Square size={20} />
                          <span className="text-xs">Rectangle</span>
                        </button>
                        <button className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                          <Circle size={20} />
                          <span className="text-xs">Circle</span>
                        </button>
                        <button className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                          <Type size={20} />
                          <span className="text-xs">Text</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={64} className={`mx-auto mb-4 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Ready to Create Something Amazing?
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Describe your campaign idea in the chat and I'll generate a stunning visual for you
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className={`text-sm p-3 rounded-lg ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white shadow-sm'
                }`}>
                  <Zap className="inline mr-2" size={16} />
                  Try: "Summer fashion campaign for Gen Z"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignEditor;