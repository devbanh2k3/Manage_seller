import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';

const url = 'http://localhost:8000';

const CustomerManager = () => {
    const { register, handleSubmit, reset } = useForm();
    const [customers, setCustomers] = useState([]);
    const [customers_list_link, setcustomers_list_link] = useState([]);
    const [editCustomer, setEditCustomer] = useState(null);
    const [showAddLinkPopup, setShowAddLinkPopup] = useState(false);
    const [showAddListLink, setShowAddListLink] = useState(false);



    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [newLink, setNewLink] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null); // Giữ sản phẩm đã chọn


    const fetchCustomers = async (idseller) => {
        try {
            const response = await axios.get(url + '/customer');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchCustomers_list_link = async (idseller) => {
        try {
            const response = await axios.get(url + '/links/' + idseller);
            setcustomers_list_link(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const onAddCustomer = async (data) => {
        try {
            await axios.post(url + '/add-customer', {
                store: data.store,
                user: data.user,
                password: data.password,
                domain: data.domain,
                ga: data.ga || null,
                linkga: data.linkga || null,
                tier: parseFloat(data.tier),
            });
            fetchCustomers();
            alert('Khách hàng đã được thêm');
            reset();
        } catch (error) {
            console.error('Error adding customer:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(url + '/delete-product', { data: { id } });
            fetchCustomers();
            alert('Khách hàng đã được xóa');
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const handleShowAddLinkPopup = (customer) => {
        setNewLink("");
        setSearchQuery("");
        setSearchResults([]);
        setCurrentCustomer(customer);
        setShowAddLinkPopup(true);
    };
    const handleShowListLink = (customer) => {
        setcustomers_list_link([]);
        fetchCustomers_list_link(customer.id)
        setCurrentCustomer(customer);
        setShowAddListLink(true);
    };
    const handleSaveLink = async () => {
        if (!selectedProduct) {
            alert('Vui lòng chọn một sản phẩm trước khi lưu!');
            return;
        }


        try {
            await axios.post(url + '/add-link', {
                idseller: currentCustomer.id,
                idtier: selectedProduct.tier,
                idproduct: selectedProduct.id,
                link: newLink,
                cost: selectedProduct.cost,
                store: currentCustomer.store,
                product: selectedProduct.name
            });

            alert('Link lưu thành công!');

        } catch (error) {
            alert('Có lỗi trong quá trình lưu!');
            console.error(error.response?.data?.message || error.message);
        }
    };
    const handleSearchProducts = async () => {
        console.log()
        try {
            const response = await axios.get(`${url}/api/products_search`, {
                params: {
                    name: searchQuery,
                    tier: currentCustomer.tier
                },
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    };


    const handleCheckboxChange = (product) => {
        setSelectedProduct(product);
    };


    return (
        <div>
            <h1>Quản lý khách hàng</h1>

            {/* Thêm Khách hàng */}
            <h3>Thêm khách hàng mới</h3>
            <form onSubmit={handleSubmit(onAddCustomer)}>
                <input {...register('store')} placeholder="Store" required />
                <input {...register('user')} placeholder="User" required />
                <input {...register('password')} placeholder="Password" required />
                <input {...register('domain')} placeholder="Domain" />
                <input {...register('ga')} placeholder="GA" />
                <input {...register('linkga')} placeholder="LinkGA" />
                <input {...register('tier')} placeholder="Tier" required />
                <button type="submit">Thêm Khách Hàng</button>
            </form>

            {/* Danh sách khách hàng */}
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
                            <td>{customer.tier}</td>
                            <td>
                                <button onClick={() => setEditCustomer(customer)}>Sửa</button>
                                <button onClick={() => handleDelete(customer.id)}>Xóa</button>
                                <button onClick={() => handleShowAddLinkPopup(customer)}>Add Link</button>
                                <button onClick={() => handleShowListLink(customer)}>Danh sách link</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Popup thêm link */}
            {showAddLinkPopup && currentCustomer && (

                <div style={popupStyle}>
                    <div style={popupContentStyle}>
                        <h3>Thêm Link cho khách hàng</h3>
                        <p><strong>ID:</strong> {currentCustomer.id}</p>
                        <p><strong>Store:</strong> {currentCustomer.store}</p>
                        <p><strong>User:</strong> {currentCustomer.user}</p>
                        <p><strong>Domain:</strong> {currentCustomer.domain}</p>
                        <p><strong>GA:</strong> {currentCustomer.ga}</p>
                        <p><strong>LinkGA:</strong> {currentCustomer.linkga}</p>
                        <p><strong>Tier:</strong> {currentCustomer.tier}</p>
                        <input
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            placeholder="Nhập link tại đây..."
                        />



                        <h3>Tìm kiếm sản phẩm</h3>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập tên sản phẩm..."
                        />
                        <button onClick={handleSearchProducts}>Hiển thị danh sách sản phẩm</button>

                        <h4>Kết quả:</h4>
                        <ul>
                            {searchResults.map((product) => (
                                <li key={`${product.id}-${product.tier}`}>
                                    <label>
                                        <input
                                            type="radio"
                                            checked={selectedProduct?.id === product.id && selectedProduct?.tier === product.tier}
                                            onChange={() => handleCheckboxChange(product)}
                                        />
                                        <strong>{product.name}</strong> - {product.cost} - Tier: {product.tier}
                                    </label>
                                </li>
                            ))}
                        </ul>

                        <div>
                            <button onClick={handleSaveLink}>Lưu Link</button>
                            <button onClick={() => setShowAddLinkPopup(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Popup Show list link */}
            {showAddListLink && currentCustomer && (
                <div style={popupStyle}>
                    <div style={popupContentStyle}>
                        <h3>Danh sách link sản phẩm của {currentCustomer.store}</h3>
                        <table border="1">
                            <thead>
                                <tr>
                                    <th>Store</th>
                                    <th>Link</th>
                                    <th>Name Product</th>
                                    <th>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers_list_link.map((customer) => (
                                    <tr key={customer.idproduct}>
                                        <td>{customer.store}</td>
                                        <td>{customer.link}</td>
                                        <td>{customer.product}</td>
                                        <td>{customer.cost}</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div>
                            <button onClick={handleSaveLink}>Lưu Link</button>
                            <button onClick={() => setShowAddListLink(false)}>Đóng</button>
                        </div>
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
