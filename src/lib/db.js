import { createClient } from "@libsql/client";

// Get environment variables
const DB_URL = "https://danny-danielnazet1.aws-eu-west-3.turso.io";
const DB_AUTH_TOKEN =
	"eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzIyODIxNzgsImlhdCI6MTczMjI3ODU3OCwiaWQiOiI2NGIxNWZmNC1lMjY3LTRmNGQtOWI1YS1lNjE5NWI0NjdlZmIifQ.aPccN78mVkUTa9_jJlqz4NQEf4pwIgcQ1_bOiG3CdDIlK8M48UPpAhHP7JuMuu93BDDffQVOz8IbzaGGMIG5Dw";

if (!DB_URL || !DB_AUTH_TOKEN) {
	throw new Error(
		"Database configuration missing. Please check your configuration."
	);
}

// Create database client
const client = createClient({
	url: DB_URL,
	authToken: DB_AUTH_TOKEN,
});

// Initialize database schema and create admin user
export async function initializeDatabase() {
	try {
		// Create users table
		await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

		// Create savings_projects table
		await client.execute(`
      CREATE TABLE IF NOT EXISTS savings_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        targetSavings REAL NOT NULL,
        currentSavings REAL NOT NULL,
        deadline TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);

		// Create tasks table
		await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        assignedTo TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        lastModifiedBy TEXT,
        lastModifiedAt TEXT,
        FOREIGN KEY (assignedTo) REFERENCES users(id),
        FOREIGN KEY (createdBy) REFERENCES users(id),
        FOREIGN KEY (lastModifiedBy) REFERENCES users(id)
      )
    `);

		// Check if admin user exists
		const adminCheck = await client.execute({
			sql: "SELECT * FROM users WHERE email = ?",
			args: ["admin@example.com"],
		});

		// Create admin user if it doesn't exist
		if (!adminCheck.rows.length) {
			const adminId = crypto.randomUUID();
			const now = new Date().toISOString();

			await client.execute({
				sql: `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [
					adminId,
					"admin@example.com",
					"admin123", // Default password
					"Admin",
					"User",
					"admin",
					now,
				],
			});

			console.log("Admin user created successfully");
		}

		console.log("Database initialized successfully");
	} catch (error) {
		console.error("Failed to initialize database:", error);
		throw error;
	}
}

// Database operations object
export const dbOperations = {
	// User operations
	async createUser(userData) {
		try {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();

			await client.execute({
				sql: `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [
					id,
					userData.email,
					userData.password,
					userData.firstName,
					userData.lastName,
					userData.role,
					now,
				],
			});

			return { id, ...userData, createdAt: now };
		} catch (error) {
			console.error("Error creating user:", error);
			throw error;
		}
	},

	async getUserByEmail(email) {
		try {
			const result = await client.execute({
				sql: "SELECT * FROM users WHERE email = ?",
				args: [email],
			});
			return result.rows[0];
		} catch (error) {
			console.error("Error getting user:", error);
			throw error;
		}
	},

	async getAllUsers() {
		try {
			const result = await client.execute(
				"SELECT * FROM users ORDER BY createdAt DESC"
			);
			return result.rows;
		} catch (error) {
			console.error("Error getting users:", error);
			throw error;
		}
	},

	async updateUser(id, userData) {
		try {
			const { email, firstName, lastName, role } = userData;
			await client.execute({
				sql: `UPDATE users 
              SET email = ?, firstName = ?, lastName = ?, role = ?
              WHERE id = ?`,
				args: [email, firstName, lastName, role, id],
			});
			return { id, ...userData };
		} catch (error) {
			console.error("Error updating user:", error);
			throw error;
		}
	},

	async deleteUser(id) {
		try {
			await client.execute({
				sql: "DELETE FROM users WHERE id = ?",
				args: [id],
			});
			return true;
		} catch (error) {
			console.error("Error deleting user:", error);
			throw error;
		}
	},

	// Savings project operations
	async createSavingsProject(projectData) {
		try {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();

			await client.execute({
				sql: `INSERT INTO savings_projects 
              (id, name, description, targetSavings, currentSavings, deadline, createdBy, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [
					id,
					projectData.name,
					projectData.description,
					projectData.targetSavings,
					projectData.currentSavings,
					projectData.deadline,
					projectData.createdBy,
					now,
				],
			});

			return { id, ...projectData, createdAt: now };
		} catch (error) {
			console.error("Error creating savings project:", error);
			throw error;
		}
	},

	async getAllSavingsProjects() {
		try {
			const result = await client.execute(`
        SELECT p.*, u.firstName, u.lastName 
        FROM savings_projects p
        JOIN users u ON p.createdBy = u.id
        ORDER BY p.createdAt DESC
      `);
			return result.rows;
		} catch (error) {
			console.error("Error getting savings projects:", error);
			throw error;
		}
	},

	async updateSavingsProject(id, projectData) {
		try {
			const {
				name,
				description,
				targetSavings,
				currentSavings,
				deadline,
			} = projectData;
			await client.execute({
				sql: `UPDATE savings_projects 
              SET name = ?, description = ?, targetSavings = ?, 
                  currentSavings = ?, deadline = ?
              WHERE id = ?`,
				args: [
					name,
					description,
					targetSavings,
					currentSavings,
					deadline,
					id,
				],
			});
			return { id, ...projectData };
		} catch (error) {
			console.error("Error updating savings project:", error);
			throw error;
		}
	},

	async deleteSavingsProject(id) {
		try {
			await client.execute({
				sql: "DELETE FROM savings_projects WHERE id = ?",
				args: [id],
			});
			return true;
		} catch (error) {
			console.error("Error deleting savings project:", error);
			throw error;
		}
	},

	// Task operations
	async createTask(taskData) {
		try {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();

			await client.execute({
				sql: `INSERT INTO tasks 
              (id, title, description, priority, assignedTo, createdBy, 
               dueDate, status, progress, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [
					id,
					taskData.title,
					taskData.description,
					taskData.priority,
					taskData.assignedTo,
					taskData.createdBy,
					taskData.dueDate,
					taskData.status || "pending",
					0,
					now,
				],
			});

			return { id, ...taskData, createdAt: now };
		} catch (error) {
			console.error("Error creating task:", error);
			throw error;
		}
	},

	async getAllTasks() {
		try {
			const result = await client.execute(`
        SELECT t.*, 
               c.firstName as creatorFirstName, 
               c.lastName as creatorLastName,
               a.firstName as assigneeFirstName, 
               a.lastName as assigneeLastName
        FROM tasks t
        JOIN users c ON t.createdBy = c.id
        JOIN users a ON t.assignedTo = a.id
        ORDER BY t.createdAt DESC
      `);
			return result.rows;
		} catch (error) {
			console.error("Error getting all tasks:", error);
			throw error;
		}
	},

	async getUserTasks(userId) {
		try {
			const result = await client.execute({
				sql: `SELECT t.*, 
                     c.firstName as creatorFirstName, 
                     c.lastName as creatorLastName,
                     a.firstName as assigneeFirstName, 
                     a.lastName as assigneeLastName
              FROM tasks t
              JOIN users c ON t.createdBy = c.id
              JOIN users a ON t.assignedTo = a.id
              WHERE t.assignedTo = ?
              ORDER BY t.createdAt DESC`,
				args: [userId],
			});
			return result.rows;
		} catch (error) {
			console.error("Error getting user tasks:", error);
			throw error;
		}
	},

	async updateTask(id, taskData) {
		try {
			const now = new Date().toISOString();
			await client.execute({
				sql: `UPDATE tasks 
              SET title = ?, description = ?, priority = ?, 
                  assignedTo = ?, dueDate = ?, status = ?,
                  lastModifiedAt = ?, lastModifiedBy = ?
              WHERE id = ?`,
				args: [
					taskData.title,
					taskData.description,
					taskData.priority,
					taskData.assignedTo,
					taskData.dueDate,
					taskData.status,
					now,
					taskData.lastModifiedBy,
					id,
				],
			});
			return { id, ...taskData, lastModifiedAt: now };
		} catch (error) {
			console.error("Error updating task:", error);
			throw error;
		}
	},

	async updateTaskProgress(id, progress, userId) {
		try {
			const now = new Date().toISOString();
			await client.execute({
				sql: `UPDATE tasks 
              SET progress = ?, lastModifiedAt = ?, lastModifiedBy = ?
              WHERE id = ?`,
				args: [progress, now, userId, id],
			});
			return {
				id,
				progress,
				lastModifiedAt: now,
				lastModifiedBy: userId,
			};
		} catch (error) {
			console.error("Error updating task progress:", error);
			throw error;
		}
	},

	async updateTaskStatus(id, status) {
		try {
			const now = new Date().toISOString();
			await client.execute({
				sql: `UPDATE tasks SET status = ?, lastModifiedAt = ? WHERE id = ?`,
				args: [status, now, id],
			});
			return { id, status, lastModifiedAt: now };
		} catch (error) {
			console.error("Error updating task status:", error);
			throw error;
		}
	},

	async deleteTask(id) {
		try {
			await client.execute({
				sql: "DELETE FROM tasks WHERE id = ?",
				args: [id],
			});
			return true;
		} catch (error) {
			console.error("Error deleting task:", error);
			throw error;
		}
	},
};
