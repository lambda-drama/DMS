"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6668],
	{
		23511: (e, s, t) => {
			t.d(s, { E: () => n });
			var a = t(95155),
				r = t(91337);
			function n({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...s,
				});
			}
		},
		38291: (e, s, t) => {
			t.d(s, { E: () => o });
			var a = t(95155);
			t(12115);
			var r = t(42442),
				n = t(18460),
				l = t(91337);
			let i = (0, n.F)(
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
			function o({ className: e, variant: s, asChild: t = !1, ...n }) {
				let c = t ? r.DX : "span";
				return (0, a.jsx)(c, {
					"data-slot": "badge",
					className: (0, l.cn)(i({ variant: s }), e),
					...n,
				});
			}
		},
		39540: (e, s, t) => {
			t.d(s, { T: () => n });
			var a = t(95155);
			t(12115);
			var r = t(91337);
			function n({ className: e, ...s }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...s,
				});
			}
		},
		42074: (e, s, t) => {
			t.d(s, { h: () => i });
			var a = t(95155),
				r = t(12115),
				n = t(47650),
				l = t(91337);
			function i({ children: e, className: s, align: t = "end" }) {
				let [o, c] = (0, r.useState)(!1);
				(0, r.useEffect)(() => (c(!0), () => c(!1)), []);
				let d = (0, a.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, l.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						s
					),
					children: (0, a.jsx)("div", {
						className: (0, l.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === t
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return o ? (0, n.createPortal)(d, document.body) : null;
			}
		},
		66668: (e, s, t) => {
			t.r(s), t.d(s, { default: () => _ });
			var a = t(95155),
				r = t(12115),
				n = t(44855),
				l = t(32144),
				i = t(55833),
				o = t(38291),
				c = t(4474),
				d = t(79984),
				m = t(39658),
				u = t(39540),
				p = t(23511),
				g = t(42074),
				x = t(10086),
				h = t(93108),
				b = t(80723),
				f = t(6296),
				v = t(7810),
				j = t(91958);
			function _() {
				let { navigate: e, viewParams: s } = (0, i.c)(),
					t = s.get("id") || "",
					{ data: _ } = (0, n.Ay)("crm-campaign-form-options", l.TU),
					{ data: N } = (0, n.Ay)("crm-segments-pick", () => (0, l.Bz)({ limit: 100 })),
					{ data: y } = (0, n.Ay)("crm-suppressions-pick", () =>
						(0, l.lM)({ limit: 50 })
					),
					{
						data: w,
						isLoading: k,
						mutate: S,
					} = (0, n.Ay)(t ? ["crm-campaign", t] : null, () => (0, l.tm)(t)),
					[C, A] = (0, r.useState)(!1),
					[E, Z] = (0, r.useState)(!1),
					{ error: B, success: z, showError: $, showSuccess: R, clear: T } = (0, h.B)(),
					[F, V] = (0, r.useState)({
						campaign_name: "",
						campaign_type: "",
						status: "",
						channel: "",
						start_date: "",
						end_date: "",
						budget: "",
						segment: "",
						suppression_list: "",
						control_group_pct: "0",
						offer: "",
						language_version: "",
						message_template: "",
						notes: "",
					});
				(0, r.useEffect)(() => {
					w &&
						V({
							campaign_name: String(w.campaign_name || ""),
							campaign_type: String(w.campaign_type || ""),
							status: String(w.status || ""),
							channel: String(w.channel || ""),
							start_date: String(w.start_date || ""),
							end_date: String(w.end_date || ""),
							budget: null != w.budget ? String(w.budget) : "",
							segment: String(w.segment || ""),
							suppression_list: String(w.suppression_list || ""),
							control_group_pct:
								null != w.control_group_pct ? String(w.control_group_pct) : "0",
							offer: String(w.offer || ""),
							language_version: String(w.language_version || ""),
							message_template: String(w.message_template || "").replace(
								/<[^>]+>/g,
								""
							),
							notes: String(w.notes || ""),
						});
				}, [w]);
				let D = (e) => (e || []).filter(Boolean).map((e) => ({ value: e, label: e })),
					M = (e, s) => V((t) => ({ ...t, [e]: s })),
					P = async () => {
						if (t) {
							T(), A(!0);
							try {
								await (0, l.SX)(t, {
									...F,
									campaign_name: F.campaign_name.trim(),
									budget: F.budget ? Number(F.budget) : null,
									control_group_pct: F.control_group_pct
										? Number(F.control_group_pct)
										: 0,
									start_date: F.start_date || null,
									end_date: F.end_date || null,
									segment: F.segment || null,
									suppression_list: F.suppression_list || null,
								}),
									await S(),
									R("Campaign saved.");
							} catch (e) {
								$(e, "Failed to save campaign");
							} finally {
								A(!1);
							}
						}
					},
					O = async () => {
						if (t) {
							T(), Z(!0);
							try {
								let e = await (0, l.Fd)(t, !1);
								await S(),
									R(
										`Audience built: ${e.added} added, ${e.skipped_suppressed} suppressed, ${e.control_group} control.`
									);
							} catch (e) {
								$(e, "Failed to build audience");
							} finally {
								Z(!1);
							}
						}
					};
				if (!t)
					return (0, a.jsx)(d.Zp, {
						children: (0, a.jsx)(d.Wu, {
							className: "py-10 text-center text-muted-foreground",
							children: "No campaign selected.",
						}),
					});
				if (k || !w) return (0, a.jsx)(p.E, { className: "h-48" });
				let W = [
					["Members", w.members_count],
					["Control", w.control_group_count],
					["Delivered", w.delivered_count],
					["Opened", w.opened_count],
					["Responses", w.response_count],
					["Appointments", w.appointment_count],
					["Test drives", w.test_drive_count],
					["Quotations", w.quotation_count],
					["Bookings", w.booking_count],
					["Sales", w.sale_count],
					["Workshop", w.workshop_visit_count],
					["Revenue", w.campaign_revenue],
					["CPL", w.cost_per_lead],
					["CPA", w.cost_per_appointment],
					["CPS", w.cost_per_sale],
					["ROI %", w.roi_pct],
				];
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(h.y, { error: B, success: z, onDismiss: T }),
						(0, a.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [
								(0, a.jsxs)(c.$, {
									variant: "ghost",
									size: "sm",
									onClick: () => e("crm-campaigns"),
									children: [
										(0, a.jsx)(b.A, { className: "mr-2 h-4 w-4" }),
										"Campaigns",
									],
								}),
								(0, a.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										"Draft" === w.status || "Pending Approval" === w.status
											? (0, a.jsx)(c.$, {
													variant: "outline",
													size: "sm",
													onClick: async () => {
														try {
															await (0, l.oN)(t),
																await S(),
																R("Campaign approved.");
														} catch (e) {
															$(e, "Approve failed");
														}
													},
													children: "Approve",
											  })
											: null,
										(0, a.jsxs)(c.$, {
											variant: "outline",
											size: "sm",
											disabled: E || !F.segment,
											onClick: () => void O(),
											children: [
												E
													? (0, a.jsx)(f.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: (0, a.jsx)(v.A, {
															className: "mr-2 h-4 w-4",
													  }),
												"Build audience",
											],
										}),
										(0, a.jsxs)(c.$, {
											variant: "outline",
											size: "sm",
											onClick: async () => {
												try {
													await (0, l.hZ)(t),
														await S(),
														R("Metrics refreshed.");
												} catch (e) {
													$(e, "Refresh failed");
												}
											},
											children: [
												(0, a.jsx)(j.A, { className: "mr-2 h-4 w-4" }),
												"Refresh metrics",
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsx)("div", {
							className: "grid gap-2 sm:grid-cols-4 lg:grid-cols-8",
							children: W.map(([e, s]) =>
								(0, a.jsxs)(
									"div",
									{
										className:
											"rounded-md border border-border/70 px-3 py-2 text-center",
										children: [
											(0, a.jsx)("p", {
												className:
													"text-[10px] uppercase tracking-wide text-muted-foreground",
												children: e,
											}),
											(0, a.jsx)("p", {
												className: "text-sm font-semibold",
												children:
													"number" == typeof s
														? Number(s).toLocaleString()
														: String(s ?? 0),
											}),
										],
									},
									e
								)
							),
						}),
						(0, a.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(d.aR, {
									children: (0, a.jsxs)(d.ZB, {
										className: "text-base",
										children: [String(w.name), " — controls"],
									}),
								}),
								(0, a.jsxs)(d.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Name",
												}),
												(0, a.jsx)(m.p, {
													value: F.campaign_name,
													onChange: (e) =>
														M("campaign_name", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type",
												}),
												(0, a.jsx)(x.Zi, {
													options: D(_?.campaign_types),
													value: F.campaign_type,
													onValueChange: (e) =>
														M("campaign_type", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Status",
												}),
												(0, a.jsx)(x.Zi, {
													options: D(_?.statuses),
													value: F.status,
													onValueChange: (e) => M("status", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Channel",
												}),
												(0, a.jsx)(x.Zi, {
													options: D(_?.channels),
													value: F.channel,
													onValueChange: (e) => M("channel", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Budget",
												}),
												(0, a.jsx)(m.p, {
													type: "number",
													value: F.budget,
													onChange: (e) => M("budget", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Start",
												}),
												(0, a.jsx)(m.p, {
													type: "date",
													value: F.start_date,
													onChange: (e) =>
														M("start_date", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "End",
												}),
												(0, a.jsx)(m.p, {
													type: "date",
													value: F.end_date,
													onChange: (e) => M("end_date", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Segment",
												}),
												(0, a.jsx)(x.Zi, {
													options: (N?.data || []).map((e) => ({
														value: String(e.name),
														label: String(e.segment_name || e.name),
													})),
													value: F.segment,
													onValueChange: (e) => M("segment", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Suppression list",
												}),
												(0, a.jsx)(x.Zi, {
													options: (y?.data || []).map((e) => ({
														value: String(e.name),
														label: String(e.list_name || e.name),
													})),
													value: F.suppression_list,
													onValueChange: (e) =>
														M("suppression_list", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Control group %",
												}),
												(0, a.jsx)(m.p, {
													type: "number",
													value: F.control_group_pct,
													onChange: (e) =>
														M("control_group_pct", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Offer",
												}),
												(0, a.jsx)(u.T, {
													rows: 2,
													value: F.offer,
													onChange: (e) => M("offer", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Message template",
												}),
												(0, a.jsx)(u.T, {
													rows: 3,
													value: F.message_template,
													onChange: (e) =>
														M("message_template", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(d.aR, {
									children: (0, a.jsxs)(d.ZB, {
										className: "text-base",
										children: [
											"Members (",
											Array.isArray(w.members) ? w.members.length : 0,
											")",
										],
									}),
								}),
								(0, a.jsx)(d.Wu, {
									children:
										Array.isArray(w.members) && 0 !== w.members.length
											? (0, a.jsx)("div", {
													className:
														"dms-table-panel max-h-80 overflow-auto",
													children: (0, a.jsxs)("table", {
														className: "w-full text-sm",
														children: [
															(0, a.jsx)("thead", {
																children: (0, a.jsxs)("tr", {
																	className:
																		"border-b text-left text-xs text-muted-foreground",
																	children: [
																		(0, a.jsx)("th", {
																			className:
																				"pb-2 font-medium",
																			children: "Customer",
																		}),
																		(0, a.jsx)("th", {
																			className:
																				"pb-2 font-medium",
																			children: "Status",
																		}),
																		(0, a.jsx)("th", {
																			className:
																				"pb-2 font-medium",
																			children: "Response",
																		}),
																		(0, a.jsx)("th", {
																			className:
																				"pb-2 font-medium",
																			children: "Flags",
																		}),
																	],
																}),
															}),
															(0, a.jsx)("tbody", {
																children: w.members.map((e) =>
																	(0, a.jsxs)(
																		"tr",
																		{
																			className:
																				"border-b border-border/50 last:border-0",
																			children: [
																				(0, a.jsx)("td", {
																					className:
																						"py-2",
																					children:
																						String(
																							e.customer_name ||
																								e.customer
																						),
																				}),
																				(0, a.jsx)("td", {
																					className:
																						"py-2 text-muted-foreground",
																					children:
																						String(
																							e.status ||
																								""
																						),
																				}),
																				(0, a.jsx)("td", {
																					className:
																						"py-2 text-muted-foreground",
																					children:
																						String(
																							e.response ||
																								"—"
																						),
																				}),
																				(0, a.jsx)("td", {
																					className:
																						"py-2",
																					children: (0,
																					a.jsxs)(
																						"div",
																						{
																							className:
																								"flex flex-wrap gap-1",
																							children:
																								[
																									e.in_control_group
																										? (0,
																										  a.jsx)(
																												o.E,
																												{
																													variant:
																														"outline",
																													children:
																														"Control",
																												}
																										  )
																										: null,
																									e.converted
																										? (0,
																										  a.jsx)(
																												o.E,
																												{
																													children:
																														"Converted",
																												}
																										  )
																										: null,
																									e.opted_out
																										? (0,
																										  a.jsx)(
																												o.E,
																												{
																													variant:
																														"destructive",
																													children:
																														"Opt-out",
																												}
																										  )
																										: null,
																								],
																						}
																					),
																				}),
																			],
																		},
																		String(e.name)
																	)
																),
															}),
														],
													}),
											  })
											: (0, a.jsx)("p", {
													className:
														"py-6 text-center text-sm text-muted-foreground",
													children:
														"No members yet. Assign a segment and click Build audience.",
											  }),
								}),
							],
						}),
						(0, a.jsxs)(g.h, {
							children: [
								(0, a.jsx)(c.$, {
									variant: "outline",
									onClick: () => e("crm-campaigns"),
									children: "Cancel",
								}),
								(0, a.jsxs)(c.$, {
									onClick: () => void P(),
									disabled: C,
									children: [
										C
											? (0, a.jsx)(f.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Save campaign",
									],
								}),
							],
						}),
					],
				});
			}
		},
		93108: (e, s, t) => {
			t.d(s, { B: () => d, y: () => m });
			var a = t(95155),
				r = t(12115),
				n = t(66609),
				l = t(13545),
				i = t(12651),
				o = t(33210),
				c = t(91337);
			function d() {
				let [e, s] = (0, r.useState)(""),
					[t, a] = (0, r.useState)(""),
					l = (0, r.useCallback)((e, t = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							a(""),
							s(r),
							n.o.error(r, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							r
						);
					}, []);
				return {
					error: e,
					success: t,
					showError: l,
					showSuccess: (0, r.useCallback)((e) => {
						s(""), a(e), n.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						s(""), a("");
					}, []),
				};
			}
			function m({ error: e, success: s, onDismiss: t, className: r }) {
				if (!e && !s) return null;
				let n = !!e;
				return (0, a.jsx)("div", {
					className: (0, c.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, a.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, c.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, a.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, a.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || s,
							}),
							t
								? (0, a.jsx)("button", {
										type: "button",
										onClick: t,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, a.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
