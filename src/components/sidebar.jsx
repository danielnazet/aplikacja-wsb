import React, { useState, useEffect, useRef } from "react";
import { useAuthStore, useStore } from "../lib/store";

function Sidebar({ isOpen, onNavigate, currentView }) {
	const [activeDropdown, setActiveDropdown] = useState(null);
	const sidebarRef = useRef(null);
	const user = useAuthStore((state) => state.user);

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

	useEffect(() => {
		if (!isOpen) {
			setActiveDropdown(null);
		}
	}, [isOpen]);

	const toggleDropdown = (menu, e) => {
		e.preventDefault();
		setActiveDropdown(activeDropdown === menu ? null : menu);
	};

	const handleNavigate = (view) => {
		onNavigate(view);
		if (window.innerWidth < 1024) {
			// Close sidebar on mobile after navigation
			document.querySelector(".btn-square")?.click();
		}
	};

	return (
		<aside
			ref={sidebarRef}
			className={`
        bg-base-100 w-[280px] fixed top-[64px] bottom-0 
        transition-transform duration-300 ease-in-out z-20
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        overflow-y-auto
      `}
		>
			<div className="p-4 flex flex-col h-full">
				<ul className="menu menu-vertical gap-2 flex-1">
					<li>
						<a
							className={
								currentView === "dashboard" ? "active" : ""
							}
							onClick={() => handleNavigate("dashboard")}
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
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							Dashboard
						</a>
					</li>

					{user?.role === "admin" && (
						<li>
							<a
								className={
									currentView === "employees" ? "active" : ""
								}
								onClick={() => handleNavigate("employees")}
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
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
								Employees
							</a>
						</li>
					)}

					<li>
						<a
							className={currentView === "tasks" ? "active" : ""}
							onClick={() => handleNavigate("tasks")}
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
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							Tasks
						</a>
					</li>

					<li>
						<a
							className={
								currentView === "savings" ? "active" : ""
							}
							onClick={() => handleNavigate("savings")}
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
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Savings Projects
						</a>
					</li>

					<li>
						<a
							className={currentView === "kpi" ? "active" : ""}
							onClick={() => handleNavigate("kpi")}
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
							KPI Dashboard
						</a>
					</li>

					<li>
						<a
							className={currentView === "machines" ? "active" : ""}
							onClick={() => handleNavigate("machines")}
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
							Stan Maszyn
						</a>
					</li>

					<li>
						<a
							className={currentView === "schedule" ? "active" : ""}
							onClick={() => handleNavigate("schedule")}
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
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							Harmonogram Produkcji
						</a>
					</li>

					<li>
						<a
							className={currentView === "attendance" ? "active" : ""}
							onClick={() => handleNavigate("attendance")}
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
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							Lista Obecności
						</a>
					</li>

					<li>
						<a
							className={currentView === "quality" ? "active" : ""}
							onClick={() => handleNavigate("quality")}
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
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Kontrola Jakości
						</a>
					</li>

					<li>
						<a
							className={currentView === "analytics" ? "active" : ""}
							onClick={() => handleNavigate("analytics")}
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
							Analizy i Raporty
						</a>
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
				</ul>

				<div className="border-t border-base-300 pt-4 mt-4">
					<div className="flex items-center gap-3">
						<div className="avatar">
							<div className="w-10 rounded-full">
								<img
									src={`https://ui-avatars.com/api/?name=${user?.email}`}
									alt="Profile"
								/>
							</div>
						</div>
						<div>
							<p className="font-semibold">{user?.email}</p>
							<p className="text-sm text-base-content/70">
								{user?.role}
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}

export default Sidebar;
