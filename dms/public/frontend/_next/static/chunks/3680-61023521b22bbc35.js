"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3680],
	{
		3680: (e, t, r) => {
			r.r(t), r.d(t, { default: () => _ });
			var s = r(95155),
				a = r(56031),
				l = r(79984),
				i = r(38291),
				n = r(4474),
				c = r(24683),
				o = r(23511),
				d = r(40572),
				x = r(57420),
				m = r(32967),
				p = r(12651),
				g = r(14636),
				u = r(41585),
				h = r(89123),
				b = r(21628),
				f = r(6296),
				j = r(15335),
				v = r(84980),
				N = r(7810),
				y = r(44071),
				w = r(55833),
				C = r(63360),
				k = r(36020),
				A = r(91337);
			function _() {
				var e;
				let { navigate: t } = (0, w.c)(),
					{ canCreate: r, canAccessView: _, getModule: E } = (0, C.Sk)(),
					P = _("reports"),
					{ data: R, isLoading: $, error: D } = (0, k.MZ)(),
					F = R?.stats,
					W = R?.brd_kpis,
					I = R?.active_job_cards ?? [],
					S = R?.today_appointments ?? [],
					Z = R?.service_bays ?? [],
					B = (0, a.GP)(new Date(), "yyyy-MM-dd"),
					T = F
						? [
								{
									title: "Today's Appointments",
									value: String(F.today_appointments),
									change:
										(e = F.appointments_delta) > 0
											? `+${e} from yesterday`
											: e < 0
											? `${e} from yesterday`
											: "Same as yesterday",
									icon: x.A,
									color: "text-primary",
									bgColor: "bg-primary/10",
									onClick: _("appointments")
										? () => t("appointments", { date: B })
										: void 0,
								},
								{
									title: "Active Job Cards",
									value: String(F.active_job_cards),
									change:
										F.in_repair > 0
											? `${F.in_repair} in repair`
											: "No jobs in repair",
									icon: m.A,
									color: "text-chart-3",
									bgColor: "bg-chart-3/10",
									onClick: _("job-cards")
										? () => t("job-cards", { filter: "active" })
										: void 0,
								},
								{
									title: "Pending QC",
									value: String(F.pending_qc),
									change:
										F.urgent_qc > 0
											? `${F.urgent_qc} urgent`
											: F.pending_qc > 0
											? "Awaiting quality check"
											: "All clear",
									icon: p.A,
									color: "text-chart-4",
									bgColor: "bg-chart-4/10",
									onClick: _("job-cards")
										? () => t("job-cards", { filter: "qc" })
										: void 0,
								},
								{
									title: "Ready for Delivery",
									value: String(F.ready_for_delivery),
									change:
										F.awaiting_payment > 0
											? `${F.awaiting_payment} awaiting payment`
											: F.ready_for_delivery > 0
											? "Ready to hand over"
											: "None waiting",
									icon: g.A,
									color: "text-chart-1",
									bgColor: "bg-chart-1/10",
									onClick: _("job-cards")
										? () => t("job-cards", { status: "Completed" })
										: void 0,
								},
						  ]
						: [];
				return D
					? (0, s.jsxs)("div", {
							className:
								"flex flex-col items-center justify-center gap-4 py-24 text-center",
							children: [
								(0, s.jsx)(u.A, { className: "h-10 w-10 text-destructive" }),
								(0, s.jsx)("p", {
									className: "text-muted-foreground",
									children: "Could not load dashboard data.",
								}),
								(0, s.jsx)(n.$, {
									variant: "outline",
									onClick: () => window.location.reload(),
									children: "Retry",
								}),
							],
					  })
					: (0, s.jsxs)("div", {
							className: "min-w-0 space-y-3 sm:space-y-4",
							children: [
								(0, s.jsxs)("div", {
									className: "mb-0.5",
									children: [
										(0, s.jsx)("p", {
											className: "section-label mb-1",
											children: "Overview",
										}),
										(0, s.jsx)("h1", {
											className:
												"font-serif-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
											children: "Dashboard",
										}),
									],
								}),
								(0, s.jsx)("div", {
									className: "grid gap-3 md:grid-cols-2 lg:grid-cols-4",
									children: $
										? Array.from({ length: 4 }).map((e, t) =>
												(0, s.jsx)(
													l.Zp,
													{
														className: "gap-0 py-0",
														children: (0, s.jsxs)(l.Wu, {
															className: "px-3.5 py-3",
															children: [
																(0, s.jsx)(o.E, {
																	className: "h-3 w-24",
																}),
																(0, s.jsx)(o.E, {
																	className: "mt-2 h-7 w-12",
																}),
																(0, s.jsx)(o.E, {
																	className: "mt-1.5 h-2.5 w-20",
																}),
															],
														}),
													},
													t
												)
										  )
										: T.map((e) =>
												(0, s.jsx)(
													l.Zp,
													{
														className: (0, A.cn)(
															"gap-0 py-0",
															e.onClick &&
																"cursor-pointer transition-colors hover:bg-muted/40"
														),
														onClick: e.onClick,
														role: e.onClick ? "button" : void 0,
														tabIndex: e.onClick ? 0 : void 0,
														onKeyDown: e.onClick
															? (t) => {
																	("Enter" === t.key ||
																		" " === t.key) &&
																		(t.preventDefault(),
																		e.onClick?.());
															  }
															: void 0,
														children: (0, s.jsx)(l.Wu, {
															className: "px-3.5 py-3",
															children: (0, s.jsxs)("div", {
																className:
																	"flex items-start justify-between gap-2",
																children: [
																	(0, s.jsxs)("div", {
																		className: "min-w-0",
																		children: [
																			(0, s.jsx)("p", {
																				className:
																					"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																				children: e.title,
																			}),
																			(0, s.jsx)("p", {
																				className:
																					"dms-stat-value mt-1 text-xl sm:text-2xl",
																				children: e.value,
																			}),
																			(0, s.jsx)("p", {
																				className:
																					"mt-0.5 text-[11px] font-normal leading-snug text-muted-foreground",
																				children: e.change,
																			}),
																		],
																	}),
																	(0, s.jsx)("div", {
																		className: `shrink-0 rounded-full p-1.5 ${e.bgColor}`,
																		children: (0, s.jsx)(
																			e.icon,
																			{
																				className: `h-3.5 w-3.5 ${e.color}`,
																			}
																		),
																	}),
																],
															}),
														}),
													},
													e.title
												)
										  ),
								}),
								W &&
									(0, s.jsxs)(l.Zp, {
										className: "gap-2 py-3",
										children: [
											(0, s.jsxs)(l.aR, {
												className:
													"flex flex-row items-center justify-between px-3.5 py-0 pb-1",
												children: [
													(0, s.jsxs)("div", {
														children: [
															(0, s.jsx)("p", {
																className: "section-label mb-1",
																children: "Performance",
															}),
															(0, s.jsx)(l.ZB, {
																className: "text-base",
																children:
																	"Management KPIs (last 30 days)",
															}),
														],
													}),
													P
														? (0, s.jsxs)(n.$, {
																variant: "outline",
																size: "sm",
																onClick: () => {
																	let e =
																			E(
																				"reports"
																			)?.allowed_sections,
																		r =
																			null == e
																				? "executive"
																				: [
																						"executive",
																						"workshop",
																						"advisor",
																						"finance",
																				  ].find((t) =>
																						e.includes(
																							t
																						)
																				  ) || e[0];
																	r &&
																		t("reports", {
																			section: r,
																			report: "dashboard",
																		});
																},
																children: [
																	(0, s.jsx)(h.A, {
																		className: "h-4 w-4 mr-2",
																	}),
																	"Reports",
																],
														  })
														: null,
												],
											}),
											(0, s.jsx)(l.Wu, {
												className: "px-3.5 pt-0",
												children: (0, s.jsxs)("div", {
													className: `grid gap-2.5 sm:grid-cols-2 ${
														P ? "lg:grid-cols-4" : "lg:grid-cols-3"
													}`,
													children: [
														(0, s.jsxs)("div", {
															className:
																"rounded-xl border border-border/80 px-3 py-2.5",
															children: [
																(0, s.jsx)("p", {
																	className:
																		"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																	children: "Open WIP",
																}),
																(0, s.jsx)("p", {
																	className:
																		"dms-stat-value mt-0.5 text-xl",
																	children:
																		W.open_job_cards ?? 0,
																}),
																(0, s.jsxs)("p", {
																	className:
																		"mt-0.5 text-[11px] text-muted-foreground",
																	children: [
																		W.overdue_promised ?? 0,
																		" overdue",
																	],
																}),
															],
														}),
														P && !W.hide_net_revenue
															? (0, s.jsxs)("div", {
																	className:
																		"rounded-xl border border-border/80 px-3 py-2.5",
																	children: [
																		(0, s.jsx)("p", {
																			className:
																				"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																			children:
																				"Net revenue",
																		}),
																		(0, s.jsx)("p", {
																			className:
																				"dms-stat-value mt-0.5 text-xl",
																			children: (function (
																				e,
																				t
																			) {
																				let r = (
																					t || ""
																				).trim();
																				try {
																					if (r)
																						return new Intl.NumberFormat(
																							void 0,
																							{
																								style: "currency",
																								currency:
																									r,
																								minimumFractionDigits: 2,
																								maximumFractionDigits: 2,
																							}
																						).format(
																							e || 0
																						);
																				} catch {}
																				return (
																					e || 0
																				).toLocaleString(
																					void 0,
																					{
																						minimumFractionDigits: 2,
																						maximumFractionDigits: 2,
																					}
																				);
																			})(
																				W.net_revenue ?? 0,
																				W.revenue_currency
																			),
																		}),
																	],
															  })
															: null,
														(0, s.jsxs)("div", {
															className:
																"rounded-xl border border-border/80 px-3 py-2.5",
															children: [
																(0, s.jsx)("p", {
																	className:
																		"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																	children:
																		"Appointment arrival",
																}),
																(0, s.jsxs)("p", {
																	className:
																		"dms-stat-value mt-0.5 text-xl",
																	children: [
																		W.appointment_arrival_rate ??
																			0,
																		"%",
																	],
																}),
																(0, s.jsxs)("p", {
																	className:
																		"mt-0.5 text-[11px] text-muted-foreground",
																	children: [
																		W.warranty_jobs ?? 0,
																		" warranty jobs",
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className:
																"rounded-xl border border-border/80 px-3 py-2.5",
															children: [
																(0, s.jsx)("p", {
																	className:
																		"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																	children: "QC fail rate",
																}),
																(0, s.jsxs)("p", {
																	className:
																		"dms-stat-value mt-0.5 text-xl",
																	children: [
																		W.qc_fail_rate_pct ?? 0,
																		"%",
																	],
																}),
																(0, s.jsxs)("p", {
																	className:
																		"mt-0.5 text-[11px] text-muted-foreground",
																	children: [
																		"Parts fill ",
																		W.parts_fill_rate_pct ?? 0,
																		"%",
																	],
																}),
															],
														}),
													],
												}),
											}),
										],
									}),
								(0, s.jsxs)("div", {
									className: "grid gap-3 lg:grid-cols-3",
									children: [
										(0, s.jsxs)(l.Zp, {
											className: "gap-2 py-3 lg:col-span-2",
											children: [
												(0, s.jsxs)(l.aR, {
													className:
														"flex flex-row items-center justify-between px-3.5 py-0 pb-1",
													children: [
														(0, s.jsxs)("div", {
															children: [
																(0, s.jsx)("p", {
																	className:
																		"section-label mb-1",
																	children: "Workshop",
																}),
																(0, s.jsx)(l.ZB, {
																	className: "text-base",
																	children: "Active Job Cards",
																}),
																(0, s.jsx)(l.BT, {
																	className: "text-xs",
																	children:
																		"Currently in progress",
																}),
															],
														}),
														(0, s.jsxs)(n.$, {
															variant: "ghost",
															size: "sm",
															onClick: () =>
																t("job-cards", {
																	filter: "active",
																}),
															className: "flex items-center gap-1",
															children: [
																"View all ",
																(0, s.jsx)(b.A, {
																	className: "h-4 w-4",
																}),
															],
														}),
													],
												}),
												(0, s.jsx)(l.Wu, {
													className: "px-3.5 pt-0",
													children: $
														? (0, s.jsx)("div", {
																className:
																	"flex items-center justify-center py-8",
																children: (0, s.jsx)(f.A, {
																	className:
																		"h-6 w-6 animate-spin text-muted-foreground",
																}),
														  })
														: 0 === I.length
														? (0, s.jsx)("p", {
																className:
																	"py-6 text-center text-sm text-muted-foreground",
																children:
																	"No active job cards. Create one from an inspection or appointment.",
														  })
														: (0, s.jsx)("div", {
																className: "space-y-2",
																children: I.map((e) =>
																	(0, s.jsxs)(
																		"div",
																		{
																			className:
																				"flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between",
																			children: [
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"flex min-w-0 items-center gap-3",
																						children: [
																							(0,
																							s.jsx)(
																								"div",
																								{
																									className:
																										"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10",
																									children:
																										(0,
																										s.jsx)(
																											m.A,
																											{
																												className:
																													"h-4 w-4 text-primary",
																											}
																										),
																								}
																							),
																							(0,
																							s.jsxs)(
																								"div",
																								{
																									className:
																										"min-w-0",
																									children:
																										[
																											(0,
																											s.jsxs)(
																												"div",
																												{
																													className:
																														"flex flex-wrap items-center gap-2",
																													children:
																														[
																															(0,
																															s.jsx)(
																																"button",
																																{
																																	type: "button",
																																	onClick:
																																		() =>
																																			t(
																																				"job-card-detail",
																																				{
																																					id: e.id,
																																				}
																																			),
																																	className:
																																		"text-[13px] font-medium tracking-tight hover:text-primary",
																																	children:
																																		e.id,
																																}
																															),
																															(0,
																															s.jsx)(
																																i.E,
																																{
																																	variant:
																																		"outline",
																																	className:
																																		{
																																			VIP: "bg-chart-4/10 text-chart-4 border-chart-4/20",
																																			Urgent: "bg-destructive/10 text-destructive border-destructive/20",
																																			Normal: "bg-muted text-muted-foreground border-muted",
																																		}[
																																			e
																																				.priority
																																		] ||
																																		"bg-muted text-muted-foreground",
																																	children:
																																		e.priority,
																																}
																															),
																														],
																												}
																											),
																											(0,
																											s.jsx)(
																												"p",
																												{
																													className:
																														"truncate text-xs text-muted-foreground",
																													children:
																														[
																															e.customer,
																															e.vehicle,
																														]
																															.filter(
																																Boolean
																															)
																															.join(
																																" \xb7 "
																															) ||
																														"—",
																												}
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"flex shrink-0 flex-wrap items-center gap-2 sm:gap-3",
																						children: [
																							(0,
																							s.jsx)(
																								d.Wh,
																								{
																									status: e.status,
																								}
																							),
																							(0,
																							s.jsxs)(
																								"div",
																								{
																									className:
																										"flex items-center gap-1 text-xs text-muted-foreground",
																									children:
																										[
																											(0,
																											s.jsx)(
																												j.A,
																												{
																													className:
																														"h-3.5 w-3.5",
																												}
																											),
																											e.eta,
																										],
																								}
																							),
																						],
																					}
																				),
																			],
																		},
																		e.id
																	)
																),
														  }),
												}),
											],
										}),
										(0, s.jsxs)(l.Zp, {
											className: "gap-2 py-3",
											children: [
												(0, s.jsxs)(l.aR, {
													className:
														"flex flex-row items-center justify-between px-3.5 py-0 pb-1",
													children: [
														(0, s.jsxs)("div", {
															children: [
																(0, s.jsx)("p", {
																	className:
																		"section-label mb-1",
																	children: "Schedule",
																}),
																(0, s.jsx)(l.ZB, {
																	className: "text-base",
																	children: "Today's Schedule",
																}),
																(0, s.jsx)(l.BT, {
																	className: "text-xs",
																	children:
																		"Upcoming appointments",
																}),
															],
														}),
														(0, s.jsxs)(n.$, {
															variant: "ghost",
															size: "sm",
															onClick: () =>
																t("appointments", { date: B }),
															className: "flex items-center gap-1",
															children: [
																"View all ",
																(0, s.jsx)(b.A, {
																	className: "h-4 w-4",
																}),
															],
														}),
													],
												}),
												(0, s.jsx)(l.Wu, {
													className: "px-3.5 pt-0",
													children: $
														? (0, s.jsx)("div", {
																className: "space-y-2",
																children: Array.from({
																	length: 4,
																}).map((e, t) =>
																	(0, s.jsx)(
																		o.E,
																		{
																			className:
																				"h-12 w-full",
																		},
																		t
																	)
																),
														  })
														: 0 === S.length
														? (0, s.jsx)("p", {
																className:
																	"py-6 text-center text-sm text-muted-foreground",
																children:
																	"No appointments scheduled for today.",
														  })
														: (0, s.jsx)("div", {
																className: "space-y-2.5",
																children: S.map((e, r) =>
																	(0, s.jsxs)(
																		"div",
																		{
																			className:
																				"flex gap-3",
																			children: [
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"flex flex-col items-center",
																						children: [
																							(0,
																							s.jsx)(
																								"div",
																								{
																									className:
																										"flex h-7 min-w-14 items-center justify-center rounded-md bg-muted px-1 text-[11px] font-medium tracking-tight",
																									children:
																										e.time ||
																										"—",
																								}
																							),
																							r <
																								S.length -
																									1 &&
																								(0,
																								s.jsx)(
																									"div",
																									{
																										className:
																											"mt-1.5 h-full w-px bg-border",
																									}
																								),
																						],
																					}
																				),
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"flex-1 pb-2",
																						children: [
																							(0,
																							s.jsxs)(
																								"div",
																								{
																									className:
																										"flex items-center justify-between gap-2",
																									children:
																										[
																											(0,
																											s.jsx)(
																												"button",
																												{
																													type: "button",
																													onClick:
																														() =>
																															t(
																																"appointment-detail",
																																{
																																	id: e.id,
																																}
																															),
																													className:
																														"text-[13px] font-medium tracking-tight hover:text-primary",
																													children:
																														e.customer ||
																														"Customer",
																												}
																											),
																											(0,
																											s.jsx)(
																												i.E,
																												{
																													variant:
																														"outline",
																													className:
																														{
																															Requested:
																																"bg-sky-500/10 text-sky-800 border-sky-500/20",
																															Scheduled:
																																"bg-chart-3/10 text-chart-3 border-chart-3/20",
																															Confirmed:
																																"bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
																															Booked: "bg-chart-3/10 text-chart-3 border-chart-3/20",
																															"Reminder Sent":
																																"bg-chart-3/10 text-chart-3 border-chart-3/20",
																															Arrived:
																																"bg-chart-1/10 text-chart-1 border-chart-1/20",
																															"In Inspection":
																																"bg-chart-1/10 text-chart-1 border-chart-1/20",
																															"In Workshop":
																																"bg-chart-1/10 text-chart-1 border-chart-1/20",
																															"Ready for Pickup":
																																"bg-chart-4/10 text-chart-4 border-chart-4/20",
																															Completed:
																																"bg-chart-3/10 text-chart-3 border-chart-3/20",
																															Rescheduled:
																																"bg-muted text-muted-foreground border-muted",
																														}[
																															e
																																.status
																														] ||
																														"bg-muted text-muted-foreground",
																													children:
																														e.status,
																												}
																											),
																										],
																								}
																							),
																							(0,
																							s.jsx)(
																								"p",
																								{
																									className:
																										"text-xs text-muted-foreground",
																									children:
																										e.vehicle ||
																										"—",
																								}
																							),
																							(0,
																							s.jsx)(
																								"p",
																								{
																									className:
																										"text-[11px] text-muted-foreground",
																									children:
																										e.service,
																								}
																							),
																						],
																					}
																				),
																			],
																		},
																		e.id
																	)
																),
														  }),
												}),
											],
										}),
									],
								}),
								(0, s.jsxs)(l.Zp, {
									className: "gap-2 py-3",
									children: [
										(0, s.jsx)(l.aR, {
											className: "px-3.5 py-0 pb-1",
											children: (0, s.jsxs)("div", {
												className:
													"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
												children: [
													(0, s.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, s.jsx)("p", {
																className: "section-label mb-1",
																children: "Floor",
															}),
															(0, s.jsx)(l.ZB, {
																className: "text-base",
																children: "Service Bay Status",
															}),
														],
													}),
													(0, s.jsxs)("div", {
														className:
															"flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]",
														children: [
															(0, s.jsxs)("div", {
																className:
																	"flex shrink-0 items-center gap-1.5",
																children: [
																	(0, s.jsx)("div", {
																		className:
																			"h-2 w-2 shrink-0 rounded-full bg-chart-3",
																	}),
																	(0, s.jsx)("span", {
																		className:
																			"whitespace-nowrap text-muted-foreground",
																		children: "Available",
																	}),
																],
															}),
															(0, s.jsxs)("div", {
																className:
																	"flex shrink-0 items-center gap-1.5",
																children: [
																	(0, s.jsx)("div", {
																		className:
																			"h-2 w-2 shrink-0 rounded-full bg-chart-1",
																	}),
																	(0, s.jsx)("span", {
																		className:
																			"whitespace-nowrap text-muted-foreground",
																		children: "Occupied",
																	}),
																],
															}),
															(0, s.jsxs)("div", {
																className:
																	"flex shrink-0 items-center gap-1.5",
																children: [
																	(0, s.jsx)("div", {
																		className:
																			"h-2 w-2 shrink-0 rounded-full bg-destructive",
																	}),
																	(0, s.jsx)("span", {
																		className:
																			"whitespace-nowrap text-muted-foreground",
																		children: "Maintenance",
																	}),
																],
															}),
														],
													}),
												],
											}),
										}),
										(0, s.jsx)(l.Wu, {
											className: "px-3.5 pt-0",
											children: $
												? (0, s.jsx)("div", {
														className:
															"grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
														children: Array.from({ length: 6 }).map(
															(e, t) =>
																(0, s.jsx)(
																	o.E,
																	{ className: "h-20 w-full" },
																	t
																)
														),
												  })
												: 0 === Z.length
												? (0, s.jsx)("p", {
														className:
															"py-6 text-center text-sm text-muted-foreground",
														children:
															"No service bays configured. Add bays in ERPNext.",
												  })
												: (0, s.jsx)("div", {
														className:
															"grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
														children: Z.map((e) =>
															(0, s.jsxs)(
																"div",
																{
																	className: `rounded-xl border px-3 py-2.5 ${
																		"available" === e.status
																			? "border-chart-3/30 bg-chart-3/5"
																			: "maintenance" ===
																			  e.status
																			? "border-destructive/30 bg-destructive/5"
																			: "border-chart-1/30 bg-chart-1/5"
																	}`,
																	children: [
																		(0, s.jsxs)("div", {
																			className:
																				"flex items-center justify-between",
																			children: [
																				(0, s.jsx)(
																					"span",
																					{
																						className:
																							"text-[13px] font-medium tracking-tight",
																						children:
																							e.bay,
																					}
																				),
																				"occupied" ===
																				e.status
																					? (0, s.jsx)(
																							v.A,
																							{
																								className:
																									"h-3.5 w-3.5 text-chart-1",
																							}
																					  )
																					: "maintenance" ===
																					  e.status
																					? (0, s.jsx)(
																							u.A,
																							{
																								className:
																									"h-3.5 w-3.5 text-destructive",
																							}
																					  )
																					: (0, s.jsx)(
																							p.A,
																							{
																								className:
																									"h-3.5 w-3.5 text-chart-3",
																							}
																					  ),
																			],
																		}),
																		e.vehicle
																			? (0, s.jsxs)(
																					s.Fragment,
																					{
																						children: [
																							(0,
																							s.jsx)(
																								"p",
																								{
																									className:
																										"mt-1.5 truncate text-xs text-muted-foreground",
																									children:
																										e.vehicle,
																								}
																							),
																							(0,
																							s.jsx)(
																								c.k,
																								{
																									value: e.progress,
																									className:
																										"mt-1.5 h-1",
																								}
																							),
																							(0,
																							s.jsxs)(
																								"p",
																								{
																									className:
																										"mt-0.5 text-[11px] text-muted-foreground",
																									children:
																										[
																											e.progress,
																											"% complete",
																										],
																								}
																							),
																						],
																					}
																			  )
																			: (0, s.jsx)("p", {
																					className:
																						"mt-1.5 truncate text-xs capitalize text-muted-foreground",
																					children:
																						e.erp_status ||
																						e.status,
																			  }),
																	],
																},
																e.id
															)
														),
												  }),
										}),
									],
								}),
								(0, s.jsxs)("div", {
									className: "grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4",
									children: [
										r("appointments") &&
											(0, s.jsxs)(n.$, {
												className:
													"h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight",
												onClick: () => t("appointment-new"),
												children: [
													(0, s.jsx)(x.A, { className: "h-5 w-5" }),
													(0, s.jsx)("span", {
														children: "New Appointment",
													}),
												],
											}),
										r("inspections") &&
											(0, s.jsxs)(n.$, {
												variant: "outline",
												className:
													"h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight",
												onClick: () => t("inspection-new"),
												children: [
													(0, s.jsx)(N.A, { className: "h-5 w-5" }),
													(0, s.jsx)("span", {
														children: "Walk-in Inspection",
													}),
												],
											}),
										_("job-cards") &&
											(0, s.jsxs)(n.$, {
												variant: "outline",
												className:
													"h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight",
												onClick: () => t("job-cards"),
												children: [
													(0, s.jsx)(m.A, { className: "h-5 w-5" }),
													(0, s.jsx)("span", {
														children: "View Job Cards",
													}),
												],
											}),
										_("deliveries") &&
											(0, s.jsxs)(n.$, {
												variant: "outline",
												className:
													"h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight",
												onClick: () => t("deliveries"),
												children: [
													(0, s.jsx)(y.A, { className: "h-5 w-5" }),
													(0, s.jsx)("span", {
														children: "Pending Deliveries",
													}),
												],
											}),
									],
								}),
							],
					  });
			}
		},
		23511: (e, t, r) => {
			r.d(t, { E: () => l });
			var s = r(95155),
				a = r(91337);
			function l({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, a.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		24683: (e, t, r) => {
			r.d(t, { k: () => i });
			var s = r(95155);
			r(12115);
			var a = r(14897),
				l = r(91337);
			function i({ className: e, value: t, ...r }) {
				return (0, s.jsx)(a.bL, {
					"data-slot": "progress",
					className: (0, l.cn)(
						"bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
						e
					),
					...r,
					children: (0, s.jsx)(a.C1, {
						"data-slot": "progress-indicator",
						className: "bg-primary h-full w-full flex-1 transition-all",
						style: { transform: `translateX(-${100 - (t || 0)}%)` },
					}),
				});
			}
		},
		38291: (e, t, r) => {
			r.d(t, { E: () => c });
			var s = r(95155);
			r(12115);
			var a = r(42442),
				l = r(18460),
				i = r(91337);
			let n = (0, l.F)(
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
			function c({ className: e, variant: t, asChild: r = !1, ...l }) {
				let o = r ? a.DX : "span";
				return (0, s.jsx)(o, {
					"data-slot": "badge",
					className: (0, i.cn)(n({ variant: t }), e),
					...l,
				});
			}
		},
		40572: (e, t, r) => {
			r.d(t, { U8: () => w, Wh: () => v, bb: () => j, mo: () => N });
			var s = r(95155),
				a = r(38291),
				l = r(48368),
				i = r(84980),
				n = r(98307),
				c = r(13545),
				o = r(32967),
				d = r(57420),
				x = r(24642),
				m = r(14636),
				p = r(1164),
				g = r(62791),
				u = r(12651),
				h = r(21053),
				b = r(9199),
				f = r(44478);
			let j = {
				Draft: {
					label: "Draft",
					color: "text-muted-foreground",
					icon: l.A,
					bgColor: "bg-muted",
				},
				Open: {
					label: "Open",
					color: "text-[#1E88E5]",
					icon: i.A,
					bgColor: "bg-[#1E88E5]/10",
				},
				"Estimation Pending": {
					label: "Estimation Pending",
					color: "text-[#F9A825]",
					icon: n.A,
					bgColor: "bg-[#F9A825]/10",
				},
				"Estimation Approved": {
					label: "Estimation Approved",
					color: "text-[#2E7D32]",
					icon: n.A,
					bgColor: "bg-[#2E7D32]/10",
				},
				"Waiting Customer Approval": {
					label: "Awaiting Approval",
					color: "text-[#F9A825]",
					icon: c.A,
					bgColor: "bg-[#F9A825]/10",
				},
				Assigned: {
					label: "Assigned",
					color: "text-[#1E88E5]",
					icon: o.A,
					bgColor: "bg-[#1E88E5]/10",
				},
				Scheduled: {
					label: "Scheduled",
					color: "text-[#1E88E5]",
					icon: d.A,
					bgColor: "bg-[#1E88E5]/10",
				},
				"Repair In Progress": {
					label: "Repair In Progress",
					color: "text-[#1E88E5]",
					icon: o.A,
					bgColor: "bg-[#1E88E5]/10",
				},
				"Repair Completed": {
					label: "Repair Completed",
					color: "text-teal-800",
					icon: o.A,
					bgColor: "bg-teal-100",
				},
				"Waiting Parts": {
					label: "Waiting Parts",
					color: "text-[#F9A825]",
					icon: x.A,
					bgColor: "bg-[#F9A825]/10",
				},
				"Road Test In Progress": {
					label: "Road Test",
					color: "text-[#0F3D5E]",
					icon: m.A,
					bgColor: "bg-[#0F3D5E]/10",
				},
				"Road Test Completed": {
					label: "Road Test Done",
					color: "text-cyan-800",
					icon: m.A,
					bgColor: "bg-cyan-100",
				},
				"QC In Progress": {
					label: "QC In Progress",
					color: "text-indigo-800",
					icon: p.A,
					bgColor: "bg-indigo-100",
				},
				"QC Failed": {
					label: "QC Failed",
					color: "text-destructive",
					icon: g.A,
					bgColor: "bg-destructive/10",
				},
				Rework: {
					label: "Rework",
					color: "text-[#F9A825]",
					icon: o.A,
					bgColor: "bg-[#F9A825]/10",
				},
				Completed: {
					label: "Completed",
					color: "text-emerald-800",
					icon: u.A,
					bgColor: "bg-emerald-100",
				},
				Delivered: {
					label: "Delivered",
					color: "text-violet-800",
					icon: h.A,
					bgColor: "bg-violet-100",
				},
				Cancelled: {
					label: "Cancelled",
					color: "text-destructive",
					icon: c.A,
					bgColor: "bg-destructive/10",
				},
			};
			function v({ status: e }) {
				let t = j[e] || j.Draft,
					r = t.icon;
				return (0, s.jsxs)(a.E, {
					variant: "outline",
					className: `${t.bgColor} ${t.color} border-0 gap-1.5`,
					children: [(0, s.jsx)(r, { className: "h-3.5 w-3.5" }), t.label],
				});
			}
			function N({ reference: e, className: t }) {
				return (0, s.jsxs)(a.E, {
					variant: "outline",
					className: `border-0 gap-1.5 bg-orange-100 text-orange-900 font-medium ${
						t || ""
					}`,
					title: e ? `Linked to ${e}` : "Repeat / comeback job",
					children: [
						(0, s.jsx)(b.A, { className: "h-3.5 w-3.5" }),
						"Repeat Job",
						e
							? (0, s.jsxs)("span", {
									className: "opacity-80 font-normal",
									children: ["\xb7 ", e],
							  })
							: null,
					],
				});
			}
			let y = {
				Paid: {
					label: "Paid",
					color: "text-[#2E7D32]",
					bgColor: "bg-[#2E7D32]/10",
					icon: u.A,
				},
				"Partially Paid": {
					label: "Partially Paid",
					color: "text-[#F9A825]",
					bgColor: "bg-[#F9A825]/10",
					icon: c.A,
				},
				Unpaid: {
					label: "Unpaid",
					color: "text-[#1E88E5]",
					bgColor: "bg-[#1E88E5]/10",
					icon: i.A,
				},
				Credit: {
					label: "Credit",
					color: "text-violet-800",
					bgColor: "bg-violet-100",
					icon: l.A,
				},
				Warranty: {
					label: "Warranty",
					color: "text-teal-800",
					bgColor: "bg-teal-100",
					icon: f.A,
				},
				Internal: {
					label: "Internal",
					color: "text-muted-foreground",
					bgColor: "bg-muted",
					icon: p.A,
				},
			};
			function w({ paymentStatus: e, hasInvoice: t }) {
				if (!t)
					return (0, s.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: "–",
					});
				let r = (e || "").trim() || "Unpaid",
					l = y[r] ||
						y[r.replace("Partly", "Partially")] || {
							label: r,
							color: "text-muted-foreground",
							bgColor: "bg-muted",
							icon: i.A,
						},
					n = l.icon;
				return (0, s.jsxs)(a.E, {
					variant: "outline",
					className: `${l.bgColor} ${l.color} border-0 gap-1.5`,
					children: [(0, s.jsx)(n, { className: "h-3.5 w-3.5" }), l.label],
				});
			}
		},
		79984: (e, t, r) => {
			r.d(t, { BT: () => c, Wu: () => o, ZB: () => n, Zp: () => l, aR: () => i });
			var s = r(95155);
			r(12115);
			var a = r(91337);
			function l({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card",
					className: (0, a.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-header",
					className: (0, a.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-title",
					className: (0, a.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-description",
					className: (0, a.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-content",
					className: (0, a.cn)("px-4", e),
					...t,
				});
			}
		},
	},
]);
