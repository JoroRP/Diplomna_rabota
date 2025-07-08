import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/SecurityCentre.module.css';
import {useAlert} from "../provider/AlertProvider";

const SecurityCentre = () => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const {showAlert} = useAlert();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = {};
        const { oldPassword, newPassword, confirmPassword } = formData;

        if (!oldPassword) formErrors.oldPassword = "Old password is required";
        if (!newPassword) formErrors.newPassword = "New password is required";
        if (!confirmPassword) formErrors.confirmPassword = "Confirm password is required";
        if (newPassword && confirmPassword && newPassword !== confirmPassword) formErrors.confirmPassword = "Passwords do not match";

        setErrors(formErrors);

        if (Object.keys(formErrors).length === 0) {
            try {
                const response = await axios.put('/api/change-password', formData);
                setSuccessMessage(response.data.message);
                setErrors({});
                showAlert("Password changed successfully", "success");
            } catch (error) {
                if (error.response) {
                    setErrors({ general: error.response.data.message || "An error occurred" });
                    setSuccessMessage('');
                    showAlert("An error occurred while changing password", "danger");
                }
            }
        }
    };

    return (
        <div className={styles.securityCenterContainer}>
            {errors.general && <div className={styles.errorMessage}>{errors.general}</div>}
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

            <form onSubmit={handleSubmit}>
                <div className={styles.securityCenterFormGroup}>
                    <label>Old Password</label>
                    <input
                        type="password"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        className={errors.oldPassword ? 'is-invalid form-control' : 'form-control'}
                    />
                    {errors.oldPassword && <div className="invalid-feedback">{errors.oldPassword}</div>}
                </div>
                <div className={styles.securityCenterFormGroup}>
                    <label>New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={errors.newPassword ? 'is-invalid form-control' : 'form-control'}
                    />
                    {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
                </div>
                <div className={styles.securityCenterFormGroup}>
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? 'is-invalid form-control' : 'form-control'}
                    />
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>
                <button type="submit" className={`btn btn-primary ${styles.submitButton}`}>Submit</button>
            </form>
        </div>
    );
};

export default SecurityCentre;
