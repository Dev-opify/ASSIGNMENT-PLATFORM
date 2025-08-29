
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./assignment_platform.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'assignment-platform-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
function initializeDatabase() {
    // Create tables
    const createTables = `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            deadline DATETIME NOT NULL,
            instructions TEXT,
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            assignment_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            repo_link TEXT NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'submitted',
            FOREIGN KEY (assignment_id) REFERENCES assignments (id),
            FOREIGN KEY (student_id) REFERENCES users (id),
            UNIQUE(assignment_id, student_id)
        );

        CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
        CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
    `;

    db.exec(createTables, (err) => {
        if (err) {
            console.error('Error creating tables:', err.message);
        } else {
            console.log('Database tables initialized');
            insertSampleData();
        }
    });
}

// Insert sample data
async function insertSampleData() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const sampleUsers = [
        ['prof1', 'prof.smith@university.edu', hashedPassword, 'Dr. Sarah Smith', 'professor'],
        ['stud1', 'john.doe@university.edu', hashedPassword, 'John Doe', 'student'],
        ['stud2', 'jane.smith@university.edu', hashedPassword, 'Jane Smith', 'student']
    ];

    const sampleAssignments = [
        ['assign1', 'Web Development Project', 'Create a responsive website using HTML, CSS, and JavaScript. Include at least 3 pages and implement modern design principles.', '2025-09-15T23:59:59', 'Submit your GitHub repository link containing the complete project code.', 'prof1'],
        ['assign2', 'Database Design Assignment', 'Design and implement a normalized database schema for a library management system.', '2025-09-20T23:59:59', 'Include ER diagram, SQL scripts, and documentation in your repository.', 'prof1']
    ];

    const sampleSubmissions = [
        ['sub1', 'assign1', 'stud1', 'https://github.com/johndoe/web-dev-project', 'submitted']
    ];

    // Insert sample users
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)');
    sampleUsers.forEach(user => insertUser.run(user));
    insertUser.finalize();

    // Insert sample assignments
    const insertAssignment = db.prepare('INSERT OR IGNORE INTO assignments (id, title, description, deadline, instructions, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    sampleAssignments.forEach(assignment => insertAssignment.run(assignment));
    insertAssignment.finalize();

    // Insert sample submissions
    const insertSubmission = db.prepare('INSERT OR IGNORE INTO submissions (id, assignment_id, student_id, repo_link, status) VALUES (?, ?, ?, ?, ?)');
    sampleSubmissions.forEach(submission => insertSubmission.run(submission));
    insertSubmission.finalize();

    console.log('Sample data inserted');
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (req.session.userRole !== role) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// API Routes

// Authentication
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            req.session.userId = user.id;
            req.session.userRole = user.role;

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Password comparison error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

app.get('/api/auth/user', requireAuth, (req, res) => {
    db.get('SELECT id, email, name, role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Assignments
app.get('/api/assignments', requireAuth, (req, res) => {
    const query = `
        SELECT a.*, u.name as creator_name 
        FROM assignments a 
        JOIN users u ON a.created_by = u.id 
        ORDER BY a.created_at DESC
    `;

    db.all(query, [], (err, assignments) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ assignments });
    });
});

app.post('/api/assignments', requireRole('professor'), (req, res) => {
    const { title, description, deadline, instructions } = req.body;
    const id = uuidv4();

    if (!title || !deadline) {
        return res.status(400).json({ error: 'Title and deadline are required' });
    }

    const query = 'INSERT INTO assignments (id, title, description, deadline, instructions, created_by) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [id, title, description, deadline, instructions, req.session.userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Get the created assignment
        db.get('SELECT a.*, u.name as creator_name FROM assignments a JOIN users u ON a.created_by = u.id WHERE a.id = ?', 
               [id], (err, assignment) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.status(201).json({ assignment });
        });
    });
});

app.put('/api/assignments/:id', requireRole('professor'), (req, res) => {
    const { title, description, deadline, instructions } = req.body;
    const assignmentId = req.params.id;

    if (!title || !deadline) {
        return res.status(400).json({ error: 'Title and deadline are required' });
    }

    const query = 'UPDATE assignments SET title = ?, description = ?, deadline = ?, instructions = ? WHERE id = ? AND created_by = ?';
    db.run(query, [title, description, deadline, instructions, assignmentId, req.session.userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Assignment not found or not authorized' });
        }

        res.json({ message: 'Assignment updated successfully' });
    });
});

app.delete('/api/assignments/:id', requireRole('professor'), (req, res) => {
    const assignmentId = req.params.id;

    db.run('DELETE FROM assignments WHERE id = ? AND created_by = ?', [assignmentId, req.session.userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Assignment not found or not authorized' });
        }

        res.json({ message: 'Assignment deleted successfully' });
    });
});

// Submissions
app.get('/api/submissions', requireAuth, (req, res) => {
    let query, params;

    if (req.session.userRole === 'professor') {
        // Professor sees all submissions
        query = `
            SELECT s.*, u.name as student_name, u.email as student_email, a.title as assignment_title
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
            ORDER BY s.submitted_at DESC
        `;
        params = [];
    } else {
        // Student sees only their submissions
        query = `
            SELECT s.*, a.title as assignment_title
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.student_id = ?
            ORDER BY s.submitted_at DESC
        `;
        params = [req.session.userId];
    }

    db.all(query, params, (err, submissions) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ submissions });
    });
});

app.post('/api/submissions', requireRole('student'), (req, res) => {
    const { assignmentId, repoLink } = req.body;

    if (!assignmentId || !repoLink) {
        return res.status(400).json({ error: 'Assignment ID and repository link are required' });
    }

    // Check if assignment exists and is not past deadline
    db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId], (err, assignment) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const now = new Date();
        const deadline = new Date(assignment.deadline);
        if (now > deadline) {
            return res.status(400).json({ error: 'Assignment deadline has passed' });
        }

        // Insert or update submission
        const id = uuidv4();
        const query = `
            INSERT INTO submissions (id, assignment_id, student_id, repo_link, status)
            VALUES (?, ?, ?, ?, 'submitted')
            ON CONFLICT(assignment_id, student_id)
            DO UPDATE SET repo_link = excluded.repo_link, submitted_at = CURRENT_TIMESTAMP
        `;

        db.run(query, [id, assignmentId, req.session.userId, repoLink], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Submission saved successfully' });
        });
    });
});

// Server-Sent Events for real-time updates
app.get('/api/submissions/stream', requireAuth, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        response: res
    };

    // Add client to list (in production, use Redis or similar)
    // For demo purposes, we'll use a simple array
    if (!global.sseClients) {
        global.sseClients = [];
    }
    global.sseClients.push(newClient);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}

`);

    // Handle client disconnect
    req.on('close', () => {
        global.sseClients = global.sseClients.filter(client => client.id !== clientId);
    });
});

// Helper function to broadcast to all SSE clients
function broadcastUpdate(data) {
    if (global.sseClients) {
        global.sseClients.forEach(client => {
            client.response.write(`data: ${JSON.stringify(data)}

`);
        });
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
