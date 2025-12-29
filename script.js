// Fee Management App - Complete Version with Messaging
class FeeManager {
    constructor() {
        this.currentStudentId = null;
        this.selectedStudents = new Set();
        this.students = [];
        this.payments = [];
    }

    async init() {
        this.setupEventListeners();
        this.loadData();
        this.renderStudents();
        this.renderDueStudents();
    }

    loadData() {
        try {
            this.students = JSON.parse(localStorage.getItem('students') || '[]');
            this.payments = JSON.parse(localStorage.getItem('payments') || '[]');

            this.students = this.students.map(student => ({
                ...student,
                monthlyFee: Number(student.monthlyFee) || 0,
                totalPaid: Number(student.totalPaid) || 0
            }));

            console.log('Data loaded successfully:', this.students.length, 'students');
        } catch (error) {
            console.error('Failed to load data:', error);
            this.students = [];
            this.payments = [];
        }
    }

    setupEventListeners() {
        document.getElementById('studentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });

        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordPayment();
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('paymentModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('paymentModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    navigateToPage(pageId) {
        const pages = document.querySelectorAll('.page');
        const currentPage = document.querySelector('.page.active');

        pages.forEach(page => page.classList.remove('active', 'leaving-left', 'leaving-right'));

        if (currentPage) {
            currentPage.classList.add('leaving-left');
        }

        setTimeout(() => {
            pages.forEach(page => page.classList.remove('leaving-left', 'leaving-right'));
            document.getElementById(pageId).classList.add('active');
        }, 150);
    }

    addStudent() {
        const name = document.getElementById('studentName').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
        const studentClass = document.getElementById('studentClass').value.trim();
        const admissionDate = document.getElementById('admissionDate').value;
        const monthlyFeeInput = document.getElementById('monthlyFee').value;
        const monthlyFee = parseFloat(monthlyFeeInput);

        if (!name || !phone || !studentClass || !admissionDate || !monthlyFee || monthlyFee <= 0) {
            alert('Please fill all fields with valid data');
            return;
        }

        const student = {
            id: Date.now(),
            name: name,
            phone: phone,
            class: studentClass,
            monthlyFee: monthlyFee,
            totalPaid: 0,
            admissionDate: admissionDate,
            lastPaymentDate: null,
            status: 'active'
        };

        this.students.push(student);
        this.saveData();
        this.renderStudents();
        this.renderDueStudents();

        // Clear form
        document.getElementById('studentForm').reset();
        alert('Student added successfully!');
    }

    recordPayment() {
        const studentId = parseInt(document.getElementById('paymentStudentId').value);
        const amount = parseFloat(document.getElementById('paymentAmount').value);

        if (!amount || amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        const student = this.students.find(s => s.id === studentId);
        if (!student) {
            alert('Student not found');
            return;
        }

        student.totalPaid += amount;
        student.lastPaymentDate = new Date().toISOString().split('T')[0];

        const payment = {
            id: Date.now(),
            studentId: studentId,
            amount: amount,
            date: new Date().toISOString()
        };

        this.payments.push(payment);
        this.saveData();
        this.renderStudents();
        this.renderDueStudents();

        document.getElementById('paymentModal').style.display = 'none';
        document.getElementById('paymentForm').reset();
        alert('Payment recorded successfully!');
    }

    renderStudents() {
        const container = document.getElementById('studentsList');
        container.innerHTML = '';

        if (this.students.length === 0) {
            container.innerHTML = '<p>No students added yet.</p>';
            return;
        }

        // Group students by class
        const studentsByClass = {};
        this.students.forEach(student => {
            const className = student.class || 'No Class';
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            studentsByClass[className].push(student);
        });

        // Sort classes
        const sortedClasses = Object.keys(studentsByClass).sort((a, b) => {
            const aNum = parseInt(a) || 0;
            const bNum = parseInt(b) || 0;
            if (aNum !== bNum) return aNum - bNum;
            return a.localeCompare(b);
        });

        sortedClasses.forEach(className => {
            // Add class header
            const classHeader = document.createElement('div');
            classHeader.className = 'class-header';
            classHeader.innerHTML = `<h3>Class ${className}</h3>`;
            container.appendChild(classHeader);

            // Add students for this class
            studentsByClass[className].forEach(student => {
                const nextDueDate = this.getNextDueDate(student.admissionDate);
                const isDue = this.isPaymentDue(student);
                const statusClass = isDue ? 'status-overdue' : 'status-paid';
                const statusText = isDue ? 'Due' : 'Paid';
                const isSelected = this.selectedStudents.has(student.id);
                const selectButtonClass = isSelected ? 'select-button selected' : 'select-button';
                const selectButtonText = isSelected ? '✓ Selected' : 'Select';

                const monthlyFee = Number(student.monthlyFee) || 0;
                const totalPaid = Number(student.totalPaid) || 0;

                const card = document.createElement('div');
                card.className = 'student-card';
                card.innerHTML = `
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <span class="student-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="fee-details">
                        <span>Phone: ${student.phone}</span>
                        <span>Class: ${student.class || 'N/A'}</span>
                    </div>
                    <div class="fee-details">
                        <span>Monthly Fee: ₹${monthlyFee.toLocaleString()}</span>
                        <span>Admission: ${new Date(student.admissionDate).toLocaleDateString()}</span>
                    </div>
                    <div class="fee-details">
                        <span>Next Due: ${nextDueDate.toLocaleDateString()}</span>
                        <span>Total Paid: ₹${totalPaid.toLocaleString()}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="${selectButtonClass}" onclick="app.toggleSelect(${student.id})">${selectButtonText}</button>
                        ${isDue ? `<button class="paid-button" onclick="app.recordPaymentModal(${student.id})">Record Payment</button>` : '<span class="paid-text">✓ Paid this month</span>'}
                    </div>
                `;

                container.appendChild(card);
            });
        });
    }

    renderDueStudents() {
        const container = document.getElementById('dueStudentsList');
        container.innerHTML = '';

        const dueStudents = this.students.filter(student => this.isPaymentDue(student));

        if (dueStudents.length === 0) {
            container.innerHTML = '<p>No students with due payments.</p>';
            return;
        }

        dueStudents.forEach(student => {
            const nextDueDate = this.getNextDueDate(student.admissionDate);
            const monthlyFee = Number(student.monthlyFee) || 0;
            const totalPaid = Number(student.totalPaid) || 0;
            const isSelected = this.selectedStudents.has(student.id);
            const selectButtonClass = isSelected ? 'select-button selected' : 'select-button';
            const selectButtonText = isSelected ? '✓ Selected' : 'Select';

            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <span class="student-status status-overdue">Due</span>
                </div>
                <div class="fee-details">
                    <span>Phone: ${student.phone}</span>
                    <span>Class: ${student.class || 'N/A'}</span>
                </div>
                <div class="fee-details">
                    <span>Monthly Fee: ₹${monthlyFee.toLocaleString()}</span>
                    <span>Next Due: ${nextDueDate.toLocaleDateString()}</span>
                </div>
                <div class="fee-details">
                    <span>Total Paid: ₹${totalPaid.toLocaleString()}</span>
                </div>
                <div class="action-buttons">
                    <button class="${selectButtonClass}" onclick="app.toggleSelect(${student.id})">${selectButtonText}</button>
                    <button class="paid-button" onclick="app.recordPaymentModal(${student.id})">Record Payment</button>
                </div>
            `;

            container.appendChild(card);
        });
    }

    recordPaymentModal(studentId) {
        this.currentStudentId = studentId;
        document.getElementById('paymentStudentId').value = studentId;
        document.getElementById('paymentModal').style.display = 'block';
    }

    toggleSelect(studentId) {
        if (this.selectedStudents.has(studentId)) {
            this.selectedStudents.delete(studentId);
        } else {
            this.selectedStudents.add(studentId);
        }
        // Re-render to update selection state
        this.renderStudents();
        this.renderDueStudents();
    }

    getNextDueDate(admissionDate) {
        const admission = new Date(admissionDate);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let dueDate = new Date(currentYear, currentMonth, admission.getDate());

        if (dueDate <= now) {
            dueDate = new Date(currentYear, currentMonth + 1, admission.getDate());
        }

        return dueDate;
    }

    isPaymentDue(student) {
        if (!student.lastPaymentDate) return true;

        const lastPayment = new Date(student.lastPaymentDate);
        const nextDueDate = this.getNextDueDate(student.admissionDate);
        const now = new Date();

        return now >= nextDueDate && lastPayment < nextDueDate;
    }

    saveData() {
        try {
            localStorage.setItem('students', JSON.stringify(this.students));
            localStorage.setItem('payments', JSON.stringify(this.payments));
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('students');
            localStorage.removeItem('payments');
            this.students = [];
            this.payments = [];
            this.renderStudents();
            this.renderDueStudents();
            alert('All data cleared successfully!');
        }
    }

    // Messaging functionality - Opens default messaging app
    openMessagingAppForUnpaid() {
        const dueStudents = this.students.filter(student => this.isPaymentDue(student));
        if (dueStudents.length === 0) {
            alert('No students with due payments.');
            return;
        }

        const message = document.getElementById('messageText').value.trim();
        if (!message) {
            alert('Please enter a message.');
            return;
        }

        // Get all phone numbers from due students
        const phoneNumbers = dueStudents.map(student => student.phone).join(',');

        // Create SMS URL that opens default messaging app
        const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;

        try {
            // Open the messaging app
            window.open(smsUrl, '_blank');

            const statusDiv = document.getElementById('messageStatus');
            statusDiv.textContent = `Opening messaging app with ${dueStudents.length} recipients...`;

            // Clear the message after a short delay
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);

        } catch (error) {
            console.error('Error opening messaging app:', error);
            alert('Unable to open messaging app. Please check your device settings.');
        }
    }

    openMessagingAppForSelected() {
        if (this.selectedStudents.size === 0) {
            alert('No students selected.');
            return;
        }

        const message = document.getElementById('messageText').value.trim();
        if (!message) {
            alert('Please enter a message.');
            return;
        }

        // Get all phone numbers from selected students
        const selectedStudentsList = Array.from(this.selectedStudents).map(studentId =>
            this.students.find(s => s.id === studentId)
        ).filter(student => student); // Filter out any null students

        const phoneNumbers = selectedStudentsList.map(student => student.phone).join(',');

        // Create SMS URL that opens default messaging app
        const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;

        try {
            // Open the messaging app
            window.open(smsUrl, '_blank');

            const statusDiv = document.getElementById('messageStatus');
            statusDiv.textContent = `Opening messaging app with ${selectedStudentsList.length} recipients...`;

            // Clear the message after a short delay
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);

            // Clear selection after opening messaging app
            this.selectedStudents.clear();

        } catch (error) {
            console.error('Error opening messaging app:', error);
            alert('Unable to open messaging app. Please check your device settings.');
        }
    }

    openMessagingAppForPaid() {
        const paidStudents = this.students.filter(student => !this.isPaymentDue(student));
        if (paidStudents.length === 0) {
            alert('No students with paid fees.');
            return;
        }

        const message = document.getElementById('messageText').value.trim();
        if (!message) {
            alert('Please enter a message.');
            return;
        }

        // Get all phone numbers from paid students
        const phoneNumbers = paidStudents.map(student => student.phone).join(',');

        // Create SMS URL that opens default messaging app
        const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;

        try {
            // Open the messaging app
            window.open(smsUrl, '_blank');

            const statusDiv = document.getElementById('messageStatus');
            statusDiv.textContent = `Opening messaging app with ${paidStudents.length} recipients...`;

            // Clear the message after a short delay
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);

        } catch (error) {
            console.error('Error opening messaging app:', error);
            alert('Unable to open messaging app. Please check your device settings.');
        }
    }

    checkOverduePayments() {
        const dueStudents = this.students.filter(student => this.isPaymentDue(student));
        if (dueStudents.length > 0) {
            console.log(`Found ${dueStudents.length} students with overdue payments`);
        }
    }
}

// Authentication functions
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerError').textContent = '';
    document.getElementById('loginError').textContent = '';
}

function login() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');

    if (!phone || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
        // Store current user session
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Hide auth overlay and show app
        document.getElementById('authOverlay').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block';
        errorDiv.textContent = '';
    } else {
        errorDiv.textContent = 'Invalid phone number or password';
    }
}

function register() {
    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    const errorDiv = document.getElementById('registerError');

    if (!name || !phone || !password || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long';
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if phone number already exists
    if (users.some(u => u.phone === phone)) {
        errorDiv.textContent = 'Phone number already registered';
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        phone: phone,
        password: password,
        createdAt: new Date().toISOString()
    };

    // Add to users array
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after registration
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    document.getElementById('authOverlay').style.display = 'none';
    document.querySelector('.app-container').style.display = 'block';

    // Clear form
    document.getElementById('registerForm').reset();
    errorDiv.textContent = '';
}

function logout() {
    localStorage.removeItem('currentUser');
    document.querySelector('.app-container').style.display = 'none';
    document.getElementById('authOverlay').style.display = 'flex';
    showLogin();
}

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        document.getElementById('authOverlay').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block';
    } else {
        document.getElementById('authOverlay').style.display = 'flex';
        document.querySelector('.app-container').style.display = 'none';
        showLogin();
    }
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    checkAuth();

    // Initialize the app
    window.app = new FeeManager();
    await window.app.init();

    // Check for overdue payments on app start
    if (window.app.checkOverduePayments) {
        window.app.checkOverduePayments();
    }
});
