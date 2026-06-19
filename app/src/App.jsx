import { Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalStyle from './resources/styles/GlobalStyle';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Ideas from './pages/Ideas';
import Jokes from './pages/Jokes';
import JokeEdit from './pages/JokeEdit';
import Sets from './pages/Sets';
import SetDetail from './pages/SetDetail';
import SetReadThrough from './pages/SetReadThrough';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

const Main = styled.main`
  flex: 1;
  min-width: 0;

  @media (min-width: 768px) {
    margin-left: ${({ $hasSidebar }) => $hasSidebar ? '12.5rem' : '0'};
  }
`;

function Layout({ children }) {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
  const isPublicPage = pathname.startsWith('/u/');
  const hideNav = isAuthPage || isPublicPage || pathname.endsWith('/read');

  return (
    <>
      {!isAuthPage && !isPublicPage && <Sidebar />}
      <Main $hasSidebar={!isAuthPage && !isPublicPage}>
        {children}
      </Main>
      {!hideNav && <BottomNav />}
    </>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '3.75rem 1.5rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
      Page not found.
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalStyle />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        closeButton={false}
        newestOnTop
      />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/ideas" element={<ProtectedRoute><Ideas /></ProtectedRoute>} />
          <Route path="/jokes" element={<ProtectedRoute><Jokes /></ProtectedRoute>} />
          <Route path="/jokes/new" element={<ProtectedRoute><JokeEdit /></ProtectedRoute>} />
          <Route path="/jokes/:id" element={<ProtectedRoute><JokeEdit /></ProtectedRoute>} />
          <Route path="/sets" element={<ProtectedRoute><Sets /></ProtectedRoute>} />
          <Route path="/sets/:id" element={<ProtectedRoute><SetDetail /></ProtectedRoute>} />
          <Route path="/sets/:id/read" element={<ProtectedRoute><SetReadThrough /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/u/:profileId" element={<PublicProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}
