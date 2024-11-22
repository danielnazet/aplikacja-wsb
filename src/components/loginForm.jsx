import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuthStore from "../lib/store";
import { dbOperations } from "../lib/db";

// Form validation schema
const schema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export default function LoginForm() {
	// Get setUser function from auth store
	const setUser = useAuthStore((state) => state.setUser);

	// Initialize form with validation
	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm({
		resolver: zodResolver(schema),
	});

	// Handle form submission
	const onSubmit = async (data) => {
		try {
			// Attempt to get user from database
			const user = await dbOperations.getUserByEmail(data.email);

			// Verify credentials
			if (user && user.password === data.password) {
				// Set user in auth store (excluding password)
				const { password, ...userWithoutPassword } = user;
				setUser(userWithoutPassword);
			} else {
				setError("root", {
					message: "Invalid credentials",
				});
			}
		} catch (error) {
			console.error("Login failed:", error);
			setError("root", {
				message: "Login failed. Please try again.",
			});
		}
	};

	return (
		<div className="max-w-md w-full mx-auto p-6 bg-base-100 rounded-lg shadow-xl">
			<h2 className="text-2xl font-bold text-center mb-6">Login</h2>
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
						<span className="label-text">Password</span>
					</label>
					<input
						type="password"
						{...register("password")}
						className="input input-bordered w-full"
					/>
					{errors.password && (
						<span className="text-error text-sm">
							{errors.password.message}
						</span>
					)}
				</div>

				{errors.root && (
					<div className="text-error text-sm text-center">
						{errors.root.message}
					</div>
				)}

				<button type="submit" className="btn btn-primary w-full">
					Login
				</button>
			</form>
		</div>
	);
}
