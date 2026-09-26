"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[663],
	{
		12651: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		37814: (e, t, a) => {
			a.d(t, { I: () => x });
			var r = a(95155),
				l = a(12115),
				n = a(90901),
				s = a(44855),
				i = a(32144),
				d = a(10086),
				o = a(4474),
				c = a(39658),
				u = a(79792),
				m = a(74350),
				h = a(6296),
				g = a(66609);
			function x({
				value: e,
				onValueChange: t,
				brand: a,
				valueLabel: p,
				placeholder: v,
				disabled: j,
				className: _,
				allowCreate: b = !0,
			}) {
				let { mutate: f } = (0, n.iX)(),
					[C, y] = (0, l.useState)(""),
					[S, N] = (0, l.useState)(p || ""),
					[k, w] = (0, l.useState)(!1),
					[D, A] = (0, l.useState)(!1),
					[T, I] = (0, l.useState)(""),
					[E, F] = (0, l.useState)(""),
					[q, P] = (0, l.useState)("Petrol"),
					[M, V] = (0, l.useState)("Automatic (AT)"),
					[R, Z] = (0, l.useState)(""),
					{ data: $, isLoading: L } = (0, s.Ay)(["crm-link-models", C, a], () =>
						(0, i.FQ)(C || void 0, a || void 0)
					),
					Q = (0, l.useMemo)(
						() =>
							($ || []).map((e) => ({
								value: String(e.name),
								label: String(e.model_name || e.model_code || e.name),
								description:
									[e.model_code, e.variant, e.brand_label || e.brand]
										.filter(Boolean)
										.join(" \xb7 ") || void 0,
								variant: String(e.variant || ""),
								model_name: String(e.model_name || ""),
								brand: String(e.brand || ""),
							})),
						[$]
					),
					B = (e && (S || p)) || Q.find((t) => t.value === e)?.label || void 0,
					O = async () => {
						if (!T.trim()) return void g.o.error("Model name is required");
						A(!0);
						try {
							let e = await (0, i.Zk)({
								model_name: T.trim(),
								brand: a || void 0,
								model_code: E.trim() || void 0,
								fuel_type: q,
								transmission: M,
								variant: R.trim() || void 0,
							});
							await f(
								(e) => Array.isArray(e) && String(e[0]).includes("model"),
								void 0,
								{ revalidate: !0 }
							),
								N(e.label || e.name),
								t(e.name, {
									model_name: e.label,
									variant: R.trim() || void 0,
									brand: a || void 0,
								}),
								w(!1),
								I(""),
								F(""),
								Z(""),
								g.o.success(`Created: ${e.label || e.name}`);
						} catch (e) {
							g.o.error(
								e instanceof Error ? e.message : "Could not create vehicle model"
							);
						} finally {
							A(!1);
						}
					};
				return (0, r.jsxs)(r.Fragment, {
					children: [
						(0, r.jsx)(d.Zi, {
							className: _,
							options: Q,
							value: e,
							valueLabel: B,
							onValueChange: (e) => {
								let a = Q.find((t) => t.value === e);
								N(a?.label || e || ""),
									t(e || "", {
										model_name: a?.model_name,
										variant: a?.variant,
										brand: a?.brand,
									});
							},
							onSearchChange: y,
							placeholder:
								v || (a ? `Search ${a} models…` : "Search vehicle models…"),
							emptyMessage: a
								? "No models for this brand — create one with +"
								: "No vehicle models found",
							isLoading: L,
							disabled: j,
							onCreateNew: b && !j ? () => w(!0) : void 0,
							createNewLabel: "Create vehicle model",
						}),
						(0, r.jsx)(m.lG, {
							open: k,
							onOpenChange: w,
							children: (0, r.jsxs)(m.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, r.jsxs)(m.c7, {
										children: [
											(0, r.jsx)(m.L3, { children: "New vehicle model" }),
											(0, r.jsx)(m.rr, {
												children:
													"Creates the Item + Vehicle Model and selects it on this form.",
											}),
										],
									}),
									(0, r.jsxs)("div", {
										className: "grid gap-3 py-2",
										children: [
											(0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, { children: "Model name *" }),
													(0, r.jsx)(c.p, {
														value: T,
														onChange: (e) => I(e.target.value),
														placeholder: "e.g. Jetour T2",
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, {
														children: "Model code / Item code",
													}),
													(0, r.jsx)(c.p, {
														value: E,
														onChange: (e) => F(e.target.value),
														placeholder: "Defaults to model name",
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Fuel type",
															}),
															(0, r.jsx)("select", {
																className:
																	"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
																value: q,
																onChange: (e) => P(e.target.value),
																children: [
																	"Petrol",
																	"Diesel",
																	"Hybrid",
																	"PHEV",
																	"EV",
																	"CNG",
																	"LPG",
																].map((e) =>
																	(0, r.jsx)(
																		"option",
																		{ children: e },
																		e
																	)
																),
															}),
														],
													}),
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Transmission",
															}),
															(0, r.jsx)("select", {
																className:
																	"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
																value: M,
																onChange: (e) => V(e.target.value),
																children: [
																	"Manual (MT)",
																	"Automatic (AT)",
																	"CVT",
																	"DCT",
																	"AMT",
																	"EV Single Speed",
																].map((e) =>
																	(0, r.jsx)(
																		"option",
																		{ children: e },
																		e
																	)
																),
															}),
														],
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, { children: "Variant" }),
													(0, r.jsx)(c.p, {
														value: R,
														onChange: (e) => Z(e.target.value),
													}),
												],
											}),
											a
												? (0, r.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Brand: ", a],
												  })
												: null,
										],
									}),
									(0, r.jsxs)(m.Es, {
										children: [
											(0, r.jsx)(o.$, {
												type: "button",
												variant: "outline",
												onClick: () => w(!1),
												children: "Cancel",
											}),
											(0, r.jsx)(o.$, {
												type: "button",
												onClick: () => void O(),
												disabled: D,
												children: D
													? (0, r.jsx)(h.A, {
															className: "h-4 w-4 animate-spin",
													  })
													: "Create & select",
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
		60663: (e, t, a) => {
			a.r(t), a.d(t, { default: () => b });
			var r = a(95155),
				l = a(12115),
				n = a(44855),
				s = a(32144),
				i = a(55833),
				d = a(50136),
				o = a(4474),
				c = a(79984),
				u = a(39658),
				m = a(39540),
				h = a(23511),
				g = a(12107),
				x = a(84486),
				p = a(37814),
				v = a(93108),
				j = a(80723),
				_ = a(6296);
			function b() {
				let { navigate: e, viewParams: t } = (0, i.c)(),
					a = t.get("id") || "",
					{
						data: b,
						isLoading: y,
						mutate: S,
					} = (0, n.Ay)(a ? ["crm-test-drive", a] : null, () => (0, s.fj)(a)),
					[N, k] = (0, l.useState)({}),
					[w, D] = (0, l.useState)(!1),
					[A, T] = (0, l.useState)(!1),
					{ error: I, success: E, showError: F, showSuccess: q, clear: P } = (0, v.B)();
				(0, l.useEffect)(() => {
					b && k(b);
				}, [b]);
				let M = N.checklist || [],
					V = (e, t) => k((a) => ({ ...a, [e]: t })),
					R = (e, t) => {
						let a = [...M];
						(a[e] = { ...a[e], ...t }), V("checklist", a);
					};
				(0, l.useEffect)(() => {
					["Completed", "Failed", "No-Show", "Cancelled"].includes(
						String(N.status || "")
					) ||
						!M.length ||
						!M.every(
							(e) =>
								!e.is_mandatory ||
								(!!e.is_completed &&
									e.result &&
									"Pending" !== e.result &&
									"Fail" !== e.result)
						) ||
						(String(N.outcome || "").trim() &&
							String(N.vehicle_vin || "").trim() &&
							k((e) => ({ ...e, status: "Completed" })));
				}, [M, N.outcome, N.vehicle_vin, N.status]);
				let Z = async () => {
					D(!0), P();
					try {
						let e = await (0, s.n1)(a, {
							scheduled_datetime: N.scheduled_datetime,
							status: N.status,
							vehicle_vin: N.vehicle_vin,
							driver: N.driver,
							driver_name: N.driver_name,
							driver_license: N.driver_license,
							issuing_date: N.issuing_date,
							expiry_date: N.expiry_date,
							id_verified: +!!N.id_verified,
							driver_id_reference: N.driver_id_reference,
							customer_consent: +!!N.customer_consent,
							consent_notes: N.consent_notes,
							route: N.route,
							start_odometer: Number(N.start_odometer || 0),
							end_odometer: Number(N.end_odometer || 0),
							pre_drive_condition: N.pre_drive_condition,
							fuel_charge_level: Number(N.fuel_charge_level || 0),
							customer_feedback: N.customer_feedback,
							customer_preferences: N.customer_preferences,
							outcome: N.outcome,
							model_changed_to: N.model_changed_to,
							failure_reason: N.failure_reason,
							incident_reported: +!!N.incident_reported,
							incident_details: N.incident_details,
							damage_reported: +!!N.damage_reported,
							damage_details: N.damage_details,
							notes: N.notes,
							checklist: M,
						});
						await S();
						let t = String(e?.status || N.status || "");
						q(
							"Completed" === t
								? "Test Drive completed. Deal can continue to Quotation."
								: "Test Drive saved."
						);
					} catch (e) {
						F(e, "Failed to update Test Drive");
					} finally {
						D(!1);
					}
				};
				return y || !b
					? (0, r.jsx)(h.E, { className: "h-80" })
					: (0, r.jsxs)("div", {
							className: "space-y-4",
							children: [
								(0, r.jsx)(v.y, { error: I, success: E, onDismiss: P }),
								(0, r.jsxs)("div", {
									className: "flex flex-wrap justify-between gap-2",
									children: [
										(0, r.jsxs)(o.$, {
											variant: "outline",
											onClick: () => e("crm-test-drives"),
											children: [
												(0, r.jsx)(j.A, { className: "mr-2 h-4 w-4" }),
												"Test Drives",
											],
										}),
										(0, r.jsxs)("div", {
											className: "flex gap-2",
											children: [
												"Completed" === N.status &&
												["Interested", "Quotation Requested"].includes(
													String(N.outcome || "")
												)
													? (0, r.jsx)(o.$, {
															variant: "outline",
															onClick: () => {
																N.quotation
																	? e("crm-quotation-detail", {
																			id: String(
																				N.quotation
																			),
																	  })
																	: T(!0);
															},
															children: N.quotation
																? "Open Quotation"
																: "Create Quotation",
													  })
													: null,
												(0, r.jsxs)(o.$, {
													onClick: Z,
													disabled: w,
													children: [
														w
															? (0, r.jsx)(_.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
															  })
															: null,
														"Save Test Drive",
													],
												}),
											],
										}),
									],
								}),
								(0, r.jsxs)(c.Zp, {
									children: [
										(0, r.jsx)(c.aR, {
											children: (0, r.jsxs)(c.ZB, {
												className: "text-base",
												children: ["Test Drive ", a],
											}),
										}),
										(0, r.jsxs)(c.Wu, {
											className: "grid gap-4 sm:grid-cols-2",
											children: [
												(0, r.jsx)(C, {
													label: "Deal",
													children: (0, r.jsx)("button", {
														className:
															"text-sm text-primary hover:underline",
														onClick: () =>
															e("crm-opportunity-detail", {
																id: String(N.opportunity),
															}),
														children: String(N.opportunity),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Customer",
													children: String(N.customer || "—"),
												}),
												(0, r.jsx)(C, {
													label: "Scheduled",
													children: (0, r.jsx)(u.p, {
														type: "datetime-local",
														value: String(
															N.scheduled_datetime || ""
														).slice(0, 16),
														onChange: (e) =>
															V(
																"scheduled_datetime",
																e.target.value
															),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Status",
													children: (0, r.jsx)("select", {
														className:
															"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
														value: String(N.status || "Scheduled"),
														onChange: (e) =>
															V("status", e.target.value),
														children: [
															"Scheduled",
															"Confirmed",
															"Accepted",
															"In Progress",
															"Completed",
															"Failed",
															"No-Show",
															"Cancelled",
														].map((e) =>
															(0, r.jsx)(
																"option",
																{ children: e },
																e
															)
														),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Test Vehicle VIN",
													children: (0, r.jsx)(g.k, {
														value: String(N.vehicle_vin || ""),
														onValueChange: (e) =>
															V("vehicle_vin", e || ""),
														customer:
															String(N.customer || "") || void 0,
													}),
												}),
												(0, r.jsx)(C, {
													label: "Driver Name",
													children: (0, r.jsx)(x.t, {
														value: String(N.driver || ""),
														valueLabel: String(N.driver_name || ""),
														onValueChange: (e, t, a) => {
															k((r) => ({
																...r,
																driver: e || "",
																driver_name: t || "",
																driver_license: a?.license || "",
																issuing_date: a?.issuingDate || "",
																expiry_date: a?.expiryDate || "",
															}));
														},
													}),
												}),
												(0, r.jsx)(C, {
													label: "Driver Licence",
													children: (0, r.jsx)(u.p, {
														value: String(N.driver_license || ""),
														onChange: (e) =>
															V("driver_license", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Issuing Date",
													children: (0, r.jsx)(u.p, {
														type: "date",
														value: String(N.issuing_date || "").slice(
															0,
															10
														),
														onChange: (e) =>
															V("issuing_date", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Expiry Date",
													children: (0, r.jsx)(u.p, {
														type: "date",
														value: String(N.expiry_date || "").slice(
															0,
															10
														),
														onChange: (e) =>
															V("expiry_date", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "ID / Licence Reference",
													children: (0, r.jsx)(u.p, {
														value: String(N.driver_id_reference || ""),
														onChange: (e) =>
															V(
																"driver_id_reference",
																e.target.value
															),
													}),
												}),
												(0, r.jsx)(f, {
													label: "Driver licence / ID verified",
													checked: !!N.id_verified,
													onChange: (e) => V("id_verified", +!!e),
												}),
												(0, r.jsx)(f, {
													label: "Customer test-drive consent captured",
													checked: !!N.customer_consent,
													onChange: (e) => V("customer_consent", +!!e),
												}),
												(0, r.jsx)(C, {
													label: "Consent Notes",
													children: (0, r.jsx)(u.p, {
														value: String(N.consent_notes || ""),
														onChange: (e) =>
															V("consent_notes", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Route",
													children: (0, r.jsx)(u.p, {
														value: String(N.route || ""),
														onChange: (e) =>
															V("route", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Start Odometer",
													children: (0, r.jsx)(u.p, {
														type: "number",
														value: String(N.start_odometer || ""),
														onChange: (e) =>
															V("start_odometer", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "End Odometer",
													children: (0, r.jsx)(u.p, {
														type: "number",
														value: String(N.end_odometer || ""),
														onChange: (e) =>
															V("end_odometer", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Pre-drive Condition",
													children: (0, r.jsxs)("select", {
														className:
															"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
														value: String(N.pre_drive_condition || ""),
														onChange: (e) =>
															V(
																"pre_drive_condition",
																e.target.value
															),
														children: [
															(0, r.jsx)("option", {
																value: "",
																children: "Select condition",
															}),
															[
																"Excellent",
																"Good",
																"Fair",
																"Damage Noted",
															].map((e) =>
																(0, r.jsx)(
																	"option",
																	{ children: e },
																	e
																)
															),
														],
													}),
												}),
												(0, r.jsx)(C, {
													label: "Fuel / Charge Level (%)",
													children: (0, r.jsx)(u.p, {
														type: "number",
														min: 0,
														max: 100,
														value: String(N.fuel_charge_level || ""),
														onChange: (e) =>
															V("fuel_charge_level", e.target.value),
													}),
												}),
											],
										}),
									],
								}),
								(0, r.jsxs)(c.Zp, {
									children: [
										(0, r.jsx)(c.aR, {
											children: (0, r.jsx)(c.ZB, {
												className: "text-base",
												children: "Safety & handover checklist",
											}),
										}),
										(0, r.jsx)(c.Wu, {
											className: "space-y-2",
											children: M.map((e, t) =>
												(0, r.jsxs)(
													"div",
													{
														className:
															"grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_8rem_2fr]",
														children: [
															(0, r.jsxs)("label", {
																className:
																	"flex items-center gap-2 text-sm",
																children: [
																	(0, r.jsx)("input", {
																		type: "checkbox",
																		checked: !!e.is_completed,
																		onChange: (a) => {
																			let r =
																				a.target.checked;
																			R(t, {
																				is_completed: +!!r,
																				result: r
																					? "Pending" !==
																							e.result &&
																					  e.result
																						? e.result
																						: "Pass"
																					: "Pending",
																			});
																		},
																	}),
																	(0, r.jsxs)("span", {
																		children: [
																			e.check_item,
																			e.is_mandatory
																				? (0, r.jsx)(
																						"span",
																						{
																							className:
																								"ml-1 text-destructive",
																							children:
																								"*",
																						}
																				  )
																				: null,
																			e.category
																				? (0, r.jsx)(
																						"span",
																						{
																							className:
																								"block text-xs text-muted-foreground",
																							children:
																								e.category,
																						}
																				  )
																				: null,
																		],
																	}),
																],
															}),
															(0, r.jsx)("select", {
																className:
																	"h-9 rounded-md border border-input bg-background px-2 text-sm",
																value: e.result || "Pending",
																onChange: (e) =>
																	R(t, {
																		result: e.target.value,
																	}),
																children: [
																	"Pending",
																	"Pass",
																	"Fail",
																	"N/A",
																].map((e) =>
																	(0, r.jsx)(
																		"option",
																		{ children: e },
																		e
																	)
																),
															}),
															(0, r.jsx)(u.p, {
																placeholder: "Notes",
																value: e.notes || "",
																onChange: (e) =>
																	R(t, {
																		notes: e.target.value,
																	}),
															}),
														],
													},
													`${e.check_item}-${t}`
												)
											),
										}),
									],
								}),
								(0, r.jsxs)(c.Zp, {
									children: [
										(0, r.jsx)(c.aR, {
											children: (0, r.jsx)(c.ZB, {
												className: "text-base",
												children: "Outcome",
											}),
										}),
										(0, r.jsxs)(c.Wu, {
											className: "grid gap-4 sm:grid-cols-2",
											children: [
												(0, r.jsx)(C, {
													label: "Outcome",
													children: (0, r.jsxs)("select", {
														className:
															"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
														value: String(N.outcome || ""),
														onChange: (e) =>
															V("outcome", e.target.value),
														children: [
															(0, r.jsx)("option", {
																value: "",
																children: "Select outcome",
															}),
															[
																"Interested",
																"Follow-up Required",
																"Quotation Requested",
																"Model Changed",
																"Not Interested",
																"Issue Reported",
															].map((e) =>
																(0, r.jsx)(
																	"option",
																	{ children: e },
																	e
																)
															),
														],
													}),
												}),
												"Model Changed" === String(N.outcome || "")
													? (0, r.jsx)(C, {
															label: "Changed To Model *",
															children: (0, r.jsx)(p.I, {
																value: String(
																	N.model_changed_to || ""
																),
																onValueChange: (e) =>
																	V("model_changed_to", e || ""),
															}),
													  })
													: null,
												(0, r.jsx)(C, {
													label: "Failure / No-show Reason",
													children: (0, r.jsx)(u.p, {
														value: String(N.failure_reason || ""),
														onChange: (e) =>
															V("failure_reason", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Customer Feedback",
													children: (0, r.jsx)(m.T, {
														value: String(N.customer_feedback || ""),
														onChange: (e) =>
															V("customer_feedback", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Customer Preferences / Evaluation",
													children: (0, r.jsx)(m.T, {
														value: String(
															N.customer_preferences || ""
														),
														onChange: (e) =>
															V(
																"customer_preferences",
																e.target.value
															),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Internal Notes",
													children: (0, r.jsx)(m.T, {
														value: String(N.notes || ""),
														onChange: (e) =>
															V("notes", e.target.value),
													}),
												}),
											],
										}),
									],
								}),
								(0, r.jsxs)(c.Zp, {
									children: [
										(0, r.jsx)(c.aR, {
											children: (0, r.jsx)(c.ZB, {
												className: "text-base",
												children: "Incident & vehicle damage report",
											}),
										}),
										(0, r.jsxs)(c.Wu, {
											className: "grid gap-4 sm:grid-cols-2",
											children: [
												(0, r.jsx)(f, {
													label: "Incident reported",
													checked: !!N.incident_reported,
													onChange: (e) => V("incident_reported", +!!e),
												}),
												(0, r.jsx)(f, {
													label: "Vehicle damage reported",
													checked: !!N.damage_reported,
													onChange: (e) => V("damage_reported", +!!e),
												}),
												(0, r.jsx)(C, {
													label: "Incident Details",
													children: (0, r.jsx)(m.T, {
														value: String(N.incident_details || ""),
														onChange: (e) =>
															V("incident_details", e.target.value),
													}),
												}),
												(0, r.jsx)(C, {
													label: "Damage Details",
													children: (0, r.jsx)(m.T, {
														value: String(N.damage_details || ""),
														onChange: (e) =>
															V("damage_details", e.target.value),
													}),
												}),
												N.follow_up_activity
													? (0, r.jsx)(C, {
															label: "Automatic Follow-up Task",
															children: String(N.follow_up_activity),
													  })
													: null,
												N.quotation
													? (0, r.jsx)(C, {
															label: "Quotation",
															children: (0, r.jsx)("button", {
																type: "button",
																className:
																	"text-sm text-primary hover:underline",
																onClick: () =>
																	e("crm-quotation-detail", {
																		id: String(N.quotation),
																	}),
																children: String(N.quotation),
															}),
													  })
													: null,
											],
										}),
									],
								}),
								(0, r.jsx)(d.H, {
									open: A,
									onOpenChange: T,
									opportunityId: String(N.opportunity || ""),
									onError: F,
									onCreated: (e) => {
										S().then(() => {
											q(
												`Quotation ${e} created. Find it under Quotations to view or send it.`
											);
										});
									},
								}),
							],
					  });
			}
			function f({ label: e, checked: t, onChange: a }) {
				return (0, r.jsxs)("label", {
					className:
						"flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm",
					children: [
						(0, r.jsx)("input", {
							type: "checkbox",
							checked: t,
							onChange: (e) => a(e.target.checked),
						}),
						e,
					],
				});
			}
			function C({ label: e, children: t }) {
				return (0, r.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						(0, r.jsx)("label", {
							className: "text-xs font-medium text-muted-foreground",
							children: e,
						}),
						(0, r.jsx)("div", { children: t }),
					],
				});
			}
		},
		80723: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		93108: (e, t, a) => {
			a.d(t, { B: () => c, y: () => u });
			var r = a(95155),
				l = a(12115),
				n = a(66609),
				s = a(13545),
				i = a(12651),
				d = a(33210),
				o = a(91337);
			function c() {
				let [e, t] = (0, l.useState)(""),
					[a, r] = (0, l.useState)(""),
					s = (0, l.useCallback)((e, a = "Something went wrong.") => {
						let l =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || a;
						return (
							r(""),
							t(l),
							n.o.error(l, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							l
						);
					}, []);
				return {
					error: e,
					success: a,
					showError: s,
					showSuccess: (0, l.useCallback)((e) => {
						t(""), r(e), n.o.success(e);
					}, []),
					clear: (0, l.useCallback)(() => {
						t(""), r("");
					}, []),
				};
			}
			function u({ error: e, success: t, onDismiss: a, className: l }) {
				if (!e && !t) return null;
				let n = !!e;
				return (0, r.jsx)("div", {
					className: (0, o.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", l),
					children: (0, r.jsxs)("div", {
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
								? (0, r.jsx)(s.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, r.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, r.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || t,
							}),
							a
								? (0, r.jsx)("button", {
										type: "button",
										onClick: a,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, r.jsx)(d.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
