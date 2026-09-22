# Undangan Takziah 7 Hari Digital

Aplikasi undangan mobile berbasis HTML, CSS, JavaScript, dan JSON. Tidak memerlukan database atau proses build, sehingga dapat langsung dipasang di GitHub Pages.

## Fitur

- Tampilan undangan yang responsif untuk ponsel
- Transisi sampul dinamis dan animasi masuk saat halaman digulir
- Personalisasi nama tamu melalui URL `?to=Nama Tamu`
- Foto almarhum/almarhumah dan musik latar
- Informasi tanggal, waktu, lokasi, peta, dan hitung mundur
- Admin untuk mengatur isi undangan
- Daftar tamu lokal dengan nomor WhatsApp opsional
- Generator pesan dan tautan WhatsApp per tamu
- Ekspor daftar tamu ke CSV
- Ekspor konfigurasi ke `config.json`

## Menjalankan secara lokal

Karena halaman membaca `config.json`, jangan membuka `index.html` langsung melalui `file://`. Jalankan server lokal dari folder proyek:

```bash
python -m http.server 8000
```

Kemudian buka:

- Undangan: `http://localhost:8000/`
- Admin: `http://localhost:8000/admin.html`

## Mengatur undangan

1. Buka `admin.html` melalui server lokal atau GitHub Pages.
2. Isi data acara dan klik **Simpan di Perangkat**.
3. Jika menggunakan foto atau musik baru, pilih file lalu klik tombol unduh media.
4. Buka tab **Publikasi** dan unduh `config.json`.
5. Ganti `config.json` pada repositori.
6. Letakkan foto dan musik hasil unduhan di folder `assets`.

Data admin dan daftar tamu tersimpan di `localStorage` browser yang sedang dipakai. Daftar tamu tidak dimasukkan ke GitHub.

## Mengunggah ke GitHub Pages

1. Buat repositori baru di GitHub.
2. Unggah seluruh isi folder ini ke cabang `main`.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih cabang `main` dan folder `/ (root)`, lalu simpan.
6. Tunggu sampai URL GitHub Pages aktif, contohnya `https://username.github.io/nama-repo/`.
7. Masukkan URL tersebut pada kolom **URL undangan GitHub Pages** di halaman admin.

## Format daftar tamu

Satu tamu per baris:

```text
Bapak Abdullah|628123456789
Ibu Aminah
Keluarga Bapak Hasan|628987654321
```

Nomor telepon bersifat opsional. Gunakan format internasional tanpa awalan `0`, misalnya `628123456789`.

## Catatan keamanan

GitHub Pages adalah hosting statis. `admin.html` bukan panel admin dengan autentikasi server dan tidak dapat menulis langsung ke repositori. Jangan menyimpan token GitHub, nomor identitas, atau data sensitif pada kode. Menghapus `admin.html` dari versi publik dapat mengurangi kebingungan, tetapi bukan mekanisme keamanan untuk data yang sudah berada di repositori.

## Struktur proyek

```text
.
├── index.html
├── style.css
├── app.js
├── admin.html
├── admin.css
├── admin.js
├── config.json
└── assets/
    ├── placeholder-foto.svg
    ├── foto-rahman-saleh.png
    ├── foto-almarhum.jpg
    └── musik-latar.mp3
```

`placeholder-foto.svg` sudah disertakan. File foto dan musik sebenarnya perlu ditambahkan sendiri. Jika musik belum ada, tombol musik tidak akan ditampilkan.
