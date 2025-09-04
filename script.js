// script.js

const dbName = "letterVotesDB";
const storeName = "entries";
let db;

// Populate dropdowns with A–Z
const favoriteSelect = document.getElementById("favorite");
const leastSelect = document.getElementById("least");

// Add default option
const defaultFav = new Option("Choose your favorite letter...", "");
const defaultLeast = new Option("Choose your least favorite letter...", "");
defaultFav.disabled = true;
defaultLeast.disabled = true;
favoriteSelect.add(defaultFav);
leastSelect.add(defaultLeast);

for (let i = 65; i <= 90; i++) {
  const letter = String.fromCharCode(i);
  const optionFav = new Option(
    `${letter} - ${getLetterPersonality(letter)}`,
    letter
  );
  const optionLeast = new Option(
    `${letter} - ${getLetterPersonality(letter)}`,
    letter
  );
  favoriteSelect.add(optionFav);
  leastSelect.add(optionLeast);
}

// Fun letter personalities
function getLetterPersonality(letter) {
  const personalities = {
    A: "The Achiever ⭐",
    B: "The Bold 💪",
    C: "The Creative 🎨",
    D: "The Determined 🎯",
    E: "The Energetic ⚡",
    F: "The Friendly 🤝",
    G: "The Gentle 🌸",
    H: "The Happy 😊",
    I: "The Intelligent 🧠",
    J: "The Joyful 🎉",
    K: "The Kind 💕",
    L: "The Lovely 💖",
    M: "The Magical ✨",
    N: "The Noble 👑",
    O: "The Optimistic 🌞",
    P: "The Passionate 🔥",
    Q: "The Quirky 🤪",
    R: "The Radiant 🌟",
    S: "The Strong 💎",
    T: "The Thoughtful 💭",
    U: "The Unique 🦄",
    V: "The Vibrant 🌈",
    W: "The Wise 🦉",
    X: "The Mysterious 🔮",
    Y: "The Youthful 🌱",
    Z: "The Zealous 🚀",
  };
  return personalities[letter] || "The Awesome";
}

// Open IndexedDB
const request = indexedDB.open(dbName, 1);
request.onerror = () => console.error("DB open error");
request.onsuccess = (e) => {
  db = e.target.result;
  loadStats();
  populateEditSelects();
};
request.onupgradeneeded = (e) => {
  db = e.target.result;
  db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
};

// Save new entry
document.getElementById("letterForm").addEventListener("submit", (e) => {
  e.preventDefault();

  // Add visual feedback
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "✨ Saving...";
  submitBtn.disabled = true;

  const entry = {
    name: document.getElementById("name").value.trim(),
    date: document.getElementById("date").value,
    favorite: document.getElementById("favorite").value,
    least: document.getElementById("least").value,
    timestamp: new Date().toISOString(),
  };

  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.add(entry);
  tx.oncomplete = () => {
    // Success animation
    submitBtn.textContent = "🎉 Saved!";
    submitBtn.style.background = "linear-gradient(45deg, #4facfe, #00f2fe)";

    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.background = "linear-gradient(45deg, #667eea, #764ba2)";
      e.target.reset();
      loadStats();

      // Add pulse animation to results
      const results = document.querySelector(".results");
      results.classList.add("pulse");
      setTimeout(() => results.classList.remove("pulse"), 2000);
    }, 1500);
  };

  tx.onerror = () => {
    submitBtn.textContent = "❌ Error";
    submitBtn.style.background = "linear-gradient(45deg, #f5576c, #f093fb)";
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.background = "linear-gradient(45deg, #667eea, #764ba2)";
    }, 2000);
  };
});

// Load and display stats
function loadStats() {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => {
    const entries = request.result;
    const total = entries.length;

    const countLetters = (key) => {
      return entries.reduce((acc, entry) => {
        acc[entry[key]] = (acc[entry[key]] || 0) + 1;
        return acc;
      }, {});
    };

    const displayStats = (counts, targetId) => {
      const list = document.getElementById(targetId);
      list.innerHTML = "";

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([letter, count], index) => {
        const percent = ((count / total) * 100).toFixed(1);
        const li = document.createElement("li");

        // Add rank emoji for top 3
        let rankEmoji = "";
        if (index === 0) rankEmoji = "🥇 ";
        else if (index === 1) rankEmoji = "🥈 ";
        else if (index === 2) rankEmoji = "🥉 ";

        li.innerHTML = `
          <span class="letter-rank">${rankEmoji}</span>
          <span class="letter-name">${letter}</span>
          <span class="letter-stats">${count}/${total} (${percent}%)</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
        `;

        // Add staggered animation delay
        li.style.animationDelay = `${index * 0.1}s`;
        li.addEventListener("mouseenter", () => {
          li.style.transform = "translateX(15px) scale(1.02)";
        });
        li.addEventListener("mouseleave", () => {
          li.style.transform = "translateX(0) scale(1)";
        });

        list.appendChild(li);
      });
    };

    displayStats(countLetters("favorite"), "favoriteStats");
    displayStats(countLetters("least"), "leastStats");
  };
}

// EXPORT DATA
document.getElementById("exportBtn").addEventListener("click", () => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => {
    const entries = request.result;
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });

    const fileName = prompt(
      "Enter filename for export (no extension):",
      "letterVotes"
    );
    if (!fileName) return;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
});

// IMPORT DATA
// document.getElementById("importInput").addEventListener("change", (event) => {
//   const file = event.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.onload = function (e) {
//     try {
//       const importedEntries = JSON.parse(e.target.result);

//       const tx = db.transaction(storeName, "readwrite");
//       const store = tx.objectStore(storeName);
//       importedEntries.forEach((entry) => {
//         delete entry.id; // Let IndexedDB reassign new keys
//         store.add(entry);
//       });

//       tx.oncomplete = () => {
//         alert("Data imported successfully.");
//         loadStats();
//       };
//     } catch (err) {
//       alert("Invalid file format. Please make sure it's a valid export JSON.");
//     }
//   };
//   reader.readAsText(file);
// });
document.getElementById("importInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedEntries = JSON.parse(e.target.result);

      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      // Clear existing data first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        importedEntries.forEach((entry) => {
          delete entry.id; // Let IndexedDB reassign new keys
          store.add(entry);
        });

        tx.oncomplete = () => {
          alert("Data imported and existing entries overwritten successfully.");
          loadStats();
        };
      };

      clearRequest.onerror = () => {
        alert("Failed to clear existing data before import.");
      };
    } catch (err) {
      alert("Invalid file format. Please make sure it's a valid export JSON.");
    }
  };
  reader.readAsText(file);
});

// Entries Management Functionality

// Populate edit form selects
function populateEditSelects() {
  const editFavoriteSelect = document.getElementById("editFavorite");
  const editLeastSelect = document.getElementById("editLeast");

  // Clear existing options
  editFavoriteSelect.innerHTML = "";
  editLeastSelect.innerHTML = "";

  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const optionFav = new Option(
      `${letter} - ${getLetterPersonality(letter)}`,
      letter
    );
    const optionLeast = new Option(
      `${letter} - ${getLetterPersonality(letter)}`,
      letter
    );
    editFavoriteSelect.add(optionFav);
    editLeastSelect.add(optionLeast);
  }
}

// Toggle entries visibility
let entriesVisible = false;
document.getElementById("toggleEntriesBtn").addEventListener("click", () => {
  const container = document.getElementById("entriesContainer");
  const btn = document.getElementById("toggleEntriesBtn");

  entriesVisible = !entriesVisible;

  if (entriesVisible) {
    container.classList.remove("hidden");
    btn.textContent = "👁️ Hide Entries";
    loadEntries();
  } else {
    container.classList.add("hidden");
    btn.textContent = "👁️ Show Entries";
  }
});

// Load and display all entries
function loadEntries() {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => {
    const entries = request.result;
    displayEntries(entries);
  };
}

// Display entries in cards
function displayEntries(entries) {
  const entriesList = document.getElementById("entriesList");
  entriesList.innerHTML = "";

  if (entries.length === 0) {
    entriesList.innerHTML = `
      <div class="no-entries">
        <p style="text-align: center; color: #666; font-style: italic;">
          📭 No entries yet. Add some data to see it here!
        </p>
      </div>
    `;
    return;
  }

  // Sort by date (newest first)
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  entries.forEach((entry, index) => {
    const entryCard = document.createElement("div");
    entryCard.className = "entry-card";
    entryCard.style.animationDelay = `${index * 0.1}s`;

    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    entryCard.innerHTML = `
      <div class="entry-header">
        <div class="entry-name">👤 ${entry.name}</div>
        <div class="entry-date">📅 ${formattedDate}</div>
      </div>
      <div class="entry-details">
        <div class="entry-letter favorite-letter">
          <div>💖 Favorite</div>
          <div style="font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem;">
            ${entry.favorite}
          </div>
        </div>
        <div class="entry-letter least-letter">
          <div>💔 Least Favorite</div>
          <div style="font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem;">
            ${entry.least}
          </div>
        </div>
      </div>
      <div class="entry-actions">
        <button class="edit-btn" onclick="editEntry(${entry.id})">
          ✏️ Edit
        </button>
        <button class="delete-btn" onclick="deleteEntry(${entry.id})">
          🗑️ Delete
        </button>
      </div>
    `;

    entriesList.appendChild(entryCard);
  });
}

// Edit entry function
function editEntry(entryId) {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.get(entryId);

  request.onsuccess = () => {
    const entry = request.result;
    if (entry) {
      // Populate edit form
      document.getElementById("editId").value = entry.id;
      document.getElementById("editName").value = entry.name;
      document.getElementById("editDate").value = entry.date;
      document.getElementById("editFavorite").value = entry.favorite;
      document.getElementById("editLeast").value = entry.least;

      // Show modal
      document.getElementById("editModal").classList.remove("hidden");
    }
  };
}

// Delete entry function
function deleteEntry(entryId) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this entry? This action cannot be undone."
  );

  if (confirmDelete) {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(entryId);

    request.onsuccess = () => {
      // Success feedback
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = "✅ Deleted!";
      btn.disabled = true;

      setTimeout(() => {
        loadEntries();
        loadStats();

        // Show success message briefly
        const container = document.getElementById("entriesContainer");
        const successMsg = document.createElement("div");
        successMsg.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(45deg, #4facfe, #00f2fe);
          color: white;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-weight: 500;
          z-index: 100;
          animation: fadeInUp 0.3s ease-out;
        `;
        successMsg.textContent = "🎉 Entry deleted successfully!";
        container.style.position = "relative";
        container.appendChild(successMsg);

        setTimeout(() => {
          if (successMsg.parentNode) {
            successMsg.remove();
          }
        }, 2000);
      }, 500);
    };

    request.onerror = () => {
      alert("Error deleting entry. Please try again.");
    };
  }
}

// Modal controls
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("cancelEdit").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

// Click outside modal to close
document.getElementById("editModal").addEventListener("click", (e) => {
  if (e.target.id === "editModal") {
    document.getElementById("editModal").classList.add("hidden");
  }
});

// Edit form submission
document.getElementById("editForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const entryId = parseInt(document.getElementById("editId").value);
  const updatedEntry = {
    id: entryId,
    name: document.getElementById("editName").value.trim(),
    date: document.getElementById("editDate").value,
    favorite: document.getElementById("editFavorite").value,
    least: document.getElementById("editLeast").value,
    timestamp: new Date().toISOString(), // Update timestamp
  };

  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const request = store.put(updatedEntry);

  request.onsuccess = () => {
    // Close modal
    document.getElementById("editModal").classList.add("hidden");

    // Refresh data
    loadEntries();
    loadStats();

    // Show success feedback
    const saveBtn = document.querySelector(".save-btn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "✅ Saved!";
    saveBtn.style.background = "linear-gradient(45deg, #4facfe, #00f2fe)";

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = "linear-gradient(45deg, #667eea, #764ba2)";
    }, 2000);
  };

  request.onerror = () => {
    alert("Error updating entry. Please try again.");
  };
});
