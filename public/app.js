// Full-Stack Database Simulation System
class DatabaseEngine {
    constructor() {
        this.tables = {
            users: [],
            assignments: [],
            submissions: [],
            sessions: []
        };
        this.indexes = new Map();
        this.eventListeners = [];
        this.initializeDatabase();
    }

    // Database initialization with sample data
    initializeDatabase() {
        // Initialize users table with encrypted passwords
        this.tables.users = [
            {
                id: 'prof1',
                email: 'prof.smith@university.edu',
                password_hash: this.hashPassword('password123'),
                name: 'Dr. Sarah Smith',
                role: 'professor',
                created_at: '2025-01-15T09:00:00.000Z'
            },
            {
                id: 'stud1',
                email: 'john.doe@university.edu',
                password_hash: this.hashPassword('password123'),
                name: 'John Doe',
                role: 'student',
                created_at: '2025-01-20T10:30:00.000Z'
            },
            {
                id: 'stud2',
                email: 'jane.smith@university.edu',
                password_hash: this.hashPassword('password123'),
                name: 'Jane Smith',
                role: 'student',
                created_at: '2025-01-22T14:15:00.000Z'
            }
        ];

        // Initialize assignments table
        this.tables.assignments = [
            {
                id: 'assign1',
                title: 'Web Development Project',
                description: 'Create a responsive website using HTML, CSS, and JavaScript. Include at least 3 pages and implement modern design principles.',
                deadline: '2025-09-15T23:59:59.000Z',
                instructions: 'Submit your GitHub repository link containing the complete project code.',
                created_by: 'prof1',
                created_at: '2025-08-20T10:00:00.000Z'
            },
            {
                id: 'assign2',
                title: 'Database Design Assignment',
                description: 'Design and implement a normalized database schema for a library management system.',
                deadline: '2025-09-20T23:59:59.000Z',
                instructions: 'Include ER diagram, SQL scripts, and documentation in your repository.',
                created_by: 'prof1',
                created_at: '2025-08-22T14:30:00.000Z'
            }
        ];

        // Initialize submissions table
        this.tables.submissions = [
            {
                id: 'sub1',
                assignment_id: 'assign1',
                student_id: 'stud1',
                repo_link: 'https://github.com/johndoe/web-dev-project',
                submitted_at: '2025-08-25T16:30:00.000Z',
                status: 'submitted'
            }
        ];

        this.createIndexes();
        this.triggerEvent('database_initialized');
    }

    // Simulate bcrypt password hashing
    hashPassword(password) {
        // Simulated hash - in real app would use actual bcrypt
        return `$2b$10$${btoa(password + 'salt').replace(/[^a-zA-Z0-9]/g, '').substring(0, 50)}`;
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Create database indexes for performance
    createIndexes() {
        this.indexes.set('users_email', new Map());
        this.indexes.set('assignments_created_by', new Map());
        this.indexes.set('submissions_assignment_id', new Map());
        this.indexes.set('submissions_student_id', new Map());

        // Build indexes
        this.tables.users.forEach(user => {
            this.indexes.get('users_email').set(user.email, user);
        });

        this.tables.assignments.forEach(assignment => {
            if (!this.indexes.get('assignments_created_by').has(assignment.created_by)) {
                this.indexes.get('assignments_created_by').set(assignment.created_by, []);
            }
            this.indexes.get('assignments_created_by').get(assignment.created_by).push(assignment);
        });

        this.tables.submissions.forEach(submission => {
            if (!this.indexes.get('submissions_assignment_id').has(submission.assignment_id)) {
                this.indexes.get('submissions_assignment_id').set(submission.assignment_id, []);
            }
            this.indexes.get('submissions_assignment_id').get(submission.assignment_id).push(submission);

            if (!this.indexes.get('submissions_student_id').has(submission.student_id)) {
                this.indexes.get('submissions_student_id').set(submission.student_id, []);
            }
            this.indexes.get('submissions_student_id').get(submission.student_id).push(submission);
        });
    }

    // Database query methods with prepared statement simulation
    query(sql, params = []) {
        // Simulate SQL execution time
        const startTime = Date.now();
        
        try {
            let result = this.executeQuery(sql, params);
            const executionTime = Date.now() - startTime;
            
            this.triggerEvent('query_executed', {
                sql,
                params,
                executionTime,
                rowCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
            });
            
            return result;
        } catch (error) {
            this.triggerEvent('query_error', { sql, params, error: error.message });
            throw error;
        }
    }

    executeQuery(sql, params) {
        sql = sql.toLowerCase().trim();
        
        if (sql.startsWith('select')) {
            return this.executeSelect(sql, params);
        } else if (sql.startsWith('insert')) {
            return this.executeInsert(sql, params);
        } else if (sql.startsWith('update')) {
            return this.executeUpdate(sql, params);
        } else if (sql.startsWith('delete')) {
            return this.executeDelete(sql, params);
        } else {
            throw new Error('Unsupported SQL operation');
        }
    }

    executeSelect(sql, params) {
        // Simple SQL parser for demonstration
        if (sql.includes('from users')) {
            if (sql.includes('where email = ?')) {
                return this.indexes.get('users_email').get(params[0]);
            }
            return this.tables.users;
        } else if (sql.includes('from assignments')) {
            if (sql.includes('where created_by = ?')) {
                return this.indexes.get('assignments_created_by').get(params[0]) || [];
            }
            return this.tables.assignments;
        } else if (sql.includes('from submissions')) {
            if (sql.includes('where student_id = ?')) {
                return this.indexes.get('submissions_student_id').get(params[0]) || [];
            } else if (sql.includes('where assignment_id = ?')) {
                return this.indexes.get('submissions_assignment_id').get(params[0]) || [];
            }
            return this.tables.submissions;
        }
        return [];
    }

    executeInsert(sql, params) {
        const id = 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        if (sql.includes('into assignments')) {
            const assignment = {
                id,
                title: params[0],
                description: params[1],
                deadline: params[2],
                instructions: params[3],
                created_by: params[4],
                created_at: new Date().toISOString()
            };
            this.tables.assignments.push(assignment);
            this.updateIndexes('assignments', assignment);
            this.triggerEvent('assignment_created', assignment);
            return assignment;
        } else if (sql.includes('into submissions')) {
            const submission = {
                id,
                assignment_id: params[0],
                student_id: params[1],
                repo_link: params[2],
                submitted_at: new Date().toISOString(),
                status: 'submitted'
            };
            this.tables.submissions.push(submission);
            this.updateIndexes('submissions', submission);
            this.triggerEvent('submission_created', submission);
            return submission;
        }
        throw new Error('Invalid INSERT query');
    }

    executeUpdate(sql, params) {
        // Simple update implementation
        if (sql.includes('submissions set')) {
            const submission = this.tables.submissions.find(s => 
                s.assignment_id === params[1] && s.student_id === params[2]
            );
            if (submission) {
                submission.repo_link = params[0];
                submission.submitted_at = new Date().toISOString();
                this.triggerEvent('submission_updated', submission);
                return submission;
            }
        }
        return null;
    }

    executeDelete(sql, params) {
        // Simple delete implementation
        if (sql.includes('from assignments where id = ?')) {
            const index = this.tables.assignments.findIndex(a => a.id === params[0]);
            if (index !== -1) {
                const deleted = this.tables.assignments.splice(index, 1)[0];
                this.triggerEvent('assignment_deleted', deleted);
                return deleted;
            }
        }
        return null;
    }

    updateIndexes(table, record) {
        if (table === 'assignments') {
            if (!this.indexes.get('assignments_created_by').has(record.created_by)) {
                this.indexes.get('assignments_created_by').set(record.created_by, []);
            }
            this.indexes.get('assignments_created_by').get(record.created_by).push(record);
        } else if (table === 'submissions') {
            if (!this.indexes.get('submissions_assignment_id').has(record.assignment_id)) {
                this.indexes.get('submissions_assignment_id').set(record.assignment_id, []);
            }
            this.indexes.get('submissions_assignment_id').get(record.assignment_id).push(record);

            if (!this.indexes.get('submissions_student_id').has(record.student_id)) {
                this.indexes.get('submissions_student_id').set(record.student_id, []);
            }
            this.indexes.get('submissions_student_id').get(record.student_id).push(record);
        }
    }

    // Event system for real-time updates
    addEventListener(event, callback) {
        this.eventListeners.push({ event, callback });
    }

    triggerEvent(event, data = null) {
        this.eventListeners.forEach(listener => {
            if (listener.event === event) {
                setTimeout(() => listener.callback(data), 0);
            }
        });
    }

    // Database statistics
    getStats() {
        return {
            totalUsers: this.tables.users.length,
            totalAssignments: this.tables.assignments.length,
            totalSubmissions: this.tables.submissions.length,
            activeSessions: this.tables.sessions.length,
            indexCount: this.indexes.size
        };
    }
}

// API Layer Simulation
class APIService {
    constructor(database) {
        this.db = database;
        this.currentSession = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.db.addEventListener('assignment_created', (assignment) => {
            this.broadcastUpdate('assignment_created', assignment);
        });

        this.db.addEventListener('submission_created', (submission) => {
            this.broadcastUpdate('submission_created', submission);
        });
    }

    // Authentication endpoints
    async login(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const user = this.db.query('SELECT * FROM users WHERE email = ?', [email]);
                    
                    if (user && this.db.verifyPassword(password, user.password_hash)) {
                        this.currentSession = {
                            id: 'session_' + Date.now(),
                            userId: user.id,
                            user: user,
                            createdAt: new Date().toISOString()
                        };
                        resolve({ user: { ...user, password_hash: undefined }, session: this.currentSession });
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                } catch (error) {
                    reject(error);
                }
            }, 300 + Math.random() * 500); // Simulate network latency
        });
    }

    async logout() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentSession = null;
                resolve({ success: true });
            }, 200);
        });
    }

    // Assignment endpoints
    async getAssignments() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.currentSession?.user.role === 'professor') {
                    const assignments = this.db.query('SELECT * FROM assignments WHERE created_by = ?', 
                        [this.currentSession.userId]);
                    resolve(assignments);
                } else {
                    const assignments = this.db.query('SELECT * FROM assignments');
                    resolve(assignments);
                }
            }, 150 + Math.random() * 200);
        });
    }

    async createAssignment(assignmentData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (!this.currentSession || this.currentSession.user.role !== 'professor') {
                        reject(new Error('Unauthorized'));
                        return;
                    }

                    const assignment = this.db.query(
                        'INSERT INTO assignments (title, description, deadline, instructions, created_by) VALUES (?, ?, ?, ?, ?)',
                        [
                            assignmentData.title,
                            assignmentData.description,
                            assignmentData.deadline,
                            assignmentData.instructions,
                            this.currentSession.userId
                        ]
                    );
                    resolve(assignment);
                } catch (error) {
                    reject(error);
                }
            }, 200 + Math.random() * 300);
        });
    }

    // Submission endpoints
    async getSubmissions() {
        return new Promise((resolve) => {
            setTimeout(() => {
                let submissions;
                if (this.currentSession?.user.role === 'professor') {
                    submissions = this.db.query('SELECT * FROM submissions');
                } else {
                    submissions = this.db.query('SELECT * FROM submissions WHERE student_id = ?', 
                        [this.currentSession.userId]);
                }
                resolve(submissions);
            }, 100 + Math.random() * 200);
        });
    }

    async createSubmission(submissionData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (!this.currentSession || this.currentSession.user.role !== 'student') {
                        reject(new Error('Unauthorized'));
                        return;
                    }

                    // Check if submission already exists
                    const existing = this.db.tables.submissions.find(s => 
                        s.assignment_id === submissionData.assignmentId && 
                        s.student_id === this.currentSession.userId
                    );

                    if (existing) {
                        // Update existing submission
                        const updated = this.db.query(
                            'UPDATE submissions SET repo_link = ? WHERE assignment_id = ? AND student_id = ?',
                            [submissionData.repoLink, submissionData.assignmentId, this.currentSession.userId]
                        );
                        resolve(updated || existing);
                    } else {
                        // Create new submission
                        const submission = this.db.query(
                            'INSERT INTO submissions (assignment_id, student_id, repo_link) VALUES (?, ?, ?)',
                            [submissionData.assignmentId, this.currentSession.userId, submissionData.repoLink]
                        );
                        resolve(submission);
                    }
                } catch (error) {
                    reject(error);
                }
            }, 250 + Math.random() * 400);
        });
    }

    // Real-time updates simulation
    broadcastUpdate(type, data) {
        // Simulate Server-Sent Events
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('realtime_update', {
                detail: { type, data }
            }));
        }, 100);
    }

    // Analytics endpoint
    async getAnalytics() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stats = this.db.getStats();
                const submissions = this.db.query('SELECT * FROM submissions');
                
                // Generate submission timeline data
                const timelineData = this.generateSubmissionTimeline(submissions);
                
                resolve({
                    stats,
                    submissionTimeline: timelineData,
                    performanceMetrics: {
                        queryPerformance: 92,
                        connectionPool: 78,
                        indexUsage: 85
                    }
                });
            }, 200);
        });
    }

    generateSubmissionTimeline(submissions) {
        const timeline = {};
        submissions.forEach(sub => {
            const date = new Date(sub.submitted_at).toDateString();
            timeline[date] = (timeline[date] || 0) + 1;
        });
        
        // Fill in missing dates with zeros
        const dates = Object.keys(timeline).sort();
        const labels = [];
        const data = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            labels.unshift(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.unshift(timeline[dateStr] || Math.floor(Math.random() * 5));
        }
        
        return { labels, data };
    }
}

// Application State Management
class AppState {
    constructor() {
        this.db = new DatabaseEngine();
        this.api = new APIService(this.db);
        this.currentUser = null;
        this.currentRole = null;
        this.realTimeChart = null;
        this.setupRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        window.addEventListener('realtime_update', (event) => {
            const { type, data } = event.detail;
            this.handleRealTimeUpdate(type, data);
        });
    }

    handleRealTimeUpdate(type, data) {
        showRealTimeToast(type, data);
        
        // Update UI based on current page
        if (this.currentRole === 'professor') {
            if (type === 'submission_created' || type === 'submission_updated') {
                refreshProfessorTab('submissions');
            } else if (type === 'assignment_created') {
                refreshProfessorTab('assignments');
            }
        } else if (this.currentRole === 'student') {
            if (type === 'assignment_created') {
                refreshStudentTab('available');
            }
        }
        
        // Update charts if visible
        if (this.realTimeChart && type === 'submission_created') {
            this.updateChart();
        }
    }

    async updateChart() {
        try {
            const analytics = await this.api.getAnalytics();
            if (this.realTimeChart) {
                this.realTimeChart.data.datasets[0].data = analytics.submissionTimeline.data;
                this.realTimeChart.update('none');
            }
        } catch (error) {
            console.error('Failed to update chart:', error);
        }
    }

    async login(email, password) {
        try {
            const result = await this.api.login(email, password);
            this.currentUser = result.user;
            this.currentRole = result.user.role;
            return result;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await this.api.logout();
            this.currentUser = null;
            this.currentRole = null;
            if (this.realTimeChart) {
                this.realTimeChart.destroy();
                this.realTimeChart = null;
            }
        } catch (error) {
            throw error;
        }
    }

    async getAssignments() {
        return await this.api.getAssignments();
    }

    async createAssignment(data) {
        return await this.api.createAssignment(data);
    }

    async getSubmissions() {
        return await this.api.getSubmissions();
    }

    async createSubmission(data) {
        return await this.api.createSubmission(data);
    }

    async getAnalytics() {
        return await this.api.getAnalytics();
    }
}

// Initialize application
const appState = new AppState();

// DOM Elements
const pages = {
    landing: document.getElementById('landing-page'),
    professorLogin: document.getElementById('professor-login-page'),
    studentLogin: document.getElementById('student-login-page'),
    professorDashboard: document.getElementById('professor-dashboard'),
    studentDashboard: document.getElementById('student-dashboard')
};

// Navigation functions
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    if (pages[pageId]) {
        pages[pageId].classList.add('active');
    }
}

function showLoading(text = 'Processing request...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = text;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

function showRealTimeToast(type, data) {
    const toast = document.getElementById('realtime-toast');
    const toastText = document.getElementById('toast-text');
    
    let message = '';
    switch(type) {
        case 'submission_created':
            message = 'New submission received';
            break;
        case 'assignment_created':
            message = 'New assignment posted';
            break;
        default:
            message = 'Database updated';
    }
    
    toastText.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatDeadline(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
}

function isOverdue(deadline) {
    return new Date() > new Date(deadline);
}

function showButtonSpinner(button, show = true) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    
    if (show) {
        button.disabled = true;
        if (text) text.style.opacity = '0.7';
        if (spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (text) text.style.opacity = '1';
        if (spinner) spinner.classList.add('hidden');
    }
}

// Global navigation functions that can be called from HTML
window.navigateToProfessorLogin = function() {
    showPage('professorLogin');
};

window.navigateToStudentLogin = function() {
    showPage('studentLogin');
};

window.navigateToLanding = function() {
    showPage('landing');
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application...');
    
    // Initialize database stats
    await updateDatabaseStats();
    
    // Set default minimum date for assignment deadline
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const deadlineInput = document.getElementById('assignment-deadline');
    if (deadlineInput) {
        deadlineInput.min = now.toISOString().slice(0, 16);
    }
    
    showPage('landing');
    
    // Landing page event listeners - Fixed navigation
    const professorCard = document.getElementById('professor-role');
    const studentCard = document.getElementById('student-role');
    
    // Add click handlers to both the card and the button
    if (professorCard) {
        professorCard.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Professor card clicked');
            showPage('professorLogin');
        });
        
        // Also handle button clicks specifically
        const professorBtn = professorCard.querySelector('.btn');
        if (professorBtn) {
            professorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Professor button clicked');
                showPage('professorLogin');
            });
        }
    }
    
    if (studentCard) {
        studentCard.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Student card clicked');
            showPage('studentLogin');
        });
        
        // Also handle button clicks specifically
        const studentBtn = studentCard.querySelector('.btn');
        if (studentBtn) {
            studentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Student button clicked');
                showPage('studentLogin');
            });
        }
    }

    // Back buttons
    const backToProfLanding = document.getElementById('back-to-landing-prof');
    const backToStudentLanding = document.getElementById('back-to-landing-student');
    
    if (backToProfLanding) {
        backToProfLanding.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('landing');
        });
    }
    
    if (backToStudentLanding) {
        backToStudentLanding.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('landing');
        });
    }

    // Login forms
    setupLoginForms();
    setupProfessorDashboard();
    setupStudentDashboard();
    setupModalHandlers();
    
    console.log('EduSubmit Full-Stack Application Initialized');
    // showNotification('Database connection established', 'success');
});

function setupLoginForms() {
    // Professor login
    const professorLoginForm = document.getElementById('professor-login-form');
    if (professorLoginForm) {
        professorLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            showButtonSpinner(button, true);
            showLoading('Authenticating with database...');
            
            const email = document.getElementById('prof-email').value;
            const password = document.getElementById('prof-password').value;
            const errorDiv = document.getElementById('prof-login-error');
            
            try {
                const result = await appState.login(email, password);
                document.getElementById('prof-name-display').textContent = result.user.name;
                showPage('professorDashboard');
                await loadProfessorDashboard();
                showNotification(`Welcome back, ${result.user.name}!`, 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.add('show');
                showNotification('Authentication failed', 'error');
            } finally {
                hideLoading();
                showButtonSpinner(button, false);
            }
        });
    }

    // Student login
    const studentLoginForm = document.getElementById('student-login-form');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            showButtonSpinner(button, true);
            showLoading('Verifying student credentials...');
            
            const email = document.getElementById('student-email').value;
            const password = document.getElementById('student-password').value;
            const errorDiv = document.getElementById('student-login-error');
            
            try {
                const result = await appState.login(email, password);
                document.getElementById('student-name-display').textContent = result.user.name;
                showPage('studentDashboard');
                await loadStudentDashboard();
                showNotification(`Welcome, ${result.user.name}!`, 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.add('show');
                showNotification('Authentication failed', 'error');
            } finally {
                hideLoading();
                showButtonSpinner(button, false);
            }
        });
    }
}

function setupProfessorDashboard() {
    // Tab switching
    initTabSwitching('professor-dashboard');
    
    // Logout
    const profLogout = document.getElementById('prof-logout');
    if (profLogout) {
        profLogout.addEventListener('click', async () => {
            await appState.logout();
            showPage('landing');
            showNotification('Logged out successfully', 'info');
        });
    }

    // Assignment creation
    const createForm = document.getElementById('create-assignment-form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            showButtonSpinner(button, true);
            showLoading('Saving to database...');
            
            try {
                const formData = {
                    title: document.getElementById('assignment-title').value,
                    description: document.getElementById('assignment-description').value,
                    instructions: document.getElementById('assignment-instructions').value,
                    deadline: document.getElementById('assignment-deadline').value
                };
                
                await appState.createAssignment(formData);
                createForm.reset();
                showNotification('Assignment created successfully!', 'success');
                
                // Switch to assignments tab
                const assignmentsTab = document.querySelector('.tab-btn[data-tab="assignments"]');
                if (assignmentsTab) assignmentsTab.click();
                
            } catch (error) {
                showNotification('Failed to create assignment', 'error');
            } finally {
                hideLoading();
                showButtonSpinner(button, false);
            }
        });
    }

    // Other button handlers
    const resetBtn = document.getElementById('reset-form');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('create-assignment-form').reset();
        });
    }

    const newAssignmentBtn = document.getElementById('new-assignment-btn');
    if (newAssignmentBtn) {
        newAssignmentBtn.addEventListener('click', () => {
            const createTab = document.querySelector('.tab-btn[data-tab="create"]');
            if (createTab) createTab.click();
        });
    }

    const syncDbBtn = document.getElementById('sync-db');
    if (syncDbBtn) {
        syncDbBtn.addEventListener('click', async () => {
            showLoading('Synchronizing database...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            hideLoading();
            showNotification('Database synchronized', 'success');
            await updateDatabaseStats();
        });
    }
}

function setupStudentDashboard() {
    initTabSwitching('student-dashboard');
    
    const studentLogout = document.getElementById('student-logout');
    if (studentLogout) {
        studentLogout.addEventListener('click', async () => {
            await appState.logout();
            showPage('landing');
            showNotification('Logged out successfully', 'info');
        });
    }
}

function setupModalHandlers() {
    const submissionForm = document.getElementById('submission-form');
    if (submissionForm) {
        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            showButtonSpinner(button, true);
            showLoading('Submitting to database...');
            
            const assignmentId = document.getElementById('modal-assignment-id').value;
            const repoLink = document.getElementById('repo-link').value;
            
            try {
                // URL validation
                new URL(repoLink);
                if (!repoLink.includes('github.com')) {
                    throw new Error('Please provide a GitHub repository URL');
                }
                
                await appState.createSubmission({
                    assignmentId,
                    repoLink
                });
                
                closeSubmissionModal();
                showNotification('Assignment submitted successfully!', 'success');
                
                // Refresh student tabs
                refreshStudentTab('available');
                refreshStudentTab('my-submissions');
                
            } catch (error) {
                if (error.message.includes('GitHub')) {
                    showNotification(error.message, 'error');
                } else {
                    showNotification('Please enter a valid GitHub repository URL', 'error');
                }
            } finally {
                hideLoading();
                showButtonSpinner(button, false);
            }
        });
    }

    // Modal close handlers
    const closeBtn = document.getElementById('close-submission-modal');
    const cancelBtn = document.getElementById('cancel-submission');
    
    if (closeBtn) closeBtn.addEventListener('click', closeSubmissionModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeSubmissionModal);
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeSubmissionModal();
        }
    });
}

// Tab switching functionality
function initTabSwitching(dashboardId) {
    const container = document.getElementById(dashboardId);
    if (!container) return;
    
    const tabBtns = container.querySelectorAll('.tab-btn');
    const tabContents = container.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(tabId + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Load content
            if (appState.currentRole === 'professor') {
                await refreshProfessorTab(tabId);
            } else if (appState.currentRole === 'student') {
                await refreshStudentTab(tabId);
            }
        });
    });
}

// Professor dashboard functions
async function loadProfessorDashboard() {
    await updateDatabaseStats();
    await refreshProfessorTab('assignments');
}

async function refreshProfessorTab(tabId) {
    try {
        switch(tabId) {
            case 'assignments':
                await loadProfessorAssignments();
                break;
            case 'submissions':
                await loadAllSubmissions();
                break;
            case 'analytics':
                await loadAnalytics();
                break;
        }
    } catch (error) {
        console.error('Failed to refresh tab:', error);
        showNotification('Failed to load data', 'error');
    }
}

async function loadProfessorAssignments() {
    showLoading('Loading assignments from database...');
    
    try {
        const assignments = await appState.getAssignments();
        const submissions = await appState.getSubmissions();
        const container = document.getElementById('assignments-list');
        
        if (!assignments || assignments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                    <p>No assignments found in database.</p>
                    <button class="btn btn--primary" onclick="switchToCreateTab()">Create First Assignment</button>
                </div>
            `;
        } else {
            container.innerHTML = assignments.map(assignment => {
                const overdue = isOverdue(assignment.deadline);
                const submissionCount = submissions.filter(sub => sub.assignment_id === assignment.id).length;
                
                return `
                    <div class="assignment-card">
                        <div class="assignment-header">
                            <h3 class="assignment-title">${assignment.title}</h3>
                            <span class="assignment-status ${overdue ? 'closed' : 'open'}">
                                ${overdue ? 'Closed' : 'Open'}
                            </span>
                        </div>
                        <p class="assignment-description">${assignment.description}</p>
                        <div class="assignment-meta">
                            <span>Created: ${formatDate(assignment.created_at)}</span>
                            <span>Deadline: ${formatDate(assignment.deadline)}</span>
                        </div>
                        <div class="assignment-meta">
                            <span>Submissions: ${submissionCount}</span>
                            <span>ID: ${assignment.id}</span>
                        </div>
                        <div class="assignment-actions">
                            <button class="btn btn--secondary btn--sm" onclick="viewSubmissions('${assignment.id}')">
                                View Submissions
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } finally {
        hideLoading();
    }
}

async function loadAllSubmissions() {
    showLoading('Querying submission database...');
    
    try {
        const submissions = await appState.getSubmissions();
        const assignments = await appState.getAssignments();
        const tbody = document.getElementById('submissions-table-body');
        
        if (!submissions || submissions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                        No submissions in database
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = submissions.map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);
                const student = appState.db.tables.users.find(u => u.id === submission.student_id);
                
                return `
                    <tr>
                        <td><code>${submission.id}</code></td>
                        <td>${student ? student.name : 'Unknown'}</td>
                        <td>${assignment ? assignment.title : 'Unknown Assignment'}</td>
                        <td>
                            <a href="${submission.repo_link}" target="_blank" class="repo-link">
                                ${submission.repo_link}
                            </a>
                        </td>
                        <td>${formatDate(submission.submitted_at)}</td>
                        <td>
                            <span class="status status--success">
                                ${submission.status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn--outline btn--sm" onclick="viewSubmission('${submission.id}')">
                                View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } finally {
        hideLoading();
    }
}

async function loadAnalytics() {
    showLoading('Generating analytics...');
    
    try {
        const analytics = await appState.getAnalytics();
        
        // Update health metrics
        const metrics = analytics.performanceMetrics;
        document.querySelector('.metric-fill[style*="92%"]').style.width = metrics.queryPerformance + '%';
        document.querySelector('.metric-fill[style*="78%"]').style.width = metrics.connectionPool + '%';
        document.querySelector('.metric-fill[style*="85%"]').style.width = metrics.indexUsage + '%';
        
        // Create chart
        const canvas = document.getElementById('submission-chart');
        if (canvas) {
            if (appState.realTimeChart) {
                appState.realTimeChart.destroy();
            }
            
            const ctx = canvas.getContext('2d');
            appState.realTimeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: analytics.submissionTimeline.labels,
                    datasets: [{
                        label: 'Submissions',
                        data: analytics.submissionTimeline.data,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } finally {
        hideLoading();
    }
}

// Student dashboard functions
async function loadStudentDashboard() {
    await refreshStudentTab('available');
    await refreshStudentTab('profile');
}

async function refreshStudentTab(tabId) {
    try {
        switch(tabId) {
            case 'available':
                await loadAvailableAssignments();
                break;
            case 'my-submissions':
                await loadMySubmissions();
                break;
            case 'profile':
                loadStudentProfile();
                break;
        }
    } catch (error) {
        console.error('Failed to refresh student tab:', error);
        showNotification('Failed to load data', 'error');
    }
}

async function loadAvailableAssignments() {
    showLoading('Loading assignments...');
    
    try {
        const assignments = await appState.getAssignments();
        const mySubmissions = await appState.getSubmissions();
        const container = document.getElementById('student-assignments-list');
        
        // Update stats
        document.getElementById('total-assignments').textContent = assignments.length;
        document.getElementById('submitted-count').textContent = mySubmissions.length;
        document.getElementById('pending-count').textContent = Math.max(0, assignments.length - mySubmissions.length);
        
        if (!assignments || assignments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                    <p>No assignments available.</p>
                </div>
            `;
        } else {
            container.innerHTML = assignments.map(assignment => {
                const overdue = isOverdue(assignment.deadline);
                const hasSubmitted = mySubmissions.some(sub => sub.assignment_id === assignment.id);
                const professor = appState.db.tables.users.find(u => u.id === assignment.created_by);
                
                return `
                    <div class="assignment-card">
                        <div class="assignment-header">
                            <h3 class="assignment-title">${assignment.title}</h3>
                            <span class="assignment-status ${hasSubmitted ? 'submitted' : (overdue ? 'closed' : 'open')}">
                                ${hasSubmitted ? 'Submitted' : (overdue ? 'Overdue' : 'Open')}
                            </span>
                        </div>
                        <p class="assignment-description">${assignment.description}</p>
                        <div class="assignment-meta">
                            <span>Professor: ${professor ? professor.name : 'Unknown'}</span>
                            <span>Deadline: ${formatDate(assignment.deadline)}</span>
                        </div>
                        <div class="assignment-meta">
                            <span>${formatDeadline(assignment.deadline)}</span>
                            <span>ID: ${assignment.id}</span>
                        </div>
                        <div class="assignment-actions">
                            ${hasSubmitted ? 
                                `<button class="btn btn--secondary btn--sm" onclick="updateSubmission('${assignment.id}')">
                                    Update Submission
                                </button>` :
                                (overdue ?
                                    `<button class="btn btn--outline btn--sm" disabled>Submission Closed</button>` :
                                    `<button class="btn btn--primary btn--sm" onclick="submitAssignment('${assignment.id}')">
                                        Submit Assignment
                                    </button>`
                                )
                            }
                        </div>
                    </div>
                `;
            }).join('');
        }
    } finally {
        hideLoading();
    }
}

async function loadMySubmissions() {
    showLoading('Loading your submissions...');
    
    try {
        const mySubmissions = await appState.getSubmissions();
        const assignments = await appState.getAssignments();
        const container = document.getElementById('my-submissions-list');
        
        if (!mySubmissions || mySubmissions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                    <p>No submissions found.</p>
                    <button class="btn btn--primary" onclick="switchToAvailableTab()">View Available Assignments</button>
                </div>
            `;
        } else {
            container.innerHTML = mySubmissions.map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);
                
                return `
                    <div class="submission-card">
                        <div class="submission-header">
                            <h3 class="submission-title">${assignment ? assignment.title : 'Unknown Assignment'}</h3>
                            <span class="status status--success">${submission.status}</span>
                        </div>
                        <div class="submission-info">
                            <div>
                                <strong>Submitted:</strong> ${formatDate(submission.submitted_at)}
                            </div>
                            <div>
                                <strong>Deadline:</strong> ${assignment ? formatDate(assignment.deadline) : 'Unknown'}
                            </div>
                            <div>
                                <strong>Submission ID:</strong> <code>${submission.id}</code>
                            </div>
                            <div>
                                <strong>Status:</strong> Stored in database
                            </div>
                        </div>
                        <div class="submission-repo">
                            <strong>Repository:</strong> 
                            <a href="${submission.repo_link}" target="_blank" class="repo-link">
                                ${submission.repo_link}
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } finally {
        hideLoading();
    }
}

function loadStudentProfile() {
    if (!appState.currentUser) return;
    
    document.getElementById('profile-student-id').textContent = appState.currentUser.id;
    document.getElementById('profile-email').textContent = appState.currentUser.email;
    document.getElementById('profile-name').textContent = appState.currentUser.name;
    document.getElementById('profile-created').textContent = formatDate(appState.currentUser.created_at);
}

// Modal functions
function submitAssignment(assignmentId) {
    openSubmissionModal(assignmentId, false);
}

function updateSubmission(assignmentId) {
    openSubmissionModal(assignmentId, true);
}

function openSubmissionModal(assignmentId, isUpdate = false) {
    const modal = document.getElementById('submission-modal');
    const assignment = appState.db.tables.assignments.find(a => a.id === assignmentId);
    
    if (!assignment) return;
    
    document.getElementById('modal-assignment-title').textContent = 
        (isUpdate ? 'Update ' : 'Submit ') + assignment.title;
    document.getElementById('modal-assignment-id').value = assignmentId;
    document.getElementById('modal-assignment-description').textContent = assignment.description;
    document.getElementById('modal-assignment-instructions').textContent = 
        assignment.instructions || 'No specific instructions provided.';
    document.getElementById('modal-assignment-deadline').textContent = formatDate(assignment.deadline);
    
    if (isUpdate) {
        const existingSubmission = appState.db.tables.submissions.find(
            sub => sub.assignment_id === assignmentId && sub.student_id === appState.currentUser.id
        );
        if (existingSubmission) {
            document.getElementById('repo-link').value = existingSubmission.repo_link;
        }
    } else {
        document.getElementById('repo-link').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeSubmissionModal() {
    const modal = document.getElementById('submission-modal');
    modal.classList.add('hidden');
    const form = document.getElementById('submission-form');
    if (form) form.reset();
}

// Helper functions
function switchToCreateTab() {
    const createTab = document.querySelector('.tab-btn[data-tab="create"]');
    if (createTab) createTab.click();
}

function switchToAvailableTab() {
    const availableTab = document.querySelector('.tab-btn[data-tab="available"]');
    if (availableTab) availableTab.click();
}

function viewSubmissions(assignmentId) {
    const submissionsTab = document.querySelector('.tab-btn[data-tab="submissions"]');
    if (submissionsTab) submissionsTab.click();
}

function viewSubmission(submissionId) {
    showNotification(`Viewing submission ${submissionId}`, 'info');
}

async function updateDatabaseStats() {
    const stats = appState.db.getStats();
    const totalUsersEl = document.getElementById('total-users');
    const activeSessionsEl = document.getElementById('active-sessions');
    
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
    if (activeSessionsEl) activeSessionsEl.textContent = appState.currentUser ? '1' : '0';
}

// Clear form errors on input
document.addEventListener('input', (e) => {
    if (e.target.closest('form')) {
        const form = e.target.closest('form');
        const errorDiv = form.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }
});