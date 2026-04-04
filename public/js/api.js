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
            const data = await response.json();

            if (!response.ok) {
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
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: userData
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
        const query = new URLSearchParams(params).toString();
        return this.request(`/tutors${query ? '?' + query : ''}`);
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
