
import { ArrowDown, BookOpen, Brain, ChevronRight, LightbulbIcon, LineChart } from "lucide-react";

const LandingHero = () => {
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in text-balance">
            Test Your Knowledge,<br />
            <span className="gradient-text">Track Your Growth</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in-slow text-balance">
            An intelligent quiz platform that adapts to your learning style and provides AI-driven insights to help you master any subject.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-slow" style={{ animationDelay: '0.3s' }}>
            <button className="btn-primary flex items-center px-8 py-3">
              Get Started <ChevronRight className="ml-1 h-4 w-4" />
            </button>
            <button className="btn-outline flex items-center px-8 py-3">
              Explore Quizzes
            </button>
          </div>
          
          <a 
            href="#features" 
            className="inline-flex items-center justify-center animate-bounce-light"
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
