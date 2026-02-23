import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, User, Bot, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'options' | 'voice_or_text' | 'ratings';
  placeholder?: string;
  multiple?: boolean;
  followUp?: (answer: string) => string;
  validation?: (val: string) => boolean;
  options?: { value: string | number; label: string; emoji: string }[];
  items?: { key: string; label: string }[];
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

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [studentData, setStudentData] = useState<Record<string, unknown>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage(questions[0].text);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      }, 1500);
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
        addBotMessage("🎉 Awesome! Thanks for sharing all that with me. I now know exactly how to help you learn better! Let's start your personalized learning journey!", 1000);
      }
    }, 2000);
  };

  const handleTextSubmit = () => {
    if (currentInput.trim()) {
      handleAnswer(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleVoiceToggle = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (!isListening) {
        setIsListening(true);
        recognition.start();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCurrentInput(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
      }
    }
  };

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
        <div className="p-4 space-y-4">
          {question.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleAnswer({ [item.key]: rating })}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white font-bold transition-all duration-300 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          placeholder={question.placeholder || "Type your answer..."}
          className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
        />
        {question.type === 'voice_or_text' && (
          <button
            onClick={handleVoiceToggle}
            className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg animate-pulse'
                : 'bg-orange-400 hover:bg-orange-500 text-white shadow-md'
            }`}
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
        <div className="ml-auto text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
          {Math.min(currentQuestion + 1, questions.length)}/{questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-4 pb-3 pt-2 relative z-10">
        <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 h-3 rounded-full transition-all duration-500 relative"
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
        @keyframes onb-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes onb-float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes onb-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes onb-bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes onb-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes onb-fall {
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
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
