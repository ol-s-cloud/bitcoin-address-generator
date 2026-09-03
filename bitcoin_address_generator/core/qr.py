"""QR-code helper for public Bitcoin addresses and other text values."""

from pathlib import Path
from typing import Optional, Union

import qrcode


def generate_qr_code(
    value: str,
    output_path: Optional[Union[str, Path]] = None,
):
    """Create a QR image and optionally save it to a local file.

    The caller is responsible for deciding what to encode. Private keys, WIFs,
    seed phrases and other secret material should not be placed in shareable QR
    codes.
    """
    if not isinstance(value, str) or not value.strip():
        raise ValueError("QR code content must be a non-empty string")

    image = qrcode.make(value)
    if output_path is not None:
        image.save(Path(output_path))
    return image
