"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8596],
	{
		7810: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("users", [
				["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
				["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
				["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
				["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
			]);
		},
		10184: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("user-check", [
				["path", { d: "m16 11 2 2 4-4", key: "9rsbq5" }],
				["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
				["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
			]);
		},
		31521: (e, a, s) => {
			s.d(a, { P: () => l });
			var t = s(12115);
			function l(e, a, s) {
				let l = `dms:listFilters:${e}:${a}`,
					[r, n] = (0, t.useState)(() => {
						let e = (function (e) {
							try {
								let a = window.localStorage.getItem(e);
								if (null === a) return;
								return JSON.parse(a);
							} catch {
								return;
							}
						})(l);
						return void 0 === e ? s : e;
					});
				return (
					(0, t.useEffect)(() => {
						try {
							JSON.stringify(r) === JSON.stringify(s)
								? window.localStorage.removeItem(l)
								: window.localStorage.setItem(l, JSON.stringify(r));
						} catch {}
					}, [l, r, s]),
					[r, n]
				);
			}
		},
		33745: (e, a, s) => {
			s.d(a, { l: () => c });
			var t = s(95155),
				l = s(51914),
				r = s(63360),
				n = s(4474),
				i = s(91337);
			function c({ module: e, label: a, className: s, ...d }) {
				let { canCreate: o } = (0, r.Sk)();
				return o(e)
					? (0, t.jsxs)(n.$, {
							"aria-label": a,
							title: a,
							className: (0, i.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								s
							),
							...d,
							children: [
								(0, t.jsx)(l.A, { className: "h-4 w-4 shrink-0" }),
								(0, t.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: a,
								}),
							],
					  })
					: null;
			}
		},
		61878: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		61991: (e, a, s) => {
			s.d(a, { w: () => n });
			var t = s(95155);
			s(12115);
			var l = s(89803),
				r = s(91337);
			function n({ className: e, orientation: a = "horizontal", decorative: s = !0, ...i }) {
				return (0, t.jsx)(l.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: a,
					className: (0, r.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...i,
				});
			}
		},
		78596: (e, a, s) => {
			s.r(a), s.d(a, { default: () => U });
			var t = s(95155),
				l = s(81672),
				r = s(12115),
				n = s(31521),
				i = s(55833),
				c = s(33745),
				d = s(63360),
				o = s(36020),
				m = s(9141),
				x = s(98883);
			function u(e) {
				if (!e) return null;
				let a = new Date(e.replace(" ", "T"));
				return Number.isNaN(a.getTime()) ? null : 60 * a.getHours() + a.getMinutes();
			}
			function h(e, a) {
				let s = Math.max(e, 480),
					t = Math.min(a, 1080);
				return t <= s
					? null
					: {
							top: `${((s - 480) / 600) * 100}%`,
							height: `${Math.max(((t - s) / 600) * 100, 4)}%`,
					  };
			}
			function p({ calendar: e, dateLabel: a, compact: s = !1 }) {
				let l = Array.from({ length: 11 }, (e, a) => 8 + a);
				return (0, t.jsxs)("div", {
					className: "space-y-2",
					children: [
						a &&
							(0, t.jsx)("p", {
								className:
									"text-xs font-medium text-muted-foreground uppercase tracking-wider",
								children: a,
							}),
						(0, t.jsxs)("div", {
							className: `relative rounded-lg border bg-muted/20 ${
								s ? "h-48" : "h-64"
							}`,
							children: [
								l.map((e, a) =>
									(0, t.jsx)(
										"div",
										{
											className:
												"absolute left-0 right-0 border-t border-border/50 flex",
											style: { top: `${(a / (l.length - 1)) * 100}%` },
											children: (0, t.jsx)("span", {
												className:
													"w-12 shrink-0 pl-1 text-[10px] text-muted-foreground -translate-y-1.5",
												children: `${e > 12 ? e - 12 : 0 === e ? 12 : e} ${
													e >= 12 ? "PM" : "AM"
												}`,
											}),
										},
										e
									)
								),
								(0, t.jsxs)("div", {
									className: "absolute left-12 right-2 top-0 bottom-0",
									children: [
										(e?.free_slots || []).map((e, a) => {
											let s = u(e.start),
												l = u(e.end);
											if (null == s || null == l) return null;
											let r = h(s, l);
											return r
												? (0, t.jsx)(
														"div",
														{
															className:
																"absolute left-0 right-0 rounded bg-green-500/15 border border-green-500/30",
															style: r,
															title: "Available",
														},
														`free-${a}`
												  )
												: null;
										}),
										(e?.blocks || []).map((e, a) => {
											let l = u(e.start),
												r = u(e.end);
											if (null == l || null == r) return null;
											let n = h(l, r);
											if (!n) return null;
											let i = "in_progress" === e.kind;
											return (0, t.jsxs)(
												"div",
												{
													className: `absolute left-0 right-0 rounded px-1 py-0.5 text-[10px] overflow-hidden border ${
														i
															? "bg-amber-500/25 border-amber-500/50 text-amber-950 dark:text-amber-100"
															: "bg-primary/20 border-primary/40"
													}`,
													style: n,
													title: `${e.job_card} — ${e.status}`,
													children: [
														(0, t.jsx)("span", {
															className:
																"font-medium truncate block",
															children: e.job_card,
														}),
														!s &&
															e.customer_name &&
															(0, t.jsx)("span", {
																className:
																	"truncate block opacity-80",
																children: e.customer_name,
															}),
													],
												},
												`block-${e.job_card}-${a}`
											);
										}),
									],
								}),
							],
						}),
						(0, t.jsxs)("div", {
							className: "flex flex-wrap gap-3 text-[10px] text-muted-foreground",
							children: [
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className:
												"h-2.5 w-2.5 rounded bg-green-500/30 border border-green-500/50",
										}),
										"Available",
									],
								}),
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className:
												"h-2.5 w-2.5 rounded bg-primary/30 border border-primary/40",
										}),
										"Scheduled",
									],
								}),
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className:
												"h-2.5 w-2.5 rounded bg-amber-500/30 border border-amber-500/50",
										}),
										"In progress",
									],
								}),
							],
						}),
					],
				});
			}
			var b = s(4474),
				g = s(39658),
				f = s(38291),
				j = s(15306),
				v = s(32967),
				N = s(10184),
				y = s(90425);
			let w = (0, y.A)("user-x", [
				["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
				["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
				["line", { x1: "17", x2: "22", y1: "8", y2: "13", key: "3nzzx3" }],
				["line", { x1: "22", x2: "17", y1: "8", y2: "13", key: "1swrse" }],
			]);
			function k() {
				return new Date().toISOString().split("T")[0];
			}
			function _(e, a) {
				let s = new Date(e + "T12:00:00");
				return s.setDate(s.getDate() + a), s.toISOString().split("T")[0];
			}
			function A(e) {
				let a = new Date(e + "T12:00:00"),
					s = a.getFullYear(),
					t = String(a.getMonth() + 1).padStart(2, "0");
				return `${s}-${t}-01`;
			}
			function S(e) {
				return (0, l.Ge)(e);
			}
			function $(e) {
				let a = e.availability_status;
				return "busy" === a || e.currently_working
					? {
							label: "Busy",
							color: "text-amber-600 dark:text-amber-400",
							bg: "bg-amber-100 dark:bg-amber-900/30",
							ring: "ring-amber-500/40",
							dot: "bg-amber-500",
							icon: v.A,
							hint: e.unavailable_reason,
					  }
					: "available" === a || e.is_available
					? {
							label: "Available",
							color: "text-green-600 dark:text-green-400",
							bg: "bg-green-100 dark:bg-green-900/30",
							ring: "ring-green-500/40",
							dot: "bg-green-500",
							icon: N.A,
					  }
					: {
							label: "Not Available",
							color: "text-destructive",
							bg: "bg-destructive/10",
							ring: "ring-destructive/40",
							dot: "bg-destructive",
							icon: w,
							hint: e.unavailable_reason || "Schedule conflict or absent",
					  };
			}
			var C = s(41641),
				M = s(21362),
				T = s(6296);
			let E = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
			function z({ technicianId: e, initialDate: a }) {
				let [s, n] = (0, r.useState)("week"),
					[i, c] = (0, r.useState)(a || k()),
					[d, m] = (0, r.useState)(a || k()),
					{ data: x, isLoading: u, error: h } = (0, o.pX)(e, i, s),
					v = (0, r.useMemo)(() => (x?.days ? Object.keys(x.days).sort() : []), [x]),
					N = x?.days?.[d] ?? null,
					y = N ? $(N) : null,
					w = y?.icon,
					J = (e) => {
						if ("week" === s) {
							let a = _(i, 7 * e);
							c(a), m(a);
							return;
						}
						let a = new Date(i + "T12:00:00");
						a.setMonth(a.getMonth() + e);
						let t = a.toISOString().split("T")[0];
						c(t), m(t);
					},
					D = (0, r.useMemo)(() => {
						if (!x) return "";
						if ("week" === s) return `${S(x.start_date)} – ${S(x.end_date)}`;
						let e = new Date(i + "T12:00:00");
						return (0, l.N0)(e);
					}, [x, s, i]);
				return (0, t.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, t.jsxs)("div", {
							className:
								"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, t.jsx)(j.tU, {
									value: s,
									onValueChange: (e) => {
										n(e), "month" === e ? c(A(d)) : c(d);
									},
									children: (0, t.jsxs)(j.j7, {
										className: "h-8",
										children: [
											(0, t.jsx)(j.Xi, {
												value: "week",
												className: "text-xs px-3",
												children: "Week",
											}),
											(0, t.jsx)(j.Xi, {
												value: "month",
												className: "text-xs px-3",
												children: "Month",
											}),
										],
									}),
								}),
								(0, t.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)(b.$, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "h-8 w-8",
											onClick: () => J(-1),
											children: (0, t.jsx)(C.A, { className: "h-4 w-4" }),
										}),
										(0, t.jsx)(b.$, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-8 text-xs",
											onClick: () => {
												let e = k();
												c(e), m(e);
											},
											children: "Today",
										}),
										(0, t.jsx)(b.$, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "h-8 w-8",
											onClick: () => J(1),
											children: (0, t.jsx)(M.A, { className: "h-4 w-4" }),
										}),
									],
								}),
							],
						}),
						(0, t.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: D,
						}),
						(0, t.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-center",
							children: [
								(0, t.jsx)("label", {
									className:
										"text-xs font-medium text-muted-foreground shrink-0",
									children: "Jump to date",
								}),
								(0, t.jsx)(g.p, {
									type: "date",
									className: "h-9",
									value: d,
									onChange: (e) => {
										let a = e.target.value;
										a && (m(a), c("month" === s ? A(a) : a));
									},
								}),
							],
						}),
						u
							? (0, t.jsx)("div", {
									className: "flex justify-center py-8",
									children: (0, t.jsx)(T.A, {
										className: "h-6 w-6 animate-spin text-muted-foreground",
									}),
							  })
							: h
							? (0, t.jsx)("p", {
									className: "text-sm text-destructive",
									children: "Could not load schedule",
							  })
							: "week" === s
							? (0, t.jsx)("div", {
									className: "grid grid-cols-7 gap-1.5",
									children: v.map((e) => {
										let a = x.days[e],
											s = $(a),
											r = e === d,
											n = e === k(),
											i = new Date(e + "T12:00:00").getDate(),
											c = (0, l.gQ)(e);
										return (0, t.jsxs)(
											"button",
											{
												type: "button",
												onClick: () => m(e),
												className: `rounded-lg border p-2 text-center transition-colors ${
													r
														? "border-primary bg-primary/5 ring-1 ring-primary"
														: n
														? "border-primary/30 bg-primary/5"
														: "hover:bg-muted/50"
												}`,
												children: [
													(0, t.jsx)("p", {
														className:
															"text-[10px] text-muted-foreground",
														children: c,
													}),
													(0, t.jsx)("p", {
														className: `text-lg font-bold ${
															n ? "text-primary" : ""
														}`,
														children: i,
													}),
													(0, t.jsx)("span", {
														className: `mx-auto mt-1 block h-2 w-2 rounded-full ${s.dot}`,
													}),
													a.active_job_count > 0 &&
														(0, t.jsxs)("p", {
															className:
																"mt-0.5 text-[10px] text-muted-foreground",
															children: [
																a.active_job_count,
																" job",
																1 !== a.active_job_count
																	? "s"
																	: "",
															],
														}),
												],
											},
											e
										);
									}),
							  })
							: (0, t.jsxs)("div", {
									children: [
										(0, t.jsx)("div", {
											className: "grid grid-cols-7 gap-1 mb-1",
											children: E.map((e) =>
												(0, t.jsx)(
													"p",
													{
														className:
															"text-center text-[10px] font-medium text-muted-foreground",
														children: e,
													},
													e
												)
											),
										}),
										(0, t.jsx)("div", {
											className: "grid grid-cols-7 gap-1",
											children: v.map((e) => {
												let a = x.days[e],
													s = $(a),
													l = e === d,
													r = e === k(),
													n = !1 !== a.in_month,
													i = new Date(e + "T12:00:00").getDate();
												return (0, t.jsxs)(
													"button",
													{
														type: "button",
														onClick: () => m(e),
														className: `min-h-[52px] rounded-md border p-1 text-center transition-colors ${
															!n ? "opacity-40" : ""
														} ${
															l
																? "border-primary bg-primary/5 ring-1 ring-primary"
																: r
																? "border-primary/30"
																: "hover:bg-muted/50"
														}`,
														children: [
															(0, t.jsx)("span", {
																className: `text-sm font-medium ${
																	r ? "text-primary" : ""
																}`,
																children: i,
															}),
															(0, t.jsx)("span", {
																className: `mx-auto mt-0.5 block h-1.5 w-1.5 rounded-full ${s.dot}`,
															}),
														],
													},
													e
												);
											}),
										}),
									],
							  }),
						N &&
							y &&
							(0, t.jsxs)("div", {
								className: "space-y-3 border-t pt-4",
								children: [
									(0, t.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											(0, t.jsx)("p", {
												className: "text-sm font-medium",
												children: S(d),
											}),
											(0, t.jsxs)(f.E, {
												variant: "outline",
												className: `gap-1 ${y.bg} ${y.color} border-0`,
												children: [
													w && (0, t.jsx)(w, { className: "h-3 w-3" }),
													y.label,
												],
											}),
											N.active_job_count > 0 &&
												(0, t.jsxs)("span", {
													className: "text-xs text-muted-foreground",
													children: [
														N.active_job_count,
														" job",
														1 !== N.active_job_count ? "s" : "",
													],
												}),
										],
									}),
									y.hint &&
										(0, t.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: y.hint,
										}),
									(0, t.jsx)(p, {
										calendar: N.day_calendar,
										dateLabel: "8 AM – 6 PM",
										compact: !0,
									}),
									N.active_jobs &&
										N.active_jobs.length > 0 &&
										(0, t.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, t.jsx)("p", {
													className:
														"text-xs font-medium text-muted-foreground uppercase tracking-wider",
													children: "Jobs",
												}),
												N.active_jobs.map((e) =>
													(0, t.jsxs)(
														"div",
														{
															className:
																"flex items-center justify-between rounded-md border px-2 py-1.5 text-xs",
															children: [
																(0, t.jsx)("span", {
																	className:
																		"font-medium truncate",
																	children: e.name,
																}),
																(0, t.jsx)("span", {
																	className:
																		"text-muted-foreground shrink-0 ml-2",
																	children: e.status,
																}),
															],
														},
														e.name
													)
												),
											],
										}),
								],
							}),
						(0, t.jsxs)("div", {
							className:
								"flex flex-wrap gap-3 text-[10px] text-muted-foreground border-t pt-3",
							children: [
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className: "h-2 w-2 rounded-full bg-green-500",
										}),
										" Available",
									],
								}),
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className: "h-2 w-2 rounded-full bg-amber-500",
										}),
										" Busy",
									],
								}),
								(0, t.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [
										(0, t.jsx)("span", {
											className: "h-2 w-2 rounded-full bg-destructive",
										}),
										" Not available",
									],
								}),
							],
						}),
					],
				});
			}
			var J = s(79984),
				D = s(26518),
				H = s(95885),
				P = s(7810),
				I = s(57420),
				L = s(61878),
				O = s(49387),
				V = s(24538),
				B = s(84980),
				W = s(44071);
			let Q = (0, y.A)("activity", [
				[
					"path",
					{
						d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
						key: "169zse",
					},
				],
			]);
			var Z = s(85118);
			let q = [
					{ value: "all", label: "All Skill Levels" },
					{ value: "Trainee", label: "Trainee" },
					{ value: "Junior", label: "Junior" },
					{ value: "Intermediate", label: "Intermediate" },
					{ value: "Senior", label: "Senior" },
					{ value: "Master Technician", label: "Master Technician" },
					{ value: "EV/PHEV Certified", label: "EV/PHEV Certified" },
					{ value: "Expert", label: "Expert" },
				],
				F = [
					{ value: "all", label: "All" },
					{ value: "available", label: "Available" },
					{ value: "busy", label: "Busy" },
					{ value: "unavailable", label: "Not Available" },
				];
			function U() {
				let { navigate: e } = (0, i.c)(),
					{ canWrite: a } = (0, d.Sk)(),
					[s, u] = (0, n.P)("technicians", "search", ""),
					[h, p] = (0, n.P)("technicians", "skill", "all"),
					[f, j] = (0, n.P)("technicians", "availability", "all"),
					[y, A] = (0, r.useState)(k),
					[E, H] = (0, r.useState)(null),
					[V, B] = (0, r.useState)(!1),
					[W, Q] = (0, r.useState)(!1),
					{ data: Z, isLoading: U, error: Y } = (0, o.K4)(y),
					{ data: K, isLoading: R, mutate: G } = (0, o.bi)(E),
					ee = (0, r.useMemo)(
						() =>
							Z
								? Z.filter((e) => {
										if (s) {
											let a = s.toLowerCase();
											if (
												!e.full_name?.toLowerCase().includes(a) &&
												!e.name?.toLowerCase().includes(a) &&
												!e.personal_phone?.toLowerCase().includes(a)
											)
												return !1;
										}
										if ("all" !== h && e.skill_level !== h) return !1;
										if ("all" !== f) {
											let a = $(e);
											if (
												("available" === f && "Available" !== a.label) ||
												("busy" === f && "Busy" !== a.label) ||
												("unavailable" === f &&
													"Not Available" !== a.label)
											)
												return !1;
										}
										return !0;
								  })
								: [],
						[Z, s, h, f]
					),
					ea = (0, r.useMemo)(() => {
						if (!Z) return { total: 0, available: 0, busy: 0, unavailable: 0 };
						let e = 0,
							a = 0,
							s = 0;
						return (
							Z.forEach((t) => {
								let l = $(t);
								"Available" === l.label ? e++ : "Busy" === l.label ? a++ : s++;
							}),
							{ total: Z.length, available: e, busy: a, unavailable: s }
						);
					}, [Z]),
					es = y === k();
				return (0, t.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, t.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, t.jsxs)("div", {
									children: [
										(0, t.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Technicians",
										}),
										(0, t.jsxs)("p", {
											className: "text-muted-foreground",
											children: [
												"Availability for ",
												S(y),
												!es && " (not today)",
											],
										}),
									],
								}),
								(0, t.jsx)(c.l, {
									module: "technicians",
									label: "New technician",
									onClick: () => B(!0),
								}),
							],
						}),
						(0, t.jsx)(m.H, { open: V, onOpenChange: B, onCreated: (e) => H(e) }),
						(0, t.jsx)(m.H, {
							open: W,
							onOpenChange: Q,
							technician: K,
							onUpdated: () => {
								G();
							},
						}),
						(0, t.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
							children: [
								(0, t.jsx)(J.Zp, {
									className: "dms-kpi-card",
									children: (0, t.jsx)(J.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, t.jsx)("div", {
													className: "rounded-full bg-primary/10 p-1.5",
													children: (0, t.jsx)(P.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, t.jsxs)("div", {
													children: [
														(0, t.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: ea.total,
														}),
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Total Active",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, t.jsx)(J.Zp, {
									className: "dms-kpi-card",
									children: (0, t.jsx)(J.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, t.jsx)("div", {
													className:
														"rounded-full bg-green-100 p-1.5 dark:bg-green-900/30",
													children: (0, t.jsx)(N.A, {
														className:
															"h-3.5 w-3.5 text-green-600 dark:text-green-400",
													}),
												}),
												(0, t.jsxs)("div", {
													children: [
														(0, t.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: ea.available,
														}),
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Available",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, t.jsx)(J.Zp, {
									className: "dms-kpi-card",
									children: (0, t.jsx)(J.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, t.jsx)("div", {
													className:
														"rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30",
													children: (0, t.jsx)(v.A, {
														className:
															"h-3.5 w-3.5 text-amber-600 dark:text-amber-400",
													}),
												}),
												(0, t.jsxs)("div", {
													children: [
														(0, t.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: ea.busy,
														}),
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Busy",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, t.jsx)(J.Zp, {
									className: "dms-kpi-card",
									children: (0, t.jsx)(J.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, t.jsx)("div", {
													className:
														"rounded-full bg-destructive/10 p-1.5",
													children: (0, t.jsx)(w, {
														className: "h-3.5 w-3.5 text-destructive",
													}),
												}),
												(0, t.jsxs)("div", {
													children: [
														(0, t.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: ea.unavailable,
														}),
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Not Available",
														}),
													],
												}),
											],
										}),
									}),
								}),
							],
						}),
						(0, t.jsx)(J.Zp, {
							className: "dms-toolbar-card",
							children: (0, t.jsxs)(J.Wu, {
								className: "space-y-3 px-3.5 py-3",
								children: [
									(0, t.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											(0, t.jsx)(I.A, {
												className:
													"h-4 w-4 shrink-0 text-muted-foreground",
											}),
											(0, t.jsx)("span", {
												className: "shrink-0 text-sm font-medium",
												children: "View date",
											}),
											(0, t.jsx)(b.$, {
												type: "button",
												variant: "outline",
												size: "icon",
												className: "hidden h-8 w-8 sm:inline-flex",
												onClick: () => A((e) => _(e, -1)),
												children: (0, t.jsx)(C.A, {
													className: "h-4 w-4",
												}),
											}),
											(0, t.jsx)(g.p, {
												type: "date",
												className:
													"h-8 min-w-0 flex-1 sm:w-[150px] sm:flex-none",
												value: y,
												onChange: (e) =>
													e.target.value && A(e.target.value),
											}),
											(0, t.jsx)(b.$, {
												type: "button",
												variant: "outline",
												size: "icon",
												className: "hidden h-8 w-8 sm:inline-flex",
												onClick: () => A((e) => _(e, 1)),
												children: (0, t.jsx)(M.A, {
													className: "h-4 w-4",
												}),
											}),
											(0, t.jsx)(b.$, {
												type: "button",
												variant: "outline",
												size: "sm",
												className: "h-8",
												onClick: () => A(k()),
												disabled: es,
												children: "Today",
											}),
										],
									}),
									(0, t.jsxs)("div", {
										className: "flex flex-col gap-3 sm:flex-row",
										children: [
											(0, t.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, t.jsx)(L.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, t.jsx)(g.p, {
														placeholder: "Search by name or phone...",
														className: "pl-9",
														value: s,
														onChange: (e) => u(e.target.value),
													}),
												],
											}),
											(0, t.jsxs)(D.l6, {
												value: h,
												onValueChange: p,
												children: [
													(0, t.jsx)(D.bq, {
														className: "w-full sm:w-[180px]",
														children: (0, t.jsx)(D.yv, {}),
													}),
													(0, t.jsx)(D.gC, {
														children: q.map((e) =>
															(0, t.jsx)(
																D.eb,
																{
																	value: e.value,
																	children: e.label,
																},
																e.value
															)
														),
													}),
												],
											}),
											(0, t.jsxs)(D.l6, {
												value: f,
												onValueChange: j,
												children: [
													(0, t.jsx)(D.bq, {
														className: "w-full sm:w-[160px]",
														children: (0, t.jsx)(D.yv, {}),
													}),
													(0, t.jsx)(D.gC, {
														children: F.map((e) =>
															(0, t.jsx)(
																D.eb,
																{
																	value: e.value,
																	children: e.label,
																},
																e.value
															)
														),
													}),
												],
											}),
										],
									}),
								],
							}),
						}),
						U
							? (0, t.jsx)("div", {
									className: "flex items-center justify-center py-12",
									children: (0, t.jsx)(T.A, {
										className: "h-8 w-8 animate-spin text-muted-foreground",
									}),
							  })
							: Y
							? (0, t.jsx)(J.Zp, {
									className: "dms-kpi-card",
									children: (0, t.jsx)(J.Wu, {
										className: "flex items-center justify-center py-12",
										children: (0, t.jsx)("p", {
											className: "text-destructive",
											children: "Failed to load technicians",
										}),
									}),
							  })
							: 0 === ee.length
							? (0, t.jsx)(J.Zp, {
									children: (0, t.jsxs)(J.Wu, {
										className:
											"flex flex-col items-center justify-center py-12",
										children: [
											(0, t.jsx)(P.A, {
												className:
													"mb-3 h-12 w-12 text-muted-foreground/50",
											}),
											(0, t.jsx)("p", {
												className:
													"text-lg font-medium text-muted-foreground",
												children: "No technicians found",
											}),
											(0, t.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "Try adjusting your filters",
											}),
										],
									}),
							  })
							: (0, t.jsx)("div", {
									className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
									children: ee.map((e) =>
										(0, t.jsx)(
											X,
											{ tech: e, onSelect: () => H(e.name) },
											e.name
										)
									),
							  }),
						(0, t.jsx)(x.BN, {
							open: !!E,
							onOpenChange: (e) => {
								e || H(null);
							},
							title: K?.full_name || E || "",
							subtitle: K?.status,
							badge: K ? { label: K.skill_level || "—" } : void 0,
							isLoading: R,
							onOpenInDesk: () => window.open(`/app/technician/${E}`, "_blank"),
							children:
								K &&
								E &&
								(0, t.jsxs)(t.Fragment, {
									children: [
										(0, t.jsx)(x.JH, {
											title: "Schedule & availability",
											children: (0, t.jsx)(z, {
												technicianId: E,
												initialDate: y,
											}),
										}),
										(0, t.jsxs)(x.JH, {
											title: "Personal Info",
											children: [
												(0, t.jsx)(x.Qb, {
													label: "Full Name",
													value: K.full_name,
												}),
												(0, t.jsx)(x.Qb, {
													label: "Employee Code",
													value: K.employee_code,
												}),
												(0, t.jsx)(x.Qb, {
													label: "Status",
													value: K.status,
												}),
												(0, t.jsx)(x.Qb, {
													label: "Phone",
													value: K.personal_phone,
												}),
											],
										}),
										(0, t.jsxs)(x.JH, {
											title: "Employment",
											children: [
												(0, t.jsx)(x.Qb, {
													label: "Skill Level",
													value: K.skill_level,
												}),
												(0, t.jsx)(x.Qb, {
													label: "Date of Joining",
													value: K.date_of_joining
														? (0, l.Yq)(K.date_of_joining)
														: void 0,
												}),
												(0, t.jsx)(x.Qb, {
													label: "Branch",
													value: K.branch,
												}),
											],
										}),
										K.specializations &&
											K.specializations.length > 0 &&
											(0, t.jsx)(x.JH, {
												title: "Specializations",
												children: (0, t.jsx)("div", {
													className: "flex flex-wrap gap-1",
													children: K.specializations.map((e, a) =>
														(0, t.jsx)(
															"span",
															{
																className:
																	"text-xs bg-muted px-2 py-1 rounded",
																children:
																	e.specialization || e.name,
															},
															a
														)
													),
												}),
											}),
										(0, t.jsxs)("div", {
											className: "flex justify-end gap-2 pt-2",
											children: [
												a("technicians")
													? (0, t.jsxs)(b.$, {
															variant: "outline",
															onClick: () => Q(!0),
															children: [
																(0, t.jsx)(O.A, {
																	className: "h-4 w-4 mr-2",
																}),
																"Edit",
															],
													  })
													: null,
												(0, t.jsx)(b.$, {
													variant: "outline",
													onClick: () => {
														H(null), e("technician-detail", { id: E });
													},
													children: "View Full Profile",
												}),
											],
										}),
									],
								}),
						}),
					],
				});
			}
			function X({ tech: e, onSelect: a }) {
				let s = $(e),
					l = s.icon;
				return (0, t.jsx)(J.Zp, {
					className: "cursor-pointer transition-shadow hover:shadow-md",
					onClick: a,
					children: (0, t.jsxs)(J.Wu, {
						className: "p-5",
						children: [
							(0, t.jsxs)("div", {
								className: "flex items-start gap-4",
								children: [
									(0, t.jsxs)(H.eu, {
										className: "h-12 w-12",
										children: [
											e.profile_photo &&
												(0, t.jsx)(H.BK, {
													src: e.profile_photo,
													alt: e.full_name,
												}),
											(0, t.jsx)(H.q5, {
												className:
													"bg-primary/10 text-primary font-semibold",
												children:
													e.full_name
														?.split(" ")
														.map((e) => e[0])
														.join("")
														.slice(0, 2)
														.toUpperCase() || "?",
											}),
										],
									}),
									(0, t.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [
											(0, t.jsxs)("div", {
												className:
													"flex items-center justify-between gap-2",
												children: [
													(0, t.jsx)("h3", {
														className: "font-semibold truncate",
														children: e.full_name,
													}),
													(0, t.jsxs)(f.E, {
														variant: "outline",
														className: `shrink-0 gap-1 ${s.bg} ${s.color} border-0`,
														children: [
															(0, t.jsx)(l, {
																className: "h-3 w-3",
															}),
															s.label,
														],
													}),
												],
											}),
											(0, t.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: e.name,
											}),
											(0, t.jsxs)("div", {
												className: "mt-1 flex flex-wrap gap-1.5",
												children: [
													(0, t.jsx)(f.E, {
														variant: "outline",
														className:
															{
																Trainee:
																	"bg-muted text-muted-foreground border-muted",
																Junior: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
																Intermediate:
																	"bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
																Senior: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
																"Master Technician":
																	"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
																"EV/PHEV Certified":
																	"bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
																Expert: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
															}[e.skill_level] ||
															"bg-muted text-muted-foreground",
														children: e.skill_level,
													}),
													e.branch &&
														(0, t.jsxs)("span", {
															className:
																"flex items-center gap-1 text-xs text-muted-foreground",
															children: [
																(0, t.jsx)(V.A, {
																	className: "h-3 w-3",
																}),
																e.branch,
															],
														}),
												],
											}),
										],
									}),
								],
							}),
							e.active_jobs.length > 0 &&
								(0, t.jsxs)("div", {
									className: "mt-4 space-y-2",
									children: [
										(0, t.jsxs)("p", {
											className:
												"text-xs font-medium text-muted-foreground uppercase tracking-wider",
											children: ["Jobs (", e.active_job_count, ")"],
										}),
										e.active_jobs.slice(0, 2).map((e) =>
											(0, t.jsxs)(
												"div",
												{
													className:
														"flex items-center justify-between rounded-md border px-3 py-2 text-xs",
													children: [
														(0, t.jsxs)("div", {
															className: "min-w-0 flex-1",
															children: [
																(0, t.jsx)("span", {
																	className: "font-medium",
																	children: e.name,
																}),
																e.customer_name &&
																	(0, t.jsxs)("span", {
																		className:
																			"text-muted-foreground ml-1.5",
																		children: [
																			"— ",
																			e.customer_name,
																		],
																	}),
															],
														}),
														(0, t.jsx)(f.E, {
															variant: "outline",
															className: "ml-2 shrink-0 text-[10px]",
															children: e.status,
														}),
													],
												},
												e.name
											)
										),
										e.active_jobs.length > 2 &&
											(0, t.jsxs)("p", {
												className:
													"text-xs text-muted-foreground text-center",
												children: ["+", e.active_jobs.length - 2, " more"],
											}),
									],
								}),
							(0, t.jsxs)("div", {
								className: "mt-4 flex items-center justify-between border-t pt-3",
								children: [
									(0, t.jsxs)("div", {
										className:
											"flex items-center gap-1 text-xs text-muted-foreground",
										children: [
											(0, t.jsx)(B.A, { className: "h-3.5 w-3.5" }),
											e.work_shift || "—",
										],
									}),
									(0, t.jsxs)("div", {
										className:
											"flex items-center gap-3 text-xs text-muted-foreground",
										children: [
											null != e.efficiency_rating &&
												e.efficiency_rating > 0 &&
												(0, t.jsxs)("span", {
													className: "flex items-center gap-1",
													title: "Efficiency",
													children: [
														(0, t.jsx)(W.A, {
															className: "h-3.5 w-3.5",
														}),
														Math.round(e.efficiency_rating),
														"%",
													],
												}),
											null != e.total_jobs_completed &&
												e.total_jobs_completed > 0 &&
												(0, t.jsxs)("span", {
													className: "flex items-center gap-1",
													title: "Jobs completed",
													children: [
														(0, t.jsx)(Q, {
															className: "h-3.5 w-3.5",
														}),
														e.total_jobs_completed,
													],
												}),
											e.personal_phone &&
												(0, t.jsxs)("span", {
													className: "flex items-center gap-1",
													children: [
														(0, t.jsx)(Z.A, {
															className: "h-3.5 w-3.5",
														}),
														e.personal_phone,
													],
												}),
										],
									}),
								],
							}),
						],
					}),
				});
			}
		},
		89803: (e, a, s) => {
			s.d(a, { b: () => o });
			var t = s(12115);
			s(47650);
			var l = s(42442),
				r = s(95155),
				n = [
					"a",
					"button",
					"div",
					"form",
					"h2",
					"h3",
					"img",
					"input",
					"label",
					"li",
					"nav",
					"ol",
					"p",
					"select",
					"span",
					"svg",
					"ul",
				].reduce((e, a) => {
					let s = (0, l.TL)(`Primitive.${a}`),
						n = t.forwardRef((e, t) => {
							let { asChild: l, ...n } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, r.jsx)(l ? s : a, { ...n, ref: t })
							);
						});
					return (n.displayName = `Primitive.${a}`), { ...e, [a]: n };
				}, {}),
				i = "horizontal",
				c = ["horizontal", "vertical"],
				d = t.forwardRef((e, a) => {
					var s;
					let { decorative: t, orientation: l = i, ...d } = e,
						o = ((s = l), c.includes(s)) ? l : i;
					return (0, r.jsx)(n.div, {
						"data-orientation": o,
						...(t
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === o ? o : void 0,
									role: "separator",
							  }),
						...d,
						ref: a,
					});
				});
			d.displayName = "Separator";
			var o = d;
		},
		98883: (e, a, s) => {
			s.d(a, { Qb: () => j, JH: () => f, BN: () => g });
			var t = s(95155);
			s(12115);
			var l = s(29483),
				r = s(33210),
				n = s(91337);
			function i({ ...e }) {
				return (0, t.jsx)(l.bL, { "data-slot": "sheet", ...e });
			}
			function c({ ...e }) {
				return (0, t.jsx)(l.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function d({ className: e, ...a }) {
				return (0, t.jsx)(l.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...a,
				});
			}
			function o({ className: e, children: a, side: s = "right", ...i }) {
				return (0, t.jsxs)(c, {
					children: [
						(0, t.jsx)(d, {}),
						(0, t.jsxs)(l.UC, {
							"data-slot": "sheet-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === s &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === s &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === s &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === s &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...i,
							children: [
								a,
								(0, t.jsxs)(l.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, t.jsx)(r.A, { className: "size-4" }),
										(0, t.jsx)("span", {
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
			function m({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, n.cn)("flex flex-col gap-1.5 p-4", e),
					...a,
				});
			}
			function x({ className: e, ...a }) {
				return (0, t.jsx)(l.hE, {
					"data-slot": "sheet-title",
					className: (0, n.cn)("text-foreground font-semibold", e),
					...a,
				});
			}
			function u({ className: e, ...a }) {
				return (0, t.jsx)(l.VY, {
					"data-slot": "sheet-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			var h = s(38291),
				p = s(61991),
				b = s(6296);
			function g({
				open: e,
				onOpenChange: a,
				title: s,
				subtitle: l,
				badge: r,
				isLoading: c,
				onOpenInDesk: d,
				footer: f,
				contentScroll: j = "outer",
				children: v,
			}) {
				return (0, t.jsx)(i, {
					open: e,
					onOpenChange: a,
					children: (0, t.jsxs)(o, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, t.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, t.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, t.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, t.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, t.jsx)(x, {
														className: "text-lg",
														children: s,
													}),
													r &&
														(0, t.jsx)(h.E, {
															variant: r.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: r.label,
														}),
												],
											}),
											l && (0, t.jsx)(u, { className: "mt-1", children: l }),
										],
									}),
								}),
							}),
							(0, t.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							c
								? (0, t.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, t.jsx)(b.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, t.jsxs)(t.Fragment, {
										children: [
											(0, t.jsx)("div", {
												className: (0, n.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === j
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: v,
											}),
											f &&
												(0, t.jsx)("div", {
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
			function f({ title: e, children: a, className: s }) {
				return (0, t.jsxs)("div", {
					className: (0, n.cn)("space-y-2", s),
					children: [
						(0, t.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, t.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, t.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: a,
						}),
					],
				});
			}
			function j({ label: e, value: a, className: s }) {
				return (0, t.jsxs)("div", {
					className: (0, n.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						s
					),
					children: [
						(0, t.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, t.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: a || "—",
						}),
					],
				});
			}
		},
	},
]);
