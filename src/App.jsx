import React, { useState } from "react";
import { saveAs } from "file-saver";
import "./App.css";

/* --- Helpers --- */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (b64) => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

const hexToUint8Array = (hex) => {
  const pairs = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(pairs.map((p) => parseInt(p, 16)));
};

const tryParseKeyInput = (str) => {
  const s = str.trim();
  // try base64 first
  try {
    const ab = base64ToArrayBuffer(s);
    return new Uint8Array(ab);
  } catch (e) {
    // try hex (only hex characters)
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
      return hexToUint8Array(s);
    }
    throw new Error("Key/IV: not valid Base64 or hex");
  }
};

const concatUint8 = (...arrs) => {
  const total = arrs.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
};

const u32ToBigEndian4 = (n) => {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
};

const bigEndian4ToU32 = (u8) => {
  return (u8[0] << 24) | (u8[1] << 16) | (u8[2] << 8) | u8[3];
};

/* --- App --- */
export default function App() {
  const [encKeyB64, setEncKeyB64] = useState("");
  const [encIvB64, setEncIvB64] = useState("");
  const [encFile, setEncFile] = useState(null); // uploaded .enc for decrypt
  const [decKeyInput, setDecKeyInput] = useState("");
  const [decIvInput, setDecIvInput] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });

  const readFileAsArrayBuffer = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });

  const readFileAsText = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsText(file);
    });

  const setStatusMsg = (txt, type = "") => {
    setStatus({ text: txt, type });
    // auto-clear after 5s for non-error
    if (type !== "error") {
      setTimeout(() => setStatus({ text: "", type: "" }), 5000);
    }
  };

  /* ---------- ENCRYPT (WebCrypto AES-GCM, authenticated & fast) ---------- */
  const handleEncryptFile = async (e) => {
    setStatus({ text: "", type: "" });
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileAb = await readFileAsArrayBuffer(file);

      // metadata
      const meta = JSON.stringify({ name: file.name, type: file.type || "application/octet-stream" });
      const metaBytes = new TextEncoder().encode(meta);

      // header = 4 bytes length of meta (big-endian) + metaBytes + file bytes
      const header = u32ToBigEndian4(metaBytes.length);
      const combined = concatUint8(header, metaBytes, new Uint8Array(fileAb));

      // key (32 bytes) and iv (12 bytes) generation
      const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256-bit
      const ivBytes = crypto.getRandomValues(new Uint8Array(12)); // 96-bit recommended for GCM

      // import key
      const cryptoKey = await crypto.subtle.importKey("raw", keyBytes.buffer, { name: "AES-GCM" }, false, ["encrypt"]);

      // encrypt with AES-GCM (authenticating)
      const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, cryptoKey, combined.buffer);

      // store ciphertext as base64 JSON (no key/iv inside)
      const payload = { data: arrayBufferToBase64(cipherBuffer) };
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      saveAs(blob, file.name + ".enc");

      // show key/iv to user in base64 (they must save these)
      const keyB64 = arrayBufferToBase64(keyBytes.buffer);
      const ivB64 = arrayBufferToBase64(ivBytes.buffer);
      setEncKeyB64(keyB64);
      setEncIvB64(ivB64);

      setStatusMsg("Encrypted — .enc downloaded. Save Key & IV (shown below).", "success");

      // try copy to clipboard (best-effort)
      try {
        await navigator.clipboard.writeText(`Key (base64): ${keyB64}\nIV (base64): ${ivB64}`);
        setStatusMsg("Encrypted — key & iv copied to clipboard.", "success");
      } catch (_) {}
    } catch (err) {
      console.error(err);
      setStatusMsg("Encryption failed.", "error");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg("Copied to clipboard.", "success");
    } catch {
      setStatusMsg("Copy failed.", "error");
    }
  };

  /* ---------- DECRYPT (uses WebCrypto AES-GCM; authenticated) ---------- */
  const handleEncUpload = (e) => {
    setEncFile(e.target.files?.[0] || null);
    setStatus({ text: "", type: "" });
  };

  const handleDecrypt = async () => {
    setStatus({ text: "", type: "" });

    if (!encFile) {
      setStatusMsg("Upload a .enc file to decrypt.", "error");
      return;
    }
    if (!decKeyInput.trim() || !decIvInput.trim()) {
      setStatusMsg("Enter Key and IV (base64 or hex).", "error");
      return;
    }

    // parse .enc JSON
    let payload;
    try {
      const encText = await readFileAsText(encFile);
      payload = JSON.parse(encText);
      if (!payload?.data) throw new Error("Bad payload");
    } catch {
      setStatusMsg("Uploaded file is not a valid Citadel .enc file (JSON missing).", "error");
      return;
    }

    // parse provided key/iv (base64 or hex)
    let keyBytes, ivBytes;
    try {
      keyBytes = tryParseKeyInput(decKeyInput);
      ivBytes = tryParseKeyInput(decIvInput);
    } catch (e) {
      setStatusMsg("Key/IV must be Base64 or hex and valid length.", "error");
      return;
    }

    // basic length checks
    if (keyBytes.length !== 32) {
      setStatusMsg("Key must be 32 bytes (256-bit). Provide base64 or 64-hex chars.", "error");
      return;
    }
    if (ivBytes.length !== 12 && ivBytes.length !== 16) {
      // prefer 12, but allow 16 if user used 128-bit iv — warn but still try
      setStatusMsg("Warning: IV length looks unusual (recommended 12 bytes). Attempting decryption anyway.", "warning");
      // continue
    }

    // prepare cipher ArrayBuffer
    const cipherAb = base64ToArrayBuffer(payload.data);

    // import key
    let cryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey("raw", keyBytes.buffer, { name: "AES-GCM" }, false, ["decrypt"]);
    } catch (e) {
      setStatusMsg("Failed to import key. Ensure key format is correct.", "error");
      return;
    }

    // attempt decrypt — if key/iv wrong, this will reject
    let decryptedBuffer;
    try {
      decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, cryptoKey, cipherAb);
    } catch (err) {
      console.warn("decrypt error", err);
      setStatusMsg("❌ Decryption failed. Key and IV do not match this encrypted file (or file corrupted).", "error");
      return;
    }

    try {
      // parse decrypted payload: first 4 bytes = metadata length (big-endian)
      const dv = new Uint8Array(decryptedBuffer);
      if (dv.length < 4) {
        setStatusMsg("Decryption produced unexpected data.", "error");
        return;
      }
      const metaLen = bigEndian4ToU32(dv.subarray(0, 4));
      if (metaLen <= 0 || metaLen > dv.length - 4) {
        setStatusMsg("Decrypted metadata length invalid — wrong Key/IV or corrupted.", "error");
        return;
      }
      const metaBytes = dv.subarray(4, 4 + metaLen);
      const dataBytes = dv.subarray(4 + metaLen);

      const metaStr = new TextDecoder().decode(metaBytes);
      let meta;
      try {
        meta = JSON.parse(metaStr);
      } catch {
        setStatusMsg("Decrypted metadata is invalid — wrong Key/IV or corrupted.", "error");
        return;
      }

      // create Blob and download
      const outBlob = new Blob([dataBytes], { type: meta.type || "application/octet-stream" });
      saveAs(outBlob, meta.name || "decrypted_file");
      setStatusMsg(`✅ Decrypted and downloaded "${meta.name || "decrypted_file"}".`, "success");
    } catch (err) {
      console.error(err);
      setStatusMsg("Unexpected error while finalizing decrypted file.", "error");
    }
  };

  return (
    <div className="app-container">
      <header style={{ textAlign: "center", marginBottom: 14 }}>
        <h1 className="title">Citadel — Fast & Authenticated Encrypt/Decrypt</h1>
        <p className="muted">AES-GCM (WebCrypto). Only exact Key + IV will decrypt.</p>
      </header>

      <section className="section">
        <h2>Encrypt</h2>
        <p className="muted">Select a file. A <code>.enc</code> file will be downloaded. Save Key & IV shown below.</p>
        <input type="file" className="file-input" onChange={handleEncryptFile} />
        {encKeyB64 && (
          <div className="key-iv-card" style={{ marginTop: 14 }}>
            <div className="key-iv-item">
              <div>
                <div style={{ fontSize: 12, color: "#aab" }}>Key (base64)</div>
                <div style={{ marginTop: 6, wordBreak: "break-all" }}>{encKeyB64}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" className="copy-btn" onClick={() => copyToClipboard(encKeyB64)}>Copy</button>
              </div>
            </div>

            <div className="key-iv-item" style={{ marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#aab" }}>IV (base64)</div>
                <div style={{ marginTop: 6, wordBreak: "break-all" }}>{encIvB64}</div>
              </div>
              <div>
                <button type="button" className="copy-btn" onClick={() => copyToClipboard(encIvB64)}>Copy</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <h2>Decrypt</h2>
        <p className="muted">Upload the <code>.enc</code> file produced earlier, paste Key & IV (base64 or hex).</p>
        <input type="file" className="file-input" accept=".enc,application/json" onChange={handleEncUpload} />
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input type="text" placeholder="Key (base64 or hex)" value={decKeyInput} onChange={(e) => setDecKeyInput(e.target.value)} />
          <input type="text" placeholder="IV (base64 or hex)" value={decIvInput} onChange={(e) => setDecIvInput(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn primary" onClick={handleDecrypt}>Decrypt & Download</button>
            <button type="button" className="btn" onClick={() => { setDecKeyInput(encKeyB64); setDecIvInput(encIvB64); setStatusMsg("Filled Key & IV from last encryption.", "success"); }}>Fill Last Key/IV</button>
          </div>
        </div>
      </section>

      {status.text && (
        <div className={`status ${status.type}`} role="status" style={{ marginTop: 16 }}>
          {status.text}
        </div>
      )}

      <footer style={{ marginTop: 18, color: "rgba(230,238,248,0.6)", fontSize: 13 }}>
        Tip: store Key & IV offline (not together with the .enc file).
      </footer>
    </div>
  );
}
