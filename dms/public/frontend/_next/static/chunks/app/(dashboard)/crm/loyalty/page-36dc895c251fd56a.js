(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4084, 6943],
	{
		11338: (e, t, a) => {
			Promise.resolve().then(a.bind(a, 48269));
		},
		12651: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		23511: (e, t, a) => {
			"use strict";
			a.d(t, { E: () => n });
			var s = a(95155),
				r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		33210: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		38291: (e, t, a) => {
			"use strict";
			a.d(t, { E: () => o });
			var s = a(95155);
			a(12115);
			var r = a(42442),
				n = a(18460),
				i = a(91337);
			let l = (0, n.F)(
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
			function o({ className: e, variant: t, asChild: a = !1, ...n }) {
				let d = a ? r.DX : "span";
				return (0, s.jsx)(d, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: t }), e),
					...n,
				});
			}
		},
		39540: (e, t, a) => {
			"use strict";
			a.d(t, { T: () => n });
			var s = a(95155);
			a(12115);
			var r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		48269: (e, t, a) => {
			"use strict";
			a.r(t), a.d(t, { default: () => f });
			var s = a(95155),
				r = a(12115),
				n = a(44855),
				i = a(32144),
				l = a(38291),
				o = a(4474),
				d = a(79984),
				c = a(39658),
				u = a(39540),
				m = a(23511),
				p = a(44462),
				x = a(93108),
				g = a(6296);
			function f() {
				let { data: e, mutate: t } = (0, n.Ay)("crm-loyalty-settings", i.Cv),
					{ data: a, mutate: f } = (0, n.Ay)("crm-loyalty-setup", i.ST),
					{ data: y, mutate: v } = (0, n.Ay)("crm-loyalty-adjustments", () =>
						(0, i.J0)({ status: "Pending", limit: 30 })
					),
					{ error: h, success: b, showError: j, showSuccess: w, clear: N } = (0, x.B)(),
					[_, k] = (0, r.useState)(!1),
					[S, A] = (0, r.useState)(null),
					[C, E] = (0, r.useState)(""),
					[$, P] = (0, r.useState)({
						customer: "",
						points: "100",
						adjustment_type: "Credit",
						reason: "",
					}),
					z = async () => {
						await Promise.all([t(), f(), v()]);
					},
					R = async () => {
						N(), A("setup");
						try {
							let e = await (0, i.nL)();
							await z(),
								w(
									`Programs ready: ${String(
										e.retail_loyalty_program
									)} / ${String(e.fleet_loyalty_program)}`
								);
						} catch (e) {
							j(e, "Setup failed");
						} finally {
							A(null);
						}
					},
					D = async () => {
						N(), A("enroll");
						try {
							let e = await (0, i.Mq)({ limit: 200 });
							await f(),
								w(`Enrolled ${e.enrolled ?? 0} of ${e.attempted ?? 0} customers.`);
						} catch (e) {
							j(e, "Bulk enroll failed");
						} finally {
							A(null);
						}
					},
					L = async () => {
						N(), A("sync");
						try {
							let e = await (0, i.Nm)({ limit: 200 });
							await f(), w(`Synced tiers for ${e.synced ?? 0} customers.`);
						} catch (e) {
							j(e, "Tier sync failed");
						} finally {
							A(null);
						}
					},
					M = async () => {
						if ((N(), !C)) return void j("Select a customer to enroll.");
						A("one");
						try {
							let e = await (0, i.aW)(C);
							await f(),
								w(
									`Enrolled in ${String(e.loyalty_program)} \xb7 tier ${String(
										e.loyalty_program_tier || "—"
									)}`
								);
						} catch (e) {
							j(e, "Enroll failed");
						} finally {
							A(null);
						}
					},
					V = async () => {
						if ((N(), !$.customer || !$.reason.trim()))
							return void j("Customer and reason are required.");
						k(!0);
						try {
							await (0, i.eV)({
								customer: $.customer,
								points: Number($.points),
								adjustment_type: $.adjustment_type,
								reason: $.reason.trim(),
							}),
								P((e) => ({ ...e, reason: "", points: "100" })),
								await v(),
								w("Adjustment submitted for approval.");
						} catch (e) {
							j(e, "Failed to create adjustment");
						} finally {
							k(!1);
						}
					};
				return e && a
					? (0, s.jsxs)("div", {
							className: "space-y-4",
							children: [
								(0, s.jsx)(x.y, { error: h, success: b, onDismiss: N }),
								(0, s.jsxs)(d.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(d.aR, {
											children: (0, s.jsx)(d.ZB, {
												className: "text-base",
												children: "Loyalty setup (\xa716)",
											}),
										}),
										(0, s.jsxs)(d.Wu, {
											className: "space-y-3 text-sm text-muted-foreground",
											children: [
												(0, s.jsxs)("p", {
													children: [
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Points:",
														}),
														" ERPNext Loyalty Program / Point Entry",
														a.use_erpnext_loyalty_program
															? " (enabled)"
															: " (disabled)",
														".",
													],
												}),
												(0, s.jsxs)("p", {
													children: [
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Discounts:",
														}),
														" Pricing Rules per tier (sales docs) + service % on job-card invoices.",
													],
												}),
												(0, s.jsxs)("p", {
													children: [
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Retail:",
														}),
														" ",
														String(a.retail_loyalty_program || "—"),
														a.retail_exists ? "" : " (missing)",
														" \xb7",
														" ",
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Fleet:",
														}),
														" ",
														String(a.fleet_loyalty_program || "—"),
														a.fleet_exists ? "" : " (missing)",
													],
												}),
												(0, s.jsxs)("p", {
													children: [
														"Enrolled customers:",
														" ",
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: Number(
																a.enrolled_customers || 0
															),
														}),
														". Referral reward after",
														" ",
														(0, s.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: String(
																e.referral_reward_event ||
																	"Delivery"
															),
														}),
														" ",
														"(",
														Number(e.referral_reward_points || 0),
														" pts).",
													],
												}),
												(0, s.jsx)("div", {
													className: "flex flex-wrap gap-2 pt-1",
													children: (a.tiers || e.tiers || []).map((e) =>
														(0, s.jsxs)(
															l.E,
															{
																variant: "secondary",
																children: [
																	String(e.tier || e.tier_name),
																	" \xb7",
																	" ",
																	Number(
																		e.discount_pct ??
																			e.service_discount_pct ??
																			0
																	),
																	"% svc",
																	e.pricing_rule
																		? ` \xb7 ${String(
																				e.pricing_rule
																		  )}`
																		: "",
																],
															},
															String(e.tier || e.tier_name)
														)
													),
												}),
												(0, s.jsxs)("div", {
													className: "flex flex-wrap gap-2 pt-2",
													children: [
														(0, s.jsxs)(o.$, {
															size: "sm",
															onClick: () => void R(),
															disabled: !!S,
															children: [
																"setup" === S
																	? (0, s.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Create programs & pricing rules",
															],
														}),
														(0, s.jsxs)(o.$, {
															size: "sm",
															variant: "outline",
															onClick: () => void D(),
															disabled: !!S || !a.ready,
															children: [
																"enroll" === S
																	? (0, s.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Enroll customers (200)",
															],
														}),
														(0, s.jsxs)(o.$, {
															size: "sm",
															variant: "outline",
															onClick: () => void L(),
															disabled: !!S || !a.ready,
															children: [
																"sync" === S
																	? (0, s.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Sync tiers from LTV",
															],
														}),
														(0, s.jsx)(o.$, {
															size: "sm",
															variant: "ghost",
															onClick: async () => {
																try {
																	await (0, i.nq)({
																		enable_loyalty: 1,
																	}),
																		await z(),
																		w("Loyalty enabled.");
																} catch (e) {
																	j(e, "Save failed");
																}
															},
															children: "Enable loyalty",
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className:
														"grid gap-2 sm:grid-cols-[1fr_auto] pt-2",
													children: [
														(0, s.jsx)(p.L, {
															value: C,
															onValueChange: (e) => E(e || ""),
														}),
														(0, s.jsxs)(o.$, {
															variant: "secondary",
															onClick: () => void M(),
															disabled: !!S || !a.ready,
															children: [
																"one" === S
																	? (0, s.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Enroll one",
															],
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, s.jsxs)(d.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(d.aR, {
											children: (0, s.jsx)(d.ZB, {
												className: "text-base",
												children: "Points adjustment (approval)",
											}),
										}),
										(0, s.jsxs)(d.Wu, {
											className: "grid gap-3 sm:grid-cols-2",
											children: [
												(0, s.jsx)(p.L, {
													value: $.customer,
													onValueChange: (e) =>
														P((t) => ({ ...t, customer: e || "" })),
												}),
												(0, s.jsxs)("select", {
													className:
														"h-9 rounded-md border border-input bg-background px-3 text-sm",
													value: $.adjustment_type,
													onChange: (e) =>
														P((t) => ({
															...t,
															adjustment_type: e.target.value,
														})),
													children: [
														(0, s.jsx)("option", {
															value: "Credit",
															children: "Credit",
														}),
														(0, s.jsx)("option", {
															value: "Debit",
															children: "Debit",
														}),
														(0, s.jsx)("option", {
															value: "Expire",
															children: "Expire",
														}),
														(0, s.jsx)("option", {
															value: "Correction",
															children: "Correction",
														}),
													],
												}),
												(0, s.jsx)(c.p, {
													type: "number",
													value: $.points,
													onChange: (e) =>
														P((t) => ({
															...t,
															points: e.target.value,
														})),
													placeholder: "Points",
												}),
												(0, s.jsx)(u.T, {
													className: "sm:col-span-2",
													rows: 2,
													placeholder: "Reason *",
													value: $.reason,
													onChange: (e) =>
														P((t) => ({
															...t,
															reason: e.target.value,
														})),
												}),
												(0, s.jsxs)(o.$, {
													onClick: () => void V(),
													disabled: _,
													children: [
														_
															? (0, s.jsx)(g.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
															  })
															: null,
														"Submit adjustment",
													],
												}),
											],
										}),
									],
								}),
								(0, s.jsxs)(d.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, s.jsx)(d.aR, {
											children: (0, s.jsx)(d.ZB, {
												className: "text-base",
												children: "Pending adjustments",
											}),
										}),
										(0, s.jsx)(d.Wu, {
											className: "space-y-3",
											children:
												0 === (y?.data || []).length
													? (0, s.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "No pending adjustments.",
													  })
													: (y?.data || []).map((e) =>
															(0, s.jsxs)(
																"div",
																{
																	className:
																		"flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-3 text-sm",
																	children: [
																		(0, s.jsxs)("div", {
																			children: [
																				(0, s.jsxs)("p", {
																					className:
																						"font-medium",
																					children: [
																						String(
																							e.customer_name ||
																								e.customer
																						),
																						" \xb7 ",
																						String(
																							e.adjustment_type
																						),
																						" ",
																						Number(
																							e.points
																						),
																					],
																				}),
																				(0, s.jsx)("p", {
																					className:
																						"text-xs text-muted-foreground",
																					children:
																						String(
																							e.reason ||
																								""
																						),
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"flex gap-2",
																			children: [
																				(0, s.jsx)(o.$, {
																					size: "sm",
																					onClick:
																						async () => {
																							try {
																								await (0,
																								i.GV)(
																									String(
																										e.name
																									),
																									"Approved"
																								),
																									await v(),
																									w(
																										"Approved & posted."
																									);
																							} catch (e) {
																								j(
																									e,
																									"Approve failed"
																								);
																							}
																						},
																					children:
																						"Approve",
																				}),
																				(0, s.jsx)(o.$, {
																					size: "sm",
																					variant:
																						"outline",
																					onClick:
																						async () => {
																							try {
																								await (0,
																								i.GV)(
																									String(
																										e.name
																									),
																									"Rejected"
																								),
																									await v(),
																									w(
																										"Rejected."
																									);
																							} catch (e) {
																								j(
																									e,
																									"Reject failed"
																								);
																							}
																						},
																					children:
																						"Reject",
																				}),
																			],
																		}),
																	],
																},
																String(e.name)
															)
													  ),
										}),
									],
								}),
							],
					  })
					: (0, s.jsx)(m.E, { className: "h-40" });
			}
		},
		51914: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		56563: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		74350: (e, t, a) => {
			"use strict";
			a.d(t, {
				Cf: () => u,
				Es: () => p,
				L3: () => x,
				c7: () => m,
				lG: () => o,
				rr: () => g,
			});
			var s = a(95155);
			a(12115);
			var r = a(29483),
				n = a(33210),
				i = a(91337),
				l = a(10086);
			function o({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "dialog", ...e });
			}
			function d({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function u({
				className: e,
				children: t,
				showCloseButton: a = !0,
				headerActions: o,
				onPointerDownOutside: m,
				onInteractOutside: p,
				onFocusOutside: x,
				...g
			}) {
				return (0, s.jsxs)(d, {
					"data-slot": "dialog-portal",
					children: [
						(0, s.jsx)(c, {}),
						(0, s.jsxs)(r.UC, {
							"data-slot": "dialog-content",
							className: (0, i.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							onPointerDownOutside: (e) => {
								(0, l.JM)(e.target) ? e.preventDefault() : m?.(e);
							},
							onInteractOutside: (e) => {
								(0, l.JM)(e.target) ? e.preventDefault() : p?.(e);
							},
							onFocusOutside: (e) => {
								(0, l.JM)(e.target) ? e.preventDefault() : x?.(e);
							},
							...g,
							children: [
								t,
								(o || a) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											o,
											a &&
												(0, s.jsxs)(r.bm, {
													"data-slot": "dialog-close",
													className:
														"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
													children: [
														(0, s.jsx)(n.A, {}),
														(0, s.jsx)("span", {
															className: "sr-only",
															children: "Close",
														}),
													],
												}),
										],
									}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, i.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, i.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "dialog-title",
					className: (0, i.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function g({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "dialog-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
		},
		79792: (e, t, a) => {
			"use strict";
			a.d(t, { J: () => i });
			var s = a(95155);
			a(12115);
			var r = a(91760),
				n = a(91337);
			function i({ className: e, ...t }) {
				return (0, s.jsx)(r.b, {
					"data-slot": "label",
					className: (0, n.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...t,
				});
			}
		},
		91760: (e, t, a) => {
			"use strict";
			a.d(t, { b: () => o });
			var s = a(12115);
			a(47650);
			var r = a(42442),
				n = a(95155),
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
				].reduce((e, t) => {
					let a = (0, r.TL)(`Primitive.${t}`),
						i = s.forwardRef((e, s) => {
							let { asChild: r, ...i } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, n.jsx)(r ? a : t, { ...i, ref: s })
							);
						});
					return (i.displayName = `Primitive.${t}`), { ...e, [t]: i };
				}, {}),
				l = s.forwardRef((e, t) =>
					(0, n.jsx)(i.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			l.displayName = "Label";
			var o = l;
		},
		94514: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
	(e) => {
		e.O(0, [8409, 4855, 6609, 410, 7605, 1602, 8103, 2372, 7367, 8441, 3794, 7358], () =>
			e((e.s = 11338))
		),
			(_N_E = e.O());
	},
]);
