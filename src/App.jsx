import React, { useState } from "react";
import "./App.css";

/**
 * Project Citadel visualizer (React)
 * - Shows matrix/table style steps for:
 *   • Classical Hill (ECB)
 *   • Citadel (CBC + S-Box)
 * - Block size fixed to 2.
 * - S-Box: S(x) = (7x + 3) mod 26
 */

const MOD = 26;
const BLOCK = 2;
const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function mod(n) {
  return ((n % MOD) + MOD) % MOD;
}
function charToNum(ch) {
  return ALPH.indexOf(ch);
}
function numToChar(n) {
  return ALPH[mod(n)];
}
function sanitizeText(t) {
  const s = (t || "").toUpperCase().replace(/[^A-Z]/g, "");
  const pad = (BLOCK - (s.length % BLOCK)) % BLOCK;
  return s + "X".repeat(pad);
}
function textToBlocks(text) {
  const s = sanitizeText(text);
  const nums = Array.from(s).map((c) => charToNum(c));
  const blocks = [];
  for (let i = 0; i < nums.length; i += BLOCK) {
    blocks.push(nums.slice(i, i + BLOCK));
  }
  return { blocks, padded: s };
}
function blocksToText(blocks) {
  return blocks.flat().map((n) => numToChar(n)).join("");
}

// S-Box and inverse
const SBOX = Array.from({ length: 26 }, (_, x) => (7 * x + 3) % 26);
const SBOX_INV = (() => {
  const inv = new Array(26).fill(null);
  SBOX.forEach((val, i) => (inv[val] = i));
  return inv;
})();

// 2x2 matrix multiply
function matMul2x2(K, v) {
  const a = K[0][0],
    b = K[0][1],
    c = K[1][0],
    d = K[1][1];
  return [mod(a * v[0] + b * v[1]), mod(c * v[0] + d * v[1])];
}

// modular inverse integer via extended gcd
function egcd(a, b) {
  if (b === 0) return { g: a, x: 1, y: 0 };
  const r = egcd(b, a % b);
  return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}
function modInverseInt(a, m) {
  const r = egcd(mod(a), m);
  if (r.g !== 1) return null;
  return mod(r.x);
}

// inverse 2x2 matrix mod 26
function invKey2x2(K) {
  const a = K[0][0],
    b = K[0][1],
    c = K[1][0],
    d = K[1][1];
  const det = mod(a * d - b * c);
  const detInv = modInverseInt(det, MOD);
  if (detInv === null) return null;
  const adj = [
    [mod(d), mod(-b)],
    [mod(-c), mod(a)],
  ];
  return [
    [mod(detInv * adj[0][0]), mod(detInv * adj[0][1])],
    [mod(detInv * adj[1][0]), mod(detInv * adj[1][1])],
  ];
}

// parse key "a b c d" -> [[a,b],[c,d]]
function parseKeyText(s) {
  const parts = s
    .trim()
    .split(/\s+/)
    .map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n)))
    throw new Error("Key must be 4 integers (row-major): a b c d");
  return [
    [mod(parts[0]), mod(parts[1])],
    [mod(parts[2]), mod(parts[3])],
  ];
}
function parseIvText(s) {
  const parts = s
    .trim()
    .split(/\s+/)
    .map((p) => parseInt(p, 10));
  if (parts.length !== BLOCK || parts.some((n) => Number.isNaN(n)))
    throw new Error(`IV must be ${BLOCK} integers (0..25)`);
  return parts.map((n) => mod(n));
}

// vector add/sub mod 26
function addVec(a, b) {
  return a.map((x, i) => mod(x + b[i]));
}
function subVec(a, b) {
  return a.map((x, i) => mod(x - b[i]));
}
function applySBoxVec(v) {
  return v.map((x) => SBOX[x]);
}
function applyInvSBoxVec(v) {
  return v.map((x) => SBOX_INV[x]);
}

/* --- React Component --- */
export default function App() {
  const [plaintext, setPlaintext] = useState("HELP");
  const [keyText, setKeyText] = useState("3 5 2 7");
  const [ivText, setIvText] = useState("1 21");

  const [hillCiphertext, setHillCiphertext] = useState("");
  const [citadelCiphertext, setCitadelCiphertext] = useState("");

  const [encStepsHill, setEncStepsHill] = useState([]); // array of step objects
  const [encStepsCitadel, setEncStepsCitadel] = useState([]);

  const [decStepsHill, setDecStepsHill] = useState([]);
  const [decStepsCitadel, setDecStepsCitadel] = useState([]);

  const [lastError, setLastError] = useState("");

  function runEncrypt() {
    setLastError("");
    setEncStepsHill([]);
    setEncStepsCitadel([]);
    setDecStepsHill([]);
    setDecStepsCitadel([]);
    try {
      const K = parseKeyText(keyText);
      const IV = parseIvText(ivText);
      const { blocks, padded } = textToBlocks(plaintext);
      // hill (classical, ECB)
      const hSteps = [];
      const hillCblocks = [];
      blocks.forEach((P, idx) => {
        const hill = matMul2x2(K, P); // K·P
        hSteps.push({
          blockIndex: idx + 1,
          P,
          Pletters: blocksToText([P]),
          hill,
          hillLetters: blocksToText([hill]),
        });
        hillCblocks.push(hill.slice());
      });

      // citadel (CBC + S-Box)
      const cSteps = [];
      let prev = IV.slice();
      const citadelCblocks = [];
      blocks.forEach((P, idx) => {
        const combined = addVec(P, prev); // P xor/plus prev
        const hill = matMul2x2(K, combined);
        const afterS = applySBoxVec(hill);
        cSteps.push({
          blockIndex: idx + 1,
          P,
          Pletters: blocksToText([P]),
          prev: prev.slice(),
          combined,
          hill,
          afterS,
          cLetters: blocksToText([afterS]),
        });
        citadelCblocks.push(afterS.slice());
        prev = afterS.slice();
      });

      setEncStepsHill(hSteps);
      setEncStepsCitadel(cSteps);
      setHillCiphertext(blocksToText(hillCblocks));
      setCitadelCiphertext(blocksToText(citadelCblocks));
    } catch (e) {
      setLastError(String(e.message || e));
    }
  }

  function runDecryptHill(ciphertext) {
    setLastError("");
    setDecStepsHill([]);
    try {
      const K = parseKeyText(keyText);
      const invK = invKey2x2(K);
      if (!invK) throw new Error("Key matrix not invertible mod 26 (Hill can't decrypt).");
      const { blocks } = textToBlocks(ciphertext);
      const steps = [];
      blocks.forEach((C, idx) => {
        const invHill = matMul2x2(invK, C); // K^-1 · C
        steps.push({
          blockIndex: idx + 1,
          C,
          Cletters: blocksToText([C]),
          invHill,
          Pletters: blocksToText([invHill]),
        });
      });
      setDecStepsHill(steps);
      return blocksToText(steps.map((s) => s.invHill));
    } catch (e) {
      setLastError(String(e.message || e));
      return "";
    }
  }

  function runDecryptCitadel(ciphertext) {
    setLastError("");
    setDecStepsCitadel([]);
    try {
      const K = parseKeyText(keyText);
      const IV = parseIvText(ivText);
      const invK = invKey2x2(K);
      if (!invK) throw new Error("Key matrix not invertible mod 26 (Citadel can't decrypt).");
      const { blocks } = textToBlocks(ciphertext);
      const steps = [];
      let prev = IV.slice();
      blocks.forEach((C, idx) => {
        const invS = applyInvSBoxVec(C);
        const invHill = matMul2x2(invK, invS);
        const P = subVec(invHill, prev); // undo CBC add
        steps.push({
          blockIndex: idx + 1,
          C,
          Cletters: blocksToText([C]),
          invS,
          invHill,
          prev: prev.slice(),
          P,
          Pletters: blocksToText([P]),
        });
        prev = C.slice();
      });
      setDecStepsCitadel(steps);
      return blocksToText(steps.map((s) => s.P));
    } catch (e) {
      setLastError(String(e.message || e));
      return "";
    }
  }

  // UI handlers for decrypt buttons (use displayed ciphertext by default)
  function handleDecryptHill() {
    const ct = hillCiphertext.trim();
    if (!ct) {
      setLastError("No Hill ciphertext available to decrypt. Press Encrypt first or paste a ciphertext.");
      return;
    }
    runDecryptHill(ct);
  }
  function handleDecryptCitadel() {
    const ct = citadelCiphertext.trim();
    if (!ct) {
      setLastError("No Citadel ciphertext available to decrypt. Press Encrypt first or paste a ciphertext.");
      return;
    }
    runDecryptCitadel(ct);
  }

  function randomizeIv() {
    const r = Array.from({ length: BLOCK }, () => Math.floor(Math.random() * 26));
    setIvText(r.join(" "));
  }

  return (
    <div className="page">
      <h1>Project Citadel — Visualizer (Hill vs Citadel)</h1>
      <div className="controls">
        <div className="left">
          <label>Plaintext (letters only)</label>
          <textarea value={plaintext} onChange={(e) => setPlaintext(e.target.value)} />

          <label>Key (2×2 row-major: a b c d)</label>
          <input value={keyText} onChange={(e) => setKeyText(e.target.value)} />

          <label>IV (2 numbers separated by space)</label>
          <input value={ivText} onChange={(e) => setIvText(e.target.value)} />

          <div className="buttons">
            <button onClick={runEncrypt}>Encrypt (show steps)</button>
            <button onClick={handleDecryptHill}>Decrypt Hill</button>
            <button onClick={handleDecryptCitadel}>Decrypt Citadel</button>
            <button className="ghost" onClick={randomizeIv}>Random IV</button>
          </div>

          {lastError && <div className="error">Error: {lastError}</div>}
        </div>

        <div className="right">
          <div className="box">
            <div className="small">Classical Hill (ECB) ciphertext</div>
            <input className="mono" value={hillCiphertext} onChange={(e) => setHillCiphertext(e.target.value)} />
            <div className="small muted">Press Decrypt Hill to view decryption steps.</div>
          </div>

          <div className="box" style={{ marginTop: 10 }}>
            <div className="small">Citadel (CBC + S-Box) ciphertext</div>
            <input className="mono" value={citadelCiphertext} onChange={(e) => setCitadelCiphertext(e.target.value)} />
            <div className="small muted">Press Decrypt Citadel to view decryption steps.</div>
          </div>
        </div>
      </div>

      <section>
        <h2>Encryption - Classical Hill</h2>
        {encStepsHill.length === 0 ? (
          <div className="note">No Hill encryption run yet. Press Encrypt.</div>
        ) : (
          <div className="steps-grid">
            {encStepsHill.map((s) => (
              <div key={s.blockIndex} className="step-card">
                <div className="card-title">Block {s.blockIndex}</div>
                <table className="matrix-table">
                  <tbody>
                    <tr>
                      <td>Plain letters</td>
                      <td className="mono">{s.Pletters}</td>
                    </tr>
                    <tr>
                      <td>Plain nums</td>
                      <td className="mono">{s.P.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>K · P (Hill)</td>
                      <td className="mono">{s.hill.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Cipher letters</td>
                      <td className="mono">{s.hillLetters}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Encryption - Citadel (CBC + S-Box)</h2>
        {encStepsCitadel.length === 0 ? (
          <div className="note">No Citadel encryption run yet. Press Encrypt.</div>
        ) : (
          <div className="steps-grid">
            {encStepsCitadel.map((s) => (
              <div key={s.blockIndex} className="step-card">
                <div className="card-title">Block {s.blockIndex}</div>
                <table className="matrix-table">
                  <tbody>
                    <tr>
                      <td>Plain letters</td>
                      <td className="mono">{s.Pletters}</td>
                    </tr>
                    <tr>
                      <td>Plain nums</td>
                      <td className="mono">{s.P.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Prev (IV / C_{s.blockIndex - 1})</td>
                      <td className="mono">{s.prev.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>CBC add (P + Prev)</td>
                      <td className="mono">{s.combined.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>K · (P+Prev)</td>
                      <td className="mono">{s.hill.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>S-Box (7x+3 mod26)</td>
                      <td className="mono">{s.afterS.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Cipher letters</td>
                      <td className="mono">{s.cLetters}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Decryption — Classical Hill (table)</h2>
        {decStepsHill.length === 0 ? (
          <div className="note">No Hill decryption run yet. Press Decrypt Hill.</div>
        ) : (
          <div className="steps-grid">
            {decStepsHill.map((s) => (
              <div className="step-card" key={s.blockIndex}>
                <div className="card-title">Block {s.blockIndex}</div>
                <table className="matrix-table">
                  <tbody>
                    <tr>
                      <td>Cipher letters</td>
                      <td className="mono">{s.Cletters}</td>
                    </tr>
                    <tr>
                      <td>Cipher nums</td>
                      <td className="mono">{s.C.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>K⁻¹ · C</td>
                      <td className="mono">{s.invHill.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Recovered plain</td>
                      <td className="mono">{s.Pletters}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Decryption — Citadel (table)</h2>
        {decStepsCitadel.length === 0 ? (
          <div className="note">No Citadel decryption run yet. Press Decrypt Citadel.</div>
        ) : (
          <div className="steps-grid">
            {decStepsCitadel.map((s) => (
              <div className="step-card" key={s.blockIndex}>
                <div className="card-title">Block {s.blockIndex}</div>
                <table className="matrix-table">
                  <tbody>
                    <tr>
                      <td>Cipher letters</td>
                      <td className="mono">{s.Cletters}</td>
                    </tr>
                    <tr>
                      <td>Cipher nums</td>
                      <td className="mono">{s.C.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Inv S-Box</td>
                      <td className="mono">{s.invS.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>K⁻¹ · (InvS)</td>
                      <td className="mono">{s.invHill.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Subtract Prev (CBC)</td>
                      <td className="mono">{s.P.join(", ")}</td>
                    </tr>
                    <tr>
                      <td>Recovered plain</td>
                      <td className="mono">{s.Pletters}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="foot">
        Tip: use the Random IV button to demo different ciphertexts for the same plaintext (Citadel
        will change; Hill will not).
      </footer>
    </div>
  );
}
