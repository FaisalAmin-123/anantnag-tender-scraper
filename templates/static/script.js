// // API Configuration
// const API_URL = window.location.origin; // assume same origin as the UI (works when served by Flask)

// // DOM Elements
// const fetchBtn = document.getElementById('fetchBtn');
// const numTendersInput = document.getElementById('numTenders');
// const progressContainer = document.getElementById('progressContainer');
// const progressFill = document.getElementById('progressFill');
// const progressText = document.getElementById('progressText');
// const resultsList = document.getElementById('resultsList');
// const messageBox = document.getElementById('messageBox');
// const systemStatus = document.getElementById('systemStatus');
// const apiStatus = document.getElementById('apiStatus');
// const groupsSelect = document.getElementById('groupsSelect');
// const whatsappStatus = document.getElementById('whatsappStatus');
// const loadGroupsBtn = document.getElementById('loadGroupsBtn');
// const sendToGroupBtn = document.getElementById('sendToGroupBtn');

// window.addEventListener('load', function() {
//     checkAPIStatus();
// });

// // Check if API is running
// function checkAPIStatus() {
//     fetch(`${API_URL}/api/health`, { credentials: 'include' })
//         .then(response => {
//             if (!response.ok) throw new Error("API not healthy");
//             apiStatus.textContent = '🟢 Connected';
//             apiStatus.className = 'status-badge ready';
//         })
//         .catch(error => {
//             apiStatus.textContent = '🔴 Disconnected';
//             apiStatus.className = 'status-badge error';
//             showMessage('⚠️ Warning: API is not running or requires auth. Start it and log in via browser (Basic Auth).', 'error');
//         });
// }

// // Fetch Tenders Function
// function fetchTenders() {
//     const numTenders = parseInt(numTendersInput.value);

//     // Validation
//     if (isNaN(numTenders) || numTenders < 1 || numTenders > 50) {
//         showMessage('❌ Please enter a number between 1 and 50', 'error');
//         return;
//     }

//     // Disable button
//     fetchBtn.disabled = true;
//     systemStatus.textContent = '⏳ Processing';
//     systemStatus.className = 'status-badge processing';

//     // Show progress
//     progressContainer.style.display = 'block';
//     progressFill.style.width = '0%';
//     progressText.textContent = 'Starting job...';

//     // Send request to API
//     fetch(`${API_URL}/api/scrape-tenders`, {
//         method: 'POST',
//         credentials: 'include',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             location: 'anantnag',
//             num_tenders: numTenders
//         })
//     })
//     .then(response => {
//         if (!response.ok) return response.json().then(js => Promise.reject(js));
//         return response.json();
//     })
//     .then(data => {
//         console.log('Response:', data);

//         if (data.status === 'success') {
//             progressText.textContent = `✅ Job completed successfully!`;
//             progressFill.style.width = '100%';

//             // Show real filenames returned by the API (if present)
//             const files = data.tender_files || [];
//             setTimeout(() => {
//                 updateStatus(files.length, files);
//                 showMessage(`✅ Success! Downloaded ${files.length} tenders. Now choose a WhatsApp group to send.`, 'success');
//             }, 800);
//         } else if (data.status === 'warning') {
//             progressText.textContent = `⚠️ No new tenders found`;
//             progressFill.style.width = '100%';
//             showMessage(`⚠️ ${data.message}`, 'info');
//         } else {
//             const msg = data.message || JSON.stringify(data);
//             showMessage('❌ Error: ' + msg, 'error');
//             progressContainer.style.display = 'none';
//         }
//     })
//     .catch(error => {
//         console.error('Fetch error:', error);
//         const msg = (error && error.message) ? error.message : JSON.stringify(error);
//         showMessage(`❌ Error: ${msg}. Make sure API is running and you are logged in.`, 'error');
//         progressContainer.style.display = 'none';
//     })
//     .finally(() => {
//         fetchBtn.disabled = false;
//         systemStatus.textContent = '🟢 Ready';
//         systemStatus.className = 'status-badge ready';
//     });
// }

// // Update Status - accept an array of filenames (optional)
// function updateStatus(count, filenames) {
//     const now = new Date();
//     const timeString = now.toLocaleTimeString();
//     document.getElementById('lastRun').textContent = timeString;

//     if (Array.isArray(filenames) && filenames.length > 0) {
//         filenames.forEach((fname) => addResultItem(fname));
//     } else if (count && count > 0) {
//         for (let i = 0; i < count; i++) {
//             const fileName = `tender_${Date.now()}_${i}.pdf`;
//             addResultItem(fileName);
//         }
//     }
// }

// // Add Result Item uses real filename and links to served file
// function addResultItem(fileName) {
//     const emptyMsg = resultsList.querySelector('.empty-message');
//     if (emptyMsg) emptyMsg.remove();

//     const resultItem = document.createElement('div');
//     resultItem.className = 'result-item';
//     // create a link to the file served by the Flask route (Flask will need a static or send-file route)
//     const safeHref = `${API_URL}/pdfs/${encodeURIComponent(fileName)}`;
//     resultItem.innerHTML = `
//         <div>
//             <div class="result-item-name">📄 <a href="${safeHref}" target="_blank">${fileName}</a></div>
//             <div class="result-item-size">Just now</div>
//         </div>
//         <div class="result-item-status">✅ Downloaded</div>
//     `;
//     resultsList.insertBefore(resultItem, resultsList.firstChild);
// }

// // Show Message
// function showMessage(message, type) {
//     messageBox.textContent = message;
//     messageBox.className = `message-box ${type}`;
//     messageBox.style.display = 'block';

//     // Auto hide after 8 seconds
//     setTimeout(() => {
//         messageBox.style.display = 'none';
//     }, 8000);
// }

// /* -----------------------
//    WhatsApp group runtime UI
//    ----------------------- */
// // --- WhatsApp group helpers ---
// async function loadGroups() {
//     showMessage("Loading WhatsApp groups... (this opens a browser window)", "info");
//     try {
//         const resp = await fetch(`${API_URL}/api/whatsapp/groups`);
//         const data = await resp.json();
//         if (!resp.ok) {
//             showMessage("Failed to load groups: " + data.message, "error");
//             return;
//         }
//         const sel = document.getElementById("groupSelect");
//         sel.innerHTML = "";
//         if (!data.groups || data.groups.length === 0) {
//             sel.innerHTML = '<option value="">(No groups visible)</option>';
//             showMessage("No groups found or WhatsApp not logged in. Scan QR if browser opened and try again.", "error");
//             return;
//         }
//         sel.innerHTML = '<option value="">-- Select group --</option>';
//         data.groups.forEach(g => {
//             const opt = document.createElement("option");
//             opt.value = g;
//             opt.textContent = g;
//             sel.appendChild(opt);
//         });
//         showMessage(`Loaded ${data.groups.length} groups`, "success");
//     } catch (e) {
//         console.error(e);
//         showMessage("Error loading groups: " + e.message, "error");
//     }
// }

// async function sendToGroup() {
//     const sel = document.getElementById("groupSelect");
//     const group = sel.value;
//     const limit = parseInt(document.getElementById("filesToSend").value || "2", 10);
//     if (!group) {
//         showMessage("Please select a WhatsApp group first (Load groups).", "error");
//         return;
//     }
//     showMessage(`Sending up to ${limit} PDFs to ${group}...`, "info");
//     try {
//         const resp = await fetch(`${API_URL}/api/whatsapp/send`, {
//             method: "POST",
//             headers: {'Content-Type': 'application/json'},
//             body: JSON.stringify({group: group, limit: limit})
//         });
//         const data = await resp.json();
//         if (!resp.ok) {
//             showMessage("Failed sending: " + (data.message || JSON.stringify(data)), "error");
//             return;
//         }
//         showMessage(`Sent ${data.sent.length} file(s) to ${group}`, "success");
//     } catch (e) {
//         console.error(e);
//         showMessage("Error sending: " + e.message, "error");
//     }
// }


// static/script.js
// API Configuration
const API_URL = "http://localhost:5000";

// DOM Elements
const fetchBtn = document.getElementById('fetchBtn');
const numTendersInput = document.getElementById('numTenders');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsList = document.getElementById('resultsList');
const messageBox = document.getElementById('messageBox');
const systemStatus = document.getElementById('systemStatus');
const apiStatus = document.getElementById('apiStatus');

window.addEventListener('load', function() {
    checkAPIStatus();
    setTimeout(loadWhatsAppGroups, 300);
});

// Check if API is running
function checkAPIStatus() {
    fetch(`${API_URL}/api/health`)
        .then(response => response.json())
        .then(data => {
            apiStatus.textContent = '🟢 Connected';
            apiStatus.className = 'status-badge ready';
        })
        .catch(error => {
            apiStatus.textContent = '🔴 Disconnected';
            apiStatus.className = 'status-badge error';
            showMessage('⚠️ Warning: API is not running. Please start api.py first.', 'error');
        });
}

// populate group dropdown from server-configured groups
function loadWhatsAppGroups() {
    fetch(`${API_URL}/api/whatsapp/groups`)
        .then(r => r.json())
        .then(data => {
            const sel = document.getElementById('whatsappGroup');
            sel.innerHTML = `<option value="">(Use server default)</option>`;
            if (data && Array.isArray(data.groups)) {
                data.groups.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g;
                    opt.textContent = g;
                    sel.appendChild(opt);
                });
            }
        })
        .catch(err => {
            console.error("Could not load groups:", err);
        });
}

// Fetch Tenders Function
function fetchTenders() {
    const numTenders = parseInt(numTendersInput.value);

    // Validation
    if (isNaN(numTenders) || numTenders < 1 || numTenders > 50) {
        showMessage('❌ Please enter a number between 1 and 50', 'error');
        return;
    }

    // determine group
    const chosenGroup = document.getElementById('whatsappGroup').value;
    const customGroup = document.getElementById('customGroup').value.trim();
    const whatsapp_group = customGroup || (chosenGroup || null);

    // Disable button
    fetchBtn.disabled = true;
    systemStatus.textContent = '⏳ Processing';
    systemStatus.className = 'status-badge processing';

    // Show progress
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting job...';

    // Send request to API
    fetch(`${API_URL}/api/scrape-tenders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: 'anantnag',
            num_tenders: numTenders,
            whatsapp_group: whatsapp_group
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response:', data);

        if (data.status === 'success') {
            progressText.textContent = `✅ Job completed successfully!`;
            progressFill.style.width = '100%';

            const files = data.tender_files || [];
            const whatsapp_result = data.whatsapp_result || {};
            setTimeout(() => {
                updateStatus(files.length, files);
                showMessage(`✅ Success! Downloaded ${files.length} tenders. WhatsApp send: ${JSON.stringify(whatsapp_result)}`, 'success');
            }, 1200);
        } else if (data.status === 'warning') {
            progressText.textContent = `⚠️ No new tenders found`;
            progressFill.style.width = '100%';
            showMessage(`⚠️ ${data.message}`, 'info');
        } else {
            showMessage('❌ Error: ' + data.message, 'error');
            progressContainer.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        showMessage(`❌ Error: ${error.message}. Make sure api.py is running on http://localhost:5000`, 'error');
        progressContainer.style.display = 'none';
    })
    .finally(() => {
        fetchBtn.disabled = false;
        systemStatus.textContent = '🟢 Ready';
        systemStatus.className = 'status-badge ready';
    });
}

// Update Status
function updateStatus(count, filenames) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastRun').textContent = timeString;

    if (Array.isArray(filenames) && filenames.length > 0) {
        filenames.forEach((fname) => addResultItem(fname));
    } else if (count && count > 0) {
        for (let i = 0; i < count; i++) {
            const fileName = `tender_${Date.now()}_${i}.pdf`;
            addResultItem(fileName);
        }
    }
}

// Add Result Item uses real filename and links to served file
function addResultItem(fileName) {
    const emptyMsg = resultsList.querySelector('.empty-message');
    if (emptyMsg) emptyMsg.remove();

    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    const safeHref = `${API_URL}/pdfs/${encodeURIComponent(fileName)}`;
    resultItem.innerHTML = `
        <div>
            <div class="result-item-name">📄 <a href="${safeHref}" target="_blank">${fileName}</a></div>
            <div class="result-item-size">Just now</div>
        </div>
        <div class="result-item-status">✅ Sent</div>
    `;
    resultsList.insertBefore(resultItem, resultsList.firstChild);
}

// Show Message
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 6000);
}
