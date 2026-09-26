"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6764],
	{
		12651: (e, a, t) => {
			t.d(a, { A: () => s });
			let s = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, a, t) => {
			t.d(a, { A: () => s });
			let s = (0, t(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		16764: (e, a, t) => {
			t.r(a), t.d(a, { default: () => v });
			var s = t(95155),
				r = t(12115),
				n = t(44855),
				l = t(32144),
				i = t(55833),
				d = t(4474),
				o = t(79984),
				c = t(39658),
				u = t(39540),
				h = t(23511),
				m = t(93108),
				p = t(80723),
				x = t(6296);
			function v() {
				let { navigate: e, viewParams: a } = (0, i.c)(),
					t = a.get("id") || "",
					{
						data: v,
						isLoading: b,
						mutate: j,
					} = (0, n.Ay)(t ? ["crm-delivery-ready", t] : null, () => (0, l.RY)(t)),
					[y, _] = (0, r.useState)({}),
					[f, k] = (0, r.useState)(!1),
					{ error: N, success: S, showError: C, showSuccess: w, clear: A } = (0, m.B)();
				(0, r.useEffect)(() => {
					v && _(v);
				}, [v]);
				let P = y.checklist || [],
					D = (e, a) => _((t) => ({ ...t, [e]: a })),
					R = (e, a) => {
						let t = [...P];
						(t[e] = { ...t[e], ...a }), D("checklist", t);
					},
					q = async (e = !1) => {
						k(!0), A();
						try {
							await (0, l.AR)(t, {
								status: e ? "Ready" : y.status,
								payment_status: y.payment_status,
								documentation_status: y.documentation_status,
								pdi_status: y.pdi_status,
								vehicle_location: y.vehicle_location,
								delivery_appointment: y.delivery_appointment,
								nominated_driver: y.nominated_driver,
								special_requests: y.special_requests,
								handover_on: y.handover_on,
								handover_photos: y.handover_photos,
								blocked_reason: y.blocked_reason,
								satisfaction_score: Number(y.satisfaction_score || 0),
								notes: y.notes,
								checklist: P,
							}),
								e && (await (0, l.f0)(t)),
								await j(),
								w(e ? "Delivery marked ready." : "Delivery readiness saved.");
						} catch (e) {
							C(e, "Failed to update delivery readiness");
						} finally {
							k(!1);
						}
					},
					E = async () => {
						k(!0), A();
						try {
							await (0, l.VC)(t, {
								satisfaction_score: Number(y.satisfaction_score || 0) || void 0,
								handover_on: String(y.handover_on || "") || void 0,
								handover_photos: String(y.handover_photos || "") || void 0,
								notes: String(y.notes || "") || void 0,
							}),
								await j(),
								w("Handover completed — delivery marked Delivered.");
						} catch (e) {
							C(e, "Failed to complete handover");
						} finally {
							k(!1);
						}
					};
				if (b || !v) return (0, s.jsx)(h.E, { className: "h-80" });
				let B = Array.from(new Set(P.map((e) => e.category || "Other")));
				return (0, s.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, s.jsx)(m.y, { error: N, success: S, onDismiss: A }),
						(0, s.jsxs)("div", {
							className: "flex flex-wrap justify-between gap-2",
							children: [
								(0, s.jsxs)(d.$, {
									variant: "outline",
									onClick: () => e("crm-delivery-readiness"),
									children: [
										(0, s.jsx)(p.A, { className: "mr-2 h-4 w-4" }),
										"Delivery Readiness",
									],
								}),
								(0, s.jsxs)("div", {
									className: "flex gap-2",
									children: [
										(0, s.jsxs)(d.$, {
											variant: "outline",
											onClick: () => void q(!1),
											disabled: f,
											children: [
												f
													? (0, s.jsx)(x.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Save",
											],
										}),
										(0, s.jsx)(d.$, {
											variant: "outline",
											onClick: () => void q(!0),
											disabled: f,
											children: "Mark Ready",
										}),
										(0, s.jsx)(d.$, {
											onClick: () => void E(),
											disabled: f,
											children: "Complete Handover",
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(o.Zp, {
							children: [
								(0, s.jsx)(o.aR, {
									children: (0, s.jsxs)(o.ZB, {
										className: "text-base",
										children: [t, " \xb7 ", String(y.status || "Draft")],
									}),
								}),
								(0, s.jsxs)(o.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, s.jsx)(g, {
											label: "Deal",
											children: (0, s.jsx)("button", {
												className: "text-sm text-primary hover:underline",
												onClick: () =>
													e("crm-opportunity-detail", {
														id: String(y.opportunity),
													}),
												children: String(y.opportunity),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Customer",
											children: String(y.customer || "—"),
										}),
										(0, s.jsx)(g, {
											label: "Allocated VIN",
											children: String(y.vehicle_vin || "—"),
										}),
										(0, s.jsx)(g, {
											label: "Vehicle Location",
											children: (0, s.jsx)(c.p, {
												value: String(y.vehicle_location || ""),
												onChange: (e) =>
													D("vehicle_location", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Payment Status",
											children: (0, s.jsx)("select", {
												className:
													"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
												value: String(y.payment_status || "Pending"),
												onChange: (e) =>
													D("payment_status", e.target.value),
												children: [
													"Pending",
													"Deposit Received",
													"Fully Paid",
													"Credit Approved",
												].map((e) =>
													(0, s.jsx)("option", { children: e }, e)
												),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Documentation Status",
											children: (0, s.jsx)("select", {
												className:
													"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
												value: String(y.documentation_status || "Pending"),
												onChange: (e) =>
													D("documentation_status", e.target.value),
												children: [
													"Pending",
													"In Progress",
													"Complete",
												].map((e) =>
													(0, s.jsx)("option", { children: e }, e)
												),
											}),
										}),
										(0, s.jsx)(g, {
											label: "PDI Status",
											children: (0, s.jsx)("select", {
												className:
													"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
												value: String(y.pdi_status || "Not Started"),
												onChange: (e) => D("pdi_status", e.target.value),
												children: [
													"Not Started",
													"In Progress",
													"Passed",
													"Failed",
													"Waived",
												].map((e) =>
													(0, s.jsx)("option", { children: e }, e)
												),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Delivery Appointment",
											children: (0, s.jsx)(c.p, {
												type: "datetime-local",
												value: String(y.delivery_appointment || "").slice(
													0,
													16
												),
												onChange: (e) =>
													D("delivery_appointment", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Nominated Driver",
											children: (0, s.jsx)(c.p, {
												value: String(y.nominated_driver || ""),
												onChange: (e) =>
													D("nominated_driver", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Special Requests",
											children: (0, s.jsx)(u.T, {
												value: String(y.special_requests || ""),
												onChange: (e) =>
													D("special_requests", e.target.value),
											}),
										}),
									],
								}),
							],
						}),
						B.map((e) =>
							(0, s.jsxs)(
								o.Zp,
								{
									children: [
										(0, s.jsx)(o.aR, {
											children: (0, s.jsx)(o.ZB, {
												className: "text-base",
												children: e,
											}),
										}),
										(0, s.jsx)(o.Wu, {
											className: "space-y-2",
											children: P.map((e, a) => ({ row: e, index: a }))
												.filter(
													({ row: a }) => (a.category || "Other") === e
												)
												.map(({ row: e, index: a }) =>
													(0, s.jsxs)(
														"div",
														{
															className:
																"grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_8rem_2fr]",
															children: [
																(0, s.jsxs)("label", {
																	className:
																		"flex items-center gap-2 text-sm",
																	children: [
																		(0, s.jsx)("input", {
																			type: "checkbox",
																			checked:
																				!!e.is_completed,
																			onChange: (e) =>
																				R(a, {
																					is_completed:
																						+!!e.target
																							.checked,
																					result: e
																						.target
																						.checked
																						? "Pass"
																						: "Pending",
																				}),
																		}),
																		(0, s.jsxs)("span", {
																			children: [
																				e.check_item,
																				e.is_mandatory
																					? (0, s.jsx)(
																							"span",
																							{
																								className:
																									"ml-1 text-destructive",
																								children:
																									"*",
																							}
																					  )
																					: null,
																			],
																		}),
																	],
																}),
																(0, s.jsx)("select", {
																	className:
																		"h-9 rounded-md border border-input bg-background px-2 text-sm",
																	value: e.result || "Pending",
																	onChange: (e) =>
																		R(a, {
																			result: e.target.value,
																		}),
																	children: [
																		"Pending",
																		"Pass",
																		"Fail",
																		"N/A",
																	].map((e) =>
																		(0, s.jsx)(
																			"option",
																			{ children: e },
																			e
																		)
																	),
																}),
																(0, s.jsx)(c.p, {
																	placeholder:
																		"Evidence / notes",
																	value: e.notes || "",
																	onChange: (e) =>
																		R(a, {
																			notes: e.target.value,
																		}),
																}),
															],
														},
														`${e.check_item}-${a}`
													)
												),
										}),
									],
								},
								e
							)
						),
						(0, s.jsxs)(o.Zp, {
							children: [
								(0, s.jsx)(o.aR, {
									children: (0, s.jsx)(o.ZB, {
										className: "text-base",
										children: "Handover & CRM",
									}),
								}),
								(0, s.jsxs)(o.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, s.jsx)(g, {
											label: "Actual Handover Time",
											children: (0, s.jsx)(c.p, {
												type: "datetime-local",
												value: String(y.handover_on || "").slice(0, 16),
												onChange: (e) => D("handover_on", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Satisfaction (1-5)",
											children: (0, s.jsx)(c.p, {
												type: "number",
												min: 1,
												max: 5,
												value: String(y.satisfaction_score || ""),
												onChange: (e) =>
													D("satisfaction_score", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Handover Photos (URL / attachment path)",
											children: (0, s.jsx)(c.p, {
												value: String(y.handover_photos || ""),
												onChange: (e) =>
													D("handover_photos", e.target.value),
												placeholder: "/files/handover-…",
											}),
										}),
										(0, s.jsx)(g, {
											label: "Blocked Reason",
											children: (0, s.jsx)(c.p, {
												value: String(y.blocked_reason || ""),
												onChange: (e) =>
													D("blocked_reason", e.target.value),
											}),
										}),
										(0, s.jsx)(g, {
											label: "Internal Notes",
											children: (0, s.jsx)(u.T, {
												value: String(y.notes || ""),
												onChange: (e) => D("notes", e.target.value),
											}),
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function g({ label: e, children: a }) {
				return (0, s.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						(0, s.jsx)("label", {
							className: "text-xs font-medium text-muted-foreground",
							children: e,
						}),
						(0, s.jsx)("div", { children: a }),
					],
				});
			}
		},
		23511: (e, a, t) => {
			t.d(a, { E: () => n });
			var s = t(95155),
				r = t(91337);
			function n({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...a,
				});
			}
		},
		39540: (e, a, t) => {
			t.d(a, { T: () => n });
			var s = t(95155);
			t(12115);
			var r = t(91337);
			function n({ className: e, ...a }) {
				return (0, s.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...a,
				});
			}
		},
		80723: (e, a, t) => {
			t.d(a, { A: () => s });
			let s = (0, t(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		93108: (e, a, t) => {
			t.d(a, { B: () => c, y: () => u });
			var s = t(95155),
				r = t(12115),
				n = t(66609),
				l = t(13545),
				i = t(12651),
				d = t(33210),
				o = t(91337);
			function c() {
				let [e, a] = (0, r.useState)(""),
					[t, s] = (0, r.useState)(""),
					l = (0, r.useCallback)((e, t = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							s(""),
							a(r),
							n.o.error(r, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							r
						);
					}, []);
				return {
					error: e,
					success: t,
					showError: l,
					showSuccess: (0, r.useCallback)((e) => {
						a(""), s(e), n.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						a(""), s("");
					}, []),
				};
			}
			function u({ error: e, success: a, onDismiss: t, className: r }) {
				if (!e && !a) return null;
				let n = !!e;
				return (0, s.jsx)("div", {
					className: (0, o.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, s.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, o.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, s.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, s.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, s.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || a,
							}),
							t
								? (0, s.jsx)("button", {
										type: "button",
										onClick: t,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, s.jsx)(d.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
