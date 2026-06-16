app_name = "dms"
app_title = "Dealer Management System"
app_publisher = "Mania"
app_description = "Aftersales Service, Vehicle Inspection, Job Card, Quality Control, Warranty, Parts & Customer Management"
app_email = "maniajrmania@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
add_to_apps_screen = [
	{
		"name": "dms",
		"logo": "/assets/dms/image/logo_t.jpg",
		"title": "DMS",
		"route": "/dms",
	}
]

website_route_rules = [
	{"from_route": "/dms", "to_route": "dms_frontend"},
	{"from_route": "/dms/<path:app_path>", "to_route": "dms_frontend"},
]

fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    #Service item
                    "Vehicle Service Item-custom_item_name",
                    "Vehicle Service Item-custom_erpnext_item",
                    
                    "Vehicle Service Item-custom_estimated_timemin",
                    "Vehicle Service Item-custom_rate",
                    "Vehicle Service Item-custom_section_break_bk5jc",
                    "Vehicle Service Item-custom_description",
                    "Vehicle Service Item-custom_section_break_j9tgd",
                    "Item Group-custom_is_vehicle",
                    "Customer Group-custom_is_vehicle_customer",
                    "Warehouse-custom_is_dms_warehouse",
                    "Sales Invoice-custom_dms_job_card",
                    "Sales Invoice Item-custom_dms_discount",
                     "Vehicle Service Item-custom_sub_code",
                    "Vehicle Service Item-custom_cat_code",
                    "Vehicle Service Item-custom_frt",
                    "Vehicle Service Item-custom_category",
                    "Vehicle Service Item-custom_column_break_cgzhn",
                    "Vehicle Service Item-custom_vehicle_model",
                    "Item Group-custom_auto_generate_spare_parts",
                    "Purchase Receipt-custom_sparepart_receipt",
                    "Supplier-custom_spare_parts_supplier_",
                    "Stock Reconciliation-custom_sparepart_stock",
                    "Stock Entry-custom_sparepart_stock",
                    
                ]
            ]
        ]
    },

    {
        "doctype": "Role",
        "filters": [
            ["name", "in", ["Dealer Manager", "Spare Parts Manager"]]
        ]
    },

    {
        "doctype": "Vehicle Service Type"
    },

    {
        "doctype": "QC Checklist Template"
    },

    {
        "doctype": "QC Checklist Item Master"
    },
    {
        "doctype": "Road Test Template"
    },
    {
        "doctype": "Delivery Checklist Template"
    },
    {
        "doctype": "Bay Type"
    },
    {
        "doctype":"Working Time"
    },
    {
       "doctype": "Delivery Checklist Template"
    }
]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/dms/css/dms.css"
# app_include_js = "/assets/dms/js/dms.js"

# include js, css files in header of web template
# web_include_css = "/assets/dms/css/dms.css"
# web_include_js = "/assets/dms/js/dms.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "dms/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Item Group": "public/js/item_group.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "dms/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "dms.utils.jinja_methods",
# 	"filters": "dms.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "dms.install.before_install"
# after_install = "dms.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "dms.uninstall.before_uninstall"
# after_uninstall = "dms.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "dms.utils.before_app_install"
# after_app_install = "dms.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "dms.utils.before_app_uninstall"
# after_app_uninstall = "dms.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "dms.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Item": {
		"after_insert": "dms.utils.spare_part_auto_create.auto_create_spare_part_on_item_insert",
		"on_update": "dms.utils.spare_part_auto_create.auto_create_spare_part_on_item_update",
	},
	"Vehicle Service Item": {
		"validate": "dms.overrides.vehicle_service_item.validate_vehicle_service_item",
	},
	"Serial No": {
		"after_insert": "dms.dealer_management_system.doctype.dms_settings.dms_settings.auto_create_vin_on_serial_insert",
		"on_update": "dms.utils.serial_vin_sync.sync_vin_on_serial_update",
	},
	# Inward bundle: auto VIN (purchase). Outward sales: SLE hook (serial updated via SQL, not on_update).
	"Serial and Batch Bundle": {
		"on_submit": [
			"dms.dealer_management_system.doctype.dms_settings.dms_settings.auto_create_vin_on_bundle_submit",
			"dms.utils.serial_vin_sync.sync_vin_on_outward_bundle_submit",
		],
	},
	"Stock Ledger Entry": {
		"after_insert": "dms.utils.serial_vin_sync.sync_vin_on_stock_ledger_entry",
	},
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"dms.tasks.all"
# 	],
# 	"daily": [
# 		"dms.tasks.daily"
# 	],
# 	"hourly": [
# 		"dms.tasks.hourly"
# 	],
# 	"weekly": [
# 		"dms.tasks.weekly"
# 	],
# 	"monthly": [
# 		"dms.tasks.monthly"
# 	],
# }

scheduler_events = {
	"daily": [
		"dms.tasks.daily",
	],
}

# Testing
# -------

# before_tests = "dms.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "dms.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "dms.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "dms.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["dms.utils.before_request"]
# after_request = ["dms.utils.after_request"]

# Job Events
# ----------
# before_job = ["dms.utils.before_job"]
# after_job = ["dms.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"dms.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

