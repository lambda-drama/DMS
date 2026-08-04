"""Restore deleted Dealer Management / DMS CRM workspaces and rewire desktop icons."""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
