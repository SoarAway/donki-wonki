import cv2
import numpy as np
import os

def test_preprocess(image_path):
    # 1. Load the original image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not find image at {image_path}")
        return

    # 2. Apply the white-text filter logic from xhsScrape.py
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Range for "White": 
    # [0, 0, 200] to [180, 50, 255]
    # Value (200) determines how 'bright' the white must be.
    # Saturation (50) determines how 'colorless' it must be.
    lower_white = np.array([0, 0, 200]) 
    upper_white = np.array([180, 50, 255])
    
    mask = cv2.inRange(hsv, lower_white, upper_white)
    processed = cv2.bitwise_not(mask) # Invert to Black text on White background

    # 3. Create a side-by-side comparison
    # Convert processed (grayscale) back to BGR so we can stack it with the original
    processed_bgr = cv2.cvtColor(processed, cv2.COLOR_GRAY2BGR)
    comparison = np.hstack((img, processed_bgr))

    # 4. Save the result (Replacing cv2.imshow to avoid GUI errors)
    output_filename = "preprocess_comparison.png"
    cv2.imwrite(output_filename, comparison)
    print(f"Comparison saved as '{output_filename}'.")
    print("Please open this file in your image viewer to see the results.")

if __name__ == "__main__":
    # Point this to one of your existing images in the scraped_posts folder
    test_folder = 'scraped_posts'
    if os.path.exists(test_folder):
        files = [f for f in os.listdir(test_folder) if f.endswith('.png')]
        if files:
            # Sort files to get the most recent one
            files.sort()
            sample_image = os.path.join(test_folder, files[0])
            print(f"Testing with: {sample_image}")
            test_preprocess(sample_image)
        else:
            print(f"No .png files found in {test_folder}")
    else:
        print(f"Folder {test_folder} does not exist. Run the main scraper first.")