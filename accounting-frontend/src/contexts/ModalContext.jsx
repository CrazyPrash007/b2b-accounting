// src/contexts/ModalContext.jsx
import React, { useState } from 'react';
import { ModalContext } from './ModalContext/context';

// Re-export the context for backwards compatibility
export { ModalContext };

/**
 * ModalProvider - Manages a stack of modals for nested modal support
 * 
 * This allows modals to open other modals on top of them while preserving
 * the parent modal's state. Perfect for "Add New Item" flows within forms.
 */
export function ModalProvider({ children }) {
    // Stack of modals: [{id, component, props}, ...]
    const [modalStack, setModalStack] = useState([]);

    /**
     * Opens a modal by adding it to the stack
     * @param {React.Component} ModalComponent - The modal component to render
     * @param {Object} props - Props to pass to the modal component
     */
    const openModal = (ModalComponent, props = {}) => {
        const modalEntry = {
            id: Date.now() + Math.random(), // Unique ID for React key
            component: ModalComponent,
            props: {
                ...props,
                isOpen: true, // Force isOpen to true for consistency
            }
        };
        
        setModalStack(prev => [...prev, modalEntry]);
        console.log('📂 Modal opened. Stack depth:', modalStack.length + 1);
    };

    /**
     * Closes the topmost modal
     */
    const closeModal = () => {
        setModalStack(prev => {
            const newStack = prev.slice(0, -1);
            console.log('📂 Modal closed. Stack depth:', newStack.length);
            return newStack;
        });
    };

    /**
     * Closes all modals at once
     */
    const closeAllModals = () => {
        console.log('📂 All modals closed');
        setModalStack([]);
    };

    return (
        <ModalContext.Provider value={{ modalStack, openModal, closeModal, closeAllModals }}>
            {children}
            
            {/* Render all modals in the stack with progressive z-index */}
            {modalStack.map((modal, index) => {
                const Component = modal.component;
                const zIndex = 50 + index; // Increment z-index for each layer
                const backdropOpacity = Math.min(0.3 + (index * 0.1), 0.7); // Progressive darkening
                
                return (
                    <div 
                        key={modal.id}
                        style={{ 
                            position: 'fixed',
                            inset: 0,
                            zIndex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
                            overflowY: 'auto',
                            padding: '1rem'
                        }}
                        onClick={(e) => {
                            // Close modal if clicking outside (optional)
                            if (e.target === e.currentTarget && modal.props.closeOnBackdropClick !== false) {
                                closeModal();
                            }
                        }}
                    >
                        <Component {...modal.props} />
                    </div>
                );
            })}
        </ModalContext.Provider>
    );
}
