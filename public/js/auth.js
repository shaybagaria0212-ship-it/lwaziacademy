// Lwazi Academy — Auth State & Navigation

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    const isLoggedIn = LwaziAPI.isLoggedIn();
    const user = LwaziAPI.getUser();

    // Update desktop nav
    const desktopNav = document.querySelector('header nav');
    if (desktopNav) {
        const authArea = desktopNav.querySelector('.auth-area');
        if (authArea) {
            if (isLoggedIn) {
                authArea.innerHTML = `
                    <a href="/dashboard.html" class="font-['Manrope'] font-medium text-[#44474e] hover:bg-[#f4f3f7] transition-colors px-3 py-1">Dashboard</a>
                    <div class="relative group">
                        <button class="flex items-center gap-2 px-3 py-1 hover:bg-[#f4f3f7] transition-colors" id="user-menu-btn">
                            <div class="w-8 h-8 rounded-full bg-[#002147] flex items-center justify-center">
                                <span class="text-white font-bold text-sm">${getInitials(user?.full_name)}</span>
                            </div>
                            <span class="font-['Manrope'] font-medium text-[#44474e] text-sm">${user?.full_name || 'Account'}</span>
                        </button>
                        <div class="absolute right-0 top-full mt-1 bg-white border border-[#c4c6cf] shadow-xl py-2 min-w-[180px] hidden group-hover:block z-50" id="user-menu">
                            <div class="px-4 py-2 border-b border-[#c4c6cf]/30">
                                <p class="font-['Manrope'] text-xs text-[#74777f] uppercase tracking-widest">${user?.role || ''}</p>
                                <p class="font-['Manrope'] text-sm font-medium text-[#1a1b1e]">${user?.email || ''}</p>
                            </div>
                            <a href="/dashboard.html" class="block px-4 py-2 font-['Manrope'] text-sm text-[#44474e] hover:bg-[#f4f3f7]">Dashboard</a>
                            <button onclick="LwaziAPI.logout()" class="w-full text-left px-4 py-2 font-['Manrope'] text-sm text-[#ba1a1a] hover:bg-[#ffdad6]">Sign Out</button>
                        </div>
                    </div>
                `;
            } else {
                authArea.innerHTML = `
                    <a href="/login.html" class="font-['Manrope'] font-medium text-[#44474e] hover:bg-[#f4f3f7] transition-colors px-3 py-1">Sign In</a>
                    <a href="/register.html" class="bg-[#002147] text-white px-5 py-2.5 font-['Manrope'] font-bold text-xs uppercase tracking-widest hover:bg-[#000a1e] transition-colors">Register</a>
                `;
            }
        }
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function showAlert(container, message, type = 'error') {
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const alert = document.createElement('div');
    alert.className = `lwazi-alert ${type}`;
    alert.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px">${icons[type]}</span>
        <span>${message}</span>
    `;
    container.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

function requireAuth(redirectTo = '/login.html') {
    if (!LwaziAPI.isLoggedIn()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

function requireRole(role) {
    const user = LwaziAPI.getUser();
    if (!user || user.role !== role) {
        window.location.href = '/dashboard.html';
        return false;
    }
    return true;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function renderStars(rating) {
    let html = '<div class="star-rating">';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<span class="material-symbols-outlined">star</span>';
        } else if (i - 0.5 <= rating) {
            html += '<span class="material-symbols-outlined">star_half</span>';
        } else {
            html += '<span class="material-symbols-outlined empty">star</span>';
        }
    }
    html += '</div>';
    return html;
}

window.updateAuthUI = updateAuthUI;
window.showAlert = showAlert;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.renderStars = renderStars;
window.getInitials = getInitials;
