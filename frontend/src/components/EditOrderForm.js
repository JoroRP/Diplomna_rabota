import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/EditOrderForm.module.css';
import {useAlert} from "../provider/AlertProvider";

const EditOrderForm = ({
                           onFinishEditing = () => {
                           }
                       }) => {
    const {id: orderId} = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productError, setProductError] = useState(null);
    const [products, setProducts] = useState({});
    const [address, setAddress] = useState({});
    const [status, setStatus] = useState('');

    const navigate = useNavigate();
    const [availableProducts, setAvailableProducts] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const {showAlert} = useAlert();

    useEffect(() => {
        const fetchAvailableProducts = async () => {
            try {
                const response = await axios.get('http://localhost/api/products/available/list');
                setAvailableProducts(response.data);
            } catch (error) {
                showAlert('Error fetching available products:', 'error');
            }
        };

        fetchAvailableProducts();
    }, []);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await axios.get(`http://localhost/api/order/${orderId}`);
                setOrder(response.data);

                if (response.data.orderProducts && Array.isArray(response.data.orderProducts)) {
                    const initialProducts = response.data.orderProducts.reduce((acc, product) => {
                        acc[product.id] = product.quantity;
                        return acc;
                    }, {});
                    setProducts(initialProducts);
                } else {
                    setProducts({});
                }

                setAddress(response.data.address || {});
                setStatus(response.data.status || '');
                setLoading(false);
            } catch (error) {
                showAlert("Error loading order", "error");
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const handleAddProduct = () => {
        setShowProductForm(true);
    };

    const handleDeleteProduct = (productId) => {
        setProducts((prevProducts) => ({
            ...prevProducts,
            [productId]: 0,
        }));
    };

    const handleProductChange = (e) => {
        setSelectedProductId(e.target.value);
    };

    const handleQuantityChange = (e) => {
        setSelectedQuantity(parseInt(e.target.value));
    };

    const handleConfirmProductAddition = () => {
        const selectedProduct = availableProducts.find(
            (product) => product.id === parseInt(selectedProductId)
        );

        if (!selectedProduct) {
            showAlert('Please select a valid product.', 'error');
            return;
        }

        if (selectedQuantity <= 0 || selectedQuantity > selectedProduct.stockQuantity) {
            showAlert(`Please enter a quantity between 1 and ${selectedProduct.stockQuantity}.`);
            return;
        }

        setProducts((prevProducts) => ({
            ...prevProducts,
            [selectedProduct.id]: (prevProducts[selectedProduct.id] || 0) + selectedQuantity,
        }));

        setShowProductForm(false);
        setSelectedProductId('');
        setSelectedQuantity(1);
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setAddress((prevAddress) => ({
            ...prevAddress,
            [name]: value,
        }));
    };

    const handleProductQuantityChange = (productId, value) => {
        setProducts((prevProducts) => ({
            ...prevProducts,
            [productId]: value,
        }));
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(products).length === 0 || Object.values(products).every(qty => qty === 0)) {
            setProductError('The order must contain at least one product.');
            return;
        }

        const updatedOrderData = {
            products: products,
            address: address,
            status: status,
        };

        try {
            const response = await axios.put(`http://localhost/api/order/${orderId}`, updatedOrderData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status !== 200) {
                showAlert('Failed to update order.', "error");
                return
            }

            setProductError(null);
            onFinishEditing();
            navigate('/admin/orders');

        } catch (error) {
            showAlert('Error updating order:', "error");
            setError('There was an error updating the order.');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.errorMessage}>Error: {error}</div>;

    return (
        <div className={styles.editOrderForm}>
            <h1>Edit Order {orderId}</h1>
            <form onSubmit={handleSubmit}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Address</h3>
                    <div className={styles.addressGrid}>
                        <div>
                            <label>Line 1:</label>
                            <input
                                type="text"
                                name="line"
                                value={address.line || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label>Line 2:</label>
                            <input
                                type="text"
                                name="line2"
                                value={address.line2 || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label>City:</label>
                            <input
                                type="text"
                                name="city"
                                value={address.city || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label>Country:</label>
                            <input
                                type="text"
                                name="country"
                                value={address.country || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label>Postcode:</label>
                            <input
                                type="text"
                                name="postcode"
                                value={address.postcode || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.productSection}>
                    <h3 className={styles.sectionTitle}>Products</h3>
                    {Object.keys(products).length > 0 ? (
                        Object.entries(products).map(([productId, quantity]) => {
                            const product = availableProducts.find(p => p.id === parseInt(productId));
                            return quantity > 0 ? (
                                <div key={productId} className={styles.productItem}>
                                    <label>
                                        {`Product ID: ${productId} | Name: ${product?.name || 'Unknown'}`}
                                        {product?.price && (
                                            <span style={{color: '#007bff', fontWeight: 'bold', marginLeft: '10px'}}>
                ${parseFloat(product.price).toFixed(2)}
            </span>
                                        )}
                                    </label>
                                    <span className={styles.quantityLabel}>Quantity:</span>
                                    <input
                                        type="number"
                                        max={product?.stockQuantity}
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => handleProductQuantityChange(productId, parseInt(e.target.value))}
                                    />
                                    <button type="button" onClick={() => handleDeleteProduct(productId)}>
                                        Delete
                                    </button>
                                </div>
                            ) : null;
                        })
                    ) : (
                        <div>No products available for this order.</div>
                    )}

                    <div className={styles.productControls}>
                        <button type="button" onClick={handleAddProduct}>
                            Add Product
                        </button>
                        <div className={styles.totalPrice}>
                            Total: ${(() => {
                            return Object.entries(products).reduce((total, [productId, quantity]) => {
                                if (quantity > 0) {
                                    const product = availableProducts.find(p => p.id === parseInt(productId));
                                    if (product && product.price) {
                                        return total + (parseFloat(product.price) * quantity);
                                    }
                                }
                                return total;
                            }, 0).toFixed(2);
                        })()}
                        </div>
                    </div>

                    {showProductForm && (
                        <div className={styles.productForm}>
                            <h4>Select Product</h4>
                            <select value={selectedProductId} onChange={handleProductChange}>
                                <option value="">Select a product</option>
                                {availableProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} | {product.price} (Stock: {product.stockQuantity})
                                    </option>
                                ))}
                            </select>

                            <h4>Quantity</h4>
                            <input
                                type="number"
                                min="1"
                                max={
                                    selectedProductId
                                        ? availableProducts.find(
                                        (product) => product.id === parseInt(selectedProductId)
                                    )?.stockQuantity || 1
                                        : 1
                                }
                                value={selectedQuantity}
                                onChange={handleQuantityChange}
                            />

                            <div className={styles.productFormButtons}>
                                <button type="button" onClick={handleConfirmProductAddition}>
                                    Add
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={() => setShowProductForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {productError && <div className={styles.errorMessage}>{productError}</div>}
                </div>

                <div className={styles.statusSection}>
                    <h3 className={styles.sectionTitle}>Status</h3>
                    <select value={status} onChange={handleStatusChange}>
                        <option value="">Select status</option>
                        <option value="new">New</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <div className={styles.buttonContainer}>
                        <button type="submit">Save Changes</button>
                        <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
                            Back
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditOrderForm;
