# Project Citadel - Core Cipher Implementation
# Team: [Your Name], [Your Friend's Name]

def text_to_vectors(plaintext, block_size):
    """
    Converts a string into a list of numerical vectors.
    Example: "HELP" -> [[7, 4], [11, 15]]
    """
    # TODO: Implement this function
    pass

def vectors_to_text(vector_list):
    """
    Converts a list of numerical vectors back to a string.
    Example: [[7, 4], [11, 15]] -> "HELP"
    """
    # TODO: Implement this function
    pass

def matrix_multiply(M, v, mod=26):
    """
    Multiplies a matrix M by a vector v, modulo `mod`.
    """
    # TODO: Implement this function
    pass

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
    """
    # TODO: Implement this function
    pass

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
    print("Project Citadel Cipher Module")
    # You can start writing test code here
    test_vector = [7, 4]
    sbox_result = apply_sbox(test_vector, example_sbox)
    print(f"S-Box applied to {test_vector}: {sbox_result}")