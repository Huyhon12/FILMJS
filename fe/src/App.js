// File: src/App.js

import './App.css';
import Home from './components/Home';
import MoviePlayer from './components/MoviePlayer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ChangePassword from './components/ChangePassword';
import WatchLater from './components/WatchLater';
import PaymentPage from './components/PaymentPage';
import SeasonPage from './components/SeasonPage';
import GenrePage from './components/GenrePage';
import SearchPage from './components/SearchPage';
import { CustomerProvider } from './context/CustomerContext';
import WatchHistory from './components/WatchHistory';
import AdminLayout from "./components/admin/AdminLayout";
import MovieAdmin from './components/admin/MovieAdmin';
import RevenueAdmin from './components/admin/RevenueAdmin';

// 🔥 IMPORT COMPONENT BẢO VỆ
import VipRoute from './components/VipRoute';


function App() {
  return (
    <Router>
      <CustomerProvider>
        <MovieProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/changepassword" element={<ChangePassword />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/season/:season" element={<SeasonPage />} />
            <Route path="/genre/:genre" element={<GenrePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="movies" element={<MovieAdmin />} />
              <Route path="revenue" element={<RevenueAdmin />} />
              {/* cac tinh nang khac cua admin viet day (viet xong nho xoa dong nay)*/}
            </Route>

            <Route element={<VipRoute />}>
              <Route path="/movies/:movieId" element={<MoviePlayer />} />
              <Route path="/watchlater" element={<WatchLater />} />
              <Route path="/watchhistory" element={<WatchHistory />} />
            </Route>
          </Routes>
        </MovieProvider>
      </CustomerProvider>
    </Router>
  );
}

export default App;