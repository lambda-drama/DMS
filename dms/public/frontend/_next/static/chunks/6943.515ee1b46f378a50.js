"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6943],
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
		23511: (e, a, r) => {
			r.d(a, { E: () => n });
			var t = r(95155),
				s = r(91337);
			function n({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, s.cn)("bg-accent animate-pulse rounded-md", e),
					...a,
				});
			}
		},
		38291: (e, a, r) => {
			r.d(a, { E: () => d });
			var t = r(95155);
			r(12115);
			var s = r(42442),
				n = r(18460),
				i = r(91337);
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
			function d({ className: e, variant: a, asChild: r = !1, ...n }) {
				let o = r ? s.DX : "span";
				return (0, t.jsx)(o, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: a }), e),
					...n,
				});
			}
		},
		39540: (e, a, r) => {
			r.d(a, { T: () => n });
			var t = r(95155);
			r(12115);
			var s = r(91337);
			function n({ className: e, ...a }) {
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
		48269: (e, a, r) => {
			r.r(a), r.d(a, { default: () => y });
			var t = r(95155),
				s = r(12115),
				n = r(44855),
				i = r(32144),
				l = r(38291),
				d = r(4474),
				o = r(79984),
				c = r(39658),
				u = r(39540),
				m = r(23511),
				p = r(44462),
				x = r(93108),
				g = r(6296);
			function y() {
				let { data: e, mutate: a } = (0, n.Ay)("crm-loyalty-settings", i.Cv),
					{ data: r, mutate: y } = (0, n.Ay)("crm-loyalty-setup", i.ST),
					{ data: h, mutate: v } = (0, n.Ay)("crm-loyalty-adjustments", () =>
						(0, i.J0)({ status: "Pending", limit: 30 })
					),
					{ error: f, success: j, showError: b, showSuccess: w, clear: N } = (0, x.B)(),
					[_, k] = (0, s.useState)(!1),
					[S, C] = (0, s.useState)(null),
					[A, E] = (0, s.useState)(""),
					[$, R] = (0, s.useState)({
						customer: "",
						points: "100",
						adjustment_type: "Credit",
						reason: "",
					}),
					P = async () => {
						await Promise.all([a(), y(), v()]);
					},
					z = async () => {
						N(), C("setup");
						try {
							let e = await (0, i.nL)();
							await P(),
								w(
									`Programs ready: ${String(
										e.retail_loyalty_program
									)} / ${String(e.fleet_loyalty_program)}`
								);
						} catch (e) {
							b(e, "Setup failed");
						} finally {
							C(null);
						}
					},
					L = async () => {
						N(), C("enroll");
						try {
							let e = await (0, i.Mq)({ limit: 200 });
							await y(),
								w(`Enrolled ${e.enrolled ?? 0} of ${e.attempted ?? 0} customers.`);
						} catch (e) {
							b(e, "Bulk enroll failed");
						} finally {
							C(null);
						}
					},
					V = async () => {
						N(), C("sync");
						try {
							let e = await (0, i.Nm)({ limit: 200 });
							await y(), w(`Synced tiers for ${e.synced ?? 0} customers.`);
						} catch (e) {
							b(e, "Tier sync failed");
						} finally {
							C(null);
						}
					},
					D = async () => {
						if ((N(), !A)) return void b("Select a customer to enroll.");
						C("one");
						try {
							let e = await (0, i.aW)(A);
							await y(),
								w(
									`Enrolled in ${String(e.loyalty_program)} \xb7 tier ${String(
										e.loyalty_program_tier || "—"
									)}`
								);
						} catch (e) {
							b(e, "Enroll failed");
						} finally {
							C(null);
						}
					},
					Z = async () => {
						if ((N(), !$.customer || !$.reason.trim()))
							return void b("Customer and reason are required.");
						k(!0);
						try {
							await (0, i.eV)({
								customer: $.customer,
								points: Number($.points),
								adjustment_type: $.adjustment_type,
								reason: $.reason.trim(),
							}),
								R((e) => ({ ...e, reason: "", points: "100" })),
								await v(),
								w("Adjustment submitted for approval.");
						} catch (e) {
							b(e, "Failed to create adjustment");
						} finally {
							k(!1);
						}
					};
				return e && r
					? (0, t.jsxs)("div", {
							className: "space-y-4",
							children: [
								(0, t.jsx)(x.y, { error: f, success: j, onDismiss: N }),
								(0, t.jsxs)(o.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, t.jsx)(o.aR, {
											children: (0, t.jsx)(o.ZB, {
												className: "text-base",
												children: "Loyalty setup (\xa716)",
											}),
										}),
										(0, t.jsxs)(o.Wu, {
											className: "space-y-3 text-sm text-muted-foreground",
											children: [
												(0, t.jsxs)("p", {
													children: [
														(0, t.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Points:",
														}),
														" ERPNext Loyalty Program / Point Entry",
														r.use_erpnext_loyalty_program
															? " (enabled)"
															: " (disabled)",
														".",
													],
												}),
												(0, t.jsxs)("p", {
													children: [
														(0, t.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Discounts:",
														}),
														" Pricing Rules per tier (sales docs) + service % on job-card invoices.",
													],
												}),
												(0, t.jsxs)("p", {
													children: [
														(0, t.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Retail:",
														}),
														" ",
														String(r.retail_loyalty_program || "—"),
														r.retail_exists ? "" : " (missing)",
														" \xb7",
														" ",
														(0, t.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: "Fleet:",
														}),
														" ",
														String(r.fleet_loyalty_program || "—"),
														r.fleet_exists ? "" : " (missing)",
													],
												}),
												(0, t.jsxs)("p", {
													children: [
														"Enrolled customers:",
														" ",
														(0, t.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: Number(
																r.enrolled_customers || 0
															),
														}),
														". Referral reward after",
														" ",
														(0, t.jsx)("span", {
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
												(0, t.jsx)("div", {
													className: "flex flex-wrap gap-2 pt-1",
													children: (r.tiers || e.tiers || []).map((e) =>
														(0, t.jsxs)(
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
												(0, t.jsxs)("div", {
													className: "flex flex-wrap gap-2 pt-2",
													children: [
														(0, t.jsxs)(d.$, {
															size: "sm",
															onClick: () => void z(),
															disabled: !!S,
															children: [
																"setup" === S
																	? (0, t.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Create programs & pricing rules",
															],
														}),
														(0, t.jsxs)(d.$, {
															size: "sm",
															variant: "outline",
															onClick: () => void L(),
															disabled: !!S || !r.ready,
															children: [
																"enroll" === S
																	? (0, t.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Enroll customers (200)",
															],
														}),
														(0, t.jsxs)(d.$, {
															size: "sm",
															variant: "outline",
															onClick: () => void V(),
															disabled: !!S || !r.ready,
															children: [
																"sync" === S
																	? (0, t.jsx)(g.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Sync tiers from LTV",
															],
														}),
														(0, t.jsx)(d.$, {
															size: "sm",
															variant: "ghost",
															onClick: async () => {
																try {
																	await (0, i.nq)({
																		enable_loyalty: 1,
																	}),
																		await P(),
																		w("Loyalty enabled.");
																} catch (e) {
																	b(e, "Save failed");
																}
															},
															children: "Enable loyalty",
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className:
														"grid gap-2 sm:grid-cols-[1fr_auto] pt-2",
													children: [
														(0, t.jsx)(p.L, {
															value: A,
															onValueChange: (e) => E(e || ""),
														}),
														(0, t.jsxs)(d.$, {
															variant: "secondary",
															onClick: () => void D(),
															disabled: !!S || !r.ready,
															children: [
																"one" === S
																	? (0, t.jsx)(g.A, {
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
								(0, t.jsxs)(o.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, t.jsx)(o.aR, {
											children: (0, t.jsx)(o.ZB, {
												className: "text-base",
												children: "Points adjustment (approval)",
											}),
										}),
										(0, t.jsxs)(o.Wu, {
											className: "grid gap-3 sm:grid-cols-2",
											children: [
												(0, t.jsx)(p.L, {
													value: $.customer,
													onValueChange: (e) =>
														R((a) => ({ ...a, customer: e || "" })),
												}),
												(0, t.jsxs)("select", {
													className:
														"h-9 rounded-md border border-input bg-background px-3 text-sm",
													value: $.adjustment_type,
													onChange: (e) =>
														R((a) => ({
															...a,
															adjustment_type: e.target.value,
														})),
													children: [
														(0, t.jsx)("option", {
															value: "Credit",
															children: "Credit",
														}),
														(0, t.jsx)("option", {
															value: "Debit",
															children: "Debit",
														}),
														(0, t.jsx)("option", {
															value: "Expire",
															children: "Expire",
														}),
														(0, t.jsx)("option", {
															value: "Correction",
															children: "Correction",
														}),
													],
												}),
												(0, t.jsx)(c.p, {
													type: "number",
													value: $.points,
													onChange: (e) =>
														R((a) => ({
															...a,
															points: e.target.value,
														})),
													placeholder: "Points",
												}),
												(0, t.jsx)(u.T, {
													className: "sm:col-span-2",
													rows: 2,
													placeholder: "Reason *",
													value: $.reason,
													onChange: (e) =>
														R((a) => ({
															...a,
															reason: e.target.value,
														})),
												}),
												(0, t.jsxs)(d.$, {
													onClick: () => void Z(),
													disabled: _,
													children: [
														_
															? (0, t.jsx)(g.A, {
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
								(0, t.jsxs)(o.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, t.jsx)(o.aR, {
											children: (0, t.jsx)(o.ZB, {
												className: "text-base",
												children: "Pending adjustments",
											}),
										}),
										(0, t.jsx)(o.Wu, {
											className: "space-y-3",
											children:
												0 === (h?.data || []).length
													? (0, t.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "No pending adjustments.",
													  })
													: (h?.data || []).map((e) =>
															(0, t.jsxs)(
																"div",
																{
																	className:
																		"flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-3 text-sm",
																	children: [
																		(0, t.jsxs)("div", {
																			children: [
																				(0, t.jsxs)("p", {
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
																				(0, t.jsx)("p", {
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
																		(0, t.jsxs)("div", {
																			className:
																				"flex gap-2",
																			children: [
																				(0, t.jsx)(d.$, {
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
																								b(
																									e,
																									"Approve failed"
																								);
																							}
																						},
																					children:
																						"Approve",
																				}),
																				(0, t.jsx)(d.$, {
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
																								b(
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
					: (0, t.jsx)(m.E, { className: "h-40" });
			}
		},
	},
]);
