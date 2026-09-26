"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[645],
	{
		23511: (e, t, r) => {
			r.d(t, { E: () => n });
			var s = r(95155),
				l = r(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, l.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		61878: (e, t, r) => {
			r.d(t, { A: () => s });
			let s = (0, r(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		70645: (e, t, r) => {
			r.r(t), r.d(t, { default: () => h });
			var s = r(95155),
				l = r(81672),
				n = r(12115),
				a = r(44855),
				d = r(32144),
				c = r(55833),
				u = r(79984),
				i = r(39658),
				m = r(23511),
				o = r(61878);
			function h() {
				let { navigate: e } = (0, c.c)(),
					[t, r] = (0, n.useState)(""),
					[h, x] = (0, n.useState)("all"),
					{ data: N, isLoading: f } = (0, a.Ay)(["crm-test-drives", t, h], () =>
						(0, d.cj)({ search: t || void 0, status: h, limit: 100 })
					),
					g = N?.data || [];
				return (0, s.jsxs)(u.Zp, {
					className: "border-border/70 shadow-sm",
					children: [
						(0, s.jsx)(u.aR, {
							className: "pb-3",
							children: (0, s.jsxs)("div", {
								className: "flex flex-col gap-3 sm:flex-row",
								children: [
									(0, s.jsxs)("div", {
										className: "relative flex-1",
										children: [
											(0, s.jsx)(o.A, {
												className:
													"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
											}),
											(0, s.jsx)(i.p, {
												className: "pl-9",
												placeholder: "Search test drives…",
												value: t,
												onChange: (e) => r(e.target.value),
											}),
										],
									}),
									(0, s.jsxs)("select", {
										className:
											"h-9 rounded-md border border-input bg-background px-3 text-sm",
										value: h,
										onChange: (e) => x(e.target.value),
										children: [
											(0, s.jsx)("option", {
												value: "all",
												children: "All statuses",
											}),
											[
												"Scheduled",
												"Confirmed",
												"In Progress",
												"Completed",
												"Failed",
												"No-Show",
												"Cancelled",
											].map((e) => (0, s.jsx)("option", { children: e }, e)),
										],
									}),
								],
							}),
						}),
						(0, s.jsx)(u.Wu, {
							children: f
								? (0, s.jsx)(m.E, { className: "h-32" })
								: (0, s.jsx)("div", {
										className: "dms-table-panel overflow-x-auto",
										children: (0, s.jsxs)("table", {
											className: "w-full text-sm",
											children: [
												(0, s.jsx)("thead", {
													children: (0, s.jsxs)("tr", {
														className:
															"border-b text-left text-xs text-muted-foreground",
														children: [
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Test Drive",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Deal",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Customer",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Scheduled",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Vehicle",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Status",
															}),
															(0, s.jsx)("th", {
																className: "pb-2 font-medium",
																children: "Outcome",
															}),
														],
													}),
												}),
												(0, s.jsx)("tbody", {
													children: g.length
														? g.map((t) =>
																(0, s.jsxs)(
																	"tr",
																	{
																		className:
																			"cursor-pointer border-b border-border/60 hover:bg-muted/40",
																		onClick: () =>
																			e(
																				"crm-test-drive-detail",
																				{
																					id: String(
																						t.name
																					),
																				}
																			),
																		children: [
																			(0, s.jsx)("td", {
																				className:
																					"py-3 font-medium",
																				children: String(
																					t.name
																				),
																			}),
																			(0, s.jsx)("td", {
																				className: "py-3",
																				children: String(
																					t.opportunity ||
																						"—"
																				),
																			}),
																			(0, s.jsx)("td", {
																				className:
																					"py-3 text-muted-foreground",
																				children: String(
																					t.customer ||
																						"—"
																				),
																			}),
																			(0, s.jsx)("td", {
																				className:
																					"py-3 text-muted-foreground",
																				children:
																					t.scheduled_datetime
																						? (0,
																						  l.r6)(
																								String(
																									t.scheduled_datetime
																								)
																						  )
																						: "—",
																			}),
																			(0, s.jsx)("td", {
																				className:
																					"py-3 text-muted-foreground",
																				children: String(
																					t.vehicle_vin ||
																						"—"
																				),
																			}),
																			(0, s.jsx)("td", {
																				className: "py-3",
																				children: String(
																					t.status || "—"
																				),
																			}),
																			(0, s.jsx)("td", {
																				className:
																					"py-3 text-muted-foreground",
																				children: String(
																					t.outcome ||
																						"—"
																				),
																			}),
																		],
																	},
																	String(t.name)
																)
														  )
														: (0, s.jsx)("tr", {
																children: (0, s.jsx)("td", {
																	colSpan: 7,
																	className:
																		"py-10 text-center text-muted-foreground",
																	children:
																		"No test drives yet. Schedule one from a Deal.",
																}),
														  }),
												}),
											],
										}),
								  }),
						}),
					],
				});
			}
		},
		81672: (e, t, r) => {
			r.d(t, { Ge: () => m, N0: () => u, Yq: () => d, gQ: () => i, r6: () => c });
			let s = [
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
				n = (e) => String(e).padStart(2, "0");
			function a(e) {
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
				let s = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(s.getTime()) ? null : s;
			}
			function d(e, t = "") {
				let r = a(e);
				return r ? `${n(r.getDate())}/${n(r.getMonth() + 1)}/${r.getFullYear()}` : t;
			}
			function c(e, t = "", r = !1) {
				let s = a(e);
				if (!s) return t;
				let l = `${n(s.getHours())}:${n(s.getMinutes())}${
					r ? `:${n(s.getSeconds())}` : ""
				}`;
				return `${d(s)} ${l}`;
			}
			function u(e, t = "") {
				let r = a(e);
				return r ? `${s[r.getMonth()]} ${r.getFullYear()}` : t;
			}
			function i(e, t = "") {
				let r = a(e);
				return r ? l[r.getDay()] : t;
			}
			function m(e, t = "") {
				let r = a(e);
				return r ? `${l[r.getDay()]}, ${d(r)}` : t;
			}
		},
	},
]);
