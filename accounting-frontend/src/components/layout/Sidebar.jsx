import {
    FiHome,
    FiUsers,
    FiBox,
    FiShoppingBag,
    FiFileText,
    FiCreditCard,
    FiClipboard,
    FiBarChart2,
    FiPackage,
    FiAlignJustify,
    FiBookOpen,
    FiLayers,
} from "react-icons/fi";

export default function Sidebar() {
    return (
        <aside className="w-[260px] bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
            {/* Logo */}
            <div className="px-6 py-6 flex items-center gap-3">
                <img src="/logo.svg" className="h-10 w-10 logo" alt="logo" />
                <div>
                    <div className="font-semibold text-primary">YourApp</div>
                    <div className="text-xs text-gray-500">Accounting</div>
                </div>
            </div>

            <nav className="flex-1 px-4 overflow-y-auto">
                <SidebarItem title="Dashboard" icon={<FiHome />} active />

                <SidebarHeading title="MASTER" />
                <SidebarItem title="Account Master" icon={<FiUsers />} />
                <SidebarItem title="Party Master" icon={<FiUsers />} />
                <SidebarItem title="Item Master" icon={<FiBox />} />

                <SidebarHeading title="TRANSACTIONS" />
                <SidebarItem title="Sales" icon={<FiShoppingBag />} />
                <SidebarItem title="Purchase" icon={<FiShoppingBag />} />
                <SidebarItem title="Expenses" icon={<FiFileText />} />

                <SidebarHeading title="CORE ACCOUNTING" />
                <SidebarItem title="Receipt" icon={<FiFileText />} />
                <SidebarItem title="Payment" icon={<FiCreditCard />} />
                <SidebarItem title="Contra Entry" icon={<FiClipboard />} />
                <SidebarItem title="Bank Reconciliation" icon={<FiAlignJustify />} />
                <SidebarItem title="Journal Voucher" icon={<FiBookOpen />} />

                <SidebarHeading title="BUSINESS REVIEW" />
                <SidebarItem title="Reports" icon={<FiBarChart2 />} />

                <SidebarHeading title="INVENTORY" />
                <SidebarItem title="Stock Adjustment" icon={<FiPackage />} />
                <SidebarItem title="Stock Journal" icon={<FiLayers />} />

                {/* bottom quick links (optional) */}
                <div className="mt-6 border-t border-gray-100 pt-4 px-2">
                    <SidebarSmall label="Settings" />
                </div>
            </nav>
        </aside>
    );
}

function SidebarHeading({ title }) {
    return (
        <div className="text-xs text-gray-400 mt-6 mb-2 px-2 uppercase">
            {title}
        </div>
    );
}

function SidebarItem({ title, icon, active = false }) {
    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer mb-1
        ${active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
            <div className="text-lg">{icon}</div>
            <span className="text-sm flex-1">{title}</span>
            {/* right chevron */}
            <div className="text-gray-300">{/* keep empty or add icon if you want */}</div>
        </div>
    );
}

function SidebarSmall({ label }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm text-gray-700">
            <div className="text-lg">⚙️</div>
            <span>{label}</span>
        </div>
    );
}
