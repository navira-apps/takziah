(() => {
  const $ = (id) => document.getElementById(id);
  const CONFIG_KEY = "takziah_config_v1";
  const GUEST_KEY = "takziah_guests_v1";
  const MESSAGE_KEY = "takziah_message_v1";
  const DEFAULT_MESSAGE = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nKepada Yth. {nama}\n\nDengan memohon rahmat dan rida Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {acara} mengenang {almarhum}, yang insyaallah dilaksanakan pada:\n\n{tanggal}\nPukul {waktu}\n{lokasi}\n{alamat}\n\nDetail undangan: {link}\n\nAtas kehadiran dan doanya, kami ucapkan terima kasih.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;
  let config = {};
  let guests = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  let mediaFiles = { photo: null, music: null };

  const fields = ["deceasedName","eventTitle","eventDate","eventTime","timezone","locationName","address","mapsUrl","family","opening","prayer","closing"];
  const showToast = (message) => {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2200);
  };
  const downloadBlob = (blob, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const escapeHtml = (text) => String(text).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const slug = (name) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function loadConfig() {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) config = JSON.parse(stored);
    else {
      try { config = await fetch(`config.json?v=${Date.now()}`).then(r => r.json()); }
      catch { config = {}; }
    }
    fields.forEach(id => { if ($(id)) $(id).value = config[id] || ""; });
    $("photoPath").value = config.photo || "assets/placeholder-foto.svg";
    $("musicPath").value = config.music || "";
    $("photoPreview").src = config.photo || "";
    $("primaryColor").value = config.theme?.primary || "#153f36";
    $("secondaryColor").value = config.theme?.secondary || "#c9a96a";
    $("backgroundColor").value = config.theme?.background || "#f7f3e9";
  }

  function collectConfig() {
    const next = {};
    fields.forEach(id => next[id] = $(id).value.trim());
    next.photo = $("photoPath").value.trim();
    next.music = $("musicPath").value.trim();
    next.theme = { primary: $("primaryColor").value, secondary: $("secondaryColor").value, background: $("backgroundColor").value };
    return next;
  }

  function saveConfig(event) {
    event?.preventDefault();
    config = collectConfig();
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    $("saveStatus").textContent = `Tersimpan ${new Date().toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}`;
    showToast("Data undangan tersimpan di perangkat");
  }

  function handleMedia(kind, input) {
    const file = input.files[0];
    if (!file) return;
    mediaFiles[kind] = file;
    const url = URL.createObjectURL(file);
    const ext = file.name.split(".").pop().toLowerCase();
    if (kind === "photo") {
      $("photoPreview").src = url;
      $("photoPath").value = `assets/foto-almarhum.${ext}`;
      $("downloadPhoto").disabled = false;
    } else {
      $("musicPreview").src = url;
      $("musicPath").value = `assets/musik-latar.${ext}`;
      $("downloadMusic").disabled = false;
    }
    $("saveStatus").textContent = "Perubahan belum disimpan";
  }

  function messageFor(guest) {
    config = collectConfig();
    const eventDate = config.eventDate ? new Date(`${config.eventDate}T12:00:00`) : null;
    const dateText = eventDate && !Number.isNaN(eventDate) ? new Intl.DateTimeFormat("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" }).format(eventDate) : "";
    const base = ($("siteUrl").value || location.href.replace(/admin\.html.*$/, "")).replace(/\/$/, "");
    const guestLink = `${base}/?to=${encodeURIComponent(guest.name)}`;
    const values = {
      nama: guest.name, acara: config.eventTitle, almarhum: config.deceasedName,
      tanggal: dateText, waktu: config.eventTime?.replace(":", "."), lokasi: config.locationName,
      alamat: config.address, link: guestLink
    };
    return Object.entries(values).reduce((text, [key,value]) => text.replaceAll(`{${key}}`, value || ""), $("messageTemplate").value);
  }

  function persistGuests() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(guests));
    $("guestCount").textContent = guests.length;
    renderGuests();
  }

  function renderGuests() {
    const query = $("guestSearch").value.toLowerCase().trim();
    const filtered = guests.filter(g => g.name.toLowerCase().includes(query));
    if (!filtered.length) {
      $("guestList").innerHTML = `<div class="empty">${guests.length ? "Tamu tidak ditemukan." : "Belum ada tamu. Masukkan daftar tamu di atas."}</div>`;
      return;
    }
    $("guestList").innerHTML = filtered.map(guest => {
      const message = messageFor(guest);
      const waTarget = guest.phone ? `https://wa.me/${guest.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
      return `<article class="guest-item" data-id="${guest.id}">
        <div><strong>${escapeHtml(guest.name)}</strong><small>${guest.phone ? escapeHtml(guest.phone) : "Nomor WhatsApp belum diisi"}</small></div>
        <div class="guest-actions">
          <button data-action="copy">Salin Pesan</button>
          <a href="${waTarget}" target="_blank" rel="noopener">Buka WA</a>
          <button class="delete" data-action="delete">Hapus</button>
        </div>
      </article>`;
    }).join("");
  }

  function addGuests() {
    const lines = $("guestInput").value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    lines.forEach(line => {
      const [rawName, rawPhone = ""] = line.split("|");
      const name = rawName.trim();
      const phone = rawPhone.trim().replace(/[^\d+]/g, "");
      if (!name || guests.some(g => g.name.toLowerCase() === name.toLowerCase())) return;
      guests.push({ id: `${slug(name)}-${Date.now()}-${added}`, name, phone });
      added++;
    });
    $("guestInput").value = "";
    persistGuests();
    showToast(`${added} tamu berhasil ditambahkan`);
  }

  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".tab,.panel").forEach(el => el.classList.remove("active"));
    button.classList.add("active");
    $(`${button.dataset.tab}Panel`).classList.add("active");
  }));
  $("configForm").addEventListener("submit", saveConfig);
  $("configForm").addEventListener("input", () => $("saveStatus").textContent = "Perubahan belum disimpan");
  $("photoFile").addEventListener("change", e => handleMedia("photo", e.target));
  $("musicFile").addEventListener("change", e => handleMedia("music", e.target));
  $("downloadPhoto").addEventListener("click", () => mediaFiles.photo && downloadBlob(mediaFiles.photo, $("photoPath").value.split("/").pop()));
  $("downloadMusic").addEventListener("click", () => mediaFiles.music && downloadBlob(mediaFiles.music, $("musicPath").value.split("/").pop()));
  $("addGuests").addEventListener("click", addGuests);
  $("clearGuests").addEventListener("click", () => {
    if (guests.length && confirm("Hapus seluruh daftar tamu dari perangkat ini?")) { guests = []; persistGuests(); }
  });
  $("guestSearch").addEventListener("input", renderGuests);
  $("guestList").addEventListener("click", async (event) => {
    const item = event.target.closest(".guest-item");
    if (!item || !event.target.dataset.action) return;
    const guest = guests.find(g => g.id === item.dataset.id);
    if (event.target.dataset.action === "delete") { guests = guests.filter(g => g.id !== guest.id); persistGuests(); }
    if (event.target.dataset.action === "copy") { await navigator.clipboard.writeText(messageFor(guest)); showToast(`Pesan untuk ${guest.name} disalin`); }
  });
  $("saveMessage").addEventListener("click", () => {
    localStorage.setItem(MESSAGE_KEY, JSON.stringify({ template: $("messageTemplate").value, siteUrl: $("siteUrl").value }));
    renderGuests(); showToast("Template pesan tersimpan");
  });
  $("copyAllMessages").addEventListener("click", async () => {
    if (!guests.length) return showToast("Daftar tamu masih kosong");
    await navigator.clipboard.writeText(guests.map(g => `=== ${g.name} ===\n${messageFor(g)}`).join("\n\n"));
    showToast("Semua pesan berhasil disalin");
  });
  $("exportGuests").addEventListener("click", () => {
    if (!guests.length) return showToast("Daftar tamu masih kosong");
    const quote = (v) => `"${String(v).replaceAll('"','""')}"`;
    const csv = "Nama,Nomor WhatsApp,Link Undangan,Pesan\r\n" + guests.map(g => {
      const base = ($("siteUrl").value || location.href.replace(/admin\.html.*$/, "")).replace(/\/$/, "");
      return [g.name,g.phone,`${base}/?to=${encodeURIComponent(g.name)}`,messageFor(g)].map(quote).join(",");
    }).join("\r\n");
    downloadBlob(new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8" }), "daftar-tamu-undangan.csv");
  });
  $("exportConfig").addEventListener("click", () => {
    saveConfig();
    downloadBlob(new Blob([JSON.stringify(config, null, 2)], { type:"application/json" }), "config.json");
  });

  const message = JSON.parse(localStorage.getItem(MESSAGE_KEY) || "null") || {};
  $("messageTemplate").value = message.template || DEFAULT_MESSAGE;
  $("siteUrl").value = message.siteUrl || "";
  loadConfig().then(() => { $("guestCount").textContent = guests.length; renderGuests(); });
})();
