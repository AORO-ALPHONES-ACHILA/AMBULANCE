// ambu.js
const API_BASE = 'http://localhost/AMBULANCE';
const phoneInput = document.getElementById('phone');
const pickupInput = document.getElementById('pickup');
const destInput = document.getElementById('destination');
const bookBtn = document.getElementById('bookBtn');
const emergencyBtn = document.getElementById('emergencyBtn');
const historyBtn = document.getElementById('historyBtn');
const statusCard = document.getElementById('statusCard');
const statusArea = document.getElementById('statusArea');
const driverArea = document.getElementById('driverArea');
const historyCard = document.getElementById('historyCard');
const historyList = document.getElementById('historyList');

let currentBookingId = null;
let pollTimer = null;

// === Book Ambulance ===
bookBtn.addEventListener('click', async () => {
  const phone = phoneInput.value.trim();
  const pickup = pickupInput.value.trim();
  const dest = destInput.value.trim() || 'Nearest Hospital';

  if (!phone || !pickup) return alert('Phone and pickup required');

  try {
    const response = await fetch(`${API_BASE}/ambu.php?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pickup, destination: dest })
    });

    // 🧠 DEBUGGING PART — check what backend really sends
    console.log('HTTP status:', response.status);
    const text = await response.text(); // Read raw text first
    console.log('Raw backend response:', text);

    // Try to safely parse if it’s JSON
    let res;
    try {
      res = JSON.parse(text);
    } catch {
      alert('⚠ Backend did not return valid JSON. Check console.');
      return;
    }

    console.log('Parsed response:', res);

    if (res && res.success) {
      alert('✅ Booking created successfully!');
    } else {
      alert('❌ Booking failed: ' + (res.error || 'Unknown error'));
    }

  } catch (err) {
    console.error('Fetch error:', err);
    alert('⚠ Could not reach backend.');
  }
});



// === Emergency Booking ===
emergencyBtn.addEventListener('click', async () => {
  const phone = phoneInput.value.trim() || prompt('Enter your contact phone (+2547...)');
  if (!phone) return;

  const pickup = 'Current Location (auto)';

  try {
    const response = await fetch(`${API_BASE}/ambu.php?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pickup, destination: 'Nearest Hospital' })
    });

    console.log('HTTP status (SOS):', response.status);
    const text = await response.text();
    console.log('Raw SOS response:', text);

    let res;
    try {
      res = JSON.parse(text);
    } catch {
      alert('⚠ Backend did not return valid JSON for SOS booking.');
      return;
    }

    if (res && res.success) {
      const confirmCode = res.booking_id || Math.floor(100000 + Math.random() * 900000);
      alert("SOS Booking Successful!\nYour confirmation code: " + confirmCode);
      console.log('SOS booking success, confirmation code:', confirmCode);
    } else {
      alert('❌ SOS booking failed: ' + (res.error || 'Unknown error'));
    }

  } catch (err) {
    console.error('SOS Fetch error:', err);
    alert('⚠ Could not reach backend for SOS booking.');
  }
});


// === Booking History ===
historyBtn.addEventListener('click', async () => {
  const phone = phoneInput.value.trim();
  if (!phone) return alert("Enter phone number to view booking history");

  try {
    const response = await fetch(`${API_BASE}/ambu.php?action=history&phone=${encodeURIComponent(phone)}`);
    console.log("HTTP status (history):", response.status);
    const text = await response.text();
    console.log("Raw history response:", text);

    let res;
    try {
      res = JSON.parse(text);
    } catch {
      alert("⚠ Backend did not return valid JSON for history.");
      return;
    }

    historyList.innerHTML = "";

    if (res && res.success && res.history && res.history.length > 0) {
      res.history.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
          <strong>${i + 1}. ${b.status.toUpperCase()}</strong><br>
          From: ${b.pickup}<br>
          To: ${b.destination || "Nearest Hospital"}<br>
          <small>Date: ${b.created_at}</small>
        `;
        historyList.appendChild(div);
      });
      historyCard.style.display = "block";
    } else {
      historyList.innerHTML = '<div class="item">No booking history found.</div>';
      historyCard.style.display = "block";
    }

  } catch (err) {
    console.error("History fetch error:", err);
    alert("⚠ Could not reach backend for booking history.");
  }
});


// === Show Booking Status ===
function showStatus(b) {
  statusCard.style.display = 'block';
  const s = `
    <div><strong>ID:</strong> ${b.id}</div>
    <div><strong>Status:</strong> ${b.status}</div>
    <div><strong>Pickup:</strong> ${b.pickup}</div>
    <div><strong>Destination:</strong> ${b.destination}</div>
    <div><small>Created: ${b.created_at || ''}</small></div>
  `;
  statusArea.innerHTML = s;

  if (b.driver_name) {
    driverArea.innerHTML = `
      <div><strong>Driver:</strong> ${b.driver_name} (${b.driver_phone})</div>
      <button onclick="callDriver('${b.driver_phone}')">Call Driver</button>
    `;
  } else {
    driverArea.innerHTML = '';
  }
}

// === Call Driver (Demo) ===
function callDriver(phone) {
  alert('Pretend calling ' + phone + ' — in production use tel: link or launch phone');
}

// === Poll for Booking Updates ===
function startPolling(phone) {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    if (!phone) return;

    const url =` ${API_BASE}ambu.php?action=status&phone=${encodeURIComponent(phone)}`;
    const res = await fetch(url).then(r => r.json());

    if (res && res.booking) {
      showStatus(res.booking);
      if (['completed', 'rejected'].includes(res.booking.status)) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
  }, 3000);
}
