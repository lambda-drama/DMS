"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[7366],
	{
		15181: (e, t, a) => {
			a.d(t, { i: () => s });
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
		},
		33210: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		41313: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("log-out", [
				["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
				["path", { d: "M21 12H9", key: "dn1m92" }],
				["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
			]);
		},
		51914: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		55833: (e, t, a) => {
			a.d(t, { NavigationProvider: () => d, c: () => l, g: () => o });
			var s = a(95155),
				r = a(12115),
				c = a(15181);
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
			let m = (0, r.createContext)({
				activeView: "dashboard",
				viewParams: new URLSearchParams(),
				navigate: () => {},
				viewGroup: "dashboard",
			});
			function d({ children: e }) {
				let [t, a] = (0, r.useState)("dashboard"),
					[o, l] = (0, r.useState)(new URLSearchParams()),
					p = (0, r.useCallback)((e, t) => {
						let s = t && Object.keys(t).length > 0 ? t : void 0,
							r = `#${e}`;
						s && (r += `?${new URLSearchParams(s).toString()}`),
							a(e),
							l(new URLSearchParams(s || {})),
							(window.location.hash = r),
							(0, c.i)(),
							requestAnimationFrame(() => (0, c.i)());
					}, []);
				return (
					(0, r.useEffect)(() => {
						let e = () => {
							let e,
								t,
								s,
								r,
								{ view: c, params: n } =
									((s = (
										(t = (e = window.location.hash
											.replace("#", "")
											.trim()).indexOf("?")) >= 0
											? e.slice(0, t)
											: e
									)
										.trim()
										.toLowerCase()),
									(r = t >= 0 ? e.slice(t) : ""),
									{
										view: i.includes(s) ? s : "",
										params: new URLSearchParams(r),
									});
							a(c || "dashboard"), l(n);
						};
						return (
							e(),
							window.addEventListener("hashchange", e),
							() => window.removeEventListener("hashchange", e)
						);
					}, []),
					(0, s.jsx)(m.Provider, {
						value: {
							activeView: t,
							viewParams: o,
							navigate: p,
							viewGroup: n[t] || "dashboard",
						},
						children: e,
					})
				);
			}
			function l() {
				return (0, r.useContext)(m);
			}
		},
		56563: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		74350: (e, t, a) => {
			a.d(t, {
				Cf: () => l,
				Es: () => u,
				L3: () => v,
				c7: () => p,
				lG: () => o,
				rr: () => w,
			});
			var s = a(95155);
			a(12115);
			var r = a(29483),
				c = a(33210),
				i = a(91337),
				n = a(10086);
			function o({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "dialog", ...e });
			}
			function m({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function l({
				className: e,
				children: t,
				showCloseButton: a = !0,
				headerActions: o,
				onPointerDownOutside: p,
				onInteractOutside: u,
				onFocusOutside: v,
				...w
			}) {
				return (0, s.jsxs)(m, {
					"data-slot": "dialog-portal",
					children: [
						(0, s.jsx)(d, {}),
						(0, s.jsxs)(r.UC, {
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
							...w,
							children: [
								t,
								(o || a) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											o,
											a &&
												(0, s.jsxs)(r.bm, {
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
			function p({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, i.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, i.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function v({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "dialog-title",
					className: (0, i.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function w({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "dialog-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
		},
		79790: (e, t, a) => {
			a.d(t, { $: () => l, h: () => p });
			var s = a(95155),
				r = a(12115),
				c = a(44855),
				i = a(5240),
				n = a(47277);
			let o = "dms-app-workspace",
				m = {
					listed: !1,
					access_limited_to: "",
					can_access_dms: !0,
					can_access_crm: !0,
					can_view_staff_audit: !1,
					can_switch_workspace: !0,
					can_view_dms_dashboard: !1,
					can_view_dms_report: !1,
					can_open_desk: !1,
					allowed_dms_report_sections: [],
				},
				d = (0, r.createContext)({
					workspace: "dms",
					setWorkspace: () => {},
					switchToCrm: () => {},
					switchToDms: () => {},
					isCrm: !1,
					access: m,
					accessLoading: !0,
					canAccessDms: !0,
					canAccessCrm: !0,
					canViewStaffAudit: !1,
					canSwitchWorkspace: !0,
					canOpenDesk: !1,
				});
			function l({ children: e }) {
				let { isAuthenticated: t } = (0, n.A)(),
					[a, p] = (0, r.useState)("dms"),
					{ data: u, isLoading: v } = (0, c.Ay)(
						t ? "dms-workspace-access" : null,
						i.UO,
						{ revalidateOnFocus: !0, dedupingInterval: 5e3 }
					),
					w = u || m;
				(0, r.useEffect)(() => {
					let e,
						t =
							"crm" ===
								(e = new URLSearchParams(window.location.search).get(
									"workspace"
								)) || "dms" === e
								? e
								: "crm" === window.localStorage.getItem(o)
								? "crm"
								: "dms";
					p(t),
						window.localStorage.setItem(o, t),
						(document.documentElement.dataset.workspace = t);
				}, []),
					(0, r.useEffect)(() => {
						if (v && !u) return;
						let e =
							"crm" === a && w.can_access_crm
								? "crm"
								: "dms" === a && w.can_access_dms
								? "dms"
								: w.can_access_crm && !w.can_access_dms
								? "crm"
								: w.can_access_dms && !w.can_access_crm
								? "dms"
								: a;
						e !== a &&
							(p(e),
							window.localStorage.setItem(o, e),
							(document.documentElement.dataset.workspace = e));
					}, [w, u, v, a]);
				let f = (0, r.useCallback)(
					(e) => {
						("crm" !== e || w.can_access_crm) &&
							("dms" !== e || w.can_access_dms) &&
							(p(e),
							window.localStorage.setItem(o, e),
							(document.documentElement.dataset.workspace = e));
					},
					[w.can_access_crm, w.can_access_dms]
				);
				(0, r.useEffect)(() => {
					document.documentElement.dataset.workspace = a;
				}, [a]);
				let h = (0, r.useCallback)(() => f("crm"), [f]),
					g = (0, r.useCallback)(() => f("dms"), [f]),
					b = (0, r.useMemo)(
						() => ({
							workspace: a,
							setWorkspace: f,
							switchToCrm: h,
							switchToDms: g,
							isCrm: "crm" === a,
							access: w,
							accessLoading: !!(t && v && !u),
							canAccessDms: w.can_access_dms,
							canAccessCrm: w.can_access_crm,
							canViewStaffAudit: w.can_view_staff_audit,
							canSwitchWorkspace: w.can_switch_workspace,
							canOpenDesk: !!w.can_open_desk,
						}),
						[a, f, h, g, w, v, u, t]
					);
				return (0, s.jsx)(d.Provider, { value: b, children: e });
			}
			function p() {
				return (0, r.useContext)(d);
			}
		},
		79792: (e, t, a) => {
			a.d(t, { J: () => i });
			var s = a(95155);
			a(12115);
			var r = a(91760),
				c = a(91337);
			function i({ className: e, ...t }) {
				return (0, s.jsx)(r.b, {
					"data-slot": "label",
					className: (0, c.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...t,
				});
			}
		},
		91760: (e, t, a) => {
			a.d(t, { b: () => o });
			var s = a(12115);
			a(47650);
			var r = a(42442),
				c = a(95155),
				i = [
					"a",
					"button",
					"div",
					"form",
					"h2",
					"h3",
					"img",
					"input",
					"label",
					"li",
					"nav",
					"ol",
					"p",
					"select",
					"span",
					"svg",
					"ul",
				].reduce((e, t) => {
					let a = (0, r.TL)(`Primitive.${t}`),
						i = s.forwardRef((e, s) => {
							let { asChild: r, ...i } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, c.jsx)(r ? a : t, { ...i, ref: s })
							);
						});
					return (i.displayName = `Primitive.${t}`), { ...e, [t]: i };
				}, {}),
				n = s.forwardRef((e, t) =>
					(0, c.jsx)(i.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			n.displayName = "Label";
			var o = n;
		},
		94514: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
]);
