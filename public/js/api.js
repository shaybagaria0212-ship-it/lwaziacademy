// Lwazi Academy — API Client

const API_BASE = '/api';

class LwaziAPI {
    static getToken() {
        return localStorage.getItem('lwazi_token');
    }

    static setToken(token) {
        localStorage.setItem('lwazi_token', token);
    }

    static clearToken() {
        localStorage.removeItem('lwazi_token');
        localStorage.removeItem('lwazi_user');
    }

    static getUser() {
        const data = localStorage.getItem('lwazi_user');
        return data ? JSON.parse(data) : null;
    }

    static setUser(user) {
        localStorage.setItem('lwazi_user', JSON.stringify(user));
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(`Server returned status ${response.status} with no JSON body`);
            }

            if (!response.ok) {
                // Allow caller to inspect specific flags before throwing
                if (data.requires_verification || data.requires_2fa) {
                    return data;
                }
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Please try again.');
            }
            throw err;
        }
    }

    // Auth
    static async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
        // We don't set token here because they need to verify email first
    }

    static async verifyRegistration(email, code) {
        const data = await this.request('/auth/verify-registration', {
            method: 'POST',
            body: { email, code }
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    }

    static async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        if (data.requires_2fa || data.requires_verification) {
            return data;
        }
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    }

    static async verifyLogin(email, code) {
        const data = await this.request('/auth/verify-login', {
            method: 'POST',
            body: { email, code }
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    }

    static async getMe() {
        return this.request('/auth/me');
    }

    static logout() {
        this.clearToken();
        window.location.href = '/';
    }

    // Tutors
    static async getTutors(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            return await this.request(`/tutors${query ? '?' + query : ''}`);
        } catch (err) {
            // Mock fallback for static Vercel deployment
            let tutors = [
                { id: 1, full_name: 'Mohammed Badat', subjects: ['Mathematics','Physical Sciences'], grade_levels: ['10','11','12'], bio: 'Passionate about making Mathematics and Physical Sciences accessible. I hold a BSc in Applied Mathematics from Wits and have been tutoring full-time for 6 years. My students consistently achieve distinctions in the NSC.', hourly_rate: 250, experience_years: 6, rating: 4.8, review_count: 47, verified: true, qualification: 'BSc Applied Mathematics — Wits University' },
                { id: 2, full_name: 'Edison Mshengu', subjects: ['English Home Language','English First Additional Language','Afrikaans'], grade_levels: ['8','9','10','11','12'], bio: 'UCT English Honours graduate specialising in literature analysis and creative writing. I focus on building genuine comprehension and analytical skills, not just exam technique. My approach is holistic and student-centred.', hourly_rate: 200, experience_years: 4, rating: 4.9, review_count: 62, verified: true, qualification: 'BA Honours English Literature — UCT' },
                { id: 3, full_name: 'Sipho Ndlovu', subjects: ['Accounting','Business Studies','Economics'], grade_levels: ['10','11','12'], bio: 'Chartered Accountant with a passion for education. After 5 years in corporate finance, I transitioned to full-time tutoring. I make financial concepts intuitive and practical. My students see results within weeks.', hourly_rate: 300, experience_years: 8, rating: 4.7, review_count: 35, verified: true, qualification: 'BCom CA(SA) — University of Pretoria' },
                { id: 4, full_name: 'Amira Patel', subjects: ['Life Sciences','Mathematics'], grade_levels: ['10','11','12'], bio: 'MSc in Molecular Biology from Stellenbosch. I bring lab experience into the classroom to make Life Sciences vivid and memorable. Also tutoring Maths to give students a strong analytical foundation.', hourly_rate: 220, experience_years: 5, rating: 4.6, review_count: 28, verified: true, qualification: 'MSc Molecular Biology — Stellenbosch University' },
                { id: 5, full_name: 'James Viljoen', subjects: ['History','Geography','Social Sciences'], grade_levels: ['8','9','10','11','12'], bio: 'History teacher with 10 years at a top IEB school. I make the past come alive through storytelling and critical thinking. My Geography students develop strong spatial reasoning and data interpretation skills.', hourly_rate: 180, experience_years: 10, rating: 4.5, review_count: 41, verified: true, qualification: 'BEd — Rhodes University' },
                { id: 6, full_name: 'Zanele Khumalo', subjects: ['Mathematics','Information Technology','Computer Applications Technology'], grade_levels: ['10','11','12'], bio: 'Software developer turned educator. I teach Maths and IT with real-world applications. My Delphi and Java coding sessions are project-based and fun. Let me show you how logical thinking changes everything.', hourly_rate: 270, experience_years: 7, rating: 4.9, review_count: 53, verified: true, qualification: 'BSc Computer Science — UKZN' },
                { id: 7, full_name: 'Sadia Islam Promi', subjects: ['Mathematics','Business Studies','Economics'], grade_levels: ['8','9','10','11','12'], bio: 'I am passionate about teaching because I enjoy helping students move from confusion to confidence. For me, tutoring is not only about explaining concepts - it is about understanding how each student learns and adapting my teaching style to help them succeed academically and personally. Over my 13+ years of teaching, I have worked with students from over 15+ countries, with different educational backgrounds and learning levels, teaching subjects such as Mathematics, Business Studies, Economics, Statistics, IELTS', hourly_rate: 294, experience_years: 13, rating: 5.0, review_count: 0, verified: true, qualification: 'Masters in Business Administration' },
                { id: 8, full_name: 'Amith Pattar', subjects: ['Mathematics','Physical Sciences'], grade_levels: ['7','8','9','10','11','12'], bio: 'I believe effective teaching is not just about solving problems, but helping students deeply understand concepts and develop confidence in their abilities. With an engineering background and several years of experience teaching mathematics to students from different educational backgrounds, I focus on making learning interactive, engaging, and easy to follow. My teaching approach emphasizes conceptual clarity, logical thinking, patience, and step-by-step explanation rather than rote memorization. I strive to create a comfortable learning environment where students feel encouraged to ask questions and actively participate. I am particularly passionate about helping students overcome fear of mathematics and develop genuine interest in the subject. My goal is to help learners improve academically while also building independent problem-solving skills and long-term confidence.', hourly_rate: 325, experience_years: 5, rating: 5.0, review_count: 0, verified: true, qualification: 'Bachelor’s Degree in Electrical and Electronics Engineering' }
            ].map(t => ({ ...t, hourly_rate: Math.round(t.hourly_rate * 1.2) }));

            if (params.subject) {
                tutors = tutors.filter(t => t.subjects.includes(params.subject));
            }
            if (params.search) {
                const s = params.search.toLowerCase();
                tutors = tutors.filter(t => t.full_name.toLowerCase().includes(s) || t.bio.toLowerCase().includes(s) || t.subjects.some(sub => sub.toLowerCase().includes(s)));
            }
            if (params.sort) {
                if (params.sort === 'price_low') tutors.sort((a, b) => a.hourly_rate - b.hourly_rate);
                else if (params.sort === 'price_high') tutors.sort((a, b) => b.hourly_rate - a.hourly_rate);
                else if (params.sort === 'experience') tutors.sort((a, b) => b.experience_years - a.experience_years);
                else tutors.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
            } else {
                tutors.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
            }

            return { tutors, count: tutors.length };
        }
    }

    static async getTutor(id) {
        return this.request(`/tutors/${id}`);
    }

    // Sessions
    static async bookSession(sessionData) {
        return this.request('/sessions', {
            method: 'POST',
            body: sessionData
        });
    }

    static async getSessions(status = '') {
        const query = status ? `?status=${status}` : '';
        return this.request(`/sessions${query}`);
    }

    static async updateSession(id, status) {
        return this.request(`/sessions/${id}`, {
            method: 'PUT',
            body: { status }
        });
    }

    // Profile
    static async getProfile() {
        return this.request('/profile');
    }

    static async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: profileData
        });
    }

    // Reviews
    static async submitReview(reviewData) {
        return this.request('/reviews', {
            method: 'POST',
            body: reviewData
        });
    }

    // Applications
    static async submitApplication(applicationData) {
        return await this.request('/applications', {
            method: 'POST',
            body: applicationData
        });
    }

    // Helpers
    static isLoggedIn() {
        return !!this.getToken();
    }

    static isStudent() {
        const user = this.getUser();
        return user && user.role === 'student';
    }

    static isTutor() {
        const user = this.getUser();
        return user && user.role === 'tutor';
    }
}

window.LwaziAPI = LwaziAPI;
