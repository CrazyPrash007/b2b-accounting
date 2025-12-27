// src/hooks/useModal.js
import { useContext } from 'react';
import { ModalContext } from '../contexts/ModalContext/context';

/**
 * Hook to access modal context
 * @returns {Object} { modalStack, openModal, closeModal, closeAllModals }
 */
export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within ModalProvider');
    }
    return context;
};

export default useModal;
