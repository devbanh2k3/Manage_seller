import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';

import './CustomerManager.css';

const API_URL = 'http://localhost:8000';

const CustomerManager = () => {
    const { register, handleSubmit, reset } = useForm();
    const [customers, setCustomers] = useState([]);
    const [customerLinks, setCustomerLinks] = useState([]);
    const [showLinksPopup, setShowLinksPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [noResultsMessage, setNoResultsMessage] = useState('');
    const [showStatisticsPopup, setShowStatisticsPopup] = useState(false);
    const [statistics, setStatisticsData] = useState(null);



    const onShowStatistics = async (customer) => {
        try {
            const response = await axios.get(`${API_URL}/links/statistics/${customer.id}`);
            setStatisticsData(response.data);

            setShowStatisticsPopup(true);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            alert('Không thể tải thống kê. Vui lòng thử lại.');
        }
    };
    const searchProducts = async (query, store, tier) => {
        try {
            setSearchResults([])
            const response = await axios.get(`${API_URL}/products/search`, {
                params: { name: query, tier: tier }
            });

            if (response.data.message === 'No products found') {
                setSearchResults([]); // Nếu không tìm thấy, xóa kết quả hiện tại
                setNoResultsMessage('Không tìm thấy sản phẩm phù hợp'); // Hiển thị thông báo không tìm thấy
            } else {
                setSearchResults(response.data); // Cập nhật kết quả tìm kiếm
                setNoResultsMessage(''); // Xóa thông báo nếu có kết quả
            }
        } catch (error) {
            console.error('Error searching products:', error);
        }
    };

    const onSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearch(product.name); // Show selected product in the input field
        setSearchResults([]);
    };


    const onAddLink = async (data) => {
        if (!selectedProduct) {
            alert('Vui lòng chọn sản phẩm từ danh sách!');
            return;
        }
        console.log(selectedProduct)
        try {
            const payload = {

                idseller: currentCustomer.id,
                idproduct: selectedProduct.id,
                idtier: selectedProduct.tier,
                product: selectedProduct.name,
                cost: 10,
                link: data.link,
                store: currentCustomer.store

            };
            await axios.post(`${API_URL}/links/add`, payload);
            alert('Link added successfully!');
            fetchCustomerLinks(currentCustomer.id); // Refresh links
            reset();
            setSearchResults([]);
            setSelectedProduct(null);
        } catch (error) {
            console.error('Error adding link:', error);
            alert('Không thể thêm link. Vui lòng thử lại.');
        }
    };

    // Fetch all customers
    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_URL}/customer`);
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Add or Update a Customer
    const onSaveCustomer = async (data) => {
        try {
            if (currentCustomer) {
                await axios.put(`${API_URL}/customer/update`, { ...data, id: currentCustomer.id });
                alert('Khách hàng đã được cập nhật!');
            } else {
                await axios.post(`${API_URL}/customer/add`, data);
                alert('Khách hàng đã được thêm thành công!');
            }
            fetchCustomers();
            reset();
            setShowEditPopup(false);
            setCurrentCustomer(null);
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Không thể lưu khách hàng. Vui lòng thử lại.');
        }
    };

    // Delete a Customer
    const onDeleteCustomer = async (id) => {
        try {
            if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này không?')) {
                await axios.delete(`${API_URL}/customer/delete`, { data: { id } });
                alert('Khách hàng đã được xóa thành công!');
                fetchCustomers();
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Không thể xóa khách hàng. Vui lòng thử lại.');
        }
    };

    // Edit a Customer
    const onEditCustomer = (customer) => {
        setCurrentCustomer(customer);
        reset(customer); // Populate the form with current customer data
        setShowEditPopup(true);
    };

    // Fetch customer links
    const fetchCustomerLinks = async (customerId) => {
        try {
            const response = await axios.get(`${API_URL}/links/api/${customerId}`);
            setCustomerLinks(response.data.links || []);
        } catch (error) {
            console.error('Error fetching customer links:', error);
        }
    };


    // Hàm xóa link
    const onDeleteLink = async (link, store, id) => {
        console.log(id)
        try {
            const response = await axios.delete(`${API_URL}/links/delete`, {
                data: { link, store }
            });
            alert(response.data.message); // Hiển thị thông báo sau khi xóa thành công
            // Cập nhật lại danh sách link sau khi xóa
            fetchCustomerLinks(id);
        } catch (error) {
            console.error('Error deleting link:', error);
            alert('Không thể xóa link. Vui lòng thử lại.');
        }
    };

    const PriceDisplay = ({ totalAmount }) => {
        const formatVND = (amount) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        };

        return (
            <td>{formatVND(totalAmount)}</td>
        );
    };



    // Show Links Popup
    const onShowLinksPopup = (customer) => {
        setCurrentCustomer(customer);
        fetchCustomerLinks(customer.id);
        setShowLinksPopup(true);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    return (
        <div className="container">
            <h1>Quản lý khách hàng</h1>
            <button onClick={() => setShowEditPopup(true)}>Thêm Khách Hàng Mới</button>
            {/* Customers Table */}
            <h3>Danh sách khách hàng</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>Store</th>
                        <th>User</th>
                        <th>Password</th>
                        <th>Domain</th>
                        <th>GA</th>
                        <th>LinkGA</th>
                        <th>Tier</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.id}>
                            <td>{customer.store}</td>
                            <td>{customer.user}</td>
                            <td>{customer.password}</td>
                            <td>{customer.domain}</td>
                            <td>{customer.ga}</td>
                            <td>{customer.linkga}</td>
                            <td>
                                {customer.tier === 1
                                    ? 'Silver'
                                    : customer.tier === 2
                                        ? 'Gold'
                                        : customer.tier === 3
                                            ? 'Platinum'
                                            : 'N/A'}
                            </td>
                            <td>
                                <button onClick={() => onEditCustomer(customer)}>Sửa</button>
                                <button onClick={() => onDeleteCustomer(customer.id)}>Xóa</button>
                                <button onClick={() => onShowLinksPopup(customer)}>Xem Links</button>
                                <button onClick={() => onShowStatistics(customer)}>Thống kê</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Customer Popup */}
            {showEditPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Cập nhật khách hàng</h3>
                        <form onSubmit={handleSubmit(onSaveCustomer)}>
                            <input {...register('store')} placeholder="Store" required />
                            <input {...register('user')} placeholder="User" required />
                            <input {...register('password')} placeholder="Password" required />
                            <input {...register('domain')} placeholder="Domain" required />
                            <input {...register('ga')} placeholder="GA" />
                            <input {...register('linkga')} placeholder="Link GA" />

                            {/* Thay input tier thành select */}
                            <label htmlFor="tier">Tier</label>
                            <select {...register('tier')} required>
                                <option value="1">Silver</option>
                                <option value="2">Gold</option>
                                <option value="3">Platinum</option>
                            </select>

                            <button type="submit">Cập nhật</button>
                            <button type="button" onClick={() => setShowEditPopup(false)}>Hủy</button>
                        </form>
                    </div>
                </div>
            )}





            {/* Links Popup */}
            {showStatisticsPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Thống kê của {statistics[0]?.store || 'Khách hàng'}</h3>
                        {statistics.length > 0 ? (
                            <div>
                                <table border="1">
                                    <thead>
                                        <tr>
                                            <th>Ngày giao dịch</th>
                                            <th>Tên sản phẩm</th>
                                            <th>Rev on store (USD)</th>
                                            <th>%Cost</th>
                                            <th>Profit (USD)</th>
                                            <th>Tỷ giá (VND)</th>
                                            <th>Thành tiền (VND)</th>
                                            <th>Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statistics.map((item, index) => (
                                            <tr key={index}>
                                                <td>{new Date(item.transaction_date).toLocaleDateString()}</td>
                                                <td>{item.product_name}</td>
                                                <td>{item.profit_on_store}</td>
                                                <td>{item.cost}%</td>
                                                <td>{item.profit}</td>
                                                <td> {item.exchange_rate}</td>
                                                <PriceDisplay totalAmount={item.total_amount} />
                                                <td>
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                        Xem sản phẩm
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Không có dữ liệu thống kê.</p>
                        )}
                        <button onClick={() => setShowStatisticsPopup(false)}>Đóng</button>
                    </div>
                </div>
            )}



            {/* Links Popup */}
            {showLinksPopup && (
                <div style={popupStyle} className="popup">
                    <div className="popup-content" style={popupContentStyle}>
                        <h3>Danh sách Links của {currentCustomer.store}</h3>
                        <table border="1">
                            <thead>
                                <tr>
                                    <th>Link</th>
                                    <th>Name</th>
                                    <th>Tier</th>
                                    <th>Cost</th>
                                    <th>Actions</th> {/* Thêm cột Actions để chứa nút xóa */}
                                </tr>
                            </thead>
                            <tbody>
                                {customerLinks.length > 0 ? (
                                    customerLinks.map((link, index) => (
                                        <tr key={index}>
                                            <td>{link.link}</td>
                                            <td>{link.productDetails?.name || 'N/A'}</td>
                                            <td>
                                                {link.productDetails?.tier === 1
                                                    ? 'Silver'
                                                    : link.productDetails?.tier === 2
                                                        ? 'Gold'
                                                        : link.productDetails?.tier === 3
                                                            ? 'Platinum'
                                                            : 'N/A'}
                                            </td>
                                            <td>{link.productDetails?.cost || 'N/A'}</td>
                                            <td>
                                                {/* Nút xóa */}
                                                <button onClick={() => onDeleteLink(link.link, link.store, currentCustomer.id)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">No links available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Add Link Form */}
                        <h4>Thêm Link Mới</h4>
                        <form onSubmit={handleSubmit(onAddLink)}>
                            {/* Link Input */}
                            <input {...register('link')} placeholder="Link" required />

                            {/* Product Search Input */}
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Search product by name"
                                required
                            />

                            {/* Thêm nút tìm kiếm */}
                            <button
                                type="button"
                                onClick={() => searchProducts(productSearch, currentCustomer.store, currentCustomer.tier)}
                            >
                                Tìm kiếm
                            </button>
                            {/* Dropdown for Search Results */}
                            {noResultsMessage && <p>{noResultsMessage}</p>}

                            {/* Kết quả tìm kiếm */}
                            {searchResults.length > 0 ? (
                                <ul style={{ listStyleType: 'none', padding: 0 }}>
                                    {searchResults.map((product) => (
                                        <li
                                            key={product.id}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '5px',
                                                backgroundColor: selectedProduct?.id === product.id ? '#f0f0f0' : 'white',
                                            }}
                                            onClick={() => onSelectProduct(product)}
                                        >
                                            {product.name} (Tier: {product.tier})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>{noResultsMessage}</p> // Hiển thị thông báo nếu không có kết quả
                            )}

                            {/* Selected Product Information */}
                            {selectedProduct && (
                                <div>
                                    <p>Selected Product: {selectedProduct.name}</p>
                                    <input
                                        type="hidden"
                                        {...register('idproduct')}
                                        value={selectedProduct.id}
                                    />
                                    <input
                                        type="hidden"
                                        {...register('idtier')}
                                        value={selectedProduct.tier}
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button type="submit">Thêm</button>
                        </form>

                        <button onClick={() => setShowLinksPopup(false)}>Đóng</button>
                    </div>
                </div>
            )}

        </div>
    );
};

const popupStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const popupContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};

export default CustomerManager;
