# Project Citadel - Core Cipher Implementation
# Team: [Your Name], [Your Friend's Name]

def text_to_vectors(plaintext, block_size):
    """
    Converts a string into a list of numerical vectors.
    Example: "HELP" -> [[7, 4], [11, 15]]
    """
    # Convert to uppercase and remove non-alphabet characters
    plaintext = plaintext.upper()
    plaintext = ''.join([char for char in plaintext if char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"])
    
    # Convert letters to numbers (A=0, B=1, ..., Z=25)
    num_list = [ord(char) - ord('A') for char in plaintext]
    
    # Split into blocks of size `block_size`, padding the last block if necessary
    vectors = []
    for i in range(0, len(num_list), block_size):
        block = num_list[i:i+block_size]
        # Pad the last block if it's too short
        while len(block) < block_size:
            block.append(0)  # Pad with 'A' (0)
        vectors.append(block)
    
    return vectors

    # Test parameters from our worked_example.md
    test_plaintext = "HELP"
    test_key = [[3, 5], [2, 7]]
    test_iv = [1, 2]
    test_sbox = example_sbox

    print(f"Encrypting: '{test_plaintext}'")
    print(f"With Key: {test_key}")
    print(f"With IV: {test_IV}")

    ciphertext_result = encrypt(test_plaintext, test_key, test_iv, test_sbox)
    print(f"\nFinal Ciphertext: {ciphertext_result}")
    print(f"Expected Ciphertext: BRPB") # From our worked_example.md
def vectors_to_text(vector_list):
    """
    Converts a list of numerical vectors back to a string.
    Example: [[7, 4], [11, 15]] -> "HELP"
    """
    text_list = []
    for vector in vector_list:
        # Convert each number in the vector to a letter
        for num in vector:
            # Ensure the number is within the valid range before conversion
            if 0 <= num <= 25:
                text_list.append(chr(num + ord('A')))
            else:
                # Handle potential errors from other functions gracefully
                text_list.append('?')
    return ''.join(text_list)

def matrix_multiply(M, v, mod=26):
    """
    Multiplies a matrix M by a vector v, modulo `mod`.
    TODO: Person 2 will implement the real version.
    For now, this is a dummy function for Person 1 to test the encryption flow.
    It returns a hardcoded result based on our known example.
    """
    # This is HARDCODED to return the result for the known input [6, 6]
    if v == [6, 6]:
        return [22, 2] # This is K * [6, 6] from our example
    elif v == [10, 4]:
        return [24, 22] # This is K * [10, 4] from our example
    else:
        # For any other input, just return the input itself (not correct, but lets us test)
        return v
    
def encrypt(plaintext, key_matrix, iv, sbox_func):
    """
    The main encryption function.
    Follows the pseudocode from our design.
    """
    # Convert the plaintext into numerical vectors
    plain_vectors = text_to_vectors(plaintext, len(key_matrix))
    
    # Initialize the previous ciphertext block to the IV
    previous_ct_block = iv
    
    # This will store our final list of ciphertext vectors
    cipher_vectors = []
    
    # Iterate through each plaintext vector block
    for plain_vector in plain_vectors:
        # 1. XOR the plaintext block with the previous ciphertext block
        xor_result = xor_vectors(plain_vector, previous_ct_block)
        print(f"XOR result: {xor_result}") # Debug print
        
        # 2. Apply the Hill Cipher (matrix multiplication)
        hill_result = matrix_multiply(key_matrix, xor_result)
        print(f"Hill result: {hill_result}") # Debug print
        
        # 3. Apply the S-Box for non-linear diffusion
        sbox_result = apply_sbox(hill_result, sbox_func)
        print(f"S-Box result: {sbox_result}") # Debug print
        
        # This S-Box result IS our ciphertext block for this step
        cipher_block = sbox_result
        cipher_vectors.append(cipher_block)
        
        # Update the previous ciphertext block for the next iteration
        previous_ct_block = cipher_block
    
    # Convert the list of ciphertext vectors back into text
    ciphertext = vectors_to_text(cipher_vectors)
    return ciphertext

def matrix_inverse(M, mod=26):
    """
    Calculates the inverse of matrix M modulo `mod`.
    This is a challenging function. We will work on it together.
    """
    # TODO: Implement this function
    pass

def xor_vectors(v1, v2, mod=26):
    """
    Performs element-wise XOR (mod mod) on two vectors.
    IMPORTANT: We use modulo to keep numbers in our alphabet range.
    """
    result = []
    # Pair up corresponding elements from each vector and XOR them
    for i in range(len(v1)):
        result.append( (v1[i] ^ v2[i]) % mod )
    return result

def apply_sbox(vector, sbox_func):
    """
    Applies an S-Box function to each element of a vector.
    """
    return [sbox_func(x) for x in vector]

# Example S-Box function (S(x) = (7x + 3) mod 26)
def example_sbox(x):
    return (7*x + 3) % 26

# Example Inverse S-Box function (S^{-1}(y) = (15y + 23) mod 26)
def example_inverse_sbox(y):
    return (15*y + 23) % 26

def encrypt(plaintext, key_matrix, iv, sbox_func):
    """
    The main encryption function.
    Follows the pseudocode from our design.
    """
    # TODO: Implement this function
    pass

def decrypt(ciphertext, key_matrix, iv, inverse_sbox_func):
    """
    The main decryption function.
    Follows the pseudocode from our design.
    """
    # TODO: Implement this function
    pass

# --- Main execution area for testing ---
if __name__ == "__main__":
    print("Testing text_to_vectors...")
    test_text = "HELP"
    test_vectors = text_to_vectors(test_text, 2)
    print(f"Original text: {test_text}")
    print(f"Converted vectors: {test_vectors}") # Should be [[7, 4], [11, 15]]
    print("\nTesting vectors_to_text...")
    test_vector_list = [[7, 4], [11, 15]]
    converted_text = vectors_to_text(test_vector_list)
    print(f"Original vectors: {test_vector_list}")
    print(f"Converted text: {converted_text}") # Should be "HELP"
    print("\n" + "="*50)
    print("FULL ENCRYPTION TEST")
    print("="*50)
