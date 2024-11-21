import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuthStore from "../lib/store";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

// Mock user database - in a real app, this would be in your backend
const USERS = [
	{ id: 1, email: "admin@example.com", password: "admin123", role: "admin" },
	{
		id: 2,
		email: "foreman@example.com",
		password: "foreman123",
		role: "foreman",
	},
	{
		id: 3,
		email: "worker@example.com",
		password: "worker123",
		role: "worker",
	},
];

export default function LoginForm() {
	const setUser = useAuthStore((state) => state.setUser);
	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = (data) => {
		const user = USERS.find(
			(u) => u.email === data.email && u.password === data.password
		);

		if (user) {
			setUser({ id: user.id, email: user.email, role: user.role });
		} else {
			setError("root", {
				message: "Invalid credentials",
			});
		}
	};

	return (
		<div className="max-w-md w-full mx-auto p-6 bg-base-100 rounded-lg shadow-xl">
			<h2 className="text-2xl font-bold text-center mb-6">
				Login to S&D Dashboard:
			</h2>
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
						placeholder="Enter your password"
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
