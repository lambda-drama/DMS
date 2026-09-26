"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[7589],
	{
		127: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("target", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
				["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
			]);
		},
		12651: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		14897: (e, s, a) => {
			a.d(s, { C1: () => v, bL: () => b });
			var t = a(12115),
				r = a(95155);
			a(47650);
			var l = a(42442),
				i = [
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
				].reduce((e, s) => {
					let a = (0, l.TL)(`Primitive.${s}`),
						i = t.forwardRef((e, t) => {
							let { asChild: l, ...i } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, r.jsx)(l ? a : s, { ...i, ref: t })
							);
						});
					return (i.displayName = `Primitive.${s}`), { ...e, [s]: i };
				}, {}),
				n = "Progress",
				[c, d] = (function (e, s = []) {
					let a = [],
						l = () => {
							let s = a.map((e) => t.createContext(e));
							return function (a) {
								let r = a?.[e] || s;
								return t.useMemo(
									() => ({ [`__scope${e}`]: { ...a, [e]: r } }),
									[a, r]
								);
							};
						};
					return (
						(l.scopeName = e),
						[
							function (s, l) {
								let i = t.createContext(l);
								i.displayName = s + "Context";
								let n = a.length;
								a = [...a, l];
								let c = (s) => {
									let { scope: a, children: l, ...c } = s,
										d = a?.[e]?.[n] || i,
										x = t.useMemo(() => c, Object.values(c));
									return (0, r.jsx)(d.Provider, { value: x, children: l });
								};
								return (
									(c.displayName = s + "Provider"),
									[
										c,
										function (a, r) {
											let c = r?.[e]?.[n] || i,
												d = t.useContext(c);
											if (d) return d;
											if (void 0 !== l) return l;
											throw Error(`\`${a}\` must be used within \`${s}\``);
										},
									]
								);
							},
							(function (...e) {
								let s = e[0];
								if (1 === e.length) return s;
								let a = () => {
									let a = e.map((e) => ({
										useScope: e(),
										scopeName: e.scopeName,
									}));
									return function (e) {
										let r = a.reduce((s, { useScope: a, scopeName: t }) => {
											let r = a(e)[`__scope${t}`];
											return { ...s, ...r };
										}, {});
										return t.useMemo(
											() => ({ [`__scope${s.scopeName}`]: r }),
											[r]
										);
									};
								};
								return (a.scopeName = s.scopeName), a;
							})(l, ...s),
						]
					);
				})(n),
				[x, m] = c(n),
				o = t.forwardRef((e, s) => {
					var a, t;
					let {
						__scopeProgress: l,
						value: n = null,
						max: c,
						getValueLabel: d = h,
						...m
					} = e;
					(c || 0 === c) &&
						!f(c) &&
						console.error(
							((a = `${c}`),
							`Invalid prop \`max\` of value \`${a}\` supplied to \`Progress\`. Only numbers greater than 0 are valid max values. Defaulting to \`100\`.`)
						);
					let o = f(c) ? c : 100;
					null === n ||
						N(n, o) ||
						console.error(
							((t = `${n}`),
							`Invalid prop \`value\` of value \`${t}\` supplied to \`Progress\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or 100 if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`)
						);
					let u = N(n, o) ? n : null,
						p = g(u) ? d(u, o) : void 0;
					return (0, r.jsx)(x, {
						scope: l,
						value: u,
						max: o,
						children: (0, r.jsx)(i.div, {
							"aria-valuemax": o,
							"aria-valuemin": 0,
							"aria-valuenow": g(u) ? u : void 0,
							"aria-valuetext": p,
							role: "progressbar",
							"data-state": j(u, o),
							"data-value": u ?? void 0,
							"data-max": o,
							...m,
							ref: s,
						}),
					});
				});
			o.displayName = n;
			var u = "ProgressIndicator",
				p = t.forwardRef((e, s) => {
					let { __scopeProgress: a, ...t } = e,
						l = m(u, a);
					return (0, r.jsx)(i.div, {
						"data-state": j(l.value, l.max),
						"data-value": l.value ?? void 0,
						"data-max": l.max,
						...t,
						ref: s,
					});
				});
			function h(e, s) {
				return `${Math.round((e / s) * 100)}%`;
			}
			function j(e, s) {
				return null == e ? "indeterminate" : e === s ? "complete" : "loading";
			}
			function g(e) {
				return "number" == typeof e;
			}
			function f(e) {
				return g(e) && !isNaN(e) && e > 0;
			}
			function N(e, s) {
				return g(e) && !isNaN(e) && e <= s && e >= 0;
			}
			p.displayName = u;
			var b = o,
				v = p;
		},
		15335: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("timer", [
				["line", { x1: "10", x2: "14", y1: "2", y2: "2", key: "14vaq8" }],
				["line", { x1: "12", x2: "15", y1: "14", y2: "11", key: "17fdiu" }],
				["circle", { cx: "12", cy: "14", r: "8", key: "1e1u0o" }],
			]);
		},
		24683: (e, s, a) => {
			a.d(s, { k: () => i });
			var t = a(95155);
			a(12115);
			var r = a(14897),
				l = a(91337);
			function i({ className: e, value: s, ...a }) {
				return (0, t.jsx)(r.bL, {
					"data-slot": "progress",
					className: (0, l.cn)(
						"bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
						e
					),
					...a,
					children: (0, t.jsx)(r.C1, {
						"data-slot": "progress-indicator",
						className: "bg-primary h-full w-full flex-1 transition-all",
						style: { transform: `translateX(-${100 - (s || 0)}%)` },
					}),
				});
			}
		},
		41585: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("triangle-alert", [
				[
					"path",
					{
						d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
						key: "wmoenq",
					},
				],
				["path", { d: "M12 9v4", key: "juzpu7" }],
				["path", { d: "M12 17h.01", key: "p32p05" }],
			]);
		},
		80723: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		94290: (e, s, a) => {
			a.d(s, { A: () => t });
			let t = (0, a(90425).A)("star", [
				[
					"path",
					{
						d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
						key: "r04s7s",
					},
				],
			]);
		},
		97589: (e, s, a) => {
			a.r(s), a.d(s, { default: () => R });
			var t = a(95155),
				r = a(12115),
				l = a(55833),
				i = a(63360),
				n = a(36020),
				c = a(9141),
				d = a(4474),
				x = a(81672),
				m = a(79984),
				o = a(38291),
				u = a(95885),
				p = a(15306),
				h = a(24683),
				j = a(84980),
				g = a(24538),
				f = a(15335),
				N = a(80723),
				b = a(6296),
				v = a(49387),
				y = a(85118),
				_ = a(57420),
				k = a(90425);
			let w = (0, k.A)("briefcase", [
				["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "jecpp" }],
				["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2", key: "i6l2r4" }],
			]);
			var A = a(41641),
				$ = a(21362),
				C = a(12651),
				E = a(44071),
				S = a(127),
				M = a(94290),
				P = a(32967);
			let Z = (0, k.A)("award", [
				[
					"path",
					{
						d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
						key: "1yiouv",
					},
				],
				["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }],
			]);
			var z = a(41585);
			function W(e) {
				if (!e) return "—";
				try {
					let [s, a] = e.split(":"),
						t = parseInt(s);
					return `${t > 12 ? t - 12 : t || 12}:${a} ${t >= 12 ? "PM" : "AM"}`;
				} catch {
					return e;
				}
			}
			function I(e, s) {
				let a = new Date(e);
				return a.setDate(a.getDate() + s), a.toISOString().split("T")[0];
			}
			function T() {
				return new Date().toISOString().split("T")[0];
			}
			function D({ job: e, onNavigate: s }) {
				return (0, t.jsxs)("div", {
					className:
						"rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer",
					onClick: () => s(e.name),
					children: [
						(0, t.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [
								(0, t.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										(0, t.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												(0, t.jsx)("span", {
													className: "font-medium text-sm",
													children: e.name,
												}),
												"Assistant" === e.role &&
													(0, t.jsx)(o.E, {
														variant: "outline",
														className: "text-[10px] px-1.5 py-0",
														children: "Assistant",
													}),
												e.priority &&
													"Normal" !== e.priority &&
													(0, t.jsx)(o.E, {
														variant: "outline",
														className: `text-[10px] px-1.5 py-0 ${
															{
																Emergency:
																	"bg-red-100 text-red-700 border-red-200",
																Urgent: "bg-orange-100 text-orange-700 border-orange-200",
																VIP: "bg-purple-100 text-purple-700 border-purple-200",
																"Safety Critical":
																	"bg-red-100 text-red-700 border-red-200",
															}[e.priority] || ""
														}`,
														children: e.priority,
													}),
											],
										}),
										(0, t.jsxs)("p", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: [
												e.customer_name || "—",
												e.vehicle_model && ` • ${e.vehicle_model}`,
											],
										}),
									],
								}),
								(0, t.jsx)(o.E, {
									variant: "secondary",
									className: `shrink-0 text-[11px] ${
										{
											"Repair In Progress":
												"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
											"Road Test In Progress":
												"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
											"QC In Progress":
												"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
											Scheduled:
												"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
											"Estimation Pending":
												"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
											"Estimation Approved":
												"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
											"Repair Completed":
												"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
											Completed:
												"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
											"Waiting Parts":
												"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
											Open: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
										}[e.status] || "bg-muted text-muted-foreground"
									}`,
									children: e.status,
								}),
							],
						}),
						(0, t.jsxs)("div", {
							className:
								"mt-2 flex items-center gap-4 text-xs text-muted-foreground",
							children: [
								(e.schedule_start_time || e.schedule_end_time) &&
									(0, t.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											(0, t.jsx)(j.A, { className: "h-3 w-3" }),
											W(e.schedule_start_time),
											" – ",
											W(e.schedule_end_time),
										],
									}),
								e.assigned_bay &&
									(0, t.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											(0, t.jsx)(g.A, { className: "h-3 w-3" }),
											e.assigned_bay,
										],
									}),
								null != e.estimated_duration_hours &&
									(0, t.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											(0, t.jsx)(f.A, { className: "h-3 w-3" }),
											"Est. ",
											e.estimated_duration_hours,
											"h",
										],
									}),
							],
						}),
					],
				});
			}
			function R() {
				let { navigate: e, viewParams: s } = (0, l.c)(),
					{ canWrite: a } = (0, i.Sk)(),
					f = s.get("id"),
					[k, R] = (0, r.useState)(T()),
					[B, F] = (0, r.useState)(T()),
					[O, H] = (0, r.useState)(!1),
					{ data: L, isLoading: U, error: X, mutate: q } = (0, n.bi)(f),
					{ data: J } = (0, n.xH)(f, B),
					{ data: V } = (0, n.Wo)(f, k),
					Q = (0, r.useMemo)(() => {
						let e = [];
						for (let s = 0; s < 7; s++) e.push(I(k, s));
						return e;
					}, [k]);
				if (!f)
					return (0, t.jsxs)("div", {
						className: "flex flex-col items-center justify-center py-20",
						children: [
							(0, t.jsx)("p", {
								className: "text-muted-foreground",
								children: "No technician selected",
							}),
							(0, t.jsxs)(d.$, {
								variant: "ghost",
								className: "mt-2",
								onClick: () => e("technicians"),
								children: [
									(0, t.jsx)(N.A, { className: "mr-2 h-4 w-4" }),
									" Back to Technicians",
								],
							}),
						],
					});
				if (U)
					return (0, t.jsx)("div", {
						className: "flex items-center justify-center py-20",
						children: (0, t.jsx)(b.A, {
							className: "h-8 w-8 animate-spin text-muted-foreground",
						}),
					});
				if (X || !L)
					return (0, t.jsxs)("div", {
						className: "flex flex-col items-center justify-center py-20",
						children: [
							(0, t.jsx)("p", {
								className: "text-destructive",
								children: "Failed to load technician details",
							}),
							(0, t.jsxs)(d.$, {
								variant: "ghost",
								className: "mt-2",
								onClick: () => e("technicians"),
								children: [
									(0, t.jsx)(N.A, { className: "mr-2 h-4 w-4" }),
									" Back",
								],
							}),
						],
					});
				let Y =
					L.full_name
						?.split(" ")
						.map((e) => e[0])
						.join("")
						.slice(0, 2)
						.toUpperCase() || "?";
				return (0, t.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, t.jsxs)(d.$, {
							variant: "ghost",
							size: "sm",
							onClick: () => e("technicians"),
							children: [
								(0, t.jsx)(N.A, { className: "mr-2 h-4 w-4" }),
								" Back to Technicians",
							],
						}),
						(0, t.jsx)(m.Zp, {
							className: "dms-kpi-card",
							children: (0, t.jsx)(m.Wu, {
								className: "px-3.5 py-3",
								children: (0, t.jsxs)("div", {
									className: "flex flex-col gap-6 sm:flex-row sm:items-start",
									children: [
										(0, t.jsxs)(u.eu, {
											className: "h-20 w-20",
											children: [
												L.profile_photo &&
													(0, t.jsx)(u.BK, {
														src: L.profile_photo,
														alt: L.full_name,
													}),
												(0, t.jsx)(u.q5, {
													className:
														"bg-primary/10 text-primary text-xl font-bold",
													children: Y,
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "flex-1",
											children: [
												(0, t.jsxs)("div", {
													className:
														"flex items-start justify-between gap-3",
													children: [
														(0, t.jsxs)("div", {
															children: [
																(0, t.jsx)("h1", {
																	className:
																		"dms-stat-value text-xl",
																	children: L.full_name,
																}),
																(0, t.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground",
																	children: L.name,
																}),
																(0, t.jsxs)("div", {
																	className:
																		"mt-2 flex flex-wrap gap-2",
																	children: [
																		(0, t.jsx)(o.E, {
																			variant: "outline",
																			className:
																				"Active" ===
																				L.status
																					? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
																					: "On Leave" ===
																					  L.status
																					? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
																					: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
																			children: L.status,
																		}),
																		(0, t.jsx)(o.E, {
																			variant: "outline",
																			children:
																				L.skill_level,
																		}),
																		L.labor_rate_group &&
																			(0, t.jsx)(o.E, {
																				variant:
																					"secondary",
																				children:
																					L.labor_rate_group,
																			}),
																	],
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className:
																"flex flex-col items-end gap-2",
															children: [
																a("technicians")
																	? (0, t.jsxs)(d.$, {
																			size: "sm",
																			onClick: () => H(!0),
																			children: [
																				(0, t.jsx)(v.A, {
																					className:
																						"h-4 w-4 mr-2",
																				}),
																				"Edit",
																			],
																	  })
																	: null,
																(0, t.jsxs)("div", {
																	className:
																		"text-right hidden sm:block",
																	children: [
																		L.attendance_today &&
																			(0, t.jsx)(o.E, {
																				variant: "outline",
																				className:
																					"Present" ===
																					L.attendance_today
																						? "bg-green-100 text-green-700 dark:bg-green-900/30"
																						: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
																				children:
																					L.attendance_today,
																			}),
																		(L.clock_in_time ||
																			L.clock_out_time) &&
																			(0, t.jsxs)("p", {
																				className:
																					"mt-1 text-xs text-muted-foreground",
																				children: [
																					L.clock_in_time &&
																						`In: ${W(
																							L.clock_in_time
																						)}`,
																					L.clock_out_time &&
																						` • Out: ${W(
																							L.clock_out_time
																						)}`,
																				],
																			}),
																	],
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className:
														"mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground",
													children: [
														L.personal_phone &&
															(0, t.jsxs)("span", {
																className:
																	"flex items-center gap-1",
																children: [
																	(0, t.jsx)(y.A, {
																		className: "h-4 w-4",
																	}),
																	" ",
																	L.personal_phone,
																],
															}),
														L.branch &&
															(0, t.jsxs)("span", {
																className:
																	"flex items-center gap-1",
																children: [
																	(0, t.jsx)(g.A, {
																		className: "h-4 w-4",
																	}),
																	" ",
																	L.branch,
																],
															}),
														L.work_shift &&
															(0, t.jsxs)("span", {
																className:
																	"flex items-center gap-1",
																children: [
																	(0, t.jsx)(j.A, {
																		className: "h-4 w-4",
																	}),
																	" ",
																	L.work_shift,
																],
															}),
														L.weekly_off_days &&
															(0, t.jsxs)("span", {
																className:
																	"flex items-center gap-1",
																children: [
																	(0, t.jsx)(_.A, {
																		className: "h-4 w-4",
																	}),
																	" Off: ",
																	L.weekly_off_days,
																],
															}),
														null != L.years_of_experience &&
															(0, t.jsxs)("span", {
																className:
																	"flex items-center gap-1",
																children: [
																	(0, t.jsx)(w, {
																		className: "h-4 w-4",
																	}),
																	" ",
																	L.years_of_experience,
																	" yrs exp",
																],
															}),
													],
												}),
											],
										}),
									],
								}),
							}),
						}),
						(0, t.jsxs)(p.tU, {
							defaultValue: "schedule",
							className: "space-y-4",
							children: [
								(0, t.jsxs)(p.j7, {
									children: [
										(0, t.jsx)(p.Xi, {
											value: "schedule",
											children: "Schedule",
										}),
										(0, t.jsx)(p.Xi, {
											value: "performance",
											children: "Performance",
										}),
										(0, t.jsx)(p.Xi, {
											value: "skills",
											children: "Skills & Certifications",
										}),
									],
								}),
								(0, t.jsxs)(p.av, {
									value: "schedule",
									className: "space-y-4",
									children: [
										(0, t.jsxs)(m.Zp, {
											children: [
												(0, t.jsx)(m.aR, {
													className: "pb-3",
													children: (0, t.jsxs)("div", {
														className:
															"flex items-center justify-between",
														children: [
															(0, t.jsx)(m.ZB, {
																className: "text-base",
																children: "Weekly Schedule",
															}),
															(0, t.jsxs)("div", {
																className:
																	"flex items-center gap-2",
																children: [
																	(0, t.jsx)(d.$, {
																		variant: "outline",
																		size: "icon",
																		className: "h-8 w-8",
																		onClick: () => R(I(k, -7)),
																		children: (0, t.jsx)(A.A, {
																			className: "h-4 w-4",
																		}),
																	}),
																	(0, t.jsx)(d.$, {
																		variant: "outline",
																		size: "sm",
																		className: "h-8",
																		onClick: () => {
																			R(T()), F(T());
																		},
																		children: "Today",
																	}),
																	(0, t.jsx)(d.$, {
																		variant: "outline",
																		size: "icon",
																		className: "h-8 w-8",
																		onClick: () => R(I(k, 7)),
																		children: (0, t.jsx)($.A, {
																			className: "h-4 w-4",
																		}),
																	}),
																],
															}),
														],
													}),
												}),
												(0, t.jsx)(m.Wu, {
													children: (0, t.jsx)("div", {
														className: "grid grid-cols-7 gap-2",
														children: Q.map((e) => {
															let s = V?.[e] || [],
																a = e === T(),
																r = e === B;
															return (0, t.jsxs)(
																"button",
																{
																	onClick: () => F(e),
																	className: `rounded-lg border p-3 text-center transition-colors ${
																		r
																			? "border-primary bg-primary/5 ring-1 ring-primary"
																			: a
																			? "border-primary/30 bg-primary/5"
																			: "hover:bg-muted/50"
																	}`,
																	children: [
																		(0, t.jsx)("p", {
																			className:
																				"text-xs font-medium text-muted-foreground",
																			children: (0, x.gQ)(e),
																		}),
																		(0, t.jsx)("p", {
																			className: `text-lg font-bold ${
																				a
																					? "text-primary"
																					: ""
																			}`,
																			children: new Date(
																				e
																			).getDate(),
																		}),
																		s.length > 0
																			? (0, t.jsx)("div", {
																					className:
																						"mt-1 flex justify-center",
																					children: (0,
																					t.jsxs)(o.E, {
																						variant:
																							"secondary",
																						className:
																							"h-5 text-[10px] px-1.5",
																						children: [
																							s.length,
																							" job",
																							1 !==
																							s.length
																								? "s"
																								: "",
																						],
																					}),
																			  })
																			: (0, t.jsx)("p", {
																					className:
																						"mt-1 text-[10px] text-muted-foreground",
																					children:
																						"Free",
																			  }),
																	],
																},
																e
															);
														}),
													}),
												}),
											],
										}),
										(0, t.jsxs)(m.Zp, {
											children: [
												(0, t.jsx)(m.aR, {
													className: "pb-3",
													children: (0, t.jsxs)(m.ZB, {
														className: "text-base",
														children: [(0, x.Ge)(B), " — Jobs"],
													}),
												}),
												(0, t.jsx)(m.Wu, {
													children:
														J && 0 !== J.length
															? (0, t.jsx)("div", {
																	className: "space-y-3",
																	children: J.map((s) =>
																		(0, t.jsx)(
																			D,
																			{
																				job: s,
																				onNavigate: (s) =>
																					e(
																						"job-card-detail",
																						{ id: s }
																					),
																			},
																			s.name
																		)
																	),
															  })
															: (0, t.jsxs)("div", {
																	className:
																		"flex flex-col items-center py-8 text-muted-foreground",
																	children: [
																		(0, t.jsx)(C.A, {
																			className:
																				"mb-2 h-8 w-8 text-green-500",
																		}),
																		(0, t.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				"No jobs scheduled",
																		}),
																		(0, t.jsx)("p", {
																			className: "text-sm",
																			children:
																				"This day is currently free",
																		}),
																	],
															  }),
												}),
											],
										}),
									],
								}),
								(0, t.jsxs)(p.av, {
									value: "performance",
									className: "space-y-4",
									children: [
										(0, t.jsxs)("div", {
											className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
											children: [
												(0, t.jsx)(m.Zp, {
													className: "dms-kpi-card",
													children: (0, t.jsx)(m.Wu, {
														className: "px-3.5 py-3",
														children: (0, t.jsxs)("div", {
															className: "flex items-center gap-3",
															children: [
																(0, t.jsx)("div", {
																	className:
																		"rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30",
																	children: (0, t.jsx)(E.A, {
																		className:
																			"h-3.5 w-3.5 text-blue-600 dark:text-blue-400",
																	}),
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsx)("p", {
																			className:
																				"dms-stat-value text-xl",
																			children:
																				null !=
																				L.efficiency_rating
																					? `${Math.round(
																							L.efficiency_rating
																					  )}%`
																					: "—",
																		}),
																		(0, t.jsx)("p", {
																			className:
																				"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																			children: "Efficiency",
																		}),
																	],
																}),
															],
														}),
													}),
												}),
												(0, t.jsx)(m.Zp, {
													className: "dms-kpi-card",
													children: (0, t.jsx)(m.Wu, {
														className: "px-3.5 py-3",
														children: (0, t.jsxs)("div", {
															className: "flex items-center gap-3",
															children: [
																(0, t.jsx)("div", {
																	className:
																		"rounded-full bg-green-100 p-1.5 dark:bg-green-900/30",
																	children: (0, t.jsx)(S.A, {
																		className:
																			"h-3.5 w-3.5 text-green-600 dark:text-green-400",
																	}),
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsx)("p", {
																			className:
																				"dms-stat-value text-xl",
																			children:
																				null !=
																				L.productivity_score
																					? L.productivity_score.toFixed(
																							1
																					  )
																					: "—",
																		}),
																		(0, t.jsx)("p", {
																			className:
																				"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																			children:
																				"Productivity",
																		}),
																	],
																}),
															],
														}),
													}),
												}),
												(0, t.jsx)(m.Zp, {
													className: "dms-kpi-card",
													children: (0, t.jsx)(m.Wu, {
														className: "px-3.5 py-3",
														children: (0, t.jsxs)("div", {
															className: "flex items-center gap-3",
															children: [
																(0, t.jsx)("div", {
																	className:
																		"rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30",
																	children: (0, t.jsx)(C.A, {
																		className:
																			"h-3.5 w-3.5 text-amber-600 dark:text-amber-400",
																	}),
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsx)("p", {
																			className:
																				"dms-stat-value text-xl",
																			children:
																				null !=
																				L.first_time_fix_rate
																					? `${Math.round(
																							L.first_time_fix_rate
																					  )}%`
																					: "—",
																		}),
																		(0, t.jsx)("p", {
																			className:
																				"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																			children:
																				"First-Time Fix",
																		}),
																	],
																}),
															],
														}),
													}),
												}),
												(0, t.jsx)(m.Zp, {
													className: "dms-kpi-card",
													children: (0, t.jsx)(m.Wu, {
														className: "px-3.5 py-3",
														children: (0, t.jsxs)("div", {
															className: "flex items-center gap-3",
															children: [
																(0, t.jsx)("div", {
																	className:
																		"rounded-full bg-purple-100 p-1.5 dark:bg-purple-900/30",
																	children: (0, t.jsx)(M.A, {
																		className:
																			"h-3.5 w-3.5 text-purple-600 dark:text-purple-400",
																	}),
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsx)("p", {
																			className:
																				"dms-stat-value text-xl",
																			children:
																				null !=
																				L.customer_satisfaction_score
																					? L.customer_satisfaction_score.toFixed(
																							1
																					  )
																					: "—",
																		}),
																		(0, t.jsx)("p", {
																			className:
																				"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																			children:
																				"Satisfaction (out of 5)",
																		}),
																	],
																}),
															],
														}),
													}),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "grid gap-4 md:grid-cols-2",
											children: [
												(0, t.jsxs)(m.Zp, {
													children: [
														(0, t.jsx)(m.aR, {
															className: "pb-3",
															children: (0, t.jsx)(m.ZB, {
																className: "text-base",
																children: "Hours Summary",
															}),
														}),
														(0, t.jsxs)(m.Wu, {
															className: "space-y-4",
															children: [
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsxs)("div", {
																			className:
																				"flex justify-between text-sm mb-1",
																			children: [
																				(0, t.jsx)(
																					"span",
																					{
																						children:
																							"Labor Hours",
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium",
																						children: [
																							L.total_labor_hours?.toFixed(
																								1
																							) || 0,
																							"h",
																						],
																					}
																				),
																			],
																		}),
																		(0, t.jsx)(h.k, {
																			value: Math.min(
																				((L.total_labor_hours ||
																					0) /
																					Math.max(
																						L.total_sold_hours ||
																							1,
																						1
																					)) *
																					100,
																				100
																			),
																			className: "h-2",
																		}),
																	],
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsxs)("div", {
																			className:
																				"flex justify-between text-sm mb-1",
																			children: [
																				(0, t.jsx)(
																					"span",
																					{
																						children:
																							"Sold Hours",
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium",
																						children: [
																							L.total_sold_hours?.toFixed(
																								1
																							) || 0,
																							"h",
																						],
																					}
																				),
																			],
																		}),
																		(0, t.jsx)(h.k, {
																			value: 100,
																			className: "h-2",
																		}),
																	],
																}),
																(0, t.jsxs)("div", {
																	children: [
																		(0, t.jsxs)("div", {
																			className:
																				"flex justify-between text-sm mb-1",
																			children: [
																				(0, t.jsx)(
																					"span",
																					{
																						children:
																							"Idle Hours",
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium",
																						children: [
																							L.total_idle_hours?.toFixed(
																								1
																							) || 0,
																							"h",
																						],
																					}
																				),
																			],
																		}),
																		(0, t.jsx)(h.k, {
																			value: Math.min(
																				((L.total_idle_hours ||
																					0) /
																					Math.max(
																						(L.total_labor_hours ||
																							0) +
																							(L.total_idle_hours ||
																								0),
																						1
																					)) *
																					100,
																				100
																			),
																			className: "h-2",
																		}),
																	],
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)(m.Zp, {
													children: [
														(0, t.jsx)(m.aR, {
															className: "pb-3",
															children: (0, t.jsx)(m.ZB, {
																className: "text-base",
																children: "Work Summary",
															}),
														}),
														(0, t.jsx)(m.Wu, {
															children: (0, t.jsxs)("div", {
																className:
																	"grid grid-cols-2 gap-4",
																children: [
																	(0, t.jsxs)("div", {
																		className:
																			"rounded-lg border p-4 text-center",
																		children: [
																			(0, t.jsx)("p", {
																				className:
																					"text-3xl font-bold",
																				children:
																					L.total_jobs_completed ||
																					0,
																			}),
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground mt-1",
																				children:
																					"Total Jobs",
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"rounded-lg border p-4 text-center",
																		children: [
																			(0, t.jsx)("p", {
																				className:
																					"text-3xl font-bold",
																				children:
																					L.today_scheduled_jobs ||
																					0,
																			}),
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground mt-1",
																				children:
																					"Today's Jobs",
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"rounded-lg border p-4 text-center",
																		children: [
																			(0, t.jsx)("p", {
																				className:
																					"text-3xl font-bold",
																				children:
																					L.experience_at_suweys ||
																					0,
																			}),
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground mt-1",
																				children:
																					"Years at Company",
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"rounded-lg border p-4 text-center",
																		children: [
																			(0, t.jsx)("p", {
																				className:
																					"text-3xl font-bold",
																				children:
																					L.years_of_experience ||
																					0,
																			}),
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground mt-1",
																				children:
																					"Years Experience",
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
									],
								}),
								(0, t.jsxs)(p.av, {
									value: "skills",
									className: "space-y-4",
									children: [
										(0, t.jsxs)(m.Zp, {
											children: [
												(0, t.jsx)(m.aR, {
													className: "pb-3",
													children: (0, t.jsxs)(m.ZB, {
														className:
															"text-base flex items-center gap-2",
														children: [
															(0, t.jsx)(P.A, {
																className: "h-4 w-4",
															}),
															" Specializations",
														],
													}),
												}),
												(0, t.jsx)(m.Wu, {
													children:
														L.specialization &&
														L.specialization.length > 0
															? (0, t.jsx)("div", {
																	className:
																		"grid gap-3 md:grid-cols-2",
																	children: L.specialization.map(
																		(e, s) =>
																			(0, t.jsxs)(
																				"div",
																				{
																					className:
																						"rounded-lg border p-3",
																					children: [
																						(0,
																						t.jsxs)(
																							"div",
																							{
																								className:
																									"flex items-center justify-between",
																								children:
																									[
																										(0,
																										t.jsx)(
																											"p",
																											{
																												className:
																													"font-medium text-sm",
																												children:
																													e.specialization,
																											}
																										),
																										e.proficiency_level &&
																											(0,
																											t.jsx)(
																												o.E,
																												{
																													variant:
																														"outline",
																													className:
																														"text-[10px]",
																													children:
																														e.proficiency_level,
																												}
																											),
																									],
																							}
																						),
																						(0,
																						t.jsxs)(
																							"div",
																							{
																								className:
																									"mt-1 flex gap-3 text-xs text-muted-foreground",
																								children:
																									[
																										null !=
																											e.years_experience_in_area &&
																											(0,
																											t.jsxs)(
																												"span",
																												{
																													children:
																														[
																															e.years_experience_in_area,
																															" yrs",
																														],
																												}
																											),
																										e.certification_held &&
																											(0,
																											t.jsxs)(
																												"span",
																												{
																													className:
																														"flex items-center gap-1",
																													children:
																														[
																															(0,
																															t.jsx)(
																																Z,
																																{
																																	className:
																																		"h-3 w-3",
																																}
																															),
																															e.certification_held,
																														],
																												}
																											),
																									],
																							}
																						),
																					],
																				},
																				e.name || s
																			)
																	),
															  })
															: (0, t.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground text-center py-4",
																	children:
																		"No specializations recorded",
															  }),
												}),
											],
										}),
										(0, t.jsxs)(m.Zp, {
											children: [
												(0, t.jsx)(m.aR, {
													className: "pb-3",
													children: (0, t.jsxs)(m.ZB, {
														className:
															"text-base flex items-center gap-2",
														children: [
															(0, t.jsx)(Z, {
																className: "h-4 w-4",
															}),
															" Certifications",
														],
													}),
												}),
												(0, t.jsx)(m.Wu, {
													children:
														L.certifications &&
														L.certifications.length > 0
															? (0, t.jsx)("div", {
																	className: "space-y-3",
																	children: L.certifications.map(
																		(e, s) => {
																			let a =
																					e.expiry_date &&
																					new Date(
																						e.expiry_date
																					).getTime() -
																						Date.now() <
																						2592e6,
																				r =
																					e.expiry_date &&
																					new Date(
																						e.expiry_date
																					) < new Date();
																			return (0, t.jsxs)(
																				"div",
																				{
																					className: `rounded-lg border p-3 ${
																						r
																							? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
																							: a
																							? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
																							: ""
																					}`,
																					children: [
																						(0,
																						t.jsxs)(
																							"div",
																							{
																								className:
																									"flex items-start justify-between",
																								children:
																									[
																										(0,
																										t.jsxs)(
																											"div",
																											{
																												children:
																													[
																														(0,
																														t.jsx)(
																															"p",
																															{
																																className:
																																	"font-medium text-sm",
																																children:
																																	e.certification_name,
																															}
																														),
																														e.issuing_authority &&
																															(0,
																															t.jsx)(
																																"p",
																																{
																																	className:
																																		"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																																	children:
																																		e.issuing_authority,
																																}
																															),
																													],
																											}
																										),
																										(0,
																										t.jsxs)(
																											"div",
																											{
																												className:
																													"flex items-center gap-2",
																												children:
																													[
																														e.is_active
																															? (0,
																															  t.jsx)(
																																	o.E,
																																	{
																																		variant:
																																			"outline",
																																		className:
																																			"bg-green-100 text-green-700 border-green-200 text-[10px]",
																																		children:
																																			"Active",
																																	}
																															  )
																															: (0,
																															  t.jsx)(
																																	o.E,
																																	{
																																		variant:
																																			"outline",
																																		className:
																																			"text-[10px]",
																																		children:
																																			"Inactive",
																																	}
																															  ),
																														r &&
																															(0,
																															t.jsx)(
																																o.E,
																																{
																																	variant:
																																		"destructive",
																																	className:
																																		"text-[10px]",
																																	children:
																																		"Expired",
																																}
																															),
																														a &&
																															!r &&
																															(0,
																															t.jsxs)(
																																o.E,
																																{
																																	variant:
																																		"outline",
																																	className:
																																		"bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1",
																																	children:
																																		[
																																			(0,
																																			t.jsx)(
																																				z.A,
																																				{
																																					className:
																																						"h-3 w-3",
																																				}
																																			),
																																			"Expiring Soon",
																																		],
																																}
																															),
																													],
																											}
																										),
																									],
																							}
																						),
																						(0,
																						t.jsxs)(
																							"div",
																							{
																								className:
																									"mt-2 flex gap-4 text-xs text-muted-foreground",
																								children:
																									[
																										e.certification_date &&
																											(0,
																											t.jsxs)(
																												"span",
																												{
																													children:
																														[
																															"Issued: ",
																															e.certification_date,
																														],
																												}
																											),
																										e.expiry_date &&
																											(0,
																											t.jsxs)(
																												"span",
																												{
																													children:
																														[
																															"Expires: ",
																															e.expiry_date,
																														],
																												}
																											),
																										e.certificate_number &&
																											(0,
																											t.jsxs)(
																												"span",
																												{
																													children:
																														[
																															"#",
																															e.certificate_number,
																														],
																												}
																											),
																									],
																							}
																						),
																					],
																				},
																				e.name || s
																			);
																		}
																	),
															  })
															: (0, t.jsx)("p", {
																	className:
																		"text-sm text-muted-foreground text-center py-4",
																	children:
																		"No certifications recorded",
															  }),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, t.jsx)(c.H, {
							open: O,
							onOpenChange: H,
							technician: L,
							onUpdated: () => {
								q();
							},
						}),
					],
				});
			}
		},
	},
]);
