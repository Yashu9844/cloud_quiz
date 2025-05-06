import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "../components/ResultPage";

// Define the shape of the state passed through navigation
interface ResultsLocationState {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  categoryId?: string;
  categoryName?: string;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract quiz results from location state or use defaults
  const state = location.state as ResultsLocationState | null;
  
  // If no state was passed, redirect to quiz selection
  if (!state) {
    navigate("/quiz", { replace: true });
    return null;
  }
  
  const { score, totalQuestions, timeTaken, categoryId, categoryName } = state;
  
  // Handle retry - go back to quiz with same category if available
  const handleRetry = () => {
    if (categoryId) {
      navigate("/quiz", { state: { selectedCategory: categoryId } });
    } else {
      navigate("/quiz");
    }
  };
  
  // Handle review - go back to quiz selection
  const handleReview = () => {
    navigate("/quiz");
  };
  
  return (
    <ResultPage
      score={score}
      totalQuestions={totalQuestions}
      timeTaken={timeTaken}
      onRetry={handleRetry}
      onReview={handleReview}
    />
  );
};

export default Results;

