"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[987],
	{
		27919: (e, s, a) => {
			a.d(s, { B_: () => l, PN: () => r, Q0: () => n, tp: () => t });
			let t = "/assets/dms/image/suwey_logo.png",
				r = "Suweys Motors",
				n = "DMS",
				l = `${r} ${n}`;
		},
		57588: (e, s, a) => {
			a.d(s, { F: () => i });
			var t = a(95155),
				r = a(83391),
				n = a(91337),
				l = a(27919);
			let d = {
				sm: { box: "h-8 w-8", image: 32, text: "text-sm" },
				md: { box: "h-10 w-10", image: 40, text: "text-sm" },
				lg: { box: "h-16 w-16", image: 64, text: "text-3xl" },
			};
			function i({
				className: e,
				imageClassName: s,
				showText: a = !0,
				size: c = "md",
				variant: o = "default",
			}) {
				let m = d[c],
					x = "sidebar" === o;
				return (0, t.jsxs)("div", {
					className: (0, n.cn)("flex items-center gap-3", e),
					children: [
						(0, t.jsx)("div", {
							className: (0, n.cn)(
								"relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white",
								m.box,
								s
							),
							children: (0, t.jsx)(r.default, {
								src: l.tp,
								alt: `${l.PN} logo`,
								width: m.image,
								height: m.image,
								className: "h-full w-full object-contain p-0.5",
								priority: !0,
							}),
						}),
						a
							? (0, t.jsxs)("div", {
									className: "min-w-0",
									children: [
										(0, t.jsx)("p", {
											className: (0, n.cn)(
												"font-semibold leading-tight",
												m.text,
												x && "text-sidebar-foreground"
											),
											children: l.PN,
										}),
										(0, t.jsx)("p", {
											className: (0, n.cn)(
												"text-xs",
												x
													? "text-sidebar-foreground/70"
													: "text-muted-foreground"
											),
											children: l.Q0,
										}),
									],
							  })
							: null,
					],
				});
			}
		},
		79984: (e, s, a) => {
			a.d(s, { BT: () => i, Wu: () => c, ZB: () => d, Zp: () => n, aR: () => l });
			var t = a(95155);
			a(12115);
			var r = a(91337);
			function n({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "card",
					className: (0, r.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...s,
				});
			}
			function l({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-header",
					className: (0, r.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...s,
				});
			}
			function d({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-title",
					className: (0, r.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...s,
				});
			}
			function i({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...s,
				});
			}
			function c({ className: e, ...s }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-content",
					className: (0, r.cn)("px-4", e),
					...s,
				});
			}
		},
		80987: (e, s, a) => {
			a.r(s), a.d(s, { default: () => u });
			var t = a(95155),
				r = a(12115),
				n = a(47277),
				l = a(4474),
				d = a(39658),
				i = a(79792),
				c = a(79984),
				o = a(57588),
				m = a(27919),
				x = a(6296);
			function u() {
				let { login: e, isLoading: s } = (0, n.A)(),
					[a, u] = (0, r.useState)(""),
					[h, g] = (0, r.useState)(""),
					[p, f] = (0, r.useState)(""),
					[j, N] = (0, r.useState)(!1);
				async function b(s) {
					s.preventDefault(), f(""), N(!0);
					try {
						await e(a, h);
					} catch (e) {
						f(
							e instanceof Error
								? e.message
								: "Invalid credentials. Please try again."
						);
					} finally {
						N(!1);
					}
				}
				let v = s || j;
				return (0, t.jsx)("div", {
					className: "flex min-h-screen items-center justify-center bg-secondary p-4",
					children: (0, t.jsxs)("div", {
						className: "w-full max-w-md space-y-8",
						children: [
							(0, t.jsxs)("div", {
								className: "flex flex-col items-center space-y-4",
								children: [
									(0, t.jsx)(o.F, { size: "lg", showText: !1 }),
									(0, t.jsxs)("div", {
										className: "text-center",
										children: [
											(0, t.jsx)("h1", {
												className:
													"font-serif-display text-3xl font-semibold tracking-tight text-secondary-foreground",
												children: m.B_,
											}),
											(0, t.jsx)("p", {
												className:
													"mt-2 text-sm text-secondary-foreground/70",
												children: "Dealer Management System",
											}),
										],
									}),
								],
							}),
							(0, t.jsxs)(c.Zp, {
								className: "border-0 shadow-2xl",
								children: [
									(0, t.jsx)(c.aR, {
										className: "space-y-1 pb-4",
										children: (0, t.jsx)(c.ZB, {
											className: "text-xl",
											children: "Sign in",
										}),
									}),
									(0, t.jsx)(c.Wu, {
										children: (0, t.jsxs)("form", {
											onSubmit: b,
											className: "space-y-4",
											children: [
												p &&
													(0, t.jsx)("div", {
														className:
															"rounded-lg bg-destructive/10 p-3 text-sm text-destructive",
														children: p,
													}),
												(0, t.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, t.jsx)(i.J, {
															htmlFor: "username",
															children: "Email or Username",
														}),
														(0, t.jsx)(d.p, {
															id: "username",
															type: "text",
															placeholder: "Amiin",
															value: a,
															onChange: (e) => u(e.target.value),
															required: !0,
															autoComplete: "username",
															className: "h-11",
															disabled: v,
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, t.jsx)(i.J, {
															htmlFor: "password",
															children: "Password",
														}),
														(0, t.jsx)(d.p, {
															id: "password",
															type: "password",
															placeholder: "Enter your password",
															value: h,
															onChange: (e) => g(e.target.value),
															required: !0,
															autoComplete: "current-password",
															className: "h-11",
															disabled: v,
														}),
													],
												}),
												(0, t.jsx)(l.$, {
													type: "submit",
													className: "h-11 w-full",
													disabled: v,
													children: v
														? (0, t.jsxs)(t.Fragment, {
																children: [
																	(0, t.jsx)(x.A, {
																		className:
																			"mr-2 h-4 w-4 animate-spin",
																	}),
																	"Signing in...",
																],
														  })
														: "Sign in",
												}),
											],
										}),
									}),
								],
							}),
						],
					}),
				});
			}
		},
	},
]);
