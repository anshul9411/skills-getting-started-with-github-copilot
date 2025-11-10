document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicating options on subsequent loads
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Add a participants section (empty UL will be populated below)
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

  // Add option to select dropdown
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  activitySelect.appendChild(option);

        // Populate participants list (each participant gets a delete button)
        const participantsUl = activityCard.querySelector(".participants-list");
        // helper to create 'no participants' row
        function appendNoParticipants() {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "no-participants";
          participantsUl.appendChild(li);
        }

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.className = "delete-btn";
            btn.type = "button";
            btn.title = "Remove participant";
            btn.innerHTML = "&times;";

            // Click handler to unregister participant
            btn.addEventListener("click", async (e) => {
              e.stopPropagation();
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();
                if (resp.ok) {
                  // remove li from DOM
                  li.remove();
                  // If list is now empty, show the empty state
                  if (participantsUl.querySelectorAll("li").length === 0) {
                    appendNoParticipants();
                  }
                } else {
                  console.error("Failed to remove participant:", result);
                  alert(result.detail || result.message || "Failed to remove participant");
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                alert("Failed to remove participant. Try again.");
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsUl.appendChild(li);
          });
        } else {
          appendNoParticipants();
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
