import { ArrowDown, BookOpen, Brain, ChevronRight, LightbulbIcon, LineChart } from "lucide-react";
import { useState, useEffect } from "react";

const LandingHero = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl animate-spin-slow" />
        <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-mint/20 blur-3xl animate-spin-slow" style={{ animationDelay: '2s', animationDirection: 'reverse' }} />
        
        {/* Floating elements */}
        <div className="hidden md:block absolute top-20 left-[20%] text-primary/30 animate-float" style={{ animationDelay: '0s' }}>
          <BookOpen size={48} />
        </div>
        <div className="hidden md:block absolute top-40 right-[25%] text-mint/30 animate-float" style={{ animationDelay: '1.5s' }}>
          <Brain size={36} />
        </div>
        <div className="hidden md:block absolute bottom-32 left-[15%] text-secondary/30 animate-float" style={{ animationDelay: '1s' }}>
          <LightbulbIcon size={42} />
        </div>
        <div className="hidden md:block absolute bottom-40 right-[30%] text-primary/30 animate-float" style={{ animationDelay: '2.5s' }}>
          <LineChart size={36} />
        </div>
      </div>
      
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="overflow-hidden">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              <span 
                className={`block transform transition-all duration-1000 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-12 opacity-0'
                }`}
              >
                Test Your Knowledge,
              </span>
              <span 
                className={`block gradient-text text-white transform transition-all duration-1000 delay-300 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-12 opacity-0'
                }`}
              >
                Track Your Growth
              </span>
            </h1>
          </div>
          
          <p 
            className={`text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-balance transform transition-all duration-1000 delay-500 ${
              isVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-8 opacity-0'
            }`}
          >
            An intelligent quiz platform that adapts to your learning style and provides AI-driven insights to help you master any subject.
          </p>
          
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transform transition-all duration-1000 delay-700 ${
              isVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-8 opacity-0'
            }`}
          >
            <button 
              className="btn-primary flex items-center px-8 py-3 transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              Get Started <ChevronRight className="ml-1 h-4 w-4" />
            </button>
            <button 
              className="btn-outline flex items-center px-8 py-3 transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              Explore Quizzes
            </button>
          </div>
          
          <a 
            href="#features" 
            className={`inline-flex items-center justify-center animate-bounce-light transition-opacity duration-1000 delay-1000 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Scroll to features"
          >
            <ArrowDown className="h-6 w-6 text-primary" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
