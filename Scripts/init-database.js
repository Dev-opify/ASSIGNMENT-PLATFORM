
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

console.log('Initializing Assignment Platform Database...');

// Create database connection
const db = new sqlite3.Database('./assignment_platform.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Database schema
const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('professor', 'student')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Assignments table
    CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        deadline DATETIME NOT NULL,
        instructions TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Submissions table
    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        repo_link TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
        FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(assignment_id, student_id)
    );

    -- Indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
    CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
`;

async function initializeDatabase() {
    try {
        // Create tables and indexes
        await new Promise((resolve, reject) => {
            db.exec(schema, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✓ Database tables and indexes created');

        // Create sample data
        await insertSampleData();
        console.log('✓ Sample data inserted');

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\nSample login credentials:');
        console.log('Professor: prof.smith@university.edu / password123');
        console.log('Student: john.doe@university.edu / password123');
        console.log('Student: jane.smith@university.edu / password123');

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

async function insertSampleData() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Sample users
    const users = [
        {
            id: uuidv4(),
            email: 'prof.smith@university.edu',
            password_hash: hashedPassword,
            name: 'Dr. Sarah Smith',
            role: 'professor'
        },
        {
            id: uuidv4(),
            email: 'john.doe@university.edu',
            password_hash: hashedPassword,
            name: 'John Doe',
            role: 'student'
        },
        {
            id: uuidv4(),
            email: 'jane.smith@university.edu',
            password_hash: hashedPassword,
            name: 'Jane Smith',
            role: 'student'
        }
    ];

    // Insert users
    const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)');
    for (const user of users) {
        insertUser.run([user.id, user.email, user.password_hash, user.name, user.role]);
    }
    insertUser.finalize();

    // Get professor ID for assignments
    const professor = users.find(u => u.role === 'professor');
    const student1 = users.find(u => u.email === 'john.doe@university.edu');

    // Sample assignments
    const assignments = [
        {
            id: uuidv4(),
            title: 'Web Development Project',
            description: 'Create a responsive website using HTML, CSS, and JavaScript. Include at least 3 pages and implement modern design principles. Focus on accessibility, performance, and mobile-first design.',
            deadline: '2025-09-15T23:59:59',
            instructions: 'Submit your GitHub repository link containing the complete project code. Ensure your README.md includes setup instructions and project description.',
            created_by: professor.id
        },
        {
            id: uuidv4(),
            title: 'Database Design Assignment',
            description: 'Design and implement a normalized database schema for a library management system. Include entity relationships, constraints, and sample data.',
            deadline: '2025-09-20T23:59:59',
            instructions: 'Include ER diagram, SQL scripts, and comprehensive documentation in your repository. Add sample queries demonstrating database functionality.',
            created_by: professor.id
        },
        {
            id: uuidv4(),
            title: 'Algorithm Analysis Report',
            description: 'Analyze the time and space complexity of various sorting algorithms. Implement at least 3 different sorting algorithms and compare their performance.',
            deadline: '2025-09-25T23:59:59',
            instructions: 'Submit code implementations with detailed analysis report. Include performance benchmarks and complexity analysis.',
            created_by: professor.id
        }
    ];

    // Insert assignments
    const insertAssignment = db.prepare('INSERT OR REPLACE INTO assignments (id, title, description, deadline, instructions, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    for (const assignment of assignments) {
        insertAssignment.run([assignment.id, assignment.title, assignment.description, assignment.deadline, assignment.instructions, assignment.created_by]);
    }
    insertAssignment.finalize();

    // Sample submission
    const submissions = [
        {
            id: uuidv4(),
            assignment_id: assignments[0].id,
            student_id: student1.id,
            repo_link: 'https://github.com/johndoe/web-development-project',
            status: 'submitted'
        }
    ];

    // Insert submissions
    const insertSubmission = db.prepare('INSERT OR REPLACE INTO submissions (id, assignment_id, student_id, repo_link, status) VALUES (?, ?, ?, ?, ?)');
    for (const submission of submissions) {
        insertSubmission.run([submission.id, submission.assignment_id, submission.student_id, submission.repo_link, submission.status]);
    }
    insertSubmission.finalize();
}

// Run initialization
initializeDatabase();
