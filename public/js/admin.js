// Lwazi Academy — Admin Applications Dashboard

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadApplications();
    initFilterTabs();
});

let currentFilter = '';
let allApplications = [];

// ===== Load Stats =====
async function loadStats() {
    try {
        const res = await fetch('/api/applications/stats');
        const data = await res.json();

        document.getElementById('stat-total').textContent = data.total;
        document.getElementById('stat-pending').textContent = data.pending;
        document.getElementById('stat-approved').textContent = data.approved;
        document.getElementById('stat-rejected').textContent = data.rejected;

        // Pulse animation if pending > 0
        if (data.pending > 0) {
            document.getElementById('stat-pending-card').classList.add('has-pending');
        }
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

// ===== Load Applications =====
async function loadApplications(status = '') {
    const container = document.getElementById('applications-list');
    container.innerHTML = '<div class="flex justify-center py-16"><div class="lwazi-spinner"></div></div>';

    try {
        const url = status ? `/api/applications?status=${status}` : '/api/applications';
        const res = await fetch(url);
        const data = await res.json();

        allApplications = data.applications;
        renderApplications(allApplications);
    } catch (err) {
        console.error('Failed to load applications:', err);
        container.innerHTML = `
            <div class="lwazi-empty">
                <span class="material-symbols-outlined">error</span>
                <h3>Failed to Load</h3>
                <p>Could not fetch applications. Is the server running?</p>
            </div>
        `;
    }
}

// ===== Render Applications =====
function renderApplications(applications) {
    const container = document.getElementById('applications-list');

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="lwazi-empty">
                <span class="material-symbols-outlined">inbox</span>
                <h3>No Applications</h3>
                <p>No tutor applications match the current filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => `
        <div class="border border-outline-variant/20 mb-4 hover:border-outline-variant/40 transition-colors" id="app-${app.id}">
            <!-- Summary Row -->
            <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onclick="toggleDetails(${app.id})">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="w-10 h-10 bg-primary-container text-white flex items-center justify-center flex-shrink-0 font-label font-bold text-sm">
                        ${getInitials(app.full_name)}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-3 flex-wrap">
                            <h3 class="font-headline text-lg text-primary-container">${escapeHtml(app.full_name)}</h3>
                            <span class="status-pill ${app.status}">${app.status}</span>
                        </div>
                        <p class="text-on-surface-variant text-sm font-body truncate">${escapeHtml(app.email)} · ${app.subjects.length} subject${app.subjects.length !== 1 ? 's' : ''} · ${formatTimeAgo(app.created_at)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${app.status === 'pending' ? `
                        <button class="action-btn approve" onclick="event.stopPropagation(); updateStatus(${app.id}, 'approved')" title="Approve">
                            <span class="material-symbols-outlined text-base">check</span> Approve
                        </button>
                        <button class="action-btn reject" onclick="event.stopPropagation(); updateStatus(${app.id}, 'rejected')" title="Reject">
                            <span class="material-symbols-outlined text-base">close</span> Reject
                        </button>
                    ` : `
                        <button class="action-btn review" onclick="event.stopPropagation(); openDetailModal(${app.id})" title="View Details">
                            <span class="material-symbols-outlined text-base">visibility</span> View
                        </button>
                    `}
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteApplication(${app.id})" title="Delete">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>

            <!-- Expandable Details -->
            <div class="app-details px-5 pb-5" id="details-${app.id}">
                <div class="border-t border-outline-variant/20 pt-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Contact</p>
                            <p class="font-body text-sm text-on-surface">${escapeHtml(app.email)}</p>
                            ${app.phone ? `<p class="font-body text-sm text-on-surface-variant">${escapeHtml(app.phone)}</p>` : ''}
                        </div>
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Qualification</p>
                            <p class="font-body text-sm text-on-surface">${escapeHtml(app.qualification)}</p>
                        </div>
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Subjects</p>
                            <div class="flex flex-wrap gap-2">
                                ${app.subjects.map(s => `<span class="lwazi-chip">${escapeHtml(s)}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Grade Levels</p>
                            <div class="flex flex-wrap gap-2">
                                ${app.grade_levels.map(g => `<span class="lwazi-chip">Grade ${escapeHtml(g)}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Experience</p>
                            <p class="font-body text-sm text-on-surface">${app.experience_years} year${app.experience_years !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Desired Rate</p>
                            <p class="font-body text-sm text-on-surface">R${app.hourly_rate}/hr</p>
                        </div>
                    </div>
                    ${app.motivation ? `
                        <div class="mt-6">
                            <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Motivation</p>
                            <div class="bg-surface-container-low p-4 border-l-4 border-tertiary-container">
                                <p class="font-body text-sm text-on-surface italic leading-relaxed">"${escapeHtml(app.motivation)}"</p>
                            </div>
                        </div>
                    ` : ''}
                    <div class="mt-6 pt-4 border-t border-outline-variant/10 flex items-center gap-3 flex-wrap">
                        <span class="font-label text-xs text-on-surface-variant uppercase tracking-widest">Change Status:</span>
                        <button class="action-btn approve" onclick="updateStatus(${app.id}, 'approved')">
                            <span class="material-symbols-outlined text-base">check_circle</span> Approve
                        </button>
                        <button class="action-btn review" onclick="updateStatus(${app.id}, 'reviewed')">
                            <span class="material-symbols-outlined text-base">rate_review</span> Mark Reviewed
                        </button>
                        <button class="action-btn reject" onclick="updateStatus(${app.id}, 'rejected')">
                            <span class="material-symbols-outlined text-base">block</span> Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Toggle Details =====
function toggleDetails(id) {
    const el = document.getElementById(`details-${id}`);
    if (el) {
        el.classList.toggle('expanded');
    }
}

// ===== Update Status =====
async function updateStatus(id, status) {
    try {
        const res = await fetch(`/api/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const alertContainer = document.getElementById('alert-container');
        showAlert(alertContainer, `Application ${status} successfully.`, 'success');

        // Refresh data
        loadStats();
        loadApplications(currentFilter);
    } catch (err) {
        const alertContainer = document.getElementById('alert-container');
        showAlert(alertContainer, err.message, 'error');
    }
}

// ===== Delete Application =====
async function deleteApplication(id) {
    if (!confirm('Are you sure you want to delete this application? This cannot be undone.')) return;

    try {
        const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const alertContainer = document.getElementById('alert-container');
        showAlert(alertContainer, 'Application deleted.', 'info');

        loadStats();
        loadApplications(currentFilter);
    } catch (err) {
        const alertContainer = document.getElementById('alert-container');
        showAlert(alertContainer, err.message, 'error');
    }
}

// ===== Detail Modal =====
function openDetailModal(id) {
    const app = allApplications.find(a => a.id === id);
    if (!app) return;

    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('detail-modal-body');

    body.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-primary-container text-white flex items-center justify-center font-label font-bold">
                ${getInitials(app.full_name)}
            </div>
            <div>
                <h3 class="font-headline text-xl text-primary-container">${escapeHtml(app.full_name)}</h3>
                <span class="status-pill ${app.status}">${app.status}</span>
            </div>
        </div>

        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Email</p>
                    <p class="font-body text-sm">${escapeHtml(app.email)}</p>
                </div>
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Phone</p>
                    <p class="font-body text-sm">${app.phone || 'Not provided'}</p>
                </div>
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Qualification</p>
                    <p class="font-body text-sm">${escapeHtml(app.qualification)}</p>
                </div>
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Experience</p>
                    <p class="font-body text-sm">${app.experience_years} years</p>
                </div>
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Desired Rate</p>
                    <p class="font-body text-sm">R${app.hourly_rate}/hr</p>
                </div>
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">Applied</p>
                    <p class="font-body text-sm">${new Date(app.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Subjects</p>
                <div class="flex flex-wrap gap-2">
                    ${app.subjects.map(s => `<span class="lwazi-chip">${escapeHtml(s)}</span>`).join('')}
                </div>
            </div>

            <div>
                <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Grade Levels</p>
                <div class="flex flex-wrap gap-2">
                    ${app.grade_levels.map(g => `<span class="lwazi-chip">Grade ${escapeHtml(g)}</span>`).join('')}
                </div>
            </div>

            ${app.motivation ? `
                <div>
                    <p class="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2">Motivation</p>
                    <div class="bg-surface-container-low p-4 border-l-4 border-tertiary-container">
                        <p class="font-body text-sm text-on-surface italic leading-relaxed">"${escapeHtml(app.motivation)}"</p>
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center gap-3 flex-wrap">
            <button class="action-btn approve" onclick="updateStatus(${app.id}, 'approved'); closeDetailModal();">
                <span class="material-symbols-outlined text-base">check_circle</span> Approve
            </button>
            <button class="action-btn review" onclick="updateStatus(${app.id}, 'reviewed'); closeDetailModal();">
                <span class="material-symbols-outlined text-base">rate_review</span> Mark Reviewed
            </button>
            <button class="action-btn reject" onclick="updateStatus(${app.id}, 'rejected'); closeDetailModal();">
                <span class="material-symbols-outlined text-base">block</span> Reject
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

// ===== Filter Tabs =====
function initFilterTabs() {
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.status;
            loadApplications(currentFilter);
        });
    });
}

// ===== Helpers =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
}

// Expose functions globally
window.toggleDetails = toggleDetails;
window.updateStatus = updateStatus;
window.deleteApplication = deleteApplication;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
