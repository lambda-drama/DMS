"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[5863],
	{
		33745: (e, t, s) => {
			s.d(t, { l: () => i });
			var a = s(95155),
				l = s(51914),
				n = s(63360),
				r = s(4474),
				d = s(91337);
			function i({ module: e, label: t, className: s, ...o }) {
				let { canCreate: c } = (0, n.Sk)();
				return c(e)
					? (0, a.jsxs)(r.$, {
							"aria-label": t,
							title: t,
							className: (0, d.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								s
							),
							...o,
							children: [
								(0, a.jsx)(l.A, { className: "h-4 w-4 shrink-0" }),
								(0, a.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: t,
								}),
							],
					  })
					: null;
			}
		},
		39540: (e, t, s) => {
			s.d(t, { T: () => n });
			var a = s(95155);
			s(12115);
			var l = s(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, l.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		55863: (e, t, s) => {
			s.r(t), s.d(t, { default: () => I });
			var a = s(95155),
				l = s(81672),
				n = s(12115),
				r = s(55833),
				d = s(33745),
				i = s(36020),
				o = s(4474),
				c = s(39658),
				u = s(79792),
				x = s(39540),
				m = s(79984),
				h = s(38291),
				p = s(83786),
				f = s(26518),
				j = s(74350),
				g = s(43447),
				b = s(98883),
				v = s(93408),
				N = s(99916),
				w = s(20572),
				y = s(53483),
				_ = s(31521),
				k = s(84980),
				C = s(41585),
				A = s(12651),
				S = s(61878),
				$ = s(85118),
				F = s(60285),
				D = s(7915),
				J = s(28063),
				R = s(49387),
				z = s(66609),
				Q = s(86366),
				T = s(12180);
			let E = [
				{ value: "all", label: "All statuses" },
				{ value: "Pending", label: "Pending" },
				{ value: "Reached", label: "Reached" },
				{ value: "Not Reached", label: "Not Reached" },
				{ value: "Callback Requested", label: "Callback Requested" },
				{ value: "Wrong Number", label: "Wrong Number" },
				{ value: "Customer Not Interested", label: "Not Interested" },
			];
			function I() {
				let { navigate: e, viewParams: t } = (0, r.c)(),
					[s, I] = (0, _.P)("follow-ups", "search", ""),
					[L, M] = (0, _.P)("follow-ups", "status", "all"),
					[O, P] = (0, _.P)("follow-ups", "preset", null),
					[W, Z] = (0, n.useState)(null),
					[H, q] = (0, n.useState)(!1),
					[V, B] = (0, n.useState)(""),
					[Y, U] = (0, n.useState)(""),
					[G, K] = (0, n.useState)(""),
					[X, ee] = (0, n.useState)(!1),
					[et, es] = (0, n.useState)(1),
					[ea, el] = (0, n.useState)(50);
				(0, n.useEffect)(() => {
					let e = t.get("id");
					e && Z(e);
					let s = t.get("filter");
					("pending" === s || "overdue" === s || "due_today" === s) && (P(s), M("all"));
				}, [t]),
					(0, n.useEffect)(() => {
						es(1);
					}, [L, O, s]);
				let en = {
						status: "all" !== L ? L : void 0,
						filter: O || void 0,
						search: s || void 0,
					},
					{
						data: er,
						isLoading: ed,
						error: ei,
						mutate: eo,
					} = (0, i.ZA)({ ...en, limit: ea, offset: (et - 1) * ea }),
					ec = er?.total || 0,
					{
						items: eu,
						loadedCount: ex,
						isLoadingMore: em,
						loadMore: eh,
					} = (0, y.h)({
						items: er?.data,
						total: ec,
						offset: (et - 1) * ea,
						resetKey: [L, O ?? "", s, et, ea].join("|"),
						enabled: ea >= y.J,
						fetchMore: async (e, t) =>
							(await Q.O3({ ...en, limit: t, offset: e })).data,
					}),
					{ data: ep, isLoading: ef, mutate: ej } = (0, i.K8)(W),
					eg = {
						total: ec || eu.length,
						pending: eu.filter((e) => "Pending" === e.contact_status).length,
						overdue: eu.filter((e) => e.is_overdue).length,
						reached: eu.filter((e) => "Reached" === e.contact_status).length,
					},
					eb = (e, t) => {
						Z(e), B(t ? t.slice(0, 10) : ""), U(""), K(""), q(!0);
					},
					ev = async () => {
						if (W) {
							if (!V && !Y)
								return void z.o.error("Set a due date or next attempt date");
							ee(!0);
							try {
								await Q.QV(W, {
									follow_up_due_date: V || void 0,
									next_attempt_date: Y ? `${Y.replace("T", " ")}:00` : void 0,
									contact_notes: G.trim() || void 0,
								}),
									z.o.success("Follow-up rescheduled"),
									q(!1),
									eo(),
									ej(),
									(0, T.j)((e) => Array.isArray(e) && "follow-ups" === e[0]);
							} catch (e) {
								z.o.error(e instanceof Error ? e.message : "Failed to schedule");
							} finally {
								ee(!1);
							}
						}
					};
				return (0, a.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, a.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [
								(0, a.jsxs)("div", {
									className: "min-w-0",
									children: [
										(0, a.jsx)("h1", {
											className: "dms-stat-value text-xl text-foreground",
											children: "Follow-ups",
										}),
										(0, a.jsx)("p", {
											className:
												"mt-1 hidden text-muted-foreground sm:block",
											children:
												"Schedule and track customer follow-ups after service",
										}),
									],
								}),
								(0, a.jsx)(d.l, {
									module: "follow-ups",
									label: "New Follow-up",
									onClick: () => e("follow-up-new"),
								}),
							],
						}),
						(0, a.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4",
							children: [
								(0, a.jsx)(m.Zp, {
									className: "dms-kpi-card",
									children: (0, a.jsxs)(m.Wu, {
										className: "px-3.5 py-3",
										children: [
											(0, a.jsx)("p", {
												className:
													"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
												children: "Total",
											}),
											(0, a.jsx)("p", {
												className: "dms-stat-value text-xl sm:text-2xl",
												children: eg.total,
											}),
										],
									}),
								}),
								(0, a.jsx)(m.Zp, {
									className: "dms-kpi-card cursor-pointer",
									onClick: () => {
										P("pending"), M("all");
									},
									children: (0, a.jsx)(m.Wu, {
										className: "px-3.5 py-3",
										children: (0, a.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [
												(0, a.jsxs)("div", {
													children: [
														(0, a.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Pending",
														}),
														(0, a.jsx)("p", {
															className:
																"dms-stat-value text-xl sm:text-2xl",
															children: eg.pending,
														}),
													],
												}),
												(0, a.jsx)(k.A, {
													className: "h-4 w-4 text-amber-600",
												}),
											],
										}),
									}),
								}),
								(0, a.jsx)(m.Zp, {
									className: "dms-kpi-card cursor-pointer",
									onClick: () => {
										P("overdue"), M("all");
									},
									children: (0, a.jsx)(m.Wu, {
										className: "px-3.5 py-3",
										children: (0, a.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [
												(0, a.jsxs)("div", {
													children: [
														(0, a.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Overdue",
														}),
														(0, a.jsx)("p", {
															className:
																"dms-stat-value text-xl sm:text-2xl",
															children: eg.overdue,
														}),
													],
												}),
												(0, a.jsx)(C.A, {
													className: "h-4 w-4 text-destructive",
												}),
											],
										}),
									}),
								}),
								(0, a.jsx)(m.Zp, {
									className: "dms-kpi-card",
									children: (0, a.jsx)(m.Wu, {
										className: "px-3.5 py-3",
										children: (0, a.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [
												(0, a.jsxs)("div", {
													children: [
														(0, a.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Reached",
														}),
														(0, a.jsx)("p", {
															className:
																"dms-stat-value text-xl sm:text-2xl",
															children: eg.reached,
														}),
													],
												}),
												(0, a.jsx)(A.A, {
													className: "h-4 w-4 text-emerald-600",
												}),
											],
										}),
									}),
								}),
							],
						}),
						(0, a.jsxs)(m.Zp, {
							children: [
								(0, a.jsx)(m.aR, {
									className: "pb-3",
									children: (0, a.jsx)(m.ZB, {
										className: "text-base",
										children: "Follow-up list",
									}),
								}),
								(0, a.jsxs)(m.Wu, {
									className: "space-y-4",
									children: [
										(0, a.jsxs)("div", {
											className: "flex flex-col gap-3 sm:flex-row",
											children: [
												(0, a.jsxs)("div", {
													className: "relative flex-1",
													children: [
														(0, a.jsx)(S.A, {
															className:
																"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
														}),
														(0, a.jsx)(c.p, {
															placeholder:
																"Search by ID, customer, VIN, job card…",
															value: s,
															onChange: (e) => I(e.target.value),
															className: "pl-9",
														}),
													],
												}),
												(0, a.jsxs)(f.l6, {
													value: L,
													onValueChange: (e) => {
														M(e), P(null);
													},
													children: [
														(0, a.jsx)(f.bq, {
															className: "w-full sm:w-[220px]",
															children: (0, a.jsx)(f.yv, {
																placeholder: "Status",
															}),
														}),
														(0, a.jsx)(f.gC, {
															children: E.map((e) =>
																(0, a.jsx)(
																	f.eb,
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
												O
													? (0, a.jsx)(N.r, {
															label: "Clear filter",
															onClear: () => P(null),
															className: "self-start sm:self-auto",
													  })
													: null,
											],
										}),
										ed
											? (0, a.jsx)("p", {
													className:
														"py-8 text-center text-muted-foreground",
													children: "Loading…",
											  })
											: ei
											? (0, a.jsx)("p", {
													className: "py-8 text-center text-destructive",
													children: "Failed to load follow-ups",
											  })
											: 0 === eu.length
											? (0, a.jsxs)("div", {
													className:
														"flex flex-col items-center justify-center py-12 text-muted-foreground",
													children: [
														(0, a.jsx)($.A, {
															className: "mb-3 h-10 w-10 opacity-40",
														}),
														(0, a.jsx)("p", {
															className: "text-sm font-medium",
															children: "No follow-ups found",
														}),
														(0, a.jsx)(o.$, {
															variant: "link",
															className: "mt-1",
															onClick: () => e("follow-up-new"),
															children:
																"Schedule your first follow-up",
														}),
													],
											  })
											: (0, a.jsx)("div", {
													className: "dms-table-panel overflow-x-auto",
													children: (0, a.jsxs)(p.XI, {
														children: [
															(0, a.jsx)(p.A0, {
																children: (0, a.jsxs)(p.Hj, {
																	children: [
																		(0, a.jsx)(p.nd, {
																			children: "Follow-up",
																		}),
																		(0, a.jsx)(p.nd, {
																			children: "Customer",
																		}),
																		(0, a.jsx)(p.nd, {
																			children: "Vehicle",
																		}),
																		(0, a.jsx)(p.nd, {
																			children: "Due",
																		}),
																		(0, a.jsx)(p.nd, {
																			children: "Status",
																		}),
																		(0, a.jsx)(p.nd, {
																			children: "Job Card",
																		}),
																		(0, a.jsx)(p.nd, {
																			className:
																				"text-right",
																			children: "Actions",
																		}),
																	],
																}),
															}),
															(0, a.jsx)(p.BF, {
																children: eu.map((t) =>
																	(0, a.jsxs)(
																		p.Hj,
																		{
																			className:
																				"hover:bg-muted/50",
																			children: [
																				(0, a.jsx)(p.nA, {
																					children: (0,
																					a.jsx)(
																						"button",
																						{
																							type: "button",
																							className:
																								"font-medium text-primary hover:underline",
																							onClick:
																								() =>
																									Z(
																										t.name
																									),
																							children:
																								t.name,
																						}
																					),
																				}),
																				(0, a.jsx)(p.nA, {
																					children: (0,
																					a.jsx)("p", {
																						className:
																							"font-medium",
																						children:
																							t.customer_name ||
																							t.customer,
																					}),
																				}),
																				(0, a.jsxs)(p.nA, {
																					children: [
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"text-sm",
																								children:
																									t.license_plate ||
																									t.vehicle_vin ||
																									"—",
																							}
																						),
																						t.vehicle_model
																							? (0,
																							  a.jsx)(
																									"p",
																									{
																										className:
																											"text-xs text-muted-foreground",
																										children:
																											t.vehicle_model,
																									}
																							  )
																							: null,
																					],
																				}),
																				(0, a.jsx)(p.nA, {
																					children: (0,
																					a.jsxs)(
																						"div",
																						{
																							className:
																								"flex flex-col gap-1",
																							children:
																								[
																									(0,
																									a.jsx)(
																										"span",
																										{
																											children:
																												t.follow_up_due_date
																													? (0,
																													  l.Yq)(
																															t.follow_up_due_date
																													  )
																													: "—",
																										}
																									),
																									t.is_overdue
																										? (0,
																										  a.jsx)(
																												h.E,
																												{
																													className:
																														"bg-destructive/10 text-destructive border-0 w-fit text-[10px]",
																													children:
																														"Overdue",
																												}
																										  )
																										: null,
																								],
																						}
																					),
																				}),
																				(0, a.jsx)(p.nA, {
																					children: (0,
																					a.jsx)(h.E, {
																						className:
																							(function (
																								e
																							) {
																								switch (
																									e
																								) {
																									case "Reached":
																										return "bg-[#2E7D32]/10 text-[#2E7D32] border-0";
																									case "Pending":
																									case "Callback Requested":
																										return "bg-[#F9A825]/10 text-[#F9A825] border-0";
																									case "Not Reached":
																									case "Wrong Number":
																									case "Number Disconnected":
																										return "bg-destructive/10 text-destructive border-0";
																									default:
																										return "bg-muted text-muted-foreground border-0";
																								}
																							})(
																								t.contact_status
																							),
																						children:
																							t.contact_status ||
																							"—",
																					}),
																				}),
																				(0, a.jsx)(p.nA, {
																					className:
																						"text-sm text-muted-foreground",
																					children:
																						t.job_card ||
																						"Standalone",
																				}),
																				(0, a.jsx)(p.nA, {
																					className:
																						"text-right",
																					children: (0,
																					a.jsx)(v.m, {
																						doctype:
																							"Customer Follow Up",
																						docName:
																							t.name,
																						children:
																							(0,
																							a.jsxs)(
																								g.rI,
																								{
																									children:
																										[
																											(0,
																											a.jsx)(
																												g.ty,
																												{
																													asChild:
																														!0,
																													children:
																														(0,
																														a.jsx)(
																															o.$,
																															{
																																variant:
																																	"ghost",
																																size: "icon",
																																children:
																																	(0,
																																	a.jsx)(
																																		F.A,
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
																											a.jsxs)(
																												g.SQ,
																												{
																													align: "end",
																													children:
																														[
																															(0,
																															a.jsxs)(
																																g._2,
																																{
																																	onClick:
																																		() =>
																																			Z(
																																				t.name
																																			),
																																	children:
																																		[
																																			(0,
																																			a.jsx)(
																																				D.A,
																																				{
																																					className:
																																						"mr-2 h-4 w-4",
																																				}
																																			),
																																			"View",
																																		],
																																}
																															),
																															(0,
																															a.jsxs)(
																																g._2,
																																{
																																	onClick:
																																		() =>
																																			eb(
																																				t.name,
																																				t.follow_up_due_date
																																			),
																																	children:
																																		[
																																			(0,
																																			a.jsx)(
																																				J.A,
																																				{
																																					className:
																																						"mr-2 h-4 w-4",
																																				}
																																			),
																																			"Reschedule",
																																		],
																																}
																															),
																															t.job_card
																																? (0,
																																  a.jsxs)(
																																		g._2,
																																		{
																																			onClick:
																																				() =>
																																					e(
																																						"job-card-detail",
																																						{
																																							id: t.job_card,
																																						}
																																					),
																																			children:
																																				[
																																					(0,
																																					a.jsx)(
																																						R.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Open Job Card",
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
																		t.name
																	)
																),
															}),
														],
													}),
											  }),
										eu.length > 0
											? (0, a.jsx)(w.$, {
													page: et,
													pageSize: ea,
													totalItems: ec,
													loadedCount: ex,
													onPageChange: es,
													onPageSizeChange: (e) => {
														el(e), es(1);
													},
													onLoadMore: eh,
													isLoadingMore: em,
											  })
											: null,
									],
								}),
							],
						}),
						(0, a.jsx)(b.BN, {
							open: !!W,
							onOpenChange: (e) => {
								e || Z(null);
							},
							title: W || "",
							subtitle: ep?.customer_name || ep?.customer,
							badge: ep?.contact_status ? { label: ep.contact_status } : void 0,
							isLoading: ef,
							onOpenInDesk: () =>
								window.open(`/app/customer-follow-up/${W}`, "_blank"),
							children: ep
								? (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsxs)(b.JH, {
												title: "Schedule",
												children: [
													(0, a.jsx)(b.Qb, {
														label: "Due date",
														value: ep.follow_up_due_date
															? (0, l.Yq)(ep.follow_up_due_date)
															: void 0,
													}),
													(0, a.jsx)(b.Qb, {
														label: "Next attempt",
														value: ep.next_attempt_date
															? (0, l.r6)(ep.next_attempt_date)
															: void 0,
													}),
													(0, a.jsx)(b.Qb, {
														label: "Assigned to",
														value: ep.assigned_to,
													}),
													(0, a.jsx)(b.Qb, {
														label: "Contact method",
														value: ep.contact_method,
													}),
													(0, a.jsx)(b.Qb, {
														label: "Case status",
														value: ep.case_status,
													}),
												],
											}),
											(0, a.jsxs)(b.JH, {
												title: "Links",
												children: [
													(0, a.jsx)(b.Qb, {
														label: "Customer",
														value: ep.customer_name || ep.customer,
													}),
													(0, a.jsx)(b.Qb, {
														label: "VIN",
														value: ep.vehicle_vin,
													}),
													(0, a.jsx)(b.Qb, {
														label: "Job Card",
														value: ep.job_card || "Standalone",
													}),
													(0, a.jsx)(b.Qb, {
														label: "Delivery",
														value: ep.delivery,
													}),
												],
											}),
											ep.contact_notes
												? (0, a.jsx)(b.JH, {
														title: "Notes",
														children: (0, a.jsx)("div", {
															className:
																"prose prose-sm dark:prose-invert max-w-none text-sm",
															dangerouslySetInnerHTML: {
																__html: ep.contact_notes,
															},
														}),
												  })
												: null,
											(0, a.jsxs)("div", {
												className: "mt-4 flex flex-wrap gap-2",
												children: [
													(0, a.jsxs)(o.$, {
														size: "sm",
														variant: "outline",
														onClick: () =>
															eb(ep.name, ep.follow_up_due_date),
														children: [
															(0, a.jsx)(J.A, {
																className: "mr-2 h-4 w-4",
															}),
															"Reschedule",
														],
													}),
													ep.job_card
														? (0, a.jsx)(o.$, {
																size: "sm",
																variant: "outline",
																onClick: () =>
																	e("job-card-detail", {
																		id: ep.job_card,
																	}),
																children: "Open Job Card",
														  })
														: null,
												],
											}),
										],
								  })
								: null,
						}),
						(0, a.jsx)(j.lG, {
							open: H,
							onOpenChange: q,
							children: (0, a.jsxs)(j.Cf, {
								children: [
									(0, a.jsxs)(j.c7, {
										children: [
											(0, a.jsx)(j.L3, { children: "Reschedule follow-up" }),
											(0, a.jsxs)(j.rr, {
												children: [
													"Update the due date or set a next attempt for ",
													W,
													".",
												],
											}),
										],
									}),
									(0, a.jsxs)("div", {
										className: "space-y-3 py-2",
										children: [
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(u.J, {
														htmlFor: "fu-due",
														children: "Follow-up due date",
													}),
													(0, a.jsx)(c.p, {
														id: "fu-due",
														type: "date",
														value: V,
														onChange: (e) => B(e.target.value),
														disabled: X,
													}),
												],
											}),
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(u.J, {
														htmlFor: "fu-next",
														children: "Next attempt (optional)",
													}),
													(0, a.jsx)(c.p, {
														id: "fu-next",
														type: "datetime-local",
														value: Y,
														onChange: (e) => U(e.target.value),
														disabled: X,
													}),
												],
											}),
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(u.J, {
														htmlFor: "fu-notes",
														children: "Notes (optional)",
													}),
													(0, a.jsx)(x.T, {
														id: "fu-notes",
														rows: 3,
														value: G,
														onChange: (e) => K(e.target.value),
														disabled: X,
													}),
												],
											}),
										],
									}),
									(0, a.jsxs)(j.Es, {
										children: [
											(0, a.jsx)(o.$, {
												variant: "outline",
												onClick: () => q(!1),
												disabled: X,
												children: "Cancel",
											}),
											(0, a.jsx)(o.$, {
												onClick: () => void ev(),
												disabled: X,
												children: "Save schedule",
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
		61991: (e, t, s) => {
			s.d(t, { w: () => r });
			var a = s(95155);
			s(12115);
			var l = s(89803),
				n = s(91337);
			function r({ className: e, orientation: t = "horizontal", decorative: s = !0, ...d }) {
				return (0, a.jsx)(l.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: t,
					className: (0, n.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...d,
				});
			}
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => i, Wu: () => o, ZB: () => d, Zp: () => n, aR: () => r });
			var a = s(95155);
			s(12115);
			var l = s(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, l.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, l.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, l.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, l.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, l.cn)("px-4", e),
					...t,
				});
			}
		},
		81672: (e, t, s) => {
			s.d(t, { Ge: () => u, N0: () => o, Yq: () => d, gQ: () => c, r6: () => i });
			let a = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				l = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				n = (e) => String(e).padStart(2, "0");
			function r(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let s = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (s) return new Date(Number(s[1]), Number(s[2]) - 1, Number(s[3]));
				let a = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(a.getTime()) ? null : a;
			}
			function d(e, t = "") {
				let s = r(e);
				return s ? `${n(s.getDate())}/${n(s.getMonth() + 1)}/${s.getFullYear()}` : t;
			}
			function i(e, t = "", s = !1) {
				let a = r(e);
				if (!a) return t;
				let l = `${n(a.getHours())}:${n(a.getMinutes())}${
					s ? `:${n(a.getSeconds())}` : ""
				}`;
				return `${d(a)} ${l}`;
			}
			function o(e, t = "") {
				let s = r(e);
				return s ? `${a[s.getMonth()]} ${s.getFullYear()}` : t;
			}
			function c(e, t = "") {
				let s = r(e);
				return s ? l[s.getDay()] : t;
			}
			function u(e, t = "") {
				let s = r(e);
				return s ? `${l[s.getDay()]}, ${d(s)}` : t;
			}
		},
		98883: (e, t, s) => {
			s.d(t, { Qb: () => b, JH: () => g, BN: () => j });
			var a = s(95155);
			s(12115);
			var l = s(29483),
				n = s(33210),
				r = s(91337);
			function d({ ...e }) {
				return (0, a.jsx)(l.bL, { "data-slot": "sheet", ...e });
			}
			function i({ ...e }) {
				return (0, a.jsx)(l.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function o({ className: e, ...t }) {
				return (0, a.jsx)(l.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function c({ className: e, children: t, side: s = "right", ...d }) {
				return (0, a.jsxs)(i, {
					children: [
						(0, a.jsx)(o, {}),
						(0, a.jsxs)(l.UC, {
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
							...d,
							children: [
								t,
								(0, a.jsxs)(l.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, a.jsx)(n.A, { className: "size-4" }),
										(0, a.jsx)("span", {
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
				return (0, a.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, r.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, a.jsx)(l.hE, {
					"data-slot": "sheet-title",
					className: (0, r.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)(l.VY, {
					"data-slot": "sheet-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var h = s(38291),
				p = s(61991),
				f = s(6296);
			function j({
				open: e,
				onOpenChange: t,
				title: s,
				subtitle: l,
				badge: n,
				isLoading: i,
				onOpenInDesk: o,
				footer: g,
				contentScroll: b = "outer",
				children: v,
			}) {
				return (0, a.jsx)(d, {
					open: e,
					onOpenChange: t,
					children: (0, a.jsxs)(c, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, a.jsx)(u, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, a.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, a.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, a.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, a.jsx)(x, {
														className: "text-lg",
														children: s,
													}),
													n &&
														(0, a.jsx)(h.E, {
															variant: n.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: n.label,
														}),
												],
											}),
											l && (0, a.jsx)(m, { className: "mt-1", children: l }),
										],
									}),
								}),
							}),
							(0, a.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							i
								? (0, a.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, a.jsx)(f.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsx)("div", {
												className: (0, r.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === b
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: v,
											}),
											g &&
												(0, a.jsx)("div", {
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
			function g({ title: e, children: t, className: s }) {
				return (0, a.jsxs)("div", {
					className: (0, r.cn)("space-y-2", s),
					children: [
						(0, a.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, a.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, a.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: t,
						}),
					],
				});
			}
			function b({ label: e, value: t, className: s }) {
				return (0, a.jsxs)("div", {
					className: (0, r.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						s
					),
					children: [
						(0, a.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, a.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: t || "—",
						}),
					],
				});
			}
		},
		99916: (e, t, s) => {
			s.d(t, { r: () => d });
			var a = s(95155),
				l = s(33210),
				n = s(4474),
				r = s(91337);
			function d({
				onClear: e,
				disabled: t = !1,
				label: s = "Clear filters",
				className: i,
			}) {
				return (0, a.jsxs)(n.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: t,
					"aria-label": s,
					title: s,
					className: (0, r.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", i),
					children: [
						(0, a.jsx)(l.A, { "aria-hidden": "true" }),
						(0, a.jsx)("span", { className: "hidden sm:inline", children: s }),
					],
				});
			}
		},
	},
]);
