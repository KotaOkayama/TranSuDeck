import re
from datetime import datetime
from typing import Dict, List


def parse_markdown_to_slides(markdown_text: str) -> List[Dict[str, str]]:
    """
    Parse markdown text into individual slides
    Splits on horizontal rules (---)
    """
    # Split by horizontal rules
    slide_contents = re.split(r"\n---+\n", markdown_text)

    slides = []
    for i, content in enumerate(slide_contents):
        content = content.strip()
        if not content:
            continue

        # Extract title from first heading
        title_match = re.search(r"^##\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1) if title_match else f"Slide {i + 1}"

        slides.append(
            {"id": f"slide-{i}", "content": content, "title": title, "order": i}
        )

    return slides


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to remove invalid characters
    """
    # Remove invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', "", filename)

    # Replace spaces with underscores
    filename = filename.replace(" ", "_")

    # Limit length
    if len(filename) > 200:
        filename = filename[:200]

    return filename


def format_timestamp(dt: datetime = None) -> str:
    """
    Format datetime as string for filenames
    """
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y%m%d_%H%M%S")


def extract_text_from_markdown(markdown_text: str) -> str:
    """
    Extract plain text from markdown, removing formatting
    """
    # Remove headers
    text = re.sub(r"^#+\s+", "", markdown_text, flags=re.MULTILINE)

    # Remove bold/italic
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)

    # Remove links
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)

    # Remove bullet points
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)

    # Remove numbered lists
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)

    return text.strip()
