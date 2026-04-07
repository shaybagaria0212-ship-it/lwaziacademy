// Lwazi Academy — Tutor Application Form Logic

document.addEventListener('DOMContentLoaded', () => {
    initCheckboxToggles();
    initFormSubmission();
});

let currentStep = 1;
const totalSteps = 3;

// ===== Step Navigation =====
function goToStep(step) {
    // Validate current step before moving forward
    if (step > currentStep && !validateStep(currentStep)) {
        return;
    }

    currentStep = step;

    // Update visible step
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) {
        target.classList.add('active');
    }

    // Update step indicator dots
    document.querySelectorAll('.step-dot').forEach(dot => {
        const dotStep = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (dotStep === step) {
            dot.classList.add('active');
        } else if (dotStep < step) {
            dot.classList.add('completed');
        }
    });

    // Scroll to top of form
    document.getElementById('application-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Validation =====
function validateStep(step) {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = '';

    if (step === 1) {
        const name = document.getElementById('apply-name').value.trim();
        const email = document.getElementById('apply-email').value.trim();
        const qualification = document.getElementById('apply-qualification').value.trim();

        if (!name) {
            showAlert(alertContainer, 'Please enter your full name.', 'error');
            return false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert(alertContainer, 'Please enter a valid email address.', 'error');
            return false;
        }
        if (!qualification) {
            showAlert(alertContainer, 'Please enter your highest qualification.', 'error');
            return false;
        }
        return true;
    }

    if (step === 2) {
        const subjects = document.querySelectorAll('input[name="subjects"]:checked');
        const grades = document.querySelectorAll('input[name="grade_levels"]:checked');

        if (subjects.length === 0) {
            showAlert(alertContainer, 'Please select at least one subject.', 'error');
            return false;
        }
        if (grades.length === 0) {
            showAlert(alertContainer, 'Please select at least one grade level.', 'error');
            return false;
        }
        return true;
    }

    return true;
}

// ===== Checkbox Toggle Styling =====
function initCheckboxToggles() {
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const label = checkbox.closest('.checkbox-item');
            if (checkbox.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
    });
}

// ===== Form Submission =====
function initFormSubmission() {
    const form = document.getElementById('tutor-application-form');
    const submitBtn = document.getElementById('submit-application-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all steps
        if (!validateStep(1) || !validateStep(2)) {
            return;
        }

        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = '';

        // Gather form data
        const subjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);
        const grade_levels = Array.from(document.querySelectorAll('input[name="grade_levels"]:checked')).map(cb => cb.value);

        const payload = {
            full_name: document.getElementById('apply-name').value.trim(),
            email: document.getElementById('apply-email').value.trim(),
            phone: document.getElementById('apply-phone').value.trim(),
            qualification: document.getElementById('apply-qualification').value.trim(),
            subjects,
            grade_levels,
            experience_years: parseInt(document.getElementById('apply-experience').value) || 0,
            hourly_rate: parseFloat(document.getElementById('apply-rate').value) || 0,
            motivation: document.getElementById('apply-motivation').value.trim()
        };

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="lwazi-spinner" style="width:18px;height:18px;border-width:2px;"></div>
            Submitting...
        `;

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong.');
            }

            // Show success state
            document.getElementById('application-form-container').style.display = 'none';
            const successState = document.getElementById('success-state');
            successState.classList.add('active');
            successState.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } catch (err) {
            showAlert(alertContainer, err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span class="material-symbols-outlined text-lg">send</span>
                Submit Application
            `;
        }
    });
}

// Expose goToStep globally
window.goToStep = goToStep;
