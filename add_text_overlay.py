#!/usr/bin/env python3
"""
Video Text Overlay Script
Adds styled text overlay to video files using FFmpeg and Pillow.
Supports customizable fonts, colors, background, and positioning.
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ============================================================================
# CONFIGURATION - EDIT THESE VARIABLES
# ============================================================================

INPUT_VIDEO = "/Users/rashenka/Downloads/ce5aaf4a8f19e8a32da97e4807dbe3c8.mp4"  # Укажи полный путь к видео
OUTPUT_VIDEO = "/Users/rashenka/Downloads/output.mp4"                # Выходной видеофайл
TEXT_CONTENT = """Никогда не берите 
кредит, если 
не ответили на 
эти 3 вопроса:"""              # Text to overlay (supports multi-line)

# Font settings
FONT_NAME = "Giga Sans"             # Primary font (will fallback if not found)
FALLBACK_FONT = "Arial"             # Fallback font if primary not available
FONT_SIZE_RELATIVE = 13             # Font size relative to video height (base: 1080p)

# Text style
TEXT_COLOR = (255, 255, 255)        # White (RGB)
TEXT_OPACITY = 1.0                  # 100% opacity

# Layout
HORIZONTAL_CENTER = True            # Center horizontally
VERTICAL_POSITION_PERCENT = 0.60    # Position from top (0.0-1.0, where 0.60 = 60% from top)
SCALE_FACTOR = 0.63                 # 63% of original size

# Background settings
BACKGROUND_ENABLED = True           # Enable background behind text
BACKGROUND_COLOR = (255, 255, 255)  # White (RGB)
BACKGROUND_OPACITY = 1.0            # 100% opacity (1.0 = fully opaque)
CORNER_ROUNDING = 0.5               # 50% = fully rounded pill shape (0-1 scale)
HEIGHT_PADDING = 0.30               # 30% height padding around text
WIDTH_PADDING = 0.30                # 30% width padding around text

# ============================================================================
# END CONFIGURATION
# ============================================================================

def find_system_font(preferred_name, fallback_name):
    """
    Find an available font on the system.
    Searches common font directories and falls back to default if needed.
    """

    # Common font paths on different operating systems
    search_paths = []

    # macOS paths
    search_paths.extend([
        f"/System/Library/Fonts/{preferred_name}.ttf",
        f"/Library/Fonts/{preferred_name}.ttf",
    ])

    # Windows paths
    search_paths.extend([
        f"C:\\Windows\\Fonts\\{preferred_name}.ttf",
    ])

    # Linux paths
    search_paths.extend([
        f"/usr/share/fonts/truetype/{preferred_name}.ttf",
        f"/usr/share/fonts/opentype/{preferred_name}.ttf",
    ])

    # Try preferred font
    for path in search_paths:
        if os.path.exists(path):
            print(f"✓ Found font: {preferred_name}")
            return path

    # Try fallback font
    print(f"⚠ Font '{preferred_name}' not found. Searching for fallback '{fallback_name}'...")

    for path in search_paths:
        fallback_path = path.replace(preferred_name, fallback_name)
        if os.path.exists(fallback_path):
            print(f"✓ Found fallback font: {fallback_name}")
            return fallback_path

    # Last resort: use system default (Pillow will handle this)
    print(f"⚠ No font file found. Using system default.")
    return fallback_name

def create_text_overlay_frame(video_width, video_height, font_path):
    """
    Create an overlay image with styled text and rounded background.
    Returns a PIL Image object.
    """

    # Calculate font size proportionally to video height
    # Base assumption: 1080p height = font size 130 (13 * 10)
    font_size = int((video_height / 1080) * FONT_SIZE_RELATIVE * 10)

    # Calculate vertical position proportionally
    # Adjust Y position based on actual video dimensions
    vertical_pos = int(video_height * VERTICAL_POSITION_PERCENT)

    print(f"Video dimensions: {video_width}x{video_height}")
    print(f"Calculated font size: {font_size}px")
    print(f"Calculated vertical position: {vertical_pos}px ({VERTICAL_POSITION_PERCENT*100:.0f}% from top)")

    # Create transparent image for overlay
    overlay = Image.new('RGBA', (video_width, video_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Load font
    try:
        font = ImageFont.truetype(font_path, font_size)
        print(f"✓ Font loaded: {font_path}")
    except (IOError, OSError) as e:
        print(f"⚠ Warning: Could not load font from {font_path}. Using default.")
        print(f"  Error: {e}")
        font = ImageFont.load_default()

    # Calculate text bounding box to get actual dimensions
    # Using temporary draw to measure text
    temp_bbox = draw.multiline_textbbox((0, 0), TEXT_CONTENT, font=font, align='center')
    text_width = temp_bbox[2] - temp_bbox[0]
    text_height = temp_bbox[3] - temp_bbox[1]

    # Apply scale factor
    text_width = int(text_width * SCALE_FACTOR)
    text_height = int(text_height * SCALE_FACTOR)

    # Calculate positions
    if HORIZONTAL_CENTER:
        text_x = (video_width - text_width) // 2
    else:
        text_x = 50

    text_y = vertical_pos

    # Draw background if enabled
    if BACKGROUND_ENABLED:
        # Calculate background size with padding
        bg_padding_width = int(text_width * WIDTH_PADDING)
        bg_padding_height = int(text_height * HEIGHT_PADDING)

        bg_left = text_x - bg_padding_width
        bg_top = text_y - bg_padding_height
        bg_right = text_x + text_width + bg_padding_width
        bg_bottom = text_y + text_height + bg_padding_height

        # Calculate corner radius for rounded rectangle
        bg_width = bg_right - bg_left
        bg_height = bg_bottom - bg_top
        corner_radius = int(min(bg_width, bg_height) * CORNER_ROUNDING / 2)

        # Convert background color to RGBA
        bg_alpha = int(255 * BACKGROUND_OPACITY)
        bg_color = (*BACKGROUND_COLOR, bg_alpha)

        # Draw rounded rectangle background
        draw.rounded_rectangle(
            [bg_left, bg_top, bg_right, bg_bottom],
            radius=corner_radius,
            fill=bg_color
        )

        print(f"Background: {bg_width}x{bg_height}px, corner_radius={corner_radius}px")

    # Scale font for text rendering
    scaled_font_size = int(font_size * SCALE_FACTOR)
    try:
        scaled_font = ImageFont.truetype(font_path, scaled_font_size)
    except (IOError, OSError):
        scaled_font = font

    # Draw text on top of background
    text_alpha = int(255 * TEXT_OPACITY)
    text_color = (*TEXT_COLOR, text_alpha)

    print(f"\nText rendering details:")
    print(f"  Position: ({text_x}, {text_y})")
    print(f"  Size: {text_width}x{text_height}px")
    print(f"  Font size (scaled): {scaled_font_size}px")
    print(f"  Color: RGB{TEXT_COLOR} with alpha={text_alpha}")
    print(f"  Text: {repr(TEXT_CONTENT[:50])}...")

    draw.multiline_text(
        (text_x, text_y),
        TEXT_CONTENT,
        font=scaled_font,
        fill=text_color,
        align='center',
        spacing=4
    )

    print(f"✓ Text overlay created: {text_width}x{text_height}px at ({text_x}, {text_y})")

    return overlay

def add_overlay_to_video(input_path, output_path, overlay_image):
    """
    Use FFmpeg to overlay the PIL image on every frame of the video.
    """

    # Create temporary directory for overlay PNG
    with tempfile.TemporaryDirectory() as tmpdir:
        overlay_png = os.path.join(tmpdir, "overlay.png")

        # Save overlay image as PNG with alpha channel
        overlay_image.save(overlay_png, 'PNG')
        print(f"Saved overlay image: {overlay_png}")

        # FFmpeg command to overlay the image on video
        cmd = [
            'ffmpeg',
            '-i', input_path,                    # Input video
            '-i', overlay_png,                   # Overlay image
            '-filter_complex', '[0:v][1:v]overlay=0:0[v]',  # Overlay on top
            '-map', '[v]',                       # Use overlaid video
            '-map', '0:a?',                      # Keep original audio (optional, handles videos without audio)
            '-c:v', 'libx264',                   # Video codec
            '-c:a', 'aac',                       # Audio codec
            '-y',                                # Overwrite output
            output_path
        ]

        print(f"\nRunning FFmpeg command...")
        print(f"Command: {' '.join(cmd)}\n")

        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"✓ FFmpeg completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ FFmpeg error: {e.stderr}")
            return False

def get_video_dimensions(video_path):
    """
    Get video dimensions using FFprobe.
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height',
            '-of', 'csv=p=0',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        width, height = map(int, result.stdout.strip().split(','))
        return width, height
    except (subprocess.CalledProcessError, ValueError) as e:
        print(f"✗ Error getting video dimensions: {e}")
        return None, None

def main():
    """
    Main function: load video, create overlay, apply to video.
    """

    print("=" * 70)
    print("VIDEO TEXT OVERLAY TOOL")
    print("=" * 70)

    # Check if input file exists
    if not os.path.exists(INPUT_VIDEO):
        print(f"✗ Error: Input file not found: {INPUT_VIDEO}")
        sys.exit(1)

    print(f"\nInput video: {INPUT_VIDEO}")
    print(f"Output video: {OUTPUT_VIDEO}")
    print(f"Text: {TEXT_CONTENT[:50]}...")

    # Get video dimensions
    print(f"\nAnalyzing video...")
    width, height = get_video_dimensions(INPUT_VIDEO)
    if width is None or height is None:
        print("✗ Failed to get video dimensions. Make sure ffprobe is installed.")
        sys.exit(1)

    print(f"Video dimensions: {width}x{height}")

    # Find font
    print(f"\nLooking for font: {FONT_NAME}")
    font_path = find_system_font(FONT_NAME, FALLBACK_FONT)

    # Create overlay
    print(f"\nCreating text overlay...")
    overlay = create_text_overlay_frame(width, height, font_path)

    # Apply overlay to video
    print(f"\nApplying overlay to video...")
    success = add_overlay_to_video(INPUT_VIDEO, OUTPUT_VIDEO, overlay)

    if success:
        print(f"\n✓ Success! Output saved to: {OUTPUT_VIDEO}")
        print("=" * 70)
    else:
        print(f"\n✗ Failed to create output video.")
        sys.exit(1)

if __name__ == "__main__":
    main()
