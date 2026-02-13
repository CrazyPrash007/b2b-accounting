// src/layouts/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    FiHome,
    FiUsers,
    FiBox,
    FiChevronDown,
    FiChevronRight,
    FiShoppingBag,
    FiFileText,
    FiCreditCard,
    FiAlignJustify,
    FiBookOpen,
    FiBarChart2,
    FiPackage,
    FiLayers,
    FiMessageSquare,
    FiBell,
    FiUserCheck,
    FiCalendar,
    FiDollarSign,
} from "react-icons/fi";

/**
 * Sidebar with collapsible submenus.
 * Restores your previous UI style but uses NavLink for navigation.
 */

export default function Sidebar() {
    // track which parent menus are open
    const [open, setOpen] = useState({
        masterAccount: false,
        masterParty: false,
        masterItem: false,
        transactions: false,
        core: false,
        inventory: false,
        staff: false,
    });

    const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

    const Item = ({ title, icon, to }) => {
        if (to) {
            return (
                <NavLink
                    to={to}
                    className={({ isActive }) =>
                        `w-full text-left flex items-center gap-3 px-3 py-2 rounded-md mb-1 hover:bg-gray-100 ${isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                        }`
                    }
                >
                    <div className="text-lg">{icon}</div>
                    <span className="text-sm flex-1">{title}</span>
                </NavLink>
            );
        }

        return (
            <button
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer mb-1 hover:bg-gray-100 text-gray-700"
            >
                <div className="text-lg">{icon}</div>
                <span className="text-sm flex-1">{title}</span>
            </button>
        );
    };

    const Parent = ({ title, icon, openKey, children }) => {
        const isOpen = !!open[openKey];
        return (
            <div className="mb-2">
                <button
                    onClick={() => toggle(openKey)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer 
            ${isOpen ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
                    aria-expanded={isOpen}
                >
                    <div className="text-lg">{icon}</div>
                    <span className="text-sm flex-1">{title}</span>
                    <div className="text-sm">{isOpen ? <FiChevronDown /> : <FiChevronRight />}</div>
                </button>

                <div className={`mt-2 pl-10 pr-2 ${isOpen ? "block" : "hidden"}`}>{children}</div>
            </div>
        );
    };

    const SubItem = ({ title, to }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `w-full text-left text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-600 hover:text-gray-800"} px-2 py-2 rounded-md flex items-center gap-2`
            }
        >
            <span className="flex-1">{title}</span>
        </NavLink>
    );

    return (
        <aside className="w-[235px] bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                {/* Dashboard (top-level) */}
                <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2 uppercase">Main</div>
                    <Item title="Dashboard" icon={<FiHome />} to="/" />
                    <Item title="My Ads" icon={<FiLayers />} to="/ads" />
                    <Item title="Enquiry" icon={<FiMessageSquare />} to="/enquiry" />
                    <Item title="Reminders" icon={<FiBell />} to="/reminders" />
                    
                    <Parent title="Staff Management" icon={<FiUserCheck />} openKey="staff">
                        <SubItem title="Staff List" to="/staff" />
                        <SubItem title="Attendance" to="/attendance" />
                        <SubItem title="Payroll" to="/payroll" />
                    </Parent>
                </div>

                {/* MASTER group with submenus */}
                <div>
                    <div className="text-xs text-gray-400 mt-4 mb-2 uppercase">MASTER</div>

                    <Parent title="Account Master" icon={<FiUsers />} openKey="masterAccount">
                        <SubItem title="Group" to="/account-category" />
                        <SubItem title="Bank" to="/bank" />
                        <SubItem title="Brand" to="/brand" />
                    </Parent>

                    <Parent title="Party Master" icon={<FiUsers />} openKey="masterParty">
                        <SubItem title="Customer" to="/customer" />
                        <SubItem title="Vendor" to="/vendor" />
                    </Parent>

                    <Parent title="Item Master" icon={<FiBox />} openKey="masterItem">
                        <SubItem title="Item" to="/items" />
                        <SubItem title="Item Category" to="/item-category" />
                        <SubItem title="GST Rates" to="/gst" />
                        <SubItem title="Unit" to="/unit" />
                    </Parent>
                </div>

                {/* TRANSACTIONS (kept simple, can add submenu later) */}
                <div>
                    <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">TRANSACTIONS</div>
                    <Item title="Sales" icon={<FiShoppingBag />} to="/sales" />
                    <Item title="Purchase" icon={<FiShoppingBag />} to="/purchase" />
                    <Item title="Income" icon={<FiFileText />} to="/income" />
                    <Item title="Expenses" icon={<FiFileText />} to="/expenses" />
                </div>

                {/* CORE ACCOUNTING */}
                <div>
                    <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">CORE ACCOUNTING</div>
                    <Item title="Receipt" icon={<FiFileText />} to="/receipt" />
                    <Item title="Payment" icon={<FiCreditCard />} to="/payment" />
                    <Item title="Contra Entry" icon={<FiAlignJustify />} to="/contra-entry" />
                    <Item title="Bank Reconciliation" icon={<FiAlignJustify />} to="/bank-reconciliation" />
                    <Item title="Journal Voucher" icon={<FiBookOpen />} to="/journal-voucher" />
                </div>

                {/* BUSINESS REVIEW */}
                <div>
                    <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">BUSINESS REVIEW</div>
                    <Item title="Reports" icon={<FiBarChart2 />} to="/reports" />
                </div>


                {/* INVENTORY */}
                <div>
                    <div className="text-xs text-gray-400 mt-6 mb-2 uppercase">INVENTORY</div>
                    <Item title="Stock Adjustment" icon={<FiPackage />} to="/stock-adjustment" />
                    <Item title="Stock Journal" icon={<FiLayers />} to="/stock-journal" />
                </div>

                {/* bottom quick links */}
                <div className="mt-6 border-t border-gray-100 pt-4 px-2">
                    <NavLink
                        to="/settings"
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                    >
                        <span className="text-lg">⚙️</span>
                        <span>Settings</span>
                    </NavLink>
                </div>
            </nav>
        </aside>
    );
}
