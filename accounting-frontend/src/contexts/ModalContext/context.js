// src/contexts/ModalContext/context.js
import { createContext } from 'react';

/**
 * Context for modal stack management
 * Separated to avoid Fast Refresh issues
 */
export const ModalContext = createContext();
