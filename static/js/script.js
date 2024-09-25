const startNewButton = document.getElementById('startNewButton');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const taskForm = document.getElementById('taskForm');
const timesheetSection = document.getElementById('timesheetSection');
const totalHoursElement = document.getElementById('totalHours');

let projects = [];
let timerIntervals = {};

// Utility function to fetch data from API
async function fetchFromAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`http://127.0.0.1:5000/${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert(`An error occurred while interacting with the server: ${error.message}`);
        throw error; // rethrow to be handled in calling function if necessary
    }
}

// Load existing projects from API on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        projects = await fetchFromAPI('works');
        renderProjects();
        updateTotalHours();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
});

// Show modal when "Start new" button is clicked
startNewButton.addEventListener('click', () => {
    loadWorkItems();
    toggleModal(true);
});

// Close modal when close button is clicked
closeModal.addEventListener('click', () => {
    toggleModal(false);
});

// Handle form submission to add a new project
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const work = document.getElementById('work').value.trim();
    const description = document.getElementById('description').value.trim();
    const type = document.getElementById('type').value.trim();

    if (work && description && type) {
        const newProject = { work, description, type, startTime: 0, elapsedTime: 0 };

        try {
            const response = await fetchFromAPI('works', 'POST', newProject);
            if (response.message === 'Work added successfully') {
                projects.push(newProject);
                renderProjects();
                updateTotalHours();
            } else {
                throw new Error('Failed to add project');
            }
        } catch (error) {
            console.error('Error adding project:', error);
        } finally {
            toggleModal(false);
        }
    } else {
        alert('Please fill in all fields');
    }
});

// Toggle modal visibility
function toggleModal(show) {
    modal.classList.toggle('hidden', !show);
    modal.setAttribute('aria-hidden', !show);
}

// Render the list of projects
function renderProjects() {
    timesheetSection.innerHTML = ''; // Clear previous entries

    projects.forEach((project, index) => {
        if (project.work && project.description) {
            const projectCard = document.createElement('div');
            projectCard.classList.add('timesheet-card');
            projectCard.innerHTML = `
                <h3>Project: ${project.work}</h3>
                <p>Description: ${project.description}</p>
                <p>Type: ${project.type}</p>
                <div class="time" id="time${index}">${timeToString(project.elapsedTime)}</div>
                <div class="controls">
                    <button id="playPauseButton${index}" onclick="toggleTimer(${index})" class="play">Pause</button>
                    <button onclick="editProject('${project._id}', ${index})" class="edit">Edit</button>
                    <button onclick="deleteProject('${project._id}', ${index})" class="delete">Delete</button>
                </div>
            `;
            timesheetSection.appendChild(projectCard);

            updateProjectTime(index);
        }
    });
    updateTotalHours();
}

// Update time for each project
function updateProjectTime(index) {
    const timeElement = document.getElementById(`time${index}`);
    timeElement.textContent = timeToString(projects[index].elapsedTime);
}

// Start the timer for a project
function startTimer(index) {
    if (projects[index].startTime === 0) {
        projects[index].startTime = Date.now();
    } else {
        projects[index].startTime = Date.now() - projects[index].elapsedTime;
    }

    timerIntervals[index] = setInterval(() => {
        const currentTime = Date.now();
        projects[index].elapsedTime = currentTime - projects[index].startTime;

        updateProjectTime(index);
        updateTotalHours();
    }, 1000);
}

// Stop the timer for a project
function stopTimer(index) {
    clearInterval(timerIntervals[index]);
    delete timerIntervals[index];
    projects[index].elapsedTime = Date.now() - projects[index].startTime;
}

// Toggle timer for a project
function toggleTimer(index) {
    const button = document.getElementById(`playPauseButton${index}`);
    if (timerIntervals[index]) {
        stopTimer(index);
        button.textContent = 'Play';
        button.classList.replace('play', 'pause');
    } else {
        startTimer(index);
        button.textContent = 'Pause';
        button.classList.replace('pause', 'play');
    }
    updateTotalHours();
}

// Update total hours across all projects
function updateTotalHours() {
    const totalElapsedTime = projects.reduce((total, project) => total + (project.elapsedTime || 0), 0);
    totalHoursElement.textContent = `Total hours: ${timeToString(totalElapsedTime)}`;
}

// Convert time (ms) to HH:MM:SS format
function timeToString(time) {
    if (!time || isNaN(time)) return '00:00:00';
    
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const seconds = Math.floor((time / 1000) % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Load work items into the dropdown when modal is opened
async function loadWorkItems() {
    const workDropdown = document.getElementById('work');
    workDropdown.innerHTML = '<option value="">Search and choose</option>';

    try {
        const works = await fetchFromAPI('works');
        works.forEach(work => {
            const option = document.createElement('option');
            option.value = work.work;
            option.textContent = work.work;
            workDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading work items:', error);
    }
}

// Edit a project
async function editProject(id, index) {
    const work = prompt("Enter new work name:", projects[index].work);
    const description = prompt("Enter new description:", projects[index].description);
    const type = prompt("Enter new type:", projects[index].type);

    if (work && description && type) {
        const updatedProject = { work, description, type };

        try {
            await fetchFromAPI(`works/${id}`, 'PUT', updatedProject);
            projects[index] = { ...projects[index], ...updatedProject };
            renderProjects();
        } catch (error) {
            console.error('Error editing project:', error);
        }
    }
}

// Delete a project
async function deleteProject(id, index) {
    if (confirm("Are you sure you want to delete this project?")) {
        try {
            await fetchFromAPI(`works/${id}`, 'DELETE');
            projects.splice(index, 1);
            renderProjects();
            updateTotalHours();
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    }
}
