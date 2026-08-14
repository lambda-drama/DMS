"""Re-import Dealer Management / DMS CRM workspaces after they were deleted from the app.

Desktop Icon in the DMS folder routes through Workspace Sidebar Home → Workspace.
If Workspace \"Dealer Management\" is missing, Desk shows:
\"Icon is not correctly configured please check the workspace sidebar to it\"
and navigating to /app/dealer-management shows
\"Workspace dealer-management does not exist\".
"""

from dms.patches.fix_dms_desktop_icons import execute as fix_icons


def execute():
	fix_icons()
