// js/app.js - Main Application Logic
//const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrpivNKPmk_XerQeOxSiq6mS3ZP72xmX6XZsPVBjk2oq071tFKdiBMk3xa4tw6DovM/exec'; // Replace with your Web App URL
//const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhKI1F42e443PGQKOAEBVSm9KwrOZi-LLOrCW0mJ5WAtuakCtOglySZ7UOBh4EOZaB/exec'; // Replace with your Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_eS0V2Y3VsbnKnVs6Eo75TBVvl7IkdHFhXlTw6h-kFvRiLMmMbc227_3EMmY-m9Gl/exec'; // Replace with your Web App URL


let state = {
    user: null,
    families: [],
    currentFamilyId: null,
    members: [],
    showEditControls: true // New state for toggle
};

// --- Auth ---
function toggleAuth(type) {
    if (type === 'signup') {
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('signup-card').classList.remove('hidden');
    } else {
        document.getElementById('signup-card').classList.add('hidden');
        document.getElementById('login-card').classList.remove('hidden');
    }
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        return Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill all fields'
        });
    }

    Swal.showLoading();
    const result = await apiCall({ action: 'login', email, password });
    Swal.close();

    if (result.success) {
        state.user = result.user;
        showMainSection();
        loadFamilies();
        Swal.fire({
            icon: 'success',
            title: 'Welcome!',
            text: `Logged in as ${state.user.displayName}`,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.message
        });
    }
}

async function signup() {
    const displayName = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    
    if (!displayName || !email || !password) {
        return Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill all fields'
        });
    }

    Swal.showLoading();
    const result = await apiCall({ action: 'signup', email, password, displayName });
    Swal.close();

    if (result.success) {
        Swal.fire({
            icon: 'success',
            title: 'Signup Successful!',
            text: 'Please login with your credentials.'
        });
        toggleAuth('login');
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: result.message
        });
    }
}

function showMainSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
}

function logout() {
    state.user = null;
    state.showEditControls = true; // Reset toggle state
    location.reload();
}

// --- Families ---
async function loadFamilies() {
    const result = await apiCall({ action: 'getFamilies', email: state.user.email });
    if (result.success) {
        state.families = result.families;
        renderFamilyList();
    }
}

function renderFamilyList() {
    const list = document.getElementById('family-list');
    list.innerHTML = state.families.map(f => `
        <li>
            <button onclick="selectFamily('${f.familyId}', '${f.familyName}')" 
                class="w-full text-left p-2 rounded hover:bg-gray-200 ${state.currentFamilyId === f.familyId ? 'bg-blue-100 font-bold' : ''}">
                ${f.familyName}
            </button>
        </li>
    `).join('');
}

async function selectFamily(familyId, familyName) {
    state.currentFamilyId = familyId;
    document.getElementById('current-family-name').innerText = familyName;
    renderFamilyList();
    loadMembers();
}

async function showCreateFamilyModal() {
    const { value: name } = await Swal.fire({
        title: 'Enter Family Name',
        input: 'text',
        inputPlaceholder: 'Family Name',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) return 'You need to write something!'
        }
    });

    if (name) {
        Swal.showLoading();
        const result = await apiCall({ action: 'createFamily', email: state.user.email, familyName: name });
        Swal.close();
        if (result.success) {
            loadFamilies();
            Swal.fire('Created!', 'Your family has been created.', 'success');
        }
    }
}

// --- Members ---
async function loadMembers() {
    if (!state.currentFamilyId) return;
    const result = await apiCall({ action: 'getMembers', familyId: state.currentFamilyId });
    if (result.success) {
        state.members = result.members;
        renderTree(state.members);
        updateEditControlsVisibility(); // Update visibility after rendering
    }
}

// Toggle function for edit controls
function toggleEditControls() {
    state.showEditControls = !state.showEditControls;
    updateEditControlsVisibility();
    
    const btn = document.getElementById('toggle-controls-btn');
    if (state.showEditControls) {
        btn.classList.remove('bg-gray-500');
        btn.classList.add('bg-green-500');
        btn.title = 'Hide Edit Controls';
    } else {
        btn.classList.remove('bg-green-500');
        btn.classList.add('bg-gray-500');
        btn.title = 'Show Edit Controls';
    }
}

// Update visibility of edit controls
function updateEditControlsVisibility() {
    const controlDivs = d3.selectAll('.node').selectAll('foreignObject').filter(function() {
        // Only target the control foreignObjects (those with edit/delete buttons)
        return d3.select(this).select('div').select('button').size() > 0 && 
               d3.select(this).attr('y') > 50; // Controls are positioned below name
    });
    
    if (state.showEditControls) {
        controlDivs.style('display', 'block');
    } else {
        controlDivs.style('display', 'none');
    }
}

async function addMemberNode() {
    if (!state.currentFamilyId) {
        return Swal.fire('Error', 'Select a family first', 'error');
    }

    // Filter members with Generation 1 for the parent dropdown
    const gen1Members = state.members.filter(m => m.generation == 1);
    const parentOptions = gen1Members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    const { value: formValues } = await Swal.fire({
        title: 'Add New Member',
        html:
            '<div class="text-left">' +
            '<label class="block text-sm font-medium text-gray-700">Name</label>' +
            '<input id="swal-name" class="swal2-input mt-1" placeholder="Enter name" style="width:100%;margin:8px 0;">' +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Parent (Generation 1)</label>' +
            '<select id="swal-parent" class="swal2-input mt-1" style="width:100%;margin:8px 0;">' +
            '<option value="">-- None (Root) --</option>' +
            parentOptions +
            '</select>' +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Generation</label>' +
            '<input id="swal-gen" type="number" class="swal2-input mt-1" value="1" style="width:100%;margin:8px 0;">' +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Photo</label>' +
            '<input id="swal-file" type="file" class="swal2-file mt-1" accept="image/*" style="width:100%;margin:8px 0;">' +
            '</div>',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const name = document.getElementById('swal-name').value;
            const parentId = document.getElementById('swal-parent').value;
            const generation = document.getElementById('swal-gen').value;
            const fileInput = document.getElementById('swal-file');
            
            if (!name) {
                Swal.showValidationMessage('Name is required');
                return false;
            }

            return {
                name,
                parentId,
                generation,
                file: fileInput.files[0]
            }
        }
    });

    if (formValues) {
        let photoBase64 = null;
        if (formValues.file) {
            Swal.showLoading();
            photoBase64 = await fileToBase64(formValues.file);
        }

        Swal.showLoading();
        const result = await apiCall({
            action: 'addMember',
            familyId: state.currentFamilyId,
            name: formValues.name,
            parentId: formValues.parentId,
            generation: parseInt(formValues.generation),
            photoBase64: photoBase64
        });
        Swal.close();

        if (result.success) {
            loadMembers();
            Swal.fire('Added!', 'Member has been added.', 'success');
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    }
}

async function editMemberNode(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return Swal.fire('Error', 'Member not found', 'error');

    // Filter members with Generation 1 for the parent dropdown
    const gen1Members = state.members.filter(m => m.generation == 1);
    const parentOptions = gen1Members.map(m => `<option value="${m.id}" ${m.id === member.parentId ? 'selected' : ''}>${m.name}</option>`).join('');

    const { value: formValues } = await Swal.fire({
        title: 'Edit Member',
        html:
            '<div class="text-left">' +
            '<label class="block text-sm font-medium text-gray-700">Name</label>' +
            `<input id="swal-edit-name" class="swal2-input mt-1" value="${member.name}" style="width:100%;margin:8px 0;">` +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Parent (Generation 1)</label>' +
            '<select id="swal-edit-parent" class="swal2-input mt-1" style="width:100%;margin:8px 0;">' +
            '<option value="">-- None (Root) --</option>' +
            parentOptions +
            '</select>' +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Generation</label>' +
            `<input id="swal-edit-gen" type="number" class="swal2-input mt-1" value="${member.generation}" style="width:100%;margin:8px 0;">` +
            '<label class="block text-sm font-medium text-gray-700 mt-4">Photo (Leave blank to keep current)</label>' +
            '<input id="swal-edit-file" type="file" class="swal2-file mt-1" accept="image/*" style="width:100%;margin:8px 0;">' +
            '</div>',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const name = document.getElementById('swal-edit-name').value;
            const parentId = document.getElementById('swal-edit-parent').value;
            const generation = document.getElementById('swal-edit-gen').value;
            const fileInput = document.getElementById('swal-edit-file');
            
            if (!name) {
                Swal.showValidationMessage('Name is required');
                return false;
            }

            return {
                name,
                parentId,
                generation,
                file: fileInput.files[0]
            }
        }
    });

    if (formValues) {
        let photoBase64 = null;
        if (formValues.file) {
            Swal.showLoading();
            photoBase64 = await fileToBase64(formValues.file);
        }

        Swal.showLoading();
        const result = await apiCall({
            action: 'editMember',
            id: memberId,
            name: formValues.name,
            parentId: formValues.parentId,
            generation: parseInt(formValues.generation),
            photoBase64: photoBase64
        });
        Swal.close();

        if (result.success) {
            loadMembers();
            Swal.fire('Updated!', 'Member has been updated.', 'success');
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    }
}

async function deleteMemberNode(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return Swal.fire('Error', 'Member not found', 'error');

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete ${member.name}. This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        Swal.showLoading();
        const deleteResult = await apiCall({
            action: 'deleteMember',
            id: memberId
        });
        Swal.close();

        if (deleteResult.success) {
            loadMembers();
            Swal.fire('Deleted!', 'Member has been deleted.', 'success');
        } else {
            Swal.fire('Error', deleteResult.message, 'error');
        }
    }
}

// --- Helper Functions ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- Search & Reports ---
function searchMember() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) {
        clearHighlight();
        return;
    }
    const member = state.members.find(m => m.name.toLowerCase().includes(query));
    if (member) {
        zoomToNode(member.id);
        showConnectivity(member);
    }
}

function showConnectivity(member) {
    const parent = state.members.find(m => m.id === member.parentId);
    const parentName = parent ? parent.name : "None (Root)";
    console.log(`Searching: ${member.name} is child of ${parentName}`);
    // You can display this in a tooltip or status bar
}

async function showKinshipReport(type) {
    if (type === 'intra') {
        const { value: gen } = await Swal.fire({
            title: 'Enter Generation Number',
            input: 'number',
            inputPlaceholder: 'Generation',
            showCancelButton: true
        });

        if (gen) {
            const relatives = state.members.filter(m => m.generation == gen);
            const content = relatives.length > 0 
                ? relatives.map(r => `• ${r.name}`).join('<br>') 
                : 'No members found in this generation.';
            
            Swal.fire({
                title: `Generation ${gen} Members`,
                html: content,
                icon: 'info'
            });
        }
    } else if (type === 'inter') {
        const { value: id } = await Swal.fire({
            title: 'Enter Member ID for Lineage',
            input: 'text',
            inputPlaceholder: 'Member ID',
            showCancelButton: true
        });

        if (id) {
            let path = [];
            let curr = state.members.find(m => m.id === id);
            if (!curr) return Swal.fire('Error', 'Member not found', 'error');

            while (curr) {
                path.push(curr.name);
                curr = state.members.find(m => m.id === curr.parentId);
            }
            
            Swal.fire({
                title: 'Lineage (Bottom to Top)',
                html: path.join(" <br>↓<br> "),
                icon: 'info'
            });
        }
    }
}

// --- Helper ---
async function apiCall(data) {
    console.log("API CALL:", data);
    return fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data)
    }).then(res => res.json()).catch(err => ({ success: false, message: err.message }));
}
