import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Homepage.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { addToBasket } from '../services/basketService';
import { canAddToBasket } from "../services/productService";
import { debounce } from "../components/debounce";
import PlaceholderImage from "../assets/imgs/placeholder.jpg";
import { useAlert } from "../provider/AlertProvider";
import { useAuth } from "../provider/AuthProvider";

const Homepage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({ category: '', minPrice: '', maxPrice: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("name_asc");

    const { showAlert } = useAlert();
    const { token } = useAuth();

    useEffect(() => {
        const delayFetchCategories = setTimeout(() => {
            fetchCategories();
        }, 50);

        const delayFetchProducts = setTimeout(() => {
            fetchProducts();
        }, 100);

        return () => {
            clearTimeout(delayFetchCategories);
            clearTimeout(delayFetchProducts);
        };
    }, [currentPage, searchTerm, sortOption]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const [sortField, sortOrder] = sortOption.split('_');
            const queryParams = new URLSearchParams({
                status: 'active',
                page: currentPage.toString(),
                itemsPerPage: itemsPerPage.toString(),
                search: searchTerm,
                sort: sortField,
                order: sortOrder
            });
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
            if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);

            const response = await axios.get(`http://localhost/api/products/list?${queryParams.toString()}`);
            setProducts(Array.isArray(response.data.products) ? response.data.products : []);
            setTotalItems(response.data.totalItems || 0);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost/api/categories/list?filter=true');
            setCategories(response.data.categories);
        } catch (error) {
            showAlert("Error fetching categories. Please try again.", "error");

        }
    };

    const debouncedSearch = useCallback(
        debounce((term) => {
            setSearchTerm(term);
            setCurrentPage(1);
        }, 300),
        []
    );

    const handleSearch = (e) => {
        debouncedSearch(e.target.value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const applyFilters = () => {
        setCurrentPage(1);
        fetchProducts();
    };

    const handleAddToBasket = async (productId, productName, quantity) => {
        if (!token) {
            showAlert("You must be logged in to add products to the basket.", "error");
            return;
        }

        try {
            const stockResult = await canAddToBasket(productId, quantity);
            if (stockResult !== null) {
                showAlert(`Insufficient stock quantity. Only ${stockResult} ${productName} available.`, "error");
                return;
            }
            await addToBasket(productId, productName, quantity, showAlert);
        } catch (error) {
            showAlert("An error occurred while adding the product to the basket. Please try again.", "error");
        }
    };

    const getImageUrl = (imageName) => {
        return imageName ? `http://localhost/api/file/${imageName}` : PlaceholderImage;
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className={`${styles.container} mt-5`}>
            <h1 className={`${styles.textCenter} mb-5`}>Our Selection of Products</h1>
            <div className="row">
                <div className="col-md-2">
                    <div className={`${styles.card} shadow-sm p-3 mb-4 ${styles.filterCard}`}>
                        <h5>Filters</h5>
                        <div className="mb-3">
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="form-control"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Min Price</label>
                            <input
                                type="number"
                                name="minPrice"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className={`form-control ${styles.smallPlaceholder}`}
                                placeholder="Enter min price"
                                min="0"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Max Price</label>
                            <input
                                type="number"
                                name="maxPrice"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className={`form-control ${styles.smallPlaceholder}`}
                                placeholder="Enter max price"
                                min="0"
                            />
                        </div>

                        <button className={`btn btn-primary w-100 ${styles.gradientButton}`} onClick={applyFilters}>
                            Apply Filters
                        </button>
                    </div>
                </div>

                <div className="col-md-10">
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <input
                            type="text"
                            placeholder="Search products..."
                            onChange={handleSearch}
                            className="form-control me-2"
                            style={{ width: '550px' }}
                        />

                        <div className="d-flex align-items-center">
                            <label className="me-2">Sort By:</label>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="form-select"
                                style={{ width: '200px' }}
                            >
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="name_desc">Name (Z-A)</option>
                                <option value="price_asc">Price (Low to High)</option>
                                <option value="price_desc">Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className={`${styles.message} ${styles.loadingMessage}`}>Loading...</div>
                    ) : error ? (
                        <div className={`${styles.message} ${styles.errorMessage}`}>Error: {error}</div>
                    ) : products.length === 0 ? (
                        <div className={`${styles.message} ${styles.noProductsMessage}`}>
                            No products matched your search criteria.
                        </div>
                    ) : (

                        <div className={styles.productGrid}>
                            {products.map((product) => (
                                <div key={product.id} className={`${styles.card} mb-4 shadow-sm`}>
                                    <div className={styles.imageContainer}>
                                        <Link to={`/product/${product.id}`}>
                                            <img
                                                src={getImageUrl(product.image)}
                                                alt={product.name}
                                                className={styles.productImage}
                                            />
                                        </Link>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <Link to={`/product/${product.id}`} className={styles.homepageTitleLink}>
                                            <h5 className={styles.cardTitle} id={product.name}>{product.name}</h5>
                                        </Link>
                                        <p className={styles.cardPrice}>Price: ${Number(product.price).toFixed(2)}</p>

                                        <div className="d-flex justify-content-end align-items-center">
                                            {product.stockQuantity > 0 ? (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => handleAddToBasket(product.id, product.name, 1)}
                                                >
                                                    <i className="bi bi-cart"></i>
                                                </button>
                                            ) : (
                                                <button className="btn btn-danger" disabled>
                                                    Out of Stock
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    <nav className="mt-4">
                        <ul className="pagination justify-content-center">
                            {[...Array(totalPages)].map((_, index) => (
                                <li
                                    key={index}
                                    className={`page-item ${index + 1 === currentPage ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    <span className="page-link">{index + 1}</span>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
