import React, { useState } from "react";
import { useAuthStore } from "../../lib";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Form validation schema
const schema = z.object({
	email: z.string().email("Nieprawidłowy adres email"),
	password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export default function LoginForm() {
	const signIn = useAuthStore((state) => state.signIn);
	const error = useAuthStore((state) => state.error);
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data) => {
		try {
			await signIn(data.email, data.password);
			navigate('/'); // Przekieruj do głównej strony po zalogowaniu
		} catch (error) {
			console.error("Login failed:", error);
			toast.error("Błąd logowania: " + error.message);
			setError("root", {
				message: "Nieprawidłowy email lub hasło",
			});
		}
	};

	return (
		<div className="max-w-md w-full mx-auto p-6 bg-base-100 rounded-lg shadow-xl">
			<h2 className="text-2xl font-bold text-center mb-6">Logowanie</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<label className="label">
						<span className="label-text">Email</span>
					</label>
					<input
						type="email"
						{...register("email")}
						className="input input-bordered w-full"
						placeholder="email@example.com"
					/>
					{errors.email && (
						<span className="text-error text-sm">
							{errors.email.message}
						</span>
					)}
				</div>

				<div>
					<label className="label">
						<span className="label-text">Hasło</span>
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							{...register("password")}
							className="input input-bordered w-full"
							placeholder="Wprowadź hasło"
						/>
						<button
							type="button"
							className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? "👁️" : "👁️‍🗨️"}
						</button>
					</div>
					{errors.password && (
						<span className="text-error text-sm">
							{errors.password.message}
						</span>
					)}
				</div>

				{(errors.root || error) && (
					<div className="text-error text-sm text-center">
						{errors.root?.message || error}
					</div>
				)}

				<button 
					type="submit" 
					className="btn btn-primary w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Logowanie..." : "Zaloguj się"}
				</button>
			</form>
		</div>
	);
}
