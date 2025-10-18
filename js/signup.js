let signupName = '';
let signupEmail = '';
let signupPassword = '';
let signupUserType = '';
let verificationTimer = null;
let timerCount = 60;



function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const userType = document.getElementById('userType').value;
    
    // Validate
    if (!validateEmail(email)) {
        showError('emailError', 'Invalid email format');
        return;
    }
    
    if (password.length < 8) {
        showError('emailError', 'Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('passwordMatchError', 'Passwords do not match');
        return;
    }

    if (!userType) {
        alert('Please select your role');
        return;
    }

    
    // Store for later
    signupEmail = email;
    signupPassword = password;
    signupName = name;
    signupUserType = userType
    
    // Send to backend
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('userType', userType);
    formData.append('action', 'register');

    
    fetch('../php/signup.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Move to verification page
            showVerificationPage();
            startTimer();
        } else {
            showError('emailError', data.message || 'Registration failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('emailError', 'An error occurred');
    });
}


// Handle verification
function handleVerification() {
    const code = document.getElementById('verificationCode').value.trim();
    
    if (!code) {
        alert('Please enter verification code');
        return;
    }
    
    const formData = new FormData();
    formData.append('email', signupEmail);
    formData.append('code', code);
    formData.append('action', 'verify');
    
    const btn = document.querySelector('.verify-btn');
    btn.disabled = true;
    
    fetch('../php/signup.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        btn.disabled = false;
        
        if (data.success) {
            alert('Email verified successfully!');
            // Redirect to login
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Verification failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        btn.disabled = false;
        alert('An error occurred');
    });
}

// Resend verification code
function resendCode(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('email', signupEmail);
    formData.append('action', 'resend');
    
    fetch('../php/signup.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Verification code sent to your email');
            startTimer();
        } else {
            alert(data.message || 'Failed to resend code');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}




// Show verification page
function showVerificationPage() {
    document.getElementById('signupFormPage').classList.remove('active');
    document.getElementById('verificationPage').classList.add('active');
}

// Timer for resend button
function startTimer() {
    timerCount = 60;
    document.getElementById('timerText').style.display = 'block';
    document.getElementById('resendBtn').classList.add('d-none');
    
    verificationTimer = setInterval(() => {
        timerCount--;
        document.getElementById('timerCount').textContent = timerCount;
        
        if (timerCount <= 0) {
            clearInterval(verificationTimer);
            document.getElementById('timerText').style.display = 'none';
            document.getElementById('resendBtn').classList.remove('d-none');
        }
    }, 1000);
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = event.target.closest('.toggle-password');

    if (field.type === 'password') {
        field.type = 'text';
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/></svg>';
    } else {
        field.type = 'password';
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/></svg>';
    }
}

// Check if passwords match
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('passwordMatchError');
    
    if (confirmPassword && password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
    } else {
        errorEl.textContent = '';
    }
}

// Validate email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Show error message
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
    }
}

// Clear errors
document.getElementById('email')?.addEventListener('focus', () => {
    document.getElementById('emailError').textContent = '';
});