"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6447],
	{
		23511: (e, t, r) => {
			r.d(t, { E: () => s });
			var a = r(95155),
				n = r(91337);
			function s({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, n.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		38291: (e, t, r) => {
			r.d(t, { E: () => d });
			var a = r(95155);
			r(12115);
			var n = r(42442),
				s = r(18460),
				i = r(91337);
			let l = (0, s.F)(
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
			function d({ className: e, variant: t, asChild: r = !1, ...s }) {
				let o = r ? n.DX : "span";
				return (0, a.jsx)(o, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: t }), e),
					...s,
				});
			}
		},
		61878: (e, t, r) => {
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		76447: (e, t, r) => {
			r.r(t), r.d(t, { default: () => f });
			var a = r(95155),
				n = r(81672),
				s = r(12115),
				i = r(44855),
				l = r(32144),
				d = r(55833),
				o = r(38291),
				c = r(4474),
				u = r(79984),
				m = r(39658),
				p = r(23511),
				h = r(51914),
				x = r(61878);
			let g = [
				"Requested",
				"Scheduled",
				"Confirmed",
				"Arrived",
				"Completed",
				"Rescheduled",
				"Cancelled",
				"No-Show",
			];
			function f() {
				let { navigate: e } = (0, d.c)(),
					[t, r] = (0, s.useState)(""),
					[f, b] = (0, s.useState)("all"),
					{ data: v, isLoading: N } = (0, i.Ay)(["crm-sales-appointments", t, f], () =>
						(0, l.bh)({ search: t || void 0, status: f, limit: 100 })
					),
					j = v?.data || [];
				return (0, a.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, a.jsx)("div", {
							className: "flex justify-end",
							children: (0, a.jsxs)(c.$, {
								onClick: () => e("crm-sales-appointment-new"),
								children: [
									(0, a.jsx)(h.A, { className: "mr-2 h-4 w-4" }),
									"New Appointment",
								],
							}),
						}),
						(0, a.jsxs)(u.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(u.aR, {
									className: "pb-3",
									children: (0, a.jsxs)("div", {
										className: "flex flex-col gap-3 sm:flex-row",
										children: [
											(0, a.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, a.jsx)(x.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, a.jsx)(m.p, {
														className: "pl-9",
														placeholder: "Search appointments…",
														value: t,
														onChange: (e) => r(e.target.value),
													}),
												],
											}),
											(0, a.jsxs)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: f,
												onChange: (e) => b(e.target.value),
												children: [
													(0, a.jsx)("option", {
														value: "all",
														children: "All statuses",
													}),
													g.map((e) =>
														(0, a.jsx)(
															"option",
															{ value: e, children: e },
															e
														)
													),
												],
											}),
										],
									}),
								}),
								(0, a.jsx)(u.Wu, {
									children: N
										? (0, a.jsx)(p.E, { className: "h-32" })
										: (0, a.jsx)("div", {
												className: "dms-table-panel overflow-x-auto",
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
																		children: "When",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Customer",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Type",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Deal",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Assigned",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Status",
																	}),
																],
															}),
														}),
														(0, a.jsx)("tbody", {
															children:
																0 === j.length
																	? (0, a.jsx)("tr", {
																			children: (0, a.jsx)(
																				"td",
																				{
																					colSpan: 6,
																					className:
																						"py-10 text-center text-muted-foreground",
																					children:
																						"No sales appointments yet. Book a showroom visit from here or from a deal.",
																				}
																			),
																	  })
																	: j.map((t) =>
																			(0, a.jsxs)(
																				"tr",
																				{
																					className:
																						"cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
																					onClick: () =>
																						e(
																							"crm-sales-appointment-detail",
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
																									t.appointment_datetime
																										? (0,
																										  n.r6)(
																												String(
																													t.appointment_datetime
																												)
																										  )
																										: "—",
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
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
																									"py-3 text-muted-foreground",
																								children:
																									String(
																										t.appointment_type ||
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
																										t.opportunity_title ||
																											t.opportunity ||
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
																										t.owner_name ||
																											t.assigned_to ||
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
																										o.E,
																										{
																											variant:
																												"secondary",
																											className:
																												"font-normal",
																											children:
																												String(
																													t.status ||
																														"—"
																												),
																										}
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
		81672: (e, t, r) => {
			r.d(t, { Ge: () => u, N0: () => o, Yq: () => l, gQ: () => c, r6: () => d });
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
				s = (e) => String(e).padStart(2, "0");
			function i(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (r) return new Date(Number(r[1]), Number(r[2]) - 1, Number(r[3]));
				let a = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(a.getTime()) ? null : a;
			}
			function l(e, t = "") {
				let r = i(e);
				return r ? `${s(r.getDate())}/${s(r.getMonth() + 1)}/${r.getFullYear()}` : t;
			}
			function d(e, t = "", r = !1) {
				let a = i(e);
				if (!a) return t;
				let n = `${s(a.getHours())}:${s(a.getMinutes())}${
					r ? `:${s(a.getSeconds())}` : ""
				}`;
				return `${l(a)} ${n}`;
			}
			function o(e, t = "") {
				let r = i(e);
				return r ? `${a[r.getMonth()]} ${r.getFullYear()}` : t;
			}
			function c(e, t = "") {
				let r = i(e);
				return r ? n[r.getDay()] : t;
			}
			function u(e, t = "") {
				let r = i(e);
				return r ? `${n[r.getDay()]}, ${l(r)}` : t;
			}
		},
	},
]);
