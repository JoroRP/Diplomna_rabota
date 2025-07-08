import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAlert} from '../provider/AlertProvider';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddAddress = () => {
    const [addressData, setAddressData] = useState({
        line: '',
        line2: '',
        city: '',
        postcode: '',
        country: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const {showAlert} = useAlert();

    const requiredFields = ['line', 'city', 'postcode', 'country'];

    const handleChange = (e) => {
        const {name, value} = e.target;

        setAddressData({...addressData, [name]: value});

        if (errors[name] && value.trim()) {
            setErrors({...errors, [name]: ''});
        }
    };

    const validateForm = () => {
        const newErrors = {};

        requiredFields.forEach(field => {
            if (!addressData[field] || !addressData[field].trim()) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post('/api/addresses', addressData);
            showAlert('Address successfully added!', 'success');
            navigate('/profile/addresses');
        } catch (err) {

            let errorMessage = 'Error adding address. Please try again.';

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

    const getFieldClassName = (fieldName) => {
        let className = 'form-control';
        if (errors[fieldName]) {
            className += ' is-invalid';
        }
        return className;
    };

    return (
        <div className="container mt-5">
            <h2>Add Address</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="line" className="form-label">
                        Address Line <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        id="line"
                        name="line"
                        className={getFieldClassName('line')}
                        value={addressData.line}
                        onChange={handleChange}
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
                        value={addressData.line2 || ''}
                        onChange={handleChange}
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
                        value={addressData.city}
                        onChange={handleChange}
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
                        value={addressData.postcode}
                        onChange={handleChange}
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
                        value={addressData.country}
                        onChange={handleChange}
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
                    className="btn btn-primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Adding Address...
                        </>
                    ) : (
                        'Add Address'
                    )}
                </button>

                <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => navigate('/profile/addresses')}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default AddAddress;