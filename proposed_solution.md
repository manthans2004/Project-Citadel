# Project Citadel: Proposed Solution

## Overview
Project Citadel enhances the classical Hill Cipher by integrating modern cryptographic principles to address its critical vulnerabilities. The enhancement is achieved through two primary mechanisms:
1.  The introduction of **Non-Linear Diffusion** via a Substitution Box (S-Box).
2.  The implementation of the **Cipher Block Chaining (CBC)** mode of operation.

## 1. Non-Linear Diffusion (The S-Box)

### The Enhancement
After the standard linear matrix multiplication step, the resulting vector is passed through a non-linear substitution box (S-Box). This S-Box maps each input value (0-25) to a different output value in a non-linear, pre-defined manner.

### How It Mitigates Hill's Weaknesses
-   **Counters Known-Plaintext Attacks:** The S-Box breaks the linear relationship between the plaintext and ciphertext. Even with known `(P, C)` pairs, an attacker cannot set up a simple system of linear equations to solve for the key `K` because the non-linear step makes the equations much more complex and unsolvable with linear algebra.
-   **Introduces Non-Linearity:** This is a fundamental requirement for modern secure ciphers (e.g., AES). It provides "confusion," ensuring the output is not a linear function of the input.

### Example S-Box Definition
A simple S-Box can be defined by the function: `S(x) = (7x + 3) mod 26`
This function is affine but provides a basic model of non-linearity for demonstration. A more robust S-Box would use a prime multiplicative inverse.

## 2. Cipher Block Chaining (CBC) Mode

### The Enhancement
CBC mode is integrated to operate on top of the core Hill + S-Box function.
1.  The message is split into blocks \( P_1, P_2, ..., P_n \).
2.  An **Initialization Vector (IV)** is generated for the first block.
3.  Each plaintext block is XORed (\( \oplus \)) with the previous ciphertext block before being encrypted.
4.  The first block is XORed with the IV.

**Encryption Process for block *i*:**
`C_i = Encrypt_K( P_i ⊕ C_{i-1} )` where `C_0 = IV`

### How It Mitigates Hill's Weaknesses
-   **Eliminates Patterns (ECB Weakness):** Identical plaintext blocks will produce different ciphertext blocks because each block's encryption depends on the previous ciphertext. This hides patterns and provides "semantic security."
-   **Provides Diffusion:** An error in one plaintext block will propagate to all subsequent ciphertext blocks, which is a desirable cryptographic property.

## Integrated Workflow of Project Citadel

The complete encryption process for a single block is now a multi-step pipeline:

`[Plaintext Block i] --> XOR with Previous Ciphertext --> [Hill Cipher (Matrix K)] --> [S-Box Substitution] --> [Ciphertext Block i]`
Encryption Pseudocode
function encrypt(plaintext, key_matrix, iv, sbox):
  // 1. Convert plaintext string to list of numerical vectors
  plain_vectors = text_to_vectors(plaintext, block_size)

  // 2. Initialize previous_cipherblock for CBC mode (starts with IV)
  previous_cipherblock = iv

  // 3. Initialize empty list for ciphertext vectors
  cipher_vectors = []

  // 4. Process each plaintext vector
  for each plain_vector in plain_vectors:
    // CBC Mode: XOR plaintext with previous cipherblock
    xor_result = xor_vectors(plain_vector, previous_cipherblock)

    // Hill Cipher: Multiply with key matrix
    hill_result = matrix_multiply(key_matrix, xor_result) mod 26

    // Non-Linear Diffusion: Apply S-Box to each element
    sbox_result = apply_sbox(hill_result, sbox)

    // This block is the new ciphertext
    cipher_vector = sbox_result
    append cipher_vector to cipher_vectors

    // Update previous_cipherblock for next iteration
    previous_cipherblock = cipher_vector

  // 5. Convert all cipher vectors back to text
  ciphertext = vectors_to_text(cipher_vectors)
  return ciphertext

  Decryption Pseudocode
  function decrypt(ciphertext, key_matrix, iv, inverse_sbox):
  // 1. Convert ciphertext string to list of numerical vectors
  cipher_vectors = text_to_vectors(ciphertext, block_size)

  // 2. Initialize previous_cipherblock for CBC mode (starts with IV)
  previous_cipherblock = iv

  // 3. Initialize empty list for plaintext vectors
  plain_vectors = []

  // 4. Get the inverse of the key matrix for decryption
  inv_key_matrix = matrix_inverse(key_matrix, 26)

  // 5. Process each ciphertext vector
  for each cipher_vector in cipher_vectors:
    // Inverse Non-Linear Diffusion: Apply inverse S-Box
    inverse_sbox_result = apply_sbox(cipher_vector, inverse_sbox)

    // Inverse Hill Cipher: Multiply with inverse key matrix
    hill_result = matrix_multiply(inv_key_matrix, inverse_sbox_result) mod 26

    // CBC Mode: XOR result with previous cipherblock to recover plaintext
    plain_vector = xor_vectors(hill_result, previous_cipherblock)

    append plain_vector to plain_vectors

    // Update previous_cipherblock for next iteration
    previous_cipherblock = cipher_vector // Use the original ciphertext block

  // 6. Convert all plain vectors back to text
  plaintext = vectors_to_text(plain_vectors)
  return plaintext

   Conclusion
Project Citadel successfully addresses the fundamental vulnerabilities of the classical Hill Cipher. By integrating a non-linear S-Box, it defends against known-plaintext attacks and breaks the linearity that facilitates algebraic cryptanalysis. Furthermore, the implementation of Cipher Block Chaining (CBC) mode ensures semantic security by hiding patterns in the plaintext and providing robust diffusion.

This design demonstrates a principled approach to cryptographic enhancement, drawing on well-established modern techniques like substitution-permutation networks and secure modes of operation. While the classical Hill Cipher remains a valuable historical tool for teaching linear algebra in cryptography, Project Citadel reimagines it as a pedagogically powerful model that incorporates the essential elements of a modern block cipher.
