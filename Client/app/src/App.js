// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductManager from './ProductManager';
import CustomerManager from './CustomerManager';
import Viewprocess from './viewprocess';
import './App.css'; // File CSS để tùy chỉnh giao diện

// Các component nhỏ cho từng trang
const Home = () => <h1>Dashboard - Trang Chủ</h1>;
const About = () => <h1>Dashboard - Giới Thiệu</h1>;

const App = () => {
  return (
    <Router>
      <div className="dashboard">
        {/* Sidebar */}
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <nav>
            <ul>
              <li><Link to="/">Trang Chủ</Link></li>
              <li><Link to="/CustomerManager">Quản Lý Thành Viên</Link></li>
              <li><Link to="/products">Quản Lý Sản Phẩm</Link></li>
              <li><Link to="/Viewprocess">Xử Lí Dữ Liệu</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/CustomerManager" element={<CustomerManager />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/Viewprocess" element={<Viewprocess />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
