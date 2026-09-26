(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8532],
	{
		15181: (e, r, t) => {
			"use strict";
			function s(e) {
				window.scrollTo(0, 0),
					(document.documentElement.scrollTop = 0),
					(document.body.scrollTop = 0),
					e?.scrollTo(0, 0),
					document.body.style.removeProperty("overflow"),
					document.body.style.removeProperty("padding-right"),
					document.body.style.removeProperty("margin-right"),
					document.body.removeAttribute("data-scroll-locked");
			}
			t.d(r, { i: () => s });
		},
		37184: (e, r, t) => {
			Promise.resolve().then(t.bind(t, 98872));
		},
		55833: (e, r, t) => {
			"use strict";
			t.d(r, { NavigationProvider: () => m, c: () => d, g: () => o });
			var s = t(95155),
				a = t(12115),
				c = t(15181);
			let i = [
					"dashboard",
					"appointments",
					"appointment-detail",
					"appointment-new",
					"inspections",
					"inspection-detail",
					"inspection-new",
					"service-estimates",
					"estimate-detail",
					"job-cards",
					"job-card-detail",
					"job-card-new",
					"parts-requisitions",
					"parts-requisition-detail",
					"deliveries",
					"delivery-new",
					"invoices",
					"invoice-new",
					"orders",
					"order-new",
					"payment-entries",
					"reconciliation-hub",
					"follow-ups",
					"follow-up-new",
					"technicians",
					"technician-detail",
					"service-advisors",
					"parts-advisors",
					"spare-parts",
					"vehicle-services",
					"vehicle-models",
					"service-packages",
					"item-prices",
					"job-card-terms",
					"sales-invoice-tc",
					"user-permissions",
					"advanced-permissions",
					"customers",
					"vehicles",
					"vehicle-new",
					"reports",
					"stock-entry",
					"stock-reconciliation",
					"material-request",
					"pending-material-requests",
					"purchase-receipt",
					"spare-part-sales",
					"proforma-invoices",
					"proforma-invoice-new",
					"inventory-dashboard",
					"settings",
					"crm-dashboard",
					"crm-leads",
					"crm-lead-new",
					"crm-lead-detail",
					"crm-opportunities",
					"crm-opportunity-new",
					"crm-opportunity-detail",
					"crm-sales-appointments",
					"crm-sales-appointment-new",
					"crm-sales-appointment-detail",
					"crm-contacts",
					"crm-customers",
					"crm-customer-new",
					"crm-customer-detail",
					"crm-vehicles",
					"crm-vehicle-detail",
					"crm-activities",
					"crm-activity-new",
					"crm-activity-detail",
					"crm-approvals",
					"crm-call-logs",
					"crm-call-log-new",
					"crm-call-log-detail",
					"crm-call-center",
					"crm-test-drives",
					"crm-test-drive-detail",
					"crm-delivery-readiness",
					"crm-delivery-readiness-detail",
					"crm-bookings",
					"crm-quotations",
					"crm-quotation-detail",
					"crm-accounts",
					"crm-account-new",
					"crm-account-detail",
					"crm-tenders",
					"crm-tender-new",
					"crm-tender-detail",
					"crm-fleet-aftersales",
					"crm-service-retention",
					"crm-calendar",
					"crm-cases",
					"crm-case-new",
					"crm-case-detail",
					"crm-campaigns",
					"crm-campaign-new",
					"crm-campaign-detail",
					"crm-segment-new",
					"crm-segment-detail",
					"crm-loyalty",
					"crm-referrals",
					"crm-referral-detail",
					"crm-reports",
					"crm-staff-audit",
				],
				n = {
					dashboard: "dashboard",
					appointments: "appointments",
					"appointment-detail": "appointments",
					"appointment-new": "appointments",
					inspections: "inspections",
					"inspection-detail": "inspections",
					"inspection-new": "inspections",
					"service-estimates": "service-estimates",
					"estimate-detail": "service-estimates",
					"job-cards": "job-cards",
					"job-card-detail": "job-cards",
					"job-card-new": "job-cards",
					"parts-requisitions": "parts-requisitions",
					"parts-requisition-detail": "parts-requisitions",
					deliveries: "deliveries",
					"delivery-new": "deliveries",
					invoices: "invoices",
					"invoice-new": "invoices",
					orders: "orders",
					"order-new": "orders",
					"payment-entries": "payment-entries",
					"reconciliation-hub": "reconciliation-hub",
					"follow-ups": "follow-ups",
					"follow-up-new": "follow-ups",
					technicians: "technicians",
					"technician-detail": "technicians",
					"service-advisors": "service-advisors",
					"parts-advisors": "parts-advisors",
					"spare-parts": "spare-parts",
					"vehicle-services": "vehicle-services",
					"vehicle-models": "vehicle-models",
					"service-packages": "service-packages",
					"item-prices": "item-prices",
					"job-card-terms": "job-card-terms",
					"sales-invoice-tc": "sales-invoice-tc",
					"user-permissions": "user-permissions",
					"advanced-permissions": "advanced-permissions",
					customers: "customers",
					vehicles: "vehicles",
					"vehicle-new": "vehicles",
					reports: "reports",
					"stock-entry": "stock-entry",
					"stock-reconciliation": "stock-reconciliation",
					"material-request": "material-request",
					"pending-material-requests": "pending-material-requests",
					"purchase-receipt": "purchase-receipt",
					"spare-part-sales": "spare-part-sales",
					"proforma-invoices": "proforma-invoices",
					"proforma-invoice-new": "proforma-invoices",
					"inventory-dashboard": "inventory-dashboard",
					settings: "settings",
					"crm-dashboard": "crm-dashboard",
					"crm-leads": "crm-leads",
					"crm-lead-new": "crm-leads",
					"crm-lead-detail": "crm-leads",
					"crm-opportunities": "crm-opportunities",
					"crm-opportunity-new": "crm-opportunities",
					"crm-opportunity-detail": "crm-opportunities",
					"crm-sales-appointments": "crm-sales-appointments",
					"crm-sales-appointment-new": "crm-sales-appointments",
					"crm-sales-appointment-detail": "crm-sales-appointments",
					"crm-contacts": "crm-contacts",
					"crm-customers": "crm-customers",
					"crm-customer-new": "crm-customers",
					"crm-customer-detail": "crm-customers",
					"crm-vehicles": "crm-vehicles",
					"crm-vehicle-detail": "crm-vehicles",
					"crm-activities": "crm-activities",
					"crm-activity-new": "crm-activities",
					"crm-activity-detail": "crm-activities",
					"crm-approvals": "crm-approvals",
					"crm-call-logs": "crm-call-logs",
					"crm-call-log-new": "crm-call-logs",
					"crm-call-log-detail": "crm-call-logs",
					"crm-call-center": "crm-call-center",
					"crm-test-drives": "crm-test-drives",
					"crm-test-drive-detail": "crm-test-drives",
					"crm-delivery-readiness": "crm-delivery-readiness",
					"crm-delivery-readiness-detail": "crm-delivery-readiness",
					"crm-bookings": "crm-bookings",
					"crm-quotations": "crm-quotations",
					"crm-quotation-detail": "crm-quotations",
					"crm-accounts": "crm-accounts",
					"crm-account-new": "crm-accounts",
					"crm-account-detail": "crm-accounts",
					"crm-tenders": "crm-tenders",
					"crm-tender-new": "crm-tenders",
					"crm-tender-detail": "crm-tenders",
					"crm-fleet-aftersales": "crm-fleet-aftersales",
					"crm-service-retention": "crm-service-retention",
					"crm-calendar": "crm-calendar",
					"crm-cases": "crm-cases",
					"crm-case-new": "crm-cases",
					"crm-case-detail": "crm-cases",
					"crm-campaigns": "crm-campaigns",
					"crm-campaign-new": "crm-campaigns",
					"crm-campaign-detail": "crm-campaigns",
					"crm-segment-new": "crm-campaigns",
					"crm-segment-detail": "crm-campaigns",
					"crm-loyalty": "crm-loyalty",
					"crm-referrals": "crm-referrals",
					"crm-referral-detail": "crm-referrals",
					"crm-reports": "crm-reports",
					"crm-staff-audit": "crm-staff-audit",
				};
			function o(e) {
				return e.startsWith("crm-");
			}
			let l = (0, a.createContext)({
				activeView: "dashboard",
				viewParams: new URLSearchParams(),
				navigate: () => {},
				viewGroup: "dashboard",
			});
			function m({ children: e }) {
				let [r, t] = (0, a.useState)("dashboard"),
					[o, d] = (0, a.useState)(new URLSearchParams()),
					p = (0, a.useCallback)((e, r) => {
						let s = r && Object.keys(r).length > 0 ? r : void 0,
							a = `#${e}`;
						s && (a += `?${new URLSearchParams(s).toString()}`),
							t(e),
							d(new URLSearchParams(s || {})),
							(window.location.hash = a),
							(0, c.i)(),
							requestAnimationFrame(() => (0, c.i)());
					}, []);
				return (
					(0, a.useEffect)(() => {
						let e = () => {
							let e,
								r,
								s,
								a,
								{ view: c, params: n } =
									((s = (
										(r = (e = window.location.hash
											.replace("#", "")
											.trim()).indexOf("?")) >= 0
											? e.slice(0, r)
											: e
									)
										.trim()
										.toLowerCase()),
									(a = r >= 0 ? e.slice(r) : ""),
									{
										view: i.includes(s) ? s : "",
										params: new URLSearchParams(a),
									});
							t(c || "dashboard"), d(n);
						};
						return (
							e(),
							window.addEventListener("hashchange", e),
							() => window.removeEventListener("hashchange", e)
						);
					}, []),
					(0, s.jsx)(l.Provider, {
						value: {
							activeView: r,
							viewParams: o,
							navigate: p,
							viewGroup: n[r] || "dashboard",
						},
						children: e,
					})
				);
			}
			function d() {
				return (0, a.useContext)(l);
			}
		},
		74350: (e, r, t) => {
			"use strict";
			t.d(r, {
				Cf: () => d,
				Es: () => u,
				L3: () => v,
				c7: () => p,
				lG: () => o,
				rr: () => g,
			});
			var s = t(95155);
			t(12115);
			var a = t(29483),
				c = t(33210),
				i = t(91337),
				n = t(10086);
			function o({ ...e }) {
				return (0, s.jsx)(a.bL, { "data-slot": "dialog", ...e });
			}
			function l({ ...e }) {
				return (0, s.jsx)(a.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function m({ className: e, ...r }) {
				return (0, s.jsx)(a.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...r,
				});
			}
			function d({
				className: e,
				children: r,
				showCloseButton: t = !0,
				headerActions: o,
				onPointerDownOutside: p,
				onInteractOutside: u,
				onFocusOutside: v,
				...g
			}) {
				return (0, s.jsxs)(l, {
					"data-slot": "dialog-portal",
					children: [
						(0, s.jsx)(m, {}),
						(0, s.jsxs)(a.UC, {
							"data-slot": "dialog-content",
							className: (0, i.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							onPointerDownOutside: (e) => {
								(0, n.JM)(e.target) ? e.preventDefault() : p?.(e);
							},
							onInteractOutside: (e) => {
								(0, n.JM)(e.target) ? e.preventDefault() : u?.(e);
							},
							onFocusOutside: (e) => {
								(0, n.JM)(e.target) ? e.preventDefault() : v?.(e);
							},
							...g,
							children: [
								r,
								(o || t) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											o,
											t &&
												(0, s.jsxs)(a.bm, {
													"data-slot": "dialog-close",
													className:
														"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
													children: [
														(0, s.jsx)(c.A, {}),
														(0, s.jsx)("span", {
															className: "sr-only",
															children: "Close",
														}),
													],
												}),
										],
									}),
							],
						}),
					],
				});
			}
			function p({ className: e, ...r }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, i.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...r,
				});
			}
			function u({ className: e, ...r }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, i.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...r,
				});
			}
			function v({ className: e, ...r }) {
				return (0, s.jsx)(a.hE, {
					"data-slot": "dialog-title",
					className: (0, i.cn)("text-lg leading-none font-semibold", e),
					...r,
				});
			}
			function g({ className: e, ...r }) {
				return (0, s.jsx)(a.VY, {
					"data-slot": "dialog-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...r,
				});
			}
		},
		79792: (e, r, t) => {
			"use strict";
			t.d(r, { J: () => i });
			var s = t(95155);
			t(12115);
			var a = t(91760),
				c = t(91337);
			function i({ className: e, ...r }) {
				return (0, s.jsx)(a.b, {
					"data-slot": "label",
					className: (0, c.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...r,
				});
			}
		},
	},
	(e) => {
		e.O(
			0,
			[
				5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 1040, 9843, 5007, 6020, 2372,
				5079, 2751, 8580, 8872, 8441, 3794, 7358,
			],
			() => e((e.s = 37184))
		),
			(_N_E = e.O());
	},
]);
