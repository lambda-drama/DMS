# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

# import frappe

import frappe
from frappe.model.document import Document
from frappe.utils import date_diff, today, nowdate, getdate
from frappe import _

class Technician(Document):
	
	def validate(self):
		"""Validate before saving"""
		self.calculate_experience()
		self.validate_certifications()
		self.validate_custom_lunch()
		self.update_performance_metrics()
		self.full_name = self.get_full_name()

	def validate_custom_lunch(self):
		start, end = self.custom_lunch_start, self.custom_lunch_end
		if start and not end:
			frappe.throw(_("Set Custom Lunch To when Custom Lunch From is set."))
		if end and not start:
			frappe.throw(_("Set Custom Lunch From when Custom Lunch To is set."))
		if start and end:
			from frappe.utils import get_time

			s, e = get_time(start), get_time(end)
			if s and e and (e.hour, e.minute, e.second) <= (s.hour, s.minute, s.second):
				frappe.throw(_("Custom lunch end must be after custom lunch start."))
		# self.full_name()
	
	def on_update(self):
		"""When technician record is updated"""
		self.update_related_user_permissions()
	
	# ========== CORE CALCULATIONS ==========
	
	def calculate_experience(self):
		"""Auto-calculate years of experience based on joining date"""
		if self.date_of_joining:
			days = date_diff(today(), self.date_of_joining)
			self.experience_at_suweys = round(days / 365, 1)
	
	def validate_certifications(self):
		"""Check for expiring certifications and set warnings"""
		if self.certifications:
			today_date = getdate(today())
			for cert in self.certifications:
				if cert.expiry_date:
					days_left = date_diff(cert.expiry_date, today_date)
					if days_left <= 30 and days_left > 0:
						cert.is_expiring_soon = 1
					else:
						cert.is_expiring_soon = 0
						
	# def full_name(self):

	# 	"""Set full name before save"""
	# 	if self.first_name and self.last_name:
	# 		self.full_name = f"{self.first_name} {self.last_name}"
	# 	elif self.first_name:
	# 		self.full_name = self.first_name
	
	def update_performance_metrics(self):
		"""Auto-calculate performance metrics from job cards"""
		if self.is_new():
			return
		
		# Get all completed job cards for this technician
		job_cards = frappe.get_all(
			"DMS Job Card",
			filters={
				"technician": self.name,
				"docstatus": 1,
				"status": "Completed"
			},
			fields=["name", "total_labor_hours", "total_hours", "creation", "customer_satisfaction"]
		)
		
		if job_cards:
			# Total jobs completed
			self.total_jobs_completed = len(job_cards)
			
			# Total labor hours
			self.total_labor_hours = sum([jc.get("total_labor_hours", 0) or 0 for jc in job_cards])
			
			# Total sold hours
			self.total_sold_hours = sum([jc.get("total_hours", 0) or 0 for jc in job_cards])
			
			# Calculate efficiency (sold hours / labor hours)
			if self.total_labor_hours > 0:
				self.efficiency_rating = (self.total_sold_hours / self.total_labor_hours) * 100
			
			# Calculate productivity score
			# Productivity = (Total sold hours / (Working days * 8 hours)) * 100
			working_days = len(set([getdate(jc.creation) for jc in job_cards]))
			if working_days > 0:
				expected_hours = working_days * 8
				self.productivity_score = round((self.total_sold_hours / expected_hours) * 100, 1)
			
			# Calculate first time fix rate
			repeat_jobs = frappe.db.count("DMS Job Card", {
				"technician": self.name,
				"is_repeat_repair": 1,
				"docstatus": 1
			})
			if self.total_jobs_completed > 0:
				self.first_time_fix_rate = ((self.total_jobs_completed - repeat_jobs) / self.total_jobs_completed) * 100
			
			# Calculate average customer satisfaction
			satisfactions = [jc.get("customer_satisfaction", 0) for jc in job_cards if jc.get("customer_satisfaction")]
			if satisfactions:
				self.customer_satisfaction_score = round(sum(satisfactions) / len(satisfactions), 1)
		
		# Update timestamp
		self.last_performance_update = nowdate()
	
	def update_related_user_permissions(self):
		"""Update linked user permissions based on technician status"""
		if self.user_link and self.status == "Inactive":
			# Deactivate the linked user if technician is inactive
			frappe.db.set_value("User", self.user_link, "enabled", 0)
		elif self.user_link and self.status == "Active":
			frappe.db.set_value("User", self.user_link, "enabled", 1)
	
	# ========== ATTENDANCE METHODS ==========
	
	def clock_in(self):
		"""Record technician clock in time"""
		self.attendance_today = "Present"
		self.clock_in_time = nowdate().split(" ")[1] if " " in nowdate() else nowdate()
		self.save()
		frappe.msgprint(_("{0} has clocked in at {1}").format(self.full_name, self.clock_in_time))
	
	def clock_out(self):
		"""Record technician clock out time"""
		self.clock_out_time = nowdate().split(" ")[1] if " " in nowdate() else nowdate()
		self.save()
		
		# Calculate hours worked
		if self.clock_in_time:
			in_time = self.clock_in_time
			out_time = self.clock_out_time
			# Simple calculation - in production use proper time diff
			frappe.msgprint(_("{0} has clocked out at {1}").format(self.full_name, self.clock_out_time))
	
	def mark_leave(self, leave_date, leave_type="Sick"):
		"""Mark technician on leave"""
		self.attendance_today = "On Leave"
		self.save()
	
	# ========== ASSIGNMENT METHODS ==========
	
	def assign_to_bay(self, bay_name, job_card_name):
		"""Assign technician to a service bay"""
		self.current_assigned_bay = bay_name
		self.current_job_card = job_card_name
		self.save()
	
	def release_from_bay(self):
		"""Release technician from current bay"""
		self.current_assigned_bay = None
		self.current_job_card = None
		self.save()
	
	# ========== QUERY METHODS ==========
	
	def get_todays_jobs(self):
		"""Get all jobs assigned to technician today"""
		today_date = getdate(today())
		return frappe.get_all(
			"DMS Job Card",
			filters={
				"technician": self.name,
				"date": today_date,
				"docstatus": ["!=", 2]
			},
			fields=["name", "status", "vehicle_vin", "customer", "priority"]
		)
	
	def get_current_workload(self):
		"""Get current workload (active jobs)"""
		return frappe.db.count("DMS Job Card", {
			"technician": self.name,
			"status": ["in", ["Open", "Work in Progress", "In Progress"]],
			"docstatus": 1
		})
	
	def get_available_hours_today(self):
		"""Get available working hours for today"""
		if self.attendance_today == "Present" and self.clock_in_time:
			return 8  # Simplified - calculate actual remaining hours
		return 0
	
	# ========== HELPER METHODS ==========
	
	def get_full_name(self):
		"""Return full name"""
		return f"{self.first_name} {self.last_name}" if self.last_name else self.first_name
	
	def is_available_now(self):
		"""Check if technician is currently available"""
		return (
			self.status == "Active" and 
			self.attendance_today == "Present" and 
			self.current_job_card is None and
			self.get_current_workload() < 3  # Max 3 concurrent jobs
		)
	
	def get_certifications_summary(self):
		"""Get summary of active certifications"""
		active_certs = [cert for cert in self.certifications if cert.is_active]
		return {
			"total": len(active_certs),
			"expiring_soon": len([cert for cert in active_certs if cert.is_expiring_soon])
		}