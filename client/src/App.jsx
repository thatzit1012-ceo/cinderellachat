import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/theme.css';
import LandingPage from './pages/LandingPage';
import QuestionPage from './pages/QuestionPage';
import NicknamePage from './pages/NicknamePage';
import ChatRoomPage from './pages/ChatRoomPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/questions" element={<QuestionPage />} />
        <Route path="/nickname" element={<NicknamePage />} />
        <Route path="/chat" element={<ChatRoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}
