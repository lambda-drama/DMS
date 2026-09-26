"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2604],
	{
		23511: (e, s, r) => {
			r.d(s, { E: () => n });
			var t = r(95155),
				a = r(91337);
			function n({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, a.cn)("bg-accent animate-pulse rounded-md", e),
					...s,
				});
			}
		},
		38291: (e, s, r) => {
			r.d(s, { E: () => c });
			var t = r(95155);
			r(12115);
			var a = r(42442),
				n = r(18460),
				d = r(91337);
			let l = (0, n.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function c({ className: e, variant: s, asChild: r = !1, ...n }) {
				let i = r ? a.DX : "span";
				return (0, t.jsx)(i, {
					"data-slot": "badge",
					className: (0, d.cn)(l({ variant: s }), e),
					...n,
				});
			}
		},
		61878: (e, s, r) => {
			r.d(s, { A: () => t });
			let t = (0, r(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		62604: (e, s, r) => {
			r.r(s), r.d(s, { default: () => g });
			var t = r(95155),
				a = r(12115),
				n = r(44855),
				d = r(32144),
				l = r(55833),
				c = r(4474),
				i = r(38291),
				o = r(79984),
				m = r(39658),
				u = r(23511),
				x = r(10086),
				h = r(61878);
			function g() {
				let { navigate: e, viewParams: s } = (0, l.c)(),
					r = s.get("account") || "",
					g = s.get("customer") || "",
					[p, j] = (0, a.useState)(r),
					[v, b] = (0, a.useState)(g),
					[f, N] = (0, a.useState)(""),
					[y, _] = (0, a.useState)(""),
					{ data: S } = (0, n.Ay)(["crm-accounts-fleet-pick", y], () =>
						(0, d.B)({ search: y || void 0, limit: 30 })
					),
					w = p || v,
					{ data: k, isLoading: Z } = (0, n.Ay)(
						w ? ["crm-fleet-aftersales-page", p, v, f] : null,
						() =>
							(0, d.J3)({
								account: p || void 0,
								customer: v || void 0,
								search: f || void 0,
								limit: 100,
							})
					),
					{ data: A } = (0, n.Ay)(w ? ["crm-fleet-health", p, v] : null, () =>
						(0, d.zr)({ account: p || void 0, customer: v || void 0 })
					),
					W = k?.data || [],
					C = k?.summary || {},
					V = k?.agreements || [];
				return (0, t.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, t.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, t.jsx)(o.aR, {
									children: (0, t.jsx)(o.ZB, {
										className: "text-base",
										children: "Fleet aftersales",
									}),
								}),
								(0, t.jsxs)(o.Wu, {
									className: "grid gap-3 sm:grid-cols-2",
									children: [
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Account",
												}),
												(0, t.jsx)(x.Zi, {
													options: (S?.data || []).map((e) => ({
														value: String(e.name),
														label: String(e.account_name || e.name),
														description: String(
															e.customer_name || e.customer || ""
														),
													})),
													value: p,
													onValueChange: (e) => {
														let s = (S?.data || []).find(
															(s) => String(s.name) === e
														);
														j(e || ""), b(String(s?.customer || ""));
													},
													onSearchChange: _,
													placeholder: "Select fleet account…",
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Search VIN / model",
												}),
												(0, t.jsxs)("div", {
													className: "relative",
													children: [
														(0, t.jsx)(h.A, {
															className:
																"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
														}),
														(0, t.jsx)(m.p, {
															className: "pl-9",
															value: f,
															onChange: (e) => N(e.target.value),
															placeholder: "Filter fleet vehicles…",
															disabled: !w,
														}),
													],
												}),
											],
										}),
									],
								}),
							],
						}),
						w
							? Z
								? (0, t.jsx)(u.E, { className: "h-40" })
								: (0, t.jsxs)(t.Fragment, {
										children: [
											(0, t.jsxs)("div", {
												className: "grid gap-3 sm:grid-cols-4",
												children: [
													(0, t.jsx)(o.Zp, {
														className: "border-border/70 shadow-sm",
														children: (0, t.jsxs)(o.Wu, {
															className: "pt-4",
															children: [
																(0, t.jsx)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children: "Vehicles",
																}),
																(0, t.jsx)("p", {
																	className:
																		"text-2xl font-semibold",
																	children:
																		C.total_vehicles ?? 0,
																}),
															],
														}),
													}),
													(0, t.jsx)(o.Zp, {
														className: "border-border/70 shadow-sm",
														children: (0, t.jsxs)(o.Wu, {
															className: "pt-4",
															children: [
																(0, t.jsx)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children: "Overdue",
																}),
																(0, t.jsx)("p", {
																	className:
																		"text-2xl font-semibold",
																	children: C.overdue ?? 0,
																}),
															],
														}),
													}),
													(0, t.jsx)(o.Zp, {
														className: "border-border/70 shadow-sm",
														children: (0, t.jsxs)(o.Wu, {
															className: "pt-4",
															children: [
																(0, t.jsx)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children: "Due soon",
																}),
																(0, t.jsx)("p", {
																	className:
																		"text-2xl font-semibold",
																	children: C.due_soon ?? 0,
																}),
															],
														}),
													}),
													(0, t.jsx)(o.Zp, {
														className: "border-border/70 shadow-sm",
														children: (0, t.jsxs)(o.Wu, {
															className: "pt-4",
															children: [
																(0, t.jsx)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children: "Open job cards",
																}),
																(0, t.jsx)("p", {
																	className:
																		"text-2xl font-semibold",
																	children:
																		C.open_job_cards ?? 0,
																}),
															],
														}),
													}),
												],
											}),
											A
												? (0, t.jsxs)(o.Zp, {
														className: "border-border/70 shadow-sm",
														children: [
															(0, t.jsx)(o.aR, {
																children: (0, t.jsx)(o.ZB, {
																	className: "text-base",
																	children:
																		"Monthly fleet health",
																}),
															}),
															(0, t.jsxs)(o.Wu, {
																className: "space-y-2 text-sm",
																children: [
																	(0, t.jsxs)("p", {
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Customer: ",
																			}),
																			String(
																				A.customer_name ||
																					A.customer ||
																					"—"
																			),
																		],
																	}),
																	(0, t.jsxs)("p", {
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Avg odometer: ",
																			}),
																			null !=
																			A.average_odometer
																				? Number(
																						A.average_odometer
																				  ).toLocaleString()
																				: "—",
																		],
																	}),
																	(0, t.jsxs)("p", {
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Avg age (yrs): ",
																			}),
																			null !=
																			A.average_age_years
																				? String(
																						A.average_age_years
																				  )
																				: "—",
																		],
																	}),
																	(0, t.jsx)("p", {
																		className:
																			"text-muted-foreground",
																		children: String(
																			A.preventive_plan || ""
																		),
																	}),
																],
															}),
														],
												  })
												: null,
											(0, t.jsxs)(o.Zp, {
												className: "border-border/70 shadow-sm",
												children: [
													(0, t.jsx)(o.aR, {
														children: (0, t.jsx)(o.ZB, {
															className: "text-base",
															children: "Vehicle service due",
														}),
													}),
													(0, t.jsx)(o.Wu, {
														children: (0, t.jsx)("div", {
															className: "dms-table-panel",
															children: (0, t.jsxs)("table", {
																className: "w-full text-sm",
																children: [
																	(0, t.jsx)("thead", {
																		children: (0, t.jsxs)(
																			"tr",
																			{
																				className:
																					"border-b text-left text-xs text-muted-foreground",
																				children: [
																					(0, t.jsx)(
																						"th",
																						{
																							className:
																								"pb-2 font-medium",
																							children:
																								"VIN",
																						}
																					),
																					(0, t.jsx)(
																						"th",
																						{
																							className:
																								"pb-2 font-medium",
																							children:
																								"Model",
																						}
																					),
																					(0, t.jsx)(
																						"th",
																						{
																							className:
																								"pb-2 font-medium",
																							children:
																								"Odometer",
																						}
																					),
																					(0, t.jsx)(
																						"th",
																						{
																							className:
																								"pb-2 font-medium",
																							children:
																								"Next service",
																						}
																					),
																					(0, t.jsx)(
																						"th",
																						{
																							className:
																								"pb-2 font-medium",
																							children:
																								"Status",
																						}
																					),
																				],
																			}
																		),
																	}),
																	(0, t.jsx)("tbody", {
																		children:
																			0 === W.length
																				? (0, t.jsx)(
																						"tr",
																						{
																							children:
																								(0,
																								t.jsx)(
																									"td",
																									{
																										colSpan: 5,
																										className:
																											"py-10 text-center text-muted-foreground",
																										children:
																											"No fleet vehicles found for this account.",
																									}
																								),
																						}
																				  )
																				: W.map((e) => {
																						var s;
																						return (0,
																						t.jsxs)(
																							"tr",
																							{
																								className:
																									"border-b border-border/60 last:border-0",
																								children:
																									[
																										(0,
																										t.jsx)(
																											"td",
																											{
																												className:
																													"py-3",
																												children:
																													(0,
																													t.jsx)(
																														"p",
																														{
																															className:
																																"font-medium",
																															children:
																																String(
																																	e.vin_number ||
																																		e.name
																																),
																														}
																													),
																											}
																										),
																										(0,
																										t.jsx)(
																											"td",
																											{
																												className:
																													"py-3 text-muted-foreground",
																												children:
																													String(
																														e.model_name ||
																															e.model ||
																															"—"
																													),
																											}
																										),
																										(0,
																										t.jsx)(
																											"td",
																											{
																												className:
																													"py-3 text-muted-foreground",
																												children:
																													null !=
																													e.current_odometer
																														? Number(
																																e.current_odometer
																														  ).toLocaleString()
																														: "—",
																											}
																										),
																										(0,
																										t.jsx)(
																											"td",
																											{
																												className:
																													"py-3 text-muted-foreground",
																												children:
																													e.next_service_due_date
																														? String(
																																e.next_service_due_date
																														  ).slice(
																																0,
																																10
																														  )
																														: "—",
																											}
																										),
																										(0,
																										t.jsx)(
																											"td",
																											{
																												className:
																													"py-3",
																												children:
																													(0,
																													t.jsx)(
																														i.E,
																														{
																															variant:
																																"Overdue" ===
																																(s =
																																	String(
																																		e.service_status ||
																																			""
																																	))
																																	? "destructive"
																																	: "Due Soon" ===
																																	  s
																																	? "secondary"
																																	: "outline",
																															className:
																																"font-normal",
																															children:
																																String(
																																	e.service_status ||
																																		"—"
																																),
																														}
																													),
																											}
																										),
																									],
																							},
																							String(
																								e.name
																							)
																						);
																				  }),
																	}),
																],
															}),
														}),
													}),
												],
											}),
											(0, t.jsxs)(o.Zp, {
												className: "border-border/70 shadow-sm",
												children: [
													(0, t.jsx)(o.aR, {
														children: (0, t.jsx)(o.ZB, {
															className: "text-base",
															children:
																"Contracts / utilization & renewals",
														}),
													}),
													(0, t.jsx)(o.Wu, {
														className: "space-y-2",
														children:
															0 === V.length
																? (0, t.jsx)("p", {
																		className:
																			"text-sm text-muted-foreground",
																		children:
																			"No active framework agreements.",
																  })
																: V.map((s) =>
																		(0, t.jsxs)(
																			"div",
																			{
																				className:
																					"flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm",
																				children: [
																					(0, t.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									t.jsx)(
																										"p",
																										{
																											className:
																												"font-medium",
																											children:
																												String(
																													s.agreement_title ||
																														s.name
																												),
																										}
																									),
																									(0,
																									t.jsxs)(
																										"p",
																										{
																											className:
																												"text-xs text-muted-foreground",
																											children:
																												[
																													"Valid to ",
																													String(
																														s.valid_to ||
																															"—"
																													),
																													" \xb7 Units",
																													" ",
																													String(
																														s.utilization_units ??
																															0
																													),
																													"/",
																													String(
																														s.max_units ??
																															"—"
																													),
																												],
																										}
																									),
																								],
																						}
																					),
																					p
																						? (0,
																						  t.jsx)(
																								c.$,
																								{
																									size: "sm",
																									variant:
																										"outline",
																									onClick:
																										() =>
																											e(
																												"crm-account-detail",
																												{
																													id: p,
																												}
																											),
																									children:
																										"Account",
																								}
																						  )
																						: null,
																				],
																			},
																			String(s.name)
																		)
																  ),
													}),
												],
											}),
										],
								  })
							: (0, t.jsx)(o.Zp, {
									className: "border-border/70",
									children: (0, t.jsx)(o.Wu, {
										className: "py-10 text-center text-muted-foreground",
										children:
											"Select a corporate / fleet account to view vehicle-level service due tracking, SLA signals and agreement utilization.",
									}),
							  }),
					],
				});
			}
		},
	},
]);
