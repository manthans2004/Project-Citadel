
# Project Citadel

## 🔐 Overview  
**Project Citadel** enhances the classical **Hill Cipher** by integrating modern cryptographic principles to address its critical vulnerabilities.  
The enhancement is achieved through two primary mechanisms:  

1. **Non-Linear Diffusion** via a Substitution Box (S-Box).  
2. **Cipher Block Chaining (CBC)** mode of operation.  

---

## 1. Non-Linear Diffusion (The S-Box)  

### 🔧 The Enhancement  
After the standard linear matrix multiplication step, the resulting vector is passed through a **non-linear substitution box (S-Box)**.  
This S-Box maps each input value (0–25) to a different output value in a non-linear, pre-defined manner.  

### 🛡️ How It Mitigates Hill's Weaknesses  
- **Counters Known-Plaintext Attacks:**  
  The S-Box breaks the linear relationship between the plaintext and ciphertext. Even with known `(P, C)` pairs, an attacker cannot set up simple linear equations to solve for the key `K`.  
- **Introduces Non-Linearity:**  
  Provides *confusion*—a fundamental property of modern ciphers (e.g., AES). Ensures ciphertext is not a linear function of plaintext.  

### 📖 Example S-Box Definition  
A simple S-Box can be defined as:  

```text
S(x) = (7x + 3) mod 26
````

This function is affine but introduces non-linearity.
For stronger designs, a prime multiplicative inverse or a more robust non-linear mapping can be used.

---

## 2. Cipher Block Chaining (CBC) Mode

### 🔧 The Enhancement

CBC mode is integrated on top of the **Hill + S-Box** function:

1. Split message into blocks `P1, P2, ..., Pn`.
2. Generate an **Initialization Vector (IV)** for the first block.
3. XOR each plaintext block with the previous ciphertext block before encryption.
4. First block is XORed with the IV.

**Encryption per block `i`:**

```text
Ci = Encrypt_K( Pi ⊕ Ci-1 )
```

where `C0 = IV`.

### 🛡️ How It Mitigates Hill's Weaknesses

* **Eliminates Patterns (ECB Weakness):**
  Identical plaintext blocks → different ciphertext blocks.
* **Provides Diffusion:**
  An error in one plaintext block propagates to subsequent ciphertext blocks.

---

## 3. Integrated Workflow

The complete encryption pipeline per block:

```text
[Plaintext Block i] 
        ↓ XOR with Previous Ciphertext 
[Hill Cipher (Matrix K)] 
        ↓ 
[S-Box Substitution] 
        ↓ 
[Ciphertext Block i]
```

---

## 4. Pseudocode

### 🔒 Encryption

```pseudo
function encrypt(plaintext, key_matrix, iv, sbox):
    plain_vectors = text_to_vectors(plaintext, block_size)
    previous_cipherblock = iv
    cipher_vectors = []

    for plain_vector in plain_vectors:
        xor_result = xor_vectors(plain_vector, previous_cipherblock)
        hill_result = matrix_multiply(key_matrix, xor_result) mod 26
        sbox_result = apply_sbox(hill_result, sbox)
        cipher_vector = sbox_result
        append cipher_vector to cipher_vectors
        previous_cipherblock = cipher_vector

    ciphertext = vectors_to_text(cipher_vectors)
    return ciphertext
```

### 🔓 Decryption

```pseudo
function decrypt(ciphertext, key_matrix, iv, inverse_sbox):
    cipher_vectors = text_to_vectors(ciphertext, block_size)
    previous_cipherblock = iv
    plain_vectors = []
    inv_key_matrix = matrix_inverse(key_matrix, 26)

    for cipher_vector in cipher_vectors:
        inverse_sbox_result = apply_sbox(cipher_vector, inverse_sbox)
        hill_result = matrix_multiply(inv_key_matrix, inverse_sbox_result) mod 26
        plain_vector = xor_vectors(hill_result, previous_cipherblock)
        append plain_vector to plain_vectors
        previous_cipherblock = cipher_vector

    plaintext = vectors_to_text(plain_vectors)
    return plaintext
```

---

## 5. Conclusion

**Project Citadel** successfully addresses the fundamental vulnerabilities of the classical Hill Cipher.

* By integrating a **non-linear S-Box**, it defends against known-plaintext attacks and breaks the linearity that facilitates algebraic cryptanalysis.
* The use of **Cipher Block Chaining (CBC) mode** ensures semantic security, hides patterns in plaintext, and provides robust diffusion.

This design demonstrates a principled approach to cryptographic enhancement, drawing on modern techniques like substitution-permutation networks and secure modes of operation.

While the classical Hill Cipher remains a valuable historical tool for teaching linear algebra in cryptography, Project Citadel reimagines it as a pedagogically powerful model that incorporates the essential elements of a modern block cipher.

### 🚀 Future Work

* Implement the algorithm in software to validate its security and performance.
* Conduct formal cryptanalysis on the proposed design.
* Explore more complex S-Box designs and key scheduling algorithms.


