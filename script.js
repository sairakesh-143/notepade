// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDkanTXneVLCOCBxMtOiyaEWJ4LDQ0IFg",
    authDomain: "notepade-50f93.firebaseapp.com",
    projectId: "notepade-50f93",
    storageBucket: "notepade-50f93.firebasestorage.app",
    messagingSenderId: "963692964824",
    appId: "1:963692964824:web:b398dce1f25499397060ad",
    measurementId: "G-PBVZRS6LYQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const authForms = document.getElementById('authForms');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const notesList = document.getElementById('notesList');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const saveNote = document.getElementById('saveNote');
const newNote = document.getElementById('newNote');
const editnote = document.getElementById('editnote');
const deletenote = document.getElementById('deletenote');

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';
document.body.className = `${currentTheme}-mode`;
themeToggle.innerText = currentTheme === 'light' ? '🌙' : '☀️';

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `${currentTheme}-mode`;
    themeToggle.innerText = currentTheme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', currentTheme);
});

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const formToShow = tab.dataset.form;
        loginForm.classList.toggle('hidden', formToShow !== 'loginForm');
        signupForm.classList.toggle('hidden', formToShow !== 'signupForm');
    });
});

// Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('[type="email"]').value;
    const password = loginForm.querySelector('[type="password"]').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('[type="text"]').value;
    const email = signupForm.querySelector('[type="email"]').value;
    const password = signupForm.querySelectorAll('[type="password"]')[0].value;
    const confirmPassword = signupForm.querySelectorAll('[type="password"]')[1].value;

    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        signupForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn.addEventListener('click', () => auth.signOut());

// Note Management
let currentNote = null;

const createNoteElement = (note) => {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.innerHTML = `
        <h3>${note.title || 'Untitled'}</h3>
        <p>${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
    `;
    div.addEventListener('click', () => loadNote(note));
    return div;
};

const loadNotes = async (userId) => {
    notesList.innerHTML = '';
    const snapshot = await db.collection(`users/${userId}/notes`).get();
    snapshot.forEach(doc => {
        const note = { id: doc.id, ...doc.data() };
        notesList.appendChild(createNoteElement(note));
    });
};

const loadNote = (note) => {
    currentNote = note;
    noteTitle.value = note.title || '';
    noteContent.value = note.content || '';
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('h3').textContent === note.title) {
            item.classList.add('active');
        }
    });
};

saveNote.addEventListener('click', async () => {
    const userId = auth.currentUser.uid;
    const noteData = {
        title: noteTitle.value,
        content: noteContent.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentNote) {
            await db.doc(`users/${userId}/notes/${currentNote.id}`).update(noteData);
        } else {
            await db.collection(`users/${userId}/notes`).add({
                ...noteData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        loadNotes(userId);
    } catch (error) {
        alert(error.message);
    }
});

newNote.addEventListener('click', () => {
    currentNote = null;
    noteTitle.value = '';
    noteContent.value = '';
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });
});

// Auth State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        authForms.classList.add('hidden');
        app.classList.remove('hidden');
        loadNotes(user.uid);
    } else {
        authForms.classList.remove('hidden');
        app.classList.add('hidden');
        currentNote = null;
        noteTitle.value = '';
        noteContent.value = '';
    }
});