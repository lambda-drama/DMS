"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4519],
	{
		31521: (e, t, a) => {
			a.d(t, { P: () => r });
			var s = a(12115);
			function r(e, t, a) {
				let r = `dms:listFilters:${e}:${t}`,
					[n, i] = (0, s.useState)(() => {
						let e = (function (e) {
							try {
								let t = window.localStorage.getItem(e);
								if (null === t) return;
								return JSON.parse(t);
							} catch {
								return;
							}
						})(r);
						return void 0 === e ? a : e;
					});
				return (
					(0, s.useEffect)(() => {
						try {
							JSON.stringify(n) === JSON.stringify(a)
								? window.localStorage.removeItem(r)
								: window.localStorage.setItem(r, JSON.stringify(n));
						} catch {}
					}, [r, n, a]),
					[n, i]
				);
			}
		},
		39540: (e, t, a) => {
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
		43447: (e, t, a) => {
			a.d(t, {
				SQ: () => o,
				_2: () => d,
				lp: () => c,
				mB: () => u,
				rI: () => i,
				ty: () => l,
			});
			var s = a(95155);
			a(12115);
			var r = a(61108),
				n = a(91337);
			function i({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "dropdown-menu", ...e });
			}
			function l({ ...e }) {
				return (0, s.jsx)(r.l9, { "data-slot": "dropdown-menu-trigger", ...e });
			}
			function o({ className: e, sideOffset: t = 4, ...a }) {
				return (0, s.jsx)(r.ZL, {
					children: (0, s.jsx)(r.UC, {
						"data-slot": "dropdown-menu-content",
						sideOffset: t,
						className: (0, n.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
							e
						),
						...a,
					}),
				});
			}
			function d({ className: e, inset: t, variant: a = "default", ...i }) {
				return (0, s.jsx)(r.q7, {
					"data-slot": "dropdown-menu-item",
					"data-inset": t,
					"data-variant": a,
					className: (0, n.cn)(
						"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
				});
			}
			function c({ className: e, inset: t, ...a }) {
				return (0, s.jsx)(r.JU, {
					"data-slot": "dropdown-menu-label",
					"data-inset": t,
					className: (0, n.cn)("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", e),
					...a,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)(r.wv, {
					"data-slot": "dropdown-menu-separator",
					className: (0, n.cn)("bg-border -mx-1 my-1 h-px", e),
					...t,
				});
			}
		},
		45752: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("arrow-down-up", [
				["path", { d: "m3 16 4 4 4-4", key: "1co6wj" }],
				["path", { d: "M7 20V4", key: "1yoxec" }],
				["path", { d: "m21 8-4-4-4 4", key: "1c9v7m" }],
				["path", { d: "M17 4v16", key: "7dpous" }],
			]);
		},
		49580: (e, t, a) => {
			a.d(t, { e: () => d });
			var s = a(95155),
				r = a(12115),
				n = a(81262),
				i = a(5240),
				l = a(4474),
				o = a(43447);
			function d({
				doctype: e,
				docName: t,
				noLetterhead: a = 0,
				triggerPrint: c = 0,
				className: u,
				variant: m = "default",
			}) {
				let [h, x] = (0, r.useState)(null),
					[p, f] = (0, r.useState)(!1),
					[g, j] = (0, r.useState)(!1);
				(0, r.useEffect)(() => {
					if (!e) return void x(["Standard"]);
					let t = !1;
					return (
						(0, i.Iy)(e)
							.then((e) => {
								t || x(e.length ? e : ["Standard"]);
							})
							.catch(() => {
								t || x(["Standard"]);
							}),
						() => {
							t = !0;
						}
					);
				}, [e]);
				let v = (s) => {
						e &&
							t &&
							(function (e, t, a = "Standard", s) {
								let r = new URLSearchParams();
								r.set("doctype", e),
									r.set("name", t),
									r.set("format", a),
									r.set("trigger_print", String(s?.triggerPrint ?? 0)),
									r.set("no_letterhead", String(s?.noLetterhead ?? 0));
								let n = window.location.origin;
								window.open(
									`${n}/printview?${r.toString()}`,
									"_blank",
									"noopener,noreferrer"
								);
							})(e, t, s, { noLetterhead: a, triggerPrint: c });
					},
					y = async (a) => {
						if ((a.stopPropagation(), a.preventDefault(), !g && e && t)) {
							j(!0);
							try {
								let t = h;
								if (!t) {
									let a = await (0, i.Iy)(e);
									(t = a.length ? a : ["Standard"]), x(t);
								}
								if (t.length <= 1) return void v(t[0] || "Standard");
								f(!0);
							} catch {
								v("Standard");
							} finally {
								j(!1);
							}
						}
					},
					b = "icon" === m,
					w = {
						type: "button",
						variant: b ? "ghost" : "outline",
						size: b ? "icon" : "sm",
						className: u,
						"aria-label": "Print",
						title: "Print",
						disabled: g,
					};
				return h && h.length > 1
					? (0, s.jsxs)(o.rI, {
							open: p,
							onOpenChange: f,
							children: [
								(0, s.jsx)(o.ty, {
									asChild: !0,
									children: (0, s.jsxs)(l.$, {
										...w,
										onClick: (e) => e.stopPropagation(),
										children: [
											(0, s.jsx)(n.A, {
												className: b ? "h-4 w-4" : "h-4 w-4 mr-2",
											}),
											!b && "Print",
										],
									}),
								}),
								(0, s.jsxs)(o.SQ, {
									align: "end",
									side: "bottom",
									sideOffset: 4,
									collisionPadding: 8,
									className: "min-w-[180px] z-[9999]",
									onClick: (e) => e.stopPropagation(),
									children: [
										(0, s.jsx)(o.lp, {
											className: "text-xs font-medium text-muted-foreground",
											children: "Print format",
										}),
										(0, s.jsx)(o.mB, {}),
										h.map((e) =>
											(0, s.jsx)(
												o._2,
												{
													onSelect: () => {
														v(e), f(!1);
													},
													children: e,
												},
												e
											)
										),
									],
								}),
							],
					  })
					: (0, s.jsxs)(l.$, {
							...w,
							onClick: y,
							children: [
								(0, s.jsx)(n.A, { className: b ? "h-4 w-4" : "h-4 w-4 mr-2" }),
								!b && "Print",
							],
					  });
			}
		},
		60504: (e, t, a) => {
			a.d(t, { A: () => o });
			var s = a(12115),
				r = a(90901),
				n = a(44855),
				i = a(12180);
			let l = i.r
					? (e) => {
							e();
					  }
					: s.startTransition,
				o = (0, r.Ht)(n.Ay, () => (e, t, a = {}) => {
					let { mutate: n } = (0, r.iX)(),
						o = (0, s.useRef)(e),
						d = (0, s.useRef)(t),
						c = (0, s.useRef)(a),
						u = (0, s.useRef)(0),
						[m, h, x] = ((e) => {
							let [, t] = (0, s.useState)({}),
								a = (0, s.useRef)(!1),
								r = (0, s.useRef)(e),
								n = (0, s.useRef)({ data: !1, error: !1, isValidating: !1 }),
								l = (0, s.useCallback)((e) => {
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
								[r, n.current, l]
							);
						})({ data: i.U, error: i.U, isMutating: !1 }),
						p = m.current,
						f = (0, s.useCallback)(async (e, t) => {
							let [a, s] = (0, i.s)(o.current);
							if (!d.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!a) throw Error("Can’t trigger the mutation: missing key.");
							let r = (0, i.m)(
									(0, i.m)({ populateCache: !1, throwOnError: !0 }, c.current),
									t
								),
								m = (0, i.o)();
							(u.current = m), x({ isMutating: !0 });
							try {
								let t = await n(
									a,
									d.current(s, { arg: e }),
									(0, i.m)(r, { throwOnError: !0 })
								);
								return (
									u.current <= m &&
										(l(() => x({ data: t, isMutating: !1, error: void 0 })),
										null == r.onSuccess || r.onSuccess.call(r, t, a, r)),
									t
								);
							} catch (e) {
								if (
									u.current <= m &&
									(l(() => x({ error: e, isMutating: !1 })),
									null == r.onError || r.onError.call(r, e, a, r),
									r.throwOnError)
								)
									throw e;
							}
						}, []),
						g = (0, s.useCallback)(() => {
							(u.current = (0, i.o)()), x({ data: i.U, error: i.U, isMutating: !1 });
						}, []);
					return (
						(0, i.u)(() => {
							(o.current = e), (d.current = t), (c.current = a);
						}),
						{
							trigger: f,
							reset: g,
							get data() {
								return (h.data = !0), p.data;
							},
							get error() {
								return (h.error = !0), p.error;
							},
							get isMutating() {
								return (h.isMutating = !0), p.isMutating;
							},
						}
					);
				});
		},
		61991: (e, t, a) => {
			a.d(t, { w: () => i });
			var s = a(95155);
			a(12115);
			var r = a(89803),
				n = a(91337);
			function i({ className: e, orientation: t = "horizontal", decorative: a = !0, ...l }) {
				return (0, s.jsx)(r.b, {
					"data-slot": "separator",
					decorative: a,
					orientation: t,
					className: (0, n.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...l,
				});
			}
		},
		68459: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
			]);
		},
		69996: (e, t, a) => {
			a.r(t), a.d(t, { default: () => I });
			var s = a(95155),
				r = a(12115),
				n = a(63360),
				i = a(10086),
				l = a(2958),
				o = a(4474),
				d = a(52959),
				c = a(39658),
				u = a(79792),
				m = a(31521),
				h = a(39540),
				x = a(79984),
				p = a(26518),
				f = a(83786),
				g = a(38291),
				j = a(42074),
				v = a(93408),
				y = a(99916),
				b = a(36020),
				w = a(21219),
				N = a(45752),
				_ = a(68459),
				k = a(6296),
				S = a(66609),
				C = a(98883),
				A = a(49580);
			function M(e) {
				return 1 === e ? "Submitted" : 2 === e ? "Cancelled" : "Draft";
			}
			function E() {
				return { id: crypto.randomUUID(), item_code: "", item_name: "", qty: "1" };
			}
			function I() {
				let { canCreate: e } = (0, n.Sk)(),
					{ data: t, isLoading: a } = (0, b.Rr)(),
					[I, P] = (0, r.useState)(""),
					[J, R] = (0, r.useState)(null),
					[$, z] = (0, r.useState)(!0),
					[L, O] = (0, r.useState)("Material Issue"),
					[T, D] = (0, r.useState)(() => new Date().toISOString().split("T")[0]),
					[q, F] = (0, r.useState)(""),
					[Q, V] = (0, r.useState)(""),
					[B, H] = (0, r.useState)(""),
					[U, Z] = (0, r.useState)([E()]),
					[W, X] = (0, r.useState)(""),
					[Y, G] = (0, r.useState)([]),
					[K, ee] = (0, r.useState)(!1),
					[et, ea] = (0, r.useState)([]),
					[es, er] = (0, r.useState)(!0),
					[en, ei] = (0, m.P)("stock-entry", "recent_from", ""),
					[el, eo] = (0, m.P)("stock-entry", "recent_to", ""),
					[ed, ec] = (0, r.useState)(!1),
					[eu, em] = (0, r.useState)(null),
					[eh, ex] = (0, r.useState)(null),
					[ep, ef] = (0, r.useState)(!1),
					eg = !!(en || el),
					ej = (0, r.useCallback)(() => {
						ei(""), eo("");
					}, [ei, eo]);
				(0, b.Tr)(t, a, I, (e) => P(e.name));
				let ev = (0, r.useCallback)(
						async (e) => {
							z(!0);
							try {
								let t = await w.gk(e || void 0);
								R(t),
									!I && t.company && P(t.company),
									!q && t.default_warehouse && F(t.default_warehouse),
									!Q && t.default_warehouse && V(t.default_warehouse);
							} catch (e) {
								S.o.error(
									e instanceof Error
										? e.message
										: "Failed to load stock defaults"
								);
							} finally {
								z(!1);
							}
						},
						[I, q, Q]
					),
					ey = (0, r.useCallback)(async () => {
						er(!0);
						try {
							ea(
								await w.$m({
									limit: 20,
									posting_from: en || void 0,
									posting_to: el || void 0,
								})
							);
						} catch {
							ea([]);
						} finally {
							er(!1);
						}
					}, [en, el]);
				(0, r.useEffect)(() => {
					ev(I);
				}, [I, ev]),
					(0, r.useEffect)(() => {
						ey();
					}, [ey]),
					(0, r.useEffect)(() => {
						if (!eu) return void ex(null);
						let e = !1;
						return (
							ef(!0),
							(async () => {
								try {
									let t = await w.aK(eu);
									e || ex(t);
								} catch (t) {
									e ||
										(ex(null),
										S.o.error(
											t instanceof Error
												? t.message
												: "Failed to load stock entry"
										));
								} finally {
									e || ef(!1);
								}
							})(),
							() => {
								e = !0;
							}
						);
					}, [eu]),
					(0, r.useEffect)(() => {
						let e = !1,
							t = window.setTimeout(async () => {
								ee(!0);
								try {
									let t = await w.ju(
										W || void 0,
										q || Q || J?.default_warehouse || void 0,
										25
									);
									if (e) return;
									G(
										t.map((e) => ({
											value: e.item_code,
											label: e.item_name || e.item_code,
											description: [
												e.item_code,
												null != e.qty_on_hand
													? `On hand: ${e.qty_on_hand}`
													: "",
											]
												.filter(Boolean)
												.join(" \xb7 "),
										}))
									);
								} catch {
									e || G([]);
								} finally {
									e || ee(!1);
								}
							}, 250);
						return () => {
							(e = !0), window.clearTimeout(t);
						};
					}, [W, q, Q, J?.default_warehouse]);
				let eb = (0, r.useMemo)(
						() =>
							(J?.warehouses ?? []).map((e) => ({
								value: e.name,
								label: (0, w.ZO)(e),
							})),
						[J?.warehouses]
					),
					ew = "Material Issue" === L || "Material Transfer" === L,
					eN = "Material Receipt" === L || "Material Transfer" === L,
					e_ = async () => {
						if (!e("stock-entry")) return;
						let t = U.filter((e) => e.item_code && Number(e.qty) > 0).map((e) => ({
							item_code: e.item_code,
							qty: Number(e.qty),
							basic_rate: e.basic_rate ? Number(e.basic_rate) : void 0,
						}));
						if (!I) return void S.o.error("Select a company");
						if (!t.length) return void S.o.error("Add at least one item");
						ec(!0);
						try {
							let e = await w.rW({
								company: I,
								stock_entry_type: L,
								posting_date: T,
								s_warehouse: ew ? q : void 0,
								t_warehouse: eN ? Q : void 0,
								expense_account: J?.stock_adjustment_account || void 0,
								remarks: B || void 0,
								submit: !0,
								items: t,
							});
							S.o.success(`Stock Entry ${e.name} submitted`), Z([E()]), H(""), ey();
						} catch (e) {
							S.o.error(
								e instanceof Error ? e.message : "Failed to create stock entry"
							);
						} finally {
							ec(!1);
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
										(0, s.jsx)(N.A, { className: "h-6 w-6" }),
										"Stock Entry",
									],
								}),
								(0, s.jsx)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children:
										"Issue, receive, or transfer stock between DMS-configured warehouses.",
								}),
							],
						}),
						(0, s.jsxs)(x.Zp, {
							children: [
								(0, s.jsxs)(x.aR, {
									children: [
										(0, s.jsx)(x.ZB, { children: "New stock entry" }),
										(0, s.jsxs)(x.BT, {
											children: [
												"Warehouses are limited to DMS Settings (parts store, WIP, workshops, DMS-flagged warehouses).",
												J?.stock_adjustment_account
													? ` Adjustment account: ${J.stock_adjustment_account}.`
													: " Configure Stock Adjustment Account on DMS Settings → Company Defaults.",
											],
										}),
									],
								}),
								(0, s.jsxs)(x.Wu, {
									className: "space-y-4",
									children: [
										(0, s.jsxs)("div", {
											className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
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
															value: I,
															onValueChange: P,
															placeholder: "Select company",
															isLoading: a,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(u.J, {
															children: "Entry type *",
														}),
														(0, s.jsxs)(p.l6, {
															value: L,
															onValueChange: O,
															children: [
																(0, s.jsx)(p.bq, {
																	children: (0, s.jsx)(p.yv, {}),
																}),
																(0, s.jsx)(p.gC, {
																	children: (
																		J?.stock_entry_types ?? []
																	).map((e) =>
																		(0, s.jsx)(
																			p.eb,
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
															children: "Posting date *",
														}),
														(0, s.jsx)(c.p, {
															type: "date",
															value: T,
															onChange: (e) => D(e.target.value),
														}),
													],
												}),
												ew &&
													(0, s.jsxs)("div", {
														className: "space-y-2",
														children: [
															(0, s.jsx)(u.J, {
																children: "Source warehouse *",
															}),
															(0, s.jsx)(i.Zi, {
																options: eb,
																value: q,
																onValueChange: F,
																placeholder: $
																	? "Loading…"
																	: "Select warehouse",
																disabled: $ || 0 === eb.length,
															}),
														],
													}),
												eN &&
													(0, s.jsxs)("div", {
														className: "space-y-2",
														children: [
															(0, s.jsx)(u.J, {
																children: "Target warehouse *",
															}),
															(0, s.jsx)(i.Zi, {
																options: eb,
																value: Q,
																onValueChange: V,
																placeholder: $
																	? "Loading…"
																	: "Select warehouse",
																disabled: $ || 0 === eb.length,
															}),
														],
													}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-3",
											children: [
												(0, s.jsx)(u.J, { children: "Items *" }),
												U.map((e, t) =>
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
																		(0, s.jsx)(l.Y, {
																			options: Y,
																			value: e.item_code,
																			valueLabel:
																				e.item_name ||
																				e.item_code ||
																				void 0,
																			onValueChange: (e) => {
																				let a = Y.find(
																					(t) =>
																						t.value ===
																						e
																				);
																				Z((s) =>
																					s.map((s, r) =>
																						r === t
																							? {
																									...s,
																									item_code:
																										e,
																									item_name:
																										a?.label ||
																										e,
																							  }
																							: s
																					)
																				);
																			},
																			onItemCreated: (e) => {
																				Z((a) =>
																					a.map((a, s) =>
																						s === t
																							? {
																									...a,
																									item_code:
																										e.item_code,
																									item_name:
																										e.item_name,
																									basic_rate:
																										null !=
																											e.standard_rate &&
																										e.standard_rate >
																											0
																											? String(
																													e.standard_rate
																											  )
																											: a.basic_rate,
																							  }
																							: a
																					)
																				),
																					G((t) =>
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
																			onSearchChange: X,
																			initialItemCode: W,
																			defaultItemGroup:
																				J?.default_item_group,
																			autoCreateSpareParts:
																				J?.auto_create_spare_parts,
																			placeholder:
																				"Search spare part",
																			isLoading: K,
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
																				Z((a) =>
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
																"Material Receipt" === L &&
																	(0, s.jsxs)("div", {
																		className:
																			"md:col-span-3 space-y-2",
																		children: [
																			(0, s.jsx)(u.J, {
																				className:
																					"text-xs",
																				children:
																					"Rate (optional)",
																			}),
																			(0, s.jsx)(c.p, {
																				type: "number",
																				min: "0",
																				step: "any",
																				value:
																					e.basic_rate ||
																					"",
																				onChange: (e) =>
																					Z((a) =>
																						a.map(
																							(
																								a,
																								s
																							) =>
																								s ===
																								t
																									? {
																											...a,
																											basic_rate:
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
																	children: (0, s.jsx)(o.$, {
																		type: "button",
																		variant: "ghost",
																		size: "icon",
																		disabled: U.length <= 1,
																		onClick: () =>
																			Z((e) =>
																				e.filter(
																					(e, a) =>
																						a !== t
																				)
																			),
																		children: (0, s.jsx)(_.A, {
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
													onClick: () => Z((e) => [...e, E()]),
													label: "Add line",
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)(u.J, { children: "Remarks" }),
												(0, s.jsx)(h.T, {
													rows: 2,
													value: B,
													onChange: (e) => H(e.target.value),
												}),
											],
										}),
										(0, s.jsx)(j.h, {
											children: (0, s.jsx)(o.$, {
												type: "button",
												onClick: () => void e_(),
												disabled: ed || !e("stock-entry"),
												children: ed
													? "Submitting…"
													: "Submit stock entry",
											}),
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(x.Zp, {
							children: [
								(0, s.jsxs)(x.aR, {
									className:
										"flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
									children: [
										(0, s.jsx)(x.ZB, { children: "Recent stock entries" }),
										(0, s.jsxs)("div", {
											className:
												"flex flex-col gap-3 sm:flex-row sm:items-end",
											children: [
												(0, s.jsxs)("div", {
													className:
														"grid grid-cols-1 gap-3 sm:grid-cols-2",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, s.jsx)(u.J, {
																	htmlFor:
																		"stock-entry-recent-from",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Date from",
																}),
																(0, s.jsx)(c.p, {
																	id: "stock-entry-recent-from",
																	type: "date",
																	value: en,
																	max: el || void 0,
																	onChange: (e) =>
																		ei(e.target.value),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, s.jsx)(u.J, {
																	htmlFor:
																		"stock-entry-recent-to",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Date to",
																}),
																(0, s.jsx)(c.p, {
																	id: "stock-entry-recent-to",
																	type: "date",
																	value: el,
																	min: en || void 0,
																	onChange: (e) =>
																		eo(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, s.jsx)(y.r, {
													onClear: ej,
													disabled: !eg,
													className: "self-end sm:self-auto",
												}),
											],
										}),
									],
								}),
								(0, s.jsx)(x.Wu, {
									children: es
										? (0, s.jsx)("div", {
												className: "flex justify-center py-8",
												children: (0, s.jsx)(k.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: 0 === et.length
										? (0, s.jsx)("p", {
												className: "text-sm text-muted-foreground py-4",
												children: "No stock entries yet.",
										  })
										: (0, s.jsxs)(f.XI, {
												children: [
													(0, s.jsx)(f.A0, {
														children: (0, s.jsxs)(f.Hj, {
															children: [
																(0, s.jsx)(f.nd, {
																	children: "ID",
																}),
																(0, s.jsx)(f.nd, {
																	children: "Type",
																}),
																(0, s.jsx)(f.nd, {
																	children: "Company",
																}),
																(0, s.jsx)(f.nd, {
																	children: "Date",
																}),
																(0, s.jsx)(f.nd, {
																	children: "Status",
																}),
																(0, s.jsx)(f.nd, {
																	className:
																		"text-right w-[52px]",
																	children: "Print",
																}),
															],
														}),
													}),
													(0, s.jsx)(f.BF, {
														children: et.map((e) =>
															(0, s.jsxs)(
																f.Hj,
																{
																	className:
																		"cursor-pointer hover:bg-muted/50",
																	onClick: () => em(e.name),
																	children: [
																		(0, s.jsx)(f.nA, {
																			className:
																				"font-medium text-dms-green",
																			children: e.name,
																		}),
																		(0, s.jsx)(f.nA, {
																			children:
																				e.stock_entry_type,
																		}),
																		(0, s.jsx)(f.nA, {
																			children: e.company,
																		}),
																		(0, s.jsx)(f.nA, {
																			children:
																				e.posting_date,
																		}),
																		(0, s.jsx)(f.nA, {
																			children: (0, s.jsx)(
																				g.E,
																				{
																					variant:
																						1 ===
																						e.docstatus
																							? "default"
																							: "secondary",
																					children: M(
																						e.docstatus
																					),
																				}
																			),
																		}),
																		(0, s.jsx)(f.nA, {
																			className:
																				"text-right",
																			children: (0, s.jsx)(
																				v.m,
																				{
																					doctype:
																						"Stock Entry",
																					docName:
																						e.name,
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
						(0, s.jsx)(C.BN, {
							open: !!eu,
							onOpenChange: (e) => {
								e || em(null);
							},
							title: eh?.name || eu || "",
							subtitle: eh?.stock_entry_type,
							badge: eh ? { label: M(eh.docstatus) } : void 0,
							isLoading: ep,
							footer: eu
								? (0, s.jsxs)("div", {
										className: "flex flex-col gap-2 w-full",
										children: [
											(0, s.jsx)(A.e, {
												doctype: "Stock Entry",
												docName: eu,
												className: "w-full",
											}),
											(0, s.jsx)(o.$, {
												type: "button",
												variant: "outline",
												className: "w-full",
												onClick: () => em(null),
												children: "Close",
											}),
										],
								  })
								: null,
							children: eh
								? (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsxs)(C.JH, {
												title: "Entry",
												children: [
													(0, s.jsx)(C.Qb, {
														label: "Type",
														value: eh.stock_entry_type,
													}),
													(0, s.jsx)(C.Qb, {
														label: "Company",
														value: eh.company,
													}),
													(0, s.jsx)(C.Qb, {
														label: "Posting date",
														value: eh.posting_date,
													}),
													(0, s.jsx)(C.Qb, {
														label: "Outgoing",
														value:
															null != eh.total_outgoing_value
																? eh.total_outgoing_value.toLocaleString()
																: void 0,
													}),
													(0, s.jsx)(C.Qb, {
														label: "Incoming",
														value:
															null != eh.total_incoming_value
																? eh.total_incoming_value.toLocaleString()
																: void 0,
													}),
													eh.remarks
														? (0, s.jsx)(C.Qb, {
																label: "Remarks",
																value: eh.remarks,
														  })
														: null,
												],
											}),
											(0, s.jsx)(C.JH, {
												title: `Items (${(eh.items || []).length})`,
												children: (0, s.jsx)("div", {
													className: "rounded-md border overflow-x-auto",
													children: (0, s.jsxs)(f.XI, {
														children: [
															(0, s.jsx)(f.A0, {
																children: (0, s.jsxs)(f.Hj, {
																	children: [
																		(0, s.jsx)(f.nd, {
																			children: "Item",
																		}),
																		(0, s.jsx)(f.nd, {
																			className:
																				"text-right",
																			children: "Qty",
																		}),
																		(0, s.jsx)(f.nd, {
																			children: "From",
																		}),
																		(0, s.jsx)(f.nd, {
																			children: "To",
																		}),
																		(0, s.jsx)(f.nd, {
																			className:
																				"text-right",
																			children: "Rate",
																		}),
																		(0, s.jsx)(f.nd, {
																			className:
																				"text-right",
																			children: "Amount",
																		}),
																	],
																}),
															}),
															(0, s.jsx)(f.BF, {
																children: (eh.items || []).map(
																	(e, t) =>
																		(0, s.jsxs)(
																			f.Hj,
																			{
																				children: [
																					(0, s.jsxs)(
																						f.nA,
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
																						f.nA,
																						{
																							className:
																								"text-right",
																							children:
																								e.qty,
																						}
																					),
																					(0, s.jsx)(
																						f.nA,
																						{
																							children:
																								e.s_warehouse ||
																								"—",
																						}
																					),
																					(0, s.jsx)(
																						f.nA,
																						{
																							children:
																								e.t_warehouse ||
																								"—",
																						}
																					),
																					(0, s.jsx)(
																						f.nA,
																						{
																							className:
																								"text-right",
																							children:
																								null !=
																								e.basic_rate
																									? e.basic_rate.toLocaleString()
																									: "—",
																						}
																					),
																					(0, s.jsx)(
																						f.nA,
																						{
																							className:
																								"text-right",
																							children:
																								null !=
																								e.amount
																									? e.amount.toLocaleString()
																									: "—",
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
		81262: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("printer", [
				[
					"path",
					{
						d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
						key: "143wyd",
					},
				],
				["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
				["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }],
			]);
		},
		89803: (e, t, a) => {
			a.d(t, { b: () => c });
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
				l = "horizontal",
				o = ["horizontal", "vertical"],
				d = s.forwardRef((e, t) => {
					var a;
					let { decorative: s, orientation: r = l, ...d } = e,
						c = ((a = r), o.includes(a)) ? r : l;
					return (0, n.jsx)(i.div, {
						"data-orientation": c,
						...(s
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === c ? c : void 0,
									role: "separator",
							  }),
						...d,
						ref: t,
					});
				});
			d.displayName = "Separator";
			var c = d;
		},
		93408: (e, t, a) => {
			a.d(t, { m: () => n });
			var s = a(95155),
				r = a(49580);
			function n({ children: e, doctype: t, docName: a, showPrint: i = !0 }) {
				return (0, s.jsxs)("div", {
					className: "flex items-center justify-end gap-0.5",
					onClick: (e) => e.stopPropagation(),
					children: [
						e,
						i ? (0, s.jsx)(r.e, { variant: "icon", doctype: t, docName: a }) : null,
					],
				});
			}
		},
		98883: (e, t, a) => {
			a.d(t, { Qb: () => v, JH: () => j, BN: () => g });
			var s = a(95155);
			a(12115);
			var r = a(29483),
				n = a(33210),
				i = a(91337);
			function l({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "sheet", ...e });
			}
			function o({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function c({ className: e, children: t, side: a = "right", ...l }) {
				return (0, s.jsxs)(o, {
					children: [
						(0, s.jsx)(d, {}),
						(0, s.jsxs)(r.UC, {
							"data-slot": "sheet-content",
							className: (0, i.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === a &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === a &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === a &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === a &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...l,
							children: [
								t,
								(0, s.jsxs)(r.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, s.jsx)(n.A, { className: "size-4" }),
										(0, s.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, i.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "sheet-title",
					className: (0, i.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "sheet-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var x = a(38291),
				p = a(61991),
				f = a(6296);
			function g({
				open: e,
				onOpenChange: t,
				title: a,
				subtitle: r,
				badge: n,
				isLoading: o,
				onOpenInDesk: d,
				footer: j,
				contentScroll: v = "outer",
				children: y,
			}) {
				return (0, s.jsx)(l, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(c, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, s.jsx)(u, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, s.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, s.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, s.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, s.jsx)(m, {
														className: "text-lg",
														children: a,
													}),
													n &&
														(0, s.jsx)(x.E, {
															variant: n.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: n.label,
														}),
												],
											}),
											r && (0, s.jsx)(h, { className: "mt-1", children: r }),
										],
									}),
								}),
							}),
							(0, s.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							o
								? (0, s.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, s.jsx)(f.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsx)("div", {
												className: (0, i.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === v
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: y,
											}),
											j &&
												(0, s.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: j,
												}),
										],
								  }),
						],
					}),
				});
			}
			function j({ title: e, children: t, className: a }) {
				return (0, s.jsxs)("div", {
					className: (0, i.cn)("space-y-2", a),
					children: [
						(0, s.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, s.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, s.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: t,
						}),
					],
				});
			}
			function v({ label: e, value: t, className: a }) {
				return (0, s.jsxs)("div", {
					className: (0, i.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						a
					),
					children: [
						(0, s.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, s.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: t || "—",
						}),
					],
				});
			}
		},
		99916: (e, t, a) => {
			a.d(t, { r: () => l });
			var s = a(95155),
				r = a(33210),
				n = a(4474),
				i = a(91337);
			function l({
				onClear: e,
				disabled: t = !1,
				label: a = "Clear filters",
				className: o,
			}) {
				return (0, s.jsxs)(n.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: t,
					"aria-label": a,
					title: a,
					className: (0, i.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", o),
					children: [
						(0, s.jsx)(r.A, { "aria-hidden": "true" }),
						(0, s.jsx)("span", { className: "hidden sm:inline", children: a }),
					],
				});
			}
		},
	},
]);
