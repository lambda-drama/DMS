"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[5969],
	{
		58350: (e, t, s) => {
			s.r(t), s.d(t, { default: () => T });
			var a = s(95155),
				n = s(12115),
				l = s(55833),
				i = s(63360),
				r = s(36020),
				d = s(4474),
				c = s(79984),
				o = s(39658),
				m = s(79792),
				x = s(38291),
				u = s(84437),
				h = s(26518),
				g = s(83786),
				j = s(70521),
				v = s(47339),
				p = s(61878),
				f = s(49387),
				b = s(68459),
				N = s(14636),
				w = s(42869),
				y = s(20572),
				k = s(53483),
				A = s(31521),
				C = s(93408),
				_ = s(99916),
				S = s(41431),
				E = s(56031),
				P = s(66609);
			let D = [
				{ value: "all", label: "All statuses" },
				{ value: "Diagnosis In Progress", label: "Diagnosis In Progress" },
				{ value: "Diagnosis Complete", label: "Diagnosis Complete" },
				{ value: "Estimation In Progress", label: "Estimation In Progress" },
				{ value: "Pending Customer Approval", label: "Pending Approval" },
				{ value: "Accepted", label: "Accepted" },
				{ value: "Rejected", label: "Rejected" },
			];
			function L(e) {
				return "Accepted" === e
					? "default"
					: "Rejected" === e || "Cancelled" === e
					? "destructive"
					: "Pending Customer Approval" === e
					? "outline"
					: "secondary";
			}
			function z(e) {
				return !["Rejected", "Cancelled"].includes(e);
			}
			function $(e) {
				return !e.job_card && !e.diagnostic_invoice;
			}
			function T() {
				let { navigate: e } = (0, l.c)(),
					{ canWrite: t, canDelete: s } = (0, i.Sk)(),
					[T, V] = (0, A.P)("service-estimates", "search", ""),
					[M, Z] = (0, A.P)("service-estimates", "status", "all"),
					[R, F] = (0, A.P)("service-estimates", "posting_from", ""),
					[I, B] = (0, A.P)("service-estimates", "posting_to", ""),
					[J, O] = (0, n.useState)(1),
					[G, H] = (0, n.useState)(50),
					[W, q] = (0, n.useState)(null),
					[K, U] = (0, n.useState)(!1),
					[X, Y] = (0, A.P)("service-estimates", "include_vat", !1),
					Q = !!(R || I),
					ee = (0, n.useCallback)(() => {
						F(""), B("");
					}, [F, B]),
					et = {
						status: "all" === M ? void 0 : M,
						search: T || void 0,
						posting_from: R || void 0,
						posting_to: I || void 0,
					},
					{
						data: es,
						isLoading: ea,
						error: en,
						mutate: el,
					} = (0, r.Mu)({ ...et, limit: G, offset: (J - 1) * G }),
					ei = es?.total || 0,
					{
						items: er,
						loadedCount: ed,
						isLoadingMore: ec,
						loadMore: eo,
					} = (0, k.h)({
						items: es?.data,
						total: ei,
						offset: (J - 1) * G,
						resetKey: [M, T, R, I, J, G].join("|"),
						enabled: G >= k.J,
						fetchMore: async (e, t) =>
							(await S.DO({ ...et, limit: t, offset: e })).data,
					}),
					em = t("service-estimates"),
					ex = s("service-estimates");
				(0, n.useEffect)(() => {
					O(1);
				}, [T, M, R, I]);
				let eu = async () => {
					if (W) {
						U(!0);
						try {
							await S.ZL(W.name),
								P.o.success("Service estimate deleted"),
								q(null),
								await el();
						} catch (e) {
							P.o.error(
								e instanceof Error ? e.message : "Failed to delete estimate"
							);
						} finally {
							U(!1);
						}
					}
				};
				return (0, a.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, a.jsxs)(c.Zp, {
							className: "order-1 min-w-0",
							children: [
								(0, a.jsx)(c.aR, {
									className:
										"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
									children: (0, a.jsx)("div", {
										children: (0, a.jsxs)(c.ZB, {
											className: "flex items-center gap-2",
											children: [
												(0, a.jsx)(v.A, { className: "h-5 w-5" }),
												"Service Estimates",
											],
										}),
									}),
								}),
								(0, a.jsxs)(c.Wu, {
									className: "space-y-4",
									children: [
										(0, a.jsxs)("div", {
											className: "flex flex-col gap-3 sm:flex-row",
											children: [
												(0, a.jsxs)("div", {
													className: "relative flex-1",
													children: [
														(0, a.jsx)(p.A, {
															className:
																"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
														}),
														(0, a.jsx)(o.p, {
															placeholder:
																"Search estimates, customer, plate...",
															value: T,
															onChange: (e) => V(e.target.value),
															className: "pl-9",
														}),
													],
												}),
												(0, a.jsxs)(h.l6, {
													value: M,
													onValueChange: Z,
													children: [
														(0, a.jsx)(h.bq, {
															className: "w-full sm:w-[220px]",
															children: (0, a.jsx)(h.yv, {
																placeholder: "Status",
															}),
														}),
														(0, a.jsx)(h.gC, {
															children: D.map((e) =>
																(0, a.jsx)(
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
												(0, a.jsxs)("label", {
													className:
														"flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm",
													children: [
														(0, a.jsx)(u.S, {
															checked: X,
															onCheckedChange: (e) => Y(!!e),
														}),
														"Include VAT",
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className:
												"flex flex-col gap-3 sm:flex-row sm:items-end",
											children: [
												(0, a.jsxs)("div", {
													className:
														"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl lg:flex-1",
													children: [
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(m.J, {
																	htmlFor:
																		"estimate-posting-from",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Posting date from",
																}),
																(0, a.jsx)(o.p, {
																	id: "estimate-posting-from",
																	type: "date",
																	value: R,
																	max: I || void 0,
																	onChange: (e) =>
																		F(e.target.value),
																}),
															],
														}),
														(0, a.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																(0, a.jsx)(m.J, {
																	htmlFor: "estimate-posting-to",
																	className:
																		"text-xs text-muted-foreground",
																	children: "Posting date to",
																}),
																(0, a.jsx)(o.p, {
																	id: "estimate-posting-to",
																	type: "date",
																	value: I,
																	min: R || void 0,
																	onChange: (e) =>
																		B(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, a.jsx)(_.r, {
													onClear: ee,
													disabled: !Q,
													className: "self-end sm:self-auto",
												}),
											],
										}),
										ea
											? (0, a.jsx)("div", {
													className: "flex justify-center py-12",
													children: (0, a.jsx)("div", {
														className:
															"h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
													}),
											  })
											: en
											? (0, a.jsx)("p", {
													className: "py-8 text-center text-destructive",
													children: "Failed to load service estimates",
											  })
											: 0 === er.length
											? (0, a.jsx)("p", {
													className:
														"py-8 text-center text-muted-foreground",
													children: "No service estimates found",
											  })
											: (0, a.jsxs)(a.Fragment, {
													children: [
														(0, a.jsx)("div", {
															className:
																"dms-table-panel hidden md:block",
															children: (0, a.jsxs)(g.XI, {
																children: [
																	(0, a.jsx)(g.A0, {
																		children: (0, a.jsxs)(
																			g.Hj,
																			{
																				children: [
																					(0, a.jsx)(
																						g.nd,
																						{
																							children:
																								"Estimate",
																						}
																					),
																					(0, a.jsx)(
																						g.nd,
																						{
																							children:
																								"Customer",
																						}
																					),
																					(0, a.jsx)(
																						g.nd,
																						{
																							children:
																								"Vehicle",
																						}
																					),
																					(0, a.jsx)(
																						g.nd,
																						{
																							children:
																								"Status",
																						}
																					),
																					X
																						? (0,
																						  a.jsx)(
																								g.nd,
																								{
																									className:
																										"text-right",
																									children:
																										"VAT",
																								}
																						  )
																						: null,
																					(0, a.jsx)(
																						g.nd,
																						{
																							className:
																								"text-right",
																							children:
																								X
																									? "Grand Total (incl. VAT)"
																									: "Before VAT",
																						}
																					),
																					(0, a.jsx)(
																						g.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Diagnostic Fee",
																						}
																					),
																					(0, a.jsx)(
																						g.nd,
																						{
																							className:
																								"text-right w-[88px]",
																							children:
																								"Actions",
																						}
																					),
																				],
																			}
																		),
																	}),
																	(0, a.jsx)(g.BF, {
																		children: er.map((t) => {
																			let s =
																					em &&
																					z(t.status),
																				n = ex && $(t);
																			return (0, a.jsxs)(
																				g.Hj,
																				{
																					className:
																						"hover:bg-muted/50",
																					children: [
																						(0, a.jsx)(
																							g.nA,
																							{
																								children:
																									(0,
																									a.jsx)(
																										"button",
																										{
																											type: "button",
																											onClick:
																												() =>
																													e(
																														"estimate-detail",
																														{
																															id: t.name,
																														}
																													),
																											className:
																												"font-medium text-primary hover:underline",
																											children:
																												t.name,
																										}
																									),
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								children:
																									t.customer_name ||
																									t.customer,
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								children:
																									t.license_plate ||
																									t.vehicle_vin,
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								children:
																									(0,
																									a.jsx)(
																										x.E,
																										{
																											variant:
																												L(
																													t.status
																												),
																											children:
																												t.status,
																										}
																									),
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								className:
																									"text-right",
																								children:
																									X
																										? (
																												t.vat_amount ||
																												0
																										  ).toLocaleString()
																										: null,
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								className:
																									"text-right",
																								children:
																									(X
																										? t.grand_total ||
																										  0
																										: t.total_before_vat ||
																										  0
																									).toLocaleString(),
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								className:
																									"text-right",
																								children:
																									(
																										t.diagnostic_fee ||
																										0
																									).toLocaleString(),
																							}
																						),
																						(0, a.jsx)(
																							g.nA,
																							{
																								className:
																									"text-right",
																								children:
																									(0,
																									a.jsxs)(
																										C.m,
																										{
																											doctype:
																												"DMS Service Estimate",
																											docName:
																												t.name,
																											children:
																												[
																													s
																														? (0,
																														  a.jsx)(
																																d.$,
																																{
																																	variant:
																																		"ghost",
																																	size: "icon",
																																	className:
																																		"h-8 w-8",
																																	title: "Edit",
																																	onClick:
																																		() =>
																																			e(
																																				"estimate-detail",
																																				{
																																					id: t.name,
																																					tab: "estimation",
																																				}
																																			),
																																	children:
																																		(0,
																																		a.jsx)(
																																			f.A,
																																			{
																																				className:
																																					"h-4 w-4",
																																			}
																																		),
																																}
																														  )
																														: null,
																													n
																														? (0,
																														  a.jsx)(
																																d.$,
																																{
																																	variant:
																																		"ghost",
																																	size: "icon",
																																	className:
																																		"h-8 w-8 text-destructive hover:text-destructive",
																																	title: "Delete",
																																	onClick:
																																		() =>
																																			q(
																																				t
																																			),
																																	children:
																																		(0,
																																		a.jsx)(
																																			b.A,
																																			{
																																				className:
																																					"h-4 w-4",
																																			}
																																		),
																																}
																														  )
																														: null,
																												],
																										}
																									),
																							}
																						),
																					],
																				},
																				t.name
																			);
																		}),
																	}),
																],
															}),
														}),
														(0, a.jsx)("div", {
															className: "space-y-3 md:hidden",
															children: er.map((t) => {
																let s = em && z(t.status),
																	n = ex && $(t);
																return (0, a.jsxs)(
																	"div",
																	{
																		className:
																			"rounded-lg border border-border bg-card p-4",
																		children: [
																			(0, a.jsxs)("div", {
																				className:
																					"flex items-start justify-between gap-2",
																				children: [
																					(0, a.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									a.jsx)(
																										"button",
																										{
																											type: "button",
																											onClick:
																												() =>
																													e(
																														"estimate-detail",
																														{
																															id: t.name,
																														}
																													),
																											className:
																												"font-semibold text-primary hover:underline",
																											children:
																												t.name,
																										}
																									),
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"mt-1 text-sm text-muted-foreground",
																											children:
																												t.customer_name ||
																												t.customer,
																										}
																									),
																								],
																						}
																					),
																					(0, a.jsx)(
																						x.E,
																						{
																							variant:
																								L(
																									t.status
																								),
																							children:
																								t.status,
																						}
																					),
																				],
																			}),
																			(0, a.jsxs)("div", {
																				className:
																					"mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground",
																				children: [
																					(0, a.jsxs)(
																						"span",
																						{
																							className:
																								"flex items-center gap-1",
																							children:
																								[
																									(0,
																									a.jsx)(
																										N.A,
																										{
																											className:
																												"h-3.5 w-3.5",
																										}
																									),
																									t.license_plate ||
																										t.vehicle_vin,
																								],
																						}
																					),
																					(0, a.jsxs)(
																						"span",
																						{
																							className:
																								"flex items-center gap-1",
																							children:
																								[
																									(0,
																									a.jsx)(
																										w.A,
																										{
																											className:
																												"h-3.5 w-3.5",
																										}
																									),
																									X
																										? `${(
																												t.grand_total ||
																												0
																										  ).toLocaleString()} incl. VAT${
																												t.vat_amount
																													? ` (VAT ${Number(
																															t.vat_amount
																													  ).toLocaleString()})`
																													: ""
																										  }`
																										: `${(
																												t.total_before_vat ||
																												0
																										  ).toLocaleString()} before VAT`,
																								],
																						}
																					),
																				],
																			}),
																			t.posting_date &&
																				(0, a.jsx)("p", {
																					className:
																						"mt-2 text-xs text-muted-foreground",
																					children: (0,
																					E.GP)(
																						new Date(
																							t.posting_date
																						),
																						"dd MMM yyyy"
																					),
																				}),
																			(0, a.jsxs)("div", {
																				className:
																					"mt-3 flex flex-wrap items-center gap-2",
																				children: [
																					s
																						? (0,
																						  a.jsxs)(
																								d.$,
																								{
																									variant:
																										"outline",
																									size: "sm",
																									onClick:
																										() =>
																											e(
																												"estimate-detail",
																												{
																													id: t.name,
																													tab: "estimation",
																												}
																											),
																									children:
																										[
																											(0,
																											a.jsx)(
																												f.A,
																												{
																													className:
																														"mr-2 h-4 w-4",
																												}
																											),
																											"Edit",
																										],
																								}
																						  )
																						: null,
																					n
																						? (0,
																						  a.jsxs)(
																								d.$,
																								{
																									variant:
																										"outline",
																									size: "sm",
																									className:
																										"text-destructive hover:text-destructive",
																									onClick:
																										() =>
																											q(
																												t
																											),
																									children:
																										[
																											(0,
																											a.jsx)(
																												b.A,
																												{
																													className:
																														"mr-2 h-4 w-4",
																												}
																											),
																											"Delete",
																										],
																								}
																						  )
																						: null,
																					(0, a.jsx)(
																						C.m,
																						{
																							doctype:
																								"DMS Service Estimate",
																							docName:
																								t.name,
																						}
																					),
																				],
																			}),
																		],
																	},
																	t.name
																);
															}),
														}),
														(0, a.jsx)(y.$, {
															page: J,
															pageSize: G,
															totalItems: ei,
															loadedCount: ed,
															onPageChange: O,
															onPageSizeChange: (e) => {
																H(e), O(1);
															},
															onLoadMore: eo,
															isLoadingMore: ec,
														}),
													],
											  }),
									],
								}),
							],
						}),
						(0, a.jsx)(j.Lt, {
							open: !!W,
							onOpenChange: (e) => !e && q(null),
							children: (0, a.jsxs)(j.EO, {
								children: [
									(0, a.jsxs)(j.wd, {
										children: [
											(0, a.jsx)(j.r7, {
												children: "Delete service estimate?",
											}),
											(0, a.jsxs)(j.$v, {
												children: [
													"This permanently removes ",
													W?.name,
													". Estimates with a linked job card or diagnostic invoice cannot be deleted.",
												],
											}),
										],
									}),
									(0, a.jsxs)(j.ck, {
										children: [
											(0, a.jsx)(j.Zr, { disabled: K, children: "Cancel" }),
											(0, a.jsx)(j.Rx, {
												className:
													"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												onClick: (e) => {
													e.preventDefault(), eu();
												},
												disabled: K,
												children: K ? "Deleting…" : "Delete estimate",
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
		70521: (e, t, s) => {
			s.d(t, {
				$v: () => h,
				EO: () => o,
				Lt: () => r,
				Rx: () => g,
				Zr: () => j,
				ck: () => x,
				r7: () => u,
				wd: () => m,
			});
			var a = s(95155);
			s(12115);
			var n = s(284),
				l = s(91337),
				i = s(4474);
			function r({ ...e }) {
				return (0, a.jsx)(n.bL, { "data-slot": "alert-dialog", ...e });
			}
			function d({ ...e }) {
				return (0, a.jsx)(n.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)(n.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, l.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsxs)(d, {
					children: [
						(0, a.jsx)(c, {}),
						(0, a.jsx)(n.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, l.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, l.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, l.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, a.jsx)(n.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, l.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, a.jsx)(n.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, l.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function g({ className: e, ...t }) {
				return (0, a.jsx)(n.rc, { className: (0, l.cn)((0, i.r)(), e), ...t });
			}
			function j({ className: e, ...t }) {
				return (0, a.jsx)(n.ZD, {
					className: (0, l.cn)((0, i.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => d, Wu: () => c, ZB: () => r, Zp: () => l, aR: () => i });
			var a = s(95155);
			s(12115);
			var n = s(91337);
			function l({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...t,
				});
			}
		},
		84437: (e, t, s) => {
			s.d(t, { S: () => r });
			var a = s(95155);
			s(12115);
			var n = s(47279),
				l = s(94514),
				i = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)(n.bL, {
					"data-slot": "checkbox",
					className: (0, i.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...t,
					children: (0, a.jsx)(n.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, a.jsx)(l.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		99916: (e, t, s) => {
			s.d(t, { r: () => r });
			var a = s(95155),
				n = s(33210),
				l = s(4474),
				i = s(91337);
			function r({
				onClear: e,
				disabled: t = !1,
				label: s = "Clear filters",
				className: d,
			}) {
				return (0, a.jsxs)(l.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: t,
					"aria-label": s,
					title: s,
					className: (0, i.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", d),
					children: [
						(0, a.jsx)(n.A, { "aria-hidden": "true" }),
						(0, a.jsx)("span", { className: "hidden sm:inline", children: s }),
					],
				});
			}
		},
	},
]);
