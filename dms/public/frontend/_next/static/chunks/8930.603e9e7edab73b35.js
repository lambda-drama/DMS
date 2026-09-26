"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8930],
	{
		23511: (e, t, l) => {
			l.d(t, { E: () => n });
			var a = l(95155),
				s = l(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, s.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		38930: (e, t, l) => {
			l.r(t), l.d(t, { default: () => p });
			var a = l(95155),
				s = l(12115),
				n = l(44855),
				r = l(32144),
				d = l(55833),
				o = l(4474),
				i = l(79984),
				c = l(39658),
				u = l(23511),
				m = l(51914),
				x = l(61878);
			let h = [
				{ value: "all", label: "All stages" },
				{ value: "Negotiation", label: "Negotiation" },
				{ value: "Booking / Deposit", label: "Booking" },
				{ value: "Won", label: "Won" },
				{ value: "Lost", label: "Lost" },
				{ value: "Quotation Submitted", label: "Quotation" },
				{ value: "Qualified", label: "Qualified" },
				{ value: "Test Drive", label: "Test Drive" },
			];
			function p() {
				let { navigate: e } = (0, d.c)(),
					[t, l] = (0, s.useState)(""),
					[p, b] = (0, s.useState)("Open"),
					[g, j] = (0, s.useState)("all"),
					{ data: v, isLoading: N } = (0, n.Ay)(["crm-opportunities", t, p, g], () =>
						(0, r.wA)({
							search: t || void 0,
							status: p,
							stage: "all" === g ? void 0 : g,
							limit: 50,
						})
					),
					f = v?.data || [],
					y = (0, s.useMemo)(() => h, []);
				return (0, a.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, a.jsx)("div", {
							className: "flex justify-end",
							children: (0, a.jsxs)(o.$, {
								onClick: () => e("crm-opportunity-new"),
								children: [
									(0, a.jsx)(m.A, { className: "mr-2 h-4 w-4" }),
									"New Deal",
								],
							}),
						}),
						(0, a.jsxs)(i.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(i.aR, {
									className: "pb-3",
									children: (0, a.jsxs)("div", {
										className: "flex flex-col gap-3 lg:flex-row",
										children: [
											(0, a.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, a.jsx)(x.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, a.jsx)(c.p, {
														className: "pl-9",
														placeholder: "Search deals…",
														value: t,
														onChange: (e) => l(e.target.value),
													}),
												],
											}),
											(0, a.jsxs)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: p,
												onChange: (e) => b(e.target.value),
												children: [
													(0, a.jsx)("option", {
														value: "all",
														children: "All statuses",
													}),
													(0, a.jsx)("option", {
														value: "Open",
														children: "Open",
													}),
													(0, a.jsx)("option", {
														value: "On Hold",
														children: "On Hold",
													}),
													(0, a.jsx)("option", {
														value: "Won",
														children: "Won",
													}),
													(0, a.jsx)("option", {
														value: "Lost",
														children: "Lost",
													}),
													(0, a.jsx)("option", {
														value: "Cancelled",
														children: "Cancelled",
													}),
												],
											}),
											(0, a.jsx)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: g,
												onChange: (e) => j(e.target.value),
												children: y.map((e) =>
													(0, a.jsx)(
														"option",
														{ value: e.value, children: e.label },
														e.value
													)
												),
											}),
										],
									}),
								}),
								(0, a.jsx)(i.Wu, {
									children: N
										? (0, a.jsx)(u.E, { className: "h-24" })
										: (0, a.jsx)("div", {
												className: "dms-table-panel",
												children: (0, a.jsxs)("table", {
													className: "w-full text-sm",
													children: [
														(0, a.jsx)("thead", {
															children: (0, a.jsxs)("tr", {
																className:
																	"border-b text-left text-xs text-muted-foreground",
																children: [
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Deal",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Customer",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Stage",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Value",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Owner",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Close",
																	}),
																],
															}),
														}),
														(0, a.jsx)("tbody", {
															children:
																0 === f.length
																	? (0, a.jsx)("tr", {
																			children: (0, a.jsx)(
																				"td",
																				{
																					colSpan: 6,
																					className:
																						"py-10 text-center text-muted-foreground",
																					children:
																						"No deals in this view.",
																				}
																			),
																	  })
																	: f.map((t) => {
																			var l;
																			return (0, a.jsxs)(
																				"tr",
																				{
																					className:
																						"cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
																					onClick: () =>
																						e(
																							"crm-opportunity-detail",
																							{
																								id: String(
																									t.name
																								),
																							}
																						),
																					children: [
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3 font-medium",
																								children:
																									String(
																										t.title ||
																											""
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.customer_name ||
																											t.customer ||
																											"—"
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									(0,
																									a.jsx)(
																										"span",
																										{
																											className: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
																												"Won" ===
																												(l =
																													String(
																														t.stage ||
																															""
																													))
																													? "bg-emerald-500/10 text-emerald-700"
																													: "Lost" ===
																													  l
																													? "bg-destructive/10 text-destructive"
																													: "Negotiation" ===
																															l ||
																													  "Booking / Deposit" ===
																															l
																													? "bg-orange-500/10 text-orange-800"
																													: "Quotation Submitted" ===
																													  l
																													? "bg-sky-500/10 text-sky-800"
																													: "bg-muted text-foreground"
																											}`,
																											children:
																												String(
																													t.stage ||
																														""
																												),
																										}
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									Number(
																										t.expected_value ||
																											0
																									).toLocaleString(),
																							}
																						),
																						(0, a.jsx)(
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
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.expected_close_date ||
																											"—"
																									),
																							}
																						),
																					],
																				},
																				String(t.name)
																			);
																	  }),
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
		61878: (e, t, l) => {
			l.d(t, { A: () => a });
			let a = (0, l(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
	},
]);
