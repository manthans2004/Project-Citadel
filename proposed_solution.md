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
