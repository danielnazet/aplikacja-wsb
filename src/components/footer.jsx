import React from "react";

export default function Footer({ className = "" }) {
	return (
		<footer
			className={`footer footer-center p-4 bg-base-300 text-base-content ${className}`}
		>
			<div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto px-4">
				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold">D - Dashboard</span>
					<span className="text-sm">
						© {new Date().getFullYear()} All rights reserved
					</span>
				</div>
				<div className="flex gap-4">
					<a href="#" className="link link-hover">
						About
					</a>
					<a href="#" className="link link-hover">
						Contact: dzaniewski89@gmail.com
					</a>
					<a href="#" className="link link-hover">
						Privacy Policy
					</a>
					<a href="#" className="link link-hover">
						Terms of Service
					</a>
				</div>
			</div>
		</footer>
	);
}
