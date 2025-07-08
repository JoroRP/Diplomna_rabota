import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {useAlert} from "../provider/AlertProvider";
import {useAuth} from "../provider/AuthProvider";
import {Link} from 'react-router-dom';

const AddressTab = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const {showAlert} = useAlert();

    useEffect(() => {
        setLoading(true);
        const fetchAddresses = async () => {
            try {
                const response = await axios.get('/api/addresses');
                setAddresses(response.data.addresses || []);
            } catch (error) {

                if (error.response?.status !== 404) {
                    let errorMessage = 'Failed to load addresses';

                    if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.response?.status === 500) {
                        errorMessage = 'Server error. Please try again later.';
                    } else if (error.request) {
                        errorMessage = 'Network error. Please check your connection.';
                    }

                    showAlert(errorMessage, "error");
                }

                setAddresses([]);
            } finally {
                setLoading(false);
            }
        };

        const delayFetch = setTimeout(fetchAddresses, 50);
        return () => clearTimeout(delayFetch);
    }, [showAlert]);

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        setDeletingId(id);
        try {
            await axios.delete(`/api/address/${id}`);

            setAddresses(addresses.filter(address => address.id !== id));
            showAlert('Address deleted successfully', "success");
        } catch (error) {

            let errorMessage = 'Failed to delete address';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMessage = 'Address not found';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            }

            showAlert(errorMessage, "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">My Addresses</h2>

            {loading ? (
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-4">
                        {addresses.length > 0 ? (
                            addresses.map(address => (
                                <div key={address.id} className="col">
                                    <div className="card h-100">
                                        <div className="card-body">
                                            <p className="mb-1">{address.line}</p>
                                            {address.line2 && <p className="mb-1">{address.line2}</p>}
                                            <p className="mb-0 text-muted">
                                                {address.city}, {address.country} - {address.postcode}
                                            </p>
                                        </div>
                                        <div className="card-footer d-flex gap-2">
                                            <Link
                                                to={`/profile/addresses/edit/${address.id}`}
                                                className="btn btn-outline-primary btn-sm flex-fill"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                className="btn btn-outline-danger btn-sm flex-fill"
                                                onClick={() => handleDeleteAddress(address.id)}
                                                disabled={deletingId === address.id}
                                            >
                                                {deletingId === address.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    'Delete'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="text-center py-5">
                                    <div className="mb-3">
                                        <i className="bi bi-house text-muted" style={{fontSize: '3rem'}}></i>
                                    </div>
                                    <h5 className="text-muted">No addresses found</h5>
                                    <p className="text-muted">You don't have any addresses saved yet.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 text-center">
                        <Link to="/profile/addresses/new" className="btn btn-primary">
                            <i className="bi bi-plus-circle me-2"></i>
                            Add New Address
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default AddressTab;