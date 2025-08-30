# Project Citadel: Enhanced Hill Cipher with S-Box and CBC Mode

## Overview

Project Citadel is an enhanced version of the classical Hill Cipher that addresses its critical cryptographic weaknesses through two primary mechanisms:
1. **Non-Linear Diffusion** via a Substitution Box (S-Box)
2. **Cipher Block Chaining (CBC)** mode of operation

## The Classical Hill Cipher

### How the Hill Cipher Works

The Hill Cipher is a polygraphic substitution cipher based on linear algebra that encrypts blocks of letters at a time.

#### Encryption Process

1. **Choose Block Size (m)**: Determines the size of the square key matrix (typically m=2)
2. **Convert Letters to Numbers**: A=0, B=1, C=2, ..., Z=25
   - Plaintext: 'HELP'
   - H → 7, E → 4, L → 11, P → 15
3. **Form Plaintext Vectors**: Split into vectors of size m
   - Vector 1, P₁: [7, 4] (HE)
   - Vector 2, P₂: [11, 15] (LP)
4. **Choose Key Matrix (K)**: Must be invertible modulo 26
   - Example: K = $\begin{bmatrix} 3 & 5 \\ 2 & 7 \end{bmatrix}$
5. **Encrypt Each Vector**: Ciphertext Vector = (K × Plaintext Vector) mod 26
   - For P₁ = [7, 4]:
     - First element: (3×7 + 5×4) mod 26 = (21 + 20) mod 26 = 41 mod 26 = 15 → P
     - Second element: (2×7 + 7×4) mod 26 = (14 + 28) mod 26 = 42 mod 26 = 16 → Q
     - C₁ = [15, 16] → PQ
   - For P₂ = [11, 15]:
     - First element: (3×11 + 5×15) mod 26 = (33 + 75) mod 26 = 108 mod 26 = 4 → E
     - Second element: (2×11 + 7×15) mod 26 = (22 + 105) mod 26 = 127 mod 26 = 23 → X
     - C₂ = [4, 23] → EX
6. **Form Ciphertext**: Combine output vectors → "PQEX"

#### Decryption Process

Decryption requires finding the inverse of the key matrix modulo 26 (K⁻¹).

- Inverse of K = $\begin{bmatrix} 3 & 5 \\ 2 & 7 \end{bmatrix}$ is K⁻¹ = $\begin{bmatrix} 15 & 3 \\ 20 & 9 \end{bmatrix}$
- For C₁ = [15, 16]:
  - First element: (15×15 + 3×16) mod 26 = (225 + 48) mod 26 = 273 mod 26 = 7 → H
  - Second element: (20×15 + 9×16) mod 26 = (300 + 144) mod 26 = 444 mod 26 = 4 → E

## Critical Limitations of the Classical Hill Cipher

### 1. Vulnerability to Known-Plaintext Attack (KPA)
- **Problem**: If an attacker knows m pairs of plaintext and ciphertext vectors, they can easily solve for the key matrix K
- **Why**: The equation C = (K × P) mod 26 is a linear system that can be solved with known (P, C) pairs

### 2. Fully Linear Transformation
- **Problem**: Matrix multiplication is a linear operation that preserves data structure
- **Why**: Linear transformations are vulnerable to algebraic cryptanalysis

### 3. Lack of Diffusion (ECB Mode)
- **Problem**: Identical plaintext blocks produce identical ciphertext blocks
- **Example**: The word "HE" would always encrypt to "PQ", leaking pattern information

### 4. Restrictions on Key Matrix
- **Problem**: Key matrix must be invertible modulo 26 (determinant coprime with 26)
- **Why**: Limits key space and complicates key generation

## How Project Citadel Overcomes These Limitations

### 1. Non-Linear Diffusion (S-Box)
- **Solution**: After matrix multiplication, pass the result through a non-linear S-Box
- **Implementation**: S(x) = (7x + 3) mod 26
- **Advantage**: Breaks linear relationship between plaintext and ciphertext, making algebraic attacks infeasible

### 2. Cipher Block Chaining (CBC) Mode
- **Solution**: XOR each plaintext block with previous ciphertext block before encryption
- **Implementation**: Use random Initialization Vector (IV) for first block
- **Advantages**:
  - Eliminates patterns: Same plaintext blocks produce different ciphertexts
  - Provides diffusion: Errors propagate through subsequent blocks

## Project Citadel Encryption Process

For each block i:

```
[Plaintext Block i] → XOR → [Hill Cipher (K)] → [S-Box] → [Ciphertext Block i]
         ^                          |
         |--------------------------[Ciphertext Block i-1] (or IV)
```

## Summary of Improvements

| Limitation of Hill Cipher | How Project Citadel Overcomes It |
|---------------------------|----------------------------------|
| **Known-Plaintext Attack** | Non-Linear S-Box breaks linear relationships |
| **Fully Linear Transformation** | S-Box introduces non-linearity (like AES) |
| **Lack of Diffusion** | CBC mode ensures ciphertext depends on all previous blocks |
| **Pattern Preservation** | IV and chaining eliminate deterministic patterns |

## Implementation Details

### S-Box Implementation
```python
def create_sbox():
    return [(7 * x + 3) % 26 for x in range(26)]

# Example: S(0) = 3, S(1) = 10, S(2) = 17, ..., S(25) = 22
```

### Key Requirements
- Key matrix must be invertible modulo 26
- Determinant must be coprime with 26
- Example valid key: $\begin{bmatrix} 3 & 5 \\ 2 & 7 \end{bmatrix}$

## Usage Example

1. **Encryption**:
   - Input: "HELP" with key $\begin{bmatrix} 3 & 5 \\ 2 & 7 \end{bmatrix}$
   - Process: CBC → Hill Cipher → S-Box
   - Output: Ciphertext (varies due to random IV)

2. **Decryption**:
   - Input: Ciphertext + IV
   - Process: Inverse S-Box → Inverse Hill Cipher → CBC
   - Output: Original plaintext "HELP"

## Conclusion

Project Citadel transforms the classical Hill Cipher from a historically interesting but vulnerable cipher into a pedagogically powerful model of modern cryptography. By incorporating non-linear substitution and chaining modes, it demonstrates essential principles of confusion and diffusion that underpin modern secure cryptosystems.

The implementation provides:
- Resistance to known-plaintext attacks
- Non-linear transformations
- Semantic security through CBC mode
- Error propagation capabilities
- Educational value in understanding cryptographic principles
