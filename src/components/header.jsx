import React from "react";

const Header = () => {
	return (
		<div className="h-12 flex items-center justify-between px-4 bg-gray-100 shadow">
			<h1 className="text-lg font-semibold">Welcome to S&D company</h1>
			<button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
				Login
			</button>
		</div>
	);
};

export default Header;
