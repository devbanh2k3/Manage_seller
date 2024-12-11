import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductManager from './ProductManager'; // Đường dẫn tới file Home.jsx
import CustomerManager from './CustomerManager'; // Đường dẫn tới file Home.jsx
import Viewprocess from './viewprocess';
// Các component cho từng trang
const Home = () => <h1>Trang Chủ</h1>;
const About = () => <h1>Giới Thiệu</h1>;


const App = () => {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Trang Chủ</Link></li>
          <li><Link to="/CustomerManager">Thành viên</Link></li>
          <li><Link to="/products">Quản Lý Sản Phẩm</Link></li>
          <li><Link to="/Viewprocess">Xử lí dữ liệu</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/CustomerManager" element={<CustomerManager />} />
        <Route path="/products" element={<ProductManager />} />
        <Route path="/Viewprocess" element={<Viewprocess />} />
      </Routes>
    </Router>
  );
};

export default App;
