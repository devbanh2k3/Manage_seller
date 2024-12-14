import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import './productManager.css'; // Đổi tên file CSS

const API_URL = 'http://145.223.96.152/products';

const ProductManager = () => {
    const { register, handleSubmit, reset } = useForm();
    const [products, setProducts] = useState([]);
    const [editData, setEditData] = useState(null);

    const transformData = (data) => {
        const groupedProducts = data.reduce((acc, curr) => {
            const { id, name, cost, tier } = curr;
            const existingProduct = acc.find((product) => product.id === id);

            if (existingProduct) {
                existingProduct.costs[tier - 1] = cost;
            } else {
                acc.push({
                    id,
                    name,
                    costs: [null, null, null],
                });
                acc[acc.length - 1].costs[tier - 1] = cost;
            }
            return acc;
        }, []);

        return groupedProducts;
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(API_URL);
            setProducts(transformData(response.data));
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onAddProduct = async (data) => {
        try {
            const { name, silver, gold, platinum } = data;
            const prices = [silver, gold, platinum].map(parseFloat);

            const newProductId = uuidv4();
            await axios.post(API_URL + '/add', {
                id: newProductId,
                name,
                prices,
                tiers: [1, 2, 3],
            });
            reset();
            fetchProducts();
            alert('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const startEdit = (product) => {
        setEditData({ ...product });
    };

    const onUpdateProduct = async () => {
        try {
            const { id, name, costs } = editData;
            const tiers = [1, 2, 3];

            const updates = costs.map((cost, index) => (
                axios.put(API_URL + '/update', { id, name, cost, tier: tiers[index] })
            ));

            await Promise.all(updates);
            fetchProducts();
            setEditData(null);
            alert('Product updated successfully!');
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const onDeleteProduct = async (id) => {
        try {
            await axios.delete(API_URL + '/delete', { data: { id } });
            fetchProducts();
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    return (
        <div className="product-manager-container">
            <h1>Product Management</h1>
            <form onSubmit={handleSubmit(onAddProduct)} className="product-form">
                <input {...register('name')} placeholder="Product Name" required />
                <input {...register('silver')} placeholder="Silver Price" type="number" step="0.01" required />
                <input {...register('gold')} placeholder="Gold Price" type="number" step="0.01" required />
                <input {...register('platinum')} placeholder="Platinum Price" type="number" step="0.01" required />
                <button type="submit">Add Product</button>
            </form>

            <table className="product-table">
                <thead>
                    <tr>
                        <th>STT</th> {/* Thêm cột STT */}
                        <th>ID</th>
                        <th>Name</th>
                        <th>Silver</th>
                        <th>Gold</th>
                        <th>Platinum</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={product.id}>
                            {/* Tính toán số thứ tự */}
                            <td>{index + 1}</td>
                            <td>{product.id}</td>
                            <td>
                                {editData?.id === product.id ? (
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
                            {product.costs.map((cost, index) => (
                                <td key={index}>
                                    {editData?.id === product.id ? (
                                        <input
                                            value={editData.costs[index]}
                                            type="number"
                                            onChange={(e) => {
                                                const newCosts = [...editData.costs];
                                                newCosts[index] = parseFloat(e.target.value);
                                                setEditData({ ...editData, costs: newCosts });
                                            }}
                                        />
                                    ) : (
                                        cost
                                    )}
                                </td>
                            ))}
                            <td>
                                {editData?.id === product.id ? (
                                    <>
                                        <button onClick={onUpdateProduct}>Save</button>
                                        <button onClick={() => setEditData(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEdit(product)}>Edit</button>
                                        <button onClick={() => onDeleteProduct(product.id)}>Delete</button>
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
