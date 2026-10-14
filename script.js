// IMPORTAÇÕES DO FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  onSnapshot, 
  query 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALQJFf4RX4mBuQwFpb-1K8hyQ2NCTIJ2g",
  authDomain: "lovekay-d5745.firebaseapp.com",
  projectId: "lovekay-d5745",
  storageBucket: "lovekay-d5745.firebasestorage.app",
  messagingSenderId: "385109812683",
  appId: "1:385109812683:web:9e4e323b6b4ea48c00824e",
  measurementId: "G-0YY9MDRV28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENTOS HTML
const loadingScreen = document.getElementById("loading-screen");
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const userDisplayName = document.getElementById("user-display-name");
const btnLogout = document.getElementById("btn-logout");

const faelUploadSection = document.getElementById("fael-upload-section");
const letterForm = document.getElementById("letter-form");
const letterTitle = document.getElementById("letter-title");
const letterUrl = document.getElementById("letter-url");
const lettersList = document.getElementById("letters-list");

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

const photoForm = document.getElementById("photo-form");
const photoTitle = document.getElementById("photo-title");
const photoUrl = document.getElementById("photo-url");
const photosList = document.getElementById("photos-list");

const navBtnLetters = document.getElementById("nav-btn-letters");
const navBtnChat = document.getElementById("nav-btn-chat");
const navBtnPhotos = document.getElementById("nav-btn-photos");
const navBtnLove = document.getElementById("nav-btn-love");

const tabLetters = document.getElementById("tab-letters");
const tabChat = document.getElementById("tab-chat");
const tabPhotos = document.getElementById("tab-photos");
const tabLove = document.getElementById("tab-love");

const btnLoveAction = document.getElementById("btn-love-action");
const kayLoveResponse = document.getElementById("kay-love-response");

const faelVictoryModal = document.getElementById("fael-victory-modal");
const closeVictoryModal = document.getElementById("close-victory-modal");

const pdfModal = document.getElementById("pdf-modal");
const pdfViewer = document.getElementById("pdf-viewer");
const closePdfModal = document.getElementById("close-pdf-modal");

// 1. CARREGAMENTO E VERIFICAÇÃO DE LOGIN
setTimeout(() => {
  loadingScreen.classList.remove("active");
  checkAuthState();
}, 5000);

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showScreen(appScreen);
      const isFael = user.email.toLowerCase().includes("fael");
      userDisplayName.textContent = isFael ? "Fael ❤️" : "Kay 💕";

      // RESETA AS ABAS PARA A PRIMEIRA (CARTAS) AO LOGAR
      resetTabs();
      navBtnLetters.classList.add("active");
      tabLetters.classList.add("active-tab");

      if (isFael) {
        faelUploadSection.style.display = "block";
        navBtnLove.style.display = "none"; // ESCONDE TOTALMENTE DA TELA DO FAEL
      } else {
        faelUploadSection.style.display = "none";
        navBtnLove.style.display = "flex"; // APENAS PARA A KAY
      }

      loadLetters();
      loadChat();
      loadPhotos();
      listenToLoveAlerts(isFael);
    } else {
      showScreen(loginScreen);
    }
  });
}

function showScreen(screen) {
  loadingScreen.classList.remove("active");
  loginScreen.classList.remove("active");
  appScreen.classList.remove("active");
  screen.classList.add("active");
}

// 2. SISTEMA DE LOGIN E LOGOUT
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginError.textContent = "E-mail ou senha incorretos!";
  }
});

btnLogout.addEventListener("click", () => {
  resetTabs();
  navBtnLove.style.display = "none";
  kayLoveResponse.style.display = "none";
  signOut(auth);
});

// 3. TROCA DE ABAS
function resetTabs() {
  [navBtnLetters, navBtnChat, navBtnPhotos, navBtnLove].forEach(b => b.classList.remove("active"));
  [tabLetters, tabChat, tabPhotos, tabLove].forEach(t => t.classList.remove("active-tab"));
}

navBtnLetters.addEventListener("click", () => { resetTabs(); navBtnLetters.classList.add("active"); tabLetters.classList.add("active-tab"); });
navBtnChat.addEventListener("click", () => { resetTabs(); navBtnChat.classList.add("active"); tabChat.classList.add("active-tab"); });
navBtnPhotos.addEventListener("click", () => { resetTabs(); navBtnPhotos.classList.add("active"); tabPhotos.classList.add("active-tab"); });
navBtnLove.addEventListener("click", () => { resetTabs(); navBtnLove.classList.add("active"); tabLove.classList.add("active-tab"); });

// 4. BARRINHA DE EMOJIS RÁPIDOS
document.querySelectorAll(".emoji-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    chatInput.value += btn.textContent;
    chatInput.focus();
  });
});

// 5. CHAT COM DELETAR MENSAGENS
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  const isFael = auth.currentUser.email.toLowerCase().includes("fael");
  const author = isFael ? "Fael ❤️" : "Kay 💕";

  try {
    await addDoc(collection(db, "chats"), {
      author,
      text,
      createdAt: new Date().toISOString()
    });
    chatInput.value = "";
  } catch (err) {
    console.error(err);
  }
});

function loadChat() {
  const q = query(collection(db, "chats"));
  onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = "";
    let docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const isFael = auth.currentUser.email.toLowerCase().includes("fael");
    const myName = isFael ? "Fael ❤️" : "Kay 💕";

    docs.forEach(data => {
      const isMine = data.author === myName;
      const div = document.createElement("div");
      div.className = `chat-bubble ${isMine ? 'mine' : 'other'}`;
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span class="chat-author">${data.author}</span>
          <button class="delete-chat-btn" style="background:none; border:none; cursor:pointer; font-size:0.75rem; opacity:0.7;">🗑️</button>
        </div>
        <div>${data.text}</div>
      `;

      div.querySelector(".delete-chat-btn").addEventListener("click", async () => {
        if (confirm("Deseja apagar esta mensagem?")) {
          await deleteDoc(doc(db, "chats", data.id));
        }
      });

      chatMessages.appendChild(div);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// 6. CARTAS COM DELETAR CARTA E FIX DE PDFS DIFERENTES
letterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = letterTitle.value.trim();
  let url = letterUrl.value.trim();

  // Converte links do Google Drive para o modo de visualização preview correto
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      url = `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }

  await addDoc(collection(db, "letters"), {
    title, url, sender: "Fael ❤️", likes: 0, comments: [], createdAt: new Date().toISOString()
  });

  letterTitle.value = ""; letterUrl.value = "";
});

function loadLetters() {
  const q = query(collection(db, "letters"));
  onSnapshot(q, (snapshot) => {
    lettersList.innerHTML = "";
    let docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    docs.forEach(data => {
      const card = document.createElement("div");
      card.className = "letter-card-detailed";

      const commentsHtml = (data.comments || []).map(c => `
        <div class="comment-item"><span class="comment-author">${c.author}:</span> ${c.text}</div>
      `).join("");

      card.innerHTML = `
        <div class="letter-header">
          <span class="letter-title">📄 ${data.title}</span>
          <div>
            <span class="letter-sender">${data.sender}</span>
            <button class="delete-letter-btn" style="background:none; border:none; cursor:pointer; font-size:0.9rem; margin-left:6px;">🗑️</button>
          </div>
        </div>
        <div class="letter-actions">
          <button class="btn-like">❤️ ${data.likes || 0} Curtidas</button>
          <button class="btn-secondary read-btn">Ler PDF</button>
        </div>
        <div class="comments-container">${commentsHtml || '<span style="font-size:0.8rem; color:#aaa;">Nenhum comentário.</span>'}</div>
        <div class="comment-form">
          <input type="text" class="comment-input" placeholder="Escreva um comentário..." />
          <button class="btn-comment-send">Enviar</button>
        </div>
      `;

      card.querySelector(".delete-letter-btn").addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja apagar esta carta?")) {
          await deleteDoc(doc(db, "letters", data.id));
        }
      });

      // ABRE O PDF ESPECÍFICO DESTA CARTA LIMPANDO O ANTERIOR
      card.querySelector(".read-btn").addEventListener("click", () => {
        pdfViewer.src = "about:blank";
        setTimeout(() => {
          pdfViewer.src = data.url;
          pdfModal.style.display = "flex";
        }, 50);
      });

      card.querySelector(".btn-like").addEventListener("click", async () => {
        await updateDoc(doc(db, "letters", data.id), { likes: (data.likes || 0) + 1 });
      });

      const input = card.querySelector(".comment-input");
      card.querySelector(".btn-comment-send").addEventListener("click", async () => {
        if (!input.value.trim()) return;
        const isFael = auth.currentUser.email.toLowerCase().includes("fael");
        await updateDoc(doc(db, "letters", data.id), {
          comments: arrayUnion({ author: isFael ? "Fael" : "Kay", text: input.value.trim() })
        });
        input.value = "";
      });

      lettersList.appendChild(card);
    });
  });
}

// 7. GALERIA DE FOTOS COM DELETAR FOTO
photoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const isFael = auth.currentUser.email.toLowerCase().includes("fael");
  const author = isFael ? "Fael ❤️" : "Kay 💕";
  let url = photoUrl.value.trim();

  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      url = `https://lh3.googleusercontent.com/u/0/d/${match[1]}`;
    }
  }

  await addDoc(collection(db, "photos"), {
    title: photoTitle.value.trim(),
    url: url,
    author: author,
    createdAt: new Date().toISOString()
  });

  photoTitle.value = ""; photoUrl.value = "";
});

function loadPhotos() {
  const q = query(collection(db, "photos"));
  onSnapshot(q, (snapshot) => {
    photosList.innerHTML = "";
    if (snapshot.empty) {
      photosList.innerHTML = '<p class="placeholder-text">Nenhuma foto adicionada ainda...</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "photo-card";
      div.style.position = "relative";
      div.innerHTML = `
        <button class="delete-photo-btn" style="position:absolute; top:5px; right:5px; background:rgba(255,255,255,0.8); border:none; border-radius:50%; padding:4px 6px; cursor:pointer; font-size:0.8rem;">🗑️</button>
        <img src="${data.url}" alt="Foto do casal" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Link+Invalido';" />
        <p>${data.title} <br><small>(${data.author || 'Casal'})</small></p>
      `;

      div.querySelector(".delete-photo-btn").addEventListener("click", async () => {
        if (confirm("Deseja apagar esta foto do álbum?")) {
          await deleteDoc(doc(db, "photos", docSnap.id));
        }
      });

      photosList.appendChild(div);
    });
  });
}

// 8. BOTÃO "EU TE AMO!" E NOTIFICAÇÃO EXCLUSIVA DO FAEL
btnLoveAction.addEventListener("click", async () => {
  try {
    await addDoc(collection(db, "alerts"), {
      from: auth.currentUser.email,
      timestamp: new Date().toISOString()
    });
    kayLoveResponse.style.display = "block";
  } catch (err) {
    console.error("Erro ao enviar declaração:", err);
  }
});

function listenToLoveAlerts(isFael) {
  // BLOQUEIO 1: Se o usuário logado não for o Fael, garante que o modal fica escondido e sai da função
  if (!isFael) {
    if (faelVictoryModal) faelVictoryModal.style.display = "none";
    return;
  }

  const q = query(collection(db, "alerts"));

  onSnapshot(q, (snapshot) => {
    // BLOQUEIO 2: Confirma novamente se o usuário atual ainda é o Fael antes de processar os dados
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email.toLowerCase().includes("fael")) {
      if (faelVictoryModal) faelVictoryModal.style.display = "none";
      return;
    }

    if (snapshot.empty) return;

    let latestKayAlert = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Pega apenas alertas enviados pela Kay
      if (data.from && !data.from.toLowerCase().includes("fael")) {
        if (!latestKayAlert || new Date(data.timestamp) > new Date(latestKayAlert.timestamp)) {
          latestKayAlert = { id: docSnap.id, ...data };
        }
      }
    });

    if (latestKayAlert) {
      const lastSeenId = localStorage.getItem("fael_last_seen_alert_id");

      // Abre o modal APENAS se for o Fael e for um novo alerta da Kay
      if (lastSeenId !== latestKayAlert.id) {
        faelVictoryModal.style.display = "flex";
        faelVictoryModal.dataset.currentAlertId = latestKayAlert.id;
      }
    }
  });
}

closeVictoryModal.addEventListener("click", () => {
  faelVictoryModal.style.display = "none";
  const currentId = faelVictoryModal.dataset.currentAlertId;
  if (currentId) {
    localStorage.setItem("fael_last_seen_alert_id", currentId);
  }
});