"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[400],
	{
		23511: (e, t, s) => {
			s.d(t, { E: () => n });
			var r = s(95155),
				a = s(91337);
			function n({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, a.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		30400: (e, t, s) => {
			s.r(t), s.d(t, { default: () => p });
			var r = s(95155),
				a = s(12115),
				n = s(44855),
				i = s(32144),
				d = s(55833),
				l = s(38291),
				c = s(4474),
				o = s(79984),
				m = s(39658),
				u = s(23511),
				x = s(51914),
				h = s(61878);
			function p() {
				let { navigate: e } = (0, d.c)(),
					[t, s] = (0, a.useState)(""),
					[p, v] = (0, a.useState)("Open"),
					[b, g] = (0, a.useState)(!0),
					[j, f] = (0, a.useState)(!1),
					[N, y] = (0, a.useState)("mine"),
					{ data: w, isLoading: k } = (0, n.Ay)(["crm-activities", t, p, b, j], () =>
						(0, i.s3)({
							search: t || void 0,
							status: p,
							mine: b,
							overdue_only: j,
							limit: 50,
						})
					),
					{ data: S } = (0, n.Ay)(["crm-overdue-board", N], () => (0, i.Tc)(N)),
					C = w?.data || [],
					_ = w?.summary || {};
				return (0, r.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, r.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [
								(0, r.jsxs)("div", {
									className: "flex flex-wrap gap-2 text-xs",
									children: [
										(0, r.jsxs)("span", {
											className: "rounded-md border px-2.5 py-1",
											children: ["Open: ", Number(_.open || 0)],
										}),
										(0, r.jsxs)("span", {
											className: "rounded-md border px-2.5 py-1",
											children: ["Mine: ", Number(_.mine_open || 0)],
										}),
										(0, r.jsxs)("span", {
											className:
												"rounded-md border border-destructive/40 px-2.5 py-1 text-destructive",
											children: ["Overdue: ", Number(_.overdue || 0)],
										}),
									],
								}),
								(0, r.jsxs)(c.$, {
									onClick: () => e("crm-activity-new"),
									children: [
										(0, r.jsx)(x.A, { className: "mr-2 h-4 w-4" }),
										"New Activity",
									],
								}),
							],
						}),
						(0, r.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, r.jsx)(o.aR, {
									className: "pb-2",
									children: (0, r.jsxs)("div", {
										className:
											"flex flex-wrap items-center justify-between gap-2",
										children: [
											(0, r.jsx)("p", {
												className: "text-sm font-medium",
												children: "Overdue board",
											}),
											(0, r.jsxs)("div", {
												className: "flex gap-2",
												children: [
													(0, r.jsx)(c.$, {
														size: "sm",
														variant:
															"mine" === N ? "default" : "outline",
														onClick: () => y("mine"),
														children: "Mine",
													}),
													S?.can_view_team
														? (0, r.jsx)(c.$, {
																size: "sm",
																variant:
																	"team" === N
																		? "default"
																		: "outline",
																onClick: () => y("team"),
																children: "Team",
														  })
														: null,
												],
											}),
										],
									}),
								}),
								(0, r.jsx)(o.Wu, {
									className: "space-y-2 text-sm",
									children:
										0 === (S?.activities || []).length
											? (0, r.jsx)("p", {
													className: "text-muted-foreground",
													children: "No overdue activities.",
											  })
											: (S?.activities || []).slice(0, 8).map((t) =>
													(0, r.jsxs)(
														"button",
														{
															type: "button",
															className:
																"flex w-full items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-left hover:bg-muted/40",
															onClick: () =>
																e("crm-activity-detail", {
																	id: String(t.name),
																}),
															children: [
																(0, r.jsx)("span", {
																	className: "font-medium",
																	children: String(t.subject),
																}),
																(0, r.jsx)("span", {
																	className:
																		"text-xs text-destructive",
																	children: String(
																		t.due_datetime || ""
																	)
																		.slice(0, 16)
																		.replace("T", " "),
																}),
															],
														},
														String(t.name)
													)
											  ),
								}),
							],
						}),
						(0, r.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, r.jsx)(o.aR, {
									className: "pb-3",
									children: (0, r.jsxs)("div", {
										className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap",
										children: [
											(0, r.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, r.jsx)(h.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, r.jsx)(m.p, {
														className: "pl-9",
														placeholder: "Search activities…",
														value: t,
														onChange: (e) => s(e.target.value),
													}),
												],
											}),
											(0, r.jsxs)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: p,
												onChange: (e) => v(e.target.value),
												children: [
													(0, r.jsx)("option", {
														value: "all",
														children: "All",
													}),
													(0, r.jsx)("option", {
														value: "Open",
														children: "Open",
													}),
													(0, r.jsx)("option", {
														value: "In Progress",
														children: "In Progress",
													}),
													(0, r.jsx)("option", {
														value: "Completed",
														children: "Completed",
													}),
													(0, r.jsx)("option", {
														value: "Cancelled",
														children: "Cancelled",
													}),
												],
											}),
											(0, r.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [
													(0, r.jsx)("input", {
														type: "checkbox",
														checked: b,
														onChange: (e) => g(e.target.checked),
													}),
													"Mine only",
												],
											}),
											(0, r.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [
													(0, r.jsx)("input", {
														type: "checkbox",
														checked: j,
														onChange: (e) => f(e.target.checked),
													}),
													"Overdue only",
												],
											}),
										],
									}),
								}),
								(0, r.jsx)(o.Wu, {
									children: k
										? (0, r.jsx)(u.E, { className: "h-24" })
										: (0, r.jsx)("div", {
												className: "dms-table-panel",
												children: (0, r.jsxs)("table", {
													className: "w-full text-sm",
													children: [
														(0, r.jsx)("thead", {
															children: (0, r.jsxs)("tr", {
																className:
																	"border-b text-left text-xs text-muted-foreground",
																children: [
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Subject",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Type",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Due",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Owner",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Status",
																	}),
																],
															}),
														}),
														(0, r.jsx)("tbody", {
															children:
																0 === C.length
																	? (0, r.jsx)("tr", {
																			children: (0, r.jsx)(
																				"td",
																				{
																					colSpan: 5,
																					className:
																						"py-10 text-center text-muted-foreground",
																					children:
																						"No activities yet.",
																				}
																			),
																	  })
																	: C.map((t) =>
																			(0, r.jsxs)(
																				"tr",
																				{
																					className:
																						"cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
																					onClick: () =>
																						e(
																							"crm-activity-detail",
																							{
																								id: String(
																									t.name
																								),
																							}
																						),
																					children: [
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 font-medium",
																								children:
																									String(
																										t.subject ||
																											""
																									),
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.activity_type ||
																											"—"
																									),
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									t.is_overdue ||
																									t.sla_breached
																										? (0,
																										  r.jsx)(
																												l.E,
																												{
																													variant:
																														"destructive",
																													className:
																														"font-normal",
																													children:
																														String(
																															t.due_datetime ||
																																""
																														)
																															.slice(
																																0,
																																16
																															)
																															.replace(
																																"T",
																																" "
																															),
																												}
																										  )
																										: (0,
																										  r.jsx)(
																												"span",
																												{
																													className:
																														"text-muted-foreground",
																													children:
																														String(
																															t.due_datetime ||
																																"—"
																														),
																												}
																										  ),
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.owner_name ||
																											"—"
																									),
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.status ||
																											""
																									),
																							}
																						),
																					],
																				},
																				String(t.name)
																			)
																	  ),
														}),
													],
												}),
										  }),
								}),
							],
						}),
					],
				});
			}
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => l });
			var r = s(95155);
			s(12115);
			var a = s(42442),
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
				let c = s ? a.DX : "span";
				return (0, r.jsx)(c, {
					"data-slot": "badge",
					className: (0, i.cn)(d({ variant: t }), e),
					...n,
				});
			}
		},
		61878: (e, t, s) => {
			s.d(t, { A: () => r });
			let r = (0, s(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
	},
]);
