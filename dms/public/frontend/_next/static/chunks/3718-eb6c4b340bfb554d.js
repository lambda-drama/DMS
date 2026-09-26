"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3718],
	{
		23718: (e, t, a) => {
			a.r(t), a.d(t, { default: () => I });
			var s = a(95155),
				n = a(81672),
				i = a(12115),
				l = a(44855),
				r = a(32144),
				o = a(55833),
				d = a(44462),
				c = a(19659),
				m = a(75273),
				u = a(37814),
				p = a(5240),
				x = a(10086);
			function h({
				value: e,
				onValueChange: t,
				valueLabel: a,
				placeholder: n = "Search spare parts…",
				disabled: r,
				className: o,
			}) {
				let [d, c] = (0, i.useState)(""),
					[m, u] = (0, i.useState)(a || ""),
					{ data: g, isLoading: v } = (0, l.Ay)(["crm-link-spare-parts", d], () =>
						(0, p.OK)(d || void 0)
					),
					b = (0, i.useMemo)(
						() =>
							(g || [])
								.map((e) => {
									let t = String(e.spare_part_item || e.item_code || "").trim();
									return t
										? {
												value: t,
												label: (0, p.Y)(e),
												description: (0, p._3)(e),
												item_name: String(e.item_name || ""),
												uom: "Nos",
												selling_price: Number(e.selling_price || 0),
												spare_part_name: e.name,
										  }
										: null;
								})
								.filter(Boolean),
						[g]
					),
					_ = (e && (m || a)) || b.find((t) => t.value === e)?.label || void 0,
					j = async (e) => {
						let a = b.find((t) => t.value === e);
						if (!a) {
							u(e), t(e || "", { item_name: e || "" });
							return;
						}
						u(a.label);
						let s = a.selling_price;
						if (!s && a.spare_part_name)
							try {
								s = await (0, p.QF)(a.spare_part_name);
							} catch {
								s = 0;
							}
						t(e, { item_name: a.item_name || a.label, uom: a.uom, rate: s });
					};
				return (0, s.jsx)(x.Zi, {
					className: o,
					options: b,
					value: e,
					valueLabel: _,
					onValueChange: (e) => void j(e || ""),
					onSearchChange: c,
					placeholder: n,
					emptyMessage: "No spare parts found",
					isLoading: v,
					disabled: r,
				});
			}
			var g = a(12107),
				v = a(84486),
				b = a(4474),
				_ = a(52959),
				j = a(79984),
				y = a(39658),
				f = a(39540),
				N = a(23511),
				S = a(42074),
				k = a(65584),
				C = a(93108),
				w = a(50136),
				q = a(98790),
				A = a(56204),
				$ = a(6296),
				D = a(68459);
			let R = [
				"Qualified",
				"Appointment Scheduled",
				"Test Drive",
				"Quotation Submitted",
				"Negotiation",
				"Booking / Deposit",
				"Order Confirmed",
				"Won",
			];
			function V() {
				return { item_code: "", qty: 1, rate: 0, discount_percentage: 0 };
			}
			function O() {
				return {
					model: "",
					specification: "",
					quantity: 1,
					preferred_color: "",
					unit_price: "",
					body_building_notes: "",
					delivery_location: "",
					delivery_batch: "",
					delivery_date: "",
				};
			}
			let B = {
				title: "",
				customer: "",
				stage: "New",
				status: "Open",
				company: "",
				branch: "",
				brand: "",
				model: "",
				preferred_color: "",
				expected_value: "",
				expected_close_date: "",
				probability: "10",
				next_action: "",
				next_action_due: "",
				lost_reason: "",
				competitor: "",
				opportunity_type: "",
				quotation_validity: "",
				notes: "",
				account: "",
				tender: "",
				framework_agreement: "",
				bid_deadline: "",
				financing_method: "",
				delivery_schedule_notes: "",
				aftersales_package_notes: "",
				special_conversion_notes: "",
				fleet_requirements: [O()],
				items: [V()],
			};
			function I() {
				let e,
					t,
					a,
					{ navigate: p, viewParams: I } = (0, o.c)(),
					Z = I.get("id") || "",
					{ data: T } = (0, l.Ay)("crm-opp-form-options", r.Er),
					{
						data: L,
						isLoading: F,
						mutate: M,
					} = (0, l.Ay)(Z ? ["crm-opportunity", Z] : null, () => (0, r.Oe)(Z)),
					[W, Q] = (0, i.useState)(B),
					[E, z] = (0, i.useState)(!1),
					[P, U] = (0, i.useState)(!1),
					[J, Y] = (0, i.useState)(""),
					[H, G] = (0, i.useState)(""),
					K = "Fleet" === W.opportunity_type || "Tender" === W.opportunity_type,
					{ data: X } = (0, l.Ay)(K ? ["crm-opp-accounts", J] : null, () =>
						(0, r.B)({ search: J || void 0, limit: 30 })
					),
					{ data: ee } = (0, l.Ay)(K ? ["crm-opp-tenders", H] : null, () =>
						(0, r.sX)({ search: H || void 0, limit: 30 })
					),
					[et, ea] = (0, i.useState)(""),
					[es, en] = (0, i.useState)(!1),
					[ei, el] = (0, i.useState)(!1),
					er = ei ? String(L?.quotation || "") : "",
					{ data: eo } = (0, l.Ay)(er ? ["crm-quotation-send", er] : null, () =>
						(0, r.Jp)(er)
					),
					[ed, ec] = (0, i.useState)({
						appointment_datetime: "",
						appointment_type: "Showroom Appointment",
						duration_minutes: "60",
						agenda: "",
					}),
					[em, eu] = (0, i.useState)({
						scheduled_datetime: "",
						driver: "",
						driver_name: "",
						driver_license: "",
						issuing_date: "",
						expiry_date: "",
						route: "",
						vehicle_vin: "",
					}),
					[ep, ex] = (0, i.useState)({
						deposit_amount: "",
						receipt_reference: "",
						booking_expiry: "",
						factory_order_reference: "",
						cancellation_terms: "",
					}),
					[eh, eg] = (0, i.useState)(""),
					[ev, eb] = (0, i.useState)(""),
					[e_, ej] = (0, i.useState)(!1),
					[ey, ef] = (0, i.useState)(""),
					[eN, eS] = (0, i.useState)(""),
					[ek, eC] = (0, i.useState)(""),
					{
						error: ew,
						success: eq,
						showError: eA,
						showSuccess: e$,
						clear: eD,
					} = (0, C.B)();
				(0, i.useEffect)(() => {
					let e, t, a, s;
					L &&
						Q(
							((t = (e = Array.isArray(L.items)
								? L.items.map((e) => ({
										item_code: String(e.item_code || ""),
										item_name: String(e.item_name || ""),
										qty: Number(e.qty || 1),
										rate: Number(e.rate || 0),
										uom: String(e.uom || ""),
										discount_percentage: Number(e.discount_percentage || 0),
										amount: Number(e.amount || 0),
										net_amount: Number(e.net_amount || 0),
								  }))
								: []).length
								? e
								: [V()]),
							(s = (a = Array.isArray(L.fleet_requirements)
								? L.fleet_requirements.map((e) => ({
										model: String(e.model || ""),
										specification: String(e.specification || ""),
										quantity: Number(e.quantity || 1),
										preferred_color: String(e.preferred_color || ""),
										unit_price:
											null != e.unit_price ? String(e.unit_price) : "",
										body_building_notes: String(e.body_building_notes || ""),
										delivery_location: String(e.delivery_location || ""),
										delivery_batch: String(e.delivery_batch || ""),
										delivery_date: String(e.delivery_date || ""),
								  }))
								: []).length
								? a
								: [O()]),
							{
								title: String(L.title || ""),
								customer: String(L.customer || ""),
								stage: String(L.stage || "New"),
								status: String(L.status || "Open"),
								company: String(L.company || ""),
								branch: String(L.branch || ""),
								brand: String(L.brand || ""),
								model: String(L.model || ""),
								preferred_color: String(L.preferred_color || ""),
								expected_value:
									null != L.expected_value ? String(L.expected_value) : "",
								expected_close_date: String(L.expected_close_date || ""),
								probability: null != L.probability ? String(L.probability) : "10",
								next_action: String(L.next_action || ""),
								next_action_due: String(L.next_action_due || "").slice(0, 16),
								lost_reason: String(L.lost_reason || ""),
								competitor: String(L.competitor || ""),
								opportunity_type: String(L.opportunity_type || ""),
								quotation_validity: String(L.quotation_validity || ""),
								notes: String(L.notes || "").replace(/<[^>]+>/g, ""),
								account: String(L.account || ""),
								tender: String(L.tender || ""),
								framework_agreement: String(L.framework_agreement || ""),
								bid_deadline: String(L.bid_deadline || "").slice(0, 16),
								financing_method: String(L.financing_method || ""),
								delivery_schedule_notes: String(L.delivery_schedule_notes || ""),
								aftersales_package_notes: String(L.aftersales_package_notes || ""),
								special_conversion_notes: String(L.special_conversion_notes || ""),
								fleet_requirements: s,
								items: t,
							})
						);
				}, [L]);
				let eR = (0, i.useMemo)(
						() => (T?.statuses || []).map((e) => ({ value: e, label: e })),
						[T]
					),
					eV = (0, i.useMemo)(
						() => (T?.opportunity_types || []).map((e) => ({ value: e, label: e })),
						[T]
					),
					eO = (0, i.useMemo)(
						() => (T?.companies || []).map((e) => ({ value: e, label: e })),
						[T]
					),
					{ data: eB } = (0, l.Ay)(
						["crm-opp-detail-branches", W.company],
						() => (0, r.Dd)(W.company || void 0),
						{ keepPreviousData: !0 }
					),
					{ data: eI, isLoading: eZ } = (0, l.Ay)(
						["crm-opp-allocate-vins", ev, W.company, W.model],
						() =>
							(0, r.zL)({
								search: ev,
								company: W.company || void 0,
								model: W.model || void 0,
								preferred_color: W.preferred_color || void 0,
							}),
						{ keepPreviousData: !0 }
					),
					eT = String(L?.booking || ""),
					{ data: eL, mutate: eF } = (0, l.Ay)(
						eT ? ["crm-allocation-snapshot", eT] : null,
						() => (0, r.LX)(eT)
					),
					eM = (e, t) => Q((a) => ({ ...a, [e]: t })),
					eW = (e, t) => {
						Q((a) => {
							let s = [...a.items],
								n = { ...s[e], ...t },
								i = Number(n.qty || 0) * Number(n.rate || 0),
								l = (i * Number(n.discount_percentage || 0)) / 100;
							return (
								(n.amount = i),
								(n.net_amount = i - l),
								(s[e] = n),
								{ ...a, items: s }
							);
						});
					},
					eQ = () => ({
						title: W.title.trim(),
						customer: W.customer || null,
						stage: W.stage,
						status: W.status,
						company: W.company || null,
						branch: W.branch || null,
						brand: W.brand || null,
						model: W.model || null,
						preferred_color: W.preferred_color || null,
						expected_value: W.expected_value ? Number(W.expected_value) : 0,
						expected_close_date: W.expected_close_date || null,
						probability: W.probability ? Number(W.probability) : 0,
						next_action: W.next_action || null,
						next_action_due: W.next_action_due || null,
						lost_reason: W.lost_reason || null,
						competitor: W.competitor || null,
						opportunity_type: W.opportunity_type || null,
						quotation_validity: W.quotation_validity || null,
						notes: W.notes || null,
						account: W.account || null,
						tender: W.tender || null,
						framework_agreement: W.framework_agreement || null,
						bid_deadline: W.bid_deadline || null,
						financing_method: W.financing_method || null,
						delivery_schedule_notes: W.delivery_schedule_notes || null,
						aftersales_package_notes: W.aftersales_package_notes || null,
						special_conversion_notes: W.special_conversion_notes || null,
						fleet_requirements: W.fleet_requirements
							.filter((e) => e.model || e.specification)
							.map((e) => ({
								model: e.model || null,
								specification: e.specification || null,
								quantity: e.quantity || 1,
								preferred_color: e.preferred_color || null,
								unit_price: e.unit_price ? Number(e.unit_price) : 0,
								body_building_notes: e.body_building_notes || null,
								delivery_location: e.delivery_location || null,
								delivery_batch: e.delivery_batch || null,
								delivery_date: e.delivery_date || null,
							})),
						items: W.items.filter((e) => e.item_code),
					}),
					eE = async () => {
						if (Z) {
							if ((eD(), !W.title.trim())) return void eA("Title is required.");
							z(!0);
							try {
								await (0, r.h6)(Z, eQ()), await M(), e$("Deal saved.");
							} catch (e) {
								eA(e, "Failed to update deal");
							} finally {
								z(!1);
							}
						}
					};
				if (!Z)
					return (0, s.jsx)(j.Zp, {
						className: "border-border/70",
						children: (0, s.jsx)(j.Wu, {
							className: "py-10 text-center text-muted-foreground",
							children: "No opportunity selected.",
						}),
					});
				if (F || !L)
					return (0, s.jsxs)("div", {
						className: "space-y-3",
						children: [
							(0, s.jsx)(N.E, { className: "h-24" }),
							(0, s.jsx)(N.E, { className: "h-48" }),
						],
					});
				let ez = E || P,
					eP = (e, t) => {
						if (!t) return;
						let a = e.toLowerCase().replace(/\s+/g, "-");
						window.open(
							`/app/${a}/${encodeURIComponent(String(t))}`,
							"_blank",
							"noopener"
						);
					},
					eU = {
						appointment: String(L.sales_appointment || ""),
						testDrive: String(L.test_drive || ""),
						quotation: String(L.quotation || ""),
						booking: String(L.booking || ""),
						allocatedVin: String(L.allocated_vin || ""),
						deliveryReadiness: String(L.delivery_readiness || ""),
						salesOrder: String(L.sales_order || ""),
						salesInvoice: String(L.sales_invoice || ""),
					},
					eJ = String(L.sales_appointment_details?.status || ""),
					eY = String(L.test_drive_details?.status || ""),
					eH = async (e) => {
						if (e) {
							eD(), U(!0);
							try {
								if ("appointment" === e) {
									await (0, r.gj)(Z, {
										...ed,
										duration_minutes: Number(ed.duration_minutes || 60),
									}),
										await M(),
										ea(""),
										e$("Sales appointment scheduled on this deal.");
									return;
								}
								if ("test-drive" === e) {
									let e = await (0, r.jg)({ opportunity: Z, ...em }),
										t = String(e?.name || "");
									await M(), ea(""), t && p("crm-test-drive-detail", { id: t });
									return;
								}
								if ("negotiation" === e)
									await (0, r.h6)(Z, {
										...eQ(),
										stage: "Negotiation",
										status: "Open",
									});
								else if ("booking" === e)
									await (0, r.AC)(Z, {
										...ep,
										deposit_amount: Number(ep.deposit_amount || 0),
										vehicle_vin: em.vehicle_vin || void 0,
									});
								else if ("invoice" === e) {
									let e = await (0, r.Zz)(Z);
									e?.update_stock ||
										eA(
											"Invoice created as draft. Open it, set warehouse/serial or VIN details, enable Update Stock, then submit it before Won."
										);
								} else await (0, r.Tq)(Z);
								ea(""), await M();
							} catch (e) {
								eA(e, "Pipeline action failed");
							} finally {
								U(!1);
							}
						}
					},
					eG = async (e) => {
						let t =
							("Rejected" === e &&
								window.prompt("Enter the customer rejection reason")?.trim()) ||
							"";
						if ("Rejected" !== e || t) {
							U(!0), eD();
							try {
								await (0, r.LU)(Z, e, t),
									await M(),
									e$(`Quotation marked ${e.toLowerCase()}.`);
							} catch (e) {
								eA(e, "Failed to update quotation status");
							} finally {
								U(!1);
							}
						}
					},
					eK = async () => {
						U(!0), eD();
						try {
							await (0, r.LQ)(Z, W.quotation_validity),
								await M(),
								e$("New quotation version created.");
						} catch (e) {
							eA(e, "Failed to reissue quotation");
						} finally {
							U(!1);
						}
					},
					eX = async () => {
						if (eU.booking && eh) {
							ej(!0), eD();
							try {
								await (0, r.TI)(eU.booking, { vehicle_vin: eh }),
									eg(""),
									await Promise.all([M(), eF()]),
									e$("VIN allocated to this booking.");
							} catch (e) {
								eA(e, "Failed to allocate VIN");
							} finally {
								ej(!1);
							}
						}
					},
					e0 = async () => {
						if (!eU.booking || !ey.trim())
							return void eA("Enter a reason for the allocation switch.");
						ej(!0), eD();
						try {
							await (0, r.wj)(eU.booking, ey.trim(), eN || void 0),
								ef(""),
								await Promise.all([M(), eF()]),
								e$("Allocation switch requested — awaiting manager approval.");
						} catch (e) {
							eA(e, "Failed to request allocation switch");
						} finally {
							ej(!1);
						}
					},
					e2 = async (e) => {
						if (eU.booking) {
							ej(!0), eD();
							try {
								await (0, r.Ki)(eU.booking, e, eN || void 0, ey || void 0),
									eS(""),
									ef(""),
									await Promise.all([M(), eF()]),
									e$(
										e
											? "Allocation switch approved."
											: "Allocation switch rejected."
									);
							} catch (e) {
								eA(e, "Failed to update allocation switch");
							} finally {
								ej(!1);
							}
						}
					},
					e1 = async () => {
						if (!eU.booking) return;
						let e = window.prompt("Reason for releasing this VIN?")?.trim();
						if (e) {
							ej(!0), eD();
							try {
								await (0, r.jk)(eU.booking, e),
									await Promise.all([M(), eF()]),
									e$("VIN released from booking.");
							} catch (e) {
								eA(e, "Failed to release VIN");
							} finally {
								ej(!1);
							}
						}
					},
					e4 = async () => {
						let e = Number(ek);
						if (!e || e < 1 || e > 5)
							return void eA("Enter a satisfaction score from 1 to 5.");
						eD();
						try {
							let t = await (0, r.eB)(Z, e);
							await M(),
								e$(
									t?.referral_created
										? "Experience recorded. Referral task created (score ≥ 4)."
										: "Experience score recorded."
								);
						} catch (e) {
							eA(e, "Failed to record experience score");
						}
					},
					e5 = async () => {
						U(!0), eD();
						try {
							let e = await (0, r.pz)(Z);
							await M(),
								e?.name &&
									p("crm-delivery-readiness-detail", { id: String(e.name) });
						} catch (e) {
							eA(e, "Failed to create delivery readiness");
						} finally {
							U(!1);
						}
					},
					e3 =
						"Won" === W.stage || "Won" === W.status
							? null
							: !eU.appointment || ["No-Show", "Cancelled"].includes(eJ)
							? { label: "Schedule Appointment", action: "appointment" }
							: !eU.testDrive || ["Failed", "No-Show", "Cancelled"].includes(eY)
							? { label: "Schedule Test Drive", action: "test-drive" }
							: "Completed" !== eY
							? { label: "Complete Test Drive Checklist", action: "open-test-drive" }
							: eU.quotation
							? "Rejected" === L.quotation_customer_status
								? { label: "Review & Reissue Quotation", action: "open-quotation" }
								: "Accepted" !== L.quotation_customer_status || eU.salesOrder
								? "Quotation Submitted" === W.stage
									? { label: "Start Negotiation", action: "negotiation" }
									: eU.salesOrder
									? eU.booking && !eU.allocatedVin
										? {
												label: "Allocate VIN / Stock Unit",
												action: "allocate",
										  }
										: eU.salesInvoice
										? eU.deliveryReadiness
											? "Ready" !==
													String(
														L.delivery_readiness_details?.status || ""
													) &&
											  "Delivered" !==
													String(
														L.delivery_readiness_details?.status || ""
													)
												? {
														label: "Complete Delivery Readiness",
														action: "open-delivery-readiness",
												  }
												: "Won" !== W.stage
												? {
														label: "Verify Invoice & Mark Won",
														action: "won",
												  }
												: null
											: {
													label: "Start Delivery Readiness",
													action: "delivery-readiness",
											  }
										: {
												label: "Create Invoice / Confirm Order",
												action: "invoice",
										  }
									: { label: "Create Booking / Sales Order", action: "booking" }
								: { label: "Create Booking / Sales Order", action: "booking" }
							: { label: "Create Quotation", action: "quotation" };
				return (0, s.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, s.jsx)(C.y, { error: ew, success: eq, onDismiss: eD }),
						(0, s.jsxs)(j.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsx)(j.aR, {
									className: "pb-3",
									children: (0, s.jsxs)("div", {
										className: "flex items-center justify-between gap-3",
										children: [
											(0, s.jsx)(j.ZB, {
												className: "text-base",
												children: "Sales path",
											}),
											(0, s.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: String(L.name),
											}),
										],
									}),
								}),
								(0, s.jsxs)(j.Wu, {
									className: "space-y-3",
									children: [
										(0, s.jsx)(k.O, {
											stages: R,
											current: W.stage,
											checked: "Completed" === eY ? ["Test Drive"] : [],
											terminal: "Lost" === W.stage || "Lost" === W.status,
											onSelect: (e) => {
												"Appointment Scheduled" === e
													? eU.appointment
														? document
																.getElementById(
																	"deal-sales-appointment"
																)
																?.scrollIntoView({
																	behavior: "smooth",
																	block: "nearest",
																})
														: ea("appointment")
													: "Test Drive" === e
													? eU.testDrive
														? p("crm-test-drive-detail", {
																id: eU.testDrive,
														  })
														: ea("test-drive")
													: "Quotation Submitted" === e
													? eU.quotation
														? p("crm-quotation-detail", {
																id: eU.quotation,
														  })
														: en(!0)
													: "Negotiation" === e
													? eU.quotation
														? Q((e) => ({
																...e,
																stage: "Negotiation",
														  }))
														: en(!0)
													: "Booking / Deposit" === e
													? eU.booking
														? eP("DMS CRM Booking", eU.booking)
														: eU.salesOrder
														? eP("Sales Order", eU.salesOrder)
														: ea("booking")
													: "Order Confirmed" === e
													? eU.salesInvoice
														? eP("Sales Invoice", eU.salesInvoice)
														: ea("invoice")
													: "Won" === e && eH("won");
											},
										}),
										"Lost" === W.stage || "Lost" === W.status
											? (0, s.jsx)("span", {
													className:
														"inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive",
													children: "Lost",
											  })
											: null,
										(0, s.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children:
												"Click a path step to create or review its record here. You stay on this deal — nothing jumps to another page.",
										}),
									],
								}),
							],
						}),
						eU.appointment
							? (0, s.jsxs)(j.Zp, {
									id: "deal-sales-appointment",
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(j.aR, {
											children: (0, s.jsx)(j.ZB, {
												className: "text-base",
												children: "Sales appointment",
											}),
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-2 text-sm",
											children: [
												(0, s.jsxs)("div", {
													className: "flex flex-wrap items-center gap-2",
													children: [
														(0, s.jsx)("span", {
															className: "font-medium",
															children: eU.appointment,
														}),
														eJ
															? (0, s.jsx)("span", {
																	className:
																		"rounded-full bg-primary/10 px-3 py-1 text-xs text-primary",
																	children: eJ,
															  })
															: null,
													],
												}),
												(0, s.jsxs)("p", {
													className: "text-muted-foreground",
													children: [
														L.sales_appointment_details
															?.appointment_datetime
															? (0, n.r6)(
																	String(
																		L.sales_appointment_details
																			.appointment_datetime
																	)
															  )
															: "—",
														" \xb7 ",
														String(
															L.sales_appointment_details
																?.appointment_type ||
																"Showroom Appointment"
														),
													],
												}),
												(0, s.jsx)(b.$, {
													variant: "outline",
													size: "sm",
													onClick: () =>
														p("crm-sales-appointment-detail", {
															id: eU.appointment,
														}),
													children: "Open full appointment record",
												}),
											],
										}),
									],
							  })
							: null,
						eU.quotation
							? (0, s.jsxs)(j.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(j.aR, {
											children: (0, s.jsx)(j.ZB, {
												className: "text-base",
												children: "Official quotation tracking",
											}),
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-3",
											children: [
												(0, s.jsxs)("div", {
													className:
														"flex flex-wrap items-center gap-2 text-sm",
													children: [
														(0, s.jsxs)(b.$, {
															variant: "outline",
															onClick: () =>
																p("crm-quotation-detail", {
																	id: eU.quotation,
																}),
															children: ["Open ", eU.quotation],
														}),
														(0, s.jsxs)(b.$, {
															variant: "outline",
															onClick: () => el(!0),
															children: [
																(0, s.jsx)(A.A, {
																	className: "mr-2 h-4 w-4",
																}),
																"Send to Customer",
															],
														}),
														(0, s.jsxs)("span", {
															className:
																"rounded-full bg-muted px-3 py-1",
															children: [
																"Version ",
																String(L.quotation_version || 1),
															],
														}),
														(0, s.jsx)("span", {
															className:
																"rounded-full bg-primary/10 px-3 py-1 text-primary",
															children: String(
																L.quotation_customer_status ||
																	"Draft"
															),
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "flex flex-wrap gap-2",
													children: [
														[
															"Sent",
															"Viewed",
															"Accepted",
															"Rejected",
														].map((e) =>
															(0, s.jsxs)(
																b.$,
																{
																	size: "sm",
																	variant: "outline",
																	disabled: P,
																	onClick: () => void eG(e),
																	children: ["Mark ", e],
																},
																e
															)
														),
														(0, s.jsx)(b.$, {
															size: "sm",
															variant: "outline",
															disabled: P,
															onClick: () => void eK(),
															children: "Reissue Quotation",
														}),
													],
												}),
												L.quotation_rejection_reason
													? (0, s.jsxs)("p", {
															className: "text-sm text-destructive",
															children: [
																"Rejection: ",
																String(
																	L.quotation_rejection_reason
																),
															],
													  })
													: null,
											],
										}),
									],
							  })
							: null,
						eU.booking
							? (0, s.jsxs)(j.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(j.aR, {
											children: (0, s.jsx)(j.ZB, {
												className: "text-base",
												children: "Vehicle allocation",
											}),
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-3",
											children: [
												(0, s.jsxs)("div", {
													className: "flex flex-wrap gap-2 text-sm",
													children: [
														(0, s.jsxs)(b.$, {
															variant: "outline",
															onClick: () =>
																eP("DMS CRM Booking", eU.booking),
															children: ["Open ", eU.booking],
														}),
														eU.allocatedVin
															? (0, s.jsxs)("span", {
																	className:
																		"rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700",
																	children: [
																		"Allocated ",
																		eU.allocatedVin,
																	],
															  })
															: (0, s.jsx)("span", {
																	className:
																		"rounded-full bg-amber-500/15 px-3 py-1 text-amber-700",
																	children: "Allocation pending",
															  }),
														eU.deliveryReadiness
															? (0, s.jsx)(b.$, {
																	variant: "outline",
																	onClick: () =>
																		p(
																			"crm-delivery-readiness-detail",
																			{
																				id: eU.deliveryReadiness,
																			}
																		),
																	children: "Delivery readiness",
															  })
															: null,
													],
												}),
												((e = eL?.status_summary || {}),
												(t = eL?.history || []),
												(a = eL?.booking || {}),
												eU.allocatedVin || Object.keys(e).length
													? (0, s.jsxs)("div", {
															className:
																"grid gap-2 rounded-xl border border-border/70 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4",
															children: [
																(0, s.jsxs)("div", {
																	children: [
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children: "Location",
																		}),
																		(0, s.jsx)("p", {
																			children: String(
																				e.vehicle_location ||
																					"—"
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	children: [
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children: "Payment",
																		}),
																		(0, s.jsx)("p", {
																			children: String(
																				e.payment_status ||
																					"—"
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	children: [
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children:
																				"Documentation",
																		}),
																		(0, s.jsx)("p", {
																			children: String(
																				e.documentation_status ||
																					"—"
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	children: [
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children: "PDI",
																		}),
																		(0, s.jsx)("p", {
																			children: String(
																				e.pdi_status || "—"
																			),
																		}),
																	],
																}),
																t.length
																	? (0, s.jsxs)("div", {
																			className:
																				"sm:col-span-2 lg:col-span-4",
																			children: [
																				(0, s.jsx)("p", {
																					className:
																						"mb-1 text-xs text-muted-foreground",
																					children:
																						"Allocation history",
																				}),
																				(0, s.jsx)("ul", {
																					className:
																						"space-y-1 text-xs text-muted-foreground",
																					children: t
																						.slice(-5)
																						.reverse()
																						.map(
																							(
																								e,
																								t
																							) =>
																								(0,
																								s.jsxs)(
																									"li",
																									{
																										children:
																											[
																												String(
																													e.action_on ||
																														""
																												),
																												" \xb7 ",
																												String(
																													e.action
																												),
																												" \xb7",
																												" ",
																												String(
																													e.from_vin ||
																														"—"
																												),
																												" → ",
																												String(
																													e.to_vin ||
																														"—"
																												),
																												e.approved_by
																													? ` \xb7 approved by ${String(
																															e.approved_by
																													  )}`
																													: "",
																											],
																									},
																									`${e.action}-${t}`
																								)
																						),
																				}),
																			],
																	  })
																	: null,
																a.allocation_switch_requested
																	? (0, s.jsxs)("div", {
																			className:
																				"sm:col-span-2 lg:col-span-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-amber-800",
																			children: [
																				"Switch requested: ",
																				String(
																					a.allocation_switch_reason ||
																						"—"
																				),
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"mt-2 flex flex-wrap gap-2",
																						children: [
																							(0,
																							s.jsx)(
																								b.$,
																								{
																									size: "sm",
																									disabled:
																										e_,
																									onClick:
																										() =>
																											void e2(
																												!0
																											),
																									children:
																										"Approve switch",
																								}
																							),
																							(0,
																							s.jsx)(
																								b.$,
																								{
																									size: "sm",
																									variant:
																										"outline",
																									disabled:
																										e_,
																									onClick:
																										() =>
																											void e2(
																												!1
																											),
																									children:
																										"Reject",
																								}
																							),
																						],
																					}
																				),
																			],
																	  })
																	: null,
															],
													  })
													: null),
												eU.allocatedVin
													? (0, s.jsxs)("div", {
															className: "space-y-3",
															children: [
																(0, s.jsxs)("div", {
																	className:
																		"grid gap-3 sm:grid-cols-2",
																	children: [
																		(0, s.jsx)(y.p, {
																			placeholder:
																				"Switch reason (required)",
																			value: ey,
																			onChange: (e) =>
																				ef(e.target.value),
																		}),
																		(0, s.jsx)(x.Zi, {
																			options: (
																				eI || []
																			).map((e) => ({
																				value: String(
																					e.name
																				),
																				label: String(
																					e.vin_number ||
																						e.name
																				),
																				description: [
																					e.linked_item,
																					e.location,
																				]
																					.filter(
																						Boolean
																					)
																					.join(
																						" \xb7 "
																					),
																			})),
																			value: eN,
																			onValueChange: (e) =>
																				eS(e || ""),
																			onSearchChange: eb,
																			isLoading: eZ,
																			placeholder:
																				"New VIN (optional until approve)…",
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className:
																		"flex flex-wrap gap-2",
																	children: [
																		(0, s.jsx)(b.$, {
																			variant: "outline",
																			disabled: e_,
																			onClick: () =>
																				void e0(),
																			children:
																				"Request switch",
																		}),
																		(0, s.jsx)(b.$, {
																			variant: "outline",
																			disabled: e_,
																			onClick: () =>
																				void e1(),
																			children:
																				"Release VIN",
																		}),
																	],
																}),
															],
													  })
													: (0, s.jsxs)("div", {
															className:
																"grid gap-3 sm:grid-cols-[1fr_auto]",
															children: [
																(0, s.jsx)(x.Zi, {
																	options: (eI || []).map(
																		(e) => ({
																			value: String(e.name),
																			label: String(
																				e.vin_number ||
																					e.name
																			),
																			description: [
																				e.linked_item,
																				e.location,
																				e.model_name,
																			]
																				.filter(Boolean)
																				.join(" \xb7 "),
																		})
																	),
																	value: eh,
																	onValueChange: (e) =>
																		eg(e || ""),
																	onSearchChange: eb,
																	isLoading: eZ,
																	placeholder:
																		"Search in-stock VIN…",
																}),
																(0, s.jsxs)(b.$, {
																	onClick: () => void eX(),
																	disabled: e_ || !eh,
																	children: [
																		e_
																			? (0, s.jsx)($.A, {
																					className:
																						"mr-2 h-4 w-4 animate-spin",
																			  })
																			: null,
																		"Allocate",
																	],
																}),
															],
													  }),
											],
										}),
									],
							  })
							: null,
						"Won" === W.stage || "Won" === W.status
							? (0, s.jsxs)(j.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(j.aR, {
											children: (0, s.jsx)(j.ZB, {
												className: "text-base",
												children: "Ownership journey",
											}),
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-3",
											children: [
												(0, s.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children:
														"Welcome call, experience check, first-service, retention and anniversary tasks are created automatically. Record the 7-day experience score to unlock a referral request (only when score ≥ 4).",
												}),
												(0, s.jsxs)("div", {
													className: "flex flex-wrap items-end gap-2",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"text-xs text-muted-foreground",
																	children:
																		"Experience score (1–5)",
																}),
																(0, s.jsx)(y.p, {
																	type: "number",
																	min: 1,
																	max: 5,
																	className: "w-28",
																	value: ek,
																	onChange: (e) =>
																		eC(e.target.value),
																}),
															],
														}),
														(0, s.jsx)(b.$, {
															onClick: () => void e4(),
															children: "Record experience",
														}),
														(0, s.jsx)(b.$, {
															variant: "outline",
															onClick: () => p("crm-activities"),
															children: "Open activities",
														}),
													],
												}),
											],
										}),
									],
							  })
							: null,
						et
							? (0, s.jsxs)(j.Zp, {
									className: "border-primary/40 shadow-sm",
									children: [
										(0, s.jsx)(j.aR, {
											children: (0, s.jsx)(j.ZB, {
												className: "text-base",
												children:
													"appointment" === et
														? "Schedule Sales Appointment"
														: "test-drive" === et
														? "Schedule Test Drive"
														: "booking" === et
														? "Create Booking / Sales Order"
														: "Create Sales Invoice",
											}),
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-4",
											children: [
												"appointment" === et
													? (0, s.jsxs)("div", {
															className: "grid gap-4 sm:grid-cols-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Date & time",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "datetime-local",
																			value: ed.appointment_datetime,
																			onChange: (e) =>
																				ec((t) => ({
																					...t,
																					appointment_datetime:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children: "Type",
																		}),
																		(0, s.jsx)("select", {
																			className:
																				"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
																			value: ed.appointment_type,
																			onChange: (e) =>
																				ec((t) => ({
																					...t,
																					appointment_type:
																						e.target
																							.value,
																				})),
																			children: [
																				"Showroom Appointment",
																				"Sales Consultation",
																				"Vehicle Viewing",
																				"Document Review",
																				"Finance Consultation",
																			].map((e) =>
																				(0, s.jsx)(
																					"option",
																					{
																						children:
																							e,
																					},
																					e
																				)
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Duration (minutes)",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "number",
																			value: ed.duration_minutes,
																			onChange: (e) =>
																				ec((t) => ({
																					...t,
																					duration_minutes:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children: "Agenda",
																		}),
																		(0, s.jsx)(y.p, {
																			value: ed.agenda,
																			onChange: (e) =>
																				ec((t) => ({
																					...t,
																					agenda: e
																						.target
																						.value,
																				})),
																		}),
																	],
																}),
															],
													  })
													: null,
												"test-drive" === et
													? (0, s.jsxs)("div", {
															className: "grid gap-4 sm:grid-cols-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Date & time",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "datetime-local",
																			value: em.scheduled_datetime,
																			onChange: (e) =>
																				eu((t) => ({
																					...t,
																					scheduled_datetime:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Test Vehicle VIN",
																		}),
																		(0, s.jsx)(g.k, {
																			value: em.vehicle_vin,
																			onValueChange: (e) =>
																				eu((t) => ({
																					...t,
																					vehicle_vin:
																						e || "",
																				})),
																			customer:
																				W.customer ||
																				void 0,
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Driver Name",
																		}),
																		(0, s.jsx)(v.t, {
																			value: em.driver,
																			valueLabel:
																				em.driver_name,
																			onValueChange: (
																				e,
																				t,
																				a
																			) =>
																				eu((s) => ({
																					...s,
																					driver:
																						e || "",
																					driver_name:
																						t || "",
																					driver_license:
																						a?.license ||
																						"",
																					issuing_date:
																						a?.issuingDate ||
																						"",
																					expiry_date:
																						a?.expiryDate ||
																						"",
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Driver Licence",
																		}),
																		(0, s.jsx)(y.p, {
																			value: em.driver_license,
																			onChange: (e) =>
																				eu((t) => ({
																					...t,
																					driver_license:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Issuing Date",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "date",
																			value: em.issuing_date,
																			onChange: (e) =>
																				eu((t) => ({
																					...t,
																					issuing_date:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Expiry Date",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "date",
																			value: em.expiry_date,
																			onChange: (e) =>
																				eu((t) => ({
																					...t,
																					expiry_date:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
															],
													  })
													: "booking" === et
													? (0, s.jsxs)("div", {
															className: "grid gap-4 sm:grid-cols-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Deposit amount",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "number",
																			min: 0,
																			value: ep.deposit_amount,
																			onChange: (e) =>
																				ex((t) => ({
																					...t,
																					deposit_amount:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Receipt reference",
																		}),
																		(0, s.jsx)(y.p, {
																			value: ep.receipt_reference,
																			onChange: (e) =>
																				ex((t) => ({
																					...t,
																					receipt_reference:
																						e.target
																							.value,
																				})),
																			placeholder:
																				"Required to confirm a paid deposit",
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Booking expiry",
																		}),
																		(0, s.jsx)(y.p, {
																			type: "date",
																			value: ep.booking_expiry,
																			onChange: (e) =>
																				ex((t) => ({
																					...t,
																					booking_expiry:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Factory order reference",
																		}),
																		(0, s.jsx)(y.p, {
																			value: ep.factory_order_reference,
																			onChange: (e) =>
																				ex((t) => ({
																					...t,
																					factory_order_reference:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className:
																		"space-y-2 sm:col-span-2",
																	children: [
																		(0, s.jsx)("label", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children:
																				"Booking expiry / cancellation terms",
																		}),
																		(0, s.jsx)(f.T, {
																			value: ep.cancellation_terms,
																			onChange: (e) =>
																				ex((t) => ({
																					...t,
																					cancellation_terms:
																						e.target
																							.value,
																				})),
																		}),
																	],
																}),
															],
													  })
													: "appointment" !== et &&
													  (0, s.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children:
																"booking" === et
																	? "This submits the Quotation and creates a draft standard Sales Order as the booking record."
																	: "This submits the Sales Order and creates a draft Sales Invoice. Won remains locked until the invoice is submitted with Update Stock.",
													  }),
												(0, s.jsxs)("div", {
													className: "flex justify-end gap-2",
													children: [
														(0, s.jsx)(b.$, {
															variant: "outline",
															onClick: () => ea(""),
															disabled: ez,
															children: "Cancel",
														}),
														(0, s.jsxs)(b.$, {
															onClick: () => void eH(et),
															disabled:
																ez ||
																("appointment" === et &&
																	!ed.appointment_datetime) ||
																("test-drive" === et &&
																	!em.scheduled_datetime),
															children: [
																P
																	? (0, s.jsx)($.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Create",
															],
														}),
													],
												}),
											],
										}),
									],
							  })
							: null,
						(0, s.jsxs)(j.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsx)(j.aR, {
									children: (0, s.jsx)(j.ZB, {
										className: "text-base",
										children: "Pipeline",
									}),
								}),
								(0, s.jsxs)(j.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Stage",
												}),
												(0, s.jsx)(y.p, { value: W.stage, readOnly: !0 }),
												(0, s.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children:
														"Stage advances only when its linked business document is created.",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Status",
												}),
												(0, s.jsx)(x.Zi, {
													options: eR,
													value: W.status,
													onValueChange: (e) =>
														eM("status", e || "Open"),
													placeholder: "Status…",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Probability %",
												}),
												(0, s.jsx)(y.p, {
													type: "number",
													value: W.probability,
													onChange: (e) =>
														eM("probability", e.target.value),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Expected close",
												}),
												(0, s.jsx)(y.p, {
													type: "date",
													value: W.expected_close_date,
													onChange: (e) =>
														eM("expected_close_date", e.target.value),
												}),
											],
										}),
										("Lost" === W.stage || "Lost" === W.status) &&
											(0, s.jsxs)(s.Fragment, {
												children: [
													(0, s.jsxs)("div", {
														className: "space-y-2 sm:col-span-2",
														children: [
															(0, s.jsx)("label", {
																className:
																	"block text-xs font-medium text-muted-foreground",
																children: "Lost reason *",
															}),
															(0, s.jsx)(y.p, {
																value: W.lost_reason,
																onChange: (e) =>
																	eM(
																		"lost_reason",
																		e.target.value
																	),
															}),
														],
													}),
													(0, s.jsxs)("div", {
														className: "space-y-2",
														children: [
															(0, s.jsx)("label", {
																className:
																	"block text-xs font-medium text-muted-foreground",
																children: "Competitor",
															}),
															(0, s.jsx)(y.p, {
																value: W.competitor,
																onChange: (e) =>
																	eM(
																		"competitor",
																		e.target.value
																	),
															}),
														],
													}),
												],
											}),
									],
								}),
							],
						}),
						(0, s.jsxs)(j.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsx)(j.aR, {
									children: (0, s.jsx)(j.ZB, {
										className: "text-base",
										children: "Deal details",
									}),
								}),
								(0, s.jsxs)(j.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, s.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Title *",
												}),
												(0, s.jsx)(y.p, {
													value: W.title,
													onChange: (e) => eM("title", e.target.value),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer",
												}),
												(0, s.jsx)(d.L, {
													value: W.customer,
													onValueChange: (e) => eM("customer", e || ""),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Company",
												}),
												(0, s.jsx)(x.Zi, {
													options: eO,
													value: W.company,
													onValueChange: (e) =>
														Q((t) => ({
															...t,
															company: e || "",
															branch: "",
														})),
													placeholder: "Company…",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Branch",
												}),
												(0, s.jsx)(x.Zi, {
													options: (eB || []).map((e) => ({
														value: e.name,
														label: e.branch || e.name,
													})),
													value: W.branch,
													onValueChange: (e) => eM("branch", e || ""),
													placeholder: "Branch…",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type",
												}),
												(0, s.jsx)(x.Zi, {
													options: eV,
													value: W.opportunity_type,
													onValueChange: (e) =>
														eM("opportunity_type", e || ""),
													placeholder: "Type…",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Opportunity amount",
												}),
												(0, s.jsx)(y.p, {
													type: "number",
													value: W.expected_value,
													onChange: (e) =>
														eM("expected_value", e.target.value),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Brand",
												}),
												(0, s.jsx)(c.k, {
													value: W.brand,
													onValueChange: (e) =>
														Q((t) => ({
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
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Model",
												}),
												(0, s.jsx)(u.I, {
													value: W.model,
													brand: W.brand || void 0,
													onValueChange: (e, t) =>
														Q((a) => ({
															...a,
															model: e || "",
															brand: a.brand || t?.brand || "",
														})),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Color",
												}),
												(0, s.jsx)(m.s, {
													value: W.preferred_color,
													onValueChange: (e) => eM("preferred_color", e),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Quotation validity",
												}),
												(0, s.jsx)(y.p, {
													type: "date",
													value: W.quotation_validity,
													onChange: (e) =>
														eM("quotation_validity", e.target.value),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Next action",
												}),
												(0, s.jsx)(y.p, {
													value: W.next_action,
													onChange: (e) =>
														eM("next_action", e.target.value),
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Next action due",
												}),
												(0, s.jsx)(y.p, {
													type: "datetime-local",
													value: W.next_action_due,
													onChange: (e) =>
														eM("next_action_due", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(j.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsxs)(j.aR, {
									children: [
										(0, s.jsx)(j.ZB, {
											className: "text-base",
											children: "Spare parts",
										}),
										(0, s.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children:
												"Add accessories or spare parts only. The vehicle line is taken from the completed test drive when you create the quotation.",
										}),
									],
								}),
								(0, s.jsxs)(j.Wu, {
									className: "space-y-3",
									children: [
										W.items.map((e, t) =>
											(0, s.jsxs)(
												"div",
												{
													className:
														"grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-12",
													children: [
														(0, s.jsx)("div", {
															className: "sm:col-span-5",
															children: (0, s.jsx)(h, {
																value: e.item_code,
																valueLabel:
																	e.item_name || e.item_code,
																onValueChange: (a, s) =>
																	eW(t, {
																		item_code: a || "",
																		item_name:
																			s?.item_name || "",
																		uom: s?.uom || "",
																		rate: Number(
																			s?.rate ?? e.rate ?? 0
																		),
																	}),
																placeholder: "Search spare part…",
															}),
														}),
														(0, s.jsx)("div", {
															className: "sm:col-span-2",
															children: (0, s.jsx)(y.p, {
																type: "number",
																value: e.qty,
																onChange: (e) =>
																	eW(t, {
																		qty: Number(
																			e.target.value || 0
																		),
																	}),
																placeholder: "Qty",
															}),
														}),
														(0, s.jsx)("div", {
															className: "sm:col-span-2",
															children: (0, s.jsx)(y.p, {
																type: "number",
																value: e.rate,
																onChange: (e) =>
																	eW(t, {
																		rate: Number(
																			e.target.value || 0
																		),
																	}),
																placeholder: "Rate",
															}),
														}),
														(0, s.jsx)("div", {
															className: "sm:col-span-2",
															children: (0, s.jsx)(y.p, {
																type: "number",
																value: e.discount_percentage || 0,
																onChange: (e) =>
																	eW(t, {
																		discount_percentage:
																			Number(
																				e.target.value || 0
																			),
																	}),
																placeholder: "Disc %",
															}),
														}),
														(0, s.jsx)("div", {
															className:
																"flex items-center justify-end sm:col-span-1",
															children: (0, s.jsx)(b.$, {
																type: "button",
																variant: "ghost",
																size: "icon",
																onClick: () =>
																	Q((e) => {
																		let a = e.items.filter(
																			(e, a) => a !== t
																		);
																		return {
																			...e,
																			items: a.length
																				? a
																				: [V()],
																		};
																	}),
																children: (0, s.jsx)(D.A, {
																	className: "h-4 w-4",
																}),
															}),
														}),
													],
												},
												`${e.item_code}-${t}`
											)
										),
										(0, s.jsx)(_._, {
											onClick: () =>
												Q((e) => ({ ...e, items: [...e.items, V()] })),
											label: "Add spare part",
										}),
									],
								}),
							],
						}),
						K
							? (0, s.jsxs)(j.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsxs)(j.aR, {
											className:
												"flex flex-row items-center justify-between",
											children: [
												(0, s.jsx)(j.ZB, {
													className: "text-base",
													children: "Fleet / Tender",
												}),
												W.account
													? (0, s.jsx)(b.$, {
															size: "sm",
															variant: "outline",
															onClick: () =>
																p("crm-account-detail", {
																	id: W.account,
																}),
															children: "Open account",
													  })
													: null,
											],
										}),
										(0, s.jsxs)(j.Wu, {
											className: "space-y-4",
											children: [
												(0, s.jsxs)("div", {
													className: "grid gap-4 sm:grid-cols-2",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children: "Account",
																}),
																(0, s.jsx)(x.Zi, {
																	options: (X?.data || []).map(
																		(e) => ({
																			value: String(e.name),
																			label: String(
																				e.account_name ||
																					e.name
																			),
																			description: String(
																				e.customer_name ||
																					e.customer ||
																					""
																			),
																		})
																	),
																	value: W.account,
																	onValueChange: (e) =>
																		eM("account", e || ""),
																	onSearchChange: Y,
																	placeholder:
																		"Corporate account…",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children: "Tender",
																}),
																(0, s.jsx)(x.Zi, {
																	options: (ee?.data || []).map(
																		(e) => ({
																			value: String(e.name),
																			label: String(
																				e.title || e.name
																			),
																			description: String(
																				e.customer_name ||
																					e.status ||
																					""
																			),
																		})
																	),
																	value: W.tender,
																	onValueChange: (e) =>
																		eM("tender", e || ""),
																	onSearchChange: G,
																	placeholder: "Linked tender…",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children:
																		"Framework agreement",
																}),
																(0, s.jsx)(y.p, {
																	value: W.framework_agreement,
																	onChange: (e) =>
																		eM(
																			"framework_agreement",
																			e.target.value
																		),
																	placeholder: "CRM-FA-…",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children: "Bid deadline",
																}),
																(0, s.jsx)(y.p, {
																	type: "datetime-local",
																	value: W.bid_deadline,
																	onChange: (e) =>
																		eM(
																			"bid_deadline",
																			e.target.value
																		),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children: "Financing / LC",
																}),
																(0, s.jsx)(x.Zi, {
																	options: [
																		"Cash",
																		"Bank Finance",
																		"Lease",
																		"LC",
																		"Company Purchase",
																		"Other",
																	].map((e) => ({
																		value: e,
																		label: e,
																	})),
																	value: W.financing_method,
																	onValueChange: (e) =>
																		eM(
																			"financing_method",
																			e || ""
																		),
																	placeholder: "Financing…",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2 sm:col-span-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children:
																		"Delivery schedule (batch / location)",
																}),
																(0, s.jsx)(f.T, {
																	rows: 2,
																	value: W.delivery_schedule_notes,
																	onChange: (e) =>
																		eM(
																			"delivery_schedule_notes",
																			e.target.value
																		),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2 sm:col-span-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children: "Aftersales package",
																}),
																(0, s.jsx)(f.T, {
																	rows: 2,
																	value: W.aftersales_package_notes,
																	onChange: (e) =>
																		eM(
																			"aftersales_package_notes",
																			e.target.value
																		),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2 sm:col-span-2",
															children: [
																(0, s.jsx)("label", {
																	className:
																		"block text-xs font-medium text-muted-foreground",
																	children:
																		"Body-building / conversion",
																}),
																(0, s.jsx)(f.T, {
																	rows: 2,
																	value: W.special_conversion_notes,
																	onChange: (e) =>
																		eM(
																			"special_conversion_notes",
																			e.target.value
																		),
																}),
															],
														}),
													],
												}),
												(0, s.jsx)("p", {
													className: "text-sm font-medium",
													children: "Fleet requirements",
												}),
												W.fleet_requirements.map((e, t) =>
													(0, s.jsxs)(
														"div",
														{
															className:
																"grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-6",
															children: [
																(0, s.jsx)("div", {
																	className: "sm:col-span-2",
																	children: (0, s.jsx)(u.I, {
																		value: e.model,
																		onValueChange: (e) =>
																			Q((a) => {
																				let s = [
																					...a.fleet_requirements,
																				];
																				return (
																					(s[t] = {
																						...s[t],
																						model:
																							e ||
																							"",
																					}),
																					{
																						...a,
																						fleet_requirements:
																							s,
																					}
																				);
																			}),
																		placeholder: "Model…",
																	}),
																}),
																(0, s.jsx)(y.p, {
																	className: "sm:col-span-2",
																	placeholder: "Specification",
																	value: e.specification,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					specification:
																						e.target
																							.value,
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
																(0, s.jsx)(y.p, {
																	type: "number",
																	placeholder: "Qty",
																	value: e.quantity,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					quantity:
																						Number(
																							e
																								.target
																								.value ||
																								1
																						),
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
																(0, s.jsx)(b.$, {
																	variant: "ghost",
																	size: "icon",
																	onClick: () =>
																		Q((e) => {
																			let a =
																				e.fleet_requirements.filter(
																					(e, a) =>
																						a !== t
																				);
																			return {
																				...e,
																				fleet_requirements:
																					a.length
																						? a
																						: [O()],
																			};
																		}),
																	children: (0, s.jsx)(D.A, {
																		className: "h-4 w-4",
																	}),
																}),
																(0, s.jsx)(y.p, {
																	placeholder:
																		"Delivery location",
																	value: e.delivery_location,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					delivery_location:
																						e.target
																							.value,
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
																(0, s.jsx)(y.p, {
																	placeholder: "Batch",
																	value: e.delivery_batch,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					delivery_batch:
																						e.target
																							.value,
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
																(0, s.jsx)(y.p, {
																	type: "date",
																	value: e.delivery_date,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					delivery_date:
																						e.target
																							.value,
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
																(0, s.jsx)(y.p, {
																	className: "sm:col-span-3",
																	placeholder:
																		"Body-building notes",
																	value: e.body_building_notes,
																	onChange: (e) =>
																		Q((a) => {
																			let s = [
																				...a.fleet_requirements,
																			];
																			return (
																				(s[t] = {
																					...s[t],
																					body_building_notes:
																						e.target
																							.value,
																				}),
																				{
																					...a,
																					fleet_requirements:
																						s,
																				}
																			);
																		}),
																}),
															],
														},
														t
													)
												),
												(0, s.jsx)(_._, {
													onClick: () =>
														Q((e) => ({
															...e,
															fleet_requirements: [
																...e.fleet_requirements,
																O(),
															],
														})),
													label: "Add line",
												}),
											],
										}),
									],
							  })
							: null,
						(0, s.jsxs)(S.h, {
							children: [
								(0, s.jsx)(b.$, {
									variant: "outline",
									onClick: () => p("crm-opportunities"),
									disabled: ez,
									children: "Back",
								}),
								(0, s.jsxs)(b.$, {
									variant: "outline",
									onClick: eE,
									disabled: ez,
									children: [
										E
											? (0, s.jsx)($.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Save",
									],
								}),
								e3
									? (0, s.jsxs)(b.$, {
											onClick: () => {
												"open-test-drive" === e3.action
													? p("crm-test-drive-detail", {
															id: eU.testDrive,
													  })
													: "open-quotation" === e3.action
													? p("crm-quotation-detail", {
															id: eU.quotation,
													  })
													: "allocate" === e3.action ||
													  ("delivery-readiness" === e3.action
															? e5()
															: "open-delivery-readiness" ===
															  e3.action
															? p("crm-delivery-readiness-detail", {
																	id: eU.deliveryReadiness,
															  })
															: "quotation" === e3.action
															? en(!0)
															: [
																	"appointment",
																	"test-drive",
																	"booking",
																	"invoice",
															  ].includes(e3.action)
															? ea(e3.action)
															: eH(e3.action));
											},
											disabled: ez,
											children: [
												P
													? (0, s.jsx)($.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												e3.label,
											],
									  })
									: null,
							],
						}),
						(0, s.jsx)(w.H, {
							open: es,
							onOpenChange: en,
							opportunityId: Z,
							dealPayload: eQ(),
							onError: eA,
							onCreated: (e) => {
								M().then(() => {
									e$(
										`Quotation ${e} created. Find it under Quotations to view or send it.`
									);
								});
							},
						}),
						(0, s.jsx)(q.J, {
							open: ei,
							onOpenChange: el,
							quotationId: eU.quotation,
							customer: {
								name: String(W.customer || eo?.party_name || ""),
								display: String(
									eo?.customer_display || W.customer || eo?.party_name || ""
								),
								email: String(eo?.customer_email || eo?.contact_email || ""),
								phone: String(eo?.customer_mobile || eo?.contact_mobile || ""),
							},
						}),
					],
				});
			}
		},
		52959: (e, t, a) => {
			a.d(t, { _: () => r });
			var s = a(95155),
				n = a(4474),
				i = a(51914),
				l = a(91337);
			function r({ onClick: e, label: t = "Add", className: a, disabled: o }) {
				return (0, s.jsx)("div", {
					className: (0, l.cn)("pt-1", a),
					children: (0, s.jsxs)(n.$, {
						type: "button",
						onClick: e,
						disabled: o,
						children: [(0, s.jsx)(i.A, { className: "h-4 w-4 mr-1" }), t],
					}),
				});
			}
		},
		65584: (e, t, a) => {
			a.d(t, { O: () => l });
			var s = a(95155),
				n = a(94514),
				i = a(91337);
			function l({
				stages: e,
				current: t,
				reached: a,
				checked: r = [],
				terminal: o = !1,
				onSelect: d,
				trailing: c,
			}) {
				let m = Math.max(e.indexOf(t), e.indexOf(a || t));
				return (0, s.jsx)("div", {
					className: "overflow-x-auto pb-1",
					children: (0, s.jsxs)("div", {
						className: "flex min-w-max w-full items-center",
						children: [
							e.map((a, l) => {
								let c = m >= 0 && l < m,
									u = r.includes(a),
									p = a === t && !u,
									x = !u && (m < 0 || l > m);
								return (0, s.jsxs)(
									"div",
									{
										className: "flex items-center",
										children: [
											(0, s.jsxs)("button", {
												type: "button",
												disabled: !d,
												onClick: () => d?.(a),
												className: (0, i.cn)(
													"flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
													(c || u) &&
														"border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
													p &&
														!o &&
														"border-primary bg-primary text-primary-foreground",
													p &&
														o &&
														"border-destructive bg-destructive text-destructive-foreground",
													x &&
														!p &&
														"border-border bg-muted/40 text-muted-foreground",
													!p &&
														!c &&
														!x &&
														l === m &&
														"border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
													d && "cursor-pointer hover:border-primary"
												),
												children: [
													(0, s.jsx)("span", {
														className: (0, i.cn)(
															"grid h-5 w-5 place-items-center rounded-full border text-[10px]",
															(c || u || (!p && l === m)) &&
																"border-emerald-600 bg-emerald-600 text-white",
															p && "border-current",
															x && !p && "border-muted-foreground/40"
														),
														children:
															c || u || (!p && l === m)
																? (0, s.jsx)(n.A, {
																		className: "h-3 w-3",
																  })
																: l + 1,
													}),
													a,
												],
											}),
											l < e.length - 1
												? (0, s.jsx)("div", {
														className: (0, i.cn)(
															"h-0.5 w-5",
															m > l ? "bg-emerald-500" : "bg-border"
														),
												  })
												: null,
										],
									},
									a
								);
							}),
							c
								? (0, s.jsx)("div", {
										className:
											"ml-auto flex items-center gap-2 border-l border-border pl-3",
										children: c,
								  })
								: null,
						],
					}),
				});
			}
		},
		81672: (e, t, a) => {
			a.d(t, { Ge: () => m, N0: () => d, Yq: () => r, gQ: () => c, r6: () => o });
			let s = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				n = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				i = (e) => String(e).padStart(2, "0");
			function l(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let a = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (a) return new Date(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
				let s = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(s.getTime()) ? null : s;
			}
			function r(e, t = "") {
				let a = l(e);
				return a ? `${i(a.getDate())}/${i(a.getMonth() + 1)}/${a.getFullYear()}` : t;
			}
			function o(e, t = "", a = !1) {
				let s = l(e);
				if (!s) return t;
				let n = `${i(s.getHours())}:${i(s.getMinutes())}${
					a ? `:${i(s.getSeconds())}` : ""
				}`;
				return `${r(s)} ${n}`;
			}
			function d(e, t = "") {
				let a = l(e);
				return a ? `${s[a.getMonth()]} ${a.getFullYear()}` : t;
			}
			function c(e, t = "") {
				let a = l(e);
				return a ? n[a.getDay()] : t;
			}
			function m(e, t = "") {
				let a = l(e);
				return a ? `${n[a.getDay()]}, ${r(a)}` : t;
			}
		},
		98790: (e, t, a) => {
			a.d(t, { J: () => u });
			var s = a(95155),
				n = a(9089),
				i = a(92289),
				l = a(4474),
				r = a(74350),
				o = a(91337);
			function d({ className: e }) {
				return (0, s.jsxs)("svg", {
					viewBox: "0 0 24 24",
					className: e,
					"aria-hidden": "true",
					fill: "currentColor",
					children: [
						(0, s.jsx)("path", {
							d: "M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.16.16-1.28-.07-.11-.25-.18-.52-.32z",
						}),
						(0, s.jsx)("path", {
							d: "M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.45 1.28 4.91L2 22l5.23-1.37A9.96 9.96 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.15c-1.67 0-3.25-.5-4.56-1.35l-.33-.2-3.1.81.83-3.02-.21-.35A8.12 8.12 0 0 1 3.88 12c0-4.5 3.66-8.15 8.16-8.15 4.5 0 8.15 3.65 8.15 8.15 0 4.49-3.65 8.15-8.15 8.15z",
						}),
					],
				});
			}
			function c(e) {
				window.open(e, "_blank", "noopener");
			}
			function m({
				label: e,
				description: t,
				disabled: a,
				onClick: n,
				className: i,
				children: l,
			}) {
				return (0, s.jsxs)("button", {
					type: "button",
					disabled: a,
					onClick: n,
					className: (0, o.cn)(
						"flex flex-1 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-3 py-4 text-center transition-colors",
						a
							? "cursor-not-allowed opacity-40"
							: "hover:border-primary/40 hover:bg-muted/40"
					),
					children: [
						(0, s.jsx)("span", {
							className: (0, o.cn)(
								"grid h-11 w-11 place-items-center rounded-full text-white shadow-sm",
								a ? "bg-muted text-muted-foreground" : i
							),
							children: l,
						}),
						(0, s.jsx)("span", { className: "text-sm font-medium", children: e }),
						(0, s.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: t,
						}),
					],
				});
			}
			function u({ open: e, onOpenChange: t, quotationId: a, customer: o }) {
				var p, x;
				let h,
					g,
					v,
					b,
					_,
					j,
					y = o.display || o.name || "Customer",
					f =
						((p = a),
						(h = (x = o).display || x.name || "Customer"),
						(g = (x.email || "").trim()),
						(b = (v = (x.phone || "").trim()).replace(/\D/g, "")),
						(_ = encodeURIComponent(`Quotation ${p}`)),
						(j = encodeURIComponent(`Hello ${h},

Please find quotation ${p}.
`)),
						{
							email: g,
							phone: v,
							phoneDigits: b,
							whatsapp: b ? `https://wa.me/${b}?text=${j}` : "",
							sms: b ? `sms:${b}?body=${j}` : "",
							mailto: g ? `mailto:${g}?subject=${_}&body=${j}` : "",
						});
				return (0, s.jsx)(r.lG, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(r.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, s.jsxs)(r.c7, {
								children: [
									(0, s.jsx)(r.L3, { children: "Send to Customer" }),
									(0, s.jsx)(r.rr, {
										children:
											"Uses the customer on this quotation. WhatsApp and SMS need a phone number; email needs an address.",
									}),
								],
							}),
							(0, s.jsxs)("div", {
								className: "rounded-xl border border-border/70 p-3 text-sm",
								children: [
									(0, s.jsx)("p", { className: "font-medium", children: y }),
									o.name && o.name !== y
										? (0, s.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: o.name,
										  })
										: null,
									(0, s.jsx)("p", {
										className: "mt-2 text-muted-foreground",
										children: f.email || "No email on file",
									}),
									(0, s.jsx)("p", {
										className: "text-muted-foreground",
										children: f.phone || "No phone on file",
									}),
								],
							}),
							(0, s.jsxs)("div", {
								className: "flex gap-2",
								children: [
									(0, s.jsx)(m, {
										label: "WhatsApp",
										description: f.phone ? f.phone : "Needs a phone number",
										disabled: !f.whatsapp,
										className: "bg-[#25D366]",
										onClick: () => f.whatsapp && c(f.whatsapp),
										children: (0, s.jsx)(d, { className: "h-5 w-5" }),
									}),
									(0, s.jsx)(m, {
										label: "SMS",
										description: f.phone ? f.phone : "Needs a phone number",
										disabled: !f.sms,
										className: "bg-sky-600",
										onClick: () => f.sms && c(f.sms),
										children: (0, s.jsx)(n.A, { className: "h-5 w-5" }),
									}),
									(0, s.jsx)(m, {
										label: "Email",
										description: f.email || "Needs an email",
										disabled: !f.mailto,
										className: "bg-primary",
										onClick: () => f.mailto && c(f.mailto),
										children: (0, s.jsx)(i.A, { className: "h-5 w-5" }),
									}),
								],
							}),
							(0, s.jsx)(l.$, {
								variant: "outline",
								onClick: () => t(!1),
								children: "Close",
							}),
						],
					}),
				});
			}
		},
	},
]);
