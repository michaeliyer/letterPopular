// script.js

const dbName = "letterVotesDB";
const storeName = "entries";
let db;

// Populate dropdowns with A–Z
const favoriteSelect = document.getElementById("favorite");
const leastSelect = document.getElementById("least");
for (let i = 65; i <= 90; i++) {
  const letter = String.fromCharCode(i);
  const optionFav = new Option(letter, letter);
  const optionLeast = new Option(letter, letter);
  favoriteSelect.add(optionFav);
  leastSelect.add(optionLeast);
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
    e.target.reset();
    loadStats();
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
      sorted.forEach(([letter, count]) => {
        const percent = ((count / total) * 100).toFixed(1);
        const li = document.createElement("li");
        li.textContent = `${letter}: ${count}/${total} (${percent}%)`;
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
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });

    const fileName = prompt("Enter filename for export (no extension):", "letterVotes");
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