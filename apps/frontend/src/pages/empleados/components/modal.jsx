import React, { useEffect } from 'react';
import { BsX, BsCheck2Circle, BsExclamationTriangle, BsInfoCircle, BsTrash } from 'react-icons/bs';
import './modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md', // sm, md, lg, xl
    variant = 'default', // default, success, warning, danger, info
    showCloseButton = true,
    closeOnBackdrop = true,
    footer,
    className = ''
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to reset overflow when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'modal-sm',
        md: 'modal-md',
        lg: 'modal-lg',
        xl: 'modal-xl'
    };

    const variantIcons = {
        success: <BsCheck2Circle className="modal-icon text-success" />,
        warning: <BsExclamationTriangle className="modal-icon text-warning" />,
        danger: <BsTrash className="modal-icon text-danger" />,
        info: <BsInfoCircle className="modal-icon text-info" />,
        default: null
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className={`modal-container ${sizeClasses[size]} modal-${variant} ${className}`}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-section">
                        {variantIcons[variant]}
                        <h4 className="modal-title">{title}</h4>
                    </div>
                    {showCloseButton && (
                        <button
                            className="modal-close-btn"
                            onClick={onClose}
                            aria-label="Cerrar modal"
                        >
                            <BsX size={24} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Confirmation Modal Component
export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "¿Confirmar acción?",
    message = "¿Está seguro de que desea continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "warning",
    isLoading = false
}) => {
    const footer = (
        <div className="d-flex gap-2 justify-content-end">
            <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
            >
                {cancelText}
            </button>
            <button
                className={`btn btn-${variant === 'danger' ? 'danger' : 'primary'}`}
                onClick={onConfirm}
                disabled={isLoading}
            >
                {isLoading && <div className="spinner-border spinner-border-sm me-2" />}
                {confirmText}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            variant={variant}
            size="sm"
            footer={footer}
            closeOnBackdrop={!isLoading}
        >
            <p className="mb-0">{message}</p>
        </Modal>
    );
};

// Form Modal Component
export const FormModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    children,
    submitText = "Guardar",
    cancelText = "Cancelar",
    isLoading = false,
    size = "md"
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    const footer = (
        <div className="d-flex gap-2 justify-content-end">
            <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
            >
                {cancelText}
            </button>
            <button
                type="submit"
                className="btn btn-primary"
                form="modal-form"
                disabled={isLoading}
            >
                {isLoading && <div className="spinner-border spinner-border-sm me-2" />}
                {submitText}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size={size}
            footer={footer}
            closeOnBackdrop={!isLoading}
        >
            <form id="modal-form" onSubmit={handleSubmit}>
                {children}
            </form>
        </Modal>
    );
};

// Image Preview Modal
export const ImagePreviewModal = ({
    isOpen,
    onClose,
    imageUrl,
    imageName = "Imagen"
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={imageName}
            size="lg"
            className="image-preview-modal"
        >
            <div className="text-center">
                <img
                    src={imageUrl}
                    alt={imageName}
                    className="img-fluid rounded"
                    style={{ maxHeight: '70vh' }}
                />
            </div>
        </Modal>
    );
};

// Loading Modal Component
export const LoadingModal = ({
    isOpen,
    title = "Cargando...",
    message = "Por favor espere..."
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // Can't close loading modal
            title={title}
            size="sm"
            showCloseButton={false}
            closeOnBackdrop={false}
        >
            <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mb-0">{message}</p>
            </div>
        </Modal>
    );
};

export default Modal;
