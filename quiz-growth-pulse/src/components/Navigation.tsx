
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Book, LineChart, User, Menu, X } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-full bg-primary text-white shadow-md"
        onClick={toggleMenu}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 transform bg-white dark:bg-gray-900 w-64 overflow-y-auto transition-transform duration-300 ease-in-out z-30 shadow-lg",
        "lg:translate-x-0 lg:static lg:w-64 lg:min-h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <div className="bg-primary rounded-lg p-2">
              <LineChart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-poppins">GrowthPulse</span>
          </Link>
        </div>
        
        <nav className="px-4 py-4">
          <ul className="space-y-2">
            {[
              { name: "Home", path: "/", icon: Home },
              { name: "Quizzes", path: "/quiz", icon: Book },
              { name: "Dashboard", path: "/dashboard", icon: LineChart },
              { name: "Profile", path: "/profile", icon: User }
            ].map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 text-primary" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-card-gradient glass-card p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2">Need help?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Get support with your quizzes and learning journey</p>
            <button className="mt-3 w-full btn-outline text-sm py-1.5">Contact Support</button>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default Navigation;
