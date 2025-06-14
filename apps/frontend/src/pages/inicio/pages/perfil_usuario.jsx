import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth_context';
import { useProfile, useUpdateProfile, useCreateCustomerPortalSession } from '@/api/hooks';
import { Alert, Spinner } from 'react-bootstrap';

const Perfil = () => {
    const { user } = useAuth();
    const { data: profileData, isLoading: profileLoading, error: profileError } = useProfile();
    const updateProfile = useUpdateProfile();
    const createPortalSession = useCreateCustomerPortalSession();
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
        if (profileData?.user) {
            // Initialize form with profile data from API
            const userData = profileData.user;
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                address: userData.address || '',
                postalCode: userData.postalCode || '',
                state: userData.state || '',
                area: userData.area || '',
                country: userData.country || 'México',
                stateRegion: userData.stateRegion || ''
            });
        }
    }, [profileData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        updateProfile.mutate(formData, {
            onSuccess: () => {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            },
            onError: (error) => {
                console.error('Error updating profile:', error);
            }
        });
    };

    const handleStripePortal = async () => {
        createPortalSession.mutate(
            { returnUrl: window.location.href },
            {
                onSuccess: (data) => {
                    if (data.url) {
                        // Redirect to Stripe Customer Portal
                        window.location.href = data.url;
                    }
                },
                onError: (error) => {
                    console.error('Error opening Stripe portal:', error);
                    alert(error.response?.data?.error || 'Error al abrir el portal de pagos. Por favor intenta de nuevo.');
                }
            }
        );
    };

    if (!user) {
        return (
            <div className="container rounded bg-white mt-5 mb-5">
                <Alert variant="warning">
                    Por favor inicia sesión para ver tu perfil.
                </Alert>
            </div>
        );
    }

    if (profileLoading) {
        return (
            <div className="container rounded bg-white mt-5 mb-5">
                <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando perfil...</span>
                    </Spinner>
                </div>
            </div>
        );
    }

    return (
        <div className="container rounded bg-white mt-5 mb-5 profile-page" data-testid="profile-page">
            <div className="row">
                {saveSuccess && (
                    <Alert variant="success" className="mt-3">
                        Perfil actualizado correctamente
                    </Alert>
                )}

                {profileError && (
                    <Alert variant="danger" className="mt-3">
                        Error al cargar el perfil. Por favor intenta de nuevo.
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
                                    <label className="labels">Teléfono</label>
                                    <input type="text" className="form-control"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange} />
                                </div>
                                <div className="col-md-12">
                                    <label className="labels">Dirección</label>
                                    <input type="text" className="form-control"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange} />
                                </div>
                                <div className="col-md-12">
                                    <label className="labels">Código Postal</label>
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
                                    <label className="labels">País</label>
                                    <input type="text" className="form-control"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="labels">Estado/Región</label>
                                    <input type="text" className="form-control"
                                        name="stateRegion"
                                        value={formData.stateRegion}
                                        onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mt-5">
                                <button 
                                    className="btn btn-primary profile-button" 
                                    type="submit"
                                    disabled={updateProfile.isLoading}
                                >
                                    {updateProfile.isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="col-md-4">
                    <div className="p-3 py-5">
                        <div className="d-flex justify-content-between align-items-center experience">
                            <h3>Facturación y Pagos</h3>
                        </div><br />
                        <div className="col-md-12">
                            <p className="text-muted mb-3">
                                Administra tus métodos de pago, ve tu historial de compras y descarga facturas.
                            </p>
                            <button
                                className="btn btn-primary profile-button w-100"
                                type="button"
                                onClick={handleStripePortal}
                                disabled={createPortalSession.isLoading}
                            >
                                {createPortalSession.isLoading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Abriendo portal...
                                    </>
                                ) : (
                                    'Gestionar Pagos y Facturas'
                                )}
                            </button>
                            <small className="text-muted d-block mt-2">
                                Serás redirigido al portal seguro de Stripe
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;