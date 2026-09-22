(() => {
  const $ = (id) => document.getElementById(id);
  const fallback = {
    deceasedName: "Almarhum/Almarhumah",
    eventTitle: "Undangan Doa dan Tahlil 7 Hari",
    eventDate: "2026-10-01",
    eventTime: "19:30",
    timezone: "Asia/Jakarta",
    locationName: "Kediaman Keluarga",
    address: "Alamat acara",
    mapsUrl: "https://maps.google.com/",
    family: "Keluarga Besar",
    photo: "assets/placeholder-foto.svg",
    music: "",
    opening: "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri doa dan tahlil tujuh hari.",
    closing: "Atas kehadiran dan doanya, kami ucapkan terima kasih.",
    prayer: "Semoga Allah SWT mengampuni segala khilafnya dan menerima amal ibadahnya.",
    theme: { primary: "#153f36", secondary: "#c9a96a", background: "#f7f3e9" }
  };

  let config = fallback;
  let timer;
  const guest = new URLSearchParams(location.search).get("to")?.trim() || "Bapak/Ibu/Saudara/i";
  $("guestName").textContent = guest;

  const formatDate = (date, options) => new Intl.DateTimeFormat("id-ID", options).format(date);
  const getEventDate = () => {
    const time = /^\d{2}:\d{2}$/.test(config.eventTime || "") ? config.eventTime : "00:00";
    const offset = config.timezone === "Asia/Makassar" ? "+08:00" : config.timezone === "Asia/Jayapura" ? "+09:00" : "+07:00";
    return new Date(`${config.eventDate}T${time}:00${offset}`);
  };

  function applyTheme(theme = {}) {
    const root = document.documentElement.style;
    if (theme.primary) root.setProperty("--primary", theme.primary);
    if (theme.secondary) root.setProperty("--gold", theme.secondary);
    if (theme.background) root.setProperty("--paper", theme.background);
  }

  function render() {
    document.title = `${config.eventTitle} | ${config.deceasedName}`;
    applyTheme(config.theme);
    $("gateName").textContent = config.deceasedName;
    $("eventTitle").textContent = config.eventTitle;
    $("deceasedName").textContent = config.deceasedName;
    $("deceasedPhoto").src = config.photo || fallback.photo;
    $("deceasedPhoto").onerror = () => { $("deceasedPhoto").style.visibility = "hidden"; };
    $("opening").textContent = config.opening;
    $("closing").textContent = config.closing;
    $("prayer").textContent = config.prayer;
    $("locationName").textContent = config.locationName;
    $("address").textContent = config.address;
    $("family").textContent = config.family;
    $("mapsButton").href = config.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`;

    const date = getEventDate();
    if (!Number.isNaN(date.getTime())) {
      $("eventDay").textContent = formatDate(date, { weekday: "long", timeZone: config.timezone });
      $("eventDateNumber").textContent = formatDate(date, { day: "2-digit", timeZone: config.timezone });
      $("eventMonthYear").textContent = formatDate(date, { month: "long", year: "numeric", timeZone: config.timezone });
      const zoneLabel = config.timezone === "Asia/Makassar" ? "WITA" : config.timezone === "Asia/Jayapura" ? "WIT" : "WIB";
      $("eventTime").textContent = `${(config.eventTime || "00:00").replace(":", ".")} ${zoneLabel}`;
    }
    if (config.music) {
      $("backgroundMusic").src = config.music;
      $("musicButton").classList.add("show");
    }
    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    const distance = getEventDate().getTime() - Date.now();
    if (!Number.isFinite(distance) || distance <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach(id => $(id).textContent = "00");
      if (timer) clearInterval(timer);
      return;
    }
    $("days").textContent = String(Math.floor(distance / 86400000)).padStart(2, "0");
    $("hours").textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0");
    $("minutes").textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0");
    $("seconds").textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, "0");
  }

  async function toggleMusic() {
    const audio = $("backgroundMusic");
    if (!audio.src) return;
    if (audio.paused) {
      try { await audio.play(); $("musicButton").classList.add("playing"); }
      catch { showToast("Ketuk tombol musik untuk memutar audio"); }
    } else {
      audio.pause();
      $("musicButton").classList.remove("playing");
    }
  }

  function showToast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2200);
  }

  function downloadCalendar() {
    const start = getEventDate();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const clean = (s) => String(s || "").replace(/[\\,;]/g, " ").replace(/\n/g, " ");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Undangan Takziah//ID",
      "BEGIN:VEVENT", `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${clean(config.eventTitle)} - ${clean(config.deceasedName)}`,
      `LOCATION:${clean(config.locationName)}, ${clean(config.address)}`,
      `DESCRIPTION:${clean(config.opening)}`, "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = "agenda-tahlil-7-hari.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  $("openInvitation").addEventListener("click", async () => {
    $("invitation").classList.add("open");
    $("invitation").setAttribute("aria-hidden", "false");
    $("gate").classList.add("closed");
    document.body.style.overflow = "auto";
    await toggleMusic();
  });
  $("musicButton").addEventListener("click", toggleMusic);
  $("calendarButton").addEventListener("click", downloadCalendar);

  fetch(`config.json?v=${Date.now()}`)
    .then((response) => {
      if (!response.ok) throw new Error("config tidak ditemukan");
      return response.json();
    })
    .then((data) => { config = { ...fallback, ...data, theme: { ...fallback.theme, ...(data.theme || {}) } }; })
    .catch(() => showToast("Memakai data contoh. Periksa config.json."))
    .finally(render);
})();
