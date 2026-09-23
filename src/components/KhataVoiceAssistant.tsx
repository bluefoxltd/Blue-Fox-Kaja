import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  MessageSquare, 
  X, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Store, 
  Utensils, 
  Wallet,
  Play,
  RotateCcw,
  Headphones
} from 'lucide-react';
import { CouponProfile, LedgerTransaction } from '../types';
import { calculateLedgerSummary } from '../utils/storage';
import { formatNepaliRupees, getCurrentBsDate, formatBsDateString } from '../utils/nepaliDate';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  highlightDue?: boolean;
}

interface KhataVoiceAssistantProps {
  couponProfile: CouponProfile;
  transactions: LedgerTransaction[];
  userRole: 'admin' | 'shopkeeper';
}

export const KhataVoiceAssistant: React.FC<KhataVoiceAssistantProps> = ({
  couponProfile,
  transactions,
  userRole,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [hasAutoAnnounced, setHasAutoAnnounced] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const summary = calculateLedgerSummary(transactions);
  const currentBs = getCurrentBsDate();
  const todayStr = formatBsDateString(currentBs);
  const shopName = couponProfile.shopName || 'दार्जिलिङ ममो';
  const holderName = couponProfile.holderName || 'ब्लु फक्स';
  const creditDue = summary.totalCreditDue;

  // Build the authentic Nepali voice reminder message
  const getVoiceReminderText = () => {
    if (userRole === 'admin') {
      return `नमस्ते! ब्लु फक्स खाजा खातामा स्वागत छ। दार्जिलिङ ममोको तिर्न बाँकी कुल उधारो रकम ${creditDue} रुपैयाँ रहेको छ। अहिलेसम्म चुक्ता गरिएको कुल रकम ${summary.totalPaid} रुपैयाँ छ।`;
    } else {
      return `नमस्ते दार्जिलिङ ममो! ब्लु फक्सको तिर्न बाँकी कुल उधारो रकम ${creditDue} रुपैयाँ छ। अहिलेसम्म प्राप्त भएको कुल भुक्तानी रकम ${summary.totalPaid} रुपैयाँ रहेको छ।`;
    }
  };

  // Load and cache voices when available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Web Speech API Voice synthesizer configured for Nepali language
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any active speech

      if (voiceMuted) return;

      // Clean and adapt text for natural Nepali pronunciation
      const cleanText = text
        .replace(/Rs\./g, ' रुपैयाँ ')
        .replace(/रू\./g, ' रुपैयाँ ')
        .replace(/•/g, ' ')
        .replace(/\*/g, '')
        .replace(/:/g, ', ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.88; // Natural Nepali cadence
      utterance.pitch = 1.0;

      // Detect Nepali or Devanagari-compatible voices
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      
      const nepaliVoice = voices.find((v) => 
        v.lang.toLowerCase().startsWith('ne') || 
        v.name.toLowerCase().includes('nepal')
      );
      
      const hindiVoice = voices.find((v) => 
        v.lang.toLowerCase().startsWith('hi') || 
        v.name.toLowerCase().includes('hindi')
      );

      if (nepaliVoice) {
        utterance.voice = nepaliVoice;
        utterance.lang = nepaliVoice.lang || 'ne-NP';
      } else if (hindiVoice) {
        // Hindi voices pronounce Devanagari script Nepali words accurately
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang || 'hi-IN';
      } else {
        utterance.lang = 'ne-NP';
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Trigger Nepali voice reminder on entering dashboard
  useEffect(() => {
    if (!hasAutoAnnounced && !voiceMuted) {
      const timer = setTimeout(() => {
        speakText(getVoiceReminderText());
        setHasAutoAnnounced(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [userRole, hasAutoAnnounced, voiceMuted, availableVoices]);

  // Initial welcome message in Nepali
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `नमस्ते! म ब्लु फक्स र ${shopName}को लाइभ खाजा खाता भ्वाइस सहायक हुँ।\n\n📢 लाइभ उधारो रिमाइन्डर: हाल तिर्न बाँकी कुल उधारो रकम ${formatNepaliRupees(creditDue)} रहेको छ। अहिलेसम्म कुल भुक्तानी गरिएको रकम ${formatNepaliRupees(summary.totalPaid)} छ।`,
      timestamp: 'अहिले',
      highlightDue: true,
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Answer generator in authentic Nepali
  const generateAssistantResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('due') || q.includes('credit') || q.includes('बाँकी') || q.includes('उधारो') || q.includes('कति') || q.includes('balance')) {
      return `💰 तिर्न बाँकी कुल उधारो रकम: ${formatNepaliRupees(creditDue)} रुपैयाँ।\nग्राहक: ${holderName}\nपसल: ${shopName}\nअधिकतम क्रेडिट सीमा: ${formatNepaliRupees(couponProfile.creditLimit || 25000)} (${Math.round((creditDue / (couponProfile.creditLimit || 25000)) * 100)}% प्रयोग भएको)।`;
    }

    if (q.includes('paid') || q.includes('payment') || q.includes('तिरेको') || q.includes('चुक्ता') || q.includes('fonepay') || q.includes('cash') || q.includes('नगद')) {
      return `💳 भुक्तानी स्थिति: हालसम्म कुल चुक्ता गरिएको रकम ${formatNepaliRupees(summary.totalPaid)} रुपैयाँ रहेको छ। भुक्तानी फोनपे क्युआर तथा नगदबाट गरिएको छ।`;
    }

    if (q.includes('food') || q.includes('snack') || q.includes('khaja') || q.includes('खाजा') || q.includes('momo') || q.includes('ममो') || q.includes('chiya') || q.includes('चिया') || q.includes('खर्च')) {
      const itemCounts = new Map<string, number>();
      transactions.forEach((tx) => {
        if (tx.type === 'PURCHASE' && Array.isArray(tx.items)) {
          tx.items.forEach((i) => {
            itemCounts.set(i.name, (itemCounts.get(i.name) || 0) + (i.qty || 1));
          });
        }
      });
      const topSnacks = Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const topList = topSnacks.map(([name, count]) => `• ${name} (${count} प्लेट)`).join('\n');
      return `🍲 कुल खाजा बिक्री: ${formatNepaliRupees(summary.totalSpent)} रुपैयाँ।\n\nसबैभन्दा धेरै खपत भएका खाजाहरू:\n${topList || 'खाजा विवरण उपलब्ध छैन'}।`;
    }

    if (q.includes('hotel') || q.includes('shop') || q.includes('address') || q.includes('phone') || q.includes('पसल') || q.includes('होटल') || q.includes('darjeeling')) {
      return `🏪 पसलको विवरण:\nनाम: ${shopName}\nठेगाना: ${couponProfile.shopAddress || 'इटहरी-६, स्काई प्लाजा'}\nसम्पर्क फोन: ${couponProfile.shopPhone || '९८०२७५५६०५'}\nस्थायी पास कोड: ${couponProfile.couponCode || 'BF-FOX-7821'}।`;
    }

    if (q.includes('blue fox') || q.includes('customer') || q.includes('ब्लु फक्स') || q.includes('ग्राहक')) {
      return `🏢 ग्राहक विवरण:\nनाम: ${holderName}\nस्वीकृत पास कोड: ${couponProfile.couponCode || 'BF-FOX-7821'}\nम्याद: वि.सं. ${couponProfile.issueDateBS} देखि ${couponProfile.validUntilBS} सम्म।`;
    }

    if (q.includes('remind') || q.includes('voice') || q.includes('आवाज') || q.includes('सुन्नुहोस्') || q.includes('बोल्नुहोस्')) {
      return `🔊 नेपाली भ्वाइस रिमाइन्डर: ${shopName}को तिर्न बाँकी कुल उधारो रकम ${creditDue} रुपैयाँ रहेको छ। तपाईंले आवाजको बटन थिचेर नेपालीमा सुन्न सक्नुहुन्छ।`;
    }

    if (q.includes('settle') || q.includes('कसरि') || q.includes('तिर्ने') || q.includes('how to pay')) {
      return `💵 उधारो चुक्ता गर्ने तरिका: एडमिन प्यानलको 'Pay to Shop (भुक्तानी)' बटन थिच्नुहोस्। तिर्न चाहेको रकम र फोनपे वा नगद माध्यम छानेर सेभ गर्नुहोस्।`;
    }

    return `म तपाईंलाई तिर्न बाँकी उधारो, कुल भुक्तानी, खाजा विवरण वा पसलको जानकारी नेपालीमा दिन सक्छु। तलका बटनहरू थिच्नुहोस् वा प्रश्न लेख्नुहोस्!`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'भर्खरै',
    };

    const replyText = generateAssistantResponse(text);
    const assistantMsg: ChatMessage = {
      id: `reply_${Date.now() + 1}`,
      sender: 'assistant',
      text: replyText,
      timestamp: 'भर्खरै',
      highlightDue: text.toLowerCase().includes('due') || text.toLowerCase().includes('बाँकी') || text.toLowerCase().includes('उधारो'),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputQuery('');

    // Automatically speak the Nepali reply if voice request or on button click
    if (text.includes('आवाज') || text.includes('voice') || text.includes('सुन्नुहोस्') || text.includes('बाँकी') || text.includes('remind')) {
      speakText(replyText);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end" id="khata-chatbot-container">
      
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            speakText(getVoiceReminderText());
          }}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-950 to-blue-900 text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl border-2 border-amber-400/80 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all"
          id="btn-open-chatbot"
          title="खाजा खाता नेपाली भ्वाइस सहायक"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight">खाजा भ्वाइस सहायक</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-bold uppercase">
                नेपाली 🇳🇵
              </span>
            </div>
            <div className="text-[11px] text-amber-300 font-mono font-bold">
              बाँकी: {formatNepaliRupees(creditDue)}
            </div>
          </div>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[92vw] sm:w-96 max-h-[82vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          id="khata-chatbot-modal"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-blue-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5">
                  <span>खाजा खाता भ्वाइस सहायक</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-blue-200">
                  {userRole === 'admin' ? 'ब्लु फक्स एडमिन' : 'दार्जिलिङ ममो प्यानल'} • नेपाली आवाज (Nepali Voice)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Mute / Unmute */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setVoiceMuted(!voiceMuted);
                }}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  voiceMuted ? 'text-slate-400 hover:text-white' : 'text-amber-300 hover:bg-blue-800'
                }`}
                title={voiceMuted ? 'आवाज खोल्नुहोस् (Unmute)' : 'आवाज बन्द गर्नुहोस् (Mute)'}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close Window */}
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
                title="च्याट बन्द गर्नुहोस्"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Voice Due Reminder Bar (In Nepali) */}
          <div className="bg-amber-50 border-b border-amber-200 p-2.5 px-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isSpeaking ? 'bg-emerald-600 text-white animate-bounce' : 'bg-amber-200 text-amber-900'
              }`}>
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-900 block leading-tight">
                  नेपाली भ्वाइस रिमाइन्डर (Voice)
                </span>
                <span className="text-xs font-black text-red-600 font-mono">
                  बाँकी: {formatNepaliRupees(creditDue)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakText(getVoiceReminderText());
                }
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition-all shadow-2xs active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'आवाज रोक्नुहोस्' : 'आवाजमा सुन्नुहोस्'}</span>
            </button>
          </div>

          {/* Message Stream */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 text-xs max-h-72">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[88%] whitespace-pre-line leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-950 text-white rounded-br-xs'
                      : msg.highlightDue
                      ? 'bg-white text-slate-800 border-2 border-red-200 rounded-bl-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-blue-900 font-bold hover:underline flex items-center gap-1"
                        title="यो जवाफ नेपालीमा सुन्नुहोस्"
                      >
                        <Volume2 className="w-3 h-3 text-blue-800" />
                        <span>नेपालीमा सुन्नुहोस्</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips in Nepali */}
          <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage('बाँकी उधारो कति छ?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-950 font-semibold text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-200"
            >
              <span>💰 बाँकी उधारो</span>
            </button>

            <button
              onClick={() => handleSendMessage('नेपाली आवाजमा रिमाइन्डर सुन्नुहोस्')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-950 font-semibold text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-200"
            >
              <span>🔊 आवाज रिमाइन्डर</span>
            </button>

            <button
              onClick={() => handleSendMessage('धेरै खपत भएका खाजाहरू कुन कुन हुन्?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-950 font-semibold text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-200"
            >
              <span>🥟 धेरै खाएका खाजा</span>
            </button>

            <button
              onClick={() => handleSendMessage('पसल र ग्राहकको विवरण देखाउनुहोस्')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-950 font-semibold text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-200"
            >
              <span>🏪 पसलको विवरण</span>
            </button>

            <button
              onClick={() => handleSendMessage('उधारो रकम कसरी चुक्ता गर्ने?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-950 font-semibold text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-200"
            >
              <span>💵 चुक्ता गर्ने तरिका</span>
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="उधारो, खाजा वा भुक्तानीबारे नेपालीमा सोध्नुहोस्..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-950 bg-slate-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-2 rounded-xl bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
