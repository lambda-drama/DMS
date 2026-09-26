"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1044],
	{
		15306: (e, s, t) => {
			t.d(s, { Xi: () => d, av: () => c, j7: () => l, tU: () => i });
			var a = t(95155);
			t(12115);
			var n = t(57518),
				r = t(91337);
			function i({ className: e, ...s }) {
				return (0, a.jsx)(n.bL, {
					"data-slot": "tabs",
					className: (0, r.cn)("flex flex-col gap-2", e),
					...s,
				});
			}
			function l({ className: e, ...s }) {
				return (0, a.jsx)(n.B8, {
					"data-slot": "tabs-list",
					className: (0, r.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...s,
				});
			}
			function d({ className: e, ...s }) {
				return (0, a.jsx)(n.l9, {
					"data-slot": "tabs-trigger",
					className: (0, r.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...s,
				});
			}
			function c({ className: e, ...s }) {
				return (0, a.jsx)(n.UC, {
					"data-slot": "tabs-content",
					className: (0, r.cn)("outline-none data-[state=inactive]:hidden", e),
					...s,
				});
			}
		},
		16516: (e, s, t) => {
			function a(e) {
				let s = Number(e);
				return Number.isFinite(s) ? s : 0;
			}
			function n(e) {
				return 1 === a(e.docstatus) && !e.job_card && !e.service_estimate;
			}
			t.d(s, { O: () => a, Y: () => n });
		},
		33745: (e, s, t) => {
			t.d(s, { l: () => d });
			var a = t(95155),
				n = t(51914),
				r = t(63360),
				i = t(4474),
				l = t(91337);
			function d({ module: e, label: s, className: t, ...c }) {
				let { canCreate: o } = (0, r.Sk)();
				return o(e)
					? (0, a.jsxs)(i.$, {
							"aria-label": s,
							title: s,
							className: (0, l.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								t
							),
							...c,
							children: [
								(0, a.jsx)(n.A, { className: "h-4 w-4 shrink-0" }),
								(0, a.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: s,
								}),
							],
					  })
					: null;
			}
		},
		61044: (e, s, t) => {
			t.r(s), t.d(s, { default: () => X });
			var a = t(95155),
				n = t(12115),
				r = t(55833),
				i = t(33745),
				l = t(36020),
				d = t(98883),
				c = t(81672),
				o = t(4474),
				m = t(38291),
				x = t(15306),
				u = t(83786),
				h = t(41585),
				p = t(21283),
				j = t(16516);
			function g(e) {
				return e.component || e.area || "—";
			}
			function f(e) {
				return !!e && "OK" !== e && "Not Checked" !== e;
			}
			function v(e) {
				return e && "OK" !== e
					? "Not Checked" === e
						? "bg-muted text-muted-foreground border-border"
						: "bg-transparent text-foreground border-destructive"
					: "bg-chart-3/10 text-chart-3 border-chart-3/20";
			}
			function b({ rows: e, showSeverity: s }) {
				let t = e.filter((e) => f(e.condition));
				return e.length
					? (0, a.jsxs)("div", {
							className: "space-y-3",
							children: [
								t.length > 0
									? (0, a.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												t.length,
												" issue",
												1 === t.length ? "" : "s",
												" of ",
												e.length,
												" components",
											],
									  })
									: (0, a.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: ["All ", e.length, " components marked OK."],
									  }),
								(0, a.jsx)("div", {
									className: "rounded-lg border",
									children: (0, a.jsxs)(u.XI, {
										children: [
											(0, a.jsx)(u.A0, {
												children: (0, a.jsxs)(u.Hj, {
													children: [
														(0, a.jsx)(u.nd, {
															children: "Component",
														}),
														(0, a.jsx)(u.nd, {
															children: "Condition",
														}),
														s
															? (0, a.jsx)(u.nd, {
																	children: "Severity",
															  })
															: null,
														(0, a.jsx)(u.nd, { children: "Notes" }),
													],
												}),
											}),
											(0, a.jsx)(u.BF, {
												children: e.map((e, t) =>
													(0, a.jsxs)(
														u.Hj,
														{
															children: [
																(0, a.jsx)(u.nA, {
																	className: "font-medium",
																	children: g(e),
																}),
																(0, a.jsx)(u.nA, {
																	children: (0, a.jsx)(m.E, {
																		variant: "outline",
																		className: v(e.condition),
																		children:
																			e.condition || "—",
																	}),
																}),
																s
																	? (0, a.jsx)(u.nA, {
																			className:
																				"text-sm text-muted-foreground",
																			children:
																				e.severity || "—",
																	  })
																	: null,
																(0, a.jsx)(u.nA, {
																	className:
																		"max-w-[180px] truncate text-sm text-muted-foreground",
																	children: e.comments || "—",
																}),
															],
														},
														e.name || `${g(e)}-${t}`
													)
												),
											}),
										],
									}),
								}),
							],
					  })
					: (0, a.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No checklist items recorded.",
					  });
			}
			function N({ inspection: e, onStartDiagnosis: s, startingDiagnosis: t }) {
				let { navigate: i } = (0, r.c)(),
					[l, u] = (0, n.useState)("overview"),
					g = e.exterior_checklist || [],
					w = e.interior_checklist || [],
					y = e.warning_lights || [],
					_ = e.customer_complaints || [],
					C = e.dtc_codes || [],
					k = e.tires_checklist || [],
					S = g.filter((e) => f(e.condition)).length,
					A = w.filter((e) => f(e.condition)).length,
					$ = k.filter(
						(e) => f(e.tire_condition) || f(e.rim_condition) || f(e.brake_visual)
					).length;
				return (0, a.jsx)("div", {
					className: "flex min-h-0 flex-1 flex-col",
					children: (0, a.jsxs)(x.tU, {
						value: l,
						onValueChange: u,
						className: "flex min-h-0 flex-1 flex-col",
						children: [
							(0, a.jsx)("div", {
								className:
									"shrink-0 -mx-4 border-b border-border/60 bg-background px-4 pb-2 pt-1",
								children: (0, a.jsx)("div", {
									className: "dms-tabs-scroll",
									children: (0, a.jsxs)(x.j7, {
										className:
											"h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1",
										children: [
											(0, a.jsx)(x.Xi, {
												value: "overview",
												className: "text-xs sm:text-sm",
												children: "Overview",
											}),
											(0, a.jsxs)(x.Xi, {
												value: "exterior",
												className: "gap-1.5 text-xs sm:text-sm",
												children: [
													"Exterior",
													S > 0 &&
														(0, a.jsx)(m.E, {
															variant: "secondary",
															className:
																"h-5 px-1.5 text-[10px] font-normal",
															children: S,
														}),
												],
											}),
											(0, a.jsxs)(x.Xi, {
												value: "interior",
												className: "gap-1.5 text-xs sm:text-sm",
												children: [
													"Interior",
													A > 0 &&
														(0, a.jsx)(m.E, {
															variant: "secondary",
															className:
																"h-5 px-1.5 text-[10px] font-normal",
															children: A,
														}),
												],
											}),
										],
									}),
								}),
							}),
							(0, a.jsxs)("div", {
								className:
									"min-h-0 flex-1 overflow-y-auto overscroll-contain py-4",
								children: [
									(0, a.jsxs)(x.av, {
										value: "overview",
										className: "mt-0 space-y-4 data-[state=inactive]:hidden",
										children: [
											(0, a.jsxs)(d.JH, {
												title: "Inspection Info",
												children: [
													(0, a.jsx)(d.Qb, {
														label: "Date",
														value: e.inspection_date
															? (0, c.r6)(e.inspection_date)
															: void 0,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Company",
														value: e.company_name || e.company,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Service Advisor",
														value:
															e.service_advisor_name ||
															e.service_advisor,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Job Card",
														value: e.job_card,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Service Estimate",
														value: e.service_estimate,
													}),
												],
											}),
											(0, a.jsxs)(d.JH, {
												title: "Customer & Vehicle",
												children: [
													(0, a.jsx)(d.Qb, {
														label: "Customer",
														value: e.customer,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Vehicle",
														value: e.customer_vehicle,
													}),
													(0, a.jsx)(d.Qb, {
														label: "VIN / Chassis",
														value: e.vin_chassis,
													}),
													(0, a.jsx)(d.Qb, {
														label: "License Plate",
														value: e.license_plate,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Model Year",
														value: e.model_year?.toString(),
													}),
													(0, a.jsx)(d.Qb, {
														label: "Odometer",
														value: e.odometer
															? `${e.odometer.toLocaleString()} ${
																	e.odometer_unit || "km"
															  }`
															: void 0,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Fuel Level",
														value: e.fuel_level,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Arrival",
														value: e.arrival_method,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Keys Received",
														value: e.keys_received ? "Yes" : "No",
													}),
													(0, a.jsx)(d.Qb, {
														label: "Remote Condition",
														value: e.remote_condition,
													}),
												],
											}),
											(0, a.jsxs)(d.JH, {
												title: "Warning Lights",
												children: [
													y.length > 0
														? (0, a.jsx)("div", {
																className: "flex flex-wrap gap-2",
																children: y.map((e, s) =>
																	(0, a.jsxs)(
																		m.E,
																		{
																			variant: "outline",
																			className:
																				"border-destructive bg-transparent text-foreground",
																			children: [
																				(0, a.jsx)(h.A, {
																					className:
																						"mr-1.5 h-3.5 w-3.5 text-destructive",
																				}),
																				String(
																					e.vehicle_warning_light ||
																						e.warning_light ||
																						e.warning_light_name ||
																						"Warning light"
																				),
																			],
																		},
																		e.name || s
																	)
																),
														  })
														: (0, a.jsx)("p", {
																className:
																	"text-sm text-muted-foreground",
																children:
																	"No warning lights recorded.",
														  }),
													e.scan_performed
														? (0, a.jsxs)("div", {
																className:
																	"mt-3 space-y-2 border-t pt-3",
																children: [
																	(0, a.jsx)(d.Qb, {
																		label: "Scan Performed",
																		value: "Yes",
																	}),
																	(0, a.jsx)(d.Qb, {
																		label: "Scan Tool",
																		value: e.scan_tool_used,
																	}),
																	C.length > 0
																		? (0, a.jsxs)("div", {
																				className:
																					"space-y-2",
																				children: [
																					(0, a.jsx)(
																						"p",
																						{
																							className:
																								"text-xs font-medium text-muted-foreground",
																							children:
																								"DTC Codes",
																						}
																					),
																					C.map((e, s) =>
																						(0,
																						a.jsxs)(
																							"div",
																							{
																								className:
																									"rounded-md border bg-muted/20 p-2 text-sm",
																								children:
																									[
																										(0,
																										a.jsx)(
																											"p",
																											{
																												className:
																													"font-medium",
																												children:
																													e.code,
																											}
																										),
																										e.description
																											? (0,
																											  a.jsx)(
																													"p",
																													{
																														className:
																															"text-xs text-muted-foreground",
																														children:
																															e.description,
																													}
																											  )
																											: null,
																									],
																							},
																							e.name ||
																								s
																						)
																					),
																				],
																		  })
																		: (0, a.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"No DTC codes recorded.",
																		  }),
																],
														  })
														: null,
												],
											}),
											(0, a.jsx)(d.JH, {
												title: "Customer Complaints",
												children:
													_.length > 0
														? (0, a.jsx)("div", {
																className: "space-y-3",
																children: _.map((e, s) =>
																	(0, a.jsxs)(
																		"div",
																		{
																			className:
																				"rounded-md border bg-muted/20 p-3",
																			children: [
																				(0, a.jsxs)("p", {
																					className:
																						"text-xs text-muted-foreground mb-1",
																					children: [
																						"#",
																						e.complaint_sequence ||
																							s + 1,
																						e.symptom_category ||
																						e.category
																							? ` \xb7 ${
																									e.symptom_category ||
																									e.category
																							  }`
																							: "",
																						e.severity
																							? ` \xb7 ${e.severity}`
																							: "",
																						e.frequency
																							? ` \xb7 ${e.frequency}`
																							: "",
																					],
																				}),
																				(0, a.jsx)("p", {
																					className:
																						"text-sm whitespace-pre-wrap",
																					children:
																						e.customer_exact_words ||
																						e.complaint ||
																						"—",
																				}),
																			],
																		},
																		e.name || s
																	)
																),
														  })
														: (0, a.jsx)("p", {
																className:
																	"text-sm text-muted-foreground",
																children:
																	"No customer complaints recorded.",
														  }),
											}),
											k.length > 0
												? (0, a.jsxs)(d.JH, {
														title: "Tires & Wheels",
														children: [
															(0, a.jsx)("p", {
																className:
																	"mb-3 text-xs text-muted-foreground",
																children:
																	$ > 0
																		? `${$} issue${
																				1 === $ ? "" : "s"
																		  } across ${
																				k.length
																		  } positions`
																		: `All ${k.length} tire positions OK`,
															}),
															(0, a.jsx)("div", {
																className: "space-y-2",
																children: k.map((e, s) =>
																	(0, a.jsxs)(
																		"div",
																		{
																			className:
																				"flex flex-col gap-1 rounded-md border bg-muted/10 p-2 sm:flex-row sm:items-center sm:justify-between",
																			children: [
																				(0, a.jsx)(
																					"span",
																					{
																						className:
																							"text-sm font-medium",
																						children:
																							e.position,
																					}
																				),
																				(0, a.jsxs)(
																					"div",
																					{
																						className:
																							"flex flex-wrap gap-2",
																						children: [
																							(0,
																							a.jsxs)(
																								m.E,
																								{
																									variant:
																										"outline",
																									className:
																										v(
																											e.tire_condition
																										),
																									children:
																										[
																											"Tire: ",
																											e.tire_condition ||
																												"—",
																										],
																								}
																							),
																							e.tread_depth_mm
																								? (0,
																								  a.jsxs)(
																										m.E,
																										{
																											variant:
																												"outline",
																											className:
																												"text-xs",
																											children:
																												[
																													e.tread_depth_mm,
																													" mm tread",
																												],
																										}
																								  )
																								: null,
																							e.tire_pressure_psi
																								? (0,
																								  a.jsxs)(
																										m.E,
																										{
																											variant:
																												"outline",
																											className:
																												"text-xs",
																											children:
																												[
																													e.tire_pressure_psi,
																													" PSI",
																												],
																										}
																								  )
																								: null,
																						],
																					}
																				),
																			],
																		},
																		e.name || s
																	)
																),
															}),
														],
												  })
												: null,
											(e.service_advisor_notes ||
												e.internal_notes ||
												e.personal_items) &&
												(0, a.jsxs)(d.JH, {
													title: "Notes",
													children: [
														e.personal_items
															? (0, a.jsxs)("div", {
																	className: "mb-3",
																	children: [
																		(0, a.jsx)("p", {
																			className:
																				"text-xs font-medium text-muted-foreground mb-1",
																			children:
																				"Personal items",
																		}),
																		(0, a.jsx)("p", {
																			className:
																				"text-sm whitespace-pre-wrap",
																			children:
																				e.personal_items,
																		}),
																	],
															  })
															: null,
														e.service_advisor_notes
															? (0, a.jsxs)("div", {
																	className: "mb-3",
																	children: [
																		(0, a.jsx)("p", {
																			className:
																				"text-xs font-medium text-muted-foreground mb-1",
																			children:
																				"Advisor notes",
																		}),
																		(0, a.jsx)("p", {
																			className:
																				"text-sm whitespace-pre-wrap",
																			children:
																				e.service_advisor_notes,
																		}),
																	],
															  })
															: null,
														e.internal_notes
															? (0, a.jsxs)("div", {
																	children: [
																		(0, a.jsx)("p", {
																			className:
																				"text-xs font-medium text-muted-foreground mb-1",
																			children:
																				"Internal notes",
																		}),
																		(0, a.jsx)("p", {
																			className:
																				"text-sm whitespace-pre-wrap",
																			children:
																				e.internal_notes,
																		}),
																	],
															  })
															: null,
													],
												}),
											(0, a.jsxs)("div", {
												className:
													"flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end",
												children: [
													(0, j.Y)(e) && s
														? (0, a.jsxs)(o.$, {
																disabled: t,
																onClick: s,
																children: [
																	(0, a.jsx)(p.A, {
																		className: "mr-2 h-4 w-4",
																	}),
																	t
																		? "Creating…"
																		: "Start diagnosis",
																],
														  })
														: null,
													e.service_estimate
														? (0, a.jsx)(o.$, {
																variant: "outline",
																onClick: () =>
																	i("estimate-detail", {
																		id: e.service_estimate,
																	}),
																children: "View service estimate",
														  })
														: null,
												],
											}),
										],
									}),
									(0, a.jsx)(x.av, {
										value: "exterior",
										className: "mt-0 data-[state=inactive]:hidden",
										children: (0, a.jsx)(d.JH, {
											title: "Exterior Inspection",
											children: (0, a.jsx)(b, { rows: g, showSeverity: !0 }),
										}),
									}),
									(0, a.jsx)(x.av, {
										value: "interior",
										className: "mt-0 data-[state=inactive]:hidden",
										children: (0, a.jsx)(d.JH, {
											title: "Interior Inspection",
											children: (0, a.jsx)(b, { rows: w }),
										}),
									}),
								],
							}),
						],
					}),
				});
			}
			var w = t(56031),
				y = t(79984),
				_ = t(39658),
				C = t(79792),
				k = t(66609),
				S = t(41431),
				A = t(26518),
				$ = t(43447),
				L = t(61878),
				I = t(92622),
				O = t(93053),
				D = t(60285),
				E = t(48368),
				M = t(42869),
				J = t(14636),
				Q = t(89123),
				P = t(66088),
				z = t(84980),
				T = t(13545),
				F = t(12651),
				H = t(20572),
				V = t(53483),
				W = t(31521),
				Y = t(2412),
				Z = t(93408),
				B = t(99916),
				K = t(91337);
			function X() {
				let { navigate: e } = (0, r.c)(),
					[s, t] = (0, W.P)("inspections", "search", ""),
					[c, x] = (0, W.P)("inspections", "status", "all"),
					[h, g] = (0, W.P)("inspections", "inspection_from", ""),
					[f, v] = (0, W.P)("inspections", "inspection_to", ""),
					[b, X] = (0, W.P)("inspections", "completed_from", ""),
					[q, G] = (0, W.P)("inspections", "completed_to", ""),
					[R, U] = (0, n.useState)(1),
					[ee, es] = (0, n.useState)(50),
					[et, ea] = (0, n.useState)(null),
					[en, er] = (0, n.useState)(!1),
					[ei, el] = (0, n.useState)(null),
					ed = (0, n.useCallback)(
						async (s) => {
							el(s);
							try {
								let t = await S.tc(s);
								k.o.success("Service estimate created — add diagnosis findings"),
									ea(null),
									e("estimate-detail", { id: t });
							} catch (e) {
								k.o.error(
									e instanceof Error ? e.message : "Failed to start diagnosis"
								);
							} finally {
								el(null);
							}
						},
						[e]
					),
					{ data: ec, isLoading: eo } = (0, l.K5)(et),
					em = !!(h || f || b || q),
					ex = (0, n.useCallback)(() => {
						g(""), v(""), X(""), G("");
					}, [g, v, X, G]),
					eu = {
						inspection_from: h || void 0,
						inspection_to: f || void 0,
						completed_from: b || void 0,
						completed_to: q || void 0,
					},
					{
						data: eh,
						isLoading: ep,
						error: ej,
					} = (0, l.tR)({ ...eu, limit: ee, offset: (R - 1) * ee }),
					eg = eh?.total || 0,
					{
						items: ef,
						loadedCount: ev,
						isLoadingMore: eb,
						loadMore: eN,
					} = (0, V.h)({
						items: eh?.data,
						total: eg,
						offset: (R - 1) * ee,
						resetKey: [s, c, h, f, b, q, R, ee].join("|"),
						enabled: ee >= V.J,
						fetchMore: async (e, s) =>
							(await Y.Ww({ ...eu, limit: s, offset: e })).data,
					});
				(0, n.useEffect)(() => {
					U(1);
				}, [s, c, h, f, b, q]);
				let ew = ef.filter((e) => {
						let t =
								(e.customer_vehicle ?? "")
									.toLowerCase()
									.includes(s.toLowerCase()) ||
								(e.vehicle_model ?? "").toLowerCase().includes(s.toLowerCase()) ||
								(e.vin_chassis ?? "").toLowerCase().includes(s.toLowerCase()) ||
								(e.vin_number ?? "").toLowerCase().includes(s.toLowerCase()) ||
								e.name.toLowerCase().includes(s.toLowerCase()) ||
								(e.license_plate ?? "").toLowerCase().includes(s.toLowerCase()) ||
								e.customer.toLowerCase().includes(s.toLowerCase()),
							a =
								"all" === c ||
								("draft" === c && 0 === (0, j.O)(e.docstatus)) ||
								("submitted" === c && 1 === (0, j.O)(e.docstatus));
						return t && a;
					}),
					ey = ef.filter(
						(e) =>
							(0, w.GP)(new Date(e.inspection_date), "yyyy-MM-dd") ===
							(0, w.GP)(new Date(), "yyyy-MM-dd")
					).length,
					e_ = ef.filter((e) => 0 === (0, j.O)(e.docstatus)).length,
					eC = ef.reduce((e, s) => e + (s.customer_complaints?.length || 0), 0);
				return (0, a.jsxs)("div", {
					className: "flex min-w-0 flex-col gap-4 sm:gap-6",
					children: [
						(0, a.jsxs)(y.Zp, {
							className: "order-1 md:order-2",
							children: [
								(0, a.jsxs)(y.aR, {
									className:
										"flex items-center justify-between gap-3 sm:items-start",
									children: [
										(0, a.jsxs)("div", {
											className: "min-w-0",
											children: [
												(0, a.jsx)(y.ZB, {
													className: "hidden md:block",
													children: "Vehicle Inspections",
												}),
												!ep && eg > 0
													? (0, a.jsx)("p", {
															className:
																"mt-1 text-sm text-muted-foreground md:hidden",
															children:
																ew.length === eg
																	? `${eg} inspection${
																			1 === eg ? "" : "s"
																	  }`
																	: `${ew.length} of ${eg} shown`,
													  })
													: null,
											],
										}),
										(0, a.jsx)(i.l, {
											module: "inspections",
											label: "New Inspection",
											onClick: () => e("inspection-new"),
										}),
									],
								}),
								(0, a.jsxs)(y.Wu, {
									className: "min-w-0",
									children: [
										(0, a.jsxs)("div", {
											className:
												"mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row",
											children: [
												(0, a.jsxs)("div", {
													className: "relative flex-1",
													children: [
														(0, a.jsx)(L.A, {
															className:
																"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
														}),
														(0, a.jsx)(_.p, {
															placeholder:
																"Search by customer, ID, vehicle, or plate...",
															value: s,
															onChange: (e) => t(e.target.value),
															className: "pl-9",
														}),
													],
												}),
												(0, a.jsxs)(A.l6, {
													value: c,
													onValueChange: x,
													children: [
														(0, a.jsxs)(A.bq, {
															className: "w-full sm:w-40",
															children: [
																(0, a.jsx)(I.A, {
																	className: "mr-2 h-4 w-4",
																}),
																(0, a.jsx)(A.yv, {
																	placeholder: "Status",
																}),
															],
														}),
														(0, a.jsxs)(A.gC, {
															children: [
																(0, a.jsx)(A.eb, {
																	value: "all",
																	children: "All Status",
																}),
																(0, a.jsx)(A.eb, {
																	value: "draft",
																	children: "Draft",
																}),
																(0, a.jsx)(A.eb, {
																	value: "submitted",
																	children: "Submitted",
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "mb-4 space-y-3 sm:mb-6",
											children: [
												(0, a.jsxs)("div", {
													className:
														"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
													children: [
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(C.J, {
																	htmlFor:
																		"inspection-date-from",
																	className:
																		"text-xs text-muted-foreground",
																	children:
																		"Inspection date from",
																}),
																(0, a.jsx)(_.p, {
																	id: "inspection-date-from",
																	type: "date",
																	value: h,
																	max: f || void 0,
																	onChange: (e) =>
																		g(e.target.value),
																}),
															],
														}),
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(C.J, {
																	htmlFor: "inspection-date-to",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Inspection date to",
																}),
																(0, a.jsx)(_.p, {
																	id: "inspection-date-to",
																	type: "date",
																	value: f,
																	min: h || void 0,
																	onChange: (e) =>
																		v(e.target.value),
																}),
															],
														}),
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(C.J, {
																	htmlFor:
																		"inspection-completed-from",
																	className:
																		"text-xs text-muted-foreground",
																	children:
																		"Completed date from",
																}),
																(0, a.jsx)(_.p, {
																	id: "inspection-completed-from",
																	type: "date",
																	value: b,
																	max: q || void 0,
																	onChange: (e) =>
																		X(e.target.value),
																}),
															],
														}),
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(C.J, {
																	htmlFor:
																		"inspection-completed-to",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Completed date to",
																}),
																(0, a.jsx)(_.p, {
																	id: "inspection-completed-to",
																	type: "date",
																	value: q,
																	min: b || void 0,
																	onChange: (e) =>
																		G(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, a.jsx)("div", {
													className: "flex justify-end",
													children: (0, a.jsx)(B.r, {
														onClear: ex,
														disabled: !em,
													}),
												}),
											],
										}),
										(0, a.jsx)("div", {
											className: "space-y-3 md:hidden",
											children: ep
												? (0, a.jsx)("p", {
														className:
															"py-8 text-center text-sm text-muted-foreground",
														children: "Loading…",
												  })
												: 0 === ew.length
												? (0, a.jsxs)("div", {
														className:
															"rounded-lg border border-dashed py-10 text-center",
														children: [
															(0, a.jsx)(O.A, {
																className:
																	"mx-auto h-10 w-10 text-muted-foreground/40",
															}),
															(0, a.jsx)("p", {
																className:
																	"mt-3 text-sm font-medium",
																children: "No inspections found",
															}),
															(0, a.jsx)("p", {
																className:
																	"mt-1 text-xs text-muted-foreground",
																children:
																	"Try adjusting search or filters, or create a new inspection",
															}),
														],
												  })
												: (0, a.jsxs)(a.Fragment, {
														children: [
															(0, a.jsx)("p", {
																className:
																	"text-xs font-medium uppercase tracking-wide text-muted-foreground",
																children: "Tap a row for details",
															}),
															ew.map((s) => {
																let t = (0, K.w)({
																	vin:
																		s.vin_number ||
																		s.vin_chassis,
																	model:
																		s.vehicle_model ||
																		s.customer_vehicle,
																	license: s.license_plate,
																});
																return (0, a.jsxs)(
																	"div",
																	{
																		className:
																			"rounded-lg border border-border bg-card p-4",
																		children: [
																			(0, a.jsxs)("div", {
																				className:
																					"flex items-start gap-2",
																				children: [
																					(0, a.jsxs)(
																						"button",
																						{
																							type: "button",
																							onClick:
																								() =>
																									ea(
																										s.name
																									),
																							className:
																								"min-w-0 flex-1 text-left transition-colors hover:opacity-80",
																							children:
																								[
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"font-medium",
																											children:
																												t.primary,
																										}
																									),
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"truncate text-sm text-muted-foreground",
																											children:
																												s.name,
																										}
																									),
																									(0,
																									a.jsxs)(
																										"div",
																										{
																											className:
																												"mt-2 space-y-1 text-sm text-muted-foreground",
																											children:
																												[
																													(0,
																													a.jsx)(
																														"p",
																														{
																															children:
																																s.customer,
																														}
																													),
																													t.secondary
																														? (0,
																														  a.jsx)(
																																"p",
																																{
																																	children:
																																		t.secondary,
																																}
																														  )
																														: null,
																													(0,
																													a.jsx)(
																														"p",
																														{
																															children:
																																(0,
																																w.GP)(
																																	new Date(
																																		s.inspection_date
																																	),
																																	"MMM d, yyyy \xb7 h:mm a"
																																),
																														}
																													),
																													(0,
																													a.jsxs)(
																														"p",
																														{
																															children:
																																[
																																	s
																																		.customer_complaints
																																		?.length ||
																																		0,
																																	" issue",
																																	1 ===
																																	(s
																																		.customer_complaints
																																		?.length ||
																																		0)
																																		? ""
																																		: "s",
																																	" found",
																																],
																														}
																													),
																												],
																										}
																									),
																								],
																						}
																					),
																					(0, a.jsxs)(
																						"div",
																						{
																							className:
																								"flex shrink-0 flex-col items-end gap-2 self-stretch",
																							children:
																								[
																									(0,
																									a.jsx)(
																										m.E,
																										{
																											variant:
																												"outline",
																											className:
																												1 ===
																												(0,
																												j.O)(
																													s.docstatus
																												)
																													? "bg-chart-3/10 text-chart-3 border-chart-3/20"
																													: "bg-chart-4/10 text-chart-4 border-chart-4/20",
																											children:
																												1 ===
																												(0,
																												j.O)(
																													s.docstatus
																												)
																													? "Submitted"
																													: "Draft",
																										}
																									),
																									(s
																										.warning_lights
																										?.length ||
																										0) >
																									0
																										? (0,
																										  a.jsxs)(
																												m.E,
																												{
																													variant:
																														"outline",
																													className:
																														"max-w-36 justify-end text-[11px] leading-tight border-destructive bg-transparent text-foreground",
																													children:
																														[
																															s
																																.warning_lights
																																.length,
																															" warning",
																															s
																																.warning_lights
																																.length >
																															1
																																? "s"
																																: "",
																														],
																												}
																										  )
																										: null,
																									(0,
																									a.jsx)(
																										"div",
																										{
																											className:
																												"mt-auto",
																											children:
																												(0,
																												a.jsx)(
																													Z.m,
																													{
																														doctype:
																															"Vehicle Inspection",
																														docName:
																															s.name,
																														children:
																															(0 ===
																																(0,
																																j.O)(
																																	s.docstatus
																																) ||
																																(1 ===
																																	(0,
																																	j.O)(
																																		s.docstatus
																																	) &&
																																	!s.job_card)) &&
																															(0,
																															a.jsxs)(
																																$.rI,
																																{
																																	children:
																																		[
																																			(0,
																																			a.jsx)(
																																				$.ty,
																																				{
																																					asChild:
																																						!0,
																																					children:
																																						(0,
																																						a.jsx)(
																																							o.$,
																																							{
																																								variant:
																																									"ghost",
																																								size: "icon",
																																								className:
																																									"shrink-0",
																																								children:
																																									(0,
																																									a.jsx)(
																																										D.A,
																																										{
																																											className:
																																												"h-4 w-4",
																																										}
																																									),
																																							}
																																						),
																																				}
																																			),
																																			(0,
																																			a.jsxs)(
																																				$.SQ,
																																				{
																																					align: "end",
																																					children:
																																						[
																																							0 ===
																																								(0,
																																								j.O)(
																																									s.docstatus
																																								) &&
																																								(0,
																																								a.jsx)(
																																									$._2,
																																									{
																																										onClick:
																																											() =>
																																												e(
																																													"inspection-new",
																																													{
																																														id: s.name,
																																													}
																																												),
																																										children:
																																											"Continue Editing",
																																									}
																																								),
																																							(0,
																																							j.Y)(
																																								s
																																							) &&
																																								(0,
																																								a.jsx)(
																																									$._2,
																																									{
																																										className:
																																											"text-primary",
																																										onClick:
																																											() =>
																																												ed(
																																													s.name
																																												),
																																										children:
																																											"Start diagnosis",
																																									}
																																								),
																																							s.service_estimate &&
																																								(0,
																																								a.jsx)(
																																									$._2,
																																									{
																																										onClick:
																																											() =>
																																												e(
																																													"estimate-detail",
																																													{
																																														id: s.service_estimate,
																																													}
																																												),
																																										children:
																																											"View service estimate",
																																									}
																																								),
																																						],
																																				}
																																			),
																																		],
																																}
																															),
																													}
																												),
																										}
																									),
																								],
																						}
																					),
																				],
																			}),
																			s.job_card
																				? (0, a.jsxs)(
																						"button",
																						{
																							type: "button",
																							onClick:
																								() =>
																									e(
																										"job-card-detail",
																										{
																											id:
																												s.job_card ??
																												"",
																										}
																									),
																							className:
																								"mt-3 flex items-center gap-1 text-sm text-primary hover:underline",
																							children:
																								[
																									(0,
																									a.jsx)(
																										E.A,
																										{
																											className:
																												"h-4 w-4",
																										}
																									),
																									s.job_card,
																								],
																						}
																				  )
																				: null,
																			(0, j.Y)(s)
																				? (0, a.jsxs)(
																						o.$,
																						{
																							size: "sm",
																							className:
																								"mt-3 w-full",
																							disabled:
																								ei ===
																								s.name,
																							onClick:
																								() =>
																									ed(
																										s.name
																									),
																							children:
																								[
																									(0,
																									a.jsx)(
																										p.A,
																										{
																											className:
																												"mr-2 h-4 w-4",
																										}
																									),
																									ei ===
																									s.name
																										? "Creating…"
																										: "Start diagnosis",
																								],
																						}
																				  )
																				: null,
																			s.service_estimate &&
																			!s.job_card
																				? (0, a.jsx)(o.$, {
																						size: "sm",
																						variant:
																							"outline",
																						className:
																							"mt-3 w-full",
																						onClick:
																							() =>
																								e(
																									"estimate-detail",
																									{
																										id: s.service_estimate,
																									}
																								),
																						children:
																							"View service estimate",
																				  })
																				: null,
																		],
																	},
																	s.name
																);
															}),
														],
												  }),
										}),
										ew.length > 0
											? (0, a.jsx)("div", {
													className: "mt-4 md:hidden",
													children: (0, a.jsx)(H.$, {
														page: R,
														pageSize: ee,
														totalItems: eg,
														loadedCount: ev,
														onPageChange: U,
														onPageSizeChange: es,
														onLoadMore: eN,
														isLoadingMore: eb,
													}),
											  })
											: null,
										(0, a.jsx)("div", {
											className:
												"dms-table-panel hidden md:block rounded-lg border",
											children: (0, a.jsxs)(u.XI, {
												children: [
													(0, a.jsx)(u.A0, {
														children: (0, a.jsxs)(u.Hj, {
															children: [
																(0, a.jsx)(u.nd, {
																	children: "Inspection",
																}),
																(0, a.jsx)(u.nd, {
																	children: "Customer",
																}),
																(0, a.jsx)(u.nd, {
																	children: "Vehicle",
																}),
																(0, a.jsx)(u.nd, {
																	children: "Condition",
																}),
																(0, a.jsx)(u.nd, {
																	children: "Status",
																}),
																(0, a.jsx)(u.nd, {
																	children: "Job Card",
																}),
																(0, a.jsx)(u.nd, {
																	className: "w-12",
																}),
															],
														}),
													}),
													(0, a.jsx)(u.BF, {
														children: ew.map((s) => {
															let t = (0, K.w)({
																vin: s.vin_number || s.vin_chassis,
																model:
																	s.vehicle_model ||
																	s.customer_vehicle,
																license: s.license_plate,
															});
															return (0, a.jsxs)(
																u.Hj,
																{
																	children: [
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"flex items-center gap-3",
																					children: [
																						(0, a.jsx)(
																							"div",
																							{
																								className:
																									"flex h-10 w-10 items-center justify-center rounded-full bg-primary/10",
																								children:
																									(0,
																									a.jsx)(
																										O.A,
																										{
																											className:
																												"h-3.5 w-3.5 text-primary",
																										}
																									),
																							}
																						),
																						(0,
																						a.jsxs)(
																							"div",
																							{
																								children:
																									[
																										(0,
																										a.jsx)(
																											"button",
																											{
																												onClick:
																													() =>
																														ea(
																															s.name
																														),
																												className:
																													"font-medium hover:text-primary",
																												children:
																													s.name,
																											}
																										),
																										(0,
																										a.jsx)(
																											"div",
																											{
																												className:
																													"flex items-center gap-2 text-sm text-muted-foreground",
																												children:
																													(0,
																													a.jsx)(
																														"span",
																														{
																															children:
																																(0,
																																w.GP)(
																																	new Date(
																																		s.inspection_date
																																	),
																																	"MMM d, h:mm a"
																																),
																														}
																													),
																											}
																										),
																									],
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"flex items-center gap-2",
																					children: [
																						(0, a.jsx)(
																							M.A,
																							{
																								className:
																									"h-4 w-4 text-muted-foreground",
																							}
																						),
																						(0, a.jsx)(
																							"span",
																							{
																								children:
																									s.customer,
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					children: [
																						(0,
																						a.jsxs)(
																							"div",
																							{
																								className:
																									"flex items-center gap-2",
																								children:
																									[
																										(0,
																										a.jsx)(
																											J.A,
																											{
																												className:
																													"h-4 w-4 text-muted-foreground",
																											}
																										),
																										(0,
																										a.jsx)(
																											"span",
																											{
																												className:
																													"font-medium",
																												children:
																													t.primary,
																											}
																										),
																									],
																							}
																						),
																						t.secondary
																							? (0,
																							  a.jsx)(
																									"p",
																									{
																										className:
																											"text-sm text-muted-foreground",
																										children:
																											t.secondary,
																									}
																							  )
																							: null,
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"space-y-1",
																					children: [
																						(0, a.jsx)(
																							"div",
																							{
																								className:
																									"flex items-center gap-2",
																								children:
																									(s
																										.warning_lights
																										?.length ||
																										0) >
																									0
																										? (0,
																										  a.jsxs)(
																												m.E,
																												{
																													variant:
																														"outline",
																													className:
																														"bg-transparent text-foreground border-destructive",
																													children:
																														[
																															s
																																.warning_lights
																																.length,
																															" Warning Light",
																															s
																																.warning_lights
																																.length >
																															1
																																? "s"
																																: "",
																														],
																												}
																										  )
																										: (0,
																										  a.jsx)(
																												m.E,
																												{
																													variant:
																														"outline",
																													className:
																														"bg-chart-3/10 text-chart-3 border-chart-3/20",
																													children:
																														"No Warnings",
																												}
																										  ),
																							}
																						),
																						(0,
																						a.jsxs)(
																							"p",
																							{
																								className:
																									"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																								children:
																									[
																										s
																											.customer_complaints
																											?.length ||
																											0,
																										" issues found",
																									],
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsx)(
																				m.E,
																				{
																					variant:
																						"outline",
																					className:
																						1 ===
																						(0, j.O)(
																							s.docstatus
																						)
																							? "bg-chart-3/10 text-chart-3 border-chart-3/20"
																							: "bg-chart-4/10 text-chart-4 border-chart-4/20",
																					children:
																						1 ===
																						(0, j.O)(
																							s.docstatus
																						)
																							? "Submitted"
																							: "Draft",
																				}
																			),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: s.job_card
																				? (0, a.jsxs)(
																						"button",
																						{
																							onClick:
																								() =>
																									e(
																										"job-card-detail",
																										{
																											id:
																												s.job_card ??
																												"",
																										}
																									),
																							className:
																								"flex items-center gap-1 text-sm text-primary hover:underline",
																							children:
																								[
																									(0,
																									a.jsx)(
																										E.A,
																										{
																											className:
																												"h-4 w-4",
																										}
																									),
																									s.job_card,
																								],
																						}
																				  )
																				: (0, a.jsx)(
																						"span",
																						{
																							className:
																								"text-sm text-muted-foreground",
																							children:
																								"-",
																						}
																				  ),
																		}),
																		(0, a.jsx)(u.nA, {
																			children: (0, a.jsx)(
																				Z.m,
																				{
																					doctype:
																						"Vehicle Inspection",
																					docName:
																						s.name,
																					children:
																						(0 ===
																							(0,
																							j.O)(
																								s.docstatus
																							) ||
																							(1 ===
																								(0,
																								j.O)(
																									s.docstatus
																								) &&
																								!s.job_card)) &&
																						(0,
																						a.jsxs)(
																							$.rI,
																							{
																								children:
																									[
																										(0,
																										a.jsx)(
																											$.ty,
																											{
																												asChild:
																													!0,
																												children:
																													(0,
																													a.jsx)(
																														o.$,
																														{
																															variant:
																																"ghost",
																															size: "icon",
																															children:
																																(0,
																																a.jsx)(
																																	D.A,
																																	{
																																		className:
																																			"h-4 w-4",
																																	}
																																),
																														}
																													),
																											}
																										),
																										(0,
																										a.jsxs)(
																											$.SQ,
																											{
																												align: "end",
																												children:
																													[
																														0 ===
																															(0,
																															j.O)(
																																s.docstatus
																															) &&
																															(0,
																															a.jsx)(
																																$._2,
																																{
																																	onClick:
																																		() =>
																																			e(
																																				"inspection-new",
																																				{
																																					id: s.name,
																																				}
																																			),
																																	children:
																																		"Continue Editing",
																																}
																															),
																														(0,
																														j.Y)(
																															s
																														) &&
																															(0,
																															a.jsx)(
																																$._2,
																																{
																																	className:
																																		"text-primary",
																																	onClick:
																																		() =>
																																			ed(
																																				s.name
																																			),
																																	children:
																																		"Start diagnosis",
																																}
																															),
																														s.service_estimate &&
																															(0,
																															a.jsx)(
																																$._2,
																																{
																																	onClick:
																																		() =>
																																			e(
																																				"estimate-detail",
																																				{
																																					id: s.service_estimate,
																																				}
																																			),
																																	children:
																																		"View service estimate",
																																}
																															),
																													],
																											}
																										),
																									],
																							}
																						),
																				}
																			),
																		}),
																	],
																},
																s.name
															);
														}),
													}),
												],
											}),
										}),
										0 === ew.length &&
											!ep &&
											(0, a.jsxs)("div", {
												className: "hidden py-12 text-center md:block",
												children: [
													(0, a.jsx)(O.A, {
														className:
															"mx-auto h-12 w-12 text-muted-foreground/50",
													}),
													(0, a.jsx)("p", {
														className: "mt-4 text-lg font-medium",
														children: "No inspections found",
													}),
													(0, a.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children:
															"Try adjusting your search or filter criteria",
													}),
												],
											}),
										(0, a.jsx)("div", {
											className: "hidden md:block",
											children: (0, a.jsx)(H.$, {
												page: R,
												pageSize: ee,
												totalItems: eg,
												loadedCount: ev,
												onPageChange: U,
												onPageSizeChange: es,
												onLoadMore: eN,
												isLoadingMore: eb,
											}),
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)("div", {
							className: "order-2 space-y-3 md:order-1",
							children: [
								(0, a.jsxs)("div", {
									className: "flex items-center justify-between md:hidden",
									children: [
										(0, a.jsx)("p", {
											className: "text-sm font-medium text-muted-foreground",
											children: "Summary",
										}),
										(0, a.jsxs)(o.$, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-8",
											onClick: () => er((e) => !e),
											children: [
												(0, a.jsx)(Q.A, { className: "mr-2 h-3.5 w-3.5" }),
												en ? "Hide stats" : "Show stats",
												(0, a.jsx)(P.A, {
													className: (0, K.cn)(
														"ml-2 h-3.5 w-3.5 transition-transform",
														en && "rotate-180"
													),
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: (0, K.cn)(
										"grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
										en ? "grid" : "hidden md:grid"
									),
									children: [
										(0, a.jsx)(y.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(y.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"rounded-full bg-primary/10 p-1.5",
														children: (0, a.jsx)(O.A, {
															className: "h-3.5 w-3.5 text-primary",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: ey,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Today's Inspections",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(y.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(y.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"rounded-full bg-chart-4/10 p-1.5",
														children: (0, a.jsx)(z.A, {
															className: "h-3.5 w-3.5 text-chart-4",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: e_,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Pending Submission",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(y.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(y.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"rounded-full bg-destructive/10 p-1.5",
														children: (0, a.jsx)(T.A, {
															className:
																"h-3.5 w-3.5 text-destructive",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: eC,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Issues Found",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(y.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(y.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"rounded-full bg-chart-3/10 p-1.5",
														children: (0, a.jsx)(F.A, {
															className: "h-3.5 w-3.5 text-chart-3",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: ef.filter(
																	(e) => e.job_card
																).length,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Job Cards Created",
															}),
														],
													}),
												],
											}),
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(d.BN, {
							open: !!et,
							onOpenChange: (e) => {
								e || ea(null);
							},
							title: et || "",
							subtitle: ec?.customer_vehicle || ec?.customer,
							badge: ec
								? { label: 1 === (0, j.O)(ec.docstatus) ? "Submitted" : "Draft" }
								: void 0,
							isLoading: eo,
							contentScroll: "inner",
							onOpenInDesk: () =>
								window.open(`/app/vehicle-inspection/${et}`, "_blank"),
							children:
								ec &&
								et &&
								(0, a.jsx)(
									N,
									{
										inspection: ec,
										onStartDiagnosis: () => ed(et),
										startingDiagnosis: ei === et,
									},
									et
								),
						}),
					],
				});
			}
		},
		61991: (e, s, t) => {
			t.d(s, { w: () => i });
			var a = t(95155);
			t(12115);
			var n = t(89803),
				r = t(91337);
			function i({ className: e, orientation: s = "horizontal", decorative: t = !0, ...l }) {
				return (0, a.jsx)(n.b, {
					"data-slot": "separator",
					decorative: t,
					orientation: s,
					className: (0, r.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...l,
				});
			}
		},
		79984: (e, s, t) => {
			t.d(s, { BT: () => d, Wu: () => c, ZB: () => l, Zp: () => r, aR: () => i });
			var a = t(95155);
			t(12115);
			var n = t(91337);
			function r({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...s,
				});
			}
			function i({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...s,
				});
			}
			function l({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...s,
				});
			}
			function d({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...s,
				});
			}
			function c({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...s,
				});
			}
		},
		81672: (e, s, t) => {
			t.d(s, { Ge: () => m, N0: () => c, Yq: () => l, gQ: () => o, r6: () => d });
			let a = [
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
				r = (e) => String(e).padStart(2, "0");
			function i(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let s = new Date(e);
					return Number.isNaN(s.getTime()) ? null : s;
				}
				let s = String(e).trim();
				if (!s) return null;
				let t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
				if (t) return new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
				let a = new Date(s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s);
				return Number.isNaN(a.getTime()) ? null : a;
			}
			function l(e, s = "") {
				let t = i(e);
				return t ? `${r(t.getDate())}/${r(t.getMonth() + 1)}/${t.getFullYear()}` : s;
			}
			function d(e, s = "", t = !1) {
				let a = i(e);
				if (!a) return s;
				let n = `${r(a.getHours())}:${r(a.getMinutes())}${
					t ? `:${r(a.getSeconds())}` : ""
				}`;
				return `${l(a)} ${n}`;
			}
			function c(e, s = "") {
				let t = i(e);
				return t ? `${a[t.getMonth()]} ${t.getFullYear()}` : s;
			}
			function o(e, s = "") {
				let t = i(e);
				return t ? n[t.getDay()] : s;
			}
			function m(e, s = "") {
				let t = i(e);
				return t ? `${n[t.getDay()]}, ${l(t)}` : s;
			}
		},
		98883: (e, s, t) => {
			t.d(s, { Qb: () => v, JH: () => f, BN: () => g });
			var a = t(95155);
			t(12115);
			var n = t(29483),
				r = t(33210),
				i = t(91337);
			function l({ ...e }) {
				return (0, a.jsx)(n.bL, { "data-slot": "sheet", ...e });
			}
			function d({ ...e }) {
				return (0, a.jsx)(n.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function c({ className: e, ...s }) {
				return (0, a.jsx)(n.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...s,
				});
			}
			function o({ className: e, children: s, side: t = "right", ...l }) {
				return (0, a.jsxs)(d, {
					children: [
						(0, a.jsx)(c, {}),
						(0, a.jsxs)(n.UC, {
							"data-slot": "sheet-content",
							className: (0, i.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === t &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === t &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === t &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === t &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...l,
							children: [
								s,
								(0, a.jsxs)(n.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, a.jsx)(r.A, { className: "size-4" }),
										(0, a.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, i.cn)("flex flex-col gap-1.5 p-4", e),
					...s,
				});
			}
			function x({ className: e, ...s }) {
				return (0, a.jsx)(n.hE, {
					"data-slot": "sheet-title",
					className: (0, i.cn)("text-foreground font-semibold", e),
					...s,
				});
			}
			function u({ className: e, ...s }) {
				return (0, a.jsx)(n.VY, {
					"data-slot": "sheet-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...s,
				});
			}
			var h = t(38291),
				p = t(61991),
				j = t(6296);
			function g({
				open: e,
				onOpenChange: s,
				title: t,
				subtitle: n,
				badge: r,
				isLoading: d,
				onOpenInDesk: c,
				footer: f,
				contentScroll: v = "outer",
				children: b,
			}) {
				return (0, a.jsx)(l, {
					open: e,
					onOpenChange: s,
					children: (0, a.jsxs)(o, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, a.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, a.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, a.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, a.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, a.jsx)(x, {
														className: "text-lg",
														children: t,
													}),
													r &&
														(0, a.jsx)(h.E, {
															variant: r.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: r.label,
														}),
												],
											}),
											n && (0, a.jsx)(u, { className: "mt-1", children: n }),
										],
									}),
								}),
							}),
							(0, a.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							d
								? (0, a.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, a.jsx)(j.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsx)("div", {
												className: (0, i.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === v
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: b,
											}),
											f &&
												(0, a.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: f,
												}),
										],
								  }),
						],
					}),
				});
			}
			function f({ title: e, children: s, className: t }) {
				return (0, a.jsxs)("div", {
					className: (0, i.cn)("space-y-2", t),
					children: [
						(0, a.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, a.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, a.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: s,
						}),
					],
				});
			}
			function v({ label: e, value: s, className: t }) {
				return (0, a.jsxs)("div", {
					className: (0, i.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						t
					),
					children: [
						(0, a.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, a.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: s || "—",
						}),
					],
				});
			}
		},
		99916: (e, s, t) => {
			t.d(s, { r: () => l });
			var a = t(95155),
				n = t(33210),
				r = t(4474),
				i = t(91337);
			function l({
				onClear: e,
				disabled: s = !1,
				label: t = "Clear filters",
				className: d,
			}) {
				return (0, a.jsxs)(r.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: s,
					"aria-label": t,
					title: t,
					className: (0, i.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", d),
					children: [
						(0, a.jsx)(n.A, { "aria-hidden": "true" }),
						(0, a.jsx)("span", { className: "hidden sm:inline", children: t }),
					],
				});
			}
		},
	},
]);
