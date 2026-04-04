// Lwazi Academy — Registration Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (LwaziAPI.isLoggedIn()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('register-form');
    const roleInput = document.getElementById('role-input');
    const studentBtn = document.getElementById('role-student-btn');
    const tutorBtn = document.getElementById('role-tutor-btn');
    const tutorFields = document.getElementById('tutor-fields');
    const submitBtn = document.getElementById('submit-btn');
    const alertContainer = document.getElementById('alert-container');

    // Role toggle
    studentBtn.addEventListener('click', () => {
        roleInput.value = 'student';
        studentBtn.classList.add('active');
        tutorBtn.classList.remove('active');
        tutorFields.classList.add('hidden');
    });

    tutorBtn.addEventListener('click', () => {
        roleInput.value = 'tutor';
        tutorBtn.classList.add('active');
        studentBtn.classList.remove('active');
        tutorFields.classList.remove('hidden');
    });

    // Checkbox styling
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('.checkbox-item').classList.toggle('selected', cb.checked);
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            showAlert(alertContainer, 'Passwords do not match', 'error');
            return;
        }

        const userData = {
            full_name: document.getElementById('full_name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: password,
            role: roleInput.value
        };

        if (roleInput.value === 'tutor') {
            const subjectCheckboxes = document.querySelectorAll('input[name="subjects"]:checked');
            const gradeCheckboxes = document.querySelectorAll('input[name="grade_levels"]:checked');

            if (subjectCheckboxes.length === 0) {
                showAlert(alertContainer, 'Please select at least one subject', 'error');
                return;
            }
            if (gradeCheckboxes.length === 0) {
                showAlert(alertContainer, 'Please select at least one grade level', 'error');
                return;
            }

            userData.subjects = Array.from(subjectCheckboxes).map(cb => cb.value);
            userData.grade_levels = Array.from(gradeCheckboxes).map(cb => cb.value);
            userData.qualification = document.getElementById('qualification').value.trim();
            userData.hourly_rate = Number(document.getElementById('hourly_rate').value) || 0;
            userData.experience_years = Number(document.getElementById('experience_years').value) || 0;
            userData.bio = document.getElementById('bio').value.trim();
        }

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="lwazi-spinner mx-auto" style="width:20px;height:20px;border-width:2px"></div>';

        try {
            await LwaziAPI.register(userData);
            showAlert(alertContainer, 'Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } catch (err) {
            showAlert(alertContainer, err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-lg">arrow_forward</span> Create Account';
        }
    });
});
