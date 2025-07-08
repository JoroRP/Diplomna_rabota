import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {Link, useNavigate} from "react-router-dom";
import '../styles/Checkout.css';
import {hasAvailableQuantity} from "../services/productService";
import {useAlert} from "../provider/AlertProvider";
import {Spinner} from "react-bootstrap";

const Checkout = () => {
    const [basket, setBasket] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [basketLoading, setBasketLoading] = useState(true);
    const [addressLoading, setAddressLoading] = useState(true);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardExpiry: '',
        cardCVC: ''
    });
    const [totalPrice, setTotalPrice] = useState(0);
    const [preventCheckout, setPreventCheckout] = useState(false);
    const [basketErrors, setBasketErrors] = useState([]);
    const navigate = useNavigate();
    const {showAlert} = useAlert();

    useEffect(() => {

        const fetchBasketItems = async () => {
            try {
                setBasketLoading(true);
                const response = await axios.get('/api/basket');
                if (response.data.basket) {
                    setBasket(response.data.basket);
                }
            } catch (error) {
                showAlert("Error fetching basket items! Please try again!", "error");
            } finally {
                setBasketLoading(false);
            }
        };

        const delayFetch = setTimeout(fetchBasketItems, 100);
        return () => clearTimeout(delayFetch);
    }, []);

    useEffect(() => {
        const getTotalPrice = () => {
            let total = basket.reduce(
                (acc, item) => acc + item.product.price * item.quantity,
                0
            );

            setTotalPrice(parseFloat(total.toFixed(2)));
        };

        getTotalPrice();
    }, [basket]);

    useEffect(() => {
        const fetchAddresses = async () => {
            setAddressLoading(true);
            try {
                const response = await axios.get('/api/addresses');
                if (response.data.addresses && typeof response.data.addresses === 'object') {
                    setAddresses(Object.values(response.data.addresses));
                }
            } catch (error) {
                if (error && !error.statusCode == 404) {
                    showAlert("Could not fetch addresses! Please try again!", "error");
                }
                setAddresses([]);
            } finally {
                setAddressLoading(false);
            }
        };

        const delayFetch = setTimeout(fetchAddresses, 50);
        return () => clearTimeout(delayFetch);
    }, []);

    const handleCardChange = (e) => {
        const {name, value} = e.target;
        setCardDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    const handleCheckout = async () => {
        setPreventCheckout(true)
        setBasketErrors([]);
        let errors = [];

        for (const item of basket) {
            if (item.quantity === 0) {
                errors.push({
                    productId: item.product.id,
                    productName: item.product.name,
                    message: 'Quantity cannot be 0.'
                });
                continue;
            }

            const availableQuantity = await hasAvailableQuantity(item.product.id, item.quantity);
            if (availableQuantity !== null) {
                errors.push({
                    productId: item.product.id,
                    productName: item.product.name,
                    message: `Only ${availableQuantity} units available. You've requested ${item.quantity}.`
                });
            }
        }

        if (errors.length > 0) {
            setBasketErrors(errors);
            showAlert('Some products exceed available stock. Please adjust the quantities.', 'error');
            setPreventCheckout(true);
            return;
        }

        try {
            let checkoutData = {
                addressId: selectedAddress,
                cardDetails
            };

            if (!checkoutData.addressId) {
                showAlert('Please select an address.', 'error');
                setPreventCheckout(false);
                return;
            }

            const response = await axios.post('/api/orders', checkoutData);

            if (response.status === 200 || response.status === 201) {
                navigate('/order-confirmation');
            } else {
                throw new Error('Unexpected response status');
            }

        } catch (error) {
            console.error('Checkout error:', error);

            let errorMsg = 'An error occurred! Please try again!';

            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMsg = error.response.data.message;
                } else if (error.response.statusText) {
                    errorMsg = error.response.statusText;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            showAlert(errorMsg, "error");
            setPreventCheckout(false)
        }
    };

    if (basketLoading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary"/>
            </div>
        )
    }

    if (basket.length === 0) {
        return <div className="empty-basket">Your basket is empty. Add some products and come back!</div>;
    }

    return (
        <div className="checkout-page mt-4 mb-4">
            <h2 className="checkout-title">Checkout</h2>

            <div className="basket-items">
                <h3>Your Basket</h3>
                {basket.map(item => {
                    const error = basketErrors.find(err => err.productId === item.product.id);

                    return (
                        <div key={item.id} className="basket-item">
                            <p className="product-name">Product: {item.product.name}</p>
                            <p className="product-details">
                                Quantity: {item.quantity} | Price: ${item.product.price}
                            </p>
                            {error && error.message && (
                                <p className="stock-error" style={{color: 'red'}}>
                                    {error.message}
                                </p>
                            )}
                        </div>
                    );
                })}


                <h3 className="total-price">Total Price: ${totalPrice.toFixed(2)}</h3>
            </div>

            <div className="address-selection">
                <h3>Select Delivery Address</h3>
                {addressLoading ? (
                    <div className="loading">Loading addresses...</div>
                ) : (
                    <>
                        <select
                            value={selectedAddress}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="address-dropdown"
                        >
                            <option value="">Choose an address</option>
                            {addresses.map(address => (
                                <option key={address.id} value={address.id}>
                                    {address.line2
                                        ? `${address.line}, ${address.line2}, ${address.city}, ${address.country}, ${address.postcode}`
                                        : `${address.line}, ${address.city}, ${address.country}, ${address.postcode}`}
                                </option>
                            ))}
                        </select>
                        <Link className={'btn btn-success mt-2'} to={'/profile/addresses'}>Add address</Link>
                    </>
                )}
            </div>

            <div className="card-details">
                <h3>Debit Card Information</h3>
                <input
                    type="text"
                    name="cardNumber"
                    placeholder="Card Number"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    className="card-input"
                />
                <input
                    type="text"
                    name="cardExpiry"
                    placeholder="Expiry Date (MM/YY)"
                    value={cardDetails.cardExpiry}
                    onChange={handleCardChange}
                    className="card-input"
                />
                <input
                    type="text"
                    name="cardCVC"
                    placeholder="CVC"
                    value={cardDetails.cardCVC}
                    onChange={handleCardChange}
                    className="card-input"
                />
            </div>

            <button onClick={handleCheckout} disabled={preventCheckout} className="checkout-button">
                Complete Checkout
            </button>
        </div>
    );
};

export default Checkout;
