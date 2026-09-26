"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[9233],
	{
		29233: (e, t, i) => {
			i.r(t), i.d(t, { default: () => j });
			var r = i(95155),
				s = i(12115),
				n = i(44855),
				a = i(66609),
				o = i(4474),
				d = i(39658),
				c = i(39540),
				l = i(79792),
				u = i(79984),
				m = i(84437),
				h = i(74350),
				f = i(38291),
				p = i(51914),
				v = i(61878),
				y = i(6296),
				x = i(48368),
				g = i(49387),
				_ = i(68459),
				b = i(66348),
				S = i(44416);
			function T() {
				return { name: "", title: "", terms_and_conditions: "", default: !1 };
			}
			function N() {
				let [e, t] = (0, s.useState)(""),
					[i, N] = (0, s.useState)(""),
					[j, k] = (0, s.useState)(!1),
					[O, w] = (0, s.useState)(!1),
					[A, J] = (0, s.useState)(T()),
					[$, P] = (0, s.useState)(!1),
					[C, E] = (0, s.useState)(null);
				(0, s.useEffect)(() => {
					let t = window.setTimeout(() => N(e.trim()), 250);
					return () => window.clearTimeout(t);
				}, [e]);
				let {
						data: M,
						isLoading: z,
						mutate: I,
					} = (0, n.Ay)(["sales-invoice-tc-master", i], () =>
						b.Lo({ search: i || void 0, limit: 100, offset: 0 })
					),
					L = M?.data || [];
				async function R() {
					if (!A.title.trim()) return void a.o.error("Title is required");
					P(!0);
					try {
						O && A.name
							? (await b._1(A.name, {
									title: A.title.trim(),
									terms_and_conditions: A.terms_and_conditions,
									default: +!!A.default,
							  }),
							  a.o.success("Sales Invoice Terms updated"))
							: (await b.Z7({
									title: A.title.trim(),
									terms_and_conditions: A.terms_and_conditions,
									default: +!!A.default,
							  }),
							  a.o.success("Sales Invoice Terms created")),
							k(!1),
							I();
					} catch (e) {
						a.o.error(
							e instanceof Error ? e.message : "Failed to save Sales Invoice Terms"
						);
					} finally {
						P(!1);
					}
				}
				async function F(e) {
					E(e.name);
					try {
						await b.mU(e.name), a.o.success("Sales Invoice Terms deleted"), I();
					} catch (e) {
						a.o.error(
							e instanceof Error ? e.message : "Failed to delete Sales Invoice Terms"
						);
					} finally {
						E(null);
					}
				}
				return (0, r.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, r.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, r.jsxs)("div", {
									children: [
										(0, r.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Sales Invoice Terms",
										}),
										(0, r.jsx)("p", {
											className: "text-muted-foreground",
											children:
												"Master templates for Terms & Conditions used on sales invoice print formats",
										}),
									],
								}),
								(0, r.jsxs)(o.$, {
									onClick: function () {
										w(!1), J(T()), k(!0);
									},
									children: [
										(0, r.jsx)(p.A, { className: "h-4 w-4 mr-2" }),
										"New Terms Template",
									],
								}),
							],
						}),
						(0, r.jsx)(u.Zp, {
							children: (0, r.jsxs)(u.Wu, {
								className: "pt-6 space-y-4",
								children: [
									(0, r.jsxs)("div", {
										className: "relative",
										children: [
											(0, r.jsx)(v.A, {
												className:
													"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
											}),
											(0, r.jsx)(d.p, {
												className: "pl-9",
												placeholder: "Search terms titles…",
												value: e,
												onChange: (e) => t(e.target.value),
											}),
										],
									}),
									z
										? (0, r.jsx)("div", {
												className: "flex justify-center py-12",
												children: (0, r.jsx)(y.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: 0 === L.length
										? (0, r.jsxs)("div", {
												className:
													"flex flex-col items-center py-12 text-muted-foreground",
												children: [
													(0, r.jsx)(x.A, {
														className: "h-10 w-10 mb-2 opacity-40",
													}),
													(0, r.jsx)("p", {
														className: "text-sm",
														children:
															"No Sales Invoice Terms templates found",
													}),
												],
										  })
										: (0, r.jsx)("div", {
												className: "space-y-2",
												children: L.map((e) =>
													(0, r.jsxs)(
														"div",
														{
															className:
																"flex items-start justify-between gap-4 rounded-lg border p-4",
															children: [
																(0, r.jsxs)("div", {
																	className: "min-w-0 flex-1",
																	children: [
																		(0, r.jsxs)("div", {
																			className:
																				"flex items-center gap-2",
																			children: [
																				(0, r.jsx)(
																					"span",
																					{
																						className:
																							"font-semibold",
																						children:
																							e.title,
																					}
																				),
																				e.default
																					? (0, r.jsx)(
																							f.E,
																							{
																								variant:
																									"secondary",
																								children:
																									"Default",
																							}
																					  )
																					: null,
																			],
																		}),
																		(0, r.jsxs)("p", {
																			className:
																				"mt-1 line-clamp-3 text-sm text-muted-foreground whitespace-pre-line",
																			children: [
																				(0, S.i)(
																					e.terms_and_conditions
																				).slice(0, 300),
																				(0, S.i)(
																					e.terms_and_conditions
																				).length > 300
																					? "…"
																					: "",
																			],
																		}),
																	],
																}),
																(0, r.jsxs)("div", {
																	className:
																		"flex shrink-0 items-center gap-1",
																	children: [
																		(0, r.jsx)(o.$, {
																			variant: "ghost",
																			size: "icon",
																			onClick: () => {
																				w(!0),
																					J({
																						name: e.name,
																						title: e.title,
																						terms_and_conditions:
																							(0,
																							S.i)(
																								e.terms_and_conditions ||
																									""
																							),
																						default:
																							!!e.default,
																					}),
																					k(!0);
																			},
																			children: (0, r.jsx)(
																				g.A,
																				{
																					className:
																						"h-4 w-4",
																				}
																			),
																		}),
																		(0, r.jsx)(o.$, {
																			variant: "ghost",
																			size: "icon",
																			className:
																				"text-destructive",
																			disabled: C === e.name,
																			onClick: () =>
																				void F(e),
																			children:
																				C === e.name
																					? (0, r.jsx)(
																							y.A,
																							{
																								className:
																									"h-4 w-4 animate-spin",
																							}
																					  )
																					: (0, r.jsx)(
																							_.A,
																							{
																								className:
																									"h-4 w-4",
																							}
																					  ),
																		}),
																	],
																}),
															],
														},
														e.name
													)
												),
										  }),
								],
							}),
						}),
						(0, r.jsx)(h.lG, {
							open: j,
							onOpenChange: k,
							children: (0, r.jsxs)(h.Cf, {
								className:
									"sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden",
								children: [
									(0, r.jsxs)(h.c7, {
										className: "shrink-0",
										children: [
											(0, r.jsx)(h.L3, {
												children: O
													? "Edit Sales Invoice Terms"
													: "New Sales Invoice Terms",
											}),
											(0, r.jsx)(h.rr, {
												children: O
													? "Update the template title and content."
													: "Create a new Terms & Conditions template used on sales invoice print formats.",
											}),
										],
									}),
									(0, r.jsxs)("div", {
										className: "space-y-4 py-2 overflow-y-auto min-h-0",
										children: [
											(0, r.jsxs)("div", {
												className: "space-y-2",
												children: [
													(0, r.jsx)(l.J, {
														htmlFor: "sales-tc-title",
														children: "Title *",
													}),
													(0, r.jsx)(d.p, {
														id: "sales-tc-title",
														placeholder:
															"e.g. Standard Sales Invoice Terms",
														value: A.title,
														onChange: (e) =>
															J((t) => ({
																...t,
																title: e.target.value,
															})),
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "space-y-2",
												children: [
													(0, r.jsx)(l.J, {
														htmlFor: "sales-tc-content",
														children: "Terms & Conditions Content",
													}),
													(0, r.jsx)(c.T, {
														id: "sales-tc-content",
														rows: 12,
														placeholder: "1- ...\n2- ...\n3- ...",
														value: A.terms_and_conditions,
														onChange: (e) =>
															J((t) => ({
																...t,
																terms_and_conditions:
																	e.target.value,
															})),
													}),
													(0, r.jsx)("p", {
														className: "text-xs text-muted-foreground",
														children:
															"Type the terms as plain text — points 1, 2, 3, etc. This will appear on the sales invoice print format.",
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, r.jsx)(m.S, {
														id: "sales-tc-default",
														checked: A.default,
														onCheckedChange: (e) =>
															J((t) => ({ ...t, default: !!e })),
													}),
													(0, r.jsx)(l.J, {
														htmlFor: "sales-tc-default",
														className:
															"text-sm font-normal cursor-pointer",
														children:
															"Set as default template (auto-selected on new sales invoices)",
													}),
												],
											}),
										],
									}),
									(0, r.jsxs)(h.Es, {
										className: "shrink-0 border-t pt-4",
										children: [
											(0, r.jsx)(o.$, {
												variant: "outline",
												onClick: () => k(!1),
												disabled: $,
												children: "Cancel",
											}),
											(0, r.jsxs)(o.$, {
												onClick: () => void R(),
												disabled: $,
												children: [
													$
														? (0, r.jsx)(y.A, {
																className:
																	"h-4 w-4 mr-2 animate-spin",
														  })
														: null,
													O ? "Update" : "Create",
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
			function j() {
				return (0, r.jsx)(N, {});
			}
		},
		38291: (e, t, i) => {
			i.d(t, { E: () => d });
			var r = i(95155);
			i(12115);
			var s = i(42442),
				n = i(18460),
				a = i(91337);
			let o = (0, n.F)(
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
			function d({ className: e, variant: t, asChild: i = !1, ...n }) {
				let c = i ? s.DX : "span";
				return (0, r.jsx)(c, {
					"data-slot": "badge",
					className: (0, a.cn)(o({ variant: t }), e),
					...n,
				});
			}
		},
		39540: (e, t, i) => {
			i.d(t, { T: () => n });
			var r = i(95155);
			i(12115);
			var s = i(91337);
			function n({ className: e, ...t }) {
				return (0, r.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, s.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		44416: (e, t, i) => {
			i.d(t, { i: () => r });
			function r(e) {
				if (!e) return "";
				let t = String(e);
				if ("u" > typeof document) {
					let e = document.createElement("div");
					return (
						(e.innerHTML = t),
						(e.textContent || e.innerText || "")
							.replace(/<[^>]*>/g, " ")
							.replace(/\s+/g, " ")
							.trim()
					);
				}
				return t
					.replace(/<[^>]*>/g, " ")
					.replace(/\s+/g, " ")
					.trim();
			}
		},
		47279: (e, t, i) => {
			i.d(t, { C1: () => T, bL: () => b });
			var r = i(12115),
				s = i(47527),
				n = i(68599),
				a = i(70379),
				o = i(98979),
				d = i(83417),
				c = i(63509),
				l = i(83935),
				u = i(99354),
				m = i(95155),
				h = "Checkbox",
				[f, p] = (0, n.A)(h),
				[v, y] = f(h);
			function x(e) {
				let {
						__scopeCheckbox: t,
						checked: i,
						children: s,
						defaultChecked: n,
						disabled: a,
						form: d,
						name: c,
						onCheckedChange: l,
						required: u,
						value: f = "on",
						internal_do_not_use_render: p,
					} = e,
					[y, x] = (0, o.i)({ prop: i, defaultProp: n ?? !1, onChange: l, caller: h }),
					[g, _] = r.useState(null),
					[b, S] = r.useState(null),
					T = r.useRef(!1),
					N = !g || !!d || !!g.closest("form"),
					j = {
						checked: y,
						disabled: a,
						setChecked: x,
						control: g,
						setControl: _,
						name: c,
						form: d,
						value: f,
						hasConsumerStoppedPropagationRef: T,
						required: u,
						defaultChecked: !k(n) && n,
						isFormControl: N,
						bubbleInput: b,
						setBubbleInput: S,
					};
				return (0, m.jsx)(v, {
					scope: t,
					...j,
					children: "function" == typeof p ? p(j) : s,
				});
			}
			var g = "CheckboxTrigger",
				_ = r.forwardRef(({ __scopeCheckbox: e, onKeyDown: t, onClick: i, ...n }, o) => {
					let {
							control: d,
							value: c,
							disabled: l,
							checked: h,
							required: f,
							setControl: p,
							setChecked: v,
							hasConsumerStoppedPropagationRef: x,
							isFormControl: _,
							bubbleInput: b,
						} = y(g, e),
						S = (0, s.s)(o, p),
						T = r.useRef(h);
					return (
						r.useEffect(() => {
							let e = d?.form;
							if (e) {
								let t = () => v(T.current);
								return (
									e.addEventListener("reset", t),
									() => e.removeEventListener("reset", t)
								);
							}
						}, [d, v]),
						(0, m.jsx)(u.sG.button, {
							type: "button",
							role: "checkbox",
							"aria-checked": k(h) ? "mixed" : h,
							"aria-required": f,
							"data-state": O(h),
							"data-disabled": l ? "" : void 0,
							disabled: l,
							value: c,
							...n,
							ref: S,
							onKeyDown: (0, a.mK)(t, (e) => {
								"Enter" === e.key && e.preventDefault();
							}),
							onClick: (0, a.mK)(i, (e) => {
								v((e) => !!k(e) || !e),
									b &&
										_ &&
										((x.current = e.isPropagationStopped()),
										x.current || e.stopPropagation());
							}),
						})
					);
				});
			_.displayName = g;
			var b = r.forwardRef((e, t) => {
				let {
					__scopeCheckbox: i,
					name: r,
					checked: s,
					defaultChecked: n,
					required: a,
					disabled: o,
					value: d,
					onCheckedChange: c,
					form: l,
					...u
				} = e;
				return (0, m.jsx)(x, {
					__scopeCheckbox: i,
					checked: s,
					defaultChecked: n,
					disabled: o,
					required: a,
					onCheckedChange: c,
					name: r,
					form: l,
					value: d,
					internal_do_not_use_render: ({ isFormControl: e }) =>
						(0, m.jsxs)(m.Fragment, {
							children: [
								(0, m.jsx)(_, { ...u, ref: t, __scopeCheckbox: i }),
								e && (0, m.jsx)(j, { __scopeCheckbox: i }),
							],
						}),
				});
			});
			b.displayName = h;
			var S = "CheckboxIndicator",
				T = r.forwardRef((e, t) => {
					let { __scopeCheckbox: i, forceMount: r, ...s } = e,
						n = y(S, i);
					return (0, m.jsx)(l.C, {
						present: r || k(n.checked) || !0 === n.checked,
						children: (0, m.jsx)(u.sG.span, {
							"data-state": O(n.checked),
							"data-disabled": n.disabled ? "" : void 0,
							...s,
							ref: t,
							style: { pointerEvents: "none", ...e.style },
						}),
					});
				});
			T.displayName = S;
			var N = "CheckboxBubbleInput",
				j = r.forwardRef(({ __scopeCheckbox: e, ...t }, i) => {
					let {
							control: n,
							hasConsumerStoppedPropagationRef: a,
							checked: o,
							defaultChecked: l,
							required: h,
							disabled: f,
							name: p,
							value: v,
							form: x,
							bubbleInput: g,
							setBubbleInput: _,
						} = y(N, e),
						b = (0, s.s)(i, _),
						S = (0, d.Z)(o),
						T = (0, c.X)(n);
					r.useEffect(() => {
						if (!g) return;
						let e = Object.getOwnPropertyDescriptor(
								window.HTMLInputElement.prototype,
								"checked"
							).set,
							t = !a.current;
						if (S !== o && e) {
							let i = new Event("click", { bubbles: t });
							(g.indeterminate = k(o)), e.call(g, !k(o) && o), g.dispatchEvent(i);
						}
					}, [g, S, o, a]);
					let j = r.useRef(!k(o) && o);
					return (0, m.jsx)(u.sG.input, {
						type: "checkbox",
						"aria-hidden": !0,
						defaultChecked: l ?? j.current,
						required: h,
						disabled: f,
						name: p,
						value: v,
						form: x,
						...t,
						tabIndex: -1,
						ref: b,
						style: {
							...t.style,
							...T,
							position: "absolute",
							pointerEvents: "none",
							opacity: 0,
							margin: 0,
							transform: "translateX(-100%)",
						},
					});
				});
			function k(e) {
				return "indeterminate" === e;
			}
			function O(e) {
				return k(e) ? "indeterminate" : e ? "checked" : "unchecked";
			}
			j.displayName = N;
		},
		48368: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("file-text", [
				[
					"path",
					{
						d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
						key: "1oefj6",
					},
				],
				["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
				["path", { d: "M10 9H8", key: "b1mrlr" }],
				["path", { d: "M16 13H8", key: "t4e002" }],
				["path", { d: "M16 17H8", key: "z1uh3a" }],
			]);
		},
		49387: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		61878: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		63509: (e, t, i) => {
			i.d(t, { X: () => n });
			var r = i(12115),
				s = i(66294);
			function n(e) {
				let [t, i] = r.useState(void 0);
				return (
					(0, s.N)(() => {
						if (e) {
							i({ width: e.offsetWidth, height: e.offsetHeight });
							let t = new ResizeObserver((t) => {
								let r, s;
								if (!Array.isArray(t) || !t.length) return;
								let n = t[0];
								if ("borderBoxSize" in n) {
									let e = n.borderBoxSize,
										t = Array.isArray(e) ? e[0] : e;
									(r = t.inlineSize), (s = t.blockSize);
								} else (r = e.offsetWidth), (s = e.offsetHeight);
								i({ width: r, height: s });
							});
							return t.observe(e, { box: "border-box" }), () => t.unobserve(e);
						}
						i(void 0);
					}, [e]),
					t
				);
			}
		},
		66348: (e, t, i) => {
			i.d(t, {
				$K: () => x,
				AQ: () => M,
				CD: () => n,
				E3: () => p,
				Fe: () => v,
				Jm: () => f,
				Lo: () => T,
				MH: () => A,
				PJ: () => _,
				Qn: () => l,
				RJ: () => C,
				TQ: () => $,
				WA: () => y,
				XF: () => J,
				YM: () => d,
				YW: () => u,
				Z6: () => z,
				Z7: () => N,
				_1: () => j,
				_B: () => w,
				aL: () => S,
				b3: () => O,
				kZ: () => P,
				kd: () => E,
				mU: () => k,
				nY: () => c,
				ns: () => I,
				qS: () => b,
				qr: () => m,
				rv: () => g,
				vS: () => a,
				wu: () => o,
				xb: () => h,
			});
			var r = i(49876);
			let s = "dms.api.masters";
			async function n(e) {
				return (0, r.AT)(`/api/method/${s}.list_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						include_discontinued: +!!e?.include_discontinued,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function a(e) {
				return (0, r.AT)(`/api/method/${s}.get_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function o(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function d(e) {
				return (0, r.AT)(`/api/method/${s}.list_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
						active_filter: e?.active_filter || "active",
					}),
				});
			}
			async function c(e) {
				return (0, r.AT)(`/api/method/${s}.get_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function l(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function u(e) {
				return (0, r.AT)(`/api/method/${s}.create_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function m(e, t) {
				return (0, r.AT)(`/api/method/${s}.add_vehicle_service_item_models`, {
					method: "POST",
					body: JSON.stringify({ name: e, vehicle_models: t }),
				});
			}
			async function h(e) {
				return (0, r.AT)(`/api/method/${s}.list_vehicle_service_item_names`, {
					method: "POST",
					body: JSON.stringify({ search: e?.search || null, limit: e?.limit ?? 100 }),
				});
			}
			async function f(e) {
				return (0, r.AT)(`/api/method/${s}.bulk_update_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function p(e) {
				return (0, r.AT)(`/api/method/${s}.list_item_prices`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						price_list: e?.price_list || null,
						selling: +(e?.selling !== !1),
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function v(e) {
				return (0, r.AT)(`/api/method/${s}.get_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function y(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function x(e) {
				return (0, r.AT)(`/api/method/${s}.create_item_price`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function g(e) {
				return (0, r.AT)(`/api/method/${s}.list_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function _(e) {
				return (0, r.AT)(`/api/method/${s}.create_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function b(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function S(e) {
				return (0, r.AT)(`/api/method/${s}.delete_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function T(e) {
				return (0, r.AT)(`/api/method/${s}.list_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function N(e) {
				return (0, r.AT)(`/api/method/${s}.create_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function j(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function k(e) {
				return (0, r.AT)(`/api/method/${s}.delete_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function O(e) {
				return (0, r.AT)(`/api/method/${s}.list_vehicle_models`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						brand: e?.brand || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function w(e) {
				return (0, r.AT)(`/api/method/${s}.get_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function A(e) {
				return (0, r.AT)(`/api/method/${s}.create_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function J(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function $(e, t) {
				return (0, r.AT)(`/api/method/${s}.create_vehicle_item_group`, {
					method: "POST",
					body: JSON.stringify({ item_group: e, parent_item_group: t || null }),
				});
			}
			async function P() {
				return (0, r.AT)(`/api/method/${s}.get_masters_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function C(e) {
				return (0, r.AT)(`/api/method/${s}.list_vehicle_service_packages`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function E(e) {
				return (0, r.AT)(`/api/method/${s}.get_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function M(e) {
				return (0, r.AT)(`/api/method/${s}.create_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function z(e, t) {
				return (0, r.AT)(`/api/method/${s}.update_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function I(e) {
				return (0, r.AT)(`/api/method/${s}.delete_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
		},
		68459: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
			]);
		},
		79984: (e, t, i) => {
			i.d(t, { BT: () => d, Wu: () => c, ZB: () => o, Zp: () => n, aR: () => a });
			var r = i(95155);
			i(12115);
			var s = i(91337);
			function n({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card",
					className: (0, s.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function a({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-header",
					className: (0, s.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-title",
					className: (0, s.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-description",
					className: (0, s.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-content",
					className: (0, s.cn)("px-4", e),
					...t,
				});
			}
		},
		83417: (e, t, i) => {
			i.d(t, { Z: () => s });
			var r = i(12115);
			function s(e) {
				let t = r.useRef({ value: e, previous: e });
				return r.useMemo(
					() => (
						t.current.value !== e &&
							((t.current.previous = t.current.value), (t.current.value = e)),
						t.current.previous
					),
					[e]
				);
			}
		},
		84437: (e, t, i) => {
			i.d(t, { S: () => o });
			var r = i(95155);
			i(12115);
			var s = i(47279),
				n = i(94514),
				a = i(91337);
			function o({ className: e, ...t }) {
				return (0, r.jsx)(s.bL, {
					"data-slot": "checkbox",
					className: (0, a.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...t,
					children: (0, r.jsx)(s.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, r.jsx)(n.A, { className: "size-3.5" }),
					}),
				});
			}
		},
	},
]);
