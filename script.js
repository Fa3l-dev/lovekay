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
const navBtnTimer = document.getElementById("nav-btn-timer");
const navBtnConfessional = document.getElementById("nav-btn-confessional");
const navBtnPhotos = document.getElementById("nav-btn-photos");
const navBtnHistory = document.getElementById("nav-btn-history");
const navBtnLove = document.getElementById("nav-btn-love");

const tabLetters = document.getElementById("tab-letters");
const tabChat = document.getElementById("tab-chat");
const tabTimer = document.getElementById("tab-timer");
const tabConfessional = document.getElementById("tab-confessional");
const tabPhotos = document.getElementById("tab-photos");
const tabHistory = document.getElementById("tab-history");
const tabLove = document.getElementById("tab-love");

const confessionalForm = document.getElementById("confessional-form");
const confessionalInput = document.getElementById("confessional-input");
const confessionalList = document.getElementById("confessional-list");
const historyTimeline = document.getElementById("history-timeline");

const btnLoveAction = document.getElementById("btn-love-action");
const kayLoveResponse = document.getElementById("kay-love-response");

const faelVictoryModal = document.getElementById("fael-victory-modal");
const closeVictoryModal = document.getElementById("close-victory-modal");

const pdfModal = document.getElementById("pdf-modal");
const pdfViewer = document.getElementById("pdf-viewer");
const closePdfModal = document.getElementById("close-pdf-modal");

let isFirstChatLoad = true;
let timerInterval = null;

// DATA INICIAL DO CRONÔMETRO: 19 DE FEVEREIRO DE 2025
const startDate = new Date("2025-02-19T00:00:00").getTime();

// FORMATADORES DE DATA E HORA
function formatTimeOnly(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

// PERMISSÃO DE NOTIFICAÇÕES
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

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

      requestNotificationPermission();

      resetTabs();
      navBtnLetters.classList.add("active");
      tabLetters.classList.add("active-tab");

      if (isFael) {
        faelUploadSection.style.display = "block";
        navBtnLove.style.setProperty("display", "none", "important");
      } else {
        faelUploadSection.style.display = "none";
        navBtnLove.style.setProperty("display", "flex", "important");
      }

      loadLetters();
      loadChat();
      loadConfessional();
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
  navBtnLove.style.setProperty("display", "none", "important");
  navBtnHistory.style.setProperty("display", "none", "important");
  kayLoveResponse.style.display = "none";
  signOut(auth);
});

// 3. TROCA DE ABAS COM ATUALIZAÇÃO DO STATUS DE VISTO DO CHAT
function resetTabs() {
  [navBtnLetters, navBtnChat, navBtnTimer, navBtnConfessional, navBtnPhotos, navBtnHistory, navBtnLove].forEach(b => {
    if (b) b.classList.remove("active");
  });
  [tabLetters, tabChat, tabTimer, tabConfessional, tabPhotos, tabHistory, tabLove].forEach(t => {
    if (t) t.classList.remove("active-tab");
  });
}

navBtnLetters.addEventListener("click", () => { resetTabs(); navBtnLetters.classList.add("active"); tabLetters.classList.add("active-tab"); });
navBtnChat.addEventListener("click", () => { 
  resetTabs(); 
  navBtnChat.classList.add("active"); 
  tabChat.classList.add("active-tab"); 
  loadChat(); // Força recarregamento ao entrar no chat para marcar mensagens recebidas como vistas
});
navBtnTimer.addEventListener("click", () => { resetTabs(); navBtnTimer.classList.add("active"); tabTimer.classList.add("active-tab"); });
navBtnConfessional.addEventListener("click", () => { resetTabs(); navBtnConfessional.classList.add("active"); tabConfessional.classList.add("active-tab"); });
navBtnPhotos.addEventListener("click", () => { resetTabs(); navBtnPhotos.classList.add("active"); tabPhotos.classList.add("active-tab"); });
navBtnHistory.addEventListener("click", () => { resetTabs(); navBtnHistory.classList.add("active"); tabHistory.classList.add("active-tab"); });
navBtnLove.addEventListener("click", () => { resetTabs(); navBtnLove.classList.add("active"); tabLove.classList.add("active-tab"); });

// 4. BARRINHA DE EMOJIS RÁPIDOS
document.querySelectorAll(".emoji-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    chatInput.value += btn.textContent;
    chatInput.focus();
  });
});

// 5. CRONÔMETRO QUE PÁRA NO "EU TE AMO"
function startLoveTimer(endTime) {
  if (timerInterval) clearInterval(timerInterval);

  function updateDisplay() {
    const now = endTime ? new Date(endTime).getTime() : new Date().getTime();
    const diff = Math.max(0, now - startDate);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("timer-days").textContent = days;
    document.getElementById("timer-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("timer-minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("timer-seconds").textContent = String(seconds).padStart(2, "0");

    if (endTime) {
      document.getElementById("timer-status-text").textContent = "🔒 O tempo foi eternizado quando a Kay disse 'Eu te amo!' ❤️";
    } else {
      document.getElementById("timer-status-text").textContent = "O tempo continua contando... ⏳";
    }
  }

  updateDisplay();
  if (!endTime) {
    timerInterval = setInterval(updateDisplay, 1000);
  }
}

// 6. CONFESSIONÁRIO PRIVADO (RESTRITO POR EMAIL)
confessionalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = confessionalInput.value.trim();
  if (!text) return;

  const userEmail = auth.currentUser.email.toLowerCase();
  const isFael = userEmail.includes("fael");
  const author = isFael ? "Fael ❤️" : "Kay 💕";

  try {
    await addDoc(collection(db, "confessionals"), {
      text,
      owner: userEmail,
      author,
      createdAt: new Date().toISOString()
    });
    confessionalInput.value = "";
  } catch (err) {
    console.error(err);
  }
});

function loadConfessional() {
  const q = query(collection(db, "confessionals"));
  onSnapshot(q, (snapshot) => {
    confessionalList.innerHTML = "";
    historyTimeline.innerHTML = "";
    
    const currentUserEmail = auth.currentUser.email.toLowerCase();
    let myNotes = [];
    let allNotes = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      allNotes.push({ id: docSnap.id, ...data });

      if (data.owner === currentUserEmail) {
        myNotes.push({ id: docSnap.id, ...data });
      }
    });

    // Minhas notas privadas
    myNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    myNotes.forEach(item => {
      const div = document.createElement("div");
      div.className = "confessional-item";
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>${item.text}</div>
          <button class="delete-conf-btn" style="background:none; border:none; cursor:pointer; font-size:0.8rem; opacity:0.7;">🗑️</button>
        </div>
        <small style="color:#aaa; font-size:0.7rem; margin-top:4px;">${formatDateTime(item.createdAt)}</small>
      `;

      div.querySelector(".delete-conf-btn").addEventListener("click", async () => {
        if (confirm("Apagar este registro privado?")) {
          await deleteDoc(doc(db, "confessionals", item.id));
        }
      });

      confessionalList.appendChild(div);
    });

    // Linha do tempo combinada do casal ("Registro de Nossa História")
    allNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    allNotes.forEach(item => {
      const div = document.createElement("div");
      div.className = "timeline-item";
      div.innerHTML = `
        <div class="timeline-author">${item.author}</div>
        <div>${item.text}</div>
        <small style="color:#aaa; font-size:0.7rem; margin-top:4px;">${formatDateTime(item.createdAt)}</small>
      `;
      historyTimeline.appendChild(div);
    });
  });
}

// 7. CHAT COM VISTO PRECISO, DELETAR E NOTIFICAÇÕES NATIVAS
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
      createdAt: new Date().toISOString(),
      seen: false
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

    const isFael = auth.currentUser.email.toLowerCase().includes("fael");
    const myName = isFael ? "Fael ❤️" : "Kay 💕";
    const isChatTabActive = tabChat.classList.contains("active-tab");

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" && !isFirstChatLoad) {
        const newMsg = change.doc.data();
        if (newMsg.author !== myName && "Notification" in window && Notification.permission === "granted") {
          if (document.hidden || !document.hasFocus()) {
            new Notification(`LoveKay 💕`, {
              body: `${newMsg.author}: ${newMsg.text}`,
              icon: "https://cdn-icons-png.flaticon.com/512/2589/2589175.png"
            });
          }
        }
      }
    });

    isFirstChatLoad = false;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      docs.push({ id: docSnap.id, ...data });

      // SÓ marca como visto se a mensagem veio do OUTRO e o usuário ATUAL está com a aba do chat aberta
      if (data.author !== myName && !data.seen && isChatTabActive) {
        updateDoc(doc(db, "chats", docSnap.id), { seen: true });
      }
    });

    docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    docs.forEach(data => {
      const isMine = data.author === myName;
      const div = document.createElement("div");
      div.className = `chat-bubble ${isMine ? 'mine' : 'other'}`;

      const timeStr = formatTimeOnly(data.createdAt);
      
      let checkIcon = "";
      if (isMine) {
        checkIcon = data.seen 
          ? `<span style="font-size:0.75rem; color:#00d2ff; margin-left:3px; font-weight:bold;">✓✓</span>` 
          : `<span style="font-size:0.75rem; opacity:0.7; margin-left:3px; font-weight:bold;">✓</span>`;
      }

      div.innerHTML = `
        <div style="display:flex; justify-between; align-items:center; gap:8px;">
          <span class="chat-author">${data.author}</span>
          <button class="delete-chat-btn" style="background:none; border:none; cursor:pointer; font-size:0.75rem; opacity:0.7;">🗑️</button>
        </div>
        <div>${data.text}</div>
        <div style="font-size:0.65rem; opacity:0.8; text-align:right; margin-top:2px; display:flex; justify-content:flex-end; align-items:center;">
          <span>${timeStr}</span>
          ${checkIcon}
        </div>
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

// 8. CARTAS COM DATA/HORA, DELETAR CARTA E FIX DE PDFS
letterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = letterTitle.value.trim();
  let url = letterUrl.value.trim();

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

      const dateStr = formatDateTime(data.createdAt);

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
        ${dateStr ? `<div style="font-size:0.7rem; color:#aaa; margin-top:-6px;">Enviado em: ${dateStr}</div>` : ''}
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

// 9. GALERIA DE FOTOS COM DELETAR FOTO
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

// 10. BOTÃO "EU TE AMO!", CONGELAMENTO E UNIFICAÇÃO
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
  const q = query(collection(db, "alerts"));

  onSnapshot(q, (snapshot) => {
    let validKayAlert = null;

    if (!snapshot.empty) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.from && data.from.toLowerCase().includes("kay") && !data.from.toLowerCase().includes("fael")) {
          if (!validKayAlert || new Date(data.timestamp) > new Date(validKayAlert.timestamp)) {
            validKayAlert = { id: docSnap.id, ...data };
          }
        }
      });
    }

    if (validKayAlert) {
      startLoveTimer(validKayAlert.timestamp);

      if (navBtnHistory) navBtnHistory.style.setProperty("display", "flex", "important");

      if (isFael) {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email.toLowerCase().includes("fael")) {
          const lastSeenId = localStorage.getItem("fael_last_seen_alert_id");
          if (lastSeenId !== validKayAlert.id) {
            if (faelVictoryModal) {
              faelVictoryModal.style.display = "flex";
              faelVictoryModal.dataset.currentAlertId = validKayAlert.id;
            }
          }
        }
      } else {
        if (faelVictoryModal) faelVictoryModal.style.display = "none";
      }
    } else {
      startLoveTimer(null);
      if (navBtnHistory) navBtnHistory.style.setProperty("display", "none", "important");
      if (faelVictoryModal) faelVictoryModal.style.display = "none";
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

closePdfModal.addEventListener("click", () => {
  pdfModal.style.display = "none";
  pdfViewer.src = "about:blank";
});