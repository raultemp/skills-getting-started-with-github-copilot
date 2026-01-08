document.addEventListener('DOMContentLoaded', () => {
    const activitiesList = document.getElementById('activities-list');
    const activitySelect = document.getElementById('activity');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    // Fetch and display activities
    fetch('/activities')
        .then(response => response.json())
        .then(activities => {
            activitiesList.innerHTML = '';
            activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

            for (const [name, details] of Object.entries(activities)) {
                // Create activity card
                const card = document.createElement('div');
                card.className = 'activity-card';
                card.innerHTML = `
                    <h4>${name}</h4>
                    <p><strong>Description:</strong> ${details.description}</p>
                    <p><strong>Schedule:</strong> ${details.schedule}</p>
                    <p><strong>Max Participants:</strong> ${details.max_participants}</p>
                    <div class="participants-section">
                        <strong>Current Participants:</strong>
                        <ul>
                            ${details.participants.length > 0 
                                ? details.participants.map(p => `<li>${p}</li>`).join('') 
                                : '<li>No participants yet.</li>'}
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
        })
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
        .then(response => response.json())
        .then(data => {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message;
            messageDiv.classList.remove('hidden');
            // Reload activities to update participants
            location.reload();
        })
        .catch(error => {
            messageDiv.className = 'message error';
            messageDiv.textContent = error.detail || 'An error occurred.';
            messageDiv.classList.remove('hidden');
        });
    });
});
