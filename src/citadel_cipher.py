# Project Citadel - Core Cipher Implementation
# Team: [Your Name], [Your Friend's Name]
# Math Engine Implementation

def matrix_multiply(M, v, mod=26):
    """
    Multiplies a matrix M by a vector v, modulo `mod`.
    """
    # Check if matrix and vector dimensions are compatible
    if len(M[0]) != len(v):
        raise ValueError("Matrix columns must match vector length")
    
    result = []
    for i in range(len(M)):
        total = 0
        for j in range(len(v)):
            total += M[i][j] * v[j]
        result.append(total % mod)
    return result

def matrix_determinant(M, mod=26):
    """
    Helper function: Calculates the determinant of a 2x2 matrix modulo `mod`.
    """
    if len(M) != 2 or len(M[0]) != 2:
        raise ValueError("Currently only supports 2x2 matrices")
    return (M[0][0] * M[1][1] - M[0][1] * M[1][0]) % mod

def matrix_inverse(M, mod=26):
    """
    Calculates the inverse of a 2x2 matrix M modulo `mod`.
    """
    # Calculate determinant
    det = matrix_determinant(M, mod)
    # Find modular multiplicative inverse of determinant
    for i in range(mod):
        if (det * i) % mod == 1:
            inv_det = i
            break
    else:
        raise ValueError("Matrix is not invertible modulo {}".format(mod))
    
    # Calculate inverse matrix for 2x2
    M_inv = [
        [ (M[1][1] * inv_det) % mod, (-M[0][1] * inv_det) % mod ],
        [ (-M[1][0] * inv_det) % mod, (M[0][0] * inv_det) % mod ]
    ]
    
    # Ensure all values are positive modulo
    for i in range(2):
        for j in range(2):
            M_inv[i][j] = M_inv[i][j] % mod
    
    return M_inv

def xor_vectors(v1, v2, mod=26):
    """
    Performs element-wise XOR (mod mod) on two vectors.
    Since we're working mod 26, we use modulo arithmetic XOR
    """
    if len(v1) != len(v2):
        raise ValueError("Vectors must be same length for XOR")
    
    result = []
    for i in range(len(v1)):
        result.append((v1[i] ^ v2[i]) % mod)
    return result

def text_to_vectors(text, block_size):
    """
    Converts a string of text to a list of vectors (lists of integers) of given block_size.
    Each character is mapped to 0-25 (A-Z or a-z).
    Pads with 'X' (23) if necessary.
    """
    text = text.upper()
    # Remove non-alpha characters
    text = ''.join([c for c in text if c.isalpha()])
    # Pad text so its length is a multiple of block_size
    while len(text) % block_size != 0:
        text += 'X'
    vectors = []
    for i in range(0, len(text), block_size):
        block = text[i:i+block_size]
        vector = [ord(c) - ord('A') for c in block]
        vectors.append(vector)
    return vectors

def vectors_to_text(vectors):
    """
    Converts a list of vectors (lists of integers) back to a string.
    Each integer is mapped to a character A-Z.
    """
    chars = []
    for vector in vectors:
        for num in vector:
            chars.append(chr((num % 26) + ord('A')))
    return ''.join(chars)

def apply_sbox(vector, sbox_func):
    """
    Applies the given S-box function to each element of the vector.
    """
    return [sbox_func(x) for x in vector]

def decrypt(ciphertext, key_matrix, iv, inverse_sbox_func):
    """
    The main decryption function.
    Follows the pseudocode from our design.
    """
    block_size = len(key_matrix)
    cipher_vectors = text_to_vectors(ciphertext, block_size)
    previous_cipherblock = iv
    plain_vectors = []

    # Get inverse matrix
    inv_key_matrix = matrix_inverse(key_matrix)
    
    for cipher_vector in cipher_vectors:
        # Inverse Non-Linear Diffusion: Apply inverse S-Box
        inverse_sbox_result = apply_sbox(cipher_vector, inverse_sbox_func)
        # Inverse Hill Cipher: Multiply with inverse key matrix
        hill_result = matrix_multiply(inv_key_matrix, inverse_sbox_result)
        # CBC Mode: XOR result with previous cipherblock
        plain_vector = xor_vectors(hill_result, previous_cipherblock)
        
        plain_vectors.append(plain_vector)
        previous_cipherblock = cipher_vector

    plaintext = vectors_to_text(plain_vectors)
    return plaintext

# --- Example S-Box functions ---
def example_sbox(x):
    return (7*x + 3) % 26

def example_inverse_sbox(y):
    return (15*y + 23) % 26

# --- Main execution area for testing YOUR functions ---
# --- Main execution area for testing YOUR functions ---
def get_matrix_input(name):
    """Dynamically create a 2x2 matrix from user input"""
    print(f"\n--- Enter {name} 2x2 Matrix ---")
    matrix = []
    for i in range(2):
        row = []
        for j in range(2):
            while True:
                try:
                    value = int(input(f"Enter value for position [{i}][{j}]: "))
                    row.append(value)
                    break
                except ValueError:
                    print("Please enter a valid integer!")
        matrix.append(row)
    return matrix

def get_vector_input(name, size=2):
    """Dynamically create a vector from user input"""
    print(f"\n--- Enter {name} Vector (size {size}) ---")
    vector = []
    for i in range(size):
        while True:
            try:
                value = int(input(f"Enter value for position [{i}]: "))
                vector.append(value)
                break
            except ValueError:
                print("Please enter a valid integer!")
    return vector

def test_complete_cipher():
    """Test the complete encryption and decryption cycle"""
    print("\n" + "="*50)
    print("FINAL TEST: Complete Encryption & Decryption")
    print("="*50)
    
    # Test parameters from our worked example
    key = [[3, 5], [2, 7]]
    iv = [1, 2]
    plaintext = "HELP"
    
    print(f"Plaintext:  {plaintext}")
    print(f"Key:        {key}")
    print(f"IV:         {iv}")
    
    # Encrypt
    ciphertext = encrypt(plaintext, key, iv, example_sbox)
    print(f"Encrypted:  {ciphertext}")
    
    # Decrypt
    decrypted = decrypt(ciphertext, key, iv, example_inverse_sbox)
    print(f"Decrypted:  {decrypted}")
    
    # Verify
    if decrypted == plaintext:
        print("✅ SUCCESS: Encryption and decryption work perfectly!")
    else:
        print("❌ ERROR: Something went wrong!")
    
    return decrypted == plaintext

# Add this to your main tester menu (option 6)
# elif choice == '6':
#     test_complete_cipher()

if __name__ == "__main__":
    print("🧪 Dynamic Math Engine Tester")
    print("=" * 40)
    
    while True:
        print("\nChoose an operation to test:")
        print("1. Matrix Multiplication")
        print("2. Matrix Inverse")
        print("3. XOR Vectors")
        print("4. Test All Operations")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == '1':
            # Matrix Multiplication Test
            key_matrix = get_matrix_input("Key")
            test_vector = get_vector_input("Test")
            result = matrix_multiply(key_matrix, test_vector)
            print(f"\n✅ Result: {key_matrix} * {test_vector} = {result} (mod 26)")
            
        elif choice == '2':
            # Matrix Inverse Test
            key_matrix = get_matrix_input("Key")
            try:
                inv_matrix = matrix_inverse(key_matrix)
                print(f"\n✅ Matrix Inverse: {inv_matrix}")
                
                # Verify the inverse
                verify_vec = get_vector_input("Verification", 2)
                result = matrix_multiply(key_matrix, verify_vec)
                print(f"   Verification: {key_matrix} * {verify_vec} = {result}")
                
            except ValueError as e:
                print(f"\n❌ Error: {e}")
                
        elif choice == '3':
            # XOR Vectors Test
            v1 = get_vector_input("First Vector")
            v2 = get_vector_input("Second Vector")
            result = xor_vectors(v1, v2)
            print(f"\n✅ XOR Result: {v1} ⊕ {v2} = {result}")
            
        elif choice == '4':
            # Test All Operations with same matrix
            print("\n--- Comprehensive Test with Same Matrix ---")
            key_matrix = get_matrix_input("Key")
            test_vector = get_vector_input("Test")
            
            # 1. Matrix Multiplication
            mult_result = matrix_multiply(key_matrix, test_vector)
            print(f"\n1. Multiplication: {key_matrix} * {test_vector} = {mult_result}")
            
            # 2. Matrix Inverse
            try:
                inv_matrix = matrix_inverse(key_matrix)
                print(f"2. Inverse: {inv_matrix}")
                
                # 3. Verify with inverse
                inv_result = matrix_multiply(inv_matrix, test_vector)
                print(f"3. Inverse Test: {inv_matrix} * {test_vector} = {inv_result}")
                
            except ValueError as e:
                print(f"2. Inverse Error: {e}")
            
            # 4. XOR
            xor_result = xor_vectors(test_vector, test_vector)  # XOR with itself
            print(f"4. XOR self: {test_vector} ⊕ {test_vector} = {xor_result}")
            
        elif choice == '5':
            print("👋 Exiting tester...")
            break
            
        else:
            print("❌ Invalid choice! Please enter 1-5.")
        
        # Ask if user wants to continue
        if choice != '5':
            cont = input("\nTest another operation? (y/n): ").lower().strip()
            if cont != 'y':
                print("👋 Exiting tester...")
                break