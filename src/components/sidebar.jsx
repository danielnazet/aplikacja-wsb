import React, { useState, useEffect, useRef } from "react";

function Sidebar({ isOpen }) {
	const [activeDropdown, setActiveDropdown] = useState(null);
	const sidebarRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (
				sidebarRef.current &&
				!sidebarRef.current.contains(event.target)
			) {
				setActiveDropdown(null);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Close dropdown when sidebar is closed
	useEffect(() => {
		if (!isOpen) {
			setActiveDropdown(null);
		}
	}, [isOpen]);

	const toggleDropdown = (menu, e) => {
		e.preventDefault();
		setActiveDropdown(activeDropdown === menu ? null : menu);
	};

	return (
		<aside
			ref={sidebarRef}
			className={`bg-base-100 h-screen w-[280px] min-w-[280px] fixed lg:static transition-transform duration-300 ease-in-out ${
				isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
			}`}
		>
			<div className="p-4 h-full flex flex-col">
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-primary">
						Dashboard
					</h2>
				</div>
				<ul className="menu menu-vertical gap-2 flex-1">
					<li>
						<a className="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							Home
						</a>
					</li>
					<li>
						<details open={activeDropdown === "analytics"}>
							<summary
								className="flex items-center gap-2"
								onClick={(e) => toggleDropdown("analytics", e)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								Analytics
							</summary>
							<ul>
								<li>
									<a>Dashboard</a>
								</li>
								<li>
									<a>Reports</a>
								</li>
								<li>
									<a>Statistics</a>
								</li>
							</ul>
						</details>
					</li>
					<li>
						<details open={activeDropdown === "profile"}>
							<summary
								className="flex items-center gap-2"
								onClick={(e) => toggleDropdown("profile", e)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								Profile
							</summary>
							<ul>
								<li>
									<a>My Account</a>
								</li>
								<li>
									<a>Security</a>
								</li>
								<li>
									<a>Notifications</a>
								</li>
							</ul>
						</details>
					</li>
					<li>
						<details open={activeDropdown === "settings"}>
							<summary
								className="flex items-center gap-2"
								onClick={(e) => toggleDropdown("settings", e)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								Settings
							</summary>
							<ul>
								<li>
									<a>General</a>
								</li>
								<li>
									<a>Privacy</a>
								</li>
								<li>
									<a>Preferences</a>
								</li>
							</ul>
						</details>
					</li>
				</ul>
				<div className="border-t border-base-300 pt-4 mt-4">
					<div className="flex items-center gap-3">
						<div className="avatar">
							<div className="w-10 rounded-full">
								<img src="" alt="Profile" />
							</div>
						</div>
						<div>
							<p className="font-semibold">Daniel Zaniewski</p>
							<p className="text-sm text-base-content/70">
								Admin
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}

export default Sidebar;
