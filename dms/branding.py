"""Shared Suweys Motors branding assets."""

SUWEYS_LOGO_URL = "/assets/dms/image/suwey_logo.png"
LEGACY_LOGO_URL = "/assets/dms/image/logo_t.jpg"
APP_SHORT_NAME = "Suweys Motors"
APP_PRODUCT_NAME = "DMS"

LOGO_REPLACEMENTS = (
	("/assets/dms/image/logo_t.jpg", SUWEYS_LOGO_URL),
	("assets/dms/image/logo_t.jpg", SUWEYS_LOGO_URL.lstrip("/")),
	("logo_t.jpg", "suwey_logo.png"),
	("logo_t.JPG", "suwey_logo.png"),
)
