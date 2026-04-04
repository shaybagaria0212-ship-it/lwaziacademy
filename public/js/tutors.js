// Lwazi Academy — Tutor Discovery Logic

let allTutors = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTutors();

    // Debounced search
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadTutors, 300);
    });

    document.getElementById('subject-filter').addEventListener('change', loadTutors);
    document.getElementById('sort-filter').addEventListener('change', loadTutors);

    // Booking form
    document.getElementById('booking-form').addEventListener('submit', handleBooking);
});

async function loadTutors() {
    const grid = document.getElementById('tutors-grid');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');

    const params = {};
    const search = document.getElementById('search-input').value.trim();
    const subject = document.getElementById('subject-filter').value;
    const sort = document.getElementById('sort-filter').value;

    if (search) params.search = search;
    if (subject) params.subject = subject;
    if (sort) params.sort = sort;

    try {
        const data = await LwaziAPI.getTutors(params);
        allTutors = data.tutors;

        if (allTutors.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            resultsCount.textContent = 'No mentors found';
            return;
        }

        emptyState.classList.add('hidden');
        resultsCount.textContent = `${allTutors.length} mentor${allTutors.length !== 1 ? 's' : ''} available`;

        grid.innerHTML = allTutors.map(tutor => renderTutorCard(tutor)).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="col-span-full">
                <div class="lwazi-alert error">
                    <span class="material-symbols-outlined" style="font-size:20px">error</span>
                    <span>Failed to load tutors: ${err.message}</span>
                </div>
            </div>
        `;
    }
}

function renderTutorCard(tutor) {
    const subjectChips = tutor.subjects.slice(0, 3).map(s =>
        `<span class="lwazi-chip">${s}</span>`
    ).join('');
    const extraSubjects = tutor.subjects.length > 3
        ? `<span class="lwazi-chip gold">+${tutor.subjects.length - 3} more</span>`
        : '';

    const gradeRange = tutor.grade_levels.length > 0
        ? `Grade ${tutor.grade_levels[0]}–${tutor.grade_levels[tutor.grade_levels.length - 1]}`
        : '';

    return `
        <div class="lwazi-card flex flex-col" data-tutor-id="${tutor.id}">
            <!-- Top -->
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-primary-container flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-headline text-xl font-semibold">${getInitials(tutor.full_name)}</span>
                    </div>
                    <div>
                        <h3 class="font-headline text-lg text-primary-container flex items-center gap-2">
                            ${tutor.full_name}
                            ${tutor.verified ? '<span class="material-symbols-outlined text-tertiary-container text-base" style="font-variation-settings:\'FILL\' 1">verified</span>' : ''}
                        </h3>
                        <p class="font-body text-xs text-on-surface-variant">${tutor.qualification || 'Qualified Tutor'}</p>
                    </div>
                </div>
            </div>

            <!-- Bio -->
            <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-6 line-clamp-3">${tutor.bio || 'Experienced tutor ready to help you succeed.'}</p>

            <!-- Subjects -->
            <div class="flex flex-wrap gap-2 mb-6">
                ${subjectChips}
                ${extraSubjects}
            </div>

            <!-- Stats Row -->
            <div class="flex items-center justify-between text-sm mb-6 pt-4 border-t border-outline-variant/20">
                <div class="flex items-center gap-1">
                    ${renderStars(tutor.rating)}
                    <span class="font-body font-bold text-primary-container ml-1">${tutor.rating}</span>
                    <span class="text-on-surface-variant">(${tutor.review_count})</span>
                </div>
                <span class="font-body text-xs text-on-surface-variant">${gradeRange}</span>
            </div>

            <!-- Bottom -->
            <div class="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/20">
                <div>
                    <span class="font-headline text-2xl font-semibold text-primary-container">R${tutor.hourly_rate}</span>
                    <span class="text-on-surface-variant text-xs font-body">/hour</span>
                </div>
                <button class="lwazi-btn-gold text-xs py-3 px-6" onclick="openBookingModal(${tutor.id})">
                    Book Session
                </button>
            </div>
        </div>
    `;
}

function openBookingModal(tutorId) {
    if (!LwaziAPI.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }
    if (!LwaziAPI.isStudent()) {
        alert('Only students can book sessions.');
        return;
    }

    const tutor = allTutors.find(t => t.id === tutorId);
    if (!tutor) return;

    document.getElementById('booking-tutor-id').value = tutorId;

    // Populate tutor info
    document.getElementById('modal-tutor-info').innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-container flex items-center justify-center">
                <span class="text-white font-bold text-sm">${getInitials(tutor.full_name)}</span>
            </div>
            <div>
                <p class="font-headline font-semibold text-primary-container">${tutor.full_name}</p>
                <p class="font-body text-xs text-on-surface-variant">R${tutor.hourly_rate}/hour</p>
            </div>
        </div>
    `;

    // Populate subject dropdown
    const subjectSelect = document.getElementById('booking-subject');
    subjectSelect.innerHTML = tutor.subjects.map(s =>
        `<option value="${s}">${s}</option>`
    ).join('');

    // Set min date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    document.getElementById('booking-date').min = tomorrow.toISOString().slice(0, 16);

    document.getElementById('booking-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('modal-alert').innerHTML = '';
}

async function handleBooking(e) {
    e.preventDefault();
    const modalAlert = document.getElementById('modal-alert');
    const submitBtn = document.getElementById('booking-submit-btn');
    modalAlert.innerHTML = '';

    const sessionData = {
        tutor_id: Number(document.getElementById('booking-tutor-id').value),
        subject: document.getElementById('booking-subject').value,
        scheduled_at: document.getElementById('booking-date').value,
        duration_minutes: Number(document.getElementById('booking-duration').value),
        notes: document.getElementById('booking-notes').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="lwazi-spinner mx-auto" style="width:20px;height:20px;border-width:2px"></div>';

    try {
        await LwaziAPI.bookSession(sessionData);
        modalAlert.innerHTML = `
            <div class="lwazi-alert success">
                <span class="material-symbols-outlined" style="font-size:20px">check_circle</span>
                <span>Session booked successfully! Redirecting to dashboard...</span>
            </div>
        `;
        setTimeout(() => {
            closeBookingModal();
            window.location.href = '/dashboard.html';
        }, 1500);
    } catch (err) {
        showAlert(modalAlert, err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-lg">event_available</span> Confirm Booking';
    }
}

// Close modal on overlay click
document.getElementById('booking-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBookingModal();
});

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
