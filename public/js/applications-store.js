// Lwazi Academy — Client-Side Applications Store (localStorage)
// Provides a shared data layer for apply-tutor.html and admin.html
// Works without a backend so Vercel static deployment functions correctly.

const ApplicationsStore = (() => {
    const STORAGE_KEY = 'lwazi_tutor_applications';
    const SEEDED_KEY = 'lwazi_applications_seeded';

    // ===== Sample Seed Data =====
    const SEED_DATA = [
        {
            id: 1,
            full_name: 'Naledi Dlamini',
            email: 'naledi.dlamini@gmail.com',
            phone: '071 234 5678',
            subjects: ['Mathematics', 'Physical Sciences'],
            grade_levels: ['10', '11', '12'],
            qualification: 'BSc Physics — University of Cape Town',
            experience_years: 3,
            hourly_rate: 220,
            motivation: 'I am deeply passionate about helping learners overcome their fear of Maths and Science. Growing up in Soweto, I had limited access to quality tutoring, and I want to change that for the next generation. I believe every student can excel if given the right guidance and encouragement.',
            status: 'pending',
            created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
            id: 2,
            full_name: 'Pieter van Wyk',
            email: 'pieter.vw@outlook.com',
            phone: '082 987 6543',
            subjects: ['Accounting', 'Business Studies', 'Economics'],
            grade_levels: ['10', '11', '12'],
            qualification: 'BCom Honours — Stellenbosch University',
            experience_years: 6,
            hourly_rate: 280,
            motivation: 'After working in corporate audit for several years, I realised my real calling is education. I have been tutoring part-time and have seen remarkable improvements in my students\' results. I want to reach more learners through Lwazi Academy and make commerce subjects engaging and practical.',
            status: 'pending',
            created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        },
        {
            id: 3,
            full_name: 'Ayanda Mkhize',
            email: 'ayanda.m@yahoo.com',
            phone: '063 456 7890',
            subjects: ['English Home Language', 'English First Additional Language', 'History'],
            grade_levels: ['8', '9', '10', '11', '12'],
            qualification: 'BA English & Education — Rhodes University',
            experience_years: 4,
            hourly_rate: 190,
            motivation: 'Language is the gateway to understanding the world. I specialise in essay writing, comprehension strategies, and literature analysis. My approach focuses on building critical thinking skills that serve students well beyond the classroom.',
            status: 'approved',
            created_at: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
            id: 4,
            full_name: 'Fatima Cassim',
            email: 'fatima.cassim@icloud.com',
            phone: '074 321 9876',
            subjects: ['Life Sciences', 'Mathematics'],
            grade_levels: ['10', '11', '12'],
            qualification: 'MSc Biochemistry — University of Pretoria',
            experience_years: 5,
            hourly_rate: 250,
            motivation: 'My research background gives me a unique perspective on teaching Life Sciences. I use real-world examples from my lab experience to make complex biological concepts tangible and exciting. I want to inspire the next generation of scientists in South Africa.',
            status: 'reviewed',
            created_at: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
            id: 5,
            full_name: 'Bongani Sithole',
            email: 'bongani.s@gmail.com',
            phone: '061 555 4321',
            subjects: ['Information Technology', 'Mathematics'],
            grade_levels: ['10', '11', '12'],
            qualification: 'BSc Computer Science — UKZN',
            experience_years: 2,
            hourly_rate: 200,
            motivation: 'As a junior software developer, I see first-hand how important foundational IT and Maths skills are. I want to help learners not only pass their exams but also develop a genuine love for technology and problem-solving.',
            status: 'rejected',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString()
        },
        {
            id: 6,
            full_name: 'Lerato Molefe',
            email: 'lerato.molefe@hotmail.com',
            phone: '079 888 2233',
            subjects: ['Geography', 'Life Sciences'],
            grade_levels: ['8', '9', '10', '11'],
            qualification: 'BSc Environmental Science — Wits University',
            experience_years: 3,
            hourly_rate: 180,
            motivation: 'Environmental awareness starts in the classroom. I teach Geography and Life Sciences with a focus on South African ecosystems and real environmental challenges. I use interactive maps, field examples, and data analysis to make lessons come alive.',
            status: 'pending',
            created_at: new Date(Date.now() - 6 * 3600000).toISOString()
        }
    ];

    // ===== Internal Helpers =====
    function _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function _save(applications) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }

    function _nextId() {
        const apps = _load();
        if (apps.length === 0) return 1;
        return Math.max(...apps.map(a => a.id)) + 1;
    }

    function _ensureSeeded() {
        if (localStorage.getItem(SEEDED_KEY)) return;
        const existing = _load();
        if (existing.length === 0) {
            _save(SEED_DATA);
        }
        localStorage.setItem(SEEDED_KEY, 'true');
    }

    // ===== Public API =====

    /** Initialize store — call on page load */
    function init() {
        _ensureSeeded();
    }

    /** Get all applications, optionally filtered by status */
    function getAll(statusFilter) {
        const apps = _load();
        const filtered = statusFilter
            ? apps.filter(a => a.status === statusFilter)
            : apps;
        // Sort by created_at descending (newest first)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return filtered;
    }

    /** Get a single application by id */
    function getById(id) {
        const apps = _load();
        return apps.find(a => a.id === id) || null;
    }

    /** Get summary stats */
    function getStats() {
        const apps = _load();
        return {
            total: apps.length,
            pending: apps.filter(a => a.status === 'pending').length,
            approved: apps.filter(a => a.status === 'approved').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
            reviewed: apps.filter(a => a.status === 'reviewed').length
        };
    }

    /** Submit a new application. Returns { success, message, applicationId } or { success, error } */
    function submit(data) {
        const { full_name, email, subjects, grade_levels, qualification } = data;

        // Validation
        if (!full_name || !email || !qualification) {
            return { success: false, error: 'Full name, email, and qualification are required.' };
        }
        if (!Array.isArray(subjects) || subjects.length === 0) {
            return { success: false, error: 'Please select at least one subject.' };
        }
        if (!Array.isArray(grade_levels) || grade_levels.length === 0) {
            return { success: false, error: 'Please select at least one grade level.' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Please enter a valid email address.' };
        }

        const apps = _load();

        // Check for duplicate pending application
        const existing = apps.find(a => a.email === email && a.status === 'pending');
        if (existing) {
            return { success: false, error: 'You already have a pending application. We will be in touch soon!' };
        }

        const newApp = {
            id: _nextId(),
            full_name: data.full_name,
            email: data.email,
            phone: data.phone || '',
            subjects: data.subjects,
            grade_levels: data.grade_levels,
            qualification: data.qualification,
            experience_years: data.experience_years || 0,
            hourly_rate: data.hourly_rate || 0,
            motivation: data.motivation || '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        apps.push(newApp);
        _save(apps);

        return {
            success: true,
            message: 'Your application has been submitted successfully! We will review it and get back to you shortly.',
            applicationId: newApp.id
        };
    }

    /** Update the status of an application */
    function updateStatus(id, newStatus) {
        const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
        if (!validStatuses.includes(newStatus)) {
            return { success: false, error: 'Invalid status.' };
        }

        const apps = _load();
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) {
            return { success: false, error: 'Application not found.' };
        }

        apps[idx].status = newStatus;
        _save(apps);

        return {
            success: true,
            message: `Application status updated to "${newStatus}".`,
            application: apps[idx]
        };
    }

    /** Delete an application */
    function remove(id) {
        const apps = _load();
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) {
            return { success: false, error: 'Application not found.' };
        }

        apps.splice(idx, 1);
        _save(apps);
        return { success: true, message: 'Application deleted.' };
    }

    return { init, getAll, getById, getStats, submit, updateStatus, remove };
})();

window.ApplicationsStore = ApplicationsStore;
