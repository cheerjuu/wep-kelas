document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const form = document.getElementById("songForm");
  const historyContainer = document.getElementById("historyContainer");
  const adminLoginBtn = document.getElementById("adminLogin");
  const clearHistoryBtn = document.getElementById("clearHistory");
  const songLinkInput = document.getElementById("songLink");
  const previewDiv = document.getElementById("preview");
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  let adminMode = false;

  // ====================== LOAD HISTORY ======================
  loadHistory();

  // ====================== FORM SUBMIT ======================
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const receiver = document.getElementById("receiver").value;
    const songLink = document.getElementById("songLink").value.trim();
    const message = document.getElementById("message").value;
    const date = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });

    const entry = { receiver, songLink, message, date };

    addCard(entry, true); 
    form.reset();
    previewDiv.innerHTML = "";
    showToast("Lagu berhasil dikirim!");
  });

  // ====================== PREVIEW LIVE ======================
  let previewTimeout;
  songLinkInput.addEventListener("input", () => {
    clearTimeout(previewTimeout);
    const link = songLinkInput.value.trim();
    
    if (!link) {
      previewDiv.innerHTML = "";
      return;
    }
    
    // Add loading state
    previewDiv.innerHTML = '<div class="preview-loading"><i class="fas fa-spinner fa-spin"></i> Memuat preview...</div>';
    
    // Debounce preview generation
    previewTimeout = setTimeout(() => {
      previewDiv.innerHTML = generateEmbed(link);
    }, 500);
  });

  // ====================== ADMIN MODE ======================
  adminLoginBtn.addEventListener("click", function() {
    if (adminMode) {
      // Logout
      adminLogout();
    } else {
      // Login
      const password = prompt("Masukkan password admin:");
      if (password === "ppladmin") {
        showToast("Login berhasil!", "success");
        adminMode = true;
        clearHistoryBtn.style.display = "flex";
        adminLoginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout Admin';
        
        // Tampilkan tombol hapus di semua card
        document.querySelectorAll(".delete-btn").forEach(btn => {
          btn.style.display = "flex";
        });
      } else {
        showToast("Password salah!", "error");
      }
    }
  });

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Yakin mau hapus semua history?")) {
      localStorage.removeItem("songHistory");
      historyContainer.innerHTML = "";
      showToast("History berhasil dihapus!", "success");
    }
  });

  // ====================== FUNCTIONS ======================
  function loadHistory() {
    const saved = JSON.parse(localStorage.getItem("songHistory")) || [];
    saved.forEach(entry => addCard(entry, false));
  }

  function addCard(entry, save = false) {
    const { receiver, songLink, message, date } = entry;
    let embedCode = generateEmbed(songLink);

    const card = document.createElement("div");
    card.classList.add("song-card");
    
    // Create delete button with proper styling
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus';
    
    // Add event listener to delete button
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      
      // Double check admin mode before allowing deletion
      if (!adminMode) {
        showToast("Anda tidak memiliki izin untuk menghapus lagu ini!", "error");
        return;
      }
      
      if (confirm("Hapus kiriman ini?")) {
        card.style.animation = "fadeOut 0.3s ease";
        setTimeout(() => {
          card.remove();
          removeFromStorage(entry);
          showToast("Lagu berhasil dihapus!", "success");
        }, 300);
      }
    });
    
    // Only show delete button if admin mode is active
    if (adminMode) {
      deleteBtn.style.display = "flex";
    } else {
      deleteBtn.style.display = "none";
    }
    
    card.innerHTML = `
      <h2>Untuk ${receiver}</h2>
      ${embedCode}
      <p class="handwriting">${message}</p>
      <p class="sent-date">Dikirim pada ${date}</p>
    `;
    
    // Append delete button to card
    card.appendChild(deleteBtn);

    historyContainer.prepend(card);

    if (save) {
      const saved = JSON.parse(localStorage.getItem("songHistory")) || [];
      saved.unshift(entry);
      localStorage.setItem("songHistory", JSON.stringify(saved));
    }
  }

  function generateEmbed(link) {
    // Spotify
    if (link.includes("spotify")) {
      let embedUrl = link;
      if (!link.includes("embed")) {
        embedUrl = link.replace("open.spotify.com", "open.spotify.com/embed");
        embedUrl = embedUrl.split("?")[0];
      }
      return `
        <iframe src="${embedUrl}" width="100%" height="152" 
          frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
      `;
    }

    // YouTube
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      let videoId = "";
      if (link.includes("youtu.be")) {
        videoId = link.split("youtu.be/")[1];
      } else {
        const urlParams = new URLSearchParams(new URL(link).search);
        videoId = urlParams.get("v");
      }
      return `
        <iframe width="100%" height="200"
          src="https://www.youtube.com/embed/${videoId}" 
          frameborder="0" allowfullscreen></iframe>
      `;
    }

    // Fallback → audio biasa
    return `<audio controls src="${link}" style="width:100%;"></audio>`;
  }

  function removeFromStorage(entry) {
    const saved = JSON.parse(localStorage.getItem("songHistory")) || [];
    const filtered = saved.filter(e =>
      !(e.receiver === entry.receiver &&
        e.songLink === entry.songLink &&
        e.message === entry.message &&
        e.date === entry.date)
    );
    localStorage.setItem("songHistory", JSON.stringify(filtered));
  }

  function showToast(message, type = "success") {
    toastMessage.textContent = message;
    
    // Set icon based on type
    const icon = toast.querySelector('i');
    icon.className = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    
    // Show toast
    toast.classList.add("show");
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  function adminLogout() {
    adminMode = false;
    clearHistoryBtn.style.display = "none";
    adminLoginBtn.innerHTML = '<i class="fas fa-user-shield"></i> Login Admin';
    
    // Hide delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.style.display = "none";
    });
    
    showToast("Logout berhasil!", "success");
  }

  // Add fadeOut animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.9); }
    }
    
    .preview-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      color: #666;
    }
  `;
  document.head.appendChild(style);
});