import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, User, Bot, Sparkles, BookOpen, Brain, Zap, Target, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface QuestionOption {
  value: string | number;
  label: string;
  emoji: string;
}

interface RatingItem {
  key: string;
  label: string;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'options' | 'voice_or_text' | 'ratings';
  placeholder?: string;
  multiple?: boolean;
  followUp?: (answer: string) => string;
  validation?: (val: string) => boolean;
  options?: QuestionOption[];
  items?: RatingItem[];
}

const questions: Question[] = [
  {
    id: 'name',
    text: "Hey there! 👋 I'm your learning buddy. What should I call you?",
    type: 'text',
    placeholder: "Your name...",
    followUp: (name) => `Nice to meet you, ${name}! 🎉`
  },
  {
    id: 'grade',
    text: "What grade are you in? This helps me understand your learning level better!",
    type: 'options',
    options: Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `Grade ${i + 1}`,
      emoji: i < 5 ? '🌱' : i < 8 ? '🌿' : '🌳'
    }))
  },
  {
    id: 'age',
    text: "How old are you? (Don't worry, this stays between us! 🤫)",
    type: 'text',
    placeholder: "Your age...",
    validation: (val) => Number(val) > 5 && Number(val) < 25
  },
  {
    id: 'subjects',
    text: "What subjects make you excited to learn? Pick your favorites! ✨",
    type: 'options',
    multiple: true,
    options: [
      { value: 'math', label: 'Math', emoji: '🔢' },
      { value: 'science', label: 'Science', emoji: '🔬' },
      { value: 'english', label: 'English', emoji: '📚' },
      { value: 'history', label: 'History', emoji: '🏛️' },
      { value: 'art', label: 'Art', emoji: '🎨' },
      { value: 'music', label: 'Music', emoji: '🎵' },
      { value: 'pe', label: 'Physical Education', emoji: '⚽' },
      { value: 'languages', label: 'Languages', emoji: '🗣️' }
    ]
  },
  {
    id: 'interests',
    text: "Tell me about your interests outside school! What do you love doing in your free time? 🎯",
    type: 'voice_or_text',
    placeholder: "Gaming, sports, reading, coding, drawing..."
  },
  {
    id: 'hobbies',
    text: "Any cool hobbies you want to share? I'd love to hear about them! 🎪",
    type: 'voice_or_text',
    placeholder: "Photography, cooking, skateboarding..."
  },
  {
    id: 'learning_style',
    text: "How do you learn best? Everyone's different! 🧠",
    type: 'options',
    multiple: true,
    options: [
      { value: 'visual', label: 'Visual (seeing pictures, diagrams)', emoji: '👁️' },
      { value: 'auditory', label: 'Auditory (listening to explanations)', emoji: '👂' },
      { value: 'kinesthetic', label: 'Hands-on (doing activities)', emoji: '✋' },
      { value: 'reading', label: 'Reading & Writing', emoji: '📖' }
    ]
  },
  {
    id: 'ratings',
    text: "Let's rate some learning methods! How much do you enjoy these? (1=😴 5=🤩)",
    type: 'ratings',
    items: [
      { key: 'video_lectures', label: 'Video Lectures' },
      { key: 'text_reading', label: 'Reading Text' },
      { key: 'interactive_quizzes', label: 'Interactive Quizzes' },
      { key: 'demonstrations', label: 'Live Demonstrations' }
    ]
  },
  {
    id: 'device',
    text: "What device do you usually use for studying? 📱💻",
    type: 'options',
    options: [
      { value: 'smartphone', label: 'Smartphone', emoji: '📱' },
      { value: 'tablet', label: 'Tablet', emoji: '📱' },
      { value: 'laptop', label: 'Laptop', emoji: '💻' },
      { value: 'desktop', label: 'Desktop', emoji: '🖥️' }
    ]
  },
  {
    id: 'study_hours',
    text: "How many hours do you study per week? Be honest! 📊",
    type: 'options',
    options: [
      { value: '0-5', label: '0-5 hours', emoji: '😅' },
      { value: '5-10', label: '5-10 hours', emoji: '👍' },
      { value: '10-15', label: '10-15 hours', emoji: '💪' },
      { value: '15-20', label: '15-20 hours', emoji: '🔥' },
      { value: '20+', label: '20+ hours', emoji: '🤯' }
    ]
  },
  {
    id: 'confident_topic',
    text: "What topic are you most confident about? Your superpower subject! 💪",
    type: 'voice_or_text',
    placeholder: "The subject you feel most confident in..."
  },
  {
    id: 'challenging_topic',
    text: "What topic challenges you the most? Don't worry, we all have them! 🤔",
    type: 'voice_or_text',
    placeholder: "The subject you find most challenging..."
  }
];

const episodeTourSteps = [
  {
    icon: BookOpen,
    title: "Concept Introduction",
    desc: "Each 6–8 min episode starts with a clear theory block explaining the core idea.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Brain,
    title: "Pattern Recognition",
    desc: "Spot patterns and connections through guided examples and visuals.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Zap,
    title: "Active Recall",
    desc: "Test yourself with quick recall tasks — no peeking at notes!",
    color: "from-orange-500 to-yellow-500"
  },
  {
    icon: Target,
    title: "Explain-Back",
    desc: "Explain what you learned in your own words. AI scores your understanding.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: CheckCircle,
    title: "Quick Validation",
    desc: "A short quiz to confirm mastery before moving on. Instant feedback!",
    color: "from-red-500 to-orange-500"
  }
];

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'tour' | 'chat'>('tour');
  const [tourStep, setTourStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [studentData, setStudentData] = useState<Record<string, unknown>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ratingValues, setRatingValues] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (phase === 'chat' && messages.length === 0) {
      setTimeout(() => addBotMessage(questions[0].text), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const markOnboardingComplete = async () => {
    if (!user) return;
    localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
  };

  const handleSkip = () => {
    markOnboardingComplete();
    navigate('/student');
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const addBotMessage = (text: string, delay = 0) => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text, timestamp: new Date() }]);
        setIsTyping(false);
      }, 1200);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
  };

  const handleAnswer = (answer: unknown) => {
    const question = questions[currentQuestion];
    setStudentData(prev => ({ ...prev, [question.id]: answer }));
    addUserMessage(typeof answer === 'object' ? JSON.stringify(answer) : String(answer));

    if (question.followUp) {
      addBotMessage(question.followUp(String(answer)), 500);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        addBotMessage(questions[currentQuestion + 1].text, 1000);
      } else {
        triggerConfetti();
        markOnboardingComplete();
        addBotMessage("🎉 Awesome! Thanks for sharing all that with me. I now know exactly how to help you learn better! Let's start your personalized learning journey!", 1000);
      }
    }, 2000);
  };

  const handleTextSubmit = () => {
    if (currentInput.trim()) {
      handleAnswer(currentInput.trim());
      setCurrentInput('');
      // Stop listening if active
      stopListening();
    }
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const handleVoiceToggle = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      toast.error("Your browser doesn't support voice recognition.");
      return;
    }

    if (isListening) {
      // Stop and submit what we have
      stopListening();
      if (currentInput.trim()) {
        handleTextSubmit();
      }
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (finalText) {
        setCurrentInput(finalText.trim());
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
        toast.error("Voice recognition error. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error("Could not start voice recognition.");
    }
  }, [isListening, currentInput, stopListening]);

  const handleRatingsSubmit = () => {
    const question = questions[currentQuestion];
    if (question.items && Object.keys(ratingValues).length === question.items.length) {
      handleAnswer(ratingValues);
      setRatingValues({});
    }
  };

  // ─── TOUR PHASE ───
  if (phase === 'tour') {
    const step = episodeTourSteps[tourStep];
    const Icon = step.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-onb-float" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-orange-300 rounded-full opacity-20 animate-onb-float-delayed" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-red-300 rounded-full opacity-20 animate-onb-float" />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-sm text-orange-600 hover:text-orange-800 font-medium z-20 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/80 transition-all"
        >
          Skip Tour →
        </button>

        <div className="relative z-10 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">How Your Episodes Work</h1>
            <p className="text-orange-600 font-medium">Each episode is 6–8 minutes of focused learning</p>
            <div className="flex justify-center gap-2 mt-4">
              {episodeTourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === tourStep ? 'w-8 bg-orange-500' : i < tourStep ? 'w-4 bg-orange-300' : 'w-4 bg-orange-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card */}
          <div
            key={tourStep}
            className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-onb-slide-up"
          >
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
              <Icon className="text-white" size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h2>
            <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            <div className="mt-4 text-sm text-gray-400">Block {tourStep + 1} of {episodeTourSteps.length}</div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setTourStep(Math.max(0, tourStep - 1))}
              disabled={tourStep === 0}
              className="px-6 py-3 rounded-full font-semibold text-orange-600 bg-white shadow-md disabled:opacity-30 hover:shadow-lg transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (tourStep < episodeTourSteps.length - 1) {
                  setTourStep(tourStep + 1);
                } else {
                  setPhase('chat');
                }
              }}
              className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95"
            >
              {tourStep < episodeTourSteps.length - 1 ? 'Next →' : "Let's Go! 🚀"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes onb-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
          @keyframes onb-float-delayed { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
          @keyframes onb-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .animate-onb-float { animation: onb-float 3s ease-in-out infinite; }
          .animate-onb-float-delayed { animation: onb-float-delayed 4s ease-in-out infinite 1s; }
          .animate-onb-slide-up { animation: onb-slide-up 0.5s ease-out; }
        `}</style>
      </div>
    );
  }

  // ─── CHAT PHASE ───
  const renderCurrentInput = () => {
    if (currentQuestion >= questions.length) return null;
    const question = questions[currentQuestion];

    if (question.type === 'options') {
      return (
        <div className="flex flex-wrap gap-2 p-4">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(question.multiple ? [option.value] : option.value)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-200 to-yellow-200 hover:from-orange-300 hover:to-yellow-300 rounded-full transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              style={{ animation: `onb-bounce-in 0.5s ease-out ${index * 0.1}s both` }}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="text-gray-800">{option.label}</span>
            </button>
          ))}
        </div>
      );
    }

    if (question.type === 'ratings') {
      return (
        <div className="p-4 space-y-3">
          {question.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setRatingValues(prev => ({ ...prev, [item.key]: rating }))}
                    className={`w-9 h-9 rounded-full font-bold text-sm transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${
                      ratingValues[item.key] === rating
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-110'
                        : 'bg-gradient-to-br from-orange-200 to-yellow-200 text-gray-700'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {question.items && Object.keys(ratingValues).length === question.items.length && (
            <button
              onClick={handleRatingsSubmit}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
            >
              Submit Ratings ✨
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        {/* Interim transcript preview */}
        {interimText && (
          <div className="text-xs text-orange-500 italic px-2 animate-pulse">
            🎤 {interimText}...
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder={isListening ? "Listening... speak now" : (question.placeholder || "Type your answer...")}
            className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
          />
          {question.type === 'voice_or_text' && (
            <button
              onClick={handleVoiceToggle}
              className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-orange-400 hover:bg-orange-500 text-white shadow-md'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          <button
            onClick={handleTextSubmit}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 font-semibold"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-onb-float" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-orange-300 rounded-full opacity-20 animate-onb-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-red-300 rounded-full opacity-20 animate-onb-float" />
        <div className="absolute top-1/2 right-10 w-12 h-12 bg-yellow-400 rounded-full opacity-20 animate-onb-float-delayed" />
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animation: `onb-fall ${2 + Math.random() * 2}s linear`,
                fontSize: '24px'
              }}
            >
              {['🎉', '⭐', '🎊', '✨', '🌟'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-xl p-4 flex items-center gap-3 relative z-10">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg animate-onb-wiggle">
          <Bot className="text-orange-500" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg flex items-center gap-2">
            Learning Buddy
            <Sparkles className="animate-onb-spin-slow" size={16} />
          </h1>
          <p className="text-sm text-orange-100">Getting to know you better...</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSkip}
            className="text-xs text-white/80 hover:text-white font-medium bg-white/20 px-3 py-1 rounded-full transition-all hover:bg-white/30"
          >
            Skip
          </button>
          <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
            {Math.min(currentQuestion + 1, questions.length)}/{questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-4 pb-3 pt-2 relative z-10">
        <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-onb-slide-up`}
          >
            <div className={`flex gap-2 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-400 animate-onb-wiggle'
              }`}>
                {message.type === 'user' ? <User className="text-white" size={18} /> : <Bot className="text-white" size={18} />}
              </div>
              <div className={`px-4 py-3 rounded-3xl shadow-lg transition-all hover:scale-105 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md border-2 border-orange-200'
              }`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-onb-slide-up">
            <div className="flex gap-2 max-w-xs lg:max-w-md">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg animate-onb-wiggle">
                <Bot className="text-white" size={18} />
              </div>
              <div className="px-4 py-3 rounded-3xl bg-white shadow-lg rounded-bl-md border-2 border-orange-200">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentQuestion < questions.length && !isTyping && (
        <div className="bg-white border-t-4 border-orange-300 shadow-2xl relative z-10">
          {renderCurrentInput()}
        </div>
      )}

      {currentQuestion >= questions.length && (
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 border-t-4 border-green-600 p-6 text-center shadow-2xl relative z-10 animate-onb-slide-up">
          <div className="text-white font-bold text-xl mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl animate-bounce">🎉</span>
            Onboarding Complete!
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
          </div>
          <p className="text-green-100 font-medium mb-4">Ready to start your personalized learning journey</p>
          <button
            onClick={() => navigate('/student')}
            className="px-6 py-3 bg-white text-green-600 font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Go to Dashboard →
          </button>
        </div>
      )}

      <style>{`
        @keyframes onb-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes onb-float-delayed { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes onb-wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
        @keyframes onb-bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes onb-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes onb-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes onb-fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }
        .animate-onb-float { animation: onb-float 3s ease-in-out infinite; }
        .animate-onb-float-delayed { animation: onb-float-delayed 4s ease-in-out infinite 1s; }
        .animate-onb-wiggle { animation: onb-wiggle 2s ease-in-out infinite; }
        .animate-onb-slide-up { animation: onb-slide-up 0.5s ease-out; }
        .animate-onb-spin-slow { animation: onb-spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default StudentOnboarding;
