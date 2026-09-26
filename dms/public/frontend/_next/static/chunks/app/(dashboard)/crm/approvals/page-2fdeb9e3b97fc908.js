(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1198, 8651],
	{
		6296: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("loader-circle", [
				["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }],
			]);
		},
		12651: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		18460: (e, t, r) => {
			"use strict";
			r.d(t, { F: () => l });
			var a = r(29722);
			let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
				n = a.$,
				l = (e, t) => (r) => {
					var a;
					if ((null == t ? void 0 : t.variants) == null)
						return n(
							e,
							null == r ? void 0 : r.class,
							null == r ? void 0 : r.className
						);
					let { variants: l, defaultVariants: i } = t,
						o = Object.keys(l).map((e) => {
							let t = null == r ? void 0 : r[e],
								a = null == i ? void 0 : i[e];
							if (null === t) return null;
							let n = s(t) || s(a);
							return l[e][n];
						}),
						d =
							r &&
							Object.entries(r).reduce((e, t) => {
								let [r, a] = t;
								return void 0 === a || (e[r] = a), e;
							}, {});
					return n(
						e,
						o,
						null == t || null == (a = t.compoundVariants)
							? void 0
							: a.reduce((e, t) => {
									let { class: r, className: a, ...s } = t;
									return Object.entries(s).every((e) => {
										let [t, r] = e;
										return Array.isArray(r)
											? r.includes({ ...i, ...d }[t])
											: { ...i, ...d }[t] === r;
									})
										? [...e, r, a]
										: e;
							  }, []),
						null == r ? void 0 : r.class,
						null == r ? void 0 : r.className
					);
				};
		},
		18651: (e, t, r) => {
			"use strict";
			r.r(t), r.d(t, { default: () => h });
			var a = r(95155),
				s = r(12115),
				n = r(44855),
				l = r(32144),
				i = r(38291),
				o = r(4474),
				d = r(79984),
				c = r(39658),
				u = r(39540),
				p = r(23511),
				m = r(10086),
				v = r(93108),
				f = r(6296);
			function h() {
				let { data: e } = (0, n.Ay)("crm-approval-form-options", l.M$),
					[t, r] = (0, s.useState)("Pending"),
					{
						data: h,
						isLoading: x,
						mutate: g,
					} = (0, n.Ay)(["crm-approvals", t], () => (0, l.P8)({ status: t, limit: 50 })),
					{ error: y, success: b, showError: j, showSuccess: w, clear: k } = (0, v.B)(),
					[N, A] = (0, s.useState)(!1),
					[C, _] = (0, s.useState)({
						title: "",
						approval_type: "Sales Discount / Commercial Support",
						reason: "",
						amount: "",
					}),
					S = async () => {
						if ((k(), !C.title.trim() || !C.reason.trim()))
							return void j("Title and reason are required.");
						A(!0);
						try {
							await (0, l.AO)({
								title: C.title.trim(),
								approval_type: C.approval_type,
								reason: C.reason.trim(),
								amount: C.amount ? Number(C.amount) : null,
							}),
								_({
									title: "",
									approval_type: C.approval_type,
									reason: "",
									amount: "",
								}),
								await g(),
								w("Approval request submitted.");
						} catch (e) {
							j(e, "Failed to create approval");
						} finally {
							A(!1);
						}
					},
					E = async (e, t) => {
						k();
						try {
							await (0, l.gC)(e, t), await g(), w(`Request ${t.toLowerCase()}.`);
						} catch (e) {
							j(e, "Decision failed");
						}
					};
				return (0, a.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, a.jsx)(v.y, { error: y, success: b, onDismiss: k }),
						(0, a.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [
								(0, a.jsxs)("p", {
									className: "text-sm text-muted-foreground",
									children: [
										"Pending: ",
										(0, a.jsx)("span", {
											className: "font-medium text-foreground",
											children: Number(h?.pending || 0),
										}),
									],
								}),
								(0, a.jsxs)("select", {
									className:
										"h-9 rounded-md border border-input bg-background px-3 text-sm",
									value: t,
									onChange: (e) => r(e.target.value),
									children: [
										(0, a.jsx)("option", { value: "all", children: "All" }),
										(0, a.jsx)("option", {
											value: "Pending",
											children: "Pending",
										}),
										(0, a.jsx)("option", {
											value: "Approved",
											children: "Approved",
										}),
										(0, a.jsx)("option", {
											value: "Rejected",
											children: "Rejected",
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(d.aR, {
									children: (0, a.jsx)(d.ZB, {
										className: "text-base",
										children: "New approval request (\xa715.3)",
									}),
								}),
								(0, a.jsxs)(d.Wu, {
									className: "grid gap-3 sm:grid-cols-2",
									children: [
										(0, a.jsx)("div", {
											className: "sm:col-span-2 space-y-2",
											children: (0, a.jsx)(c.p, {
												placeholder: "Title",
												value: C.title,
												onChange: (e) =>
													_((t) => ({ ...t, title: e.target.value })),
											}),
										}),
										(0, a.jsx)(m.Zi, {
											options: (e?.approval_types || [])
												.filter(Boolean)
												.map((e) => ({ value: e, label: e })),
											value: C.approval_type,
											onValueChange: (e) =>
												_((t) => ({
													...t,
													approval_type: e || t.approval_type,
												})),
										}),
										(0, a.jsx)(c.p, {
											type: "number",
											placeholder: "Amount (optional)",
											value: C.amount,
											onChange: (e) =>
												_((t) => ({ ...t, amount: e.target.value })),
										}),
										(0, a.jsx)("div", {
											className: "sm:col-span-2 space-y-2",
											children: (0, a.jsx)(u.T, {
												rows: 2,
												placeholder: "Reason *",
												value: C.reason,
												onChange: (e) =>
													_((t) => ({ ...t, reason: e.target.value })),
											}),
										}),
										(0, a.jsxs)(o.$, {
											onClick: () => void S(),
											disabled: N,
											children: [
												N
													? (0, a.jsx)(f.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Submit request",
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: (0, a.jsx)(d.Wu, {
								className: "pt-4",
								children: x
									? (0, a.jsx)(p.E, { className: "h-24" })
									: (0, a.jsx)("div", {
											className: "space-y-3",
											children:
												0 === (h?.data || []).length
													? (0, a.jsx)("p", {
															className:
																"py-8 text-center text-muted-foreground",
															children: "No approval requests.",
													  })
													: (h?.data || []).map((e) =>
															(0, a.jsxs)(
																"div",
																{
																	className:
																		"rounded-md border border-border/70 p-3",
																	children: [
																		(0, a.jsxs)("div", {
																			className:
																				"flex flex-wrap items-start justify-between gap-2",
																			children: [
																				(0, a.jsxs)(
																					"div",
																					{
																						children: [
																							(0,
																							a.jsx)(
																								"p",
																								{
																									className:
																										"font-medium",
																									children:
																										String(
																											e.title
																										),
																								}
																							),
																							(0,
																							a.jsxs)(
																								"p",
																								{
																									className:
																										"text-xs text-muted-foreground",
																									children:
																										[
																											String(
																												e.approval_type
																											),
																											" \xb7 ",
																											String(
																												e.requester_name ||
																													""
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, a.jsx)(i.E, {
																					variant:
																						"secondary",
																					children:
																						String(
																							e.status
																						),
																				}),
																			],
																		}),
																		"Pending" === e.status &&
																		h?.can_approve
																			? (0, a.jsxs)("div", {
																					className:
																						"mt-2 flex gap-2",
																					children: [
																						(0, a.jsx)(
																							o.$,
																							{
																								size: "sm",
																								onClick:
																									() =>
																										void E(
																											String(
																												e.name
																											),
																											"Approved"
																										),
																								children:
																									"Approve",
																							}
																						),
																						(0, a.jsx)(
																							o.$,
																							{
																								size: "sm",
																								variant:
																									"outline",
																								onClick:
																									() =>
																										void E(
																											String(
																												e.name
																											),
																											"Rejected"
																										),
																								children:
																									"Reject",
																							}
																						),
																					],
																			  })
																			: null,
																	],
																},
																String(e.name)
															)
													  ),
									  }),
							}),
						}),
					],
				});
			}
		},
		23511: (e, t, r) => {
			"use strict";
			r.d(t, { E: () => n });
			var a = r(95155),
				s = r(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, s.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		33210: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		38291: (e, t, r) => {
			"use strict";
			r.d(t, { E: () => o });
			var a = r(95155);
			r(12115);
			var s = r(42442),
				n = r(18460),
				l = r(91337);
			let i = (0, n.F)(
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
			function o({ className: e, variant: t, asChild: r = !1, ...n }) {
				let d = r ? s.DX : "span";
				return (0, a.jsx)(d, {
					"data-slot": "badge",
					className: (0, l.cn)(i({ variant: t }), e),
					...n,
				});
			}
		},
		39540: (e, t, r) => {
			"use strict";
			r.d(t, { T: () => n });
			var a = r(95155);
			r(12115);
			var s = r(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, s.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		42442: (e, t, r) => {
			"use strict";
			r.d(t, { DX: () => u, TL: () => c });
			var a,
				s = r(12115),
				n = r(47527),
				l = r(95155),
				i = Symbol.for("react.lazy"),
				o = (a || (a = r.t(s, 2)))[" use ".trim().toString()];
			function d(e) {
				var t;
				return (
					null != e &&
					"object" == typeof e &&
					"$$typeof" in e &&
					e.$$typeof === i &&
					"_payload" in e &&
					"object" == typeof (t = e._payload) &&
					null !== t &&
					"then" in t
				);
			}
			function c(e) {
				var t;
				let r,
					a =
						((t = e),
						((r = s.forwardRef((e, t) => {
							let { children: r, ...a } = e;
							if (
								(d(r) && "function" == typeof o && (r = o(r._payload)),
								s.isValidElement(r))
							) {
								var l;
								let e,
									i,
									o =
										((l = r),
										(i =
											(e = Object.getOwnPropertyDescriptor(
												l.props,
												"ref"
											)?.get) &&
											"isReactWarning" in e &&
											e.isReactWarning)
											? l.ref
											: (i =
													(e = Object.getOwnPropertyDescriptor(
														l,
														"ref"
													)?.get) &&
													"isReactWarning" in e &&
													e.isReactWarning)
											? l.props.ref
											: l.props.ref || l.ref),
									d = (function (e, t) {
										let r = { ...t };
										for (let a in t) {
											let s = e[a],
												n = t[a];
											/^on[A-Z]/.test(a)
												? s && n
													? (r[a] = (...e) => {
															let t = n(...e);
															return s(...e), t;
													  })
													: s && (r[a] = s)
												: "style" === a
												? (r[a] = { ...s, ...n })
												: "className" === a &&
												  (r[a] = [s, n].filter(Boolean).join(" "));
										}
										return { ...e, ...r };
									})(a, r.props);
								return (
									r.type !== s.Fragment && (d.ref = t ? (0, n.t)(t, o) : o),
									s.cloneElement(r, d)
								);
							}
							return s.Children.count(r) > 1 ? s.Children.only(null) : null;
						})).displayName = `${t}.SlotClone`),
						r),
					i = s.forwardRef((e, t) => {
						let { children: r, ...n } = e;
						d(r) && "function" == typeof o && (r = o(r._payload));
						let i = s.Children.toArray(r),
							c = i.find(m);
						if (c) {
							let e = c.props.children,
								r = i.map((t) =>
									t !== c
										? t
										: s.Children.count(e) > 1
										? s.Children.only(null)
										: s.isValidElement(e)
										? e.props.children
										: null
								);
							return (0, l.jsx)(a, {
								...n,
								ref: t,
								children: s.isValidElement(e)
									? s.cloneElement(e, void 0, r)
									: null,
							});
						}
						return (0, l.jsx)(a, { ...n, ref: t, children: r });
					});
				return (i.displayName = `${e}.Slot`), i;
			}
			var u = c("Slot"),
				p = Symbol("radix.slottable");
			function m(e) {
				return (
					s.isValidElement(e) &&
					"function" == typeof e.type &&
					"__radixId" in e.type &&
					e.type.__radixId === p
				);
			}
		},
		47527: (e, t, r) => {
			"use strict";
			r.d(t, { s: () => l, t: () => n });
			var a = r(12115);
			function s(e, t) {
				if ("function" == typeof e) return e(t);
				null != e && (e.current = t);
			}
			function n(...e) {
				return (t) => {
					let r = !1,
						a = e.map((e) => {
							let a = s(e, t);
							return r || "function" != typeof a || (r = !0), a;
						});
					if (r)
						return () => {
							for (let t = 0; t < a.length; t++) {
								let r = a[t];
								"function" == typeof r ? r() : s(e[t], null);
							}
						};
				};
			}
			function l(...e) {
				return a.useCallback(n(...e), e);
			}
		},
		49968: (e, t, r) => {
			Promise.resolve().then(r.bind(r, 18651));
		},
		51914: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		56563: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		90425: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => o });
			var a = r(12115);
			let s = (...e) =>
					e
						.filter((e, t, r) => !!e && "" !== e.trim() && r.indexOf(e) === t)
						.join(" ")
						.trim(),
				n = (e) => {
					let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
						r ? r.toUpperCase() : t.toLowerCase()
					);
					return t.charAt(0).toUpperCase() + t.slice(1);
				};
			var l = {
				xmlns: "http://www.w3.org/2000/svg",
				width: 24,
				height: 24,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 2,
				strokeLinecap: "round",
				strokeLinejoin: "round",
			};
			let i = (0, a.forwardRef)(
					(
						{
							color: e = "currentColor",
							size: t = 24,
							strokeWidth: r = 2,
							absoluteStrokeWidth: n,
							className: i = "",
							children: o,
							iconNode: d,
							...c
						},
						u
					) =>
						(0, a.createElement)(
							"svg",
							{
								ref: u,
								...l,
								width: t,
								height: t,
								stroke: e,
								strokeWidth: n ? (24 * Number(r)) / Number(t) : r,
								className: s("lucide", i),
								...(!o &&
									!((e) => {
										for (let t in e)
											if (
												t.startsWith("aria-") ||
												"role" === t ||
												"title" === t
											)
												return !0;
										return !1;
									})(c) && { "aria-hidden": "true" }),
								...c,
							},
							[
								...d.map(([e, t]) => (0, a.createElement)(e, t)),
								...(Array.isArray(o) ? o : [o]),
							]
						)
				),
				o = (e, t) => {
					let r = (0, a.forwardRef)(({ className: r, ...l }, o) =>
						(0, a.createElement)(i, {
							ref: o,
							iconNode: t,
							className: s(
								`lucide-${n(e)
									.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
									.toLowerCase()}`,
								`lucide-${e}`,
								r
							),
							...l,
						})
					);
					return (r.displayName = n(e)), r;
				};
		},
		93108: (e, t, r) => {
			"use strict";
			r.d(t, { B: () => c, y: () => u });
			var a = r(95155),
				s = r(12115),
				n = r(66609),
				l = r(13545),
				i = r(12651),
				o = r(33210),
				d = r(91337);
			function c() {
				let [e, t] = (0, s.useState)(""),
					[r, a] = (0, s.useState)(""),
					l = (0, s.useCallback)((e, r = "Something went wrong.") => {
						let s =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || r;
						return (
							a(""),
							t(s),
							n.o.error(s, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							s
						);
					}, []);
				return {
					error: e,
					success: r,
					showError: l,
					showSuccess: (0, s.useCallback)((e) => {
						t(""), a(e), n.o.success(e);
					}, []),
					clear: (0, s.useCallback)(() => {
						t(""), a("");
					}, []),
				};
			}
			function u({ error: e, success: t, onDismiss: r, className: s }) {
				if (!e && !t) return null;
				let n = !!e;
				return (0, a.jsx)("div", {
					className: (0, d.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", s),
					children: (0, a.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, d.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, a.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, a.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || t,
							}),
							r
								? (0, a.jsx)("button", {
										type: "button",
										onClick: r,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, a.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
		94514: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
	(e) => {
		e.O(0, [8409, 4855, 6609, 8103, 2372, 8441, 3794, 7358], () => e((e.s = 49968))),
			(_N_E = e.O());
	},
]);
