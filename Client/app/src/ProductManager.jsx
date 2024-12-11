import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from "uuid";
import './style/product.css';

const url = 'http://localhost:8000';

const ProductManager = () => {
    const { register, handleSubmit, reset } = useForm();
    const [products, setProducts] = useState([]);
    const [editData, setEditData] = useState({});

    const transformData = (data) => {
        const groupedProducts = data.reduce((acc, curr) => {
            const { id, name, cost, tier } = curr;
            const existingProduct = acc.find((product) => product.id === id && product.name === name);

            if (existingProduct) {
                existingProduct.costs[tier - 1] = cost;
            } else {
                acc.push({
                    id,
                    name,
                    costs: Array(3).fill(null),
                });
                acc[acc.length - 1].costs[tier - 1] = cost;
            }
            return acc;
        }, []);
        return groupedProducts;
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(url + '/api/products');
            setProducts(transformData(response.data));
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onAddProduct = async (data) => {
        try {
            const { silver, gold, platinum } = data;
            const prices = [parseFloat(silver), parseFloat(gold), parseFloat(platinum)];

            const newString = uuidv4();
            await axios.post(url + '/add-product', {
                id: newString,
                name: data.name,
                prices,
                tiers: [1, 2, 3]
            });
            reset();
            fetchProducts();
            alert('Thêm sản phẩm thành công');
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm:', error);
        }
    };

    const startEdit = (product) => {
        setEditData({
            id: product.id,
            name: product.name,
            costs: [...product.costs],
        });
    };

    const onUpdateProduct = async () => {
        try {
            const { id, name, costs } = editData;

            const tiers = [1, 2, 3];

            const promises = costs.map((cost, index) => {
                return axios.put(url + '/update-product', {
                    id,
                    name,
                    cost,
                    tier: tiers[index],
                });
            });

            await Promise.all(promises);
            fetchProducts();
            setEditData({});
            alert('Sản phẩm được cập nhật thành công');
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
        }
    };

    const cancelEdit = () => {
        setEditData({});
    };

    const onDeleteProduct = async (id) => {
        try {
            await axios.delete(url + '/delete-product', { data: { id } });
            fetchProducts();
            alert('Sản phẩm đã bị xóa');
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
        }
    };

    return (
        <div className="container">
            <h1>Quản Lý Sản Phẩm</h1>
            <form onSubmit={handleSubmit(onAddProduct)}>
                <input {...register('name')} placeholder="Tên sản phẩm" required />
                <input {...register('silver')} placeholder="Giá Silver" type="number" step="0.01" required />
                <input {...register('gold')} placeholder="Giá Gold" type="number" step="0.01" required />
                <input {...register('platinum')} placeholder="Giá Platinum" type="number" step="0.01" required />
                <button type="submit">Thêm Sản Phẩm</button>
            </form>

            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Silver</th>
                        <th>Gold</th>
                        <th>Platinum</th>
                        <th>Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>
                                {editData.id === product.id ? (
                                    <input
                                        value={editData.name}
                                        onChange={(e) =>
                                            setEditData({ ...editData, name: e.target.value })
                                        }
                                    />
                                ) : (
                                    product.name
                                )}
                            </td>
                            <td>
                                {editData.id === product.id ? (
                                    <input
                                        value={editData.costs[0]}
                                        type="number"
                                        onChange={(e) => {
                                            const newCosts = [...editData.costs];
                                            newCosts[0] = parseFloat(e.target.value);
                                            setEditData({ ...editData, costs: newCosts });
                                        }}
                                    />
                                ) : (
                                    product.costs[0]
                                )}
                            </td>
                            <td>
                                {editData.id === product.id ? (
                                    <input
                                        value={editData.costs[1]}
                                        type="number"
                                        onChange={(e) => {
                                            const newCosts = [...editData.costs];
                                            newCosts[1] = parseFloat(e.target.value);
                                            setEditData({ ...editData, costs: newCosts });
                                        }}
                                    />
                                ) : (
                                    product.costs[1]
                                )}
                            </td>
                            <td>
                                {editData.id === product.id ? (
                                    <input
                                        value={editData.costs[2]}
                                        type="number"
                                        onChange={(e) => {
                                            const newCosts = [...editData.costs];
                                            newCosts[2] = parseFloat(e.target.value);
                                            setEditData({ ...editData, costs: newCosts });
                                        }}
                                    />
                                ) : (
                                    product.costs[2]
                                )}
                            </td>
                            <td>
                                {editData.id === product.id ? (
                                    <>
                                        <button onClick={onUpdateProduct}>Lưu</button>
                                        <button onClick={cancelEdit}>Hủy</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEdit(product)}>Chỉnh Sửa</button>
                                        <button onClick={() => onDeleteProduct(product.id)}>Xóa</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductManager;
