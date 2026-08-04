"""Re-run desktop icon fix after workspace fixtures were deleted again."""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
