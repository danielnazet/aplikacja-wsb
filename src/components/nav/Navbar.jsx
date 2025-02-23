import React from "react";
import { useAuthStore } from "../../lib";

function Navbar({ onToggleSidebar }) {
	const user = useAuthStore((state) => state.user);
	const signOut = useAuthStore((state) => state.signOut);

	const handleLogout = async () => {
		try {
			await signOut();
			// Wylogowanie powinno automatycznie przekierować do strony logowania
			// dzięki warunkowi if (!user) w App.jsx
		} catch (error) {
			console.error('Błąd wylogowania:', error);
		}
	};

	return (
		<div className="navbar bg-base-100 shadow-lg h-16">
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
			<div className="flex-1">
				<a className="btn btn-ghost normal-case text-xl">
					Production Dashboard
				</a>
			</div>
			<div className="flex-none gap-2">
				{user ? (
					<div className="dropdown dropdown-end">
						<label
							tabIndex={0}
							className="btn btn-ghost btn-circle avatar"
						>
							<div className="w-10 rounded-full">
								<img
									src={`https://ui-avatars.com/api/?name=${user.email}`}
									alt="avatar"
								/>
							</div>
						</label>
						<ul
							tabIndex={0}
							className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
						>
							<li className="menu-title">
								<span>
									{user.role.charAt(0).toUpperCase() +
										user.role.slice(1)}
								</span>
							</li>
							<li>
								<a>Profile</a>
							</li>
							<li>
								<a onClick={handleLogout}>Wyloguj</a>
							</li>
						</ul>
					</div>
				) : (
					<button className="btn btn-primary">Login</button>
				)}
			</div>
		</div>
	);
}

export default Navbar;
