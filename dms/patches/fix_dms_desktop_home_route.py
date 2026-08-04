"""Re-run desktop icon / sidebar home routing fix after workspace restore."""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
