
import { Sparkles, BarChart3, BookOpen, BrainCircuit } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
  <div 
    className="feature-card animate-fade-in" 
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="icon-container bg-primary/10">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </div>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      title: "Take Quizzes",
      description: "Access hundreds of professionally designed quizzes across various subjects and difficulty levels.",
      delay: 100
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and visualizations of your performance.",
      delay: 300
    },
    {
      icon: <BrainCircuit className="h-6 w-6 text-primary" />,
      title: "AI Insights",
      description: "Receive personalized recommendations and insights based on your learning patterns.",
      delay: 500
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "Earn Badges",
      description: "Unlock achievements and badges as you improve your knowledge and master new subjects.",
      delay: 700
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
