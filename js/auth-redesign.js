/**
 * FeedbackPro — Authentication Redesign Controller
 * Handles Login, Customer & Company Registration, Demo Logins, Role-Based Routing
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Password Visibility Toggle
  initPasswordToggles();

  // 2. Login Page Logic
  initLoginPage();

  // 3. Customer Sign Up Logic
  initCustomerSignupPage();

  // 4. Company Sign Up Logic
  initCompanySignupPage();
});

/**
 * Password Visibility Toggles
 */
function initPasswordToggles() {
  // Generic data-target toggles
  document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye', isPassword);
        icon.classList.toggle('fa-eye-slash', !isPassword);
      }
    });
  });

  // Dedicated Login Toggle
  const loginToggle = document.getElementById('togglePasswordBtn');
  const loginPassInput = document.getElementById('loginPassword');
  if (loginToggle && loginPassInput) {
    loginToggle.addEventListener('click', () => {
      const isPassword = loginPassInput.type === 'password';
      loginPassInput.type = isPassword ? 'text' : 'password';
      const icon = loginToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye', isPassword);
        icon.classList.toggle('fa-eye-slash', !isPassword);
      }
    });
  }
}

/**
 * Display alert banner in the auth card
 */
function showAuthAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlertBox');
  if (!alertBox) {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      alert(message);
    }
    return;
  }

  const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
  const alertClass = type === 'success' ? 'auth-alert auth-alert-success' : 'auth-alert auth-alert-error';

  alertBox.className = alertClass;
  alertBox.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;
  alertBox.style.display = 'flex';

  // Auto clear after 6 seconds if success
  if (type === 'success') {
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 6000);
  }
}

/**
 * Complete sign in and perform role-based redirection
 */
function completeUserSignIn(user) {
  const role = user.role === 'customer' ? 'customer' : (user.role === 'company' ? 'company' : 'admin');
  
  if (typeof setAuthState === 'function') {
    setAuthState({
      isLoggedIn: true,
      role,
      email: user.email,
      name: user.name,
      companyName: user.companyName || (role === 'company' ? user.name : ''),
      phone: user.phone || ''
    });
  }

  if (role === 'customer') {
    if (typeof saveCustomerProfile === 'function') {
      saveCustomerProfile({ name: user.name, email: user.email });
    }
    window.location.href = '/customer.html';
  } else {
    // Admin or Company user -> redirect to Dashboard
    if (typeof getSettings === 'function' && typeof saveSettings === 'function') {
      const settings = getSettings();
      settings.displayName = user.name;
      saveSettings(settings);
    }
    window.location.href = '/index.html';
  }
}

/**
 * Login Page Controller
 */
function initLoginPage() {
  const loginForm = document.getElementById('redesignLoginForm');
  if (!loginForm) return;

  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const demoAdminBtn = document.getElementById('demoAdminBtn');
  const demoCustomerBtn = document.getElementById('demoCustomerBtn');
  const forgotBtn = document.getElementById('forgotPasswordBtn');

  // 1-Click Admin Demo
  demoAdminBtn?.addEventListener('click', () => {
    if (emailInput) emailInput.value = 'admin@feedbackpro.io';
    if (passInput) passInput.value = 'admin123';
    showAuthAlert('Signing in as Admin...', 'success');
    submitBtn.disabled = true;
    setTimeout(() => {
      completeUserSignIn({
        id: 'user_admin',
        name: 'Alex Morgan',
        email: 'admin@feedbackpro.io',
        role: 'admin'
      });
    }, 350);
  });

  // 1-Click Customer Demo
  demoCustomerBtn?.addEventListener('click', () => {
    if (emailInput) emailInput.value = 'customer@feedbackpro.io';
    if (passInput) passInput.value = 'customer123';
    showAuthAlert('Signing in to Customer Portal...', 'success');
    submitBtn.disabled = true;
    setTimeout(() => {
      completeUserSignIn({
        id: 'user_customer',
        name: 'David Miller',
        email: 'customer@feedbackpro.io',
        role: 'customer'
      });
    }, 350);
  });

  // Forgot password
  forgotBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthAlert('For security demo mode, use admin@feedbackpro.io / admin123 or customer@feedbackpro.io / customer123', 'error');
  });

  // Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (emailInput?.value || '').trim();
    const password = (passInput?.value || '').trim();
    const normEmail = email.toLowerCase();

    if (!email || !password) {
      showAuthAlert('Please enter both email and password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Logging In...</span>';

    // 1. Try Backend API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        showAuthAlert(`Welcome back, ${data.user.name}! Redirecting...`, 'success');
        setTimeout(() => {
          completeUserSignIn(data.user);
        }, 350);
        return;
      }
    } catch (_) {
      // Backend request failed or running in client-only mode; proceed to local auth check
    }

    // 2. Check hardcoded/seeded accounts
    if (normEmail === 'admin@feedbackpro.io' && password === 'admin123') {
      showAuthAlert('Admin authentication successful! Redirecting...', 'success');
      setTimeout(() => {
        completeUserSignIn({ id: 'user_admin', name: 'Alex Morgan', email: normEmail, role: 'admin' });
      }, 350);
      return;
    }

    if (normEmail === 'customer@feedbackpro.io' && password === 'customer123') {
      showAuthAlert('Welcome to the Customer Portal! Redirecting...', 'success');
      setTimeout(() => {
        completeUserSignIn({ id: 'user_customer', name: 'David Miller', email: normEmail, role: 'customer' });
      }, 350);
      return;
    }

    if (normEmail === 'company@feedbackpro.io' && password === 'company123') {
      showAuthAlert('Company authentication successful! Redirecting...', 'success');
      setTimeout(() => {
        completeUserSignIn({ id: 'user_company', name: 'SmartHub Inc', email: normEmail, role: 'company' });
      }, 350);
      return;
    }

    // 3. Check registered users in localStorage
    if (typeof getRegisteredUsers === 'function') {
      const localUsers = getRegisteredUsers();
      const matched = localUsers.find(
        (u) => String(u.email || '').toLowerCase() === normEmail && u.password === password
      );
      if (matched) {
        const portal = matched.role === 'customer' ? 'Customer Portal' : 'Company Dashboard';
        showAuthAlert(`Welcome back, ${matched.name}! Redirecting to ${portal}...`, 'success');
        setTimeout(() => {
          completeUserSignIn(matched);
        }, 350);
        return;
      }
    }

    // Unsuccessful
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Log In</span>';
    showAuthAlert('Invalid email or password. Use demo accounts or sign up.');
  });
}

/**
 * Customer Sign Up Controller
 */
function initCustomerSignupPage() {
  const form = document.getElementById('customerSignupForm');
  if (!form) return;

  const submitBtn = document.getElementById('customerSignupSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('customerName')?.value || '').trim();
    const email = (document.getElementById('customerEmail')?.value || '').trim();
    const password = document.getElementById('customerPassword')?.value || '';
    const confirmPassword = document.getElementById('customerConfirmPassword')?.value || '';

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showAuthAlert('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAuthAlert('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert('Passwords do not match. Please verify.');
      return;
    }

    const normEmail = email.toLowerCase();
    if (normEmail === 'admin@feedbackpro.io' || normEmail === 'customer@feedbackpro.io') {
      showAuthAlert('This email address is reserved for demo use.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Creating Account...</span>';

    const payload = {
      name,
      email: normEmail,
      password,
      role: 'customer'
    };

    // 1. Try Backend API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        showAuthAlert(`Account created successfully! Welcome, ${name}.`, 'success');
        // Cache in local users
        saveLocalUser(data.user);
        setTimeout(() => {
          completeUserSignIn(data.user);
        }, 400);
        return;
      } else if (res.status === 409) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
        showAuthAlert(data.error || 'An account with this email already exists.');
        return;
      }
    } catch (_) {
      // Backend offline / fallback
    }

    // 2. LocalStorage Fallback
    const existingUsers = typeof getRegisteredUsers === 'function' ? getRegisteredUsers() : [];
    if (existingUsers.some((u) => String(u.email || '').toLowerCase() === normEmail)) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span>';
      showAuthAlert('An account with this email already exists. Please log in.');
      return;
    }

    const newUser = {
      id: `user_cust_${Date.now()}`,
      name,
      email: normEmail,
      password,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    saveLocalUser(newUser);

    showAuthAlert(`Account created! Welcome, ${name}. Opening Customer Portal...`, 'success');
    setTimeout(() => {
      completeUserSignIn(newUser);
    }, 400);
  });
}

/**
 * Company Sign Up Controller
 */
function initCompanySignupPage() {
  const form = document.getElementById('companySignupForm');
  if (!form) return;

  const submitBtn = document.getElementById('companySignupSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = (document.getElementById('companyName')?.value || '').trim();
    const email = (document.getElementById('companyEmail')?.value || '').trim();
    const phone = (document.getElementById('companyPhone')?.value || '').trim();
    const password = document.getElementById('companyPassword')?.value || '';
    const confirmPassword = document.getElementById('companyConfirmPassword')?.value || '';

    // Validation
    if (!companyName || !email || !phone || !password || !confirmPassword) {
      showAuthAlert('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAuthAlert('Please enter a valid official business email.');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert('Passwords do not match. Please verify.');
      return;
    }

    const normEmail = email.toLowerCase();
    if (normEmail === 'admin@feedbackpro.io' || normEmail === 'company@feedbackpro.io') {
      showAuthAlert('This email address is reserved for demo use.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Creating Company Account...</span>';

    const payload = {
      name: companyName,
      companyName,
      email: normEmail,
      phone,
      password,
      role: 'company'
    };

    // 1. Try Backend API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        showAuthAlert(`Company registered! Welcome, ${companyName}.`, 'success');
        saveLocalUser(data.user);
        setTimeout(() => {
          completeUserSignIn(data.user);
        }, 400);
        return;
      } else if (res.status === 409) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
        showAuthAlert(data.error || 'A company with this email already exists.');
        return;
      }
    } catch (_) {
      // Backend offline / fallback
    }

    // 2. LocalStorage Fallback
    const existingUsers = typeof getRegisteredUsers === 'function' ? getRegisteredUsers() : [];
    if (existingUsers.some((u) => String(u.email || '').toLowerCase() === normEmail)) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span>';
      showAuthAlert('An account with this email already exists. Please log in.');
      return;
    }

    const newUser = {
      id: `user_comp_${Date.now()}`,
      name: companyName,
      companyName,
      email: normEmail,
      phone,
      password,
      role: 'company',
      createdAt: new Date().toISOString()
    };
    saveLocalUser(newUser);

    showAuthAlert(`Company registered! Opening Analytics Workspace...`, 'success');
    setTimeout(() => {
      completeUserSignIn(newUser);
    }, 400);
  });
}

function saveLocalUser(user) {
  if (typeof getRegisteredUsers !== 'function' || typeof saveRegisteredUsers !== 'function') return;
  const users = getRegisteredUsers().filter(
    (u) => String(u.email || '').toLowerCase() !== String(user.email || '').toLowerCase()
  );
  users.push(user);
  saveRegisteredUsers(users);
}
