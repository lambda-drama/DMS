"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4967],
	{
		14967: (e, t, s) => {
			s.r(t), s.d(t, { default: () => E });
			var a = s(95155),
				r = s(12115),
				n = s(55833),
				i = s(56031),
				d = s(66609),
				l = s(4474),
				c = s(79984),
				o = s(38291),
				m = s(61991),
				x = s(70521),
				u = s(41585),
				h = s(80723);
			let p = (0, s(90425).A)("square-pen", [
				[
					"path",
					{
						d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
						key: "1m0v6g",
					},
				],
				[
					"path",
					{
						d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
						key: "ohrbg2",
					},
				],
			]);
			var j = s(6296),
				g = s(12651),
				f = s(20232),
				v = s(42869),
				N = s(85118),
				b = s(92289),
				y = s(14636),
				w = s(32967),
				_ = s(48368),
				k = s(93053),
				C = s(57420),
				A = s(24538),
				S = s(84980),
				z = s(36020),
				M = s(65855),
				Z = s(20953),
				R = s(91337);
			function $(e) {
				if (!e) return null;
				let t = new Date(e.includes("T") ? e : e.replace(" ", "T"));
				return Number.isNaN(t.getTime()) ? null : t;
			}
			function B(e) {
				return null == e || Number.isNaN(Number(e)) ? "—" : Number(e).toLocaleString();
			}
			function E() {
				var e;
				let t,
					{ viewParams: s, navigate: E } = (0, n.c)(),
					I = s.get("id") || "",
					{ data: W, isLoading: D, error: F, mutate: q } = (0, z.zV)(I || null),
					[L, P] = (0, r.useState)(!1),
					[H, V] = (0, r.useState)(!1),
					[T, G] = (0, r.useState)(!1),
					[O, J] = (0, r.useState)(!1);
				if (!I)
					return (0, a.jsxs)("div", {
						className: "flex flex-col items-center justify-center h-96 gap-4",
						children: [
							(0, a.jsx)(u.A, { className: "h-12 w-12 text-destructive" }),
							(0, a.jsx)("p", {
								className: "text-lg text-muted-foreground",
								children: "No appointment ID provided",
							}),
							(0, a.jsx)(l.$, {
								variant: "outline",
								onClick: () => E("appointments"),
								children: "Back to Appointments",
							}),
						],
					});
				if (D)
					return (0, a.jsx)("div", {
						className: "flex items-center justify-center h-96",
						children: (0, a.jsx)("div", {
							className:
								"h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
						}),
					});
				if (F || !W)
					return (0, a.jsxs)("div", {
						className: "flex flex-col items-center justify-center h-96 gap-4",
						children: [
							(0, a.jsx)(u.A, { className: "h-12 w-12 text-destructive" }),
							(0, a.jsx)("p", {
								className: "text-lg text-muted-foreground",
								children: "Failed to load appointment",
							}),
							(0, a.jsx)(l.$, {
								variant: "outline",
								onClick: () => E("appointments"),
								children: "Back to Appointments",
							}),
						],
					});
				let K =
						((e = W.status),
						(t = {
							Draft: {
								color: "text-muted-foreground",
								bgColor: "bg-muted border-muted-foreground/20",
							},
							Requested: {
								color: "text-sky-800",
								bgColor: "bg-sky-500/10 border-sky-500/20",
							},
							Scheduled: {
								color: "text-chart-1",
								bgColor: "bg-chart-1/10 border-chart-1/20",
							},
							Confirmed: {
								color: "text-emerald-800",
								bgColor: "bg-emerald-500/10 border-emerald-500/20",
							},
							Booked: {
								color: "text-chart-1",
								bgColor: "bg-chart-1/10 border-chart-1/20",
							},
							"Reminder Sent": {
								color: "text-chart-4",
								bgColor: "bg-chart-4/10 border-chart-4/20",
							},
							Arrived: {
								color: "text-chart-3",
								bgColor: "bg-chart-3/10 border-chart-3/20",
							},
							"In Inspection": {
								color: "text-primary",
								bgColor: "bg-primary/10 border-primary/20",
							},
							"In Workshop": {
								color: "text-primary",
								bgColor: "bg-primary/10 border-primary/20",
							},
							"Ready for Pickup": {
								color: "text-chart-3",
								bgColor: "bg-chart-3/10 border-chart-3/20",
							},
							Completed: {
								color: "text-chart-3",
								bgColor: "bg-chart-3/10 border-chart-3/20",
							},
							"No-Show": {
								color: "text-destructive",
								bgColor: "bg-destructive/10 border-destructive/20",
							},
							Cancelled: {
								color: "text-destructive",
								bgColor: "bg-destructive/10 border-destructive/20",
							},
							Rescheduled: {
								color: "text-chart-4",
								bgColor: "bg-chart-4/10 border-chart-4/20",
							},
						})[e] || t.Booked),
					U = (0, R.w)({
						vin: W.vin_number || W.vin_chassis,
						model: W.vehicle_model || W.vehicle,
						license: W.license_plate,
					}),
					X = (0, Z.ms)(W),
					Y = $(W.appointment_date_time),
					Q = $(W.promised_delivery_date_time),
					ee = $(W.arrived_date_time),
					et =
						W.assigned_service_advisor_name ||
						W.assigned_service_advisor ||
						W.preferred_advisor ||
						"Not assigned",
					es = W.service_type_requested || [],
					ea =
						"Cancelled" !== W.status &&
						"Completed" !== W.status &&
						"No-Show" !== W.status;
				async function er() {
					P(!0);
					try {
						E("inspection-new", { appointment: W.name });
					} finally {
						P(!1);
					}
				}
				async function en() {
					V(!0);
					try {
						await M.tC(W.name), d.o.success("Customer marked as arrived"), await q();
					} catch (e) {
						d.o.error(e instanceof Error ? e.message : "Failed to mark arrived");
					} finally {
						V(!1);
					}
				}
				async function ei() {
					G(!0);
					try {
						await M.ol(W.name),
							d.o.success("Appointment cancelled"),
							J(!1),
							await q(),
							E("appointments");
					} catch (e) {
						d.o.error(e instanceof Error ? e.message : "Failed to cancel appointment");
					} finally {
						G(!1);
					}
				}
				return (0, a.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, a.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
							children: [
								(0, a.jsxs)("div", {
									className: "flex items-start gap-4",
									children: [
										(0, a.jsx)(l.$, {
											variant: "ghost",
											size: "icon",
											onClick: () => E("appointments"),
											children: (0, a.jsx)(h.A, { className: "h-5 w-5" }),
										}),
										(0, a.jsxs)("div", {
											children: [
												(0, a.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [
														(0, a.jsx)("h1", {
															className: "text-2xl font-bold",
															children: W.name,
														}),
														(0, a.jsx)(o.E, {
															variant: "outline",
															className: K.bgColor,
															children: W.status,
														}),
														W.priority &&
															"Normal" !== W.priority &&
															(0, a.jsx)(o.E, {
																variant: "outline",
																className:
																	"bg-chart-4/10 text-chart-4 border-chart-4/20",
																children: W.priority,
															}),
													],
												}),
												(0, a.jsx)("p", {
													className:
														"mt-1 text-sm text-muted-foreground",
													children: W.booking_source
														? `Created via ${W.booking_source}`
														: "Service appointment",
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										0 !== (0, Z.mC)(W.docstatus) ||
										("Draft" !== W.status && W.status)
											? "Cancelled" !== W.status && "Completed" !== W.status
												? (0, a.jsxs)(l.$, {
														variant: "outline",
														size: "sm",
														onClick: () =>
															E("appointment-new", { id: W.name }),
														children: [
															(0, a.jsx)(p, {
																className: "mr-2 h-4 w-4",
															}),
															"Edit",
														],
												  })
												: null
											: (0, a.jsxs)(l.$, {
													variant: "outline",
													size: "sm",
													onClick: () =>
														E("appointment-new", { id: W.name }),
													children: [
														(0, a.jsx)(p, {
															className: "mr-2 h-4 w-4",
														}),
														"Continue Editing",
													],
											  }),
										1 === (0, Z.mC)(W.docstatus) &&
											[
												"Requested",
												"Scheduled",
												"Confirmed",
												"Booked",
												"Reminder Sent",
												"Rescheduled",
											].includes(W.status) &&
											(0, a.jsxs)(l.$, {
												size: "sm",
												onClick: en,
												disabled: H,
												children: [
													H
														? (0, a.jsx)(j.A, {
																className:
																	"mr-2 h-4 w-4 animate-spin",
														  })
														: (0, a.jsx)(g.A, {
																className: "mr-2 h-4 w-4",
														  }),
													"Mark Arrived",
												],
											}),
										"Arrived" === W.status &&
											!W.inspection &&
											(0, a.jsx)(l.$, {
												size: "sm",
												onClick: er,
												disabled: L,
												children: L
													? (0, a.jsxs)(a.Fragment, {
															children: [
																(0, a.jsx)(j.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
																}),
																"Starting...",
															],
													  })
													: (0, a.jsxs)(a.Fragment, {
															children: [
																(0, a.jsx)(f.A, {
																	className: "mr-2 h-4 w-4",
																}),
																"Start Inspection",
															],
													  }),
											}),
									],
								}),
							],
						}),
						(0, a.jsxs)("div", {
							className: "grid gap-6 lg:grid-cols-3",
							children: [
								(0, a.jsxs)("div", {
									className: "space-y-6 lg:col-span-2",
									children: [
										(0, a.jsxs)(c.Zp, {
											children: [
												(0, a.jsx)(c.aR, {
													children: (0, a.jsxs)(c.ZB, {
														className:
															"flex items-center gap-2 text-lg",
														children: [
															(0, a.jsx)(v.A, {
																className:
																	"h-3.5 w-3.5 text-primary",
															}),
															"Customer & Vehicle",
														],
													}),
												}),
												(0, a.jsx)(c.Wu, {
													children: (0, a.jsxs)("div", {
														className: "grid gap-6 sm:grid-cols-2",
														children: [
															(0, a.jsxs)("div", {
																className: "space-y-4",
																children: [
																	(0, a.jsx)("h4", {
																		className:
																			"text-sm font-medium text-muted-foreground",
																		children:
																			"Customer Information",
																	}),
																	(0, a.jsxs)("div", {
																		className: "space-y-3",
																		children: [
																			(0, a.jsxs)("div", {
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
																									v.A,
																									{
																										className:
																											"h-3.5 w-3.5 text-primary",
																									}
																								),
																						}
																					),
																					(0, a.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"font-medium",
																											children:
																												W.customer_name ||
																												W.customer ||
																												"—",
																										}
																									),
																									W.customer_name &&
																									W.customer
																										? (0,
																										  a.jsx)(
																												"p",
																												{
																													className:
																														"text-sm text-muted-foreground",
																													children:
																														W.customer,
																												}
																										  )
																										: null,
																								],
																						}
																					),
																				],
																			}),
																			X
																				? (0, a.jsxs)(
																						"div",
																						{
																							className:
																								"flex items-center gap-2 text-sm",
																							children:
																								[
																									(0,
																									a.jsx)(
																										N.A,
																										{
																											className:
																												"h-4 w-4 text-muted-foreground",
																										}
																									),
																									(0,
																									a.jsx)(
																										"a",
																										{
																											href: `tel:${X}`,
																											className:
																												"hover:text-primary",
																											children:
																												X,
																										}
																									),
																								],
																						}
																				  )
																				: null,
																			W.customer_email
																				? (0, a.jsxs)(
																						"div",
																						{
																							className:
																								"flex items-center gap-2 text-sm",
																							children:
																								[
																									(0,
																									a.jsx)(
																										b.A,
																										{
																											className:
																												"h-4 w-4 text-muted-foreground",
																										}
																									),
																									(0,
																									a.jsx)(
																										"a",
																										{
																											href: `mailto:${W.customer_email}`,
																											className:
																												"hover:text-primary",
																											children:
																												W.customer_email,
																										}
																									),
																								],
																						}
																				  )
																				: null,
																		],
																	}),
																],
															}),
															(0, a.jsxs)("div", {
																className: "space-y-4",
																children: [
																	(0, a.jsx)("h4", {
																		className:
																			"text-sm font-medium text-muted-foreground",
																		children:
																			"Vehicle Information",
																	}),
																	(0, a.jsxs)("div", {
																		className: "space-y-3",
																		children: [
																			(0, a.jsxs)("div", {
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
																									y.A,
																									{
																										className:
																											"h-3.5 w-3.5 text-primary",
																									}
																								),
																						}
																					),
																					(0, a.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"font-medium",
																											children:
																												U.primary,
																										}
																									),
																									U.secondary
																										? (0,
																										  a.jsx)(
																												"p",
																												{
																													className:
																														"text-sm text-muted-foreground",
																													children:
																														U.secondary,
																												}
																										  )
																										: null,
																								],
																						}
																					),
																				],
																			}),
																			W.current_odometer
																				? (0, a.jsxs)(
																						"div",
																						{
																							className:
																								"text-sm",
																							children:
																								[
																									(0,
																									a.jsx)(
																										"span",
																										{
																											className:
																												"text-muted-foreground",
																											children:
																												"Odometer: ",
																										}
																									),
																									(0,
																									a.jsxs)(
																										"span",
																										{
																											children:
																												[
																													W.current_odometer.toLocaleString(),
																													" km",
																												],
																										}
																									),
																								],
																						}
																				  )
																				: null,
																			W.warranty_status
																				? (0, a.jsxs)(
																						o.E,
																						{
																							variant:
																								"outline",
																							className:
																								"Active" ===
																								W.warranty_status
																									? "bg-chart-3/10 text-chart-3 border-chart-3/20"
																									: "bg-muted text-muted-foreground",
																							children:
																								[
																									"Warranty: ",
																									W.warranty_status,
																								],
																						}
																				  )
																				: null,
																		],
																	}),
																],
															}),
														],
													}),
												}),
											],
										}),
										(0, a.jsxs)(c.Zp, {
											children: [
												(0, a.jsx)(c.aR, {
													children: (0, a.jsxs)(c.ZB, {
														className:
															"flex items-center gap-2 text-lg",
														children: [
															(0, a.jsx)(w.A, {
																className:
																	"h-3.5 w-3.5 text-primary",
															}),
															"Service Details",
														],
													}),
												}),
												(0, a.jsxs)(c.Wu, {
													className: "min-w-0 space-y-4 sm:space-y-6",
													children: [
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("h4", {
																	className:
																		"mb-3 text-sm font-medium text-muted-foreground",
																	children: "Requested Services",
																}),
																es.length > 0
																	? (0, a.jsx)("div", {
																			className:
																				"flex flex-wrap gap-2",
																			children: es.map(
																				(e, t) =>
																					(0, a.jsxs)(
																						o.E,
																						{
																							variant:
																								"secondary",
																							className:
																								"py-1.5",
																							children:
																								[
																									e.service_type,
																									e.estimated_hours
																										? (0,
																										  a.jsxs)(
																												"span",
																												{
																													className:
																														"ml-1 text-muted-foreground",
																													children:
																														[
																															"(",
																															e.estimated_hours,
																															"h)",
																														],
																												}
																										  )
																										: null,
																								],
																						},
																						`${
																							e.service_type ||
																							t
																						}`
																					)
																			),
																	  })
																	: (0, a.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children:
																				"No services recorded",
																	  }),
															],
														}),
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("h4", {
																	className:
																		"mb-2 text-sm font-medium text-muted-foreground",
																	children: "Customer Complaint",
																}),
																(0, a.jsx)("div", {
																	className:
																		"rounded-lg bg-muted/50 p-4",
																	children: (0, a.jsx)("p", {
																		className:
																			"text-sm leading-relaxed",
																		children:
																			W.customer_complaint_summary ||
																			"—",
																	}),
																}),
															],
														}),
														W.special_instructions
															? (0, a.jsxs)("div", {
																	children: [
																		(0, a.jsx)("h4", {
																			className:
																				"mb-2 text-sm font-medium text-muted-foreground",
																			children:
																				"Special Instructions",
																		}),
																		(0, a.jsxs)("div", {
																			className:
																				"flex items-start gap-2 rounded-lg border border-chart-4/20 bg-chart-4/5 p-4",
																			children: [
																				(0, a.jsx)(u.A, {
																					className:
																						"mt-0.5 h-4 w-4 text-chart-4",
																				}),
																				(0, a.jsx)("p", {
																					className:
																						"text-sm",
																					children:
																						W.special_instructions,
																				}),
																			],
																		}),
																	],
															  })
															: null,
													],
												}),
											],
										}),
										(0, a.jsxs)(c.Zp, {
											children: [
												(0, a.jsx)(c.aR, {
													children: (0, a.jsxs)(c.ZB, {
														className:
															"flex items-center gap-2 text-lg",
														children: [
															(0, a.jsx)(_.A, {
																className:
																	"h-3.5 w-3.5 text-primary",
															}),
															"Linked Documents",
														],
													}),
												}),
												(0, a.jsx)(c.Wu, {
													children: (0, a.jsxs)("div", {
														className: "grid gap-4 sm:grid-cols-2",
														children: [
															(0, a.jsx)("div", {
																className: `rounded-lg border p-4 ${
																	W.inspection
																		? "border-chart-3/20 bg-chart-3/5"
																		: "border-dashed"
																}`,
																children: (0, a.jsxs)("div", {
																	className:
																		"flex items-center gap-3",
																	children: [
																		(0, a.jsx)(k.A, {
																			className: `h-5 w-5 ${
																				W.inspection
																					? "text-chart-3"
																					: "text-muted-foreground"
																			}`,
																		}),
																		(0, a.jsxs)("div", {
																			children: [
																				(0, a.jsx)("p", {
																					className:
																						"font-medium",
																					children:
																						"Vehicle Inspection",
																				}),
																				W.inspection
																					? (0, a.jsx)(
																							"button",
																							{
																								type: "button",
																								onClick:
																									() =>
																										E(
																											"inspection-detail",
																											{
																												id: W.inspection,
																											}
																										),
																								className:
																									"text-sm text-primary hover:underline",
																								children:
																									W.inspection,
																							}
																					  )
																					: (0, a.jsx)(
																							"p",
																							{
																								className:
																									"text-sm text-muted-foreground",
																								children:
																									"Not created yet",
																							}
																					  ),
																			],
																		}),
																	],
																}),
															}),
															(0, a.jsx)("div", {
																className: `rounded-lg border p-4 ${
																	W.job_card
																		? "border-chart-3/20 bg-chart-3/5"
																		: "border-dashed"
																}`,
																children: (0, a.jsxs)("div", {
																	className:
																		"flex items-center gap-3",
																	children: [
																		(0, a.jsx)(w.A, {
																			className: `h-5 w-5 ${
																				W.job_card
																					? "text-chart-3"
																					: "text-muted-foreground"
																			}`,
																		}),
																		(0, a.jsxs)("div", {
																			children: [
																				(0, a.jsx)("p", {
																					className:
																						"font-medium",
																					children:
																						"Job Card",
																				}),
																				W.job_card
																					? (0, a.jsx)(
																							"button",
																							{
																								type: "button",
																								onClick:
																									() =>
																										E(
																											"job-card-detail",
																											{
																												id: W.job_card,
																											}
																										),
																								className:
																									"text-sm text-primary hover:underline",
																								children:
																									W.job_card,
																							}
																					  )
																					: (0, a.jsx)(
																							"p",
																							{
																								className:
																									"text-sm text-muted-foreground",
																								children:
																									"Not created yet",
																							}
																					  ),
																			],
																		}),
																	],
																}),
															}),
														],
													}),
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "min-w-0 space-y-4 sm:space-y-6",
									children: [
										(0, a.jsxs)(c.Zp, {
											children: [
												(0, a.jsx)(c.aR, {
													className: "pb-3",
													children: (0, a.jsxs)(c.ZB, {
														className:
															"flex items-center gap-2 text-base",
														children: [
															(0, a.jsx)(C.A, {
																className: "h-4 w-4 text-primary",
															}),
															"Schedule",
														],
													}),
												}),
												(0, a.jsxs)(c.Wu, {
													className: "space-y-4",
													children: [
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: "Appointment",
																}),
																Y
																	? (0, a.jsxs)(a.Fragment, {
																			children: [
																				(0, a.jsx)("p", {
																					className:
																						"font-medium",
																					children: (0,
																					i.GP)(
																						Y,
																						"MMM d, yyyy"
																					),
																				}),
																				(0, a.jsx)("p", {
																					className:
																						"text-sm",
																					children: (0,
																					i.GP)(
																						Y,
																						"h:mm a"
																					),
																				}),
																			],
																	  })
																	: (0, a.jsx)("p", {
																			className:
																				"font-medium",
																			children: "—",
																	  }),
															],
														}),
														(0, a.jsx)(m.w, {}),
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: "Promised Delivery",
																}),
																Q
																	? (0, a.jsxs)(a.Fragment, {
																			children: [
																				(0, a.jsx)("p", {
																					className:
																						"font-medium",
																					children: (0,
																					i.GP)(
																						Q,
																						"MMM d, yyyy"
																					),
																				}),
																				(0, a.jsx)("p", {
																					className:
																						"text-sm",
																					children: (0,
																					i.GP)(
																						Q,
																						"h:mm a"
																					),
																				}),
																			],
																	  })
																	: (0, a.jsx)("p", {
																			className:
																				"font-medium",
																			children: "—",
																	  }),
															],
														}),
														ee
															? (0, a.jsxs)(a.Fragment, {
																	children: [
																		(0, a.jsx)(m.w, {}),
																		(0, a.jsxs)("div", {
																			children: [
																				(0, a.jsx)("p", {
																					className:
																						"text-sm text-muted-foreground",
																					children:
																						"Arrived",
																				}),
																				(0, a.jsx)("p", {
																					className:
																						"font-medium",
																					children: (0,
																					i.GP)(
																						ee,
																						"h:mm a"
																					),
																				}),
																			],
																		}),
																	],
															  })
															: null,
														(0, a.jsx)(m.w, {}),
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: "Estimated Duration",
																}),
																(0, a.jsx)("p", {
																	className: "font-medium",
																	children:
																		W.estimated_duration_hours
																			? `${W.estimated_duration_hours} hours`
																			: "—",
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)(c.Zp, {
											children: [
												(0, a.jsx)(c.aR, {
													className: "pb-3",
													children: (0, a.jsxs)(c.ZB, {
														className:
															"flex items-center gap-2 text-base",
														children: [
															(0, a.jsx)(A.A, {
																className: "h-4 w-4 text-primary",
															}),
															"Assignment",
														],
													}),
												}),
												(0, a.jsxs)(c.Wu, {
													className: "space-y-4",
													children: [
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: "Service Advisor",
																}),
																(0, a.jsx)("p", {
																	className: "font-medium",
																	children: et,
																}),
															],
														}),
														(0, a.jsxs)("div", {
															children: [
																(0, a.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: "Service Bay",
																}),
																(0, a.jsx)("p", {
																	className: "font-medium",
																	children:
																		W.assigned_bay ||
																		"Not assigned",
																}),
															],
														}),
													],
												}),
											],
										}),
										W.estimated_labor_cost ||
										W.estimated_parts_cost ||
										W.estimated_total_cost
											? (0, a.jsxs)(c.Zp, {
													children: [
														(0, a.jsx)(c.aR, {
															className: "pb-3",
															children: (0, a.jsx)(c.ZB, {
																className: "text-base",
																children: "Estimated Cost",
															}),
														}),
														(0, a.jsxs)(c.Wu, {
															className: "space-y-3",
															children: [
																(0, a.jsxs)("div", {
																	className:
																		"flex justify-between text-sm",
																	children: [
																		(0, a.jsx)("span", {
																			className:
																				"text-muted-foreground",
																			children: "Labor",
																		}),
																		(0, a.jsx)("span", {
																			children: B(
																				W.estimated_labor_cost
																			),
																		}),
																	],
																}),
																(0, a.jsxs)("div", {
																	className:
																		"flex justify-between text-sm",
																	children: [
																		(0, a.jsx)("span", {
																			className:
																				"text-muted-foreground",
																			children: "Parts",
																		}),
																		(0, a.jsx)("span", {
																			children: B(
																				W.estimated_parts_cost
																			),
																		}),
																	],
																}),
																(0, a.jsx)(m.w, {}),
																(0, a.jsxs)("div", {
																	className:
																		"flex justify-between font-medium",
																	children: [
																		(0, a.jsx)("span", {
																			children: "Total",
																		}),
																		(0, a.jsx)("span", {
																			children: B(
																				W.estimated_total_cost
																			),
																		}),
																	],
																}),
															],
														}),
													],
											  })
											: null,
										W.status_history
											? (0, a.jsxs)(c.Zp, {
													children: [
														(0, a.jsx)(c.aR, {
															className: "pb-3",
															children: (0, a.jsxs)(c.ZB, {
																className:
																	"flex items-center gap-2 text-base",
																children: [
																	(0, a.jsx)(S.A, {
																		className:
																			"h-4 w-4 text-primary",
																	}),
																	"Status History",
																],
															}),
														}),
														(0, a.jsx)(c.Wu, {
															children: (0, a.jsx)("pre", {
																className:
																	"whitespace-pre-wrap text-xs text-muted-foreground",
																children: W.status_history,
															}),
														}),
													],
											  })
											: null,
										ea
											? (0, a.jsx)(c.Zp, {
													className: "border-destructive/20",
													children: (0, a.jsx)(c.Wu, {
														className: "pt-6",
														children: (0, a.jsx)(l.$, {
															variant: "outline",
															className:
																"w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
															onClick: () => J(!0),
															children: "Cancel Appointment",
														}),
													}),
											  })
											: null,
									],
								}),
							],
						}),
						(0, a.jsx)(x.Lt, {
							open: O,
							onOpenChange: J,
							children: (0, a.jsxs)(x.EO, {
								children: [
									(0, a.jsxs)(x.wd, {
										children: [
											(0, a.jsx)(x.r7, { children: "Cancel Appointment" }),
											(0, a.jsx)(x.$v, {
												children:
													"Are you sure you want to cancel this appointment? This action cannot be undone.",
											}),
										],
									}),
									(0, a.jsxs)(x.ck, {
										children: [
											(0, a.jsx)(x.Zr, {
												disabled: T,
												children: "Keep Appointment",
											}),
											(0, a.jsx)(x.Rx, {
												className:
													"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												onClick: (e) => {
													e.preventDefault(), ei();
												},
												disabled: T,
												children: T ? "Cancelling…" : "Cancel Appointment",
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
		20232: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("play", [
				[
					"path",
					{
						d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
						key: "10ikf1",
					},
				],
			]);
		},
		20953: (e, t, s) => {
			s.d(t, {
				CM: () => a,
				FA: () => o,
				Ze: () => r,
				ih: () => c,
				mC: () => i,
				ms: () => d,
			});
			let a = new Set(["Completed", "Cancelled", "No-Show"]),
				r = new Set([
					"Arrived",
					"In Inspection",
					"In Workshop",
					"Ready for Pickup",
					"Completed",
				]),
				n = new Set(["Requested", "Scheduled", "Confirmed", "Booked", "Rescheduled"]);
			function i(e) {
				let t = Number(e);
				return Number.isFinite(t) ? t : 0;
			}
			function d(e) {
				return (e.contact_phone || e.primary_phone || e.mobile_no || "").trim();
			}
			function l(e) {
				return n.has(e || "");
			}
			function c(e) {
				return !l(e.status) || a.has(e.status) || r.has(e.status)
					? null
					: 1 !== i(e.docstatus)
					? "Confirm the appointment first"
					: d(e)
					? null
					: "Add Mobile No on the appointment or a phone on the customer";
			}
			function o(e) {
				return !(!l(e.status) || a.has(e.status) || r.has(e.status)) && 2 > i(e.docstatus);
			}
		},
		24538: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("map-pin", [
				[
					"path",
					{
						d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
						key: "1r0f0z",
					},
				],
				["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }],
			]);
		},
		32967: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("wrench", [
				[
					"path",
					{
						d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
						key: "1ngwbx",
					},
				],
			]);
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => l });
			var a = s(95155);
			s(12115);
			var r = s(42442),
				n = s(18460),
				i = s(91337);
			let d = (0, n.F)(
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
			function l({ className: e, variant: t, asChild: s = !1, ...n }) {
				let c = s ? r.DX : "span";
				return (0, a.jsx)(c, {
					"data-slot": "badge",
					className: (0, i.cn)(d({ variant: t }), e),
					...n,
				});
			}
		},
		42869: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("user", [
				["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
				["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
			]);
		},
		48368: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("file-text", [
				[
					"path",
					{
						d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
						key: "1oefj6",
					},
				],
				["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
				["path", { d: "M10 9H8", key: "b1mrlr" }],
				["path", { d: "M16 13H8", key: "t4e002" }],
				["path", { d: "M16 17H8", key: "z1uh3a" }],
			]);
		},
		61991: (e, t, s) => {
			s.d(t, { w: () => i });
			var a = s(95155);
			s(12115);
			var r = s(89803),
				n = s(91337);
			function i({ className: e, orientation: t = "horizontal", decorative: s = !0, ...d }) {
				return (0, a.jsx)(r.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: t,
					className: (0, n.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...d,
				});
			}
		},
		70521: (e, t, s) => {
			s.d(t, {
				$v: () => h,
				EO: () => o,
				Lt: () => d,
				Rx: () => p,
				Zr: () => j,
				ck: () => x,
				r7: () => u,
				wd: () => m,
			});
			var a = s(95155);
			s(12115);
			var r = s(284),
				n = s(91337),
				i = s(4474);
			function d({ ...e }) {
				return (0, a.jsx)(r.bL, { "data-slot": "alert-dialog", ...e });
			}
			function l({ ...e }) {
				return (0, a.jsx)(r.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)(r.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsxs)(l, {
					children: [
						(0, a.jsx)(c, {}),
						(0, a.jsx)(r.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, n.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, n.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, a.jsx)(r.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, n.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, a.jsx)(r.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, a.jsx)(r.rc, { className: (0, n.cn)((0, i.r)(), e), ...t });
			}
			function j({ className: e, ...t }) {
				return (0, a.jsx)(r.ZD, {
					className: (0, n.cn)((0, i.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => l, Wu: () => c, ZB: () => d, Zp: () => n, aR: () => i });
			var a = s(95155);
			s(12115);
			var r = s(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, r.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, r.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, r.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, r.cn)("px-4", e),
					...t,
				});
			}
		},
		80723: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		92289: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("mail", [
				["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
				["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }],
			]);
		},
		93053: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("clipboard-check", [
				[
					"rect",
					{ width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" },
				],
				[
					"path",
					{
						d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
						key: "116196",
					},
				],
				["path", { d: "m9 14 2 2 4-4", key: "df797q" }],
			]);
		},
	},
]);
