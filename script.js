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
