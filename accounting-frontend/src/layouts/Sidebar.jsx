// import React, { useState } from "react";
// import {
//     FiHome,
//     FiUsers,
//     FiBox,
//     FiChevronDown,
//     FiChevronRight,
//     FiShoppingBag,
//     FiFileText,
//     FiCreditCard,
//     FiAlignJustify,
//     FiBookOpen,
//     FiBarChart2,
//     FiPackage,
//     FiLayers,
// } from "react-icons/fi";

// /**
//  * Sidebar with collapsible submenus.
//  * - Account Master -> Category
//  * - Party Master -> Customer, Vendor
//  * - Item Master  -> Item, Item Category, Unit
//  *
//  * Add more sections later by adding entries to `menu`.
//  */

// export default function Sidebar() {
//     // track which parent menus are open
//     const [open, setOpen] = useState({
//         master: true, // keep MASTER open by default if you like
//         transactions: false,
//         core: false,
//         inventory: false,
//     });

//     const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

//     // small reusable item (no submenu)
//     const Item = ({ title, icon, onClick }) => (
//         <button
//             onClick={onClick}
//             className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer mb-1 hover:bg-gray-100 text-gray-700"
//         >
//             <div className="text-lg">{icon}</div>
//             <span className="text-sm flex-1">{title}</span>
//         </button>
//     );

//     // parent that has submenu items
//     const Parent = ({ title, icon, openKey, children }) => {
//         const isOpen = !!open[openKey];
//         return (
//             <div className="mb-2">
//                 <button
//                     onClick={() => toggle(openKey)}
//                     className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer 
//             ${isOpen ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
//                     aria-expanded={isOpen}
//                 >
//                     <div className="text-lg">{icon}</div>
//                     <span className="text-sm flex-1">{title}</span>
//                     <div className="text-sm">
//                         {isOpen ? <FiChevronDown /> : <FiChevronRight />}
//                     </div>
//                 </button>

//                 <div className={`mt-2 pl-10 pr-2 ${isOpen ? "block" : "hidden"}`}>
//                     {children}
//                 </div>
//             </div>
//         );
//     };

//     // small submenu link style
//     const SubItem = ({ title, onClick }) => (
//         <button
//             onClick={onClick}
//             className="w-full text-left text-sm text-gray-600 hover:text-gray-800 px-2 py-2 rounded-md flex items-center gap-2"
//         >
//             <span className="flex-1">{title}</span>
//         </button>
//     );

//     return (
//         <aside className="w-[260px] bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
//             {/* Logo */}
//             <div className="px-6 py-6 flex items-center gap-3">
//                 <img src="/logo.svg" className="h-10 w-10 logo" alt="logo" />
//                 <div>
//                     <div className="font-semibold text-primary">YourApp</div>
//                     <div className="text-xs text-gray-500">Accounting</div>
//                 </div>
//             </div>

//             <nav className="flex-1 px-4 overflow-y-auto">
//                 {/* Dashboard (top-level) */}
//                 <div className="mb-4">
//                     <div className="text-xs text-gray-400 mb-2 uppercase">Main</div>
//                     <Item title="Dashboard" icon={<FiHome />} onClick={() => { /* route later */ }} />
//                 </div>

//                 {/* MASTER group with submenus */}
//                 <div>
//                     <div className="text-xs text-gray-400 mt-4 mb-2 uppercase">MASTER</div>

//                     <Parent title="Account Master" icon={<FiUsers />} openKey="masterAccount">
//                         <SubItem title="Category" onClick={() => {/* route to /account/category */ }} />
//                     </Parent>

//                     <Parent title="Party Master" icon={<FiUsers />} openKey="masterParty">
//                         <SubItem title="Customer" onClick={() => {/* route to /party/customer */ }} />
//                         <SubItem title="Vendor" onClick={() => {/* route to /party/vendor */ }} />
//                     </Parent>

//                     <Parent title="Item Master" icon={<FiBox />} openKey="masterItem">
//                         <SubItem title="Item" onClick={() => {/* route to /item */ }} />
//                         <SubItem title="Item Category" onClick={() => {/* route to /item/category */ }} />
//                         <SubItem title="Unit" onClick={() => {/* route to /item/unit */ }} />
//                     </Parent>
//                 </div>

//                 {/* TRANSACTIONS (kept simple, can add submenu later) */}
//                 <div>
//                     <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">TRANSACTIONS</div>
//                     <Item title="Sales" icon={<FiShoppingBag />} />
//                     <Item title="Purchase" icon={<FiShoppingBag />} />
//                     <Item title="Expenses" icon={<FiFileText />} />
//                 </div>

//                 {/* CORE ACCOUNTING */}
//                 <div>
//                     <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">CORE ACCOUNTING</div>
//                     <Item title="Receipt" icon={<FiFileText />} />
//                     <Item title="Payment" icon={<FiCreditCard />} />
//                     <Item title="Contra Entry" icon={<FiAlignJustify />} />
//                     <Item title="Bank Reconciliation" icon={<FiAlignJustify />} />
//                     <Item title="Journal Voucher" icon={<FiBookOpen />} />
//                 </div>

//                 {/* BUSINESS REVIEW */}
//                 <div>
//                     <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">BUSINESS REVIEW</div>
//                     <Item title="Reports" icon={<FiBarChart2 />} />
//                 </div>

//                 {/* INVENTORY */}
//                 <div>
//                     <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">INVENTORY</div>
//                     <Item title="Stock Adjustment" icon={<FiPackage />} />
//                     <Item title="Stock Journal" icon={<FiLayers />} />
//                 </div>

//                 {/* bottom quick links */}
//                 <div className="mt-6 border-t border-gray-100 pt-4 px-2">
//                     <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm text-gray-700">
//                         <span className="text-lg">⚙️</span>
//                         <span>Settings</span>
//                     </button>
//                 </div>
//             </nav>
//         </aside>
//     );
// }

// src/layouts/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

/**
 * Sidebar with expandable submenus.
 * - Uses NavLink for routing and active highlighting.
 * - Keeps submenu open if a child route is active.
 */

const Chevron = ({ open }) => (
    <svg className={`w-4 h-4 transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MenuButton = ({ title, open, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-expanded={open}
    >
        <span className="text-sm font-medium">{title}</span>
        <Chevron open={open} />
    </button>
);

const SubItem = ({ to, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 ${isActive ? "bg-slate-200 font-medium text-slate-800" : "text-slate-700"}`
        }
    >
        {label}
    </NavLink>
);

export default function Sidebar({ className = "" }) {
    const location = useLocation();

    // determine if a submenu should be initially open based on current path
    const path = location.pathname;
    const [openAccount, setOpenAccount] = useState(path.startsWith("/account"));
    const [openParty, setOpenParty] = useState(path.startsWith("/party"));
    const [openItem, setOpenItem] = useState(path.startsWith("/item") || path === "/item-category");

    return (
        <aside className={`w-64 min-h-screen bg-white border-r p-3 hidden md:flex flex-col ${className}`} aria-label="Sidebar">
            <div className="mb-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                        {/* logo svg */}
                        <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M6 19c1.6-2 3.7-3 6-3s4.4 1 6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <div>
                        <div className="text-lg font-bold">Munim</div>
                        <div className="text-xs text-slate-500">Accounting</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-auto">
                <div className="text-xs text-slate-400 px-4 mb-2">MAIN</div>

                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md hover:bg-slate-100 ${isActive ? "bg-slate-200 font-medium" : "text-slate-700"}`}
                >
                    <span className="w-5 text-center">🏠</span>
                    <span>Dashboard</span>
                </NavLink>

                <div className="mt-4 px-2 text-xs text-slate-400 uppercase">Master</div>

                {/* Account Master */}
                <div className="mt-2 px-1">
                    <MenuButton title="Account Master" open={openAccount} onClick={() => setOpenAccount((s) => !s)} />
                    <div className={`mt-1 overflow-hidden transition-[max-height] duration-200 ${openAccount ? "max-h-60" : "max-h-0"}`} aria-hidden={!openAccount}>
                        <div className="px-2 py-1 space-y-1">
                            <SubItem to="/account/category" label="Category" />
                            {/* add more account subitems here */}
                        </div>
                    </div>
                </div>

                {/* Party Master */}
                <div className="mt-2 px-1">
                    <MenuButton title="Party Master" open={openParty} onClick={() => setOpenParty((s) => !s)} />
                    <div className={`mt-1 overflow-hidden transition-[max-height] duration-200 ${openParty ? "max-h-60" : "max-h-0"}`} aria-hidden={!openParty}>
                        <div className="px-2 py-1 space-y-1">
                            <SubItem to="/party/customer" label="Customer" />
                            <SubItem to="/party/vendor" label="Vendor" />
                        </div>
                    </div>
                </div>

                {/* Item Master */}
                <div className="mt-2 px-1">
                    <MenuButton title="Item Master" open={openItem} onClick={() => setOpenItem((s) => !s)} />
                    <div className={`mt-1 overflow-hidden transition-[max-height] duration-200 ${openItem ? "max-h-60" : "max-h-0"}`} aria-hidden={!openItem}>
                        <div className="px-2 py-1 space-y-1">
                            <SubItem to="/item-category" label="Item Category" />
                            <SubItem to="/items" label="Item" />
                            <SubItem to="/items/unit" label="Unit" />
                        </div>
                    </div>
                </div>

                {/* Transactions (example) */}
                <div className="mt-6 px-2 text-xs text-slate-400 uppercase">Transactions</div>
                <NavLink
                    to="/sales"
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md hover:bg-slate-100 ${isActive ? "bg-slate-200 font-medium" : "text-slate-700"}`}
                >
                    <span className="w-5 text-center">🧾</span>
                    <span>Sales</span>
                </NavLink>

                <NavLink
                    to="/purchase"
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md hover:bg-slate-100 ${isActive ? "bg-slate-200 font-medium" : "text-slate-700"}`}
                >
                    <span className="w-5 text-center">📦</span>
                    <span>Purchase</span>
                </NavLink>

                {/* bottom */}
            </nav>

            <div className="mt-auto px-3 py-4 text-sm text-slate-500">
                v1.0 • <NavLink to="/settings" className="underline">Settings</NavLink>
            </div>
        </aside>
    );
}
