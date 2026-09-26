"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8651],
	{
		12651: (e, a, r) => {
			r.d(a, { A: () => t });
			let t = (0, r(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, a, r) => {
			r.d(a, { A: () => t });
			let t = (0, r(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		18651: (e, a, r) => {
			r.r(a), r.d(a, { default: () => g });
			var t = r(95155),
				s = r(12115),
				i = r(44855),
				n = r(32144),
				l = r(38291),
				o = r(4474),
				d = r(79984),
				c = r(39658),
				u = r(39540),
				p = r(23511),
				m = r(10086),
				v = r(93108),
				x = r(6296);
			function g() {
				let { data: e } = (0, i.Ay)("crm-approval-form-options", n.M$),
					[a, r] = (0, s.useState)("Pending"),
					{
						data: g,
						isLoading: h,
						mutate: b,
					} = (0, i.Ay)(["crm-approvals", a], () => (0, n.P8)({ status: a, limit: 50 })),
					{ error: y, success: f, showError: j, showSuccess: N, clear: w } = (0, v.B)(),
					[k, A] = (0, s.useState)(!1),
					[S, C] = (0, s.useState)({
						title: "",
						approval_type: "Sales Discount / Commercial Support",
						reason: "",
						amount: "",
					}),
					_ = async () => {
						if ((w(), !S.title.trim() || !S.reason.trim()))
							return void j("Title and reason are required.");
						A(!0);
						try {
							await (0, n.AO)({
								title: S.title.trim(),
								approval_type: S.approval_type,
								reason: S.reason.trim(),
								amount: S.amount ? Number(S.amount) : null,
							}),
								C({
									title: "",
									approval_type: S.approval_type,
									reason: "",
									amount: "",
								}),
								await b(),
								N("Approval request submitted.");
						} catch (e) {
							j(e, "Failed to create approval");
						} finally {
							A(!1);
						}
					},
					q = async (e, a) => {
						w();
						try {
							await (0, n.gC)(e, a), await b(), N(`Request ${a.toLowerCase()}.`);
						} catch (e) {
							j(e, "Decision failed");
						}
					};
				return (0, t.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, t.jsx)(v.y, { error: y, success: f, onDismiss: w }),
						(0, t.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [
								(0, t.jsxs)("p", {
									className: "text-sm text-muted-foreground",
									children: [
										"Pending: ",
										(0, t.jsx)("span", {
											className: "font-medium text-foreground",
											children: Number(g?.pending || 0),
										}),
									],
								}),
								(0, t.jsxs)("select", {
									className:
										"h-9 rounded-md border border-input bg-background px-3 text-sm",
									value: a,
									onChange: (e) => r(e.target.value),
									children: [
										(0, t.jsx)("option", { value: "all", children: "All" }),
										(0, t.jsx)("option", {
											value: "Pending",
											children: "Pending",
										}),
										(0, t.jsx)("option", {
											value: "Approved",
											children: "Approved",
										}),
										(0, t.jsx)("option", {
											value: "Rejected",
											children: "Rejected",
										}),
									],
								}),
							],
						}),
						(0, t.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, t.jsx)(d.aR, {
									children: (0, t.jsx)(d.ZB, {
										className: "text-base",
										children: "New approval request (\xa715.3)",
									}),
								}),
								(0, t.jsxs)(d.Wu, {
									className: "grid gap-3 sm:grid-cols-2",
									children: [
										(0, t.jsx)("div", {
											className: "sm:col-span-2 space-y-2",
											children: (0, t.jsx)(c.p, {
												placeholder: "Title",
												value: S.title,
												onChange: (e) =>
													C((a) => ({ ...a, title: e.target.value })),
											}),
										}),
										(0, t.jsx)(m.Zi, {
											options: (e?.approval_types || [])
												.filter(Boolean)
												.map((e) => ({ value: e, label: e })),
											value: S.approval_type,
											onValueChange: (e) =>
												C((a) => ({
													...a,
													approval_type: e || a.approval_type,
												})),
										}),
										(0, t.jsx)(c.p, {
											type: "number",
											placeholder: "Amount (optional)",
											value: S.amount,
											onChange: (e) =>
												C((a) => ({ ...a, amount: e.target.value })),
										}),
										(0, t.jsx)("div", {
											className: "sm:col-span-2 space-y-2",
											children: (0, t.jsx)(u.T, {
												rows: 2,
												placeholder: "Reason *",
												value: S.reason,
												onChange: (e) =>
													C((a) => ({ ...a, reason: e.target.value })),
											}),
										}),
										(0, t.jsxs)(o.$, {
											onClick: () => void _(),
											disabled: k,
											children: [
												k
													? (0, t.jsx)(x.A, {
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
						(0, t.jsx)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: (0, t.jsx)(d.Wu, {
								className: "pt-4",
								children: h
									? (0, t.jsx)(p.E, { className: "h-24" })
									: (0, t.jsx)("div", {
											className: "space-y-3",
											children:
												0 === (g?.data || []).length
													? (0, t.jsx)("p", {
															className:
																"py-8 text-center text-muted-foreground",
															children: "No approval requests.",
													  })
													: (g?.data || []).map((e) =>
															(0, t.jsxs)(
																"div",
																{
																	className:
																		"rounded-md border border-border/70 p-3",
																	children: [
																		(0, t.jsxs)("div", {
																			className:
																				"flex flex-wrap items-start justify-between gap-2",
																			children: [
																				(0, t.jsxs)(
																					"div",
																					{
																						children: [
																							(0,
																							t.jsx)(
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
																							t.jsxs)(
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
																				(0, t.jsx)(l.E, {
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
																		g?.can_approve
																			? (0, t.jsxs)("div", {
																					className:
																						"mt-2 flex gap-2",
																					children: [
																						(0, t.jsx)(
																							o.$,
																							{
																								size: "sm",
																								onClick:
																									() =>
																										void q(
																											String(
																												e.name
																											),
																											"Approved"
																										),
																								children:
																									"Approve",
																							}
																						),
																						(0, t.jsx)(
																							o.$,
																							{
																								size: "sm",
																								variant:
																									"outline",
																								onClick:
																									() =>
																										void q(
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
		23511: (e, a, r) => {
			r.d(a, { E: () => i });
			var t = r(95155),
				s = r(91337);
			function i({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, s.cn)("bg-accent animate-pulse rounded-md", e),
					...a,
				});
			}
		},
		38291: (e, a, r) => {
			r.d(a, { E: () => o });
			var t = r(95155);
			r(12115);
			var s = r(42442),
				i = r(18460),
				n = r(91337);
			let l = (0, i.F)(
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
			function o({ className: e, variant: a, asChild: r = !1, ...i }) {
				let d = r ? s.DX : "span";
				return (0, t.jsx)(d, {
					"data-slot": "badge",
					className: (0, n.cn)(l({ variant: a }), e),
					...i,
				});
			}
		},
		39540: (e, a, r) => {
			r.d(a, { T: () => i });
			var t = r(95155);
			r(12115);
			var s = r(91337);
			function i({ className: e, ...a }) {
				return (0, t.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, s.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...a,
				});
			}
		},
		93108: (e, a, r) => {
			r.d(a, { B: () => c, y: () => u });
			var t = r(95155),
				s = r(12115),
				i = r(66609),
				n = r(13545),
				l = r(12651),
				o = r(33210),
				d = r(91337);
			function c() {
				let [e, a] = (0, s.useState)(""),
					[r, t] = (0, s.useState)(""),
					n = (0, s.useCallback)((e, r = "Something went wrong.") => {
						let s =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || r;
						return (
							t(""),
							a(s),
							i.o.error(s, { duration: 8e3 }),
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
					showError: n,
					showSuccess: (0, s.useCallback)((e) => {
						a(""), t(e), i.o.success(e);
					}, []),
					clear: (0, s.useCallback)(() => {
						a(""), t("");
					}, []),
				};
			}
			function u({ error: e, success: a, onDismiss: r, className: s }) {
				if (!e && !a) return null;
				let i = !!e;
				return (0, t.jsx)("div", {
					className: (0, d.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", s),
					children: (0, t.jsxs)("div", {
						role: i ? "alert" : "status",
						"aria-live": i ? "assertive" : "polite",
						className: (0, d.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							i
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							i
								? (0, t.jsx)(n.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, t.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, t.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || a,
							}),
							r
								? (0, t.jsx)("button", {
										type: "button",
										onClick: r,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, t.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
