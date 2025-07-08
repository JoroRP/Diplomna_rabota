import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAlert} from '../provider/AlertProvider';
import axios from 'axios';

const EditAddress = () => {
    const {id} = useParams();
    const [editAddressData, setEditAddressData] = useState({
        line: '',
        line2: '',
        city: '',
        postcode: '',
        country: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {showAlert} = useAlert();
    const navigate = useNavigate();

    const requiredFields = ['line', 'city', 'postcode', 'country'];

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const response = await axios.get(`/api/address/${id}`);
                setEditAddressData(response.data.address);
            } catch (err) {
                console.error('Error fetching address:', err);
                showAlert('Error fetching address data', 'error');
            }
        };
        fetchAddress();
    }, [id, showAlert]);

    const handleEditInputChange = (e) => {
        const {name, value} = e.target;

        setEditAddressData({...editAddressData, [name]: value});

        if (errors[name] && value.trim()) {
            setErrors({...errors, [name]: ''});
        }
    };

    const validateForm = () => {
        const newErrors = {};

        requiredFields.forEach(field => {
            if (!editAddressData[field] || !editAddressData[field].trim()) {
                newErrors[field] = `${getFieldLabel(field)} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getFieldLabel = (fieldName) => {
        const labels = {
            line: 'Address Line',
            city: 'City',
            postcode: 'Postcode',
            country: 'Country'
        };
        return labels[fieldName] || fieldName;
    };

    const getFieldClassName = (fieldName) => {
        let className = 'form-control';
        if (errors[fieldName]) {
            className += ' is-invalid';
        }
        return className;
    };

    const handleEditAddress = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        const {id: addressId, ...addressData} = editAddressData;

        try {
            await axios.put(`/api/address/${id}`, addressData);
            showAlert('Address updated successfully', 'success');
            navigate('/profile/addresses');
        } catch (err) {
            console.error('Error updating address:', err);

            let errorMessage = 'Failed to update address. Please try again.';

            if (err.response) {
                if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.status === 422) {
                    errorMessage = 'Please check your input and try again.';
                } else if (err.response.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            } else if (err.request) {
                errorMessage = 'Network error. Please check your connection.';
            }

            showAlert(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Edit Address</h2>
            <form onSubmit={handleEditAddress}>
                <div className="mb-3">
                    <label htmlFor="line" className="form-label">
                        Address Line <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="line"
                        name="line"
                        className={getFieldClassName('line')}
                        value={editAddressData.line || ''}
                        onChange={handleEditInputChange}
                        placeholder="Enter your address line"
                    />
                    {errors.line && (
                        <div className="invalid-feedback">
                            {errors.line}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="line2" className="form-label">Address Line 2</label>
                    <input
                        type="text"
                        id="line2"
                        name="line2"
                        className="form-control"
                        value={editAddressData.line2 || ''}
                        onChange={handleEditInputChange}
                        placeholder="Apartment, suite, etc. (optional)"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="city" className="form-label">
                        City <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        className={getFieldClassName('city')}
                        value={editAddressData.city || ''}
                        onChange={handleEditInputChange}
                        placeholder="Enter your city"
                    />
                    {errors.city && (
                        <div className="invalid-feedback">
                            {errors.city}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="postcode" className="form-label">
                        Postcode <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="postcode"
                        name="postcode"
                        className={getFieldClassName('postcode')}
                        value={editAddressData.postcode || ''}
                        onChange={handleEditInputChange}
                        placeholder="Enter your postcode"
                    />
                    {errors.postcode && (
                        <div className="invalid-feedback">
                            {errors.postcode}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="country" className="form-label">
                        Country <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        className={getFieldClassName('country')}
                        value={editAddressData.country || ''}
                        onChange={handleEditInputChange}
                        placeholder="Enter your country"
                    />
                    {errors.country && (
                        <div className="invalid-feedback">
                            {errors.country}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <small className="text-muted">
                        <span className="text-danger">*</span> Required fields
                    </small>
                </div>

                <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Updating...
                        </>
                    ) : (
                        'Update Address'
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/profile/addresses')}
                    className="btn btn-secondary ms-2"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default EditAddress;