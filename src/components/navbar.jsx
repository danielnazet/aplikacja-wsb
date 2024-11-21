import React from "react";

function Navbar({ onToggleSidebar }) {
	return (
		<div className="navbar bg-base-100 shadow-lg fixed top-0 left-0 w-full z-50">
			{/* Sidebar Toggle Button */}
			<div className="flex-none lg:hidden">
				<button
					className="btn btn-square btn-ghost"
					onClick={onToggleSidebar}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						className="inline-block w-5 h-5 stroke-current"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M4 6h16M4 12h16M4 18h16"
						></path>
					</svg>
				</button>
			</div>

			{/* Logo and Company Name */}
			<div className="flex items-center space-x-3 px-4">
				<img
					src="/path-to-logo.png"
					alt="S$D Logo"
					className="w-10 h-10 object-contain"
				/>
				<span className="text-xl font-bold hidden lg:block">
					S & D Dashboard
				</span>
			</div>

			{/* Search Bar */}
			<div className="flex-1 flex justify-center px-4">
				<input
					type="text"
					placeholder="Search..."
					className="input input-bordered w-full max-w-md"
				/>
			</div>

			{/* Login Button */}
			<div className="px-4">
				<button className="btn btn-primary">Login</button>
			</div>
		</div>
	);
}

export default Navbar;
