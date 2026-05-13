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
    const studentFields = document.getElementById('student-fields');
    const tutorFields = document.getElementById('tutor-fields');
    const submitBtn = document.getElementById('submit-btn');
    const alertContainer = document.getElementById('alert-container');

    // Role toggle
    studentBtn.addEventListener('click', () => {
        roleInput.value = 'student';
        studentBtn.classList.add('active');
        tutorBtn.classList.remove('active');
        studentFields.classList.remove('hidden');
        tutorFields.classList.add('hidden');
        // Clear required from tutor fields, add to student
        document.getElementById('grade_level').required = true;
    });

    tutorBtn.addEventListener('click', () => {
        roleInput.value = 'tutor';
        tutorBtn.classList.add('active');
        studentBtn.classList.remove('active');
        studentFields.classList.add('hidden');
        tutorFields.classList.remove('hidden');
        // Clear required from student fields, add to tutor
        document.getElementById('grade_level').required = false;
    });

    // Checkbox styling
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('.checkbox-item').classList.toggle('selected', cb.checked);
        });
    });

    let pendingEmail = null;

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

        if (roleInput.value === 'student') {
            userData.grade_level = document.getElementById('grade_level').value;
        }

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
            pendingEmail = userData.email;
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('verify-form').classList.remove('hidden');
            showAlert(alertContainer, 'Account created! Please check your email for the verification code.', 'success');
        } catch (err) {
            showAlert(alertContainer, err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-lg">arrow_forward</span> Create Account';
        }
    });

    const verifyForm = document.getElementById('verify-form');
    const verifyBtn = document.getElementById('verify-btn');

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';
        
        const code = document.getElementById('verify-code').value.trim();
        
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<div class="lwazi-spinner mx-auto" style="width:20px;height:20px;border-width:2px"></div>';
        
        try {
            await LwaziAPI.verifyRegistration(pendingEmail, code);
            showAlert(alertContainer, 'Verification successful! You are now logged in.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
        } catch (err) {
            showAlert(alertContainer, err.message, 'error');
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">verified</span> Verify Account';
        }
    });
});
