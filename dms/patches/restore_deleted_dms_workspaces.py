"""Restore Dealer Management / DMS CRM workspaces after fixture files were deleted.

Without these Workspace docs, Desktop Icon clicks fail with:
"Icon is not correctly configured please check the workspace sidebar to it"
because get_route() cannot resolve the sidebar's Home → Workspace link.
"""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
