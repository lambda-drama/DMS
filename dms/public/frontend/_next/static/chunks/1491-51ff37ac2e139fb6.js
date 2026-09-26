"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1491],
	{
		16776: (e, t, s) => {
			s.d(t, { w: () => l });
			var n = s(95155),
				a = s(39658),
				r = s(79792),
				i = s(26518),
				o = s(88361);
			function l({
				label: e,
				mode: t,
				onModeChange: s,
				value: d,
				onValueChange: c,
				subtotal: u,
			}) {
				let x = (0, o.mW)(t, d),
					p = (0, o.HW)(u, t, x);
				return (0, n.jsxs)("div", {
					className: "rounded-lg border bg-muted/30 p-4 space-y-3",
					children: [
						(0, n.jsxs)("p", {
							className: "text-sm font-medium",
							children: [e, " discount"],
						}),
						(0, n.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [
								(0, n.jsxs)("div", {
									className: "space-y-2",
									children: [
										(0, n.jsx)(r.J, {
											className: "text-xs",
											children: "Type",
										}),
										(0, n.jsxs)(i.l6, {
											value: t,
											onValueChange: (e) => s(e),
											children: [
												(0, n.jsx)(i.bq, {
													children: (0, n.jsx)(i.yv, {}),
												}),
												(0, n.jsxs)(i.gC, {
													children: [
														(0, n.jsx)(i.eb, {
															value: "none",
															children: "No discount",
														}),
														(0, n.jsx)(i.eb, {
															value: "percentage",
															children: "Percentage (%)",
														}),
														(0, n.jsx)(i.eb, {
															value: "amount",
															children: "Amount",
														}),
													],
												}),
											],
										}),
									],
								}),
								"none" !== t &&
									(0, n.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, n.jsx)(r.J, {
												className: "text-xs",
												children:
													"percentage" === t
														? `Percent off ${e.toLowerCase()} total`
														: `Amount off ${e.toLowerCase()} total`,
											}),
											(0, n.jsx)(a.p, {
												type: "number",
												min: 0,
												max: "percentage" === t ? 100 : u || void 0,
												step: 0.01,
												value: d,
												onChange: (e) => c(e.target.value),
												placeholder:
													"percentage" === t ? "e.g. 15" : "e.g. 500",
											}),
										],
									}),
							],
						}),
						"none" !== t &&
							p > 0 &&
							(0, n.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children:
									"percentage" === t
										? `−${p.toLocaleString()} (${x}%) off ${e.toLowerCase()}`
										: `−${p.toLocaleString()} off ${e.toLowerCase()}`,
							}),
					],
				});
			}
		},
		26518: (e, t, s) => {
			s.d(t, { bq: () => u, eb: () => p, gC: () => x, l6: () => d, yv: () => c });
			var n = s(95155);
			s(12115);
			var a = s(40287),
				r = s(66088),
				i = s(94514),
				o = s(9921),
				l = s(91337);
			function d({ ...e }) {
				return (0, n.jsx)(a.bL, { "data-slot": "select", ...e });
			}
			function c({ ...e }) {
				return (0, n.jsx)(a.WT, { "data-slot": "select-value", ...e });
			}
			function u({ className: e, size: t = "default", children: s, ...i }) {
				return (0, n.jsxs)(a.l9, {
					"data-slot": "select-trigger",
					"data-size": t,
					className: (0, l.cn)(
						"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-full border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
					children: [
						s,
						(0, n.jsx)(a.In, {
							asChild: !0,
							children: (0, n.jsx)(r.A, { className: "size-4 opacity-50" }),
						}),
					],
				});
			}
			function x({ className: e, children: t, position: s = "popper", ...r }) {
				return (0, n.jsx)(a.ZL, {
					children: (0, n.jsxs)(a.UC, {
						"data-slot": "select-content",
						className: (0, l.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
							"popper" === s &&
								"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
							e
						),
						position: s,
						...r,
						children: [
							(0, n.jsx)(m, {}),
							(0, n.jsx)(a.LM, {
								className: (0, l.cn)(
									"p-1",
									"popper" === s &&
										"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
								),
								children: t,
							}),
							(0, n.jsx)(g, {}),
						],
					}),
				});
			}
			function p({ className: e, children: t, ...s }) {
				return (0, n.jsxs)(a.q7, {
					"data-slot": "select-item",
					className: (0, l.cn)(
						"focus:bg-dms-green-light focus:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
						e
					),
					...s,
					children: [
						(0, n.jsx)("span", {
							className:
								"absolute right-2 flex size-3.5 items-center justify-center",
							children: (0, n.jsx)(a.VF, {
								children: (0, n.jsx)(i.A, { className: "size-4" }),
							}),
						}),
						(0, n.jsx)(a.p4, { children: t }),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, n.jsx)(a.PP, {
					"data-slot": "select-scroll-up-button",
					className: (0, l.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, n.jsx)(o.A, { className: "size-4" }),
				});
			}
			function g({ className: e, ...t }) {
				return (0, n.jsx)(a.wn, {
					"data-slot": "select-scroll-down-button",
					className: (0, l.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, n.jsx)(r.A, { className: "size-4" }),
				});
			}
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => l });
			var n = s(95155);
			s(12115);
			var a = s(42442),
				r = s(18460),
				i = s(91337);
			let o = (0, r.F)(
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
			function l({ className: e, variant: t, asChild: s = !1, ...r }) {
				let d = s ? a.DX : "span";
				return (0, n.jsx)(d, {
					"data-slot": "badge",
					className: (0, i.cn)(o({ variant: t }), e),
					...r,
				});
			}
		},
		75042: (e, t, s) => {
			s.d(t, { S: () => m });
			var n = s(95155),
				a = s(12115),
				r = s(6296),
				i = s(69183),
				o = s(4474),
				l = s(39658),
				d = s(79792),
				c = s(74350),
				u = s(26518),
				x = s(91337),
				p = s(88361);
			function m({
				label: e,
				lineAmount: t,
				discountType: s,
				discountValue: g,
				disabled: h = !1,
				busy: v = !1,
				onApply: f,
			}) {
				let [b, j] = (0, a.useState)(!1),
					[y, N] = (0, a.useState)("none"),
					[w, k] = (0, a.useState)("");
				(0, a.useEffect)(() => {
					b && (N((0, p.nO)(s)), k(g ? String(g) : ""));
				}, [b, s, g]);
				let C = (0, p.VJ)(s, g),
					_ = (0, p.O6)(t, y, parseFloat(w) || 0),
					z = (e) => e.toLocaleString(void 0, { minimumFractionDigits: 2 }),
					L = async () => {
						await f((0, p.OC)(y, w)), j(!1);
					};
				return (0, n.jsxs)(n.Fragment, {
					children: [
						(0, n.jsxs)(o.$, {
							type: "button",
							variant: C ? "secondary" : "ghost",
							size: C ? "sm" : "icon",
							className: (0, x.cn)("h-8 gap-1 px-2 text-xs", !C && "w-8 px-0"),
							disabled: h || v,
							"aria-label": "Line discount",
							title: C ? `Line discount ${C}` : "Add line discount",
							onClick: () => j(!0),
							children: [
								v
									? (0, n.jsx)(r.A, { className: "h-4 w-4 animate-spin" })
									: (0, n.jsx)(i.A, { className: "h-4 w-4" }),
								C && !v ? (0, n.jsx)("span", { children: C }) : null,
							],
						}),
						(0, n.jsx)(c.lG, {
							open: b,
							onOpenChange: j,
							children: (0, n.jsxs)(c.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, n.jsxs)(c.c7, {
										children: [
											(0, n.jsx)(c.L3, { children: "Line discount" }),
											(0, n.jsxs)(c.rr, {
												children: [
													"Discount on ",
													e
														? (0, n.jsx)("span", {
																className: "font-medium",
																children: e,
														  })
														: "this line",
													" — gross amount ",
													z(t),
													". Applied before any labour / parts discount.",
												],
											}),
										],
									}),
									(0, n.jsxs)("div", {
										className: "space-y-3 py-1",
										children: [
											(0, n.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, n.jsx)(d.J, {
														className: "text-xs",
														children: "Type",
													}),
													(0, n.jsxs)(u.l6, {
														value: y,
														onValueChange: (e) => N(e),
														children: [
															(0, n.jsx)(u.bq, {
																children: (0, n.jsx)(u.yv, {}),
															}),
															(0, n.jsxs)(u.gC, {
																children: [
																	(0, n.jsx)(u.eb, {
																		value: "none",
																		children: "No discount",
																	}),
																	(0, n.jsx)(u.eb, {
																		value: "percentage",
																		children: "Percentage (%)",
																	}),
																	(0, n.jsx)(u.eb, {
																		value: "amount",
																		children: "Amount",
																	}),
																],
															}),
														],
													}),
												],
											}),
											"none" !== y &&
												(0, n.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, n.jsx)(d.J, {
															className: "text-xs",
															children:
																"percentage" === y
																	? "Percent off this line"
																	: "Amount off this line",
														}),
														(0, n.jsx)(l.p, {
															type: "number",
															min: 0,
															max:
																"percentage" === y
																	? 100
																	: t || void 0,
															step: "0.01",
															value: w,
															onChange: (e) => k(e.target.value),
															placeholder:
																"percentage" === y
																	? "e.g. 10"
																	: "e.g. 500",
														}),
													],
												}),
											"none" !== y &&
												_ > 0 &&
												(0, n.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														"−",
														z(_),
														" → net",
														" ",
														(0, n.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: z(Math.max(t - _, 0)),
														}),
													],
												}),
										],
									}),
									(0, n.jsxs)(c.Es, {
										className: "gap-2 sm:justify-between",
										children: [
											C
												? (0, n.jsx)(o.$, {
														type: "button",
														variant: "ghost",
														className:
															"text-destructive hover:text-destructive",
														disabled: v,
														onClick: async () => {
															await f({
																discount_type: "",
																discount_value: 0,
															}),
																j(!1);
														},
														children: "Remove discount",
												  })
												: (0, n.jsx)("span", {}),
											(0, n.jsxs)("div", {
												className: "flex gap-2",
												children: [
													(0, n.jsx)(o.$, {
														type: "button",
														variant: "outline",
														disabled: v,
														onClick: () => j(!1),
														children: "Cancel",
													}),
													(0, n.jsx)(o.$, {
														type: "button",
														disabled: v,
														onClick: L,
														children: v
															? (0, n.jsx)(r.A, {
																	className:
																		"h-4 w-4 animate-spin",
															  })
															: "Save",
													}),
												],
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
		84437: (e, t, s) => {
			s.d(t, { S: () => o });
			var n = s(95155);
			s(12115);
			var a = s(47279),
				r = s(94514),
				i = s(91337);
			function o({ className: e, ...t }) {
				return (0, n.jsx)(a.bL, {
					"data-slot": "checkbox",
					className: (0, i.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...t,
					children: (0, n.jsx)(a.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, n.jsx)(r.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		88361: (e, t, s) => {
			function n(e, t) {
				if ("none" === e) return 0;
				let s = parseFloat(t);
				return Number.isFinite(s) && s > 0 ? s : 0;
			}
			function a(e, t, s) {
				return "none" === t || e <= 0 || s <= 0
					? 0
					: "percentage" === t
					? (Math.min(s, 100) / 100) * e
					: Math.min(s, e);
			}
			function r(e, t) {
				let s = n(e, t);
				if ("none" !== e && !(s <= 0)) return { type: e, value: s };
			}
			function i(e) {
				let t = (e || "").trim().toLowerCase();
				return "percentage" === t || "percent" === t
					? "percentage"
					: "amount" === t
					? "amount"
					: "none";
			}
			function o(e, t) {
				let s = n(e, t);
				return "none" === e || s <= 0
					? { discount_type: "", discount_value: 0 }
					: {
							discount_type:
								"percentage" === e ? "Percentage" : "amount" === e ? "Amount" : "",
							discount_value: s,
					  };
			}
			function l(e, t, s) {
				return a(e, t, s);
			}
			function d(e, t) {
				let s = i(e),
					n = Number(t || 0);
				return "none" === s || n <= 0
					? ""
					: "percentage" === s
					? `${n}%`
					: n.toLocaleString();
			}
			s.d(t, {
				HW: () => a,
				O6: () => l,
				OC: () => o,
				VJ: () => d,
				Z_: () => r,
				mW: () => n,
				nO: () => i,
			});
		},
	},
]);
