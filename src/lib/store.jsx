import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create((set) => ({
	users: [],
	setUsers: (users) => set({ users }),
	fetchUsers: async () => {
		// Mockowane dane użytkowników
		const mockUsers = [
			{
				id: "1",
				email: "user1@example.com",
				firstName: "User",
				lastName: "One",
				role: "admin",
			},
			{
				id: "2",
				email: "user2@example.com",
				firstName: "User",
				lastName: "Two",
				role: "worker",
			},
		];
		set({ users: mockUsers });
	},
}));

const useAuthStore = create(
	persist(
		(set) => ({
			user: null,
			employees: [],
			savingsProjects: [],
			setUser: (user) => set({ user }),
			logout: () => set({ user: null }),
			addEmployee: (employee) =>
				set((state) => ({
					employees: [
						...state.employees,
						{ ...employee, id: Date.now().toString() },
					],
				})),
			removeEmployee: (employeeId) =>
				set((state) => ({
					employees: state.employees.filter(
						(emp) => emp.id !== employeeId
					),
				})),
			addSavingsProject: (project) =>
				set((state) => ({
					savingsProjects: [
						...state.savingsProjects,
						{ ...project, id: Date.now().toString() },
					],
				})),
			removeSavingsProject: (projectId) =>
				set((state) => ({
					savingsProjects: state.savingsProjects.filter(
						(proj) => proj.id !== projectId
					),
				})),
		}),
		{
			name: "auth-storage",
		}
	)
);

export { useAuthStore, useStore };
