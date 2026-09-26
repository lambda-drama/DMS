"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4035],
	{
		38785: (e, t, a) => {
			a.d(t, { o: () => p });
			var s = a(95155),
				n = a(12115),
				r = a(4474),
				i = a(43447),
				l = a(93408),
				d = a(56313),
				o = a(21219),
				c = a(60285),
				m = a(45752),
				u = a(38807),
				x = a(66609);
			function p({
				name: e,
				actions: t,
				canStockEntry: a,
				canPurchaseReceipt: f,
				context: h,
				onDone: g,
			}) {
				let [j, b] = (0, n.useState)(!1),
					[v, w] = (0, n.useState)(!1),
					[N, y] = (0, n.useState)(null);
				if (!t.length) return null;
				let k = async (t) => {
					if (N) {
						b(!0);
						try {
							let a =
								"stock_entry" === N.action
									? await o.XG(e)
									: await o.qH(e, { supplier: t?.supplier });
							x.o.success(`${a.doctype || "Document"} ${a.name} created`),
								w(!1),
								y(null),
								g?.();
						} catch (e) {
							x.o.error(e instanceof Error ? e.message : "Action failed");
						} finally {
							b(!1);
						}
					}
				};
				return (0, s.jsxs)(s.Fragment, {
					children: [
						(0, s.jsx)(l.m, {
							doctype: "Material Request",
							docName: e,
							children: (0, s.jsxs)(i.rI, {
								children: [
									(0, s.jsx)(i.ty, {
										asChild: !0,
										children: (0, s.jsx)(r.$, {
											variant: "ghost",
											size: "icon",
											disabled: j,
											children: (0, s.jsx)(c.A, { className: "h-4 w-4" }),
										}),
									}),
									(0, s.jsx)(i.SQ, {
										align: "end",
										children: t.map((e) => {
											let t =
												j ||
												("stock_entry" === e.action && !a) ||
												("purchase_receipt" === e.action && !f);
											return (0, s.jsxs)(
												i._2,
												{
													disabled: t,
													onClick: () => {
														("stock_entry" === e.action && !a) ||
															(("purchase_receipt" !== e.action ||
																f) &&
																(y(e), w(!0)));
													},
													children: [
														"stock_entry" === e.action
															? (0, s.jsx)(m.A, {
																	className: "h-4 w-4 mr-2",
															  })
															: (0, s.jsx)(u.A, {
																	className: "h-4 w-4 mr-2",
															  }),
														e.label,
													],
												},
												e.action
											);
										}),
									}),
								],
							}),
						}),
						(0, s.jsx)(d.$, {
							open: v,
							onOpenChange: (e) => {
								w(e), e || j || y(null);
							},
							action: N,
							materialRequestName: e,
							context: h,
							loading: j,
							onConfirm: k,
						}),
					],
				});
			}
		},
		43447: (e, t, a) => {
			a.d(t, {
				SQ: () => d,
				_2: () => o,
				lp: () => c,
				mB: () => m,
				rI: () => i,
				ty: () => l,
			});
			var s = a(95155);
			a(12115);
			var n = a(61108),
				r = a(91337);
			function i({ ...e }) {
				return (0, s.jsx)(n.bL, { "data-slot": "dropdown-menu", ...e });
			}
			function l({ ...e }) {
				return (0, s.jsx)(n.l9, { "data-slot": "dropdown-menu-trigger", ...e });
			}
			function d({ className: e, sideOffset: t = 4, ...a }) {
				return (0, s.jsx)(n.ZL, {
					children: (0, s.jsx)(n.UC, {
						"data-slot": "dropdown-menu-content",
						sideOffset: t,
						className: (0, r.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
							e
						),
						...a,
					}),
				});
			}
			function o({ className: e, inset: t, variant: a = "default", ...i }) {
				return (0, s.jsx)(n.q7, {
					"data-slot": "dropdown-menu-item",
					"data-inset": t,
					"data-variant": a,
					className: (0, r.cn)(
						"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
				});
			}
			function c({ className: e, inset: t, ...a }) {
				return (0, s.jsx)(n.JU, {
					"data-slot": "dropdown-menu-label",
					"data-inset": t,
					className: (0, r.cn)("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", e),
					...a,
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)(n.wv, {
					"data-slot": "dropdown-menu-separator",
					className: (0, r.cn)("bg-border -mx-1 my-1 h-px", e),
					...t,
				});
			}
		},
		49580: (e, t, a) => {
			a.d(t, { e: () => o });
			var s = a(95155),
				n = a(12115),
				r = a(81262),
				i = a(5240),
				l = a(4474),
				d = a(43447);
			function o({
				doctype: e,
				docName: t,
				noLetterhead: a = 0,
				triggerPrint: c = 0,
				className: m,
				variant: u = "default",
			}) {
				let [x, p] = (0, n.useState)(null),
					[f, h] = (0, n.useState)(!1),
					[g, j] = (0, n.useState)(!1);
				(0, n.useEffect)(() => {
					if (!e) return void p(["Standard"]);
					let t = !1;
					return (
						(0, i.Iy)(e)
							.then((e) => {
								t || p(e.length ? e : ["Standard"]);
							})
							.catch(() => {
								t || p(["Standard"]);
							}),
						() => {
							t = !0;
						}
					);
				}, [e]);
				let b = (s) => {
						e &&
							t &&
							(function (e, t, a = "Standard", s) {
								let n = new URLSearchParams();
								n.set("doctype", e),
									n.set("name", t),
									n.set("format", a),
									n.set("trigger_print", String(s?.triggerPrint ?? 0)),
									n.set("no_letterhead", String(s?.noLetterhead ?? 0));
								let r = window.location.origin;
								window.open(
									`${r}/printview?${n.toString()}`,
									"_blank",
									"noopener,noreferrer"
								);
							})(e, t, s, { noLetterhead: a, triggerPrint: c });
					},
					v = async (a) => {
						if ((a.stopPropagation(), a.preventDefault(), !g && e && t)) {
							j(!0);
							try {
								let t = x;
								if (!t) {
									let a = await (0, i.Iy)(e);
									(t = a.length ? a : ["Standard"]), p(t);
								}
								if (t.length <= 1) return void b(t[0] || "Standard");
								h(!0);
							} catch {
								b("Standard");
							} finally {
								j(!1);
							}
						}
					},
					w = "icon" === u,
					N = {
						type: "button",
						variant: w ? "ghost" : "outline",
						size: w ? "icon" : "sm",
						className: m,
						"aria-label": "Print",
						title: "Print",
						disabled: g,
					};
				return x && x.length > 1
					? (0, s.jsxs)(d.rI, {
							open: f,
							onOpenChange: h,
							children: [
								(0, s.jsx)(d.ty, {
									asChild: !0,
									children: (0, s.jsxs)(l.$, {
										...N,
										onClick: (e) => e.stopPropagation(),
										children: [
											(0, s.jsx)(r.A, {
												className: w ? "h-4 w-4" : "h-4 w-4 mr-2",
											}),
											!w && "Print",
										],
									}),
								}),
								(0, s.jsxs)(d.SQ, {
									align: "end",
									side: "bottom",
									sideOffset: 4,
									collisionPadding: 8,
									className: "min-w-[180px] z-[9999]",
									onClick: (e) => e.stopPropagation(),
									children: [
										(0, s.jsx)(d.lp, {
											className: "text-xs font-medium text-muted-foreground",
											children: "Print format",
										}),
										(0, s.jsx)(d.mB, {}),
										x.map((e) =>
											(0, s.jsx)(
												d._2,
												{
													onSelect: () => {
														b(e), h(!1);
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
							...N,
							onClick: v,
							children: [
								(0, s.jsx)(r.A, { className: w ? "h-4 w-4" : "h-4 w-4 mr-2" }),
								!w && "Print",
							],
					  });
			}
		},
		56313: (e, t, a) => {
			a.d(t, { $: () => p });
			var s = a(95155),
				n = a(12115),
				r = a(70521),
				i = a(4474),
				l = a(79792),
				d = a(10086),
				o = a(21219),
				c = a(38807),
				m = a(45752),
				u = a(85877),
				x = a(6296);
			function p({
				open: e,
				onOpenChange: t,
				action: a,
				materialRequestName: f,
				context: h,
				loading: g,
				onConfirm: j,
			}) {
				let [b, v] = (0, n.useState)(""),
					[w, N] = (0, n.useState)([]),
					[y, k] = (0, n.useState)(!1),
					[_, S] = (0, n.useState)(!1),
					C = a?.action === "purchase_receipt";
				if (
					((0, n.useEffect)(() => {
						if (!e || !C) return;
						let t = !1;
						return (
							(async () => {
								S(!0), k(!0);
								try {
									let [e, a] = await Promise.all([
										o.mx(h?.company || void 0),
										o.Zj(void 0, 50),
									]);
									if (t) return;
									N(
										a.map((e) => ({
											value: e.name,
											label: e.supplier_name || e.name,
										}))
									),
										e.default_supplier
											? v(e.default_supplier)
											: 1 === a.length
											? v(a[0].name)
											: v("");
								} catch {
									t || (N([]), v(""));
								} finally {
									t || (S(!1), k(!1));
								}
							})(),
							() => {
								t = !0;
							}
						);
					}, [e, C, h?.company]),
					(0, n.useEffect)(() => {
						e || (v(""), N([]));
					}, [e]),
					!a)
				)
					return null;
				let z =
						"purchase_receipt" === a.action
							? {
									title: "Create Purchase Receipt",
									verb: "Create & submit purchase receipt",
									summary:
										"A purchase receipt will be created for all pending lines and submitted. Stock will be received into the requested warehouse and linked to this material request.",
									Icon: c.A,
							  }
							: {
									title: "Create Stock Entry",
									verb: "Create & submit stock entry",
									summary:
										"A stock entry will be created for all pending lines and submitted. Quantities will be moved or issued according to the material request purpose.",
									Icon: m.A,
							  },
					P = h
						? "Material Transfer" === h.material_request_type && h.from_warehouse
							? `${h.from_warehouse} → ${h.warehouse || "—"}`
							: h.warehouse || null
						: null,
					q = g || (C && (!b || _));
				return (0, s.jsx)(r.Lt, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(r.EO, {
						className: "max-w-md gap-0 overflow-hidden p-0",
						children: [
							(0, s.jsx)("div", {
								className: "border-b bg-muted/40 px-6 py-5",
								children: (0, s.jsx)(r.wd, {
									className: "space-y-2 text-left",
									children: (0, s.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [
											(0, s.jsx)("div", {
												className:
													"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
												children: (0, s.jsx)(z.Icon, {
													className: "h-5 w-5",
												}),
											}),
											(0, s.jsxs)("div", {
												className: "min-w-0 space-y-1",
												children: [
													(0, s.jsx)(r.r7, {
														className: "text-lg",
														children: z.title,
													}),
													(0, s.jsx)(r.$v, {
														className: "text-sm leading-relaxed",
														children: z.summary,
													}),
												],
											}),
										],
									}),
								}),
							}),
							(0, s.jsxs)("div", {
								className: "space-y-4 px-6 py-5",
								children: [
									(0, s.jsx)("div", {
										className: "rounded-lg border bg-card p-4 shadow-sm",
										children: (0, s.jsxs)("dl", {
											className: "space-y-3 text-sm",
											children: [
												(0, s.jsxs)("div", {
													className:
														"flex items-start justify-between gap-4",
													children: [
														(0, s.jsx)("dt", {
															className:
																"text-muted-foreground shrink-0",
															children: "Material request",
														}),
														(0, s.jsx)("dd", {
															className:
																"font-mono font-medium text-right break-all",
															children: f,
														}),
													],
												}),
												h?.material_request_type &&
													(0, s.jsxs)("div", {
														className:
															"flex items-start justify-between gap-4",
														children: [
															(0, s.jsx)("dt", {
																className:
																	"text-muted-foreground shrink-0",
																children: "Purpose",
															}),
															(0, s.jsx)("dd", {
																className:
																	"font-medium text-right",
																children: h.material_request_type,
															}),
														],
													}),
												P &&
													(0, s.jsxs)("div", {
														className:
															"flex items-start justify-between gap-4",
														children: [
															(0, s.jsxs)("dt", {
																className:
																	"text-muted-foreground shrink-0 flex items-center gap-1.5",
																children: [
																	(0, s.jsx)(u.A, {
																		className: "h-3.5 w-3.5",
																	}),
																	"Warehouse",
																],
															}),
															(0, s.jsx)("dd", {
																className:
																	"font-medium text-right break-all",
																children: P,
															}),
														],
													}),
												(h?.pending_lines != null ||
													h?.pending_qty != null) &&
													(0, s.jsxs)("div", {
														className:
															"flex items-start justify-between gap-4 border-t pt-3",
														children: [
															(0, s.jsx)("dt", {
																className:
																	"text-muted-foreground shrink-0",
																children: "Pending",
															}),
															(0, s.jsxs)("dd", {
																className:
																	"font-medium text-right",
																children: [
																	null != h.pending_lines
																		? `${h.pending_lines} line(s)`
																		: "",
																	null != h.pending_lines &&
																	null != h.pending_qty
																		? " \xb7 "
																		: "",
																	null != h.pending_qty
																		? `${h.pending_qty} qty`
																		: "",
																],
															}),
														],
													}),
											],
										}),
									}),
									C &&
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)(l.J, {
													children: "Spare-parts supplier *",
												}),
												(0, s.jsx)(d.Zi, {
													options: w,
													value: b,
													onValueChange: v,
													placeholder: _
														? "Loading suppliers…"
														: "Select supplier",
													isLoading: y || _,
												}),
												(0, s.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children:
														"Uses DMS default supplier when configured. Override here if needed.",
												}),
											],
										}),
									(0, s.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children:
											"This action submits the document immediately. You can review it in ERPNext if needed.",
									}),
								],
							}),
							(0, s.jsxs)(r.ck, {
								className: "border-t bg-muted/20 px-6 py-4 sm:justify-end",
								children: [
									(0, s.jsx)(r.Zr, { disabled: g, children: "Cancel" }),
									(0, s.jsx)(i.$, {
										type: "button",
										disabled: q,
										onClick: () =>
											void j(C ? { supplier: b || void 0 } : void 0),
										children: g
											? (0, s.jsxs)(s.Fragment, {
													children: [
														(0, s.jsx)(x.A, {
															className: "h-4 w-4 animate-spin",
														}),
														"Submitting…",
													],
											  })
											: z.verb,
									}),
								],
							}),
						],
					}),
				});
			}
		},
		61991: (e, t, a) => {
			a.d(t, { w: () => i });
			var s = a(95155);
			a(12115);
			var n = a(89803),
				r = a(91337);
			function i({ className: e, orientation: t = "horizontal", decorative: a = !0, ...l }) {
				return (0, s.jsx)(n.b, {
					"data-slot": "separator",
					decorative: a,
					orientation: t,
					className: (0, r.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...l,
				});
			}
		},
		70521: (e, t, a) => {
			a.d(t, {
				$v: () => p,
				EO: () => c,
				Lt: () => l,
				Rx: () => f,
				Zr: () => h,
				ck: () => u,
				r7: () => x,
				wd: () => m,
			});
			var s = a(95155);
			a(12115);
			var n = a(284),
				r = a(91337),
				i = a(4474);
			function l({ ...e }) {
				return (0, s.jsx)(n.bL, { "data-slot": "alert-dialog", ...e });
			}
			function d({ ...e }) {
				return (0, s.jsx)(n.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function o({ className: e, ...t }) {
				return (0, s.jsx)(n.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, s.jsxs)(d, {
					children: [
						(0, s.jsx)(o, {}),
						(0, s.jsx)(n.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, r.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, r.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(n.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, r.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(n.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function f({ className: e, ...t }) {
				return (0, s.jsx)(n.rc, { className: (0, r.cn)((0, i.r)(), e), ...t });
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(n.ZD, {
					className: (0, r.cn)((0, i.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		93408: (e, t, a) => {
			a.d(t, { m: () => r });
			var s = a(95155),
				n = a(49580);
			function r({ children: e, doctype: t, docName: a, showPrint: i = !0 }) {
				return (0, s.jsxs)("div", {
					className: "flex items-center justify-end gap-0.5",
					onClick: (e) => e.stopPropagation(),
					children: [
						e,
						i ? (0, s.jsx)(n.e, { variant: "icon", doctype: t, docName: a }) : null,
					],
				});
			}
		},
		98883: (e, t, a) => {
			a.d(t, { Qb: () => b, JH: () => j, BN: () => g });
			var s = a(95155);
			a(12115);
			var n = a(29483),
				r = a(33210),
				i = a(91337);
			function l({ ...e }) {
				return (0, s.jsx)(n.bL, { "data-slot": "sheet", ...e });
			}
			function d({ ...e }) {
				return (0, s.jsx)(n.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function o({ className: e, ...t }) {
				return (0, s.jsx)(n.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, i.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function c({ className: e, children: t, side: a = "right", ...l }) {
				return (0, s.jsxs)(d, {
					children: [
						(0, s.jsx)(o, {}),
						(0, s.jsxs)(n.UC, {
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
								(0, s.jsxs)(n.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, s.jsx)(r.A, { className: "size-4" }),
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
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, i.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)(n.hE, {
					"data-slot": "sheet-title",
					className: (0, i.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(n.VY, {
					"data-slot": "sheet-description",
					className: (0, i.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var p = a(38291),
				f = a(61991),
				h = a(6296);
			function g({
				open: e,
				onOpenChange: t,
				title: a,
				subtitle: n,
				badge: r,
				isLoading: d,
				onOpenInDesk: o,
				footer: j,
				contentScroll: b = "outer",
				children: v,
			}) {
				return (0, s.jsx)(l, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(c, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, s.jsx)(m, {
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
													(0, s.jsx)(u, {
														className: "text-lg",
														children: a,
													}),
													r &&
														(0, s.jsx)(p.E, {
															variant: r.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: r.label,
														}),
												],
											}),
											n && (0, s.jsx)(x, { className: "mt-1", children: n }),
										],
									}),
								}),
							}),
							(0, s.jsx)(f.w, { className: "bg-(--dms-green)/20" }),
							d
								? (0, s.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, s.jsx)(h.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsx)("div", {
												className: (0, i.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === b
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: v,
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
			function b({ label: e, value: t, className: a }) {
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
	},
]);
