import React, { useState, useEffect, useContext } from 'react';
// Remove duplicate navbar and footer imports
import ModalUsr from "@/pages/inicio/components/modal_index";
import { AuthContext } from '@/context/auth_context';
import { Alert } from 'react-bootstrap';

const Perfil = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        postalCode: '',
        state: '',
        area: '',
        country: '',
        stateRegion: ''
    });

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError('User not authenticated');
            return;
        }

        // Fetch user profile from API
        const fetchProfile = async () => {
            try {
                const userId = user.userId || user.id;
                if (!userId) {
                    throw new Error('User ID not found in token');
                }

                const response = await fetch(`/api/profiles/user/${userId}`);

                if (!response.ok) {
                    // If the profile doesn't exist yet, create a default one
                    if (response.status === 404) {
                        // Initialize with empty profile
                        initializeProfile({
                            id: null,
                            firstName: '',
                            lastName: '',
                            email: user.email,
                            phone: '',
                            address: '',
                            postalCode: '',
                            state: '',
                            area: '',
                            country: '',
                            stateRegion: ''
                        });
                        return;
                    }
                    throw new Error(`Error fetching profile: ${response.statusText}`);
                }

                const data = await response.json();
                initializeProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(err.message || 'Failed to load profile');
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const initializeProfile = (data) => {
        setProfile(data);
        // Initialize form with profile data
        setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            address: data.address || '',
            postalCode: data.postalCode || '',
            state: data.state || '',
            area: data.area || '',
            country: data.country || '',
            stateRegion: data.stateRegion || ''
        });
        setLoading(false);
        setError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);

        // Prepare the API endpoint and method
        const method = profile?.id ? 'PUT' : 'POST';
        const url = profile?.id
            ? `/api/profiles/${profile.id}`
            : '/api/profiles';

        // Send the update request
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                ...formData,
                userId: user.userId || user.id,
                email: user.email
            })
        })
            .then(response => {
                if (!response.ok) throw new Error('Error updating profile');
                return response.json();
            })
            .then(data => {
                setProfile(data);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error updating profile:', err);
                setError('Failed to update profile');
                setLoading(false);
            });
    };

    return (
        <div className="container rounded bg-white mt-5 mb-5 profile-page" data-testid="profile-page">
            {loading ? (
                <div className="text-center p-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {saveSuccess && (
                        <Alert variant="success" className="mt-3">
                            Perfil actualizado correctamente
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger" className="mt-3">
                            {error}
                        </Alert>
                    )}

                    <div className="col-md-3 border-right">
                        <div className="d-flex flex-column align-items-center text-center p-3 py-5">
                            <img className="rounded-circle mt-5" width="150px" height="150px"
                                src="https://www.stockvault.net/data/2011/08/12/126170/preview16.jpg"
                                alt="Profile" />
                            <span className="font-weight-bold mt-2">{user?.email || 'Usuario'}</span>
                            <span className="text-black-50">{formData.firstName} {formData.lastName}</span>
                        </div>
                    </div>
                    <div className="col-md-5 border-right">
                        <form onSubmit={handleSubmit}>
                            <div className="p-3 py-5">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3>Detalles del Perfil</h3>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-md-6">
                                        <label className="labels">Nombre</label>
                                        <input type="text" className="form-control"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="labels">Apellido</label>
                                        <input type="text" className="form-control"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-12">
                                        <label className="labels">Telefono</label>
                                        <input type="text" className="form-control"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="labels">Direccion</label>
                                        <input type="text" className="form-control"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="labels">Codigo Postal</label>
                                        <input type="text" className="form-control"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="labels">Estado</label>
                                        <input type="text" className="form-control"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="labels">Area</label>
                                        <input type="text" className="form-control"
                                            name="area"
                                            value={formData.area}
                                            onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <label className="labels">Pais</label>
                                        <input type="text" className="form-control"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="labels">Estado/Region</label>
                                        <input type="text" className="form-control"
                                            name="stateRegion"
                                            value={formData.stateRegion}
                                            onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <button className="btn btn-primary profile-button" type="submit">
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-4">
                        <div className="p-3 py-5">
                            <div className="d-flex justify-content-between align-items-center experience">
                                <h3>Metodo de pago</h3>
                            </div><br />
                            <div className="col-md-12">
                                <label className="labels">Tarjeta termina en *98</label>
                                <button
                                    className="btn btn-primary profile-button ms-2"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#ModalCard">
                                    Cambiar
                                </button>
                            </div> <br />
                        </div>
                    </div>
                </div>
            )}
            <ModalUsr />
        </div>
    );
};

export default Perfil;
