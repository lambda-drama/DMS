(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2031, 2448],
	{
		33210: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
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
		62399: (e, t, a) => {
			Promise.resolve().then(a.bind(a, 92448));
		},
		74350: (e, t, a) => {
			"use strict";
			a.d(t, {
				Cf: () => u,
				Es: () => h,
				L3: () => x,
				c7: () => m,
				lG: () => o,
				rr: () => p,
			});
			var s = a(95155);
			a(12115);
			var l = a(29483),
				n = a(33210),
				r = a(91337),
				i = a(10086);
			function o({ ...e }) {
				return (0, s.jsx)(l.bL, { "data-slot": "dialog", ...e });
			}
			function d({ ...e }) {
				return (0, s.jsx)(l.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, s.jsx)(l.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, r.cn)(
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
				onInteractOutside: h,
				onFocusOutside: x,
				...p
			}) {
				return (0, s.jsxs)(d, {
					"data-slot": "dialog-portal",
					children: [
						(0, s.jsx)(c, {}),
						(0, s.jsxs)(l.UC, {
							"data-slot": "dialog-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							onPointerDownOutside: (e) => {
								(0, i.JM)(e.target) ? e.preventDefault() : m?.(e);
							},
							onInteractOutside: (e) => {
								(0, i.JM)(e.target) ? e.preventDefault() : h?.(e);
							},
							onFocusOutside: (e) => {
								(0, i.JM)(e.target) ? e.preventDefault() : x?.(e);
							},
							...p,
							children: [
								t,
								(o || a) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											o,
											a &&
												(0, s.jsxs)(l.bm, {
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
					className: (0, r.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, r.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(l.hE, {
					"data-slot": "dialog-title",
					className: (0, r.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(l.VY, {
					"data-slot": "dialog-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
		},
		79792: (e, t, a) => {
			"use strict";
			a.d(t, { J: () => r });
			var s = a(95155);
			a(12115);
			var l = a(91760),
				n = a(91337);
			function r({ className: e, ...t }) {
				return (0, s.jsx)(l.b, {
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
			var l = a(42442),
				n = a(95155),
				r = [
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
					let a = (0, l.TL)(`Primitive.${t}`),
						r = s.forwardRef((e, s) => {
							let { asChild: l, ...r } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, n.jsx)(l ? a : t, { ...r, ref: s })
							);
						});
					return (r.displayName = `Primitive.${t}`), { ...e, [t]: r };
				}, {}),
				i = s.forwardRef((e, t) =>
					(0, n.jsx)(r.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			i.displayName = "Label";
			var o = i;
		},
		92448: (e, t, a) => {
			"use strict";
			a.r(t), a.d(t, { default: () => C });
			var s = a(95155),
				l = a(12115),
				n = a(63360),
				r = a(10086),
				i = a(2958),
				o = a(4474),
				d = a(52959),
				c = a(39658),
				u = a(79792),
				m = a(79984),
				h = a(26518),
				x = a(83786),
				p = a(38291),
				j = a(42074),
				f = a(36020),
				g = a(21219),
				v = a(38785),
				y = a(98883),
				_ = a(49580),
				b = a(47045),
				w = a(68459),
				N = a(6296),
				S = a(66609);
			function q(e) {
				return 1 === e ? "Submitted" : 2 === e ? "Cancelled" : "Draft";
			}
			function k() {
				return {
					id: crypto.randomUUID(),
					item_code: "",
					item_name: "",
					qty: "1",
					uom: "",
					uomOptions: [],
				};
			}
			function C() {
				let { canCreate: e } = (0, n.Sk)(),
					{ data: t, isLoading: a } = (0, f.Rr)(),
					[C, A] = (0, l.useState)(""),
					[M, O] = (0, l.useState)(null),
					[D, I] = (0, l.useState)(!0),
					[J, E] = (0, l.useState)("Purchase"),
					[R, P] = (0, l.useState)(() => new Date().toISOString().split("T")[0]),
					[T, L] = (0, l.useState)(() => new Date().toISOString().split("T")[0]),
					[$, Q] = (0, l.useState)(""),
					[F, Z] = (0, l.useState)(""),
					[z, B] = (0, l.useState)([k()]),
					[U, V] = (0, l.useState)(""),
					[H, W] = (0, l.useState)([]),
					[X, G] = (0, l.useState)({}),
					[Y, K] = (0, l.useState)(!1),
					[ee, et] = (0, l.useState)([]),
					[ea, es] = (0, l.useState)(!0),
					[el, en] = (0, l.useState)(!1),
					[er, ei] = (0, l.useState)(null),
					[eo, ed] = (0, l.useState)(null),
					[ec, eu] = (0, l.useState)(!1),
					em = e("stock-entry"),
					eh = e("purchase-receipt");
				(0, f.Tr)(t, a, C, (e) => A(e.name));
				let ex = (0, l.useCallback)(
						async (e) => {
							I(!0);
							try {
								let t = await g.pc(e || void 0);
								O(t),
									!C && t.company && A(t.company),
									!F && t.default_warehouse && Z(t.default_warehouse),
									!$ && t.default_warehouse && Q(t.default_warehouse);
							} catch (e) {
								S.o.error(
									e instanceof Error
										? e.message
										: "Failed to load material request defaults"
								);
							} finally {
								I(!1);
							}
						},
						[C, $, F]
					),
					ep = (0, l.useCallback)(async () => {
						es(!0);
						try {
							et(await g.sE({ limit: 20 }));
						} catch {
							et([]);
						} finally {
							es(!1);
						}
					}, []);
				(0, l.useEffect)(() => {
					ex(C);
				}, [C, ex]),
					(0, l.useEffect)(() => {
						ep();
					}, [ep]),
					(0, l.useEffect)(() => {
						if (!er) return void ed(null);
						let e = !1;
						return (
							eu(!0),
							(async () => {
								try {
									let t = await g.sq(er);
									e || ed(t);
								} catch (t) {
									e ||
										(ed(null),
										S.o.error(
											t instanceof Error
												? t.message
												: "Failed to load material request"
										));
								} finally {
									e || eu(!1);
								}
							})(),
							() => {
								e = !0;
							}
						);
					}, [er]),
					(0, l.useEffect)(() => {
						let e = !1,
							t = window.setTimeout(async () => {
								K(!0);
								try {
									let t = await g.ju(
										U || void 0,
										F || $ || M?.default_warehouse || void 0,
										25
									);
									if (e) return;
									let a = {};
									W(
										t.map(
											(e) => (
												e.stock_uom && (a[e.item_code] = e.stock_uom),
												{
													value: e.item_code,
													label: e.item_name || e.item_code,
													description: [
														e.item_code,
														e.stock_uom ? `UOM: ${e.stock_uom}` : "",
														null != e.qty_on_hand
															? `On hand: ${e.qty_on_hand}`
															: "",
													]
														.filter(Boolean)
														.join(" \xb7 "),
												}
											)
										)
									),
										G((e) => ({ ...e, ...a }));
								} catch {
									e || W([]);
								} finally {
									e || K(!1);
								}
							}, 250);
						return () => {
							(e = !0), window.clearTimeout(t);
						};
					}, [U, $, F, M?.default_warehouse]);
				let ej = (0, l.useMemo)(
						() =>
							(M?.warehouses ?? []).map((e) => ({
								value: e.name,
								label: (0, g.ZO)(e),
							})),
						[M?.warehouses]
					),
					ef = "Material Transfer" === J,
					eg = "Purchase" === J || "Material Transfer" === J || "Material Issue" === J,
					ev = (0, l.useCallback)(
						async (e, t, a) => {
							let s = X[t] || "Nos";
							B((l) =>
								l.map((l, n) =>
									n === e
										? {
												...l,
												item_code: t,
												item_name: a,
												uom: s,
												uomOptions: [],
										  }
										: l
								)
							);
							try {
								let a = await g.mQ(t),
									l = a.uoms.length ? a.uoms : [{ value: s, label: s }];
								B((t) =>
									t.map((t, n) =>
										n === e
											? { ...t, uom: a.stock_uom || s, uomOptions: l }
											: t
									)
								);
							} catch {
								B((t) =>
									t.map((t, a) =>
										a === e
											? {
													...t,
													uom: s,
													uomOptions: [{ value: s, label: s }],
											  }
											: t
									)
								);
							}
						},
						[X]
					),
					ey = async () => {
						if (!e("material-request")) return;
						let t = z
							.filter((e) => e.item_code && Number(e.qty) > 0)
							.map((e) => ({
								item_code: e.item_code,
								qty: Number(e.qty),
								uom: e.uom || void 0,
							}));
						if (!C) return void S.o.error("Select a company");
						if (!t.length) return void S.o.error("Add at least one item");
						en(!0);
						try {
							let e = await g.vX({
								company: C,
								material_request_type: J,
								transaction_date: R,
								schedule_date: T,
								set_warehouse: eg ? F : void 0,
								set_from_warehouse: ef ? $ : void 0,
								submit: !0,
								items: t,
							});
							S.o.success(`Material Request ${e.name} submitted`), B([k()]), ep();
						} catch (e) {
							S.o.error(
								e instanceof Error
									? e.message
									: "Failed to create material request"
							);
						} finally {
							en(!1);
						}
					};
				return (0, s.jsxs)("div", {
					className: "min-w-0 space-y-6",
					children: [
						(0, s.jsxs)("div", {
							children: [
								(0, s.jsxs)("h2", {
									className:
										"text-2xl font-bold tracking-tight flex items-center gap-2",
									children: [
										(0, s.jsx)(b.A, { className: "h-6 w-6" }),
										"Material Request",
									],
								}),
								(0, s.jsx)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children:
										"Request spare parts for purchase, transfer, or issue from DMS-configured warehouses.",
								}),
							],
						}),
						(0, s.jsxs)(m.Zp, {
							children: [
								(0, s.jsxs)(m.aR, {
									children: [
										(0, s.jsx)(m.ZB, { children: "New material request" }),
										(0, s.jsx)(m.BT, {
											children:
												"Warehouses are limited to DMS Settings (parts store, WIP, workshops, DMS-flagged warehouses).",
										}),
									],
								}),
								(0, s.jsxs)(m.Wu, {
									className: "space-y-4",
									children: [
										(0, s.jsxs)("div", {
											className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
											children: [
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, { children: "Company *" }),
														(0, s.jsx)(r.Zi, {
															options: (t ?? []).map((e) => ({
																value: e.name,
																label: e.name,
															})),
															value: C,
															onValueChange: A,
															placeholder: "Select company",
															isLoading: a,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, { children: "Purpose *" }),
														(0, s.jsxs)(h.l6, {
															value: J,
															onValueChange: E,
															children: [
																(0, s.jsx)(h.bq, {
																	children: (0, s.jsx)(h.yv, {}),
																}),
																(0, s.jsx)(h.gC, {
																	children: (
																		M?.material_request_types ??
																		[]
																	).map((e) =>
																		(0, s.jsx)(
																			h.eb,
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
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, {
															children: "Transaction date *",
														}),
														(0, s.jsx)(c.p, {
															type: "date",
															value: R,
															onChange: (e) => P(e.target.value),
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, {
															children: "Required by *",
														}),
														(0, s.jsx)(c.p, {
															type: "date",
															value: T,
															onChange: (e) => L(e.target.value),
														}),
													],
												}),
												ef &&
													(0, s.jsxs)("div", {
														className: "space-y-2",
														children: [
															(0, s.jsx)(u.J, {
																children: "From warehouse *",
															}),
															(0, s.jsx)(r.Zi, {
																options: ej,
																value: $,
																onValueChange: Q,
																placeholder: D
																	? "Loading…"
																	: "Select warehouse",
																disabled: D || 0 === ej.length,
															}),
														],
													}),
												eg &&
													(0, s.jsxs)("div", {
														className: "space-y-2",
														children: [
															(0, s.jsx)(u.J, {
																children:
																	"Material Issue" === J
																		? "Warehouse *"
																		: "To warehouse *",
															}),
															(0, s.jsx)(r.Zi, {
																options: ej,
																value: F,
																onValueChange: Z,
																placeholder: D
																	? "Loading…"
																	: "Select warehouse",
																disabled: D || 0 === ej.length,
															}),
														],
													}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-3",
											children: [
												(0, s.jsx)(u.J, { children: "Items *" }),
												z.map((e, t) =>
													(0, s.jsxs)(
														"div",
														{
															className:
																"grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3",
															children: [
																(0, s.jsxs)("div", {
																	className:
																		"md:col-span-5 space-y-2",
																	children: [
																		(0, s.jsx)(u.J, {
																			className: "text-xs",
																			children: "Item",
																		}),
																		(0, s.jsx)(i.Y, {
																			options: H,
																			value: e.item_code,
																			valueLabel:
																				e.item_name ||
																				e.item_code ||
																				void 0,
																			onValueChange: (e) => {
																				let a = H.find(
																					(t) =>
																						t.value ===
																						e
																				);
																				ev(
																					t,
																					e,
																					a?.label || e
																				);
																			},
																			onItemCreated: (e) => {
																				ev(
																					t,
																					e.item_code,
																					e.item_name
																				),
																					W((t) =>
																						t.some(
																							(t) =>
																								t.value ===
																								e.item_code
																						)
																							? t
																							: [
																									{
																										value: e.item_code,
																										label: e.item_name,
																										description:
																											e.item_code,
																									},
																									...t,
																							  ]
																					);
																			},
																			onSearchChange: V,
																			initialItemCode: U,
																			defaultItemGroup:
																				M?.default_item_group,
																			autoCreateSpareParts:
																				M?.auto_create_spare_parts,
																			placeholder:
																				"Search spare part",
																			isLoading: Y,
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className:
																		"md:col-span-2 space-y-2",
																	children: [
																		(0, s.jsx)(u.J, {
																			className: "text-xs",
																			children: "Qty",
																		}),
																		(0, s.jsx)(c.p, {
																			type: "number",
																			min: "0",
																			step: "any",
																			value: e.qty,
																			onChange: (e) =>
																				B((a) =>
																					a.map((a, s) =>
																						s === t
																							? {
																									...a,
																									qty: e
																										.target
																										.value,
																							  }
																							: a
																					)
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className:
																		"md:col-span-2 space-y-2",
																	children: [
																		(0, s.jsx)(u.J, {
																			className: "text-xs",
																			children: "UOM",
																		}),
																		(0, s.jsxs)(h.l6, {
																			value: e.uom || void 0,
																			onValueChange: (e) =>
																				B((a) =>
																					a.map((a, s) =>
																						s === t
																							? {
																									...a,
																									uom: e,
																							  }
																							: a
																					)
																				),
																			disabled: !e.item_code,
																			children: [
																				(0, s.jsx)(h.bq, {
																					children: (0,
																					s.jsx)(h.yv, {
																						placeholder:
																							e.item_code
																								? "Select UOM"
																								: "Pick item first",
																					}),
																				}),
																				(0, s.jsx)(h.gC, {
																					children: (e
																						.uomOptions
																						.length
																						? e.uomOptions
																						: e.uom
																						? [
																								{
																									value: e.uom,
																									label: e.uom,
																								},
																						  ]
																						: []
																					).map((e) =>
																						(0, s.jsx)(
																							h.eb,
																							{
																								value: e.value,
																								children:
																									e.label,
																							},
																							e.value
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
																(0, s.jsx)("div", {
																	className:
																		"md:col-span-1 flex justify-end",
																	children: (0, s.jsx)(o.$, {
																		type: "button",
																		variant: "ghost",
																		size: "icon",
																		disabled: z.length <= 1,
																		onClick: () =>
																			B((e) =>
																				e.filter(
																					(e, a) =>
																						a !== t
																				)
																			),
																		children: (0, s.jsx)(w.A, {
																			className: "h-4 w-4",
																		}),
																	}),
																}),
															],
														},
														e.id
													)
												),
												(0, s.jsx)(d._, {
													onClick: () => B((e) => [...e, k()]),
													label: "Add line",
												}),
											],
										}),
										(0, s.jsx)(j.h, {
											children: (0, s.jsx)(o.$, {
												type: "button",
												onClick: () => void ey(),
												disabled: el || !e("material-request"),
												children: el
													? "Submitting…"
													: "Submit material request",
											}),
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(m.Zp, {
							children: [
								(0, s.jsx)(m.aR, {
									children: (0, s.jsx)(m.ZB, {
										children: "Recent material requests",
									}),
								}),
								(0, s.jsx)(m.Wu, {
									children: ea
										? (0, s.jsx)("div", {
												className: "flex justify-center py-8",
												children: (0, s.jsx)(N.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: 0 === ee.length
										? (0, s.jsx)("p", {
												className: "text-sm text-muted-foreground py-4",
												children: "No material requests yet.",
										  })
										: (0, s.jsxs)(x.XI, {
												children: [
													(0, s.jsx)(x.A0, {
														children: (0, s.jsxs)(x.Hj, {
															children: [
																(0, s.jsx)(x.nd, {
																	children: "ID",
																}),
																(0, s.jsx)(x.nd, {
																	children: "Purpose",
																}),
																(0, s.jsx)(x.nd, {
																	children: "Company",
																}),
																(0, s.jsx)(x.nd, {
																	children: "Date",
																}),
																(0, s.jsx)(x.nd, {
																	children: "Status",
																}),
																(0, s.jsx)(x.nd, {
																	className: "text-right",
																	children: "Actions",
																}),
															],
														}),
													}),
													(0, s.jsx)(x.BF, {
														children: ee.map((e) =>
															(0, s.jsxs)(
																x.Hj,
																{
																	className:
																		"cursor-pointer hover:bg-muted/50",
																	onClick: () => ei(e.name),
																	children: [
																		(0, s.jsx)(x.nA, {
																			className:
																				"font-medium text-dms-green",
																			children: e.name,
																		}),
																		(0, s.jsx)(x.nA, {
																			children:
																				e.material_request_type,
																		}),
																		(0, s.jsx)(x.nA, {
																			children: e.company,
																		}),
																		(0, s.jsx)(x.nA, {
																			children:
																				e.transaction_date,
																		}),
																		(0, s.jsx)(x.nA, {
																			children: (0, s.jsx)(
																				p.E,
																				{
																					variant:
																						1 ===
																						e.docstatus
																							? "default"
																							: "secondary",
																					children:
																						e.status ||
																						q(
																							e.docstatus
																						),
																				}
																			),
																		}),
																		(0, s.jsx)(x.nA, {
																			className:
																				"text-right",
																			children:
																				e.has_pending &&
																				e.actions?.length
																					? (0, s.jsx)(
																							v.o,
																							{
																								name: e.name,
																								actions:
																									e.actions,
																								canStockEntry:
																									em,
																								canPurchaseReceipt:
																									eh,
																								context:
																									{
																										company:
																											e.company,
																										material_request_type:
																											e.material_request_type,
																										warehouse:
																											e.set_warehouse,
																										from_warehouse:
																											e.set_from_warehouse,
																									},
																								onDone: () =>
																									void ep(),
																							}
																					  )
																					: (0, s.jsx)(
																							"span",
																							{
																								className:
																									"text-xs text-muted-foreground",
																								children:
																									"—",
																							}
																					  ),
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
							],
						}),
						(0, s.jsx)(y.BN, {
							open: !!er,
							onOpenChange: (e) => {
								e || ei(null);
							},
							title: eo?.name || er || "",
							subtitle: eo?.material_request_type,
							badge: eo ? { label: eo.status || q(eo.docstatus) } : void 0,
							isLoading: ec,
							footer: er
								? (0, s.jsxs)("div", {
										className: "flex flex-col gap-2 w-full",
										children: [
											(0, s.jsx)(_.e, {
												doctype: "Material Request",
												docName: er,
												className: "w-full",
											}),
											(0, s.jsx)(o.$, {
												type: "button",
												variant: "outline",
												className: "w-full",
												onClick: () => ei(null),
												children: "Close",
											}),
										],
								  })
								: null,
							children: eo
								? (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsxs)(y.JH, {
												title: "Request",
												children: [
													(0, s.jsx)(y.Qb, {
														label: "Type",
														value: eo.material_request_type,
													}),
													(0, s.jsx)(y.Qb, {
														label: "Company",
														value: eo.company,
													}),
													(0, s.jsx)(y.Qb, {
														label: "Transaction date",
														value: eo.transaction_date,
													}),
													(0, s.jsx)(y.Qb, {
														label: "Required by",
														value: eo.schedule_date,
													}),
													(0, s.jsx)(y.Qb, {
														label: "Status",
														value: eo.status,
													}),
													eo.set_warehouse
														? (0, s.jsx)(y.Qb, {
																label: "Warehouse",
																value: eo.set_warehouse,
														  })
														: null,
													eo.set_from_warehouse
														? (0, s.jsx)(y.Qb, {
																label: "From warehouse",
																value: eo.set_from_warehouse,
														  })
														: null,
												],
											}),
											(0, s.jsx)(y.JH, {
												title: `Items (${(eo.items || []).length})`,
												children: (0, s.jsx)("div", {
													className: "rounded-md border overflow-x-auto",
													children: (0, s.jsxs)(x.XI, {
														children: [
															(0, s.jsx)(x.A0, {
																children: (0, s.jsxs)(x.Hj, {
																	children: [
																		(0, s.jsx)(x.nd, {
																			children: "Item",
																		}),
																		(0, s.jsx)(x.nd, {
																			className:
																				"text-right",
																			children: "Qty",
																		}),
																		(0, s.jsx)(x.nd, {
																			className:
																				"text-right",
																			children: "Received",
																		}),
																		(0, s.jsx)(x.nd, {
																			className:
																				"text-right",
																			children: "Pending",
																		}),
																		(0, s.jsx)(x.nd, {
																			children: "UOM",
																		}),
																	],
																}),
															}),
															(0, s.jsx)(x.BF, {
																children: (eo.items || []).map(
																	(e, t) =>
																		(0, s.jsxs)(
																			x.Hj,
																			{
																				children: [
																					(0, s.jsxs)(
																						x.nA,
																						{
																							children:
																								[
																									(0,
																									s.jsx)(
																										"div",
																										{
																											className:
																												"font-medium",
																											children:
																												e.item_name ||
																												e.item_code,
																										}
																									),
																									(0,
																									s.jsx)(
																										"div",
																										{
																											className:
																												"text-xs text-muted-foreground",
																											children:
																												e.item_code,
																										}
																									),
																								],
																						}
																					),
																					(0, s.jsx)(
																						x.nA,
																						{
																							className:
																								"text-right",
																							children:
																								e.qty,
																						}
																					),
																					(0, s.jsx)(
																						x.nA,
																						{
																							className:
																								"text-right",
																							children:
																								null !=
																								e.received_qty
																									? e.received_qty
																									: null !=
																									  e.ordered_qty
																									? e.ordered_qty
																									: "—",
																						}
																					),
																					(0, s.jsx)(
																						x.nA,
																						{
																							className:
																								"text-right",
																							children:
																								null !=
																								e.pending_qty
																									? e.pending_qty
																									: "—",
																						}
																					),
																					(0, s.jsx)(
																						x.nA,
																						{
																							children:
																								e.uom ||
																								"—",
																						}
																					),
																				],
																			},
																			`${e.item_code}-${t}`
																		)
																),
															}),
														],
													}),
												}),
											}),
										],
								  })
								: null,
						}),
					],
				});
			}
		},
		94514: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
	(e) => {
		e.O(
			0,
			[
				5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 1108, 2069, 6020, 2372, 5079,
				6933, 4035, 8441, 3794, 7358,
			],
			() => e((e.s = 62399))
		),
			(_N_E = e.O());
	},
]);
