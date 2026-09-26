"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[9160],
	{
		19160: (e, s, a) => {
			a.r(s), a.d(s, { default: () => o });
			var t = a(95155),
				l = a(12115),
				r = a(44855),
				d = a(32144),
				c = a(79984),
				n = a(39658),
				m = a(23511),
				i = a(61878);
			function o() {
				let [e, s] = (0, l.useState)(""),
					{ data: a, isLoading: o } = (0, r.Ay)(["crm-contacts", e], () =>
						(0, d.ik)({ search: e || void 0, limit: 50 })
					),
					h = a?.data || [];
				return (0, t.jsx)("div", {
					className: "space-y-4",
					children: (0, t.jsxs)(c.Zp, {
						className: "border-border/70 shadow-sm",
						children: [
							(0, t.jsx)(c.aR, {
								className: "pb-3",
								children: (0, t.jsxs)("div", {
									className: "relative",
									children: [
										(0, t.jsx)(i.A, {
											className:
												"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
										}),
										(0, t.jsx)(n.p, {
											className: "pl-9",
											placeholder: "Search contacts…",
											value: e,
											onChange: (e) => s(e.target.value),
										}),
									],
								}),
							}),
							(0, t.jsx)(c.Wu, {
								children: o
									? (0, t.jsx)(m.E, { className: "h-24" })
									: (0, t.jsx)("div", {
											className: "dms-table-panel",
											children: (0, t.jsxs)("table", {
												className: "w-full text-sm",
												children: [
													(0, t.jsx)("thead", {
														children: (0, t.jsxs)("tr", {
															className:
																"border-b text-left text-xs text-muted-foreground",
															children: [
																(0, t.jsx)("th", {
																	className: "pb-2 font-medium",
																	children: "Name",
																}),
																(0, t.jsx)("th", {
																	className: "pb-2 font-medium",
																	children: "Mobile",
																}),
																(0, t.jsx)("th", {
																	className: "pb-2 font-medium",
																	children: "Email",
																}),
																(0, t.jsx)("th", {
																	className: "pb-2 font-medium",
																	children: "Company",
																}),
															],
														}),
													}),
													(0, t.jsx)("tbody", {
														children:
															0 === h.length
																? (0, t.jsx)("tr", {
																		children: (0, t.jsx)(
																			"td",
																			{
																				colSpan: 4,
																				className:
																					"py-10 text-center text-muted-foreground",
																				children:
																					"No contacts found.",
																			}
																		),
																  })
																: h.map((e) =>
																		(0, t.jsxs)(
																			"tr",
																			{
																				className:
																					"border-b border-border/60 last:border-0",
																				children: [
																					(0, t.jsx)(
																						"td",
																						{
																							className:
																								"py-3 font-medium",
																							children:
																								String(
																									e.full_name ||
																										e.name
																								),
																						}
																					),
																					(0, t.jsx)(
																						"td",
																						{
																							className:
																								"py-3 text-muted-foreground",
																							children:
																								String(
																									e.mobile_no ||
																										"—"
																								),
																						}
																					),
																					(0, t.jsx)(
																						"td",
																						{
																							className:
																								"py-3 text-muted-foreground",
																							children:
																								String(
																									e.email_id ||
																										"—"
																								),
																						}
																					),
																					(0, t.jsx)(
																						"td",
																						{
																							className:
																								"py-3 text-muted-foreground",
																							children:
																								String(
																									e.company_name ||
																										"—"
																								),
																						}
																					),
																				],
																			},
																			String(e.name)
																		)
																  ),
													}),
												],
											}),
									  }),
							}),
						],
					}),
				});
			}
		},
		23511: (e, s, a) => {
			a.d(s, { E: () => r });
			var t = a(95155),
				l = a(91337);
			function r({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, l.cn)("bg-accent animate-pulse rounded-md", e),
					...s,
				});
			}
		},
		61878: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
	},
]);
