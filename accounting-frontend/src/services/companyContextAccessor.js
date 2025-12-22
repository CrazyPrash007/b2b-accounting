// Initialize from localStorage on module load
let currentCompany = "";

// Try to restore from localStorage immediately
try {
    const saved = localStorage.getItem("selectedCompany");
    if (saved) {
        currentCompany = saved;
    }
} catch (e) {
    // localStorage might not be available
}

export function setCurrentCompany(name) {
    currentCompany = name;
}

export function getCurrentCompany() {
    // If not set, try to get from localStorage as fallback
    if (!currentCompany) {
        try {
            const saved = localStorage.getItem("selectedCompany");
            if (saved) {
                currentCompany = saved;
            }
        } catch (e) {
            // localStorage might not be available
        }
    }
    return currentCompany;
}
