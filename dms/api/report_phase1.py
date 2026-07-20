# Copyright (c) 2026, Mania and contributors
"""Deprecated shim — use dms.api.reports.<section> modules."""

from dms.api.reports.compliance import get_user_audit_trail_report  # noqa: F401
from dms.api.reports.crm import get_customer_follow_up_report  # noqa: F401
from dms.api.reports.executive import get_aftersales_dashboard_report  # noqa: F401
from dms.api.reports.finance import (  # noqa: F401
	get_invoice_register_report,
	get_unbilled_job_cards_report,
)
from dms.api.reports.parts import (  # noqa: F401
	get_material_request_status_report,
	get_parts_issued_per_job_report,
)
from dms.api.reports.advisor import get_service_advisor_performance_report  # noqa: F401
from dms.api.reports.workshop import (  # noqa: F401
	get_job_card_status_report,
	get_vehicle_turnaround_report,
)
