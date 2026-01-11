from PIL import Image
import sys

def remove_white_background(input_path, output_path, tolerance=30):
    """Remove white background from image and save as PNG with transparency"""
    # Open the image
    img = Image.open(input_path)

    # Convert to RGBA if not already
    img = img.convert("RGBA")

    # Get pixel data
    pixdata = img.load()

    # Get dimensions
    width, height = img.size

    # Remove white background
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixdata[x, y]

            # If pixel is close to white, make it transparent
            if r > 255 - tolerance and g > 255 - tolerance and b > 255 - tolerance:
                pixdata[x, y] = (255, 255, 255, 0)

    # Save as PNG with transparency
    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    # Process favicon logo
    remove_white_background(
        "logo - favicon.jpg",
        "frontend/public/logo-favicon.png",
        tolerance=30
    )

    # Process horizontal logo
    remove_white_background(
        "logo horizontal.jpg",
        "frontend/public/logo-horizontal.png",
        tolerance=30
    )

    print("Background removal complete!")
