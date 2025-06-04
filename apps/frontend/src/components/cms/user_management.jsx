import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser } from '@/api/hooks';

const UserManagement = () => {
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Queries
    const { data: users = [], isLoading, refetch } = useUsers(filters);
    const { data: userDetails } = useUser(selectedUser?.id);

    // Mutations
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    // Forms
    const createForm = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'customer',
            isActive: true
        }
    });

    const editForm = useForm();

    // Filter and sort users
    const filteredUsers = users
        .filter(user => {
            if (filters.search && !user.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
                !user.email?.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.role && user.role !== filters.role) return false;
            if (filters.status && user.status !== filters.status) return false;
            return true;
        })
        .sort((a, b) => {
            const aValue = a[filters.sortBy] || '';
            const bValue = b[filters.sortBy] || '';
            if (filters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Handle create user
    const onCreateUser = async (data) => {
        try {
            await createUserMutation.mutateAsync(data);
            setShowCreateModal(false);
            createForm.reset();
            refetch();
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    // Handle update user
    const onUpdateUser = async (data) => {
        try {
            await updateUserMutation.mutateAsync({
                userId: selectedUser.id,
                ...data
            });
            setShowUserModal(false);
            refetch();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // View user details
    const handleViewUser = (user) => {
        setSelectedUser(user);
        editForm.reset({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
        setShowUserModal(true);
    };

    // Handle delete user
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUserMutation.mutateAsync(userId);
                refetch();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Get role badge class
    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'bg-danger';
            case 'employee': return 'bg-warning text-dark';
            case 'customer': return 'bg-primary';
            case 'vendor': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active': return 'bg-success';
            case 'inactive': return 'bg-secondary';
            case 'suspended': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    // Calculate summary stats
    const userStats = {
        total: filteredUsers.length,
        admins: filteredUsers.filter(u => u.role === 'admin').length,
        employees: filteredUsers.filter(u => u.role === 'employee').length,
        customers: filteredUsers.filter(u => u.role === 'customer').length,
        vendors: filteredUsers.filter(u => u.role === 'vendor').length,
        active: filteredUsers.filter(u => u.isActive).length
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="user-management">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">User Management</h2>
                    <p className="text-muted">Manage users, customers, and staff members</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add User
                    </button>
                    <button className="btn btn-outline-primary">
                        <i className="bi bi-download me-2"></i>
                        Export Users
                    </button>
                </div>
            </div>

            {/* User Statistics */}
            <div className="row g-4 mb-4">
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-primary">{userStats.total}</h3>
                            <p className="mb-0 text-muted">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-danger">{userStats.admins}</h3>
                            <p className="mb-0 text-muted">Admins</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-warning">{userStats.employees}</h3>
                            <p className="mb-0 text-muted">Employees</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-info">{userStats.customers}</h3>
                            <p className="mb-0 text-muted">Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-purple">{userStats.vendors}</h3>
                            <p className="mb-0 text-muted">Vendors</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-success">{userStats.active}</h3>
                            <p className="mb-0 text-muted">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Name or email..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                value={filters.role}
                                onChange={(e) => handleFilterChange('role', e.target.value)}
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="employee">Employee</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Sort By</label>
                            <select
                                className="form-select"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            >
                                <option value="createdAt">Date Joined</option>
                                <option value="name">Name</option>
                                <option value="email">Email</option>
                                <option value="role">Role</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Order</label>
                            <select
                                className="form-select"
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => setFilters({ search: '', role: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' })}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Date Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-placeholder bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-1">{user.name || 'No name'}</h6>
                                                        <small className="text-muted">{user.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(user.isActive ? 'active' : 'inactive')}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleViewUser(user)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '3rem', opacity: 0.3 }}>👥</span>
                                                <h6 className="mt-2">No users found</h6>
                                                <p>Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={createForm.handleSubmit(onCreateUser)}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Create New User</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowCreateModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                className={`form-control ${createForm.formState.errors.name ? 'is-invalid' : ''}`}
                                                {...createForm.register('name', { required: 'Name is required' })}
                                            />
                                            {createForm.formState.errors.name && (
                                                <div className="invalid-feedback">
                                                    {createForm.formState.errors.name.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className={`form-control ${createForm.formState.errors.email ? 'is-invalid' : ''}`}
                                                {...createForm.register('email', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Invalid email address'
                                                    }
                                                })}
                                            />
                                            {createForm.formState.errors.email && (
                                                <div className="invalid-feedback">
                                                    {createForm.formState.errors.email.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password"
                                                className={`form-control ${createForm.formState.errors.password ? 'is-invalid' : ''}`}
                                                {...createForm.register('password', {
                                                    required: 'Password is required',
                                                    minLength: {
                                                        value: 6,
                                                        message: 'Password must be at least 6 characters'
                                                    }
                                                })}
                                            />
                                            {createForm.formState.errors.password && (
                                                <div className="invalid-feedback">
                                                    {createForm.formState.errors.password.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Role</label>
                                            <select
                                                className="form-select"
                                                {...createForm.register('role')}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="employee">Employee</option>
                                                <option value="admin">Admin</option>
                                                <option value="vendor">Vendor</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    {...createForm.register('isActive')}
                                                />
                                                <label className="form-check-label">
                                                    Active Account
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={createUserMutation.isLoading}
                                    >
                                        {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={editForm.handleSubmit(onUpdateUser)}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit User - {selectedUser.name}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowUserModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                {...editForm.register('name')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                {...editForm.register('email')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Role</label>
                                            <select
                                                className="form-select"
                                                {...editForm.register('role')}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="employee">Employee</option>
                                                <option value="admin">Admin</option>
                                                <option value="vendor">Vendor</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-check mt-4">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    {...editForm.register('isActive')}
                                                />
                                                <label className="form-check-label">
                                                    Active Account
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowUserModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={updateUserMutation.isLoading}
                                    >
                                        {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
