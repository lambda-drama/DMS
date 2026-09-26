"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4611],
	{
		23511: (e, t, a) => {
			a.d(t, { E: () => s });
			var r = a(95155),
				l = a(91337);
			function s({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, l.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		38291: (e, t, a) => {
			a.d(t, { E: () => d });
			var r = a(95155);
			a(12115);
			var l = a(42442),
				s = a(18460),
				n = a(91337);
			let i = (0, s.F)(
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
			function d({ className: e, variant: t, asChild: a = !1, ...s }) {
				let c = a ? l.DX : "span";
				return (0, r.jsx)(c, {
					"data-slot": "badge",
					className: (0, n.cn)(i({ variant: t }), e),
					...s,
				});
			}
		},
		44605: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("phone-incoming", [
				["path", { d: "M16 2v6h6", key: "1mfrl5" }],
				["path", { d: "m22 2-6 6", key: "6f0sa0" }],
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
		49155: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("phone-outgoing", [
				["path", { d: "m16 8 6-6", key: "oawc05" }],
				["path", { d: "M22 8V2h-6", key: "oqy2zc" }],
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
		54611: (e, t, a) => {
			a.r(t), a.d(t, { default: () => f });
			var r = a(95155),
				l = a(81672),
				s = a(12115),
				n = a(44855),
				i = a(32144),
				d = a(55833),
				c = a(4474),
				o = a(79984),
				u = a(39658),
				m = a(23511),
				h = a(38291),
				x = a(51914),
				g = a(61878),
				p = a(44605),
				b = a(49155);
			let v = {
				green: "bg-emerald-500/10 text-emerald-700",
				red: "bg-red-500/10 text-red-700",
				orange: "bg-orange-500/10 text-orange-700",
				blue: "bg-sky-500/10 text-sky-700",
				gray: "bg-muted text-muted-foreground",
			};
			function f() {
				let { navigate: e } = (0, d.c)(),
					[t, a] = (0, s.useState)(""),
					[f, j] = (0, s.useState)("all"),
					[N, y] = (0, s.useState)("all"),
					{ data: k, isLoading: _ } = (0, n.Ay)(["crm-call-logs", t, f, N], () =>
						(0, i.K9)({ search: t || void 0, status: f, type: N, limit: 50 })
					),
					w = k?.data || [];
				return (0, r.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, r.jsx)("div", {
							className: "flex justify-end",
							children: (0, r.jsxs)(c.$, {
								onClick: () => e("crm-call-log-new"),
								children: [
									(0, r.jsx)(x.A, { className: "mr-2 h-4 w-4" }),
									"Log Call",
								],
							}),
						}),
						(0, r.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, r.jsx)(o.aR, {
									className: "pb-3",
									children: (0, r.jsxs)("div", {
										className:
											"flex flex-col gap-3 sm:flex-row sm:items-center",
										children: [
											(0, r.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, r.jsx)(g.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, r.jsx)(u.p, {
														className: "pl-9",
														placeholder:
															"Search number, ID, reference…",
														value: t,
														onChange: (e) => a(e.target.value),
													}),
												],
											}),
											(0, r.jsxs)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: N,
												onChange: (e) => y(e.target.value),
												children: [
													(0, r.jsx)("option", {
														value: "all",
														children: "All types",
													}),
													(0, r.jsx)("option", {
														value: "Incoming",
														children: "Incoming",
													}),
													(0, r.jsx)("option", {
														value: "Outgoing",
														children: "Outgoing",
													}),
												],
											}),
											(0, r.jsxs)("select", {
												className:
													"h-9 rounded-md border border-input bg-background px-3 text-sm",
												value: f,
												onChange: (e) => j(e.target.value),
												children: [
													(0, r.jsx)("option", {
														value: "all",
														children: "All statuses",
													}),
													(0, r.jsx)("option", {
														value: "Completed",
														children: "Completed",
													}),
													(0, r.jsx)("option", {
														value: "No Answer",
														children: "Missed Call",
													}),
													(0, r.jsx)("option", {
														value: "Busy",
														children: "Declined",
													}),
													(0, r.jsx)("option", {
														value: "Failed",
														children: "Failed",
													}),
													(0, r.jsx)("option", {
														value: "In Progress",
														children: "In Progress",
													}),
													(0, r.jsx)("option", {
														value: "Initiated",
														children: "Initiated",
													}),
													(0, r.jsx)("option", {
														value: "Ringing",
														children: "Ringing",
													}),
													(0, r.jsx)("option", {
														value: "Queued",
														children: "Queued",
													}),
													(0, r.jsx)("option", {
														value: "Canceled",
														children: "Canceled",
													}),
												],
											}),
										],
									}),
								}),
								(0, r.jsx)(o.Wu, {
									children: _
										? (0, r.jsxs)("div", {
												className: "space-y-2",
												children: [
													(0, r.jsx)(m.E, { className: "h-10" }),
													(0, r.jsx)(m.E, { className: "h-10" }),
													(0, r.jsx)(m.E, { className: "h-10" }),
												],
										  })
										: (0, r.jsx)("div", {
												className: "dms-table-panel overflow-x-auto",
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
																		children: "Type",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Lead / Contact",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "From",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "To",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children:
																			"Caller / Receiver",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Duration",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "Status",
																	}),
																	(0, r.jsx)("th", {
																		className:
																			"pb-2 font-medium",
																		children: "When",
																	}),
																],
															}),
														}),
														(0, r.jsx)("tbody", {
															children:
																0 === w.length
																	? (0, r.jsx)("tr", {
																			children: (0, r.jsx)(
																				"td",
																				{
																					colSpan: 8,
																					className:
																						"py-10 text-center text-muted-foreground",
																					children:
																						"No call logs yet. Log your first call.",
																				}
																			),
																	  })
																	: w.map((t) => {
																			let a =
																					"Incoming" ===
																					t.type,
																				s = a
																					? t._caller
																							?.label ||
																					  t.from
																					: t._receiver
																							?.label ||
																					  t.to,
																				n = a
																					? t._receiver
																							?.label ||
																					  t.receiver_name ||
																					  t.receiver
																					: t._caller
																							?.label ||
																					  t.caller_name ||
																					  t.caller;
																			return (0, r.jsxs)(
																				"tr",
																				{
																					className:
																						"cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
																					onClick: () =>
																						e(
																							"crm-call-log-detail",
																							{
																								id: t.name,
																							}
																						),
																					children: [
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									(0,
																									r.jsxs)(
																										"span",
																										{
																											className:
																												"inline-flex items-center gap-1.5 text-muted-foreground",
																											children:
																												[
																													a
																														? (0,
																														  r.jsx)(
																																p.A,
																																{
																																	className:
																																		"h-3.5 w-3.5",
																																}
																														  )
																														: (0,
																														  r.jsx)(
																																b.A,
																																{
																																	className:
																																		"h-3.5 w-3.5",
																																}
																														  ),
																													t.type,
																												],
																										}
																									),
																							}
																						),
																						(0,
																						r.jsxs)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									[
																										(0,
																										r.jsx)(
																											"div",
																											{
																												className:
																													"truncate font-medium",
																												children:
																													t._lead_label ||
																													t._contact_label ||
																													t._deal_label ||
																													"—",
																											}
																										),
																										(0,
																										r.jsx)(
																											"div",
																											{
																												className:
																													"truncate text-xs text-muted-foreground",
																												children:
																													t._lead
																														? "Lead"
																														: t._contact
																														? "Contact"
																														: t._deal
																														? "Deal"
																														: "",
																											}
																										),
																									],
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 font-medium",
																								children:
																									t.from ||
																									"—",
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									t.to ||
																									"—",
																							}
																						),
																						(0,
																						r.jsxs)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									[
																										(0,
																										r.jsx)(
																											"div",
																											{
																												className:
																													"truncate",
																												children:
																													s ||
																													"—",
																											}
																										),
																										(0,
																										r.jsx)(
																											"div",
																											{
																												className:
																													"truncate text-xs",
																												children:
																													n ||
																													"—",
																											}
																										),
																									],
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3 text-muted-foreground",
																								children:
																									t._duration ||
																									"—",
																							}
																						),
																						(0, r.jsx)(
																							"td",
																							{
																								className:
																									"py-3",
																								children:
																									(0,
																									r.jsx)(
																										h.E,
																										{
																											variant:
																												"secondary",
																											className:
																												v[
																													t.status_color ||
																														"gray"
																												] ||
																												v.gray,
																											children:
																												t.status_label ||
																												t.status ||
																												"—",
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
																									t.start_time ||
																									t.creation
																										? (0,
																										  l.r6)(
																												String(
																													t.start_time ||
																														t.creation
																												)
																										  )
																										: "—",
																							}
																						),
																					],
																				},
																				t.name
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
		61878: (e, t, a) => {
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		81672: (e, t, a) => {
			a.d(t, { Ge: () => u, N0: () => c, Yq: () => i, gQ: () => o, r6: () => d });
			let r = [
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
				l = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				s = (e) => String(e).padStart(2, "0");
			function n(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let a = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (a) return new Date(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
				let r = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(r.getTime()) ? null : r;
			}
			function i(e, t = "") {
				let a = n(e);
				return a ? `${s(a.getDate())}/${s(a.getMonth() + 1)}/${a.getFullYear()}` : t;
			}
			function d(e, t = "", a = !1) {
				let r = n(e);
				if (!r) return t;
				let l = `${s(r.getHours())}:${s(r.getMinutes())}${
					a ? `:${s(r.getSeconds())}` : ""
				}`;
				return `${i(r)} ${l}`;
			}
			function c(e, t = "") {
				let a = n(e);
				return a ? `${r[a.getMonth()]} ${a.getFullYear()}` : t;
			}
			function o(e, t = "") {
				let a = n(e);
				return a ? l[a.getDay()] : t;
			}
			function u(e, t = "") {
				let a = n(e);
				return a ? `${l[a.getDay()]}, ${i(a)}` : t;
			}
		},
	},
]);
