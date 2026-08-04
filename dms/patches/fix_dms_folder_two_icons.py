"""Ensure DMS folder popup shows Dealer Management + DMS CRM."""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
