import React from "react";
import AppRoutes from "./AppRoutes";

/**
 * App root component.
 * Kept intentionally small so main.tsx controls the Router hydrate/mount.
 */
export default function App() {
    return <AppRoutes />;
}
