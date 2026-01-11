// src/features/ads/AdsPage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyContext } from '../../App';
import adApi from './api/ad.api';
import './AdsPage.css';

const STATUS_COLORS = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    approved: { bg: '#d1fae5', color: '#065f46' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    stopped: { bg: '#f3f4f6', color: '#6b7280' }
};

export default function AdsPage() {
    const { user } = useAuth();
    const { selectedCompany } = useContext(CompanyContext);

    const [ads, setAds] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [targetingOptions, setTargetingOptions] = useState({
        categories: [],
        positions: [],
        dimensions: {},
        states: []
    });

    // Filter state
    const [statusFilter, setStatusFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        position: 'AD 1',
        placement: 'chat',
        startDate: '',
        endDate: '',
        targetCategories: [],
        targetStates: [],
        contactEmail: '',
        contactPhone: ''
    });

    // Load targeting options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const options = await adApi.getTargetingOptions();
                setTargetingOptions(options);
            } catch (err) {
                console.error('Failed to load targeting options:', err);
            }
        };
        loadOptions();
    }, []);

    // Load ads and stats when company changes
    const loadData = useCallback(async () => {
        if (!selectedCompany) {
            setAds([]);
            setStats(null);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [adsResponse, statsData] = await Promise.all([
                adApi.listMyAds(selectedCompany, { status: statusFilter }),
                adApi.getMyStats(selectedCompany)
            ]);
            setAds(adsResponse.data || []);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load ads:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, statusFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Open create modal
    const openCreateModal = () => {
        setEditingAd(null);
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            linkUrl: '',
            position: 'AD 1',
            placement: 'chat',
            startDate: '',
            endDate: '',
            targetCategories: [],
            targetStates: [],
            contactEmail: user?.email || '',
            contactPhone: user?.phone || ''
        });
        setShowModal(true);
    };

    // Open edit modal
    const openEditModal = (ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title || '',
            description: ad.description || '',
            imageUrl: ad.imageUrl || '',
            linkUrl: ad.linkUrl || '',
            position: ad.position || 'AD 1',
            placement: ad.placement || 'chat',
            startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
            endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
            targetCategories: ad.targetCategories || [],
            targetStates: ad.targetStates || [],
            contactEmail: ad.contactEmail || '',
            contactPhone: ad.contactPhone || ''
        });
        setShowModal(true);
    };

    // Handle form change
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle category toggle
    const handleCategoryToggle = (category) => {
        setFormData(prev => {
            const current = prev.targetCategories;
            if (current.includes(category)) {
                return { ...prev, targetCategories: current.filter(c => c !== category) };
            }
            return { ...prev, targetCategories: [...current, category] };
        });
    };

    // Handle state toggle
    const handleStateToggle = (state) => {
        setFormData(prev => {
            const current = prev.targetStates;
            if (current.includes(state)) {
                return { ...prev, targetStates: current.filter(s => s !== state) };
            }
            return { ...prev, targetStates: [...current, state] };
        });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!formData.imageUrl.trim()) {
            alert('Image URL is required');
            return;
        }
        if (!selectedCompany) {
            alert('Please select a company first from the dropdown');
            return;
        }

        try {
            setSaving(true);
            const data = {
                ...formData,
                companyId: selectedCompany,
                ownerName: user?.name || '',
                startDate: formData.startDate || null,
                endDate: formData.endDate || null
            };

            if (editingAd) {
                await adApi.update(editingAd._id, data, selectedCompany);
            } else {
                await adApi.create(data, selectedCompany);
            }

            setShowModal(false);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save ad');
        } finally {
            setSaving(false);
        }
    };

    // Stop ad
    const handleStop = async (ad) => {
        if (!window.confirm(`Stop ad "${ad.title}"? It will no longer be displayed.`)) return;
        try {
            await adApi.stop(ad._id, selectedCompany);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to stop ad');
        }
    };

    // Reactivate ad
    const handleReactivate = async (ad) => {
        if (!window.confirm(`Resubmit ad "${ad.title}" for review?`)) return;
        try {
            await adApi.reactivate(ad._id, selectedCompany);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reactivate ad');
        }
    };

    // Delete ad
    const handleDelete = async (ad) => {
        if (!window.confirm(`Delete ad "${ad.title}"? This cannot be undone.`)) return;
        try {
            await adApi.remove(ad._id, selectedCompany);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete ad');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDimensions = (position) => {
        const dim = targetingOptions.dimensions?.[position];
        if (!dim) return null;
        return `${dim.width}x${dim.height}px`;
    };

    return (
        <div className="ads-page">
            <div className="ads-header">
                <div>
                    <h1>My Advertisements</h1>
                    <p className="ads-subtitle">Create and manage your ads displayed in the B2B Chat platform</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    + Create Ad
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="ads-stats">
                    <div className="stat-card">
                        <div className="stat-label">Total Ads</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-label">Pending Review</div>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                    <div className="stat-card approved">
                        <div className="stat-label">Approved</div>
                        <div className="stat-value">{stats.approved}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Views</div>
                        <div className="stat-value">{stats.totalImpressions?.toLocaleString() || 0}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Clicks</div>
                        <div className="stat-value">{stats.totalClicks?.toLocaleString() || 0}</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="ads-filter">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="stopped">Stopped</option>
                </select>
            </div>

            {/* Ads List */}
            <div className="ads-list">
                {loading ? (
                    <div className="loading">Loading ads...</div>
                ) : ads.length === 0 ? (
                    <div className="empty">
                        <p>No ads found. Create your first ad to get started!</p>
                    </div>
                ) : (
                    ads.map(ad => (
                        <div key={ad._id} className="ad-card">
                            <div className="ad-image">
                                {ad.imageUrl ? (
                                    <img src={ad.imageUrl} alt={ad.title} onError={(e) => e.target.style.display = 'none'} />
                                ) : (
                                    <div className="no-image">📷</div>
                                )}
                            </div>
                            <div className="ad-content">
                                <div className="ad-header">
                                    <h3>{ad.title}</h3>
                                    <span
                                        className="status-badge"
                                        style={{
                                            background: STATUS_COLORS[ad.status]?.bg,
                                            color: STATUS_COLORS[ad.status]?.color
                                        }}
                                    >
                                        {ad.status?.charAt(0).toUpperCase() + ad.status?.slice(1)}
                                    </span>
                                </div>
                                {ad.description && <p className="ad-description">{ad.description}</p>}
                                <div className="ad-meta">
                                    <span>📍 {ad.position}</span>
                                    <span>👁 {ad.impressions?.toLocaleString() || 0} views</span>
                                    <span>🖱 {ad.clicks?.toLocaleString() || 0} clicks</span>
                                    {ad.startDate && <span>📅 {formatDate(ad.startDate)} - {formatDate(ad.endDate)}</span>}
                                </div>
                                {ad.status === 'rejected' && ad.rejectionReason && (
                                    <div className="rejection-reason">
                                        <strong>Rejection reason:</strong> {ad.rejectionReason}
                                    </div>
                                )}
                                <div className="ad-actions">
                                    {(ad.status === 'pending' || ad.status === 'rejected') && (
                                        <button className="btn-edit" onClick={() => openEditModal(ad)}>Edit</button>
                                    )}
                                    {ad.status === 'approved' && (
                                        <button className="btn-stop" onClick={() => handleStop(ad)}>Stop</button>
                                    )}
                                    {(ad.status === 'stopped' || ad.status === 'rejected') && (
                                        <button className="btn-reactivate" onClick={() => handleReactivate(ad)}>Resubmit</button>
                                    )}
                                    <button className="btn-delete" onClick={() => handleDelete(ad)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAd ? 'Edit Ad' : 'Create New Ad'}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleFormChange}
                                        placeholder="Enter ad title"
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        placeholder="Enter ad description"
                                        maxLength={500}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Position *</label>
                                        <select name="position" value={formData.position} onChange={handleFormChange}>
                                            {targetingOptions.positions.map(pos => (
                                                <option key={pos} value={pos}>{pos}</option>
                                            ))}
                                        </select>
                                        {formData.position && targetingOptions.dimensions?.[formData.position] && (
                                            <div className="dimension-info">
                                                📐 Recommended: {getDimensions(formData.position)}
                                                <br />
                                                <small>{targetingOptions.dimensions[formData.position].description}</small>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Placement</label>
                                        <select name="placement" value={formData.placement} onChange={handleFormChange}>
                                            <option value="chat">Chat App</option>
                                            <option value="global">Global</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Image URL *</label>
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleFormChange}
                                        placeholder="https://example.com/ad-image.jpg"
                                        required
                                    />
                                    {formData.imageUrl && (
                                        <div className="image-preview">
                                            <img src={formData.imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Link URL (where users go when they click)</label>
                                    <input
                                        type="url"
                                        name="linkUrl"
                                        value={formData.linkUrl}
                                        onChange={handleFormChange}
                                        placeholder="https://example.com/landing-page"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Contact Email</label>
                                        <input
                                            type="email"
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleFormChange}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Phone</label>
                                        <input
                                            type="tel"
                                            name="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={handleFormChange}
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>

                                {/* Targeting Section */}
                                <div className="targeting-section">
                                    <h4>🎯 Ad Targeting (Optional)</h4>
                                    <p className="targeting-description">Leave empty to show to all users</p>

                                    <div className="form-group">
                                        <label>Business Categories ({formData.targetCategories.length}/{targetingOptions.categories.length})</label>
                                        <div className="multi-select-grid">
                                            {targetingOptions.categories.map(cat => (
                                                <label
                                                    key={cat}
                                                    className={`multi-select-item ${formData.targetCategories.includes(cat) ? 'selected' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetCategories.includes(cat)}
                                                        onChange={() => handleCategoryToggle(cat)}
                                                    />
                                                    {cat}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Indian States ({formData.targetStates.length}/{targetingOptions.states.length})</label>
                                        <div className="multi-select-grid states-grid">
                                            {targetingOptions.states.map(state => (
                                                <label
                                                    key={state}
                                                    className={`multi-select-item ${formData.targetStates.includes(state) ? 'selected' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetStates.includes(state)}
                                                        onChange={() => handleStateToggle(state)}
                                                    />
                                                    {state}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="info-box">
                                    ℹ️ Your ad will be reviewed by an admin before it goes live. This usually takes 1-2 business days.
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={saving}>
                                    {saving ? 'Saving...' : (editingAd ? 'Update Ad' : 'Submit for Review')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
