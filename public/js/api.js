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
                { id: 7, full_name: 'Sadia Islam Promi', email: 'sadia@example.com', subjects: ['Mathematics','Business Studies','Economics'], grade_levels: ['8','9','10','11','12'], bio: 'I am passionate about teaching because I enjoy helping students move from confusion to confidence.', hourly_rate: 294, experience_years: 13, rating: 5.0, review_count: 0, verified: true, qualification: 'Masters in Business Administration' },
                { id: 8, full_name: 'Amith Pattar', email: 'amith@example.com', subjects: ['Mathematics','Physical Sciences'], grade_levels: ['7','8','9','10','11','12'], bio: 'I believe effective teaching is not just about solving problems, but helping students deeply understand concepts.', hourly_rate: 325, experience_years: 5, rating: 5.0, review_count: 0, verified: true, qualification: 'Bachelor’s Degree in Electrical and Electronics Engineering' },
                { id: 9, full_name: 'Suhail Gul Malik', email: 'suhail@example.com', subjects: ['Mathematics','English','Economics'], grade_levels: ['8','9','10'], bio: 'I am applying to become a tutor because I enjoy helping others understand and succeed in their work.', hourly_rate: 250, experience_years: 5, rating: 5.0, review_count: 0, verified: true, qualification: 'Post Graduation in Economics' },
                { id: 10, full_name: 'Thembelihle Mngoma', email: 'thembi@example.com', subjects: ['isiZulu'], grade_levels: ['8','9','10','11','12'], bio: 'I am passionate about isiZulu and want to reach more students who need support in the subject.', hourly_rate: 300, experience_years: 5, rating: 5.0, review_count: 0, verified: true, qualification: 'Online Teaching Certificate' },
                { id: 11, full_name: 'Babatunde Olalekan', email: 'babatunde@example.com', subjects: ['English','Mathematics','Other'], grade_levels: ['8','9','10','11','12'], bio: 'My approach focuses on achieving tangible results through personalized mentorship and high-quality resources.', hourly_rate: 700, experience_years: 3, rating: 5.0, review_count: 0, verified: true, qualification: 'BSc. English' },
                { id: 12, full_name: 'Wael Hazem Fouda', email: 'wael@example.com', subjects: ['Information Technology','Computer Applications Technology','Other'], grade_levels: ['8','9','10','11','12'], bio: 'I teach traders to see the market through an institutional lens.', hourly_rate: 370, experience_years: 5, rating: 5.0, review_count: 0, verified: true, qualification: 'Bachelor\'s Degree' },
                { id: 13, full_name: 'Mcanthony Igwe', email: 'mcanthony@example.com', subjects: ['Mathematics','Other'], grade_levels: ['8','9','10','11','12'], bio: 'I am a tutor because I enjoy breaking complex ideas in mathematics and chess into recognizable patterns.', hourly_rate: 250, experience_years: 2, rating: 5.0, review_count: 0, verified: true, qualification: 'BSc computer science' },
                { id: 14, full_name: 'Sonia Rao', email: 'sonia@example.com', subjects: ['Mathematics'], grade_levels: ['4','5','6','7','8'], bio: 'I have good communication skills and I try to explain mathematical concepts step by step.', hourly_rate: 555, experience_years: 9, rating: 5.0, review_count: 0, verified: true, qualification: 'Masters in Mathematics' },
                { id: 15, full_name: 'Justus Mwanthi', email: 'justus@example.com', subjects: ['Mathematics','Statistics','Other'], grade_levels: ['8','10','11','12','Other'], bio: 'I am Justus Mwanthi, a mathematics and statistics tutor with more than six years of experience.', hourly_rate: 215, experience_years: 6, rating: 5.0, review_count: 0, verified: true, qualification: 'BSc Kisii University' },
                { id: 16, full_name: 'Courtney Stuart', email: 'courtney@example.com', subjects: ['English'], grade_levels: ['8','9','10','11','12'], bio: 'Hello there! I am Courtney, a tutor with over 6 years experience being an educator.', hourly_rate: 110, experience_years: 6, rating: 5.0, review_count: 0, verified: true, qualification: 'National Diploma - ATS' }
            ].map(t => ({ ...t, hourly_rate: Math.round(t.hourly_rate * 1.2) }));

            // Deduplicate
            const seen = new Set();
            tutors = tutors.filter(t => {
                const key = `${t.full_name}-${t.email}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

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
