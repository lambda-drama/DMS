(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6450],
	{
		3070: (e, t, r) => {
			Promise.resolve().then(r.bind(r, 29947));
		},
		5240: (e, t, r) => {
			"use strict";
			function a(e, t, r) {
				return new Promise((a, s) => {
					e.toBlob((e) => (e ? a(e) : s(Error("Image compression failed"))), t, r);
				});
			}
			async function s(e, t, r, s) {
				let { width: i, height: n } = (function (e, t, r) {
						let a = Math.max(e, t);
						if (a <= r) return { width: e, height: t };
						let s = r / a;
						return {
							width: Math.max(1, Math.round(e * s)),
							height: Math.max(1, Math.round(t * s)),
						};
					})(e.naturalWidth || e.width, e.naturalHeight || e.height, t),
					o = document.createElement("canvas");
				(o.width = i), (o.height = n);
				let c = o.getContext("2d");
				if (!c) throw Error("Canvas not supported");
				return (c.drawImage(e, 0, 0, i, n), s) ? a(o, "image/png") : a(o, "image/jpeg", r);
			}
			async function i(e, t) {
				if (!e.type.startsWith("image/")) return e;
				let r = t?.skipBelowBytes ?? 4e5;
				if (e.size <= r) return e;
				let a = t?.targetMaxBytes ?? 14e5,
					i = "image/png" === e.type;
				try {
					let r = await new Promise((t, r) => {
							let a = URL.createObjectURL(e),
								s = new Image();
							(s.onload = () => {
								URL.revokeObjectURL(a), t(s);
							}),
								(s.onerror = () => {
									URL.revokeObjectURL(a), r(Error("Could not read image"));
								}),
								(s.src = a);
						}),
						n = [
							{ maxSide: t?.maxSide ?? 1920, quality: t?.quality ?? 0.82 },
							{ maxSide: 1280, quality: 0.72 },
							{ maxSide: 1024, quality: 0.65 },
						],
						o = null;
					for (let e of n)
						if ((o = await s(r, e.maxSide, e.quality, i)).size <= a) break;
					if (!o || (o.size >= e.size && e.size <= a)) return e;
					let c = i ? ".png" : ".jpg",
						l = i ? "image/png" : "image/jpeg",
						d = (e.name.replace(/\.[^.]+$/, "") || "image").slice(0, 120);
					return new File([o], `${d}${c}`, { type: l, lastModified: Date.now() });
				} catch {
					return e;
				}
			}
			r.d(t, {
				r4: () => C,
				n6: () => N,
				_N: () => A,
				CW: () => J,
				t4: () => f,
				d_: () => R,
				gn: () => g,
				ll: () => b,
				Mo: () => L,
				Iy: () => F,
				$_: () => j,
				Z9: () => E,
				zK: () => T,
				QF: () => q,
				OK: () => k,
				_L: () => O,
				bf: () => x,
				IQ: () => y,
				hz: () => w,
				J$: () => h,
				W6: () => P,
				hQ: () => S,
				Z7: () => $,
				UO: () => _,
				Y: () => c,
				_3: () => l,
				sJ: () => m,
				lE: () => d,
				KU: () => v,
				QM: () => M,
				mW: () => u,
			});
			var n = r(49876);
			let o = "dms.api.common";
			function c(e) {
				let t = String(e?.oem_part_number || e?.item_code || e?.name || "").trim(),
					r = String(e?.item_name || e?.name || t).trim();
				return t && r && t !== r ? `${t}: ${r}` : r || t;
			}
			function l(e) {
				var t;
				let r = [],
					a = String(e?.item_code || e?.spare_part_item || "").trim();
				return (
					a && a !== e?.name && r.push(a),
					e?.part_category && r.push(e.part_category),
					e?.bin_location && r.push(`Bin: ${e.bin_location}`),
					e?.stock_available != null &&
						Number.isFinite(Number(e.stock_available)) &&
						r.push(
							`Stock: ${
								!Number.isFinite((t = Number(e.stock_available)))
									? "0"
									: Number.isInteger(t)
									? String(t)
									: t.toFixed(2)
							}`
						),
					r.length ? r.join(" \xb7 ") : void 0
				);
			}
			function d(e) {
				return { value: e.name, label: c(e), description: l(e) };
			}
			function m(e) {
				let t = String(e?.custom_service_code || "").trim(),
					r = String(e?.custom_item_name || e?.service_item || e?.name || t).trim();
				return t && r && t !== r ? `${t}: ${r}` : r || t;
			}
			function u(e) {
				if (e?.estimated_hours != null && Number(e.estimated_hours) > 0)
					return Number(e.estimated_hours);
				let t = parseFloat(String(e?.custom_estimated_timehours ?? ""));
				return Number.isFinite(t) && t > 0 ? t : 0;
			}
			function p(e) {
				let t = "number" == typeof e ? e : parseFloat(String(e ?? ""));
				return Number.isFinite(t) ? t : 0;
			}
			async function h(e) {
				let t = await (0, n.AT)(
					`/api/method/${o}.get_vehicle_service_item_line_defaults`,
					{ method: "POST", body: JSON.stringify({ vehicle_service_item: e }) }
				);
				return {
					rate_per_hour: p(t?.rate_per_hour),
					estimated_hours: p(t?.estimated_hours),
					service_name: t?.service_name,
					service_code: t?.service_code,
				};
			}
			async function g(e, t, r) {
				return (0, n.AT)(`/api/method/${o}.get_customers`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t || 50, offset: r || 0 }),
				});
			}
			async function f(e) {
				return (0, n.AT)(`/api/method/${o}.get_customer_contact`, {
					method: "POST",
					body: JSON.stringify({ customer: e }),
				});
			}
			async function v(e, t) {
				return (0, n.AT)(`/api/method/${o}.update_customer_contact`, {
					method: "POST",
					body: JSON.stringify({ customer: e, data: t }),
				});
			}
			async function y() {
				return (0, n.AT)(`/api/method/${o}.get_vehicle_customer_group_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function b() {
				return (0, n.AT)(`/api/method/${o}.get_dms_customer_defaults`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function _() {
				return (0, n.AT)(`/api/method/${o}.get_workspace_access`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function x(e, t) {
				return (0, n.AT)(`/api/method/${o}.get_vins`, {
					method: "POST",
					body: JSON.stringify({ customer: e || null, search: t || null }),
				});
			}
			async function w(e, t, r) {
				return (0, n.AT)(`/api/method/${o}.get_vehicle_models`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, brand: t || null, limit: r ?? 30 }),
				});
			}
			async function N(e, t) {
				return (0, n.AT)(`/api/method/${o}.get_colors`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t ?? 40 }),
				});
			}
			async function S(e) {
				return (0, n.AT)(`/api/method/${o}.get_vehicle_service_types`, {
					method: "POST",
					body: JSON.stringify({ search: e || null }),
				});
			}
			async function j() {
				return (0, n.AT)(`/api/method/${o}.get_service_advisors`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function O() {
				return (0, n.AT)(`/api/method/${o}.get_technicians`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function T(e) {
				return (0, n.AT)(`/api/method/${o}.get_service_bays`, {
					method: "POST",
					body: JSON.stringify({ status: e || null }),
				});
			}
			async function k(e, t, r, a, s, i) {
				return (0, n.AT)(`/api/method/${o}.get_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e || null,
						warehouse: t || null,
						company: r || null,
						vehicle_model: a || null,
						vin: s || null,
						vehicle_brand: i || null,
					}),
				});
			}
			async function P(e, t, r, a = 50) {
				return (0, n.AT)(`/api/method/${o}.get_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({
						search: e || null,
						vehicle_model: t || null,
						vin: r || null,
						limit: a,
					}),
				});
			}
			async function $(e, t) {
				return (0, n.AT)(`/api/method/${o}.get_warehouses`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, company: t || null }),
				});
			}
			async function A(e) {
				return (0, n.AT)(`/api/method/${o}.get_companies`, {
					method: "POST",
					body: JSON.stringify({ search: e || null }),
				});
			}
			async function C(e, t) {
				return (0, n.AT)(`/api/method/${o}.get_branches`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, company: t || null }),
				});
			}
			async function J() {
				return (0, n.AT)(`/api/method/${o}.get_currencies`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function q(e) {
				let t = await (0, n.AT)(`/api/method/${o}.get_spare_part_price`, {
						method: "POST",
						body: JSON.stringify({ spare_part: e }),
					}),
					r = "number" == typeof t ? t : parseFloat(String(t ?? ""));
				return Number.isFinite(r) ? r : 0;
			}
			async function L(e) {
				return (0, n.AT)(`/api/method/${o}.get_labour_rate`, {
					method: "POST",
					body: JSON.stringify({ vehicle_service_item: e }),
				});
			}
			async function E(e) {
				return (0, n.AT)(`/api/method/${o}.get_service_bay_detail`, {
					method: "POST",
					body: JSON.stringify({ bay_name: e }),
				});
			}
			let U = new Map();
			async function F(e) {
				if (!e) return ["Standard"];
				let t = U.get(e);
				if (t) return t;
				let r = await (0, n.AT)(`/api/method/${o}.get_print_formats`, {
						method: "POST",
						body: JSON.stringify({ doctype: e }),
					}),
					a = Array.isArray(r) && r.length ? r : ["Standard"];
				return U.set(e, a), a;
			}
			async function M(e) {
				let t = await i(e);
				await (0, n.bd)();
				let r = window.csrf_token,
					a = new FormData();
				a.append("file", t),
					a.append("is_private", "0"),
					a.append("folder", "Home/Attachments"),
					r && a.append("csrf_token", r);
				let s = window.location.origin,
					o = await fetch(`${s}/api/method/upload_file`, {
						method: "POST",
						headers: r ? { "X-Frappe-CSRF-Token": r } : {},
						body: a,
						credentials: "include",
					}),
					c = await o.json().catch(() => ({}));
				if (c?.exc) {
					let e = "Upload failed";
					try {
						let t = JSON.parse(c._server_messages || "[]"),
							r = JSON.parse(t[0] || "{}");
						e = r?.message || c?.message || e;
					} catch {
						e = c?.message || e;
					}
					throw Error(e);
				}
				if (!o.ok) throw Error(`Upload failed: HTTP ${o.status}`);
				let l = c?.message;
				if (l && "object" == typeof l && l.file_url) return l.file_url;
				if ("string" == typeof l && l.startsWith("/")) return l;
				throw Error("Upload failed: no file URL in response");
			}
			async function R() {
				return (0, n.AT)(`/api/method/${o}.get_customer_terms_and_conditions`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		15181: (e, t, r) => {
			"use strict";
			function a(e) {
				window.scrollTo(0, 0),
					(document.documentElement.scrollTop = 0),
					(document.body.scrollTop = 0),
					e?.scrollTo(0, 0),
					document.body.style.removeProperty("overflow"),
					document.body.style.removeProperty("padding-right"),
					document.body.style.removeProperty("margin-right"),
					document.body.removeAttribute("data-scroll-locked");
			}
			r.d(t, { i: () => a });
		},
		29947: (e, t, r) => {
			"use strict";
			r.r(t), r.d(t, { default: () => _ });
			var a = r(95155),
				s = r(32144),
				i = r(55833),
				n = r(44462),
				o = r(19659),
				c = r(75273),
				l = r(37814),
				d = r(4474),
				m = r(79984),
				u = r(39658),
				p = r(42074),
				h = r(10086),
				g = r(93108),
				f = r(6296),
				v = r(12115),
				y = r(44855);
			let b = [
				"New",
				"Contact Attempted",
				"Contacted",
				"Qualified",
				"Appointment Scheduled",
				"Test Drive",
				"Quotation Submitted",
				"Negotiation",
				"Booking / Deposit",
				"Order Confirmed",
				"Won",
				"Lost",
				"Nurture",
			];
			function _() {
				let { navigate: e } = (0, i.c)(),
					[t, r] = (0, v.useState)(!1),
					{ error: _, success: x, showError: w, clear: N } = (0, g.B)(),
					[S, j] = (0, v.useState)({
						title: "",
						customer: "",
						stage: "New",
						expected_value: "",
						model: "",
						brand: "",
						preferred_color: "",
						company: "",
						branch: "",
						next_action: "Qualify opportunity",
						expected_close_date: "",
					}),
					{ data: O } = (0, y.Ay)("crm-opp-form-options", s.Er),
					T = (0, v.useMemo)(
						() => (O?.stages || b).map((e) => ({ value: e, label: e })),
						[O]
					),
					k = (0, v.useMemo)(
						() => (O?.companies || []).map((e) => ({ value: e, label: e })),
						[O]
					);
				(0, v.useEffect)(() => {
					O?.default_company &&
						!S.company &&
						j((e) => ({ ...e, company: O.default_company || "" }));
				}, [O, S.company]);
				let { data: P } = (0, y.Ay)(
						["crm-opp-branches", S.company],
						() => (0, s.Dd)(S.company || void 0),
						{ keepPreviousData: !0 }
					),
					$ = (e, t) => j((r) => ({ ...r, [e]: t })),
					A = async () => {
						if ((N(), !S.title.trim())) return void w("Title is required.");
						if (!S.customer) return void w("Select a customer.");
						if (!S.company) return void w("Company is required.");
						r(!0);
						try {
							let t = await (0, s.MG)({
								title: S.title.trim(),
								customer: S.customer,
								stage: S.stage,
								expected_value: S.expected_value ? Number(S.expected_value) : 0,
								model: S.model || void 0,
								brand: S.brand || void 0,
								preferred_color: S.preferred_color || void 0,
								company: S.company,
								branch: S.branch || void 0,
								next_action: S.next_action || void 0,
								expected_close_date: S.expected_close_date || void 0,
								status:
									"Won" === S.stage
										? "Won"
										: "Lost" === S.stage
										? "Lost"
										: "Open",
							});
							t?.name
								? e("crm-opportunity-detail", { id: t.name })
								: e("crm-opportunities");
						} catch (e) {
							w(e, "Failed to create deal");
						} finally {
							r(!1);
						}
					};
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(g.y, { error: _, success: x, onDismiss: N }),
						(0, a.jsxs)(m.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(m.aR, {
									children: (0, a.jsx)(m.ZB, {
										className: "text-base",
										children: "Opportunity",
									}),
								}),
								(0, a.jsxs)(m.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Title *",
												}),
												(0, a.jsx)(u.p, {
													value: S.title,
													onChange: (e) => $("title", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer *",
												}),
												(0, a.jsx)(n.L, {
													value: S.customer,
													onValueChange: (e) => $("customer", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Company *",
												}),
												(0, a.jsx)(h.Zi, {
													options: k,
													value: S.company,
													onValueChange: (e) =>
														j((t) => ({
															...t,
															company: e || "",
															branch: "",
														})),
													placeholder: "Company…",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Branch",
												}),
												(0, a.jsx)(h.Zi, {
													options: (P || []).map((e) => ({
														value: e.name,
														label: e.branch || e.name,
													})),
													value: S.branch,
													onValueChange: (e) => $("branch", e || ""),
													placeholder: "Branch…",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Pipeline stage",
												}),
												(0, a.jsx)(h.Zi, {
													options: T,
													value: S.stage,
													onValueChange: (e) => $("stage", e || "New"),
													placeholder: "Stage…",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Expected close",
												}),
												(0, a.jsx)(u.p, {
													type: "date",
													value: S.expected_close_date,
													onChange: (e) =>
														$("expected_close_date", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsxs)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: [
														"Opportunity amount",
														O?.currency_symbol
															? ` (${O.currency_symbol})`
															: "",
													],
												}),
												(0, a.jsx)(u.p, {
													type: "number",
													value: S.expected_value,
													onChange: (e) =>
														$("expected_value", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Brand",
												}),
												(0, a.jsx)(o.k, {
													value: S.brand,
													onValueChange: (e) =>
														j((t) => ({
															...t,
															brand: e,
															model:
																e && t.brand && e !== t.brand
																	? ""
																	: t.model,
														})),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Model",
												}),
												(0, a.jsx)(l.I, {
													value: S.model,
													brand: S.brand || void 0,
													onValueChange: (e, t) =>
														j((r) => ({
															...r,
															model: e || "",
															brand: r.brand || t?.brand || "",
														})),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Color",
												}),
												(0, a.jsx)(c.s, {
													value: S.preferred_color,
													onValueChange: (e) => $("preferred_color", e),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Next Action",
												}),
												(0, a.jsx)(u.p, {
													value: S.next_action,
													onChange: (e) =>
														$("next_action", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)(p.h, {
							children: [
								(0, a.jsx)(d.$, {
									variant: "outline",
									onClick: () => e("crm-opportunities"),
									disabled: t,
									children: "Cancel",
								}),
								(0, a.jsxs)(d.$, {
									onClick: A,
									disabled: t,
									children: [
										t
											? (0, a.jsx)(f.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Save Deal",
									],
								}),
							],
						}),
					],
				});
			}
		},
		55833: (e, t, r) => {
			"use strict";
			r.d(t, { NavigationProvider: () => d, c: () => m, g: () => c });
			var a = r(95155),
				s = r(12115),
				i = r(15181);
			let n = [
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
				o = {
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
			function c(e) {
				return e.startsWith("crm-");
			}
			let l = (0, s.createContext)({
				activeView: "dashboard",
				viewParams: new URLSearchParams(),
				navigate: () => {},
				viewGroup: "dashboard",
			});
			function d({ children: e }) {
				let [t, r] = (0, s.useState)("dashboard"),
					[c, m] = (0, s.useState)(new URLSearchParams()),
					u = (0, s.useCallback)((e, t) => {
						let a = t && Object.keys(t).length > 0 ? t : void 0,
							s = `#${e}`;
						a && (s += `?${new URLSearchParams(a).toString()}`),
							r(e),
							m(new URLSearchParams(a || {})),
							(window.location.hash = s),
							(0, i.i)(),
							requestAnimationFrame(() => (0, i.i)());
					}, []);
				return (
					(0, s.useEffect)(() => {
						let e = () => {
							let e,
								t,
								a,
								s,
								{ view: i, params: o } =
									((a = (
										(t = (e = window.location.hash
											.replace("#", "")
											.trim()).indexOf("?")) >= 0
											? e.slice(0, t)
											: e
									)
										.trim()
										.toLowerCase()),
									(s = t >= 0 ? e.slice(t) : ""),
									{
										view: n.includes(a) ? a : "",
										params: new URLSearchParams(s),
									});
							r(i || "dashboard"), m(o);
						};
						return (
							e(),
							window.addEventListener("hashchange", e),
							() => window.removeEventListener("hashchange", e)
						);
					}, []),
					(0, a.jsx)(l.Provider, {
						value: {
							activeView: t,
							viewParams: c,
							navigate: u,
							viewGroup: o[t] || "dashboard",
						},
						children: e,
					})
				);
			}
			function m() {
				return (0, s.useContext)(l);
			}
		},
		74350: (e, t, r) => {
			"use strict";
			r.d(t, {
				Cf: () => m,
				Es: () => p,
				L3: () => h,
				c7: () => u,
				lG: () => c,
				rr: () => g,
			});
			var a = r(95155);
			r(12115);
			var s = r(29483),
				i = r(33210),
				n = r(91337),
				o = r(10086);
			function c({ ...e }) {
				return (0, a.jsx)(s.bL, { "data-slot": "dialog", ...e });
			}
			function l({ ...e }) {
				return (0, a.jsx)(s.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)(s.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function m({
				className: e,
				children: t,
				showCloseButton: r = !0,
				headerActions: c,
				onPointerDownOutside: u,
				onInteractOutside: p,
				onFocusOutside: h,
				...g
			}) {
				return (0, a.jsxs)(l, {
					"data-slot": "dialog-portal",
					children: [
						(0, a.jsx)(d, {}),
						(0, a.jsxs)(s.UC, {
							"data-slot": "dialog-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							onPointerDownOutside: (e) => {
								(0, o.JM)(e.target) ? e.preventDefault() : u?.(e);
							},
							onInteractOutside: (e) => {
								(0, o.JM)(e.target) ? e.preventDefault() : p?.(e);
							},
							onFocusOutside: (e) => {
								(0, o.JM)(e.target) ? e.preventDefault() : h?.(e);
							},
							...g,
							children: [
								t,
								(c || r) &&
									(0, a.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											c,
											r &&
												(0, a.jsxs)(s.bm, {
													"data-slot": "dialog-close",
													className:
														"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
													children: [
														(0, a.jsx)(i.A, {}),
														(0, a.jsx)("span", {
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
			function u({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, n.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, n.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, a.jsx)(s.hE, {
					"data-slot": "dialog-title",
					className: (0, n.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function g({ className: e, ...t }) {
				return (0, a.jsx)(s.VY, {
					"data-slot": "dialog-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
		},
		79792: (e, t, r) => {
			"use strict";
			r.d(t, { J: () => n });
			var a = r(95155);
			r(12115);
			var s = r(91760),
				i = r(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)(s.b, {
					"data-slot": "label",
					className: (0, i.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...t,
				});
			}
		},
	},
	(e) => {
		e.O(
			0,
			[
				5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 3777, 8103, 2372, 2751, 7367,
				5505, 8441, 3794, 7358,
			],
			() => e((e.s = 3070))
		),
			(_N_E = e.O());
	},
]);
