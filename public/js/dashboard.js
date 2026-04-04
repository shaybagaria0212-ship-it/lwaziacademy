// Lwazi Academy — Dashboard Logic

let currentUser = null;
let currentSessions = [];
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    loadDashboard();

    // Session tabs
    document.querySelectorAll('.session-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.session-tab').forEach(t => {
                t.classList.remove('active', 'text-primary-container', 'border-b-2', 'border-tertiary-container');
                t.classList.add('text-on-surface-variant');
            });
            tab.classList.add('active', 'text-primary-container', 'border-b-2', 'border-tertiary-container');
            tab.classList.remove('text-on-surface-variant');
            loadSessions(tab.dataset.status);
        });
    });

    // Review stars
    document.querySelectorAll('#rating-stars button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = Number(btn.dataset.rating);
            document.getElementById('review-rating').value = selectedRating;
            document.querySelectorAll('#rating-stars button').forEach((b, i) => {
                b.style.color = (i < selectedRating) ? '#cca830' : '#c4c6cf';
            });
        });
    });

    // Review form
    document.getElementById('review-form').addEventListener('submit', handleReview);
});

async function loadDashboard() {
    try {
        const profileData = await LwaziAPI.getProfile();
        currentUser = profileData.user;

        // Update welcome banner
        document.getElementById('welcome-name').textContent = `Welcome back, ${currentUser.full_name}`;
        document.getElementById('welcome-email').textContent = currentUser.email;
        document.getElementById('user-role-label').textContent = currentUser.role === 'tutor' ? 'Tutor Dashboard' : 'Student Dashboard';

        // Update find-tutor button for tutors
        if (currentUser.role === 'tutor') {
            const btn = document.getElementById('find-tutor-btn');
            btn.innerHTML = '<span class="material-symbols-outlined text-lg">edit</span> Edit Profile';
            btn.href = '#';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Future: open profile editing
                alert('Profile editing coming soon!');
            });
        }

        // Update stats
        if (currentUser.stats) {
            document.getElementById('stat-total').textContent = currentUser.stats.total_sessions;
            document.getElementById('stat-pending').textContent = currentUser.stats.pending_sessions;
            document.getElementById('stat-upcoming').textContent = currentUser.stats.upcoming_sessions;
            document.getElementById('stat-completed').textContent = currentUser.stats.completed_sessions;
        }

        // Load sessions
        loadSessions('');
    } catch (err) {
        showAlert(document.getElementById('alert-container'), err.message, 'error');
    }
}

async function loadSessions(status = '') {
    const listEl = document.getElementById('sessions-list');
    listEl.innerHTML = '<div class="flex justify-center py-12"><div class="lwazi-spinner"></div></div>';

    try {
        const data = await LwaziAPI.getSessions(status);
        currentSessions = data.sessions;

        if (currentSessions.length === 0) {
            listEl.innerHTML = `
                <div class="lwazi-empty">
                    <span class="material-symbols-outlined">event_busy</span>
                    <h3>No Sessions ${status ? `(${status})` : ''}</h3>
                    <p>${currentUser?.role === 'student'
                        ? 'Book your first session by finding a tutor.'
                        : 'No session requests yet. Students will find you soon!'
                    }</p>
                    ${currentUser?.role === 'student'
                        ? '<a href="/tutors.html" class="lwazi-btn-gold text-xs mt-6 inline-flex no-underline"><span class="material-symbols-outlined text-lg">search</span> Find a Tutor</a>'
                        : ''
                    }
                </div>
            `;
            return;
        }

        listEl.innerHTML = currentSessions.map(session => renderSessionCard(session)).join('');
    } catch (err) {
        listEl.innerHTML = `
            <div class="lwazi-alert error">
                <span class="material-symbols-outlined" style="font-size:20px">error</span>
                <span>Failed to load sessions: ${err.message}</span>
            </div>
        `;
    }
}

function renderSessionCard(session) {
    const isStudent = currentUser?.role === 'student';
    const otherPerson = isStudent ? session.tutor_name : session.student_name;
    const otherEmail = isStudent ? session.tutor_email : session.student_email;
    const scheduledDate = formatDateTime(session.scheduled_at);

    let actions = '';

    if (session.status === 'pending' && !isStudent) {
        // Tutor can confirm or cancel pending sessions
        actions = `
            <div class="flex gap-2 mt-4">
                <button class="lwazi-btn-primary text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'confirmed')">
                    <span class="material-symbols-outlined text-sm">check</span> Confirm
                </button>
                <button class="lwazi-btn-secondary text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'cancelled')">
                    <span class="material-symbols-outlined text-sm">close</span> Decline
                </button>
            </div>
        `;
    } else if (session.status === 'pending' && isStudent) {
        actions = `
            <div class="flex gap-2 mt-4">
                <button class="lwazi-btn-secondary text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'cancelled')">
                    <span class="material-symbols-outlined text-sm">close</span> Cancel
                </button>
            </div>
        `;
    } else if (session.status === 'confirmed' && !isStudent) {
        actions = `
            <div class="flex gap-2 mt-4">
                <button class="lwazi-btn-gold text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'completed')">
                    <span class="material-symbols-outlined text-sm">done_all</span> Mark Complete
                </button>
                <button class="lwazi-btn-secondary text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'cancelled')">
                    <span class="material-symbols-outlined text-sm">close</span> Cancel
                </button>
            </div>
        `;
    } else if (session.status === 'confirmed' && isStudent) {
        actions = `
            <div class="flex gap-2 mt-4">
                <button class="lwazi-btn-secondary text-xs py-2 px-4" onclick="updateSessionStatus(${session.id}, 'cancelled')">
                    <span class="material-symbols-outlined text-sm">close</span> Cancel
                </button>
            </div>
        `;
    } else if (session.status === 'completed' && isStudent) {
        actions = `
            <div class="flex gap-2 mt-4">
                <button class="lwazi-btn-gold text-xs py-2 px-4" onclick="openReviewModal(${session.id})">
                    <span class="material-symbols-outlined text-sm">rate_review</span> Leave Review
                </button>
            </div>
        `;
    }

    return `
        <div class="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low/50 transition-colors">
            <div class="flex items-start gap-4 flex-1">
                <div class="w-12 h-12 bg-primary-container flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-headline text-lg font-semibold">${getInitials(otherPerson)}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h3 class="font-headline text-lg text-primary-container">${otherPerson}</h3>
                        <span class="status-badge ${session.status}">${session.status}</span>
                    </div>
                    <p class="font-body text-sm text-on-surface-variant mt-1">
                        <span class="font-semibold">${session.subject}</span>
                        · ${session.duration_minutes || 60} min
                        · ${scheduledDate}
                    </p>
                    ${session.notes ? `<p class="font-body text-xs text-on-surface-variant mt-2 italic">"${session.notes}"</p>` : ''}
                    ${actions}
                </div>
            </div>
        </div>
    `;
}

async function updateSessionStatus(sessionId, status) {
    const confirmMsg = status === 'cancelled' ? 'Are you sure you want to cancel this session?' :
                       status === 'confirmed' ? 'Confirm this session?' :
                       'Mark this session as completed?';
    if (!confirm(confirmMsg)) return;

    try {
        await LwaziAPI.updateSession(sessionId, status);
        showAlert(document.getElementById('alert-container'), `Session ${status} successfully`, 'success');
        loadDashboard(); // Refresh everything
    } catch (err) {
        showAlert(document.getElementById('alert-container'), err.message, 'error');
    }
}

function openReviewModal(sessionId) {
    document.getElementById('review-session-id').value = sessionId;
    selectedRating = 0;
    document.getElementById('review-rating').value = 0;
    document.getElementById('review-comment').value = '';
    document.querySelectorAll('#rating-stars button').forEach(b => b.style.color = '#c4c6cf');
    document.getElementById('review-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    document.getElementById('review-modal').classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('review-alert').innerHTML = '';
}

async function handleReview(e) {
    e.preventDefault();
    const alertEl = document.getElementById('review-alert');
    alertEl.innerHTML = '';

    if (selectedRating === 0) {
        showAlert(alertEl, 'Please select a rating', 'error');
        return;
    }

    try {
        await LwaziAPI.submitReview({
            session_id: Number(document.getElementById('review-session-id').value),
            rating: selectedRating,
            comment: document.getElementById('review-comment').value.trim()
        });
        showAlert(alertEl, 'Review submitted! Thank you.', 'success');
        setTimeout(() => {
            closeReviewModal();
            loadSessions('completed');
        }, 1000);
    } catch (err) {
        showAlert(alertEl, err.message, 'error');
    }
}

// Close modal on overlay click
document.getElementById('review-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeReviewModal();
});

window.updateSessionStatus = updateSessionStatus;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
