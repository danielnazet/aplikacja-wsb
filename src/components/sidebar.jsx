import React from "react";
const Sidebar = () => {
	return (
		<div className="w-64 bg-gray-800 h-full text-white fixed">
			<div className="p-4 text-2xl font-bold border-b border-gray-700">
				Dashboard:
			</div>
			<ul className="mt-4 space-y-2">
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Home
				</li>
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Reports
				</li>
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Production
				</li>
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Inventory
				</li>
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Material
				</li>
				<li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
					Settings
				</li>
			</ul>
		</div>
	);
};

export default Sidebar;
