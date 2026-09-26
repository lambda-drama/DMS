"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1504],
	{
		26518: (e, t, a) => {
			a.d(t, { bq: () => u, eb: () => m, gC: () => h, l6: () => d, yv: () => c });
			var s = a(95155);
			a(12115);
			var r = a(40287),
				n = a(66088),
				l = a(94514),
				o = a(9921),
				i = a(91337);
			function d({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "select", ...e });
			}
			function c({ ...e }) {
				return (0, s.jsx)(r.WT, { "data-slot": "select-value", ...e });
			}
			function u({ className: e, size: t = "default", children: a, ...l }) {
				return (0, s.jsxs)(r.l9, {
					"data-slot": "select-trigger",
					"data-size": t,
					className: (0, i.cn)(
						"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-full border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...l,
					children: [
						a,
						(0, s.jsx)(r.In, {
							asChild: !0,
							children: (0, s.jsx)(n.A, { className: "size-4 opacity-50" }),
						}),
					],
				});
			}
			function h({ className: e, children: t, position: a = "popper", ...n }) {
				return (0, s.jsx)(r.ZL, {
					children: (0, s.jsxs)(r.UC, {
						"data-slot": "select-content",
						className: (0, i.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
							"popper" === a &&
								"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
							e
						),
						position: a,
						...n,
						children: [
							(0, s.jsx)(p, {}),
							(0, s.jsx)(r.LM, {
								className: (0, i.cn)(
									"p-1",
									"popper" === a &&
										"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
								),
								children: t,
							}),
							(0, s.jsx)(x, {}),
						],
					}),
				});
			}
			function m({ className: e, children: t, ...a }) {
				return (0, s.jsxs)(r.q7, {
					"data-slot": "select-item",
					className: (0, i.cn)(
						"focus:bg-dms-green-light focus:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
						e
					),
					...a,
					children: [
						(0, s.jsx)("span", {
							className:
								"absolute right-2 flex size-3.5 items-center justify-center",
							children: (0, s.jsx)(r.VF, {
								children: (0, s.jsx)(l.A, { className: "size-4" }),
							}),
						}),
						(0, s.jsx)(r.p4, { children: t }),
					],
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(r.PP, {
					"data-slot": "select-scroll-up-button",
					className: (0, i.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, s.jsx)(o.A, { className: "size-4" }),
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(r.wn, {
					"data-slot": "select-scroll-down-button",
					className: (0, i.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, s.jsx)(n.A, { className: "size-4" }),
				});
			}
		},
		34441: (e, t, a) => {
			a.r(t), a.d(t, { default: () => f });
			var s = a(95155),
				r = a(12115),
				n = a(55833),
				l = a(36020),
				o = a(4474),
				i = a(39658),
				d = a(79792),
				c = a(39540),
				u = a(79984),
				h = a(26518),
				m = a(10086),
				p = a(80723),
				x = a(85118);
			let g = (0, a(90425).A)("calendar-plus", [
				["path", { d: "M16 19h6", key: "xwg31i" }],
				["path", { d: "M16 2v4", key: "4m81vk" }],
				["path", { d: "M19 16v6", key: "tddt3s" }],
				[
					"path",
					{
						d: "M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5",
						key: "1glfrc",
					},
				],
				["path", { d: "M3 10h18", key: "8toen8" }],
				["path", { d: "M8 2v4", key: "1cmpym" }],
			]);
			var v = a(66609);
			function f() {
				let { navigate: e, viewParams: t } = (0, n.c)(),
					a = t.get("jobcard") || t.get("job_card") || "",
					{ trigger: f, isMutating: j } = (0, l.Y5)(),
					[b, w] = (0, r.useState)(a ? "job_card" : "standalone"),
					[y, _] = (0, r.useState)(""),
					[N, C] = (0, r.useState)(""),
					[k, S] = (0, r.useState)(a),
					[M, A] = (0, r.useState)(""),
					[z, E] = (0, r.useState)(""),
					[F, L] = (0, r.useState)(a),
					[R, J] = (0, r.useState)(
						(function (e = 2) {
							let t = new Date();
							t.setDate(t.getDate() + e);
							let a = (e) => String(e).padStart(2, "0");
							return `${t.getFullYear()}-${a(t.getMonth() + 1)}-${a(t.getDate())}`;
						})(2)
					),
					[P, V] = (0, r.useState)("Phone Call"),
					[T, Z] = (0, r.useState)(""),
					{ data: $, isLoading: B } = (0, l.dQ)(y),
					{ data: O, isLoading: U } = (0, l.mv)(("standalone" === b && M) || void 0, N),
					{ data: q, isLoading: D } = (0, l.eT)({
						search: k || void 0,
						status: void 0,
						limit: 30,
					}),
					W = q?.data || [],
					H = (0, r.useMemo)(
						() =>
							($ || []).map((e) => ({
								value: e.name,
								label: e.customer_name || e.name,
								description: e.name !== e.customer_name ? e.name : void 0,
							})),
						[$]
					),
					Y = (0, r.useMemo)(
						() =>
							(O || []).map((e) => ({
								value: e.name,
								label: e.plate_number || e.vin_number || e.name,
								description: [e.model_name || e.model, e.name]
									.filter(Boolean)
									.join(" \xb7 "),
							})),
						[O]
					),
					I = (0, r.useMemo)(
						() =>
							(W || []).map((e) => ({
								value: e.name,
								label: e.name,
								description: [e.customer_name, e.license_plate || e.vehicle_vin]
									.filter(Boolean)
									.join(" \xb7 "),
							})),
						[W]
					),
					Q = async () => {
						if ("standalone" === b && !M) return void v.o.error("Select a customer");
						if ("job_card" === b && !F) return void v.o.error("Select a job card");
						if (!R) return void v.o.error("Set a follow-up due date");
						try {
							let t = await f({
								customer: "standalone" === b ? M : void 0,
								vehicle_vin: ("standalone" === b && z) || void 0,
								job_card: "job_card" === b ? F : void 0,
								follow_up_due_date: R,
								contact_method: P,
								contact_notes: T.trim() || void 0,
								contact_status: "Pending",
								case_status: "Pending",
								issue_resolved: "N/A",
							});
							v.o.success(`Follow-up ${t.name} scheduled`),
								e("follow-ups", { id: t.name });
						} catch (e) {
							v.o.error(
								e instanceof Error ? e.message : "Failed to create follow-up"
							);
						}
					};
				return (0, s.jsxs)("div", {
					className: "mx-auto max-w-2xl space-y-4 sm:space-y-6",
					children: [
						(0, s.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								(0, s.jsx)(o.$, {
									variant: "ghost",
									size: "icon",
									onClick: () => e("follow-ups"),
									children: (0, s.jsx)(p.A, { className: "h-5 w-5" }),
								}),
								(0, s.jsxs)("div", {
									children: [
										(0, s.jsx)("h1", {
											className: "text-xl font-bold sm:text-2xl",
											children: "Schedule Follow-up",
										}),
										(0, s.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children:
												"Create a standalone follow-up or link one to a job card",
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(u.Zp, {
							children: [
								(0, s.jsxs)(u.aR, {
									children: [
										(0, s.jsxs)(u.ZB, {
											className: "flex items-center gap-2 text-base",
											children: [
												(0, s.jsx)(x.A, { className: "h-4 w-4" }),
												"Follow-up details",
											],
										}),
										(0, s.jsx)(u.BT, {
											children:
												"Pick who to contact and when. You can reschedule later from the list.",
										}),
									],
								}),
								(0, s.jsxs)(u.Wu, {
									className: "space-y-4",
									children: [
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)(d.J, { children: "Type" }),
												(0, s.jsxs)(h.l6, {
													value: b,
													onValueChange: (e) => w(e),
													disabled: j,
													children: [
														(0, s.jsx)(h.bq, {
															children: (0, s.jsx)(h.yv, {}),
														}),
														(0, s.jsxs)(h.gC, {
															children: [
																(0, s.jsx)(h.eb, {
																	value: "standalone",
																	children:
																		"Standalone (customer)",
																}),
																(0, s.jsx)(h.eb, {
																	value: "job_card",
																	children: "Linked to Job Card",
																}),
															],
														}),
													],
												}),
											],
										}),
										"standalone" === b
											? (0, s.jsxs)(s.Fragment, {
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(d.J, {
																	children: "Customer *",
																}),
																(0, s.jsx)(m.Zi, {
																	options: H,
																	value: M,
																	onValueChange: (e) => {
																		A(e), E("");
																	},
																	onSearchChange: _,
																	placeholder:
																		"Search customers…",
																	isLoading: B,
																	disabled: j,
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(d.J, {
																	children: "Vehicle (optional)",
																}),
																(0, s.jsx)(m.Zi, {
																	options: Y,
																	value: z,
																	onValueChange: E,
																	onSearchChange: C,
																	placeholder: M
																		? "Search vehicles…"
																		: "Select customer first",
																	isLoading: U,
																	disabled: j || !M,
																}),
															],
														}),
													],
											  })
											: (0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(d.J, {
															children: "Job Card *",
														}),
														(0, s.jsx)(m.Zi, {
															options: I,
															value: F,
															onValueChange: L,
															onSearchChange: S,
															placeholder: "Search job cards…",
															isLoading: D,
															disabled: j,
														}),
													],
											  }),
										(0, s.jsxs)("div", {
											className: "grid gap-4 sm:grid-cols-2",
											children: [
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(d.J, {
															htmlFor: "due",
															children: "Follow-up due date *",
														}),
														(0, s.jsx)(i.p, {
															id: "due",
															type: "date",
															value: R,
															onChange: (e) => J(e.target.value),
															disabled: j,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(d.J, {
															children: "Contact method",
														}),
														(0, s.jsxs)(h.l6, {
															value: P,
															onValueChange: V,
															disabled: j,
															children: [
																(0, s.jsx)(h.bq, {
																	children: (0, s.jsx)(h.yv, {}),
																}),
																(0, s.jsx)(h.gC, {
																	children: [
																		"Phone Call",
																		"WhatsApp",
																		"SMS",
																		"Email",
																		"In Person",
																		"Multiple Attempts",
																	].map((e) =>
																		(0, s.jsx)(
																			h.eb,
																			{
																				value: e,
																				children: e,
																			},
																			e
																		)
																	),
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, s.jsx)(d.J, {
													htmlFor: "notes",
													children: "Notes (optional)",
												}),
												(0, s.jsx)(c.T, {
													id: "notes",
													rows: 3,
													placeholder:
														"Reason for follow-up, what to ask…",
													value: T,
													onChange: (e) => Z(e.target.value),
													disabled: j,
												}),
											],
										}),
										(0, s.jsxs)("div", {
											className: "flex justify-end gap-2 pt-2",
											children: [
												(0, s.jsx)(o.$, {
													variant: "outline",
													onClick: () => e("follow-ups"),
													disabled: j,
													children: "Cancel",
												}),
												(0, s.jsxs)(o.$, {
													onClick: () => void Q(),
													disabled: j,
													children: [
														(0, s.jsx)(g, {
															className: "mr-2 h-4 w-4",
														}),
														"Schedule Follow-up",
													],
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
		60504: (e, t, a) => {
			a.d(t, { A: () => i });
			var s = a(12115),
				r = a(90901),
				n = a(44855),
				l = a(12180);
			let o = l.r
					? (e) => {
							e();
					  }
					: s.startTransition,
				i = (0, r.Ht)(n.Ay, () => (e, t, a = {}) => {
					let { mutate: n } = (0, r.iX)(),
						i = (0, s.useRef)(e),
						d = (0, s.useRef)(t),
						c = (0, s.useRef)(a),
						u = (0, s.useRef)(0),
						[h, m, p] = ((e) => {
							let [, t] = (0, s.useState)({}),
								a = (0, s.useRef)(!1),
								r = (0, s.useRef)(e),
								n = (0, s.useRef)({ data: !1, error: !1, isValidating: !1 }),
								o = (0, s.useCallback)((e) => {
									let s = !1,
										l = r.current;
									for (let t in e)
										Object.prototype.hasOwnProperty.call(e, t) &&
											l[t] !== e[t] &&
											((l[t] = e[t]), n.current[t] && (s = !0));
									s && !a.current && t({});
								}, []);
							return (
								(0, l.u)(
									() => (
										(a.current = !1),
										() => {
											a.current = !0;
										}
									)
								),
								[r, n.current, o]
							);
						})({ data: l.U, error: l.U, isMutating: !1 }),
						x = h.current,
						g = (0, s.useCallback)(async (e, t) => {
							let [a, s] = (0, l.s)(i.current);
							if (!d.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!a) throw Error("Can’t trigger the mutation: missing key.");
							let r = (0, l.m)(
									(0, l.m)({ populateCache: !1, throwOnError: !0 }, c.current),
									t
								),
								h = (0, l.o)();
							(u.current = h), p({ isMutating: !0 });
							try {
								let t = await n(
									a,
									d.current(s, { arg: e }),
									(0, l.m)(r, { throwOnError: !0 })
								);
								return (
									u.current <= h &&
										(o(() => p({ data: t, isMutating: !1, error: void 0 })),
										null == r.onSuccess || r.onSuccess.call(r, t, a, r)),
									t
								);
							} catch (e) {
								if (
									u.current <= h &&
									(o(() => p({ error: e, isMutating: !1 })),
									null == r.onError || r.onError.call(r, e, a, r),
									r.throwOnError)
								)
									throw e;
							}
						}, []),
						v = (0, s.useCallback)(() => {
							(u.current = (0, l.o)()), p({ data: l.U, error: l.U, isMutating: !1 });
						}, []);
					return (
						(0, l.u)(() => {
							(i.current = e), (d.current = t), (c.current = a);
						}),
						{
							trigger: g,
							reset: v,
							get data() {
								return (m.data = !0), x.data;
							},
							get error() {
								return (m.error = !0), x.error;
							},
							get isMutating() {
								return (m.isMutating = !0), x.isMutating;
							},
						}
					);
				});
		},
		79984: (e, t, a) => {
			a.d(t, { BT: () => i, Wu: () => d, ZB: () => o, Zp: () => n, aR: () => l });
			var s = a(95155);
			a(12115);
			var r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card",
					className: (0, r.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-header",
					className: (0, r.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-title",
					className: (0, r.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-content",
					className: (0, r.cn)("px-4", e),
					...t,
				});
			}
		},
		80723: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		85118: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("phone", [
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
	},
]);
