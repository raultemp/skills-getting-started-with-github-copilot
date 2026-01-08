document.addEventListener('DOMContentLoaded', () => {
    const activitiesList = document.getElementById('activities-list');
    const activitySelect = document.getElementById('activity');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    // Function to render activities
    function renderActivities(activities) {
        activitiesList.innerHTML = '';
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

        for (const [name, details] of Object.entries(activities)) {
            // Create activity card
            const card = document.createElement('div');
            card.className = 'activity-card';
            // Build participants list with delete icon
            let participantsHTML = '';
            if (details.participants.length > 0) {
                participantsHTML = details.participants.map(p => `
                    <li class="participant-item">
                        <span class="participant-email">${p}</span>
                        <span class="delete-participant" title="Remove" data-activity="${name}" data-email="${p}">&#128465;</span>
                    </li>
                `).join('');
            } else {
                participantsHTML = '<li>No participants yet.</li>';
            }
            card.innerHTML = `
                <h4>${name}</h4>
                <p><strong>Description:</strong> ${details.description}</p>
                <p><strong>Schedule:</strong> ${details.schedule}</p>
                <p><strong>Max Participants:</strong> ${details.max_participants}</p>
                <div class="participants-section">
                    <strong>Current Participants:</strong>
                    <ul class="participants-list">
                        ${participantsHTML}
                    </ul>
                </div>
            `;
            activitiesList.appendChild(card);

            // Add to select dropdown
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            activitySelect.appendChild(option);
        }

        // Add event listeners for delete icons
        document.querySelectorAll('.delete-participant').forEach(icon => {
            icon.addEventListener('click', function() {
                const activity = this.getAttribute('data-activity');
                const email = this.getAttribute('data-email');
                if (confirm(`Remove ${email} from ${activity}?`)) {
                    fetch(`/activities/${encodeURIComponent(activity)}/unregister`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ email })
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => { throw new Error(err.detail || 'An error occurred'); });
                        }
                        return response.json();
                    })
                    .then(data => {
                        messageDiv.className = 'message success';
                        messageDiv.textContent = data.message;
                        messageDiv.classList.remove('hidden');
                        // Re-fetch and re-render activities
                        fetch('/activities')
                            .then(response => response.json())
                            .then(renderActivities)
                            .catch(error => {
                                console.error('Error re-fetching activities:', error);
                            });
                    })
                    .catch(error => {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = error.message || 'An error occurred.';
                        messageDiv.classList.remove('hidden');
                    });
                }
            });
        });
    }

    // Fetch and display activities
    fetch('/activities')
        .then(response => response.json())
        .then(renderActivities)
        .catch(error => {
            activitiesList.innerHTML = '<p>Error loading activities.</p>';
            console.error('Error fetching activities:', error);
        });

    // Handle signup form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const activity = document.getElementById('activity').value;

        fetch(`/activities/${encodeURIComponent(activity)}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.detail || 'An error occurred'); });
            }
            return response.json();
        })
        .then(data => {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message;
            messageDiv.classList.remove('hidden');
            // Clear form
            signupForm.reset();
            // Re-fetch and re-render activities
            fetch('/activities')
                .then(response => response.json())
                .then(renderActivities)
                .catch(error => {
                    console.error('Error re-fetching activities:', error);
                });
        })
        .catch(error => {
            messageDiv.className = 'message error';
            messageDiv.textContent = error.message || 'An error occurred.';
            messageDiv.classList.remove('hidden');
        });
    });
});
