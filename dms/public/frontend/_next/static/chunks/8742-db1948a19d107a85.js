"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8742],
	{
		33745: (e, a, s) => {
			s.d(a, { l: () => d });
			var t = s(95155),
				n = s(51914),
				l = s(63360),
				r = s(4474),
				i = s(91337);
			function d({ module: e, label: a, className: s, ...c }) {
				let { canCreate: o } = (0, l.Sk)();
				return o(e)
					? (0, t.jsxs)(r.$, {
							"aria-label": a,
							title: a,
							className: (0, i.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								s
							),
							...c,
							children: [
								(0, t.jsx)(n.A, { className: "h-4 w-4 shrink-0" }),
								(0, t.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: a,
								}),
							],
					  })
					: null;
			}
		},
		39540: (e, a, s) => {
			s.d(a, { T: () => l });
			var t = s(95155);
			s(12115);
			var n = s(91337);
			function l({ className: e, ...a }) {
				return (0, t.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, n.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...a,
				});
			}
		},
		52959: (e, a, s) => {
			s.d(a, { _: () => i });
			var t = s(95155),
				n = s(4474),
				l = s(51914),
				r = s(91337);
			function i({ onClick: e, label: a = "Add", className: s, disabled: d }) {
				return (0, t.jsx)("div", {
					className: (0, r.cn)("pt-1", s),
					children: (0, t.jsxs)(n.$, {
						type: "button",
						onClick: e,
						disabled: d,
						children: [(0, t.jsx)(l.A, { className: "h-4 w-4 mr-1" }), a],
					}),
				});
			}
		},
		61991: (e, a, s) => {
			s.d(a, { w: () => r });
			var t = s(95155);
			s(12115);
			var n = s(89803),
				l = s(91337);
			function r({ className: e, orientation: a = "horizontal", decorative: s = !0, ...i }) {
				return (0, t.jsx)(n.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: a,
					className: (0, l.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...i,
				});
			}
		},
		66396: (e, a, s) => {
			s.r(a), s.d(a, { default: () => W });
			var t = s(95155),
				n = s(12115),
				l = s(44855),
				r = s(55833),
				i = s(63360),
				d = s(33745),
				c = s(66609),
				o = s(98883),
				m = s(4474),
				x = s(39658),
				u = s(79792),
				h = s(79984),
				j = s(38291),
				p = s(26518),
				f = s(83786),
				g = s(70521),
				v = s(62791),
				b = s(84980),
				N = s(12651),
				y = s(77104),
				w = s(71275),
				A = s(61878),
				_ = s(92622),
				k = s(60285),
				C = s(7915),
				E = s(38399),
				S = s(68459),
				D = s(6296),
				F = s(43447),
				P = s(93408),
				Q = s(49580),
				z = s(99916),
				$ = s(20572),
				Z = s(31521),
				M = s(26898),
				J = s(94411);
			let R = [
				{ value: "all", label: "All (excl. Cancelled)" },
				{ value: "Advance", label: "Advances only" },
				{ value: "Draft", label: "Draft" },
				{ value: "Submitted", label: "Submitted" },
				{ value: "Cancelled", label: "Cancelled" },
			];
			function O(e, a) {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: a || "USD",
					minimumFractionDigits: 0,
					maximumFractionDigits: 2,
				}).format(e || 0);
			}
			function W() {
				let { viewParams: e } = (0, r.c)(),
					{ canCreate: a, canWrite: s, canCancel: W, canDelete: B } = (0, i.Sk)(),
					[H, L] = (0, Z.P)("payment-entries", "search", ""),
					[U, I] = (0, Z.P)("payment-entries", "status", "all"),
					[T, V] = (0, Z.P)("payment-entries", "posting_from", ""),
					[K, X] = (0, Z.P)("payment-entries", "posting_to", ""),
					[Y, q] = (0, n.useState)(null),
					[G, ee] = (0, n.useState)(null),
					[ea, es] = (0, n.useState)(!1),
					[et, en] = (0, n.useState)(1),
					[el, er] = (0, n.useState)(50),
					[ei, ed] = (0, n.useState)(!1),
					[ec, eo] = (0, n.useState)(null),
					[em, ex] = (0, n.useState)(!1),
					[eu, eh] = (0, n.useState)(null),
					[ej, ep] = (0, n.useState)(!1),
					[ef, eg] = (0, n.useState)(null),
					[ev, eb] = (0, n.useState)(null),
					[eN, ey] = (0, n.useState)(!1),
					ew = !!(T || K),
					eA = (0, n.useCallback)(() => {
						V(""), X("");
					}, [V, X]);
				(0, n.useEffect)(() => {
					let a = e.get("id");
					a && q(a);
					let s = e.get("status");
					s && R.some((e) => e.value === s) && I(s);
				}, [e, I]),
					(0, n.useEffect)(() => {
						en(1);
					}, [U, H, T, K]);
				let e_ = (0, n.useMemo)(
						() => ({
							status: "all" !== U ? U : void 0,
							search: H || void 0,
							advance_only: "Advance" === U,
							posting_from: T || void 0,
							posting_to: K || void 0,
							limit: el,
							offset: (et - 1) * el,
						}),
						[U, H, T, K, et, el]
					),
					{
						data: ek,
						isLoading: eC,
						error: eE,
						mutate: eS,
					} = (0, l.Ay)(["payment-entries", e_], () => J.Jz(e_), {
						refreshInterval: 3e4,
					}),
					eD = ek?.data ?? [],
					eF = ek?.total ?? 0;
				(0, n.useEffect)(() => {
					if (!Y) return void ee(null);
					let e = !1;
					return (
						es(!0),
						J.WU(Y)
							.then((a) => {
								e || ee(a);
							})
							.catch((a) => {
								e ||
									(ee(null),
									c.o.error(a.message || "Failed to load payment entry"));
							})
							.finally(() => {
								e || es(!1);
							}),
						() => {
							e = !0;
						}
					);
				}, [Y]);
				let eP = (0, n.useMemo)(() => {
						let e = eD.filter((e) => 1 === e.docstatus);
						return {
							received: e.reduce((e, a) => e + (a.paid_amount || 0), 0),
							advances: e
								.filter((e) => e.is_advance)
								.reduce((e, a) => e + (a.unallocated_amount || 0), 0),
							count: e.length,
						};
					}, [eD]),
					eQ = eD[0]?.currency,
					ez = (0, n.useCallback)(
						async (e) => {
							if ((await eS(), Y === e))
								try {
									ee(await J.WU(e));
								} catch {
									ee(null);
								}
						},
						[eS, Y]
					),
					e$ = async () => {
						if (ec) {
							ex(!0);
							try {
								await J.PJ(ec),
									c.o.success("Payment entry cancelled"),
									eo(null),
									await ez(ec);
							} catch (e) {
								c.o.error(
									e instanceof Error
										? e.message
										: "Failed to cancel payment entry"
								);
							} finally {
								ex(!1);
							}
						}
					},
					eZ = async () => {
						if (ev) {
							ey(!0);
							try {
								await J.BP(ev),
									c.o.success("Draft payment entry deleted"),
									Y === ev && (q(null), ee(null)),
									eb(null),
									await eS();
							} catch (e) {
								c.o.error(
									e instanceof Error
										? e.message
										: "Failed to delete payment entry"
								);
							} finally {
								ey(!1);
							}
						}
					},
					eM = (e) => W("payment-entries") && 1 === e.docstatus,
					eJ = (e) =>
						(a("payment-entries") || s("payment-entries")) &&
						2 === e.docstatus &&
						!e.already_amended,
					eR = (e) => B("payment-entries") && 0 === e.docstatus,
					eO = async () => {
						if (eu) {
							ep(!0);
							try {
								let e = await J.wk(eu);
								c.o.success(`Amended as ${e.name}`),
									eh(null),
									await eS(),
									q(e.name),
									ee(await J.WU(e.name));
							} catch (e) {
								c.o.error(
									e instanceof Error
										? e.message
										: "Failed to amend payment entry"
								);
							} finally {
								ep(!1);
							}
						}
					},
					eW = (e) => {
						e.is_advance ? eg(e) : eh(e.name);
					};
				return (0, t.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, t.jsx)("div", {
							className: "flex items-center justify-end gap-3",
							children: (0, t.jsx)(d.l, {
								module: "payment-entries",
								label: "Advance Payment",
								onClick: () => ed(!0),
							}),
						}),
						(0, t.jsxs)("div", {
							className: "grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3",
							children: [
								(0, t.jsx)(h.Zp, {
									className: "gap-0 py-0",
									children: (0, t.jsx)(h.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [
												(0, t.jsxs)("div", {
													className: "min-w-0",
													children: [
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Received",
														}),
														(0, t.jsx)("p", {
															className:
																"dms-stat-value mt-1 text-xl sm:text-2xl",
															children: O(eP.received, eQ),
														}),
													],
												}),
												(0, t.jsx)("div", {
													className:
														"shrink-0 rounded-full bg-primary/10 p-1.5",
													children: (0, t.jsx)(y.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
											],
										}),
									}),
								}),
								(0, t.jsx)(h.Zp, {
									className: "gap-0 py-0",
									children: (0, t.jsx)(h.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [
												(0, t.jsxs)("div", {
													className: "min-w-0",
													children: [
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Available advance",
														}),
														(0, t.jsx)("p", {
															className:
																"dms-stat-value mt-1 text-xl sm:text-2xl text-[#F9A825]",
															children: O(eP.advances, eQ),
														}),
													],
												}),
												(0, t.jsx)("div", {
													className:
														"shrink-0 rounded-full bg-[#F9A825]/10 p-1.5",
													children: (0, t.jsx)(w.A, {
														className: "h-3.5 w-3.5 text-[#F9A825]",
													}),
												}),
											],
										}),
									}),
								}),
								(0, t.jsx)(h.Zp, {
									className: "gap-0 py-0",
									children: (0, t.jsx)(h.Wu, {
										className: "px-3.5 py-3",
										children: (0, t.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [
												(0, t.jsxs)("div", {
													className: "min-w-0",
													children: [
														(0, t.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Entries",
														}),
														(0, t.jsx)("p", {
															className:
																"dms-stat-value mt-1 text-xl sm:text-2xl",
															children: eP.count,
														}),
													],
												}),
												(0, t.jsx)("div", {
													className:
														"shrink-0 rounded-full bg-[#1E88E5]/10 p-1.5",
													children: (0, t.jsx)(N.A, {
														className: "h-3.5 w-3.5 text-[#1E88E5]",
													}),
												}),
											],
										}),
									}),
								}),
							],
						}),
						(0, t.jsx)(h.Zp, {
							children: (0, t.jsxs)(h.Wu, {
								className: "pt-6",
								children: [
									(0, t.jsxs)("div", {
										className: "flex flex-col gap-3 sm:flex-row",
										children: [
											(0, t.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, t.jsx)(A.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, t.jsx)(x.p, {
														className: "pl-9",
														placeholder:
															"Search by name, customer or reference…",
														value: H,
														onChange: (e) => L(e.target.value),
													}),
												],
											}),
											(0, t.jsxs)(p.l6, {
												value: U,
												onValueChange: I,
												children: [
													(0, t.jsxs)(p.bq, {
														className: "w-full sm:w-[240px]",
														children: [
															(0, t.jsx)(_.A, {
																className: "mr-2 h-4 w-4",
															}),
															(0, t.jsx)(p.yv, {
																placeholder: "Filter by status",
															}),
														],
													}),
													(0, t.jsx)(p.gC, {
														children: R.map((e) =>
															(0, t.jsx)(
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
									(0, t.jsxs)("div", {
										className:
											"mt-3 flex flex-col gap-3 sm:flex-row sm:items-end",
										children: [
											(0, t.jsxs)("div", {
												className:
													"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl lg:flex-1",
												children: [
													(0, t.jsxs)("div", {
														className: "space-y-1.5",
														children: [
															(0, t.jsx)(u.J, {
																htmlFor: "payment-posting-from",
																className:
																	"text-xs text-muted-foreground",
																children: "Posting date from",
															}),
															(0, t.jsx)(x.p, {
																id: "payment-posting-from",
																type: "date",
																value: T,
																max: K || void 0,
																onChange: (e) => V(e.target.value),
															}),
														],
													}),
													(0, t.jsxs)("div", {
														className: "space-y-1.5",
														children: [
															(0, t.jsx)(u.J, {
																htmlFor: "payment-posting-to",
																className:
																	"text-xs text-muted-foreground",
																children: "Posting date to",
															}),
															(0, t.jsx)(x.p, {
																id: "payment-posting-to",
																type: "date",
																value: K,
																min: T || void 0,
																onChange: (e) => X(e.target.value),
															}),
														],
													}),
												],
											}),
											(0, t.jsx)(z.r, {
												onClear: eA,
												disabled: !ew,
												className: "self-end sm:self-auto",
											}),
										],
									}),
								],
							}),
						}),
						(0, t.jsxs)(h.Zp, {
							children: [
								(0, t.jsx)(h.aR, {
									children: (0, t.jsx)(h.ZB, { children: "Payment Entries" }),
								}),
								(0, t.jsxs)(h.Wu, {
									children: [
										eC
											? (0, t.jsx)("div", {
													className:
														"flex h-48 items-center justify-center",
													children: (0, t.jsx)("div", {
														className:
															"h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
													}),
											  })
											: eE
											? (0, t.jsx)("div", {
													className:
														"flex h-48 items-center justify-center text-muted-foreground",
													children: "Failed to load payment entries",
											  })
											: eD.length > 0
											? (0, t.jsx)("div", {
													className: "dms-table-panel",
													children: (0, t.jsxs)(f.XI, {
														children: [
															(0, t.jsx)(f.A0, {
																children: (0, t.jsxs)(f.Hj, {
																	children: [
																		(0, t.jsx)(f.nd, {
																			children: "Entry #",
																		}),
																		(0, t.jsx)(f.nd, {
																			children: "Customer",
																		}),
																		(0, t.jsx)(f.nd, {
																			children: "Date",
																		}),
																		(0, t.jsx)(f.nd, {
																			children: "Mode",
																		}),
																		(0, t.jsx)(f.nd, {
																			className:
																				"text-right",
																			children: "Amount",
																		}),
																		(0, t.jsx)(f.nd, {
																			className:
																				"text-right",
																			children: "Available",
																		}),
																		(0, t.jsx)(f.nd, {
																			children: "Type",
																		}),
																		(0, t.jsx)(f.nd, {
																			children: "Status",
																		}),
																		(0, t.jsx)(f.nd, {
																			className:
																				"w-[88px] text-right",
																			children: "Actions",
																		}),
																	],
																}),
															}),
															(0, t.jsx)(f.BF, {
																children: eD.map((e) =>
																	(0, t.jsxs)(
																		f.Hj,
																		{
																			className:
																				"cursor-pointer",
																			onClick: () =>
																				q(e.name),
																			children: [
																				(0, t.jsxs)(f.nA, {
																					children: [
																						(0, t.jsx)(
																							"div",
																							{
																								className:
																									"font-medium",
																								children:
																									e.name,
																							}
																						),
																						e.reference_no
																							? (0,
																							  t.jsx)(
																									"div",
																									{
																										className:
																											"text-xs text-muted-foreground",
																										children:
																											e.reference_no,
																									}
																							  )
																							: null,
																						e.dms_remarks
																							? (0,
																							  t.jsxs)(
																									"div",
																									{
																										className:
																											"max-w-[220px] truncate text-xs text-muted-foreground",
																										title: e.dms_remarks,
																										children:
																											[
																												"DMS: ",
																												e.dms_remarks,
																											],
																									}
																							  )
																							: null,
																					],
																				}),
																				(0, t.jsx)(f.nA, {
																					className:
																						"max-w-[220px] truncate",
																					children:
																						e.customer_name ||
																						e.customer ||
																						"—",
																				}),
																				(0, t.jsx)(f.nA, {
																					children:
																						e.posting_date ||
																						"—",
																				}),
																				(0, t.jsx)(f.nA, {
																					children:
																						e.mode_of_payment ||
																						"—",
																				}),
																				(0, t.jsx)(f.nA, {
																					className:
																						"text-right",
																					children: O(
																						e.paid_amount,
																						e.currency
																					),
																				}),
																				(0, t.jsx)(f.nA, {
																					className:
																						"text-right",
																					children: O(
																						e.unallocated_amount,
																						e.currency
																					),
																				}),
																				(0, t.jsx)(f.nA, {
																					children: (0,
																					t.jsxs)(
																						"div",
																						{
																							className:
																								"flex flex-wrap items-center gap-1",
																							children:
																								[
																									e.is_advance
																										? (0,
																										  t.jsx)(
																												j.E,
																												{
																													className:
																														"bg-[#F9A825]/10 text-[#F9A825]",
																													children:
																														"Advance",
																												}
																										  )
																										: (0,
																										  t.jsx)(
																												j.E,
																												{
																													variant:
																														"outline",
																													children:
																														"Payment",
																												}
																										  ),
																									e.is_dms
																										? (0,
																										  t.jsx)(
																												j.E,
																												{
																													variant:
																														"secondary",
																													children:
																														"DMS",
																												}
																										  )
																										: null,
																								],
																						}
																					),
																				}),
																				(0, t.jsx)(f.nA, {
																					children:
																						2 ===
																							e.docstatus ||
																						"Cancelled" ===
																							e.status
																							? (0,
																							  t.jsxs)(
																									j.E,
																									{
																										className:
																											"bg-muted text-muted-foreground",
																										children:
																											[
																												(0,
																												t.jsx)(
																													v.A,
																													{
																														className:
																															"mr-1 h-3 w-3",
																													}
																												),
																												"Cancelled",
																											],
																									}
																							  )
																							: 0 ===
																									e.docstatus ||
																							  "Draft" ===
																									e.status
																							? (0,
																							  t.jsxs)(
																									j.E,
																									{
																										className:
																											"bg-muted text-muted-foreground",
																										children:
																											[
																												(0,
																												t.jsx)(
																													b.A,
																													{
																														className:
																															"mr-1 h-3 w-3",
																													}
																												),
																												"Draft",
																											],
																									}
																							  )
																							: (0,
																							  t.jsxs)(
																									j.E,
																									{
																										className:
																											"bg-[#2E7D32]/10 text-[#2E7D32]",
																										children:
																											[
																												(0,
																												t.jsx)(
																													N.A,
																													{
																														className:
																															"mr-1 h-3 w-3",
																													}
																												),
																												"Submitted",
																											],
																									}
																							  ),
																				}),
																				(0, t.jsx)(f.nA, {
																					className:
																						"text-right",
																					children: (0,
																					t.jsx)(P.m, {
																						doctype:
																							"Payment Entry",
																						docName:
																							e.name,
																						children:
																							(0,
																							t.jsxs)(
																								F.rI,
																								{
																									children:
																										[
																											(0,
																											t.jsx)(
																												F.ty,
																												{
																													asChild:
																														!0,
																													children:
																														(0,
																														t.jsx)(
																															m.$,
																															{
																																variant:
																																	"ghost",
																																size: "icon",
																																className:
																																	"h-8 w-8",
																																title: "More actions",
																																"aria-label":
																																	"More actions",
																																onClick:
																																	(
																																		e
																																	) =>
																																		e.stopPropagation(),
																																children:
																																	(0,
																																	t.jsx)(
																																		k.A,
																																		{
																																			className:
																																				"h-4 w-4",
																																		}
																																	),
																															}
																														),
																												}
																											),
																											(0,
																											t.jsxs)(
																												F.SQ,
																												{
																													align: "end",
																													children:
																														[
																															(0,
																															t.jsxs)(
																																F._2,
																																{
																																	onClick:
																																		() =>
																																			q(
																																				e.name
																																			),
																																	children:
																																		[
																																			(0,
																																			t.jsx)(
																																				C.A,
																																				{
																																					className:
																																						"mr-2 h-4 w-4",
																																				}
																																			),
																																			"View",
																																		],
																																}
																															),
																															eM(
																																e
																															)
																																? (0,
																																  t.jsxs)(
																																		F._2,
																																		{
																																			className:
																																				"text-destructive focus:text-destructive",
																																			onClick:
																																				() =>
																																					eo(
																																						e.name
																																					),
																																			children:
																																				[
																																					(0,
																																					t.jsx)(
																																						v.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Cancel payment",
																																				],
																																		}
																																  )
																																: null,
																															eJ(
																																e
																															)
																																? (0,
																																  t.jsxs)(
																																		F._2,
																																		{
																																			onClick:
																																				() =>
																																					eW(
																																						e
																																					),
																																			children:
																																				[
																																					(0,
																																					t.jsx)(
																																						E.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Amend payment",
																																				],
																																		}
																																  )
																																: null,
																															eR(
																																e
																															)
																																? (0,
																																  t.jsxs)(
																																		F._2,
																																		{
																																			className:
																																				"text-destructive focus:text-destructive",
																																			onClick:
																																				() =>
																																					eb(
																																						e.name
																																					),
																																			children:
																																				[
																																					(0,
																																					t.jsx)(
																																						S.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Delete draft",
																																				],
																																		}
																																  )
																																: null,
																														],
																												}
																											),
																										],
																								}
																							),
																					}),
																				}),
																			],
																		},
																		e.name
																	)
																),
															}),
														],
													}),
											  })
											: (0, t.jsxs)("div", {
													className:
														"flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground",
													children: [
														(0, t.jsx)(w.A, { className: "h-8 w-8" }),
														(0, t.jsx)("p", {
															children:
																"No DMS payment entries yet.",
														}),
														a("payment-entries")
															? (0, t.jsx)(m.$, {
																	variant: "link",
																	onClick: () => ed(!0),
																	children:
																		"Record an advance payment",
															  })
															: null,
													],
											  }),
										(0, t.jsx)($.$, {
											page: et,
											pageSize: el,
											totalItems: eF,
											loadedCount: eD.length,
											onPageChange: en,
											onPageSizeChange: er,
										}),
									],
								}),
							],
						}),
						(0, t.jsx)(o.BN, {
							open: !!Y,
							onOpenChange: (e) => {
								e || q(null);
							},
							title: G?.name || Y || "",
							subtitle: G?.payment_type,
							badge: G ? { label: G.status || "Draft" } : void 0,
							isLoading: ea,
							footer: Y
								? (0, t.jsxs)("div", {
										className: "flex w-full flex-col gap-2",
										children: [
											(0, t.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, t.jsx)(P.m, {
														doctype: "Payment Entry",
														docName: Y,
														showPrint: !1,
														children: (0, t.jsxs)(F.rI, {
															children: [
																(0, t.jsx)(F.ty, {
																	asChild: !0,
																	children: (0, t.jsx)(m.$, {
																		variant: "outline",
																		size: "sm",
																		className:
																			"h-9 w-9 shrink-0 p-0",
																		title: "More actions",
																		"aria-label":
																			"More actions",
																		children: (0, t.jsx)(k.A, {
																			className: "h-4 w-4",
																		}),
																	}),
																}),
																(0, t.jsxs)(F.SQ, {
																	align: "start",
																	children: [
																		G && eM(G)
																			? (0, t.jsxs)(F._2, {
																					className:
																						"text-destructive focus:text-destructive",
																					onClick: () =>
																						eo(Y),
																					children: [
																						(0, t.jsx)(
																							v.A,
																							{
																								className:
																									"mr-2 h-4 w-4",
																							}
																						),
																						"Cancel payment",
																					],
																			  })
																			: null,
																		G && eJ(G)
																			? (0, t.jsxs)(F._2, {
																					onClick: () =>
																						eW(G),
																					children: [
																						(0, t.jsx)(
																							E.A,
																							{
																								className:
																									"mr-2 h-4 w-4",
																							}
																						),
																						"Amend payment",
																					],
																			  })
																			: null,
																		G && eR(G)
																			? (0, t.jsxs)(F._2, {
																					className:
																						"text-destructive focus:text-destructive",
																					onClick: () =>
																						eb(Y),
																					children: [
																						(0, t.jsx)(
																							S.A,
																							{
																								className:
																									"mr-2 h-4 w-4",
																							}
																						),
																						"Delete draft",
																					],
																			  })
																			: null,
																	],
																}),
															],
														}),
													}),
													(0, t.jsx)("div", {
														className: "min-w-0 flex-1",
														children: (0, t.jsx)(Q.e, {
															doctype: "Payment Entry",
															docName: Y,
															className: "w-full",
														}),
													}),
												],
											}),
											(0, t.jsx)(m.$, {
												type: "button",
												variant: "outline",
												className: "w-full",
												onClick: () => q(null),
												children: "Close",
											}),
										],
								  })
								: null,
							children: G
								? (0, t.jsxs)(t.Fragment, {
										children: [
											(0, t.jsxs)(o.JH, {
												title: "Entry",
												children: [
													(0, t.jsx)(o.Qb, {
														label: "Type",
														value: G.payment_type,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Customer",
														value: G.customer_name || G.customer,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Company",
														value: G.company,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Posting date",
														value: G.posting_date,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Mode of payment",
														value: G.mode_of_payment,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Reference no",
														value: G.reference_no,
													}),
													(0, t.jsx)(o.Qb, {
														label: "Amount",
														value: O(G.paid_amount, G.currency),
													}),
													(0, t.jsx)(o.Qb, {
														label: "Allocated",
														value: O(
															G.total_allocated_amount || 0,
															G.currency
														),
													}),
													(0, t.jsx)(o.Qb, {
														label: "Available (unallocated)",
														value: O(G.unallocated_amount, G.currency),
													}),
													G.dms_remarks
														? (0, t.jsx)(o.Qb, {
																label: "DMS Remarks",
																value: G.dms_remarks,
														  })
														: null,
													G.remarks && G.remarks !== G.dms_remarks
														? (0, t.jsx)(o.Qb, {
																label: "Remarks",
																value: G.remarks,
														  })
														: null,
													G.amended_from
														? (0, t.jsx)(o.Qb, {
																label: "Amended from",
																value: G.amended_from,
														  })
														: null,
													G.amended_as
														? (0, t.jsx)(o.Qb, {
																label: "Amended as",
																value: G.amended_as,
														  })
														: null,
												],
											}),
											G.job_card || G.service_estimate
												? (0, t.jsxs)(o.JH, {
														title: "Source",
														children: [
															G.job_card
																? (0, t.jsx)(o.Qb, {
																		label: "Job Card",
																		value: G.job_card,
																  })
																: null,
															G.service_estimate
																? (0, t.jsx)(o.Qb, {
																		label: "Service Estimate",
																		value: G.service_estimate,
																  })
																: null,
														],
												  })
												: null,
											G.references && G.references.length > 0
												? (0, t.jsx)(o.JH, {
														title: `References (${G.references.length})`,
														children: (0, t.jsx)("div", {
															className:
																"overflow-x-auto rounded-md border",
															children: (0, t.jsxs)(f.XI, {
																children: [
																	(0, t.jsx)(f.A0, {
																		children: (0, t.jsxs)(
																			f.Hj,
																			{
																				children: [
																					(0, t.jsx)(
																						f.nd,
																						{
																							children:
																								"Document",
																						}
																					),
																					(0, t.jsx)(
																						f.nd,
																						{
																							children:
																								"Name",
																						}
																					),
																					(0, t.jsx)(
																						f.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Allocated",
																						}
																					),
																				],
																			}
																		),
																	}),
																	(0, t.jsx)(f.BF, {
																		children: G.references.map(
																			(e, a) =>
																				(0, t.jsxs)(
																					f.Hj,
																					{
																						children: [
																							(0,
																							t.jsx)(
																								f.nA,
																								{
																									children:
																										e.reference_doctype,
																								}
																							),
																							(0,
																							t.jsx)(
																								f.nA,
																								{
																									children:
																										e.reference_name,
																								}
																							),
																							(0,
																							t.jsx)(
																								f.nA,
																								{
																									className:
																										"text-right",
																									children:
																										O(
																											e.allocated_amount ||
																												0,
																											G.currency
																										),
																								}
																							),
																						],
																					},
																					`${e.reference_name}-${a}`
																				)
																		),
																	}),
																],
															}),
														}),
												  })
												: (0, t.jsx)(o.JH, {
														title: "Advance",
														children: (0, t.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children:
																"Unallocated receipt — available to settle future invoices for this customer.",
														}),
												  }),
										],
								  })
								: null,
						}),
						(0, t.jsx)(M.D, {
							open: ei,
							onOpenChange: ed,
							onCreated: () => {
								eS();
							},
						}),
						(0, t.jsx)(M.D, {
							open: !!ef,
							onOpenChange: (e) => {
								e || eg(null);
							},
							customer: ef?.customer,
							customerName: ef?.customer_name,
							company: ef?.company,
							jobCard: ef?.job_card || void 0,
							serviceEstimate: ef?.service_estimate || void 0,
							amendEntry: ef,
							onCreated: (e) => {
								eg(null),
									eS(),
									e?.name &&
										(q(e.name),
										J.WU(e.name)
											.then(ee)
											.catch(() => ee(null)));
							},
						}),
						(0, t.jsx)(g.Lt, {
							open: !!eu,
							onOpenChange: (e) => {
								e || eh(null);
							},
							children: (0, t.jsxs)(g.EO, {
								children: [
									(0, t.jsxs)(g.wd, {
										children: [
											(0, t.jsx)(g.r7, { children: "Amend payment entry" }),
											(0, t.jsxs)(g.$v, {
												children: [
													"Amend cancelled ",
													(0, t.jsx)("strong", { children: eu }),
													"? A new payment entry is created with the same details, linked to it as the amendment, and submitted.",
												],
											}),
										],
									}),
									(0, t.jsxs)(g.ck, {
										children: [
											(0, t.jsx)(g.Zr, {
												disabled: ej,
												children: "Keep cancelled",
											}),
											(0, t.jsx)(g.Rx, {
												disabled: ej,
												onClick: (e) => {
													e.preventDefault(), eO();
												},
												children: ej
													? (0, t.jsxs)(t.Fragment, {
															children: [
																(0, t.jsx)(D.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
																}),
																"Amending…",
															],
													  })
													: "Amend entry",
											}),
										],
									}),
								],
							}),
						}),
						(0, t.jsx)(g.Lt, {
							open: !!ec,
							onOpenChange: (e) => {
								e || eo(null);
							},
							children: (0, t.jsxs)(g.EO, {
								children: [
									(0, t.jsxs)(g.wd, {
										children: [
											(0, t.jsx)(g.r7, { children: "Cancel payment entry" }),
											(0, t.jsxs)(g.$v, {
												children: [
													"Cancel ",
													(0, t.jsx)("strong", { children: ec }),
													"? The advance / receipt will no longer count towards the customer balance.",
												],
											}),
										],
									}),
									(0, t.jsxs)(g.ck, {
										children: [
											(0, t.jsx)(g.Zr, { disabled: em, children: "Keep" }),
											(0, t.jsx)(g.Rx, {
												className:
													"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												disabled: em,
												onClick: (e) => {
													e.preventDefault(), e$();
												},
												children: em
													? (0, t.jsxs)(t.Fragment, {
															children: [
																(0, t.jsx)(D.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
																}),
																"Cancelling…",
															],
													  })
													: "Cancel entry",
											}),
										],
									}),
								],
							}),
						}),
						(0, t.jsx)(g.Lt, {
							open: !!ev,
							onOpenChange: (e) => {
								e || eb(null);
							},
							children: (0, t.jsxs)(g.EO, {
								children: [
									(0, t.jsxs)(g.wd, {
										children: [
											(0, t.jsx)(g.r7, {
												children: "Delete draft payment entry",
											}),
											(0, t.jsxs)(g.$v, {
												children: [
													"Permanently delete draft ",
													(0, t.jsx)("strong", { children: ev }),
													"? This cannot be undone.",
												],
											}),
										],
									}),
									(0, t.jsxs)(g.ck, {
										children: [
											(0, t.jsx)(g.Zr, {
												disabled: eN,
												children: "Keep draft",
											}),
											(0, t.jsx)(g.Rx, {
												className:
													"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												disabled: eN,
												onClick: (e) => {
													e.preventDefault(), eZ();
												},
												children: eN
													? (0, t.jsxs)(t.Fragment, {
															children: [
																(0, t.jsx)(D.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
																}),
																"Deleting…",
															],
													  })
													: "Delete draft",
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
		70521: (e, a, s) => {
			s.d(a, {
				$v: () => h,
				EO: () => o,
				Lt: () => i,
				Rx: () => j,
				Zr: () => p,
				ck: () => x,
				r7: () => u,
				wd: () => m,
			});
			var t = s(95155);
			s(12115);
			var n = s(284),
				l = s(91337),
				r = s(4474);
			function i({ ...e }) {
				return (0, t.jsx)(n.bL, { "data-slot": "alert-dialog", ...e });
			}
			function d({ ...e }) {
				return (0, t.jsx)(n.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function c({ className: e, ...a }) {
				return (0, t.jsx)(n.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, l.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...a,
				});
			}
			function o({ className: e, ...a }) {
				return (0, t.jsxs)(d, {
					children: [
						(0, t.jsx)(c, {}),
						(0, t.jsx)(n.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, l.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...a,
						}),
					],
				});
			}
			function m({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, l.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...a,
				});
			}
			function x({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, l.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...a,
				});
			}
			function u({ className: e, ...a }) {
				return (0, t.jsx)(n.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, l.cn)("text-lg font-semibold", e),
					...a,
				});
			}
			function h({ className: e, ...a }) {
				return (0, t.jsx)(n.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, l.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			function j({ className: e, ...a }) {
				return (0, t.jsx)(n.rc, { className: (0, l.cn)((0, r.r)(), e), ...a });
			}
			function p({ className: e, ...a }) {
				return (0, t.jsx)(n.ZD, {
					className: (0, l.cn)((0, r.r)({ variant: "outline" }), e),
					...a,
				});
			}
		},
		79984: (e, a, s) => {
			s.d(a, { BT: () => d, Wu: () => c, ZB: () => i, Zp: () => l, aR: () => r });
			var t = s(95155);
			s(12115);
			var n = s(91337);
			function l({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...a,
				});
			}
			function r({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...a,
				});
			}
			function i({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...a,
				});
			}
			function d({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			function c({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...a,
				});
			}
		},
		95964: (e, a, s) => {
			s.d(a, { Q: () => d });
			var t = s(95155),
				n = s(12115),
				l = s(39658),
				r = s(91337);
			function i(e, a) {
				return null == e || Number.isNaN(e) || (a && 0 === e) ? "" : String(e);
			}
			function d({
				value: e,
				onValueChange: a,
				blankWhenZero: s = !0,
				className: c,
				onBlur: o,
				onFocus: m,
				...x
			}) {
				let [u, h] = n.useState(!1),
					[j, p] = n.useState(() => i(e, s));
				return (
					n.useEffect(() => {
						u || p(i(e, s));
					}, [e, u, s]),
					(0, t.jsx)(l.p, {
						...x,
						type: "text",
						inputMode: "decimal",
						className: (0, r.cn)(c),
						value: j,
						onFocus: (e) => {
							h(!0), m?.(e);
						},
						onBlur: (e) => {
							h(!1);
							let t = (function (e) {
								if ("" === e || "." === e || "-" === e || "-." === e) return 0;
								let a = parseFloat(e);
								return Number.isFinite(a) ? a : 0;
							})(j);
							a(t), p(i(t, s)), o?.(e);
						},
						onChange: (e) => {
							let s = e.target.value;
							if (!("" === s || /^-?\d*\.?\d*$/.test(s))) return;
							if ((p(s), "" === s || "." === s || "-" === s || "-." === s))
								return void a(0);
							let t = parseFloat(s);
							Number.isFinite(t) && a(t);
						},
					})
				);
			}
		},
		98883: (e, a, s) => {
			s.d(a, { Qb: () => v, JH: () => g, BN: () => f });
			var t = s(95155);
			s(12115);
			var n = s(29483),
				l = s(33210),
				r = s(91337);
			function i({ ...e }) {
				return (0, t.jsx)(n.bL, { "data-slot": "sheet", ...e });
			}
			function d({ ...e }) {
				return (0, t.jsx)(n.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function c({ className: e, ...a }) {
				return (0, t.jsx)(n.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...a,
				});
			}
			function o({ className: e, children: a, side: s = "right", ...i }) {
				return (0, t.jsxs)(d, {
					children: [
						(0, t.jsx)(c, {}),
						(0, t.jsxs)(n.UC, {
							"data-slot": "sheet-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === s &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === s &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === s &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === s &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...i,
							children: [
								a,
								(0, t.jsxs)(n.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, t.jsx)(l.A, { className: "size-4" }),
										(0, t.jsx)("span", {
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
			function m({ className: e, ...a }) {
				return (0, t.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, r.cn)("flex flex-col gap-1.5 p-4", e),
					...a,
				});
			}
			function x({ className: e, ...a }) {
				return (0, t.jsx)(n.hE, {
					"data-slot": "sheet-title",
					className: (0, r.cn)("text-foreground font-semibold", e),
					...a,
				});
			}
			function u({ className: e, ...a }) {
				return (0, t.jsx)(n.VY, {
					"data-slot": "sheet-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			var h = s(38291),
				j = s(61991),
				p = s(6296);
			function f({
				open: e,
				onOpenChange: a,
				title: s,
				subtitle: n,
				badge: l,
				isLoading: d,
				onOpenInDesk: c,
				footer: g,
				contentScroll: v = "outer",
				children: b,
			}) {
				return (0, t.jsx)(i, {
					open: e,
					onOpenChange: a,
					children: (0, t.jsxs)(o, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, t.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, t.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, t.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, t.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, t.jsx)(x, {
														className: "text-lg",
														children: s,
													}),
													l &&
														(0, t.jsx)(h.E, {
															variant: l.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: l.label,
														}),
												],
											}),
											n && (0, t.jsx)(u, { className: "mt-1", children: n }),
										],
									}),
								}),
							}),
							(0, t.jsx)(j.w, { className: "bg-(--dms-green)/20" }),
							d
								? (0, t.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, t.jsx)(p.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, t.jsxs)(t.Fragment, {
										children: [
											(0, t.jsx)("div", {
												className: (0, r.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === v
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: b,
											}),
											g &&
												(0, t.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: g,
												}),
										],
								  }),
						],
					}),
				});
			}
			function g({ title: e, children: a, className: s }) {
				return (0, t.jsxs)("div", {
					className: (0, r.cn)("space-y-2", s),
					children: [
						(0, t.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, t.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, t.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: a,
						}),
					],
				});
			}
			function v({ label: e, value: a, className: s }) {
				return (0, t.jsxs)("div", {
					className: (0, r.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						s
					),
					children: [
						(0, t.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, t.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: a || "—",
						}),
					],
				});
			}
		},
		99916: (e, a, s) => {
			s.d(a, { r: () => i });
			var t = s(95155),
				n = s(33210),
				l = s(4474),
				r = s(91337);
			function i({
				onClear: e,
				disabled: a = !1,
				label: s = "Clear filters",
				className: d,
			}) {
				return (0, t.jsxs)(l.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: a,
					"aria-label": s,
					title: s,
					className: (0, r.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", d),
					children: [
						(0, t.jsx)(n.A, { "aria-hidden": "true" }),
						(0, t.jsx)("span", { className: "hidden sm:inline", children: s }),
					],
				});
			}
		},
	},
]);
