(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3462, 7440],
	{
		29161: (e, t, a) => {
			"use strict";
			a.r(t), a.d(t, { default: () => w });
			var s = a(95155),
				r = a(12115),
				n = a(63360),
				i = a(10086),
				o = a(2958),
				l = a(4474),
				d = a(52959),
				c = a(39658),
				u = a(79792),
				m = a(39540),
				h = a(79984),
				p = a(83786),
				x = a(38291),
				g = a(42074),
				f = a(36020),
				v = a(21219),
				y = a(98307),
				j = a(68459),
				b = a(6296),
				_ = a(66609);
			function k() {
				return { id: crypto.randomUUID(), item_code: "", item_name: "", qty: "0" };
			}
			function w() {
				let { canCreate: e } = (0, n.Sk)(),
					{ data: t, isLoading: a } = (0, f.Rr)(),
					[w, N] = (0, r.useState)(""),
					[S, C] = (0, r.useState)(null),
					[M, A] = (0, r.useState)(!0),
					[E, R] = (0, r.useState)(""),
					[q, D] = (0, r.useState)(() => new Date().toISOString().split("T")[0]),
					[J, O] = (0, r.useState)(""),
					[I, L] = (0, r.useState)([k()]),
					[P, z] = (0, r.useState)(""),
					[T, V] = (0, r.useState)([]),
					[Z, U] = (0, r.useState)(!1),
					[$, B] = (0, r.useState)([]),
					[H, F] = (0, r.useState)(!0),
					[W, G] = (0, r.useState)(!1);
				(0, f.Tr)(t, a, w, (e) => N(e.name));
				let X = (0, r.useCallback)(
						async (e) => {
							A(!0);
							try {
								let t = await v.gk(e || void 0);
								C(t),
									!w && t.company && N(t.company),
									!E && t.default_warehouse && R(t.default_warehouse);
							} catch (e) {
								_.o.error(
									e instanceof Error
										? e.message
										: "Failed to load stock defaults"
								);
							} finally {
								A(!1);
							}
						},
						[w, E]
					),
					Y = (0, r.useCallback)(async () => {
						F(!0);
						try {
							B(await v.bn({ limit: 20 }));
						} catch {
							B([]);
						} finally {
							F(!1);
						}
					}, []);
				(0, r.useEffect)(() => {
					X(w);
				}, [w, X]),
					(0, r.useEffect)(() => {
						Y();
					}, [Y]),
					(0, r.useEffect)(() => {
						let e = !1,
							t = window.setTimeout(async () => {
								U(!0);
								try {
									let t = await v.ju(P || void 0, E || void 0, 25);
									if (e) return;
									V(
										t.map((e) => ({
											value: e.item_code,
											label: e.item_name || e.item_code,
											description: [
												e.item_code,
												null != e.qty_on_hand
													? `System qty: ${e.qty_on_hand}`
													: "",
											]
												.filter(Boolean)
												.join(" \xb7 "),
										}))
									);
								} catch {
									e || V([]);
								} finally {
									e || U(!1);
								}
							}, 250);
						return () => {
							(e = !0), window.clearTimeout(t);
						};
					}, [P, E]);
				let K = (0, r.useMemo)(
						() =>
							(S?.warehouses ?? []).map((e) => ({
								value: e.name,
								label: (0, v.ZO)(e),
							})),
						[S?.warehouses]
					),
					Q = async () => {
						if (!e("stock-reconciliation")) return;
						let t = I.filter((e) => e.item_code && "" !== e.qty).map((e) => ({
							item_code: e.item_code,
							qty: Number(e.qty),
							valuation_rate: e.valuation_rate ? Number(e.valuation_rate) : void 0,
						}));
						if (!w) return void _.o.error("Select a company");
						if (!E) return void _.o.error("Select a warehouse");
						if (!t.length) return void _.o.error("Add at least one item");
						G(!0);
						try {
							let e = await v.sn({
								company: w,
								warehouse: E,
								posting_date: q,
								expense_account: S?.stock_adjustment_account || void 0,
								remarks: J || void 0,
								submit: !0,
								items: t,
							});
							_.o.success(`Stock Reconciliation ${e.name} submitted`),
								L([k()]),
								O(""),
								Y();
						} catch (e) {
							_.o.error(
								e instanceof Error
									? e.message
									: "Failed to create stock reconciliation"
							);
						} finally {
							G(!1);
						}
					};
				return (0, s.jsxs)("div", {
					className: "min-w-0 space-y-6",
					children: [
						(0, s.jsx)("div", {
							children: (0, s.jsxs)("h2", {
								className:
									"text-2xl font-bold tracking-tight flex items-center gap-2",
								children: [
									(0, s.jsx)(y.A, { className: "h-6 w-6" }),
									"Stock Reconciliation",
								],
							}),
						}),
						(0, s.jsxs)(h.Zp, {
							children: [
								(0, s.jsxs)(h.aR, {
									children: [
										(0, s.jsx)(h.ZB, { children: "New reconciliation" }),
										(0, s.jsxs)(h.BT, {
											children: [
												"Enter the counted quantity per item. ERPNext compares it with system stock and books the difference.",
												S?.stock_adjustment_account
													? ` Account: ${S.stock_adjustment_account}.`
													: " Set Stock Adjustment Account on DMS Settings → Company Defaults.",
											],
										}),
									],
								}),
								(0, s.jsxs)(h.Wu, {
									className: "space-y-4",
									children: [
										(0, s.jsxs)("div", {
											className: "grid gap-4 md:grid-cols-3",
											children: [
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, { children: "Company *" }),
														(0, s.jsx)(i.Zi, {
															options: (t ?? []).map((e) => ({
																value: e.name,
																label: e.name,
															})),
															value: w,
															onValueChange: N,
															placeholder: "Select company",
															isLoading: a,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, {
															children: "Warehouse *",
														}),
														(0, s.jsx)(i.Zi, {
															options: K,
															value: E,
															onValueChange: R,
															placeholder: M
																? "Loading…"
																: "Select warehouse",
															disabled: M || 0 === K.length,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, {
															children: "Posting date *",
														}),
														(0, s.jsx)(c.p, {
															type: "date",
															value: q,
															onChange: (e) => D(e.target.value),
														}),
													],
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-3",
											children: [
												(0, s.jsx)(u.J, { children: "Items *" }),
												I.map((e, t) =>
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
																		(0, s.jsx)(o.Y, {
																			options: T,
																			value: e.item_code,
																			valueLabel:
																				e.item_name ||
																				e.item_code ||
																				void 0,
																			onValueChange: (e) => {
																				let a, s, r;
																				return (
																					(a = T.find(
																						(t) =>
																							t.value ===
																							e
																					)),
																					(r = (s =
																						a?.description?.match(
																							/System qty:\s*([0-9.]+)/
																						))
																						? s[1]
																						: void 0),
																					void L((s) =>
																						s.map(
																							(
																								s,
																								n
																							) =>
																								n ===
																								t
																									? {
																											...s,
																											item_code:
																												e,
																											item_name:
																												a?.label ||
																												e,
																											qty:
																												r ??
																												s.qty,
																									  }
																									: s
																						)
																					)
																				);
																			},
																			onItemCreated: (e) => {
																				L((a) =>
																					a.map((a, s) =>
																						s === t
																							? {
																									...a,
																									item_code:
																										e.item_code,
																									item_name:
																										e.item_name,
																									valuation_rate:
																										null !=
																											e.standard_rate &&
																										e.standard_rate >
																											0
																											? String(
																													e.standard_rate
																											  )
																											: a.valuation_rate,
																							  }
																							: a
																					)
																				),
																					V((t) =>
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
																			onSearchChange: z,
																			initialItemCode: P,
																			defaultItemGroup:
																				S?.default_item_group,
																			autoCreateSpareParts:
																				S?.auto_create_spare_parts,
																			placeholder:
																				"Search spare part",
																			isLoading: Z,
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className:
																		"md:col-span-2 space-y-2",
																	children: [
																		(0, s.jsx)(u.J, {
																			className: "text-xs",
																			children:
																				"Physical qty",
																		}),
																		(0, s.jsx)(c.p, {
																			type: "number",
																			min: "0",
																			step: "any",
																			value: e.qty,
																			onChange: (e) =>
																				L((a) =>
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
																		"md:col-span-3 space-y-2",
																	children: [
																		(0, s.jsx)(u.J, {
																			className: "text-xs",
																			children:
																				"Valuation rate (optional)",
																		}),
																		(0, s.jsx)(c.p, {
																			type: "number",
																			min: "0",
																			step: "any",
																			value:
																				e.valuation_rate ||
																				"",
																			onChange: (e) =>
																				L((a) =>
																					a.map((a, s) =>
																						s === t
																							? {
																									...a,
																									valuation_rate:
																										e
																											.target
																											.value,
																							  }
																							: a
																					)
																				),
																		}),
																	],
																}),
																(0, s.jsx)("div", {
																	className:
																		"md:col-span-2 flex justify-end",
																	children: (0, s.jsx)(l.$, {
																		type: "button",
																		variant: "ghost",
																		size: "icon",
																		disabled: I.length <= 1,
																		onClick: () =>
																			L((e) =>
																				e.filter(
																					(e, a) =>
																						a !== t
																				)
																			),
																		children: (0, s.jsx)(j.A, {
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
													onClick: () => L((e) => [...e, k()]),
													label: "Add line",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)(u.J, { children: "Remarks" }),
												(0, s.jsx)(m.T, {
													rows: 2,
													value: J,
													onChange: (e) => O(e.target.value),
												}),
											],
										}),
										(0, s.jsx)(g.h, {
											children: (0, s.jsx)(l.$, {
												type: "button",
												onClick: () => void Q(),
												disabled: W || !e("stock-reconciliation"),
												children: W
													? "Submitting…"
													: "Submit reconciliation",
											}),
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(h.Zp, {
							children: [
								(0, s.jsx)(h.aR, {
									children: (0, s.jsx)(h.ZB, {
										children: "Recent reconciliations",
									}),
								}),
								(0, s.jsx)(h.Wu, {
									children: H
										? (0, s.jsx)("div", {
												className: "flex justify-center py-8",
												children: (0, s.jsx)(b.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: 0 === $.length
										? (0, s.jsx)("p", {
												className: "text-sm text-muted-foreground py-4",
												children: "No stock reconciliations yet.",
										  })
										: (0, s.jsxs)(p.XI, {
												children: [
													(0, s.jsx)(p.A0, {
														children: (0, s.jsxs)(p.Hj, {
															children: [
																(0, s.jsx)(p.nd, {
																	children: "ID",
																}),
																(0, s.jsx)(p.nd, {
																	children: "Company",
																}),
																(0, s.jsx)(p.nd, {
																	children: "Date",
																}),
																(0, s.jsx)(p.nd, {
																	children: "Status",
																}),
															],
														}),
													}),
													(0, s.jsx)(p.BF, {
														children: $.map((e) => {
															var t;
															return (0, s.jsxs)(
																p.Hj,
																{
																	children: [
																		(0, s.jsx)(p.nA, {
																			className:
																				"font-medium",
																			children: e.name,
																		}),
																		(0, s.jsx)(p.nA, {
																			children: e.company,
																		}),
																		(0, s.jsx)(p.nA, {
																			children:
																				e.posting_date,
																		}),
																		(0, s.jsx)(p.nA, {
																			children: (0, s.jsx)(
																				x.E,
																				{
																					variant:
																						1 ===
																						e.docstatus
																							? "default"
																							: "secondary",
																					children:
																						1 ===
																						(t =
																							e.docstatus)
																							? "Submitted"
																							: 2 ===
																							  t
																							? "Cancelled"
																							: "Draft",
																				}
																			),
																		}),
																	],
																},
																e.name
															);
														}),
													}),
												],
										  }),
								}),
							],
						}),
					],
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
		51914: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		53096: (e, t, a) => {
			Promise.resolve().then(a.bind(a, 29161));
		},
		56563: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		60504: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => l });
			var s = a(12115),
				r = a(90901),
				n = a(44855),
				i = a(12180);
			let o = i.r
					? (e) => {
							e();
					  }
					: s.startTransition,
				l = (0, r.Ht)(n.Ay, () => (e, t, a = {}) => {
					let { mutate: n } = (0, r.iX)(),
						l = (0, s.useRef)(e),
						d = (0, s.useRef)(t),
						c = (0, s.useRef)(a),
						u = (0, s.useRef)(0),
						[m, h, p] = ((e) => {
							let [, t] = (0, s.useState)({}),
								a = (0, s.useRef)(!1),
								r = (0, s.useRef)(e),
								n = (0, s.useRef)({ data: !1, error: !1, isValidating: !1 }),
								o = (0, s.useCallback)((e) => {
									let s = !1,
										i = r.current;
									for (let t in e)
										Object.prototype.hasOwnProperty.call(e, t) &&
											i[t] !== e[t] &&
											((i[t] = e[t]), n.current[t] && (s = !0));
									s && !a.current && t({});
								}, []);
							return (
								(0, i.u)(
									() => (
										(a.current = !1),
										() => {
											a.current = !0;
										}
									)
								),
								[r, n.current, o]
							);
						})({ data: i.U, error: i.U, isMutating: !1 }),
						x = m.current,
						g = (0, s.useCallback)(async (e, t) => {
							let [a, s] = (0, i.s)(l.current);
							if (!d.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!a) throw Error("Can’t trigger the mutation: missing key.");
							let r = (0, i.m)(
									(0, i.m)({ populateCache: !1, throwOnError: !0 }, c.current),
									t
								),
								m = (0, i.o)();
							(u.current = m), p({ isMutating: !0 });
							try {
								let t = await n(
									a,
									d.current(s, { arg: e }),
									(0, i.m)(r, { throwOnError: !0 })
								);
								return (
									u.current <= m &&
										(o(() => p({ data: t, isMutating: !1, error: void 0 })),
										null == r.onSuccess || r.onSuccess.call(r, t, a, r)),
									t
								);
							} catch (e) {
								if (
									u.current <= m &&
									(o(() => p({ error: e, isMutating: !1 })),
									null == r.onError || r.onError.call(r, e, a, r),
									r.throwOnError)
								)
									throw e;
							}
						}, []),
						f = (0, s.useCallback)(() => {
							(u.current = (0, i.o)()), p({ data: i.U, error: i.U, isMutating: !1 });
						}, []);
					return (
						(0, i.u)(() => {
							(l.current = e), (d.current = t), (c.current = a);
						}),
						{
							trigger: g,
							reset: f,
							get data() {
								return (h.data = !0), x.data;
							},
							get error() {
								return (h.error = !0), x.error;
							},
							get isMutating() {
								return (h.isMutating = !0), x.isMutating;
							},
						}
					);
				});
		},
		68459: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
			]);
		},
		74350: (e, t, a) => {
			"use strict";
			a.d(t, {
				Cf: () => u,
				Es: () => h,
				L3: () => p,
				c7: () => m,
				lG: () => l,
				rr: () => x,
			});
			var s = a(95155);
			a(12115);
			var r = a(29483),
				n = a(33210),
				i = a(91337),
				o = a(10086);
			function l({ ...e }) {
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
				headerActions: l,
				onPointerDownOutside: m,
				onInteractOutside: h,
				onFocusOutside: p,
				...x
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
								(0, o.JM)(e.target) ? e.preventDefault() : m?.(e);
							},
							onInteractOutside: (e) => {
								(0, o.JM)(e.target) ? e.preventDefault() : h?.(e);
							},
							onFocusOutside: (e) => {
								(0, o.JM)(e.target) ? e.preventDefault() : p?.(e);
							},
							...x,
							children: [
								t,
								(l || a) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											l,
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
			function h({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, i.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "dialog-title",
					className: (0, i.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
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
			a.d(t, { b: () => l });
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
				o = s.forwardRef((e, t) =>
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
			o.displayName = "Label";
			var l = o;
		},
		94514: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
		98307: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("clipboard-list", [
				[
					"rect",
					{ width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" },
				],
				[
					"path",
					{
						d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
						key: "116196",
					},
				],
				["path", { d: "M12 11h4", key: "1jrz19" }],
				["path", { d: "M12 16h4", key: "n85exb" }],
				["path", { d: "M8 11h.01", key: "1dfujw" }],
				["path", { d: "M8 16h.01", key: "18s6g9" }],
			]);
		},
	},
	(e) => {
		e.O(
			0,
			[
				5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 6020, 2372, 5079, 6933, 8441,
				3794, 7358,
			],
			() => e((e.s = 53096))
		),
			(_N_E = e.O());
	},
]);
