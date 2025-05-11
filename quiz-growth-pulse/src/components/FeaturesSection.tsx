
import { Sparkles, BarChart3, BookOpen, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  link: string;
}

const FeatureCard = ({ icon, title, description, delay, link }: FeatureCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(link);
  };
  
  return (
    <div 
      onClick={handleClick}
      className="feature-card animate-fade-in rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 transform border border-gray-100 dark:border-gray-700" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="icon-container bg-primary/10 p-3 w-fit rounded-lg mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      title: "Take Quizzes",
      description: "Access hundreds of professionally designed quizzes across various subjects and difficulty levels.",
      delay: 100,
      link: "/quizzes"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and visualizations of your performance.",
      delay: 300,
      link: "/progress"
    },
    {
      icon: <BrainCircuit className="h-6 w-6 text-primary" />,
      title: "AI Insights",
      description: "Receive personalized recommendations and insights based on your learning patterns.",
      delay: 500,
      link: "/insights"
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "Earn Badges",
      description: "Unlock achievements and badges as you improve your knowledge and master new subjects.",
      delay: 700,
      link: "/badges"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/30">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Supercharge Your Learning Journey
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Our platform combines engaging quizzes with powerful analytics to accelerate your knowledge acquisition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
              link={feature.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
